/* Blue Lock NEO 9.1 — match-derived Chronicle, awards, challenges and shot analysis.
   Never creates fictitious fixtures or replaces the existing engine. */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.NeoChronicle=api;})(typeof window!=='undefined'?window:undefined,function(){
'use strict';
const n=x=>Number.isFinite(Number(x))?Number(x):0;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labelId=id=>typeof window!=='undefined'?(window.NeoEngine?.teamById?.(id)?.short||String(id)):String(id);
const playerKey=p=>String(p?.name||'')+'|'+String(p?.club||'');
const isGK=p=>/^(GK|GOL)$/i.test(p?.role||'');
const isDef=p=>/^(ZAG|CB|LD|LE|RB|LB|VOL|CDM|ALA|LWB|RWB)$/i.test(p?.role||'');
const isAttack=p=>/^(ST|CA|CF|ATA|RW|LW|PD|PE|SA|AT)$/i.test(p?.role||'');
function fixtures(s){return (s?.rounds||[]).flatMap(round=>(round.games||[]).filter(f=>Array.isArray(f.result)&&f.result.length===2).map(f=>({...f,round:n(round.round)}))).sort((a,b)=>a.round-b.round);}
function performances(s){
 const participants=new Set((s?.rounds||[]).flatMap(r=>r.games||[]).flatMap(g=>[g.home,g.away]));
 const regular=Object.values(s?.career?.players||{}).filter(p=>p&&n(p.games)>0&&!p.isMaster);
 // Masters have an independent, fixture-verified ledger: include their real
 // appearances in awards without giving them imaginary full-match minutes.
 const masters=Object.values(s?.career?.masterBids||{}).filter(p=>p?.isMaster&&n(p.games)>0&&participants.has(p.club));
 return regular.concat(masters).map(p=>({...p,impact:n(p.score)||n(p.goals)*3.1+n(p.assists)*2.4+n(p.tackles)*.3+n(p.passes)*.02,
  average:n(p.ratingSum)/Math.max(1,n(p.games))}));
}
function totals(s){const games=fixtures(s), all=s?.rounds?.flatMap(r=>r.games||[])||[];
 const data={games,scheduled:all.length,played:games.length,goals:0,shots:0,shotsOn:0,saves:0,xg:0,shutouts:0,abilityUses:0,leader:null};
 for(const f of games){data.goals+=n(f.result[0])+n(f.result[1]);const st=f.details?.stats||{};
  data.shots+=n(st.shots?.[0])+n(st.shots?.[1]);data.shotsOn+=n(st.onTarget?.[0])+n(st.onTarget?.[1]);
  data.saves+=n(st.saves?.[0])+n(st.saves?.[1]);data.xg+=n(st.xg?.[0])+n(st.xg?.[1]);
  data.abilityUses+=n(st.abilityActivations?.[0])+n(st.abilityActivations?.[1]);
  data.shutouts+=(n(f.result[0])===0?1:0)+(n(f.result[1])===0?1:0);
 }
 return data;
}
const awardsConfig=[
 {key:'mvp',icon:'👑',title:'MVP da temporada',eligible:p=>true,score:p=>n(p.impact)/Math.sqrt(Math.max(1,n(p.games)))+Math.min(4,n(p.average))*.16},
 {key:'forward',icon:'⚽',title:'Melhor atacante',eligible:isAttack,score:p=>n(p.goals)*3+n(p.assists)*1.2+n(p.average)*n(p.games)*.12},
 {key:'creator',icon:'🎯',title:'Melhor criador',eligible:p=>!isGK(p)&&!isDef(p),score:p=>n(p.assists)*3+n(p.passes)*.025+n(p.average)*n(p.games)*.1},
 {key:'defender',icon:'🛡️',title:'Melhor defensor',eligible:isDef,score:p=>n(p.tackles)*1.6+n(p.cleanSheets)*2+n(p.average)*n(p.games)*.10},
 {key:'keeper',icon:'🧤',title:'Melhor goleiro',eligible:isGK,score:p=>n(p.saves)*1.2+n(p.cleanSheets)*3+n(p.average)*n(p.games)*.12},
 {key:'goals',icon:'🥇',title:'Artilheiro',eligible:p=>!isGK(p),score:p=>n(p.goals)},
 {key:'assists',icon:'🪄',title:'Líder de assistências',eligible:p=>true,score:p=>n(p.assists)},
 {key:'reveal',icon:'🌠',title:'Maior crescimento competitivo',eligible:p=>!p.isMaster&&n(p.games)>=2,score:p=>n(p.history?.slice(-3).reduce((a,h)=>a+n(h.impact),0))},
];
function awards(s){const people=performances(s), completed=fixtures(s).length>0&&fixtures(s).length===(s?.rounds||[]).reduce((a,r)=>a+(r.games?.length||0),0);
 return awardsConfig.map(category=>{
  const eligible=people.filter(category.eligible).filter(p=>category.key!=='reveal'||n(p.games)>=2);
  eligible.sort((a,b)=>category.score(b)-category.score(a)||n(b.games)-n(a.games)||String(a.name).localeCompare(String(b.name)));
  const winner=eligible[0];return {...category,winner:winner?{name:winner.name,club:winner.club,role:winner.role,played:winner.games,score:category.score(winner),goals:n(winner.goals),assists:n(winner.assists),saves:n(winner.saves)}:null,provisional:!completed};
 });
}
function challenges(s){const games=fixtures(s),goalLog=s?.goalLog||[],progress=Object.create(null);
 const cap=(id,value)=>progress[id]=Math.max(0,n(value));
 cap('first',games.filter(g=>n(g.result[0])!==n(g.result[1])).length);
 cap('clean',games.filter(g=>n(g.result[0])===0||n(g.result[1])===0).length);
 cap('goal3',games.filter(g=>n(g.result[0])+n(g.result[1])>=3).length);
 cap('goalDifferent',games.filter(g=>{
  const names=new Set(goalLog.filter(x=>x.round===g.round&&x.home===g.home&&x.away===g.away).map(x=>x.scorer+'|'+x.team));return names.size>=3;
 }).length);
 cap('shot10',games.filter(g=>n(g.details?.stats?.shots?.[0])+n(g.details?.stats?.shots?.[1])>=10).length);
 cap('save5',games.filter(g=>(g.details?.players||[]).some(p=>n(p.saves)>=5)).length);
 cap('hat',games.filter(g=>(g.details?.players||[]).some(p=>n(p.goals)>=3)).length);
 cap('master',games.filter(g=>(g.details?.masterEntries||[]).length>0).length);
 cap('skill',games.reduce((a,g)=>a+n(g.details?.stats?.abilityActivations?.[0])+n(g.details?.stats?.abilityActivations?.[1]),0));
 cap('champion',games.length>0&&games.length===n(s?.rounds?.reduce((a,r)=>a+(r.games||[]).length,0))?1:0);
 return [
  ['first','Primeira decisão','Registre uma partida com vencedor',1,'🏁'],
  ['clean','Muralha defensiva','Registre 3 partidas com pelo menos um time sem sofrer gols',3,'🧤'],
  ['goal3','Gols em campo','Registre 5 partidas com pelo menos 3 gols',5,'⚽'],
  ['goalDifferent','Artilharia coletiva','Registre uma partida com 3 artilheiros diferentes',1,'🤝'],
  ['shot10','Ataque insistente','Registre 3 partidas com pelo menos 10 finalizações',3,'🎯'],
  ['save5','Herói improvável','Registre uma partida com 5 defesas do mesmo goleiro',1,'🛡️'],
  ['hat','Hat-trick','Registre um jogador com 3 gols em uma partida',1,'🎩'],
  ['master','Master em campo','Registre uma participação de Master',1,'🌟'],
  ['skill','Arsenal em ação','Registre 25 ativações de habilidades',25,'✦'],
  ['champion','Temporada concluída','Termine todas as partidas da temporada',1,'🏆']
 ].map(([id,title,description,goal,icon])=>({id,title,description,goal,icon,current:Math.min(goal,progress[id]),done:progress[id]>=goal}));
}
function shotHighlights(s){return fixtures(s).flatMap(f=>(f.details?.shots||[]).filter(x=>x&&typeof x==='object'&&!x.goal).map(x=>({...x,home:f.home,away:f.away,round:f.round,matchScore:f.result}))).filter(x=>n(x.xg)>=.23).sort((a,b)=>n(b.xg)-n(a.xg)||b.round-a.round).slice(0,16);}
function news(s){const games=fixtures(s),items=[];
 for(const f of games.slice(-18).reverse()){
  const a=n(f.result[0]),b=n(f.result[1]),base={round:f.round,home:f.home,away:f.away};
  if(Math.abs(a-b)>=3)items.push({...base,icon:'🔥',text:`${a>b?labelId(f.home):labelId(f.away)} venceu ${a>b?labelId(f.away):labelId(f.home)} por ${Math.max(a,b)} a ${Math.min(a,b)} na rodada ${f.round}.`});
  else if(a===b)items.push({...base,icon:'⚖️',text:`${labelId(f.home)} e ${labelId(f.away)} empataram em ${a} a ${b}.`});
  else items.push({...base,icon:'⚽',text:`${a>b?labelId(f.home):labelId(f.away)} venceu por ${Math.max(a,b)} a ${Math.min(a,b)} na rodada ${f.round}.`});
  for(const p of f.details?.players||[]){if(n(p.goals)>=3)items.push({...base,icon:'🎩',text:`${p.name} marcou ${p.goals} gols nesta partida.`});if(n(p.saves)>=5)items.push({...base,icon:'🧤',text:`${p.name} registrou ${p.saves} defesas nesta partida.`});}
 }
 const old=(s?.career?.stories||[]).slice(-15).reverse().map(x=>({round:x.round,icon:'✦',text:x.text}));return [...old,...items].slice(0,32);
}
function rivalries(s){const map=new Map();for(const f of fixtures(s)){
  const key=[f.home,f.away].sort().join('|');let rec=map.get(key);
  if(!rec){rec={id:key,names:key.split('|'),played:0,goals:{}};map.set(key,rec);}
  rec.played++;rec.goals[f.home]=(rec.goals[f.home]||0)+n(f.result[0]);rec.goals[f.away]=(rec.goals[f.away]||0)+n(f.result[1]);
 }
 return [...map.values()].sort((a,b)=>b.played-a.played).slice(0,10);
}
function playerDuels(s){const data=new Map();
 for(const f of fixtures(s))for(const d of f.details?.duelHistory||[]){
  if(!d.attacker||!d.defender||d.attacker===d.defender)continue;
  const names=[d.attacker,d.defender].sort(),key=names.join(' × '),old=data.get(key)||{names,played:0,wins:{},types:{}};
  old.played++;old.wins[d.winner]=(old.wins[d.winner]||0)+1;old.types[d.kind]=(old.types[d.kind]||0)+1;data.set(key,old);
 }
 return [...data.values()].sort((a,b)=>b.played-a.played).slice(0,12);
}
function tacticalPatterns(s){const data=new Map();
 for(const f of fixtures(s))for(let side=0;side<2;side++){
  const plan=f.details?.planNames?.[side];if(!plan)continue;
  const name=String(plan),old=data.get(name)||{name,played:0,wins:0,draws:0,goals:0,against:0};
  const gf=n(f.result[side]),ga=n(f.result[1-side]);old.played++;old.goals+=gf;old.against+=ga;
  if(gf>ga)old.wins++;else if(gf===ga)old.draws++;data.set(name,old);
 }
 return [...data.values()].sort((a,b)=>b.played-a.played||b.wins-a.wins).slice(0,8);
}
function standingsFrom(s){if(typeof window==='undefined')return [];try{return window.NeoEngine?.standings?.(s)||[];}catch(_){return [];}}
function archiveSummary(s){const stats=totals(s),ranking=awards(s),ranks=standingsFrom(s);return {key:`${(s?.pastSeasons||[]).length+1}-${stats.played}-${stats.goals}-${Object.keys(s?.career?.players||{}).length}`,edition:(s?.pastSeasons||[]).length+1,played:stats.played,goals:stats.goals,champion:stats.played===stats.scheduled?ranks[0]?.team?.name:null,leader:ranks[0]?.team?.name||null,awards:ranking.filter(a=>a.winner).map(a=>({title:a.title,icon:a.icon,name:a.winner.name,club:a.winner.club})),legendary:fixtures(s).flatMap(f=>(f.details?.goalRecords||[]).filter(g=>g.legendary).map(g=>({scorer:g.scorer,minute:g.minute,round:f.round}))).slice(-15)};}
const archiveKey='neo-chronicle-v91';
function history(){try{const h=JSON.parse(localStorage.getItem(archiveKey));return Array.isArray(h)?h:[];}catch(_){return [];}}
function saveArchive(summary){if(!summary?.played)return;try{const old=history();if(old.some(x=>x.key===summary.key))return;old.push(summary);localStorage.setItem(archiveKey,JSON.stringify(old.slice(-20)));}catch(_){}}
function season(){try{const s=JSON.parse(localStorage.getItem('neo-season-v2'));return s&&Array.isArray(s.rounds)?s:null;}catch(_){return null;}}
function markup(s){const t=totals(s),a=awards(s),c=challenges(s),noGames='<p class="hint">Os resultados reais da liga preencherão esta área assim que houver partidas registradas.</p>';
 const awardHTML=a.filter(x=>x.winner).map(x=>`<article class="neo91-award"><span>${x.icon}</span><div><small>${esc(x.title)} ${x.provisional?'· parcial':'· final'}</small><b>${esc(x.winner.name)}</b><em>${esc(labelId(x.winner.club))} · ${n(x.winner.played)} jogos</em></div></article>`).join('')||noGames;
 const chalHTML=c.map(x=>`<article class="neo91-challenge ${x.done?'is-done':''}"><span class="neo91-icon">${x.icon}</span><div><b>${esc(x.title)}</b><small>${esc(x.description)}</small><div class="neo91-meter"><i style="width:${Math.round(x.current/x.goal*100)}%"></i></div></div><strong>${x.done?'✓':x.current+'/'+x.goal}</strong></article>`).join('');
 const newsHTML=news(s).map(x=>`<article class="neo91-story"><span>${x.icon}</span><div>${esc(x.text)}<small>${x.round?'Rodada '+x.round:'História do elenco'}</small></div></article>`).join('')||noGames;
 const rivalHTML=rivalries(s).map(x=>`<article class="neo91-rival"><b>⚔️ ${esc(labelId(x.names[0]))} × ${esc(labelId(x.names[1]))}</b><small>${x.played} confrontos · ${n(x.goals[x.names[0]])} a ${n(x.goals[x.names[1]])} em gols acumulados</small></article>`).join('')||noGames;
 const shots=shotHighlights(s),shotHTML=shots.map(x=>`<article class="neo91-shot"><span>🔥</span><div><b>${esc(x.shooter||'Jogador não identificado')}</b><small>${esc(labelId(x.home))} × ${esc(labelId(x.away))} · R${x.round} · ${esc(x.style||'Finalização')} · ${Math.round(n(x.xg)*100)}% xG estimado${x.outcome?' · '+esc(x.outcome):''}</small></div></article>`).join('')||'<p class="hint">Ainda não há finalizações perigosas não convertidas registradas com xG nesta versão.</p>';
 const summary=`<div class="neo91-metrics"><article><strong>${t.played}/${t.scheduled}</strong><small>Partidas</small></article><article><strong>${t.goals}</strong><small>Gols</small></article><article><strong>${t.shots}</strong><small>Chutes</small></article><article><strong>${t.saves}</strong><small>Defesas</small></article><article><strong>${t.xg.toFixed(1)}</strong><small>xG estimado</small></article></div>`;
 const duelHTML=playerDuels(s).map(x=>`<article class="neo91-rival"><b>⚔️ ${esc(x.names[0])} × ${esc(x.names[1])}</b><small>${x.played} duelos registrados · ${esc(x.names[0])} ${n(x.wins[x.names[0]])} × ${n(x.wins[x.names[1]])} ${esc(x.names[1])}</small></article>`).join('')||noGames;
 const tacticsHTML=tacticalPatterns(s).map(x=>`<article class="neo91-rival"><b>♟️ ${esc(x.name)}</b><small>${x.played} utilizações · ${x.wins} vitórias · ${x.draws} empates · ${x.goals} GP / ${x.against} GC</small></article>`).join('')||noGames;
 const archives=history().slice().reverse().map(x=>`<article class="neo91-archive"><b>🏆 Temporada ${x.edition} ${x.champion?'— '+esc(x.champion):'— Líder: '+esc(x.leader||'—')}</b><small>${x.played} jogos · ${x.goals} gols · ${x.awards?.length||0} premiações registradas</small></article>`).join('')||'<p class="hint">Ao iniciar outra temporada, seus destaques serão preservados nesta galeria.</p>';
 return {summary,awardHTML,chalHTML,newsHTML,rivalHTML,duelHTML,tacticsHTML,shotHTML,archives,t};
}
function inject(){if(typeof document==='undefined'||document.getElementById('neo91Dashboard'))return;
 const record=document.getElementById('records'),rank=document.getElementById('ranking'),more=document.getElementById('more');if(!record||!rank||!more)return;
 const header='<div class="neo91-head"><span class="neo91-eyebrow">EGO BROADCAST 9.1</span>';
 record.insertAdjacentHTML('beforeend',`<section class="card neo91-card" id="neo91Dashboard">${header}<h2>📊 Observatório da Liga</h2></div><div id="neo91Summary"></div><h3>🔥 Quase gols mais perigosos</h3><div class="neo91-stack" id="neo91Shots"></div></section><section class="card neo91-card">${header}<h2>🏆 Hall da Fama de temporadas</h2></div><div class="neo91-stack" id="neo91Archives"></div></section>`);
 rank.insertAdjacentHTML('beforeend',`<section class="card neo91-card">${header}<h2>🏅 Premiação por desempenho</h2></div><p class="neo91-muted">Premiações parciais até o último jogo da temporada. Critérios diferentes para atacantes, goleiros, defensores e criadores.</p><div class="neo91-awards" id="neo91Awards"></div></section><section class="card neo91-card">${header}<h2>⚔️ Duelos diretos entre jogadores</h2></div><div class="neo91-stack" id="neo91PlayerDuels"></div></section>`);
 more.insertAdjacentHTML('beforeend',`<section class="card neo91-card">${header}<h2>🎯 Central de Desafios</h2></div><div class="neo91-challenges" id="neo91Challenges"></div></section><section class="card neo91-card">${header}<h2>📰 Jornal NEO</h2></div><div class="neo91-stack" id="neo91News"></div></section><section class="card neo91-card">${header}<h2>⚔️ Rivalidades entre equipes</h2></div><div class="neo91-stack" id="neo91Rivals"></div></section><section class="card neo91-card">${header}<h2>♟️ Identidade tática em números</h2></div><p class="neo91-muted">Histórico real de estratégias utilizadas pela IA nos jogos registrados.</p><div class="neo91-stack" id="neo91Tactics"></div></section>`);
}
function render(){if(typeof document==='undefined')return;inject();const s=season();if(!s)return;const data=markup(s);for(const [id,value] of [['neo91Summary',data.summary],['neo91Awards',data.awardHTML],['neo91Challenges',data.chalHTML],['neo91News',data.newsHTML],['neo91Rivals',data.rivalHTML],['neo91PlayerDuels',data.duelHTML],['neo91Tactics',data.tacticsHTML],['neo91Shots',data.shotHTML],['neo91Archives',data.archives]]){const el=document.getElementById(id);if(el&&el.innerHTML!==value)el.innerHTML=value;}}
function init(){inject();render();document.addEventListener('click',e=>{const target=e.target.closest('button');if(!target)return;
  if(target.id==='newSeason'){const old=season(),archive=old?archiveSummary(old):null,oldCount=old?.pastSeasons?.length||0;
   setTimeout(()=>{const next=season();if(next&&next!==old&&n(next?.pastSeasons?.length)>oldCount&&archive)saveArchive(archive);render();},100);return;
  }
  if(target.matches('[data-tab],#simulateRound,#simulateSeason,#restoreSeasonFile'))setTimeout(render,250);
 });document.addEventListener('change',e=>{if(e.target.id==='restoreSeasonFile')setTimeout(render,700);});window.addEventListener('storage',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});setInterval(()=>{if(!document.hidden&&['records','ranking','more'].some(id=>!document.getElementById(id)?.classList.contains('hidden')))render();},3800);
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
return {fixtures,performances,totals,awards,challenges,shotHighlights,news,rivalries,playerDuels,tacticalPatterns,archiveSummary,markup};
});
