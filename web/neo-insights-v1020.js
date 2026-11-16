/* NEO 10.2 — real match dossiers, shot map and Hall of Fame.
   No random/predicted statistics: reads existing saved league & cup fixtures only. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root?.document){root.NeoInsights1020=api;api.mount(root);}})(typeof window!=='undefined'?window:null,function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=s=>Number.isFinite(Number(s))?Math.max(0,Number(s)):0;
const KEY='neo-hall-of-fame-v1020';
function completedFixtures(season,cups=[]){
 const rows=[];
 for(const round of season?.rounds||[])for(const f of round.games||[])if(Array.isArray(f.result)&&f.details?.players)
  rows.push({source:'Liga NEO',round:num(round.round),home:f.home,away:f.away,result:f.result,details:f.details});
 for(const cup of cups||[])for(const round of cup.rounds||[])for(const f of round.games||[])if(Array.isArray(f.result)&&f.details?.players)
  rows.push({source:cup.name||'Copa',round:num(round.round),home:f.home,away:f.away,result:f.result,details:f.details});
 return rows;
}
function players(fixtures){
 const names=new Map();
 for(const game of fixtures)for(const p of game.details?.players||[]){
  if(!p?.name||p.isMaster)continue;
  const club=p.side===0?game.home:game.away,k=p.name+'|'+club;
  if(!names.has(k))names.set(k,{name:p.name,club});
 }
 return [...names.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')||a.club.localeCompare(b.club));
}
function dossier(fixtures,name,club){
 const games=[],shots=[];
 for(const fixture of fixtures){
  const side=fixture.home===club?0:fixture.away===club?1:-1;if(side<0)continue;
  const player=fixture.details?.players?.find(p=>p.name===name&&p.side===side);
  if(!player)continue;
  games.push({source:fixture.source,round:fixture.round,opponent:side===0?fixture.away:fixture.home,side,score:fixture.result,
   goals:num(player.goals),assists:num(player.assists),shots:num(player.shots),passes:num(player.passes??player.pases),
   tackles:num(player.tackles),interceptions:num(player.interceptions),blocks:num(player.shotBlocks),
   dribbles:num(player.dribblesWon),saves:num(player.saves),rating:num(player.rating),role:player.role||'JOG'});
  for(const s of fixture.details?.shots||[]){
   if(s.shooter!==name||s.side!==side||!Number.isFinite(Number(s.x))||!Number.isFinite(Number(s.y)))continue;
   shots.push({x:Math.max(73,Math.min(1847,side===0?Number(s.x):1920-Number(s.x))),
    y:Math.max(59,Math.min(1093,side===0?Number(s.y):1152-Number(s.y))),outcome:s.outcome||'unknown',
    minute:num(s.minute),source:fixture.source});
  }
 }
 const total=(key)=>games.reduce((n,g)=>n+num(g[key]),0);
 return {name,club,games,shots,totals:Object.fromEntries(['goals','assists','shots','passes','tackles','interceptions','blocks','dribbles','saves'].map(k=>[k,total(k)])),
  avgRating:games.length?games.reduce((n,g)=>n+g.rating,0)/games.length:0};
}
function champion(season,engine){
 const rounds=season?.rounds||[];
 if(!rounds.length||!rounds.every(r=>r.games?.length&&r.games.every(g=>Array.isArray(g.result))))return null;
 const table=engine?.standings?.(season);if(!table?.length)return null;
 const top=table[0],mvp=engine?.Progression?.mvpRanking?.(season,1)?.[0];
 return {name:top.team.name,club:top.team.id,points:top.PTS,played:top.J,rounds:rounds.length,
  winner:mvp?.name||null,finishedAt:new Date().toISOString(),key:rounds.length+'|'+rounds.map(r=>r.games.map(g=>g.result.join('-')).join(';')).join('|')};
}
function readHall(storage){try{const h=JSON.parse(storage.getItem(KEY)||'[]');return Array.isArray(h)?h.filter(x=>x?.key&&x.name).slice(0,20):[];}catch(_){return [];}}
function archiveHall(storage,data){
 if(!data)return readHall(storage);
 const records=readHall(storage);if(!records.some(x=>x.key===data.key)){records.unshift(data);try{storage.setItem(KEY,JSON.stringify(records.slice(0,20)));}catch(_){}}
 return records;
}
function mount(win){
 const doc=win.document,engine=win.NeoEngine;if(!doc||!engine)return;
 const $=id=>doc.getElementById(id);
 const css=doc.createElement('style');css.id='neo1020-css';
 css.textContent='.neo1020-panel{padding:13px;margin:12px 0;background:linear-gradient(135deg,#102942,#0c1d32);border:1px solid #426489;border-radius:14px;color:#e9f4ff}.neo1020-panel h3{margin:0 0 8px;color:#ffe0a3;font-size:15px}.neo1020-panel p,.neo1020-note{font-size:11px;color:#a9c8de;line-height:1.5}.neo1020-search{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0}.neo1020-search input,.neo1020-search select{color:#eaf7ff;background:#102b46;border:1px solid #416180;border-radius:9px;padding:9px;min-width:0;flex:1 1 150px}.neo1020-statgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.neo1020-stat{border-radius:10px;background:#163653;padding:8px;text-align:center;font-size:10px}.neo1020-stat b{display:block;font-size:15px;color:#fff}.neo1020-game{padding:8px 0;border-bottom:1px solid #294a68;font-size:11px}.neo1020-shotmap{width:100%;max-width:450px;aspect-ratio:16/9;border-radius:11px;border:1px solid #396383;background:#0f453b;display:block}.neo1020-hall{padding:10px;border:1px solid #604c2a;background:#1b2d42;border-radius:10px;margin-top:7px;color:#ffe2a6;font-size:12px}@media(max-width:560px){.neo1020-panel{padding:9px}.neo1020-search{flex-direction:column}.neo1020-statgrid{grid-template-columns:repeat(3,minmax(0,1fr))}}';
 doc.head.append(css);
 function season(){try{return JSON.parse(win.localStorage.getItem('neo-season-v2')||'null')}catch(_){return null}}
 function cups(){try{return win.NeoCups970?.safeLoad?.(win.localStorage)||[]}catch(_){return []}}
 function renderHall(){
  const root=$('league');if(!root)return;
  let el=$('neo1020-hall');
  if(!el){el=doc.createElement('section');el.id='neo1020-hall';el.className='neo1020-panel';root.append(el);}
  const rows=archiveHall(win.localStorage,champion(season(),engine));
  const signature=rows.map(x=>x.key).join(':');if(el.dataset.signature===signature)return;el.dataset.signature=signature;
  el.innerHTML='<h3>🏛️ Hall da Fama</h3><p>Campeões de temporadas integralmente concluídas no simulador. Nenhum campeão é escolhido antecipadamente.</p>'+
   (rows.length?rows.map((x,i)=>'<div class="neo1020-hall">🏆 '+esc(x.name)+' · '+x.points+' pontos · '+x.played+' partidas'+(x.winner?' · MVP: '+esc(x.winner):'')+'</div>').join(''):'<p>Nenhuma temporada foi concluída ainda.</p>');
 }
 function renderDossier(){
  const root=$('records');if(!root)return;
  let panel=$('neo1020-stats');
  if(!panel){
   panel=doc.createElement('section');panel.id='neo1020-stats';panel.className='neo1020-panel';
   panel.innerHTML='<h3>📊 Raio-X de Jogadores</h3><p>Ficha detalhada por atleta com números reais de liga e copas. Apenas finalizações com coordenadas gravadas aparecem no mapa.</p>'+
    '<div class="neo1020-search"><input type="search" id="neo1020-search" placeholder="Pesquisar jogador" aria-label="Pesquisar jogador"><select id="neo1020-player" aria-label="Escolher jogador"></select></div><div id="neo1020-report"></div>';
   root.append(panel);
   $('neo1020-search').addEventListener('input',()=>fillList());
   $('neo1020-player').addEventListener('change',()=>show());
  }
  const current=panel.dataset.matches||'',all=completedFixtures(season(),cups());
  const signature=all.length+'|'+all.map(x=>x.home+x.away+x.round+x.result.join('-')).join(',');
  if(current===signature)return;panel.dataset.matches=signature;
  panel._games=all;fillList();
 }
 function fillList(){
  const panel=$('neo1020-stats'),select=$('neo1020-player');if(!panel||!select)return;
  const q=($('neo1020-search')?.value||'').toLocaleLowerCase('pt-BR');
  const names=players(panel._games||[]).filter(x=>x.name.toLocaleLowerCase('pt-BR').includes(q)).slice(0,500);
  const before=select.value;
  select.innerHTML=names.map(x=>'<option value="'+esc(x.name+'|'+x.club)+'">'+esc(x.name)+' · '+esc(engine.teamById(x.club)?.short||x.club)+'</option>').join('');
  if(names.some(x=>x.name+'|'+x.club===before))select.value=before;
  show();
 }
 function shotMap(shots){
  if(!shots.length)return '<p class="neo1020-note">Mapa de finalizações indisponível: não há coordenadas gravadas nas súmulas deste jogador.</p>';
  const dots=shots.slice(-90).map(s=>{
   const x=18+(s.x-73)/(1847-73)*410,y=15+(s.y-59)/(1093-59)*226;
   const fill=s.outcome==='goal'?'#ffe07d':s.outcome==='saved'?'#91d6ff':'#ffffff';
   return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4.2" fill="'+fill+'" stroke="#0c273a" stroke-width="1"><title>'+esc(s.outcome)+' · '+s.minute+"'"+'</title></circle>';
  }).join('');
  return '<svg class="neo1020-shotmap" role="img" aria-label="Mapa de '+shots.length+' finalizações registradas" viewBox="0 0 448 255" xmlns="http://www.w3.org/2000/svg">'+
   '<rect x="18" y="15" width="410" height="226" rx="2" fill="#164c3d" stroke="#d8f0e5" stroke-width="2" />'+
   '<path d="M223 15V241M18 128H428" stroke="#d4ece5" opacity=".65"/><circle cx="223" cy="128" r="37" fill="none" stroke="#d4ece5"/>'+
   '<rect x="355" y="70" width="73" height="116" fill="none" stroke="#d4ece5" stroke-width="2"/>'+
   '<rect x="403" y="104" width="25" height="48" fill="none" stroke="#d4ece5" stroke-width="2"/>'+dots+'</svg>'+
   '<p class="neo1020-note">Direção do ataque: da esquerda para a direita. Amarelo: gol · Azul: defesa · Branco: outros desfechos.</p>';
 }
 function show(){
  const report=$('neo1020-report'),selected=$('neo1020-player')?.value;if(!report)return;
  if(!selected){report.textContent='Conclua partidas para visualizar os jogadores.';return;}
  const index=selected.lastIndexOf('|'),d=dossier($('neo1020-stats')._games,selected.slice(0,index),selected.slice(index+1));
  const metrics=[['Jogos',d.games.length],['Gols',d.totals.goals],['Assistências',d.totals.assists],['Chutes',d.totals.shots],['Passes',d.totals.passes],['Dribles',d.totals.dribbles],['Desarmes',d.totals.tackles],['Interceptações',d.totals.interceptions],['Defesas',d.totals.saves],['Nota média',d.avgRating.toFixed(2)]];
  report.innerHTML='<p><b>'+esc(d.name)+'</b> · '+esc(engine.teamById(d.club)?.name||d.club)+'</p><div class="neo1020-statgrid">'+
   metrics.map(([k,v])=>'<div class="neo1020-stat"><b>'+v+'</b>'+esc(k)+'</div>').join('')+'</div>'+
   '<details><summary>📍 Mapa de finalizações ('+d.shots.length+')</summary>'+shotMap(d.shots)+'</details>'+
   '<details><summary>📅 Histórico de jogos ('+d.games.length+')</summary>'+d.games.slice(-20).reverse().map(g=>'<div class="neo1020-game">'+esc(g.source)+' · rodada '+g.round+' · '+esc(engine.teamById(g.opponent)?.short||g.opponent)+' · '+g.score.join(' × ')+' · '+g.goals+'G '+g.assists+'A · '+g.tackles+' desarmes · nota '+g.rating.toFixed(1)+'</div>').join('')+'</details>';
 }
 function boot(){renderDossier();renderHall();
  doc.addEventListener('click',e=>{
   if(e.target.closest('[data-tab="records"],[data-neo-tab="records"]'))win.setTimeout(renderDossier,120);
   if(e.target.closest('[data-tab="league"],[data-neo-tab="league"]'))win.setTimeout(renderHall,120);
  });
  win.setInterval(()=>{if(doc.querySelector('.nav button[data-tab="records"].active'))renderDossier();if(doc.querySelector('.nav button[data-tab="league"].active'))renderHall();},7000);
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {KEY,completedFixtures,players,dossier,champion,readHall,archiveHall,mount};
});