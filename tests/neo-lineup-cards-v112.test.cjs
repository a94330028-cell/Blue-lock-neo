'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const H=require('../web/neo-historic-teams-v970.js');
const Layout=require('../web/neo-pitch-layout-v1040.js');
const source=fs.readFileSync('web/neo-squads-v980.js','utf8');
const css=fs.readFileSync('web/neo-pitch-v1040.css','utf8');
// Test exactly the layout function used by the browser, not a duplicate.
const start=source.indexOf('function formationRows(');
const end=source.indexOf('\nfunction player(',start);
assert.ok(start>0&&end>start,'tactical formation row helper is available');
const formationRows=new Function('window',source.slice(start,end)+'\nreturn formationRows;')({NeoPitch1040:Layout});
H.install(E);
const clubs=E.allTeams();
assert.ok(clubs.length>=9);
for(const team of clubs){
 const f=team.formation||E.DEFAULT_FORMATION,spots=Layout.layout(team,f);
 const rows=formationRows(team,f,spots);
 const indices=rows.flatMap(r=>r.indices);
 assert.equal(indices.length,11,team.name+': exactly eleven cards');
 assert.equal(new Set(indices).size,11,team.name+': no duplicated players');
 assert.deepEqual(indices.slice().sort((a,b)=>a-b),Array.from({length:11},(_,i)=>i),team.name+': no lost slot');
 assert.equal(rows.at(-1).indices[0],0,team.name+': keeper remains at the bottom');
 for(const r of rows){
  assert.ok(r.indices.every((i,j)=>j===0||spots[r.indices[j-1]].lane<=spots[i].lane),team.name+': tactical line ordered left to right');
  assert.equal(r.indices.length,r.size);
 }
 const shape=Layout.formationKey(team.formationName);
 if(shape&&shape.split('-').reduce((a,b)=>a+Number(b),0)===10){
  const expected=shape.split('-').map(Number).reverse().concat([1]);
  assert.deepEqual(rows.map(r=>r.size),expected,team.name+': real '+shape+' preserved in large cards');
 }
}
const mc=E.teamById('mc'),mcRows=formationRows(mc,mc.formation,Layout.layout(mc,mc.formation));
assert.deepEqual(mcRows.map(r=>r.size),[3,4,3,1],'Manshine 3-4-3: 3 forward, 4 midfield, 3 defenders and keeper');
const custom={formationName:'4-2-3-1',formation: E.DEFAULT_FORMATION.map(x=>({...x}))};
const customRows=formationRows(custom,custom.formation,Layout.layout(custom,custom.formation));
assert.deepEqual(customRows.map(r=>r.size),[1,3,2,4,1],'more complex shapes remain readable');
const fallback={formationName:'Custom',formation:mc.formation};
assert.equal(formationRows(fallback,fallback.formation,Layout.layout(fallback,fallback.formation)).flatMap(x=>x.indices).length,11,'unknown custom formations still contain all players');
for(const piece of ['neo980-lineup-card','neo980-card-portrait','neo980-formation-rows','neo980-card-pitch','data-neo960-profile','NeoPortraitUI','neo980-ovr','neo980-select','NeoPitch1040?.layout(t,f)']){
 assert.ok(source.includes(piece),piece+' must be used in the active squad view');
}
for(const piece of ['#neo980-squad-area .neo980-card-pitch','.neo980-lineup-card','.neo980-card-portrait','.neo980-card-body','.neo980-formation-rows','grid-template-columns:repeat(var(--line-count)','@media(max-width:370px)']){
 assert.ok(css.includes(piece),'responsive ranking-style player cards: '+piece);
}
assert.ok(css.includes('position:relative!important'),'cards are not absolute overlapping badges');
assert.ok(css.includes('height:auto!important'),'formation grows with actual card count');
assert.ok(css.includes('#neo980-squad-area .neo980-pitch.neo980-card-pitch'),'responsive lineup overrides fixed PC pitch height');
assert.ok(source.includes('neo980-coach-card')&&source.includes('neo980-reserves'),'coach and bench remain accessible');
assert.equal(fs.readFileSync('web/UPDATE_BUILD','utf8').trim(),'10.6.21');
console.log('PASS NEO 10.6.20: 11 readable lineup cards, formations, responsive slots, intact coach and bench');