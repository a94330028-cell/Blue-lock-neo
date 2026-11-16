/* Blue Lock NEO v1.1 — contextual tactical intelligence.
 * Works on Match state. Never replaces engine results or player saves.
 * Deterministic: uses the match's seeded random generator only for decisions.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const FRONT=new Set(['CA','CF','ST','SA','PD','PE','RW','LW']);
const BACK=new Set(['ZAG','CB','LD','LE','RB','LB','ALA','RWB','LWB']);
const MID=new Set(['VOL','CDM','MC','CM','MEI','CAM']);
const valid=p=>!!(p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function safeOutlet(m,p){
 if(!m||!p||!valid(p)||!Array.isArray(m.players))return null;
 let best=null,score=-Infinity;
 for(const q of m.players){
  if(!q||q===p||q.side!==p.side||q.i===0||!valid(q)||typeof m.safeLane!=='function')continue;
  const range=dist(p,q);if(range<48||range>375)continue;
  if(m.offside?.(q,p))continue;
  const lane=m.safeLane(p,q);
  if(lane<32)continue;
  const opponents=m.players.filter(o=>o.side!==p.side&&o.i!==0&&valid(o)&&dist(o,q)<90).length;
  if(opponents>=2)continue;
  const advance=(q.x-p.x)*(p.side===0?1:-1);
  const vision=Number(p.attributes?.vision)||75;
  const score0=lane*.25-opponents*44-range*.06+clamp(advance,-140,220)*.10+(MID.has(q.role)?14:0)+(vision-75)*.18+(q.run?6:0);
  if(score0>score){score=score0;best=q;}
 }
 return best;
}
function threatCover(m,p,target,phase){
 if(!m||!p||!valid(p)||!target||!valid(target)||!BACK.has(p.role)&&!MID.has(p.role))return target;
 if(m.phase!=='play'||!['block','transition-defense'].includes(phase)||p===m.ball?.owner||p.run||p.i===0)return target;
 const b=m.ball,owner=b?.owner;if(!valid(b)||!owner||owner.side===p.side)return target;
 const span=1920,midX=960,midY=576,side=p.side;
 const progress=typeof m.progress==='function'?m.progress(side,b.x):0;
 // Only tighten coverage near own penalty area, not at midfield.
 if(progress>670)return target;
 const centerBack= p.role==='ZAG'||p.role==='CB';
 const holder=p.role==='VOL'||p.role==='CDM';
 const wing=BACK.has(p.role)&&!centerBack;
 const width=wing?240:centerBack?115:170;
 const nearX=clamp(b.x+(side===0?-100:100),70,1850);
 const dangerY=clamp(midY+(b.y-midY)*(wing?.68:centerBack?.29:.43),midY-width,midY+width);
 const x=centerBack
   ? clamp((target.x*.75+nearX*.25),70,1850)
   : holder?clamp(target.x*.76+nearX*.24,70,1850)
   :clamp(target.x*.85+nearX*.15,70,1850);
 const y=clamp(target.y*(centerBack?.65:holder?.73:.76)+dangerY*(centerBack?.35:holder?.27:.24),55,1095);
 // Don't teleport: only alter the destination used by normal movement.
 return {x:clamp(x,70,1850),y};
}
function pressEscape(m,player){
 if(!m||!player||!valid(player)||player.i===0||m.ball?.owner!==player||m.phase!=='play')return false;
 if(typeof m.opponentPressure!=='function'||typeof m.pass!=='function')return false;
 const pressure=m.opponentPressure(player,92);
 if(pressure<2)return false;
 // No automatic pass every tick: decisions depend on their actual mental/technical attributes.
 const poise=clamp((Number(player.attributes?.vision)||70)*.0036,.20,.38);
 if(m.random()>=poise)return false;
 const to=safeOutlet(m,player);
 return !!(to&&m.pass(player,to));
}
function adaptiveRun(m,p,owner,fallback){
 if(!m||!p||!owner||p.side!==owner.side||!valid(p)||!valid(owner)||m.phase!=='play')return fallback;
 const progress=m.progress?.(p.side,owner.x)||0;
 const behind=m.score?.[p.side]<m.score?.[1-p.side];
 const minute=(m.time||0)/60;
 if(FRONT.has(p.role)&&progress>1000&&Math.abs(owner.y-576)>180){
   const onOtherSide=Math.sign(p.baseY-576)!==Math.sign(owner.y-576);
   if(onOtherSide)return 'far-post';
   if(['CA','CF','ST','SA'].includes(p.role))return 'cutback';
 }
 if(behind&&minute>75&&MID.has(p.role)&&progress>740&&m.random()<.46)return 'late-box';
 return fallback;
}
function adapt(engine){
 const proto=engine?.Match?.prototype;
 if(!proto||proto._neo110AIStrategy)return false;
 if(typeof proto._defensivePositionalTarget==='function'){
  const original=proto._defensivePositionalTarget;
  proto._defensivePositionalTarget=function(p,target,phase){
   return threatCover(this,p,original.call(this,p,target,phase),phase);
  };
 }
 if(typeof proto._ownerDecision==='function'){
  const original=proto._ownerDecision;
  proto._ownerDecision=function(p){
   if(pressEscape(this,p))return;
   return original.call(this,p);
  };
 }
 if(typeof proto._runType==='function'){
  const original=proto._runType;
  proto._runType=function(p,owner){return adaptiveRun(this,p,owner,original.call(this,p,owner));};
 }
 Object.defineProperty(proto,'_neo110AIStrategy',{value:true});
 return true;
}
return {safeOutlet,threatCover,pressEscape,adaptiveRun,adapt};
});