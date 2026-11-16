'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../web/engine.js'),W=require('../web/neo-world-brain-v160.js');
const read=p=>fs.readFileSync(p,'utf8');
const keeper={name:'Gagamaru',side:0,role:'GOL',i:0,x:130,y:570,
 attributes:{reflexes:95,vision:76}};
const attacker={name:'Rin',side:1,role:'CA',i:9,x:280,y:625};
const shots=[{shooter:'Rin',side:1},{shooter:'Rin',side:1},{shooter:'Rin',side:1}];
const match={time:210,ball:{mode:'shot',by:attacker},shotMap:shots};
assert.ok(W.keeperRead(match,keeper,'reflexes')>1,'keepers learn real repeated shooter tendencies');
assert.equal(W.keeperRead(match,keeper,'finishing'),1,'no unrelated attacker buff');
assert.equal(W.keeperRead({...match,shotMap:shots.slice(0,2)},keeper,'reflexes'),1,'one/two shots are not enough');
assert.equal(W.keeperRead({...match,ball:{mode:'pass',by:attacker}},keeper,'reflexes'),1,'no bonus on non-shots');
assert.equal(W.keeperRead({...match,shotMap:[]},keeper,'reflexes'),1,'no imaginary scouting');
const p={name:'Isagi',side:0,i:8,x:1370,y:510,role:'MEI',attributes:{vision:93},stamina:80};
const teammate={name:'Kaiser',side:0,i:9,x:1525,y:565,role:'CA',attributes:{positioning:95}};
const teammateMarked={name:'Baro',side:0,i:10,x:1460,y:800,role:'CA',attributes:{positioning:77}};
const passing={
 time:500,phase:'play',players:[p,teammate,teammateMarked,attacker],
 ball:{owner:p},stats:{longShots:[2,0],boxShots:[0,0]},teams:[{id:'bm',short:'BM'},{id:'px',short:'PX'}],
 progress(side,x){return x;},opponentPressure(q){return q===p?2:0;},offside:()=>false,
 safeLane(a,q){return q===teammate?95:18;},shotQuality:()=>.18,random:()=>0,
 pass(from,to){this.ball={owner:null,by:from,to,mode:'pass'};},log(s){this.message=s}
};
assert.equal(W.opportunityPass(passing,p),true,'under pressure, play into penalty area rather than repeat distant shooting');
assert.equal(passing.ball.to,teammate);
assert.ok(passing.message.includes('troca o chute pelo passe'));
assert.equal(W.opportunityPass({...passing,stats:{longShots:[0,0],boxShots:[0,0]},ball:{owner:p}},p),true,'box opportunity comes from real positioning');
assert.equal(W.opportunityPass({...passing,ball:{owner:p},offside:()=>true},p),false,'no offside cheating');
assert.equal(W.opportunityPass({...passing,ball:{owner:p},shotQuality:()=>.41},p),false,'do not force passing over strong shots');
const cb1={name:'Aiku',side:0,role:'ZAG',i:2,id:2,x:255,y:705};
const cb2={name:'Niko',side:0,role:'ZAG',i:3,id:3,x:320,y:520};
const coverMatch={ball:{x:220,y:670,owner:attacker},phase:'play',players:[cb1,cb2,attacker],progress:()=>210};
const oldTarget={x:350,y:425},moved=W.coverShape(coverMatch,cb2,oldTarget,'block');
assert.ok(moved.y>oldTarget.y&&moved.y<oldTarget.y+140,'secondary centre-back closes center without teleport');
assert.strictEqual(W.coverShape(coverMatch,cb1,oldTarget,'block'),oldTarget,'primary marker is not doubled');
assert.strictEqual(W.coverShape({...coverMatch,phase:'attack'},cb2,oldTarget,'block'),oldTarget);
const coach={autoCoach:true,phase:'play',finished:false,time:46*60,
 score:[0,2],coachLocked:[false,false],buildUp:['direct','direct'],
 attackWidth:['narrow','wide'],pressing:['high','high'],
 teams:[{short:'BM'},{short:'PX'}],stats:{longShots:[6,0],boxShots:[1,0]},coachDecisions:[],log(s){this.message=s}};
assert.equal(W.coachAdjustment(coach).length,1,'trailing team adapts long-shot reliance');
assert.equal(coach.buildUp[0],'patient');
assert.equal(coach.attackWidth[0],'wide');
assert.equal(W.coachAdjustment(coach).length,0,'no changes spam in the same time window');
assert.equal(W.coachAdjustment({...coach,time:52*60,coachLocked:[true,false],buildUp:['direct','direct']}).length,0,'manual coach lock honoured');
const c2={...coach,time:57*60,score:[2,0],stats:{longShots:[0,0],boxShots:[1,6]},attackWidth:['wide','wide'],pressing:['high','high']};
assert.equal(W.coachAdjustment(c2).length,1);
assert.equal(c2.attackWidth[0],'narrow');
const career={players:{'Isagi|bm':{name:'Isagi',club:'bm',role:'MEI',games:1,goals:1,assists:1,ratingSum:8.2,impact:8},
 'Gagamaru|bm':{name:'Gagamaru',club:'bm',role:'GOL',games:1,goals:0,assists:0,saves:5,cleanSheets:1,ratingSum:8},
 'Rin|px':{name:'Rin',club:'px',role:'CA',games:1,goals:0,ratingSum:7}},worldRecorded:{}};
const season={career};
const fixture={home:'bm',away:'px'};
const report={
 players:[{name:'Isagi',side:0,role:'MEI',goals:1,assists:1,rating:8.2,flowCount:1},
 {name:'Gagamaru',side:0,role:'GOL',saves:5,rating:8.1},
 {name:'Rin',side:1,role:'CA',rating:7}],
 score:[1,0],stats:{shots:[7,4],boxShots:[4,1],longShots:[3,3],completed:[34,29]},
 duelHistory:[{attacker:'Isagi',defender:'Rin',winner:'Isagi',kind:'tackle'}],
 egoCombat:{awakenings:[{name:'Isagi',label:'Flow'}]},
 egoAscension:{events:[{player:'Isagi',type:'reading'}]}
};
assert.equal(W.recordSeason(season,fixture,{result:()=>report},1),true);
assert.equal(W.recordSeason(season,fixture,{result:()=>report},1),false,'no duplicate matches');
assert.equal(career.worldTeams.bm.games,1);
assert.equal(career.worldTeams.bm.boxShots,4);
assert.equal(career.players['Isagi|bm'].worldTimeline.length,1);
assert.equal(career.players['Isagi|bm'].worldTimeline[0].duels,1);
assert.equal(career.players['Isagi|bm'].worldTimeline[0].awakens,1);
assert.ok(W.playerImpact(career.players['Gagamaru|bm'])>0,'keeper deserves Ego ranking');
const encyclopedia=W.seasonHighlights(career);
assert.ok(encyclopedia.ranked.some(p=>p.name==='Isagi'));
assert.ok(encyclopedia.teams.some(p=>p.id==='bm'));
assert.equal(W.adapt(E),true);
assert.equal(W.adapt(E),false,'no multiple hooks');
const m=new E.Match('bm','px',160014);
m.rollGameplan();
for(let i=0;i<350;i++)m.step(E.TICK);
assert.ok(m.time>0&&m.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
assert.deepEqual(m.result().score,m.score,'match outcome stays engine-owned');
for(let seed=17000;seed<17008;seed++){
 const sim=new E.Match('bm','px',seed);
 sim.rollGameplan();
 for(let i=0;i<160;i++)sim.step(E.TICK);
 assert.ok(sim.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'batch match stays stable');
}
assert.ok(read('web/app.js').includes("fast.value='40'"),'40x remains available');
assert.ok(read('tools/sync_inline_v930.py').includes('neo-world-brain-v160.js'));
assert.ok(read('web/index.html').includes('neo-world-brain-v160.js'));
assert.ok(read('web/index.html').includes('neo-world-brain-v160.css'));
const worker=read('web/service-worker.js');
assert.ok(worker.includes('./neo-world-brain-v160.js'));
assert.ok(worker.includes('blue-lock-neo-v1.10.1-master-ranks-portraits'));
const releases=JSON.parse(read('CHANGELOG.json'));
assert.equal(releases.current_version,'1.8.0');
assert.equal(releases.releases[0].version,'1.8.0');
assert.equal(read('web/VERSION').trim(),'1.8.0');
assert.equal(read('web/UPDATE_BUILD').trim(),'10.6.18');
assert.ok(read('app/build.gradle').includes("versionName '1.8.0'"));
assert.ok(read('app/build.gradle').includes('versionCode 117'));
console.log('PASS World Brain 1.5: keeper adaptations, safe box chances, tactical coaches, season timeline and batch physics');
