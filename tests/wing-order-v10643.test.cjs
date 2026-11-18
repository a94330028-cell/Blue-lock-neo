'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const C=require('../web/neo-coach-v980.js');
const Layout=require('../web/neo-pitch-layout-v1040.js');
const Round=require('../web/neo-round-v990.js');
require('../web/neo2-history-team-v201.js').install(E);

// Coach-created 3-3-4 previously placed PD directly beside PE because
// it distributed forwards in roster order: PD, PE, CA, CA.
const formation=C.shapeSlots('3-3-4');
const find=role=>formation.findIndex(x=>x.role===role);
assert.equal(formation.length,11);
assert.ok(formation[find('PE')].y<formation[9].y);
assert.ok(formation[9].y<formation[10].y);
assert.ok(formation[10].y<formation[find('PD')].y,
 'forward lanes should read PE, CA, CA, PD from left to right');

const source=fs.readFileSync('web/neo-squads-v980.js','utf8');
const start=source.indexOf('function formationRows('),end=source.indexOf('\nfunction player(',start);
assert.ok(start>=0&&end>start);
const formationRows=new Function('window',source.slice(start,end)+'\nreturn formationRows;')({NeoPitch1040:Layout});
const club={formationName:'3-3-4',formation};
const rows=formationRows(club,formation,Layout.layout(club,formation));
assert.deepEqual(rows[0].indices.map(i=>formation[i].role),['PE','CA','CA','PD'],
 'four attacker cards must follow tactical sides, not the roster order');
assert.equal(new Set(rows.flatMap(r=>r.indices)).size,11);

// Older saved lineups and vanilla clubs must get the same visual correction.
for(const team of [E.teamById('ht'),E.teamById('bm'),E.teamById('mc')]){
 const f=team.formation,points=Layout.layout(team,f);
 const left=f.findIndex(x=>x.role==='PE'),right=f.findIndex(x=>x.role==='PD');
 assert.ok(points[left].lane<points[right].lane,team.name+' PE must be left of PD');
 const actual=formationRows(team,f,points)[0].indices.map(i=>f[i].role);
 assert.ok(actual.indexOf('PE')<actual.indexOf('PD'),team.name+' visible attacker cards');
}

// Championship selection uses separate cards, with the same sides.
const slots=['GOL','LD','ZAG','ZAG','LE','VOL','MC','MEI','PD','CA','PE'];
const xi={players:slots.map((slot,i)=>({slot,name:'Teste '+slot+' '+i,club:'ht',ovr:80}))};
const html=Round.xiCardsHTML(xi,name=>'<img alt="'+name+'">','mobile');
const attack=html.split('<h4>ATAQUE</h4>')[1].split('</section>')[0];
assert.ok(attack.indexOf('Teste PE')<attack.indexOf('Teste CA'));
assert.ok(attack.indexOf('Teste CA')<attack.indexOf('Teste PD'));
const defense=html.split('<h4>DEFESA</h4>')[1].split('</section>')[0];
assert.ok(defense.indexOf('Teste LE')<defense.indexOf('Teste LD'));
console.log('PASS 10.6.43: PE/LE left, PD/LD right in coach tactics, History cards and championship XI.');
