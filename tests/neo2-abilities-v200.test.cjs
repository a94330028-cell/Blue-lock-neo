'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const addon=require('../web/neo2-abilities-v200.js');
const a=E.Abilities;
const legacy=a.get('metavision');
const initial=a.list().length;
assert.ok(initial>=754,'must preserve existing catalogue');
addon.install(a);
const all=a.list(),newSkills=addon.added();
assert.equal(newSkills.length,2520,'exactly 2520 new distinct skills');
assert.equal(all.length,initial+2520,'registry includes original and new skills');
assert.equal(new Set(all.map(z=>z.id)).size,all.length,'ability IDs must be unique');
assert.equal(new Set(newSkills.map(z=>z.label)).size,newSkills.length,'generated names are unique');
assert.strictEqual(a.get('metavision'),legacy,'legacy IDs and original effects unchanged');
assert.strictEqual(addon.install(a),a,'install is safe to repeat');
assert.equal(a.list().length,initial+2520,'idempotent installation');
const rarityStats=a.neo2CatalogStats();
for(const rarity of ['Comum','Incomum','Rara','Épica','Lendária','Mítica','Divina'])
 assert.equal(rarityStats.rarities[rarity],360,rarity+' count');
for(const ability of newSkills){
 assert.ok(ability.id.startsWith('neo2-'));
 assert.ok(ability.multiplier>=1&&ability.multiplier<=1.85,'balanced multiplier');
 assert.ok(ability.duration>=20&&ability.cooldown>=70&&ability.cost>=2);
 assert.ok(ability.roles.length&&ability.contexts.length===1);
 assert.ok(['normal','pressure','space','box','after-pass','transition','wing'].includes(ability.trigger));
 assert.ok(fs.existsSync('web/assets/neo2-skills/'+ability.contexts[0]+'.svg'),'shared artwork must exist offline');
}
assert.equal(a.commonCatalog().filter(z=>z.id.startsWith('neo2-')).length,360);
assert.equal(a.fullCatalog().filter(z=>z.id.startsWith('neo2-')).length,2520);
const fresh={games:0,goals:0,assists:0,unlocked:[]};
const evolved={games:28,goals:40,assists:30,saves:0,tackles:15,ratingSum:230,unlocked:[]};
const gk=a.loadout('Gin Gagamaru','GOL',0,fresh);
const st=a.loadout('Shoei Baro','CA',9,fresh);
const mid=a.loadout('Yoichi Isagi','MEI',6,fresh);
assert.ok(gk.some(x=>x.id.startsWith('neo2-')&&x.contexts.includes('save')),'keepers learn goalkeeping skills');
assert.ok(!gk.some(x=>x.id.startsWith('neo2-')&&x.contexts.includes('shot')),'keepers do not equip shooter skills');
assert.ok(st.some(x=>x.id.startsWith('neo2-')&&x.contexts.includes('shot')),'strikers learn finishing skills');
assert.ok(mid.some(x=>x.id.startsWith('neo2-')&&x.contexts.includes('pass')),'midfielders learn passes');
assert.ok(a.available('Shoei Baro','CA',9,fresh).some(x=>x.id.startsWith('neo2-')),'normal players can activate new skills from the first match');
assert.ok(!a.available('Shoei Baro','CA',9,fresh).some(x=>x.id.startsWith('neo2-')&&x.rarity==='Divina'),'Divina locked to new players');
assert.ok(a.available('Shoei Baro','CA',9,evolved).some(x=>x.id.startsWith('neo2-')&&x.rarity==='Divina'),'Divina earnable from real matches');
assert.deepEqual(a.loadout('Shoei Baro','CA',9,fresh).filter(x=>x.id.startsWith('neo2-')).map(x=>x.id),
 a.loadout('Shoei Baro','CA',9,fresh).filter(x=>x.id.startsWith('neo2-')).map(x=>x.id),
 'selected skill slots must be deterministic and reproducible');
const common=a.available('Shoei Baro','CA',9,fresh).find(x=>x.id.startsWith('neo2-')&&x.rarity==='Comum'&&x.contexts.includes('shot'));
assert.ok(common,'a common ability is actually available to the player');
const dummy={stamina:100,activeAbility:null,abilityCooldowns:{},abilityUses:{},abilityGlobalUntil:0};
assert.equal(a.canActivate(dummy,common,100,'shot'),true);
const activated=a.activate(dummy,common.id,100,'shot');
assert.equal(activated?.id,common.id,'new skill activates in real engine');
assert.ok(dummy.stamina<100&&dummy.abilityUses[common.id]===1);
assert.equal(a.canActivate(dummy,common,101,'shot'),false,'cooldown is enforced');
assert.ok(a.bonus(dummy,common.stat,101)>1,'ability really changes game stat');
assert.equal(a.bonus(dummy,common.stat,100+common.duration+2),1,'effect expires');
assert.ok(a.tacticalBonus(dummy,'shot',101)>0,'skill family changes tactical context');
const sw=fs.readFileSync('web/service-worker.js','utf8');
for(const asset of ['neo2-abilities-v200.js','assets/neo2-skills/shot.svg','assets/neo2-skills/dribble.svg','assets/neo2-skills/pass.svg','assets/neo2-skills/tackle.svg','assets/neo2-skills/save.svg'])
 assert.ok(sw.includes(asset),'offline caching of '+asset);
const loader=fs.readFileSync('tools/sync_inline_v930.py','utf8');
assert.ok(loader.includes('neo2-abilities-v200.js'),'both Android and web bundles load new module');
const app=fs.readFileSync('web/app.js','utf8');
assert.ok(app.includes("assets/neo2-skills/"),'real Arsenal card artwork source wired');
console.log('PASS NEO 2.0: '+initial+' preserved + '+newSkills.length+' new skills = '+all.length+' total; rarity, role, activation, cooldown, offline artwork validated');
