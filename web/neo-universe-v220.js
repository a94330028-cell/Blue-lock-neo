/* BLUE LOCK NEO — Verified Living Universe (ideas 41-55).
 * An additive archive of genuine match results, awards and competitions.
 * Compact collapsed interface; no fabricated victories, national teams or saves.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
 if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const n=x=>Number.isFinite(+x)?+x:0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const key=(round,g)=>String(round)+'|'+String(g?.home||'')+'|'+String(g?.away||'');
const rankValue=p=>n(p.goals)*4+n(p.assists)*3+n(p.saves)*.8+n(p.tackles)*.4+n(p.interceptions)*.5+
 n(p.duelsWon)*.3+n(p.keyPasses)*.7+Math.max(0,n(p.rating)-6)*1.4;
function verifiedFixture(g){
 return !!g&&Array.isArray(g.result)&&g.result.length===2&&g.result.every(x=>Number.isInteger(x)&&x>=0)&&
 Array.isArray(g.details?.players);
}
function ensure(season){
 if(!season||!Array.isArray(season.rounds)||season.schema!==2)return null;
 const career=season.career||(season.career={players:{}});
 const legacy=career.neoLegacy||(career.neoLegacy={schema:1,recorded:{},matches:[],hall:[],awards:[],players:{},milestones:[]});
 legacy.recorded=legacy.recorded||{};
 legacy.matches=Array.isArray(legacy.matches)?legacy.matches:[];
 legacy.hall=Array.isArray(legacy.hall)?legacy.hall:[];
 legacy.awards=Array.isArray(legacy.awards)?legacy.awards:[];
 legacy.players=legacy.players||{};
 legacy.milestones=Array.isArray(legacy.milestones)?legacy.milestones:[];
 return legacy;
}
function completed(season){
 return (season?.rounds||[]).flatMap(r=>(r.games||[])
  .filter(verifiedFixture).map(g=>({...g,round:r.round})));
}
function isFinal(season){
 const rounds=season?.rounds||[];
 return rounds.length>0&&rounds.some(r=>r.games?.length)&&
  rounds.every(r=>(r.games||[]).every(g=>verifiedFixture(g)));
}
function scores(report){
 const arr=(report?.players||[]).filter(p=>p?.name&&!p.isMaster&&[0,1].includes(p.side));
 return arr.map(p=>({name:p.name,side:p.side,role:p.role||'?',rating:n(p.rating),goals:n(p.goals),
  assists:n(p.assists),saves:n(p.saves),passes:n(p.passes),tackles:n(p.tackles),
  interceptions:n(p.interceptions),shots:n(p.shots),duelsWon:n(p.duelsWon),keyPasses:n(p.keyPasses),
  score:rankValue(p)}))
  .sort((a,b)=>b.score-a.score||b.rating-a.rating||a.name.localeCompare(b.name));
}
function capture(season,fixture,match,round,engine){
 if(!verifiedFixture(fixture))return false;
 const state=ensure(season);if(!state)return false;
 const stamp=key(round,fixture);
 if(state.recorded[stamp])return false;
 const report=fixture.details;
 if(!Array.isArray(report?.score)||report.score[0]!==fixture.result[0]||report.score[1]!==fixture.result[1])return false;
 const players=scores(report);
 const mvp=players[0]||null;
 const row={round:n(round),home:fixture.home,away:fixture.away,score:fixture.result.slice(),
  mvp:mvp?{name:mvp.name,side:mvp.side,rating:mvp.rating,score:+mvp.score.toFixed(2)}:null,
  events:(report.neoAdvanced?.events||[]).slice(-16),
  heroSaves:(report.neoAdvanced?.saves||[]).slice(-5),
  territory:(report.neoAdvanced?.territory||[0,0]).slice(0,2)};
 state.recorded[stamp]=true;
 state.matches.push(row);
 if(state.matches.length>100)state.matches.splice(0,state.matches.length-100);
 for(const p of players){
  const club=p.side===0?fixture.home:fixture.away;
  const id=p.name+'|'+club;
  const c=state.players[id]||(state.players[id]={name:p.name,club,role:p.role,
    games:0,goals:0,assists:0,saves:0,duels:0,ratingSum:0,highlights:[],positionScores:{}});
  c.games++;c.goals+=p.goals;c.assists+=p.assists;c.saves+=p.saves;c.duels+=p.duelsWon;c.ratingSum+=p.rating;
  c.role=p.role;
  c.highlights.push({round:n(round),opponent:p.side===0?fixture.away:fixture.home,
    goals:p.goals,assists:p.assists,saves:p.saves,rating:p.rating});
  if(c.highlights.length>20)c.highlights.splice(0,c.highlights.length-20);
  const role=p.role||'?';
  c.positionScores[role]=n(c.positionScores[role])+rankValue(p);
 }
 // A final award requires the entire league to be recorded, never a partial standings table.
 if(isFinal(season)){
  const champs=typeof engine?.standings==='function'?engine.standings(season):[];
  const champion=champs[0]?.team?.id;
  if(champion&&!state.hall.some(x=>x.kind==='league'&&x.winner===champion)){
   state.hall.push({kind:'league',winner:champion,round:n(round),
    played:completed(season).length,proof:'classificação final completa'});
  }
  if(!state.awards.length){
   const athletes=Object.values(state.players).filter(p=>p.games>0);
   const strongest=(predicate,weight)=>athletes.filter(predicate).sort((a,b)=>weight(b)-weight(a)||a.name.localeCompare(b.name))[0];
   const awards=[
    ['Artilheiro',strongest(p=>p.goals>0,p=>p.goals)],
    ['Assistências',strongest(p=>p.assists>0,p=>p.assists)],
    ['Muralha',strongest(p=>p.saves>0&&/GOL|GK/i.test(p.role),p=>p.saves)],
    ['Rei do Campo',strongest(p=>p.games>=2,p=>p.ratingSum/p.games)]
   ];
   state.awards=awards.filter(a=>a[1]).map(([title,p])=>({title,name:p.name,club:p.club,
    games:p.games,value:title==='Artilheiro'?p.goals:title==='Assistências'?p.assists:
    title==='Muralha'?p.saves:+(p.ratingSum/p.games).toFixed(2)}));
  }
 }
 return true;
}
function summary(season,engine,cupApi,storage){
 const archive=season?.career?.neoLegacy||{};
 const fixtures=completed(season),rivals=Object.values(season?.career?.neoWorld?.rivals||{})
  .filter(r=>n(r.duels)>0).sort((a,b)=>n(b.duels)-n(a.duels)).slice(0,8);
 const players=Object.values(archive.players||{}).filter(p=>n(p.games)>0)
  .sort((a,b)=>(n(b.goals)*3+n(b.assists)*2+n(b.saves)*.8+n(b.ratingSum)/Math.max(1,n(b.games)))-
   (n(a.goals)*3+n(a.assists)*2+n(a.saves)*.8+n(a.ratingSum)/Math.max(1,n(a.games)))||
   String(a.name).localeCompare(String(b.name)));
 let cups=[];
 try{cups=(cupApi?.safeLoad?.(storage)||[]).filter(c=>c?.rounds&&Array.isArray(c.teams)).map(c=>({
  id:c.id,name:c.name,clubs:c.teams.length,champion:c.champion||null,
  played:c.rounds.reduce((v,r)=>v+(r.games||[]).filter(g=>Array.isArray(g.result)).length,0)
 }));}catch(_){}
 const hall=[...(archive.hall||[])];
 for(const c of cups)if(c.champion&&!hall.some(h=>h.kind==='cup'&&h.id===c.id))
  hall.push({kind:'cup',id:c.id,winner:c.champion,proof:c.name});
 return {played:fixtures.length,finished:isFinal(season),players:players.slice(0,50),
  matches:(archive.matches||[]).slice(-15).reverse(),rivals,cups,hall,awards:archive.awards||[]};
}
function adapt(engine){
 const progression=engine?.Progression;
 if(!progression||typeof progression.record!=='function'||progression._neoLegacyInstalled)return false;
 const original=progression.record;
 progression.record=function(season,fixture,match,round){
  const done=original.call(this,season,fixture,match,round);
  capture(season,fixture,match,round,engine);
  return done;
 };
 Object.defineProperty(progression,'_neoLegacyInstalled',{value:true});
 return true;
}
function mount(win){
 const doc=win?.document;if(!doc)return;
 const E=win.NeoEngine, api=()=>win.NeoTournament1030, bridge=()=>win.NeoCareerBridge;
 const make=(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
 let selected='';
 function render(){
  const season=bridge()?.getSeason?.();
  const records=doc.getElementById('records');
  if(!records||!season)return;
  let section=doc.getElementById('neo-legacy');
  if(!section){
   section=make('details','neo-legacy');section.id='neo-legacy';
   section.append(make('summary',null,'🌍 Universo NEO · Ranking, Hall da Fama, olheiros e mundial'));
   section.append(make('div','neo-legacy-body'));
   records.append(section);
  }
  if(!section.open)return;
  const body=section.querySelector('.neo-legacy-body'),view=summary(season,E,api(),win.localStorage);
  body.replaceChildren();
  const lead=make('p','neo-legacy-note',view.played+' jogos oficiais registrados · '+(view.finished?'Temporada concluída':'Temporada em andamento'));
  body.append(lead);
  const group=(title)=>{const div=make('section','neo-legacy-group');div.append(make('h3',null,title));body.append(div);return div;};
  const rankings=group('👑 Ranking de Egoístas · Prêmios por desempenho');
  const top=make('div','neo-legacy-list');rankings.append(top);
  for(const [i,p] of view.players.slice(0,10).entries())top.append(make('p',null,(i+1)+'. '+p.name+' · '+p.club.toUpperCase()+' · '+p.games+' J · '+p.goals+' G · '+p.assists+' A · '+p.saves+' D'));
  if(!view.players.length)top.append(make('p','neo-legacy-note','Aguardando partidas oficiais. Nenhum ranking inventado.'));
  if(view.finished)for(const a of view.awards)rankings.append(make('p','neo-legacy-award','🏅 '+a.title+' — '+a.name+' ('+a.club+') · '+a.value));
  else rankings.append(make('p','neo-legacy-note','Prêmios definitivos somente quando todas as partidas forem concluídas.'));
  const selection=group('📖 Enciclopédia e linha do tempo verificadas');
  if(view.players.length){
   const picker=make('select','neo-legacy-picker');
   picker.setAttribute('aria-label','Escolher jogador da enciclopédia');
   for(const p of view.players){const opt=make('option',null,p.name+' · '+p.club);opt.value=p.name+'|'+p.club;picker.append(opt);}
   if(!view.players.some(p=>p.name+'|'+p.club===selected))selected=picker.value;
   picker.value=selected;picker.addEventListener('change',()=>{selected=picker.value;render();});
   selection.append(picker);
   const row=view.players.find(p=>p.name+'|'+p.club===selected)||view.players[0];
   selection.append(make('p',null,row.name+' · '+row.games+' partidas · '+(row.ratingSum/row.games).toFixed(1)+' nota média'));
   for(const h of (row.highlights||[]).slice(-7).reverse())
    selection.append(make('p','neo-legacy-timeline','R'+h.round+' vs '+h.opponent+' · '+h.goals+' gols · '+h.assists+' assist. · '+h.saves+' def. · nota '+h.rating.toFixed(1)));
  }else selection.append(make('p','neo-legacy-note','O histórico aparecerá após jogos reais.'));
  const matches=group('🎥 Momentos, defesas e domínio territorial');
  for(const g of view.matches.slice(0,5)){
   const entry=make('details','neo-legacy-match');
   entry.append(make('summary',null,'R'+g.round+' · '+g.home.toUpperCase()+' '+g.score.join(' × ')+' '+g.away.toUpperCase()+(g.mvp?' · MVP '+g.mvp.name:'')));
   const holder=make('div');
   for(const e of (g.events||[]).slice(-8))holder.append(make('p',null,e.minute+"' "+e.player+' — '+e.detail));
   if(g.heroSaves?.length)holder.append(make('p',null,'Defesas difíceis: '+g.heroSaves.map(s=>s.keeper+' ('+s.xg+' xG)').join(', ')));
   if((g.territory||[]).some(Boolean))holder.append(make('p',null,'Amostras de domínio no terço ofensivo: '+g.territory.join(' × ')));
   if(!holder.childNodes.length)holder.append(make('p','neo-legacy-note','O jogo não registrou dados adicionais para este confronto.'));
   entry.append(holder);matches.append(entry);
  }
  const rival=group('🔥 Rivalidades e confrontos registrados');
  for(const r of view.rivals.slice(0,5))rival.append(make('p',null,(r.names||[]).join(' × ')+' · '+r.duels+' disputas · nível '+r.level));
  if(!view.rivals.length)rival.append(make('p','neo-legacy-note','Rivalidades dependem de duelos reais.'));
  const hall=group('🏆 Hall da Fama e competições');
  for(const h of view.hall.slice(-9).reverse())hall.append(make('p',null,'🏆 '+h.winner+' — '+(h.proof||'Campeonato verificado')));
  if(!view.hall.length)hall.append(make('p','neo-legacy-note','O Hall da Fama só registra campeões comprovados.'));
  for(const c of view.cups.slice(-5))hall.append(make('p',null,c.name+' · '+c.played+' jogos · '+(c.champion?'Campeão '+c.champion:'Em disputa')));
  const scout=group('🔭 Olheiros · desempenho registrado');
  for(const p of view.players.filter(p=>p.games>=2).slice(0,5))
   scout.append(make('p',null,p.name+' · '+p.club.toUpperCase()+' · média '+(p.ratingSum/p.games).toFixed(1)+' · '+p.goals+' gols'));
  if(!view.players.some(p=>p.games>=2))scout.append(make('p','neo-legacy-note','Os olheiros precisam observar pelo menos dois jogos.'));
  const world=group('🌐 Copa Mundial de Clubes · torneio jogável');
  world.append(make('p','neo-legacy-note','Use clubes reais já disponíveis no jogo. Isto não cria seleções nacionais nem atribui resultados fictícios.'));
  const eligible=(E?.TEAMS||[]).filter(t=>t?.id&&Array.isArray(t.players)&&t.players.length===11).slice(0,8);
  const btn=make('button','neo-legacy-world-btn','Criar Copa Mundial com 8 clubes');
  btn.type='button';btn.disabled=eligible.length<8||view.cups.length>=6||bridge()?.busy?.();
  btn.addEventListener('click',()=>{
   if(!api()?.create||!api()?.save)return;
   if(!win.confirm('Criar um torneio mundial de clubes usando apenas elencos já disponíveis?'))return;
   try{
    const all=api().safeLoad(win.localStorage);
    if(all.length>=6)throw Error('Limite de 6 copas salvas. Conclua ou remova uma copa antes.');
    const cup=api().create(E,eligible.map(t=>t.id),'Copa Mundial NEO',false);
    all.push(cup);api().save(win.localStorage,all);
    const notice=make('p','neo-legacy-note','Copa criada com sucesso. Abra a área de Copas na Liga para disputar os jogos.');
    world.append(notice);btn.disabled=true;
   }catch(e){world.append(make('p','neo-legacy-note',String(e.message||e)));}
  });world.append(btn);
 }
 function boot(){
  if(!doc.getElementById('records')||doc.getElementById('neo-legacy'))return;
  const section=make('details','neo-legacy');section.id='neo-legacy';
  section.append(make('summary',null,'🌍 Universo NEO · Ranking, Hall da Fama, olheiros e mundial'),make('div','neo-legacy-body'));
  doc.getElementById('records').append(section);
  section.addEventListener('toggle',()=>{if(section.open)render();});
  doc.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="records"],[data-tab="league"]')&&section.open)win.setTimeout(render,90);});
  win.addEventListener('focus',()=>{if(section.open)render();});
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {verifiedFixture,ensure,completed,isFinal,scores,capture,summary,adapt,mount};
});