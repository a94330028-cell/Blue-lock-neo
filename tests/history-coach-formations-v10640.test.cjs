'use strict';
const assert=require('node:assert/strict');
const E=require('../web/engine.js');
const H=require('../web/neo2-history-team-v201.js');
const C=require('../web/neo-coach-v980.js');
H.install(E);
global.NeoCoach980=C;
const team=E.teamById('ht');
assert.equal(team.formationName,'3-3-4');
assert.equal(team.formation[team.players.indexOf('Zenkai')].role,'CA');
assert.equal(E.Attr.generate('Zenkai','CA',9).ovr,90);
assert.equal(E.Attr.generate('Kash','MEI',1).ovr,89);
assert.equal(E.Attr.generate('Rodinha','SA',1).ovr,90);
assert.ok(team.players.includes('Kash')&&team.reserves.includes('Rodinha'));
assert.deepEqual(C.planLineup(team,{rounds:[]},E.Attr).players,team.players,
 'sem partidas, time mantém a base original');
const originalPlayers=team.players.slice(),originalBench=team.reserves.slice();
function fixture(round,result,shape=null){
 return {round,games:[{home:'ht',away:'bm',result,details:{
  coachPlans:[{formationName:shape},null],players:team.players.map((name,index)=>({
   name,side:0,rating:index===5?5.4:7.2
  }))
 }}]};
}
const twoLosses={rounds:[fixture(1,[0,3]),fixture(2,[1,4])],career:{players:{}}};
const change=C.planLineup(team,twoLosses,E.Attr);
assert.ok(change.form.underPressure);
assert.notEqual(change.formationName,'3-3-4',
 'depois de duas derrotas, treinador testa outra formação');
assert.equal(change.formationChanged,true);
assert.equal(change.formation.length,11);
assert.equal(change.players.length,11);
assert.equal(new Set(change.players).size,11);
assert.equal(change.players[0],'Gin');
assert.equal(change.players.length+change.reserves.length,21);
assert.deepEqual(new Set([...change.players,...change.reserves]),new Set([...originalPlayers,...originalBench]));
assert.ok(change.changes.length<=3);
assert.ok(change.changes.every(x=>x.newOvr>=x.oldOvr-8));
assert.ok(change.players.some(x=>['Kash','Rodinha'].includes(x)),
 'Kash e Rodinha são considerados na escalação dinâmica');
const match=new E.Match('ht','bm',135,null,twoLosses);
assert.equal(match.teams[0].formationName,change.formationName,
 'formação escolhida é aplicada ao motor real da partida');
assert.deepEqual(match.teams[0].players,change.players);
assert.deepEqual(match.startingLineups[0].map(x=>x.role),change.formation.map(x=>x.role));
const final=match.runToEnd();
assert.equal(final.coachPlans[0].formationName,change.formationName,
 'súmula conserva a escolha para as partidas seguintes');
assert.equal(E.compactFixtureDetails(final).coachPlans[0].formationName,change.formationName,
 'compactação da temporada não apaga o histórico tático');
const failed={rounds:[...twoLosses.rounds,fixture(3,[0,2],change.formationName)],career:{players:{}}};
const retry=C.planLineup(team,failed,E.Attr);
assert.notEqual(retry.formationName,change.formationName,
 'formação que voltou a perder é revista pelo treinador');
const success={rounds:[...twoLosses.rounds,fixture(3,[3,0],change.formationName)],career:{players:{}}};
const maintained=C.planLineup(team,success,E.Attr);
assert.equal(maintained.formationName,change.formationName,
 'técnico mantém o esquema que funcionou');
assert.deepEqual(team.players,originalPlayers,'elenco original não é alterado');
assert.deepEqual(team.reserves,originalBench,'banco original continua intacto');
// Simulação tradicional, sem resultados prévios, não é reordenada às cegas.
const originalBM=E.teamById('bm').players.slice();
const fresh=new E.Match('bm','px',9999);
assert.deepEqual(fresh.teams[0].players,originalBM);
assert.equal(fresh.teams[0].formationName,'4-3-3');
for(const club of E.allTeams()){
 const twoDefeats={rounds:[1,2].map(round=>({round,games:[{
  home:club.id,away:club.id==='bm'?'px':'bm',result:[0,2]
 }]}))};
 const tactics=C.planLineup(club,twoDefeats,E.Attr);
 assert.equal(tactics.players[0],club.players[0],club.id+' keeper remains');
 assert.equal(new Set(tactics.players).size,11,club.id+' no duplicate player');
 assert.equal(tactics.players.length+tactics.reserves.length,club.players.length+club.reserves.length);
 if(tactics.formationChanged){
  assert.equal(tactics.formation.length,11,club.id+' new scheme has 11 slots');
  assert.notEqual(tactics.formationName,club.formationName);
 }
}
console.log('PASS 10.6.40: History roster, tactical adaptation, failed experiment, success retention, saved XI and match engine');
