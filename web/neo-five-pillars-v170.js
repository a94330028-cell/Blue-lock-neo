/* Blue Lock NEO 1.6 — the first five pillars.
 * Deterministic personalities, real-Ego decisions, earned awakenings,
 * athlete-specific Flow and offside-safe Metavision.
 * Additive: never overwrites goals, results, images or an existing save.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
 if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const positioned=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const tkey=p=>String(p?.side)+':'+String(p?.name);
const archetypes=Object.freeze({
 visionary:{label:'Visionário',weapon:'Leitura e antecipação',stats:['vision','passing','positioning'],key:'vision'},
 predator:{label:'Predador',weapon:'Finalização decisiva',stats:['finishing','positioning','power'],key:'finishing'},
 dribbler:{label:'Improvisador',weapon:'Drible criativo',stats:['dribbling','control','acceleration'],key:'dribbling'},
 sprinter:{label:'Corredor',weapon:'Ataques em profundidade',stats:['speed','acceleration','positioning'],key:'speed'},
 conductor:{label:'Maestro',weapon:'Conexões e assistência',stats:['passing','vision','control'],key:'passing'},
 guardian:{label:'Guardião',weapon:'Cobertura e antecipação',stats:['defense','tackling','positioning'],key:'defense'},
 reflex:{label:'Instintivo',weapon:'Reflexos e leitura de chutes',stats:['reflexes','positioning','control'],key:'reflexes'},
 wildcard:{label:'Egoísta',weapon:'Criatividade imprevisível',stats:['control','dribbling','finishing'],key:'control'}
});
const known=Object.freeze({
 'Yoichi Isagi':'visionary','Michael Kaiser':'predator','Meguru Bachira':'dribbler',
 'Seishiro Nagi':'wildcard','Hyoma Chigiri':'sprinter','Shoei Baro':'predator',
 'Rin Itoshi':'visionary','Ryusei Shido':'predator','Alexis Ness':'conductor',
 'Yo Hiori':'conductor','Charles Chevalier':'conductor','Oliver Aiku':'guardian',
 'Don Lorenzo':'guardian','Ikki Niko':'guardian','Gin Gagamaru':'reflex'
});
function hash(name){let h=2166136261;for(const c of String(name||'')){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;}
function identity(player,career){
 if(!player)return null;
 const attrs=player.attributes||{};
 const role=String(player.role||'').toUpperCase(),n=player.name||'Atleta';
 const previous=career?.fivePillars?.archetype;
 let type=archetypes[previous]?previous:known[n];
 if(!type){
  if(player.i===0||/^(GOL|GK)$/.test(role))type='reflex';
  else if(/^(ZAG|CB|LD|LE|LB|RB|ALA)$/.test(role))type='guardian';
  else{
   const weights=[
    ['visionary',num(attrs.vision)*1.04+num(attrs.positioning)*.13],
    ['predator',num(attrs.finishing)+num(attrs.positioning)*.20],
    ['dribbler',num(attrs.dribbling)+num(attrs.control)*.17],
    ['sprinter',num(attrs.speed)+num(attrs.acceleration)*.20],
    ['conductor',num(attrs.passing)+num(attrs.vision)*.20],
    ['wildcard',num(attrs.ego)+num(attrs.dribbling)*.15]
   ];
   const seed=hash(n);
   weights.sort((a,b)=>b[1]-a[1]||((seed%6)-3)||a[0].localeCompare(b[0]));
   type=weights[0][0];
  }
 }
 const desc=archetypes[type],specialty=desc.stats[hash(n)%desc.stats.length];
 return {name:n,archetype:type,label:desc.label,weapon:desc.weapon,
  specialty,flowName:'FLOW DE '+n.toLocaleUpperCase('pt-BR')+' — '+desc.weapon,
  egoDrive:clamp(Math.round((num(attrs.ego)||70)*.7+num(attrs[desc.key])*.3),35,100)};
}
function getIdentity(match,p){
 if(!p)return null;
 if(!p._neo170Identity){
  const career=match?.careerPlayers?.[p.name+'|'+match.teams?.[p.side]?.id];
  p._neo170Identity=identity(p,career);
 }
 return p._neo170Identity;
}
function note(match,p,type,text){
 if(!match||!p)return null;
 if(!Array.isArray(match._neo170Events))match._neo170Events=[];
 const row={type,player:p.name,side:p.side,minute:Math.floor(num(match.time)/60),text:String(text).slice(0,160)};
 match._neo170Events.push(row);
 if(match._neo170Events.length>54)match._neo170Events.shift();
 return row;
}
function egoFactor(match,p,gain,reason){
 const i=getIdentity(match,p);
 if(!i||!Number.isFinite(gain)||gain<=0)return gain;
 const behind=num(match.score?.[p.side])<num(match.score?.[1-p.side]);
 const late=num(match.time)>65*60;
 const stressful=/duelo|rival|desarme|defesa|drible|gol|finaliza|passe/i.test(String(reason));
 const momentum=behind&&late&&stressful?1.10:1;
 const personality=(i.archetype==='predator'&&/gol|finaliza/.test(String(reason))?1.08:
   i.archetype==='guardian'&&/defesa|desarme|duelo/.test(String(reason))?1.06:
   i.archetype==='conductor'&&/passe|assist/.test(String(reason))?1.06:1);
 return clamp(gain*momentum*personality,0,gain*1.18);
}
function flowBoost(match,p,stat){
 if(!p||!match||num(p.flowUntil)<=num(match.time))return 1;
 const i=getIdentity(match,p);
 const arr=archetypes[i?.archetype]?.stats||[];
 if(!arr.includes(stat))return 1;
 const focus=stat===i.specialty?1.048:1.028;
 const fatigue=clamp((num(p.stamina)-30)/70,.4,1);
 return 1+(focus-1)*fatigue;
}
function readPass(match,p,original){
 if(!match||!p||!original?.q||!positioned(p)||p.i===0||match.phase!=='play'||match.ball?.owner!==p)return original;
 const i=getIdentity(match,p),vision=num(p.attributes?.vision);
 if(vision<90&&!(num(p.flowUntil)>num(match.time)&&i?.archetype==='visionary'))return original;
 const measure=(q)=>{
  const d=distance(p,q);
  if(d<45||d>400||match.offside?.(q,p))return null;
  const lane=num(match.safeLane?.(p,q));
  // Distances to predicted defender positions; no future knowledge, only current velocity.
  let nearest=Infinity,closing=0;
  for(const foe of match.players||[]){
   if(foe?.side===p.side||foe?.i===0||!positioned(foe))continue;
   const target={x:foe.x+clamp(num(foe.vx)*.28,-28,28),y:foe.y+clamp(num(foe.vy)*.28,-28,28)};
   const df=distance(target,q);
   if(df<nearest)nearest=df;
   if(df<75)closing++;
  }
  return {d,lane,closing,nearest,score:lane*.60-d*.1+clamp(nearest,0,140)*.23-closing*23+(q.run?9:0)};
 };
 const base=measure(original.q);
 if(base&&base.lane>=48&&base.closing===0)return original;
 let best=null;
 for(const q of match.players||[]){
  if(!q||q===p||q.side!==p.side||q.i===0||!positioned(q))continue;
  const value=measure(q);if(!value||value.lane<52||value.closing>1)continue;
  if(!best||value.score>best.value.score)best={q,value};
 }
 if(!best)return original;
 if(base&&best.value.score<=base.score+10)return original;
 const prev=p._neo170MetaAt??-1000;
 if(match.time-prev>110){
  p._neo170MetaAt=match.time;
  note(match,p,'metavision','Lê a pressão e encontra '+best.q.name+' com melhor linha de passe.');
  match.log?.('👁️ METAVISION: '+p.name+' antecipa a marcação e encontra '+best.q.name+'.','skill',p.name);
  if(match.stats?.visionReads)match.stats.visionReads[p.side]++;
 }
 return {q:best.q,d:best.value.d,lane:best.value.lane,value:num(original.value)+Math.max(1,best.value.score/10)};
}
function tacticalDecision(match,p){
 if(!match||!p||p.i===0||match.phase!=='play'||match.ball?.owner!==p||!positioned(p))return false;
 const i=getIdentity(match,p),last=p._neo170DecisionAt??-1000;
 if(match.time-last<75||num(p.stamina)<23)return false;
 const progress=match.progress?.(p.side,p.x)||0;
 const pressure=match.opponentPressure?.(p,66)||0;
 const q=match.passCandidate?.(p);
 const safe=q?.q&&q.q.side===p.side&&q.q.i!==0&&num(q.lane)>=52&&num(q.d)<290&&!match.offside?.(q.q,p);
 const visionStyle=['visionary','conductor','guardian','reflex'].includes(i.archetype);
 if(visionStyle&&pressure>=1&&safe&&match.random()<.24){
  const target=q.q;
  match.pass?.(p,target);
  if(match.ball?.mode==='pass'&&match.ball.by===p&&match.ball.to===target){
   p._neo170DecisionAt=match.time;
   note(match,p,'personality',i.label+': escolheu um passe seguro sob pressão.');
   return true;
  }
 }
 if(i.archetype==='predator'&&progress>1290&&progress<1660&&
    match.canShoot?.(p)&&match.shotQuality?.(p)>=.28&&match.random()<.16){
  match.shoot?.(p);
  if(match.ball?.mode==='shot'&&match.ball.by===p){
   p._neo170DecisionAt=match.time;
   note(match,p,'personality','Predador: finalizou quando surgiu uma chance real na área.');
   return true;
  }
 }
 return false;
}
function runningStyle(match,p,owner,fallback){
 if(!match||!p||!owner||p.side!==owner.side||p.i===0||match.phase!=='play')return fallback;
 const i=getIdentity(match,p),prog=match.progress?.(p.side,owner.x)||0;
 if(prog<720||num(p.stamina)<28)return fallback;
 const r=match.random();
 if(i.archetype==='sprinter'&&r<.40)return 'channel';
 if(i.archetype==='visionary'&&r<.40)return 'third-man';
 if(i.archetype==='predator'&&prog>1030&&r<.46)return 'far-post';
 if(i.archetype==='conductor'&&r<.35)return 'support';
 if(i.archetype==='dribbler'&&r<.36)return 'inside-cut';
 if(i.archetype==='wildcard'&&r<.36)return 'blindside';
 return fallback;
}
function earnedAwakening(match,p,ability){
 if(!p||!ability?.id||!match||p.i===0||num(p.flowUntil)<=num(match.time))return false;
 const career=match.careerPlayers?.[p.name+'|'+match.teams?.[p.side]?.id]||{};
 const mastery=num(career.weaponMastery?.[ability.id])||1;
 const actualUses=num(p.abilityUses?.[ability.id]);
 // Active skill + Flow + genuine experience; no new ability is invented.
 if(num(ability.tier)<2&&mastery<2||actualUses<1||num(p.stamina)<18||num(match.time)<9*60)return false;
 if(p._neo170Awakened||match.random()>.26)return false;
 p._neo170Awakened=true;
 p._neo170Surge={id:ability.id,stat:ability.stat,until:match.time+30};
 note(match,p,'awakening','Despertar de '+ability.label+' durante o Flow.');
 match._emitSkill?.(p,'DESPERTAR — '+ability.label,'flow',92);
 match.log?.('🌌 DESPERTAR REAL: '+p.name+' domina '+ability.label+' sob Flow!','flow',p.name);
 return true;
}
function awakeningBonus(match,p,stat){
 return p?._neo170Surge?.stat===stat&&num(p._neo170Surge.until)>num(match?.time)?1.055:1;
}
function matchSummary(match){
 return {
  players:(match?.players||[]).filter(p=>p&&!p.isMaster).map(p=>{
   const i=getIdentity(match,p);
   return {name:p.name,side:p.side,archetype:i?.archetype||'wildcard',
    label:i?.label||'Egoísta',flowName:i?.flowName||'',
    flowCount:num(p.flowCount),awakening:!!p._neo170Awakened,egoPeak:num(p._neo170EgoPeak||p.ego)}
  }).slice(0,30),
  events:(match?._neo170Events||[]).slice(-48).map(e=>({...e}))
 };
}
function recordCareer(engine,season,fixture,match,round){
 const career=season?.career,summary=match?.result?.()?.fivePillars;
 if(!career?.players||!summary?.players?.length)return false;
 career.fivePillarsRecorded=career.fivePillarsRecorded||{};
 const stamp=round+'|'+fixture.home+'|'+fixture.away;
 if(career.fivePillarsRecorded[stamp])return false;
 career.fivePillarsRecorded[stamp]=1;
 for(const p of summary.players){
  if(!p.name||![0,1].includes(p.side))continue;
  const club=p.side===0?fixture.home:fixture.away;
  const row=career.players[p.name+'|'+club];
  if(!row)continue;
  const old=row.fivePillars||{};
  const currentEvents=summary.events.filter(e=>e.player===p.name&&e.side===p.side);
  const flowStarts=currentEvents.filter(e=>e.type==='flow').length;
  const metaReads=currentEvents.filter(e=>e.type==='metavision').length;
  const awakenings=currentEvents.filter(e=>e.type==='awakening').length;
  row.fivePillars={
   archetype:p.archetype,label:p.label,flowName:p.flowName,
   flowStarts:num(old.flowStarts)+flowStarts,metavisionReads:num(old.metavisionReads)+metaReads,
   awakenings:num(old.awakenings)+awakenings,egoPeak:Math.max(num(old.egoPeak),num(p.egoPeak)),
   recent:[...(Array.isArray(old.recent)?old.recent:[]),{
    round,flow:flowStarts,metavision:metaReads,awakening:awakenings,
    decisions:currentEvents.filter(e=>e.type==='personality').length
   }].slice(-14)
  };
 }
 const stamps=Object.keys(career.fivePillarsRecorded);
 for(const id of stamps.slice(0,Math.max(0,stamps.length-250)))delete career.fivePillarsRecorded[id];
 return true;
}
function adapt(engine){
 const proto=engine?.Match?.prototype;
 if(!proto||proto._neo170FivePillars)return false;
 if(typeof proto._buildPlayers==='function'){
  const original=proto._buildPlayers;
  proto._buildPlayers=function(){
   const out=original.call(this);
   for(const p of this.players||[])getIdentity(this,p);
   return out;
  };
 }
 if(typeof proto._ego==='function'){
  const original=proto._ego;
  proto._ego=function(p,delta,reason){
   const prior=p?num(p.flowCount):0;
   const adjusted=p?egoFactor(this,p,delta,reason):delta;
   const out=original.call(this,p,adjusted,reason);
   if(!p)return out;
   p._neo170EgoPeak=Math.max(num(p._neo170EgoPeak),num(p.ego));
   if(num(p.flowCount)>prior){
    const id=getIdentity(this,p);
    note(this,p,'flow',id.flowName+' ativado por '+String(reason||'desempenho')+'.');
   }
   return out;
  };
 }
 if(typeof proto._attributes==='function'){
  const original=proto._attributes;
  proto._attributes=function(p,stat){
   const base=original.call(this,p,stat);
   if(!p||!Number.isFinite(base))return base;
   return clamp(base*flowBoost(this,p,stat)*awakeningBonus(this,p,stat),1,125);
  };
 }
 if(typeof proto.passCandidate==='function'){
  const original=proto.passCandidate;
  proto.passCandidate=function(p){return readPass(this,p,original.call(this,p));};
 }
 if(typeof proto._ownerDecision==='function'){
  const original=proto._ownerDecision;
  proto._ownerDecision=function(p){
   if(tacticalDecision(this,p))return;
   return original.call(this,p);
  };
 }
 if(typeof proto._runType==='function'){
  const original=proto._runType;
  proto._runType=function(p,owner){return runningStyle(this,p,owner,original.call(this,p,owner));};
 }
 if(typeof proto._activateAbility==='function'){
  const original=proto._activateAbility;
  proto._activateAbility=function(p,context){
   const ability=original.call(this,p,context);
   if(ability)earnedAwakening(this,p,ability);
   return ability;
  };
 }
 if(typeof proto.result==='function'){
  const original=proto.result;
  proto.result=function(){
   const res=original.call(this);
   res.fivePillars=matchSummary(this);
   return res;
  };
 }
 const progression=engine.Progression;
 if(progression&&typeof progression.record==='function'&&!progression._neo170Recorded){
  const original=progression.record;
  progression.record=function(season,fixture,match,round){
   const res=original.call(this,season,fixture,match,round);
   recordCareer(engine,season,fixture,match,round);
   return res;
  };
  Object.defineProperty(progression,'_neo170Recorded',{value:true});
 }
 Object.defineProperty(proto,'_neo170FivePillars',{value:true});
 return true;
}
function mount(win){
 const doc=win.document;
 const make=(tag,cls,txt)=>{
  const el=doc.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=String(txt);return el;
 };
 let selected='';
 function render(){
  const records=doc.getElementById('records');if(!records)return;
  let panel=doc.getElementById('neo170-five-pillars');
  if(!panel){panel=make('section','neo170-five-pillars');panel.id='neo170-five-pillars';records.append(panel);}
  let season;
  try{season=JSON.parse(win.localStorage.getItem('neo-season-v2')||'null');}catch(_){season=null;}
  const rows=Object.values(season?.career?.players||{}).filter(p=>p?.fivePillars)
   .sort((a,b)=>num(b.games)-num(a.games)||String(a.name).localeCompare(String(b.name)));
  if(selected&&!rows.some(p=>p.name+'|'+p.club===selected))selected='';
  if(!selected&&rows.length)selected=rows[0].name+'|'+rows[0].club;
  panel.replaceChildren();
  const heading=make('div','neo170-title');
  heading.append(make('strong',null,'⚡ OS CINCO PILARES DO EGO'),make('small',null,'IA · EGO · DESPERTAR · FLOW · METAVISION'));
  panel.append(heading);
  if(!rows.length){
   panel.append(make('p','neo170-empty','As fichas aparecerão após partidas oficiais concluídas nesta versão.'));
   return;
  }
  const select=make('select','neo170-select');
  select.setAttribute('aria-label','Escolher personagem e seus cinco pilares');
  for(const row of rows.slice(0,200)){
   const opt=make('option',null,row.name+' · '+row.club);opt.value=row.name+'|'+row.club;select.append(opt);
  }
  select.value=selected;select.addEventListener('change',()=>{selected=select.value;render();});panel.append(select);
  const row=rows.find(p=>p.name+'|'+p.club===selected);
  const info=row.fivePillars,grid=make('div','neo170-grid');panel.append(grid);
  for(const [title,desc] of [
   ['🧠 Personalidade',info.label+' · '+info.archetype],
   ['🔥 Ego', 'Pico observado: '+num(info.egoPeak).toFixed(0)],
   ['🌌 Despertares','Técnicas especiais: '+num(info.awakenings)],
   ['⚡ Flow',info.flowName+' · '+num(info.flowStarts)+' ativações'],
   ['👁️ Metavision',num(info.metavisionReads)+' leituras registradas']
  ]){
   const card=make('article','neo170-pillar');
   card.append(make('strong',null,title),make('p',null,desc));grid.append(card);
  }
  const timeline=make('div','neo170-history');
  timeline.append(make('strong',null,'Últimas partidas com registros dos cinco pilares'));
  for(const h of (info.recent||[]).slice(-7).reverse())
   timeline.append(make('p',null,'Rodada '+num(h.round)+' · '+num(h.flow)+' Flow · '+num(h.metavision)+' leituras · '+num(h.awakening)+' despertar(es) · '+num(h.decisions)+' decisões características'));
  panel.append(timeline);
 }
 const boot=()=>{
  if(!doc.getElementById('records'))return;
  render();
  doc.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="records"],[data-neo-tab="records"]'))win.setTimeout(render,90);});
  win.addEventListener('focus',render);
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {archetypes,identity,flowBoost,egoFactor,readPass,tacticalDecision,runningStyle,earnedAwakening,awakeningBonus,matchSummary,recordCareer,adapt,mount};
});