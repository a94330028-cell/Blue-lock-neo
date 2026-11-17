'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../web/engine.js');
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
assert.ok(app.includes("E.allTeams?.()||TEAMS"),'History team available for match selection and portraits');
assert.ok(app.includes("const historyCrestSVG="),'temporary logo avoids broken image');
assert.ok(app.includes("Armazenamento de imagens cheio ou indisponível"),'portrait storage fallback with error guidance');
assert.ok(app.includes("localStorage.setItem(key,JSON.stringify(collection))"),'fallback preserves compact pictures');
assert.ok(app.includes("📂 Tentar pela Galeria"),'native photo-picker recovery');
console.log('PASS History Team: 11 starters, 8 reserves, exact OVRs, unique 98 OVR master, photos recoverable, existing NEL intact');
