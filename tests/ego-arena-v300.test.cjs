'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const read=name=>fs.readFileSync('web/'+name,'utf8');
const js=read('neo-pc-compact.js'),css=read('neo-ego-arena-v300.css'),html=read('index.html');

cp.execFileSync(process.execPath,['--check','web/neo-pc-compact.js']);
assert.match(js,/min-width: 1024px/,'EGO ARENA activates on PC only');
assert.match(js,/match\.dataset\.arenaMode='broadcast'/);
for(const mode of ['broadcast','coach','analysis'])assert.ok(js.includes("data-arena-view=\\\""+mode+'\\\"')||js.includes('data-arena-view="'+mode+'"'),mode);
for(const id of ['#stadium','#matchPreview','#play','#reset','#replay','#shotMap','#matchStats']){
 assert.ok(html.includes('id="'+id.slice(1)+'"'),'original engine target preserved: '+id);
}
assert.match(js,/document\.createComment/,'moving real nodes records their exact position');
assert.match(js,/marker\.replaceWith\(node\)/,'mobile restoration returns original nodes');
assert.match(js,/mq\.addEventListener\('change',refresh\)/);
assert.match(js,/window\.NeoArena300=/);
assert.match(js,/\.under-pitch/);
assert.match(js,/\.coach-card/);
assert.match(js,/\.shot-map-card/);
assert.match(js,/#play,#reset,#replay,\.speed-group,#focusMode/,'primary match controls remain accessible');
assert.match(js,/card\.insertBefore\(controls,stadium\)/,'start and speed controls are available before the pitch');
assert.match(js,/neo-arena-league-bar/,'desktop league gets a dedicated match-day hub');
assert.match(js,/neo-arena-league-xi/,'Best XI is accessible without crowding the league top');
assert.match(js,/move\(league\.querySelector\('#simulateRound'\),actions\)/,'real league simulation button is moved, not cloned');
assert.match(js,/leagueObserver\.observe\(league,\{childList:true\}\)/,'asynchronously loaded championship panels remain organized');
assert.match(js,/event\.code==='Space'/,'keyboard playback shortcut');
assert.match(js,/event\.code==='KeyS'/,'keyboard speed shortcut');
assert.match(js,/document\.removeEventListener\('keydown',onKey\)/,'keyboard shortcut listener removed when returning to mobile');

assert.ok(css.startsWith('/* EGO ARENA 3.0'));
assert.match(css,/@media \(min-width:1024px\)/);
assert.match(css,/body\.neo-arena-active/,'all new styles are desktop-gated');
assert.match(css,/\[data-arena-mode="analysis"\]/);
assert.match(css,/\[data-arena-mode="coach"\]/);
assert.match(css,/#playerModal/,'existing player details become a compact side card');
assert.match(css,/prefers-reduced-motion/);
assert.match(css,/#neoRefMatchTabs\{display:none!important\}/,'duplicate bare tabs are removed on PC');
assert.match(css,/#ranking #neo940-ranking/,'ranking cards are larger and multi-column on PC');
assert.match(css,/#league \.neo-arena-league-fold/,'league advanced panels are collapsible');
assert.equal((html.match(/src="neo-pc-compact\.js\?v=10\.6\.45"/g)||[]).length,1);
assert.equal((html.match(/href="neo-ego-arena-v300\.css\?v=10\.6\.45"/g)||[]).length,1);
assert.ok(read('service-worker.js').includes('neo-ego-arena-v300.css?v=10.6.45'));
assert.equal(read('UPDATE_BUILD').trim(),'10.6.45');
console.log('PASS EGO ARENA 3.1: desktop actions, league shortcuts, scouting cards and mobile restoration');
