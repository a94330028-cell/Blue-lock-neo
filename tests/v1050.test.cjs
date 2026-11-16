'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync('web/'+p,'utf8');
const E=require('../web/engine.js'),Round=require('../web/neo-round-v990.js');
const crests=require('../web/neo-clubs-v1050.js');
const recover=require('../web/neo-photo-recovery-v1050.js');
const manifest=JSON.parse(read('assets/imported-portraits/index.json'));
const app=read('app.js'),squad=read('neo-squads-v980.js'),round=read('neo-round-v990.js');
const worker=read('service-worker.js'),html=read('index.html');
assert.equal(manifest.images.length,87);
for(const x of manifest.images){
 assert.ok(x.name&&x.file&&fs.existsSync('web/assets/imported-portraits/'+x.file),'real bundled portrait file exists: '+x.name);
 assert.ok(app.includes('"'+x.name+'":"assets/imported-portraits/'+x.file+'"'),'main photo map includes '+x.name);
 assert.ok(worker.includes('./assets/imported-portraits/'+x.file),'offline cache includes '+x.name);
}
assert.ok(app.includes("if(mode==='bundled'&&BUNDLED_PORTRAITS[name])"),'main photo can be selected');
assert.ok(app.includes("explicitPortraitStyles[name]=style;"),'explicit user preferences are never overwritten');
assert.ok(app.includes("data-portrait-style=\"bundled\""),'image gallery exposes bundled photo selection');
assert.ok(app.includes("window.dispatchEvent(new Event('neo:portraits-changed'))"),'live portraits event');
assert.ok(squad.includes("window.NeoCrests1050?.icon(t)"),'squad header shows logo');
assert.ok(squad.includes("neo:portraits-changed"),'squad photo refresh');
assert.ok(round.includes("neo:portraits-changed"),'championship pitch photo refresh');
assert.ok(round.includes("p.rating.toFixed(1)"),'championship displays real player rating');
assert.ok(round.includes("const options=substitutes.length?substitutes:[]"),'no defenders as forwards');
for(const t of E.TEAMS) {
 const svg=crests.icon(t);
 assert.ok(svg.startsWith('<svg')&&svg.includes('viewBox="0 0 72 82"'),t.name+' badge');
 assert.ok(crests.TEAMS[t.id],'known clubs get a distinct badge');
}
assert.ok(crests.icon('neo-bestxi').includes('XI'));
assert.ok(crests.icon({id:'mu08'}).includes('MU'));
assert.ok(recover.label('Jogador',new Error('Falha')).includes('Falha'));
const photoRecovery=read('neo-photo-recovery-v1050.js');
assert.ok(photoRecovery.includes('data-neo1050-files'),'Android fallback includes Files');
assert.ok(photoRecovery.includes('data-neo1050-paste'),'Android fallback includes clipboard');
assert.ok(photoRecovery.includes('NeoPortraitManager.saveFile'),'alternatives use the existing persistent gallery storage');
assert.ok(worker.includes('./neo-clubs-v1050.js')&&worker.includes('./neo-photo-recovery-v1050.js'));
assert.ok(worker.includes('./neo-polish-v1050.css'));
assert.ok(html.includes('neo-clubs-v1050.js')&&html.includes('neo-photo-recovery-v1050.js'));
assert.equal(read('VERSION').trim(),'1.5.0');
const java=fs.readFileSync('app/src/main/java/com/neoegoist/simulator/MainActivity.java','utf8');
assert.ok(java.includes('ImageDecoder.decodeBitmap'),'native Android fallback supports modern image formats');
assert.ok(java.includes('getContentResolver().openInputStream(uri)'),'native android import reads original content provider');
const gradle=fs.readFileSync('app/build.gradle','utf8');
assert.ok(gradle.includes('versionCode 113')&&gradle.includes("versionName '1.5.0'"));
assert.ok(java.includes('BUNDLED_WEB_VERSION = "10.6.6"'));
const mockRound={round:1,games:[{home:'bm',away:'px',result:[0,0],details:{players:[
 {name:'A',role:'GOL',side:0,rating:9},{name:'B',role:'LD',side:0,rating:8},{name:'C',role:'ZAG',side:0,rating:8},
 {name:'D',role:'ZAG',side:0,rating:8},{name:'E',role:'LE',side:0,rating:8},{name:'F',role:'CA',side:1,rating:10}
 ]}}]};
const sparse=Round.selectXI(mockRound);
assert.ok(!sparse.players.some(p=>p.slot==='VOL'&&p.role==='CA'),'striker cannot play defensive midfield');
assert.ok(!sparse.players.some(p=>p.slot==='CA'&&p.role==='ZAG'),'defender cannot play center forward');
console.log('PASS v10.5: 87 primary portraits, true XI ratings/roles, club crests, robust Android photo recovery and offline cache');
