'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../web/engine.js'),P=E.Progression;
assert.equal(fs.readFileSync('web/VERSION','utf8').trim(),'9.5.0');
for(const role of ['GOL','ZAG','VOL','MC','MEI','PD','CA']){
 const n=P.baseValue(90,role);
 assert.ok(n>=150e6&&n<=260e6,'Preço base fora de escala para '+role);
 assert.equal(P.estimateValue({games:0},90,role),n);
}
const gk={name:'Gin Gagamaru',games:9,saves:65,cleanSheets:4,ratingSum:72,wins:5};
const striker={name:'Rin Itoshi',games:9,goals:11,assists:2,ratingSum:75,wins:6};
assert.ok(P.estimateValue(gk,89,'GOL')>P.baseValue(89,'GOL'));
assert.ok(P.estimateValue(gk,89,'GOL')<400e6);
assert.ok(P.estimateValue(striker,90,'CA')<400e6);
assert.ok(P.estimateValue({...striker,value:1348500000},90,'CA')===P.estimateValue(striker,90,'CA'),'Preços antigos no save não podem prevalecer');
assert.ok(P.estimateValue({games:100,goals:1000},90,'CA')<=395e6);
const players={
 'Rin Itoshi|px':{...striker,name:'Rin Itoshi',club:'px',role:'CA'},
 'Gin Gagamaru|bm':{...gk,name:'Gin Gagamaru',club:'bm',role:'GOL'},
 'Yoichi Isagi|bm':{name:'Yoichi Isagi',club:'bm',role:'CA',games:9,goals:7,assists:4,ratingSum:72,wins:5},
 'Michael Kaiser|bm':{name:'Michael Kaiser',club:'bm',role:'CA',games:9,goals:5,assists:3,ratingSum:73,wins:5},
 'Reo Mikage|mc':{name:'Reo Mikage',club:'mc',role:'MEI',games:9,assists:3,keyPasses:18,interceptions:15,tackles:10,ratingSum:73,wins:4},
 'Oliver Aiku|ub':{name:'Oliver Aiku',club:'ub',role:'ZAG',games:9,tackles:26,interceptions:26,shotBlocks:16,ratingSum:70,wins:5},
 'NoGames|px':{name:'NoGames',club:'px',role:'CA',games:0,goals:100}
};
const season={career:{players}},snapshot=JSON.stringify(season),top=P.mvpRanking(season,5);
assert.equal(top.length,5);assert.equal(new Set(top.map(x=>x.name)).size,5);
assert.ok(top.every(x=>x.games>0&&x.mvpPoints>0&&Number.isFinite(x.mvpPoints)));
assert.ok(top.some(x=>['Reo Mikage','Oliver Aiku'].includes(x.name)),'Meias e defensores podem chegar ao Top 5');
assert.ok(top.every((p,i)=>!i||top[i-1].mvpPoints>=p.mvpPoints));
assert.deepEqual(P.mvpRanking({career:{players:{}}},5),[]);
assert.equal(JSON.stringify(season),snapshot,'MVP não pode alterar saves');
const mobile=fs.readFileSync('web/mobile-upgrade.js','utf8'),ui=fs.readFileSync('web/neo-v950.js','utf8'),css=fs.readFileSync('web/neo-v950.css','utf8');
for(const key of ['neo-v950.js?v=9.5.0','neo950-script'])assert.ok(mobile.includes(key));
for(const key of ['neo950-mvp','MVP ATUAL','neo950-old-ranking','neo950-moments','updateMvp(season)'])assert.ok(ui.includes(key));
assert.ok(css.includes('#ranking .neo950-old-ranking{display:none!important}'));
assert.equal(E.Masters.WINDOW_SECONDS,2700,'Mestres continuam com até 45 minutos');
const m=new E.Match('bm','px',72001),result=m.runToEnd();
assert.ok(result.players.filter(x=>x.role==='GOL').length>=2);
console.log('PASS v9.5: preço reajustado, ranking único, Top 5 MVP real e saves preservados');
