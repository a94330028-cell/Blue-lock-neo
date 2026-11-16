/* Blue Lock NEO 10.1 — football AI, goalkeepers and real-action cinema.
   Additive: never removes portraits, saved seasons or existing clubs. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root?.document){root.NeoFootball1010=api;api.mount(root);}})(typeof window!=='undefined'?window:null,function(){
'use strict';
const RIVALS=Object.freeze({'Yoichi Isagi':['Rin Itoshi','Michael Kaiser','Shoei Baro'],'Rin Itoshi':['Yoichi Isagi','Michael Kaiser','Ryusei Shido'],'Michael Kaiser':['Yoichi Isagi','Rin Itoshi'],'Shoei Baro':['Yoichi Isagi'],'Ryusei Shido':['Rin Itoshi']});
const DEFENDERS=new Set(['ZAG','CB','LD','LE','RB','LB','ALA','RWB','LWB']);
const WINGERS=new Set(['PD','PE','LW','RW','LD','LE','RB','LB','ALA']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),role=r=>String(r||'').toUpperCase();
function rivalryPair(a,b){return !!(RIVALS[a]?.includes(b)||RIVALS[b]?.includes(a));}
function shouldLateRun(m,p,o){return !!(m&&p&&o&&p.side===o.side&&DEFENDERS.has(role(p.role))&&m.phase==='play'&&m.time>=72*60&&m.score?.[p.side]<m.score?.[1-p.side]&&typeof m.progress==='function'&&m.progress(p.side,o.x)>870&&m.random()<.13);}
function keeperMove(g,b,dt,m){
 if(!g||!b||!m||b.mode!=='shot'||!b.onTarget||b.by?.side===g.side||g.i!==0)return false;
 if(!Number.isFinite(b.x)||!Number.isFinite(b.y)||!Number.isFinite(g.x)||!Number.isFinite(g.y))return false;
 const goalX=g.side===0?73:1847;
 if(Math.abs(b.x-goalX)>270)return false;
 const step=clamp(Number(dt)||0,0,.08)*125,target=clamp(b.y+(b.vy||0)*.08,576-130,576+130);
 g.y+=clamp(target-g.y,-step,step);return true;
}
function adapt(engine){
 const p=engine?.Match?.prototype;if(!p||p._neo1010Installed)return false;
 if(typeof p._runType==='function'){
  const orig=p._runType;p._runType=function(player,owner){const normal=orig.call(this,player,owner);return shouldLateRun(this,player,owner)?'late-box':normal;};
 }
 if(typeof p._keeperAttempt==='function'){
  const orig=p._keeperAttempt;p._keeperAttempt=function(g,b,dt){keeperMove(g,b,dt,this);return orig.call(this,g,b,dt);};
 }
 if(typeof p._ownerDecision==='function'){
  const orig=p._ownerDecision;
  p._ownerDecision=function(player){
   const prog=typeof this.progress==='function'?this.progress(player?.side,player?.x):0;
   if(player&&this.phase==='play'&&this.ball?.owner===player&&player.i>0&&WINGERS.has(role(player.role))&&prog>1000&&Math.abs(player.y-576)>175&&this.random()<.16&&typeof this.cross==='function'){
    const receiver=this.players?.some(q=>q!==player&&q.side===player.side&&q.i>0&&this.inOpponentBox?.(q));
    if(receiver&&this.cross(player))return;
   }
   return orig.call(this,player);
  };
 }
 if(typeof p._recordDuel==='function'){
  const orig=p._recordDuel;
  p._recordDuel=function(a,b,w,kind){
   const r=orig.call(this,a,b,w,kind);
   if(a&&b&&w&&a.side!==b.side&&rivalryPair(a.name,b.name)){
    const key=[a.name,b.name].sort().join('|');
    if(this.time-(this._neo1010Rivalries?.[key]??-999)>210){
     (this._neo1010Rivalries||(this._neo1010Rivalries=Object.create(null)))[key]=this.time;
     this._ego?.(w,4,'rivalidade');
     this.log?.('🔥 Duelo de rivais: '+a.name+' × '+b.name+'!','duel',w.name);
    }
   }
   return r;
  };
 }
 Object.defineProperty(p,'_neo1010Installed',{value:true});return true;
}
function cinematicType(kind){
 const k=String(kind||'').toLowerCase();
 if(k.includes('keeper')||k==='save')return ['save','🧤 DEFESA!'];
 if(['tap-in','low-shot','volley','acro-shot','chip','shot'].includes(k))return ['shot',k==='chip'?'🎩 COBERTURA!':k==='acro-shot'?'🌪️ ACROBACIA!':k==='volley'?'⚡ DE PRIMEIRA!':'⚽ FINALIZAÇÃO!'];
 if(['tackle','intercept','block'].includes(k))return ['duel','🛡️ DISPUTA!'];
 if(k==='skill')return ['skill','✦ HABILIDADE!'];
 return null;
}
function mount(win){
 const engine=win.NeoEngine,doc=win.document;if(!engine||!doc)return;
 adapt(engine);
 const $=id=>doc.getElementById(id),pref='neo-cinema-enabled-v1010';
 let enabled=true;try{enabled=win.localStorage.getItem(pref)!=='off';}catch(_){}
 const style=doc.createElement('style');style.id='neo1010-style';
 style.textContent='#stadium{position:relative}.neo1010-film{position:absolute;bottom:12px;left:50%;transform:translate(-50%,8px);z-index:19;max-width:86%;pointer-events:none;background:#081529e8;border:1px solid #66c5ed;border-radius:10px;padding:7px 12px;color:#e7f6ff;text-align:center;font-weight:950;font-size:11px;box-shadow:0 7px 18px #0007;opacity:0;transition:opacity .2s,transform .2s}.neo1010-film.visible{opacity:1;transform:translate(-50%,0)}.neo1010-film.shot{border-color:#ffd16b;color:#ffe09d}.neo1010-film.save{border-color:#79dfc8;color:#abffde}.neo1010-film.skill{border-color:#b9a0ff;color:#dacaff}.neo1010-control{display:flex;align-items:center;gap:8px;color:#b0d5ec;font-size:11px;padding:10px 12px;border-radius:10px;border:1px solid #2c4d6a;background:#0d2037;margin:7px 0}.neo1010-control input{width:17px;height:17px;accent-color:#1ca3ef}@media(prefers-reduced-motion:reduce){.neo1010-film{transition:none}}';
 doc.head.appendChild(style);
 function installSwitch(){
  const panel=$('neo920-broadcast')||$('match');if(!panel||$('neo1010-control'))return;
  const label=doc.createElement('label');label.id='neo1010-control';label.className='neo1010-control';
  label.innerHTML='<input type="checkbox" id="neo1010-cinema"> 🎥 Efeitos cinematográficos dos lances reais';panel.append(label);
  const check=$('neo1010-cinema');check.checked=enabled;
  check.addEventListener('change',()=>{enabled=check.checked;try{win.localStorage.setItem(pref,enabled?'on':'off');}catch(_){}});
 }
 const proto=engine.Match?.prototype;
 if(proto&&!proto._neo1010Cinema&&typeof proto._actionFx==='function'){
  const orig=proto._actionFx;
  proto._actionFx=function(kind,player,x,y,label,side){
   const r=orig.call(this,kind,player,x,y,label,side);
   if(!doc.querySelector('.nav button[data-tab="match"].active')||!enabled||!player)return r;
   const cue=cinematicType(kind),stadium=$('stadium');if(!cue||!stadium)return r;
   let el=$('neo1010-film');if(!el){el=doc.createElement('div');el.id='neo1010-film';el.setAttribute('aria-hidden','true');stadium.append(el);}
   win.clearTimeout(el._hide);el.className='neo1010-film '+cue[0];el.textContent=cue[1]+' · '+String(player.name||'').slice(0,38);
   void el.offsetWidth;el.classList.add('visible');el._hide=win.setTimeout(()=>el.classList.remove('visible'),1300);return r;
  };Object.defineProperty(proto,'_neo1010Cinema',{value:true});
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',installSwitch,{once:true});else installSwitch();
}
return {rivalryPair,shouldLateRun,keeperMove,cinematicType,adapt,mount};
});