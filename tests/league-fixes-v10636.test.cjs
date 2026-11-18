'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
require('../web/neo2-history-team-v201.js').install(E);
const T=require('../web/neo-round-v990.js');
const D=require('../web/neo-player-data-v960.js');
const Chronicle=require('../web/neo-ego-v91.js');
const P=E.Progression;

const roles=['GOL','LD','ZAG','ZAG','LE','VOL','MC','MEI','PD','CA','PE'];
function fixture(home,away,round,withMaster=false){
 const players=roles.flatMap((role,i)=>[0,1].map(side=>({
  name:(side?away:home)+'-jogador-'+i,role,side,rating:6.2+(side?.4:.6),
  goals:i===9?1:0,assists:i===7?1:0,passes:20,tackles:role==='ZAG'?3:0,
  saves:i===0?4:0
 })));
 const masterEntries=withMaster?[{side:0,master:'Chris Prince',minute:51,exitMinute:88}]:[];
 if(withMaster){
  players.push({name:'Chris Prince',side:0,role:'CA',isMaster:true,rating:9.9,
   goals:4,assists:2,passes:39,shots:7,tackles:1,interceptions:0});
  // Even if an old report contains a spurious Master record, it cannot
  // qualify for rankings without the corresponding substitution entry.
  players.push({name:'Noel Noa',side:0,role:'CA',isMaster:true,rating:10,goals:8});
 }
 return {home,away,result:[withMaster?6:2,1],details:{players,masterEntries},round};
}
const played=fixture('mc','px',1,true);
const season={rounds:[
 {round:1,games:[played,{home:'bm',away:'ub',result:null}]},
 {round:2,games:[{home:'mc',away:'bm',result:null},{home:'px',away:'ub',result:null}]}
],career:{masterBidVersion:1,players:{},masterBids:{
 'Chris Prince|mc':{name:'Chris Prince',club:'mc',role:'CA',isMaster:true,
  games:15,masterApps:15,value:56000000,bidHistory:Array.from({length:15},()=>({round:1,match:'mc × px'}))}
 }}};

const provisional=T.currentXI(season);
assert.equal(provisional.round,1);
assert.equal(provisional.gamesPlayed,1);
assert.equal(provisional.gamesTotal,2);
assert.equal(provisional.provisional,true);
assert.ok(provisional.players.some(p=>p.name==='Chris Prince'&&p.isMaster),
 'real Master substitute appears in the Team of the Round');
assert.ok(!provisional.players.some(p=>p.name==='Noel Noa'),
 'unregistered Master substitution cannot appear in XI');
assert.ok(T.xiCardsHTML(provisional,()=>'<span>photo</span>').includes('Chris%20Prince%7Cmc%7Cmaster'),
 'desktop and mobile player cards preserve the Master profile ID');

season.rounds[0].games[1]=fixture('bm','ub',1);
const final=T.currentXI(season);
assert.equal(final.provisional,false);
assert.equal(final.gamesPlayed,2);
assert.equal(final.candidateCount,45,'22 + 22 ordinary players and one verified Master');
assert.equal(T.currentXI(season,1).round,1,'historic round remains selectable');
season.rounds[1].games[0]=fixture('mc','bm',2);
assert.equal(T.currentXI(season).round,2,'automatic selection advances at first real game of next round');
assert.equal(T.availableRounds(season).length,2);

const before=season.career.masterBids['Chris Prince|mc'].games;
assert.equal(before,15,'regression setup reproduces inflated old Master counter');
assert.equal(P.reconcileMasterBids(season),1);
const master=season.career.masterBids['Chris Prince|mc'];
assert.equal(master.games,1,'reconciliation counts one game per legitimate substitution');
assert.equal(master.masterApps,1);
assert.equal(master.bidHistory.length,1);
assert.equal(season.career.masterBidVersion,2);
assert.equal(P.reconcileMasterBids(season),0,'reconciliation is idempotent');
assert.ok(!season.career.masterBids['Noel Noa|mc']);
assert.ok(P.mvpRanking(season,100).some(p=>p.name==='Chris Prince'&&p.isMaster&&p.games===1),
 'verified masters appear in the MVP ranking');
assert.ok(Chronicle.performances(season).some(p=>p.name==='Chris Prince'&&p.games===1),
 'verified masters appear in the seasonal award leaderboard');
assert.ok(!Chronicle.performances(season).some(p=>p.name==='Noel Noa'));
assert.equal(D.roster(E,season,{scope:'all'}).find(p=>p.name==='Sae Itoshi'&&p.club==='ht')?.role,'MEI',
 'History Team Master keeps his real midfielder role');

const ux=fs.readFileSync('web/neo-mobile-ux-v111.js','utf8');
const round=fs.readFileSync('web/neo-round-v990.js','utf8');
const css=fs.readFileSync('web/neo-desktop.css','utf8');
const oldMarket=fs.readFileSync('web/neo-v960.js','utf8');
assert.match(ux,/data-neo-ux-xi-round/);
assert.match(ux,/data-neo-ux-xi-latest/);
assert.match(ux,/data-neo-ux-master-only/);
assert.match(ux,/\['masters','⭐ Mestres'\]/);
assert.match(ux,/NeoPortraitUI\?\.html\?/,'user-managed portraits appear in ranking');
assert.match(ux,/preserveScroll/,'refresh does not force mobile page back to top');
assert.match(round,/Mais recente \(automático\)/);
assert.match(css,/data-xi-view="list".*neo-xi-field/);
assert.match(oldMarket,/masterBidVersion!==2/,'old market view also migrates ledger v2');
console.log('PASS 10.6.36: partial XI, masters in XI/MVP/awards, one appearance, portraits, mobile UI');
