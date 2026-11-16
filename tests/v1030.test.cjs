'use strict';
const assert=require('node:assert/strict');
const Football=require('../web/neo-football-v1010.js');
const Tour=require('../web/neo-tournament-v1030.js');
const Insights=require('../web/neo-insights-v1020.js');
const E=require('../web/engine.js');
assert.equal(Football.rivalryPair('Yoichi Isagi','Rin Itoshi'),true);
assert.equal(Football.rivalryPair('Gin Gagamaru','Rin Itoshi'),false);
const center={phase:'play',time:75*60,score:[0,2],progress(){return 1000},random(){return .05}};
assert.equal(Football.shouldLateRun(center,{side:0,role:'ZAG'},{side:0,x:1000}),true);
assert.equal(Football.shouldLateRun(center,{side:0,role:'CA'},{side:0,x:1000}),false);
const keeper={i:0,side:0,x:92,y:575},ball={mode:'shot',onTarget:true,by:{side:1},x:240,y:635,vy:0};
assert.equal(Football.keeperMove(keeper,ball,.08,{teams:[{},{}]}),true);
assert.ok(keeper.y>575&&keeper.y<595,'reacts with bounded movement, never teleports');
assert.ok(Football.cinematicType('keeper-dive')[0]==='save');
assert.equal(Football.adapt(E),true);assert.equal(Football.adapt(E),false);
const match=new E.Match('bm','px',123456);match.rollGameplan();
for(let i=0;i<160;i++)match.step(1/30);
assert.ok(match.players.length>=20);
const ids=['bm','ba','mc','px','ub','manutd08','flamengo','mirassol25'];
const fakeNames=Object.fromEntries(ids.map(id=>[id,{id,name:id,short:id}]));
class FakeMatch{
 constructor(a,b,seed){this.teams=[fakeNames[a],fakeNames[b]];this.seed=(Number(seed)||7123)>>>0;
  this.players=[{side:0,i:0,attributes:{reflexes:75}},{side:1,i:0,attributes:{reflexes:75}}];
  for(let s=0;s<2;s++)for(let i=1;i<=7;i++)this.players.push({side:s,i,name:'Player'+s+i,attributes:{finishing:70+3*i}});
 }
 random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 rollGameplan(){}
 runToEnd(){return {score:[1,1],stats:{shots:[3,4]},players:this.players,goalRecords:[]};}
}
const fake={teamById:id=>fakeNames[id]||null,Match:FakeMatch};
const cup4=Tour.create(fake,ids.slice(0,4),'Mini Cup',false);
assert.equal(cup4.rounds.length,1);
for(let i=0;i<3;i++)Tour.play(fake,cup4,171+i);
assert.ok(cup4.champion);
assert.equal(cup4.rounds.length,2);
assert.equal(cup4.rounds[1].games[0].winner,cup4.champion);
const cup8=Tour.create(fake,ids,'Grupos',true);
assert.equal(cup8.rounds.length,3);
for(let i=0;i<12;i++)Tour.play(fake,cup8,180+i);
assert.equal(cup8.rounds[3].stage,'semi');
assert.equal(Tour.groupTable(cup8,'A').length,4);
for(let i=0;i<4;i++)Tour.play(fake,cup8,200+i);
assert.equal(cup8.rounds[4].stage,'semi-return');
assert.equal(cup8.rounds[5].stage,'final');
Tour.play(fake,cup8,211);
assert.ok(cup8.champion);
assert.equal(Tour.next(cup8),null);
const backupStore=new Map(),storage={getItem:k=>backupStore.get(k)||null,setItem:(k,v)=>backupStore.set(k,v)};
Tour.save(storage,[cup8]);assert.equal(Tour.safeLoad(storage)[0].champion,cup8.champion);
const season={rounds:[{round:1,games:[{home:'bm',away:'px',result:[1,0],details:{players:[
 {name:'Yoichi Isagi',side:0,role:'CA',goals:1,assists:0,shots:2,passes:12,tackles:1,rating:8.2},
 {name:'Rin Itoshi',side:1,role:'CA',goals:0,shots:1,rating:6.3}
],shots:[{shooter:'Yoichi Isagi',side:0,x:1580,y:560,outcome:'goal',minute:73}]}}]}]};
const fixtures=Insights.completedFixtures(season,[]);
assert.equal(fixtures.length,1);
const d=Insights.dossier(fixtures,'Yoichi Isagi','bm');
assert.equal(d.games.length,1);assert.equal(d.totals.goals,1);
assert.equal(d.shots.length,1);
assert.equal(Insights.dossier(fixtures,'Unknown','bm').games.length,0);
assert.equal(Insights.champion({rounds:[{round:1,games:[{result:null}]}]},E),null);
assert.deepEqual(Insights.readHall(storage),[]);
const saved=Insights.archiveHall(storage,{name:'Bastard',key:'100',points:40,played:20});
assert.equal(saved.length,1);assert.equal(Insights.archiveHall(storage,{name:'Bastard',key:'100'}).length,1);
console.log('PASS NEO 10.3: goalkeepers, rivalries, live football, group brackets, legs, penalties, and genuine stats');
