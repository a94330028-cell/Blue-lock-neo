/**
 * Import an exported Blue Lock NEO portrait backup into the offline game.
 *
 * Run: node tools/import_portrait_backup.mjs /path/to/blue-lock-retratos-backup.json
 * The personal backup itself is never copied to the public repository.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const backupFile = process.argv[2];
if (!backupFile) throw Error('Informe o arquivo JSON exportado da galeria.');
const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
if (backup?.app !== 'blue-lock-neo-portraits' || !Array.isArray(backup.images)) {
  throw Error('Este não é um backup de retratos do Blue Lock NEO.');
}
const root = path.resolve(import.meta.dirname, '..');
const folder = path.join(root, 'web/assets/imported-portraits');
const webPath = 'assets/imported-portraits/';
const seen = new Set();
const files = new Set();
const images = [];
const payloads = [];
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const slug = name => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Validate ALL entries first so a malformed backup cannot partially overwrite photos.
for (const entry of backup.images) {
  if (!entry || entry.type !== 'custom' || typeof entry.name !== 'string'
      || !entry.name.trim() || entry.name.length > 120 || seen.has(entry.name)) {
    throw Error('Jogador duplicado ou registro inválido: ' + entry?.name);
  }
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(entry.data || '');
  if (!match) throw Error('A foto não é JPEG: ' + entry.name);
  const bytes = Buffer.from(match[1], 'base64');
  if (bytes.length < 100 || bytes.length > 2_000_000 || bytes[0] !== 0xff
      || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) {
    throw Error('JPEG incompleto ou grande demais: ' + entry.name);
  }
  const filename = slug(entry.name) + '.jpg';
  if (!filename || files.has(filename)) throw Error('Nomes em conflito: ' + entry.name);
  seen.add(entry.name);
  files.add(filename);
  const target = path.join(folder, filename);
  const previous = fs.existsSync(target) ? fs.readFileSync(target) : null;
  const record = {name: entry.name, file: filename};
  if (previous && !previous.equals(bytes)) record.previousSha256 = sha256(previous);
  images.push(record);
  payloads.push({target, bytes});
}

images.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
const mapping = Object.fromEntries(images.map(({name, file}) => [name, webPath + file]));
const appFile = path.join(root, 'web/app.js');
const app = fs.readFileSync(appFile, 'utf8');
const expression = /const BUNDLED_PORTRAITS=Object\.freeze\(\{[^;]+\}\);/;
if ((app.match(expression) || []).length !== 1) throw Error('Mapa de retratos não encontrado no aplicativo.');
const workerFile = path.join(root, 'web/service-worker.js');
const worker = fs.readFileSync(workerFile, 'utf8');
const workerAnchor = "PRECACHE.push('./neo-league-participants-v201.css');";
if (!worker.includes(workerAnchor)) throw Error('Âncora do cache offline não encontrada.');
const additional = images.map(x => './' + webPath + x.file)
  .filter(file => !worker.includes(JSON.stringify(file)));

fs.mkdirSync(folder, {recursive: true});
for (const {target, bytes} of payloads) fs.writeFileSync(target, bytes);
fs.writeFileSync(path.join(folder, 'index.json'), JSON.stringify({
  app: 'blue-lock-neo-portraits-offline', version: 2,
  source: 'backup-de-retratos-2026-11-18', images
}, null, 2) + '\n');
fs.writeFileSync(appFile, app.replace(expression,
  'const BUNDLED_PORTRAITS=Object.freeze(' + JSON.stringify(mapping) + ');'));
if (additional.length) {
  const block = '\n// Novos retratos adicionados ao pacote offline a partir do backup da galeria.\n'
    + 'PRECACHE.push(...' + JSON.stringify(additional) + ');';
  fs.writeFileSync(workerFile, worker.replace(workerAnchor, workerAnchor + block));
}
console.log(`Importados ${images.length} retratos JPEG; backup original não publicado.`);
