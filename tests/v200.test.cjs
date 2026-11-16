'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const A=require('../web/neo-advanced-v200.js');
const U=require('../web/neo-universe-v220.js');
const read=p=>fs.readFileSync(p,'utf8');

const season=E.createSchedule();
E.Progression.ensure(season);
const pristine=JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves})));
assert.equal(A.adapt(E),true);
assert.equal(A.adapt(E),false,'advanced match engine hook is idempotent');
assert.equal(U.adapt(E),true);
assert.equal(U.adapt(E),false,'universe season archive hook is idempotent');

const a=new E.Match('bm','px',200420,null,season);
const b=new E.Match('bm','px',200420,null,season);
for(let i=0;i<610;i++){a.step(E.TICK);b.step(E.TICK);}
assert.deepEqual(a.score,b.score,'same seed produces identical goals');
assert.equal(a.ball.mode,b.ball.mode,'the game engine remains deterministic');
assert.ok(a.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'all players remain on finite coordinates');
assert.ok(b.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'all second-match coordinates remain finite');
const result=a.result();
assert.deepEqual(result.score,a.score,'advanced module never overrides the result');
assert.equal(result.neoAdvanced.schema,1);
assert.ok(result.neoAdvanced.events.length<=65);
assert.equal(result.neoAdvanced.territory.length,2);
assert.ok(result.neoAdvanced.territorySamples>=0);
assert.deepEqual(result.neoAdvanced,b.result().neoAdvanced,'advanced observations also deterministic');

const fake={time:300,phase:'play',score:[0,0],ball:{owner:null},_ego:()=>{},players:[]};
const loser={name:'Atleta A',side:0,ego:40};
const winner={name:'Atleta B',side:1,ego:30};
A.duel(fake,loser,winner,winner,'tackle');
A.duel(fake,loser,winner,winner,'tackle');
assert.equal(A.state(fake).duelLosses['0|Atleta A|Atleta B'],2);
assert.ok(A.state(fake).events.some(e=>e.type==='adaptation'),'response requires two actual duel losses');
const dry={phase:'play',time:470,ball:{owner:loser,mode:'carry'},players:[loser,winner],
 opponentPressure:()=>0,random:()=>0,progress:()=>800,offside:()=>false,safeLane:()=>100};
assert.equal(A.improvisedDecision(dry,loser),false,'no improvisation with no pressure');
assert.equal(A.heroicSave(fake,winner,false,{mode:'shot',by:loser,shotXg:.4}),undefined);
assert.equal(A.state(fake).saves.length,0,'failed save is not a legendary save');

const fixture=season.rounds[0].games[0];
fixture.result=[2,1];
fixture.details={
 score:[2,1],
 players:[
  {name:'Atleta Um',side:0,role:'CA',rating:8.3,goals:2,assists:0,saves:0,duelsWon:4},
  {name:'Atleta Dois',side:1,role:'GOL',rating:7.3,goals:0,assists:0,saves:5},
  {name:'Atleta Três',side:0,role:'MC',rating:7.1,goals:0,assists:1,saves:0}
 ],
 neoAdvanced:{schema:1,events:[{type:'finisher',side:0,player:'Atleta Um',minute:51,detail:'Finalização registrada'}],
  territory:[12,8],saves:[{keeper:'Atleta Dois',xg:.29}],territorySamples:20}
};
const imagesMarker={test:'No portrait is touched'};
season.portraitControl=imagesMarker;
assert.ok(U.verifiedFixture(fixture));
assert.equal(U.capture(season,fixture,{result:()=>fixture.details},1,E),true);
assert.equal(U.capture(season,fixture,{result:()=>fixture.details},1,E),false,'fixture is never counted twice');
const archive=U.ensure(season);
assert.equal(archive.matches.length,1);
assert.equal(archive.players['Atleta Um|'+fixture.home].goals,2);
assert.equal(archive.awards.length,0,'no trophies before season ends');
assert.equal(U.summary(season,E,null,null).matches.length,1);
assert.equal(season.portraitControl,imagesMarker);
assert.equal(JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves}))),pristine,'original rosters unchanged');
const copy={...fixture,result:[3,1],details:{...fixture.details,score:[2,1]}};
assert.equal(U.capture(season,copy,null,2,E),false,'score mismatch cannot produce archived trophies');
const all=(season.rounds||[]).flatMap(r=>r.games||[]);
assert.ok(all.length>1);
for(const g of all){if(g!==fixture){g.result=[0,0];g.details={score:[0,0],players:[]};}}
assert.equal(U.isFinal(season),true,'final means every fixture has a result and recorded details');
const last=season.rounds.at(-1).games.at(-1);
assert.equal(U.capture(season,last,null,season.rounds.at(-1).round,E),true);
assert.ok(U.ensure(season).hall.some(h=>h.kind==='league'),'only completed season gets a champion');
assert.ok(U.ensure(season).awards.some(a=>a.title==='Artilheiro'),'prizes based on real recorded data');
assert.ok(read('tools/sync_inline_v930.py').includes('neo-advanced-v200.js'));
assert.ok(read('tools/sync_inline_v930.py').includes('neo-universe-v220.js'));
assert.ok(read('web/service-worker.js').includes('./neo-advanced-v200.js'));
assert.ok(read('web/service-worker.js').includes('./neo-universe-v220.js'));
assert.ok(read('web/service-worker.js').includes('./neo-universe-v220.css'));

const selection=U.registerWorldXI(E,season,'bm');
assert.ok(selection,'WORLD XI must be created from existing official athletes');
assert.equal(selection.team.players.length,11);
assert.equal(new Set(selection.team.players).size,11,'no duplicated world XI starters');
assert.ok(selection.team.players.every(name=>!E.teamById('bm').players.includes(name)),'avoid cloning opposing starters');
assert.equal(U.registerWorldXI(E,season,'bm').team,selection.team,'rebuild the same generated team');
const worldMatch=new E.Match('bm',U.WORLD_ID,120730,null,season);
for(let i=0;i<300;i++)worldMatch.step(E.TICK);
assert.ok(worldMatch.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'World XI is playable');
assert.equal(JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves}))),pristine,'World XI must not mutate base clubs');

console.log('PASS 1.9: deterministic gameplay, genuine duels and saves, verified awards, bounded history and offline integration');
