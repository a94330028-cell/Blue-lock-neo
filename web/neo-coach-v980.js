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
 const historical=typeof globalThis!=='undefined'?globalThis.NeoHistoric970?.getTeam?.(team.id):null;
 const stored=historical?.reserves?.find(r=>r[0]===name)||historical?.starters?.find(r=>r[0]===name);
 return stored?.[1]||BENCH_HINTS[name]||'MC';
}
function form(season,id){
 const all=[];
 for(const r of season?.rounds||[])for(const game of r.games||[]){
  if(!Array.isArray(game.result)||!game.result.every(Number.isFinite))continue;
  if(game.home!==id&&game.away!==id)continue;
  const side=game.home===id?0:1,own=game.result[side],opp=game.result[1-side];
  all.push({round:r.round||0,won:own>opp,draw:own===opp,lost:own<opp,own,opp});
 }
 const recent=all.slice(-5),last3=recent.slice(-3);
 let streak=0;for(let i=recent.length-1;i>=0;i--){if(!recent[i].lost)break;streak++;}
 const losses=last3.filter(x=>x.lost).length,goals=last3.reduce((n,x)=>n+x.own,0),conceded=last3.reduce((n,x)=>n+x.opp,0);
 const underPressure=streak>=2||losses>=2||(last3.length>=3&&goals<=1&&last3.filter(x=>x.won).length===0);
 return {played:all.length,streak,lossesLast3:losses,last3Goals:goals,last3Conceded:conceded,underPressure,recent};
}
function perf(name,team,season){
 const s=season?.career?.players?.[name+'|'+team.id]||{};
 if(!N(s.games))return null;
 return {games:N(s.games),rating:N(s.ratingSum)/N(s.games),goals:N(s.goals),assists:N(s.assists)};
}
function overall(Attr,team,name,role,index,season){
 const saved=season?.career?.players?.[name+'|'+team.id];
 try{return Attr?.generate?.(name,role,index,saved)?.ovr||N(saved?.ovr)||75;}catch(e){return N(saved?.ovr)||75;}
}
function planLineup(team,season,Attr){
 const current=team.players.slice(0,11),bench=team.reserves.slice();const history=form(season,team.id);
 const result={teamId:team.id,players:current.slice(),reserves:bench.slice(),changes:[],form:history,reason:history.underPressure?'Técnico analisa sequência negativa':'Escalação titular mantida'};
 if(!history.underPressure||current.length!==11)return result;
 const formation=team.formation||[],slots=[],originalBench=bench.slice(),usedBench=new Set();
 for(let i=1;i<11;i++){
  const role=formation[i]?.role||'MC',p=perf(current[i],team,season),ovr=overall(Attr,team,current[i],role,i,season);
  const score=ovr+(p?Math.max(-12,Math.min(5,(p.rating-6.4)*6)):0);
  // Goalkeeper stays at position 0; only similar-role and sensible-quality changes.
  slots.push({index:i,name:current[i],role,ovr,score,perf:p});
 }
 slots.sort((a,b)=>a.score-b.score);
 for(const s of slots){
  if(result.changes.length>=2)break;
  // Protect player characters explicitly created by the user.
  if(typeof globalThis!=='undefined'&&globalThis.NeoEngine?.listCreatedPlayers?.().some(p=>p.club===team.id&&p.name===s.name))continue;
  const choices=originalBench.map((name,index)=>{
   const role=reserveRole(team,name);return {name,index,role,ovr:overall(Attr,team,name,role,12+index,season)};
  }).filter(b=>!usedBench.has(b.name)&&compatible(s.role,b.role)&&b.ovr>=s.ovr-8)
    .sort((a,b)=>b.ovr-a.ovr);
  if(!choices.length)continue;
  const reserve=choices[0],lowest=s.perf&&s.perf.rating<6.7;
  if(!lowest&&reserve.ovr<s.ovr-3)continue;
  const original=result.players[s.index];result.players[s.index]=reserve.name;
  const reserveIndex=result.reserves.indexOf(reserve.name);if(reserveIndex>=0)result.reserves.splice(reserveIndex,1);usedBench.add(reserve.name);result.reserves.push(original);
  result.changes.push({out:original,in:reserve.name,role:s.role,position:s.index,oldOvr:s.ovr,newOvr:reserve.ovr});
 }
 result.reason=result.changes.length?`🧠 ${history.streak?history.streak+' derrota(s) seguida(s)':'Fase ruim'}: ${result.changes.length} alteração(ões) na escalação`:'🧠 Fase ruim; reservas analisados, titulares mantidos por qualidade e posição';
 return result;
}
return {group,compatible,reserveRole,form,perf,overall,planLineup};
});
