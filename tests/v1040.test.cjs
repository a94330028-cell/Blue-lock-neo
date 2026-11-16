'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const layout=require('../web/neo-pitch-layout-v1040.js');
const E=require('../web/engine.js');
assert.equal(layout.formationKey('3-5-2 · rodada 4'),'3-5-2');
assert.equal(layout.formationKey('4-3-3'),'4-3-3');
assert.equal(layout.formationKey('4-2-3-1'),'4-2-3-1');
const all=E.TEAMS;
assert.equal(all.length,5);
for(const team of all){
 const spots=layout.layout(team,team.formation);
 assert.equal(spots.length,11,team.name+' must have eleven visual slots');
 assert.equal(new Set(spots.map(s=>s.slot)).size,11,'no duplicated slot');
 for(const p of spots){
  assert.ok(p.lane>=10&&p.lane<=90,team.name+' lane must fit');
  assert.ok(p.depth>=18&&p.depth<=91,team.name+' depth must fit');
 }
 assert.deepEqual(layout.collisions(spots,320,500,52,78),[],team.name+' must not overlap on a narrow Android phone');
 assert.deepEqual(layout.collisions(spots,380,575,60,83),[],team.name+' must not overlap on a large Android phone');
 assert.ok(spots[0].depth>spots[1].depth,'the goalkeeper must stay behind defenders');
 assert.ok(spots.slice(-2).every(s=>s.depth<50),'strikers must stay ahead');
}
const ubers=layout.layout(E.teamById('ub'),E.teamById('ub').formation);
assert.ok(ubers[1].lane<ubers[2].lane&&ubers[2].lane<ubers[3].lane,'Ubers: three center backs spread left-center-right');
assert.ok(ubers[4].depth>ubers[5].depth,'Ubers: defensive midfielder behind playmaker');
assert.ok(ubers[6].lane<ubers[5].lane&&ubers[8].lane>ubers[7].lane,'Ubers: wingbacks on opposite sidelines');
assert.ok(ubers[9].lane<ubers[10].lane,'Ubers: two forwards separated');
const manc=layout.layout(E.teamById('mc'),E.teamById('mc').formation);
assert.ok(manc[4].lane<manc[7].lane,'Manshine: left and right wide midfielders separated');
const xi=layout.layout({formationName:'4-3-3',formation:E.DEFAULT_FORMATION},E.DEFAULT_FORMATION);
assert.deepEqual(layout.collisions(xi,320,500,52,78),[]);
const custom={formationName:'2-3-5',formation:[
 {role:'GOL',x:.1,y:.5},{role:'ZAG',x:.22,y:.32},{role:'ZAG',x:.22,y:.68},
 {role:'VOL',x:.4,y:.2},{role:'MC',x:.44,y:.5},{role:'MEI',x:.4,y:.8},
 {role:'PD',x:.65,y:.1},{role:'PE',x:.65,y:.3},{role:'CA',x:.68,y:.5},
 {role:'CA',x:.65,y:.7},{role:'SA',x:.7,y:.9}
]};
const generic=layout.layout(custom,custom.formation);
assert.equal(generic.length,11);
assert.deepEqual(layout.collisions(generic,320,500,52,78),[],'unknown historical formation should remain readable');
const squad=fs.readFileSync('web/neo-squads-v980.js','utf8');
const rounds=fs.readFileSync('web/neo-round-v990.js','utf8');
const style=fs.readFileSync('web/neo-pitch-v1040.css','utf8');
const worker=fs.readFileSync('web/service-worker.js','utf8');
const html=fs.readFileSync('web/index.html','utf8');
assert.ok(squad.includes('NeoPitch1040?.layout(t,f)'), 'all team squad boards use corrected slots');
assert.ok(rounds.includes('neo990-xi-pitch'), 'team of the championship shown on the field');
assert.ok(rounds.includes('neo990-pitch-player'), 'each of the eleven players gets an individual field position');
assert.ok(rounds.includes('neo990-xi-list'), 'list stays available for accessibility');
assert.ok(style.includes('#neo980-squad-area .neo980-player'), 'existing squad portraits responsive');
assert.ok(worker.includes('./neo-pitch-layout-v1040.js')&&worker.includes('./neo-pitch-v1040.css'), 'offline cache contains pitch');
assert.ok(html.includes('neo-pitch-layout-v1040.js')&&html.includes('neo-pitch-v1040.css'),'the actual HTML loads lineup helper and pitch style');
assert.equal(fs.readFileSync('web/VERSION','utf8').trim(),'1.3.0');
console.log('PASS NEO 10.4: XI field, Ubers 3-5-2, all team lineups, no mobile overlaps and offline pitch');
