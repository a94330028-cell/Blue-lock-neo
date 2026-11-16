/* Blue Lock NEO — 5-screen mobile interface based on the supplied references.
   Additive: real game engine, original tabs and stored saves remain untouched. */
(function(){
 'use strict';
 if(!window.matchMedia||!document.querySelector('.shell'))return;
 const $=id=>document.getElementById(id);
 const mm=window.matchMedia('(max-width:700px)');
 const E=window.NeoEngine||{};
 const PAGE_IDS=['home','match','players','ranking','menu'];
 const LABELS=[['⌂','Início'],['⚽','Partidas'],['♙','Jogadores'],['🏆','Ranking'],['☰','Menu']];
 const aliases={home:'league',match:'match',players:'squads',ranking:'ranking',menu:'more'};
 const screens={};
 const objectUrls=[];
 let page='home',rankingMode='goals',role='Todos',search='',visibleCount=36,dialog=null;
 let lastSeasonToken='',lastMatchToken='',inNavigation=false;
 const safe=v=>String(v===null||v===undefined?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const short=n=>String(n||'').split(' ').slice(-1)[0]||'Jogador';
 const slug=n=>String(n||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const teams=()=>typeof E.allTeams==='function'?E.allTeams():(E.TEAMS||[]);
 const season=()=>window.NeoCareerBridge&&typeof window.NeoCareerBridge.getSeason==='function'?window.NeoCareerBridge.getSeason():null;
 const currentMatch=()=>window.NeoMatchBridge&&typeof window.NeoMatchBridge.getMatch==='function'?window.NeoMatchBridge.getMatch():null;
 const club=id=>teams().find(t=>t.id===id)||null;
 const allGames=()=>{const s=season();return Array.isArray(s?.rounds)?s.rounds.flatMap((r)=>r.games.map((g)=>Object.assign({round:r.round},g))):[];};
 const pKey=(n,t)=>String(n||'')+'|'+String(t?.id||t||'');
 const portraits=new Map();
 function placeholder(name){
  const initials=String(name||'?').split(/\s+/).map(x=>x[0]||'').slice(0,2).join('').toUpperCase();
  return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360"><rect width="300" height="360" fill="#0b2b51"/><path d="M0 340L300 50M0 280L300 0" stroke="#1688de" stroke-width="15" opacity=".17"/><circle cx="150" cy="123" r="63" fill="#296197"/><path d="M24 360Q30 215 150 218Q270 215 276 360" fill="#296197"/><text x="150" y="333" font-family="Arial" font-size="31" font-weight="bold" text-anchor="middle" fill="#d8f5ff">'+initials+'</text></svg>');
 }
 function imgUrl(name){
  if(portraits.has(name))return portraits.get(name);
  const original=Array.from(document.querySelectorAll('img[data-portrait="1"]')).find(x=>!x.closest('.neo-ref-screen')&&x.dataset.playerName&&decodeURIComponent(x.dataset.playerName)===name);
  if(original&&original.getAttribute('src')&&!original.getAttribute('src').includes('placeholder'))return original.src;
  return './assets/imported-portraits/'+slug(name)+'.jpg';
 }
 function img(name,cls=''){
  return '<img class="'+safe(cls)+'" data-ref-img="'+safe(name)+'" src="'+safe(imgUrl(name))+'" alt="Retrato de '+safe(name)+'" loading="lazy" decoding="async">';
 }
 function repairImages(node){
  (node||document).querySelectorAll('img[data-ref-img]').forEach(el=>{
   if(el.dataset.refBound)return;
   el.dataset.refBound='1';
   el.addEventListener('error',()=>{if(el.dataset.fallbackDone)return;el.dataset.fallbackDone='1';el.src=placeholder(el.dataset.refImg);});
  });
 }
 function updatePortraits(){
  for(const el of document.querySelectorAll('img[data-ref-img]')){
   if(portraits.has(el.dataset.refImg)&&el.src!==portraits.get(el.dataset.refImg)){el.dataset.fallbackDone='';el.src=portraits.get(el.dataset.refImg);}
  }
 }
 function loadStoredPortraits(){
  try{
   for(const [storageKey,type] of [['neo-custom-portraits-v36','custom'],['neo-manga-portraits-v602','manga']]){
    const values=JSON.parse(localStorage.getItem(storageKey)||'{}');
    const styles=JSON.parse(localStorage.getItem('neo-portrait-style-v37')||'{}');
    for(const [name,url] of Object.entries(values)){
     if(typeof url==='string'&&(url.startsWith('data:image/')||url.startsWith('blob:'))&&(!styles[name]||styles[name]===type)){portraits.set(name,url);}
    }
   }
  }catch(_){}
  if(!window.indexedDB)return;
  try{
   const request=indexedDB.open('neo-portrait-library-v1');
   request.onsuccess=()=>{
    const db=request.result;
    if(!db.objectStoreNames.contains('images')){db.close();return;}
    const tx=db.transaction('images','readonly');
    const data=tx.objectStore('images').getAll();
    data.onsuccess=()=>{
     let styles={};try{styles=JSON.parse(localStorage.getItem('neo-portrait-style-v37')||'{}');}catch(_){}
     for(const row of data.result||[]){
      if(!row?.name||!(row.blob instanceof Blob))continue;
      if(styles[row.name]&&styles[row.name]!==row.type&&styles[row.name]!=='premium')continue;
      const url=URL.createObjectURL(row.blob);objectUrls.push(url);portraits.set(row.name,url);
     }
     updatePortraits();
    };
    tx.oncomplete=()=>db.close();
   };
  }catch(_){}
 }
 function nativeTab(tab){
  const b=document.querySelector('.shell>.nav button[data-tab="'+tab+'"]')||document.querySelector('.nav button[data-tab="'+tab+'"]');
  if(b)b.click();
  return !!b;
 }
 function refreshNav(){
  const nav=$('neoMobileNav');if(!nav)return;
  nav.querySelectorAll('button[data-ref-page]').forEach(b=>{
   b.classList.toggle('active',b.dataset.refPage===page);
   if(b.dataset.refPage===page)b.setAttribute('aria-current','page');
   else b.removeAttribute('aria-current');
  });
 }
 function go(to){
  if(!mm.matches)return;
  inNavigation=true;
  const known=PAGE_IDS.includes(to);
  const nativeId=known?aliases[to]:to;
  if(nativeId)nativeTab(nativeId);
  page=known?to:'native';
  document.body.dataset.neoRefPage=page;
  if(known&&to!=='match')render(to);
  refreshNav();inNavigation=false;
  window.scrollTo({top:0,behavior:'instant'});
 }
 function navControl(){
  const old=$('neoMobileNav');if(!old)return false;
  old.innerHTML=PAGE_IDS.map((id,i)=>'<button type="button" data-ref-page="'+id+'" aria-label="'+LABELS[i][1]+'"><span aria-hidden="true">'+LABELS[i][0]+'</span><b>'+LABELS[i][1]+'</b></button>').join('');
  old.querySelectorAll('[data-ref-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.refPage)));
  return true;
 }
 function seasonScorers(kind){
  const src=season()?.[kind]||{};
  return Object.entries(src).map(([key,value])=>{
   const ix=key.lastIndexOf('|');return {name:ix>=0?key.slice(0,ix):key,id:ix>=0?key.slice(ix+1):'',value:Number(value)||0};
  }).filter(p=>p.value>0).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'pt-BR'));
 }
 function standings(){try{return typeof E.standings==='function'&&season()?E.standings(season()):[];}catch(_){return [];}}
 function roster(){
  const career=season()?.career?.players||{};
  const members=[];
  for(const team of teams()){
   if(!team||team.id==='neo-bestxi')continue;
   const list=[...(team.players||[]),...(team.reserves||[])];
   list.forEach((name,index)=>{
    if(!name)return;
    const data=career[pKey(name,team)]||{};
    let raw=(index<(team.players||[]).length?team.formation?.[index]?.role:'RES')||data.role||'JOG';
    const rawString=String(raw).toUpperCase();
    const roleName=/(GK|GOL)/.test(rawString)?'Goleiro':/(CB|LB|RB|DEF|ZAG|LD|LE)/.test(rawString)?'Defensor':/(CM|CAM|CDM|LM|RM|MEI|VOL)/.test(rawString)?'Meia':/(ST|CF|LW|RW|ATA|ATK|FW)/.test(rawString)?'Atacante':'Jogador';
    members.push({name,team,data,role:roleName,ovr:Number(data.ovr)||null});
   });
  }
  return members;
 }
 function topPlayer(name,id){
  return roster().find(p=>p.name===name&&(!id||p.team.id===id))||{name,team:club(id)||teams()[0]||{name:'—',id:'',short:'—'},data:{},role:'Jogador'};
 }
 function heading(title,to,label){
  return '<div class="neo-ref-heading"><h2>'+title+'</h2>'+(to?'<button class="neo-ref-link" data-ref-go="'+safe(to)+'">'+safe(label||'Ver todos')+' →</button>':'')+'</div>';
 }
 const logoFiles=Object.freeze({bm:'bm.webp',ba:'ba.webp',mc:'mc.webp',px:'px.webp',ub:'ub.webp'});
 function logo(t,cls='neo-ref-logo'){
  if(!t)return '';
  const filename=logoFiles[t.id];
  return filename?'<img class="'+safe(cls)+'" src="./assets/team-logos/'+filename+'" alt="Escudo '+safe(t.name)+'" loading="lazy" decoding="async">':'<span class="'+safe(cls)+' neo-ref-logo-fallback">'+safe((t.crest||t.short||t.name||'?').slice(0,3))+'</span>';
 }
 function teamView(t){
  if(!t)return '<span class="neo-ref-team"><span class="neo-ref-crest">?</span>—</span>';
  return '<span class="neo-ref-team">'+logo(t,'neo-ref-crest')+'<strong>'+safe(t.short||t.name)+'</strong></span>';
 }
 function homeHtml(){
  const s=season(),games=allGames(),next=games.find(g=>!g.result),recent=games.filter(g=>g.result).slice(-3).reverse(),table=standings(),top=seasonScorers('scorers').slice(0,3);
  const a=club(next?.home),b=club(next?.away);
  let h='<div class="neo-ref-hero"><div class="neo-ref-hero-top"><span class="neo-ref-ribbon">▦ PRÓXIMA PARTIDA</span><span class="neo-ref-muted">Liga BLUE LOCK NEO<br>Temporada '+safe(s?.number||1)+' · '+(next?'Rodada '+safe(next.round):'Sem jogo pendente')+'</span></div>';
  if(next){
   h+='<div class="neo-ref-versus">'+teamView(a)+'<span class="neo-ref-vs">VS</span>'+teamView(b)+'</div><div class="neo-ref-hero-bottom"><span class="neo-ref-chip">Rodada '+safe(next.round)+'</span><button class="neo-ref-primary" data-ref-go="league">Ver partida →</button></div>';
  }else h+='<p class="neo-ref-empty">Não há próxima partida registrada. Consulte a liga para começar uma temporada.</p>';
  h+='</div>';
  h+=heading('▰ Últimos Resultados','league','Ver todos')+'<div class="neo-ref-results">';
  if(recent.length)h+=recent.map(g=>{
   const home=club(g.home),away=club(g.away);
   return '<div class="neo-ref-result"><small>Rodada '+safe(g.round)+'</small><div class="neo-ref-result-score"><span class="neo-ref-result-club">'+logo(home,'neo-ref-result-logo')+'<strong>'+safe(home?.short||g.home)+'</strong></span><b>'+safe(g.result[0])+'–'+safe(g.result[1])+'</b><span class="neo-ref-result-club">'+logo(away,'neo-ref-result-logo')+'<strong>'+safe(away?.short||g.away)+'</strong></span></div></div>';
  }).join('');
  else h+='<div class="neo-ref-empty" style="grid-column:1/-1">Os resultados aparecerão após jogos oficiais.</div>';
  h+='</div><div class="neo-ref-two"><div class="neo-ref-panel"><h3>▥ Classificação</h3><table class="neo-ref-table"><thead><tr><th>#</th><th>Equipe</th><th>J</th><th>Pts</th></tr></thead><tbody>';
  h+=table.length?table.slice(0,4).map((r,i)=>'<tr><td>'+(i+1)+'</td><td><span class="neo-ref-table-team">'+logo(r.team,'neo-ref-table-logo')+safe(r.team?.short||r.team?.name)+'</span></td><td>'+safe(r.J)+'</td><td>'+safe(r.PTS)+'</td></tr>').join(''):'<tr><td colspan="4">Sem classificação</td></tr>';
  h+='</tbody></table></div><div class="neo-ref-panel"><h3>▣ Destaques</h3>';
  const first=top[0];if(first){h+='<div class="neo-ref-feature">'+img(first.name)+'<div><strong>'+safe(short(first.name))+' lidera a artilharia</strong><small>'+safe(first.value)+' gols registrados na liga</small></div></div>';}
  else h+='<p class="neo-ref-empty">Nenhum artilheiro registrado ainda.</p>';
  h+='</div></div>';
  h+=heading('♧ Jogadores em Destaque','players','Ver jogadores')+'<div class="neo-ref-player-highlights">';
  h+=top.length?top.map(p=>'<button class="neo-ref-highlight" data-ref-player="'+safe(p.name)+'" data-ref-club="'+safe(p.id)+'">'+img(p.name)+'<b>'+safe(short(p.name))+'</b><small>⚽ '+safe(p.value)+' gols</small></button>').join(''):'<p class="neo-ref-empty" style="grid-column:1/-1">Jogadores em destaque serão exibidos após as partidas.</p>';
  return h+'</div>';
 }
 function featuredPlayer(p){
  const d=p.data||{};
  const goals=Number(season()?.scorers?.[pKey(p.name,p.team)]||d.goals||0);
  const assists=Number(season()?.assists?.[pKey(p.name,p.team)]||d.assists||0);
  return '<div class="neo-ref-featured">'+img(p.name)+'<div class="neo-ref-featured-detail"><h3>'+safe(p.name)+'</h3><p>'+safe(p.team?.name||'')+' · '+safe(p.role)+'</p><p>'+((p.ovr!==null&&p.ovr!==undefined)?'Rating '+safe(p.ovr):'Estatísticas registradas')+'</p><div class="neo-ref-statline"><span>⚽ '+goals+' gols</span><span>👟 '+assists+' assist.</span><span>🏟 '+safe(d.games??'—')+' jogos</span><span>⭐ '+safe(d.score??'—')+' pontos</span></div><button class="neo-ref-primary" data-ref-player="'+safe(p.name)+'" data-ref-club="'+safe(p.team.id)+'">Ver perfil →</button></div></div>';
 }
 function playersHtml(){
  let list=roster(),filtered=list.filter(p=>(role==='Todos'||p.role===role)&&(!search||[p.name,p.team?.name,p.team?.short].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(search.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())));
  filtered.sort((a,b)=>(b.ovr||0)-(a.ovr||0)||a.name.localeCompare(b.name,'pt-BR'));
  const featured=filtered[0];
  let h='<div class="neo-ref-screen-title"><span>♙ Jogadores</span><small style="font-size:11px">'+list.length+' atletas</small></div>';
  h+='<div class="neo-ref-search"><input id="neoRefPlayerSearch" value="'+safe(search)+'" placeholder="Buscar jogador ou time..." autocomplete="off" aria-label="Buscar jogador"></div>';
  h+='<div class="neo-ref-filter-row">'+['Todos','Atacante','Meia','Defensor','Goleiro'].map(x=>'<button data-ref-role="'+x+'" class="'+(role===x?'active':'')+'">'+x+(x==='Todos'?'':'s')+'</button>').join('')+'</div>';
  if(featured&&!search)h+=featuredPlayer(featured);
  h+='<div class="neo-ref-grid">';
  h+=filtered.slice(0,visibleCount).map(p=>'<button class="neo-ref-player-card" data-ref-player="'+safe(p.name)+'" data-ref-club="'+safe(p.team.id)+'">'+img(p.name)+'<b>'+safe(p.name)+'</b><small>'+safe(p.team.short||p.team.name)+' · '+safe(p.role)+'</small></button>').join('');
  h+='</div>';
  if(!filtered.length)h+='<p class="neo-ref-empty">Nenhum jogador corresponde à pesquisa.</p>';
  if(filtered.length>visibleCount)h+='<button class="neo-ref-primary" style="margin:12px auto;display:block" data-ref-more="1">Mostrar mais jogadores ('+safe(filtered.length-visibleCount)+' restantes)</button>';
  return h;
 }
 function rankingHtml(){
  let data=[],unit='';
  if(rankingMode==='goals'){data=seasonScorers('scorers');unit='gols';}
  else if(rankingMode==='assists'){data=seasonScorers('assists');unit='assistências';}
  else{
   let ranked=[];try{ranked=E.Progression&&typeof E.Progression.rank==='function'&&season()?E.Progression.rank(season(),'all'):[];}catch(_){}
   data=ranked.map(p=>({name:p.name,id:p.club,value:Number(p.score)||0})).filter(p=>p.value>0);
   data.sort((a,b)=>b.value-a.value);unit='pontos';
  }
  let h='<div class="neo-ref-screen-title">🏆 Ranking</div>';
  h+='<div class="neo-ref-filter-row">'+[['goals','⚽ Artilheiros'],['assists','👟 Assistências'],['performance','▥ Desempenho']].map(([id,label])=>'<button class="'+(rankingMode===id?'active':'')+'" data-ref-ranking="'+id+'">'+label+'</button>').join('')+'</div>';
  if(!data.length)return h+'<p class="neo-ref-empty">Ainda não existem dados para este ranking. Ele será preenchido com resultados reais do simulador.</p>';
  const podium=[data[1],data[0],data[2]];
  h+='<div class="neo-ref-podium">';
  h+=podium.map((p,i)=>{
   if(!p)return '<div></div>';
   const n=i===0?2:i===1?1:3;
   return '<button class="neo-ref-podium-card '+(n===1?'first':n===3?'third':'')+'" data-ref-player="'+safe(p.name)+'" data-ref-club="'+safe(p.id)+'"><span class="neo-ref-medal">'+n+'º'+(n===1?' 👑':'')+'</span>'+img(p.name)+'<b>'+safe(short(p.name))+'</b><small>'+safe(club(p.id)?.short||'')+'</small><strong>⚽ '+safe(p.value)+' '+unit+'</strong></button>';
  }).join('');
  h+='</div>';
  h+=data.slice(3,30).map((p,i)=>'<button class="neo-ref-ranked" data-ref-player="'+safe(p.name)+'" data-ref-club="'+safe(p.id)+'"><span class="rank-num">'+(i+4)+'º</span>'+img(p.name)+'<span class="rank-name"><b>'+safe(p.name)+'</b><small>'+safe(club(p.id)?.name||'')+'</small></span><strong>'+safe(p.value)+' '+unit+'</strong></button>').join('');
  return h;
 }
 function menuHtml(){
  const items=[['♧','Times','Veja os clubes e suas escalações','squads'],['🏆','Campeonatos','Acompanhe tabelas e partidas','league'],['▥','Recordes','Estatísticas e marcas históricas','records'],['✧','Habilidades','Armas e evolução dos atletas','arsenal'],['▧','Galeria','Retratos e fotos cadastradas','gallery'],['⚙','Configurações','Som, desempenho e preferências','more'],['ⓘ','Créditos','Equipe e informações do projeto','more']];
  let h='<div class="neo-ref-screen-title" style="display:block;text-align:center">Menu<small style="display:block;letter-spacing:3px;font-style:normal;font-weight:500;margin-top:5px">BLUE LOCK NEO</small></div>';
  h+=items.map(([ico,title,desc,to])=>'<button class="neo-ref-menu-item" data-ref-go="'+to+'"><span>'+ico+'</span><span><b>'+title+'</b><small>'+desc+'</small></span><span>›</span></button>').join('');
  h+=heading('▥ Preferências');
  const on=!!$('sound')?.checked;
  h+='<div class="neo-ref-panel"><button class="neo-ref-menu-item" data-ref-sound="1"><span>♫</span><span><b>Som do jogo</b><small>'+(!on?'Desativado':'Ativado')+' · toque para alterar</small></span><span>'+(on?'●':'○')+'</span></button><button class="neo-ref-menu-item" data-ref-go="more"><span>☼</span><span><b>Mais opções</b><small>Configurações originais e conta</small></span><span>›</span></button></div>';
  return h;
 }
 function render(name){
  const node=screens[name];if(!node)return;
  node.innerHTML=name==='home'?homeHtml():name==='players'?playersHtml():name==='ranking'?rankingHtml():name==='menu'?menuHtml():'';
  repairImages(node);
 }
 function openPlayer(name,id){
  if(!name)return;
  const p=topPlayer(name,id);
  const s=season();
  const data=p.data||{};
  const goals=Number(s?.scorers?.[pKey(name,p.team)]||data.goals||0),assists=Number(s?.assists?.[pKey(name,p.team)]||data.assists||0);
  dialog.innerHTML='<div class="neo-ref-dialog-content" role="dialog" aria-modal="true" aria-label="Perfil do jogador"><button class="neo-ref-link" data-ref-close="1">✕ Fechar</button>'+img(name)+'<h2>'+safe(name)+'</h2><p>'+safe(p.team.name)+' · '+safe(p.role)+'</p><div class="neo-ref-statline"><span>⚽ Gols: '+goals+'</span><span>👟 Assistências: '+assists+'</span><span>🏟 Jogos: '+safe(data.games??'—')+'</span><span>📊 Rating: '+safe(p.ovr??'—')+'</span><span>⭐ Pontos: '+safe(data.score??'—')+'</span><span>📈 Evolução: '+safe(Object.values(data.boosts||{}).reduce((a,b)=>a+(Number(b)||0),0))+'</span></div><p style="font-size:11px;color:#aac6e0">Estatísticas provenientes do save e da temporada atual. Dados não registrados são mostrados como —.</p><button class="neo-ref-primary" data-ref-close="1">Voltar</button></div>';
  dialog.hidden=false;document.body.style.overflow='hidden';repairImages(dialog);
  dialog.querySelector('[data-ref-close]')?.focus();
 }
 function closePlayer(){if(!dialog)return;dialog.hidden=true;dialog.innerHTML='';document.body.style.overflow='';}
 function setupMatch(){
  if($('neoRefMatchTabs'))return;
  const match=$('match');if(!match)return;
  const pitch=match.querySelector('.pitch-wrap')||$('pitch');
  if(!pitch)return;
  const tabs=document.createElement('div');tabs.id='neoRefMatchTabs';tabs.className='neo-ref-match-pills';
  tabs.innerHTML=[['events','Narração'],['matchStats','Estatísticas'],['neo980-squad-area','Escalações'],['squads','Jogadores']].map(([id,label],i)=>'<button type="button" data-ref-target="'+id+'" class="'+(!i?'active':'')+'">'+label+'</button>').join('');
  pitch.insertAdjacentElement('afterend',tabs);
  tabs.addEventListener('click',e=>{
   const btn=e.target.closest('[data-ref-target]');if(!btn)return;
   tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));
   const target=btn.dataset.refTarget;
   if(target==='squads')go('players');
   else{
    const node=$(target)||document.querySelector('#match .'+target);
    if(node)node.scrollIntoView({behavior:'smooth',block:'center'});
    else if(target==='neo980-squad-area')go('squads');
   }
  });
 }
 function handleNavEvent(e){
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.refGo){go(button.dataset.refGo);return;}
  if(button.dataset.refPlayer){openPlayer(button.dataset.refPlayer,button.dataset.refClub||'');return;}
  if(button.dataset.refClose){closePlayer();return;}
  if(button.dataset.refRole){role=button.dataset.refRole;visibleCount=36;render('players');return;}
  if(button.dataset.refRanking){rankingMode=button.dataset.refRanking;render('ranking');return;}
  if(button.dataset.refMore){visibleCount+=36;render('players');return;}
  if(button.dataset.refSound){const input=$('sound');if(input){input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));}render('menu');return;}
 }
 function setup(){
  if(document.body.classList.contains('neo-ref-mobile'))return;
  document.body.classList.add('neo-ref-mobile');
  const style=document.createElement('link');style.rel='stylesheet';style.href='./neo-reference-mobile.css?v=20261116a';style.id='neo-ref-css';document.head.appendChild(style);
  const shell=document.querySelector('.shell');
  for(const id of ['home','players','ranking','menu']){
   const section=document.createElement('section');section.id='neoRef'+id[0].toUpperCase()+id.slice(1);
   section.className='neo-ref-screen';section.setAttribute('aria-label',LABELS[PAGE_IDS.indexOf(id)]?.[1]||id);shell.appendChild(section);screens[id]=section;
  }
  dialog=document.createElement('div');dialog.id='neoRefPlayerDialog';dialog.hidden=true;document.body.appendChild(dialog);
  if(!navControl())return;
  document.addEventListener('click',handleNavEvent);
  document.addEventListener('input',e=>{
   if(e.target.id!=='neoRefPlayerSearch')return;
   search=e.target.value;visibleCount=36;
   const focus=e.target.selectionStart;
   render('players');
   const input=$('neoRefPlayerSearch');if(input){input.focus();input.setSelectionRange(focus,focus);}
  });
  dialog.addEventListener('click',e=>{if(e.target===dialog)closePlayer()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden)closePlayer();});
  const originalNav=document.querySelector('.shell>.nav');
  if(originalNav){
   originalNav.addEventListener('click',e=>{
    if(inNavigation)return;
    const tab=e.target.closest('[data-tab]')?.dataset.tab;
    if(!tab)return;
    page=tab==='match'?'match':'native';document.body.dataset.neoRefPage=page;refreshNav();
   });
  }
  setupMatch();loadStoredPortraits();
  go('home');
  const refresh=()=>{
   if(!mm.matches||!['home','ranking','players'].includes(page))return;
   const sn=season(),m=currentMatch();
   const token=String(sn?.number||'')+'|'+String(sn?.goalLog?.length||0)+'|'+String(sn?.scorers?Object.values(sn.scorers).reduce((a,b)=>a+Number(b||0),0):0)+'|'+String(sn?.rounds?.filter(r=>r.games.some(g=>g.result)).length||0);
   const mtoken=String(m?.time||0)+'|'+String(m?.score?.join(':')||'');
   if(token!==lastSeasonToken||mtoken!==lastMatchToken){lastSeasonToken=token;lastMatchToken=mtoken;if(page!=='players'||!search)render(page);}
  };
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){render(page);updatePortraits();}});
  window.setInterval(refresh,3500);
  mm.addEventListener?.('change',()=>{
   if(mm.matches){document.body.dataset.neoRefPage=page;refreshNav();}
   else document.body.dataset.neoRefPage='native';
  });
  window.NeoReferenceMobile={go,render};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();