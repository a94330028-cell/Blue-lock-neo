/* v9.1.2: prevent regressions in the actual Android bottom navigation. */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const js=fs.readFileSync('web/mobile-upgrade.js','utf8');
const html=fs.readFileSync('web/index.html','utf8');
const expected=['match','league','records','ranking','squads','more'];
const menu=js.match(/const ids=\[([^\]]+)\];/);
assert.ok(menu,'Navigation source must define its mobile tabs');
const items=[...menu[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
assert.deepEqual(items,expected,'Android bottom bar must display exactly the six requested tabs');
const labels=['Jogar','Liga','Recordes','Ranking','Jogadores','Mais'];
for(const label of labels)assert.ok(js.includes("'"+label+"'"),'Missing mobile label: '+label);
for(const id of [...expected,'stats','arsenal','gallery'])assert.ok(html.includes('id="'+id+'"'),'Missing actual destination: '+id);
for(const id of ['stats','arsenal','gallery'])assert.ok(html.includes('data-neo-open="'+id+'"'),'Legacy screen must remain accessible in More: '+id);
assert.ok(js.includes("['stats','arsenal','gallery'].includes(active)?'more':active"),'Legacy panels should keep More selected');
assert.equal(fs.readFileSync('web/VERSION','utf8').trim(),'9.1.2');
console.log('OK: bottom navigation, screen switching targets, legacy access and version 9.1.2');
