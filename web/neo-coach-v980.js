/* Blue Lock NEO v9.8 — coaches use actual recent results to change starting XI. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.NeoCoach980=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const G={GOL:'G',GK:'G',ZAG:'D',CB:'D',LD:'D',LE:'D',RB:'D',LB:'D',ALA:'D',LWB:'D',RWB:'D',VOL:'M',CDM:'M',MC:'M',CM:'M',MEI:'M',CAM:'M',MAT:'M',PD:'F',PE:'F',RW:'F',LW:'F',CA:'F',ST:'F',CF:'F',SA:'F'};
const group=role=>G[String(role||'MC').toUpperCase()]||'M';
const N=x=>Number.isFinite(+x)?Math.max(0,+x):0;
const BENCH_HINTS={
 'Bachman':'GOL','Teppei Neru':'LD','Theo Sachs':'ZAG','Jin Kiyora':'MC','Erik Gesner':'MC','Benedict Grim':'CA','Gurimu Igarashi':'ZAG',
 'Gomez':'ZAG','Espresso':'MC','Aiki Himizu':'MC','Itsuki Wakatsuki':'MEI','Shizuka Haiji':'VOL','Tetsu Sokura':'ZAG','Teru Kitsunezato':'PD',
 'Driver':'MC','Swift':'MEI','Arthur':'MC','Kairu Saramadara':'ZAG','Junichi Wanima':'CA','Taiga Tsunzaki':'MC',
 'Kento Cho':'CA','Haruhiko Yuzu':'PD','Akira Endoji':'MC',
 'Gen Fukaku':'GOL','Abdi':'ZAG','Kyohei Shiguma':'CA','Yukio Ishikari':'ZAG'
};
function compatible(role,backup){
 const a=String(role||'').toUpperCase(),b=String(backup||'').toUpperCase();
 if(a===b)return true;
 const groupA=group(a),groupB=group(b);
 if(groupA!==groupB)return false;
 if(groupA==='G')return true;
 if(groupA==='D')return ['ZAG','CB'].includes(a)&&['ZAG','CB'].includes(b)||['LD','RB'].includes(a)&&['LD','RB','ALA','RWB'].includes(b)||['LE','LB'].includes(a)&&['LE','LB','ALA','LWB'].includes(b)||['ALA','LWB','RWB'].includes(a)&&['ALA','LD','LE','LWB','RWB'].includes(b);
 if(groupA==='M')return ['VOL','CDM'].includes(a)&&['VOL','CDM'].includes(b)||['MC','CM','MEI','CAM','MAT'].includes(a)&&['MC','CM','MEI','CAM','MAT'].includes(b);
 if(groupA==='F')return ['PD','RW'].includes(a)&&['PD','RW'].includes(b)||['PE','LW'].includes(a)&&['PE','LW'].includes(b)||['CA','CF','ST','SA'].includes(a)&&['CA','CF','ST','SA'].includes(b);
 return false;
}
function reserveRole(team,name){
 const starterIndex=team.players?.indexOf(name)??-1;
 if(starterIndex>=0)return (team.formation||[])[starterIndex]?.role||'MC';
 // Extra/custom teams provide their own precise bench positions. Never
 // downgrade History goalkeepers, wingers or strikers to the generic MC hint.
 const supplied=team.reserveRoles?.[name]||team.suppliedRatings?.[name]?.role;
 if(supplied)return String(supplied).toUpperCase();
 const historical=typeof globalThis!=='undefined'?globalThis.NeoHistoric970?.getTeam?.(team.id):null;
 const stored=historical?.reserves?.find(r=>r[0]===name)||historical?.starters?.find(r=>r[0]===name);
 return stored?.[1]||BENCH_HINTS[name]||'MC';
}
function contextFor(team,league,cups=[]){
 // The league can include history and newly registered clubs. Trust actual
 // membership/fixtures instead of the original five-team engine constant.
 if(league&&(Array.isArray(league.teamIds)&&league.teamIds.includes(team.id)||league.rounds?.some(r=>r.games?.some(g=>g.home===team.id||g.away===team.id))))return league;
 return (Array.isArray(cups)?cups:[]).find(c=>c.teams?.includes(team.id))||null;
}
function form(season,id){
 const all=[];
 for(const r of season?.rounds||[])for(const game of r.games||[]){
  if(!Array.isArray(game.result)||!game.result.every(Number.isFinite))continue;
  if(game.home!==id&&game.away!==id)continue;
  const side=game.home===id?0:1,own=game.result[side],opp=game.result[1-side];
  all.push({round:r.round||0,won:own>opp,draw:own===opp,lost:own<opp,own,opp,
   formationName:game.details?.coachPlans?.[side]?.formationName||null});
 }
 const recent=all.slice(-5),last3=recent.slice(-3);
 let streak=0;for(let i=recent.length-1;i>=0;i--){if(!recent[i].lost)break;streak++;}
 const losses=last3.filter(x=>x.lost).length,goals=last3.reduce((n,x)=>n+x.own,0),conceded=last3.reduce((n,x)=>n+x.opp,0);
 const underPressure=streak>=2||losses>=2||(last3.length>=3&&goals<=1&&last3.filter(x=>x.won).length===0);
 return {played:all.length,streak,lossesLast3:losses,last3Goals:goals,last3Conceded:conceded,underPressure,recent};
}
function recentRatings(name,club,season){
 const ratings=[];
 for(const round of season?.rounds||[])for(const game of round.games||[]){
  if(!Array.isArray(game.result)||!Array.isArray(game.details?.players))continue;
  const side=game.home===club?0:game.away===club?1:-1;
  if(side<0)continue;
  const athlete=game.details.players.find(p=>p.name===name&&p.side===side&&!p.isMaster&&
   p.rating!==null&&p.rating!==undefined&&Number.isFinite(Number(p.rating)));
  if(athlete)ratings.push(Math.max(0,Math.min(10,Number(athlete.rating))));
 }
 return ratings.slice(-3);
}
function perf(name,team,season){
 const s=season?.career?.players?.[name+'|'+team.id]||{};
 const recent=recentRatings(name,team.id,season),games=Math.max(N(s.games),recent.length);
 if(!games)return null;
 const careerRating=N(s.ratingSum)>0&&N(s.games)>0?N(s.ratingSum)/N(s.games):null;
 const rating=recent.length?recent.reduce((sum,n)=>sum+n,0)/recent.length:careerRating;
 const poorRun=recent.length>=2&&recent.slice(-2).every(n=>n<=6.3);
 const poorAverage=recent.length>=3&&recent.reduce((sum,n)=>sum+n,0)/recent.length<6.2;
 const poorSeason=!recent.length&&N(s.games)>=3&&careerRating!==null&&careerRating<6;
 return {games,rating,goals:N(s.goals),assists:N(s.assists),recent,
  poor:poorRun||poorAverage||poorSeason};
}
function overall(Attr,team,name,role,index,season){
 const saved=season?.career?.players?.[name+'|'+team.id];
 try{return Attr?.generate?.(name,role,index,saved)?.ovr||N(saved?.ovr)||75;}catch(e){return N(saved?.ovr)||75;}
}
// Formations are real match slots, not decorative labels. Each candidate must
// have a playable XI with an actual keeper, defenders, midfielders and forwards.
const SHAPES=Object.freeze({
 '3-2-5':['ZAG','ZAG','ZAG','MC','MC','PD','PE','CA','CA','SA'],
 '3-3-4':['ZAG','ZAG','ZAG','MC','MC','MEI','PD','PE','CA','CA'],
 '3-4-3':['ZAG','ZAG','ZAG','MC','MC','MC','MEI','PD','CA','PE'],
 '3-5-2':['ZAG','ZAG','ZAG','VOL','MC','MC','MEI','ALA','CA','SA'],
 '4-3-3':['LD','ZAG','ZAG','LE','VOL','MC','MEI','PD','CA','PE'],
 '4-4-2':['LD','ZAG','ZAG','LE','MC','MC','MC','MEI','CA','SA'],
 '4-2-3-1':['LD','ZAG','ZAG','LE','VOL','MC','PD','MEI','PE','CA']
});
function shapeSlots(name){
 const roles=SHAPES[name];if(!roles)return null;
 const types=roles.map(r=>group(r));
 return [{role:'GOL',x:.045,y:.5},...roles.map((role,i)=>{
  const g=types[i],same=types.reduce((a,v)=>a+(v===g),0),at=types.slice(0,i).filter(x=>x===g).length;
  return {role,x:g==='D'?.16:g==='M'?.45:.75,y:(at+1)/(same+1)};
 })];
}
function preferredRole(team,name){
 const original=team.players.indexOf(name);
 return String(team.suppliedRatings?.[name]?.role||team.reserveRoles?.[name]||
  (original>=0?team.formation?.[original]?.role:null)||reserveRole(team,name)).toUpperCase();
}
function rolePenalty(position,role){
 if(position===role)return 0;
 if(compatible(position,role))return 2.5;
 if(group(position)===group(role))return group(position)==='D'?9:7;
 return 28;
}
// Minimum-cost rectangular assignment: unlike a greedy roster sort, this does
// not use the only natural center-back in a fullback slot before filling CB.
function assign(roles,pool,score){
 const n=roles.length,m=pool.length;if(m<n)return null;
 const u=Array(n+1).fill(0),v=Array(m+1).fill(0),p=Array(m+1).fill(0),way=Array(m+1).fill(0);
 for(let i=1;i<=n;i++){
  p[0]=i;let j0=0;const min=Array(m+1).fill(Infinity),used=Array(m+1).fill(false);
  do{
   used[j0]=true;const i0=p[j0];let delta=Infinity,j1=0;
   for(let j=1;j<=m;j++)if(!used[j]){
    const cur=110-score(i0-1,j-1)-u[i0]-v[j];
    if(cur<min[j]){min[j]=cur;way[j]=j0;}
    if(min[j]<delta){delta=min[j];j1=j;}
   }
   for(let j=0;j<=m;j++){if(used[j]){u[p[j]]+=delta;v[j]-=delta;}else min[j]-=delta;}
   j0=j1;
  }while(p[j0]!==0);
  do{const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0!==0);
 }
 const picked=Array(n).fill(null);
 for(let j=1;j<=m;j++)if(p[j])picked[p[j]-1]=pool[j-1];
 return picked;
}
function chooseFormation(team,season,Attr,result){
 const history=result.form,last=history.recent.at(-1),lastShape=last?.formationName;
 if(history.played<2&&!lastShape)return result;
 if(!history.underPressure&&!result.changes.length&&!lastShape)return result;
 const initial=team.players.slice(),everyone=[...new Set([...initial,...team.reserves])];
 const keep=typeof globalThis!=='undefined'?globalThis.NeoEngine?.listCreatedPlayers?.()
  .filter(p=>p.club===team.id).map(p=>p.name)||[]:[];
 const gk=initial[0],pool=everyone.filter(n=>n!==gk&&group(preferredRole(team,n))!=='G');
 const scored=history.recent.slice(-3).reduce((a,x)=>a+x.own,0);
 const conceded=history.recent.slice(-3).reduce((a,x)=>a+x.opp,0);
 const attackerNeeded=scored<=2,defenderNeeded=conceded>=4;
 const quality=(name,role)=>{
  const natural=preferredRole(team,name),f=perf(name,team,season);
  return overall(Attr,team,name,natural,1,season)-rolePenalty(role,natural)
   -(f?.poor?8:0)+(initial.includes(name)?1.2:0);
 };
 const originalShape=team.formationName||'4-3-3';
 const options=[...new Set([originalShape,...Object.keys(SHAPES)])].filter(x=>SHAPES[x]);
 let best=null;
 for(const name of options){
  const formation=shapeSlots(name),roles=SHAPES[name];
  const picked=assign(roles,pool,(i,j)=>quality(pool[j],roles[i]));
  if(!picked||keep.some(x=>!picked.includes(x)))continue;
  if(roles.some((role,i)=>!compatible(role,preferredRole(team,picked[i]))))continue;
  const players=[gk,...picked],promoted=players.filter(x=>!initial.includes(x)),benched=initial.filter(x=>!players.includes(x));
  if(promoted.length>3||promoted.length!==benched.length)continue;
  const rolesByName=Object.fromEntries(players.map((x,i)=>[x,formation[i].role]));
  if(promoted.some(x=>overall(Attr,team,x,preferredRole(team,x),1,season)<80))continue;
  const defs=roles.filter(r=>group(r)==='D').length,mids=roles.filter(r=>group(r)==='M').length,front=10-defs-mids;
  let score=roles.reduce((a,r,i)=>a+quality(picked[i],r),0)/10;
  score+=1.5*Math.min(mids,3)+.65*Math.min(defs,4)-Math.max(0,front-4)*2.2;
  if(defenderNeeded)score+=defs*1.8;
  if(attackerNeeded)score+=front*.75;
  if(history.streak>=2&&name===(lastShape||originalShape))score-=8;
  // A losing experiment cannot be repeated indefinitely. A winning switch
  // stays in place until results offer a reason to change it again.
  if(lastShape===name)score+=last?.lost?-6:5;
  if(name===originalShape&&!lastShape)score+=1;
  if(!best||score>best.score)best={name,formation,players,promoted,benched,rolesByName,score};
 }
 if(!best)return result;
 if(best.name===originalShape&&best.promoted.length===0&&!lastShape)return result;
 // Do not punish a successful experimental formation for the absence of a
 // fresh losing streak; continue that approach until it stops working.
 if(lastShape&&last&&!last.lost&&best.name!==lastShape){
  const saved=shapeSlots(lastShape);if(saved){const selected=options.includes(lastShape)?lastShape:null;
   if(selected){const stable=assign(SHAPES[selected],pool,(i,j)=>quality(pool[j],SHAPES[selected][i]));
    if(stable&&keep.every(x=>stable.includes(x))&&SHAPES[selected].every((role,i)=>compatible(role,preferredRole(team,stable[i]))))
     best={...best,name:selected,formation:saved,players:[gk,...stable],promoted:stable.filter(x=>!initial.includes(x)),benched:initial.filter(x=>![gk,...stable].includes(x))};
   }
  }
 }
 const changes=best.promoted.map((name,i)=>{
  const out=best.benched[i],index=best.players.indexOf(name),role=best.formation[index].role;
  return {out,in:name,role,position:index,oldOvr:overall(Attr,team,out,preferredRole(team,out),1,season),
   newOvr:overall(Attr,team,name,preferredRole(team,name),1,season)};
 });
 if(changes.some(x=>x.newOvr<x.oldOvr-8))return result;
 result.players=best.players;
 result.reserves=[...team.reserves.filter(n=>!best.promoted.includes(n)),...best.benched];
 result.changes=changes;
 result.formation=best.formation;
 result.formationName=best.name;
 result.formationChanged=best.name!==originalShape;
 result.reason='🧠 Técnico '+(lastShape&&last?.lost?'reage à formação que falhou':
  history.underPressure?'ajusta o esquema após resultados ruins':
  result.changes.length?'avalia Notas baixas e ajusta a formação':'mantém a tática que funcionou')+
  ': '+best.name+(changes.length?' · '+changes.length+' mudança(s) no XI':'');
 return result;
}
function planLineup(team,season,Attr){
 const current=team.players.slice(0,11),bench=team.reserves.slice();const history=form(season,team.id);
 const result={teamId:team.id,players:current.slice(),reserves:bench.slice(),changes:[],form:history,reason:history.underPressure?'Técnico analisa sequência negativa':'Escalação titular mantida'};
 if(current.length!==11)return result;
 const formation=team.formation||[],slots=[],originalBench=bench.slice(),usedBench=new Set();
 for(let i=1;i<11;i++){
  const role=formation[i]?.role||'MC',p=perf(current[i],team,season),ovr=overall(Attr,team,current[i],role,i,season);
  const score=ovr+(p?.rating!==null&&p?.rating!==undefined?Math.max(-12,Math.min(5,(p.rating-6.4)*6)):0)-(p?.poor?7:0);
  // Goalkeeper stays at position 0; only similar-role and sensible-quality changes.
  slots.push({index:i,name:current[i],role,ovr,score,perf:p,poor:!!p?.poor});
 }
 if(!history.underPressure&&!slots.some(s=>s.poor))return chooseFormation(team,season,Attr,result);
 slots.sort((a,b)=>Number(b.poor)-Number(a.poor)||a.score-b.score);
 for(const s of slots){
  if(result.changes.length>=2)break;
  if(!history.underPressure&&!s.poor)continue;
  // Protect player characters explicitly created by the user.
  if(typeof globalThis!=='undefined'&&globalThis.NeoEngine?.listCreatedPlayers?.().some(p=>p.club===team.id&&p.name===s.name))continue;
  const choices=originalBench.map((name,index)=>{
   const role=reserveRole(team,name);return {name,index,role,ovr:overall(Attr,team,name,role,12+index,season)};
  }).filter(b=>!usedBench.has(b.name)&&compatible(s.role,b.role)&&b.ovr>=s.ovr-8)
    .sort((a,b)=>b.ovr-a.ovr);
  if(!choices.length)continue;
  const reserve=choices[0],lowest=s.poor||s.perf?.rating!==null&&s.perf?.rating!==undefined&&s.perf.rating<6.7;
  if(!lowest&&reserve.ovr<s.ovr-3)continue;
  const original=result.players[s.index];result.players[s.index]=reserve.name;
  const reserveIndex=result.reserves.indexOf(reserve.name);if(reserveIndex>=0)result.reserves.splice(reserveIndex,1);usedBench.add(reserve.name);result.reserves.push(original);
  result.changes.push({out:original,in:reserve.name,role:s.role,position:s.index,oldOvr:s.ovr,newOvr:reserve.ovr});
 }
 const cause=history.underPressure?(history.streak?history.streak+' derrota(s) seguida(s)':'Sequência de resultados ruins'):'Notas baixas em partidas recentes';
 result.reason=result.changes.length?`🧠 ${cause}: ${result.changes.length} alteração(ões) na escalação`:'🧠 '+cause+'; reservas analisados, titulares mantidos por qualidade e posição';
 return chooseFormation(team,season,Attr,result);
}
return {group,compatible,reserveRole,contextFor,form,recentRatings,perf,overall,planLineup,shapeSlots,chooseFormation};
});
