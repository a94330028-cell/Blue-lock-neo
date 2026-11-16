/* Season progression and competitive ranking, derived only from recorded results. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.NeoProgression=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';const Abilities=typeof globalThis!=='undefined'&&globalThis.NeoAbilities||require('./abilities.js');const Attr=typeof globalThis!=='undefined'&&globalThis.NeoAttributes||require('./attributes.js');const key=(name,club)=>name+'|'+club;
// Lances fictícios da Liga Neo Egoísta (ienes). Não são salários ou cotações oficiais.
// Todas as temporadas começam com ¥0. Só os lances registrados nas partidas mudam o preço.
const num=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
const between=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const BID_STEP=100000;
const bidRound=value=>Math.round(value/BID_STEP)*BID_STEP;
function baseValue(){return 0;}
function estimateValue(player){
 // No OVR bonus and no guesses from aggregate goals, assists or matches.
 // A player's displayed bid equals their persisted (or reconstructed) bid.
 return Math.max(0,bidRound(num(player?.value,0)));
}
function bidDelta(player,goalDifference=0){
 const rating=Number(player?.rating);
 if(!Number.isFinite(rating))return 0;
 const note=between(rating,0,10),lose=goalDifference<0,win=goalDifference>0;
 // Poor individual matches never generate bids, even if the team wins.
 if(note<6.5)return -bidRound(((6.5-note)*1.8+(lose?.5:0))*1e6);
 const role=String(player.role||'').toUpperCase();
 const keeper=/^(GOL|GK)$/.test(role),defender=/^(ZAG|CB|LD|LE|LB|RB|VOL|CDM|ALA|LWB|RWB)$/.test(role);
 const goals=Math.max(0,num(player.goals)),assists=Math.max(0,num(player.assists));
 const saves=Math.max(0,num(player.saves)),interceptions=Math.max(0,num(player.interceptions));
 const tackles=Math.max(0,num(player.tackles)),blocks=Math.max(0,num(player.shotBlocks));
 const clean=keeper&&goalDifference>=0&&Number(player.goalsAgainst)===0;
 const influence=goals*4.3+assists*2.8+(keeper?saves*.52:(defender?(interceptions*.20+tackles*.16+blocks*.24):0))+
  Math.max(0,num(player.keyPasses))*.24+Math.max(0,num(player.dribblesWon))*.14;
 if(note<7&&influence<.8)return 0;
 const millions=Math.max(0,(note-6.5)*2.2)+influence+(win?.25:0)+(clean?.5:0);
 return bidRound(millions*1e6);
}
// Rebuild inflated old bids using ONLY actual recorded match sheets.
// Never changes goals, tactics, photographs, OVR or completed fixtures.
function reconcileBids(season,skipFixture=null){
 const career=ensure(season);
 if(career.bidVersion===2)return 0;
 const savedEntries=Object.values(career.players),prices=new Map(),byPlayer=new Map();
 for(const round of season?.rounds||[])for(const fixture of round.games||[]){
  if(fixture===skipFixture||!Array.isArray(fixture.result)||!Array.isArray(fixture.details?.players))continue;
  const done=new Set(),difference=fixture.result[0]-fixture.result[1];
  for(const p of fixture.details.players){
   if(!p?.name||p.isMaster||![0,1].includes(p.side))continue;
   const club=p.side===0?fixture.home:fixture.away;
   const id=key(p.name,club);if(done.has(id))continue;done.add(id);
   const previous=prices.get(id)||0,change=bidDelta(p,p.side===0?difference:-difference);
   const next=Math.max(0,previous+change);
   prices.set(id,next);
   if(!byPlayer.has(id))byPlayer.set(id,[]);
   byPlayer.get(id).push({round:round.round,match:fixture.home+' × '+fixture.away,value:next,change:next-previous});
  }
 }
 let repaired=0;
 for(const p of savedEntries){
  const id=key(p.name,p.club),value=prices.get(id)||0;
  if(p.value!==value){p.value=value;repaired++;}
  p.change=byPlayer.get(id)?.at(-1)?.change||0;
  p.bidHistory=byPlayer.get(id)||[];
  // Preserve the historical sporting details while correcting the old inflated prices.
  if(Array.isArray(p.history)){
   let i=0;
   p.history=p.history.map(h=>{
    const entry=byPlayer.get(id)?.[i++];
    return {...h,value:entry?.value??0};
   });
  }
 }
 career.bidVersion=2;
 return repaired;
}
// Top 5 do MVP do campeonato, exclusivamente de partidas realmente salvas.
// O preço de mercado NÃO entra na votação de melhor jogador.
function mvpRanking(season,limit=5){
 const career=season?.career?.players||{};
 const scored=Object.values(career).filter(p=>p&&!p.isMaster&&num(p.games)>0)
 .map(p=>{
  const games=Math.max(1,num(p.games)),keeper=/^(GOL|GK)$/.test(p.role||'');
  const defender=/^(ZAG|CB|LD|LE|RB|LB|VOL|CDM|ALA|LWB|RWB)$/.test(p.role||'');
  const rating=between(num(p.ratingSum,6*games)/games,0,10);
  const goals=num(p.goals),assists=num(p.assists),saves=num(p.saves),clean=num(p.cleanSheets);
  const defensive=num(p.tackles)*.34+num(p.interceptions)*.42+num(p.shotBlocks)*.54+num(p.aerialWins)*.12;
  const creativity=num(p.keyPasses)*.31+num(p.dribbles)*.15;
  const contributions=goals*3.1+assists*2.35+(keeper?saves*.27+clean*1.7:0)
    +(defender?defensive:defensive*.46)+creativity;
  const performance=contributions/games;
  const consistency=Math.max(0,rating-6)*1.12+Math.min(1,num(p.wins)/games)*.7;
  const sample=Math.min(1,games/6)*1.35;
  const mvpPoints=Math.round((performance+consistency+sample)*100)/100;
  return {...p,mvpPoints,avgRating:Math.round(rating*10)/10};
 });
 return scored.sort((a,b)=>b.mvpPoints-a.mvpPoints||num(b.games)-num(a.games)||num(b.goals)-num(a.goals)||String(a.name).localeCompare(String(b.name))).slice(0,Math.max(1,Math.min(20,limit)));
}
function ensure(season){if(!season.career||typeof season.career!=='object')season.career={players:{},history:[],version:1};const c=season.career;c.links=c.links||{};c.rivals=c.rivals||{};c.stories=c.stories||[];return c;}
function row(career,name,club){const id=key(name,club);return career.players[id]||(career.players[id]={name,club,games:0,goals:0,assists:0,shots:0,runs:0,overlaps:0,distance:0,draws:0,losses:0,dribbles:0,tackles:0,interceptions:0,shotBlocks:0,aerialWins:0,duelsWon:0,keyPasses:0,saves:0,cleanSheets:0,wins:0,passes:0,impact:0,ratingSum:0,score:0,value:0,change:0,boosts:{},unlocked:[],abilityUses:{},history:[],flowCount:0,masterApps:0});}
function verifiedKeeperSaves(details,p){
 if(!/^(GOL|GK)$/.test(p?.role||''))return Math.max(0,num(p?.saves));
 const shots=(details?.shots||[]).filter(s=>s.outcome==='saved'&&s.savedBy===p.name&&s.side!==p.side).length;
 const peers=(details?.players||[]).filter(x=>x.side===p.side&&/^(GOL|GK)$/.test(x.role||''));
 const teamTotal=peers.length===1?Math.max(0,num(details?.stats?.saves?.[p.side])):0;
 return Math.max(0,num(p.saves),shots,teamTotal);
}
// Backfill known historical goalkeeper saves from stored match reports. Running
// this repeatedly is safe and never creates an event that wasn't recorded.
function reconcileGoalkeepers(season){
 const career=ensure(season),totals=new Map();
 for(const round of season?.rounds||[])for(const fixture of round.games||[]){
  const d=fixture.details;if(!d||!Array.isArray(d.players))continue;
  for(const p of d.players){if(p.isMaster||!/^(GOL|GK)$/.test(p.role||''))continue;
   const club=p.side===0?fixture.home:fixture.away,id=key(p.name,club);
   const t=totals.get(id)||{name:p.name,club,games:0,saves:0,cleanSheets:0,role:p.role};
   t.games++;t.saves+=verifiedKeeperSaves(d,p);
   if(Array.isArray(fixture.result)&&fixture.result[1-p.side]===0)t.cleanSheets++;
   totals.set(id,t);
  }
 }
 let repaired=0;for(const [id,t] of totals){
  const p=career.players[id]||row(career,t.name,t.club);
  p.role=t.role;for(const metric of ['games','saves','cleanSheets'])if(num(p[metric])<t[metric]){p[metric]=t[metric];repaired++;}
  p.ovr=Attr.generate(p.name,p.role,0,p).ovr; // A goalkeeper repair must not invent an auction bid.
 }
 return repaired;
}
function record(season,fixture,match,round){const career=ensure(season);reconcileBids(season,fixture);const r=match.result();const raw=r.players||[];
 for(const p of raw){if(p.isMaster)continue;const club=p.side===0?fixture.home:fixture.away,entry=row(career,p.name,club);entry.unlocked=entry.unlocked||[];const before=estimateValue(entry);entry.role=p.role;entry.ovr=p.ovr;const result=p.side===0?r.score[0]-r.score[1]:r.score[1]-r.score[0];
 const keeper=/^(GOL|GK)$/.test(p.role||'');const cleanSheet=keeper&&r.score[1-p.side]===0;const defender=/^(ZAG|CB|LD|LE|RB|LB|VOL|CDM|ALA|LWB|RWB)$/.test(p.role||'');
 const contribution=(p.goals||0)*3.3+(p.assists||0)*2.6
   +(p.dribblesWon||0)*.10+(p.tackles||0)*(defender?.30:.14)
   +(p.interceptions||0)*(defender?.26:.10)
   +(p.shotBlocks||0)*(defender?.45:.10)
   +(p.aerialWins||0)*(defender?.15:.05)
   +(p.duelsWon||0)*(defender?.12:.04)
   +(p.keyPasses||0)*.18+(p.saves||0)*.36
   +Math.max(-2,Math.min(2,((p.rating||6)-6)*.8));const scoreGain=contribution+(result>0?.95:result<0?-.28:.12);
 entry.abilityUses=entry.abilityUses||{};
 for(const [id,count] of Object.entries(p.abilityUses||{}))if(Abilities.get(id)&&Number.isFinite(count))entry.abilityUses[id]=(entry.abilityUses[id]||0)+Math.max(0,Math.floor(count));
 entry.shots=(entry.shots||0)+(p.shots||0);entry.runs=(entry.runs||0)+(p.runs||0);entry.overlaps=(entry.overlaps||0)+(p.overlaps||0);entry.distance=(entry.distance||0)+(p.distance||0);entry.draws=(entry.draws||0)+(result===0?1:0);entry.losses=(entry.losses||0)+(result<0?1:0);
 entry.games++;entry.goals+=p.goals||0;entry.assists+=p.assists||0;entry.dribbles+=p.dribblesWon||0;entry.tackles+=p.tackles||0;
 entry.interceptions=(entry.interceptions||0)+(p.interceptions||0);
 entry.shotBlocks=(entry.shotBlocks||0)+(p.shotBlocks||0);
 entry.aerialWins=(entry.aerialWins||0)+(p.aerialWins||0);
 entry.duelsWon=(entry.duelsWon||0)+(p.duelsWon||0);
 entry.keyPasses=(entry.keyPasses||0)+(p.keyPasses||0);
 entry.saves+=verifiedKeeperSaves(r,p);entry.cleanSheets=(entry.cleanSheets||0)+(cleanSheet?1:0);entry.wins=(entry.wins||0)+(result>0?1:0);entry.passes+=p.passes||0;entry.flowCount+=p.flowCount||0;entry.ratingSum+=p.rating||6;entry.impact+=scoreGain;entry.score=Math.round(entry.impact*10)/10;
 const requested=bidDelta(p,result);
 entry.value=Math.max(0,before+requested);entry.change=entry.value-before;
 (entry.bidHistory||(entry.bidHistory=[])).push({round,match:fixture.home+' × '+fixture.away,value:entry.value,change:entry.change});
 if(entry.bidHistory.length>40)entry.bidHistory.shift();
 if((scoreGain>3||(keeper&&p.saves>=3))&&entry.games%3===0){const target=keeper&&((p.saves||0)>0||cleanSheet)?'reflexes':p.goals?'finishing':p.assists?'vision':(p.tackles||0)+(p.interceptions||0)+(p.shotBlocks||0)>0?'defense':p.dribblesWon?'dribbling':'control';entry.boosts[target]=Math.min(6,(entry.boosts[target]||0)+1);}
 // Secondary weapons only unlock from sustained, recorded match experience.
 if(entry.games>=4&&entry.dribbles>=12&&!entry.unlocked.includes('speed'))entry.unlocked.push('speed');
 if(entry.games>=4&&entry.assists>=3&&!entry.unlocked.includes('link'))entry.unlocked.push('link');
 if(entry.games>=4&&(entry.tackles||0)+(entry.interceptions||0)+(entry.shotBlocks||0)>=12&&!entry.unlocked.includes('read'))entry.unlocked.push('read');
 if(entry.games>=5&&entry.goals>=5&&!entry.unlocked.includes('power'))entry.unlocked.push('power');
 // Cada atleta pode evoluir suas próprias armas — sem apagar técnicas já desbloqueadas.
 for(const a of Abilities.loadout(p.name,p.role,p.role==='GOL'?0:1,entry)){
   if(a.owner===p.name&&a.tier>=2&&entry.games>=(a.tier===2?3:8)&&!entry.unlocked.includes(a.id)){
     entry.unlocked.push(a.id);
     career.stories.push({round,kind:'despertar',text:`${p.name} desbloqueia ${a.label} após ${entry.games} partidas!`});
   }
 }

 // Novas técnicas são desbloqueadas por partidas + desempenho real da posição.
 const earned=Abilities.loadout(p.name,p.role,p.role==='GOL'?0:1,entry)
   .filter(a=>a.rarity!=='Legado'&&a.rarity!=='Comum'&&!a.locked&&!entry.unlocked.includes(a.id));
 const newly=new Set();for(const a of earned){entry.unlocked.push(a.id);if(!newly.has(a.rarity)){
    career.stories.push({round,kind:'despertar',text:`${p.name} conquistou a raridade ${a.rarity} com suas atuações e liberou ${a.label}!`});newly.add(a.rarity);
 }}
 entry.history.push({round,match:fixture.home+' × '+fixture.away,score:p.goals+'G '+p.assists+'A',value:entry.value,impact:Math.round(scoreGain*100)/100});if(entry.history.length>40)entry.history.shift();
 }
 // Chemistry grows only after a recorded goal + assist by a real teammate.
 for(const rec of r.goalRecords||[]){if(!rec.assister)continue;const club=rec.side===0?fixture.home:fixture.away;
   const names=[rec.scorer,rec.assister].sort();const id=names.join(' + ')+'|'+club;
   const pair=career.links[id]||(career.links[id]={names,club,plays:0});pair.plays++;
   if(pair.plays===3)career.stories.push({round,kind:'dupla',text:`${names.join(' e ')} alcançam 3 conexões para gol!`});
 }
 const goalsBySide=[[],[]];for(const rec of r.goalRecords||[])if(!goalsBySide[rec.side].includes(rec.scorer))goalsBySide[rec.side].push(rec.scorer);
 for(const a of goalsBySide[0])for(const b of goalsBySide[1]){const names=[a,b].sort();const id=names.join(' × ');const rv=career.rivals[id]||(career.rivals[id]={names,duels:0});rv.duels++;}
 for(const p of raw){if(p.isMaster)continue;const club=p.side===0?fixture.home:fixture.away;
   if(p.goals>=3)career.stories.push({round,kind:'artilharia',text:`${p.name} marca ${p.goals} gols por ${club} na rodada ${round}.`});
   if(p.saves>=5)career.stories.push({round,kind:'goleiro',text:`${p.name} realiza ${p.saves} defesas por ${club}, aumentando seu lance de mercado.`});
   if(['ZAG','CB'].includes(p.role)&&p.goals)career.stories.push({round,kind:'zagueiro',text:`O defensor ${p.name} decide ofensivamente: ${p.goals} gol(s).`});
   if(['ZAG','CB','LD','LE','VOL','ALA'].includes(p.role)&&((p.interceptions||0)+(p.shotBlocks||0)+(p.tackles||0)>=6))career.stories.push({round,kind:'defesa',text:`MURALHA: ${p.name} acumula ${(p.tackles||0)+(p.interceptions||0)+(p.shotBlocks||0)} ações defensivas contra ${p.side===0?fixture.away:fixture.home}.`});
 }
 for(const mr of r.masterEntries||[])career.stories.push({round,kind:'master',text:`${mr.master} participa por ${Math.max(1,Math.round(((mr.exitMinute??(mr.until/60))-(mr.minute||0))))} minutos para ${mr.side===0?fixture.home:fixture.away}.`});
 if(career.stories.length>90)career.stories=career.stories.slice(-90);
 career.history.push({round,fixture:fixture.home+'-'+fixture.away,score:[...r.score]});if(career.history.length>200)career.history.shift();return career;}
function rank(season,filter='all'){const career=ensure(season),data=Object.values(career.players);for(const p of data)if(p.role)p.ovr=Attr.generate(p.name,p.role,p.role==='GOL'?0:1,p).ovr;return data.filter(p=>filter==='all'||p.club===filter).sort((a,b)=>b.score-a.score||b.goals-a.goals||a.name.localeCompare(b.name));}
return {ensure,record,rank,key,baseValue,estimateValue,bidDelta,reconcileBids,mvpRanking,verifiedKeeperSaves,reconcileGoalkeepers};
});