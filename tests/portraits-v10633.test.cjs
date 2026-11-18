'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
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
assert.equal(manifest.images.length, 131, 'as 129 fotos anteriores e as duas novas precisam estar publicadas');
assert.equal(new Set(manifest.images.map(x => x.name)).size, 131, 'um retrato por jogador');
assert.equal(new Set(manifest.images.map(x => x.file)).size, 131, 'arquivos não podem se sobrescrever');

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
const portraitFor=name=>manifest.images.find(x=>x.name===name)?.file;
assert.equal(portraitFor('Rodinha'),'rodinha.jpg','a imagem de Nagi enviada pertence a Rodinha');
assert.equal(portraitFor('Kash'),'kash.jpg','a imagem de Akashi enviada pertence a Kash');
assert.equal(portraitFor('Seishiro Nagi'),'seishiro-nagi.jpg','Nagi original não mudou de nome ou arquivo');
const sha=filename=>crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
assert.equal(sha('web/assets/imported-portraits/seishiro-nagi.jpg'),
 '2cc15c2b5afbe69f5faef0be726d7220e093348630912dc1fc3a5db1e1132389',
 'foto de Seishiro Nagi original não pode ser substituída pela foto de Rodinha');
assert.equal(sha('web/assets/original-portraits/seishiro-nagi.webp'),
 '2c006bc6fa1d83ce17d28c239a15a56b1c3d7c305f27ce4a9117c92026dd9a65',
 'a arte oficial anterior do Nagi também é preservada');
assert.ok(![portraitFor('Kash'),portraitFor('Rodinha')].includes(portraitFor('Seishiro Nagi')));

assert.ok(installer.includes('matchesPreviousBundledPhoto(current, item.previousSha256)'), 'não sobrescrever as fotos pessoais');
assert.ok(installer.includes('actual === previousSha256'), 'só renovar fotos anteriores idênticas ao pacote');
assert.ok(installer.includes("if (!existingChoices.has(x.name))"), 'preservar escolhas pessoais');
assert.ok(app.includes('window.NeoPortraitManager'), 'editor da galeria continua funcional');
assert.ok(history.install, 'History Team continua carregável');
console.log('OK: 131 retratos válidos; Kash e Rodinha vinculados sem alterar o Nagi original.');
