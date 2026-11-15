/* Blue Lock NEO 9.0 — enhancement of the v8.9 game. All analytics derive from recorded fixtures. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const E=window.NeoEngine;
const ST='neo-ego90-cinema';
const team=id=>E?.TEAMS?.find(t=>t.id===id)?.short||id||'—';
const nameId=k=>String(k).split('|')[0]||'—';
const n=v=>Number(v)||0;
const stored=()=>{try{const s=JSON.parse(localStorage.getItem('neo-season-v2'));return s?.schema===2&&Array.isArray(s.rounds)?s:null;}catch(_){return null;}};
function fixtureList(s){return (s?.rounds||[]).flatMap(r=>(r.games||[]).filter(g=>Array.isArray(g.result)).map(g=>({round:r.round||0,...g}))).sort((a,b)=>a.round-b.round);}
function recordSeason(){
 const s=stored(), games=fixtureList(s);if(!s)return {s:null,games:[],records:[],moments:[]};
 const records=[];const put=(title,value,who,context,icon)=>{if(value!==undefined&&value!==null)records.push({title,value,who,context,icon});};
 for(const [k,title,icon] of [['scorers','Maior artilheiro','⚽'],['assists','Líder de assistências','🎯']]){
  const top=Object.entries(s[k]||{}).sort((a,b)=>n(b[1])-n(a[1]))[0];if(top&&n(top[1])>0)put(title,n(top[1]),`${nameId(top[0])} · ${team(String(top[0]).split('|').at(-1))}`,'Temporada atual',icon);
 }
 let mostGoals=null,mostAssists=null,mostSaves=null,fastest=null,largeWin=null,manyGoals=null;
 let highestShots=null;const streaks=Object.create(null),cleanSheets=Object.create(null),current=Object.create(null);
 const moments=[];
 for(const f of games){
  const d=f.details||{}, score=f.result||[0,0],sum=n(score[0])+n(score[1]),margin=Math.abs(n(score[0])-n(score[1])),clubA=team(f.home),clubB=team(f.away);
  const entry={round:f.round,home:f.home,away:f.away,score:score.slice(0,2)};
  if(!manyGoals||sum>manyGoals.count)manyGoals={...entry,count:sum};
  if(!largeWin||margin>largeWin.count)largeWin={...entry,count:margin};
  if(d.stats?.shots){const shots=n(d.stats.shots[0])+n(d.stats.shots[1]);if(!highestShots||shots>highestShots.count)highestShots={...entry,count:shots};}
  for(const [side,club] of [[0,f.home],[1,f.away]]){
   const gs=n(score[side]),gc=n(score[1-side]);if(gs>gc){current[club]=(current[club]||0)+1;const old=streaks[club]||0;streaks[club]=Math.max(old,current[club]);}else current[club]=0;
   if(gc===0)cleanSheets[club]=(cleanSheets[club]||0)+1;
  }
  for(const p of d.players||[]){
   const side=n(p.side),club=side===0?clubA:clubB;
   for(const [prop,key] of [['goals','mostGoals'],['assists','mostAssists'],['saves','mostSaves']]){
    const val=n(p[prop]);let old=({mostGoals,mostAssists,mostSaves})[key];
    if(val>0&&(!old||val>old.count)){
     const next={count:val,player:p.name,club,round:f.round};
     if(key==='mostGoals')mostGoals=next;else if(key==='mostAssists')mostAssists=next;else mostSaves=next;
    }
   }
  }
  for(const g of d.goalRecords||[]){
   const minute=n(g.minute);if(minute>0&&(!fastest||minute<fastest.minute))fastest={minute,player:g.scorer,round:f.round};
   if(g.legendary){moments.push({...entry,kind:'🌟 Gol lendário',description:`${g.scorer} marcou aos ${minute}'`,minute,weight:95});}
   else if(g.goalType==='acrobatic'||g.goalType==='first-time')moments.push({...entry,kind:'⚡ Gol especial',description:`${g.scorer} marcou aos ${minute}' (${g.goalType==='acrobatic'?'acrobático':'de primeira'})`,minute,weight:66});
  }
  for(const m of d.specialMoments||[]){
   if(!m?.description)continue;
   moments.push({...entry,kind:m.type==='save'?'🧤 Defesa memorável':m.type==='duel'?'⚔️ Duelo':m.type==='legend'?'🌟 Jogada lendária':'🔥 Momento especial',description:String(m.description).replace(/<[^>]*>/g,''),minute:n(m.minute)||Math.floor(n(m.time)/60),weight:m.type==='legend'?91:m.type==='save'?80:55});
  }
 }
 if(mostGoals)put('Mais gols em um jogo',mostGoals.count,`${mostGoals.player} · ${mostGoals.club}`,`Rodada ${mostGoals.round}`,'🎩');
 if(mostAssists)put('Mais assistências em um jogo',mostAssists.count,`${mostAssists.player} · ${mostAssists.club}`,`Rodada ${mostAssists.round}`,'🪄');
 if(mostSaves)put('Mais defesas em um jogo',mostSaves.count,`${mostSaves.player} · ${mostSaves.club}`,`Rodada ${mostSaves.round}`,'🧤');
 if(fastest)put('Gol mais rápido',`${fastest.minute}'`,fastest.player,`Rodada ${fastest.round}`,'⏱️');
 if(largeWin&&largeWin.count>0)put('Maior goleada',`${largeWin.count} gols`,`${team(largeWin.home)} ${largeWin.score.join(' × ')} ${team(largeWin.away)}`,`Rodada ${largeWin.round}`,'🏟️');
 if(manyGoals&&manyGoals.count>0)put('Jogo com mais gols',manyGoals.count,`${team(manyGoals.home)} ${manyGoals.score.join(' × ')} ${team(manyGoals.away)}`,`Rodada ${manyGoals.round}`,'🔥');
 const leader=Object.entries(streaks).sort((a,b)=>b[1]-a[1])[0];if(leader&&leader[1]>0)put('Maior sequência de vitórias',leader[1],team(leader[0]),'Temporada atual','📈');
 const clean=Object.entries(cleanSheets).sort((a,b)=>b[1]-a[1])[0];if(clean&&clean[1]>0)put('Mais jogos sem sofrer gols',clean[1],team(clean[0]),'Temporada atual','🛡️');
 if(highestShots&&highestShots.count>0)put('Mais finalizações em um jogo',highestShots.count,`${team(highestShots.home)} × ${team(highestShots.away)}`,`Rodada ${highestShots.round}`,'🎯');
 return {s,games,records,moments:moments.sort((a,b)=>b.weight-a.weight||b.round-a.round).slice(0,40)};
}
const recordCard=x=>`<article class="neo-record-tile"><span class="neo-record-icon">${esc(x.icon)}</span><div><small>${esc(x.title)}</small><strong>${esc(x.value)}</strong><b>${esc(x.who)}</b><em>${esc(x.context)}</em></div></article>`;
function renderRecords(){
 const target=$('neoHistoricalRecords');if(!target)return;
 const {s,games,records,moments}=recordSeason();
 const cnt=$('neoRecordCounter');if(cnt)cnt.textContent=games.length+' partidas registradas';
 target.innerHTML=records.length?records.map(recordCard).join(''):'<p class="hint">Ainda não há recordes desta temporada. Jogue ou simule partidas oficiais para gerar dados reais.</p>';
 const box=$('neoLegendaryMoments');if(box)box.innerHTML=moments.length?moments.slice(0,18).map(m=>`<article class="neo-moment"><span>${esc(m.kind)}</span><strong>${esc(m.description)}</strong><small>Rodada ${m.round} · ${esc(team(m.home))} ${m.score.join(' × ')} ${esc(team(m.away))}${m.minute?` · ${m.minute}'`:''}</small></article>`).join(''):'<p class="hint">Os momentos especiais aparecerão aqui quando forem registrados no motor da partida.</p>';
 const prev=$('neoSeasonNote');if(prev)prev.textContent=(s?.pastSeasons?.length||0)?'Recordes calculados a partir das partidas detalhadas preservadas na temporada atual. Temporadas antigas resumidas não têm todos os lances.':'Recordes calculados exclusivamente com os jogos salvos da temporada atual.';
}
function renderPodium(){
 const slot=$('neoRankingPodium');if(!slot||!E?.Progression)return;
 const s=stored();if(!s){slot.innerHTML='<p class="hint">Ainda não há temporada salva.</p>';return;}
 const mode=$('rankMode')?.value;if(mode&&mode!=='performance'){slot.innerHTML='<p class="hint">Pódio calculado com desempenho competitivo. Selecione “Desempenho competitivo” para comparar atuações reais.</p>';return;}
 let ranked=[];try{ranked=E.Progression.rank(s,$('rankClub')?.value||'all')||[];}catch(_){ranked=[];}
 ranked=ranked.filter(p=>n(p.games)>0).slice(0,3);
 slot.innerHTML=ranked.length?ranked.map((p,i)=>`<article class="neo-podium neo-podium-${i+1}"><span class="neo-place">${['🥇','🥈','🥉'][i]}</span><strong>${esc(p.name)}</strong><small>${esc(team(p.club))} · ${esc(p.role||'Atleta')}</small><b>${n(p.score).toFixed(1)} pontos</b><em>${n(p.games)} partidas</em></article>`).join(''):'<p class="hint">O pódio aparecerá após partidas oficiais com atuações registradas.</p>';
}
function setupNavigation(){
 for(const [id,text] of [['match','🎮 Jogar'],['league','🏆 Liga'],['records','📜 Recordes'],['ranking','👑 Ranking'],['squads','👥 Jogadores']]){
  const b=document.querySelector(`.nav button[data-tab="${id}"]`);if(b)b.textContent=text;
 }
 const h=$('records')?.querySelector('.records-hero h2');if(h)h.textContent='📜 Recordes & História';
 const r=$('ranking')?.querySelector('.hero-card h2');if(r)r.textContent='👑 Ranking Competitivo';
 document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-neo-open]');if(btn){const b=document.querySelector(`.nav [data-tab="${btn.dataset.neoOpen}"]`);b?.click();}
  const tab=e.target.closest('[data-tab]');if(tab){if(['records','ranking'].includes(tab.dataset.tab))requestAnimationFrame(()=>{renderRecords();renderPodium();});}
 });
 $('rankClub')?.addEventListener('change',renderPodium);$('rankMode')?.addEventListener('change',renderPodium);
 $('simulateRound')?.addEventListener('click',()=>setTimeout(()=>{renderRecords();renderPodium();},300));
 $('simulateSeason')?.addEventListener('click',()=>setTimeout(()=>{renderRecords();renderPodium();},300));
 $('newSeason')?.addEventListener('click',()=>setTimeout(()=>{renderRecords();renderPodium();},200));
 $('restoreSeasonFile')?.addEventListener('change',()=>setTimeout(()=>{renderRecords();renderPodium();},500));
}
let alertTimeout=null,lastAlert='';
function updateAlert(){
 const event=$('events')?.querySelector('.event'),message=event?.textContent?.replace(/\s+/g,' ').trim()||'';
 const area=$('neoMatchAlert');if(!area||!message||message===lastAlert)return;
 lastAlert=message;
 const match=message.match(/(travess[aã]o|na trave|rente à trave|QUASE GOL|espalma|defesa|defende|KAISER IMPACT|FLOW|dribl|duelo|GOOO+L|GOLAÇO|intercept)/i);
 if(!match)return;
 const mode=localStorage.getItem(ST)||'normal';if(mode==='off')return;
 area.textContent=message.slice(0,180);
 area.dataset.kind=/QUASE GOL|rente à trave/i.test(message)?'near':/travess[aã]o|na trave|espalma|defesa|defende/i.test(message)?'save':/gol|golaço/i.test(message)?'goal':'play';
 area.classList.add('neo-show');clearTimeout(alertTimeout);alertTimeout=setTimeout(()=>area.classList.remove('neo-show'),mode==='cinematic'?5000:3000);
}
function setupBroadcast(){
 const area=$('neoMatchAlert');if(!area)return;
 const events=$('events');if(events){const obs=new MutationObserver(updateAlert);obs.observe(events,{childList:true,subtree:true,characterData:true});}
 $('neoCinemaMode')?.addEventListener('change',e=>{try{localStorage.setItem(ST,e.target.value);}catch(_){}});
 try{$('neoCinemaMode').value=localStorage.getItem(ST)||'normal';}catch(_){}
 // Actual match events only: never create synthetic goals, saves or shots.
}
function setup(){setupNavigation();setupBroadcast();renderRecords();renderPodium();document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderRecords();renderPodium();}});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
