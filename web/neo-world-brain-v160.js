/* Blue Lock NEO 1.5 — WORLD BRAIN.
 * Additive tactical intelligence and season memory. No synthetic match
 * results, player transfers, awards, photos or hidden save migrations.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root?.NeoEngine)api.adapt(root.NeoEngine);
  if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const val=x=>Number.isFinite(Number(x))?Number(x):0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const keeper=p=>p&&(p.i===0||/^(GOL|GK)$/.test(p.role||''));
const defenders=p=>/^(ZAG|CB|LD|LE|RB|LB|ALA|VOL|CDM)$/.test(String(p?.role||''));
const memoKey=(p)=>String(p.side)+':'+String(p.name);
function keeperRead(match,goalkeeper,stat){
 if(!match||!keeper(goalkeeper)||stat!=='reflexes'||match.ball?.mode!=='shot')return 1;
 const shot=match.ball,attacker=shot.by;
 if(!attacker||attacker.side===goalkeeper.side||!Array.isArray(match.shotMap))return 1;
 // Requires multiple actual shots. A current shot is already in shotMap.
 let count=0;
 const recent=match.shotMap;
 for(let i=recent.length-1;i>=0&&i>=recent.length-65;i--){
  const s=recent[i];
  if(s?.shooter===attacker.name&&s.side===attacker.side)count++;
 }
 if(count<3)return 1;
 const vision=val(goalkeeper.attributes?.vision),reflex=val(goalkeeper.attributes?.reflexes);
 if(vision<65&&reflex<78)return 1;
 return 1+clamp((count-2)*.006,0,.034);
}
function opportunityPass(match,player){
 if(!match||!player||player.i===0||match.phase!=='play'||match.ball?.owner!==player)return false;
 const prog=typeof match.progress==='function'?match.progress(player.side,player.x):0;
 if(prog<1010||prog>1540)return false;
 const pressure=match.opponentPressure?.(player,58)||0;
 if(pressure<1||match.shotQuality?.(player)>.26||match.random()>=.29)return false;
 const others=(match.players||[]).filter(q=>q&&q!==player&&q.side===player.side&&q.i!==0&&finite(q)&&
  (match.progress?.(q.side,q.x)||0)>1310&&Math.abs(q.y-576)<195&&
  !match.offside?.(q,player)&&dist(q,player)<335&&dist(q,player)>45);
 if(!others.length)return false;
 let receiver=null,best=-Infinity;
 for(const q of others){
  const lane=match.safeLane?.(player,q)||0;
  const crowd=match.opponentPressure?.(q,80)||0;
  const d=dist(player,q);
  const value=lane-2.6*crowd*13-d*.12+val(q.attributes?.positioning)*.10;
  if(lane>45&&crowd<2&&value>best){best=value;receiver=q;}
 }
 if(!receiver)return false;
 const out=match.pass?.(player,receiver);
 // Only claim the combination if the actual ball has been launched.
 const real=match.ball?.mode==='pass'&&match.ball.by===player&&match.ball.to===receiver;
 if(real&&match.time-(match._neo160LastBoxAssist||-1e6)>145){
  match._neo160LastBoxAssist=match.time;
  match.log?.('🎯 '+player.name+' vê '+receiver.name+' entrando na área e troca o chute pelo passe!','pass',player.name);
 }
 return !!real;
}
function coverShape(match,p,target,phase){
 if(!match||!p||!finite(p)||!target||!finite(target)||!defenders(p)||p.i===0||
  match.phase!=='play'||!['block','transition-defense'].includes(phase))return target;
 const b=match.ball;if(!finite(b)||b.owner?.side===p.side)return target;
 const territory=match.progress?.(p.side,b.x);
 if(!Number.isFinite(territory)||territory>650)return target;
 // Only the SECOND closest defender provides cover; the closest presses.
 const defendersOnSide=(match.players||[]).filter(q=>q&&q.side===p.side&&q.i!==0&&defenders(q)&&finite(q));
 defendersOnSide.sort((a,b)=>dist(a,ballTarget(match))-dist(b,ballTarget(match))||val(a.id)-val(b.id));
 const second=defendersOnSide[1];if(second!==p)return target;
 // Cover halfway between danger and the central shooting channel.
 const ownGoal=p.side===0?75:1845;
 const dangerX=clamp((b.x+ownGoal)*.5,75,1845);
 const dangerY=clamp(576+(b.y-576)*.27,90,1062);
 return {x:clamp(target.x*.84+dangerX*.16,75,1845),
         y:clamp(target.y*.78+dangerY*.22,45,1105)};
}
function ballTarget(match){return {x:val(match.ball?.x),y:val(match.ball?.y)};}
function coachAdjustment(match){
 if(!match||!match.autoCoach||match.finished||match.phase!=='play'||match.time<32*60)return [];
 if(match.time-(match._neo160CoachCheck||-1e6)<195)return [];
 match._neo160CoachCheck=match.time;
 const results=[];
 for(let side=0;side<2;side++){
  if(match.coachLocked?.[side])continue;
  const long=val(match.stats?.longShots?.[side]);
  const box=val(match.stats?.boxShots?.[side]);
  const enemyBox=val(match.stats?.boxShots?.[1-side]);
  const isBehind=val(match.score?.[side])<val(match.score?.[1-side]);
  let reason=null;
  if(isBehind&&long>=4&&long>box*1.5&&match.buildUp?.[side]!=='patient'){
   match.buildUp[side]='patient';
   if(Array.isArray(match.attackWidth))match.attackWidth[side]='wide';
   reason='criar chances dentro da área, reduzindo chutes distantes';
  }else if(!isBehind&&enemyBox>=5&&val(match.score?.[side])>val(match.score?.[1-side])&&match.attackWidth?.[side]!=='narrow'){
   match.attackWidth[side]='narrow';
   if(Array.isArray(match.pressing))match.pressing[side]='balanced';
   reason='fechar os espaços centrais após pressão adversária';
  }
  if(reason){
   const info={side,minute:Math.floor(match.time/60),type:'tactical-read',reason};
   if(Array.isArray(match.coachDecisions)){match.coachDecisions.push(info);if(match.coachDecisions.length>100)match.coachDecisions.shift();}
   match.log?.('🧠 Técnico do '+(match.teams?.[side]?.short||'time')+' adapta a equipe para '+reason+'.','coach');
   results.push(info);
  }
 }
 return results;
}
function playerImpact(p){
 if(!p||val(p.games)<=0)return 0;
 const games=Math.max(1,val(p.games));
 const keeperRole=/^(GOL|GK)$/.test(p.role||'');
 const defRole=/^(ZAG|CB|LD|LE|RB|LB|VOL|CDM|ALA|LWB|RWB)$/.test(p.role||'');
 const impact=val(p.goals)*3.2+val(p.assists)*2.5+val(p.dribbles)*.35+
  val(p.keyPasses)*.26+val(p.flowCount)*.35+
  (keeperRole?val(p.saves)*.47+val(p.cleanSheets)*2.8:0)+
  (defRole?(val(p.tackles)+val(p.interceptions))*.32+val(p.shotBlocks)*.65:0);
 const rating=val(p.ratingSum)/games;
 return +(impact/games+Math.max(0,rating-6)*1.2).toFixed(2);
}
function seasonHighlights(career){
 const timeline=Object.values(career?.players||{}).filter(p=>p&&val(p.games)>0);
 const ranked=timeline.map(p=>({name:p.name,club:p.club,role:p.role,games:val(p.games),ego:playerImpact(p)}))
  .sort((a,b)=>b.ego-a.ego||a.name.localeCompare(b.name));
 const teams=Object.entries(career?.worldTeams||{}).map(([id,t])=>({id,...t}))
  .sort((a,b)=>val(b.shots)-val(a.shots));
 return {ranked,teams};
}
function recordSeason(season,fixture,match,round){
 const career=season?.career,report=match?.result?.();
 if(!career||!Array.isArray(report?.players)||!fixture?.home||!fixture?.away)return false;
 career.worldRecorded=career.worldRecorded||{};
 const eventKey=round+'|'+fixture.home+'|'+fixture.away;
 if(career.worldRecorded[eventKey])return false;
 career.worldRecorded[eventKey]=1;
 career.worldTeams=career.worldTeams||{};
 for(let side=0;side<2;side++){
  const id=side===0?fixture.home:fixture.away;
  const row=career.worldTeams[id]||(career.worldTeams[id]={games:0,shots:0,boxShots:0,longShots:0,goals:0,conceded:0,passes:0,history:[]});
  const stats=report.stats||{};
  const values={games:1,shots:val(stats.shots?.[side]),boxShots:val(stats.boxShots?.[side]),
   longShots:val(stats.longShots?.[side]),goals:val(report.score?.[side]),
   conceded:val(report.score?.[1-side]),passes:val(stats.completed?.[side])};
  for(const [k,v] of Object.entries(values))row[k]=val(row[k])+v;
  row.history=Array.isArray(row.history)?row.history:[];
  row.history.push({round,against:side===0?fixture.away:fixture.home,goals:values.goals,conceded:values.conceded,boxShots:values.boxShots,longShots:values.longShots});
  if(row.history.length>12)row.history.splice(0,row.history.length-12);
 }
 for(const p of report.players){
  if(!p||p.isMaster||!p.name||![0,1].includes(p.side))continue;
  const club=p.side===0?fixture.home:fixture.away,entry=career.players?.[p.name+'|'+club];
  if(!entry)continue;
  entry.worldTimeline=Array.isArray(entry.worldTimeline)?entry.worldTimeline:[];
  const rivals=(report.duelHistory||[]).filter(d=>(d.attacker===p.name||d.defender===p.name)).slice(-10);
  const feats=(report.egoCombat?.awakenings||[]).filter(a=>a.name===p.name);
  const activity=(report.egoAscension?.events||[]).filter(a=>a.player===p.name).slice(-5);
  entry.worldTimeline.push({round,opponent:p.side===0?fixture.away:fixture.home,club,
   goals:val(p.goals),assists:val(p.assists),saves:val(p.saves),tackles:val(p.tackles),
   interceptions:val(p.interceptions),duels:rivals.length,awakens:feats.length,
   breakthroughs:activity.length,flow:val(p.flowCount),rating:val(p.rating)});
  if(entry.worldTimeline.length>16)entry.worldTimeline.splice(0,entry.worldTimeline.length-16);
 }
 const keys=Object.keys(career.worldRecorded);
 if(keys.length>180)for(const k of keys.slice(0,keys.length-180))delete career.worldRecorded[k];
 return true;
}
function adapt(engine){
 const proto=engine?.Match?.prototype;
 if(!proto||proto._neo160WorldBrain)return false;
 if(typeof proto._attributes==='function'){
  const original=proto._attributes;
  proto._attributes=function(player,key){
   const value=original.call(this,player,key);
   if(!Number.isFinite(value)||!keeper(player))return value;
   return clamp(value*keeperRead(this,player,key),1,125);
  };
 }
 if(typeof proto._ownerDecision==='function'){
  const original=proto._ownerDecision;
  proto._ownerDecision=function(player){
   if(opportunityPass(this,player))return;
   return original.call(this,player);
  };
 }
 if(typeof proto._defensivePositionalTarget==='function'){
  const original=proto._defensivePositionalTarget;
  proto._defensivePositionalTarget=function(p,target,phase){return coverShape(this,p,original.call(this,p,target,phase),phase);};
 }
 if(typeof proto._coachDecisions==='function'){
  const original=proto._coachDecisions;
  proto._coachDecisions=function(){const value=original.call(this);coachAdjustment(this);return value;};
 }
 const progress=engine.Progression;
 if(progress&&typeof progress.record==='function'&&!progress._neo160SeasonMemory){
  const original=progress.record;
  progress.record=function(season,fixture,match,round){
   const value=original.call(this,season,fixture,match,round);
   recordSeason(season,fixture,match,round);
   return value;
  };
  Object.defineProperty(progress,'_neo160SeasonMemory',{value:true});
 }
 Object.defineProperty(proto,'_neo160WorldBrain',{value:true});
 return true;
}
function mount(win){
 const doc=win.document;const make=(tag,cls,txt)=>{
  const el=doc.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=String(txt);return el;
 };
 let selected='';
 function render(){
  const root=doc.getElementById('records');if(!root)return;
  let section=doc.getElementById('neo160-encyclopedia');
  if(!section){section=make('section','neo160-encyclopedia');section.id='neo160-encyclopedia';root.append(section);}
  let saved;try{saved=JSON.parse(win.localStorage.getItem('neo-season-v2')||'null')}catch(_){saved=null;}
  const career=saved?.career||{},view=seasonHighlights(career);
  if(selected&&!view.ranked.some(p=>p.name+'|'+p.club===selected))selected='';
  if(!selected&&view.ranked.length)selected=view.ranked[0].name+'|'+view.ranked[0].club;
  section.replaceChildren();
  const title=make('div','neo160-heading');
  title.append(make('strong',null,'📚 ENCICLOPÉDIA DE EGOÍSTAS'),make('small',null,'MEMÓRIA DA TEMPORADA · '+view.ranked.length+' ATLETAS'));
  section.append(title);
  const picker=make('label','neo160-picker');
  picker.append(make('span',null,'Histórico individual'));
  const select=make('select',null);
  select.setAttribute('aria-label','Selecionar atleta para a enciclopédia');
  for(const p of view.ranked.slice(0,200)){
   const option=make('option',null,p.name+' · '+p.club+' — Ego '+p.ego.toFixed(2));
   option.value=p.name+'|'+p.club;select.append(option);
  }
  select.value=selected;
  select.addEventListener('change',()=>{selected=select.value;render();});
  picker.append(select);section.append(picker);
  const output=make('div','neo160-content');section.append(output);
  const info=view.ranked.find(p=>p.name+'|'+p.club===selected),row=info?career.players?.[selected]:null;
  if(!row){output.append(make('p','neo160-empty','Nenhuma partida registrada ainda. Os dados aparecem após a primeira rodada.'));}
  else{
   const summary=make('div','neo160-profile');
   summary.append(make('strong',null,info.name),
    make('span',null,'Clube '+info.club+' · '+(info.role||'Atleta')+' · '+info.games+' jogos · Índice de Ego '+info.ego.toFixed(2)));
   const feats=make('p',null,'⚽ '+val(row.goals)+' gols  · 🎯 '+val(row.assists)+' assistências  · 🧤 '+val(row.saves)+' defesas  · ⚡ '+val(row.flowCount)+' Flow');
   summary.append(feats);output.append(summary);
   output.append(make('h4',null,'📜 Linha do tempo de partidas reais'));
   const events=(row.worldTimeline||row.history||[]).slice(-12).reverse();
   if(!events.length)output.append(make('p','neo160-empty','O histórico detalhado será construído nas próximas partidas.'));
   else{
    const timeline=make('div','neo160-timeline');
    for(const e of events){
     const p=make('p',null,'Rodada '+val(e.round)+' · '+(e.opponent||e.match||'Adversário')+
      ' · '+val(e.goals)+'G '+val(e.assists)+'A · '+val(e.saves)+' defesas · '+val(e.duels)+' duelos · Nota '+val(e.rating).toFixed(1));
     timeline.append(p);
    }
    output.append(timeline);
   }
  }
  if(view.teams.length){
   output.append(make('h4',null,'🧠 Identidade tática baseada em partidas'));
   const grid=make('div','neo160-teamgrid');
   for(const team of view.teams.slice(0,10)){
    const avg=team.games?team.boxShots/team.games:0;
    const style=team.boxShots>team.longShots?'Construção na área':team.longShots>team.boxShots?'Finalizações distantes':'Jogo equilibrado';
    const b=make('div','neo160-team');
    b.append(make('strong',null,team.id+' · '+style),make('span',null,team.games+' jogos · '+team.shots+' chutes · '+team.boxShots+' na área · '+avg.toFixed(1)+' por jogo'));
    grid.append(b);
   }
   output.append(grid);
  }
 }
 const boot=()=>{if(!doc.getElementById('records'))return;render();
  doc.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="records"],[data-neo-tab="records"]'))win.setTimeout(render,100);});
  win.addEventListener('focus',render);
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {keeperRead,opportunityPass,coverShape,coachAdjustment,playerImpact,seasonHighlights,recordSeason,adapt,mount};
});