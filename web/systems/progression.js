/* Season progression and competitive ranking, derived only from recorded results. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.NeoProgression=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';const Abilities=typeof globalThis!=='undefined'&&globalThis.NeoAbilities||require('./abilities.js');const Attr=typeof globalThis!=='undefined'&&globalThis.NeoAttributes||require('./attributes.js');const key=(name,club)=>name+'|'+club;
// Valores em ienes (lances fictícios da Liga Neo Egoísta, não cotações oficiais).
// O elenco tem diferenciação desde o início; desempenho recente varia o valor aos poucos.
const STAR_POTENTIAL=Object.freeze({
 'Michael Kaiser':330,'Rin Itoshi':250,'Yoichi Isagi':245,'Ryusei Shido':165,
 'Shoei Baro':155,'Meguru Bachira':125,'Seishiro Nagi':95,'Hyoma Chigiri':105,
 'Rensuke Kunigami':85,'Reo Mikage':90,'Oliver Aiku':110,'Don Lorenzo':180,
 'Charles Chevalier':190,'Gin Gagamaru':95,'Yo Hiori':90,'Ikki Niko':65,
 'Tabito Karasu':68,'Alexis Ness':93,'Ranze Kurona':55,'Eita Otoya':48,
 'Kenyu Yukimiya':65,'Jingo Raichi':55,'Zantetsu Tsurugi':55,
 'Aoshi Tokimitsu':48,'Nijiro Nanase':38
});
const num=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
const between=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
// Mercado fictício: OVR/posição determinam uma avaliação inicial e lances reais
// alteram o preço ao longo da temporada. Não criar defesas ou gols artificiais.
function baseValue(ovr=75,role='MC'){
 const skill=between(num(ovr,75),60,99),keeper=/^(GOL|GK)$/.test(role);
 const back=/^(ZAG|CB|LD|LE|RB|LB|VOL|CDM|ALA|LWB|RWB)$/.test(role);
 const master=skill>90;
 const score=60+Math.pow(between((skill-65)/25,0,1),1.62)*770;
 const factor=keeper?1.22:back?1.15:1.05;
 const millions=master?1550+(skill-90)*140:score*factor;
 return Math.round(between(millions,65,2850)*10)*100000;
}
function estimateValue(player,ovr,role){
 const games=Math.max(0,num(player?.games)),position=role||player?.role||'MC';
 const keeper=/^(GOL|GK)$/.test(position);
 const defender=/^(ZAG|CB|LD|LE|RB|LB|VOL|CDM|ALA|LWB|RWB)$/.test(position);
 const base=baseValue(ovr??player?.ovr??75,position);
 const goals=Math.max(0,num(player?.goals)),assists=Math.max(0,num(player?.assists));
 const saves=Math.max(0,num(player?.saves)),tackles=Math.max(0,num(player?.tackles));
 const dribbles=Math.max(0,num(player?.dribbles));
 const interceptions=Math.max(0,num(player?.interceptions));
 const shotBlocks=Math.max(0,num(player?.shotBlocks));
 const aerialWins=Math.max(0,num(player?.aerialWins));
 const duelsWon=Math.max(0,num(player?.duelsWon));
 const keyPasses=Math.max(0,num(player?.keyPasses));
 const cleanSheets=Math.max(0,num(player?.cleanSheets));
 const passing=Math.max(0,num(player?.passes));
 const rating=games?num(player?.ratingSum)/games:6;
 const success=Math.max(0,num(player?.wins));
 const production=goals*(keeper?12:defender?23:24)+assists*(keeper?10:defender?17:16)
  +saves*(keeper?8.5:.10)+tackles*(defender?5.8:1.3)
  +interceptions*(defender?6.3:1.6)+shotBlocks*(defender?8.2:1.5)
  +aerialWins*(defender?3.3:1.0)+duelsWon*(defender?2.3:.7)
  +keyPasses*(defender?4.2:4.3)+dribbles*(keeper?.3:defender?1.8:2.2)
  +cleanSheets*(keeper?27:defender?16:1.8)+passing*(keeper?.06:defender?.09:.11)
  +Math.max(0,rating-6)*games*(defender?6.0:keeper?5.7:4.8)
  +success*(defender?4:3);
 return Math.round(between(base+between(production,0,1500)*1e6,base,3e9)/100000)*100000;
}
function ensure(season){if(!season.career||typeof season.career!=='object')season.career={players:{},history:[],version:1};const c=season.career;c.links=c.links||{};c.rivals=c.rivals||{};c.stories=c.stories||[];return c;}
function row(career,name,club){const id=key(name,club);return career.players[id]||(career.players[id]={name,club,games:0,goals:0,assists:0,dribbles:0,tackles:0,interceptions:0,shotBlocks:0,aerialWins:0,duelsWon:0,keyPasses:0,saves:0,cleanSheets:0,wins:0,passes:0,impact:0,ratingSum:0,score:0,value:0,change:0,boosts:{},unlocked:[],abilityUses:{},history:[],flowCount:0,masterApps:0});}
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
  p.ovr=Attr.generate(p.name,p.role,0,p).ovr;p.value=estimateValue(p,p.ovr,p.role);
 }
 return repaired;
}
function record(season,fixture,match,round){const career=ensure(season);const r=match.result();const raw=r.players||[];
 for(const p of raw){if(p.isMaster)continue;const club=p.side===0?fixture.home:fixture.away,entry=row(career,p.name,club);entry.unlocked=entry.unlocked||[];const before=estimateValue(entry,p.ovr,p.role);entry.role=p.role;entry.ovr=p.ovr;const result=p.side===0?r.score[0]-r.score[1]:r.score[1]-r.score[0];
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
 entry.games++;entry.goals+=p.goals||0;entry.assists+=p.assists||0;entry.dribbles+=p.dribblesWon||0;entry.tackles+=p.tackles||0;
 entry.interceptions=(entry.interceptions||0)+(p.interceptions||0);
 entry.shotBlocks=(entry.shotBlocks||0)+(p.shotBlocks||0);
 entry.aerialWins=(entry.aerialWins||0)+(p.aerialWins||0);
 entry.duelsWon=(entry.duelsWon||0)+(p.duelsWon||0);
 entry.keyPasses=(entry.keyPasses||0)+(p.keyPasses||0);
 entry.saves+=verifiedKeeperSaves(r,p);entry.cleanSheets=(entry.cleanSheets||0)+(cleanSheet?1:0);entry.wins=(entry.wins||0)+(result>0?1:0);entry.passes+=p.passes||0;entry.flowCount+=p.flowCount||0;entry.ratingSum+=p.rating||6;entry.impact+=scoreGain;entry.score=Math.round(entry.impact*10)/10;
 entry.value=estimateValue(entry,entry.ovr,entry.role);entry.change=entry.value-before;
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
return {ensure,record,rank,key,baseValue,estimateValue,verifiedKeeperSaves,reconcileGoalkeepers};
});