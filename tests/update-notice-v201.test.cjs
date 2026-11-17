'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');
const publicVersion = read('web/VERSION').trim();
const updateBuild = read('web/UPDATE_BUILD').trim();
const native = read('app/src/main/java/com/neoegoist/simulator/MainActivity.java');
const updateUI = read('web/neo-broadcast-v920.js');
const publisher = read('tools/gerar_atualizacao.py');
const workflow = read('.github/workflows/publicar-site.yml');

const versionParts = text => String(text).split('.').map(Number);
function newer(a, b) {
  const left = versionParts(a), right = versionParts(b);
  return left.some((part, i) => part > right[i] && left.slice(0, i).every((n, j) => n === right[j]));
}

assert.equal(publicVersion, '2.0.0', 'a atualização deve manter a versão pública NEO 2.0');
assert.ok(newer(updateBuild, '10.6.25'), 'precisa haver build novo para o APK existente mostrar o aviso');
assert.ok(native.includes(`BUNDLED_WEB_VERSION = "${updateBuild}"`), 'o APK novo deve incluir a mesma versão publicada');
assert.ok(native.includes('postDelayed(() -> checkForUpdates(false), 3500)'), 'a busca automática ao abrir o APK deve continuar ativa');
assert.ok(native.includes('setPositiveButton("Atualizar", (dialog, which) -> installUpdate(info))'), 'o aviso de atualização precisa oferecer instalação');
assert.ok(native.includes('@JavascriptInterface public void checkForUpdates()'), 'o botão de verificação manual deve continuar disponível');
assert.ok(updateUI.includes(`const VERSION='${publicVersion}'`), 'o painel não deve mostrar a versão antiga 1.8.0');
assert.ok(updateUI.includes('window.BlueLockAndroid.checkForUpdates()'), 'o botão deve consultar o mecanismo Android');
assert.ok(publisher.includes('"version": UPDATE_BUILD'), 'o manifesto hospedado deve seguir o build novo');
assert.ok(workflow.includes('python tools/gerar_atualizacao.py'), 'o deploy deve gerar o ZIP e o manifesto novamente');
console.log(`OK: aviso Android v${updateBuild} e painel NEO ${publicVersion}`);
