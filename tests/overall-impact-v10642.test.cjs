'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
require('../web/neo2-history-team-v201.js').install(E);

const m=new E.Match('ht','ba',20261118);
const attacker=m.players.find(p=>p.side===0&&p.i===9);
const defender=m.players.find(p=>p.side===1&&p.i!==0);
assert.ok(attacker&&defender);
const original={...attacker.attributes},other={...defender.attributes};

// Same individual skills, role, tactics and fatigue: OVR should still be felt
// on the real ball calculation, not only on a card in the ranking.
attacker.attributes.ovr=65;
const ordinary=m._attributes(attacker,'finishing');
attacker.attributes.ovr=95;
const elite=m._attributes(attacker,'finishing');
assert.ok(elite>ordinary*1.20,`OVR gap too subtle: ${elite} vs ${ordinary}`);

defender.attributes.ovr=65;
const upper=m._overallDuelEdge(attacker,defender);
const lower=m._overallDuelEdge(defender,attacker);
assert.ok(upper>=.12&&upper<=.14,`elite duel advantage: ${upper}`);
assert.ok(lower<=-.12&&lower>=-.14,`weaker rival's disadvantage: ${lower}`);
assert.equal(m._overallDuelEdge(attacker,attacker),0,'equals do not get imaginary buffs');
assert.equal(m._overallDuelEdge({attributes:{ovr:99}},{attributes:{ovr:60}}),.14,
 'no overall difference may create a guaranteed victory');
assert.equal(m._overallDuelEdge({},defender),0,'unknown ratings must not create a bonus');

const source=fs.readFileSync('web/engine.js','utf8');
for(const effect of [
 'this._overallDuelEdge(p,foe.p)',       // dribble versus defender
 'this._overallDuelEdge(q,owner)',       // real tackles versus ball carrier
 'this._overallDuelEdge(keeper,b.by',    // goalkeeper versus finisher
 'this._overallDuelEdge(p,oppositeKeeper' // finisher versus goalkeeper
])assert.ok(source.includes(effect),'OVR must affect the actual matchup: '+effect);

attacker.attributes=original;defender.attributes=other;
assert.equal(E.Attr.generate('Zeus','ZAG',2).ovr,93,'custom History ratings stay intact');
assert.equal(E.Attr.generate('Kash','MEI',6).ovr,89);
assert.equal(E.Attr.generate('Rodinha','SA',9).ovr,90);
console.log('PASS 10.6.42: bounded OVR gaps matter in finishing, dribbling, tackles and saves, without fixed victories.');
