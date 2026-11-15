/* Deterministic tests for Blue Lock NEO 9.1. Run: node tests/neo-v91.test.js */
'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
const C=require('../web/neo-ego-v91.js');
const season=E.createSchedule(10);
const fixtures=season.rounds[0].games.slice(0,2);
for(let i=0;i<fixtures.length;i++){
 const f=fixtures[i],m=new E.Match(f.home,f.away,55000+i*78123,E.Progression.ensure(season));
 m.rollGameplan();const r=m.runToEnd();
 assert(m.finished,'The simulation must terminate');
 assert.equal(r.shots.length,r.stats.shots.reduce((a,b)=>a+b,0),'Every shot must have a matching event');
 assert.equal(r.goalRecords.length,r.score.reduce((a,b)=>a+b,0),'Only real simulated goals count');
 assert(r.shots.every(x=>typeof x.xg==='number'&&typeof x.outcome==='string'),'Shots must store xG and outcome');
 assert(r.shots.every(x=>x.xg>=0&&x.xg<=1),'xG must be a probability');
 assert(r.duelHistory.every(d=>d.attacker&&d.defender&&d.winner),'Duels must name participants and winner');
 assert(r.stats.onTarget.every((v,side)=>v<=r.stats.shots[side]),'On-target shots cannot exceed total shots');
 assert(E.recordFixture(season,f,m),'The fixture must be recorded');
 assert(!E.recordFixture(season,f,m),'Recording the same fixture twice must be idempotent');
}
assert.equal(C.fixtures(season).length,fixtures.length,'Only completed fixtures enter history');
assert.equal(C.challenges(season).length,10,'All challenges are defined');
assert.equal(C.awards(season).length,8,'All award categories are defined');
assert(C.news(season).length>0,'Recorded fixtures produce a real journal');
assert(C.rivalries(season).length>0,'Recorded fixtures produce team rivalries');
assert(C.playerDuels(season).length>0,'Physical confrontations produce real player duels');
assert(C.tacticalPatterns(season).length>0,'Gameplans used in fixtures produce tactical history');
assert(C.archiveSummary(season).played===fixtures.length,'The Hall of Fame snapshot uses actual results');
const html=C.markup(season);
assert(html.summary.includes('Partidas')&&html.chalHTML.includes('Hat-trick'));
console.log('PASS: Blue Lock NEO 9.1 — physics-derived shots, duels, records, awards, challenges, archive, no double-scoring');
