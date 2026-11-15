/* Blue Lock NEO v9.7 — independent custom championships; no changes to core league. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.NeoCups970=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const SAVE_KEY='neo-custom-cups-v970';
function createCup(E,teamIds,title='Copa personalizada',twoLegs=false){
 if(!Array.isArray(teamIds)||teamIds.length<2||teamIds.length>10)throw Error('Selecione entre 2 e 10 equipes.');
 const selected=[...new Set(teamIds)];if(selected.length!==teamIds.length||selected.some(id=>!E.teamById(id)))throw Error('Há clubes inválidos ou repetidos.');
 const a=[...selected];if(a.length%2)a.push(null);
 const base=[],size=a.length;
 for(let i=0;i<size-1;i++){
  const games=[];for(let j=0;j<size/2;j++){
   const x=a[j],y=a[size-1-j];if(x&&y){const reverse=i%2===1;games.push({home:reverse?y:x,away:reverse?x:y,result:null,details:null});}
  }
  base.push(games);a.splice(1,0,a.pop());
 }
 const rounds=base.map((games,i)=>({round:i+1,games}));
 if(twoLegs)for(const games of base){rounds.push({round:rounds.length+1,games:games.map(g=>({home:g.away,away:g.home,result:null,details:null}))});}
 return {schema:1,id:'cup-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name:String(title||'Copa personalizada').slice(0,45),teams:selected,rounds,legs:twoLegs?2:1,createdAt:Date.now()};
}
const fixtures=c=>c?.rounds?.flatMap(r=>r.games.map(g=>({...g,round:r.round})))||[];
function standings(E,cup){
 if(!cup?.teams)return [];
 const rows=cup.teams.map(id=>({id,name:E.teamById(id)?.name||id,J:0,V:0,E:0,D:0,GP:0,GC:0,SG:0,Pts:0}));
 for(const game of fixtures(cup)){
  if(!Array.isArray(game.result))continue;const a=rows.find(x=>x.id===game.home),b=rows.find(x=>x.id===game.away);if(!a||!b)continue;
  const [h,v]=game.result;a.J++;b.J++;a.GP+=h;a.GC+=v;b.GP+=v;b.GC+=h;
  if(h>v){a.V++;b.D++;a.Pts+=3;}else if(v>h){b.V++;a.D++;b.Pts+=3;}else{a.E++;b.E++;a.Pts++;b.Pts++;}
 }
 return rows.map(r=>({...r,SG:r.GP-r.GC})).sort((a,b)=>b.Pts-a.Pts||b.SG-a.SG||b.GP-a.GP||a.name.localeCompare(b.name));
}
function nextUnplayed(c){for(const r of c?.rounds||[])for(const game of r.games)if(!game.result)return {round:r.round,game};return null;}
function toSavedDetails(result){
 const pFields=['name','side','role','goals','assists','shots','passes','pases','dribblesWon','tackles','interceptions','shotBlocks','aerialWins','duelsWon','keyPasses','saves','rating','runs','overlaps','distance','flowCount','isMaster','abilityUses'];
 return {score:result.score,stats:result.stats,
  goalRecords:(result.goalRecords||[]).slice(0,18).map(g=>({scorer:g.scorer,assister:g.assister,minute:g.minute,side:g.side})),
  shots:(result.shots||[]).slice(-80).map(s=>({side:s.side,outcome:s.outcome,savedBy:s.savedBy,shooter:s.shooter})),
  players:(result.players||[]).map(p=>Object.fromEntries(pFields.filter(k=>k in p).map(k=>[k,p[k]])))
 };
}
function playNext(E,cup,seed){
 const next=nextUnplayed(cup);if(!next)return null;
 const game=next.game,m=new E.Match(game.home,game.away,(seed??Math.floor(Math.random()*4294967295))>>>0,null,cup);
 m.rollGameplan();const result=m.runToEnd();game.result=[...result.score];game.details=toSavedDetails(result);
 return {round:next.round,home:game.home,away:game.away,score:game.result,details:game.details};
}
function safeLoad(storage){try{const c=JSON.parse(storage.getItem(SAVE_KEY)||'[]');return Array.isArray(c)?c.filter(x=>x?.schema===1&&Array.isArray(x.teams)&&Array.isArray(x.rounds)).slice(0,12):[];}catch(_){return []}}
function save(storage,cups){storage.setItem(SAVE_KEY,JSON.stringify((cups||[]).slice(0,12)));}
function playedPlayerStats(storage,name,club){let found=[];
 for(const cup of safeLoad(storage))for(const r of cup.rounds)for(const g of r.games){if(!g.result||!g.details?.players)continue;
  const side=g.home===club?0:g.away===club?1:-1;if(side<0)continue;
  const p=g.details.players.find(x=>x.name===name&&x.side===side);if(p)found.push({round:r.round,home:g.home,away:g.away,opponent:side===0?g.away:g.home,side,score:g.result,raw:p,details:g.details,source:'Copa: '+cup.name});
 }
 return found;
}
return {SAVE_KEY,createCup,standings,nextUnplayed,playNext,toSavedDetails,safeLoad,save,fixtures,playedPlayerStats};
});
