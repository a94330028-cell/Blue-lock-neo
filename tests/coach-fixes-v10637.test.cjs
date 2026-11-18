'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const C=require('../web/neo-coach-v980.js');
const History=require('../web/neo2-history-team-v201.js');
History.install(E);
global.NeoCoach980=C;

const team=E.teamById('ht');
const starting=team.players.slice(),reserves=team.reserves.slice();
function fixture(round,result,weak={Gb:5,Fuyuki:5.4}){
 const players=starting.map((name,i)=>({name,side:0,role:team.formation[i].role,
  rating:weak[name]??7.3,passes:18,goals:0}));
 return {home:'ht',away:round%2?'bm':'px',result,details:{players}};
}
const poorSeason={schema:2,teamIds:['ht','bm','px'],rounds:[
 {round:1,games:[fixture(1,[1,3])]},
 {round:2,games:[fixture(2,[0,2])]}
],career:{players:{}}};

// Regression from the mobile screenshot: History must use its actual NEL
// fixtures, even though it is not one of the five original NEL clubs.
const context=C.contextFor(team,poorSeason,[{id:'cup',teams:['ht'],rounds:[]}]);
assert.equal(context,poorSeason,'new club uses its league results before any cup');
assert.equal(C.form(context,'ht').played,2);
assert.equal(C.form(context,'ht').streak,2);
assert.equal(C.form(context,'ht').lossesLast3,2);
assert.equal(C.perf('Gb',team,context).rating,5);
assert.equal(C.perf('Gb',team,context).poor,true);
assert.deepEqual(C.recentRatings('Gb','ht',context),[5,5]);
const plan=C.planLineup(team,context,E.Attr);
assert.ok(plan.form.underPressure,'two genuine losses trigger a coach review');
assert.ok(plan.changes.some(x=>['Gb','Fuyuki'].includes(x.out)),
 'badly rated History starters actually go to the bench');
assert.ok(plan.changes.every(x=>C.compatible(x.role,C.reserveRole(team,x.in))),
 'any replacements must be in a compatible position');
assert.ok(plan.changes.every(x=>x.oldOvr-x.newOvr<=8),
 'no extreme OVR downgrade is allowed');
assert.equal(plan.players[0],'Gin','coach does not move the goalkeeper out of position');
assert.equal(new Set(plan.players).size,11);
for(const change of plan.changes){
 assert.ok(plan.reserves.includes(change.out),'benched starter returns to reserve list');
 assert.ok(!plan.reserves.includes(change.in),'promoted reserve is removed from bench');
}
const match=new E.Match('ht','bm',1234,E.Progression.ensure(context),context);
assert.deepEqual(match.teams[0].players,plan.players,
 'the actual football simulation must start with the coached XI');
assert.ok(match.startingLineups[0].some(p=>plan.changes.some(x=>x.in===p.name)));
assert.deepEqual(team.players,starting,'the original registered squad is preserved');
assert.deepEqual(team.reserves,reserves);

// Winning teams still rotate individually poor starters: it cannot depend
// exclusively on a two-loss streak.
const winning={schema:2,teamIds:['ht','bm','px'],rounds:[
 {round:1,games:[fixture(1,[3,1],{Gb:5.3})]},
 {round:2,games:[fixture(2,[2,0],{Gb:5.2})]},
 {round:3,games:[fixture(3,[4,1],{Gb:5.4})]}
],career:{players:{}}};
assert.equal(C.form(winning,'ht').underPressure,false);
const rotation=C.planLineup(team,winning,E.Attr);
assert.ok(rotation.changes.some(change=>change.out==='Gb'),
 'two poor match ratings rotate a starter even after victories');
assert.ok(rotation.reason.includes('Notas baixas'));
const winningMatch=new E.Match('ht','px',999,null,winning);
assert.ok(winningMatch.startingLineups[0].some(x=>x.name===rotation.changes[0].in));

// Zero evidence must never invent a poor performance or a new starting XI.
assert.deepEqual(C.planLineup(team,{rounds:[],career:{players:{}}},E.Attr).players,starting);
const noSheet={rounds:[{round:1,games:[{home:'ht',away:'bm',result:[2,0]}]}],career:{players:{}}};
assert.deepEqual(C.planLineup(team,noSheet,E.Attr).players,starting);
const fixtureOnly={rounds:[{round:1,games:[fixture(1,[0,3])]}]};
assert.equal(C.contextFor(team,fixtureOnly),fixtureOnly,
 'old saves without teamIds still identify History fixtures');
assert.equal(C.contextFor(team,{rounds:[],teamIds:['bm']},[{id:'cup',teams:['ht']}]).id,'cup',
 'teams outside the league keep their cup context');

const squads=fs.readFileSync('web/neo-squads-v980.js','utf8');
assert.match(squads,/C\.contextFor\(t,league/);
assert.match(squads,/form\.underPressure\|\|plan\.changes\.length/);
assert.match(squads,/notas ruins recentes/);
console.log('PASS 10.6.37: History defeats count, underperformers rotate even after wins, match XI and bench agree');
