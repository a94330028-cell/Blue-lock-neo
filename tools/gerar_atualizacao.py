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
VERSION = (WEB / "VERSION").read_text(encoding="utf-8").strip()
if not re.fullmatch(r"\d{1,4}\.\d{1,4}\.\d{1,4}", VERSION):
    raise SystemExit("web/VERSION inválida. Ex.: 8.5.0")
DEST = WEB / "updates"
DEST.mkdir(exist_ok=True)
ARCHIVE = DEST / f"blue-lock-web-{VERSION}.zip"
with zipfile.ZipFile(ARCHIVE, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=7) as z:
    for file in sorted(WEB.rglob("*")):
        if not file.is_file() or DEST in file.parents or file.name in {".DS_Store"}:
            continue
        z.write(file, file.relative_to(WEB).as_posix())
sha = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
manifest = {
    "version": VERSION,
    "url": f"{HOST}/updates/{ARCHIVE.name}",
    "sha256": sha,
    "minAndroidVersion": 85,
    "changes": "EGO Broadcast v8.7, painel de partida ao vivo, melhorias mobile e retratos"
}
(DEST / "latest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Pacote: {ARCHIVE} ({ARCHIVE.stat().st_size} bytes)")
print(f"SHA256: {sha}")
print("Manifesto: ", DEST / "latest.json")
