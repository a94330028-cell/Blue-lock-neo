'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../web/engine.js'),D=require('../web/neo-player-data-v960.js'),P=E.Progression;
const p=(name,side,fields={})=>({
 name,side,isMaster:true,role:'CA',rating:7.6,goals:0,assists:0,passes:18,
 shots:2,tackles:1,saves:0,interceptions:1,...fields
});
const details={
 masterEntries:[
  {side:0,master:'Chris Prince',minute:46,exitMinute:89},
  {side:1,master:'Julian Loki',minute:51,exitMinute:90}],
 players:[
  p('Chris Prince',0,{goals:1,rating:8.2,passes:31}),
  p('Julian Loki',1,{assists:1,rating:7.4,passes:24}),
  p('Noel Noa',0,{goals:4,rating:10}) // not in masterEntries: must NOT count
 ]
};
const fixture={home:'mc',away:'px',result:[2,1],details};
const season={
 schema:2,rounds:[{round:1,games:[fixture]}],
 career:{players:{'Other Player|mc':{name:'Other Player',club:'mc',games:1,value:7600000}},bidVersion:3,history:[]}
};
const prior=JSON.stringify(season.rounds),regular=JSON.stringify(season.career.players);
assert.equal(P.reconcileMasterBids(season),2,'only genuine Master substitutions are counted');
const prince=season.career.masterBids['Chris Prince|mc'];
const loki=season.career.masterBids['Julian Loki|px'];
assert.ok(prince.value>0&&loki.value>0,'participating masters receive true fictional bids');
assert.ok(prince.games===1&&loki.games===1&&prince.masterApps===1);
assert.ok(prince.value>loki.value,'more decisive recorded game earns higher offer');
assert.equal(prince.bidHistory[0].minutes,43,'recorded substitution duration used');
assert.ok(!season.career.masterBids['Noel Noa|mc'],'fake/nonregistered activation not priced');
assert.equal(JSON.stringify(season.career.players),regular,'ordinary player career and value are untouched');
assert.equal(JSON.stringify(season.rounds),prior,'master ledger never edits fixture scores or reports');
assert.equal(P.reconcileMasterBids(season),0,'old season backfill cannot double credit');
const all=D.roster(E,season);
const displayed=all.find(x=>x.name==='Chris Prince'&&x.club==='mc');
assert.ok(displayed?.isMaster&&displayed.games===1&&displayed.value===prince.value,
 'market renderer reads saved master bid rather than fake OVR');
const profile=D.profile(E,season,'Chris Prince','mc');
assert.ok(profile?.hasMatches&&profile.totals.games>0&&profile.entry.value>0,
 'master profile has true games, bid and a match report');
assert.ok(!P.rank(season).some(x=>x.name==='Chris Prince'),'masters remain outside ordinary MVP rank');
// Simulate another real registered appearance; the price and match history
// must increase once after the game.
const fixture2={home:'mc',away:'px',result:[3,0],details:{
 masterEntries:[{side:0,master:'Chris Prince',minute:50,exitMinute:90}],
 players:[p('Chris Prince',0,{goals:2,assists:1,rating:9.4,passes:35})]
}};
season.rounds.push({round:2,games:[fixture2]});
const first=prince.value;
P.record(season,fixture2,{result:()=>({
 score:fixture2.result,players:fixture2.details.players,masterEntries:fixture2.details.masterEntries,
 goalRecords:[]
})},2);
assert.ok(prince.value>first&&prince.games===2,'master offer increases with registered decisive appearances');
assert.equal(prince.bidHistory.length,2);
assert.equal(season.career.masterBidVersion,1);
assert.equal(P.reconcileMasterBids(season),0,'recorded new appearance cannot replay old history');
const mobile=fs.readFileSync('web/neo-mobile-ux-v111.js','utf8');
const css=fs.readFileSync('web/neo-mobile-ux-v111.css','utf8');
assert.ok(mobile.includes("data-neo-ux-rank")&&mobile.includes("leaderboard(filtered,'market')"));
assert.ok(mobile.includes("leaderboard(ranked,rankMode)"),'all rankings share the same component');
assert.ok(css.includes('neo-ux-podium-card'),'same podium visual on all rankings');
assert.ok(mobile.includes("b.dataset.refPage==='ranking'"),'bottom Ranking navigates to unified screen');
console.log('PASS: masters paid by real recorded appearances; backfill idempotent; ranks use unified cards');
