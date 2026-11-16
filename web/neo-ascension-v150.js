/* Blue Lock NEO 1.4 — EGO ASCENSION
 * Deepens the actual simulator; never manufactures goals, saves or winners.
 * Observation, team play and highlight events require recorded on-field actions.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
 if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const pos=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const k=p=>p?.side+':'+p?.name;
const OFFENSE=new Set(['CA','CF','ST','SA','PD','PE','RW','LW']);
const MID=new Set(['MEI','CAM','MC','CM','VOL','CDM']);
const COUNTER_STATS=new Set(['tackling','defense','positioning','reflexes','interceptions','vision']);
const OTHER_STATS=new Set(['dribbling','passing','control','finishing']);
function capPush(target,item,max=32){target.push(item);if(target.length>max)target.splice(0,target.length-max);}
function observation(match,observer,actor,ability){
 if(!match||!observer||!actor||!ability?.id||observer.side===actor.side||!pos(observer)||!pos(actor))return null;
 const vision=num(observer.attributes?.vision),activeFlow=num(observer.flowUntil)>match.time;
 if(vision<84&&!activeFlow||dist(observer,actor)>285)return null;
 if(!match._neo150Reads)match._neo150Reads=Object.create(null);
 const key=k(observer),prev=match._neo150Reads[key];
 const same=prev?.foe===k(actor)&&prev.ability===ability.id&&prev.until>=match.time;
 const seen=clamp((same?num(prev.seen):0)+1,1,5);
 const row={observer:observer.name,side:observer.side,foe:k(actor),foeName:actor.name,ability:ability.id,
  label:String(ability.label||ability.id).slice(0,80),stat:ability.stat,seen,until:match.time+390};
 match._neo150Reads[key]=row;
 if(seen===2){
  if(!match._neo150Events)match._neo150Events=[];
  capPush(match._neo150Events,{type:'reading',minute:Math.floor(match.time/60),player:observer.name,
   opponent:actor.name,label:row.label},40);
  match.log?.('👁️ '+observer.name+' identifica a arma de '+actor.name+' e procura uma resposta.','skill',observer.name);
 }
 return row;
}
function counterBonus(match,p,stat){
 if(!match||!p||!COUNTER_STATS.has(stat)||!pos(p))return 1;
 const read=match._neo150Reads?.[k(p)];
 if(!read||read.seen<2||match.time>read.until)return 1;
 const foe=match.players?.find(q=>q&&k(q)===read.foe);
 if(!foe||!pos(foe)||dist(foe,p)>165)return 1;
 // Reading a shot or dribble doesn't copy the rival's power. It improves
 // positioning/anticipation narrowly, against exactly that opponent.
 if(stat==='reflexes'&&p.i!==0)return 1;
 const target=String(read.stat||'');
 if(target==='vision'||target==='passing'){
  return ['positioning','interceptions','tackling','vision'].includes(stat)?1.027:1;
 }
 if(target==='finishing'||target==='accuracy'||target==='power'){
  return ['reflexes','positioning','defense','tackling'].includes(stat)?1.037:1;
 }
 return ['tackling','defense','positioning'].includes(stat)?1.031:1;
}
function runChoice(match,p,owner,fallback){
 if(!match||!p||!owner||p.side!==owner.side||match.phase!=='play'||p.i===0)return fallback;
 const progress=match.progress?.(p.side,owner.x)||0;
 const role=String(p.role||'').toUpperCase();
 const pressure=match.opponentPressure?.(owner,90)||0;
 const longShots=num(match.stats?.longShots?.[p.side]);
 const boxShots=num(match.stats?.boxShots?.[p.side]);
 const trailing=num(match.score?.[p.side])<num(match.score?.[1-p.side]);
 if(MID.has(role)&&pressure>=2&&progress>=230&&progress<1060){
  return match.random()<.56?'support':'third-man';
 }
 if(OFFENSE.has(role)&&progress>690&&progress<1250&&longShots>=2&&longShots>=boxShots){
  // Repeated speculative shooting leads to genuine movements towards the box.
  return match.random()<.55?'channel':'blindside';
 }
 if(trailing&&match.time>72*60&&progress>730&&
   (OFFENSE.has(role)||['MEI','CAM','MC','CM'].includes(role))&&match.random()<.33){
  return 'late-box';
 }
 return fallback;
}
function recycle(match,p){
 if(!match||!p||p.i===0||match.phase!=='play'||match.ball?.owner!==p||!pos(p))return false;
 const longShots=num(match.stats?.longShots?.[p.side]);
 const boxShots=num(match.stats?.boxShots?.[p.side]);
 const progress=match.progress?.(p.side,p.x)||0;
 if(longShots<2||longShots<boxShots||progress<450||progress>1380)return false;
 const pressure=match.opponentPressure?.(p,75)||0;
 if(pressure<1||match.random()>.26)return false;
 const candidate=match.passCandidate?.(p);
 if(!candidate?.q||candidate.q.side!==p.side||candidate.q.i===0||num(candidate.lane)<49||
   num(candidate.d)>245||match.offside?.(candidate.q,p))return false;
 match.pass(p,candidate.q);
 if(match.ball?.mode!=='pass'||match.ball.to!==candidate.q||match.ball.by!==p)return false;
 match.log?.('⚽ '+p.name+' evita o chute distante e encontra '+candidate.q.name+' em melhor posição.','pass',p.name);
 return true;
}
function coordinatedPass(match,from,to){
 if(!match||!from||!to||from.side!==to.side||!pos(from)||!pos(to)||from.i===0||to.i===0)return false;
 const chemistryId=[from.name,to.name].sort().join(' + ')+'|'+match.teams?.[from.side]?.id;
 const chemistry=num(match.careerLinks?.[chemistryId]?.plays);
 const activeA=num(from.activeAbility?.until)>match.time,activeB=num(to.activeAbility?.until)>match.time;
 if(chemistry<2||!activeA||!activeB||dist(from,to)>260)return false;
 match._neo150Combo={receiver:k(to),until:match.time+65};
 if(!match._neo150Events)match._neo150Events=[];
 capPush(match._neo150Events,{type:'combination',minute:Math.floor(match.time/60),
  player:from.name,opponent:to.name,label:'Dupla em sintonia'},40);
 if(match.time-num(match._neo150LastComboLog||-999)>=85){
  match._neo150LastComboLog=match.time;
  match.log?.('🤝 '+from.name+' e '+to.name+' conectam suas armas em uma jogada real!','skill',from.name);
 }
 return true;
}
function comboBonus(match,p,stat){
 const c=match?._neo150Combo;
 return c&&c.receiver===k(p)&&match.time<=c.until&&['control','positioning','passing'].includes(stat)?1.026:1;
}
function learnedDuel(match,a,b,w,kind){
 if(!match||!a||!b||!w||a.side===b.side||!match._neo150Reads)return null;
 const reader=[a,b].find(p=>p===w&&match._neo150Reads[k(p)]?.foe===k(p===a?b:a));
 if(!reader)return null;
 const row=match._neo150Reads[k(reader)];
 if(!row||row.seen<2||row.until<match.time)return null;
 const event={type:'counter',minute:Math.floor(match.time/60),player:reader.name,
  opponent:reader===a?b.name:a.name,label:'Contra-arma: '+row.label};
 if(!match._neo150Events)match._neo150Events=[];
 capPush(match._neo150Events,event,40);
 if(match.time-num(match._neo150LastCounterLog||-999)>95){
  match._neo150LastCounterLog=match.time;
  match.log?.('🧩 '+reader.name+' vence um duelo após ler a arma de '+event.opponent+'!','skill',reader.name);
 }
 return event;
}
function actualShotMoment(match,p,previousCount){
 if(!match||!p||!Array.isArray(match.shotMap)||match.shotMap.length<=previousCount)return null;
 const shot=match.shotMap.at(-1);
 if(shot?.shooter!==p.name||!shot.onTarget||num(shot.xg)<.16)return null;
 const special=num(p.flowUntil)>match.time||num(p.activeAbility?.until)>match.time;
 if(!special||match.time-num(match._neo150LastGeniusAt||-999)<165||match.random()>=.20)return null;
 match._neo150LastGeniusAt=match.time;
 const e={type:'genius',minute:Math.floor(match.time/60),player:p.name,
   opponent:'',label:'Finalização especial '+(shot.style||'na área')};
 if(!match._neo150Events)match._neo150Events=[];
 capPush(match._neo150Events,e,40);
 match._moment?.(p.side,'legend','🌟 MOMENTO DE GENIALIDADE: '+p.name+' surpreende com uma finalização real!',[p.name]);
 return e;
}
function realSaveMoment(match,keeper,saved){
 if(!saved||!match||!keeper)return null;
 const activeFlow=num(keeper.flowUntil)>match.time,activeSkill=num(keeper.activeAbility?.until)>match.time;
 if(!activeFlow&&!activeSkill||match.time-num(match._neo150LastLegendarySaveAt||-999)<195)return null;
 const shots=match.shotMap||[];
 const shot=shots.slice().reverse().find(s=>s.outcome==='saved'&&s.savedBy===keeper.name);
 if(!shot||num(shot.xg)<.16||match.random()>=.28)return null;
 match._neo150LastLegendarySaveAt=match.time;
 const e={type:'save',minute:Math.floor(match.time/60),player:keeper.name,
  opponent:shot.shooter||'',label:'Defesa extraordinária'};
 if(!match._neo150Events)match._neo150Events=[];
 capPush(match._neo150Events,e,40);
 match._moment?.(keeper.side,'save','🧤 DEFESA LENDÁRIA: '+keeper.name+' interrompe uma finalização perigosa!',[keeper.name]);
 return e;
}
function details(match){return {events:(match?._neo150Events||[]).slice(-28).map(e=>({...e}))};}
function adapt(engine){
 const p=engine?.Match?.prototype;
 if(!p||p._neo150Ascension)return false;
 if(typeof p._activateAbility==='function'){
  const orig=p._activateAbility;
  p._activateAbility=function(actor,context){
   const ability=orig.call(this,actor,context);
   if(ability&&Array.isArray(this.players)){
    for(const observer of this.players){
     if(observer?.side!==actor.side&&observer?.i!==0)observation(this,observer,actor,ability);
    }
   }
   return ability;
  };
 }
 if(typeof p._attributes==='function'){
  const orig=p._attributes;
  p._attributes=function(player,stat){
   const v=orig.call(this,player,stat);
   if(!player||!Number.isFinite(v))return v;
   return clamp(v*counterBonus(this,player,stat)*comboBonus(this,player,stat),1,125);
  };
 }
 if(typeof p._runType==='function'){
  const orig=p._runType;
  p._runType=function(player,owner){return runChoice(this,player,owner,orig.call(this,player,owner));};
 }
 if(typeof p._ownerDecision==='function'){
  const orig=p._ownerDecision;
  p._ownerDecision=function(player){
   if(recycle(this,player))return;
   return orig.call(this,player);
  };
 }
 if(typeof p.pass==='function'){
  const orig=p.pass;
  p.pass=function(from,to){
   const before=this.ball?.owner===from;
   const out=orig.call(this,from,to);
   if(before&&this.ball?.mode==='pass'&&this.ball.by===from&&this.ball.to===to)coordinatedPass(this,from,to);
   return out;
  };
 }
 if(typeof p._recordDuel==='function'){
  const orig=p._recordDuel;
  p._recordDuel=function(a,b,w,kind){
   const prior=this.duelHistory?.at(-1);
   const out=orig.call(this,a,b,w,kind);
   if(this.duelHistory?.length&&this.duelHistory.at(-1)!==prior)learnedDuel(this,a,b,w,kind);
   return out;
  };
 }
 if(typeof p.shoot==='function'){
  const orig=p.shoot;
  p.shoot=function(shooter){
   const previous=this.shotMap?.length||0;
   const out=orig.call(this,shooter);
   actualShotMoment(this,shooter,previous);
   return out;
  };
 }
 if(typeof p._keeperAttempt==='function'){
  const orig=p._keeperAttempt;
  p._keeperAttempt=function(keeper,ball,dt){
   const saved=orig.call(this,keeper,ball,dt);
   if(saved)realSaveMoment(this,keeper,true);
   return saved;
  };
 }
 if(typeof p.result==='function'){
  const orig=p.result;
  p.result=function(){const out=orig.call(this);out.egoAscension=details(this);return out;};
 }
 Object.defineProperty(p,'_neo150Ascension',{value:true});
 return true;
}
function mount(win){
 const doc=win.document;
 const make=(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
 function render(){
  const records=doc.getElementById('records');if(!records)return;
  let panel=doc.getElementById('neo150-panel');
  if(!panel){panel=make('section','neo150-panel');panel.id='neo150-panel';records.append(panel);}
  let season;try{season=JSON.parse(win.localStorage.getItem('neo-season-v2')||'null');}catch(_){season=null;}
  const list=(season?.rounds||[]).flatMap(r=>(r.games||[]).filter(g=>Array.isArray(g.result)&&g.details?.egoAscension)
   .map(g=>(g.details.egoAscension.events||[]).map(e=>({...e,round:r.round})))).flat().slice(-18).reverse();
  panel.replaceChildren();
  const header=make('div','neo150-heading');
  header.append(make('strong',null,'🌌 EGO ASCENSION'),make('small',null,'JOGADAS VERIFICADAS · '+list.length+' DESTAQUES'));
  panel.append(header);
  const grid=make('div','neo150-grid');panel.append(grid);
  const buckets=[['👁️ Armas estudadas','reading'],['🧩 Contra-armas','counter'],['🤝 Combinações','combination'],['🌟 Genialidade e defesas','genius,save']];
  for(const [label,type] of buckets){
   const part=make('div','neo150-group'),items=list.filter(e=>type.split(',').includes(e.type)).slice(0,6);
   part.append(make('strong',null,label));
   if(!items.length)part.append(make('p','neo150-empty','Os acontecimentos aparecerão após partidas reais.'));
   for(const e of items){part.append(make('p',null,(e.player||'Atleta')+(e.opponent?' × '+e.opponent:'')+' — '+e.label+' · Rodada '+e.round));}
   grid.append(part);
  }
 }
 const boot=()=>{if(!doc.getElementById('records'))return;render();
  doc.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="records"],[data-neo-tab="records"]'))win.setTimeout(render,90);});
  win.addEventListener('focus',render);};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {observation,counterBonus,runChoice,recycle,coordinatedPass,comboBonus,learnedDuel,
 actualShotMoment,realSaveMoment,details,adapt,mount};
});