'use strict';
// Real match + migration checks for the NEO Egoist League's fictional yen bids.
// No player is awarded real money; only officially recorded participants qualify.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js'),P=E.Progression;
assert.equal(P.BID_VERSION,3,'migration revision');

const sample={rating:6,passes:16,role:'MC',goals:0,assists:0};
const passer=P.bidDelta(sample,0);
const defender=P.bidDelta({rating:6,role:'ZAG',passes:12,tackles:3,interceptions:2,shotBlocks:1},0);
const keeper=P.bidDelta({rating:6,role:'GOL',saves:6,passes:3},-1);
const striker=P.bidDelta({rating:8.4,role:'CA',goals:2,assists:1,passes:22},1);
for(const [type,value] of Object.entries({passer,defender,keeper,striker})){
 assert.ok(value>=100000&&value%100000===0,type+' needs a positive, rounded registered bid: '+value);
}
assert.ok(defender>passer,'defensive contribution is priced');
assert.ok(keeper>passer,'saves are priced');
assert.ok(striker>defender,'goals and decisive play matter');
assert.equal(P.bidDelta({role:'CA',goals:12},1),0,'no recorded note: no invented bid');
assert.equal(P.estimateValue({games:0}),0,'unplayed athlete still starts at zero');

const league=E.createSchedule();
const matchday=league.rounds[0].games[0];
const game=new E.Match(matchday.home,matchday.away,20261116,P.ensure(league),league);
game.runToEnd();
const result=game.result();
assert.equal(E.recordFixture(league,matchday,game),true);
const active=Object.values(league.career.players).filter(p=>p.games>0);
assert.ok(active.length>=18,'fixture creates recorded participants');
assert.ok(active.every(p=>p.value>=100000),'every rated participant must get at least a first bid; missing: '+
 active.filter(p=>p.value<100000).map(p=>p.name).join(', '));
assert.ok(active.some(p=>!p.goals&&!p.assists&&p.value>=100000),'quiet players also receive earned bid');
assert.ok(active.some(p=>/GOL|GK/.test(p.role)&&p.value>0),'goalkeepers have a real earned offer');
assert.ok(active.some(p=>/ZAG|CB|VOL/.test(p.role)&&p.value>0),'defenders have a real earned offer');
assert.equal(league.career.bidVersion,3,'fresh seasons use the latest bid model');

// A previously saved version-2 season with zero offers must be repairable from
// its actual match sheets. Saves/fixtures and unrelated fields stay intact.
const old=JSON.parse(JSON.stringify(league));
old.career.bidVersion=2;
const target=old.career.players[Object.keys(old.career.players)[0]];
assert.ok(target);
const id=target.name+'|'+target.club;
const originalValue=target.value;
target.value=0;
target.bidHistory=[];
old.keepMyPortraits='unchanged';
const originalFixtures=JSON.stringify(old.rounds);
const changed=P.reconcileBids(old);
assert.ok(changed>=1,'one or more zero bids should be rebuilt');
assert.ok(old.career.players[id].value>=100000,'previously lost offer restored');
assert.equal(old.career.bidVersion,3);
assert.equal(JSON.stringify(old.rounds),originalFixtures,'fixture report and score untouched');
assert.equal(old.keepMyPortraits,'unchanged');
const snapshot=JSON.stringify(old);
assert.equal(P.reconcileBids(old),0,'migration is idempotent');
assert.equal(JSON.stringify(old),snapshot,'second pass does not reprocess historical money');
assert.ok(old.career.players[id].value<=Math.max(originalValue,40e6),'no accidental inflated first offer');

// An existing positive saved offer is never lowered on migration, even if
// older reports are incomplete; players with no games stay at zero.
const saved={
 rounds:[{round:1,games:[{home:'bm',away:'px',result:[0,0],details:{players:[
  {name:'Quiet Mid',side:0,role:'MC',rating:6,passes:25},
  {name:'No Report',side:1,role:'CA'}
 ]}}]}],
 career:{players:{
  'Quiet Mid|bm':{name:'Quiet Mid',club:'bm',games:1,value:8000000,bidHistory:[{value:8000000,change:8000000}]},
  'No Report|px':{name:'No Report',club:'px',games:1,value:3600000},
  'Bench|bm':{name:'Bench',club:'bm',games:0,value:0}
 },bidVersion:2,history:[]}
};
P.reconcileBids(saved);
assert.ok(saved.career.players['Quiet Mid|bm'].value>=8000000,'existing higher bid preserved');
assert.equal(saved.career.players['No Report|px'].value,3600000,'no match rating: preserve saved money');
assert.equal(saved.career.players['Bench|bm'].value,0,'unplayed reserves never earn fictional money');
assert.equal(P.reconcileBids(saved),0);

// All shipped renderers must display the same stored offer rather than
// recalculating a price from character level, goals or visual artwork.
const mobile=fs.readFileSync('web/neo-mobile-ux-v111.js','utf8');
const app=fs.readFileSync('web/app.js','utf8');
assert.ok(mobile.includes('Sem estreia'),'market distinguishes unplayed from played');
assert.ok(app.includes('E.Progression.BID_VERSION'),'save migration uses the active version');
console.log('PASS: actual participants earn bids; defensive roles rewarded; v2 saves safely repaired');
