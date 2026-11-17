#!/usr/bin/env python3
"""NEO 2.0 release-policy and content-size audit. Safe: never edits saves/files."""
from __future__ import annotations
from pathlib import Path
import argparse
import json
import re

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = ("novidades", "correcoes", "jogabilidade", "visual", "otimizacoes", "importantes")
MAX_PATCH_ITEMS = 8
MAX_PATCH_CHARS = 1400
MAX_ITEM_CHARS = 300
MAX_PACKAGE_BYTES = 32 * 1024 * 1024
MAX_UNPACKED_BYTES = 96 * 1024 * 1024
MAX_FILES = 6500


def parse_version(value):
    if not isinstance(value, str) or not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", value):
        raise ValueError("Versão pública inválida: " + str(value))
    return tuple(int(x) for x in value.split("."))


def audit_release(data, version):
    if data.get("project") != "Blue Lock NEO" or data.get("current_version") != version:
        raise ValueError("Changelog público fora de sincronização com web/VERSION")
    releases = data.get("releases", [])
    if not releases or releases[0].get("version") != version:
        raise ValueError("Patch atual precisa ser o primeiro, sem misturar versões antigas")
    seen = set()
    previous = None
    for release in releases:
        ver = release.get("version")
        key = parse_version(ver)
        if ver in seen or (previous is not None and key >= previous):
            raise ValueError("Histórico duplicado ou fora da ordem decrescente")
        seen.add(ver)
        previous = key
    if parse_version(version) >= (2, 0, 0) and "1.8.0" not in seen:
        raise ValueError("O histórico 1.x deve ser preservado")
    current = releases[0]
    items = [entry for category in CATEGORIES for entry in current.get(category, [])]
    if not items or any(not isinstance(x, str) or not x.strip() for x in items):
        raise ValueError("Notas vazias ou inválidas")
    if len(items) > MAX_PATCH_ITEMS:
        raise ValueError(f"Patch gigante: {len(items)} itens (limite {MAX_PATCH_ITEMS}). Comece uma versão nova.")
    total_chars = sum(len(x) for x in items)
    if total_chars > MAX_PATCH_CHARS:
        raise ValueError(f"Patch gigante: {total_chars} caracteres (limite {MAX_PATCH_CHARS})")
    for x in items:
        if len(x) > MAX_ITEM_CHARS:
            raise ValueError("Resumo muito extenso; detalhe no histórico técnico: " + x[:55])
    return {"version": version, "items": len(items), "characters": total_chars,
            "archived_releases": len(releases) - 1}


def audit_files(web):
    entries = [f for f in web.rglob("*") if f.is_file() and
               f.relative_to(web).parts[0] != "updates" and f.name != ".DS_Store"]
    total = sum(f.stat().st_size for f in entries)
    biggest = sorted(entries, key=lambda f: f.stat().st_size, reverse=True)[:12]
    report = {
        "total_web_files": len(entries), "uncompressed_bytes": total,
        "unpacked_limit_bytes": MAX_UNPACKED_BYTES,
        "android_package_limit_bytes": MAX_PACKAGE_BYTES,
        "files_limit": MAX_FILES,
        "biggest": [{"path": f.relative_to(web).as_posix(), "bytes": f.stat().st_size} for f in biggest],
        "full_packages_still_required": True,
        "note": "Leitores Android antigos exigem ZIP completo; patch diferencial requer atualização segura do instalador."
    }
    if len(entries) > MAX_FILES or total > MAX_UNPACKED_BYTES:
        raise ValueError("Pacote incompatível com os limites do Android atual")
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description="Verificar novo patch e tamanho da versão 2.0")
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--write-report", action="store_true")
    args = parser.parse_args(argv)
    root = args.root
    version = (root/"web/VERSION").read_text(encoding="utf-8").strip()
    data = json.loads((root/"CHANGELOG.json").read_text(encoding="utf-8"))
    release = audit_release(data, version)
    files = audit_files(root/"web")
    result = {"release": release, "files": files}
    if args.write_report:
        dest = root/"web/updates/size-report.json"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(result, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
