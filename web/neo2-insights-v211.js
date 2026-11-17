/* NEO 2.0 — actual match insights, heat maps, replay director and safe statistics.
 * All outputs derive from Match snapshots, shotMap, actual passes and real goals.
 * The report is compact; frame-by-frame replay stays memory-only, never in saves.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.Neo2Insights=api;if(root.NeoEngine)api.adapt(root.NeoEngine)}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const value=x=>Number.isFinite(Number(x))?Number(x):0;
const state=new WeakMap();
const GRID_X=10,GRID_Y=6;
function data(m){
 let s=state.get(m);
 if(!s){s={lastSample:-180,samples:0,heat:{},progressive:[0,0],attempts:[0,0],
   possessions:[0,0],shotContexts:[],cues:[]};state.set(m,s);}
 return s;
}
function sample(m){
 const s=data(m),now=value(m?.time);
 if(now-s.lastSample<100||m.phase!=='play')return false;
 s.lastSample=now;s.samples++;
 const rect=m.PITCH||{left:73,right:1847,top:44,bottom:1108};
 for(const p of m.players||[]){
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
  const team=m.teams?.[p.side]?.id;if(!team)continue;
  const k=p.name+'|'+team,grid=s.heat[k]||(s.heat[k]=Array(GRID_X*GRID_Y).fill(0));
  const col=clamp(Math.floor((p.x-rect.left)/(rect.right-rect.left)*GRID_X),0,GRID_X-1);
  const row=clamp(Math.floor((p.y-rect.top)/(rect.bottom-rect.top)*GRID_Y),0,GRID_Y-1);
  grid[row*GRID_X+col]=Math.min(999,grid[row*GRID_X+col]+1);
 }
 if(m.ball?.owner&&[0,1].includes(m.ball.owner.side))s.possessions[m.ball.owner.side]++;
 return true;
}
function afterPass(m,p,q){
 if(!p||!q||p.side!==q.side||!m.ball||m.ball.by!==p||m.ball.mode!=='pass')return;
 const s=data(m),side=p.side,dir=side===0?1:-1;
 s.attempts[side]++;
 // Progressive PASS ATTEMPTS, never call this completed passes: reception
 // already has a dedicated verified counter in the original engine.
 if((q.x-p.x)*dir>=92)s.progressive[side]++;
}
function shotBreakdown(r){
 const shots=Array.isArray(r?.shots)?r.shots:[];
 const byTeam=[0,1].map(side=>{
  const v=shots.filter(x=>x?.side===side);
  return {team:side,attempts:v.length,goals:v.filter(x=>x.outcome==='goal').length,
   onTarget:v.filter(x=>x.onTarget).length,xg:+v.reduce((n,x)=>n+Math.max(0,value(x.xg)),0).toFixed(2),
   penalties:v.filter(x=>x.setPiece==='penalty').length,
   inBox:v.filter(x=>x.x!==undefined&&x.y!==undefined&&
     Math.abs(value(x.x)-(side===0?1847:73))<230&&Math.abs(value(x.y)-576)<280).length};
 });
 return byTeam;
}
function highlights(r){
 const events=(r?.events||[]).filter(x=>x&&typeof x.text==='string');
 const goals=(r?.goalRecords||[]).map(x=>({type:'goal',minute:value(x.minute),label:x.scorer,
  detail:'Gol confirmado: '+x.scorer+(x.assister?' · Assistência: '+x.assister:'')}));
 const saves=(r?.shots||[]).filter(x=>x?.outcome==='saved'&&value(x.xg)>=.24)
  .map(x=>({type:'save',minute:value(x.minute),label:x.savedBy||'Goleiro',detail:'Defesa real contra chance de '+Math.round(value(x.xg)*100)+'% xG'}));
 const other=events.filter(x=>['penalty','card','master','flow'].includes(x.type))
  .map(x=>({type:x.type,minute:value(x.minute),label:x.player||x.type,detail:x.text.slice(0,140)}));
 const all=goals.concat(saves,other).sort((a,b)=>a.minute-b.minute);
 return all.slice(-24);
}
function camera(m){
 if(!m?.ball)return null;
 const b=m.ball,last=m.keyEvents?.[m.keyEvents.length-1],effect=m.skillEffects?.at(-1);
 if(m.phase==='goal')return {mode:'goal',zoom:1.42,focus:m.lastGoal?.scorer||'',x:b.x,y:b.y};
 if(b.isPenalty&&b.mode==='shot')return {mode:'penalty',zoom:1.55,focus:b.by?.name||'',x:b.x,y:b.y};
 if(b.mode==='shot')return {mode:'shot',zoom:1.3,focus:b.by?.name||'',x:b.x,y:b.y};
 if(effect&&value(effect.until)>=value(m.time)&&value(effect.start)<=value(m.time))
  return {mode:'ability',zoom:1.36,focus:effect.player,x:effect.x,y:effect.y};
 if(m.ball.owner)return {mode:'carrier',zoom:1.13,focus:m.ball.owner.name,x:b.x,y:b.y};
 return {mode:'wide',zoom:1,focus:last?.player||'',x:b.x,y:b.y};
}
function report(m,out){
 const s=data(m),r=out||m.result?.();
 if(!r)return null;
 const last=highlights(r);
 return {schema:1,heatGrid:[GRID_X,GRID_Y],samples:s.samples,
  heat:Object.fromEntries(Object.entries(s.heat).slice(0,34)),
  progressivePassAttempts:s.progressive.slice(),passAttempts:s.attempts.slice(),
  possessionSamples:s.possessions.slice(),shots:shotBreakdown(r),
  highlights:last,peakMoment:last.length?last.at(-1):null};
}
function adapt(engine){
 const proto=engine?.Match?.prototype;if(!proto||proto._neo2InsightInstalled)return false;
 if(typeof proto.pass==='function'){
  const old=proto.pass;proto.pass=function(p,q){const r=old.call(this,p,q);afterPass(this,p,q);return r};
 }
 if(typeof proto._snapshot==='function'){
  const old=proto._snapshot;proto._snapshot=function(dt){sample(this);return old.call(this,dt)};
 }
 if(typeof proto.result==='function'){
  const old=proto.result;proto.result=function(){const r=old.call(this);r.neo2Insights=report(this,r);return r};
 }
 Object.defineProperty(proto,'_neo2InsightInstalled',{value:true});
 engine.Neo2Insights={sample,afterPass,report,camera,shotBreakdown,highlights};
 return true;
}
return {sample,afterPass,report,camera,shotBreakdown,highlights,adapt};
});