/* Blue Lock NEO v9.5: unified market, MVP and balanced prices. */
(()=>{'use strict';
 if(window.NeoMarket96)return;
 const $=id=>document.getElementById(id),E=window.NeoEngine,D=window.NeoPlayerData96;
 if(!E?.Progression||!D)return;
 const fmt=n=>'¥ '+(Math.max(0,Number(n)||0)/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const roles=[
  ['all','Todos'],['GK','🧤 Goleiros'],['CB','🛡️ Zagueiros'],['FB','🏃 Laterais / alas'],
  ['DM','⚓ Volantes'],['CM','⚙️ Meias centrais'],['AM','🎯 Meias ofensivos'],
  ['W','💨 Pontas'],['ST','⚽ Atacantes'],['MASTER','⭐ Mestres'],['G','🥇 Artilheiros'],['A','🎯 Assistentes'],
  ['VALUE','💰 Mais valiosos'],['DEF','🛡️ Melhor defesa'],['PASS','🎯 Passadores'],['CLUBS','🏆 Classificação dos times']
 ];
 const position=r=>{r=(r||'').toUpperCase();
  if(['GOL','GK'].includes(r))return 'GK';
  if(['ZAG','CB'].includes(r))return 'CB';
  if(['LE','LD','LB','RB','LWB','RWB','ALA'].includes(r))return 'FB';
  if(['VOL','CDM'].includes(r))return 'DM';
  if(['MC','CM'].includes(r))return 'CM';
  if(['MEI','CAM','MAT'].includes(r))return 'AM';
  if(['PD','PE','RW','LW'].includes(r))return 'W';
  if(['CA','ST','CF','SA'].includes(r))return 'ST';return 'CM';
 };
 let selected='all',expanded=false,allPlayers=false,searchTerm='',selectedClub='all';
 function state(){try{const s=JSON.parse(localStorage.getItem('neo-season-v2')||'null');if(s?.schema!==2)return null;E.Progression.reconcileGoalkeepers(s);E.Progression.reconcileBids(s);
  if(s.career?.masterBidVersion!==2&&E.Progression.reconcileMasterBids){
   E.Progression.reconcileMasterBids(s);
  }
  // Read-only market preview. Only app.js may persist a repaired season,
  // after a complete, verified IndexedDB backup of the original save.
  return s;}catch(e){return null}}
 // O ranking da Liga acompanha os clubes escalados para a temporada atual.
 // Copas e a Seleção do Campeonato não rendem ofertas da Liga Neo Egoísta.
 function market(s){return D.roster(E,s,{scope:'league'})}
 function clubOf(p){return E.teamById(p?.club)||{id:p?.club||'',short:p?.club||'CLUBE',name:p?.club||'Clube',color:'#61b9e9'};}
 function photo(p,cls='neo960-avatar'){
  const t=clubOf(p);
  if(window.NeoPortraitUI?.html)return window.NeoPortraitUI.html(p.name,t,cls);
  const fallback=window.NeoOriginalPortraits?.[p.name];
  if(fallback)return `<img class="${cls}" src="${esc(fallback)}" alt="Foto de ${esc(p.name)}" loading="lazy" decoding="async">`;
  return `<span class="${cls} neo960-avatar-fallback" aria-label="Sem foto cadastrada">${esc((p.name||'?').split(' ').map(s=>s[0]).slice(0,2).join(''))}</span>`;
 }
 const playerKey=p=>encodeURIComponent(p.name+'|'+p.club+(p.isMaster?'|master':''));
 function score(p,k){const n=v=>Number(p[v]||0);switch(k){
  case 'G':return n('goals');case 'A':return n('assists');
  case 'DEF':return n('tackles')*2+n('interceptions')*2.5+n('shotBlocks')*3+n('aerialWins')+n('saves')*1.7;
  case 'PASS':return n('keyPasses')*2+n('assists')*4+n('passes')*.035;
  default:return p.value;
 }}
 function updateMvp(s){
  const block=$('neo950-mvp');if(!block)return;
  const top=E.Progression.mvpRanking(s,5);
  if(!top.length){block.innerHTML='<div class="neo950-mvp-empty"><b>🏆 MVP parcial</b><small>O Top 5 aparece quando houver partidas registradas.</small></div>';return;}
  const winner=top[0],club=clubOf(winner),points=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:2});
  block.innerHTML=`<button type="button" class="neo950-mvp-hero neo960-mvp-hero" data-neo960-profile="${playerKey(winner)}" aria-label="Ver ficha do MVP ${esc(winner.name)}">${photo(winner,'neo960-mvp-avatar')}<div><small>🏆 MVP ATUAL · TEMPORADA</small><strong>${esc(winner.name)}</strong><span>${esc(club.short)} · ${winner.games} jogos · ${points(winner.mvpPoints)} pontos</span></div><span aria-hidden="true" class="neo960-open">›</span></button><div class="neo950-top5">${top.map((p,i)=>{
   const t=clubOf(p);return `<button type="button" class="neo950-top5-line neo960-top5-line" data-neo960-profile="${playerKey(p)}" aria-label="Ver ficha de ${esc(p.name)}"><b>${i+1}º</b>${photo(p,'neo960-mini-avatar')}<span>${esc(p.name)}<small>${esc(t.short)}</small></span><strong>${points(p.mvpPoints)}</strong></button>`;
  }).join('')}</div><small class="neo950-mvp-notice">A pontuação considera ações registradas, não valor de mercado. Toque em qualquer jogador para ver a ficha.</small>`;
 }
 function showRanking(){const holder=$('neo940-ranking');if(!holder)return;
  const season=state();updateMvp(season);const all=market(season);
  const originals=E.TEAMS||[],registered=(E.allTeams?.()||originals).filter(t=>t?.id&&t.id!=='neo-bestxi');
  const participants=new Set(Array.isArray(season?.teamIds)&&season.teamIds.length?season.teamIds:originals.map(t=>t.id));
  if(selectedClub!=='all'&&!registered.some(t=>t.id===selectedClub))selectedClub='all';
  const clubSelect=$('neo960-club-filter');if(clubSelect){
   const options=[{id:'all',name:'Todos os times da Liga'},...registered.map(t=>({id:t.id,name:t.name+(participants.has(t.id)?'':' · fora da Liga')}))];
   const signature=options.map(t=>t.id+'|'+t.name).join(';');
   if(clubSelect.dataset.signature!==signature){clubSelect.innerHTML=options.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');clubSelect.dataset.signature=signature;}
   clubSelect.value=selectedClub;
  }
  const title=$('neo940-subtitle'),count=$('neo960-roster-total'),expand=$('neo940-expand');
  if(selected==='CLUBS'){
   let rows=[];try{rows=season?E.standings(season):[]}catch(_){rows=[]}
   const ordered=rows.map((r,i)=>({...r,place:i+1})).filter(r=>selectedClub==='all'||r.team.id===selectedClub);
   holder.innerHTML=ordered.map(r=>`<article class="neo940-row neo960-club-row"><b class="neo940-order">${r.place}º</b><span class="neo960-team-emblem">${esc(r.team.short||r.team.name.slice(0,2))}</span><span class="neo940-person"><strong>${esc(r.team.name)}</strong><small>J ${r.J} · V ${r.V} · E ${r.E} · D ${r.D} · SG ${r.SG}</small></span><strong class="neo940-price">${r.PTS} pts</strong></article>`).join('')||'<p class="neo940-empty">Esse clube não participa da temporada. Inclua-o ao configurar a próxima Liga para começar a pontuar.</p>';
   if(title)title.textContent=`${ordered.length} times`;
   if(count)count.textContent='Classificação dos clubes baseada somente em resultados oficiais.';
   if(expand)expand.hidden=true;
   return;
  }
  const term=searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const data=all.filter(p=>{
    if(selectedClub!=='all'&&p.club!==selectedClub)return false;
    if(term){return [p.name,clubOf(p).name,clubOf(p).short,p.role].some(v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(term));}
    return selected==='all'||selected==='VALUE'||['G','A','DEF','PASS'].includes(selected)||(selected==='MASTER'?p.isMaster:position(p.role)===selected);
  });
  const ranked=data.sort((a,b)=>score(b,selected)-score(a,selected)||b.value-a.value||a.name.localeCompare(b.name,'pt-BR'));
  const metric=p=>selected==='G'?Math.round(score(p,'G'))+' gols':
   selected==='A'?Math.round(score(p,'A'))+' assist.':
   selected==='DEF'||selected==='PASS'?score(p,selected).toLocaleString('pt-BR',{maximumFractionDigits:1})+' pts':fmt(p.value);
  const limit=term||allPlayers?Infinity:expanded?15:6;
  const list=ranked.slice(0,limit);
  holder.innerHTML=list.map((p,i)=>{
   const t=clubOf(p);
   return `<button type="button" class="neo940-row neo960-row" data-neo960-profile="${playerKey(p)}" aria-label="Abrir ficha completa de ${esc(p.name)}"><b class="neo940-order">${i+1}º</b>${photo(p)}<span class="neo940-person"><strong>${esc(p.name)}</strong><small>${esc(t.short)} · ${esc(p.role)} · ${p.ovr} OVR${p.isMaster?' · ⭐ Mestre':''}</small></span><strong class="neo940-price">${metric(p)}</strong><span class="neo960-open" aria-hidden="true">›</span></button>`;
  }).join('')||'<p class="neo940-empty">Nenhum jogador encontrado. Limpe a busca ou escolha outra posição.</p>';
  if(title)title.textContent=`${ranked.length} jogadores`;
  if(count)count.textContent=`${all.length} nomes na Liga (incluindo ${all.filter(p=>p.isMaster).length} mestres) · ${ranked.length} nesta lista`;
  if(expand){
   expand.hidden=!!term||ranked.length<=6;
   expand.textContent=allPlayers?'Mostrar top 6':expanded?`Ver todos os ${ranked.length}`:'Ver top 15';
  }
 }
 function fold(nodes,title,container,marker){const valid=nodes.filter(n=>n&&n.parentElement===container);if(!valid.length||$(marker))return;
  const d=document.createElement('details');d.id=marker;d.className='neo940-fold';
  d.innerHTML=`<summary>${esc(title)}</summary>`;
  const inner=document.createElement('div');inner.className='neo940-fold-inner';d.appendChild(inner);
  container.insertBefore(d,valid[0]);for(const el of valid)inner.appendChild(el);
 }
 function declutter(){const match=$('match'),ranking=$('ranking'),records=$('records');
  const card=match?.querySelector('.match-card');
  if(card&&!$('neo940-match-extra')){
   const selectors=['#liveDuel','#skillToast','#commentaryTicker','#actionTheater','#replayDirector','#egoLive','#liveArsenalBox','#mastersLive','#runFeed','.modern-tactics-live','.pulse-card','.goal-shortcut','#matchBanner'];
   fold(selectors.map(s=>card.querySelector(s)),'📊 Análises, câmera de lance e detalhes',card,'neo940-match-extra');
   fold([$('matchPreview')],'⚡ Pré-jogo e escalações',card,'neo940-pregame');
  }
  const broad=$('neo920-broadcast');if(broad&&!$('neo940-broadcast-details')){
   const nodes=[];let child=broad.querySelector('.neo920-pressure-label');while(child){nodes.push(child);child=child.nextElementSibling;}
   fold(nodes,'📈 Pressão e lances em tempo real',broad,'neo940-broadcast-details');
  }
  if(ranking&&!$('neo940-ranking')){
   const section=document.createElement('section');section.id='neo940-market';section.className='card neo940-market';
   section.innerHTML=`<div class="neo940-top"><div><small>RANKINGS NEO EGOÍSTA</small><h2>🏆 Jogadores e times da Liga</h2><p>Ofertas e pontos calculados com os jogos da temporada.</p></div><span id="neo940-subtitle">Todos</span></div><section id="neo950-mvp" class="neo950-mvp" aria-label="Top cinco e MVP atual"></section><small id="neo960-roster-total" class="neo960-total"></small><label class="neo960-search">🔎 Buscar qualquer jogador<input type="search" id="neo960-search" placeholder="Nome, equipe ou posição" autocomplete="off" aria-label="Buscar jogador no ranking"></label><div class="neo960-rank-filters"><label class="neo940-filter-label">Escolha o ranking<select id="neo940-filter">${roles.map(([key,name])=>`<option value="${key}">${esc(name)}</option>`).join('')}</select></label><label class="neo940-filter-label">Escolha o time<select id="neo960-club-filter" aria-label="Filtrar ranking por time"><option value="all">Todos os times da Liga</option></select></label></div><p class="neo960-club-hint">Times fora da Liga precisam ser adicionados ao campeonato para registrar pontos e jogadores.</p><div id="neo940-ranking" class="neo940-list" aria-live="polite"></div><button type="button" id="neo940-expand" class="neo940-more-records">Ver top 15</button>`;
   ranking.querySelector('.hero-card')?.insertAdjacentElement('afterend',section);
   $('neo940-filter')?.addEventListener('change',e=>{selected=e.target.value;expanded=false;allPlayers=false;showRanking()});
   $('neo960-club-filter')?.addEventListener('change',e=>{selectedClub=e.target.value;expanded=false;allPlayers=false;showRanking()});
   $('neo960-search')?.addEventListener('input',e=>{searchTerm=e.target.value;showRanking()});
   $('neo940-expand')?.addEventListener('click',()=>{if(allPlayers){allPlayers=false;expanded=false}else if(expanded){allPlayers=true}else{expanded=true}showRanking()});
   // Deixe apenas UM ranking de mercado. Ocultar o pódio e o leilão legados.
   for(const id of ['careerRankings','neoRankingPodium']) $(id)?.closest('.card')?.classList.add('neo950-old-ranking');
   // As outras informações da liga ficam acessíveis, porém recolhidas.
   fold([...ranking.children].filter(x=>x!==section),'📂 Ranking avançado, evolução e histórias',ranking,'neo940-rank-extras');
   ranking.prepend(section);showRanking();
  }
  if(records){
   const grid=$('neoHistoricalRecords');const histCard=$('neoHistoryCard');
   if(histCard&&!$('neo940-more-records')){
    const btn=document.createElement('button');btn.type='button';btn.id='neo940-more-records';btn.className='neo940-more-records';btn.textContent='Ver todos os recordes';
    histCard.appendChild(btn);btn.onclick=()=>{const shown=grid?.classList.toggle('neo940-all-records');btn.textContent=shown?'Mostrar apenas destaques':'Ver todos os recordes'};
   }
   if(!$('neo940-record-extras'))fold([...records.children].filter(x=>x!==histCard),'📂 Gols, assistências, histórico e premiações',records,'neo940-record-extras');
  }
  const moments=[...records?.querySelectorAll('.card')||[]].find(c=>c.querySelector('h2')?.textContent?.includes('Momentos memoráveis'));
  if(moments&&!$('neo950-moments')&&moments.parentElement){
   const d=document.createElement('details');d.id='neo950-moments';d.className='neo940-fold neo950-moments';
   const summary=document.createElement('summary');summary.textContent='🌠 Momentos memoráveis (ver lances)';
   d.appendChild(summary);moments.parentElement.insertBefore(d,moments);d.appendChild(moments);
  }
  const header=document.querySelector('.branding small');if(header)header.textContent='9.7';
  const outdated=document.querySelector('#ranking .section-subtitle');if(outdated&&/3 MINUTOS/.test(outdated.textContent))outdated.textContent='ATÉ 45 MINUTOS DE JOGO';
 }
 // Usa dados de carreira e jogos salvos. Nunca gera estatísticas fictícias.
 const statDefinitions=[
  ['📊 Temporada',[['games','Jogos'],['wins','Vitórias'],['draws','Empates'],['losses','Derrotas']]],
  ['⚽ Ataque',[['goals','Gols'],['assists','Assistências'],['shots','Finalizações'],['dribbles','Dribles certos']]],
  ['🎯 Criação',[['passes','Passes realizados'],['keyPasses','Passes para finalização']]],
  ['🛡️ Defesa',[['tackles','Desarmes'],['interceptions','Interceptações'],['shotBlocks','Bloqueios'],['duelsWon','Duelos vencidos'],['aerialWins','Duelos aéreos']]],
  ['🧤 Goleiro',[['saves','Defesas'],['cleanSheets','Jogos sem sofrer gols']]],
  ['🏃 Participação',[['runs','Corridas'],['overlaps','Ultrapassagens'],['distance','Distância percorrida (m)'],['flowCount','Ativações de Flow'],['masterApps','Entradas de mestre']]]
 ];
 const missingInOld=new Set(['shots','runs','overlaps','distance','draws','losses','masterApps']);
 function statsAvailable(info,field){return info.hasMatches&&(!missingInOld.has(field)||field in info.saved||info.matched.some(m=>field in m.raw)||(['draws','losses'].includes(field)&&info.matched.some(m=>Array.isArray(m.score))));}
 function statsHtml(info){const role=position(info.entry.role),t=info.totals;
  return statDefinitions.filter(([title])=>!title.includes('Goleiro')||role==='GK').map(([title,items])=>`<section class="neo960-stat-group"><h3>${title}</h3><div class="neo960-stat-grid">${items.map(([key,label])=>{
   const value=statsAvailable(info,key)?t[key].toLocaleString('pt-BR',{maximumFractionDigits:key==='distance'?0:1}):'—';
   return `<div class="neo960-stat"><span>${label}</span><strong>${value}</strong></div>`;
  }).join('')}</div></section>`).join('');
 }
 let activeProfile=null,lastFocus=null;
 function closeProfile(){const modal=$('neo960-profile-modal');if(!modal||modal.hidden)return;modal.hidden=true;modal.classList.remove('open');document.body.classList.remove('neo960-modal-open');activeProfile=null;lastFocus?.focus?.();}
 function openProfile(name,club,isMaster){const season=state(),p=D.profile(E,season,name,club,{isMaster});if(!p)return;
  activeProfile={name,club};lastFocus=document.activeElement;
  let modal=$('neo960-profile-modal');if(!modal){
    modal=document.createElement('div');modal.id='neo960-profile-modal';modal.className='neo960-modal';modal.hidden=true;
    modal.innerHTML='<div class="neo960-modal-backdrop" data-neo960-close></div><section class="neo960-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="neo960-profile-title"><button class="neo960-close" type="button" data-neo960-close aria-label="Fechar ficha">✕</button><div id="neo960-profile-content"></div></section>';
    document.body.appendChild(modal);
  }
  const t=clubOf(p.entry),a=E.Attr.generate(p.entry.name,p.entry.role,p.entry.role==='GOL'?0:1,p.saved),note=p.hasMatches?'Estatísticas registradas nesta temporada.':'Ainda sem partidas registradas nesta temporada.';
  const rating=p.avgRating===null?'—':p.avgRating.toLocaleString('pt-BR',{maximumFractionDigits:1});
  const big=`<div class="neo960-profile-head">${photo(p.entry,'neo960-profile-picture')}<div><small>${esc(t.name)} · ${esc(p.entry.role)}${p.entry.isMaster?' · ⭐ Mestre':''}</small><h2 id="neo960-profile-title">${esc(p.entry.name)}</h2><span class="neo960-profile-meta">${p.entry.ovr} OVR · ${fmt(p.entry.value)} · ${p.totals.games} jogos</span><span class="neo960-profile-meta">⭐ Nota média ${rating} · ${p.recordedMatches} súmula(s) detalhada(s)</span></div></div>`;
  const abilities=Object.entries(p.abilityUses||{}).filter(([,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]);
  const abilityHTML=abilities.length?abilities.map(([id,count])=>`<div class="neo960-extra-row"><span>${esc(E.Abilities.get(id)?.label||id)}</span><strong>${Math.floor(count)}×</strong></div>`).join(''):'<p class="neo960-empty">Nenhuma ativação registrada nesta temporada.</p>';
  const hist=p.history.length?p.history.map(h=>`<div class="neo960-match-row"><span>R${h.round} · ${esc(E.teamById(h.opponent)?.short||h.opponent)}</span><b>${h.score?h.score.join(' × '):'—'}</b><small>⚽${h.goals} · 🎯${h.assists} · 🦵${h.passes} passes · 🛡️${h.tackles} desarmes · 🧤${h.saves} defesas</small></div>`).join(''):'<p class="neo960-empty">Não há súmulas detalhadas salvas para este jogador.</p>';
  const skillRows=E.Attr.KEYS.filter(k=>k!=='ego').map(k=>({key:k,label:E.Attr.LABELS[k]||k,value:a[k]||0}));
  const top=[...skillRows].sort((x,y)=>y.value-x.value).slice(0,3);
  const growth=[...skillRows].sort((x,y)=>x.value-y.value).slice(0,2);
  const grade=n=>n>=87?'elite':n>=78?'forte':n>=67?'regular':'evolucao';
  const highlights=`<section class="neo960-skill-identity"><h3>🎯 Identidade em campo</h3><p>OVR mede a posição. Os atributos mostram onde o jogador realmente se destaca — e onde precisa evoluir.</p><div class="neo960-skill-leaders">${top.map(x=>`<span class="${grade(x.value)}"><small>${esc(x.label)}</small><b>${x.value}</b></span>`).join('')}</div><small class="neo960-growth">📈 A evoluir: ${growth.map(x=>`${esc(x.label)} ${x.value}`).join(' · ')}</small></section>`;
  const bars=E.Attr.KEYS.map(k=>`<div class="neo960-attribute ${grade(a[k]||0)}"><span>${esc(E.Attr.LABELS[k]||k)}</span><div><i style="width:${Math.min(100,a[k]||0)}%"></i></div><strong>${a[k]||0}</strong></div>`).join('');
  $('neo960-profile-content').innerHTML=big+highlights+`<p class="neo960-stat-note">${note} Quando uma partida antiga não registrou determinado dado, aparece “—”, não um número inventado.</p>${statsHtml(p)}<details class="neo960-detail" open><summary>⚡ Habilidades utilizadas (${abilities.reduce((sum,x)=>sum+Number(x[1]||0),0)})</summary>${abilityHTML}</details><details class="neo960-detail"><summary>📋 Últimas partidas (${p.recordedMatches})</summary>${hist}</details><details class="neo960-detail"><summary>🌟 Todos os atributos do jogador</summary>${bars}</details>`;
  modal.hidden=false;modal.classList.add('open');document.body.classList.add('neo960-modal-open');modal.querySelector('[data-neo960-close]')?.focus();
 }
 function attachProfiles(){
  document.addEventListener('click',e=>{
   const close=e.target.closest('[data-neo960-close]');if(close){closeProfile();return}
   // Gallery is for choosing or changing portraits, never for the statistics modal.
   // Leave gallery photos, buttons, search results and historical-roster rows alone.
   if(e.target.closest('#portraitGallery, #neo970-new-squads, #gallery .portrait-card, .portrait-card, .neo970-photo-row, [data-gallery-player]'))return;
   const target=e.target.closest('[data-neo960-profile]');if(target){
    const key=decodeURIComponent(target.dataset.neo960Profile||''),isMaster=key.endsWith('|master');
    const identity=isMaster?key.slice(0,-7):key,split=identity.lastIndexOf('|');
    if(split>=0)openProfile(identity.slice(0,split),identity.slice(split+1),isMaster);return;
   }
   // As outras listagens de jogadores também levam à ficha, quando reconhecíveis.
   if(e.target.closest('button,a,[data-portrait-edit],[data-manga-edit],[data-portrait-style]'))return;
   const line=e.target.closest('#ranking .career-row,#ranking .record-row,#records .record-row,#squads .roster-player');
   if(!line)return;
   const img=line.querySelector('img[data-player-name]');const raw=img?.dataset.playerName;
   if(!raw)return;let name;try{name=decodeURIComponent(raw)}catch(_){return}
   const player=market(state()).find(x=>x.name===name);if(player)openProfile(player.name,player.club);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeProfile();});
 }
 function keeperDetails(){const panel=$('playerDetails');if(!panel||$('neo940-keeper-details'))return;
  const box=document.createElement('div');box.id='neo940-keeper-details';box.className='neo940-personal';panel.appendChild(box);
  const refresh=()=>{
   const name=panel.querySelector('.player-name')?.textContent?.trim();if(!name)return;
   const s=state(),keeper=Object.values(s?.career?.players||{}).find(p=>p.name===name&&position(p.role)==='GK');
   box.textContent=keeper?`🧤 Defesas registradas: ${keeper.saves||0} · Jogos sem sofrer gol: ${keeper.cleanSheets||0}`:'';
  };
  new MutationObserver(refresh).observe(panel,{childList:true,subtree:false});refresh();
 }
 function boot(){if(!$('ranking'))return;
  const css=document.createElement('link');css.rel='stylesheet';css.href='./neo-v960.css?v=9.6.0';document.head.appendChild(css);
  declutter();keeperDetails();attachProfiles();
  document.addEventListener('click',e=>{if(e.target.closest('[data-tab="ranking"],[data-neo-tab="ranking"],[data-neo-open="ranking"],#simulateRound,#simulateSeason,#newSeason,#restoreSeasonFile'))setTimeout(showRanking,400)});
  window.addEventListener('storage',e=>{if(e.key==='neo-season-v2')showRanking()});
  setInterval(()=>{if(!$('ranking')?.classList.contains('hidden'))showRanking()},6500);
  window.NeoMarket96={market,position,showRanking,roles,updateMvp,openProfile,closeProfile,statsHtml};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
