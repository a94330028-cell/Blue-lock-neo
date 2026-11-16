'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const XP=require('../web/neo-v1000.js');
const season={career:{players:{
 a:{name:'Isagi',club:'bm',role:'CA',games:3,goals:5,assists:1,ratingSum:24},
 b:{name:'Bachira',club:'ba',role:'PD',games:3,goals:2,assists:6,ratingSum:22},
 c:{name:'Gagamaru',club:'bm',role:'GOL',games:3,saves:12,cleanSheets:2,ratingSum:23},
 d:{name:'Aiku',club:'ub',role:'ZAG',games:3,tackles:11,interceptions:8,shotBlocks:3,ratingSum:24}
}}};
const prizes=XP.awards(season);
assert.equal(prizes.find(x=>x.label==='Artilheiro').player.name,'Isagi');
assert.equal(prizes.find(x=>x.label==='Garçom').player.name,'Bachira');
assert.equal(prizes.find(x=>x.label==='Melhor goleiro').player.name,'Gagamaru');
assert.equal(prizes.find(x=>x.label==='Destaque defensivo').player.name,'Aiku');
assert.equal(XP.awards({}).length,0);
assert.ok(XP.derby('px','bm').includes('Kaiser'));
const insight=XP.matchPulse({
 teams:[{id:'bm',short:'BASTARD'},{id:'px',short:'PXG'}],
 stats:{shots:[5,2],onTarget:[3,1],saves:[1,3],boxShots:[4,1],duelsWon:[7,4],crosses:[3,2],xg:[1.5,.6]},time:3611
});
assert.equal(insight.minute,60);
assert.deepEqual(insight.shots,[5,2]);
assert.ok(insight.pressure>50);
assert.equal(XP.matchPulse(null),null);
const archive=XP.leagueRecaps({rounds:[
 {round:1,games:[{home:'bm',away:'px',result:[2,1],details:{goalRecords:[{minute:32,scorer:'Isagi'}],events:[{type:'goal',minute:32,text:'Gol de Isagi'}]}}]},
 {round:2,games:[{home:'ub',away:'mc',result:null,details:null}]}
]},6);
assert.equal(archive.length,1,'only recorded finished matches appear');
assert.equal(archive[0].goals[0].scorer,'Isagi');

function Match(){}
Match.prototype.rollGameplan=function(){
 this.pressing=['balanced','balanced'];this.buildUp=['balanced','balanced'];
 this.tactics=['balanced','balanced'];this.attackWidth=['normal','normal'];
 this.planNames=['Random 1','Random 2'];return {plans:this.planNames};
};
assert.equal(XP.adaptTactics({Match}),true);
assert.equal(XP.adaptTactics({Match}),false);
const match=new Match();match.teams=[{id:'ub'},{id:'mc'}];match.random=()=>.02;
const plan=match.rollGameplan();
assert.equal(match.pressing[0],'low');
assert.equal(match.buildUp[0],'patient');
assert.equal(match.tactics[1],'attack');
assert.equal(plan.plans[0],'Bloco compacto');
const Engine=require('../web/engine.js');
assert.equal(XP.adaptTactics(Engine),true);
const official=new Engine.Match('bm','px',12345);
official.rollGameplan();
for(let i=0;i<50;i++)official.step(1/30);
assert.equal(XP.matchPulse(official).teams[0],'BASTARD');
const app=fs.readFileSync('web/app.js','utf8');
assert.ok(app.includes('URL.createObjectURL(file)'),'Android file fallback reads blob image URLs');
assert.ok(app.includes("putPortraitBlob('custom',name,dataPortraitToBlob(data))"),'historical club photos are copied to stable JPEG before IndexedDB');
const mobile=fs.readFileSync('web/mobile-upgrade.js','utf8');
assert.ok(mobile.includes('neo-v1000.js?v=1.7.0'),'new gameplay loaded on all existing web shells');
const worker=fs.readFileSync('web/service-worker.js','utf8');
assert.ok(worker.includes('./neo-v1000.js'),'10.0 module available offline');
assert.equal(fs.readFileSync('web/VERSION','utf8').trim(),'1.7.0');
console.log('PASS v10.0: real recorded awards, club tactics, match pulse and persistent Android portraits');