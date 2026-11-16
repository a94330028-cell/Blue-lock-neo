/* Blue Lock NEO 1.8 — Living Career & World.
 * Real careers, rivals, earned growth, player transfers, championships,
 * records, 40x continuity and truthful newsroom. Does not modify portraits.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
 if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pair=(a,b)=>[a,b].sort().join(' × ');
const LEAGUE=['bm','ba','mc','px','ub'];
const MAX_MOVES=12;
const FOCUSES=['finishing','passing','dribbling','speed','tackling','defense','vision','reflexes','positioning'];
const label={finishing:'Finalização',passing:'Passe',dribbling:'Drible',speed:'Velocidade',
 tackling:'Desarme',defense:'Defesa',vision:'Visão',reflexes:'Reflexos',positioning:'Posicionamento'};
function ensure(season){
 if(!season?.schema||!Array.isArray(season.rounds))throw Error('Temporada inválida.');
 const c=season.career||(season.career={players:{},history:[],version:1});
 c.players=c.players||{};
 const w=c.neoWorld||(c.neoWorld={market:{moves:[],automatic:false,lastAutoRound:0},players:{},rivals:{},
  articles:[],scenes:[],champions:[],recorded:{},training:{},schema:1});
 w.market=w.market||{moves:[],automatic:false,lastAutoRound:0};
 w.market.moves=Array.isArray(w.market.moves)?w.market.moves:[];
 w.players=w.players||{};w.rivals=w.rivals||{};w.articles=Array.isArray(w.articles)?w.articles:[];
 w.scenes=Array.isArray(w.scenes)?w.scenes:[];w.champions=Array.isArray(w.champions)?w.champions:[];
 w.recorded=w.recorded||{};w.training=w.training||{};
 return w;
}
function currentRound(season){
 const round=(season?.rounds||[]).find(r=>(r.games||[]).some(g=>!g.result));
 return round?.round||Number((season?.rounds||[]).at(-1)?.round||0)+1;
}
function gameCount(season){return (season?.rounds||[]).reduce((x,r)=>x+(r.games||[]).filter(g=>Array.isArray(g.result)).length,0);}
function leagueSquads(engine){
 const squads={};
 for(const team of engine?.TEAMS||[]){
  if(!LEAGUE.includes(team.id))continue;
  squads[team.id]={...team,players:team.players.slice(),reserves:team.reserves.slice(),
   formation:(team.formation||[]).map(f=>({...f}))};
 }
 return squads;
}
function applyMove(squads,m){
 const from=squads[m.from],to=squads[m.to];
 if(!from||!to||from===to)return false;
 if(from.players[m.fromSlot]!==m.name||to.players[m.toSlot]!==m.demoted)return false;
 if(!from.reserves.includes(m.replacement)||to.reserves.includes(m.name))return false;
 from.players[m.fromSlot]=m.replacement;
 from.reserves.splice(from.reserves.indexOf(m.replacement),1);
 to.players[m.toSlot]=m.name;
 to.reserves.push(m.demoted);
 if(to.formation[m.toSlot]&&m.role)to.formation[m.toSlot].role=m.role;
 return true;
}
function squadsFor(season,engine){
 const squads=leagueSquads(engine);
 const moves=season?.career?.neoWorld?.market?.moves||[];
 for(const m of moves){if(!applyMove(squads,m))continue;}
 return squads;
}
function validateSquads(squads){
 const starters=new Set(),problems=[];
 for(const [id,s] of Object.entries(squads)){
  if(s.players.length!==11||new Set(s.players).size!==11)problems.push(id+' não possui 11 titulares únicos');
  if(s.players.some(p=>s.reserves.includes(p)))problems.push(id+' tem um atleta no titular e reserva');
  for(const name of s.players){
   if(starters.has(name))problems.push(name+' está escalado em mais de uma equipe');
   starters.add(name);
  }
 }
 return problems;
}
function availableDeals(season,engine,from,to){
 if(!LEAGUE.includes(from)||!LEAGUE.includes(to)||from===to)return [];
 const all=squadsFor(season,engine),s=all[from],d=all[to];
 if(!s||!d||!s.reserves.length)return [];
 const created=new Set((engine.listCreatedPlayers?.()||[]).map(p=>p.name));
 const keepers=new Set(['GOL','GK']);
 return s.players.flatMap((name,slot)=>{
  if(created.has(name)||name===engine.teamById(from)?.master)return [];
  const role=s.formation[slot]?.role||'MC',type=engine.Attr.roleClass(role,slot);
  const candidates=d.players.map((n,i)=>({name:n,slot:i}))
   .filter(p=>p.slot!==0||keepers.has(role)).filter(p=>p.slot===0||!keepers.has(role))
   .filter(p=>engine.Attr.roleClass(d.formation[p.slot]?.role||'MC',p.slot)===type)
   .filter(p=>!created.has(p.name)&&p.name!==engine.teamById(to)?.master);
  if(!candidates.length)return [];
  const replacement=s.reserves.find(p=>!created.has(p)&&p!==name&&!d.players.includes(p));
  if(!replacement)return [];
  const preferred=candidates[0];
  return [{name,from,to,fromSlot:slot,toSlot:preferred.slot,demoted:preferred.name,replacement,role}];
 });
}
function recordMove(season,engine,input){
 const w=ensure(season);
 const round=currentRound(season);
 if(round>(season.rounds||[]).length)throw Error('A temporada já foi encerrada.');
 if(w.market.moves.length>=MAX_MOVES)throw Error('Limite de movimentações nesta temporada alcançado.');
 const {name,from,to}=input||{};
 if(w.market.moves.some(m=>m.round===round))throw Error('Uma movimentação por rodada para preservar a estabilidade dos elencos.');
 const deal=availableDeals(season,engine,from,to).find(x=>x.name===name);
 if(!deal)throw Error('A negociação não é válida para estas equipes e escalações.');
 const candidate={...deal,round,id:'transfer-'+String(w.market.moves.length+1).padStart(2,'0')};
 const simulated=squadsFor(season,engine);
 if(!applyMove(simulated,candidate)||validateSquads(simulated).length)throw Error('A transferência criaria uma escalação inconsistente.');
 const c=season.career;
 const previous=c.players?.[name+'|'+from];
 if(previous&&c.players[name+'|'+to]&&n(c.players[name+'|'+to].games)>0)throw Error('Histórico de carreira já existente no novo clube.');
 w.market.moves.push(candidate);
 if(previous){
  const newKey=name+'|'+to;
  delete c.players[name+'|'+from];
  c.players[newKey]={...previous,club:to,clubHistory:[...(previous.clubHistory||[]),{club:from,throughRound:round-1}]};
 }
 const msg='TRANSFERÊNCIA CONFIRMADA: '+name+' deixa '+from.toUpperCase()+' e chega ao '+to.toUpperCase()+
  '; '+deal.replacement+' assume a vaga e '+deal.demoted+' vai ao banco.';
 postNews(w,{round,type:'transfer',headline:'🔄 Mercado Neo: '+name+' muda de clube',
  text:msg,source:'movimentação confirmada na temporada'});
 return candidate;
}
function postNews(w,article){
 if(!w||!article?.text)return null;
 const exists=w.articles.some(x=>x.type===article.type&&x.round===article.round&&x.text===article.text);
 if(exists)return null;
 const obj={round:Math.floor(n(article.round)),type:String(article.type||'match'),
  headline:String(article.headline||'Notícia da rodada').slice(0,120),
  text:String(article.text).slice(0,320),source:String(article.source||'partida registrada').slice(0,110)};
 w.articles.push(obj);
 if(w.articles.length>120)w.articles.splice(0,w.articles.length-120);
 return obj;
}
function createdCareer(engine,season,report,round,fixture,w){
 const own=new Set((engine.listCreatedPlayers?.()||[]).map(p=>p.name));
 for(const p of report.players||[]){
  if(!own.has(p.name)||![0,1].includes(p.side))continue;
  const club=p.side===0?fixture.home:fixture.away;
  const career=season.career.players[p.name+'|'+club];
  if(!career)continue;
  const entry=w.players[p.name]||(w.players[p.name]={name:p.name,club,journey:[],achievements:[],totalMatches:0});
  entry.club=club;entry.totalMatches++;
  entry.journey.push({round,club,goals:n(p.goals),assists:n(p.assists),
   saves:n(p.saves),rating:n(p.rating),flow:n(p.flowCount)});
  if(entry.journey.length>40)entry.journey.shift();
  const awards=[['Primeira partida',1,entry.totalMatches],
   ['Cinco partidas',5,entry.totalMatches],['Dez partidas',10,entry.totalMatches],
   ['Primeiro gol',1,n(career.goals)],['Primeira assistência',1,n(career.assists)],
   ['Primeira defesa',1,n(career.saves)]];
  for(const [achievement,needed,actual] of awards){
   if(actual>=needed&&!entry.achievements.includes(achievement))entry.achievements.push(achievement);
  }
 }
}
function trainCareer(season,fixture,report,round,w,engine){
 for(const p of report.players||[]){
  if(!p||p.isMaster||![0,1].includes(p.side)||!p.name)continue;
  const club=p.side===0?fixture.home:fixture.away,id=p.name+'|'+club;
  const career=season.career.players?.[id];
  if(!career)continue;
  const training=w.training[p.name]||(w.training[p.name]={focus:'',earned:0,lastRound:0});
  const automatic=/^(GOL|GK)$/.test(p.role)?'reflexes':
   /^(ZAG|CB|LB|RB|LD|LE|VOL|CDM)$/.test(p.role)?'tackling':
   /^(MEI|CAM|MC|CM)$/.test(p.role)?'passing':'finishing';
  const stat=FOCUSES.includes(training.focus)?training.focus:automatic;
  const games=n(career.games);
  const consistent=n(p.rating)>=7.2&&games>0&&games%3===0&&training.lastRound!==round;
  if(!consistent||n(training.earned)>=6)return;
  career.boosts=career.boosts||{};
  const before=n(career.boosts[stat]);
  career.boosts[stat]=Math.min(before+1,before+Math.max(0,6-n(training.earned)));
  training.earned++;training.lastRound=round;
  postNews(w,{round,type:'training',headline:'📈 Evolução: '+p.name,
   text:p.name+' melhorou '+label[stat]+' após uma boa sequência de atuações oficiais.',
   source:'nota '+n(p.rating).toFixed(1)+' na súmula da partida'});
 }
}
function updateRivals(w,report,round){
 for(const d of report.duelHistory||[]){
  if(!d?.attacker||!d.defender||!d.winner||d.attacker===d.defender)continue;
  const key=pair(d.attacker,d.defender);
  const row=w.rivals[key]||(w.rivals[key]={names:[d.attacker,d.defender].sort(),duels:0,wins:{},level:0,lastRound:0});
  row.duels++;row.wins[d.winner]=n(row.wins[d.winner])+1;row.lastRound=round;
  const next=row.duels>=12?3:row.duels>=6?2:row.duels>=2?1:0;
  if(next>row.level){
   row.level=next;
   const title=['','Rivalidade Inicial','Disputa Intensa','Rivalidade Lendária'][next];
   postNews(w,{round,type:'rivalry',headline:'🔥 '+title+': '+key,
    text:d.attacker+' e '+d.defender+' alcançaram '+row.duels+' duelos reais. O último foi vencido por '+d.winner+'.',
    source:'duelos registrados na súmula'});
  }
 }
}
function matchNews(w,report,fixture,round){
 const home=fixture.home.toUpperCase(),away=fixture.away.toUpperCase(),score=report.score;
 if(!Array.isArray(score)||score.length!==2)return;
 const result=home+' '+score[0]+' × '+score[1]+' '+away;
 postNews(w,{round,type:'result',headline:'⚽ Rodada '+round+': '+result,
  text:'Partida encerrada: '+result+'.',source:'placar oficial registrado'});
 const gap=Math.abs(n(score[0])-n(score[1]));
 if(gap>=3)postNews(w,{round,type:'result',headline:'💥 Goleada: '+result,
  text:'A diferença foi de '+gap+' gols no confronto '+home+' contra '+away+'.',
  source:'placar oficial da partida'});
 const scorers=(report.players||[]).filter(p=>n(p.goals)>=2)
  .sort((a,b)=>n(b.goals)-n(a.goals));
 for(const p of scorers.slice(0,2))postNews(w,{round,type:'hero',headline:'🌟 '+p.name+' brilha',
  text:p.name+' marcou '+p.goals+' gols em '+result+'.',
  source:'gols individuais registrados'});
 const recordSaves=(report.players||[]).filter(p=>/^(GOL|GK)$/.test(p.role||'')&&n(p.saves)>=5);
 for(const p of recordSaves.slice(0,1))postNews(w,{round,type:'hero',headline:'🧤 '+p.name+' segura a pressão',
  text:p.name+' realizou '+p.saves+' defesas oficiais em '+result+'.',
  source:'defesas registradas na súmula'});
}
function records(season,engine){
 const completed=(season?.rounds||[]).flatMap(r=>(r.games||[]).filter(g=>Array.isArray(g.result)).map(g=>({...g,round:r.round})));
 let biggest=null,goals=0,draws=0;
 for(const g of completed){
  const gap=Math.abs(n(g.result[0])-n(g.result[1]));
  goals+=n(g.result[0])+n(g.result[1]);
  if(g.result[0]===g.result[1])draws++;
  if(!biggest||gap>biggest.gap)biggest={home:g.home,away:g.away,score:g.result,gap,round:g.round};
 }
 const c=season?.career?.players||{},players=Object.values(c).filter(p=>n(p.games)>0);
 const sorted=(stat)=>players.slice().sort((a,b)=>n(b[stat])-n(a[stat])||String(a.name).localeCompare(String(b.name)))[0]||null;
 const table=engine?.standings?.(season)||[];
 const finished=completed.length>0&&completed.length===(season?.rounds||[]).reduce((a,r)=>a+(r.games||[]).length,0);
 return {played:completed.length,goals,draws,biggest,
  topScorer:sorted('goals'),topAssister:sorted('assists'),topKeeper:sorted('saves'),
  leader:table[0]?.team?.id||null,champion:finished?table[0]?.team?.id:null,
  teams:table};
}
function recordSeason(engine,season,fixture,match,round){
 const w=ensure(season),key=round+'|'+fixture.home+'|'+fixture.away;
 if(w.recorded[key])return false;
 const report=match?.result?.();
 if(!Array.isArray(report?.players)||!Array.isArray(report?.score))return false;
 w.recorded[key]=1;
 createdCareer(engine,season,report,round,fixture,w);
 trainCareer(season,fixture,report,round,w,engine);
 updateRivals(w,report,round);
 matchNews(w,report,fixture,round);
 const summary=records(season,engine);
 if(summary.champion&&!w.champions.some(t=>t.type==='Neo League')){
  w.champions.push({type:'Neo League',name:summary.champion,round,played:summary.played});
  postNews(w,{round,type:'title',headline:'🏆 Campeão da Neo League',
   text:summary.champion.toUpperCase()+' conquistou a Liga Neo Egoísta após '+summary.played+' partidas oficialmente registradas.',
   source:'classificação final e tabela completa'});
 }
 if(w.market.automatic&&round%4===0&&round>w.market.lastAutoRound&&w.market.moves.length<MAX_MOVES&&
   (season.rounds.find(r=>r.round===round)?.games||[]).every(g=>Array.isArray(g.result))){
  const table=summary.teams;
  const leader=table[0]?.team?.id,last=table.at(-1)?.team?.id;
  const candidates=Object.values(season.career.players||{})
   .filter(p=>p.club===last&&n(p.games)>=3&&n(p.ratingSum)/Math.max(1,n(p.games))>=7.6)
   .sort((a,b)=>n(b.ratingSum)/n(b.games)-n(a.ratingSum)/n(a.games));
  if(leader&&last&&leader!==last)for(const c of candidates){
   try{recordMove(season,engine,{name:c.name,from:last,to:leader});w.market.lastAutoRound=round;break;}
   catch(_){}
  }
 }
 if(w.articles.length>120)w.articles.splice(0,w.articles.length-120);
 const keys=Object.keys(w.recorded);for(const k of keys.slice(0,Math.max(0,keys.length-200)))delete w.recorded[k];
 return true;
}
function adapt(engine){
 const p=engine?.Match?.prototype;
 if(!p||p._neo190World)return false;
 if(typeof p._buildPlayers==='function'){
  const original=p._buildPlayers;
  p._buildPlayers=function(){
   const career=this.neoCareerContext,season=this.neoSeasonContext;
   if(career?.neoWorld?.market?.moves?.length&&season?.schema===2){
    const squads=squadsFor({career},engine);
    this.teams=this.teams.map(t=>squads[t.id]||t);
    this.startingLineups=this.teams.map(t=>t.players.map((name,i)=>({
     name,role:t.formation?.[i]?.role||'MC',slot:i
    })));
   }
   return original.call(this);
  };
 }
 if(typeof p._recordDuel==='function'){
  const original=p._recordDuel;
  p._recordDuel=function(a,b,w,kind){
   const before=this.duelHistory?.at(-1);
   const res=original.call(this,a,b,w,kind);
   if(this.duelHistory?.at(-1)===before||!a||!b||!w||a.side===b.side)return res;
   const matchup=pair(a.name,b.name),history=this.careerRivals?.[matchup];
   if(n(history?.actualDuels)>=3&&this.time-n(this._neo190LastRivalAt??-1000)>180){
    this._neo190LastRivalAt=this.time;
    this._ego?.(w,1.5,'rivalidade de temporada');
   }
   return res;
  };
 }
 const progression=engine.Progression;
 if(progression&&typeof progression.record==='function'&&!progression._neo190WorldRecorded){
  const original=progression.record;
  progression.record=function(season,fixture,match,round){
   const done=original.call(this,season,fixture,match,round);
   recordSeason(engine,season,fixture,match,round);
   return done;
  };
  Object.defineProperty(progression,'_neo190WorldRecorded',{value:true});
 }
 Object.defineProperty(p,'_neo190World',{value:true});
 return true;
}
function competitions(win,season,engine){
 const outputs=[];
 const info=records(season,engine);
 outputs.push({name:'Neo League',played:info.played,
  winner:info.champion||null,status:info.champion?'Campeonato encerrado':'Em disputa'});
 const cup=win?.NeoTournament1030;
 try{
  for(const c of cup?.safeLoad?.(win.localStorage)||[]){
   const played=(c.rounds||[]).reduce((a,r)=>a+(r.games||[]).filter(g=>Array.isArray(g.result)).length,0);
   outputs.push({name:c.name||'Copa dos Egoístas',played,winner:c.champion||null,
    status:c.champion?'Campeão definido':'Em disputa'});
  }
 }catch(_){}
 return outputs;
}
function mount(win){
 const doc=win.document;
 const make=(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
 const e=win.NeoEngine;
 const bridge=()=>win.NeoCareerBridge;
 const getSeason=()=>bridge()?.getSeason?.();
 let from='bm',to='px',selected='',focusName='';
 function box(title){const container=make('div','neo190-group');container.append(make('strong',null,title));return container;}
 function render(){
  const season=getSeason();if(!season)return;
  const w=season.career?.neoWorld||{market:{moves:[]},players:{},rivals:{},articles:[]};
  const home=doc.getElementById('more')||doc.getElementById('squads');
  if(home){
   let host=doc.getElementById('neo190-market');
   if(!host){host=make('section','neo190-panel');host.id='neo190-market';home.append(host);}
   host.replaceChildren();
   host.append(make('h3',null,'🔄 MERCADO NEO · CARREIRA'));
   host.append(make('p','neo190-note','Negocie jogadores reais para as próximas partidas da liga. Os cinco elencos mantêm 11 titulares; saves, retratos e campeonatos são preservados.'));
   const controls=make('div','neo190-grid');
   const chooser=(caption,choices,value,onChange)=>{
    const label=make('label','neo190-control');label.append(make('span',null,caption));
    const select=make('select');for(const team of choices){
     const opt=make('option',null,team.name);opt.value=team.id;select.append(opt);
    }
    select.value=value;select.addEventListener('change',()=>onChange(select.value));label.append(select);return label;
   };
   const teams=e.TEAMS.filter(t=>LEAGUE.includes(t.id));
   controls.append(chooser('Clube de origem',teams,from,v=>{from=v;if(from===to)to=teams.find(t=>t.id!==from).id;selected='';render();}),
    chooser('Clube de destino',teams,to,v=>{to=v;if(from===to)from=teams.find(t=>t.id!==to).id;selected='';render();}));
   const deals=availableDeals(season,e,from,to);
   const label=make('label','neo190-control');
   label.append(make('span',null,'Atleta a transferir'));
   const pick=make('select');const selectedDeal=deals.find(d=>d.name===selected)||deals[0];
   for(const d of deals){const opt=make('option',null,d.name+' → '+to.toUpperCase());opt.value=d.name;pick.append(opt);}
   pick.value=selectedDeal?.name||'';
   pick.disabled=!deals.length;
   pick.addEventListener('change',()=>{selected=pick.value;});
   label.append(pick);controls.append(label);host.append(controls);
   const move=make('button','neo190-btn', 'Confirmar transferência');
   move.disabled=!deals.length||bridge()?.busy?.()||w.market?.moves?.some(m=>m.round===currentRound(season));
   move.addEventListener('click',()=>{
    if(!win.confirm('Confirmar transferência para as próximas partidas? Os elencos serão atualizados na temporada.'))return;
    const backup=JSON.stringify(season.career||{});
    try{
     recordMove(season,e,{name:pick.value,from,to});
     if(!bridge().save()){season.career=JSON.parse(backup);throw Error('Sem espaço para salvar; a operação foi revertida.');}
     bridge().refresh?.();render();
    }catch(error){host.append(make('p','neo190-error',String(error.message||error)));}
   });
   host.append(move);
   const automate=make('label','neo190-toggle');
   const check=make('input');check.type='checkbox';check.checked=!!w.market?.automatic;
   check.addEventListener('change',()=>{
    const backup=JSON.stringify(season.career||{});
    ensure(season).market.automatic=check.checked;
    if(!bridge().save()){season.career=JSON.parse(backup);check.checked=!check.checked;}
   });
   automate.append(check,make('span',null,'Permitir ofertas automáticas a cada 4 rodadas, baseadas no rendimento real'));host.append(automate);
   const dealsHistory=(w.market?.moves||[]).slice(-6).reverse();
   const moves=box('📋 Últimas movimentações');
   for(const deal of dealsHistory)moves.append(make('p',null,'R'+deal.round+' · '+deal.name+' · '+deal.from.toUpperCase()+' → '+deal.to.toUpperCase()+' · '+deal.replacement+' assume a vaga'));
   if(!dealsHistory.length)moves.append(make('p','neo190-note','Nenhuma transferência realizada nesta temporada.'));
   host.append(moves);
   const made=e.listCreatedPlayers?.()||[];
   const earned=box('🧬 Carreira dos seus personagens');
   if(!made.length)earned.append(make('p','neo190-note','Crie um personagem na seção Criar meu jogador para acompanhar sua carreira.'));
   for(const own of made.slice(0,12)){
    const entry=w.players?.[own.name];
    earned.append(make('p',null,own.name+' · '+own.club.toUpperCase()+' · '+(entry?.totalMatches||0)+' jogos · '+(entry?.achievements?.join(', ')||'Sem conquistas registradas')));
    const training=make('label','neo190-control');
    training.append(make('span',null,'Treino de '+own.name));
    const select=make('select');
    const t=w.training?.[own.name]?.focus||'';
    for(const id of ['',...FOCUSES]){
     const option=make('option',null,id?label[id]:'Automático conforme a posição');option.value=id;select.append(option);
    }
    select.value=t;
    select.addEventListener('change',()=>{
     const backup=JSON.stringify(season.career||{});
     ensure(season).training[own.name]={...(ensure(season).training[own.name]||{}),focus:select.value};
     if(!bridge().save()){season.career=JSON.parse(backup);select.value=t;}
    });
    training.append(select);earned.append(training);
   }
   host.append(earned);
  }
  const recordHost=doc.getElementById('records');if(recordHost){
   let panel=doc.getElementById('neo190-world');
   if(!panel){panel=make('section','neo190-panel');panel.id='neo190-world';recordHost.append(panel);}
   panel.replaceChildren();
   panel.append(make('h3',null,'🌎 UNIVERSO VIVO · TEMPORADA'));
   const dashboard=make('div','neo190-grid');panel.append(dashboard);
   const table=records(season,e);
   for(const [title,value] of [['Partidas oficiais',table.played],['Gols registrados',table.goals],
    ['Maior goleada',table.biggest?table.biggest.home+' '+table.biggest.score.join(' × ')+' '+table.biggest.away:'—'],
    ['Artilheiro',table.topScorer?table.topScorer.name+' ('+n(table.topScorer.goals)+')':'—'],
    ['Rei das assistências',table.topAssister?table.topAssister.name+' ('+n(table.topAssister.assists)+')':'—'],
    ['Defesas',table.topKeeper?table.topKeeper.name+' ('+n(table.topKeeper.saves)+')':'—']]){
    const stat=make('div','neo190-metric');
    stat.append(make('small',null,title),make('strong',null,value));dashboard.append(stat);
   }
   const cups=box('🏆 Campeonatos e títulos confirmados');
   for(const cup of competitions(win,season,e))cups.append(make('p',null,cup.name+' · '+cup.played+' partidas · '+(cup.winner?'🏆 '+cup.winner.toUpperCase():cup.status)));
   panel.append(cups);
   const rivals=box('🔥 Rivalidades de temporada');
   const rank=Object.values(w.rivals||{}).sort((a,b)=>n(b.duels)-n(a.duels)).slice(0,7);
   for(const r of rank)rivals.append(make('p',null,r.names.join(' × ')+' · '+r.duels+' duelos · '+['Em formação','Inicial','Intensa','Lendária'][r.level||0]));
   if(!rank.length)rivals.append(make('p','neo190-note','As rivalidades crescem a partir de duelos reais nas partidas.'));
   panel.append(rivals);
   const news=box('📰 JORNAL NEO — notícias da simulação');
   const articles=(w.articles||[]).slice(-14).reverse();
   for(const a of articles){
    const article=make('article','neo190-news');
    article.append(make('strong',null,a.headline),make('p',null,a.text),make('small',null,'Rodada '+a.round+' · Fonte: '+a.source));
    news.append(article);
   }
   if(!articles.length)news.append(make('p','neo190-note','As notícias surgirão após partidas e transferências verdadeiras.'));
   panel.append(news);
   const turbo=box('⚡ TURBO 40×');
   turbo.append(make('p',null,'O 40× permanece disponível na partida. A aceleração altera a velocidade de execução, sem inventar resultados, jogadores ou gols.'));
   panel.append(turbo);
  }
 }
 const boot=()=>{
  if(!bridge()?.getSeason?.())return;
  render();
  doc.addEventListener('click',evt=>{
   if(evt.target.closest?.('[data-tab="records"],[data-tab="more"],[data-tab="squads"]'))win.setTimeout(render,110);
  });
  win.addEventListener('focus',render);
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {ensure,currentRound,gameCount,leagueSquads,applyMove,squadsFor,validateSquads,
 availableDeals,recordMove,postNews,createdCareer,trainCareer,updateRivals,matchNews,
 records,recordSeason,competitions,adapt,mount};
});