/* Blue Lock NEO — mobile competition + market access.
   Read-only presentation; uses the current season and original game actions.
   No changes to saves, finances, results or portrait storage. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const engine=()=>window.NeoEngine;
 const season=()=>window.NeoCareerBridge?.getSeason?.()||null;
 const club=id=>engine()?.teamById?.(id)||engine()?.allTeams?.().find(x=>x.id===id)||null;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cash=n=>{const value=Math.max(0,Number(n)||0);return value>=1000000?'¥ '+(value/1000000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi':'¥ '+Math.round(value).toLocaleString('pt-BR');};
 const mobile=()=>window.matchMedia('(max-width:700px)').matches;
 const LOGOS={bm:'bm.webp',ba:'ba.webp',mc:'mc.webp',px:'px.webp',ub:'ub.webp'};
 const pic=(t,cls='neo-ux-logo')=>t&&LOGOS[t.id]?'<img class="'+esc(cls)+'" alt="Escudo '+esc(t.name)+'" src="./assets/team-logos/'+LOGOS[t.id]+'">':'<span class="neo-ux-logo-alt">'+esc(t?.short||'?')+'</span>';
 const img=name=>{
  const key=encodeURIComponent(name);
  const old=Array.from(document.querySelectorAll('img[data-portrait="1"]')).find(x=>x.dataset.playerName===key);
  const base=old?.getAttribute('src')||'./assets/imported-portraits/'+String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.jpg';
  return '<img class="neo-ux-player-img" alt="'+esc(name)+'" src="'+esc(base)+'" loading="lazy">';
 };
 function market(){
  try{
   const rows=window.NeoMarket96?.market?.(season())||
    window.NeoPlayerData96?.roster?.(engine(),season(),{scope:'league'})||[];
   return Array.isArray(rows)?rows.slice().sort((a,b)=>(Number(b.value)||0)-(Number(a.value)||0)||String(a.name||'').localeCompare(String(b.name||''),'pt-BR')):[];
  }catch(error){console.warn('Mercado indisponível:',error);return [];}
 }
 function games(){return (season()?.rounds||[]).flatMap(r=>(r.games||[]).map(g=>({...g,round:r.round})))}
 function pending(){return (season()?.rounds||[]).find(r=>r.games?.some(g=>!Array.isArray(g.result)))||null}
 function standings(){try{return engine()?.standings?.(season())||[]}catch(error){return []}}
 function template(title,linkLabel,linkAction){
  return '<header class="neo-ux-heading"><h2>'+title+'</h2><button type="button" data-neo-ux-back="1">✕ Fechar</button></header>'+
   '<div class="neo-ux-tools"><button type="button" data-neo-ux-open="championship">🏆 Campeonatos</button><button type="button" data-neo-ux-open="market">💴 Mercado</button></div>';
 }
 let active=null,limit=30,filter='all',lastToken='',root=null,returnBar=null;
 const position=p=>{
  const raw=String(p.role||'').toUpperCase();
  const pos=window.NeoMarket96?.position?.(raw);
  if(pos)return pos;
  if(/GOL|GK/.test(raw))return 'GK';
  if(/ZAG|CB/.test(raw))return 'CB';
  if(/LE|LD|LB|RB|ALA/.test(raw))return 'FB';
  if(/VOL|CDM/.test(raw))return 'DM';
  if(/MC|CM/.test(raw))return 'CM';
  if(/MEI|CAM|MAT/.test(raw))return 'AM';
  if(/PE|PD|LW|RW/.test(raw))return 'W';
  if(/CA|SA|ST|CF/.test(raw))return 'ST';
  return 'CM';
 };
 function championship(){
  const s=season(),r=pending(),played=games().filter(g=>Array.isArray(g.result)),all=games(),table=standings();
  let out=template('🏆 Campeonatos');
  out+='<div class="neo-ux-hero"><small>LIGA NEO EGOÍSTA · TEMPORADA '+esc(s?.number||1)+'</small><h3>'+(r?'Rodada '+esc(r.round):'Temporada concluída')+'</h3><p>'+played.length+' de '+all.length+' jogos registrados</p><button class="neo-ux-primary" data-neo-ux-original="league">⚙ Abrir controles completos da liga</button></div>';
  out+='<h3 class="neo-ux-title">⚽ Jogos da rodada</h3><div class="neo-ux-fixtures">';
  if(r?.games?.length){
   out+=r.games.map((g,index)=>{
    const home=club(g.home),away=club(g.away),done=Array.isArray(g.result);
    return '<article class="neo-ux-fixture"><div class="neo-ux-versus"><span>'+pic(home)+'<strong>'+esc(home?.short||g.home)+'</strong></span><b>'+(done?esc(g.result.join(' × ')):'VS')+'</b><span>'+pic(away)+'<strong>'+esc(away?.short||g.away)+'</strong></span></div>'+
     (done?'<small>Resultado já registrado</small>':'<button class="neo-ux-primary" data-neo-ux-watch="'+index+'">▶ Assistir esta partida</button>')+'</article>';
   }).join('');
  }else out+='<p class="neo-ux-empty">Não existem jogos pendentes nesta temporada.</p>';
  out+='</div>';
  out+='<h3 class="neo-ux-title">▥ Classificação</h3><div class="neo-ux-table-wrap"><table class="neo-ux-table"><thead><tr><th>#</th><th>Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Pts</th></tr></thead><tbody>';
  out+=table.map((r,i)=>'<tr><td>'+esc(i+1)+'</td><td><span class="neo-ux-table-club">'+pic(r.team,'neo-ux-mini-logo')+esc(r.team?.short||r.team?.name)+'</span></td><td>'+esc(r.J)+'</td><td>'+esc(r.V)+'</td><td>'+esc(r.E)+'</td><td>'+esc(r.D)+'</td><td>'+esc(r.SG)+'</td><td><b>'+esc(r.PTS)+'</b></td></tr>').join('')||'<tr><td colspan="8">Classificação ainda indisponível</td></tr>';
  out+='</tbody></table></div>';
  out+='<h3 class="neo-ux-title">▰ Últimos resultados</h3><div class="neo-ux-recent">';
  out+=played.length?played.slice(-5).reverse().map(g=>'<div><small>R'+esc(g.round)+'</small><span>'+esc(club(g.home)?.short||g.home)+'</span><strong>'+esc(g.result[0])+' × '+esc(g.result[1])+'</strong><span>'+esc(club(g.away)?.short||g.away)+'</span></div>').join(''):'<p class="neo-ux-empty">Os resultados aparecerão aqui após os jogos oficiais.</p>';
  out+='</div>';
  let cups=[];try{cups=window.NeoTournament1030?.safeLoad?.(localStorage)||[]}catch(_){}
  out+='<h3 class="neo-ux-title">🏆 Copas e outros torneios</h3><div class="neo-ux-panel">';
  out+=cups.length?cups.map(c=>'<div class="neo-ux-cup"><b>'+esc(c.name||'Copa')+'</b><small>'+(c.champion?'🏆 '+esc(club(c.champion)?.short||c.champion):'Em disputa')+'</small></div>').join(''):'<p class="neo-ux-empty">Nenhuma copa foi criada neste save.</p>';
  out+='<button class="neo-ux-primary" data-neo-ux-original="more">Gerenciar copas e torneios →</button></div>';
  return out;
 }
 function marketHtml(){
  const rows=market(),categories=[['all','Todos'],['GK','Goleiros'],['CB','Zagueiros'],['FB','Laterais'],['DM','Volantes'],['CM','Meias'],['AM','Armadores'],['W','Pontas'],['ST','Atacantes'],['MASTER','Mestres']];
  const filtered=rows.filter(p=>filter==='all'||(filter==='MASTER'?p.isMaster:position(p)===filter));
  let out=template('💴 Mercado Neo');
  out+='<div class="neo-ux-hero"><small>OFERTAS E VALORES EM IENES (¥)</small><h3>'+rows.length+' atletas na avaliação</h3><p>Valores estimados pelo desempenho, atributos e evolução. São ofertas de mercado, não o saldo de uma carteira.</p><div class="neo-ux-leading"><span>Maior avaliação</span><strong>'+(rows[0]?esc(cash(rows[0].value)):'—')+'</strong></div></div>';
  out+='<div class="neo-ux-filter">'+categories.map(([id,label])=>'<button data-neo-ux-filter="'+id+'" '+(filter===id?'class="active"':'')+'>'+label+'</button>').join('')+'</div>';
  out+='<div class="neo-ux-money-list">'+filtered.slice(0,limit).map((p,i)=>'<button class="neo-ux-money-row" data-neo-ux-profile="'+encodeURIComponent(p.name+'|'+p.club)+'"><span class="neo-ux-index">'+(i+1)+'</span>'+img(p.name)+'<span class="neo-ux-info"><b>'+esc(p.name)+'</b><small>'+esc(club(p.club)?.short||p.club)+' · '+esc(p.role)+' · '+esc(p.ovr)+' OVR</small></span><strong>'+esc(cash(p.value))+'</strong></button>').join('')+'</div>';
  if(filtered.length>limit)out+='<button class="neo-ux-primary neo-ux-more" data-neo-ux-more="1">Mostrar mais '+esc(filtered.length-limit)+' jogadores</button>';
  if(!filtered.length)out+='<p class="neo-ux-empty">Ainda não há valores disponíveis para este filtro.</p>';
  out+='<div class="neo-ux-panel"><h3>🔄 Negociações e contratos</h3><p>O Mercado Neo original e os históricos de transferências continuam disponíveis no menu avançado.</p><button class="neo-ux-primary" data-neo-ux-original="more">Abrir negociações e contratos →</button><button class="neo-ux-secondary" data-neo-ux-original="ranking">Ver ranking de mercado completo →</button></div>';
  return out;
 }
 function show(view){
  if(!mobile()||!root)return;
  active=view;
  root.innerHTML=view==='market'?marketHtml():championship();
  document.body.classList.add('neo-ux-open');
  lastToken=token();
  for(const el of root.querySelectorAll('.neo-ux-player-img'))el.addEventListener('error',()=>{if(el.dataset.failed)return;el.dataset.failed='1';el.style.opacity='.25';});
  window.scrollTo({top:0,behavior:'instant'});
 }
 function close(){active=null;document.body.classList.remove('neo-ux-open');root.innerHTML='';}
 function original(tab){
  close();
  window.NeoReferenceMobile?.go?.(tab);
  window.scrollTo({top:0,behavior:'instant'});
 }
 function watch(index){
  const r=pending(),f=r?.games?.[index];
  if(!f||Array.isArray(f.result)){show('championship');return;}
  original('league');
  const target=$('fixtures')?.querySelector('button[data-watch="'+index+'"]');
  if(!target){show('championship');return;}
  target.click();
  original('match');
 }
 function token(){
  const s=season();
  return String(s?.number||'')+'|'+String(games().filter(x=>Array.isArray(x.result)).length)+'|'+Object.values(s?.scorers||{}).reduce((a,b)=>a+(Number(b)||0),0)+'|'+String(s?.career?.neoWorld?.market?.moves?.length||0)+'|'+String(!!window.NeoMarket96);
 }
 function augment(){
  const areas=[
   {id:'neoRefHome',marker:'neo-ux-home-links',selector:'.neo-ref-hero',place:'afterend',html:'<div class="neo-ux-shortcuts" id="neo-ux-home-links"><button data-neo-ux-open="championship">🏆 <b>Campeonatos</b><small>Rodadas e jogos</small></button><button data-neo-ux-open="market">💴 <b>Mercado Neo</b><small>Dinheiro e ofertas</small></button></div>'},
   {id:'neoRefRanking',marker:'neo-ux-ranking-link',selector:'.neo-ref-filter-row',place:'afterend',html:'<div class="neo-ux-compact-link" id="neo-ux-ranking-link"><button data-neo-ux-open="market">💴 Ver ranking de valores e ofertas →</button></div>'},
   {id:'neoRefPlayers',marker:'neo-ux-player-link',selector:'.neo-ref-filter-row',place:'afterend',html:'<div class="neo-ux-compact-link" id="neo-ux-player-link"><button data-neo-ux-open="market">💴 Consultar o dinheiro dos jogadores →</button></div>'},
   {id:'neoRefMenu',marker:'neo-ux-menu-link',selector:'.neo-ref-menu-item[data-ref-go="league"]',place:'afterend',html:'<button class="neo-ref-menu-item" id="neo-ux-menu-link" data-neo-ux-open="market"><span>💴</span><span><b>Mercado e dinheiro</b><small>Ofertas, valores, negociações e contratos</small></span><span>›</span></button>'}
  ];
  for(const a of areas){
   const parent=$(a.id),origin=parent?.querySelector(a.selector);
   if(origin&&!parent.querySelector('#'+a.marker))origin.insertAdjacentHTML(a.place,a.html);
  }
 }
 function boot(){
  if(!$('neoMobileNav')||!window.NeoReferenceMobile||$('neoRefUxHub'))return;
  root=document.createElement('section');root.id='neoRefUxHub';root.setAttribute('aria-label','Central de Campeonatos e Mercado');root.className='neo-ux-hub';
  document.querySelector('.shell')?.appendChild(root);
  returnBar=document.createElement('button');returnBar.type='button';returnBar.id='neoUxReturn';returnBar.className='neo-ux-return';returnBar.textContent='‹ Voltar às telas do Blue Lock NEO';
  document.querySelector('.shell')?.insertBefore(returnBar,document.querySelector('.shell>.tab-content'));
  returnBar.addEventListener('click',()=>{if(document.querySelector('.shell>.nav button[data-tab="league"].active'))show('championship');else original('menu')});
  // Capture shortcuts before the old global document handler navigates to the legacy huge page.
  document.addEventListener('click',event=>{
   const b=event.target.closest('button');
   if(!b)return;
   const open=b.dataset.neoUxOpen;
   if(open||b.dataset.refGo==='league'){
    event.preventDefault();event.stopImmediatePropagation();show(open||'championship');return;
   }
   if(b.dataset.neoUxBack){
    event.preventDefault();event.stopImmediatePropagation();const previous=active;close();window.NeoReferenceMobile.go(previous==='market'?'ranking':'home');return;
   }
   if(b.dataset.neoUxOriginal){
    event.preventDefault();event.stopImmediatePropagation();original(b.dataset.neoUxOriginal);return;
   }
   if(b.dataset.neoUxWatch!==undefined){
    event.preventDefault();event.stopImmediatePropagation();watch(Number(b.dataset.neoUxWatch));return;
   }
   if(b.dataset.neoUxFilter){
    event.preventDefault();event.stopImmediatePropagation();filter=b.dataset.neoUxFilter;limit=30;show('market');return;
   }
   if(b.dataset.neoUxMore){
    event.preventDefault();event.stopImmediatePropagation();limit+=30;show('market');return;
   }
   if(b.dataset.neoUxProfile){
    event.preventDefault();event.stopImmediatePropagation();
    const key=decodeURIComponent(b.dataset.neoUxProfile),at=key.lastIndexOf('|');
    if(at>=0)window.NeoMarket96?.openProfile?.(key.slice(0,at),key.slice(at+1));
    return;
   }
   if(b.closest('#neoMobileNav')||b.closest('.shell>.nav')){
    if(active)close();
   }
   // For mobile player cards use the existing complete profile, including market value.
   if(b.dataset.refPlayer&&window.NeoMarket96?.openProfile){
    event.preventDefault();event.stopImmediatePropagation();window.NeoMarket96.openProfile(b.dataset.refPlayer,b.dataset.refClub||'');return;
   }
  },true);
  const containers=['neoRefHome','neoRefRanking','neoRefPlayers','neoRefMenu'].map($).filter(Boolean);
  for(const element of containers)new MutationObserver(augment).observe(element,{childList:true});
  augment();
  const refresh=()=>{
   if(!mobile())return;
   augment();
   const current=token();
   if(active&&current!==lastToken)show(active);
  };
  setInterval(refresh,3800);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)show(active)});
  window.NeoMobileHub={show,close,market,championship};
 }
 function ready(){
  if(!window.NeoReferenceMobile){setTimeout(ready,90);return;}
  boot();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
