/* Blue Lock NEO 10.0: additive live analytics, tactical identity and awards. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document){root.NeoExperience1000=api;api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const N=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BIAS=Object.freeze({
 bm:{label:'Construção e pressão',pressure:'balanced',build:'patient',stance:'attack',width:'normal'},
 ba:{label:'Dribles e posse',pressure:'balanced',build:'patient',stance:'attack',width:'wide'},
 mc:{label:'Velocidade pelos lados',pressure:'high',build:'direct',stance:'attack',width:'wide'},
 px:{label:'Transição explosiva',pressure:'high',build:'direct',stance:'attack',width:'normal'},
 ub:{label:'Bloco compacto',pressure:'low',build:'patient',stance:'defend',width:'narrow'}
});
const DERBIES=Object.freeze({
 'bm|px':'Choque de egos: Isagi, Kaiser e Rin',
 'bm|ub':'Criatividade contra defesa italiana',
 'mc|px':'Velocidade contra velocidade',
 'ba|ub':'Drible contra marcação compacta',
 'bm|mc':'Talento individual contra construção'
});
function derby(a,b){return DERBIES[[a,b].sort().join('|')]||'Disputa tática e protagonismo';}
function awards(season){
 const rows=Object.values(season?.career?.players||{}).filter(p=>p?.name&&N(p.games)>0&&!p.isMaster);
 const top=(score,filter=()=>true)=>rows.filter(filter).slice().sort((a,b)=>score(b)-score(a)||N(b.games)-N(a.games)||a.name.localeCompare(b.name,'pt-BR'))[0]||null;
 const rate=p=>N(p.ratingSum)/Math.max(1,N(p.games));
 const keeper=p=>/^(GOL|GK)$/i.test(p.role||'');
 const defender=p=>/^(ZAG|CB|LD|LE|RB|LB|ALA|RWB|LWB|VOL|CDM)$/i.test(p.role||'');
 return [
  {label:'Artilheiro',icon:'⚽',player:top(p=>N(p.goals)),metric:p=>N(p.goals)+' gols'},
  {label:'Garçom',icon:'🎯',player:top(p=>N(p.assists)),metric:p=>N(p.assists)+' assistências'},
  {label:'Melhor goleiro',icon:'🧤',player:top(p=>N(p.saves)+2*N(p.cleanSheets),keeper),metric:p=>N(p.saves)+' defesas'},
  {label:'Destaque defensivo',icon:'🛡️',player:top(p=>N(p.tackles)+N(p.interceptions)+N(p.shotBlocks)*1.4,defender),metric:p=>N(p.tackles)+' desarmes · '+N(p.interceptions)+' interceptações'},
  {label:'Melhor média',icon:'⭐',player:top(rate,p=>N(p.games)>=2),metric:p=>rate(p).toFixed(2).replace('.',',')+' por jogo'}
 ].filter(r=>r.player);
}
function matchPulse(match){
 if(!match?.stats||!match?.teams)return null;
 const pair=k=>[N(match.stats[k]?.[0]),N(match.stats[k]?.[1])];
 const shots=pair('shots'),target=pair('onTarget'),box=pair('boxShots'),saves=pair('saves'),duels=pair('duelsWon'),crosses=pair('crosses'),xg=pair('xg');
 const score=[shots[0]+target[0]*1.4+box[0]*1.6+xg[0]*2,shots[1]+target[1]*1.4+box[1]*1.6+xg[1]*2];
 return {shots,target,box,saves,duels,crosses,xg,pressure:score[0]+score[1]?Math.round(100*score[0]/(score[0]+score[1])):50,
  minute:Math.floor(N(match.time)/60),teams:match.teams.map(t=>t.short||t.name||'Equipe'),
  styles:match.teams.map(t=>BIAS[t.id]?.label||'Plano adaptável'),
  duel:derby(match.teams[0].id,match.teams[1].id),finished:!!match.finished};
}
function adaptTactics(engine){
 const p=engine?.Match?.prototype;if(!p||p._neo1000Tactics||typeof p.rollGameplan!=='function')return false;
 const original=p.rollGameplan;
 p.rollGameplan=function(){
  const result=original.call(this);
  (this.teams||[]).forEach((team,side)=>{
   const bias=BIAS[team.id];
   if(!bias||this.random()>.74)return;
   this.pressing[side]=bias.pressure;this.buildUp[side]=bias.build;this.tactics[side]=bias.stance;
   this.attackWidth[side]=bias.width;this.planNames[side]=bias.label;
  });
  return {...result,plans:[...(this.planNames||[])]};
 };
 Object.defineProperty(p,'_neo1000Tactics',{value:true});return true;
}
function mount(win){
 const doc=win.document;if(!doc||!win.NeoEngine)return;
 const $=id=>doc.getElementById(id);
 const style=doc.createElement('style');style.id='neo1000-style';
 style.textContent='.neo1000-panel{margin:11px 0;padding:12px;border:1px solid #385b82;background:linear-gradient(130deg,#132c49,#101c31);border-radius:14px;color:#ecf5ff}.neo1000-panel h3{margin:0 0 8px;color:#ffe3a6;font-size:15px}.neo1000-small{font-size:11px;color:#b9d4e9;line-height:1.5}.neo1000-meta{display:flex;justify-content:space-between;gap:8px;font-size:10px}.neo1000-meter{height:7px;background:#98536c;margin:8px 0;border-radius:8px;overflow:hidden}.neo1000-meter span{height:100%;display:block;background:#53baff;transition:width .4s}.neo1000-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.neo1000-stats div,.neo1000-prize{padding:8px 5px;border-radius:9px;border:1px solid #304d68;background:#192e49;text-align:center;font-size:10px}.neo1000-stats b{display:block;font-size:13px;color:#fff}.neo1000-prizes{display:grid;grid-template-columns:repeat(auto-fit,minmax(136px,1fr));gap:8px}.neo1000-prize{text-align:left;padding:10px}.neo1000-prize b{color:#ffdf9d;font-size:11px;display:block;margin-bottom:6px}.neo1000-prize strong{font-size:12px;display:block;overflow-wrap:anywhere}.neo1000-prize small{font-size:10px;color:#a8c9df}.neo1000-shrink{font-size:10px;color:#adcee4}@media(max-width:550px){.neo1000-prizes{grid-template-columns:repeat(2,minmax(0,1fr))}.neo1000-panel{padding:9px}.neo1000-meta{font-size:9px}}@media(prefers-reduced-motion:reduce){.neo1000-meter span{transition:none}}';
 doc.head.appendChild(style);
 function panel(){
  const host=$('match');if(!host)return null;
  let el=$('neo1000-pulse');if(el)return el;
  el=doc.createElement('section');el.id='neo1000-pulse';el.className='neo1000-panel';
  el.innerHTML='<h3>⚡ Raio-X da partida</h3><div id="neo1000-pulse-content" class="neo1000-small">Inicie uma partida para acompanhar os lances registrados.</div>';
  const slot=$('neo920-broadcast'),layout=host.querySelector('.match-layout');
  if(slot)slot.insertAdjacentElement('afterend',el);else if(layout)layout.before(el);else host.prepend(el);
  return el;
 }
 function renderPulse(m){
  const el=$('neo1000-pulse-content'),d=matchPulse(m);if(!el||!d)return;
  const key=[d.minute,d.shots,d.target,d.box,d.saves,d.duels,d.crosses,d.finished].join('|');
  if(el.dataset.key===key)return;el.dataset.key=key;
  el.innerHTML='<p class="neo1000-small">'+esc(d.duel)+' · '+d.minute+"' "+(d.finished?'· Final':'')+'</p>'+
   '<div class="neo1000-meta"><b>'+esc(d.teams[0])+' · '+esc(d.styles[0])+'</b><b>'+esc(d.teams[1])+' · '+esc(d.styles[1])+'</b></div>'+
   '<div class="neo1000-meter" role="img" aria-label="Pressão ofensiva do mandante: '+d.pressure+'%"><span style="width:'+d.pressure+'%"></span></div>'+
   '<div class="neo1000-stats">'+[['Finalizações',d.shots],['Defesas',d.saves],['Chutes na área',d.box],['No alvo',d.target],['Duelos',d.duels],['Cruzamentos',d.crosses]].map(m=>'<div><b>'+m[1].join(' × ')+'</b>'+esc(m[0])+'</div>').join('')+'</div>';
 }
 function season(){try{return JSON.parse(win.localStorage.getItem('neo-season-v2')||'null');}catch(_){return null;}}
 function renderAwards(){
  const league=$('league');if(!league)return;
  let el=$('neo1000-awards');
  if(!el){el=doc.createElement('section');el.id='neo1000-awards';el.className='neo1000-panel';
   const anchor=$('neo990-round-team');if(anchor)anchor.insertAdjacentElement('afterend',el);else league.prepend(el);
  }
  const list=awards(season()),key=list.map(r=>r.label+'|'+r.player.name+'|'+r.metric(r.player)).join(';');
  if(el.dataset.key===key)return;el.dataset.key=key;
  el.innerHTML='<h3>🏆 Prêmios do Campeonato</h3><p class="neo1000-small">Destaques parciais, calculados somente com partidas realmente salvas.</p>'+
   (list.length?'<div class="neo1000-prizes">'+list.map(r=>'<div class="neo1000-prize"><b>'+r.icon+' '+esc(r.label)+'</b><strong>'+esc(r.player.name)+'</strong><small>'+esc(r.metric(r.player))+' · '+esc(r.player.club||'')+'</small></div>').join('')+'</div>':'<p class="neo1000-small">As premiações aparecem após a primeira rodada com estatísticas.</p>');
 }
 adaptTactics(win.NeoEngine);
 const proto=win.NeoEngine.Match?.prototype;
 if(proto&&!proto._neo1000Pulse&&typeof proto.step==='function'){
  const original=proto.step;
  proto.step=function(dt){
   const result=original.call(this,dt);
   if(doc.querySelector('.nav button[data-tab="match"].active')&&Date.now()-(this._neo1000Paint||0)>1100){
    this._neo1000Paint=Date.now();renderPulse(this);
   }
   return result;
  };
  Object.defineProperty(proto,'_neo1000Pulse',{value:true});
 }
 function boot(){
  panel();renderAwards();
  doc.addEventListener('click',event=>{
   if(event.target.closest('[data-tab="league"],[data-neo-tab="league"]'))win.setTimeout(renderAwards,100);
   if(event.target.closest('[data-tab="match"],[data-neo-tab="match"]'))win.setTimeout(panel,50);
  });
  win.setInterval(()=>{if(doc.querySelector('.nav button[data-tab="league"].active'))renderAwards();},6500);
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {BIAS,derby,awards,matchPulse,adaptTactics,mount};
});