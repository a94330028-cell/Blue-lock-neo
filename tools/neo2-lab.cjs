#!/usr/bin/env node
'use strict';
// NEO 2.0 real-match lab: node tools/neo2-lab.cjs --games=30 --report=/tmp/lab.json
const fs=require('node:fs'),E=require('../web/engine.js');
const skill=require('../web/neo2-abilities-v200.js');skill.install(E.Abilities);
for(const p of ['../web/neo2-deep-ai-v202.js','../web/neo2-world-v210.js',
 '../web/neo2-insights-v211.js','../web/neo2-synergy-v213.js',
 '../web/neo-ai-v110.js','../web/neo-evolution-v120.js',
 '../web/neo-advanced-v200.js','../web/neo-universe-v220.js',
 '../web/neo-twelve-v230.js','../web/neo-match-pulse-v240.js'])require(p).adapt(E);
const opts=Object.fromEntries(process.argv.slice(2).map(x=>x.replace(/^--/,'').split('=')));
const games=Number(opts.games||12),seed=Number(opts.seed||20261117);
if(!Number.isInteger(games)||games<1||games>1000||!Number.isFinite(seed)){console.error('Use --games=1..1000 --seed=integer');process.exit(2);}
const result={schema:1,games:0,goals:0,shots:0,penalties:0,penaltyGoals:0,offside:0,passes:0,
 decisions:0,adaptations:0,duels:0,combos:0,news:0,dossiers:0,failures:[],examples:[]};
const season=E.createSchedule();E.Progression.ensure(season);
const fixtures=season.rounds.flatMap(r=>r.games);
const began=Date.now();
for(let i=0;i<games;i++){
 const fixture=fixtures[i%fixtures.length],rnd=(seed+Math.imul(i+1,104729))>>>0;
 try{
  const match=new E.Match(fixture.home,fixture.away,rnd,season.career,season);
  match.rollGameplan();const r=match.runToEnd();
  if(!match.finished)throw Error('Match did not finish');
  if(r.score.some(x=>!Number.isInteger(x)||x<0||x>25))throw Error('Impossible score');
  if(r.goalRecords.length!==r.score[0]+r.score[1])throw Error('Unverified goal');
  if(!r.neo2DeepAI||!r.neo2Insights||!r.neo2Synergies)throw Error('Missing v2 integration');
  if(r.stats.penaltiesScored.some((x,side)=>x>r.stats.penalties[side]))throw Error('Wrong penalties');
  if(r.players.some(p=>!Number.isFinite(p.rating)||p.rating<1||p.rating>10))throw Error('Bad player rating');
  if(r.shots.some(s=>s.outcome==='pending'))throw Error('Unresolved shot');
  if(i<fixtures.length&&E.recordFixture(season,fixture,match)!==true)throw Error('Season save rejected');
  result.games++;result.goals+=r.goalRecords.length;
  result.shots+=r.stats.shots[0]+r.stats.shots[1];
  result.penalties+=r.stats.penalties[0]+r.stats.penalties[1];
  result.penaltyGoals+=r.stats.penaltiesScored[0]+r.stats.penaltiesScored[1];
  result.offside+=r.stats.offsides[0]+r.stats.offsides[1];
  result.passes+=r.stats.completed[0]+r.stats.completed[1];
  result.decisions+=r.neo2DeepAI.deepDecisions[0]+r.neo2DeepAI.deepDecisions[1];
  result.adaptations+=r.neo2DeepAI.adaptations.length;
  result.duels+=r.neo2DeepAI.observedDuels;
  result.combos+=r.neo2Synergies.combinations.length;
  if(i<20)result.examples.push({seed:rnd,home:fixture.home,away:fixture.away,score:r.score});
 }catch(e){
  result.failures.push({index:i,fixture:fixture.home+'-'+fixture.away,message:String(e.message||e)});
  if(result.failures.length>=10)break;
 }
}
result.durationMs=Date.now()-began;
result.news=season.career?.neo2World?.news?.length||0;
result.dossiers=Object.keys(season.career?.neo2World?.players||{}).length;
if(result.games&&(!result.goals||!result.decisions||!result.duels||!result.news))
 result.failures.push({message:'Some essential gameplay telemetry did not occur'});
if(opts.report)fs.writeFileSync(opts.report,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(result.failures.length)process.exitCode=1;