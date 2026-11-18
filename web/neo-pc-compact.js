/* EGO ARENA 3.1 — desktop match cockpit and championship hub. Original controls
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
   '<div class="neo-arena-identity"><span class="neo-arena-live-dot"></span><div><b>EGO <em>ARENA</em> <span>3.1</span></b><small id="neoArenaSeason">CENTRAL DE PARTIDAS · AO VIVO</small></div></div>'+
   '<div class="neo-arena-view-tabs" role="group" aria-label="Modo de visualização">'+
   '<button type="button" data-arena-view="broadcast" class="active" aria-pressed="true">📺 Transmissão</button>'+
   '<button type="button" data-arena-view="coach" aria-pressed="false">🧠 Técnico</button>'+
   '<button type="button" data-arena-view="analysis" aria-pressed="false">📊 Análise</button></div>'+
   '<details class="neo-arena-shortcuts"><summary>⌨ Atalhos</summary><div><b>ATALHOS DO PC</b><span><kbd>Espaço</kbd> Iniciar / pausar</span><span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> Modos de visualização</span><span><kbd>S</kbd> Alternar velocidade</span><span><kbd>F</kbd> Modo foco</span></div></details>'+
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
  const tacticPanel=[...aside.querySelectorAll('.fc-options')].find(panel=>panel.querySelector('.fc-tactics'));
  const gameplanPanel=[...aside.querySelectorAll('.card')].find(panel=>panel.querySelector('#homeTactic'));
  move(tacticPanel,info);
  move(gameplanPanel,info);

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
  // Starting a match is always a first-screen action, on a notebook as well.
  move(controls,card);
  card.insertBefore(controls,stadium);

  // Replays and secondary analytics are accessible without filling the first
  // screen with independent rectangles and huge canvases.
  const more=make('details','neo-arena-deep-dive',
   '<summary>🎬 Replays, lances especiais e dados avançados <span>EXPANDIR ANÁLISE</span></summary>',main);
  for(const selector of [
   '.action-theater','.replay-director','#egoLive','#liveArsenalBox','#mastersLive',
   '#runFeed','.modern-tactics-live','.goal-shortcut','#matchBanner',
   '.live-duel','.moments-card','.setpiece-card'
  ])move(main.querySelector(selector),more);

  // The legacy broadcast/analysis modules are loaded asynchronously. They
  // inject big panels BEFORE the stadium after our initial DOMContentLoaded;
  // route those real panels away from the first screen as soon as they arrive.
  function relocateLatePanels(){
   const layout=match.querySelector(':scope > .match-layout');
   // Besides broadcast and X-ray, older editions prepend a duplicate
   // scoreboard, shortcuts, AI notices and extra toggles. No card is allowed
   // to sit between the cockpit toolbar and the actual match layout on PC.
   for(const node of [...match.children]){
    if(node===toolbar||node===layout||node.id==='neoMatchAlert')continue;
    move(node,node.id==='neo1000-pulse'?info:node.id==='neo1010-control'?settingGrid:more);
   }
   const pulse=match.querySelector('#neo1000-pulse');
   if(pulse&&!info.contains(pulse)){
    // The module may have inserted itself after the relocated broadcast panel
    // inside our temporary details. Give it a stable original home for undo.
    if(more.contains(pulse))match.insertBefore(pulse,match.querySelector('.match-layout'));
    move(pulse,info);
   }
  }
  relocateLatePanels();
  const observer=new MutationObserver(records=>{
   if(records.some(record=>[...record.addedNodes].some(node=>
    node.nodeType===1&&(record.target===match||node.id==='neo1000-pulse'))))relocateLatePanels();
  });
  observer.observe(match,{childList:true});
  observer.observe(more,{childList:true});

  // The league previously opened with several tall analytical panels before
  // the fixtures. Keep the actual round actions and standings in front, with
  // a single clear entry point for Best XI and next-season configuration.
  const league=document.getElementById('league');
  let leagueObserver=null;
  let refreshLeague=()=>{};
  if(league){
   const leagueBar=make('section','neo-arena-league-bar',
    '<div class="neo-arena-league-bar-copy"><small>CAMPEONATO · CENTRAL DA TEMPORADA</small><strong id="neoArenaLeagueRound">RODADA 1</strong><span>Resultados e tabela sempre à mão</span></div>'+
    '<div class="neo-arena-league-bar-actions"><button type="button" id="neoArenaLeagueXI">⭐ Time da rodada</button><button type="button" id="neoArenaLeagueFixtures">📅 Jogos</button></div>',league,'prepend');
   const actions=leagueBar.querySelector('.neo-arena-league-bar-actions');
   move(league.querySelector('#simulateRound'),actions);
   move(league.querySelector('#simulateSeason'),actions);
   const xi=make('details','neo-arena-league-fold neo-arena-league-xi',
    '<summary>⭐ Time do Campeonato <span>VER SELEÇÃO E ESCALAÇÃO</span></summary>',league);
   const config=make('details','neo-arena-league-fold neo-arena-league-config',
    '<summary>⚙ Clubes e formato da próxima temporada <span>EDITAR PARTICIPANTES</span></summary>',league);
   const awards=make('details','neo-arena-league-fold neo-arena-league-awards',
    '<summary>🏅 Prêmios do Campeonato <span>VER CONQUISTAS</span></summary>',league);
   const hero=league.querySelector('.hero-card');
   if(hero)hero.after(xi,config,awards);
   move(league.querySelector('.neo-league-customize'),config);
   const relocateLeague=()=>{
    const xiPanel=[...league.children].find(node=>node.id==='neo990-round-team');
    const awardsPanel=[...league.children].find(node=>node.id==='neo1000-awards');
    move(xiPanel,xi);move(awardsPanel,awards);
   };
   relocateLeague();
   leagueObserver=new MutationObserver(records=>{
    if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&
     (node.id==='neo990-round-team'||node.id==='neo1000-awards'))))relocateLeague();
   });
   leagueObserver.observe(league,{childList:true});
   leagueBar.querySelector('#neoArenaLeagueXI').addEventListener('click',()=>{
    xi.open=true;xi.scrollIntoView({behavior:'smooth',block:'start'});
   });
   leagueBar.querySelector('#neoArenaLeagueFixtures').addEventListener('click',()=>{
    league.querySelector('#fixtures')?.closest('.card')?.scrollIntoView({behavior:'smooth',block:'start'});
   });
   refreshLeague=()=>{const round=document.getElementById('round')?.textContent?.trim();
    leagueBar.querySelector('#neoArenaLeagueRound').textContent=round||'LIGA NEO EGOÍSTA';};
   refreshLeague();
  }

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
   refreshLeague();
  };
  refreshSeason();const timer=window.setInterval(refreshSeason,3000);
  function onKey(event){
   if(match.classList.contains('hidden')||event.repeat||event.altKey||event.ctrlKey||event.metaKey||
    /^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A)$/.test(event.target?.tagName||'')||event.target?.isContentEditable||
    document.querySelector('#playerModal:not(.hidden),#neo960-profile-modal:not([hidden])'))return;
   if(event.code==='Escape'){
    settings.open=false;gear.setAttribute('aria-expanded','false');
    toolbar.querySelector('.neo-arena-shortcuts')?.removeAttribute('open');return;
   }
   const modes={Digit1:'broadcast',Digit2:'coach',Digit3:'analysis'};
   if(modes[event.code]){setMode(modes[event.code]);return;}
   if(event.code==='Space'){event.preventDefault();controls.querySelector('#play')?.click();}
   if(event.code==='KeyF')controls.querySelector('#focusMode')?.click();
   if(event.code==='KeyS'){
    const speed=document.getElementById('speed');if(!speed)return;
    speed.selectedIndex=(speed.selectedIndex+1)%speed.options.length;
    speed.dispatchEvent(new Event('change',{bubbles:true}));
   }
  }
  document.addEventListener('keydown',onKey);
  mounted={match,moves,created,timer,observer,leagueObserver,onKey};
 }
 function unmount(){
  if(!mounted)return;
  const {match,moves,created,timer,observer,leagueObserver,onKey}=mounted;
  window.clearInterval(timer);
  observer.disconnect();
  leagueObserver?.disconnect();
  document.removeEventListener('keydown',onKey);
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
