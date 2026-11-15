/* Blue Lock NEO v9.4: compact interface, positional price ranking, verified keeper saves. */
(()=>{'use strict';
 if(window.NeoMarket94)return;
 const $=id=>document.getElementById(id),E=window.NeoEngine;
 if(!E?.Progression)return;
 const fmt=n=>'¥ '+(Math.max(0,Number(n)||0)/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const roles=[
  ['all','Todos'],['GK','🧤 Goleiros'],['CB','🛡️ Zagueiros'],['FB','🏃 Laterais / alas'],
  ['DM','⚓ Volantes'],['CM','⚙️ Meias centrais'],['AM','🎯 Meias ofensivos'],
  ['W','💨 Pontas'],['ST','⚽ Atacantes'],['G','🥇 Artilheiros'],['A','🎯 Assistentes'],
  ['VALUE','💰 Mais valiosos'],['DEF','🛡️ Melhor defesa'],['PASS','🎯 Passadores']
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
 let selected='all',expanded=false;
 function state(){try{const s=JSON.parse(localStorage.getItem('neo-season-v2')||'null');if(s?.schema!==2)return null;E.Progression.reconcileGoalkeepers(s);return s;}catch(e){return null}}
 function market(s){const old=s?.career?.players||{},seen=new Set(),res=[];
  for(const t of E.TEAMS)for(const [i,name] of [...t.players,...t.reserves].entries()){
   const id=name+'|'+t.id;if(seen.has(id))continue;seen.add(id);
   const saved=old[id]||{},role=i<t.players.length?t.formation[i]?.role||'MC':saved.role||'MC';
   const ovr=E.Attr.generate(name,role,i<t.players.length?i:1,saved).ovr;
   res.push({...saved,name,club:t.id,role,ovr,value:E.Progression.estimateValue(saved,ovr,role)});
  }return res;
 }
 function score(p,k){const n=v=>Number(p[v]||0);switch(k){
  case 'G':return n('goals');case 'A':return n('assists');
  case 'DEF':return n('tackles')*2+n('interceptions')*2.5+n('shotBlocks')*3+n('aerialWins')+n('saves')*1.7;
  case 'PASS':return n('keyPasses')*2+n('assists')*4+n('passes')*.035;
  default:return p.value;
 }}
 function showRanking(){const holder=$('neo940-ranking');if(!holder)return;
  const data=market(state());
  const list=data.filter(p=>roles.find(r=>r[0]===selected)&&(roles.some(r=>r[0]===selected)&&(['G','A','DEF','PASS','VALUE','all'].includes(selected)||position(p.role)===selected)))
   .sort((a,b)=>score(b,selected)-score(a,selected)||b.value-a.value).slice(0,expanded?15:6);
  holder.innerHTML=list.map((p,i)=>{
   const t=E.teamById(p.club);
   return `<article class="neo940-row"><b class="neo940-order">${i+1}º</b><div class="neo940-person"><strong>${esc(p.name)}</strong><small>${esc(t?.short||p.club)} · ${esc(p.role)} · ${p.ovr} OVR</small></div><strong class="neo940-price">${fmt(p.value)}</strong></article>`;
  }).join('')||'<p class="neo940-empty">Ainda não existem jogadores nesta categoria.</p>';
  const title=$('neo940-subtitle');if(title)title.textContent=roles.find(x=>x[0]===selected)?.[1]||'Mercado';
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
   section.innerHTML=`<div class="neo940-top"><div><small>MERCADO NEO EGOÍSTA</small><h2>💴 Mais valiosos por posição</h2><p>Preços maiores, com OVR e desempenho na valorização.</p></div><span id="neo940-subtitle">Todos</span></div><label class="neo940-filter-label">Escolha o ranking<select id="neo940-filter">${roles.map(([key,name])=>`<option value="${key}">${esc(name)}</option>`).join('')}</select></label><div id="neo940-ranking" class="neo940-list" aria-live="polite"></div><button type="button" id="neo940-expand" class="neo940-more-records">Ver top 15</button>`;
   ranking.querySelector('.hero-card')?.insertAdjacentElement('afterend',section);
   $('neo940-filter')?.addEventListener('change',e=>{selected=e.target.value;expanded=false;$('neo940-expand').textContent='Ver top 15';showRanking()});
   $('neo940-expand')?.addEventListener('click',()=>{expanded=!expanded;$('neo940-expand').textContent=expanded?'Mostrar top 6':'Ver top 15';showRanking()});
   // All older performance widgets remain accessible, but don't occupy 5 screens.
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
  const header=document.querySelector('.branding small');if(header)header.textContent='9.4';
  const outdated=document.querySelector('#ranking .section-subtitle');if(outdated&&/3 MINUTOS/.test(outdated.textContent))outdated.textContent='ATÉ 45 MINUTOS DE JOGO';
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
  const css=document.createElement('link');css.rel='stylesheet';css.href='./neo-v940.css?v=9.4.0';document.head.appendChild(css);
  declutter();keeperDetails();
  document.addEventListener('click',e=>{if(e.target.closest('[data-tab="ranking"],[data-neo-tab="ranking"],[data-neo-open="ranking"],#simulateRound,#simulateSeason,#newSeason,#restoreSeasonFile'))setTimeout(showRanking,400)});
  window.addEventListener('storage',e=>{if(e.key==='neo-season-v2')showRanking()});
  setInterval(()=>{if(!$('ranking')?.classList.contains('hidden'))showRanking()},6500);
  window.NeoMarket94={market,position,showRanking,roles};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();