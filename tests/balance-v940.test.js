'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../web');const E=require(path.join(root,'engine.js'));
assert.equal(E.Masters.WINDOW_SECONDS,2700,'Masters should play for up to 45 minutes');
const results=[101,102,103,104].map(seed=>new E.Match('bm','px',seed).runToEnd());
const entries=results.flatMap(r=>r.masterEntries);
assert.ok(entries.some(e=>e.ended),'Master must play');
assert.ok(entries.some(e=>e.ended&&e.exitMinute-e.minute>=40),'Master should last close to 45 minutes');
for(const e of entries)assert.ok(e.ended&&e.exitMinute-e.minute<=46,'Master hard cap with rounding, '+e.master+': '+(e.exitMinute-e.minute));
for(const club of E.TEAMS){const master=E.Attr.generate(club.master,'CA',9);assert.ok(master.ovr>=96&&master.ovr<=99);for(let i=0;i<club.players.length;i++){const ov=E.Attr.generate(club.players[i],club.formation[i].role,i).ovr;assert.ok(ov<=90)}}
let saved=false;for(const r of results){const gks=r.players.filter(p=>p.role==='GOL');for(const p of gks){assert.ok(Number.isInteger(p.saves)&&p.saves>=0,'Valid keeper saves');if(p.saves)saved=true;}for(const side of [0,1]){const p=gks.find(g=>g.side===side);if(p)assert.ok(p.saves>=r.stats.saves[side],'Personal goalkeeper saves must include team saves');}}
assert.ok(saved,'Some goalkeeper must make real saves');
const perf=E.Progression;
for(const role of ['GOL','ZAG','VOL','MC','MEI','PD','CA']){assert.ok(perf.estimateValue({games:0},88,role)>300e6,'Position value should be higher for '+role)}
assert.ok(perf.estimateValue({games:8,saves:34,cleanSheets:3,ratingSum:59},89,'GOL')>perf.estimateValue({games:0},89,'GOL'));
assert.ok(perf.estimateValue({games:5,tackles:23,interceptions:21,shotBlocks:11},87,'ZAG')>perf.estimateValue({games:0},87,'ZAG'));
const season=E.createSchedule(4);const fixture=season.rounds.flatMap(r=>r.games).find(f=>f.home==='bm'&&f.away==='px');
const r=new E.Match('bm','px',7001);r.runToEnd();E.recordFixture(season,fixture,r);
const savedKeeper=season.career.players['Gin Gagamaru|bm'];
assert.equal(savedKeeper.saves,r.result().players.find(p=>p.name==='Gin Gagamaru').saves,'Saves persist by player name');
const original=savedKeeper.saves;perf.reconcileGoalkeepers(season);assert.ok(savedKeeper.saves>=original);const once=savedKeeper.saves;perf.reconcileGoalkeepers(season);assert.equal(savedKeeper.saves,once,'Backfill must not double count');
const legacy={schema:2,rounds:[{games:[{home:'bm',away:'px',result:[1,0],details:{stats:{saves:[12,5]},players:[{name:'Gin Gagamaru',side:0,role:'GOL',saves:0},{name:'Renoir',side:1,role:'GOL',saves:0}]}}]}],career:{players:{},history:[]}};
perf.reconcileGoalkeepers(legacy);assert.equal(legacy.career.players['Gin Gagamaru|bm'].saves,12,'Recover old goalkeeper saves from saved match data');assert.equal(legacy.career.players['Renoir|px'].saves,5);perf.reconcileGoalkeepers(legacy);assert.equal(legacy.career.players['Gin Gagamaru|bm'].saves,12);
const ui=fs.readFileSync(path.join(root,'neo-v940.js'),'utf8');assert.ok(ui.includes('Mais valiosos por posição'));for(const r of ['Goleiros','Zagueiros','Laterais','Volantes','Meias centrais','Meias ofensivos','Pontas','Atacantes','Artilheiros','Assistentes'])assert.ok(ui.includes(r));assert.ok(!ui.includes('neo930-tags'));
assert.ok(fs.readFileSync(path.join(root,'mobile-upgrade.js'),'utf8').includes('neo-v940.js?v=9.4.0'));
assert.equal(fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),'9.4.0');
console.log('PASS v9.4: real keeper saves, history reconciliation, position-specific price, 45-minute masters, clean UI');