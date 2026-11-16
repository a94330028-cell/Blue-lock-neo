'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const P=require('../web/neo-five-pillars-v170.js');
const read=p=>fs.readFileSync(p,'utf8');
function athlete(name,side,role,attributes={}){
 return {name,side,role,i:role==='GOL'?0:9,x:420,y:520,vx:0,vy:0,stamina:95,
  attributes:{vision:65,finishing:70,dribbling:70,passing:65,ego:80,positioning:70,...attributes},
  flowUntil:0,flowCount:0,ego:45,abilityUses:{},activeAbility:null};
}
const isagi=athlete('Yoichi Isagi',0,'MEI',{vision:99,passing:89});
const kaiser=athlete('Michael Kaiser',0,'CA',{finishing:99});
const bachira=athlete('Meguru Bachira',0,'PD',{dribbling:99});
const gagamaru=athlete('Gin Gagamaru',0,'GOL',{reflexes:99});
const newcomer=athlete('Jogador X',0,'MEI',{dribbling:99,ego:72,passing:60});
const ids=[isagi,kaiser,bachira,gagamaru,newcomer].map(p=>P.identity(p));
assert.deepEqual(ids.map(x=>x.archetype),['visionary','predator','dribbler','reflex','dribbler'],
 'personalities are distinct and grounded in name/position/strength');
assert.ok(P.identity(isagi).flowName.includes('ISAGI'),'each player gets a named Flow signature');
const persisted=P.identity({...newcomer,name:'Jogador Recriado'},
 {fivePillars:{archetype:'conductor'}});
assert.equal(persisted.archetype,'conductor','saved archetypes remain stable across new matches');
assert.equal(P.identity(newcomer).archetype,P.identity(newcomer).archetype,'profiles deterministic');
isagi.flowUntil=300;
const activeMatch={time:120,teams:[{id:'bm'},{id:'px'}],careerPlayers:{},score:[0,2]};
assert.ok(P.flowBoost(activeMatch,isagi,'vision')>1,'exclusive Flow helps a chosen real stat');
assert.equal(P.flowBoost(activeMatch,isagi,'reflexes'),1,'no unrelated attribute boost');
assert.equal(P.flowBoost({...activeMatch,time:500},isagi,'vision'),1,'Flow expires');
const delta=P.egoFactor({...activeMatch,time:72*60},kaiser,5,'gol decisivo');
assert.ok(delta>5&&delta<=5.9,'late trailing player earns modest context-dependent Ego');
assert.equal(P.egoFactor({...activeMatch,time:100},kaiser,-6,'erro'),-6,'negative Ego unchanged');
const marked=athlete('Bloqueado',0,'CA',{positioning:80});
marked.x=560;marked.y=510;
const free=athlete('Livre',0,'MC',{positioning:78});
free.x=600;free.y=750;
const rival=athlete('Defensor',1,'ZAG',{defense:90});
rival.x=562;rival.y=513;rival.vx=-4;
const reader={
 time:180,phase:'play',ball:{owner:isagi},teams:[{id:'bm'},{id:'px'}],
 players:[isagi,marked,free,rival],careerPlayers:{},stats:{visionReads:[0,0]},
 safeLane(a,q){return q===free?95:12;},
 offside:()=>false,log(s){this.lastLog=s;}
};
const changed=P.readPass(reader,isagi,{q:marked,value:17,lane:12,d:140});
assert.equal(changed.q,free,'Metavision predicts pressure and changes real passing target');
assert.ok(reader.stats.visionReads[0]>0,'reading is registered');
assert.equal(P.readPass({...reader,offside:()=>true},isagi,{q:marked,value:17,lane:12,d:140}).q,marked,'no offside override');
assert.equal(P.readPass({...reader,ball:{owner:rival}},isagi,{q:marked,value:17,lane:12,d:140}).q,marked,
 'no Metavision when the reader does not have possession');
const passer={...reader,ball:{owner:isagi},time:390,
 opponentPressure:()=>2,passCandidate:()=>({q:free,d:130,lane:95}),
 random:()=>0,pass(from,to){this.ball={mode:'pass',by:from,to};}};
assert.equal(P.tacticalDecision(passer,isagi),true,'visionary chooses safe pass under real pressure');
assert.equal(passer.ball.to,free);
const predator={...passer,time:550,ball:{owner:kaiser},progress:()=>1440,
 canShoot:()=>true,shotQuality:()=>.38,
 shoot(p){this.ball={mode:'shot',by:p};}};
assert.equal(P.tacticalDecision(predator,kaiser),true,'predator chooses valid near-area chance');
assert.equal(predator.ball.by,kaiser);
assert.equal(P.tacticalDecision({...predator,ball:{owner:kaiser},shotQuality:()=>.15},kaiser),false,
 'no forced shooting at low probability chances');
const runMatch={phase:'play',time:420,progress:()=>1050,random:()=>.1,teams:[{id:'bm'},{id:'px'}]};
assert.equal(P.runningStyle(runMatch,kaiser,isagi,'diagonal'),'far-post','predator attacks far post');
assert.equal(P.runningStyle(runMatch,bachira,isagi,'diagonal'),'inside-cut','improviser changes running lane');
assert.equal(P.runningStyle({...runMatch,phase:'restart'},kaiser,isagi,'diagonal'),'diagonal','no run modification on stoppage');
const ability={id:'earned-technique',label:'Impacto Controlado',stat:'finishing',tier:2};
kaiser.flowUntil=3000;kaiser.abilityUses[ability.id]=1;
const awake={time:930,teams:[{id:'bm'},{id:'px'}],careerPlayers:{},random:()=>0,
 _emitSkill(p,label){this.lastEffect=label;},log(){}};
assert.equal(P.earnedAwakening(awake,kaiser,ability),true,'skill really activated in Flow can awaken');
assert.equal(P.earnedAwakening(awake,kaiser,ability),false,'max one special awakening per match');
assert.equal(awake._neo170Events.filter(e=>e.type==='awakening').length,1);
assert.ok(P.awakeningBonus(awake,kaiser,'finishing')>1);
assert.equal(P.awakeningBonus({...awake,time:1200},kaiser,'finishing'),1,'awakening bonus expires');
const newAttack=athlete('Sem Flow',0,'CA',{finishing:95});
newAttack.abilityUses={other:1};
assert.equal(P.earnedAwakening(awake,newAttack,ability),false,'no awakening without real Flow');
const season={career:{players:{'Yoichi Isagi|bm':{name:'Yoichi Isagi',club:'bm',goals:9},
 'Michael Kaiser|bm':{name:'Michael Kaiser',club:'bm',games:2}}}};
const fixture={home:'bm',away:'px'},summary={players:[
 {name:'Yoichi Isagi',side:0,archetype:'visionary',label:'Visionário',flowName:'FLOW DE ISAGI',flowCount:1,egoPeak:95},
 {name:'Michael Kaiser',side:0,archetype:'predator',label:'Predador',flowName:'FLOW DE KAISER',flowCount:1,awakening:true,egoPeak:90}
 ],events:[
 {player:'Yoichi Isagi',side:0,type:'flow'}, {player:'Yoichi Isagi',side:0,type:'metavision'},
 {player:'Yoichi Isagi',side:0,type:'personality'}, {player:'Michael Kaiser',side:0,type:'awakening'}]};
assert.equal(P.recordCareer(E,season,fixture,{result:()=>({fivePillars:summary})},1),true);
assert.equal(P.recordCareer(E,season,fixture,{result:()=>({fivePillars:summary})},1),false,
 'duplicate fixture does not accumulate false progress');
const row=season.career.players['Yoichi Isagi|bm'].fivePillars;
assert.equal(row.flowStarts,1);assert.equal(row.metavisionReads,1);
assert.equal(row.recent.length,1);assert.equal(season.career.players['Yoichi Isagi|bm'].goals,9,'unrelated data untouched');
assert.equal(P.adapt(E),true,'integrated with real match engine');
assert.equal(P.adapt(E),false,'never stack wrappers on repeated initialization');
for(let seed=17001;seed<17007;seed++){
 const match=new E.Match('bm','px',seed);
 match.rollGameplan();
 assert.equal(match.players.length,22);
 assert.ok(match.players.every(p=>P.identity(p).archetype));
 for(let i=0;i<260;i++)match.step(E.TICK);
 const out=match.result();
 assert.ok(out.fivePillars.players.length>=20);
 assert.ok(Array.isArray(out.fivePillars.events));
 assert.deepEqual(out.score,match.score,'pillars never modify the score');
 assert.ok(match.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
}
assert.ok(read('web/app.js').includes("fast.value='40'"),'40x stays enabled');
assert.ok(read('tools/sync_inline_v930.py').includes('neo-five-pillars-v170.js'));
assert.ok(read('web/index.html').includes('neo-five-pillars-v170.js'));
assert.ok(read('web/index.html').includes('neo-five-pillars-v170.css'));
assert.ok(read('web/service-worker.js').includes('blue-lock-neo-v1.10.1-bids-v3'));
assert.ok(read('web/service-worker.js').includes('./neo-five-pillars-v170.js'));
const data=JSON.parse(read('CHANGELOG.json'));
assert.equal(data.current_version,'1.8.0');
assert.equal(data.releases[0].version,'1.8.0');
assert.equal(read('web/VERSION').trim(),'1.8.0');
assert.equal(read('web/UPDATE_BUILD').trim(),'10.6.16');
assert.ok(read('app/build.gradle').includes("versionName '1.8.0'"));
assert.ok(read('app/build.gradle').includes('versionCode 117'));
console.log('PASS FIVE PILLARS: distinctive IA, contextual Ego, earned awakening, unique Flow, predictive legal Metavision, persistence and 40x');
