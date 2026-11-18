/* Blue Lock NEO 9.9: real-data Team of the Round, full portrait gallery and tactical football improvements. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document){root.NeoRound990=api;api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const SLOTS=[
  {role:'GOL',accept:['GOL','GK']},{role:'LD',accept:['LD','RB','ALA','RWB']},
  {role:'ZAG',accept:['ZAG','CB']},{role:'ZAG',accept:['ZAG','CB']},
  {role:'LE',accept:['LE','LB','ALA','LWB']},{role:'VOL',accept:['VOL','CDM','MC','CM']},
  {role:'MC',accept:['MC','CM','VOL','CDM','MEI','CAM']},
  {role:'MEI',accept:['MEI','CAM','MAT','MC','CM']},
  {role:'PD',accept:['PD','RW','PE','LW']},
  {role:'CA',accept:['CA','ST','CF','SA']},
  {role:'PE',accept:['PE','LW','PD','RW']}
 ];
 const N=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):0;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const roleGroup=r=>['GOL','GK'].includes(r)?'G':['ZAG','CB','LD','LE','RB','LB','ALA','LWB','RWB'].includes(r)?'D':['VOL','CDM','MC','CM','MEI','CAM','MAT'].includes(r)?'M':'F';
 const compat=(a,b)=>a===b?3:(roleGroup(a)===roleGroup(b)?1:0);
 function scoredPlayer(p,team){
  if(!p?.name||p?.isMaster)return null;
  const role=String(p.role||'MC').toUpperCase(),rating=Number.isFinite(Number(p.rating))?Math.min(10,Math.max(0,Number(p.rating))):6;
  const attacking=N(p.goals)*3.1+N(p.assists)*2.2+N(p.shots)*.06+N(p.keyPasses)*.29+N(p.dribblesWon)*.14;
  const defensive=N(p.tackles)*.41+N(p.interceptions)*.48+N(p.shotBlocks)*.63+N(p.aerialWins)*.23+N(p.duelsWon)*.11;
  const keeper=N(p.saves)*.55+N(p.cleanSheets)*1.2;
  const passing=N(p.passes??p.pases)*.012;
  const group=roleGroup(role),score=rating*1.9+passing+(
    group==='G'?keeper+defensive*.14:group==='D'?defensive+attacking*.65:group==='M'?attacking+defensive*.72:attacking+defensive*.27);
  return {name:p.name,club:team,role,rating,score:+score.toFixed(2),stats:{goals:N(p.goals),assists:N(p.assists),saves:N(p.saves),tackles:N(p.tackles),interceptions:N(p.interceptions),blocks:N(p.shotBlocks),passes:N(p.passes??p.pases)}};
 }
 function completeRound(round){return Array.isArray(round?.games)&&round.games.length>0&&round.games.every(g=>Array.isArray(g.result)&&g.result.length===2&&Array.isArray(g.details?.players));}
 function latestCompletedRound(competition){return [...(competition?.rounds||[])].reverse().find(completeRound)||null;}
 function candidates(round){
  const records=new Map();
  for(const g of round.games){for(const p of g.details.players){
   if(p.side!==0&&p.side!==1)continue;
   const team=p.side===0?g.home:g.away,k=String(p.name)+'|'+team;
   const v=scoredPlayer(p,team);if(!v)continue;
   // Multiple mentions of one player in a round cannot create duplicates.
   if(!records.has(k)||records.get(k).score<v.score)records.set(k,v);
  }}
  return [...records.values()];
 }
 function selectXI(round){
  if(!completeRound(round))return {round:round?.round||0,players:[],reserves:[],candidateCount:0};
  const pool=candidates(round),used=new Set(),players=[];
  for(const slot of SLOTS){
   const free=pool.filter(x=>!used.has(x.name.toLocaleLowerCase('pt-BR')));
   const matching=free.filter(x=>slot.accept.includes(x.role));
   const group=roleGroup(slot.role);
   const substitutes=matching.length?matching:free.filter(x=>roleGroup(x.role)===group);
   const options=substitutes.length?substitutes:[]; // Do not put defenders in attacker slots.
   options.sort((a,b)=>(b.score+compat(slot.role,b.role)*1.9)-(a.score+compat(slot.role,a.role)*1.9)||a.name.localeCompare(b.name,'pt-BR'));
   const best=options[0];if(!best)break;
   used.add(best.name.toLocaleLowerCase('pt-BR'));players.push({...best,slot:slot.role,adapted:!slot.accept.includes(best.role)});
  }
  const reserveNames=new Set(used);const reserves=pool.filter(x=>{const k=x.name.toLocaleLowerCase('pt-BR');if(reserveNames.has(k))return false;reserveNames.add(k);return true;}).sort((a,b)=>b.score-a.score).slice(0,8);
  return {round:round.round,players,reserves,candidateCount:pool.length};
 }
 function currentXI(competition){const round=latestCompletedRound(competition);return round?selectXI(round):{round:0,players:[],reserves:[],candidateCount:0};}
 function registerDynamicTeam(E,xi){
  if(!E?.registerTeam||xi?.players?.length!==11)return null;
  let team=E.teamById('neo-bestxi');
  if(!team){team=E.registerTeam({id:'neo-bestxi',name:'Seleção do Campeonato',short:'TOP XI',crest:'XI',country:'NEO',color:'#f0c765',dark:'#6a4821',accent:'#ffebae',style:'build',atk:90,def:90,pas:90,formationName:'4-3-3',master:null,formation:E.DEFAULT_FORMATION.map(f=>({...f})),players:xi.players.map(p=>p.name),reserves:xi.reserves.slice(0,6).map(p=>p.name)});}
  if(!team)return null;
  team.players.splice(0,team.players.length,...xi.players.map(p=>p.name));
  team.reserves.splice(0,team.reserves.length,...xi.reserves.slice(0,6).map(p=>p.name));
  team.formation=E.DEFAULT_FORMATION.map((f,i)=>({...f,role:xi.players[i].slot}));
  team.formationName='4-3-3 · rodada '+xi.round;
  team.round=xi.round;
  return team;
 }
 function adaptAI(E){
  const proto=E?.Match?.prototype;
  if(!proto||proto._neo990AI)return false;
  const originalRun=proto._runType;
  if(typeof originalRun==='function')proto._runType=function(p,owner){
   const normal=originalRun.call(this,p,owner);
   if(!p||!owner||p.side!==owner.side||this.phase!=='play')return normal;
   const progress=typeof this.progress==='function'?this.progress(p.side,owner.x):0;
   const late=this.time>58*60,behind=this.score?.[p.side]<this.score?.[1-p.side];
   if(late&&behind&&progress>780&&['MC','MEI','CAM','CM'].includes(p.role)&&this.random()<.48)return 'late-box';
   if(progress>1000&&Math.abs(owner.y-this.ball?.y)<65&&['PD','PE','RW','LW'].includes(p.role)&&Math.abs(p.y-owner.y)>210&&this.random()<.45)return 'far-post';
   if(['CA','ST','CF'].includes(p.role)&&this.opponentPressure?.(p,80)>1&&progress<1000&&this.random()<.28)return 'drop-off';
   return normal;
  };
  const originalPass=proto.passCandidate;
  if(typeof originalPass==='function')proto.passCandidate=function(p){
   const first=originalPass.call(this,p);
   if(!p||p.i===0||this.phase!=='play'||this.opponentPressure(p,65)<2||this._attributes(p,'vision')<80)return first;
   if(first?.lane>36&&this.opponentPressure(first.q,80)===0)return first;
   const options=this.players.filter(q=>q!==p&&q.side===p.side&&q.i>0&&!this.offside(q,p)).map(q=>{
    const d=Math.hypot(q.x-p.x,q.y-p.y),lane=this.safeLane(p,q),crowd=this.opponentPressure(q,80);
    return {q,d,lane,crowd};
   }).filter(x=>x.d>45&&x.d<275&&x.lane>39&&x.crowd===0)
     .sort((a,b)=>b.lane-a.lane||a.d-b.d);
   const best=options[0];return best?{q:best.q,d:best.d,lane:best.lane,value:(first?.value||0)+1}:first;
  };
  // Make existing *recorded* actions perceptible without changing possession,
  // scoring, keeper saves or statistics. Only live match view receives effects.
  const originalFx=proto._actionFx;
  if(typeof originalFx==='function')proto._actionFx=function(kind,player,x,y,label,side){
   const result=originalFx.call(this,kind,player,x,y,label,side);
   if(typeof document!=='undefined'&&document.querySelector('.nav button[data-tab="match"].active')){
    const stadium=document.getElementById('stadium');
    if(stadium&&['shot','save','tackle','intercept','aerial','block','skill'].includes(kind)){
     const key='neo990-impact-'+(kind==='shot'||kind==='skill'?'shot':kind==='save'?'save':'duel');
     stadium.classList.remove('neo990-impact-shot','neo990-impact-save','neo990-impact-duel');
     // Reflow makes repeated authentic actions restart the effect correctly.
     void stadium.offsetWidth;stadium.classList.add(key);
     clearTimeout(stadium._neo990ImpactTimeout);
     stadium._neo990ImpactTimeout=setTimeout(()=>stadium.classList.remove(key),720);
    }
   }
   return result;
  };
  Object.defineProperty(proto,'_neo990AI',{value:true,configurable:false});return true;
 }
 function mount(win){
  const E=win.NeoEngine,C=win.NeoCups970,doc=win.document;
  if(!E||!doc)return;
  const $=id=>doc.getElementById(id);
  const photo=(name,club)=>win.NeoPortraitUI?.html?.(name,E.teamById(club),'neo990-pic')||'<span class="neo990-pic">⚽</span>';
  adaptAI(E);
  let previous='',selected='league';
  function competitions(){const collection=[{id:'league',title:'Liga Neo Egoísta',data:(()=>{try{return win.NeoCareerBridge?.getSeason?.()||JSON.parse(win.localStorage.getItem('neo-season-v2')||'null')}catch{return null}})()}];
   for(const cup of C?.safeLoad?.(win.localStorage)||[])collection.push({id:cup.id,title:cup.name||'Copa personalizada',data:cup});
   return collection;
  }
  function injectGallery(){
   const select=$('galleryTeam');if(!select)return;
   const teams=E.allTeams?.()||E.TEAMS;
   let changed=false;
   for(const t of teams){if(t.id==='neo-bestxi')continue;
    if(![...select.options].some(o=>o.value===t.id)){
     const opt=doc.createElement('option');opt.value=t.id;opt.textContent=t.name;select.appendChild(opt);changed=true;
    }
   }
   if(changed)select.dispatchEvent(new Event('change',{bubbles:true}));
   if($('neo990-gallery-tip'))return;
   const anchor=$('portraitGallery');if(!anchor)return;
   const hint=doc.createElement('p');hint.id='neo990-gallery-tip';hint.className='neo990-tip';
   hint.textContent='📸 Os quatro clubes históricos estão no filtro Equipe. Toque em 📷 Trocar imagem para enviar o retrato correto de cada atleta.';
   anchor.insertAdjacentElement('beforebegin',hint);
  }
  function ensurePanel(){const root=$('league');if(!root)return null;
   let panel=$('neo990-round-team');if(panel)return panel;
   panel=doc.createElement('section');panel.id='neo990-round-team';panel.className='card neo990-panel';
   panel.innerHTML='<div class="neo990-head"><div><small>⭐ SELEÇÃO DINÂMICA</small><h3>Time do Campeonato</h3><p>Muda automaticamente a cada rodada concluída, com base nas ações e notas registradas.</p></div><span id="neo990-round-label">—</span></div><label class="neo990-select">Competição<select id="neo990-comp"></select></label><div id="neo990-xi"></div><div class="neo990-foot">Apenas partidas realmente concluídas são utilizadas. Esta equipe é gerada pelo campeonato; não existe criação de times pelos usuários.</div>';
   root.insertBefore(panel,root.firstChild);
   // Desktop presentation only: no edits to the original squads, seasons, or XI scoring.
   panel.dataset.xiView='pitch';
   const viewActions=doc.createElement('div');
   viewActions.className='neo990-view-actions';
   viewActions.setAttribute('role','group');
   viewActions.setAttribute('aria-label','Visualização do melhor onze');
   viewActions.innerHTML='<span>VISUALIZAÇÃO</span><button type="button" class="neo990-view-button is-current" data-neo990-view="pitch" aria-pressed="true">⚽ Campo tático</button><button type="button" class="neo990-view-button" data-neo990-view="list" aria-pressed="false">☷ Escalação compacta</button>';
   panel.querySelector('.neo990-select').insertAdjacentElement('afterend',viewActions);
   viewActions.addEventListener('click',event=>{
    const control=event.target.closest('[data-neo990-view]');
    if(!control)return;
    const mode=control.dataset.neo990View;
    if(mode!=='pitch'&&mode!=='list')return;
    panel.dataset.xiView=mode;
    viewActions.querySelectorAll('[data-neo990-view]').forEach(button=>{
     const selected=button.dataset.neo990View===mode;
     button.classList.toggle('is-current',selected);
     button.setAttribute('aria-pressed',String(selected));
    });
    const list=panel.querySelector('.neo990-xi-list');
    if(list)list.open=mode==='list';
   });
   $('neo990-comp').addEventListener('change',e=>{selected=e.target.value;render(true)});
   return panel;
  }
  function updateFriendly(team){
   if(!team)return;
   for(const id of ['home','away']){const sel=$(id);if(!sel||[...sel.options].some(o=>o.value===team.id))continue;
    const opt=doc.createElement('option');opt.value=team.id;opt.textContent='⭐ Seleção do Campeonato (dinâmica)';sel.appendChild(opt);
   }
  }
  function render(force=false){
   const panel=ensurePanel();if(!panel)return;
   const all=competitions(),ids=all.map(x=>x.id);
   if(!ids.includes(selected))selected='league';
   const select=$('neo990-comp'),choices=all.map(x=>x.id+'|'+x.title).join('~');
   if(select.dataset.choices!==choices){select.innerHTML=all.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title)+'</option>').join('');select.dataset.choices=choices;}
   select.value=selected;
   const comp=all.find(x=>x.id===selected),xi=currentXI(comp?.data),signature=selected+'|'+xi.round+'|'+xi.players.map(x=>x.name+'|'+x.club+'|'+x.score).join(';');
   if(!force&&signature===previous)return;previous=signature;
   $('neo990-round-label').textContent=xi.round?'Rodada '+xi.round:'Sem rodada concluída';
   const target=$('neo990-xi');
   if(!xi.players.length){target.innerHTML='<p class="neo990-empty">A seleção será formada quando uma rodada inteira terminar com súmulas de jogadores disponíveis.</p>';return;}
   const starters=xi.players.map((p,i)=>'<button type="button" class="neo990-player" data-profile="'+encodeURIComponent(p.name+'|'+p.club)+'">'+photo(p.name,p.club)+'<span><b>'+esc(p.name)+'</b><small>'+esc(E.teamById(p.club)?.short||p.club)+' · '+esc(p.slot)+(p.adapted?' (adaptado)':'')+'</small></span><strong>'+p.rating.toFixed(1)+'</strong></button>').join('');
   const spots=win.NeoPitch1040?.layout({formationName:'4-3-3',formation:E.DEFAULT_FORMATION},E.DEFAULT_FORMATION)||
     E.DEFAULT_FORMATION.map(f=>({lane:Math.max(10,Math.min(90,f.y*100)),depth:Math.max(18,Math.min(91,(1-f.x)*100))}));
   const pitchPlayers=xi.players.map((p,i)=>{
     const spot=spots[i]||{lane:50,depth:50};
     return '<button type="button" class="neo990-pitch-player" data-profile="'+encodeURIComponent(p.name+'|'+p.club)+'" style="--lane:'+spot.lane+'%;--depth:'+spot.depth+'%" title="'+esc(p.name)+' · '+esc(p.slot)+' · '+p.score.toFixed(1)+'" aria-label="Abrir ficha de '+esc(p.name)+', posição '+esc(p.slot)+'">'+
       photo(p.name,p.club)+'<span class="neo990-position">'+esc(p.slot)+'</span><span class="neo990-name">'+esc(p.name)+'</span><strong class="neo990-score" aria-label="Nota '+p.rating.toFixed(1)+'">'+p.rating.toFixed(1)+'</strong></button>';
   }).join('');
   const pitch='<div class="neo990-xi-pitch" role="group" aria-label="Seleção do Campeonato em campo, formação 4-3-3"><div class="neo980-pitch-markings"><span class="neo980-center-circle"></span><span class="neo980-penalty neo980-penalty-top"></span><span class="neo980-penalty neo980-penalty-bottom"></span></div><span class="neo980-goal goal-top"></span><span class="neo980-goal goal-bottom"></span>'+pitchPlayers+'</div>';
   target.innerHTML='<div class="neo990-team-summary"><b>4-3-3 · Melhor XI</b><small>'+xi.candidateCount+' atletas avaliados · notas 0 a 10 e posições corretas</small></div>'+
      pitch+'<p class="neo990-xi-caption">⬆ Ataque · 🧤 Goleiro na base · Toque em um atleta para abrir sua ficha</p>'+
      '<details class="neo990-xi-list"><summary>☷ Ver escalação em lista</summary><div class="neo990-grid">'+starters+'</div></details>'+
      '<details class="neo990-bench"><summary>Banco e destaques ('+xi.reserves.length+')</summary>'+xi.reserves.map(p=>'<div>'+photo(p.name,p.club)+'<span>'+esc(p.name)+' · '+esc(p.role)+'</span><b>'+p.score.toFixed(1)+'</b></div>').join('')+'</details>';
   const lineUp=target.querySelector('.neo990-xi-list');
   if(lineUp)lineUp.open=panel.dataset.xiView==='list';
   if(xi.players.length===11){const team=registerDynamicTeam(E,xi);updateFriendly(team);}
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>{injectGallery();render(true);}, {once:true});
  else {injectGallery();render(true);}
  win.addEventListener('neo:portraits-changed',()=>render(true));
  const navClicks=()=>{injectGallery();render();};
  doc.addEventListener('click',e=>{
   const profile=e.target.closest('[data-profile]');if(profile){const text=decodeURIComponent(profile.dataset.profile||''),at=text.lastIndexOf('|');if(at>=0)win.NeoMarket96?.openProfile?.(text.slice(0,at),text.slice(at+1));}
   if(e.target.closest('[data-tab="league"],[data-tab="gallery"],[data-neo-tab="league"],[data-neo-tab="more"]'))win.setTimeout(navClicks,70);
  });
  // Scans only small stored fixtures and updates when the final match of a round is saved.
  win.setInterval(()=>{if(!$('neo990-round-team'))return;render();},3500);
  // Keep the gallery options available when returning after an image upload.
  win.setInterval(()=>{if($('galleryTeam'))injectGallery();},6000);
 }
 return {SLOTS,scoredPlayer,completeRound,latestCompletedRound,candidates,selectXI,currentXI,registerDynamicTeam,adaptAI,mount};
});
