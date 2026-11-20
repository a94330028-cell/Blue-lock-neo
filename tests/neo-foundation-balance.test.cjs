'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
require('../web/neo2-history-team-v201.js').install(E);

// Reproducible engine-level calibration: never adjust the scoring odds solely
// because an unlucky isolated screenshot shows a scoreless game. These are
// 40 authentic matches spanning the five original clubs and History FC.
const pairs=[['bm','px'],['ba','ub'],['mc','ht'],['ht','bm'],['bm','ub']];
const rows=[],all={games:0,goals:0,assists:0,shots:0,penalties:0};
let historyWins=0,historyGames=0;
for(const [home,away] of pairs){
 const row={home,away,games:0,goals:0,assists:0,shots:0,penalties:0};
 for(let i=0;i<8;i++){
  const game=new E.Match(home,away,991000+i*113);
  game.rollGameplan();game.runToEnd();
  const report=game.result(),goals=report.score[0]+report.score[1],
   assists=report.goalRecords.filter(record=>record.assister).length,
   shots=report.stats.shots[0]+report.stats.shots[1],
   penalties=report.stats.penalties[0]+report.stats.penalties[1];
  assert.equal(report.goalRecords.length,goals,'goal log must match the scoreboard');
  assert.equal(report.players.reduce((n,p)=>n+(p.goals||0),0),goals,
   'official goals only belong to actual footballers');
  assert.equal(report.players.reduce((n,p)=>n+(p.assists||0),0),assists,
   'ranked assists must equal real completed play-to-goal sequences');
  for(const moment of report.goalRecords){
   assert.ok(report.players.some(p=>p.side===moment.side&&p.name===moment.scorer),
    'the goal scorer belongs to the scoring team');
   if(moment.assister){
    assert.notEqual(moment.assister,moment.scorer);
    assert.ok(report.players.some(p=>p.side===moment.side&&p.name===moment.assister),
     'assist attribution must stay within the scoring team');
   }
   if(moment.setPiece==='penalty')assert.equal(moment.assister,null,
    'a direct penalty never credits an invented assist');
  }
  assert.ok(shots>=goals,'a goal must come from a genuine attempt');
  if(home==='ht'||away==='ht'){
   historyGames++;
   if(home==='ht'?report.score[0]>report.score[1]:report.score[1]>report.score[0])historyWins++;
  }
  row.games++;row.goals+=goals;row.assists+=assists;row.shots+=shots;row.penalties+=penalties;
  all.games++;all.goals+=goals;all.assists+=assists;all.shots+=shots;all.penalties+=penalties;
 }
 rows.push(row);
}
const goalsPerMatch=all.goals/all.games,assistedShare=all.assists/all.goals;
assert.ok(goalsPerMatch>=2.4&&goalsPerMatch<=7.0,
 `40-match calibration: ${goalsPerMatch.toFixed(2)} goals/game must stay lively without turning into basketball`);
assert.ok(assistedShare>=.50&&assistedShare<=.95,
 `goal-assist attribution ${assistedShare.toFixed(2)} must represent genuine teamwork`);
assert.ok(all.shots/all.games>=9&&all.shots/all.games<=25,
 'shot volume must remain credible');
assert.ok(historyWins>=9&&historyWins<historyGames,
 `the stronger History must matter (${historyWins}/${historyGames}) without guaranteed wins`);

// Player differences are relative, capped and observable in *football* duels,
// not a hidden automatic goal assigned because a club has a famous name.
const duel=new E.Match('ht','bm',880001);
assert.ok(duel._overallDuelEdge({attributes:{ovr:96}},{attributes:{ovr:65}})>0);
assert.ok(duel._overallDuelEdge({attributes:{ovr:65}},{attributes:{ovr:96}})<0);
assert.equal(duel._overallDuelEdge({attributes:{ovr:99}},{attributes:{ovr:1}}),.14);
assert.equal(duel._overallDuelEdge({attributes:{ovr:1}},{attributes:{ovr:99}}),-.14);
for(const p of duel.players)p.attributes.ovr=p.side===0?95:65;
assert.equal(duel._qualityEdge(0),1);
assert.equal(duel._qualityEdge(1),-1);

// Penalty regression: actual kicks must have nonzero, credible conversion,
// proper score/shot bookkeeping, and never award an artificial assist.
const penalties={attempts:60,onTarget:0,goals:0,saved:0};
for(let i=0;i<penalties.attempts;i++){
 const m=new E.Match('bm','px',783000+i);
 m._setRestart(0,E.PITCH.right-105,E.PITCH.cy,'Pênalti');
 m._performRestart();
 for(let tick=0;tick<240&&!m.finished&&m.shotMap[0]?.outcome==='pending';tick++)m.step(E.TICK);
 const shot=m.shotMap[0];
 assert.ok(shot&&shot.outcome!=='pending','penalty must resolve, not disappear');
 penalties.onTarget+=Number(shot.onTarget);
 penalties.saved+=Number(shot.outcome==='saved');
 penalties.goals+=m.score[0];
 assert.equal(m.stats.penaltiesScored[0],m.score[0]);
 if(m.score[0]){
  assert.equal(shot.goal,true);
  assert.equal(m.goalRecords[0]?.setPiece,'penalty');
  assert.equal(m.goalRecords[0]?.assister,null);
 }
}
assert.ok(penalties.goals>=33&&penalties.goals<=57,
 `60 realistic penalty kicks: ${penalties.goals} converted`);

// Identical seed + lineup stays repeatable for future balancing comparisons.
const seeded=()=>{
 const match=new E.Match('ht','mc',81819);match.rollGameplan();match.runToEnd();
 return {score:match.score,goals:match.goalRecords.map(g=>[g.scorer,g.assister]),shots:match.stats.shots};
};
assert.deepEqual(seeded(),seeded());
console.log('PASS NEO FOUNDATION BALANCE:',JSON.stringify({
 games:all.games,goalsPerMatch:+goalsPerMatch.toFixed(2),assistedShare:+assistedShare.toFixed(2),
 shotsPerMatch:+(all.shots/all.games).toFixed(2),historyWins:historyWins+'/'+historyGames,
 penaltyConversion:penalties.goals+'/'+penalties.attempts,
 pairGoals:rows.map(r=>[r.home+'-'+r.away,+(r.goals/r.games).toFixed(2)])
}));
