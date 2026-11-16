/* Blue Lock NEO v1.3.0 — Ego Combat: real Flow, Metavision, Devouring,
 * skill confrontations and contextual awakenings. No artificial goals.
 * Integrates with existing ability costs, seeded physics and saved seasons.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
 if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const active=(p,time)=>p?.activeAbility&&N(p.activeAbility.until)>time;
const distance=(a,b)=>Math.hypot(N(a.x)-N(b.x),N(a.y)-N(b.y));
const valid=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const role=r=>String(r||'').toUpperCase();
const offense=new Set(['CA','CF','ST','SA','PD','PE','RW','LW','MEI','CAM']);
const defense=new Set(['ZAG','CB','LD','LE','RB','LB','VOL','CDM','ALA']);
const defensiveStats=new Set(['tackling','defense','positioning','interceptions','reflexes']);
const attackStats=new Set(['dribbling','vision','finishing','passing','control','positioning','acceleration']);
const skillLabel=(engine,p)=>{
 const id=p?.activeAbility?.id;
 const skill=id&&engine?.Abilities?.get?.(id);
 return skill?.label||String(id||'').slice(0,50);
};
function flowProfile(p){
 const position=role(p?.role);
 if(position==='GOL'||position==='GK')return {label:'Flow de Reflexos',stats:['reflexes','positioning','control']};
 if(['MC','CM','MEI','CAM','VOL','CDM'].includes(position))return {label:'Flow de Visão',stats:['vision','passing','control']};
 if(defense.has(position))return {label:'Flow Defensivo',stats:['tackling','defense','positioning']};
 return {label:'Flow de Finalização',stats:['finishing','positioning','dribbling']};
}
function flowBonus(p,key,time){
 if(!p||!Number.isFinite(time)||N(p.flowUntil)<=time)return 1;
 const profile=flowProfile(p);
 if(!profile.stats.includes(key))return 1;
 // Keep existing ability costs and cooldowns; Flow only rewards the real action.
 const mastery=p.activeAbility&&p.activeAbility.until>time?1.01:1;
 return clamp(1.035*mastery,1,1.055);
}
function masteryBonus(match,p,key){
 if(!match||!p||!active(p,match.time))return 1;
 const ability=match._neo140Abilities?.get?.(p.activeAbility.id);
 if(!ability||ability.stat!==key)return 1;
 const row=match.careerPlayers?.[p.name+'|'+match.teams?.[p.side]?.id];
 const tier=clamp(N(row?.weaponMastery?.[ability.id])||1,1,3);
 return 1+(tier-1)*.014;
}
function metamind(match,p,base){
 if(!match||!p||!base?.q||p.i===0||!valid(p)||!Array.isArray(match.players))return base;
 const vision=N(p.attributes?.vision),flow=N(p.flowUntil)>N(match.time);
 if(vision<91&&!flow)return base;
 if(match.phase!=='play'||match.ball?.owner!==p)return base;
 // Metavision is triggered by a genuine dangerous lane, not omniscience.
 const unsafe=N(base.lane)<43||(match.opponentPressure?.(base.q,85)||0)>=2;
 if(!unsafe)return base;
 let chosen=base,best=-Infinity;
 for(const q of match.players){
  if(q===p||q.side!==p.side||q.i===0||!valid(q)||match.offside?.(q,p))continue;
  const d=distance(p,q);if(d<46||d>340)continue;
  const lane=match.safeLane?.(p,q)??0;
  const press=match.opponentPressure?.(q,85)||0;
  if(lane<49||press>1)continue;
  const toward=(q.x-p.x)*(p.side===0?1:-1);
  const score=lane*.48-d*.12+clamp(toward,-130,210)*.10-press*20;
  if(score>best){chosen={q,d,lane,value:N(base.value)+Math.max(0,score/8)};best=score;}
 }
 if(chosen!==base&&match.time-N(p._neo140LastReadAt||-999)>100){
  p._neo140LastReadAt=match.time;
  match.log?.('👁️ '+p.name+' lê a marcação e encontra uma linha de passe livre.','skill',p.name);
  // No extra ability activation or synthetic pass here; the normal engine
  // decides whether to execute the selected option.
 }
 return chosen;
}
function adaptationBoost(match,p,key){
 const memo=match?._neo140Adapt?.[p?.name];
 if(!memo||!p||!match||match.time>memo.until)return 1;
 if(!valid(p))return 1;
 const foe=(match.players||[]).find(q=>q?.name===memo.foe&&q.side!==p.side);
 if(!foe||!valid(foe)||distance(p,foe)>180)return 1;
 if(memo.mode==='defense'&&!defensiveStats.has(key))return 1;
 if(memo.mode==='attack'&&!attackStats.has(key))return 1;
 return 1+Math.min(.052,.012+memo.losses*.009);
}
function learnFromDuel(match,attacker,defender,winner,kind){
 if(!match||!attacker||!defender||!winner||attacker.side===defender.side)return null;
 const loser=winner===attacker?defender:winner===defender?attacker:null;
 if(!loser||!loser.name||!winner.name)return null;
 const prev=match._neo140Adapt?.[loser.name],matches=prev?.foe===winner.name&&match.time<=prev.until;
 const losses=clamp((matches?N(prev.losses):0)+1,1,4);
 if(!match._neo140Adapt)match._neo140Adapt=Object.create(null);
 const mode=loser===defender?'defense':'attack';
 match._neo140Adapt[loser.name]={foe:winner.name,mode,losses,until:match.time+390};
 if(losses>=2&&match.time-(prev?.announcedAt||-999)>210){
  match._neo140Adapt[loser.name].announcedAt=match.time;
  match.log?.('🧩 '+loser.name+' adapta sua abordagem após perder duelos para '+winner.name+'.','duel',loser.name);
 }
 return {loser:loser.name,winner:winner.name,losses,mode};
}
function contest(match,attacker,defender,winner,kind){
 if(!match||!attacker||!defender||!winner||attacker.side===defender.side)return null;
 const aActive=active(attacker,match.time),dActive=active(defender,match.time);
 if(!aActive&&!dActive)return null;
 const a=skillLabel(match._neo140Engine,attacker),d=skillLabel(match._neo140Engine,defender);
 const item={minute:Math.floor(match.time/60),time:+match.time.toFixed(2),kind:String(kind||'duel'),
  attacker:attacker.name,defender:defender.name,winner:winner.name,
  attackSkill:aActive?a:null,defenseSkill:dActive?d:null};
 if(!match._neo140Contests)match._neo140Contests=[];
 match._neo140Contests.push(item);
 if(match._neo140Contests.length>50)match._neo140Contests.shift();
 const label='⚔️ '+(aActive?a:'Ataque comum')+' × '+(dActive?d:'Defesa comum');
 // Visual effect and commentary are earned by the actual winner, not
 // calculated by this wrapper. Respect the existing visual cooldown.
 if(match.time-(match._neo140LastContestFx||-999)>=72){
  match._neo140LastContestFx=match.time;
  match._actionFx?.('skill',winner,winner.x,winner.y,'DUELO DE HABILIDADES');
  match.log?.(label+' — '+winner.name+' vence a disputa!','skill',winner.name);
 }
 return item;
}
function chainReaction(match,awakener){
 if(!match||!awakener||!valid(awakener)||!Array.isArray(match.players))return null;
 if(match._neo140LastReactionAt&&match.time-match._neo140LastReactionAt<160)return null;
 const challengers=match.players.filter(q=>q&&q.side!==awakener.side&&q.i!==0&&valid(q)&&
  distance(q,awakener)<270&&N(q.attributes?.ego)>=78&&N(q.flowUntil)<=match.time&&N(q.stamina)>35);
 if(!challengers.length)return null;
 challengers.sort((a,b)=>(N(b.attributes?.ego)+N(b.ego)*.2)-(N(a.attributes?.ego)+N(a.ego)*.2));
 const challenger=challengers[0];
 if(match.random()>=.35)return null;
 match._neo140LastReactionAt=match.time;
 // Use the original ego engine for a small response. No forced Flow activation.
 if(typeof match._neo140OriginalEgo==='function')match._neo140OriginalEgo.call(match,challenger,2,'reação ao Flow rival');
 match.log?.('🔥 '+challenger.name+' reage ao Flow de '+awakener.name+'!','flow',challenger.name);
 return challenger.name;
}
function awakenedSkill(match,p,ability){
 if(!match||!p||!ability)return false;
 if(N(p.flowUntil)<=match.time||N(ability.tier)<2)return false;
 const id=ability.id;
 if(!id)return false;
 if(!p._neo140AwakeningIds)p._neo140AwakeningIds=new Set();
 if(p._neo140AwakeningIds.has(id))return false;
 p._neo140AwakeningIds.add(id);
 if(!match._neo140Awakenings)match._neo140Awakenings=[];
 match._neo140Awakenings.push({name:p.name,side:p.side,id,label:ability.label,minute:Math.floor(match.time/60)});
 if(match._neo140Awakenings.length>30)match._neo140Awakenings.shift();
 match._emitSkill?.(p,'DESPERTAR: '+ability.label,'flow',94);
 match.log?.('🌌 '+p.name+' manifesta '+ability.label+' em Flow!','flow',p.name);
 return true;
}
function resultDetails(match){
 return {contests:(match?._neo140Contests||[]).slice(-30).map(x=>({...x})),
  awakenings:(match?._neo140Awakenings||[]).slice(-20).map(x=>({...x}))};
}
function adapt(engine){
 const proto=engine?.Match?.prototype;
 if(!proto||proto._neo140EgoCombat)return false;
 if(typeof proto._attributes==='function'){
  const orig=proto._attributes;
  proto._attributes=function(p,key){
   const base=orig.call(this,p,key);
   if(!p||!Number.isFinite(base))return base;
   const factor=flowBonus(p,key,this.time)*masteryBonus(this,p,key)*adaptationBoost(this,p,key);
   return clamp(base*factor,1,125);
  };
 }
 if(typeof proto.passCandidate==='function'){
  const orig=proto.passCandidate;
  proto.passCandidate=function(p){return metamind(this,p,orig.call(this,p));};
 }
 if(typeof proto._recordDuel==='function'){
  const orig=proto._recordDuel;
  proto._recordDuel=function(a,b,w,kind){
   const previous=this.duelHistory?.at(-1);
   const result=orig.call(this,a,b,w,kind);
   if(!this.duelHistory?.length||this.duelHistory.at(-1)===previous)return result;
   this._neo140Engine=engine;
   learnFromDuel(this,a,b,w,kind);
   contest(this,a,b,w,kind);
   return result;
  };
 }
 if(typeof proto._ego==='function'){
  const orig=proto._ego;
  proto._ego=function(p,delta,reason){
   if(!p)return orig.call(this,p,delta,reason);
   const wasActive=N(p.flowUntil)>this.time,prior=N(p.flowCount);
   const result=orig.call(this,p,delta,reason);
   if(!wasActive&&N(p.flowUntil)>this.time&&N(p.flowCount)>prior){
    this._neo140OriginalEgo=orig;
    if(!this._neo140Awakenings)this._neo140Awakenings=[];
    this._neo140Awakenings.push({name:p.name,side:p.side,id:null,label:'FLOW — '+flowProfile(p).label,minute:Math.floor(this.time/60)});
    if(this._neo140Awakenings.length>30)this._neo140Awakenings.shift();
    chainReaction(this,p);
   }
   return result;
  };
 }
 if(typeof proto._activateAbility==='function'){
  const orig=proto._activateAbility;
  proto._activateAbility=function(p,context){
   this._neo140Abilities=engine.Abilities;
   const ability=orig.call(this,p,context);
   if(ability)awakenedSkill(this,p,ability);
   return ability;
  };
 }
 if(typeof proto.result==='function'){
  const orig=proto.result;
  proto.result=function(){
   const data=orig.call(this);
   data.egoCombat=resultDetails(this);
   return data;
  };
 }
 Object.defineProperty(proto,'_neo140EgoCombat',{value:true});
 return true;
}
function mount(win){
 const doc=win.document,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){
  const section=doc.getElementById('records');
  if(!section)return;
  let host=doc.getElementById('neo140-ego');
  if(!host){host=doc.createElement('section');host.id='neo140-ego';host.className='neo140-panel';section.append(host);}
  let season;
  try{season=JSON.parse(win.localStorage.getItem('neo-season-v2')||'null')}catch(_){season=null;}
  const matches=(season?.rounds||[]).flatMap(r=>(r.games||[]).filter(g=>Array.isArray(g.result)&&g.details?.egoCombat).map(g=>({round:r.round,...g.details.egoCombat}))).slice(-12);
  const duels=matches.flatMap(m=>(m.contests||[]).map(d=>({...d,round:m.round}))).slice(-8).reverse();
  const awakenings=matches.flatMap(m=>(m.awakenings||[]).map(a=>({...a,round:m.round}))).slice(-8).reverse();
  const lines=(items,make)=>items.length?items.map(make).join(''):'<p>Os registros aparecerão após partidas com Flow e confrontos reais.</p>';
  host.innerHTML='<div class="neo140-header"><span>⚔️ EGO COMBAT</span><small>FLOW · METAVISION · DESPERTARES</small></div>'+
   '<div class="neo140-grid"><div><strong>⚡ Despertares reais</strong>'+
   lines(awakenings,a=>'<p>'+esc(a.name)+' — '+esc(a.label)+' <em>rodada '+Number(a.round||0)+'</em></p>')+'</div>'+
   '<div><strong>🛡️ Confrontos de habilidades</strong>'+
   lines(duels,d=>'<p>'+esc(d.attacker)+' × '+esc(d.defender)+' · <b>'+esc(d.winner)+'</b><small> '+esc(d.attackSkill||'')+(d.defenseSkill?' / '+esc(d.defenseSkill):'')+'</small></p>')+'</div></div>';
 }
 const boot=()=>{
  if(!doc.getElementById('records'))return;
  render();
  doc.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="records"],[data-neo-tab="records"]'))win.setTimeout(render,100)});
  win.addEventListener('focus',render);
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {flowProfile,flowBonus,masteryBonus,metamind,adaptationBoost,learnFromDuel,contest,chainReaction,awakenedSkill,resultDetails,adapt,mount};
});