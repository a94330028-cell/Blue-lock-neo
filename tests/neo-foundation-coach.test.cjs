'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
const Coach=require('../web/neo-coach-v980.js');
require('../web/neo2-history-team-v201.js').install(E);
globalThis.NeoCoach980=Coach;

const history=E.teamById('ht');
const originalXI=history.players.slice(),originalBench=history.reserves.slice();
function round(index,score,formation='3-3-4',rating=6.6){
 const players=history.players.map((name,i)=>({name,side:0,
  role:history.formation[i].role,rating,goals:0,assists:0}));
 return {round:index,games:[{home:'ht',away:'bm',result:score,details:{
  players,coachPlans:[{formationName:formation},{formationName:'4-3-3'}]
 }}]};
}
function season(rounds){return {schema:2,teamIds:['ht','bm'],rounds,career:{players:{}}};}
function checkPlan(plan,origin=history){
 assert.equal(plan.players.length,11);
 assert.equal(new Set(plan.players).size,11,'only unique starters');
 assert.equal(plan.players[0],origin.players[0],'keeper stays in the keeper slot');
 assert.ok(plan.changes.length<=3,'at most three new starters');
 assert.ok(plan.changes.every(c=>c.newOvr>=c.oldOvr-8),'avoid a major quality downgrade');
 assert.equal(plan.reserves.some(name=>plan.players.includes(name)),false,'no player starts and sits on the bench');
 if(plan.formation){
  assert.equal(plan.formation.length,11);
  for(let i=0;i<11;i++){
   const role=plan.formation[i].role,name=plan.players[i];
   assert.ok(Coach.compatible(role,Coach.reserveRole(origin,name)),`${name} must cover ${role}`);
  }
  for(const flank of ['PE','LE','PD','LD']){
   const role=plan.formation.find(f=>f.role===flank);
   if(role)assert.equal(flank==='PE'||flank==='LE'?role.y<.5:role.y>.5,true,
    `${flank} remains on the correct physical wing`);
  }
 }
}

const losses=[1,2,3].map(i=>round(i,[0,3]));
const original=season(losses);
const plan=Coach.planLineup(history,original,E.Attr);
assert.equal(plan.form.streak,3);
assert.equal(plan.formationName,'3-4-3',
 'three History defeats must produce a feasible alternative, not silently discard every lineup');
assert.equal(plan.formationChanged,true);
assert.ok(plan.changes.some(c=>c.out==='Zenkai'&&c.in==='Taiju'),
 'switching from four attackers to three promotes an actual midfielder');
checkPlan(plan);

const actual=new E.Match('ht','bm',552003,E.Progression.ensure(original),original);
assert.equal(actual.coachPlans[0].formationName,'3-4-3');
assert.deepEqual(actual.startingLineups[0].map(p=>p.name),plan.players);
assert.deepEqual(actual.startingLineups[0].map(p=>p.role),plan.formation.map(p=>p.role));
assert.deepEqual(history.players,originalXI,'the permanent roster is not destructively rewritten');
assert.deepEqual(history.reserves,originalBench);

const successful=season([...losses,round(4,[3,0],'3-4-3')]);
const winning=Coach.planLineup(history,successful,E.Attr);
assert.equal(winning.formationName,'3-4-3',
 'a formation that finally wins must not be thrown away automatically');
checkPlan(winning);

const failed=season([...losses,round(4,[0,3],'3-4-3')]);
const reacting=Coach.planLineup(history,failed,E.Attr);
assert.ok(reacting.formationName&&reacting.formationName!=='3-4-3',
 'a failed experiment must allow the coach to try a different viable formation');
checkPlan(reacting);

// History is not a special-case: regular NEL teams should be able to change
// shapes while preserving the registered XI and positions.
for(const id of ['bm','ba','px']){
 const team=E.teamById(id),starting=team.players.slice();
 const previous=[1,2,3].map(i=>({round:i,games:[{home:id,away:'ub',result:[0,3],details:{
  coachPlans:[{formationName:team.formationName}],
  players:starting.map((name,j)=>({name,side:0,role:team.formation[j].role,rating:j%2?5.5:6.1}))
 }}]}));
 const next=Coach.planLineup(team,season(previous),E.Attr);
 if(id==='bm'||id==='ba')assert.equal(next.formationChanged,true,
  `${id} should change shape even with reserves below an arbitrary OVR 80 cutoff`);
 else assert.ok(next.formationChanged||next.changes.length,
  `${id} must at least rotate underperformers when an alternative XI is unavailable`);
 checkPlan(next,team);
 assert.deepEqual(team.players,starting,`${id} original XI remains intact`);
}

// No synthetic defeat can be inferred from a fixture that never finished.
const unplayed=season([{round:1,games:[{home:'ht',away:'bm',result:null}]}]);
const quiet=Coach.planLineup(history,unplayed,E.Attr);
assert.equal(quiet.formationChanged,undefined);
assert.deepEqual(quiet.players,history.players);
console.log('PASS NEO FOUNDATION COACH: formation switches, win retention, failed tactic retries, role and OVR integrity');
