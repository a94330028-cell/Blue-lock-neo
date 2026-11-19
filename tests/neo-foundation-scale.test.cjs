'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const Coach=require('../web/neo-coach-v980.js');
require('../web/neo2-history-team-v201.js').install(E);
globalThis.NeoCoach980=Coach;

const ids=E.allTeams().map(t=>t.id);
assert.equal(ids.includes('ht'),true,'History participates in official league formats');

// Exhaust every available league size and format, including odd-team byes.
for(let count=2;count<=ids.length;count++)for(const meetings of [2,4,6]){
 const league=E.createSchedule(meetings,ids.slice(0,count));
 const expectedRounds=(count%2?count:count-1)*meetings;
 const expectedMatches=count*(count-1)*meetings/2;
 assert.equal(league.rounds.length,expectedRounds,`${count} clubs, ${meetings} meetings: rounds`);
 assert.equal(league.rounds.flatMap(r=>r.games).length,expectedMatches);
 const opponents=new Map();
 for(const round of league.rounds){
  const seen=new Set();
  for(const fixture of round.games){
   assert.notEqual(fixture.home,fixture.away);
   assert.equal(seen.has(fixture.home),false,`club ${fixture.home} duplicated in round ${round.round}`);
   assert.equal(seen.has(fixture.away),false,`club ${fixture.away} duplicated in round ${round.round}`);
   seen.add(fixture.home);seen.add(fixture.away);
   const key=[fixture.home,fixture.away].sort().join('|');
   const sides=opponents.get(key)||[0,0];
   sides[ids.indexOf(fixture.home)<ids.indexOf(fixture.away)?0:1]++;
   opponents.set(key,sides);
  }
  assert.equal(round.games.length,Math.floor(count/2));
 }
 assert.equal(opponents.size,count*(count-1)/2);
 for(const sides of opponents.values())assert.deepEqual(sides,[meetings/2,meetings/2],
  `home/away balance for ${count} clubs and ${meetings} fixtures`);
}

// Three fixture slots remain part of a single click, but no team may appear
// twice in a simultaneous wave; later-round matches see fresh coach history.
const odd=E.createSchedule(2,ids.slice(0,5));
const triple=odd.rounds.flatMap(r=>r.games.map(f=>({f,round:r.round}))).slice(0,3);
const waves=E.planFixtureWaves(triple);
assert.deepEqual(waves.map(w=>w.length),[2,1],
 'five-club league: first round finishes before next-round third match');
assert.deepEqual(waves.flat(),triple,'the requested three games remain in exact schedule order');
const collision=[
 {f:{home:'ht',away:'bm'},round:1},
 {f:{home:'ht',away:'px'},round:1},
 {f:{home:'ub',away:'mc'},round:1}
];
assert.deepEqual(E.planFixtureWaves(collision).map(w=>w.length),[1,2]);
for(const wave of E.planFixtureWaves(collision)){
 const members=wave.flatMap(({f})=>[f.home,f.away]);
 assert.equal(new Set(members).size,members.length,'a club cannot play on two pitches at once');
}

// A real twenty-round, six-team season: each match exercises the authentic
// engine, the transaction, standings, coach decisions, bids and factual reports.
let league=E.createSchedule(4,ids);
let writes=0;
let previousTotals={games:0,goals:0};
for(let i=0;i<league.rounds.length;i++){
 const round=league.rounds[i];
 for(let j=0;j<round.games.length;j++){
  const official=league.rounds[i].games[j];
  const sim=new E.Match(official.home,official.away,831000+i*10+j,E.Progression.ensure(league),league);
  sim.rollGameplan();sim.runToEnd();
  const committed=E.recordFixtureTransactional(league,official,sim,()=>{writes++;return true;});
  assert.ok(committed,`round ${i+1}, match ${j+1} commits once`);
  league=committed.season;
  assert.deepEqual(league.rounds[i].games[j].result,sim.score);
  assert.equal(league.rounds[i].games[j].details.players.length>0,true);
  assert.equal(league.rounds[i].games[j].details.coachPlans.length,2);
 }
 const played=league.rounds.flatMap(r=>r.games).filter(f=>Array.isArray(f.result));
 const totalGoals=played.reduce((n,f)=>n+f.result[0]+f.result[1],0);
 const ranked=E.standings(league);
 assert.equal(ranked.reduce((n,r)=>n+r.J,0),played.length*2);
 assert.equal(ranked.reduce((n,r)=>n+r.GP,0),totalGoals);
 assert.equal(ranked.reduce((n,r)=>n+r.GC,0),totalGoals);
 assert.equal(ranked.reduce((n,r)=>n+r.V,0),ranked.reduce((n,r)=>n+r.D,0));
 assert.ok(played.length>previousTotals.games);
 assert.ok(totalGoals>=previousTotals.goals,'total goals never decrease across rounds');
 previousTotals={games:played.length,goals:totalGoals};
}
assert.equal(writes,60);
assert.equal(league.rounds.length,20);
const standings=E.standings(league);
assert.ok(standings.every(r=>r.J===20&&r.J===r.V+r.E+r.D));
assert.equal(E.reconcileSeasonRecords(league).complete,true);
assert.equal(E.reconcileSeasonRecords(league).changed,false,'20-round facts stay consistent');
assert.ok(E.Progression.rank(league).some(p=>p.games>=20));
for(const master of E.Progression.masterRank(league)){
 assert.ok(master.games<=20,`${master.name}: at most one appearance per team match`);
}
for(const round of league.rounds)for(const fixture of round.games){
 const entries=fixture.details?.masterEntries||[];
 const perSide=new Map();
 for(const entry of entries){
  const side=entry.side;
  perSide.set(side,(perSide.get(side)||0)+1);
 }
 assert.ok([...perSide.values()].every(n=>n<=1),
  'each side can use its master only once in a match');
}
const ui=fs.readFileSync('web/app.js','utf8');
assert.match(ui,/const waves=E\.planFixtureWaves\(slots\)/);
assert.match(ui,/slot\.game=new Match\(/);
assert.match(ui,/if\(cancelSim\)break;/);
console.log('PASS NEO FOUNDATION SCALE: 2–6 clubs, 2/4/6 encounters, 60 true matches, 3 safe live pitches, coaches and Masters');
