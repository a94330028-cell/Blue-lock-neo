'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
require('../web/neo2-history-team-v201.js').install(E);
const A=E.Attr;
const squads=E.TEAMS.flatMap(t=>t.players.map((name,i)=>({
 name,role:t.formation[i].role,ovr:A.generate(name,t.formation[i].role,i).ovr
})));
const get=n=>squads.find(x=>x.name===n)?.ovr;
assert.equal(get('Michael Kaiser'),88);
assert.equal(get('Seishiro Nagi'),84);
assert.equal(get('Jingo Raichi'),81);
assert.ok(get('Michael Kaiser')>get('Jingo Raichi')&&get('Jingo Raichi')>72,
 'protagonistas, titulares e reservas precisam ter patamares distintos');
assert.ok(Math.max(...squads.map(x=>x.ovr))-Math.min(...squads.map(x=>x.ovr))>=17,
 'elencos originais têm uma faixa de OVR perceptível');
assert.ok(squads.every(x=>x.ovr>=60&&x.ovr<=90));
for(const role of ['GOL','ZAG','MC','CA','PD']){
 const a=A.generate('Jogador automático A',role,role==='GOL'?0:1),b=A.generate('Jogador automático B',role,role==='GOL'?0:1);
 assert.ok(a.ovr>=60&&a.ovr<=79&&b.ovr>=60&&b.ovr<=79,
  'atletas gerados automaticamente não começam com nota de craque');
 assert.equal(a.ovr,A.generate('Jogador automático A',role,role==='GOL'?0:1).ovr,
  'o jogador não recebe atributos aleatórios diferentes em cada entrada');
 const values=A.KEYS.filter(x=>x!=='ego').map(x=>a[x]);
 assert.ok(Math.max(...values)-Math.min(...values)>=15,
  'os pontos fortes e fracos gerados precisam ser visíveis');
}
for(const [name,role,overall] of [['Zenkai','CA',90],['Kash','MEI',89],['Rodinha','SA',90],
 ['Zeus','ZAG',93],['Sae Itoshi','MEI',98]])
 assert.equal(A.generate(name,role,role==='GOL'?0:1).ovr,overall,
  'valores definidos por Dezinho no History permanecem: '+name);
for(const t of E.TEAMS)assert.ok(A.generate(t.master,'CA',9).ovr>=96);
const demo=new E.Match('mc','bm',1234),reo=demo.players.find(x=>x.name==='Reo Mikage');
const normal=demo._attributes(reo,'passing'),ovr=reo.attributes.ovr;
reo.attributes.ovr=65;
assert.ok(normal>demo._attributes(reo,'passing'),
 'o OVR continua afetando os passes durante a partida de verdade');
reo.attributes.ovr=ovr;
const ui=fs.readFileSync('web/neo-v960.js','utf8');
const css=fs.readFileSync('web/neo-v960.css','utf8');
assert.ok(ui.includes('Identidade em campo')&&ui.includes('A evoluir:')&&ui.includes('neo960-skill-leaders'));
assert.ok(css.includes('.neo960-attribute.elite i')&&css.includes('.neo960-attribute.evolucao i'));
console.log('PASS 10.6.40: OVR tiers, role specialization, visible attribute gaps, original History ratings and match impact');
