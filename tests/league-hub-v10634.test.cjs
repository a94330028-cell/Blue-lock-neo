'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const Round=require('../web/neo-round-v990.js');
const H=require('../web/neo2-history-team-v201.js');
const Historic=require('../web/neo-historic-teams-v970.js');
for(const module of ['../web/neo-advanced-v200.js','../web/neo-universe-v220.js',
 '../web/neo-twelve-v230.js','../web/neo-match-pulse-v240.js'])require(module).adapt(E);

H.install(E);Historic.install(E);
const season=E.createSchedule(4,['bm','ba','mc','px','ub']);
let previousMoney=0,previousGames=0;
let firstReport=null;
for(const round of season.rounds.slice(0,8)){
 for(const fixture of round.games){
  const match=new E.Match(fixture.home,fixture.away,10000+round.round*10+round.games.indexOf(fixture),E.Progression.ensure(season),season);
  match.runToEnd();
  const sheet=match.result();
  assert.equal(E.recordFixture(season,fixture,match),true);
  if(!firstReport){
   firstReport=structuredClone(fixture.details);
   assert.ok(JSON.stringify(fixture.details).length<35000,'a partida deve ocupar menos de 35 KB');
   for(const [index,player] of sheet.players.entries()){
    const stored=fixture.details.players[index];
    for(const stat of ['goals','assists','saves','tackles','rating','ovr'])
     assert.equal(Number(stored[stat]||0),Number(player[stat]||0),'estatística preservada: '+stat);
   }
  }
 }
 const totals=Object.values(season.career.players);
 const games=totals.reduce((sum,p)=>sum+(p.games||0),0);
 const money=totals.reduce((sum,p)=>sum+(p.value||0),0);
 assert.ok(games>previousGames,'partidas continuam registradas após a rodada '+round.round);
 if(round.round===8)assert.notEqual(money,previousMoney,'ofertas continuam variando depois da sétima rodada');
 previousGames=games;previousMoney=money;
 assert.equal(Round.currentXI(season).round,round.round,'Time da Rodada acompanha a edição '+round.round);
}
assert.equal(Round.currentXI(season).players.length,11);
assert.equal(JSON.parse(JSON.stringify(season)).rounds[7].games.every(g=>g.details?.players?.length),true);

// Worst-case supported format: 10 clubs × six meetings = 270 fixtures.
const huge=E.createSchedule(6,['bm','ba','mc','px','ub','ht','mu08','fla19','sport15','mir25']);
for(const round of huge.rounds)for(const fixture of round.games){
 fixture.result=[1,0];fixture.details=structuredClone(firstReport);
}
const before=JSON.stringify(huge).length;
const reduced=E.compactSeasonReports(huge,true);
const after=JSON.stringify(huge).length;
assert.ok(reduced>0&&after<before,'antigos relatórios táticos podem ser reduzidos');
assert.ok(after<4200000,'270 partidas precisam caber no limite usual do navegador');
assert.ok(huge.rounds[0].games[0].details.goalRecords.length===firstReport.goalRecords.length,'gols históricos preservados');
assert.deepEqual(huge.rounds[0].games[0].details.players.map(p=>p.rating),firstReport.players.map(p=>p.rating),'notas históricas preservadas');
assert.equal(huge.rounds[0].games[0].details.shots.filter(s=>s.goal).length,
 firstReport.shots.filter(s=>s.goal).length,'todas as finalizações convertidas sobrevivem à compactação');
assert.deepEqual(huge.rounds[0].games[0].details.stats.saves,firstReport.stats.saves,
 'defesas oficiais permanecem intactas nos relatórios arquivados');

const app=fs.readFileSync('web/app.js','utf8');
const mobile=fs.readFileSync('web/neo-mobile-ux-v111.js','utf8');
assert.ok(app.includes('archiveSeasonSnapshot')&&app.includes('copy!==serialized'),'backup antigo verificado em IndexedDB');
assert.ok(app.includes('latestSeasonArchive')&&app.includes('exportPreviousSeason'),'edições anteriores podem ser exportadas');
assert.ok(app.includes('if(!commitOfficialFixture(f,sim)){cancelSim=true;return false;}')&&
 app.includes('snapshot=>saveSeason(snapshot)'),
 'falha de gravação interrompe simulação sem alterar a temporada em memória');
assert.ok(app.includes('simulateRound:()=>simulateRound()')&&app.includes('simulateNextFixture:()=>simulateNextFixture()'),'simulação acessível do hub');
assert.ok(mobile.includes('data-neo-ux-simulate="round"')&&mobile.includes('data-neo-ux-simulate="next"'),'duas ações diretas no celular');
assert.ok(mobile.includes('neo-ux-round-xi')&&mobile.includes('Time da Rodada'),'Time da Rodada no hub da liga');
console.log('PASS 10.6.34: rodadas 1–8, dinheiro, XI, 270 jogos compactados, backups e simulação mobile.');
