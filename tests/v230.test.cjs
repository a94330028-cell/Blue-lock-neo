'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const A=require('../web/neo-advanced-v200.js');
const U=require('../web/neo-universe-v220.js');
const Twelve=require('../web/neo-twelve-v230.js');
const read=p=>fs.readFileSync(p,'utf8');
assert.equal(A.adapt(E),true,'existing advanced game module remains available');
assert.equal(U.adapt(E),true,'verified universe remains available');
assert.equal(Twelve.adapt(E),true,'new module installs on real match and career engines');
assert.equal(Twelve.adapt(E),false,'hooks must never stack during reload');

const season=E.createSchedule();
E.Progression.ensure(season);
const original=JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves})));
const a=new E.Match('bm','px',203019,season.career,season);
const b=new E.Match('bm','px',203019,season.career,season);
for(let i=0;i<850;i++){a.step(E.TICK);b.step(E.TICK);}
assert.deepEqual(a.score,b.score,'seeded matches remain deterministic');
assert.deepEqual(a.ball.mode,b.ball.mode,'the underlying ball simulation remains deterministic');
assert.ok(a.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'all pitch positions finite');
assert.deepEqual(a.result().ego230,b.result().ego230,'new Ego decisions repeat on identical seeds');
assert.equal(a.result().ego230.schema,1);
assert.ok(a.result().ego230.events.length<=45);
assert.deepEqual(a.result().score,a.score,'no synthetic goals added to match scores');

const player={name:'Player A',side:0,i:6,x:530,y:560,role:'MEI',stamina:92,ego:50,flowUntil:900,
 abilityUses:{'demo-pass':7}};
const mate={name:'Player B',side:0,i:8,x:680,y:510,role:'CA',stamina:88,ego:42};
const enemy={name:'Opponent',side:1,i:4,x:555,y:554,role:'ZAG',stamina:83,ego:44};
const mock={time:330,phase:'play',score:[0,1],teams:[{id:'bm'},{id:'px'}],
 careerPlayers:{'Player A|bm':{weaponMastery:{'demo-pass':3},abilityUses:{'demo-pass':20},neo230:{defeatLessons:3,positionWork:4}}},
 ball:{mode:'pass',owner:null,by:player,to:mate},players:[player,mate,enemy],
 opponentPressure:p=>p===player?3:0,progress:(_,x)=>x,safeLane:()=>85,
 offside:()=>false,random:()=>0,_ego:()=>{},
 inOpponentBox:()=>true,shotMap:[{side:0,outcome:'saved',minute:4.8}],
 lastTurnover:[327,0]};
mock._neo230Engine=E;
assert.equal(Twelve.skillTier(mock,player,{id:'demo-pass'}),3,'19 mastery has three real levels');
assert.equal(Twelve.launched(mock,player,mate),true,'a real launched ball is registered');
mock.time=331;mock.ball={mode:'carry',owner:mate};
assert.equal(Twelve.observeReception(mock),true,'21/22 chain and chemistry require actual reception');
assert.equal(Twelve.observeReception(mock),false,'a pass is never counted twice');
assert.equal(Twelve.chemistry(mock,player,mate),1);
mock.time=335;mock.ball={mode:'carry',owner:player};
mock.pass=(p,q)=>{mock.ball={mode:'pass',owner:null,by:p,to:q};};
assert.equal(Twelve.improvise(mock,player),true,'20 improvisation chooses legal free outlet under pressure');
assert.equal(mock.ball.to,mate,'the real passer targets a teammate');
assert.equal(Twelve.improvise({...mock,ball:{mode:'carry',owner:enemy}},player),false,'improvisation requires real possession');
mock.ball={mode:'carry',owner:player};
player.activeAbility={id:'demo-pass',until:450};
const beforeWeapon=Twelve.weaponFactor(mock,player,'passing');
assert.ok(beforeWeapon>=1,'23 active weapon has a bounded context-specific modifier');
assert.ok(beforeWeapon<=1.027,'weapon effect never multiplies without limits');
assert.ok(Twelve.instinct(mock,player,.19)>.19,'24 recent real save can influence finishing instinct');
assert.equal(Twelve.adaptableRun(mock,player,player,'support'),'support','25 positional moves require another on-ball player');
assert.equal(Twelve.adaptableRun(mock,player,mate,'support'),'support','25 only adapts in the correct tactical zone');
mock.time=338;mock.lastTurnover[0]=335;
assert.equal(Twelve.counterRun(mock,mate,player,'decoy'),'channel','26 players change run after genuine recent turnover');
assert.equal(Twelve.counterRun({...mock,lastTurnover:[0,0]},mate,player,'decoy'),'decoy','no counter outside transition window');
mock.time=420;Twelve.shotCompetition(mock,player);
mock.time=430;Twelve.shotCompetition(mock,mate);
mock.time=440;Twelve.shotCompetition(mock,player);
mock.time=450;Twelve.shotCompetition(mock,mate);
assert.ok(Object.keys(Twelve.state(mock).conflicts).length>0,'27 competition derives from shooting teammates');
assert.ok(Twelve.lessonFactor(mock,player,'control')>1,'28 lessons only after actual recorded defeats');
mock.ball.owner=enemy;mock.time=455;
Twelve.onDuel(mock,player,enemy,enemy);
Twelve.onDuel(mock,player,enemy,enemy);
assert.ok(Twelve.adaptationFactor(mock,player,'control')>1,'29 adaptation follows repeated actual duel losses');
assert.equal(Twelve.adaptationFactor({...mock,ball:{owner:mate}},player,'control'),1,'adaptation only against current opponent');
mock.ball.owner=player;mock.time=470;player.flowUntil=700;
assert.equal(Twelve.genius(mock,player,{id:'demo-pass',label:'Leitura',stat:'vision'},'pass'),true,'30 authentic ability+Flow+pressure opens genius window');
assert.ok(Twelve.multiplier(mock,player,'vision')>1,'genius affects the real attribute used by the engine');
assert.equal(Twelve.genius(mock,player,{id:'demo-pass',stat:'vision'},'pass'),false,'genius cannot spam during its window');
assert.ok(Twelve.state(mock).events.length<=65,'events have bounded memory');

const fixture=season.rounds[0].games[0];
fixture.result=[1,2];
fixture.details={score:[1,2],players:[
 {name:'Player A',side:0,role:'MEI',rating:7.4,runs:3,overlaps:0,keyPasses:1,abilityUses:{'demo-pass':2}},
 {name:'Player B',side:1,role:'CA',rating:7.1,runs:1,overlaps:0,keyPasses:0,abilityUses:{}}
]};
season.career.players['Player A|'+fixture.home]={name:'Player A',club:fixture.home};
season.career.players['Player B|'+fixture.away]={name:'Player B',club:fixture.away};
assert.equal(Twelve.recordSeason(season,fixture,null,1),true);
assert.equal(Twelve.recordSeason(season,fixture,null,1),false,'repeat save never increments development');
assert.equal(season.career.players['Player A|'+fixture.home].neo230.matches,1);
assert.equal(season.career.players['Player A|'+fixture.home].neo230.positionWork,1);
assert.equal(season.career.players['Player A|'+fixture.home].neo230.defeatLessons,1);
assert.equal(JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves}))),original,'existing club teams unchanged');
assert.ok(read('tools/sync_inline_v930.py').includes('neo-twelve-v230.js'));
assert.ok(read('web/service-worker.js').includes('./neo-twelve-v230.js'));
assert.ok(read('web/service-worker.js').includes('./neo-twelve-v230.css'));
console.log('PASS v230: twelve Ego features, deterministic matches, real skill triggers, valid passes, progression and preservation');