/* BLUE LOCK NEO — Advanced Ego & Match Intelligence (ideas 19-40)
 * Conservative integration: operates on real decisions, duels, saves and shots.
 * All observations are bounded; no synthetic scores or player statistics.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const num=x=>Number.isFinite(+x)?+x:0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ATTACK=new Set(['CA','CF','ST','SA','PE','PD','RW','LW','MEI','CAM']);
const MID=new Set(['MEI','CAM','MC','CM','VOL','CDM','PE','PD','RW','LW']);
const DEF=new Set(['ZAG','CB','LD','LE','RB','LB','VOL','CDM']);
function state(m){
 return m._neoAdvanced||(m._neoAdvanced={duelLosses:Object.create(null),duelWins:Object.create(null),
   passing:{0:null,1:null},chemistry:Object.create(null),events:[],territory:[0,0],samples:0,
   lastSample:-1000,saves:[],smart:[],timelines:[], lastCue:Object.create(null)});
}
function note(m,type,p,detail){
 if(!m||!p)return;
 const s=state(m),k=type+'|'+p.side+'|'+p.name;
 if(num(m.time)-num(s.lastCue[k]??-10000)<62)return;
 s.lastCue[k]=num(m.time);
 s.events.push({type,player:String(p.name||'Atleta').slice(0,65),side:p.side,
  minute:Math.floor(num(m.time)/60),detail:String(detail||'').slice(0,105)});
 if(s.events.length>85)s.events.shift();
}
function mastery(m,p,stat){
 const active=p?.activeAbility;
 if(!active||num(active.until)<=num(m?.time)||!p?.abilityUses)return 1;
 const id=String(active.id||'');
 const level=Math.max(0,Math.floor(num(p.abilityUses[id])));
 const tier=level>=18?3:level>=5?2:1;
 const allowed=['finishing','dribbling','passing','vision','control','tackling','defense','reflexes'];
 if(!allowed.includes(stat))return 1;
 const skill=m?._neoAdvancedEngine?.Abilities?.get?.(id);
 if(skill?.stat&&skill.stat!==stat)return 1;
 return 1+(tier-1)*.011;
}
function scorePressure(m){
 if(!m||m.phase!=='play')return 1;
 const close=Math.abs(num(m.score?.[0])-num(m.score?.[1]))<=1;
 return (m.time>=76*60&&close)?1.055:(m.time>=85*60?1.035:1);
}
function mentalFactor(m,p,stat){
 if(!m||!p||!['vision','passing','control','tackling','positioning','finishing'].includes(stat))return 1;
 const stamina=clamp(num(p.stamina),0,100);
 const pressure=m.opponentPressure?.(p,60)||0;
 const tired=stamina<39?(.39-stamina/100)*.19:0;
 return clamp(1-tired-(pressure>=3?.018:0)+(scorePressure(m)-1)*.33,.90,1.035);
}
function opponentLearning(m,p,stat){
 if(!m||!p||!['tackling','defense','vision','dribbling','control'].includes(stat))return 1;
 const foe=m.ball?.owner;
 if(!foe||foe.side===p.side)return 1;
 const failures=state(m).duelLosses[p.side+'|'+p.name+'|'+foe.name]||0;
 return failures>=2?1.024:1;
}
function chemistryBoost(m,p,stat){
 if(!m||!p||!['passing','vision','control'].includes(stat))return 1;
 const chain=state(m).passing[p.side];
 if(!chain||m.time-chain.time>95||chain.receiver!==p.name)return 1;
 return 1+clamp(chain.repeat*.005,0,.022);
}
function attributes(m,p,key,base){
 if(!p||!Number.isFinite(base))return base;
 const role=String(p.role||'').toUpperCase();
 const form=ATTACK.has(role)&&key==='finishing'&&m.inOpponentBox?.(p)?1.012:1;
 const evolved=DEF.has(role)&&key==='positioning'&&m.phase==='play'&&m.score[p.side]<m.score[1-p.side]&&m.time>75*60?1.012:1;
 return clamp(base*mastery(m,p,key)*mentalFactor(m,p,key)*opponentLearning(m,p,key)*
  chemistryBoost(m,p,key)*form*evolved,1,125);
}
function duel(m,a,b,w,kind){
 if(!m||!a||!b||!w||a.side===b.side)return;
 const s=state(m),loser=w===a?b:w===b?a:null;
 if(!loser)return;
 const lost=loser.side+'|'+loser.name+'|'+w.name;
 s.duelLosses[lost]=clamp(num(s.duelLosses[lost])+1,1,12);
 const win=w.side+'|'+w.name;
 s.duelWins[win]=clamp(num(s.duelWins[win])+1,1,30);
 if(s.duelLosses[lost]===2)note(m,'adaptation',loser,'Estuda o adversário depois de duas derrotas reais');
 if(s.duelWins[win]===3)note(m,'moment',w,'Sequência de três duelos vencidos');
 if(s.duelLosses[lost]>=2&&loser.ego>=27&&m.time-num(loser._neoAdvancedCounterAt??-1000)>180){
  loser._neoAdvancedCounterAt=m.time;
  m._ego?.(loser,.7,'resposta ao duelo perdido');
  note(m,'counter',loser,'Reage ao duelo perdido, sem garantir a próxima jogada');
 }
}
function launchedPass(m,p,to){
 if(!m||!p||!to||p.side!==to.side||!m.ball||m.ball.mode!=='pass'||m.ball.by!==p||m.ball.to!==to)return;
 const s=state(m),past=s.passing[p.side],continuation=past?.receiver===p.name&&m.time-past.time<90;
 const pair=[p.name,to.name].sort().join(' + ');
 const repeat=clamp(num(s.chemistry[pair])+(continuation?1:0),0,12);
 s.chemistry[pair]=repeat;
 s.passing[p.side]={passer:p.name,receiver:to.name,time:m.time,repeat};
 if(continuation){
  note(m,'chain',p,'Reação em cadeia com '+to.name);
  const receiver=m.players.find(q=>q.side===p.side&&q.name===to.name);
  if(receiver&&valid(receiver)&&distance(p,receiver)<360&&repeat>=2){
   note(m,'chemistry',receiver,'Conexão construída em passes lançados no campo');
  }
 }
}
function improvisedDecision(m,p){
 if(!m||!p||p.i===0||m.phase!=='play'||m.ball?.owner!==p||!valid(p))return false;
 if(num(p.stamina)<33||m.opponentPressure?.(p,62)<2)return false;
 const role=String(p.role||'').toUpperCase();
 if(!MID.has(role)&&!ATTACK.has(role))return false;
 if(m.progress?.(p.side,p.x)<420||m.progress?.(p.side,p.x)>1480)return false;
 if(m.random()>.105)return false;
 const options=(m.players||[]).filter(q=>q!==p&&q.side===p.side&&q.i>0&&valid(q)&&
    distance(p,q)>65&&distance(p,q)<270&&!m.offside?.(q,p)&&
    m.safeLane?.(p,q)>62&&(m.opponentPressure?.(q,78)||0)<2)
   .map(q=>({p:q,priority:m.safeLane(p,q)+m.progress(p.side,q.x)*.012-distance(p,q)*.08}))
   .sort((a,b)=>b.priority-a.priority||a.p.name.localeCompare(b.p.name));
 if(!options.length)return false;
 const receiver=options[0].p;
 m.pass(p,receiver);
 const launched=m.ball?.mode==='pass'&&m.ball.by===p&&m.ball.to===receiver;
 if(launched)note(m,'improvisation',p,'Encontrou saída técnica sob marcação de '+String(m.opponentPressure(p,62))+' rivais');
 return !!launched;
}
function evolvedRun(m,p,owner,previous){
 if(!m||!p||!owner||p.side!==owner.side||m.phase!=='play')return previous;
 const role=String(p.role||'').toUpperCase();
 if(DEF.has(role)&&m.time>79*60&&m.score[p.side]<m.score[1-p.side]&&num(p.stamina)>50&&
  m.progress?.(p.side,owner.x)>870&&['support','overlap','underlap'].includes(previous))return 'late-box';
 if(MID.has(role)&&m.progress?.(p.side,owner.x)>1100&&Math.abs(owner.y-576)>155&&
  ['support','check'].includes(previous))return 'cutback';
 return previous;
}
function shotQuality(m,p,base){
 if(!p||!Number.isFinite(base))return base;
 const role=String(p.role||'').toUpperCase();
 if(!ATTACK.has(role)||!m.inOpponentBox?.(p)||num(p.stamina)<28)return base;
 const history=(m.shotMap||[]).filter(s=>s.shooter===p.name&&s.side===p.side&&s.outcome!=='pending');
 const instinct=Math.min(.015,history.length*.003);
 return clamp(base+instinct,.01,.52);
}
function genuineShot(m,p,previous){
 if(!m||!p||num(m.shotMap?.length)<=previous)return;
 const shot=m.shotMap.at(-1);
 if(shot?.shooter!==p.name||shot?.side!==p.side)return;
 if(num(shot.xg)>=.22||m.inOpponentBox?.(p)){
  note(m,'finisher',p,'Finalização registrada '+(shot.outcome||'em andamento'));
 }
}
function heroicSave(m,keeper,result,b){
 if(!result||!keeper||!b)return;
 if(b.mode!=='shot'||keeper.side===b.by?.side)return;
 if(num(b.shotXg)>=.24){
  const s=state(m);
  s.saves.push({keeper:keeper.name,side:keeper.side,minute:Math.floor(m.time/60),xg:+num(b.shotXg).toFixed(3)});
  if(s.saves.length>22)s.saves.shift();
  note(m,'legendary-save',keeper,'Defesa confirmada em finalização de alto perigo');
 }
}
function sampleTerritory(m){
 if(!m||m.phase!=='play'||!Number.isFinite(m.time)||!valid(m.ball))return;
 const s=state(m);if(m.time-s.lastSample<18)return;
 s.lastSample=m.time;
 const x=clamp(m.ball.x,75,1845),owner=m.ball.owner?.side;
 if(owner!==0&&owner!==1)return;
 s.samples++;
 const progress=m.progress?.(owner,x)||0;
 if(progress>900)s.territory[owner]++;
}
function matchReport(m){
 const s=state(m),saves=s.saves.slice(-14),events=s.events.slice(-65);
 return {schema:1,events,saves,territorySamples:s.samples,territory:s.territory.slice(),
  signatures:[...new Set(events.map(e=>e.type))].slice(0,20)};
}
function adapt(engine){
 const p=engine?.Match?.prototype;if(!p||p._neoAdvanced) return false;
 if(typeof p._attributes==='function'){
  const old=p._attributes;
  p._attributes=function(player,key){this._neoAdvancedEngine=engine;return attributes(this,player,key,old.call(this,player,key));};
 }
 if(typeof p._recordDuel==='function'){
  const old=p._recordDuel;
  p._recordDuel=function(a,b,w,kind){const prior=this.duelHistory?.at(-1),res=old.call(this,a,b,w,kind);
    if(this.duelHistory?.at(-1)!==prior&&this.duelHistory?.length)duel(this,a,b,w,kind);return res;};
 }
 if(typeof p.pass==='function'){
  const old=p.pass;
  p.pass=function(from,to){const out=old.call(this,from,to);launchedPass(this,from,to);return out;};
 }
 if(typeof p._ownerDecision==='function'){
  const old=p._ownerDecision;p._ownerDecision=function(player){
    if(improvisedDecision(this,player))return;
    return old.call(this,player);
  };
 }
 if(typeof p._runType==='function'){
  const old=p._runType;p._runType=function(player,owner){return evolvedRun(this,player,owner,old.call(this,player,owner));};
 }
 if(typeof p.shotQuality==='function'){
  const old=p.shotQuality;p.shotQuality=function(player){return shotQuality(this,player,old.call(this,player));};
 }
 if(typeof p.shoot==='function'){
  const old=p.shoot;p.shoot=function(player){const before=this.shotMap?.length||0,out=old.call(this,player);
    genuineShot(this,player,before);return out;};
 }
 if(typeof p._keeperAttempt==='function'){
  const old=p._keeperAttempt;p._keeperAttempt=function(keeper,ball,dt){const xg=num(ball?.shotXg),by=ball?.by,mode=ball?.mode;
    const out=old.call(this,keeper,ball,dt);
    if(out&&mode==='shot'&&by&&keeper.side!==by.side)heroicSave(this,keeper,true,{mode:'shot',by,shotXg:xg});
    return out;
  };
 }
 if(typeof p._coachDecisions==='function'){
  const old=p._coachDecisions;
  p._coachDecisions=function(){const prior=this.tactics?.slice(),out=old.call(this);
    if(prior&&this.tactics)for(let s=0;s<2;s++)if(this.tactics[s]!==prior[s]){
      const coach=this.players?.find(q=>q.side===s&&q.i>0);
      if(coach)note(this,'coach',coach,'Mudança tática '+prior[s]+' → '+this.tactics[s]);
    }
    return out;
  };
 }
 if(typeof p.step==='function'){
  const old=p.step;p.step=function(dt){const out=old.call(this,dt);sampleTerritory(this);return out;};
 }
 if(typeof p.result==='function'){
  const old=p.result;p.result=function(){const r=old.call(this);r.neoAdvanced=matchReport(this);return r;};
 }
 Object.defineProperty(p,'_neoAdvanced',{value:true});
 return true;
}
return {state,note,mastery,attributes,duel,launchedPass,improvisedDecision,evolvedRun,
 shotQuality,genuineShot,heroicSave,sampleTerritory,matchReport,adapt};
});