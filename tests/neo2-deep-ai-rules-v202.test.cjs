'use strict';
/* Real-match, seeded AI and Law 11/14 penalty regression — no fake match scores. */
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
const Brain=require('../web/neo2-deep-ai-v202.js');
assert.equal(Brain.adapt(E),true,'deep strategy installed once');
assert.equal(Brain.adapt(E),false,'no stacked hooks after reinstall');

const sim=new E.Match('bm','px',20261117);
const owner=sim.players.find(p=>p.side===0&&p.i===8);
assert.ok(owner);
const opponent=sim.players.find(p=>p.side===1&&p.i===3);
const s=Brain.memory(sim);
assert.strictEqual(Brain.memory(sim),s,'per-match memory is stable');
assert.equal(s.passLanes.length,0,'no fabricated observations');
const safeMock={players:[
 {id:0,name:'Carrier',side:0,i:6,role:'MEI',x:600,y:576,attributes:{vision:87,passing:88},stamina:90},
 {id:1,name:'Free teammate',side:0,i:9,role:'CA',x:780,y:515,attributes:{positioning:87},stamina:92},
 {id:2,name:'Marked teammate',side:0,i:7,role:'MEI',x:810,y:700,attributes:{positioning:75},stamina:75},
 {id:3,name:'Defender',side:1,i:4,role:'ZAG',x:805,y:702,stamina:90}
],buildUp:['patient','direct'],score:[0,0],time:25*60,
 offside:()=>false,safeLane:(_,q)=>q.name==='Free teammate'?72:19};
const free=safeMock.players[1],marked=safeMock.players[2];
assert.ok(Brain.passScore(safeMock,safeMock.players[0],free)>Brain.passScore(safeMock,safeMock.players[0],marked),'weighted pass intelligence rewards space');
assert.strictEqual(Brain.chooseOutlet(safeMock,safeMock.players[0]).q,free,'choose unmarked receiver');
safeMock.offside=q=>q===free;
assert.notStrictEqual(Brain.chooseOutlet(safeMock,safeMock.players[0])?.q,free,'no illegal offside option');
const marker={name:'Zagueiro',role:'ZAG',side:0,x:445,y:465};
const ownerEnemy={name:'Forward',side:1,i:9,x:515,y:810};
const defense={phase:'play',players:[marker,ownerEnemy],ball:{owner:ownerEnemy},
 score:[0,0],time:1800};
const adjusted=Brain.defensiveTarget(defense,marker,{x:375,y:490},'block');
assert.ok(adjusted.x>=84&&adjusted.x<=1836&&adjusted.y>=70&&adjusted.y<=1080,'defensive target remains within field');
assert.notDeepEqual(adjusted,{x:375,y:490},'back line adjusts position to real threat');
assert.deepEqual(Brain.defensiveTarget(defense,marker,{x:375,y:490},'attack'),{x:375,y:490},'no defensive teleport in attack');
const coach={phase:'play',time:78*60,autoCoach:true,coachLocked:[false,false],
 score:[3,0],players:Array.from({length:10},(_,i)=>({side:0,i:i+1,stamina:74})),
 stats:{xg:[2.7,.4],possession:[1700,1000]},
 pressing:['high','balanced'],buildUp:['direct','balanced'],attackWidth:['wide','normal'],tactics:['attack','balanced']};
assert.deepEqual(Brain.coachingPlan(coach,0)?.stance,'defend','protect late lead');
coach.coachLocked[0]=true;assert.equal(Brain.coachingPlan(coach,0),null,'manual tactic overrides deep AI');
coach.coachLocked[0]=false;coach.score=[0,3];coach.time=48*60;
assert.equal(Brain.coachingPlan(coach,0)?.buildUp,'direct','trailing team responds early');
const report=sim.result();
assert.equal(report.neo2DeepAI.schema,2);
assert.deepEqual(report.neo2DeepAI.deepDecisions,[0,0]);

// Correct Law 11: second-last defender AND ball position, not passer alone.
const law=new E.Match('bm','px',88);
law.players=[
 {side:1,i:0,x:1810,y:576},{side:1,i:1,x:1460,y:570},{side:1,i:2,x:1230,y:495},
 {side:0,i:9,x:1520,y:576},{side:0,i:6,x:1100,y:576}
];
const receiver=law.players[3],passer=law.players[4];
law.ball.x=1580;
assert.equal(law.offside(receiver,passer),false,'receiving level with or behind the ball is onside');
law.ball.x=1210;
assert.equal(law.offside(receiver,passer),true,'ahead of second-last defender and ball is offside');
receiver.x=940;
assert.equal(law.offside(receiver,passer),false,'no offside in own half');

const results={goals:0,saves:0,misses:0,other:0};
for(let i=0;i<120;i++){
 const side=i%2,match=new E.Match('bm','px',i*133+411);
 const x=side===0?E.PITCH.right-175:E.PITCH.left+175;
 match._setRestart(side,x,E.PITCH.cy,'Pênalti');
 const goalkeeper=match.players.find(p=>p.side===1-side&&p.i===0);
 const line=side===0?E.PITCH.right:E.PITCH.left;
 assert.equal(goalkeeper.x,line,'keeper must start on goal line');
 const takerId=match.restart.takerId;
 for(const player of match.players.filter(p=>p.i!==0&&p.id!==takerId)){
  assert.ok(Math.abs(player.x-line)>E.PITCH.boxDepth,
   'every outfield player other than kicker is outside the penalty area');
  assert.ok(Math.hypot(player.x-match.restart.x,player.y-E.PITCH.cy)>152,
   'every outfield player is at least 9.15 meters from the penalty mark');
 }
 let delivered=false;
 for(let j=0;j<100;j++){
  match.step(E.TICK);
  if(match.ball.isPenalty&&match.ball.mode==='shot')delivered=true;
  if(delivered&&match.shotMap.at(-1)?.outcome!=='pending')break;
 }
 assert.equal(delivered,true,'every penalty kick is actually taken');
 const shot=match.shotMap.at(-1);
 assert.equal(shot.setPiece,'penalty');
 assert.ok(Number.isFinite(shot.xg)&&shot.xg>.65,'penalty xG calibrated');
 if(shot.outcome==='goal'){
  results.goals++;
  assert.equal(match.score[side],1,'only genuine physics can score');
  assert.equal(match.stats.penaltiesScored[side],1);
 }else if(shot.outcome==='saved')results.saves++;
 else if(shot.outcome==='missed')results.misses++;
 else results.other++;
 assert.ok(match.score[side]<=1,'penalty is never counted twice');
}
assert.ok(results.goals>=40&&results.goals<=105,'penalties should score often but never guarantee a goal: '+JSON.stringify(results));
assert.ok(results.saves>=6,'goalkeepers can still save penalties: '+JSON.stringify(results));
assert.ok(results.misses>=2,'penalty takers can still miss: '+JSON.stringify(results));
assert.equal(results.other,0,'no penalty attempt stays stuck or silently disappears: '+JSON.stringify(results));
const m1=new E.Match('ba','ub',202602),m2=new E.Match('ba','ub',202602);
for(let i=0;i<850;i++){m1.step(E.TICK);m2.step(E.TICK);}
assert.deepEqual(m1.score,m2.score,'same seed produces same score');
assert.deepEqual(m1.result().neo2DeepAI,m2.result().neo2DeepAI,'brain state deterministic');
assert.ok(m1.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'no invalid coordinates');
console.log('PASS NEO 2.0 deep AI + IFAB laws and physics: '+JSON.stringify(results));
