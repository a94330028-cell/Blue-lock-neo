'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const R=require('../web/neo-round-v990.js');
const P=E.Progression;
require('../web/neo2-history-team-v201.js').install(E);

// A master can enter once only, including after the 45-minute window ends.
assert.equal(E.Masters.MAX_ENTRIES,1);
assert.equal(E.Masters.ENTRY_MINUTES.length,1);
const direct=new E.Match('ht','px',5312026);
assert.equal(direct._masterEntry(0),true);
direct.time=direct.masterEntries[0].until+1;
direct._updateMasters();
assert.equal(direct._masterEntry(0),false,'Sae cannot enter a second time');
assert.equal(direct.masterEntries.filter(r=>r.side===0).length,1);

// Old saves sometimes contain two entries and two player rows in one fixture.
// One match means one appearance; recorded goals are still accounted for.
const p=(goals,rating)=>({name:'Julian Loki',side:1,isMaster:true,role:'CA',goals,
 rating,assists:0,shots:3,passes:12,tackles:0,saves:0,interceptions:0});
const one={home:'ht',away:'px',result:[2,3],details:{
 masterEntries:[{side:1,master:'Julian Loki',minute:30,exitMinute:75},
  {side:1,master:'Julian Loki',minute:78,exitMinute:90}],
 players:[p(1,8.1),p(1,8.6)]}};
const season={rounds:[{round:1,games:[one]}],career:{players:{},masterBidVersion:1,
 masterBids:{'Julian Loki|px':{name:'Julian Loki',club:'px',isMaster:true,
  games:2,masterApps:2,value:4000000,bidHistory:[{round:1,match:'ht × px'},{round:1,match:'ht × px'}]}}}};
assert.equal(P.reconcileMasterBids(season),1);
assert.equal(season.career.masterBidVersion,2);
const loki=season.career.masterBids['Julian Loki|px'];
assert.equal(loki.games,1,'two old windows count as one played fixture');
assert.equal(loki.masterApps,1);
assert.equal(loki.goals,2,'legitimate scored goals are preserved');
assert.ok(loki.value>=4000000,'old earned offer is preserved');
assert.equal(P.reconcileMasterBids(season),0,'migration is idempotent');

// Four visibly separate lines of portrait cards, with displayed OVR (not
// match grade). A second centre-back must not disappear from the field.
const slots=['GOL','LD','ZAG','ZAG','LE','VOL','MC','MEI','PD','CA','PE'];
const xi={players:slots.map((slot,i)=>({name:'Atleta '+i,club:'ht',slot,ovr:84+i}))};
const html=R.xiCardsHTML(xi,name=>'<img alt="'+name+'" src="test.jpg">','mobile');
assert.equal((html.match(/<button type="button" class="neo-xi-card/g)||[]).length,11);
for(const label of ['ATAQUE','MEIO-CAMPO','DEFESA','GOLEIRO'])assert.ok(html.includes(label));
assert.ok(html.includes('data-neo-ux-profile=')&&html.includes('OVR 94'));
assert.ok(html.includes('neo-xi-count-4'));

// Check the real triple-live integration is wired to three independently
// stepped engines, their actual coordinates and fixture persistence.
const app=fs.readFileSync('web/app.js','utf8');
const hub=fs.readFileSync('web/neo-mobile-ux-v111.js','utf8');
const css=fs.readFileSync('web/neo-pitch-v1040.css','utf8');
assert.ok(app.includes('async function simulateTripleLive(onFrame)'));
assert.ok(app.includes('.slice(0,3)')&&app.includes('players:game.players.map'));
assert.ok(app.includes('commitOfficialFixture(official,game)'),
 'três jogos precisam salvar resultados com o mesmo commit atômico da liga');
assert.ok(hub.includes('data-neo-ux-simulate="triple"'));
assert.ok(hub.includes('bridge.simulateTripleLive(paintLive)'));
assert.ok(hub.includes("rows=allRows.filter(p=>n(p.games)>0)"),'played masters included in ranking');
assert.ok(css.includes('.neo-xi-field')&&css.includes('.neo-xi-count-4'));

// Same seeded league sample before this release: History won only 4/12 and
// generated 1.75 total goals per fixture. OVR now affects real shots/saves.
const opponents=['bm','ba','mc','px','ub'];let wins=0,goals=0;
for(let i=0;i<12;i++){
 const match=new E.Match('ht',opponents[i%opponents.length],i*73441+123);
 match.rollGameplan();match.runToEnd();
 wins+=match.score[0]>match.score[1]?1:0;
 goals+=match.score[0]+match.score[1];
 assert.ok(match.masterEntries.every((e,j,a)=>a.findIndex(x=>x.side===e.side)===j));
}
assert.ok(wins>=6&&wins<12,'strong History should usually win, without scripted wins: '+wins);
assert.ok(goals/12>=2.7&&goals/12<5.5,'genuine goals per match: '+(goals/12).toFixed(2));
console.log('PASS 10.6.35: full-card XI, triple-live wiring, master appearances, ranking, History OVR and richer real goals; '+wins+'/12 wins, '+(goals/12).toFixed(2)+' goals/game');
