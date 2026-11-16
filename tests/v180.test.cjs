'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const S=require('../web/neo-ego-saga-v180.js');
const read=p=>fs.readFileSync(p,'utf8');
function p(name,side,role,x,y,i=9){
 return {name,side,role,i,x,y,stamina:90,ego:42,attributes:{vision:93,finishing:95},
  activeAbility:null,abilityUses:{}};
}
const isagi=p('Yoichi Isagi',0,'MEI',390,510,8);
const kaiser=p('Michael Kaiser',0,'CA',1480,570);
const rin=p('Rin Itoshi',1,'CA',430,518);
const wing=p('Meguru Bachira',0,'PD',1370,860,7);
const m={
 time:140,phase:'play',_neo180Engine:E,players:[isagi,kaiser,rin,wing],
 teams:[{id:'bm'},{id:'px'}],careerPlayers:{},ball:{owner:isagi},
 log(s){(this.logs||(this.logs=[])).push(s);},
 _moment(side,type,s){(this.moments||(this.moments=[])).push({side,type,s});return true;},
 _ego(w,v){w.ego+=v;},
 _actionFx(kind,w,x,y,label){this.lastFx={kind,w:w.name,label};},
 progress:(side,x)=>side===0?x:1920-x,random:()=>0,
 offside:()=>false,safeLane:()=>90,opponentPressure:()=>0
};
assert.equal(S.duelObservation(m,isagi,rin,rin,'dribble').losses,1);
assert.equal(S.devourBonus(m,isagi,'tackling'),1,'one lost duel must not generate bonus');
m.time=170;
assert.equal(S.duelObservation(m,isagi,rin,rin,'dribble').losses,2);
assert.ok(S.devourBonus(m,isagi,'tackling')>1,'losses lead to opponent-specific learning');
assert.equal(S.devourBonus(m,isagi,'finishing'),1,'no general free skill');
m.time=220;
const breakthrough=S.duelObservation(m,isagi,rin,isagi,'dribble');
assert.equal(breakthrough.type,'devour','victory after losses creates a real Devouring event');
assert.equal(breakthrough.player,isagi.name);
assert.equal(S.devourBonus(m,isagi,'tackling'),1,'completed devouring no longer grants an unearned permanent buff');
assert.equal(S.duelObservation({...m,_neo180Devours:Object.create(null)},isagi,rin,isagi,'dribble').type,undefined,
 'winning first duel is not Devouring');
assert.ok(m._neo180Events.some(x=>x.type==='devour'));
const skill=E.Abilities.get('impact');
assert.ok(skill&&skill.id==='impact','official skill exists in engine');
kaiser.activeAbility={id:'impact',start:100,until:440};
m.time=250;
assert.ok(S.activeSkill(m,kaiser,'shot'),'active skill verified by existing skill registry');
assert.equal(S.activeSkill(m,kaiser,'tackle'),null,'active shot skill does not count as tackle');
assert.ok(S.weaponMultiplier(m,kaiser,'finishing')>1,'actual active weapon boosts a relevant stat');
assert.equal(S.weaponMultiplier(m,kaiser,'tackling'),1,'weapon context restrictions respected');
assert.equal(S.weaponMultiplier({...m,time:500},kaiser,'finishing'),1,'cooldown/expiry respected');
const rivalSkill=E.Abilities.get('metavision');
assert.ok(rivalSkill);
rin.activeAbility={id:'metavision',start:100,until:400};
m.time=275;
const impact=S.duelSkillImpact(m,kaiser,rin);
assert.equal(impact.attacker.id,'impact');
assert.equal(impact.defender.id,'metavision');
const clash=S.captureClash(m,kaiser,rin,rin,'tackle');
assert.equal(clash.winner,'Rin Itoshi','real duel winner cannot be overwritten');
assert.equal(clash.attackSkill,skill.label);
assert.equal(clash.defenseSkill,rivalSkill.label);
assert.equal(m.lastFx.w,rin.name);
assert.equal(S.captureClash({...m,time:900},p('Sem skill',0,'CA',200,200),p('Outro',1,'ZAG',400,400),rin,'tackle'),null,
 'without real skill activation no clash');
assert.equal(S.captureSkill(m,kaiser,skill,'shot').role,'FINALIZAÇÃO ESPECIAL');
const matchPass={
 ...m,time:350,ball:{owner:wing},players:[isagi,kaiser,rin,wing],
 shotQuality:()=>.16,random:()=>0,stats:{shots:[0,0]},pass(a,b){this.ball={owner:null,mode:'pass',by:a,to:b};}
};
assert.equal(S.eligibleCutback(matchPass,wing),kaiser,'wide winger targets a real onside box runner');
assert.equal(S.tryBoxMove(matchPass,wing),true);
assert.equal(matchPass.ball.to,kaiser,'actual launched pass is required');
assert.ok(matchPass._neo180Events.some(x=>x.type==='football'));
const invalid={...m,time:450,ball:{owner:wing},shotQuality:()=>.16,random:()=>0,
 offside:()=>true};
assert.equal(S.eligibleCutback(invalid,wing),null,'offside excluded');
assert.equal(S.eligibleCutback({...matchPass,ball:{owner:wing},shotQuality:()=>.4},wing),null,'do not force passes instead of a strong shot');
const run={...m,time:180,progress:(side,x)=>1100,random:()=>0};
assert.equal(S.tailoredRun(run,kaiser,wing,'diagonal'),'far-post','far post creates actual attack variation');
assert.equal(S.tailoredRun({...run,phase:'restart'},kaiser,wing,'diagonal'),'diagonal','no run while stopped');
assert.ok(S.cinema(m,'skill',kaiser,'Impacto ativado'));
assert.equal(S.cinema({...m,time:280},'skill',kaiser,'Impacto ativado'),null,'cinema is bounded per action type');
const report={egoSaga:{events:[
 {type:'devour',player:isagi.name,side:0,opponent:rin.name,label:'Devoração'},
 {type:'clash',player:kaiser.name,side:0,label:'Duelos'},
 {type:'cinema',player:kaiser.name,side:0,label:'Ação real'},
 {type:'football',player:wing.name,side:0,label:'Passe na área'},
 {type:'weapon',player:kaiser.name,side:0,label:'Impact'}]}};
const season={career:{players:{
 [isagi.name+'|bm']:{name:isagi.name,club:'bm',goals:7},
 [kaiser.name+'|bm']:{name:kaiser.name,club:'bm'},
 [wing.name+'|bm']:{name:wing.name,club:'bm'}}}};
const fixture={home:'bm',away:'px'};
assert.equal(S.recordCareer(E,season,fixture,{result:()=>report},1),true);
assert.equal(S.recordCareer(E,season,fixture,{result:()=>report},1),false,'idempotent season history');
assert.equal(season.career.players[isagi.name+'|bm'].egoSaga.devours,1);
assert.equal(season.career.players[isagi.name+'|bm'].goals,7,'existing stats untouched');
assert.equal(season.career.players[kaiser.name+'|bm'].egoSaga.weapons,1);
assert.equal(S.adapt(E),true,'real engine upgraded once');
assert.equal(S.adapt(E),false,'no double patch on repeated initialization');
for(let seed=18101;seed<18108;seed++){
 const game=new E.Match('bm','px',seed);
 game.rollGameplan();
 for(let tick=0;tick<360;tick++)game.step(E.TICK);
 assert.deepEqual(game.result().score,game.score,'never inject goals');
 assert.ok(Array.isArray(game.result().egoSaga.events),'real match log available');
 assert.ok(game.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'physics remain bounded');
}
assert.ok(read('web/app.js').includes("fast.value='40'"),'Turbo 40x not removed');
assert.ok(read('tools/sync_inline_v930.py').includes('neo-ego-saga-v180.js'));
assert.ok(read('web/index.html').includes('neo-ego-saga-v180.js'));
assert.ok(read('web/index.html').includes('neo-ego-saga-v180.css'));
const worker=read('web/service-worker.js');
assert.ok(worker.includes('./neo-ego-saga-v180.js'));
assert.ok(worker.includes('blue-lock-neo-v1.10.1-ux-money'));
const releases=JSON.parse(read('CHANGELOG.json'));
assert.equal(releases.current_version,'1.8.0');
assert.equal(releases.releases[0].version,'1.8.0');
assert.equal(read('web/VERSION').trim(),'1.8.0');
assert.equal(read('web/UPDATE_BUILD').trim(),'10.6.15');
assert.ok(read('app/build.gradle').includes("versionName '1.8.0'"));
assert.ok(read('app/build.gradle').includes('versionCode 117'));
console.log('PASS EGO SAGA v1.7: earned devouring, active weapons, real skill clashes, cinema and dynamic box football');
