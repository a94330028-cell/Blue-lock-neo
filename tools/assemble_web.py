#!/usr/bin/env python3
"""Reconstrói o jogo base e acrescenta a edição mobile preservando os dados do jogo."""
from pathlib import Path
import base64, gzip, hashlib, json, re, unicodedata

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
    ('mobile-upgrade.css', '<link rel="stylesheet" href="mobile-upgrade.css?v=8.9.0">', '</head>'),
    ('matchday-plus.css', '<link rel="stylesheet" href="matchday-plus.css?v=8.9.0">', '</head>'),
    ('mobile-upgrade.js', '<script defer src="mobile-upgrade.js?v=8.9.0"></script>', '</body>'),
    ('matchday-plus.js', '<script defer src="matchday-plus.js?v=8.9.0"></script>', '</body>'),
    ('portrait-export-fix.js', '<script defer src="portrait-export-fix.js?v=8.9.0"></script>', '</body>'),
    ('portrait-pack.js', '<script defer src="portrait-pack.js?v=8.9.0"></script>', '</body>'),
)
for filename, tag, marker in extras:
    if not (WEB / filename).is_file():
        raise SystemExit(f'Arquivo da interface ausente: {filename}')
    if filename not in html:
        html = html.replace(marker, tag + '\n' + marker, 1)
# Versão da interface, sem alterar IDs nem saves persistidos.
html = html.replace('NEO EGOIST SIMULATOR 8.4', 'NEO EGOIST SIMULATOR 8.9')
# Pacote offline: as fotos foram fornecidas em backup pelo usuário e são validadas
# antes de entrar no APK. Fotos salvas no aparelho continuam tendo prioridade.
pack_files = sorted((ROOT / 'portrait-pack').glob('part-*.txt'))
if len(pack_files) != 6:
    raise SystemExit(f'Esperadas 6 partes do pacote de retratos, recebidas {len(pack_files)}')
source = ''.join(p.read_text(encoding='utf-8') for p in pack_files)
expected_pack_sha = 'c2f719288e470f8b37e58b240d61ce9f0889b08ba26975b1876e261083d01588'
if hashlib.sha256(source.encode('utf-8')).hexdigest() != expected_pack_sha:
    raise SystemExit('ERRO: pacote de retratos não corresponde ao backup verificado')
pack = json.loads(source)
items = pack.get('images')
if pack.get('app') != 'blue-lock-neo-portraits' or not isinstance(items, list) or len(items) != 87:
    raise SystemExit('ERRO: são esperados exatamente 87 retratos válidos')
image_dir = WEB / 'assets' / 'imported-portraits'
image_dir.mkdir(parents=True, exist_ok=True)
seen_names, seen_paths, manifest = set(), set(), []
for item in items:
    name = item.get('name')
    data = item.get('data')
    if not isinstance(name, str) or len(name) > 90 or not isinstance(data, str):
        raise SystemExit('Registro de retrato malformado')
    if not data.startswith('data:image/jpeg;base64,'):
        raise SystemExit('Formato inesperado: ' + name)
    safe = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii').lower()
    slug = re.sub(r'[^a-z0-9]+', '-', safe).strip('-')
    filename = slug + '.jpg'
    if not slug or name in seen_names or filename in seen_paths:
        raise SystemExit('Retrato duplicado: ' + name)
    payload = base64.b64decode(data.split(',', 1)[1], validate=True)
    if not payload.startswith(bytes([0xff, 0xd8, 0xff])) or len(payload) > 1000000:
        raise SystemExit('JPEG inválido: ' + name)
    (image_dir / filename).write_bytes(payload)
    seen_names.add(name)
    seen_paths.add(filename)
    manifest.append({'name': name, 'file': filename})
(image_dir / 'index.json').write_text(
    json.dumps({'app':'blue-lock-neo-portraits-offline','version':1,'count':len(manifest),
                'images':manifest},ensure_ascii=False,separators=(',', ':')),
    encoding='utf-8'
)
print('Pacote offline: ', len(manifest), 'retratos com nomes validados')

WEB.mkdir(parents=True, exist_ok=True)
(WEB / 'index.html').write_text(html, encoding='utf-8')
print(f'Jogo base íntegro: {len(raw):,} bytes; SHA-256 {actual}')
print('Interface mobile 8.9, transmissão e 87 retratos integrados de fotos incluídos')
