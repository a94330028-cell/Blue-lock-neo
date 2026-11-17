'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../web/engine.js');
const History=require('../web/neo2-history-team-v201.js');
assert.ok(History.install(E),'History Team registered only when its module is loaded');
assert.equal(History.install(E),false,'History registration is idempotent');
const expected={
 'Dexter Morgan':['PE',94],'Gustavo Grace':['PD',94],'Hao':['CA',90],
 'Saiko':['CA',92],'Gb':['MC',93],'Fuyuki':['MC',92],'Zenkai':['VOL',90],
 'Oliver Grace':['ZAG',92],'Zeus':['ZAG',93],'Charles':['ZAG',93],
 'Gin':['GOL',91],'Soul':['MC',88],'Toko':['GOL',90],'Kanzaku':['GOL',90],
 'Taiju':['MC',90],'Akira':['ZAG',88],'Dots':['MC',87],
 'Lacerda':['VOL',86],'Shiro':['PD',88]
};
const t=E.teamById('ht');
assert.ok(t,'History Team registered in engine');
assert.equal(t.name,'History Team');
assert.equal(t.formationName,'3-3-4');
assert.equal(t.players.length,11);
assert.equal(t.reserves.length,8);
assert.equal(new Set(t.players.concat(t.reserves)).size,19,'no duplicate roster entries');
assert.equal(E.TEAMS.length,5,'existing league stays with original five clubs');
assert.ok(E.EXTRA_TEAMS.some(x=>x.id==='ht'));
assert.ok(E.allTeams().some(x=>x.id==='ht'));
assert.equal(E.Masters.CONFIG.ht.masterOvr,98);
assert.equal(E.Masters.CONFIG.ht.masterRole,'MEI');
for(let i=0;i<t.players.length;i++){
 const name=t.players[i],role=t.formation[i].role;
 assert.equal(role,expected[name][0],name+' position');
 const ovr=E.Attr.generate(name,role,i).ovr;
 assert.equal(ovr,expected[name][1],name+' starter OVR should affect gameplay attributes');
}
for(const name of t.reserves){
 const [role,ovr]=expected[name];
 assert.equal(t.reserveRoles[name],role);
 assert.equal(E.Attr.generate(name,role,role==='GOL'?0:1).ovr,ovr,name+' reserve OVR');
}
const m=new E.Match('ht','bm',1001);
assert.ok(m.players.some(x=>x.side===0&&x.name==='Gustavo Grace'));
m.ball.owner=null;m.ball.to=null;
assert.equal(m._masterEntry(0),true);
const gustavo=m.players.filter(p=>p.side===0&&p.name==='Gustavo Grace');
assert.equal(gustavo.length,1,'master cannot duplicate the same starter');
assert.equal(gustavo[0].isMaster,true);
assert.equal(gustavo[0].role,'MEI');
assert.equal(gustavo[0].attributes.ovr,98,'History master actual match stats');
const schedule=E.createSchedule(4);
assert.equal(schedule.rounds.reduce((n,r)=>n+r.games.length,0),40,'existing 5-club league untouched');
const r=new E.Match('ht','px',812812).runToEnd();
assert.ok(r.score.every(v=>Number.isInteger(v)&&v>=0),'History match plays to completion');
const app=fs.readFileSync('web/app.js','utf-8');
const studio=fs.readFileSync('web/neo-studio-v970.js','utf-8');
const start=studio.indexOf('function photoTeams(){');
const end=studio.indexOf('\nconst optionHtml',start);
assert.ok(start>=0&&end>start,'History photo editor helper exists');
const photoTeams=new Function('E','H',studio.slice(start,end)+'\nreturn photoTeams();');
const photoClubs=photoTeams(E,{teams:[]});
assert.equal(photoClubs.length,1);
assert.equal(photoClubs[0].id,'ht');
assert.deepEqual(photoClubs[0].starters.map(([name])=>name),t.players);
assert.deepEqual(photoClubs[0].reserves.map(([name])=>name),t.reserves);
assert.equal(photoClubs[0].starters.find(([name])=>name==='Dexter Morgan')[3],94);
assert.equal(photoClubs[0].reserves.find(([name])=>name==='Shiro')[3],88);
assert.ok(studio.includes('await window.NeoPortraitManager.saveFile(name,file)'),
 'photo editor uses the same resilient Android portrait storage');
assert.ok(!studio.includes("!['image/jpeg','image/png','image/webp'].includes(file.type)"),
 'editor must not reject Android photos with an empty MIME type');
assert.ok(app.includes("E.allTeams?.()||TEAMS"),'History team available for match selection and portraits');
assert.ok(app.includes("const historyCrestSVG="),'temporary logo avoids broken image');
assert.ok(app.includes("Armazenamento de imagens cheio ou indisponível"),'portrait storage fallback with error guidance');
assert.ok(app.includes("localStorage.setItem(key,JSON.stringify(collection))"),'fallback preserves compact pictures');
assert.ok(app.includes("📂 Tentar pela Galeria"),'native photo-picker recovery');
assert.ok(app.includes("const records=await readPortraitDB().catch("),'backup must work without IndexedDB');
assert.ok(app.includes("await savePortraitImage(rec.type,rec.name,rec.data)"),'backup import respects localStorage fallback');
assert.ok(app.includes("await savePortraitImage('custom',name,data);"),'all external portrait upload APIs honor Android fallback');
console.log('PASS History Team: 11 starters, 8 reserves, exact OVRs, unique 98 OVR master, photos recoverable, existing NEL intact');
