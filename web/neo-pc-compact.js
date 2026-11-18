/* EGO ARENA 3.0 — desktop match cockpit. Original controls and game canvases
 * are MOVED, never cloned, so the match engine and all event listeners survive.
 * Under 1024px the original DOM is restored, leaving mobile untouched.
 */
(function(){
 'use strict';
 const mq=window.matchMedia('(min-width: 1024px)');
 let mounted=null;
 const el=(tag,cls,html)=>{const item=document.createElement(tag);item.className=cls;if(html!==undefined)item.innerHTML=html;return item;};
 function mount(){
  if(mounted||!mq.matches)return;
  const match=document.getElementById('match'),main=match?.querySelector('.match-main'),
   aside=match?.querySelector('.match-side'),card=main?.querySelector('.match-card'),
   controls=card?.querySelector('.match-controls'),stadium=card?.querySelector('#stadium');
  if(!match||!main||!aside||!card||!controls||!stadium)return;
  const moves=[],created=[];
  function make(tag,cls,html,parent,position='append'){
   const node=el(tag,cls,html);parent[position](node);created.push(node);return node;
  }
  function move(node,target){
   if(!node||!target)return;
   const marker=document.createComment('EGO ARENA original position');
   node.parentNode.insertBefore(marker,node);target.appendChild(node);moves.push({node,marker});
  }
  document.body.classList.add('neo-arena-active');
  match.dataset.arenaMode='broadcast';
  const toolbar=make('header','neo-arena-toolbar',
   '<div class="neo-arena-identity"><span class="neo-arena-live-dot"></span><div><b>EGO <em>ARENA</em> <span>3.0</span></b><small id="neoArenaSeason">CENTRAL DE PARTIDAS · AO VIVO</small></div></div>'+
   '<div class="neo-arena-view-tabs" role="group" aria-label="Modo de visualização">'+
   '<button type="button" data-arena-view="broadcast" class="active" aria-pressed="true">📺 Transmissão</button>'+
   '<button type="button" data-arena-view="coach" aria-pressed="false">🧠 Técnico</button>'+
   '<button type="button" data-arena-view="analysis" aria-pressed="false">📊 Análise</button></div>'+
   '<button type="button" class="neo-arena-gear" id="neoArenaOptions" aria-expanded="false">⚙ Ajustes</button>',match,'prepend');
  const preflight=make('details','neo-arena-preflight','<summary>⚡ Pré-jogo · escalações e estratégias</summary>',card);
  const scoreboard=card.querySelector('.broadcast-scoreboard');
  if(scoreboard)card.insertBefore(preflight,scoreboard);
  move(card.querySelector('#matchPreview'),preflight);

  const info=make('section','neo-arena-insights',
   '<div class="neo-arena-insights-head"><div><small>PARTIDA EM TEMPO REAL</small><strong id="neoArenaPanelTitle">🎙️ Narração ao vivo</strong></div><span class="neo-arena-onair">● LIVE</span></div>',aside,'prepend');
  move(main.querySelector('.under-pitch'),info);
  move(aside.querySelector('.coach-card'),info);
  move(main.querySelector('.shot-map-card'),info);
  move(card.querySelector('.pulse-card'),info);

  // Important secondary controls are never deleted, only folded away.
  const sideExtras=make('details','neo-arena-side-extras','<summary>⚙ Táticas, habilidades e configurações avançadas</summary>',aside);
  for(const panel of [...aside.children]){
   if(panel===info||panel===sideExtras)continue;
   move(panel,sideExtras);
  }

  const settings=make('details','neo-arena-settings','<summary>⚙ Opções do campo</summary>',controls);
  const settingGrid=make('div','neo-arena-setting-grid','',settings);
  for(const option of [...controls.children]){
   if(option===settings||option.matches('#play,#reset,#replay,.speed-group,#focusMode'))continue;
   move(option,settingGrid);
  }

  // Replays and secondary analytics are accessible without filling the first
  // screen with independent rectangles and huge canvases.
  const more=make('details','neo-arena-deep-dive',
   '<summary>🎬 Replays, lances especiais e dados avançados <span>EXPANDIR ANÁLISE</span></summary>',main);
  for(const selector of [
   '.action-theater','.replay-director','#egoLive','#liveArsenalBox','#mastersLive',
   '#runFeed','.modern-tactics-live','.goal-shortcut','#matchBanner',
   '.live-duel','.moments-card','.setpiece-card'
  ])move(main.querySelector(selector),more);

  function setMode(mode){
   if(!['broadcast','coach','analysis'].includes(mode))return;
   match.dataset.arenaMode=mode;
   toolbar.querySelectorAll('[data-arena-view]').forEach(button=>{
    const active=button.dataset.arenaView===mode;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
   });
   const titles={broadcast:'🎙️ Narração ao vivo',coach:'🧠 Banco & técnico',analysis:'📊 Análise da partida'};
   const title=document.getElementById('neoArenaPanelTitle');if(title)title.textContent=titles[mode];
  }
  toolbar.querySelectorAll('[data-arena-view]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.arenaView)));
  const gear=toolbar.querySelector('#neoArenaOptions');
  gear.addEventListener('click',()=>{
   settings.open=!settings.open;
   gear.setAttribute('aria-expanded',String(settings.open));
   if(settings.open)settings.querySelector('summary')?.focus();
  });
  settings.querySelector('summary')?.setAttribute('tabindex','0');
  card.querySelector('#prepare')?.addEventListener('click',()=>{preflight.open=true;});
  const seasonLabel=toolbar.querySelector('#neoArenaSeason');
  const refreshSeason=()=>{
   const round=document.getElementById('round')?.textContent?.trim();
   seasonLabel.textContent=round?'LIGA NEO EGOÍSTA · '+round:'CENTRAL DE PARTIDAS · AO VIVO';
  };
  refreshSeason();const timer=window.setInterval(refreshSeason,3000);
  mounted={match,moves,created,timer};
 }
 function unmount(){
  if(!mounted)return;
  const {match,moves,created,timer}=mounted;
  window.clearInterval(timer);
  for(const {node,marker} of moves.reverse())marker.replaceWith(node);
  for(const node of created.reverse())node.remove();
  document.body.classList.remove('neo-arena-active');
  delete match.dataset.arenaMode;
  mounted=null;
 }
 const refresh=()=>mq.matches?mount():unmount();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
 if(typeof mq.addEventListener==='function')mq.addEventListener('change',refresh);
 else mq.addListener?.(refresh);
 window.NeoArena300={refresh,unmount,get mode(){return mounted?.match.dataset.arenaMode||null}};
})();
