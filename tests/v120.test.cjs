'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../web/engine.js'),M=require('../web/neo-evolution-v120.js');
const read=f=>fs.readFileSync(f,'utf8');
const alice={name:'Isagi',side:0,role:'MEI',i:8,id:8,x:400,y:400,baseY:400,attributes:{ego:92},stamina:100};
const bob={name:'Kaiser',side:0,role:'CA',i:9,id:9,x:560,y:450,baseY:450,attributes:{ego:96},stamina:80};
const foe={name:'Rin',side:1,role:'CA',i:9,id:20,x:455,y:390,baseY:390,goals:2,shots:3,rating:8,dribblesWon:3};
const mate={name:'Zagueiro',side:0,role:'ZAG',i:3,id:3,x:240,y:380,baseY:380};
const match={
 phase:'play',time:4000,teams:[{id:'bm'},{id:'px'}],players:[alice,bob,mate,foe],
 careerPlayers:{'Isagi|bm':{egoJourney:{confidence:40,lossStreak:2}}},
 careerLinks:{'Isagi + Kaiser|bm':{plays:7}},careerRivals:{},
 ball:{x:410,y:400,owner:alice},progress:()=>530,score:[0,1],
 random:()=>.05,pressing:['high','balanced'],
 safeLane:()=>90,offside:()=>false,opponentPressure:()=>1,
 pass:()=>true,passCandidate:()=>({q:bob,value:15,lane:90,d:160})
};
assert.equal(M.partnerChemistry(match,alice,bob),2);
assert.equal(M.partnerChemistry(match,alice,foe),0);
assert.ok(M.focus(match,alice)<M.focus({...match,time:0,pressing:['balanced','balanced'],opponentPressure:()=>0},alice));
assert.equal(M.masteryTier(0),1);
assert.equal(M.masteryTier(5),2);
assert.equal(M.masteryTier(18),3);
assert.equal(M.masteryTier('garbage'),1);
const selected=M.chemistryCandidate(match,alice,{q:mate,value:3,lane:50,d:160});
assert.equal(selected.q.name,'Kaiser','genuine high-chemistry option chosen when playable');
assert.equal(M.chemistryCandidate({...match,offside:()=>true},alice,{q:mate,value:3,lane:50,d:160}).q,mate);
const defence={...match,ball:{x:275,y:850,owner:foe},players:[mate,{...foe,x:275,y:850}],phase:'play',progress:()=>250,time:1200};
const adapted=M.dangerTarget(defence,mate,{x:270,y:390},'block');
assert.ok(adapted.y>390&&adapted.y<500,'actual threat gets ONE defender moving towards dangerous lane');
assert.equal(M.dangerTarget(defence,mate,{x:270,y:390},'attack').y,390,'no extra marking while attacking');
const run=M.adaptiveRun({...match,progress:()=>1010,ball:{owner:alice},random:()=>0},bob,alice,'support');
assert.equal(run,'blindside','wide chemistry changes an actual off-ball run behind the defence');
const season={career:{players:{'Isagi|bm':{name:'Isagi',club:'bm',games:3,abilityUses:{impact:6}}},
 links:{},rivals:{},stories:[]}};
const fixture={home:'bm',away:'px'};
const report={score:[2,1],players:[{name:'Isagi',side:0,role:'MEI',rating:8.8,goals:1,assists:1}],duelHistory:[
 {time:50,attacker:'Isagi',defender:'Rin',kind:'tackle',winner:'Isagi'},
 {time:74,attacker:'Isagi',defender:'Rin',kind:'tackle',winner:'Isagi'}
]};
M.progressRecordedMatch(E,season,fixture,{result:()=>report},1);
const saved=season.career.players['Isagi|bm'];
assert.equal(saved.weaponMastery.impact,2);
assert.equal(saved.egoJourney.form.length,1);
assert.equal(season.career.rivals['Isagi × Rin'].actualDuels,2);
assert.equal(M.snapshot(season).mastery[0].tier,2);
const before=JSON.stringify(season);
M.progressRecordedMatch(E,season,fixture,{result:()=>report},1);
assert.equal(JSON.stringify(season),before,'recording the same fixture twice is idempotent');
assert.equal(M.adapt(E),true,'engine patched once');
assert.equal(M.adapt(E),false,'no duplicate wrappers');
const sim=new E.Match('bm','px',12548);
sim.rollGameplan();
for(let i=0;i<200;i++)sim.step(E.TICK);
assert.ok(sim.time>0&&sim.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
assert.ok(sim.events.length>0);
const code=read('web/neo-evolution-v120.js');
assert.ok(!code.includes('localStorage.clear('),'existing user saves unchanged');
assert.ok(code.includes('progressRecordedMatch('),'records only actual match reports');
assert.ok(read('tools/sync_inline_v930.py').includes('neo-evolution-v120.js'));
assert.ok(read('web/index.html').includes('neo-evolution-v120.js'));
assert.ok(read('web/index.html').includes('neo-evolution-v120.css'));
const worker=read('web/service-worker.js');
assert.ok(worker.includes('./neo-evolution-v120.js')&&worker.includes('./neo-evolution-v120.css'));
assert.match(worker,/const CACHE_NAME=['"]blue-lock-neo-v2\.0\.0-[^'"]+['"]/);
const changelog=JSON.parse(read('CHANGELOG.json'));
assert.equal(changelog.current_version,'2.0.0');
assert.equal(read('web/VERSION').trim(),'2.0.0');
assert.equal(read('web/UPDATE_BUILD').trim(),'10.6.22');
assert.equal(changelog.releases[0].version,'2.0.0');
assert.ok(changelog.releases.some(r=>r.version==='1.0.0'),'history preserved');
const gradle=read('app/build.gradle');
assert.ok(gradle.includes('versionCode 118')&&gradle.includes("versionName '2.0.0'"));
console.log('PASS 1.2: real pass chemistry, matchup marking, mental fatigue, persistent history, idempotence and safe saves');