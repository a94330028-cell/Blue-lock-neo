'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
const Coach=require('../web/neo-coach-v980.js');
require('../web/neo2-history-team-v201.js').install(E);
globalThis.NeoCoach980=Coach;

function game(minute=43,score=[2,0]){
 const m=new E.Match('ht','bm',70043);
 m.masterRoll=[1,1]; // Isolate coaching from the independent Master entry draw.
 m.phase='play';m.time=minute*60;m.score=score.slice();m.ball.owner=null;m.lastCoachCheck=-900;
 for(const p of m.players){p.rating=7.5;p.stamina=96;}
 return m;
}
const starter=m=>m.players.find(p=>p.side===0&&p.name==='Zenkai');

// A starting grade is 6.0. No goal, key pass or defensive action by halftime
// is poor enough to consider rotation; do not require an impossible <6 grade.
const poor=game();
const weak=starter(poor);
weak.rating=6.0;
assert.equal(poor._substitutionNeed(weak,2,43).poor,true);
assert.equal(poor._substitutionNeed(weak,2,30).poor,false,
 'no player is condemned on the opening thirty minutes alone');
assert.equal(poor._substitutionNeed({...weak,rating:7.3},2,43).poor,false);
poor._coachDecisions();
const planned=poor.pendingSubs[0];
assert.ok(planned?.some(p=>p.id===weak.id&&p.reserve==='Hao'),
 'even a winning team must bench its ineffective striker when a natural reserve exists');
assert.ok(poor.coachDecisions.some(c=>c.type==='substitution-plan'&&
  c.reason.includes('abaixo do rendimento')&&c.changes.some(x=>x.out==='Zenkai'&&x.in==='Hao')));
poor._applyPendingSubs();
assert.equal(weak.name,'Hao');
assert.equal(poor.stats.substitutions[0],1);
assert.equal(poor.subWindowsUsed[0],1);
assert.ok(poor.retiredPlayers.some(p=>p.name==='Zenkai'),
 'original player match statistics remain in the official match sheet');

// A fit, well-performing team in the lead must not burn a substitution simply
// because it reached minute 61. Fatigued starters are different.
const healthy=game(63,[1,0]);healthy._coachDecisions();
assert.equal(healthy.pendingSubs[0],null);
const tired=game(63,[1,0]);
const g=tired.players.find(p=>p.side===0&&p.name==='Gb');
g.stamina=58;
assert.equal(tired._substitutionNeed(g,1,63).exhausted,true);
tired._coachDecisions();
assert.ok(tired.pendingSubs[0]?.some(sub=>sub.id===g.id),
 'tired midfielder can be replaced on a winning team without inventing poor ratings');

// Current high-OVR stars cannot be sacrificed for an arbitrary low-rated
// reserve, even if their individual match rating happens to be disappointing.
const protect=game();
const superstar=starter(protect);superstar.rating=6.0;
protect.teams[0].reserves=['Benedict Grim'];
protect.teams[0].reserveRoles={...protect.teams[0].reserveRoles,'Benedict Grim':'CA'};
assert.ok(E.Attr.generate('Benedict Grim','CA',superstar.i).ovr<superstar.attributes.ovr-10);
protect._coachDecisions();
assert.equal(protect.pendingSubs[0],null,
 'a badly rated 90 OVR striker is still better than a vastly weaker available reserve');

// The ball carrier may temporarily be ineligible at a stoppage. The change
// must stay queued, not vanish forever or consume a substitution window.
const delayed=game(53,[0,2]);const out=starter(delayed);
delayed.pendingSubs[0]=[{id:out.id,reserve:'Hao',reason:'nota baixa'}];
delayed.ball.owner=out;
delayed._applyPendingSubs();
assert.equal(delayed.pendingSubs[0]?.length,1);
assert.equal(out.name,'Zenkai');
assert.equal(delayed.subWindowsUsed[0],0);
delayed.ball.owner=null;delayed._applyPendingSubs();
assert.equal(delayed.pendingSubs[0],null);
assert.equal(out.name,'Hao');
assert.equal(delayed.subWindowsUsed[0],1);

const cap=game(83,[0,2]);const capped=starter(cap);
cap.subWindowsUsed[0]=3;cap.pendingSubs[0]=[{id:capped.id,reserve:'Hao'}];
cap._applyPendingSubs();
assert.equal(capped.name,'Zenkai');
assert.equal(cap.subWindowsUsed[0],3,
 'a postponed substitution must not create an illegal fourth match window');

const halftime=game(45,[0,1]);const bench=starter(halftime);
halftime.phase='halftime';halftime.pendingSubs[0]=[{id:bench.id,reserve:'Hao'}];
halftime._applyPendingSubs();
assert.equal(bench.name,'Hao');
assert.equal(halftime.subWindowsUsed[0],0,
 'substitutions during halftime must not consume any of three in-play windows');

// Pending Master and ordinary substitutions can share a stoppage. The reserve
// cannot inherit isMaster=true or appear as a phantom Master in the rankings.
const concurrent=new E.Match('bm','px',54114);
concurrent.phase='play';concurrent.time=54*60;
concurrent.ball.owner=concurrent.players.find(p=>p.name==='Michael Kaiser');
const isagi=concurrent.players.find(p=>p.name==='Yoichi Isagi');
concurrent.pendingSubs[0]=[{id:isagi.id,out:isagi.name,reserve:'Benedict Grim'}];
concurrent.pendingMasters[0]=true;
concurrent._applyPendingSubs();
assert.equal(concurrent.subRecords[0]?.in,'Benedict Grim');
assert.equal(concurrent.masterEntries[0]?.master,'Noel Noa');
assert.equal(concurrent.masterEntries[0]?.out,'Benedict Grim');
assert.equal(concurrent.players.find(p=>p.name==='Noel Noa')?.isMaster,true);
concurrent.time=concurrent.masterStates[0].record.until+1;
concurrent.ball.owner=null;concurrent._updateMasters(true);
const restored=concurrent.players.find(p=>p.name==='Benedict Grim');
assert.ok(restored&&!restored.isMaster,
 'ordinary reserve returns as an ordinary player after the Master leaves');

const deferredMaster=new E.Match('bm','px',54115);
deferredMaster.phase='play';deferredMaster.time=54*60;
deferredMaster.ball.owner=deferredMaster.players.find(p=>p.name==='Michael Kaiser');
assert.equal(deferredMaster._masterEntry(0),true);
const master=deferredMaster.masterStates[0].player;
const original=deferredMaster.masterStates[0].record.out;
assert.equal(original,'Yoichi Isagi');
assert.equal(deferredMaster._makeSubstitution(0,master,'Benedict Grim'),false,
 'a Master is never a legal regular substitution target');
deferredMaster.pendingSubs[0]=[{id:master.id,out:original,reserve:'Benedict Grim'}];
deferredMaster.ball.owner=null;
deferredMaster._applyPendingSubs();
assert.equal(deferredMaster.pendingSubs[0]?.length,1,
 'ordinary substitution waits for the Master window to end');
deferredMaster.time=deferredMaster.masterStates[0].record.until+1;
deferredMaster._applyPendingSubs();
assert.ok(deferredMaster.players.some(p=>p.name==='Benedict Grim'&&!p.isMaster));
assert.equal(deferredMaster.subRecords.length,1);
assert.equal(deferredMaster.masterEntries.length,1);
assert.equal(deferredMaster.masterEntries[0].master,'Noel Noa');

const chasing=game(35,[0,2]);chasing._coachDecisions();
assert.equal(chasing.tactics[0],'attack');
assert.equal(chasing.pressing[0],'high');
assert.equal(chasing.buildUp[0],'direct');
assert.ok(chasing.coachDecisions.some(x=>x.type==='tactic'&&x.reason.includes('desvantagem')));
const locked=game(35,[0,2]);locked.coachLocked[0]=true;locked._coachDecisions();
assert.equal(locked.tactics[0],'balanced',
 'a manually locked coach cannot override the player-selected match tactics');
const defending=game(79,[3,0]);defending._coachDecisions();
assert.equal(defending.tactics[0],'defend');
assert.equal(defending.buildUp[0],'patient');
const lateDraw=game(80,[1,1]);lateDraw._coachDecisions();
assert.equal(lateDraw.tactics[0],'attack','coach can push for a late winning goal');

// Existing maximum-five and legal-position constraints must still hold through
// the new automatic decision mechanism on a fully simulated official match.
const actual=new E.Match('ht','bm',44331);actual.rollGameplan();actual.runToEnd();
const report=actual.result();
assert.ok(report.substitutions.length<=10);
for(const side of [0,1]){
 assert.ok(actual.subsUsed[side]<=5);
 assert.ok(actual.subWindowsUsed[side]<=3);
 const entries=report.substitutions.filter(sub=>sub.side===side);
 assert.equal(entries.length,actual.subsUsed[side]);
 assert.equal(new Set(entries.map(x=>x.in)).size,entries.length);
}
console.log('PASS NEO FOUNDATION IN-MATCH COACH: ratings, tactical substitutions, OVR limits, pending retry, halftime windows');
