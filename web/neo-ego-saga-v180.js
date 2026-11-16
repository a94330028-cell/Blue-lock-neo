/* Blue Lock NEO v1.7.0 — Five systems: Devouring, Special Weapons,
 * Skill Clashes, Cinema and Dynamic Football.
 * Deterministic simulation, additive stats, no artificial scores or saves.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
 if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const valid=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const playerKey=p=>String(p?.side)+':'+String(p?.name);
const OFFENSE=new Set(['CA','CF','ST','SA','PE','PD','RW','LW']);
const WINGS=new Set(['PE','PD','RW','LW','LD','LE','LB','RB','ALA','RWB','LWB']);
const MID=new Set(['MEI','CAM','MC','CM','VOL','CDM']);
const DEFENSE=new Set(['ZAG','CB','LD','LE','RB','LB','VOL','CDM']);
const stageType={dribble:'dribble',shot:'shot',pass:'pass',save:'save',tackle:'tackle'};
const techniqueNames={dribble:'DRIBLE DE EGO',shot:'FINALIZAÇÃO ESPECIAL',pass:'PASSE DE RUPTURA',save:'DEFESA INSTINTIVA',tackle:'ANTECIPAÇÃO DEFENSIVA'};
function push(target,row,max=42){target.push(row);if(target.length>max)target.splice(0,target.length-max);}
function event(match,type,player,details={}){
 if(!match||!player)return null;
 const row={type,player:player.name,side:player.side,minute:Math.floor(n(match.time)/60),
  time:+n(match.time).toFixed(1),...details};
 const arr=match._neo180Events||(match._neo180Events=[]);
 push(arr,row,70);
 return row;
}
function activeSkill(match,p,context=null){
 if(!match||!p||!p.activeAbility||n(p.activeAbility.until)<=n(match.time))return null;
 const skill=match._neo180Engine?.Abilities?.get?.(p.activeAbility.id);
 if(!skill)return null;
 if(context&&!skill.contexts?.includes(context))return null;
 return skill;
}
function duelObservation(match,attacker,defender,winner,kind){
 if(!match||!attacker||!defender||!winner||attacker.side===defender.side)return null;
 const loser=winner===attacker?defender:winner===defender?attacker:null;
 if(!loser||!loser.name||!winner.name)return null;
 const all=match._neo180Devours||(match._neo180Devours=Object.create(null));
 const id=playerKey(loser)+'|'+playerKey(winner);
 const old=all[id];
 const same=old&&old.until>=match.time;
 const count=clamp((same?n(old.losses):0)+1,1,5);
 const seen={learner:loser.name,loserSide:loser.side,foe:winner.name,foeKey:playerKey(winner),
  losses:count,context:String(kind||'disputa').slice(0,24),until:match.time+480,adapted:false};
 all[id]=seen;
 // Devouring requires losing several real duels. This is not skill theft.
 if(count===2){
  event(match,'devour-read',loser,{opponent:winner.name,
   label:'Reconheceu o padrão após dois duelos perdidos'});
  match.log?.('🧩 '+loser.name+' estuda '+winner.name+' após perder dois duelos.','duel',loser.name);
 }
 const memory=all[playerKey(winner)+'|'+playerKey(loser)];
 if(memory&&memory.losses>=2&&memory.until>=match.time&&!memory.adapted){
  memory.adapted=true;memory.until=match.time+100;
  const rec=event(match,'devour',winner,{opponent:loser.name,
   label:'DEVORAÇÃO: superou a arma do rival após aprender com derrotas'});
  if(match.time-n(match._neo180LastDevourLog??-1000)>=120){
   match._neo180LastDevourLog=match.time;
   match._moment?.(winner.side,'duel','🔥 DEVORAÇÃO! '+winner.name+' supera '+loser.name+' após estudar seus movimentos.',[winner.name,loser.name]);
   match._ego?.(winner,2,'devoração de rival');
  }
  return rec;
 }
 return seen;
}
function devourBonus(match,p,stat){
 if(!match||!p||!['dribbling','control','tackling','defense','positioning','vision'].includes(stat))return 1;
 const entries=match._neo180Devours;
 if(!entries)return 1;
 let strongest=1;
 for(const v of Object.values(entries)){
  if(!v||v.learner!==p.name||v.loserSide!==p.side||v.until<match.time||v.losses<2||v.adapted)continue;
  const foe=match.players?.find(q=>q&&playerKey(q)===v.foeKey);
  if(!foe||!valid(foe)||!valid(p)||dist(foe,p)>180)continue;
  const defense=/tackle|desarme|block|intercept/i.test(v.context);
  const compatible=defense?['dribbling','control','vision'].includes(stat):
   ['tackling','defense','positioning'].includes(stat);
  if(compatible)strongest=Math.max(strongest,1+Math.min(.042,.016+v.losses*.006));
 }
 return strongest;
}
function weaponMultiplier(match,p,stat){
 const a=activeSkill(match,p);
 if(!a||!p||!match)return 1;
 // Skill activation and stamina costs belong to the original abilities module.
 const scope=String(a.contexts?.[0]||'');
 const compatible={
  dribble:['dribbling','acceleration','control'],pass:['vision','passing','control'],
  shot:['finishing','positioning','power'],save:['reflexes','positioning'],
  tackle:['tackling','defense','positioning']
 };
 if(!compatible[scope]?.includes(stat))return 1;
 const relevant=stat===a.stat;
 const energy=clamp((n(p.stamina)-25)/75,.3,1);
 const mastery=clamp(n(match.careerPlayers?.[p.name+'|'+match.teams?.[p.side]?.id]?.weaponMastery?.[a.id])||1,1,3);
 const stage=1+(relevant?.023:.010)+(mastery-1)*.005;
 return 1+(stage-1)*energy;
}
function duelSkillImpact(match,attacker,defender){
 if(!match||!attacker||!defender)return {attacker:null,defender:null};
 const a=activeSkill(match,attacker),b=activeSkill(match,defender);
 return {attacker:a?{id:a.id,label:a.label,kind:a.kind,context:a.contexts?.[0]}:null,
  defender:b?{id:b.id,label:b.label,kind:b.kind,context:b.contexts?.[0]}:null};
}
function captureClash(match,attacker,defender,winner,kind){
 if(!attacker||!defender||!winner||!match)return null;
 const used=duelSkillImpact(match,attacker,defender);
 if(!used.attacker&&!used.defender)return null;
 const result=event(match,'clash',winner,{
  attacker:attacker.name,defender:defender.name,winner:winner.name,
  attackSkill:used.attacker?.label||null,defenseSkill:used.defender?.label||null,
  kind:String(kind||'duelo'),label:'Duelo entre habilidades utilizadas de verdade'
 });
 if(match.time-n(match._neo180LastClashFx??-1000)>110){
  match._neo180LastClashFx=match.time;
  match._actionFx?.('skill',winner,winner.x,winner.y,'⚔️ DUELO — '+winner.name);
  match.log?.('⚔️ '+(used.attacker?.label||'Ataque comum')+' × '+(used.defender?.label||'Defesa comum')+
   ': '+winner.name+' levou a melhor.','skill',winner.name);
 }
 return result;
}
function eligibleCutback(match,p){
 if(!match||!p||p.i===0||!WINGS.has(p.role)||match.phase!=='play'||match.ball?.owner!==p)return null;
 if(!valid(p)||n(p.stamina)<25)return null;
 const prog=match.progress?.(p.side,p.x)||0;
 const cy=match._neo180Engine?.PITCH?.cy||576;
 if(prog<1240||prog>1730||Math.abs(p.y-cy)<150)return null;
 const chance=match.shotQuality?.(p)||0;
 if(chance>.29||match.random()>=.34)return null;
 const candidates=(match.players||[]).filter(q=>q&&q!==p&&q.side===p.side&&q.i!==0&&valid(q)&&
  (match.progress?.(p.side,q.x)||0)>1240&&Math.abs(q.y-cy)<170&&
  !match.offside?.(q,p)&&dist(p,q)>48&&dist(p,q)<350);
 let best=null;
 for(const q of candidates){
  const lane=match.safeLane?.(p,q)||0;
  const press=match.opponentPressure?.(q,78)||0;
  if(lane<52||press>1)continue;
  const score=lane-press*25-dist(p,q)*.10+(OFFENSE.has(q.role)?14:0);
  if(!best||score>best.score)best={q,score};
 }
 return best?.q||null;
}
function tryBoxMove(match,p){
 if(!match||!p||match.time-n(p._neo180BoxAt??-1000)<120)return false;
 const teammate=eligibleCutback(match,p);
 if(!teammate)return false;
 match.pass?.(p,teammate);
 const real=match.ball?.mode==='pass'&&match.ball.by===p&&match.ball.to===teammate;
 if(real){
  p._neo180BoxAt=match.time;
  event(match,'football',p,{opponent:teammate.name,
   label:'Passe para finalização dentro da área após infiltração real'});
  match.log?.('🎯 '+p.name+' recua para '+teammate.name+' finalizar por dentro da área.','pass',p.name);
 }
 return !!real;
}
function tailoredRun(match,p,owner,fallback){
 if(!match||!p||!owner||p.side!==owner.side||p.i===0||match.phase!=='play')return fallback;
 const progress=match.progress?.(p.side,owner.x)||0;
 const ownProg=match.progress?.(p.side,p.x)||0;
 if(progress<800||progress>1450||n(p.stamina)<30)return fallback;
 const cb=match._neo180Engine?.PITCH?.cy||576;
 const wing=Math.abs(owner.y-cb)>210;
 if(wing&&OFFENSE.has(p.role)&&ownProg<1630&&match.random()<.44)return 'far-post';
 if(wing&&MID.has(p.role)&&Math.abs(p.y-cb)<250&&match.random()<.26)return 'cutback';
 if(wing&&DEFENSE.has(p.role)&&p.i!==0&&match.random()<.13&&progress>1120)return 'underlap';
 return fallback;
}
function captureSkill(match,p,skill,context){
 if(!match||!p||!skill)return null;
 const type=stageType[context]||stageType[skill.contexts?.[0]]||'skill';
 return event(match,'weapon',p,{
  abilityId:skill.id,label:skill.label,kind:skill.kind,category:type,
  role:techniqueNames[type]||'HABILIDADE DE EGO'
 });
}
function cinema(match,type,p,label,other=null){
 if(!match||!p||!label)return null;
 const last=match._neo180LastCinema?.[type]??-1000;
 if(match.time-last<62)return null;
 const map=match._neo180LastCinema||(match._neo180LastCinema=Object.create(null));
 map[type]=match.time;
 return event(match,'cinema',p,{kind:type,label:String(label).slice(0,100),opponent:other||null});
}
function summary(match){
 return {events:(match?._neo180Events||[]).slice(-48).map(e=>({...e})),
  devouries:(match?._neo180Events||[]).filter(e=>e.type==='devour').slice(-10).map(e=>({...e})),
  clashes:(match?._neo180Events||[]).filter(e=>e.type==='clash').slice(-16).map(e=>({...e})),
  cinema:(match?._neo180Events||[]).filter(e=>e.type==='cinema').slice(-16).map(e=>({...e}))};
}
function recordCareer(engine,season,fixture,match,round){
 const c=season?.career,d=match?.result?.()?.egoSaga;
 if(!c?.players||!d||!fixture?.home||!fixture?.away)return false;
 c.egoSagaRecorded=c.egoSagaRecorded||{};
 const stamp=round+'|'+fixture.home+'|'+fixture.away;
 if(c.egoSagaRecorded[stamp])return false;
 c.egoSagaRecorded[stamp]=1;
 for(const item of d.events||[]){
  if(!item?.player||![0,1].includes(item.side))continue;
  const club=item.side===0?fixture.home:fixture.away;
  const player=c.players[item.player+'|'+club];
  if(!player)continue;
  const saga=player.egoSaga||(player.egoSaga={devours:0,duels:0,weapons:0,cinema:0,football:0,history:[]});
  const metric={devour:'devours',clash:'duels',weapon:'weapons',cinema:'cinema',football:'football'}[item.type];
  if(metric)saga[metric]=n(saga[metric])+1;
  if(metric&&['devour','clash','cinema','football'].includes(item.type)){
   push(saga.history,{round,type:item.type,label:item.label||'',against:item.opponent||null},22);
  }
 }
 const stamps=Object.keys(c.egoSagaRecorded);
 for(const id of stamps.slice(0,Math.max(0,stamps.length-200)))delete c.egoSagaRecorded[id];
 return true;
}
function adapt(engine){
 const p=engine?.Match?.prototype;
 if(!p||p._neo180Systems)return false;
 const abilities=engine.Abilities;
 if(typeof p._attributes==='function'){
  const original=p._attributes;
  p._attributes=function(player,stat){
   const base=original.call(this,player,stat);
   if(!player||!Number.isFinite(base))return base;
   this._neo180Engine=engine;
   return clamp(base*devourBonus(this,player,stat)*weaponMultiplier(this,player,stat),1,125);
  };
 }
 if(typeof p._activateAbility==='function'){
  const original=p._activateAbility;
  p._activateAbility=function(player,context){
   this._neo180Engine=engine;
   const skill=original.call(this,player,context);
   if(skill)captureSkill(this,player,skill,context);
   return skill;
  };
 }
 if(typeof p._recordDuel==='function'){
  const original=p._recordDuel;
  p._recordDuel=function(attacker,defender,winner,kind){
   const previous=this.duelHistory?.at(-1);
   this._neo180Engine=engine;
   const out=original.call(this,attacker,defender,winner,kind);
   if(!this.duelHistory?.length||this.duelHistory.at(-1)===previous)return out;
   duelObservation(this,attacker,defender,winner,kind);
   captureClash(this,attacker,defender,winner,kind);
   return out;
  };
 }
 if(typeof p._runType==='function'){
  const original=p._runType;
  p._runType=function(player,owner){
   this._neo180Engine=engine;
   return tailoredRun(this,player,owner,original.call(this,player,owner));
  };
 }
 if(typeof p._ownerDecision==='function'){
  const original=p._ownerDecision;
  p._ownerDecision=function(player){
   this._neo180Engine=engine;
   if(tryBoxMove(this,player))return;
   return original.call(this,player);
  };
 }
 if(typeof p.shotQuality==='function'){
  const original=p.shotQuality;
  p.shotQuality=function(player){
   const base=original.call(this,player);
   this._neo180Engine=engine;
   const a=activeSkill(this,player,'shot');
   if(!a||!player||!Number.isFinite(base))return base;
   const goalDist=player.side===0?
    (engine.PITCH?.right||1845)-n(player.x):n(player.x)-(engine.PITCH?.left||75);
   const quality=goalDist<430&&n(player.stamina)>30?clamp((n(a.tier)||1)*.007,0,.022):0;
   return clamp(base+quality,.012,.52);
  };
 }
 if(typeof p._actionFx==='function'){
  const original=p._actionFx;
  p._actionFx=function(kind,player,x,y,label,side){
   const result=original.call(this,kind,player,x,y,label,side);
   if(player&&['shot','save','tackle','skill','block','intercept','header','volley','acro-shot'].includes(kind))
    cinema(this,String(kind),player,String(label||kind));
   return result;
  };
 }
 if(typeof p._moment==='function'){
  const original=p._moment;
  p._moment=function(side,type,description,players){
   const old=this.specialMoments?.[0];
   const result=original.call(this,side,type,description,players);
   if(result&&this.specialMoments?.[0]!==old){
    const player=this.players?.find(q=>q&&q.side===side&&q.name===players?.[0]);
    if(player)cinema(this,String(type),player,String(description).slice(0,100),players?.[1]||null);
   }
   return result;
  };
 }
 if(typeof p.result==='function'){
  const original=p.result;
  p.result=function(){
   const data=original.call(this);
   data.egoSaga=summary(this);
   return data;
  };
 }
 const progression=engine.Progression;
 if(progression&&typeof progression.record==='function'&&!progression._neo180Progress){
  const original=progression.record;
  progression.record=function(season,fixture,match,round){
   const data=original.call(this,season,fixture,match,round);
   recordCareer(engine,season,fixture,match,round);
   return data;
  };
  Object.defineProperty(progression,'_neo180Progress',{value:true});
 }
 Object.defineProperty(p,'_neo180Systems',{value:true});
 return true;
}
function mount(win){
 const doc=win.document;
 const make=(tag,cls,txt)=>{
  const el=doc.createElement(tag);if(cls)el.className=cls;
  if(txt!==undefined)el.textContent=String(txt);return el;
 };
 function render(){
  const records=doc.getElementById('records');if(!records)return;
  let panel=doc.getElementById('neo180-saga');
  if(!panel){panel=make('section','neo180-saga');panel.id='neo180-saga';records.append(panel);}
  let saved;
  try{saved=JSON.parse(win.localStorage.getItem('neo-season-v2')||'null');}catch(_){saved=null;}
  const rounds=saved?.rounds||[];
  const reports=rounds.flatMap(r=>(r.games||[]).filter(g=>Array.isArray(g.result)&&g.details?.egoSaga)
   .map(g=>({...g,round:r.round,saga:g.details.egoSaga}))).slice(-24).reverse();
  panel.replaceChildren();
  const title=make('div','neo180-title');
  title.append(make('strong',null,'🎬 EGO SAGA · EPISÓDIOS REAIS'),
   make('small',null,'DEVORAÇÃO · ARMAS · DUELOS · CINEMA · FUTEBOL'));
  panel.append(title);
  if(!reports.length){
   panel.append(make('p','neo180-muted','Os episódios aparecerão após partidas oficiais desta atualização.'));
   return;
  }
  let count=0;
  for(const report of reports){
   const events=(report.saga?.events||[]).filter(e=>['devour','weapon','clash','cinema','football'].includes(e.type));
   if(!events.length)continue;
   const details=make('details','neo180-episode');
   const label=make('summary',null,'Rodada '+report.round+' · '+report.home+' '+report.result.join(' × ')+' '+report.away+
    ' · '+events.length+' acontecimentos');
   details.append(label);
   const list=make('ol','neo180-timeline');
   for(const e of events.slice(-14)){
    const type={devour:'🔥',weapon:'✦',clash:'⚔️',cinema:'🎬',football:'⚽'}[e.type]||'⚡';
    const row=make('li',null,type+' '+e.minute+"' "+e.player+' — '+(e.label||e.type)+
      (e.opponent?' · '+e.opponent:''));
    list.append(row);
   }
   details.append(list);panel.append(details);if(++count===9)break;
  }
  if(!count)panel.append(make('p','neo180-muted','Ainda não há lances especiais registrados nestas partidas.'));
 }
 const boot=()=>{
  if(doc.getElementById('records')){
   render();
   doc.addEventListener('click',e=>{
    if(e.target.closest?.('[data-tab="records"],[data-neo-tab="records"]'))win.setTimeout(render,110);
   });
   win.addEventListener('focus',render);
  }
  const ticker=doc.getElementById('ticker');
  const stadium=doc.getElementById('stadium');
  if(!ticker||!stadium||!win.MutationObserver)return;
  const cue=make('div','neo180-live');
  cue.id='neo180-live';cue.setAttribute('aria-hidden','true');stadium.append(cue);
  let last='',at=0,hide=null;
  const show=()=>{
   const text=String(ticker.textContent||'').trim();
   if(text===last||!text||!doc.querySelector('.nav button[data-tab="match"].active'))return;
   last=text;
   if(!/(DEVORAÇÃO|DUELO|DESPERTAR|KAISER IMPACT|METAVISION|GOLAÇO|DEFESA LENDÁRIA|QUASE GOL)/i.test(text))return;
   if(doc.getElementById('neo1010-cinema')?.checked===false)return;
   if(Date.now()-at<2200)return;at=Date.now();
   cue.textContent=text.slice(0,120);cue.classList.add('visible');
   win.clearTimeout(hide);hide=win.setTimeout(()=>cue.classList.remove('visible'),1450);
  };
  new win.MutationObserver(show).observe(ticker,{childList:true,characterData:true,subtree:true});
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {duelObservation,devourBonus,activeSkill,weaponMultiplier,duelSkillImpact,captureClash,
 eligibleCutback,tryBoxMove,tailoredRun,captureSkill,cinema,summary,recordCareer,adapt,mount};
});