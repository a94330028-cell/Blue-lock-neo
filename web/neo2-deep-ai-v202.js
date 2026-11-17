/* BLUE LOCK NEO 2.0 — DEEP MATCH INTELLIGENCE
 * Player memory, selective passes, defensive compactness and score-aware coaching.
 * Decisions use only match state + match.seeded random(); no hidden score boosts,
 * scripted goals, saving a mutated team roster or network dependencies.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(p,q)=>Math.hypot((p.x||0)-(q.x||0),(p.y||0)-(q.y||0));
const VALID=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const BACK=new Set(['ZAG','CB','LD','LE','RB','LB','VOL','CDM','ALA','LWB','RWB']);
const FORWARD=new Set(['CA','CF','ST','SA','PE','PD','RW','LW']);
const states=new WeakMap();
function memory(m){
 let st=states.get(m);
 if(!st){st={passLanes:[],duels:[],decisions:[0,0],adaptations:[],lastCoach:[-1000,-1000],recent:[-1000,-1000],reads:0};states.set(m,st);}
 return st;
}
function teams(m,side){return Array.isArray(m.players)?m.players.filter(p=>p.side===side):[];}
function pressureNear(m,p,r=82){
 if(!VALID(p)||!Array.isArray(m.players))return 0;
 return m.players.reduce((n,q)=>n+(q.side!==p.side&&q.i!==0&&VALID(q)&&dist(q,p)<r?1:0),0);
}
function passScore(m,p,q,st=memory(m)){
 if(!VALID(p)||!VALID(q)||p.side!==q.side||q===p||q.i===0)return -Infinity;
 const d=dist(p,q),dir=p.side===0?1:-1,ahead=(q.x-p.x)*dir;
 if(d<48||d>465||m.offside?.(q,p))return -Infinity;
 const lane=typeof m.safeLane==='function'?m.safeLane(p,q):50;
 const defenders=pressureNear(m,q,84),carrier=pressureNear(m,p,94);
 const attrs=q.attributes||{};
 const vision=(Number(p.attributes?.vision)||75);
 const technique=(Number(p.attributes?.passing)||75);
 const build=m.buildUp?.[p.side]||'balanced';
 const lead=(m.score?.[p.side]||0)-(m.score?.[1-p.side]||0);
 const time=(m.time||0)/60;
 const fatigue=clamp((100-(q.stamina??90))*.36,0,24);
 const rivalReads=st.passLanes.filter(x=>x.side===p.side&&x.to===q.name&&m.time-x.time<330).length;
 const move=q.run?.type||'';
 let score=lane*.38-ahead*.014-d*.072+clamp(ahead,-250,340)*.19-defenders*31-carrier*4
  +(vision-76)*.12+(technique-76)*.12+(attrs.positioning||78)*.035-fatigue-rivalReads*3;
 if(move==='third-man'||move==='blindside'||move==='half-space'||move==='late-box')score+=18;
 if(move==='decoy')score-=34;
 if(q.i>=8&&ahead>20&&lane>38)score+=9;
 if(build==='direct'&&ahead>65)score+=24;
 if(build==='patient'&&d<185&&lane>35)score+=27;
 if(build==='patient'&&d>330)score-=20;
 if(lead<=-1&&time>=65&&ahead>60)score+=18;
 if(lead>=2&&time>=73&&ahead<5&&lane>34)score+=22;
 if(m.tactics?.[p.side]==='defend'&&ahead<0)score+=18;
 if(m.tactics?.[p.side]==='attack'&&ahead>60)score+=12;
 return score;
}
function chooseOutlet(m,p){
 const st=memory(m),available=teams(m,p.side).filter(q=>q!==p&&q.i!==0);
 const ranked=available.map(q=>({q,score:passScore(m,p,q,st)}))
  .filter(c=>Number.isFinite(c.score)).sort((a,b)=>b.score-a.score||a.q.id-b.q.id);
 if(!ranked.length)return null;
 const best=ranked[0],lane=typeof m.safeLane==='function'?m.safeLane(p,best.q):50;
 return {q:best.q,score:best.score,value:best.score,lane,d:dist(p,best.q)};
}
function contextAction(m,p){
 if(m.phase!=='play'||m.ball?.owner!==p||!VALID(p)||!Array.isArray(m.players))return false;
 const st=memory(m),side=p.side,now=m.time||0;
 if(now-st.recent[side]<1.1)return false;
 const rivals=pressureNear(m,p,90),choice=chooseOutlet(m,p);
 const aheadGoal=side===0?1847:73;
 const goalDist=dist(p,{x:aheadGoal,y:576});
 const shotQuality=m.shotQuality?.(p)||0,finishing=Number(p.attributes?.finishing)||75;
 // A high-quality finisher may choose the real shot method when closing
 // angles; a defender under heavy pressure seeks a secure outlet instead.
 if(p.i>0&&m.canShoot?.(p)&&goalDist<285&&Math.abs(p.y-576)<205&&
    shotQuality>.22&&rivals<=1&&finishing>=82&&m.random()<.17){
   st.recent[side]=now;st.decisions[side]++;m.shoot(p);return true;
 }
 if(rivals>=2&&choice&&choice.score>10&&choice.lane>38&&m.random()<.51){
   st.recent[side]=now;st.decisions[side]++;m.pass(p,choice.q);return true;
 }
 if(choice&&choice.score>42&&m.buildUp?.[side]==='patient'&&
    goalDist>340&&m.random()<.26){
   st.recent[side]=now;st.decisions[side]++;m.pass(p,choice.q);return true;
 }
 return false;
}
function defensiveTarget(m,p,target,phase){
 if(!VALID(target)||!VALID(p)||!BACK.has(p.role)||!['block','transition-defense'].includes(phase))return target;
 const owner=m.ball?.owner;
 if(!VALID(owner)||owner.side===p.side||m.phase!=='play')return target;
 const dir=p.side===0?1:-1;
 const ownGoal=p.side===0?73:1847;
 const danger=clamp(1-Math.abs(owner.x-ownGoal)/830,0,1);
 if(danger<.18)return target;
 const attackers=teams(m,owner.side).filter(q=>q.i>0&&VALID(q)&&Math.abs(q.x-ownGoal)<670);
 const laneThreat=attackers.filter(q=>Math.abs(q.y-p.y)<115&&Math.abs(q.x-ownGoal)<Math.abs(p.x-ownGoal)+125).length;
 const compactness=clamp(.10+danger*.19+laneThreat*.025,.1,.39);
 const targetX=clamp(target.x*(1-compactness)+
    (owner.x-dir*(p.role==='ZAG'||p.role==='CB'?100:145))*compactness,84,1836);
 const targetY=clamp(target.y*(1-compactness)+(576+(owner.y-576)*.46)*compactness,70,1080);
 return {x:targetX,y:targetY};
}
function coachingPlan(m,side){
 if(m.phase!=='play'||!m.autoCoach||m.coachLocked?.[side])return null;
 const minute=(m.time||0)/60;
 if(minute<18)return null;
 const lead=(m.score?.[side]||0)-(m.score?.[1-side]||0);
 const xg=(m.stats?.xg?.[side]||0)-(m.stats?.xg?.[1-side]||0);
 const control=(m.stats?.possession?.[side]||0)-(m.stats?.possession?.[1-side]||0);
 const squad=teams(m,side).filter(p=>p.i>0);
 const stamina=squad.length?squad.reduce((a,p)=>a+(p.stamina??80),0)/squad.length:80;
 if(lead<=-2&&minute>33)return {pressing:stamina>54?'high':'balanced',buildUp:'direct',attackWidth:'wide',stance:'attack',reason:'placar exige reação imediata'};
 if(lead<0&&minute>60&&xg<.1)return {pressing:stamina>56?'high':'balanced',buildUp:'direct',attackWidth:'wide',stance:'attack',reason:'criar chances para buscar empate'};
 if(lead>=2&&minute>73)return {pressing:'low',buildUp:'patient',attackWidth:'narrow',stance:'defend',reason:'proteger vantagem sem rifar a posse'};
 if(lead===0&&minute>54&&xg<-.55&&control<-90&&stamina>67)return {pressing:'high',buildUp:'balanced',attackWidth:'normal',stance:'balanced',reason:'reagir ao domínio adversário'};
 if(stamina<61&&m.pressing?.[side]==='high')return {pressing:'balanced',buildUp:'patient',attackWidth:'normal',stance:m.tactics?.[side]||'balanced',reason:'reduzir desgaste e reconstruir jogadas'};
 return null;
}
function recordPass(m,p,q){
 if(!p||!q||m.ball?.mode!=='pass'||m.ball.by!==p)return;
 const st=memory(m);
 st.passLanes.push({time:m.time||0,side:p.side,from:p.name,to:q.name,
   lane:Math.round(m.safeLane?.(p,q)||0)});
 if(st.passLanes.length>80)st.passLanes.shift();
}
function recordDuel(m,a,b,w){
 if(!a||!b||!w)return;
 const st=memory(m);st.duels.push({time:m.time||0,attacker:a.name,defender:b.name,winner:w.name});
 if(st.duels.length>48)st.duels.shift();
 st.reads++;
}
function report(m){const st=memory(m);return {schema:2,deepDecisions:st.decisions.slice(),
 adaptations:st.adaptations.slice(-18),observedPasses:st.passLanes.length,observedDuels:st.reads};}
function adapt(engine){
 const p=engine?.Match?.prototype;if(!p||p._neo2DeepAI)return false;
 if(typeof p.passCandidate==='function'){
  const old=p.passCandidate;p.passCandidate=function(player){
   const standard=old.call(this,player),chosen=chooseOutlet(this,player);
   if(!chosen)return standard;
   if(!standard||!standard.q||standard.lane<15)return chosen;
   const baseScore=passScore(this,player,standard.q);
   if(chosen.q!==standard.q&&chosen.score>baseScore+17)return chosen;
   return standard;
  };
 }
 if(typeof p._ownerDecision==='function'){
  const old=p._ownerDecision;p._ownerDecision=function(player){
   if(contextAction(this,player))return;
   return old.call(this,player);
  };
 }
 if(typeof p._defensivePositionalTarget==='function'){
  const old=p._defensivePositionalTarget;
  p._defensivePositionalTarget=function(player,target,phase){
   return defensiveTarget(this,player,old.call(this,player,target,phase),phase);
  };
 }
 if(typeof p._coachDecisions==='function'){
  const old=p._coachDecisions;p._coachDecisions=function(){
   const result=old.call(this),st=memory(this),minute=Math.floor((this.time||0)/60);
   if(this.phase!=='play')return result;
   for(let side=0;side<2;side++){
    if((this.time||0)-st.lastCoach[side]<510)continue;
    const plan=coachingPlan(this,side);if(!plan)continue;
    const changed=this.pressing?.[side]!==plan.pressing||this.buildUp?.[side]!==plan.buildUp||
      this.attackWidth?.[side]!==plan.attackWidth||this.tactics?.[side]!==plan.stance;
    if(!changed)continue;
    this.pressing[side]=plan.pressing;this.buildUp[side]=plan.buildUp;
    this.attackWidth[side]=plan.attackWidth;this.tactics[side]=plan.stance;
    st.lastCoach[side]=this.time;
    const item={side,minute,type:'deep-adaptation',reason:plan.reason,
      pressing:plan.pressing,buildUp:plan.buildUp,attackWidth:plan.attackWidth};
    st.adaptations.push(item);if(st.adaptations.length>18)st.adaptations.shift();
    this.coachDecisions?.push({...item});if(this.coachDecisions?.length>80)this.coachDecisions.shift();
    this.log?.('🧠 '+(this.teams?.[side]?.short||'Equipe')+': '+plan.reason+'.','coach');
   }
   return result;
  };
 }
 if(typeof p.pass==='function'){
  const old=p.pass;p.pass=function(a,b){const result=old.call(this,a,b);recordPass(this,a,b);return result;};
 }
 if(typeof p._recordDuel==='function'){
  const old=p._recordDuel;p._recordDuel=function(a,b,w,kind){
   const n=this.duelHistory?.length||0;const result=old.call(this,a,b,w,kind);
   if((this.duelHistory?.length||0)>n)recordDuel(this,a,b,w);
   return result;
  };
 }
 if(typeof p.result==='function'){
  const old=p.result;p.result=function(){const out=old.call(this);out.neo2DeepAI=report(this);return out;};
 }
 Object.defineProperty(p,'_neo2DeepAI',{value:true});
 return true;
}
return {memory,passScore,chooseOutlet,contextAction,defensiveTarget,coachingPlan,recordPass,recordDuel,report,adapt};
});
