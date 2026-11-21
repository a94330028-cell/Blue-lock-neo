'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const workflow=fs.readFileSync('.github/workflows/gerar-apk.yml','utf8');
const siteWorkflow=fs.readFileSync('.github/workflows/publicar-site.yml','utf8');
const native=fs.readFileSync('app/src/main/java/com/neoegoist/simulator/MainActivity.java','utf8');
const build=fs.readFileSync('web/UPDATE_BUILD','utf8').trim();
const bundled=native.match(/BUNDLED_WEB_VERSION = "(\d+\.\d+\.\d+)"/)?.[1];
assert.ok(bundled,'Bundled build must be declared');
const parts=v=>v.split('.').map(Number);
const a=parts(build),b=parts(bundled);
assert.ok(a.some((n,i)=>n>b[i]&&a.slice(0,i).every((m,j)=>m===b[j]))||
 a.every((n,i)=>n===b[i]),'OTA update build must never be older than the installed APK bundle');
assert.match(workflow,/name: Preparar APK público apenas com assinatura estável\s+id: release_info\s+if: env\.BUILD_SIGNED == '1'/);
assert.match(workflow,/name: Publicar APK para todos no GitHub Releases\s+if: github\.ref == 'refs\/heads\/main' && env\.BUILD_SIGNED == '1' && steps\.unique_release\.outputs\.exists == '0'/);
assert.match(workflow,/git ls-remote --exit-code --tags origin/, 'existing tags must not be silently overwritten');
assert.doesNotMatch(workflow,/cp .*app-debug\.apk release\/Blue-Lock-NEO-Android\.apk/,
 'debug APK must never be published under the production download filename');
assert.match(workflow,/name: Relatar ausência de assinatura de produção/);
assert.match(siteWorkflow,/python tools\/gerar_atualizacao\.py/,
 'public website must build the integrity-checked OTA package');
console.log('PASS NEO FOUNDATION RELEASE: public builds require stable signing, new tags and monotonic OTA version');
