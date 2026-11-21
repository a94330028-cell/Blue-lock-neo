'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
require('../web/neo2-history-team-v201.js').install(E);

const clubs=['bm','px','ub','mc','ht'];
let active=E.createSchedule(2,clubs);
const first=active.rounds[0].games[0];
const match=new E.Match(first.home,first.away,94001,E.Progression.ensure(active),active);
match.runToEnd();
const initial=JSON.stringify(active);

assert.equal(E.recordFixtureTransactional(active,first,match,()=>false),null,
 'a failed write must reject the entire fixture and progression');
assert.equal(JSON.stringify(active),initial,'failed storage cannot mutate live data');
assert.equal(E.recordFixtureTransactional(active,first,match,()=>{throw Error('QuotaExceededError');}),null);
assert.equal(JSON.stringify(active),initial,'quota error cannot mutate live data');

let writes=0,serialized='';
const persist=s=>{serialized=JSON.stringify(s);writes++;return true;};
const accepted=E.recordFixtureTransactional(active,first,match,persist);
assert.ok(accepted?.season);
assert.equal(active.rounds[0].games[0].result,null,'until persisted, original reference is still pending');
active=accepted.season;
assert.deepEqual(active.rounds[0].games[0].result,match.score);
assert.equal(JSON.stringify(active),serialized,'saved season equals the snapshot made visible in UI');
assert.equal(E.recordFixtureTransactional(active,active.rounds[0].games[0],match,persist),null,
 'double-click cannot register a completed fixture twice');
assert.equal(writes,1);

// Full 10-round season: the regression at round 7 must not freeze ranks, bids
// or counters, regardless of which original fixture objects were replaced.
for(let i=0;i<active.rounds.length;i++){
 for(let j=0;j<active.rounds[i].games.length;j++){
  const fixture=active.rounds[i].games[j];
  if(fixture.result)continue;
  const sim=new E.Match(fixture.home,fixture.away,94002+i*10+j,E.Progression.ensure(active),active);
  sim.runToEnd();
  const committed=E.recordFixtureTransactional(active,fixture,sim,persist);
  assert.ok(committed,`fixture in round ${i+1} must be persisted`);
  active=committed.season;
 }
 if(i===6){
  assert.ok(E.Progression.rank(active).some(p=>p.games>=1),'career still exists at round 7');
 }
}
const games=active.rounds.flatMap(r=>r.games).filter(f=>f.result);
assert.equal(games.length,20,'all ten rounds remain playable');
const rows=E.standings(active);
assert.equal(rows.reduce((n,r)=>n+r.J,0),40,'one appearance per club per fixture');
assert.equal(rows.reduce((n,r)=>n+r.GP,0),rows.reduce((n,r)=>n+r.GC,0));
assert.equal(rows.reduce((n,r)=>n+r.V,0),rows.reduce((n,r)=>n+r.D,0));
assert.ok(rows.every(r=>r.J===8&&r.J===r.V+r.E+r.D));
assert.ok(E.Progression.rank(active).some(p=>p.games>=8),
 'players continue accruing official appearances after round 7');
for(const p of Object.values(active.career?.masterBids||{})){
 assert.ok(p.games<=8,`master ${p.name} cannot play more games than club`);
}
const regularBids=Object.values(active.career.players||{}).filter(p=>p.games>0);
assert.ok(regularBids.some(p=>p.value>0),'factual bids are persisted');

const corrupted=JSON.parse(JSON.stringify(active));
corrupted.scorers={};corrupted.assists={};corrupted.goalLog=[];
const repair=E.reconcileSeasonRecords(corrupted);
assert.equal(repair.complete,true,'a complete factual match history is recoverable');
assert.equal(repair.changed,true,'missing leaderboards are repaired');
assert.deepEqual(corrupted.scorers,active.scorers,'real scorers are recovered');
assert.deepEqual(corrupted.assists,active.assists,'real assists are recovered');
assert.deepEqual(corrupted.goalLog,active.goalLog,'goal log uses actual recorded moments');
assert.equal(E.reconcileSeasonRecords(corrupted).changed,false,'repair must be idempotent');
const incomplete=JSON.parse(JSON.stringify(active));
incomplete.rounds[0].games[0].details=null;
incomplete.scorers={'Historic Unknown|bm':77};
assert.equal(E.reconcileSeasonRecords(incomplete).complete,false);
assert.equal(incomplete.scorers['Historic Unknown|bm'],77,
 'never invent or erase legacy totals without enough evidence');
for(const master of E.Progression.masterRank(active)){
 assert.equal(master.isMaster,true);
 assert.ok(master.games>0&&master.games<=8);
}

const source=fs.readFileSync('web/app.js','utf8');
assert.match(source,/masterBidVersion!==2/,'master migration must recognize ledger v2');
assert.match(source,/function commitOfficialFixture\(/,'all UI simulation modes use a safe commit');
assert.match(source,/Tentar salvar resultado novamente/,'failed live match can retry saving');
assert.match(source,/E\.Progression\.masterRank\(season,club\)/,'desktop ranking includes real masters');
const mobile=fs.readFileSync('web/neo-mobile-ux-v111.js','utf8');
const legacyMarket=fs.readFileSync('web/neo-v960.js','utf8');
assert.doesNotMatch(mobile,/NeoCareerBridge\?\.save\?\.\(\)/,
 'mobile market must not persist a migration without first backing up the save');
assert.doesNotMatch(legacyMarket,/localStorage\.setItem\('neo-season-v2'/,
 'legacy market must remain a read-only view');
console.log('PASS NEO FOUNDATION: atomic saves, round 7+, official stats, masters and UI pipeline');
