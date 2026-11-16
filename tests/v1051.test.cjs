'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const P=E.Progression;
const D=require('../web/neo-player-data-v960.js');
const R=require('../web/neo-round-v990.js');
const H=require('../web/neo-historic-teams-v970.js');
const read=p=>fs.readFileSync(p,'utf8');
assert.equal(P.baseValue(90,'CA'),0,'there is no OVR signing bonus');
assert.equal(P.estimateValue({games:0}),0,'every player starts at ¥0');
assert.equal(P.estimateValue({games:0,value:260000000}),0,'old phantom bid on a player with no games must not appear');
assert.equal(P.estimateValue({games:2,value:1234567}),1200000,'recorded value remains rounded');
assert.ok(P.bidDelta({role:'CA',rating:8.7,goals:2},1)>0,'good striker increases value');
assert.ok(P.bidDelta({role:'GOL',rating:8.0,saves:7},0)>0,'great keeper increases value');
assert.ok(P.bidDelta({role:'ZAG',rating:8.0,tackles:5,interceptions:5},0)>0,'great defender increases value');
assert.ok(P.bidDelta({role:'CA',rating:4.4,goals:3},2)<0,'bad match never increases bid despite goals/team win');
assert.ok(P.bidDelta({role:'GOL',rating:5.2,saves:5},1)<0,'bad keeper match lowers the bid');
assert.equal(P.bidDelta({role:'CA',rating:6.7,goals:0,assists:0},0),0,'neutral match gives no automatic money');
const snapshotPlayer={name:'Isagi',club:'bm',role:'CA',games:2,goals:1,value:390000000,history:[{round:1,value:300000000},{round:2,value:390000000}]};
const season={schema:2,rounds:[
 {round:1,games:[{home:'bm',away:'px',result:[1,0],details:{players:[
  {side:0,name:'Isagi',role:'CA',rating:8.9,goals:1,assists:0},
  {side:1,name:'Rin Itoshi',role:'CA',rating:5.7}
 ]}}]},
 {round:2,games:[{home:'px',away:'bm',result:[2,0],details:{players:[
  {side:1,name:'Isagi',role:'CA',rating:3.6,goals:0},
  {side:0,name:'Rin Itoshi',role:'CA',rating:7.8,goals:2}
 ]}}]}
],career:{players:{
 'Isagi|bm':snapshotPlayer,
 'Unplayed|ba':{name:'Unplayed',club:'ba',games:0,value:99000000},
 'Cristiano Ronaldo|mu08':{name:'Cristiano Ronaldo',club:'mu08',games:4,value:330000000},
 'Isagi|neo-bestxi':{name:'Isagi',club:'neo-bestxi',games:1,value:300000000}
},history:[],version:2}};
const beforeFixtures=JSON.stringify(season.rounds),beforeGoals=season.career.players['Isagi|bm'].goals;
assert.ok(P.reconcileBids(season)>0);
const isagi=season.career.players['Isagi|bm'];
assert.equal(isagi.bidHistory.length,2);
assert.ok(isagi.bidHistory[0].value>isagi.bidHistory[1].value,'poor game must lower the previous earned bid');
assert.equal(isagi.bidHistory[1].value,isagi.value);
assert.ok(isagi.value>=0&&isagi.value<99000000,'huge old default bid has been removed');
assert.equal(season.career.players['Unplayed|ba'].value,0);
assert.equal(season.career.players['Cristiano Ronaldo|mu08'].value,0,'extra club fake bid is reset');
assert.equal(season.career.players['Isagi|neo-bestxi'].value,0,'dynamic XI copy carries no bid');
assert.equal(JSON.stringify(season.rounds),beforeFixtures,'all fixtures preserved exactly');
assert.equal(isagi.goals,beforeGoals,'career statistics preserved');
const checkpoint=JSON.stringify(season.career);
assert.equal(P.reconcileBids(season),0,'migration runs once');
assert.equal(JSON.stringify(season.career),checkpoint,'migration is idempotent');
assert.ok(P.rank(season).every(p=>E.TEAMS.some(t=>t.id===p.club)),'league career rank only league clubs');
assert.ok(P.mvpRanking(season,10).every(p=>E.TEAMS.some(t=>t.id===p.club)),'MVP only league clubs');
assert.equal(H.install(E),4);
const league=D.roster(E,season);
assert.ok(league.length>50);
assert.ok(league.every(p=>E.TEAMS.some(t=>t.id===p.club)));
assert.equal(league.filter(p=>p.name==='Isagi').length,1,'league displayed once only');
assert.equal(league.find(p=>p.name==='Unplayed')?.value,0);
assert.ok(!league.some(p=>p.name==='Cristiano Ronaldo'));
const all=D.roster(E,season,{scope:'all'});
assert.ok(all.some(p=>p.name==='Cristiano Ronaldo'&&p.club==='mu08'),'historical players available only in separate modes');
assert.ok(D.profile(E,null,'Cristiano Ronaldo','mu08'),'historical profile preserved');
const first=E.TEAMS[0];
E.registerTeam({...first,id:'neo-bestxi',name:'Seleção do Campeonato',short:'TOP XI',players:[...first.players],reserves:[...first.reserves],formation:first.formation.map(f=>({...f}))});
assert.equal(D.roster(E,season).length,league.length,'creating Team XI does not duplicate athletes in league');
assert.ok(!D.roster(E,season,{scope:'all'}).some(p=>p.club==='neo-bestxi'),'even the full catalog excludes the system clone');
const roles=['GOL','LD','ZAG','ZAG','LE','VOL','MC','MEI','PD','CA','PE'];
const detail=side=>roles.map((role,i)=>({name:i===9?'Isagi':side+' player '+i,role,side,rating:7+i/10,goals:i===9?1:0}));
const xi=R.selectXI({round:3,games:[{home:'bm',away:'px',result:[2,1],details:{players:[...detail(0),...detail(1)]}}]});
assert.equal(xi.players.length,11);
assert.equal(xi.players.filter(p=>p.name==='Isagi').length,1,'Team XI contains only one copy of the same person');
assert.equal(xi.players.filter(p=>p.slot==='GOL').length,1);
const realSeason=E.createSchedule(2);
const fixture=realSeason.rounds[0].games[0];
const match=new E.Match(fixture.home,fixture.away,4557);
match.runToEnd();
assert.equal(E.recordFixture(realSeason,fixture,match),true);
assert.equal(realSeason.career.bidVersion,2,'new seasons activate v2 auction rules');
assert.ok(Object.values(realSeason.career.players).every(p=>p.value>=0));
const app=read('web/app.js'),market=read('web/neo-v960.js');
assert.ok(app.includes('E.Progression.reconcileBids(saved)'),'old saves migrated on load');
assert.ok(market.includes("D.roster(E,s,{scope:'league'})"),'ranking is scoped to league');
assert.ok(read('web/service-worker.js').includes('blue-lock-neo-v1.2.0-ego-evolution'));
assert.equal(read('web/VERSION').trim(),'1.2.0');
console.log('PASS 10.6.0: exclusive NEL league rankings, unique XI athletes, zero initial bids, poor-match decline, safe save migration');
