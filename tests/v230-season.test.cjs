'use strict';
/* Blue Lock NEO: entire twenty-round championship and save integrity.
 * 40 authentic Match.runToEnd() games (no mocked placards or invented scorers).
 */
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
const A=require('../web/neo-advanced-v200.js');
const U=require('../web/neo-universe-v220.js');
const T=require('../web/neo-twelve-v230.js');
assert.equal(A.adapt(E),true);
assert.equal(U.adapt(E),true);
assert.equal(T.adapt(E),true);

const orig=JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves})));
const season=E.createSchedule(4);
E.Progression.ensure(season);
assert.equal(season.rounds.length,20,'League must have exactly twenty rounds');
assert.equal(season.rounds.reduce((sum,round)=>sum+round.games.length,0),40,'20 rounds of five clubs = 40 official games');
const seed=772016;
let games=0,goals=0,ties=0,clean=0,late=0,observations=0,successfulPasses=0;
const events={};
const winners=new Set();
const ratings=[];
const samples=[];
for(const round of season.rounds){
 for(const fixture of round.games){
  const currentSeed=seed+round.round*10003+games*409;
  const match=new E.Match(fixture.home,fixture.away,currentSeed,season.career,season);
  const result=match.runToEnd();
  assert.equal(match.finished,true,'game must finish without forcefully inventing scores');
  assert.equal(match.phase,'finished');
  assert.deepEqual(result.score,match.score);
  assert.ok(result.score.every(n=>Number.isInteger(n)&&n>=0&&n<40),'scores always finite and plausible');
  assert.ok(match.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&
    Number.isFinite(p.stamina)&&p.stamina>=0&&p.stamina<=100),'player coordinates and stamina stay bounded');
  assert.equal(result.ego230.events.length<=45,true);
  assert.equal(result.ego230.schema,1);
  assert.ok(result.ego230.chemistry.length<=9,'compact save history');
  assert.ok(result.shots.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)));
  assert.ok(result.stats.offsides.every(v=>Number.isInteger(v)&&v>=0));
  const saved=E.recordFixture(season,fixture,match);
  assert.equal(saved,true,'official fixture was saved');
  assert.equal(E.recordFixture(season,fixture,match),false,'a second save cannot double-score');
  assert.deepEqual(fixture.result,result.score);
  assert.deepEqual(fixture.details.score,result.score);
  assert.ok(Array.isArray(fixture.details.ego230?.events),'true Ego event history is saved');
  assert.ok(Array.isArray(fixture.details.neoAdvanced?.events),'older real-event history is preserved');
  if(result.score[0]>result.score[1])winners.add(fixture.home);
  if(result.score[0]<result.score[1])winners.add(fixture.away);
  if(result.score[0]===result.score[1])ties++;
  if(result.score.includes(0))clean++;
  if(result.score.reduce((s,x)=>s+x,0)>7)late++;
  for(const ev of result.ego230.events)events[ev.idea]=(events[ev.idea]||0)+1;
  for(const player of result.players){
   if(player.isMaster)continue;
   assert.ok(Number.isFinite(player.rating)&&player.rating>=0&&player.rating<=10);
   ratings.push(player.rating);
  }
  goals+=result.score[0]+result.score[1];
  observations+=result.ego230.events.length;
  successfulPasses+=result.ego230.completedConnections;
  games++;
 }
 const standings=E.standings(season);
 assert.equal(standings.reduce((s,row)=>s+row.J,0),games*2);
 assert.equal(standings.reduce((s,row)=>s+row.GP,0),goals);
 assert.equal(standings.reduce((s,row)=>s+row.GC,0),goals);
 assert.equal(standings.reduce((s,row)=>s+row.SG,0),0);
 const size=Buffer.byteLength(JSON.stringify(season),'utf8');
 samples.push({round:round.round,games,size});
 assert.ok(size<4_650_000,'season localStorage save exceeds safe 4.65MB: '+size);
}
assert.equal(games,40);
const standing=E.standings(season);
for(const row of standing)assert.equal(row.J,16,'each club plays 16 matches');
assert.equal(U.isFinal(season),true,'no champion until entire season is complete');
assert.equal(U.completed(season).length,40);
assert.equal((season.career.neoLegacy?.matches||[]).length,40);
assert.equal(Object.keys(season.career.neo230Recorded||{}).length,40);
assert.ok(season.career.neoLegacy?.hall?.length,'season championship must have a verified winner');
assert.ok(season.career.neoLegacy?.awards?.length,'end of season honours only after actual completed fixtures');
assert.equal(season.goalLog.length,goals,'every real goal has a history record');
assert.equal(standing.reduce((s,row)=>s+row.GP,0),goals);
assert.equal(JSON.stringify(E.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves}))),orig,'base team rosters are untouched');
const finalBytes=Buffer.byteLength(JSON.stringify(season),'utf8');
const summary={rounds:20,fixtures:games,goals,goalsPerMatch:+(goals/games).toFixed(2),
 draws:ties,shutouts:clean,highScoring:late,clubsWithWins:winners.size,
 totalRecordedEgoEvents:observations,completedPasses:successfulPasses,
 ratingAverage:+(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(2),
 saveBytes:finalBytes,saveMB:+(finalBytes/1024/1024).toFixed(3),egoIdeas:events,
 points:standing.map(s=>({club:s.team.id,played:s.J,points:s.PTS,goals:s.GP,conceded:s.GC}))};
console.log('SEASON-BALANCE-REPORT '+JSON.stringify(summary));
console.log('PASS full league: 20 rounds, 40 completed and saved games, no duplicate progress, coherent table, verified trophies, bounded save');
