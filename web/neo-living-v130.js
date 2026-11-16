/* Blue Lock NEO — living universe, incremental release 1.3.0.
 * All rankings, achievements and narratives are derived from real match records.
 * No generated fixtures, fake scores, or modifications to existing saves.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine){api.adapt(root.NeoEngine);if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const key=(name,club)=>name+'|'+club;
const role=p=>String(p?.role||'').toUpperCase();
const isKeeper=p=>/^(GOL|GK)$/.test(role(p));
const isDefender=p=>/^(ZAG|CB|LD|LE|LB|RB|VOL|CDM|ALA|LWB|RWB)$/.test(role(p));
function goalFormula(match,p){
 const goalX=p.side===0?match?.constructor?.PITCH?.right||1845:75;
 const distance=Math.hypot(goalX-n(p.x),576-n(p.y));
 const positioning=n(p.attributes?.positioning),finish=n(p.attributes?.finishing);
 const career=match.careerPlayers?.[key(p.name,match.teams?.[p.side]?.id)]||{};
 const mastery=Math.max(1,...Object.values(career.weaponMastery||{}).map(v=>n(v)));
 const inside=typeof match.inOpponentBox==='function'&&match.inOpponentBox(p);
 const lane=typeof match.opponentPressure==='function'?match.opponentPressure(p,65):0;
 const finishingZone=distance<310&&Math.abs(n(p.y)-576)<165;
 const score=clamp((inside?.12:0)+(finishingZone?.11:0)+(positioning-70)*.0016+(finish-70)*.0018+(mastery-1)*.018-lane*.025, -.09,.20);
 return {distance,inside,finishingZone,score,mastery};
}
function dangerLeader(match){
 if(!match||!Array.isArray(match.players))return null;
 const candidates=match.players.filter(p=>p&&p.i!==0&&p.side===0||p&&p.i!==0&&p.side===1);
 candidates.sort((a,b)=>((n(b.goals)*4+n(b.assists)*2+n(b.dribblesWon)*.7+n(b.shots)*.25+n(b.rating))-
 (n(a.goals)*4+n(a.assists)*2+n(a.dribblesWon)*.7+n(a.shots)*.25+n(a.rating)))||String(a.name).localeCompare(String(b.name)));
 const p=candidates[0];if(!p)return null;
 const impact=n(p.goals)*4+n(p.assists)*2+n(p.dribblesWon)*.7+n(p.shots)*.25;
 return impact>=4?{name:p.name,side:p.side,impact:+impact.toFixed(1)}:null;
}
function matchAwards(result){
 if(!result?.players?.length)return [];
 const players=result.players.filter(p=>p&&!p.isMaster&&p.name);
 const sort=(score)=>players.map(p=>({p,score:score(p)})).sort((a,b)=>b.score-a.score||String(a.p.name).localeCompare(String(b.p.name)))[0];
 const categories=[
  ['MVP',p=>n(p.rating)*2+n(p.goals)*3+n(p.assists)*2+n(p.saves)*.4+n(p.tackles)*.18],
  ['Artilheiro',p=>n(p.goals)],
  ['Maestro',p=>n(p.assists)*3+n(p.keyPasses)*.5],
  ['Muralha',p=>isDefender(p)?n(p.tackles)+n(p.interceptions)*1.4+n(p.shotBlocks)*2:0],
  ['Luva de Ouro',p=>isKeeper(p)?n(p.saves)*2:0]
 ];
 return categories.map(([title,score])=>{const best=sort(score);return best&&best.score>0?{title,name:best.p.name,side:best.p.side,value:+best.score.toFixed(2)}:null;}).filter(Boolean);
}
function seasonAwards(season){
 const players=Object.values(season?.career?.players||{}).filter(p=>p&&n(p.games)>0&&!p.isMaster);
 const pick=(filter,metric)=>players.filter(filter).map(p=>({p,score:metric(p)})).sort((a,b)=>b.score-a.score||String(a.p.name).localeCompare(String(b.p.name)))[0];
 const categories=[
  ['MVP',()=>true,p=>n(p.impact)+n(p.goals)*.4+n(p.assists)*.4],
  ['Chuteira de Ouro',()=>true,p=>n(p.goals)],
  ['Rei das Assistências',()=>true,p=>n(p.assists)],
  ['Melhor Goleiro',isKeeper,p=>n(p.saves)*.9+n(p.cleanSheets)*3+n(p.wins)*.3],
  ['Melhor Defensor',isDefender,p=>n(p.tackles)*.5+n(p.interceptions)*.7+n(p.shotBlocks)+n(p.aerialWins)*.3],
  ['Revelação',p=>n(p.games)<=5,p=>n(p.impact)/Math.max(1,n(p.games))]
 ];
 return categories.map(([title,filter,metric])=>{const winner=pick(filter,metric);return winner&&winner.score>0?{title,name:winner.p.name,club:winner.p.club,score:+winner.score.toFixed(2),games:n(winner.p.games)}:null;}).filter(Boolean);
}
function hallOfFame(season){
 const awards=seasonAwards(season);
 const byPlayer=new Map();
 for(const a of awards){const id=key(a.name,a.club),row=byPlayer.get(id)||{name:a.name,club:a.club,titles:[]};row.titles.push(a.title);byPlayer.set(id,row);}
 return [...byPlayer.values()].sort((a,b)=>b.titles.length-a.titles.length||a.name.localeCompare(b.name));
}
function scouts(season,limit=8){
 return Object.values(season?.career?.players||{}).filter(p=>p&&n(p.games)>=2)
 .map(p=>{const recent=(p.egoJourney?.form||[]).slice(-5);const current=recent.slice(-2).reduce((a,b)=>a+n(b.rating),0)/Math.max(1,recent.slice(-2).length);
 const earlier=recent.slice(0,-2),baseline=earlier.reduce((a,b)=>a+n(b.rating),0)/Math.max(1,earlier.length);
 const momentum=recent.length>=3?current-baseline:0;
 return {name:p.name,club:p.club,games:n(p.games),momentum:+momentum.toFixed(2),confidence:n(p.egoJourney?.confidence)};})
 .sort((a,b)=>b.momentum-a.momentum||b.confidence-a.confidence||a.name.localeCompare(b.name)).slice(0,limit);
}
function seasonDigest(season){
 const rounds=(season?.rounds||[]).flatMap(r=>(r.games||[]).filter(g=>Array.isArray(g.result)).map(g=>({...g,round:r.round})));
 const upsets=rounds.filter(g=>Math.abs(n(g.result[0])-n(g.result[1]))>=3).slice(-5).reverse();
 const history=(season?.career?.stories||[]).filter(s=>s?.text).slice(-8).reverse();
 return {played:rounds.length,upsets:upsets.map(g=>({round:g.round,home:g.home,away:g.away,score:g.result.slice(0,2)})),history};
}
function adapt(engine){
 const proto=engine?.Match?.prototype;if(!proto||proto._neo130Living)return false;
 if(typeof proto.shotQuality==='function'){
  const original=proto.shotQuality;
  proto.shotQuality=function(p){
   const base=original.call(this,p),formula=goalFormula(this,p);
   // Small situational advantage only; does not manufacture goals.
   return clamp(base+formula.score*.22,.012,.52);
  };
 }
 if(typeof proto._ownerDecision==='function'){
  const original=proto._ownerDecision;
  proto._ownerDecision=function(p){
   // A standout player receives a live indicator; never changes the score.
   if(this.phase==='play'&&this.time-(this._neo130LastLeader||-999)>115){
    this._neo130LastLeader=this.time;
    const leader=dangerLeader(this);
    if(leader&&leader.name!==this._neo130LeaderName){
     this._neo130LeaderName=leader.name;
     this._moment?.(leader.side,'solo','👑 REI DO CAMPO: '+leader.name+' domina os duelos!',[leader.name]);
    }
   }
   return original.call(this,p);
  };
 }
 if(typeof proto.result==='function'){
  const original=proto.result;
  proto.result=function(){
   const data=original.call(this);
   data.neoLiving={awards:matchAwards(data),leader:dangerLeader(this)};
   return data;
  };
 }
 Object.defineProperty(proto,'_neo130Living',{value:true});
 return true;
}
function mount(win){
 const doc=win.document;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){
  const records=doc.getElementById('records');if(!records)return;
  let section=doc.getElementById('neo130-living');
  if(!section){section=doc.createElement('section');section.id='neo130-living';section.className='neo120-panel';records.append(section);}
  let season;try{season=JSON.parse(win.localStorage.getItem('neo-season-v2')||'null')}catch(_){season=null;}
  const awards=seasonAwards(season),scouting=scouts(season),hall=hallOfFame(season),digest=seasonDigest(season);
  const list=(label,rows,fn)=>'<div class="neo120-group"><strong>'+label+'</strong>'+(rows.length?rows.map(fn).join(''):'<p>Aguardando resultados oficiais da simulação.</p>')+'</div>';
  section.innerHTML='<div class="neo120-title"><span>🏆 UNIVERSO VIVO</span><small>REGISTROS DA TEMPORADA · '+digest.played+' PARTIDAS</small></div><div class="neo130-grid">'+
   list('🏅 Prêmios parciais',awards,a=>'<p>'+esc(a.title)+': <b>'+esc(a.name)+'</b> · '+esc(a.club)+'</p>')+
   list('🔎 Olheiros',scouting,p=>'<p>'+esc(p.name)+' · '+esc(p.club)+' · tendência '+(p.momentum>0?'+':'')+p.momentum.toFixed(2)+'</p>')+
   list('🏛️ Hall da Fama (parcial)',hall,p=>'<p>'+esc(p.name)+' · '+esc(p.titles.join(', '))+'</p>')+
   list('📰 Histórias reais',digest.history,r=>'<p>'+esc(r.text)+'</p>')+
   '</div>';
 }
 const start=()=>{if(!doc.getElementById('records'))return;render();doc.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="records"],[data-neo-tab="records"]'))win.setTimeout(render,100)});win.addEventListener('focus',render);};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return {goalFormula,dangerLeader,matchAwards,seasonAwards,hallOfFame,scouts,seasonDigest,adapt,mount};
});