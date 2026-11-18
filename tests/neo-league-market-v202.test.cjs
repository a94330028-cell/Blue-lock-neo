'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const D=require('../web/neo-player-data-v960.js');
require('../web/neo2-history-team-v201.js').install(E);
require('../web/neo-historic-teams-v970.js').install(E);

const selected=['ht','bm'];
const season=E.createSchedule(2,selected);
const fixture=season.rounds[0].games[0];
const match=new E.Match(fixture.home,fixture.away,20261117,E.Progression.ensure(season),season);
match.runToEnd();
const sheet=match.result();
assert.equal(E.recordFixture(season,fixture,match),true);
assert.deepEqual(fixture.result,sheet.score);

const participants=D.roster(E,season);
assert.deepEqual(new Set(participants.map(p=>p.club)),new Set(selected));
for(const club of selected){
 const active=participants.filter(p=>p.club===club&&p.games>0&&!p.isMaster);
 assert.ok(active.length>=11,club+' must accrue played matches');
 assert.ok(active.every(p=>p.value>=100000),club+' must earn bids from the match sheet');
}
const historyRegular=participants.find(p=>p.name==='Gustavo Grace'&&p.club==='ht'&&!p.isMaster);
const historyMaster=participants.find(p=>p.name==='Sae Itoshi'&&p.club==='ht'&&p.isMaster);
assert.equal(historyRegular.role,'PD');
assert.equal(historyRegular.value,season.career.players['Gustavo Grace|ht'].value);
assert.equal(historyMaster.value,season.career.masterBids['Sae Itoshi|ht'].value);
assert.ok(historyRegular.value>0&&historyMaster.value>0);

const regularProfile=D.profile(E,season,'Gustavo Grace','ht',{isMaster:false});
const masterProfile=D.profile(E,season,'Sae Itoshi','ht',{isMaster:true});
assert.equal(regularProfile.entry.isMaster,false);
assert.equal(masterProfile.entry.isMaster,true);
assert.ok(regularProfile.matched.every(x=>!x.raw.isMaster));
assert.ok(masterProfile.matched.every(x=>x.raw.isMaster));
assert.equal(regularProfile.totals.games,regularProfile.matched.length);
assert.ok(masterProfile.totals.games>=masterProfile.matched.length,'a master may have two substitutions in one fixture');

const amount=(metric,name,club)=>season[metric][name+'|'+club]||0;
for(const p of sheet.players){
 const club=p.side===0?fixture.home:fixture.away;
 assert.ok(amount('scorers',p.name,club)>=(p.goals||0),'scorer registered for '+p.name);
 assert.ok(amount('assists',p.name,club)>=(p.assists||0),'assist registered for '+p.name);
}
assert.ok(Object.values(season.scorers).some(n=>n>0),'fixture creates a real scorer');
assert.ok(Object.values(season.assists).some(n=>n>0),'fixture creates a real assister');
assert.equal(D.roster(E,season,{scope:'all'}).some(p=>p.club==='mir25'),true,'gallery still has all clubs');
const full=D.roster(E,season,{scope:'all'});
assert.equal(full.find(p=>p.name==='Toko'&&p.club==='ht').role,'GOL','reserve keeper retains position');
assert.equal(full.find(p=>p.name==='Nani'&&p.club==='mu08').role,'PD','historical reserve retains position');

const extraSeason=E.createSchedule(2,['mu08','fla19','sport15','mir25']);
assert.deepEqual(new Set(D.roster(E,extraSeason).map(p=>p.club)),new Set(extraSeason.teamIds));
assert.equal(D.roster(E,extraSeason).find(p=>p.name==='Magrão'&&p.club==='sport15').role,'GOL');

const legacy=E.createSchedule(4);delete legacy.teamIds;
assert.deepEqual(new Set(D.roster(E,legacy).map(p=>p.club)),new Set(E.TEAMS.map(t=>t.id)));
const app=fs.readFileSync('web/app.js','utf8');
const market=fs.readFileSync('web/neo-v960.js','utf8');
const mobile=fs.readFileSync('web/neo-mobile-ux-v111.js','utf8');
assert.ok(app.includes('for(const t of leagueTeams().filter'), 'advanced market must include chosen clubs');
assert.ok(app.includes('syncLeagueStatsFilters();'), 'rank and records filters must follow the league');
assert.ok(market.includes("p.isMaster?'|master':''"), 'master market cards need their own identity');
assert.ok(mobile.includes("p.isMaster?'|master':''"), 'Android cards need the same identity');
console.log('PASS: new League participants earn and display real goals, assists and market bids');
