/* Blue Lock NEO — Ego Evolution Pack: backlog ideas 19–30.
   Decisions use the existing physics/ball/duel engine; never create a synthetic goal.
   No imported artwork, destructive save migrations, or background UI loops. */
(function(root, factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
 if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const N=x=>Number.isFinite(Number(x))?Number(x):0;
const cap=(x,a,b)=>Math.max(a,Math.min(b,x));
const physical=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&[0,1].includes(p.side);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const attacker=p=>/^(CA|CF|ST|SA|PE|PD|LW|RW|MEI|CAM)$/.test(String(p?.role||''));
const midfield=p=>/^(MC|CM|MEI|CAM|VOL|CDM|PE|PD|LW|RW)$/.test(String(p?.role||''));
const forward=(m,p,q)=>m?.progress?.(p.side,q.x)>m?.progress?.(p.side,p.x);
const id=p=>String(p?.side)+'|'+String(p?.name);
const pair=(a,b)=>[String(a),String(b)].sort().join(' × ');
const positive=(a,b)=>a&&b&&a.side===b.side&&a!==b;
function state(m){
 if(!m._neo230) m._neo230={events:[],losses:Object.create(null),wins:Object.create(null),
   chemistry:Object.create(null),completions:0,launched:[],recentAbility:[null,null],
   recentShot:[null,null],conflicts:Object.create(null),genius:0,innovations:0,
   lastEvent:Object.create(null),counters:0};
 return m._neo230;
}
function event(m,idea,p,message,other=''){
 if(!m||!p||!physical(p))return false;
 const s=state(m),kind=String(idea),key=kind+'|'+id(p)+'|'+other;
 if(N(m.time)-N(s.lastEvent[key]??-9999)<55)return false;
 s.lastEvent[key]=N(m.time);
 s.events.push({idea:Number(idea),minute:Math.floor(N(m.time)/60),name:String(p.name).slice(0,70),
  side:p.side,text:String(message).slice(0,135),other:String(other).slice(0,70)});
 if(s.events.length>65)s.events.splice(0,s.events.length-65);
 return true;
}
function career(m,p){return m?.careerPlayers?.[p?.name+'|'+m?.teams?.[p?.side]?.id]||null;}
function weapon(m,p){
 if(!p?.activeAbility||N(p.activeAbility.until)<=N(m?.time))return null;
 return m?._neo230Engine?.Abilities?.get?.(p.activeAbility.id)||null;
}
// 19: mastery is earned in the season; it does not unlock locked weapons.
function skillTier(m,p,ability){
 const key=ability?.id;if(!key)return 0;
 const c=career(m,p),tier=N(c?.weaponMastery?.[key]);
 const uses=N(c?.abilityUses?.[key])+N(p?.abilityUses?.[key]);
 return cap(Math.max(tier,uses>=18?3:uses>=5?2:1),1,3);
}
// 21/22: link only a launched ball subsequently received by the intended player.
function launched(m,p,q){
 if(!m||!physical(p)||!physical(q)||!positive(p,q))return false;
 if(m.ball?.mode!=='pass'||m.ball.by!==p||m.ball.to!==q)return false;
 const s=state(m);s.launched.push({from:p.name,to:q.name,side:p.side,at:N(m.time),done:false});
 if(s.launched.length>8)s.launched.shift();
 return true;
}
function observeReception(m){
 if(!m?.ball||m.phase!=='play')return false;
 const s=state(m),receiver=m.ball.owner;
 let success=false;
 for(const x of s.launched){
  if(x.done)continue;
  if(N(m.time)-x.at>95){x.done=true;continue;}
  // An opponent interception, loose-ball restart or unrelated carry ends the opportunity.
  if(m.ball.mode!=='pass'&&m.ball.mode!=='carry'){x.done=true;continue;}
  if(m.ball.mode==='carry'&&(receiver?.name!==x.to||receiver?.side!==x.side)){
   x.done=true;continue;
  }
  if(receiver?.name!==x.to||receiver?.side!==x.side||m.ball.mode!=='carry')continue;
  x.done=true;success=true;s.completions++;
  const k=x.side+'|'+pair(x.from,x.to),count=s.chemistry[k]=cap(N(s.chemistry[k])+1,1,12);
  const player=m.players?.find(q=>q.side===x.side&&q.name===x.to);
  if(player){
   player._neo230Chain={from:x.from,until:N(m.time)+90,count};
   if(count===2)event(m,22,player,'Entrosamento confirmado por passes recebidos',x.from);
   if(count===3)event(m,21,player,'Reação em cadeia: parceria encontrou ritmo',x.from);
  }
 }
 return success;
}
function chemistry(m,p,q){
 if(!positive(p,q))return 0;
 return N(state(m).chemistry[p.side+'|'+pair(p.name,q.name)]);
}
// 20: improvised escape through a legal, unmarked passing lane.
function improvise(m,p){
 if(!m||!physical(p)||!midfield(p)||p.i===0||m.phase!=='play'||m.ball?.owner!==p||
    N(p.stamina)<44||N(m.opponentPressure?.(p,70))<2)return false;
 const prog=N(m.progress?.(p.side,p.x));
 if(prog<390||prog>1400||m.random()>.085)return false;
 const viable=(m.players||[]).filter(q=>positive(p,q)&&q.i>0&&physical(q)&&
   dist(p,q)>75&&dist(p,q)<285&&!m.offside?.(q,p)&&N(m.safeLane?.(p,q))>60&&
   N(m.opponentPressure?.(q,75))<=1)
  .sort((a,b)=>N(m.safeLane(p,b))-N(m.safeLane(p,a))||
   (forward(m,p,b)?1:0)-(forward(m,p,a)?1:0)||a.name.localeCompare(b.name));
 if(!viable.length)return false;
 const q=viable[0];m.pass(p,q);
 const ok=m.ball?.mode==='pass'&&m.ball.by===p&&m.ball.to===q;
 if(ok){state(m).innovations++;event(m,20,p,'Improviso técnico: passe legal para escapar da pressão',q.name);}
 return ok;
}
// 23: each activated real weapon influences only its own relevant action.
function weaponFactor(m,p,stat){
 const a=weapon(m,p);if(!a||!p||a.stat!==stat)return 1;
 const level=skillTier(m,p,a);
 const uses=N(p.abilityUses?.[a.id]);
 const fatigue=cap((N(p.stamina)-24)/76,.25,1);
 return 1+cap(.006+level*.004+Math.min(7,uses)*.0008,0,.027)*fatigue;
}
// 24: finishing instinct rewards a recent verified save/rebound, never guarantees a goal.
function instinct(m,p,base){
 if(!m||!p||!Number.isFinite(base)||!attacker(p)||!m.inOpponentBox?.(p))return base;
 const prev=(m.shotMap||[]).slice(-9).reverse().find(s=>s.side===p.side&&s.outcome==='saved');
 const recent=prev&&Number.isFinite(prev.minute)&&N(m.time)/60-prev.minute<3.2;
 const active=weapon(m,p),shotSkill=active?.contexts?.includes('shot');
 return cap(base+(recent?.012:0)+(shotSkill?.008:0),.01,.52);
}
// 25: role flexibility is trained from actually completed games; temporary runs only.
function adaptableRun(m,p,owner,original){
 if(!m||!physical(p)||!physical(owner)||p.side!==owner.side||m.phase!=='play')return original;
 const practice=N(career(m,p)?.neo230?.positionWork);
 const progress=N(m.progress?.(p.side,owner.x));
 if(N(p.stamina)<47)return original;
 if(midfield(p)&&practice>=3&&progress>900&&Math.abs(owner.y-576)>150&&
    ['support','box','half-space','third-man'].includes(original)){
  event(m,25,p,'Lê outra função tática e ataca espaço de apoio');
  return 'late-box';
 }
 if(attacker(p)&&practice>=4&&progress>700&&progress<1100&&original==='decoy'){
  return 'third-man';
 }
 return original;
}
// 26: counter-attack initiative exists only immediately after a real turnover.
function counterRun(m,p,owner,original){
 if(!m||!physical(p)||!physical(owner)||p.side!==owner.side||!attacker(p)||N(p.stamina)<37)return original;
 const age=N(m.time)-N(m.lastTurnover?.[p.side]??-999);
 if(age<0||age>=9||N(m.progress?.(p.side,owner.x))<350)return original;
 if(['check','support','drop-off','decoy','third-man'].includes(original)){
  event(m,26,p,'Contra-ataque de Ego após recuperar a posse');
  state(m).counters++;
  return 'channel';
 }
 return original;
}
// 27: a rivalry for the ball is inferred from TWO actual teammates shooting.
// It creates a small bounded motivation, not fake tackles or forced bad passes.
function shotCompetition(m,p){
 const s=state(m),prior=s.recentShot[p.side];
 if(prior&&prior.name!==p.name&&N(m.time)-prior.time<210&&N(p.ego)>=28){
  const k=p.side+'|'+pair(p.name,prior.name);
  const times=s.conflicts[k]=cap(N(s.conflicts[k])+1,1,12);
  if(times>=2){
   p._neo230CompetitionUntil=N(m.time)+130;
   event(m,27,p,'Disputa de protagonismo com companheiro após finalizações reais',prior.name);
  }
 }
 s.recentShot[p.side]={name:p.name,time:N(m.time)};
}
// 28 and 29: persistent lessons after recorded defeats and local opponent learning.
function lessonFactor(m,p,stat){
 if(!p||!['vision','control','tackling','positioning','passing'].includes(stat))return 1;
 const record=career(m,p)?.neo230;
 if(N(record?.defeatLessons)<2||N(m.score?.[p.side])>=N(m.score?.[1-p.side]))return 1;
 return 1.013;
}
function adaptationFactor(m,p,stat){
 if(!p||!physical(p)||!['control','tackling','defense','dribbling','vision'].includes(stat))return 1;
 const enemy=m.ball?.owner;if(!enemy||enemy.side===p.side||!physical(enemy)||dist(p,enemy)>165)return 1;
 const count=N(state(m).losses[id(p)+'|'+id(enemy)]);
 return count>=2?1.017:1;
}
function competitionFactor(m,p,stat){
 return N(p?._neo230CompetitionUntil)>N(m?.time)&&['positioning','control'].includes(stat)?1.012:1;
}
// 30: genius moments are triggered by real active weapons during Flow and pressure.
function genius(m,p,a,context){
 if(!m||!p||!a||!physical(p)||N(p.flowUntil)<=N(m.time)||N(p.stamina)<33||
    !['shot','pass','dribble','tackle','save'].includes(context)||N(m.opponentPressure?.(p,72))<2)return false;
 if(N(p._neo230GeniusUntil)>N(m.time)||m.random()>.23)return false;
 p._neo230GeniusUntil=N(m.time)+34;p._neo230GeniusStat=a.stat;
 state(m).genius++;
 event(m,30,p,'Momento de genialidade com habilidade realmente ativada: '+String(a.label||a.id));
 return true;
}
function multiplier(m,p,stat){
 if(!p||!Number.isFinite(N(m?.time)))return 1;
 const surge=p._neo230GeniusStat===stat&&N(p._neo230GeniusUntil)>N(m.time)?1.035:1;
 return cap(weaponFactor(m,p,stat)*lessonFactor(m,p,stat)*adaptationFactor(m,p,stat)*
  competitionFactor(m,p,stat)*surge,1,1.105);
}
function onDuel(m,a,b,w){
 if(!m||!physical(a)||!physical(b)||!physical(w)||a.side===b.side)return;
 const loser=w===a?b:w===b?a:null;if(!loser)return;
 const s=state(m),lkey=id(loser)+'|'+id(w),wkey=id(w)+'|'+id(loser);
 s.losses[lkey]=cap(N(s.losses[lkey])+1,1,15);
 s.wins[wkey]=cap(N(s.wins[wkey])+1,1,15);
 if(s.losses[lkey]===2)event(m,29,loser,'Nova leitura defensiva após dois duelos perdidos',w.name);
}
function onWeapon(m,p,a,context){
 if(!physical(p)||!a)return;
 const s=state(m),prior=s.recentAbility[p.side];
 const uses=N(p.abilityUses?.[a.id]);
 if(uses===5||uses===18)event(m,19,p,'Arma atinge marco de domínio: '+a.label);
 if(prior&&prior.player!==p.name&&N(m.time)-prior.time<85&&prior.context!==context)
  event(m,21,p,'Combinação de armas em contextos diferentes',prior.player);
 s.recentAbility[p.side]={player:p.name,context,time:N(m.time)};
 event(m,23,p,'Arma ativada em ação '+context+': '+String(a.label||a.id));
 genius(m,p,a,context);
}
function report(m){
 const s=state(m);
 return {schema:1,events:s.events.slice(-45),completedConnections:s.completions,
  egoCounters:s.counters,improvisations:s.innovations,genius:s.genius,
  chemistry:Object.entries(s.chemistry).sort((a,b)=>b[1]-a[1]).slice(0,9),
  conflicts:Object.entries(s.conflicts).sort((a,b)=>b[1]-a[1]).slice(0,7)};
}
function recordSeason(season,fixture,match,round){
 const d=fixture?.details;if(!season||season.schema!==2||!Array.isArray(d?.players)||
  !Array.isArray(d?.score)||!Array.isArray(fixture.result)||
  !d.score.every((g,i)=>g===fixture.result[i]))return false;
 const c=season.career;if(!c?.players)return false;
 c.neo230Recorded=c.neo230Recorded||{};
 const stamp=round+'|'+fixture.home+'|'+fixture.away;
 if(c.neo230Recorded[stamp])return false;
 c.neo230Recorded[stamp]=true;
 for(const p of d.players){
  if(!p||p.isMaster||![0,1].includes(p.side)||!p.name)continue;
  const club=p.side===0?fixture.home:fixture.away;
  const row=c.players[p.name+'|'+club];if(!row)continue;
  const data=row.neo230||(row.neo230={matches:0,defeatLessons:0,positionWork:0,skills:{},lastRound:0});
  data.matches=cap(N(data.matches)+1,0,999);
  const lost=d.score[p.side]<d.score[1-p.side];
  if(lost&&N(p.rating)>=6.2){
   data.defeatLessons=cap(N(data.defeatLessons)+1,0,12);
  }else if(!lost)data.defeatLessons=cap(N(data.defeatLessons)-1,0,12);
  if(N(p.runs)+N(p.overlaps)+N(p.keyPasses)>=3&&
      /^(MC|CM|MEI|CAM|VOL|CDM|CA|ST|CF|SA)$/.test(String(p.role||''))){
   data.positionWork=cap(N(data.positionWork)+1,0,15);
  }
  for(const [skill,count] of Object.entries(p.abilityUses||{})){
   if(typeof skill!=='string'||skill.length>110||!Number.isFinite(+count)||+count<=0)continue;
   data.skills[skill]=cap(N(data.skills[skill])+Math.floor(+count),0,999);
  }
  // Keep per-player 230 history bounded, existing career history untouched.
  data.lastRound=N(round);
 }
 const keys=Object.keys(c.neo230Recorded);
 if(keys.length>180)for(const k of keys.slice(0,keys.length-180))delete c.neo230Recorded[k];
 return true;
}
function adapt(engine){
 const proto=engine?.Match?.prototype,progression=engine?.Progression;
 if(!proto||proto._neo230Installed)return false;
 if(typeof proto._attributes==='function'){
  const old=proto._attributes;
  proto._attributes=function(p,stat){
   this._neo230Engine=engine;
   const base=old.call(this,p,stat);
   return p&&Number.isFinite(base)?cap(base*multiplier(this,p,stat),1,125):base;
  };
 }
 if(typeof proto._recordDuel==='function'){
  const old=proto._recordDuel;
  proto._recordDuel=function(a,b,w,kind){
   const last=this.duelHistory?.at(-1),res=old.call(this,a,b,w,kind);
   if(this.duelHistory?.at(-1)!==last&&this.duelHistory?.length)onDuel(this,a,b,w);
   return res;
  };
 }
 if(typeof proto._activateAbility==='function'){
  const old=proto._activateAbility;
  proto._activateAbility=function(p,context){
   this._neo230Engine=engine;
   const a=old.call(this,p,context);if(a)onWeapon(this,p,a,context);return a;
  };
 }
 if(typeof proto.pass==='function'){
  const old=proto.pass;
  proto.pass=function(p,q){const res=old.call(this,p,q);launched(this,p,q);return res;};
 }
 if(typeof proto.step==='function'){
  const old=proto.step;
  proto.step=function(dt){const res=old.call(this,dt);observeReception(this);return res;};
 }
 if(typeof proto._ownerDecision==='function'){
  const old=proto._ownerDecision;
  proto._ownerDecision=function(p){if(improvise(this,p))return;return old.call(this,p);};
 }
 if(typeof proto._runType==='function'){
  const old=proto._runType;
  proto._runType=function(p,owner){
   let choice=old.call(this,p,owner);
   choice=adaptableRun(this,p,owner,choice);
   const chain=p?._neo230Chain;
   if(chain&&N(chain.until)>N(this.time)&&choice==='support'&&N(p.stamina)>39)
    choice='third-man';
   return counterRun(this,p,owner,choice);
  };
 }
 if(typeof proto.passCandidate==='function'){
  const old=proto.passCandidate;
  proto.passCandidate=function(p){
   const choice=old.call(this,p);if(!choice?.q||!physical(p))return choice;
   const bonus=chemistry(this,p,choice.q);
   if(bonus>=2&&N(choice.lane)>35&&!this.offside?.(choice.q,p))
    choice.value+=Math.min(16,bonus*2.5);
   return choice;
  };
 }
 if(typeof proto.shotQuality==='function'){
  const old=proto.shotQuality;
  proto.shotQuality=function(p){return instinct(this,p,old.call(this,p));};
 }
 if(typeof proto.shoot==='function'){
  const old=proto.shoot;
  proto.shoot=function(p){
   const length=this.shotMap?.length||0,res=old.call(this,p);
   if(physical(p)&&(this.shotMap?.length||0)>length)shotCompetition(this,p);
   return res;
  };
 }
 if(typeof proto.result==='function'){
  const old=proto.result;
  proto.result=function(){const data=old.call(this);data.ego230=report(this);return data;};
 }
 if(progression?.record&&!progression._neo230Installed){
  const old=progression.record;
  progression.record=function(season,fixture,match,round){
   const result=old.call(this,season,fixture,match,round);
   recordSeason(season,fixture,match,round);return result;
  };
  Object.defineProperty(progression,'_neo230Installed',{value:true});
 }
 Object.defineProperty(proto,'_neo230Installed',{value:true});
 return true;
}
function mount(win){
 const doc=win.document;if(!doc)return;
 const create=(tag,cls,txt)=>{const el=doc.createElement(tag);if(cls)el.className=cls;
   if(txt!==undefined)el.textContent=String(txt);return el;};
 function populate(){
  const records=doc.getElementById('records');if(!records)return;
  let panel=doc.getElementById('neo230-features');
  if(!panel){
   panel=create('details','neo230-compact');panel.id='neo230-features';
   panel.append(create('summary',null,'⚡ Evolução de Ego · 12 sistemas (19–30)'),
    create('div','neo230-content'));records.append(panel);
   panel.addEventListener('toggle',()=>{if(panel.open)populate();});
  }
  if(!panel.open)return;
  const out=panel.querySelector('.neo230-content');out.replaceChildren();
  const season=win.NeoCareerBridge?.getSeason?.();
  const rounds=(season?.rounds||[]).flatMap(r=>(r.games||[])
   .filter(g=>Array.isArray(g?.result)&&g.details?.ego230)
   .map(g=>({round:r.round,home:g.home,away:g.away,...g.details.ego230}))).slice(-12).reverse();
  out.append(create('p',null,'Dados de partidas reais. Não existem momentos criados artificialmente ou resultados garantidos.'));
  if(!rounds.length){out.append(create('p',null,'Conclua uma partida oficial para desbloquear os registros.'));return;}
  for(const r of rounds){
   const item=create('details','neo230-match');
   item.append(create('summary',null,'Rodada '+r.round+' · '+r.home.toUpperCase()+' × '+r.away.toUpperCase()+' · '+(r.events||[]).length+' decisões'));
   const list=create('div','neo230-timeline');
   for(const e of (r.events||[]).slice(-12))list.append(create('p',null,
    '#'+e.idea+' · '+e.minute+"' · "+e.name+' — '+e.text));
   if(!list.childElementCount)list.append(create('p',null,'Nenhum gatilho especial nesta partida.'));
   item.append(list);out.append(item);
  }
 }
 function boot(){
  const records=doc.getElementById('records');
  if(!records)return;
  populate();
  doc.addEventListener('click',e=>{
   if(e.target.closest?.('[data-tab="records"],[data-neo-tab="records"]')){
    win.setTimeout(()=>{const panel=doc.getElementById('neo230-features');if(panel?.open)populate();},100);
   }
  });
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {state,event,skillTier,launched,observeReception,chemistry,improvise,weaponFactor,instinct,
 adaptableRun,counterRun,shotCompetition,lessonFactor,adaptationFactor,competitionFactor,
 genius,multiplier,onDuel,onWeapon,report,recordSeason,adapt,mount};
});