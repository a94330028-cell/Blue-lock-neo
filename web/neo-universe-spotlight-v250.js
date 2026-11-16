/* Blue Lock NEO — Live Universe presentation (41–55 + ranking V10)
 * The ONLY player pictures are obtained from the existing NeoPortraitUI bridge.
 * Awards, wins, rivals and trophies are never guessed or generated.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const num=x=>Number.isFinite(+x)?+x:0;
function finished(season){
 const games=(season?.rounds||[]).flatMap(r=>r.games||[]);
 return !!games.length&&games.every(g=>Array.isArray(g.result)&&g.result.length===2&&
  g.result.every(s=>Number.isInteger(s)&&s>=0)&&Array.isArray(g.details?.players));
}
function identity(p){return String(p?.name||'')+'|'+String(p?.club||'');}
function seasonSummary(engine,season){
 if(!engine||!season)return {players:[],matches:[],leaders:[],finished:false,awards:[],hall:[],rivals:[],scouts:[]};
 const stored=season.career?.neoLegacy||{},players=Object.values(stored.players||{}).filter(p=>p.games>0)
  .sort((a,b)=>(num(b.ratingSum)/Math.max(1,num(b.games)))-(num(a.ratingSum)/Math.max(1,num(a.games)))||
   num(b.goals)-num(a.goals)||String(a.name).localeCompare(String(b.name)));
 const leaders=(engine.Progression?.rank?.(season)||[]).filter(p=>num(p.games)>0)
   .sort((a,b)=>num(b.score)-num(a.score)||String(a.name).localeCompare(String(b.name)));
 const matches=(stored.matches||[]).slice(-16).reverse();
 const complete=finished(season);
 const rivals=Object.values(season.career?.neoWorld?.rivals||{}).filter(r=>num(r.duels)>0)
   .sort((a,b)=>num(b.duels)-num(a.duels)).slice(0,12);
 const scouts=players.filter(p=>num(p.games)>=2).slice(0,8);
 return {players,leaders,matches,finished:complete,
  awards:complete?(stored.awards||[]):[],hall:complete?(stored.hall||[]):[],
  rivals,scouts,realGames:matches.length};
}
function formula(p){
 if(!p||num(p.games)<1)return null;
 return {finisher:Math.round(num(p.goals)/p.games*100)/100,
  creator:Math.round(num(p.assists)/p.games*100)/100,
  defender:Math.round(num(p.duels)/p.games*100)/100,
  consistency:Math.round(num(p.ratingSum)/p.games*10)/10};
}
function make(doc,tag,cls,text){
 const el=doc.createElement(tag);if(cls)el.className=cls;
 if(text!==undefined)el.textContent=String(text);return el;
}
function safePortrait(win,player,cls){
 const club=win.NeoEngine?.teamById?.(player.club);
 const dom=win.document.createElement('div');
 dom.className='neo250-portrait';
 try{
  const html=win.NeoPortraitUI?.html?.(player.name,club,cls);
  if(html){dom.innerHTML=html;return dom;}
 }catch(_){}
 const missing=make(win.document,'span','neo250-no-image','Retrato indisponível');
 dom.append(missing);return dom;
}
function mount(win){
 const doc=win.document;
 if(!doc)return;
 let chosen=null;
 function renderPodium(){
  const tab=doc.getElementById('ranking'),mount=doc.getElementById('careerRankings');
  if(!tab||!mount)return;
  let host=doc.getElementById('neo250-podium');
  if(!host){
   host=make(doc,'section','neo250-podium');host.id='neo250-podium';
   // Display the upgraded podium in the real Ranking tab, never inside legacy collapsed extras.
   tab.insertBefore(host,tab.firstElementChild);
   const older=doc.getElementById('neoRankingPodium')?.closest('.card');
   if(older)older.hidden=true;
  }
  // Ranking controllers may fold legacy cards after this module mounts.
  // Keep the live podium outside any collapsed details on every refresh.
  if(host.parentElement!==tab||host.closest('details:not([open])')){
   tab.insertBefore(host,tab.firstElementChild);
  }
  host.hidden=false;
  host.classList.remove('neo950-old-ranking');
  const season=win.NeoCareerBridge?.getSeason?.();
  if(!season)return;
  const club=doc.getElementById('rankClub')?.value||'all';
  const mode=doc.getElementById('rankMode')?.value||'performance';
  host.replaceChildren();
  const title=make(doc,'h3',null,'🏆 PÓDIO NEO · TOP 3');
  host.append(title);
  if(mode!=='performance'){
   host.append(make(doc,'p','neo250-note','O pódio mostra desempenho real. Para visualizar, selecione Ranking por atuações.'));
   return;
  }
  const scores=(win.NeoEngine?.Progression?.rank?.(season,club)||[])
   .filter(p=>num(p.games)>0).sort((a,b)=>num(b.score)-num(a.score)||a.name.localeCompare(b.name)).slice(0,3);
  if(!scores.length){host.append(make(doc,'p','neo250-note','Dispute uma partida oficial para criar o pódio com estatísticas reais.'));return;}
  const board=make(doc,'div','neo250-podium-grid');
  for(const i of [1,0,2]){
   const p=scores[i];if(!p)continue;
   const card=make(doc,'button','neo250-champion neo250-position-'+(i+1));
   card.type='button';card.setAttribute('aria-label','Ver ficha de '+p.name);
   card.append(make(doc,'span','neo250-rank','#'+(i+1)),
    safePortrait(win,p,'neo250-face'),
    make(doc,'strong','neo250-player-name',p.name),
    make(doc,'span','neo250-club',win.NeoEngine?.teamById(p.club)?.short||p.club),
    make(doc,'span','neo250-stat',num(p.score).toFixed(1)+' pontos · '+p.games+' partidas'));
   card.addEventListener('click',()=>{chosen=p;showSelected();});
   board.append(card);
  }
  host.append(board);
  host.append(make(doc,'p','neo250-note','Os retratos são exclusivamente os já cadastrados no simulador. Resultados e posições vêm das partidas.'));
  const detail=make(doc,'div','neo250-player-detail');detail.id='neo250-player-detail';
  host.append(detail);
  if(chosen&&scores.some(p=>identity(p)===identity(chosen)))showSelected();
 }
 function showSelected(){
  const area=doc.getElementById('neo250-player-detail');if(!area||!chosen)return;
  const p=chosen,club=win.NeoEngine?.teamById?.(p.club);
  area.replaceChildren();
  const title=make(doc,'div','neo250-detail-head');
  title.append(safePortrait(win,p,'neo250-detail-face'));
  const data=make(doc,'div');
  data.append(make(doc,'h4',null,p.name),make(doc,'p',null,(club?.name||p.club)+' · '+(p.role||'Posição não registrada')));
  title.append(data);area.append(title);
  const stats=make(doc,'div','neo250-detail-stats');
  for(const [label,value] of [['Jogos',p.games],['Gols',p.goals],['Assistências',p.assists],
    ['Nota',num(p.score).toFixed(1)],['OVR',p.ovr??'—'],['Evolução',Object.values(p.boosts||{}).reduce((a,b)=>a+num(b),0)]]){
    const item=make(doc,'div',null);
    item.append(make(doc,'strong',null,value),make(doc,'span',null,label));stats.append(item);
  }
  area.append(stats);
  const arsenal=win.NeoEngine?.SKILLS?.[p.name]||[];
  if(arsenal.length)area.append(make(doc,'p','neo250-note','Armas registradas: '+arsenal.map(s=>s.label).join(' · ')));
  const recent=win.NeoCareerBridge?.getSeason?.()?.career?.neoLegacy?.players?.[identity(p)]?.highlights||[];
  if(recent.length)area.append(make(doc,'p','neo250-note','Histórico: '+recent.slice(-4).map(h=>'R'+h.round+' vs '+h.opponent+' ('+h.goals+' G, '+h.assists+' A)').join(' · ')));
 }
 function renderWorld(){
  const tab=doc.getElementById('records');if(!tab)return;
  let section=doc.getElementById('neo250-records');
  if(!section){
   section=make(doc,'details','neo250-records');section.id='neo250-records';
   section.append(make(doc,'summary',null,'🏟️ Universo Vivo · prêmios, fórmulas, olheiros e histórias verificadas'),
    make(doc,'div','neo250-world-body'));
   tab.append(section);
   section.addEventListener('toggle',()=>{if(section.open)renderWorld();});
  }
  if(!section.open)return;
  const season=win.NeoCareerBridge?.getSeason?.(),E=win.NeoEngine;
  const data=seasonSummary(E,season),body=section.querySelector('.neo250-world-body');
  body.replaceChildren();
  const group=(name)=>{const c=make(doc,'section','neo250-world-card');c.append(make(doc,'h4',null,name));body.append(c);return c};
  const ego=group('👑 Rei do Campo · desempenho oficial');
  if(data.leaders.length)for(const [i,p] of data.leaders.slice(0,5).entries())
   ego.append(make(doc,'p',null,(i+1)+'. '+p.name+' · '+num(p.score).toFixed(1)+' pts · '+p.games+' partidas'));
  else ego.append(make(doc,'p','neo250-note','Sem partidas registradas'));
  const awards=group('🏅 Prêmios e Hall da Fama');
  if(data.finished){
   for(const a of data.awards)awards.append(make(doc,'p',null,a.title+' — '+a.name+' ('+a.club+')'));
   for(const h of data.hall)awards.append(make(doc,'p',null,'🏆 '+h.winner+' · '+h.proof));
  }else awards.append(make(doc,'p','neo250-note','Prêmios definitivos apenas quando toda a temporada for concluída.'));
  const timeline=group('📜 Histórias emergentes · partidas reais');
  for(const g of data.matches.slice(0,6)){
   timeline.append(make(doc,'p',null,'R'+g.round+' · '+g.home.toUpperCase()+' '+g.score.join(' × ')+' '+g.away.toUpperCase()+
    (g.mvp?' · MVP '+g.mvp.name:'')));
  }
  if(!data.matches.length)timeline.append(make(doc,'p','neo250-note','O histórico será criado após partidas oficiais.'));
  const scout=group('🔭 Olheiros e fórmula de gol');
  for(const p of data.scouts.slice(0,6)){
   const f=formula(p);
   scout.append(make(doc,'p',null,p.name+' · '+p.club.toUpperCase()+' · '+f.finisher+' G/jogo · '+f.creator+' A/jogo · média '+f.consistency));
  }
  if(!data.scouts.length)scout.append(make(doc,'p','neo250-note','Olheiros exigem pelo menos dois jogos por atleta.'));
  const rivals=group('🔥 Rivalidades · níveis reais');
  for(const r of data.rivals.slice(0,6))rivals.append(make(doc,'p',null,
   (r.names||[]).join(' × ')+' · '+r.duels+' duelos · nível '+r.level));
  if(!data.rivals.length)rivals.append(make(doc,'p','neo250-note','Ainda não houve rivalidades registradas.'));
  const encyclopedia=group('📚 Enciclopédia de Egoístas');
  for(const p of data.players.slice(0,7))encyclopedia.append(make(doc,'p',null,p.name+' ('+p.club+') · '+p.games+' J · '+p.goals+' G · '+p.assists+' A'));
  if(!data.players.length)encyclopedia.append(make(doc,'p','neo250-note','Dados disponíveis após partidas verificadas.'));
 }
 function boot(){
  if(!doc.getElementById('ranking'))return;
  renderPodium();renderWorld();
  doc.addEventListener('click',event=>{
   if(event.target.closest?.('[data-tab="ranking"]'))win.setTimeout(renderPodium,70);
   if(event.target.closest?.('[data-tab="records"]'))win.setTimeout(renderWorld,70);
  });
  for(const id of ['rankClub','rankMode'])doc.getElementById(id)?.addEventListener('change',()=>win.setTimeout(renderPodium,0));
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {finished,identity,seasonSummary,formula,mount};
});