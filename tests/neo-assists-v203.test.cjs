'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js');

function goalScenario({penalty=false,pass=true,selfPass=false,stale=false}={}){
  const m=new E.Match('bm','px',20261117);
  const passer=m.players.find(p=>p.side===0&&p.i===8);
  const scorer=m.players.find(p=>p.side===0&&p.i===9);
  m.ball.by=scorer;
  m.ball.isPenalty=penalty;
  if(pass)m.lastPass={p:selfPass?scorer:passer,side:0,time:m.time-(stale?136:0)};
  m._goal(0);
  return {m,passer,scorer,record:m.goalRecords[0]};
}

const normal=goalScenario();
assert.equal(normal.passer.assists,1,'a completed build-up pass can generate an assist');
assert.equal(normal.record.assister,normal.passer.name);
assert.equal(normal.scorer.goals,1);
for(const variant of [{penalty:true},{pass:false},{selfPass:true},{stale:true}]){
  const result=goalScenario(variant);
  assert.equal(result.record.assister,null,'penalties, solo goals and expired passes grant no assist');
  assert.equal(result.passer.assists,0,'no invisible assist may inflate player valuation');
}

const aerial=new E.Match('bm','px',20261117);
const crosser=aerial.players.find(p=>p.side===0&&p.i===8);
const receiver=aerial.players.find(p=>p.side===0&&p.i===9);
for(const p of aerial.players){p.x=200;p.y=100;}
crosser.x=1550;crosser.y=E.PITCH.cy;
Object.assign(aerial.ball,{x:crosser.x,y:crosser.y,by:crosser,to:receiver,crossType:'high',mode:'air'});
aerial.lastPass={p:crosser,side:0,time:aerial.time};
aerial.random=()=>.5;
assert.equal(aerial._aerialChallenge(aerial.ball),false,'the crosser cannot head the ball at its starting point');
assert.equal(aerial.stats.headers[0],0);
receiver.x=1552;receiver.y=E.PITCH.cy;
assert.equal(aerial._aerialChallenge(aerial.ball),true,'another player can contest the actual cross');
assert.equal(aerial.stats.headers[0],1);
assert.equal(aerial.shotMap[0].shooter,receiver.name);
assert.equal(aerial.lastPass.p,crosser,'crossing player retains potential assist credit');

const season=E.createSchedule(2,['bm','px']);
const fixture=season.rounds[0].games[0];
const match=new E.Match(fixture.home,fixture.away,513,E.Progression.ensure(season),season);
const helper=match.players.find(p=>p.side===0&&p.i===8);
const finisher=match.players.find(p=>p.side===0&&p.i===9);
match.ball.by=finisher;match.lastPass={p:helper,side:0,time:match.time};
match._goal(0);match.finish();
assert.equal(E.recordFixture(season,fixture,match),true);
assert.equal(season.assists[helper.name+'|'+fixture.home],1,'league table records the real assist');
assert.equal(season.goalLog[0].assister,helper.name,'goal log shows who assisted');
assert.equal(fixture.details.players.find(p=>p.name===helper.name&&p.side===0).assists,1);

console.log('PASS: real assisted goals, no false penalty assists, cross receiver and League assist records');
