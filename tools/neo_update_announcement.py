#!/usr/bin/env python3
"""Blue Lock NEO: validated, post-Pages Discord webhook announcements.

Uses only Python standard library. No client-visible token or webhook URL.
A Git tag is the durable announcement ledger; a reservation tag prevents concurrent
posting. A failed/ambiguous send is left pending for an explicit, reviewed retry.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlsplit
from urllib.request import Request, urlopen

BASE = Path(__file__).resolve().parents[1]
CHANGELOG = BASE / "CHANGELOG.json"
VERSION_FILE = BASE / "web" / "VERSION"
NAME = "『⚡』𝐍𝐄𝐎 𝐔𝐏𝐃𝐀𝐓𝐄𝐒・𝐁𝐎𝐓"
SITE_URL = "https://a94330028-cell.github.io/Blue-lock-neo/"
REPOSITORY = "a94330028-cell/Blue-lock-neo"
CATEGORIES = (
    ("novidades", "✨ NOVIDADES"),
    ("correcoes", "🛠️ BUGS CORRIGIDOS"),
    ("jogabilidade", "⚽ MELHORIAS NA JOGABILIDADE"),
    ("visual", "🎨 MELHORIAS VISUAIS"),
    ("otimizacoes", "⚡ OTIMIZAÇÕES"),
    ("importantes", "📌 ALTERAÇÕES IMPORTANTES"),
)
MEDIA = ("banner", "avatar")
VERSION_PATTERN = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
BAD_MENTIONS = re.compile(r"@(?=(?:everyone|here)\b)", re.IGNORECASE)


class AnnouncementError(Exception):
    pass


def log(message):
    print("[NEO UPDATES] " + str(message), flush=True)


def clean(text):
    if not isinstance(text, str):
        raise AnnouncementError("Texto de changelog não é string.")
    return BAD_MENTIONS.sub("@\u200b", "".join(ch for ch in text.strip() if ch >= " " or ch == "\n"))


def load_changelog(path=CHANGELOG):
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise AnnouncementError("CHANGELOG.json ausente ou inválido.") from exc
    if data.get("schema") != 1 or data.get("project") != "Blue Lock NEO":
        raise AnnouncementError("Schema/projeto incorreto no CHANGELOG.json.")
    releases = data.get("releases")
    if not isinstance(releases, list) or not releases:
        raise AnnouncementError("CHANGELOG.json precisa de releases não vazios.")
    seen = set()
    for release in releases:
        if not isinstance(release, dict) or not VERSION_PATTERN.fullmatch(str(release.get("version", ""))):
            raise AnnouncementError("Versão de changelog inválida.")
        version = release["version"]
        if version in seen:
            raise AnnouncementError("Versão repetida no histórico: " + version)
        seen.add(version)
        try:
            dt.date.fromisoformat(release["date"])
        except (ValueError, TypeError, KeyError) as exc:
            raise AnnouncementError("Data inválida na versão " + version) from exc
        for category, _ in CATEGORIES:
            items = release.get(category, [])
            if not isinstance(items, list) or any(not isinstance(s, str) or not s.strip() for s in items):
                raise AnnouncementError("Categoria inválida " + category + ": " + version)
        if not any(release.get(key) for key, _ in CATEGORIES):
            raise AnnouncementError("Versão sem alterações verificáveis: " + version)
    current = Path(VERSION_FILE).read_text(encoding="utf-8").strip()
    if not VERSION_PATTERN.fullmatch(current):
        raise AnnouncementError("web/VERSION inválida.")
    if data.get("current_version") != current:
        raise AnnouncementError("A versão atual do changelog não corresponde à versão web.")
    if releases[0]["version"] != current:
        raise AnnouncementError("A primeira versão no changelog deve ser a versão atual.")
    if data.get("site_url") != SITE_URL:
        raise AnnouncementError("URL oficial do jogo diferente do endereço do GitHub Pages.")
    if not isinstance(data.get("media"), dict):
        raise AnnouncementError("Manifesto de imagens oficiais ausente.")
    for part in MEDIA:
        item = data["media"].get(part)
        if not isinstance(item, dict) or not isinstance(item.get("path"), str):
            raise AnnouncementError("Manifesto de imagem ausente: " + part)
        if not re.fullmatch(r"assets/updates/neo-update-(?:banner|avatar)\.jpg", item["path"]):
            raise AnnouncementError("Caminho de imagem inesperado: " + part)
        if not re.fullmatch(r"[a-f0-9]{64}", str(item.get("sha256", ""))):
            raise AnnouncementError("SHA256 de mídia inválido: " + part)
        if part not in item["path"]:
            raise AnnouncementError("Banner/avatar invertidos no manifesto.")
    return data


def find_release(data, version):
    return next((r for r in data["releases"] if r["version"] == version), None)


def verify_media(data, site_dir=None):
    site_dir = Path(site_dir) if site_dir else BASE / "web"
    for part in MEDIA:
        entry = data["media"][part]
        file = site_dir / entry["path"]
        if not file.is_file():
            raise AnnouncementError("Arquivo oficial " + part + " ainda não existe em " + entry["path"])
        raw = file.read_bytes()
        if len(raw) < 2048 or not raw.startswith(b"\xff\xd8\xff"):
            raise AnnouncementError("Imagem " + part + " não é um JPEG válido.")
        if hashlib.sha256(raw).hexdigest() != entry["sha256"]:
            raise AnnouncementError("A imagem " + part + " não corresponde ao original fornecido.")
    return True


def split_lines(lines, limit=1024):
    result, current = [], ""
    for raw in lines:
        txt = "\n".join(clean(raw).splitlines())
        line = "• " + txt.replace("\n", "\n  ")
        if len(line) > limit:
            # Preserve complete meaning without truncating. Very long items are split
            # into sequential chunks instead of silently dropping changes.
            words = line.split(" ")
            for word in words:
                if len(word) > limit - 4:
                    raise AnnouncementError("Uma palavra de changelog excedeu o limite do Discord.")
            block = ""
            for word in words:
                next_block = (block + " " + word).strip()
                if len(next_block) > limit:
                    if current:
                        result.append(current)
                        current = ""
                    result.append(block)
                    block = word
                else:
                    block = next_block
            line = block
        if current and len(current) + len(line) + 1 > limit:
            result.append(current)
            current = ""
        current = (current + "\n" + line).strip()
    if current:
        result.append(current)
    return result


def embed_length(embed):
    return (len(embed.get("title", "")) + len(embed.get("description", "")) +
            len(embed.get("footer", {}).get("text", "")) +
            sum(len(f["name"]) + len(f["value"]) for f in embed.get("fields", [])))


def build_payloads(data, version):
    release = find_release(data, version)
    if not release:
        raise AnnouncementError("Versão inexistente no changelog: " + version)
    if data.get("current_version") != version:
        raise AnnouncementError("A versão solicitada não é a versão publicada.")
    fields = []
    for key, label in CATEGORIES:
        items = release.get(key) or []
        if items:
            for i, part in enumerate(split_lines(items)):
                fields.append({"name": label if i == 0 else label + " (continuação)", "value": part, "inline": False})
    footer = "BLUE LOCK NEO • OFFICIAL UPDATE SYSTEM"
    description = ("**⚡ UMA NOVA ATUALIZAÇÃO CHEGOU!**\n"
                   "O Blue Lock NEO recebeu novidades documentadas. Veja os detalhes abaixo.")
    image = SITE_URL + data["media"]["banner"]["path"]
    avatar = SITE_URL + data["media"]["avatar"]["path"]
    embeds, current = [], None
    for field in fields:
        if current is None:
            current = {
                "title": "🚀 BLUE LOCK NEO — ATUALIZAÇÃO v" + version,
                "description": description,
                "url": SITE_URL,
                "color": 0x00CFFF,
                "fields": [],
                "footer": {"text": footer},
                "timestamp": release["date"] + "T12:00:00Z",
                "image": {"url": image},
            }
        if (len(current["fields"]) >= 25 or embed_length(current) +
                len(field["name"]) + len(field["value"]) > 5100):
            embeds.append(current)
            current = {
                "title": "⚡ NEO v" + version + " — continuação",
                "color": 0x00CFFF,
                "fields": [],
                "footer": {"text": footer},
                "timestamp": release["date"] + "T12:00:00Z",
            }
        current["fields"].append(field)
    if current:
        current["fields"].append({
            "name": "🌐 ACESSE O JOGO",
            "value": "[Abrir Blue Lock NEO](" + SITE_URL + ")\n"
                     "✅ **STATUS: ATUALIZAÇÃO PUBLICADA COM SUCESSO**\n"
                     "📅 " + release["date"] + " · 🏆 v" + version,
            "inline": False,
        })
        embeds.append(current)
    if not embeds:
        raise AnnouncementError("Anúncio não possui categorias válidas.")
    packets = []
    pending = []
    for embed in embeds:
        if pending and (len(pending) >= 10 or sum(embed_length(e) for e in pending) + embed_length(embed) > 6000):
            packets.append(pending)
            pending = []
        pending.append(embed)
    if pending:
        packets.append(pending)
    for batch in packets:
        if len(batch) > 10 or sum(embed_length(e) for e in batch) > 6000:
            raise AnnouncementError("Embed excede os limites da API do Discord.")
        for e in batch:
            if len(e.get("title", "")) > 256 or len(e.get("description", "")) > 4096:
                raise AnnouncementError("Título ou descrição grande demais.")
            if any(len(f["name"]) > 256 or len(f["value"]) > 1024 for f in e["fields"]):
                raise AnnouncementError("Campo de embed grande demais.")
    return [
        {"username": NAME, "avatar_url": avatar, "embeds": batch, "allowed_mentions": {"parse": []}}
        for batch in packets
    ]


def github_ref(repo, token, marker):
    url = "https://api.github.com/repos/" + repo + "/git/ref/tags/" + quote(marker, safe="/")
    request = Request(url, headers={
        "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "neo-updates",
    })
    try:
        with urlopen(request, timeout=20) as reply:
            return json.load(reply)
    except HTTPError as exc:
        if exc.code == 404:
            return None
        raise AnnouncementError("GitHub não permitiu consultar o registro (" + str(exc.code) + ").") from exc


def create_tag(repo, token, marker, sha):
    url = "https://api.github.com/repos/" + repo + "/git/refs"
    req = Request(url, data=json.dumps({"ref": "refs/tags/" + marker, "sha": sha}).encode(),
                  headers={"Authorization": "Bearer " + token,
                           "Accept": "application/vnd.github+json",
                           "X-GitHub-Api-Version": "2022-11-28",
                           "Content-Type": "application/json",
                           "User-Agent": "neo-updates"}, method="POST")
    try:
        with urlopen(req, timeout=25):
            return True
    except HTTPError as exc:
        if exc.code == 422:
            return False
        raise AnnouncementError("GitHub não conseguiu registrar anúncio (" + str(exc.code) + ").") from exc


def verify_live_version(version, site_url=SITE_URL, attempts=8):
    # Must verify the public site; deploy-pages success alone is not enough.
    for attempt in range(attempts):
        target = site_url.rstrip("/") + "/VERSION?" + urlencode({"neo_check": str(attempt)})
        try:
            with urlopen(Request(target, headers={"Cache-Control": "no-cache", "User-Agent": "neo-updates"}), timeout=15) as resp:
                published = resp.read(80).decode("utf-8").strip()
            if published == version:
                return True
        except (HTTPError, URLError, TimeoutError, UnicodeDecodeError):
            pass
        if attempt + 1 < attempts:
            time.sleep(5)
    raise AnnouncementError("GitHub Pages não confirmou /VERSION=" + version + "; anúncio bloqueado.")


def webhook_request(webhook, packet):
    target = webhook + ("&" if "?" in webhook else "?") + "wait=true"
    body = json.dumps(packet, ensure_ascii=False).encode("utf-8")
    req = Request(target, data=body, method="POST",
                  headers={"Content-Type": "application/json", "User-Agent": "BlueLockNEO-UpdateBot/1.0"})
    for attempt in range(5):
        try:
            with urlopen(req, timeout=25) as resp:
                if resp.status != 200:
                    raise AnnouncementError("Discord não confirmou a mensagem.")
                obj = json.load(resp)
            if not str(obj.get("id", "")).isdigit():
                raise AnnouncementError("Discord respondeu sem ID de mensagem confirmada.")
            return obj["id"]
        except HTTPError as exc:
            # No secrets, full response bodies or webhook URLs in Actions logs.
            log("Discord retornou HTTP " + str(exc.code) + " (tentativa " + str(attempt + 1) + ").")
            if exc.code not in (429, 500, 502, 503, 504):
                raise AnnouncementError("Discord rejeitou o anúncio (HTTP " + str(exc.code) + ").") from exc
            delay = 2 ** attempt
            if exc.code == 429:
                try:
                    delay = max(1, min(30, float(json.loads(exc.read(2048)).get("retry_after", delay))))
                except (ValueError, TypeError):
                    pass
            if attempt < 4:
                time.sleep(delay)
        except (URLError, TimeoutError) as exc:
            log("Sem confirmação de entrega do Discord; tentativa " + str(attempt + 1) + ".")
            if attempt < 4:
                time.sleep(2 ** attempt)
    raise AnnouncementError("Entrega ao Discord não confirmada. Registro pendente para revisão.")


def publish(data, version, packets, *, retry_pending=False):
    secret = os.getenv("DISCORD_WEBHOOK_URL", "")
    token = os.getenv("GH_TOKEN", "") or os.getenv("GITHUB_TOKEN", "")
    if not secret:
        log("DISCORD_WEBHOOK_URL não configurado. Nenhuma mensagem enviada.")
        return "not-configured"
    if not token:
        raise AnnouncementError("GITHUB_TOKEN ausente; controle de duplicações indisponível.")
    parsed = urlsplit(secret)
    if (parsed.scheme != "https" or parsed.hostname not in ("discord.com", "discordapp.com") or
            not re.fullmatch(r"/api/webhooks/[0-9]+/[^/]+", parsed.path) or parsed.fragment):
        raise AnnouncementError("DISCORD_WEBHOOK_URL inválido; apenas webhooks oficiais HTTPS são aceitos.")
    if os.getenv("GITHUB_REPOSITORY") != REPOSITORY:
        raise AnnouncementError("Repositório GitHub inesperado. Disparo bloqueado.")
    sha = os.environ.get("GITHUB_SHA", "")
    if not re.fullmatch(r"[a-f0-9]{40}", sha):
        raise AnnouncementError("GITHUB_SHA inválido.")
    verify_media(data)
    verify_live_version(version)
    key = "neo-updates/" + version
    if github_ref(REPOSITORY, token, key + "/sent"):
        log("Versão v" + version + " já anunciada. Nenhuma duplicação.")
        return "duplicate"
    pending = github_ref(REPOSITORY, token, key + "/pending")
    if pending and not retry_pending:
        log("Anúncio pendente de confirmação; nova postagem automática bloqueada. Use retry_pending após revisar.")
        return "pending"
    if not pending and not create_tag(REPOSITORY, token, key + "/pending", sha):
        log("Outro workflow já reservou esta versão.")
        return "pending"
    for number, packet in enumerate(packets, start=1):
        marker = key + "/message-" + str(number)
        if github_ref(REPOSITORY, token, marker):
            log("Parte " + str(number) + " já confirmada, ignorando.")
            continue
        message_id = webhook_request(secret, packet)
        if not create_tag(REPOSITORY, token, marker, sha):
            raise AnnouncementError("Discord confirmou a mensagem, mas o registro de parte já existe.")
        log("Parte " + str(number) + " confirmada pelo Discord (ID " + str(message_id) + ").")
    if not create_tag(REPOSITORY, token, key + "/sent", sha):
        raise AnnouncementError("Não foi possível registrar a confirmação final no GitHub.")
    log("Anúncio v" + version + " enviado e registrado com sucesso.")
    return "sent"


def run_cli(argv=None):
    parser = argparse.ArgumentParser(description="NEO UPDATE BOT: validate, preview, publish")
    parser.add_argument("command", choices=("validate", "preview", "publish"))
    parser.add_argument("--version", default=None)
    parser.add_argument("--output", default=None)
    parser.add_argument("--require-media", action="store_true")
    parser.add_argument("--retry-pending", action="store_true")
    args = parser.parse_args(argv)
    data = load_changelog()
    version = args.version or data["current_version"]
    packets = build_payloads(data, version)
    if args.require_media or args.command == "publish":
        verify_media(data)
    if args.command == "validate":
        log("Changelog v" + version + " válido; " + str(len(packets)) + " pacote(s).")
        if not args.require_media:
            log("Mídias serão verificadas antes de qualquer envio real.")
        return 0
    if args.command == "preview":
        target = Path(args.output or BASE / "neo-preview-payload.json")
        target.write_text(json.dumps(packets, ensure_ascii=False, indent=2), encoding="utf-8")
        log("Prévia local criada: " + target.name + " (nenhum webhook chamado).")
        return 0
    result = publish(data, version, packets, retry_pending=args.retry_pending)
    log("Resultado: " + result)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(run_cli())
    except AnnouncementError as exc:
        log("BLOQUEADO: " + str(exc))
        sys.exit(1)
