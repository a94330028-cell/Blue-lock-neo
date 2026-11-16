/* Blue Lock NEO 1.2 — EGO EVOLUTION. Additive to the official engine.
 * Never generates scores, fixtures, phantom abilities or portraits.
 * Uses only recorded match events and the match's seeded random decisions.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine){api.adapt(root.NeoEngine);if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const deepRole=r=>/^(ZAG|CB|LD|LE|RB|LB|VOL|CDM|ALA|LWB|RWB)$/i.test(String(r||''));
const key=(a,b,sep)=>[a,b].sort((x,y)=>x.localeCompare(y)).join(sep);
function careerEntry(m,p){return m?.careerPlayers?.[p?.name+'|'+m?.teams?.[p?.side]?.id]||null;}
function partnerChemistry(m,a,b){
 if(!m||!a||!b||a.side!==b.side||a===b)return 0;
 const id=key(a.name,b.name,' + ')+'|'+m.teams?.[a.side]?.id;
 const count=num(m.careerLinks?.[id]?.plays);
 return clamp(Math.floor(count/3),0,3);
}
function focus(m,p){
 if(!m||!p)return 1;
 const stamina=clamp(num(p.stamina||0),0,100);
 const pressing=m.pressing?.[p.side]==='high';
 const nearPressure=typeof m.opponentPressure==='function'?m.opponentPressure(p,95):0;
 const late=m.time>70*60?0.055:0;
 const fatigue=stamina<40?(.40-stamina/100)*.45:0;
 const wear=nearPressure>=2?.16:nearPressure===1?.055:0;
 const mentality=clamp((num(p.attributes?.ego)||75)/100,.35,1.2);
 const history=careerEntry(m,p)?.egoJourney;
 const confidence=clamp(num(history?.confidence||50),0,100);
 return clamp(.96-fatigue-wear-(pressing?.065:0)-late+(mentality-.75)*.12+(confidence-50)*.001, .36,1);
}
function chemistryCandidate(m,p,base){
 if(!m||!p||!base||!base.q||!Array.isArray(m.players))return base;
 // The best pure tactical lane remains dominant; chemistry is only a tiebreaker
 // for a genuinely playable second choice, not a guaranteed combination.
 let winner=base,top=num(base.value);
 for(const q of m.players){
  if(q===p||q.side!==p.side||q.i===0||!valid(q))continue;
  const tier=partnerChemistry(m,p,q);if(tier===0)continue;
  const d=dist(p,q),ahead=(q.x-p.x)*(p.side===0?1:-1);
  if(d<65||d>355||ahead < -170||m.offside?.(q,p))continue;
  const lane=m.safeLane?.(p,q)??0;
  if(lane<50||(m.opponentPressure?.(q,80)||0)>1)continue;
  const merit=(ahead*.1-d*.067+(lane>70?29:17)+(q.i>=8?9:0)) + tier*12;
  if(merit>top+6){winner={q,value:merit,lane,d};top=merit;}
 }
 return winner;
}
function dangerTarget(m,defender,target,phase){
 if(!m||!defender||!target||!valid(target)||!valid(defender)||!deepRole(defender.role))return target;
 if(defender.i===0||defender.run||m.phase!=='play'||!['block','transition-defense'].includes(phase))return target;
 const side=defender.side;
 if((m.progress?.(side,m.ball?.x)||Infinity)>770)return target;
 const enemies=(m.players||[]).filter(p=>p&&p.side!==side&&p.i!==0&&valid(p));
 if(!enemies.length)return target;
 const scored=enemies.map(p=>({p,threat:num(p.goals)*2.7+num(p.shots)*.35+num(p.dribblesWon)*.6+Math.max(0,num(p.rating)-6)*.35}));
 scored.sort((a,b)=>b.threat-a.threat||a.p.id-b.p.id);
 const star=scored[0];
 if(star.threat<2.5||Math.abs(star.p.y-576)>300)return target;
 const defenders=(m.players||[]).filter(p=>p&&p.side===side&&p.i!==0&&deepRole(p.role)&&valid(p));
 defenders.sort((a,b)=>dist(a,star.p)-dist(b,star.p)||a.id-b.id);
 if(defenders[0]!==defender)return target; // only ONE defender marks the star
 const t=star.p,dx=clamp(t.x-target.x,-75,75),dy=clamp(t.y-target.y,-95,95);
 return {x:clamp(target.x+dx*.28,75,1845),y:clamp(target.y+dy*.28,45,1105)};
}
function adaptiveRun(m,p,owner,original){
 if(!m||!p||!owner||p.side!==owner.side||m.phase!=='play'||!valid(p)||!valid(owner))return original;
 const ep=careerEntry(m,p);
 const recentLosses=num(ep?.egoJourney?.lossStreak);
 const progress=m.progress?.(p.side,owner.x)||0;
 if(progress>910&&num(m.careerLinks&&Object.keys(m.careerLinks).length)>0){
  const partners=(m.players||[]).filter(q=>q!==p&&q.side===p.side&&q.i!==0&&q.name===owner.name);
  if(partners.length&&partnerChemistry(m,p,owner)>=2&&m.random()<.24){
    return Math.abs(owner.y-576)>170?'blindside':'third-man';
  }
 }
 if(recentLosses>=2&&m.time>62*60&&m.score?.[p.side]<m.score?.[1-p.side]&&
    /^(CA|CF|ST|SA|MC|CM|MEI|CAM)$/i.test(p.role||'')&&progress>740&&m.random()<.35)
     return 'late-box';
 return original;
}
function mentallySafeAction(m,p){
 if(!m||!p||p.i===0||m.ball?.owner!==p||m.phase!=='play')return false;
 const concentration=focus(m,p);
 if(concentration>=.78||m.random()>=(.78-concentration)*.35)return false;
 // Fatigue causes conservative recirculation instead of a fake lost ball.
 const candidate=m.passCandidate?.(p);
 if(!candidate?.q||candidate.lane<48||candidate.d>255)return false;
 if(m.offside?.(candidate.q,p))return false;
 return !!m.pass(p,candidate.q);
}
function masteryTier(uses){
 const count=Math.max(0,Math.floor(num(uses)));
 return count>=18?3:count>=5?2:1;
}
const masteryLabel=tier=>tier===3?'Supremo':tier===2?'Avançado':'Inicial';
function progressRecordedMatch(engine,season,fixture,match,round){
 const c=season?.career,details=match?.result?.();
 if(!c?.players||!details||!Array.isArray(details.players))return;
 const eventKey=round+'|'+fixture.home+'|'+fixture.away;
 for(const p of details.players){
  if(p.isMaster||![0,1].includes(p.side)||!p.name)continue;
  const club=p.side===0?fixture.home:fixture.away;
  const row=c.players[p.name+'|'+club];if(!row)continue;
  const path=row.egoJourney||(row.egoJourney={form:[],confidence:50,lossStreak:0,breakthroughs:0});
  if(path.lastRecorded===eventKey)continue;
  path.lastRecorded=eventKey;
  const goalDiff=num(details.score?.[p.side])-num(details.score?.[1-p.side]);
  path.lossStreak=goalDiff<0?Math.min(12,num(path.lossStreak)+1):0;
  const grade=clamp(num(p.rating)||6,0,10),prior=clamp(num(path.confidence||50),0,100);
  path.confidence=clamp(Math.round(prior+(grade-6.4)*2.2+(goalDiff>0?2:goalDiff<0?-2:0)),20,85);
  if(!Array.isArray(path.form))path.form=[];
  path.form.push({round,rating:grade,goals:num(p.goals),assists:num(p.assists),saves:num(p.saves)});
  if(path.form.length>12)path.form.shift();
  const current=row.weaponMastery||(row.weaponMastery={});
  for(const [id,uses] of Object.entries(row.abilityUses||{})){
   if(typeof id!=='string'||id.length>100)continue;
   const tier=masteryTier(uses),before=Math.max(1,num(current[id]||1));
   if(tier>before){
    path.breakthroughs=Math.min(999,num(path.breakthroughs)+1);
    c.stories?.push({round,kind:'arma',text:p.name+' aprimorou '+id+' para '+masteryLabel(tier)+' após atuações registradas.'});
   }
   current[id]=Math.max(before,tier);
  }
 }
 // Only genuine in-match duels can increase the rivalry level.
 const seen=new Set();
 for(const d of details.duelHistory||[]){
  if(!d?.attacker||!d?.defender||d.attacker===d.defender)continue;
  const pair=key(d.attacker,d.defender,' × '),ledger=c.rivals?.[pair];
  if(!ledger)continue;
  const stamp=[d.time,d.attacker,d.defender,d.kind,d.winner].join('|');
  if(seen.has(stamp))continue;seen.add(stamp);
  ledger.actualDuels=Math.min(10000,num(ledger.actualDuels)+1);
  ledger.level=ledger.actualDuels>=12?3:ledger.actualDuels>=4?2:1;
  if(ledger.actualDuels===4||ledger.actualDuels===12){
   c.stories?.push({round,kind:'rivalidade',text:pair+' alcança '+(ledger.level===3?'rivalidade lendária':'disputa intensa')+' por duelos reais.'});
  }
 }
 if(c.stories?.length>90)c.stories=c.stories.slice(-90);
}
function adapt(engine){
 const p=engine?.Match?.prototype;if(!p||p._neo120Evolution)return false;
 if(typeof p.passCandidate==='function'){
  const original=p.passCandidate;
  p.passCandidate=function(player){return chemistryCandidate(this,player,original.call(this,player));};
 }
 if(typeof p._defensivePositionalTarget==='function'){
  const original=p._defensivePositionalTarget;
  p._defensivePositionalTarget=function(player,target,phase){
   return dangerTarget(this,player,original.call(this,player,target,phase),phase);
  };
 }
 if(typeof p._runType==='function'){
  const original=p._runType;
  p._runType=function(player,owner){return adaptiveRun(this,player,owner,original.call(this,player,owner));};
 }
 if(typeof p._ownerDecision==='function'){
  const original=p._ownerDecision;
  p._ownerDecision=function(player){
   if(mentallySafeAction(this,player))return;
   return original.call(this,player);
  };
 }
 if(typeof p._recordDuel==='function'){
  const original=p._recordDuel;
  p._recordDuel=function(a,b,w,kind){
   const before=this.duelHistory?.length||0;
   const result=original.call(this,a,b,w,kind);
   if(!w||!a||!b||this.duelHistory?.length===before)return result;
   const entry=this.careerRivals?.[key(a.name,b.name,' × ')];
   if(entry&&num(entry.actualDuels)>=4&&this.time-(this._neo120DuelsAt||-1000)>170){
    this._neo120DuelsAt=this.time;
    this._ego?.(w,clamp(num(entry.actualDuels)/5,1,3),'duelo histórico');
    this.log?.('🔥 Rivalidade em campo: '+a.name+' × '+b.name+'!', 'duel',w.name);
   }
   return result;
  };
 }
 const progression=engine.Progression;
 if(progression&&typeof progression.record==='function'&&!progression._neo120Recorded){
  const original=progression.record;
  progression.record=function(season,fixture,match,round){
   const value=original.call(this,season,fixture,match,round);
   progressRecordedMatch(engine,season,fixture,match,round);
   return value;
  };
  Object.defineProperty(progression,'_neo120Recorded',{value:true});
 }
 Object.defineProperty(p,'_neo120Evolution',{value:true});
 return true;
}
function snapshot(season){
 const career=season?.career||{};
 const players=Object.values(career.players||{}).filter(p=>p?.name&&num(p.games)>0);
 const mastery=players.flatMap(p=>Object.entries(p.weaponMastery||{}).filter(([,tier])=>num(tier)>=2)
  .map(([id,tier])=>({name:p.name,club:p.club,ability:id,tier:num(tier)})))
  .sort((a,b)=>b.tier-a.tier||a.name.localeCompare(b.name)).slice(0,8);
 const pairs=Object.values(career.links||{}).filter(p=>num(p.plays)>=2)
   .sort((a,b)=>num(b.plays)-num(a.plays)).slice(0,5);
 const rivals=Object.values(career.rivals||{}).filter(p=>num(p.actualDuels)>=1)
   .sort((a,b)=>num(b.actualDuels)-num(a.actualDuels)).slice(0,5);
 const stories=(career.stories||[]).filter(s=>s&&s.text).slice(-6).reverse();
 return {mastery,pairs,rivals,stories};
}
function mount(win){
 const doc=win?.document;if(!doc)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const boot=()=>{
  const host=doc.getElementById('records');if(!host||doc.getElementById('neo120-journal'))return;
  const section=doc.createElement('section');section.id='neo120-journal';section.className='neo120-panel';
  section.innerHTML='<div class="neo120-title"><span>🔥 ARQUIVO DE EGOÍSTAS</span><small>BASEADO EM PARTIDAS SALVAS</small></div><div id="neo120-journal-body"></div>';
  host.append(section);
  const render=()=>{
   let season;try{season=JSON.parse(win.localStorage.getItem('neo-season-v2')||'null')}catch(_){season=null}
   const body=doc.getElementById('neo120-journal-body');if(!body)return;
   const view=snapshot(season);
   const sig=JSON.stringify(view);if(body.dataset.signature===sig)return;body.dataset.signature=sig;
   const block=(label,list,renderRow)=>'<div class="neo120-group"><strong>'+label+'</strong>'+
      (list.length?list.map(renderRow).join(''):'<p>Novidades aparecem depois que os jogadores participarem de partidas oficiais.</p>')+'</div>';
   body.innerHTML=block('⚔️ Rivalidades reais',view.rivals,r=>'<p>'+esc((r.names||[]).join(' × '))+' · '+num(r.actualDuels)+' duelos</p>')+
     block('🤝 Duplas em evolução',view.pairs,r=>'<p>'+esc((r.names||[]).join(' + '))+' · '+num(r.plays)+' gols com assistência</p>')+
     block('✦ Armas aperfeiçoadas',view.mastery,r=>'<p>'+esc(r.name)+' · '+esc(r.ability)+' — <b>'+masteryLabel(r.tier)+'</b></p>')+
     block('📰 Momentos registrados',view.stories,r=>'<p>'+esc(r.text)+'</p>');
  };
  render();
  doc.addEventListener('click',event=>{if(event.target.closest?.('[data-tab="records"],[data-neo-tab="records"]'))win.setTimeout(render,80)});
  win.addEventListener('focus',render);
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {partnerChemistry,focus,chemistryCandidate,dangerTarget,adaptiveRun,mentallySafeAction,masteryTier,progressRecordedMatch,snapshot,adapt,mount};
});