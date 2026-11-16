/* Blue Lock NEO 10.3 — optional independent tournaments.
   Existing Neo League, custom leagues, portraits and saves are never modified. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root?.document){root.NeoTournament1030=api;api.mount(root);}})(typeof window!=='undefined'?window:null,function(){
'use strict';
const SAVE_KEY='neo-brackets-v1030',MAX=6;
const N=v=>Number.isFinite(Number(v))?Number(v):0;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const short=(engine,id)=>engine.teamById(id)?.short||engine.teamById(id)?.name||id;
function fixture(home,away,stage,group=null,pair=null){return {home,away,stage,group,pair,result:null,details:null,penalties:null,winner:null};}
function robin(ids){
 const a=ids.slice(),result=[];
 for(let round=0;round<a.length-1;round++){
  result.push([[a[0],a[3]],[a[1],a[2]]].map(x=>x));
  const last=a.pop();a.splice(1,0,last);
 }
 return result;
}
function create(engine,ids,title='Copa dos Egoístas',legs=false){
 if(!Array.isArray(ids)||![2,4,8].includes(ids.length)||new Set(ids).size!==ids.length||ids.some(id=>!engine?.teamById?.(id)))throw Error('Selecione 2, 4 ou 8 clubes diferentes.');
 const cup={schema:1,id:'bracket-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),
   name:String(title||'Copa dos Egoístas').slice(0,45),teams:ids.slice(),legs:!!legs,rounds:[],champion:null,createdAt:Date.now()};
 if(ids.length===8){
  const groups=[ids.filter((_,i)=>i%2===0),ids.filter((_,i)=>i%2===1)];
  const draws=groups.map(robin);
  for(let i=0;i<3;i++){
   const games=[];
   for(let g=0;g<2;g++)for(const [home,away] of draws[g][i])games.push(fixture(home,away,'group',g?'B':'A'));
   cup.rounds.push({id:'group-'+(i+1),label:'Grupos · rodada '+(i+1),stage:'group',games});
  }
 }else if(ids.length===4){
  cup.rounds.push({id:'semi',label:'Semifinais',stage:'semi',games:[
   fixture(ids[0],ids[3],'semi',null,0),fixture(ids[1],ids[2],'semi',null,1)]});
 }else cup.rounds.push({id:'final',label:'Final',stage:'final',games:[fixture(ids[0],ids[1],'final')]});
 return cup;
}
function groupTable(cup,g){
 const members=cup.teams.filter((_,i)=>g==='A'?i%2===0:i%2===1);
 const rows=members.map(id=>({id,J:0,V:0,E:0,D:0,GP:0,GC:0,Pts:0,SG:0}));
 for(const round of cup.rounds.filter(r=>r.stage==='group'))for(const game of round.games.filter(f=>f.group===g&&f.result)){
  const a=rows.find(r=>r.id===game.home),b=rows.find(r=>r.id===game.away);if(!a||!b)continue;
  const [x,y]=game.result;a.J++;b.J++;a.GP+=x;a.GC+=y;b.GP+=y;b.GC+=x;
  if(x>y){a.V++;a.Pts+=3;b.D++;}else if(x<y){b.V++;b.Pts+=3;a.D++;}else{a.E++;b.E++;a.Pts++;b.Pts++;}
 }
 rows.forEach(r=>r.SG=r.GP-r.GC);
 return rows.sort((a,b)=>b.Pts-a.Pts||b.SG-a.SG||b.GP-a.GP||a.id.localeCompare(b.id));
}
function next(cup){for(const round of cup?.rounds||[])for(const game of round.games||[])if(!game.result)return {round,game};return null;}
function shootout(match){
 const playerSide=s=>match.players.filter(p=>p.side===s&&p.i!==0&&!p.isMaster);
 const teams=[playerSide(0),playerSide(1)];
 const keepers=[0,1].map(s=>match.players.find(p=>p.side===s&&p.i===0));
 if(teams.some(t=>!t.length)||keepers.some(k=>!k))throw Error('Equipes sem jogadores suficientes para os pênaltis.');
 const attempts=[[],[]];let home=0,away=0;
 for(let i=0;i<100;i++){
  for(let side=0;side<2;side++){
   const shooter=teams[side][i%teams[side].length];
   const keeper=keepers[1-side];
   const finishing=N(shooter.attributes?.finishing||74),reflex=N(keeper.attributes?.reflexes||75);
   const chance=clamp(.73+(finishing-75)*.0025-(reflex-75)*.002,.48,.91);
   const goal=match.random()<chance;
   attempts[side].push({player:shooter.name,goal});
   if(goal){if(side===0)home++;else away++;}
  }
  if(i>=4&&home!==away)break;
 }
 if(home===away)throw Error('Pênaltis empatados após 100 séries; reinicie a disputa.');
 return {home,away,attempts,winner:home>away?0:1};
}
function advance(cup){
 if(next(cup)||cup.champion)return cup;
 const last=cup.rounds[cup.rounds.length-1];
 if(last.stage==='group'){
  const a=groupTable(cup,'A'),b=groupTable(cup,'B');
  if(a.length<2||b.length<2)throw Error('Grupos incompletos.');
  cup.rounds.push({id:'semi',label:'Semifinais',stage:'semi',games:[
   fixture(a[0].id,b[1].id,'semi',null,0),fixture(b[0].id,a[1].id,'semi',null,1)]});
 }else if(last.stage==='semi'&&cup.legs){
  cup.rounds.push({id:'semi-return',label:'Semifinais · volta',stage:'semi-return',games:last.games.map(f=>fixture(f.away,f.home,'semi-return',null,f.pair))});
 }else if(last.stage==='semi'||last.stage==='semi-return'){
  const winners=last.games.map(g=>g.winner);
  if(winners.some(x=>!x))throw Error('Semifinal sem vencedor.');
  cup.rounds.push({id:'final',label:'Final',stage:'final',games:[fixture(winners[0],winners[1],'final')]});
 }else if(last.stage==='final')cup.champion=last.games[0].winner;
 return cup;
}
function play(engine,cup,seed){
 if(cup?.champion)throw Error('Campeonato encerrado.');
 const entry=next(cup);if(!entry)throw Error('Nenhum jogo restante.');
 const g=entry.game,m=new engine.Match(g.home,g.away,seed==null?Math.floor(Math.random()*4294967296):seed>>>0,null,cup);
 m.rollGameplan();const result=m.runToEnd();
 g.result=result.score.slice();
 g.details={stats:result.stats,goals:(result.goalRecords||[]).slice(-20),
  players:(result.players||[]).map(p=>({name:p.name,side:p.side,role:p.role,goals:p.goals,assists:p.assists,shots:p.shots,
   tackles:p.tackles,saves:p.saves,passes:p.passes,rating:p.rating}))};
 const [home,away]=g.result;
 if(entry.round.stage==='final'||entry.round.stage==='semi'&&!cup.legs){
  if(home!==away)g.winner=home>away?g.home:g.away;
  else{g.penalties=shootout(m);g.winner=g.penalties.winner===0?g.home:g.away;}
 }else if(entry.round.stage==='semi-return'){
  const first=cup.rounds.find(r=>r.stage==='semi')?.games.find(f=>f.pair===g.pair);
  if(!first||!first.result)throw Error('Jogo de ida não encontrado.');
  const aggregateHome=N(first.result[1])+home,aggregateAway=N(first.result[0])+away;
  if(aggregateHome!==aggregateAway)g.winner=aggregateHome>aggregateAway?g.home:g.away;
  else{g.penalties=shootout(m);g.winner=g.penalties.winner===0?g.home:g.away;}
 }
 advance(cup);
 return {game:g,round:entry.round.label,champion:cup.champion};
}
function safeLoad(storage){try{const v=JSON.parse(storage.getItem(SAVE_KEY)||'[]');return Array.isArray(v)?v.filter(c=>c?.schema===1&&Array.isArray(c.rounds)&&[2,4,8].includes(c.teams?.length)).slice(0,MAX):[];}catch(_){return [];}}
function save(storage,list){storage.setItem(SAVE_KEY,JSON.stringify((list||[]).slice(0,MAX)));}
function mount(win){
 const engine=win.NeoEngine,doc=win.document;if(!engine||!doc)return;
 const $=id=>doc.getElementById(id),storage=win.localStorage;
 let cups=safeLoad(storage),active=cups[0]?.id||null;
 const style=doc.createElement('style');style.id='neo1030-css';
 style.textContent='.neo1030-box{background:linear-gradient(135deg,#152a44,#0b1e34);border:1px solid #426285;border-radius:16px;padding:14px;margin:14px 0;color:#eaf6ff}.neo1030-box h3{margin:0 0 8px;color:#ffdf9f}.neo1030-box p{color:#b0c9df;font-size:11px;line-height:1.5}.neo1030-box label{display:block;font-size:11px;margin:8px 0}.neo1030-box select,.neo1030-box input[type="text"]{width:100%;max-width:100%;background:#09182c;color:white;border:1px solid #3a5a78;padding:10px;border-radius:9px}.neo1030-clubs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;max-height:230px;overflow:auto}.neo1030-clubs label{margin:0;padding:8px;border-radius:9px;background:#1c344f;display:flex;align-items:center;gap:7px}.neo1030-btn{min-height:40px;border:1px solid #54b6fa;background:#115b9c;color:white;border-radius:10px;padding:8px 13px;font-weight:800;margin:5px 5px 5px 0}.neo1030-muted{background:#18283e;border-color:#465875}.neo1030-round{margin:8px 0;border:1px solid #30516c;border-radius:11px;padding:10px;background:#0b2039}.neo1030-round summary{font-weight:800;font-size:12px}.neo1030-game{padding:6px 0;border-bottom:1px solid #26425c;font-size:11px}.neo1030-table{width:100%;font-size:10px;border-collapse:collapse}.neo1030-table td,.neo1030-table th{padding:5px 3px;text-align:left;border-bottom:1px solid #294660}.neo1030-win{color:#ffdb86;font-weight:900}@media(max-width:520px){.neo1030-box{padding:10px}.neo1030-clubs{grid-template-columns:1fr 1fr}}';
 doc.head.append(style);
 function mountUI(){
  const root=$('more')||$('league');if(!root||$('neo1030-panel'))return;
  const section=doc.createElement('section');section.className='neo1030-box';section.id='neo1030-panel';
  const teams=engine.allTeams().filter(t=>t.id!=='neo-bestxi');
  section.innerHTML='<h3>🏆 Copa Eliminatória — Grupos e Mata-mata</h3><p>Escolha 2, 4 ou 8 equipes. Oito clubes jogam em dois grupos, depois semifinais e final. Os outros formatos começam direto no mata-mata.</p>'+
   '<form id="neo1030-form"><label>Nome do torneio<input type="text" id="neo1030-title" maxlength="45" value="Copa dos Egoístas"></label>'+
   '<div class="neo1030-clubs">'+teams.map(t=>'<label><input type="checkbox" name="neo1030-team" value="'+esc(t.id)+'"><span>'+esc(t.name)+'</span></label>').join('')+'</div>'+
   '<label><input type="checkbox" id="neo1030-legs"> Semifinais em ida e volta</label>'+
   '<button class="neo1030-btn" type="submit">Criar Copa Eliminatória</button></form><p id="neo1030-status" role="status"></p><div id="neo1030-active"></div>';
  const old=$('neo970-cups');if(old)old.insertAdjacentElement('afterend',section);else root.append(section);
  const status=txt=>{$('neo1030-status').textContent=txt;};
  const persist=()=>{try{save(storage,cups)}catch(e){status('⚠️ Sem espaço para salvar este torneio. Faça backup dos dados.');}};
  $('neo1030-form').addEventListener('submit',e=>{
   e.preventDefault();const ids=[...section.querySelectorAll('[name="neo1030-team"]:checked')].map(x=>x.value);
   try{const cup=create(engine,ids,$('neo1030-title').value,$('neo1030-legs').checked);cups.unshift(cup);cups=cups.slice(0,MAX);active=cup.id;persist();render();status('✅ Copa criada! Simule os jogos para começar.');}
   catch(error){status('⚠️ '+String(error?.message||error));}
  });
  section.addEventListener('click',e=>{
   const b=e.target.closest('[data-neo1030-action]');if(!b)return;
   const action=b.dataset.neo1030Action,cup=cups.find(x=>x.id===active);
   if(action==='delete'){
    if(!cup)return;cups=cups.filter(c=>c.id!==active);active=cups[0]?.id||null;persist();render();status('Campeonato removido. Sua liga e as outras copas continuam intactas.');return;
   }
   if(action!=='play'||!cup)return;
   b.disabled=true;win.setTimeout(()=>{
    try{const r=play(engine,cup);persist();render();status('⚽ '+short(engine,r.game.home)+' '+r.game.result.join(' × ')+' '+short(engine,r.game.away)+(r.game.penalties?' · pênaltis '+r.game.penalties.home+' × '+r.game.penalties.away:'')+(r.champion?' · 🏆 '+short(engine,r.champion)+' campeão!':''));}
    catch(error){status('⚠️ '+String(error?.message||error));render();}
   },30);
  });
  section.addEventListener('change',e=>{if(e.target?.id==='neo1030-select'){active=e.target.value;render();}});
  render();
 }
 function render(){
  const box=$('neo1030-active');if(!box)return;
  const cup=cups.find(c=>c.id===active);if(!cup){box.textContent='Nenhuma Copa Eliminatória criada.';return;}
  const done=cup.rounds.reduce((n,r)=>n+r.games.filter(g=>g.result).length,0),total=cup.rounds.reduce((n,r)=>n+r.games.length,0);
  const tab=g=>'<table class="neo1030-table"><thead><tr><th>Clube</th><th>P</th><th>J</th><th>SG</th></tr></thead><tbody>'+groupTable(cup,g).map(x=>'<tr><td>'+esc(short(engine,x.id))+'</td><td>'+x.Pts+'</td><td>'+x.J+'</td><td>'+x.SG+'</td></tr>').join('')+'</tbody></table>';
  box.innerHTML='<label>Campeonato<select id="neo1030-select">'+cups.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===active?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label>'+
   '<p>Jogos concluídos: '+done+' de '+total+(cup.champion?' · 🏆 Campeão: '+esc(short(engine,cup.champion)):'')+'</p>'+
   (cup.teams.length===8?'<details class="neo1030-round"><summary>📊 Grupos A e B</summary><h4>Grupo A</h4>'+tab('A')+'<h4>Grupo B</h4>'+tab('B')+'</details>':'')+
   cup.rounds.map(r=>'<details class="neo1030-round" '+(r===cup.rounds[cup.rounds.length-1]?'open':'')+'><summary>'+esc(r.label)+'</summary>'+
    r.games.map(g=>'<div class="neo1030-game">'+esc(short(engine,g.home))+' <b>'+(g.result?g.result.join(' × '):'— × —')+'</b> '+esc(short(engine,g.away))+
     (g.penalties?' · Pênaltis '+g.penalties.home+' × '+g.penalties.away:'')+
     (g.winner?' · <span class="neo1030-win">✓ '+esc(short(engine,g.winner))+'</span>':'')+'</div>').join('')+'</details>').join('')+
   '<button type="button" class="neo1030-btn" data-neo1030-action="play" '+(next(cup)?'':'disabled')+'>'+(next(cup)?'▶ Simular próximo jogo':'🏆 Torneio encerrado')+'</button>'+
   '<button type="button" class="neo1030-btn neo1030-muted" data-neo1030-action="delete">Excluir esta copa</button>';
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mountUI,{once:true});else mountUI();
}
return {SAVE_KEY,create,groupTable,next,shootout,advance,play,safeLoad,save,mount};
});