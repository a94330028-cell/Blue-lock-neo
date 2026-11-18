#!/usr/bin/env python3
"""Cria um ZIP de atualização completo e um manifesto SHA256 para o APK.

Execute na raiz do projeto após alterar `web/VERSION`:
  python3 tools/gerar_atualizacao.py

O fluxo GitHub Actions já executa isto automaticamente ao publicar.
O ZIP contém SOMENTE arquivos da pasta `web`, sem fotos do usuário/saves.
"""
from pathlib import Path
import hashlib
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
HOST = "https://a94330028-cell.github.io/Blue-lock-neo"
PUBLIC_VERSION = (WEB / "VERSION").read_text(encoding="utf-8").strip()
# Build number stays monotonic so old 10.x beta Android clients can receive
# the first stable release displayed to players as 1.0.0.
UPDATE_BUILD = (WEB / "UPDATE_BUILD").read_text(encoding="utf-8").strip()
for label, version in (("public", PUBLIC_VERSION), ("Android update", UPDATE_BUILD)):
    if not re.fullmatch(r"\d{1,4}\.\d{1,4}\.\d{1,4}", version):
        raise SystemExit(f"Invalid {label} version: {version}")
DEST = WEB / "updates"
DEST.mkdir(exist_ok=True)
ARCHIVE = DEST / f"blue-lock-web-{UPDATE_BUILD}.zip"
with zipfile.ZipFile(ARCHIVE, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=7) as z:
    for file in sorted(WEB.rglob("*")):
        if not file.is_file() or DEST in file.parents or file.name in {".DS_Store"}:
            continue
        z.write(file, file.relative_to(WEB).as_posix())
sha = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
manifest = {
    "version": UPDATE_BUILD,
    "displayVersion": PUBLIC_VERSION,
    "url": f"{HOST}/updates/{ARCHIVE.name}",
    "sha256": sha,
    "minAndroidVersion": 85,
    "changes": f"Blue Lock NEO {PUBLIC_VERSION} · conteúdo {UPDATE_BUILD}: 129 retratos de jogadores integrados à galeria, inclusive History Team, mantendo escolhas pessoais e partidas salvas."
}
(DEST / "latest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Pacote: {ARCHIVE} ({ARCHIVE.stat().st_size} bytes)")
print(f"SHA256: {sha}")
# The Discord bot checks this exact marker on the deployed site before posting.
# It is built from changelog entries, not from an arbitrary CI run number.
from neo_update_announcement import announcement_identity, load_changelog
announcement = announcement_identity(load_changelog(), PUBLIC_VERSION)
(DEST / "announcement.json").write_text(
    json.dumps(announcement, ensure_ascii=False, sort_keys=True, indent=2) + "\n", encoding="utf-8"
)
print("Manifesto: ", DEST / "latest.json")
print("Identidade do anuncio: ", announcement["id"])
