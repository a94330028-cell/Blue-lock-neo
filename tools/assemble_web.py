#!/usr/bin/env python3
"""Reconstrói o jogo base e acrescenta a edição mobile preservando os dados do jogo."""
from pathlib import Path
import base64, gzip, hashlib

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / 'web'
PARTS = sorted((ROOT / 'packed').glob('part-*.txt'))
if len(PARTS) != 8:
    raise SystemExit(f'Esperadas 8 partes do jogo, recebidas {len(PARTS)}')

encoded = ''.join(p.read_text(encoding='ascii').strip() for p in PARTS)
raw = gzip.decompress(base64.b64decode(encoded, validate=True))
actual = hashlib.sha256(raw).hexdigest()
expected = (ROOT / 'packed' / 'sha256.txt').read_text().strip()
if actual != expected:
    raise SystemExit('ERRO: integridade do jogo base não confere; compilação abortada')

html = raw.decode('utf-8')
if '</head>' not in html.lower() or '</body>' not in html.lower():
    raise SystemExit('HTML original sem estrutura esperada')

# Aplicar somente reparos localizados: nenhuma partida, estatística ou habilidade é apagada.
repairs = {
    "reader.onerror=()=>reject(Error('Não foi possível ler o arquivo. Confira a permissão de fotos do navegador.'));":
        "reader.onerror=()=>reject(Error('Falha de leitura ('+(reader.error?.name||'arquivo sem acesso')+'). No Android, escolha a imagem pelo seletor de Documentos/Arquivos e tente novamente.'));",
    "const result=new Image(),url=portraitUrl(name,color),fallback=ORIGINAL_ART[name]||portraitIdentity(name,color);":
        "const result=new Image(),url=portraitUrl(name,color),fallback=portraitIdentity(name,color);",
    "const fallback=ORIGINAL_ART[name]||portraitIdentity(name,t.color),url=portraitUrl(name,t.color),remote=url.startsWith('http')?url:'';":
        "const fallback=portraitIdentity(name,t.color),url=portraitUrl(name,t.color),remote=url.startsWith('http')?url:'';",
    "if(mode==='premium')return ORIGINAL_ART[name]||portraitIdentity(name,color);":
        "if(mode==='premium')return portraitIdentity(name,color);",
}
for before, after in repairs.items():
    if before in html:
        html = html.replace(before, after)
        print('Correção de leitura de imagem aplicada')
    else:
        print('Nota: versão do jogo usa implementação diferente do leitor de imagens')

# A edição mobile fica em arquivos próprios para facilitar atualizações e reversões.
extras = (
    ('mobile-upgrade.css', '<link rel="stylesheet" href="mobile-upgrade.css?v=8.7.0">', '</head>'),
    ('matchday-plus.css', '<link rel="stylesheet" href="matchday-plus.css?v=8.7.0">', '</head>'),
    ('mobile-upgrade.js', '<script defer src="mobile-upgrade.js?v=8.7.0"></script>', '</body>'),
    ('matchday-plus.js', '<script defer src="matchday-plus.js?v=8.7.0"></script>', '</body>'),
)
for filename, tag, marker in extras:
    if not (WEB / filename).is_file():
        raise SystemExit(f'Arquivo da interface ausente: {filename}')
    if filename not in html:
        html = html.replace(marker, tag + '\n' + marker, 1)
# Versão da interface, sem alterar IDs nem saves persistidos.
html = html.replace('NEO EGOIST SIMULATOR 8.4', 'NEO EGOIST SIMULATOR 8.7')
WEB.mkdir(parents=True, exist_ok=True)
(WEB / 'index.html').write_text(html, encoding='utf-8')
print(f'Jogo base íntegro: {len(raw):,} bytes; SHA-256 {actual}')
print('Interface mobile 8.7 e diagnósticos de fotos incluídos')
