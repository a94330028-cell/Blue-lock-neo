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
 const LOGOS={bm:'bm.webp',ba:'ba.webp',mc:'mc.webp',px:'px.webp',ub:'ub.webp',ht:'ht.webp'};
 const pic=(t,cls='neo-ux-logo')=>t&&LOGOS[t.id]?'<img class="'+esc(cls)+'" alt="Escudo '+esc(t.name)+'" src="./assets/team-logos/'+LOGOS[t.id]+'">':'<span class="neo-ux-logo-alt">'+esc(t?.short||'?')+'</span>';
 const img=name=>{
  const key=encodeURIComponent(name);
  const old=Array.from(document.querySelectorAll('img[data-portrait="1"]')).find(x=>x.dataset.playerName===key);
  const base=old?.getAttribute('src')||'./assets/imported-portraits/'+String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.jpg';
  return '<img class="neo-ux-player-img" alt="'+esc(name)+'" src="'+esc(base)+'" loading="lazy">';
 };
 function market(){
  try{
   const s=season();
   if(s&&s.career?.masterBidVersion!==2&&engine()?.Progression?.reconcileMasterBids){
    engine().Progression.reconcileMasterBids(s);window.NeoCareerBridge?.save?.();
   }
   const rows=window.NeoMarket96?.market?.(s)||
    window.NeoPlayerData96?.roster?.(engine(),s,{scope:'league'})||[];
   return Array.isArray(rows)?rows.slice().sort((a,b)=>(Number(b.value)||0)-(Number(a.value)||0)||String(a.name||'').localeCompare(String(b.name||''),'pt-BR')):[];
  }catch(error){console.warn('Mercado indisponível:',error);return [];}
 }
 function games(){return (season()?.rounds||[]).flatMap(r=>(r.games||[]).map(g=>({...g,round:r.round})))}
 function pending(){return (season()?.rounds||[]).find(r=>r.games?.some(g=>!Array.isArray(g.result)))||null}
 function standings(){try{return engine()?.standings?.(season())||[]}catch(error){return []}}
 function template(title,linkLabel,linkAction){
  return '<header class="neo-ux-heading"><h2>'+title+'</h2><button type="button" data-neo-ux-back="1">✕ Fechar</button></header>'+
   '<div class="neo-ux-tools"><button type="button" data-neo-ux-open="ranking">📊 Rankings</button><button type="button" data-neo-ux-open="market">💴 Mercado</button><button type="button" data-neo-ux-open="championship">🏆 Liga</button></div>';
 }
 let active=null,limit=30,filter='all',rankMode='goals',lastToken='',root=null,returnBar=null;
 let simulating=false,simMessage='',simMode='';
 function liveMatches(){
  const upcoming=games().filter(g=>!Array.isArray(g.result)).slice(0,3);
  return '<section class="neo-ux-live-triple" aria-label="Três jogos simultâneos"><h3>🔴 3 CAMPOS AO VIVO</h3><p>22 bolinhas e a bola de verdade em cada jogo · acompanhe os gols!</p><div class="neo-ux-live-list">'+
   upcoming.map((f,i)=>'<article class="neo-ux-live-game"><div class="neo-ux-live-head"><span>'+esc(club(f.home)?.short||f.home)+'</span><strong id="neo-ux-live-score-'+i+'">0 × 0</strong><span>'+esc(club(f.away)?.short||f.away)+'</span><small id="neo-ux-live-clock-'+i+'">0′</small></div><canvas width="320" height="192" id="neo-ux-live-pitch-'+i+'" aria-label="Jogadores de '+esc(f.home)+' contra '+esc(f.away)+' em movimento"></canvas></article>').join('')+'</div></section>';
 }
 function paintLive(matches){
  if(active!=='championship')return;
  const field=engine()?.PITCH;if(!field)return;
  matches.forEach((m,i)=>{
   const score=$('neo-ux-live-score-'+i),clock=$('neo-ux-live-clock-'+i),canvas=$('neo-ux-live-pitch-'+i);
   if(score)score.textContent=m.score[0]+' × '+m.score[1];
   if(clock)clock.textContent=m.finished?'FIM':m.minute+'′';
   if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
   const w=canvas.width,h=canvas.height,px=x=>8+(x-field.left)/(field.right-field.left)*(w-16),py=y=>8+(y-field.top)/(field.bottom-field.top)*(h-16);
   ctx.fillStyle='#125d42';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffffff0d';for(let row=0;row<8;row+=2)ctx.fillRect(0,row*h/8,w,h/8);
   ctx.strokeStyle='#d6fae0a8';ctx.lineWidth=1.1;ctx.strokeRect(7,7,w-14,h-14);
   ctx.beginPath();ctx.moveTo(w/2,7);ctx.lineTo(w/2,h-7);ctx.stroke();
   ctx.beginPath();ctx.ellipse(w/2,h/2,25,25,0,0,Math.PI*2);ctx.stroke();
   ctx.strokeRect(7,h/2-35,40,70);ctx.strokeRect(w-47,h/2-35,40,70);
   for(const p of m.players){ctx.beginPath();ctx.arc(px(p.x),py(p.y),4.4,0,Math.PI*2);ctx.fillStyle=p.side===0?'#23a7ff':'#ff596b';ctx.fill();ctx.strokeStyle='#f6fbff';ctx.lineWidth=1.2;ctx.stroke();}
   ctx.beginPath();ctx.arc(px(m.ball.x),py(m.ball.y),3.3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#16283f';ctx.stroke();
  });
 }
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
  const xi=window.NeoRound990?.currentXI?.(s);
  const priced=market().filter(p=>n(p.games)>0&&n(p.value)>0);
  let out=template('🏆 Campeonatos');
  out+='<div class="neo-ux-hero"><small>LIGA NEO EGOÍSTA · TEMPORADA '+esc(s?.number||1)+'</small><h3>'+(r?'Rodada '+esc(r.round):'Temporada concluída')+'</h3><p>'+played.length+' de '+all.length+' jogos registrados · '+priced.length+' jogadores com ofertas</p>'+
   (r?'<div class="neo-ux-round-actions"><button type="button" class="neo-ux-primary" data-neo-ux-simulate="next" '+(simulating?'disabled':'')+'>⚡ Próximo jogo</button><button type="button" class="neo-ux-primary" data-neo-ux-simulate="round" '+(simulating?'disabled':'')+'>🏁 Rodada inteira</button><button type="button" class="neo-ux-primary neo-ux-triple-button" data-neo-ux-simulate="triple" '+(simulating?'disabled':'')+'>⚽ 3 jogos com bolinhas AO VIVO</button></div>':'')+
   '<p class="neo-ux-sim-status" id="neo-ux-sim-progress" role="status">'+esc(simulating?'⏳ Simulando jogos e salvando resultados...':simMessage||'Simule aqui e acompanhe a classificação sem sair desta página.')+'</p>'+
   '<button class="neo-ux-secondary" data-neo-ux-original="league">⚙ Ajustar clubes e calendário</button></div>';
  if(simulating&&simMode==='triple')out+=liveMatches();
  out+='<section class="neo-ux-panel neo-ux-xi-feature" id="neo-ux-round-xi"><div class="neo-ux-xi-head"><h3>⭐ Time da Rodada</h3><span>'+(xi?.round?'Rodada '+esc(xi.round):'Aguardando resultados')+'</span></div>';
  if(xi?.players?.length){
   out+=window.NeoRound990.xiCardsHTML(xi,name=>img(name),'mobile');
   out+='<details class="neo-ux-xi-details"><summary>Notas e banco da rodada</summary><div class="neo-ux-xi-players">'+xi.players.map(p=>'<div><b>'+esc(p.slot)+'</b><span>'+esc(p.name)+' · '+esc(club(p.club)?.short||p.club)+'</span><strong>'+p.rating.toFixed(1)+'</strong></div>').join('')+'</div>'+
    (xi.reserves?.length?'<small>Banco: '+xi.reserves.map(p=>esc(p.name)).join(', ')+'</small>':'')+'</details>';
  }else out+='<p>Conclua uma rodada com súmulas dos jogadores para formar o melhor XI.</p>';
  out+='</section>';
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

 const RANK_TYPES=[
  ['goals','⚽ Artilheiros'],['assists','👟 Assistências'],
  ['performance','⭐ Desempenho'],['defense','🛡 Defensores'],
  ['passing','🎯 Passadores'],['mvp','👑 MVP']
 ];
 const n=v=>Math.max(0,Number(v)||0);
 const playerScore=(p,mode)=>{
  if(mode==='goals')return n(p.goals);
  if(mode==='assists')return n(p.assists);
  if(mode==='performance')return p.isMaster?
   (n(p.ratingSum)/Math.max(1,n(p.games))*1.8+n(p.goals)*3.1+n(p.assists)*2.2+n(p.shots)*.06):n(p.score);
  if(mode==='defense')return n(p.tackles)*2+n(p.interceptions)*2.5+n(p.shotBlocks)*3+n(p.aerialWins)+n(p.saves)*1.7;
  if(mode==='passing')return n(p.keyPasses)*2+n(p.assists)*4+n(p.passes)*.035;
  if(mode==='mvp')return n(p.mvpPoints);
  return n(p.value);
 };
 function metricText(p,mode){
  const score=playerScore(p,mode);
  if(mode==='market')return cash(score);
  const digits=Number.isInteger(score)?0:1;
  const value=score.toLocaleString('pt-BR',{maximumFractionDigits:digits});
  if(mode==='goals')return '⚽ '+value+' gol'+(score===1?'':'s');
  if(mode==='assists')return '👟 '+value+' assist.';
  return '⭐ '+value+' pts';
 }
 function leaderboard(data,mode='market'){
  const entries=data.slice(0,limit);
  const card=(p,index,large)=>{
   const rank=index+1;
   const meta=esc(club(p.club)?.short||p.club)+' · '+(p.isMaster?'⭐ Mestre · ':'')+
    (n(p.games)>0?Math.round(n(p.games))+' jogo(s)':'Sem estreia');
   const face=img(p.name);
   if(large)return '<button type="button" class="neo-ux-podium-card neo-ux-position-'+rank+'" data-neo-ux-profile="'+encodeURIComponent(p.name+'|'+p.club+(p.isMaster?'|master':''))+'"><span class="neo-ux-medal">'+(rank===1?'👑 ':rank===2?'🥈 ':'🥉 ')+rank+'º</span>'+
    face+'<b>'+esc(p.name)+'</b><small>'+meta+'</small><strong>'+esc(metricText(p,mode))+'</strong></button>';
   return '<button type="button" class="neo-ux-money-row neo-ux-rank-row" data-neo-ux-profile="'+encodeURIComponent(p.name+'|'+p.club+(p.isMaster?'|master':''))+'"><span class="neo-ux-index">'+rank+'º</span>'+face+
    '<span class="neo-ux-info"><b>'+esc(p.name)+'</b><small>'+meta+'</small></span><strong>'+esc(metricText(p,mode))+'</strong></button>';
  };
  let out='';
  if(entries.length){
   out+='<div class="neo-ux-podium neo-ux-shared-leaderboard">'+[1,0,2].map(index=>entries[index]?card(entries[index],index,true):'<span class="neo-ux-podium-placeholder"></span>').join('')+'</div>';
   out+='<div class="neo-ux-money-list neo-ux-shared-leaderboard">'+entries.slice(3).map((p,i)=>card(p,i+3,false)).join('')+'</div>';
  }else out+='<p class="neo-ux-empty">Ainda não existem estatísticas registradas para esta classificação.</p>';
  if(data.length>limit)out+='<button class="neo-ux-primary neo-ux-more" data-neo-ux-more="1">Mostrar mais ('+esc(data.length-limit)+')</button>';
  return out;
 }
 function rankingHtml(){
  const s=season(),rows=market().filter(p=>n(p.games)>0);
  let ranked;
  if(rankMode==='mvp'){
   const regular=(engine()?.Progression?.mvpRanking?.(s,1000)||[]).map(p=>({...p,mvpPoints:n(p.mvpPoints)}));
   const masters=rows.filter(p=>p.isMaster).map(p=>({...p,mvpPoints:+(
    (n(p.goals)*3.1+n(p.assists)*2.35+n(p.shots)*.08)/Math.max(1,n(p.games))+
    Math.max(0,n(p.ratingSum)/Math.max(1,n(p.games))-6)*1.12+
    Math.min(1,n(p.games)/6)*1.35).toFixed(2)}));
   ranked=regular.concat(masters).sort((a,b)=>n(b.mvpPoints)-n(a.mvpPoints)||n(b.games)-n(a.games));
  }else{
   ranked=rows.filter(p=>playerScore(p,rankMode)>0)
    .sort((a,b)=>playerScore(b,rankMode)-playerScore(a,rankMode)||n(b.value)-n(a.value)||a.name.localeCompare(b.name,'pt-BR'));
  }
  let out=template('🏆 Ranking NEO');
  out+='<div class="neo-ux-panel neo-ux-rank-intro"><h3>Classificação da temporada</h3><p>Todos os rankings usam os mesmos cards e pódio. Cada aba mantém suas estatísticas reais e sua própria ordem.</p></div>';
  out+='<div class="neo-ux-filter neo-ux-rank-tabs">'+RANK_TYPES.map(([id,label])=>'<button type="button" data-neo-ux-rank="'+id+'" '+(rankMode===id?'class="active"':'')+'>'+label+'</button>').join('')+'</div>';
  out+='<div class="neo-ux-rank-meta">'+ranked.length+' atletas classificados · Temporada '+esc(s?.number||1)+'</div>';
  return out+leaderboard(ranked,rankMode);
 }

 function marketHtml(){
  const rows=market(),categories=[['all','Todos'],['GK','Goleiros'],['CB','Zagueiros'],['FB','Laterais'],['DM','Volantes'],['CM','Meias'],['AM','Armadores'],['W','Pontas'],['ST','Atacantes'],['MASTER','⭐ Mestres']];
  const filtered=rows.filter(p=>filter==='all'||(filter==='MASTER'?p.isMaster:position(p)===filter));
  const leader=rows.find(p=>n(p.value)>0);
  let out=template('💴 Mercado Neo');
  out+='<div class="neo-ux-hero"><small>OFERTAS DE MERCADO EM IENES (¥)</small><h3>'+rows.length+' atletas na avaliação</h3><p>Lances fictícios por partidas e ações registradas. Os mestres só recebem ofertas quando entram oficialmente; não é salário nem dinheiro bancário.</p>'+
   '<div class="neo-ux-leading"><span>Maior avaliação</span><strong>'+(leader?esc(cash(leader.value)):'¥ 0')+'</strong></div></div>';
  out+='<div class="neo-ux-filter">'+categories.map(([id,label])=>'<button data-neo-ux-filter="'+id+'" '+(filter===id?'class="active"':'')+'>'+label+'</button>').join('')+'</div>';
  out+='<div class="neo-ux-rank-meta">'+filtered.length+' atletas · Pódio e cards padronizados em todos os rankings</div>';
  out+=leaderboard(filtered,'market');
  out+='<div class="neo-ux-panel"><h3>🔄 Negociações e contratos</h3><p>Os históricos de transferências permanecem nos controles originais do simulador.</p><button class="neo-ux-primary" data-neo-ux-original="more">Abrir negociações e contratos →</button><button class="neo-ux-secondary" data-neo-ux-open="ranking">Ver rankings de desempenho →</button></div>';
  return out;
 }

 function show(view){
  if(!mobile()||!root)return;
  active=view;
  root.innerHTML=view==='market'?marketHtml():view==='ranking'?rankingHtml():championship();
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
 async function simulateFromHub(mode){
  const bridge=window.NeoCareerBridge;
  if(simulating||bridge?.isSimulating?.())return;
  if(!bridge?.simulateRound||!bridge?.simulateNextFixture||mode==='triple'&&!bridge.simulateTripleLive){simMessage='⚠️ Os controles da liga ainda não estão prontos.';show('championship');return;}
  const expected=mode==='round'?pending()?.games.filter(g=>!Array.isArray(g.result)).length||0:mode==='triple'?games().filter(g=>!Array.isArray(g.result)).slice(0,3).length:1;
  simulating=true;simMode=mode;simMessage='';show('championship');
  try{
   const completed=await (mode==='round'?bridge.simulateRound():mode==='triple'?bridge.simulateTripleLive(paintLive):bridge.simulateNextFixture());
   simMessage=completed<expected?'⚠️ '+completed+' de '+expected+' partida(s) registradas. Se o armazenamento estiver cheio, exporte seu backup antes de sair.':
    mode==='round'?'✅ Rodada salva! Ofertas e Time da Rodada atualizados.':
    mode==='triple'?'✅ '+completed+' jogos com bolinhas concluídos e salvos! Placar, ranking e ofertas atualizados.':
    '✅ Partida salva! Ofertas atualizadas. O Time da Rodada fecha após o último jogo.';
  }catch(error){console.error('Erro na simulação da liga',error);simMessage='⚠️ Simulação interrompida: '+String(error?.message||error);}
  finally{simulating=false;simMode='';show('championship');}
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
   const open=b.dataset.neoUxOpen||((b.dataset.refPage==='ranking'||b.dataset.refGo==='ranking')?'ranking':null);
   if(open||b.dataset.refGo==='league'){
    event.preventDefault();event.stopImmediatePropagation();show(open||'championship');return;
   }
   if(b.dataset.neoUxBack){
    event.preventDefault();event.stopImmediatePropagation();const previous=active;close();if(previous==='market'){show('ranking');return;}window.NeoReferenceMobile.go('home');return;
   }
   if(b.dataset.neoUxOriginal){
    event.preventDefault();event.stopImmediatePropagation();original(b.dataset.neoUxOriginal);return;
   }
   if(b.dataset.neoUxWatch!==undefined){
    event.preventDefault();event.stopImmediatePropagation();watch(Number(b.dataset.neoUxWatch));return;
   }
   if(b.dataset.neoUxSimulate){
    event.preventDefault();event.stopImmediatePropagation();simulateFromHub(b.dataset.neoUxSimulate);return;
   }
   if(b.dataset.neoUxRank){
    event.preventDefault();event.stopImmediatePropagation();rankMode=b.dataset.neoUxRank;limit=30;show('ranking');return;
   }
   if(b.dataset.neoUxFilter){
    event.preventDefault();event.stopImmediatePropagation();filter=b.dataset.neoUxFilter;limit=30;show('market');return;
   }
   if(b.dataset.neoUxMore){
    event.preventDefault();event.stopImmediatePropagation();limit+=30;show('market');return;
   }
   if(b.dataset.neoUxProfile){
    event.preventDefault();event.stopImmediatePropagation();
    const key=decodeURIComponent(b.dataset.neoUxProfile),isMaster=key.endsWith('|master');
    const identity=isMaster?key.slice(0,-7):key,at=identity.lastIndexOf('|');
    if(at>=0)window.NeoMarket96?.openProfile?.(identity.slice(0,at),identity.slice(at+1),isMaster);
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
   if(active&&!simulating&&current!==lastToken)show(active);
  };
  window.addEventListener('neo:league-progress',event=>{
   if(!simulating||active!=='championship')return;
   const notice=$('neo-ux-sim-progress');
   if(notice)notice.textContent='⏳ Rodada '+(event.detail?.round||'?')+' · '+(event.detail?.played||0)+' jogos salvos na temporada...';
  });
  setInterval(refresh,3800);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)show(active)});
  window.NeoMobileHub={show,close,market,championship,rankingHtml};
 }
 function ready(){
  if(!window.NeoReferenceMobile){setTimeout(ready,90);return;}
  boot();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
