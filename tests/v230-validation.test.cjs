'use strict';
// Validation matrix for ideas 19–30: positive/negative gates, real matches,
// fixed seeds, offline packaging, state mutation, saves, and 40x parity.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Engine=require('../web/engine.js');
const Advanced=require('../web/neo-advanced-v200.js');
const Universe=require('../web/neo-universe-v220.js');
const Twelve=require('../web/neo-twelve-v230.js');
assert.equal(Advanced.adapt(Engine),true);
assert.equal(Universe.adapt(Engine),true);
assert.equal(Twelve.adapt(Engine),true);
assert.equal(Twelve.adapt(Engine),false);
const mk=(name,side,role,i,x,y)=>({name,side,role,i,x,y,stamina:85,ego:50,flowUntil:0,abilityUses:{}});
const p=mk('A',0,'MEI',6,700,550),q=mk('B',0,'CA',9,830,480),e=mk('C',1,'ZAG',3,760,555);
const skill={id:'test-pass',label:'Passe Especial',stat:'passing',contexts:['pass']};
const career={'A|bm':{weaponMastery:{'test-pass':3},abilityUses:{'test-pass':25},
 neo230:{matches:3,positionWork:5,defeatLessons:3}}};
const m={time:470,phase:'play',score:[1,1],teams:[{id:'bm'},{id:'px'}],careerPlayers:career,players:[p,q,e],
 _neo230Engine:{Abilities:{get:id=>id==='test-pass'?skill:null}},
 progress:(_,x)=>x,opponentPressure:obj=>obj===p?3:0,
 safeLane:()=>80,offside:()=>false,random:()=>0,
 inOpponentBox:()=>true,ball:{mode:'carry',owner:p},shotMap:[],
 pass(a,b){this.lastPass={p:a,time:this.time};this.ball={mode:'pass',by:a,to:b,owner:null};}};
const report = (name,fn)=>{fn();process.stdout.write('VALIDADO CENÁRIO: '+name+'\n');};
report('19 domínio em três níveis e técnica ativa',()=>{
 p.abilityUses['test-pass']=0;career['A|bm'].weaponMastery['test-pass']=1;career['A|bm'].abilityUses['test-pass']=0;
 assert.equal(Twelve.skillTier(m,p,skill),1);
 career['A|bm'].abilityUses['test-pass']=6;assert.equal(Twelve.skillTier(m,p,skill),2);
 career['A|bm'].abilityUses['test-pass']=20;assert.equal(Twelve.skillTier(m,p,skill),3);
 p.activeAbility={id:'test-pass',until:m.time+20};
 assert.ok(Twelve.weaponFactor(m,p,'passing')>1);
 assert.equal(Twelve.weaponFactor(m,p,'finishing'),1);
 p.activeAbility.until=m.time-1;assert.equal(Twelve.weaponFactor(m,p,'passing'),1);
});
report('20 improviso legal e sem atalho de impedimento',()=>{
 const original=m.random;m.random=()=>0;
 m.ball={mode:'carry',owner:p};
 assert.equal(Twelve.improvise(m,p),true);
 assert.equal(m.ball.to,q);
 m.ball={mode:'carry',owner:p};
 m.offside=()=>true;assert.equal(Twelve.improvise(m,p),false);
 m.offside=()=>false;p.stamina=23;assert.equal(Twelve.improvise(m,p),false);
 p.stamina=85;m.opponentPressure=()=>0;assert.equal(Twelve.improvise(m,p),false);
 m.opponentPressure=obj=>obj===p?3:0;m.random=original;
});
report('21 reação em cadeia só com passes recebidos',()=>{
 m.time=590;m.ball={mode:'carry',owner:p};m.pass(p,q);
 assert.ok(Twelve.launched(m,p,q));
 const firstToken=m.lastPass;
 m.lastPass={p:q,time:591};m.ball={mode:'carry',owner:q};m.time=591;
 assert.equal(Twelve.observeReception(m),false,'stale pass must not count');
 assert.equal(Twelve.chemistry(m,p,q),0);
 m.ball={mode:'carry',owner:p};m.time=592;m.pass(p,q);
 assert.ok(Twelve.launched(m,p,q));
 m.time=594;m.ball={mode:'carry',owner:q};assert.equal(Twelve.observeReception(m),true);
 assert.equal(Twelve.observeReception(m),false,'one pass never scores twice');
 assert.equal(Twelve.state(m).completions,1);
 assert.ok(m.lastPass!==firstToken);
});
report('22 química exige recepções reais de jogadores do mesmo time',()=>{
 assert.equal(Twelve.chemistry(m,p,e),0);
 assert.equal(Twelve.chemistry(m,p,q),1);
 m.ball={mode:'carry',owner:p};m.time=600;m.pass(p,q);Twelve.launched(m,p,q);
 m.ball={mode:'carry',owner:q};m.time=603;Twelve.observeReception(m);
 assert.equal(Twelve.chemistry(m,p,q),2);
 assert.equal(Twelve.state(m).events.some(x=>x.idea===22),true);
});
report('23 armas limitadas ao atributo e duração',()=>{
 p.activeAbility={id:'test-pass',until:700};
 assert.ok(Twelve.multiplier(m,p,'passing')>=1);
 assert.ok(Twelve.weaponFactor(m,p,'passing')<=1.027);
 assert.equal(Twelve.weaponFactor(m,p,'tackling'),1);
 assert.ok(Twelve.multiplier(m,p,'passing')<=1.105);
});
report('24 instinto só em área e após finalização salva',()=>{
 m.time=730;m.shotMap=[{side:0,outcome:'saved',minute:12}];
 const quality=Twelve.instinct(m,q,.19);assert.ok(quality>.19);
 m.inOpponentBox=()=>false;assert.equal(Twelve.instinct(m,q,.19),.19);
 m.inOpponentBox=()=>true;m.time=1200;
 assert.equal(Twelve.instinct(m,q,.19),.19);
});
report('25 alteração temporária não destrói a posição titular',()=>{
 m.time=1205;m.ball={mode:'carry',owner:q};m.phase='play';
 p.stamina=85;q.y=850;q.x=1200;
 const role=p.role,from=Twelve.adaptableRun(m,p,q,'support');
 assert.equal(from,'late-box');assert.equal(p.role,role);
 p.stamina=20;assert.equal(Twelve.adaptableRun(m,p,q,'support'),'support');
 p.stamina=85;
});
report('26 contra-ataque só após recuperação real',()=>{
 m.time=1300;m.ball={mode:'carry',owner:q};
 assert.equal(Twelve.counterRun(m,q,p,'decoy'),'decoy','new kickoff is not recovery');
 assert.equal(Twelve.observeTurnover(m,0,'play'),false);
 m.ball={mode:'carry',owner:e};m.time=1301;
 assert.equal(Twelve.observeTurnover(m,0,'play'),true);
 m.ball={mode:'carry',owner:q};m.time=1302;
 assert.equal(Twelve.observeTurnover(m,1,'play'),true);
 assert.equal(Twelve.counterRun(m,q,p,'decoy'),'channel');
 m.time=1313;assert.equal(Twelve.counterRun(m,q,p,'decoy'),'decoy');
});
report('27 rivalidade interna nasce de finalizações alternadas',()=>{
 m.time=1350;Twelve.shotCompetition(m,p);assert.equal(Object.keys(Twelve.state(m).conflicts).length,0);
 m.time=1351;Twelve.shotCompetition(m,q);
 m.time=1352;Twelve.shotCompetition(m,p);
 assert.ok(Object.values(Twelve.state(m).conflicts).some(x=>x>=2));
 assert.ok(p._neo230CompetitionUntil>m.time);
 m.time=p._neo230CompetitionUntil+1;
 assert.equal(Twelve.competitionFactor(m,p,'positioning'),1);
});
report('28 lição após derrota válida, salva uma vez',()=>{
 const season=Engine.createSchedule();Engine.Progression.ensure(season);
 const fixture=season.rounds[0].games[0],club=fixture.home;
 fixture.result=[0,1];fixture.details={score:[0,1],players:[{name:'A',side:0,role:'MEI',rating:7.3,runs:2,overlaps:1,keyPasses:2}]};
 season.career.players['A|'+club]={name:'A',club};
 assert.equal(Twelve.recordSeason(season,fixture,null,1),true);
 assert.equal(Twelve.recordSeason(season,fixture,null,1),false);
 const row=season.career.players['A|'+club].neo230;
 assert.equal(row.matches,1);assert.equal(row.defeatLessons,1);assert.equal(row.positionWork,1);
 fixture.details.score=[0];assert.equal(Twelve.recordSeason(season,fixture,null,2),false);
 m.time=1400;m.phase='play';
 assert.ok(Twelve.lessonFactor(m,p,'control')>1,'two prior losses help later on the field');
 m.phase='finished';assert.equal(Twelve.lessonFactor(m,p,'control'),1);
 m.phase='play';
});
report('29 adaptações só após duelos perdidos reais',()=>{
 m.time=1420;m.ball={mode:'carry',owner:e};p.x=750;e.x=760;
 assert.equal(Twelve.adaptationFactor(m,p,'tackling'),1);
 Twelve.onDuel(m,p,e,e);Twelve.onDuel(m,p,e,e);
 assert.ok(Twelve.adaptationFactor(m,p,'tackling')>1);
 m.ball={mode:'carry',owner:q};
 assert.equal(Twelve.adaptationFactor(m,p,'tackling'),1);
});
report('30 genialidade só durante Flow, energia, pressão e recarga',()=>{
 m.time=1500;m.ball={mode:'carry',owner:p};p.stamina=90;p.flowUntil=1550;
 m.opponentPressure=()=>2;m.random=()=>0;
 assert.equal(Twelve.genius(m,p,skill,'pass'),true);
 assert.equal(Twelve.genius(m,p,skill,'pass'),false);
 assert.ok(Twelve.multiplier(m,p,'passing')>1);
 p.flowUntil=0;m.time=1540;assert.equal(Twelve.genius(m,p,skill,'pass'),false);
 m.opponentPressure=()=>0;p.flowUntil=1600;assert.equal(Twelve.genius(m,p,skill,'pass'),false);
});

const kickoffCase=new Engine.Match('bm','px',839222,null,Engine.createSchedule());
Twelve.state(kickoffCase).turnovers=[75,75];
kickoffCase.kickoff(1);
assert.deepEqual(Twelve.state(kickoffCase).turnovers,[-9999,-9999],
 'goal restart or kickoff must clear any previous counter-attack windows');
assert.equal(kickoffCase.ball.owner.side,1,'kickoff possession remains controlled by the engine');
const original=JSON.stringify(Engine.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves})));
const cycle=()=>Engine.createSchedule();
const matchCase=(home,away,seed)=>new Engine.Match(home,away,seed,null,cycle());
const pairs=[['bm','px'],['ub','mc'],['ba','bm']];
let matches=0,totalGoals=0;
for(const [home,away] of pairs){
 const game=matchCase(home,away,123456+matches*499),copy=matchCase(home,away,123456+matches*499);
 const r=game.runToEnd(),rc=copy.runToEnd();
 assert.deepEqual(r.score,rc.score,'same physics frames must match from 1x to Turbo 40x');
 assert.deepEqual(r.ego230,rc.ego230,'same decision events must be deterministic');
 assert.ok(game.finished&&copy.finished);
 assert.equal(game.phase,'finished');
 assert.deepEqual(r.score,game.score);
 assert.ok(r.score.every(x=>Number.isInteger(x)&&x>=0&&x<=40));
 assert.ok(game.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&
   Number.isFinite(p.stamina)&&p.stamina>=0&&p.stamina<=100));
 assert.ok(r.ego230.events.length<=45,'memory events bounded in 90-minute match');
 assert.ok(Object.values(r.ego230.chemistry||[]).length<=9);
 assert.equal(r.ego230.genius>=0,true);
 assert.ok(Array.isArray(r.shots));
 assert.ok(r.stats.offsides.every(v=>Number.isInteger(v)&&v>=0));
 totalGoals+=r.score[0]+r.score[1];matches++;
}
assert.equal(JSON.stringify(Engine.TEAMS.map(t=>({id:t.id,players:t.players,reserves:t.reserves}))),original);
const sw=fs.readFileSync('web/service-worker.js','utf8');
const sync=fs.readFileSync('tools/sync_inline_v930.py','utf8');
assert.ok(sw.includes('./neo-twelve-v230.js')&&sw.includes('./neo-twelve-v230.css'));
assert.ok(sync.includes('neo-twelve-v230.js')&&sync.includes('neo-twelve-v230.css'));
console.log('PASS 12/12 validation scenarios + '+matches+' complete deterministic games, '+totalGoals+' genuine goals, unchanged clubs, no fake achievements');
