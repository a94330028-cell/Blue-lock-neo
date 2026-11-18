'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../web/engine.js');
const historic = require('../web/neo-historic-teams-v970.js');
const manifest = require('../web/assets/imported-portraits/index.json');
const app = fs.readFileSync('web/app.js', 'utf8');
const worker = fs.readFileSync('web/service-worker.js', 'utf8');
const installer = fs.readFileSync('web/portrait-pack.js', 'utf8');

assert.equal(manifest.app, 'blue-lock-neo-portraits-offline');
assert.equal(manifest.version, 2);
assert.equal(manifest.images.length, 129, 'as 129 fotos exportadas precisam estar publicadas');
assert.equal(new Set(manifest.images.map(x => x.name)).size, 129, 'um retrato por jogador');
assert.equal(new Set(manifest.images.map(x => x.file)).size, 129, 'arquivos não podem se sobrescrever');

const history = require('../web/neo2-history-team-v201.js');
history.install(engine);
const namesInTeams = new Set(engine.allTeams().flatMap(t => [...t.players, ...t.reserves, t.master]));
for (const player of historic.all) namesInTeams.add(player.name);
for (const name of ['Diego Alves','Willian Arão','João Victor']) {
  assert.ok(!manifest.images.some(x => x.name === name), 'não inventar retratos ausentes: ' + name);
}

for (const image of manifest.images) {
  assert.ok(namesInTeams.has(image.name), 'retrato sem jogador identificado: ' + image.name);
  assert.match(image.file, /^[a-z0-9-]+\.jpg$/);
  const filepath = path.join('web/assets/imported-portraits', image.file);
  const bytes = fs.readFileSync(filepath);
  assert.ok(bytes.length > 100 && bytes.length < 2_000_000, 'tamanho válido: ' + image.name);
  assert.equal(bytes.subarray(0,2).toString('hex'), 'ffd8', 'JPEG válido: ' + image.name);
  assert.equal(bytes.subarray(-2).toString('hex'), 'ffd9', 'JPEG completo: ' + image.name);
  assert.ok(app.includes(JSON.stringify(image.name) + ':' + JSON.stringify('assets/imported-portraits/' + image.file)),
    'retrato disponível diretamente por nome: ' + image.name);
  assert.ok(worker.includes(JSON.stringify('./assets/imported-portraits/' + image.file)),
    'retrato disponível offline: ' + image.name);
}

assert.ok(installer.includes('matchesPreviousBundledPhoto(current, item.previousSha256)'), 'não sobrescrever as fotos pessoais');
assert.ok(installer.includes('actual === previousSha256'), 'só renovar fotos anteriores idênticas ao pacote');
assert.ok(installer.includes("if (!existingChoices.has(x.name))"), 'preservar escolhas pessoais');
assert.ok(app.includes('window.NeoPortraitManager'), 'editor da galeria continua funcional');
assert.ok(history.install, 'History Team continua carregável');
console.log('OK: 129 retratos válidos, atribuídos corretamente e disponíveis offline.');
