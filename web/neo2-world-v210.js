/* Blue Lock NEO 2.0 — verified persistent careers, competitive memory and newsroom.
 * No new save root: everything stays inside season.career.neo2World.
 * Only an officially completed recordFixture() may mutate these histories.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
 if(root)root.Neo2World=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const VERSION=1;
const num=(x)=>Number.isFinite(Number(x))?Number(x):0;
const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
const key=(name,club)=>String(name||'')+'|'+String(club||'');
const compact=(arr,n)=>Array.isArray(arr)?arr.slice(-n):[];
const safeName=(s)=>String(s||'').slice(0,78);
function ensure(season){
 if(!season||typeof season!=='object')return null;
 const career=season.career;
 if(!career||typeof career!=='object')return null;
 const world=career.neo2World||(career.neo2World={version:VERSION,players:{},news:[],recorded:{},rivals:{},teams:{}});
 world.version=VERSION;world.players=world.players||{};world.news=world.news||[];
 world.recorded=world.recorded||{};world.rivals=world.rivals||{};world.teams=world.teams||{};
 return world;
}
function stableKey(fixture,round){return String(round||0)+'|'+String(fixture?.home||'')+'|'+String(fixture?.away||'');}
function observe(season,fixture,match){
 if(!season||!fixture||!Array.isArray(fixture.result)||!match)return false;
 const world=ensure(season);if(!world)return false;
 const round=season.rounds?.find(r=>r.games?.includes(fixture))?.round||0;
 const stamp=stableKey(fixture,round);
 if(world.recorded[stamp])return false;
 const report=fixture.details&&Array.isArray(fixture.details.players)?fixture.details:match.result?.();
 if(!report||!Array.isArray(report.players)||report.players.length===0)return false;
 world.recorded[stamp]=1;
 const score=fixture.result.map(num),teams=[fixture.home,fixture.away];
 const facts=(report.players||[]).filter(p=>p&&[0,1].includes(p.side)&&p.name&&!p.isMaster);
 const teamLines=[{id:fixture.home,goals:score[0],against:score[1]},
                  {id:fixture.away,goals:score[1],against:score[0]}];
 for(const t of teamLines){
  const x=world.teams[t.id]||(world.teams[t.id]={played:0,wins:0,draws:0,losses:0,goals:0,conceded:0});
  x.played++;x.goals+=t.goals;x.conceded+=t.against;
  if(t.goals>t.against)x.wins++;else if(t.goals<t.against)x.losses++;else x.draws++;
 }
 for(const p of facts){
  const club=teams[p.side],opponent=teams[1-p.side],id=key(p.name,club);
  const row=world.players[id]||(world.players[id]={name:safeName(p.name),club,appearances:0,form:[],rivals:{},partners:{},skills:{},signature:'',adaptations:0});
  const rating=limit(num(p.rating)||6,1,10);
  const events={round,opponent,score:score[p.side]+'-'+score[1-p.side],rating,
   goals:num(p.goals),assists:num(p.assists),passes:num(p.passes),tackles:num(p.tackles),
   interceptions:num(p.interceptions),saves:num(p.saves),keyPasses:num(p.keyPasses),
   duelsWon:num(p.duelsWon),dribbles:num(p.dribblesWon),xg:0};
  row.appearances++;row.form=compact(row.form.concat(events),12);
  row.role=p.role||row.role;row.lastOpponent=opponent;
  const style={finisher:events.goals*4+num(p.shots)*.25,playmaker:events.assists*3+events.keyPasses*.7+events.passes*.02,
   guardian:events.tackles*.6+events.interceptions*.6+events.duelsWon*.35,
   goalkeeper:events.saves*1.3,dribbler:events.dribbles*.9};
  const skills=row.archetypes||(row.archetypes={finisher:0,playmaker:0,guardian:0,goalkeeper:0,dribbler:0});
  for(const [type,value] of Object.entries(style))skills[type]=limit(num(skills[type])+value,0,20000);
  row.signature=Object.keys(skills).sort((a,b)=>skills[b]-skills[a]||a.localeCompare(b))[0];
  for(const [id,uses] of Object.entries(p.abilityUses||{}).slice(0,24)){
   if(typeof id!=='string'||id.length>96||num(uses)<=0)continue;
   row.skills[id]=Math.min(9999,num(row.skills[id])+num(uses));
  }
  const sortedSkills=Object.entries(row.skills).sort((a,b)=>b[1]-a[1]).slice(0,24);
  row.skills=Object.fromEntries(sortedSkills);
 }
 const observedPasses=(match&&typeof match==='object'&&
    (typeof window!=='undefined'?window.Neo2DeepAI:null)?.memory?.(match)?.passLanes)||[];
 // The same pass lanes captured by deep AI are genuine decisions, but are
 // not necessarily completed passes. Record chemistry as attempts only.
 const recent=(match?match._neo2PassAttempts:null)||observedPasses;
 for(const e of (Array.isArray(recent)?recent:[])){
  const club=teams[e.side],source=world.players[key(e.from,club)];
  if(!source||!e.to||e.to===e.from)continue;
  source.partners[e.to]=Math.min(2000,num(source.partners[e.to])+1);
 }
 for(const duel of (report.duelHistory||[])){
  if(!duel?.attacker||!duel?.defender||duel.attacker===duel.defender)continue;
  const first=safeName(duel.attacker),second=safeName(duel.defender);
  const pair=[first,second].sort().join(' × ');
  const count=world.rivals[pair]||(world.rivals[pair]={names:[first,second].sort(),duels:0,wins:{}});
  count.duels=Math.min(10000,count.duels+1);
  if(duel.winner)count.wins[duel.winner]=Math.min(10000,num(count.wins[duel.winner])+1);
 }
 const scored=(report.goalRecords||[]).filter(x=>x&&typeof x.scorer==='string');
 const star=facts.slice().sort((a,b)=>(num(b.goals)*4+num(b.assists)*2+num(b.saves)*.22+num(b.rating))-
                  (num(a.goals)*4+num(a.assists)*2+num(a.saves)*.22+num(a.rating)))[0];
 const significant=score[0]===score[1]?'Empate':score[0]>score[1]?'Vitória do mandante':'Vitória do visitante';
 const headline=significant+': '+(teams[0]||'Time')+' '+score[0]+' × '+score[1]+' '+(teams[1]||'Time');
 const event={id:stamp,round,home:teams[0],away:teams[1],score:score.slice(),title:headline,
  hero:star?.name||null,goals:scored.slice(0,5).map(g=>({scorer:g.scorer,minute:g.minute})),
  kind:score[0]===score[1]?'draw':Math.abs(score[0]-score[1])>=3?'statement':'match'};
 world.news=compact(world.news.concat(event),70);
 const recordedKeys=Object.keys(world.recorded);
 if(recordedKeys.length>280)for(const old of recordedKeys.slice(0,recordedKeys.length-280))delete world.recorded[old];
 const rivalPairs=Object.entries(world.rivals).sort((a,b)=>b[1].duels-a[1].duels).slice(0,110);
 world.rivals=Object.fromEntries(rivalPairs);
 const players=Object.entries(world.players);
 if(players.length>800){
  players.sort((a,b)=>b[1].appearances-a[1].appearances);
  world.players=Object.fromEntries(players.slice(0,800));
 }
 return true;
}
function dossier(season,name,club){
 const saved=season?.career?.players?.[key(name,club)];
 const item=season?.career?.neo2World?.players?.[key(name,club)]||null;
 if(!item&&!saved)return null;
 const logs=compact(item?.form,12);
 const ratings=logs.map(x=>num(x.rating)).filter(v=>v>0);
 const avg=ratings.length?+(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(2):0;
 const value=num(saved?.value);
 const upgrades=Object.entries(saved?.weaponMastery||{}).sort((a,b)=>b[1]-a[1]).slice(0,10);
 const ego=saved?.egoJourney||{};
 return {name:safeName(name),club,appearances:item?.appearances||num(saved?.games),
  rating:avg,form:logs,value,role:item?.role||saved?.role||'',signature:item?.signature||'',
  skills:Object.entries(item?.skills||{}).sort((a,b)=>b[1]-a[1]).slice(0,10),
  upgrades,confidence:num(ego.confidence),breakthroughs:num(ego.breakthroughs),
  partners:Object.entries(item?.partners||{}).sort((a,b)=>b[1]-a[1]).slice(0,8),
  recentOpponent:item?.lastOpponent||'',totals:{goals:num(saved?.goals),assists:num(saved?.assists),
   saves:num(saved?.saves),tackles:num(saved?.tackles),passes:num(saved?.passes)},
  rivalries:Object.entries(season?.career?.neo2World?.rivals||{}).filter(([,r])=>r.names.includes(name))
   .sort((a,b)=>b[1].duels-a[1].duels).slice(0,5)};
}
function headlines(season,n=12){return compact(season?.career?.neo2World?.news,n).slice().reverse();}
function adapt(engine){
 if(!engine||typeof engine.recordFixture!=='function'||engine._neo2WorldInstalled)return false;
 const original=engine.recordFixture;
 engine.recordFixture=function(season,fixture,match){
  const recorded=original.call(this,season,fixture,match);
  if(recorded===true){
   try{observe(season,fixture,match)}catch(error){if(typeof console!=='undefined')console.warn('Neo2World:',error)}
   if(!season?.__neoFoundationDraft&&typeof window!=='undefined'&&typeof window.dispatchEvent==='function'&&typeof CustomEvent!=='undefined')
    window.dispatchEvent(new CustomEvent('neo2-recorded'));
  }
  return recorded;
 };
 Object.defineProperty(engine,'_neo2WorldInstalled',{value:true});
 engine.Neo2World={ensure,observe,dossier,headlines,stableKey};
 return true;
}
return {VERSION,ensure,observe,dossier,headlines,adapt,stableKey};
});
