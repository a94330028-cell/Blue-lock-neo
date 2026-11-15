#!/usr/bin/env python3
"""Reconstrói o jogo completo a partir de partes compactadas versionadas no Git."""
from pathlib import Path
import base64, gzip, hashlib
ROOT=Path(__file__).resolve().parent.parent
PARTS=sorted((ROOT/'packed').glob('part-*.txt'))
if len(PARTS)!=8: raise SystemExit(f'Esperadas 8 partes, recebidas {len(PARTS)}')
encoded=''.join(p.read_text(encoding='ascii').strip() for p in PARTS)
raw=gzip.decompress(base64.b64decode(encoded,validate=True))
actual=hashlib.sha256(raw).hexdigest()
expected=(ROOT/'packed'/'sha256.txt').read_text().strip()
if actual!=expected: raise SystemExit('ERRO: integridade do jogo não confere; compilação abortada')
(ROOT/'web').mkdir(parents=True,exist_ok=True)
(ROOT/'web'/'index.html').write_bytes(raw)
print(f'Jogo reconstruído: {len(raw):,} bytes; SHA-256 {actual}')
