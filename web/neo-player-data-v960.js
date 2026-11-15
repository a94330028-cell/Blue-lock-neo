/* Blue Lock NEO 9.6 — read-only, team-aware player registry and recorded season statistics. */
(function(root,factory){
 const mod=factory();if(typeof module==='object'&&module.exports)module.exports=mod;
 if(root)root.NeoPlayerData96=mod;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const N=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
 const FIELDS=['games','wins','draws','losses','goals','assists','shots','passes','dribbles','tackles',
   'interceptions','shotBlocks','aerialWins','duelsWon','keyPasses','saves','cleanSheets','runs',
   'overlaps','distance','flowCount','masterApps'];
 const byId=(s,name,club)=>s?.career?.players?.[name+'|'+club]||null;
 const unaccent=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const nameMatch=(a,b)=>unaccent(a)===unaccent(b);
 const roleFor=(t,i,saved,master)=>master?'CA':i<t.players.length?(t.formation?.[i]?.role||saved?.role||'MC'):(saved?.role||'MC');
 function roster(E,season){
  if(!E||!Array.isArray(E.TEAMS))return [];
  const res=[],seen=new Set(),career=season?.career?.players||{};
  for(const t of (typeof E.allTeams==='function'?E.allTeams():E.TEAMS)){
   const roster=[...(t.players||[]),...(t.reserves||[]),...(t.master?[t.master]:[])];
   roster.forEach((name,i)=>{
    if(!name)return;const id=name+'|'+t.id;if(seen.has(id))return;seen.add(id);
    const saved=career[id]||{},master=name===t.master;
    const role=roleFor(t,i,saved,master);
    const ovr=E.Attr?.generate?E.Attr.generate(name,role,master?9:i<11?i:1,saved).ovr:N(saved.ovr)||75;
    const value=E.Progression?.estimateValue?E.Progression.estimateValue(saved,ovr,role):N(saved.value);
    res.push({...saved,name,club:t.id,role,ovr,value,isMaster:master});
   });
  }
  // Show season players even if they transferred, are no longer starters, or
  // have no current roster assignment. Never silently omit their saved names.
  for(const [id,saved] of Object.entries(career)){
   if(!saved?.name)continue;
   const club=saved.club||id.slice(id.lastIndexOf('|')+1),key=saved.name+'|'+club;
   if(seen.has(key))continue;seen.add(key);
   const role=saved.role||'MC',ovr=E.Attr?.generate?.(saved.name,role,1,saved)?.ovr||N(saved.ovr)||75;
   res.push({...saved,name:saved.name,club,role,ovr,
     value:E.Progression?.estimateValue?.(saved,ovr,role)||N(saved.value),isMaster:false,legacy:true});
  }
  return res;
 }
 function detailsFor(season,name,club){
  const rows=[];
  for(const r of season?.rounds||[]){for(const fixture of r.games||[]){
   const side=fixture.home===club?0:fixture.away===club?1:-1;
   if(side===-1||!Array.isArray(fixture.details?.players))continue;
   const p=fixture.details.players.find(q=>q.side===side&&nameMatch(q.name,name));
   if(!p)continue;
   const score=fixture.result||fixture.details?.score||null;
   rows.push({round:r.round||0,opponent:side===0?fixture.away:fixture.home,
    score:Array.isArray(score)?score.slice(0,2):null,side,raw:p,details:fixture.details});
  }}
  // User-selected cups are stored separately; they do not rewrite the Neo Egoist season.
  if(typeof window!=='undefined'&&window.NeoCups970){
   try{rows.push(...window.NeoCups970.playedPlayerStats(localStorage,name,club));}
   catch(error){console.warn('Não foi possível ler partidas das copas personalizadas.',error);}
  }
  return rows.sort((a,b)=>(a.source?'1':'0').localeCompare(b.source?'1':'0')||a.round-b.round);
 }
 function profile(E,season,name,club){
  const all=roster(E,season),entry=all.find(p=>p.name===name&&p.club===club)
   ||all.find(p=>nameMatch(p.name,name)&&p.club===club);
  if(!entry)return null;
  const saved=byId(season,entry.name,entry.club)||{};
  const matched=detailsFor(season,entry.name,entry.club);
  const detail={};for(const field of FIELDS)detail[field]=0;
  let ratingSum=0,ratings=0,goalsAgainst=0;
  const abilities={};
  for(const m of matched){
   const p=m.raw,d=m.details;for(const [f,v] of Object.entries({
    games:1,goals:p.goals,assists:p.assists,shots:p.shots,passes:p.passes,
    dribbles:p.dribblesWon,tackles:p.tackles,interceptions:p.interceptions,
    shotBlocks:p.shotBlocks,aerialWins:p.aerialWins,duelsWon:p.duelsWon,keyPasses:p.keyPasses,
    saves:p.saves,runs:p.runs,overlaps:p.overlaps,distance:p.distance,flowCount:p.flowCount,
    masterApps:p.isMaster?1:0
   }))if(f in detail)detail[f]+=N(v);
   if(m.score){const own=m.score[m.side],opp=m.score[1-m.side];
    if(own>opp)detail.wins++;else if(own===opp)detail.draws++;else detail.losses++;
    if(/^(GOL|GK)$/.test(p.role||'')){goalsAgainst+=N(opp);if(opp===0)detail.cleanSheets++}
   }
   if(Number.isFinite(Number(p.rating))){ratingSum+=Number(p.rating);ratings++}
   for(const [a,n] of Object.entries(p.abilityUses||{}))abilities[a]=(abilities[a]||0)+N(n);
   // Individual saves can be present in the shot map instead of raw player totals.
   if(/^(GOL|GK)$/.test(p.role||'')){
    const shotSaves=(d.shots||[]).filter(s=>s.outcome==='saved'&&s.savedBy===p.name&&s.side!==p.side).length;
    const onlyKeeper=(d.players||[]).filter(q=>q.side===p.side&&/^(GOL|GK)$/.test(q.role||''));
    const teamSaves=onlyKeeper.length===1?N(d.stats?.saves?.[p.side]):0;
    detail.saves+=Math.max(shotSaves,teamSaves,N(p.saves))-N(p.saves);
   }
  }
  // The career save already includes NEL league totals; cup-only matches add to it.
  const cups=matched.filter(m=>m.source),league=matched.filter(m=>!m.source),cupTotals={};
  for(const f of FIELDS)cupTotals[f]=0;
  for(const c of cups){const p=c.raw,s=c.score;cupTotals.games++;
   for(const [field,src] of Object.entries({goals:'goals',assists:'assists',shots:'shots',passes:'passes',
     dribbles:'dribblesWon',tackles:'tackles',interceptions:'interceptions',shotBlocks:'shotBlocks',
     aerialWins:'aerialWins',duelsWon:'duelsWon',keyPasses:'keyPasses',saves:'saves',runs:'runs',
     overlaps:'overlaps',distance:'distance',flowCount:'flowCount'}))cupTotals[field]+=N(p[src]);
   if(s){if(s[c.side]>s[1-c.side])cupTotals.wins++;
    else if(s[c.side]<s[1-c.side])cupTotals.losses++;else cupTotals.draws++;
    if(/^(GOL|GK)$/.test(p.role||'')&&s[1-c.side]===0)cupTotals.cleanSheets++;}
  }
  const leagueTotals={};for(const f of FIELDS)leagueTotals[f]=0;
  for(const m of league){const q=m.raw;leagueTotals.games++;
   for(const [field,src] of Object.entries({goals:'goals',assists:'assists',shots:'shots',passes:'passes',
      dribbles:'dribblesWon',tackles:'tackles',interceptions:'interceptions',shotBlocks:'shotBlocks',
      aerialWins:'aerialWins',duelsWon:'duelsWon',keyPasses:'keyPasses',saves:'saves',runs:'runs',
      overlaps:'overlaps',distance:'distance',flowCount:'flowCount'}))leagueTotals[field]+=N(q[src]);
  }
  const totals={};for(const f of FIELDS)totals[f]=Math.max(N(saved[f]),leagueTotals[f])+cupTotals[f];
  const avgRating=N(saved.games)&&Number.isFinite(Number(saved.ratingSum))?
    Number(saved.ratingSum)/Number(saved.games):ratings?ratingSum/ratings:null;
  const abilityUses=Object.keys(saved.abilityUses||{}).length?saved.abilityUses:abilities;
  const games=totals.games;
  return {entry,saved,totals,avgRating:avgRating===null?null:Math.max(0,Math.min(10,avgRating)),
   goalsAgainst:matched.some(m=>m.score&&/^(GOL|GK)$/.test(m.raw.role||''))?goalsAgainst:null,
   abilityUses,matched,hasMatches:games>0,
   recordedMatches:matched.length,
   history:matched.slice(-8).reverse().map(m=>({round:m.round,opponent:m.opponent,score:m.score,
    side:m.side,goals:N(m.raw.goals),assists:N(m.raw.assists),shots:N(m.raw.shots),
    passes:N(m.raw.passes),tackles:N(m.raw.tackles),interceptions:N(m.raw.interceptions),
    saves:N(m.raw.saves),rating:Number.isFinite(Number(m.raw.rating))?Number(m.raw.rating):null}))};
 }
 return {FIELDS,roster,profile,detailsFor};
});
