/* BLUE LOCK NEO — Match Pulse 31–40
 * Additive engine hooks. Every highlight belongs to an actual engine event.
 * Score, player identity, saves, physics and existing automatic coaching remain authoritative.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.NeoEngine)api.adapt(root.NeoEngine);
 if(root?.document){root.NeoMatchPulseV240=api;api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const num=x=>Number.isFinite(+x)?+x:0,cap=(v,min,max)=>Math.max(min,Math.min(max,v));
const present=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&[0,1].includes(p.side);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function state(m){
 if(!m._neo240)m._neo240={schema:1,events:[],narration:[],highlights:[],pressure:[],mental:{},
   territory:[0,0],territorySamples:0,lastSample:-100,lastTick:-100,
   chain:[null,null],receptions:0,coach:[],smartSubs:[],greatSaves:[],snapshots:0};
 return m._neo240;
}
function pulse(m,idea,type,p,message){
 if(!m||m.phase==='finished')return false;
 const s=state(m),at=Math.floor(num(m.time)/60),side=present(p)?p.side:null,name=present(p)?String(p.name):'';
 const last=s.events.at(-1);
 if(last&&last.idea===idea&&last.name===name&&num(m.time)-last.time<50)return false;
 const item={idea,type,minute:at,time:+num(m.time).toFixed(1),name,side,
  text:String(message||'').slice(0,120)};
 s.events.push(item);
 if(s.events.length>68)s.events.shift();
 return true;
}
function intensity(m,side){
 if(m.phase!=='play'||!Number.isInteger(side))return 1;
 const diff=num(m.score?.[side])-num(m.score?.[1-side]);
 const min=num(m.time)/60;
 return cap(1+(min>=69&&diff<0?.025:0)+(min>=84&&diff===0?.010:0)-
   (min>=86&&diff>=2?.012:0),.98,1.035);
}
function mental(m,p){
 if(!present(p)||m.phase!=='play')return 1;
 const pressure=num(m.opponentPressure?.(p,68));
 const matchFatigue=cap((48-num(p.stamina))/48,0,1);
 const external=pressure>=2?.012:0;
 return cap(1-matchFatigue*.027-external,.955,1);
}
function tactical(m,p,owner,choice){
 if(!present(p)||!present(owner)||p.side!==owner.side||m.phase!=='play')return choice;
 if(num(p.stamina)<40)return choice;
 const progress=num(m.progress?.(p.side,owner.x));
 const trailing=num(m.score?.[p.side])<num(m.score?.[1-p.side]);
 if(trailing&&num(m.time)>74*60&&progress>850&&progress<1330&&
  ['check','support','overlap'].includes(choice)&&['MEI','MC','CAM','PE','PD'].includes(p.role)){
  pulse(m,34,'collective',p,'Técnica coletiva: aproximação ofensiva para oferecer linha de passe');
  return 'third-man';
 }
 return choice;
}
function cameraCue(m){
 if(!m?.ball)return null;
 const ball=m.ball;
 const fx=m.skillEffects?.at(-1);
 if(ball.mode==='shot')return {kind:'shot',x:num(ball.x),y:num(ball.y),focus:ball.by?.name||null,zoom:1.16};
 if(fx&&num(m.time)<num(fx.until)&&num(m.time)>=num(fx.start))
  return {kind:'skill',x:num(fx.x),y:num(fx.y),focus:fx.player||null,zoom:1.42};
 if(ball.owner&&present(ball.owner))return {kind:'possession',x:ball.owner.x,y:ball.owner.y,
  focus:ball.owner.name,zoom:1.29};
 return {kind:'ball',x:num(ball.x),y:num(ball.y),focus:null,zoom:1.08};
}
function save(m,keeper,before,hit){
 if(!hit||!present(keeper)||!before||before.side===keeper.side)return false;
 const actual=(m.shotMap||[]).slice().reverse().find(x=>x.savedBy===keeper.name&&x.outcome==='saved'&&x.side===before.side);
 if(!actual)return false;
 const xg=cap(num(actual.xg||before.xg),0,1);
 const s=state(m);
 if(xg<.22)return false;
 if(s.greatSaves.some(e=>e.id===actual))return false;
 const record={id:actual,minute:Math.floor(num(m.time)/60),name:keeper.name,side:keeper.side,
  xg:+xg.toFixed(3)};
 s.greatSaves.push(record);if(s.greatSaves.length>20)s.greatSaves.shift();
 pulse(m,33,'save',keeper,'Defesa registrada contra finalização perigosa de '+Math.round(xg*100)+'% xG');
 return true;
}
function observe(m){
 if(!m||m.phase!=='play')return;
 const s=state(m);
 if(num(m.time)-s.lastSample>=12&&present(m.ball.owner)){
  s.lastSample=num(m.time);s.territorySamples++;
  const p=m.ball.owner;
  if(num(m.progress?.(p.side,p.x))>990)s.territory[p.side]++;
 }
 if(num(m.time)-s.lastTick>=52){
  s.lastTick=num(m.time);
  for(const side of [0,1]){
   if(intensity(m,side)>1.02){
    const player=m.players?.find(p=>p.side===side&&p.i>0&&present(p));
    if(player)pulse(m,31,'intensity',player,'A equipe aumenta a intensidade contextual em busca do resultado');
   }
  }
 }
 const pass=m.lastPass;
 const owner=m.ball.owner;
 if(pass?.p&&owner&&pass.p!==owner&&m.ball.mode==='carry'&&pass.side===owner.side&&
    num(m.time)-num(pass.time)<95){
  const old=s.chain[owner.side];
  if(old?.id===pass&&old.done)return;
  const prev=s.chain[owner.side];
  const player=m.players.find(p=>p.name===owner.name&&p.side===owner.side);
  s.chain[owner.side]={id:pass,done:true,owner:owner.name,at:num(m.time),count:prev?.owner===pass.p.name?prev.count+1:1};
  s.receptions++;
  if(s.chain[owner.side].count>=3&&player){
   pulse(m,36,'combination',player,'Combinação especial após sequência real de passes recebidos');
  }
 }
}
function onLog(m,msg,type,who){
 const s=state(m);const evt={minute:Math.floor(num(m.time)/60),
  type:String(type||'play').slice(0,25),name:String(who||'').slice(0,58),
  text:String(msg||'').slice(0,145)};
 const prev=s.narration.at(-1);
 if(!prev||prev.text!==evt.text||prev.minute!==evt.minute){
  s.narration.push(evt);if(s.narration.length>38)s.narration.shift();
 }
 if(['goal','save','skill','duel','coach'].includes(evt.type)){
  const key=evt.minute+'|'+evt.type+'|'+evt.text;
  if(!s.highlights.some(h=>h.key===key)){
   s.highlights.push({...evt,key});
   if(s.highlights.length>24)s.highlights.shift();
  }
 }
}
function trackSub(m){
 const s=state(m);
 for(const r of (m.subRecords||[]).slice(s.smartSubs.length)){
  s.smartSubs.push({side:r.side,out:r.out,in:r.in,role:r.role,minute:r.minute});
  if(s.smartSubs.length>12)s.smartSubs.shift();
  pulse(m,39,'sub',m.players?.find(p=>p.name===r.in&&p.side===r.side),
    'Substituição real: '+r.out+' por '+r.in);
 }
}
function report(m){
 const s=state(m);
 return {schema:1,events:s.events.slice(-36),narration:s.narration.slice(-28),
  highlights:s.highlights.slice(-18).map(({key,...e})=>e),
  greatSaves:s.greatSaves.slice(-12).map(({id,...e})=>e),
  substitutions:s.smartSubs.slice(-10),territory:s.territory.slice(),
  territorySamples:s.territorySamples,receptions:s.receptions,coach:(m.coachDecisions||[]).slice(-18)};
}
function adapt(engine){
 const proto=engine?.Match?.prototype;
 if(!proto||proto._neo240Installed)return false;
 if(typeof proto._attributes==='function'){
  const original=proto._attributes;
  proto._attributes=function(p,stat){
   const base=original.call(this,p,stat);
   if(!present(p)||!Number.isFinite(base))return base;
   const watched=['vision','passing','positioning','tackling','control','finishing'];
   return watched.includes(stat)?cap(base*intensity(this,p.side)*mental(this,p),1,125):base;
  };
 }
 if(typeof proto._runType==='function'){
  const original=proto._runType;
  proto._runType=function(p,owner){return tactical(this,p,owner,original.call(this,p,owner));};
 }
 if(typeof proto._keeperAttempt==='function'){
  const original=proto._keeperAttempt;
  proto._keeperAttempt=function(keeper,ball,dt){
   const shot=ball?.mode==='shot'?{side:ball.by?.side,xg:num(ball.shotXg)}:null;
   const hit=original.call(this,keeper,ball,dt);
   save(this,keeper,shot,hit);return hit;
  };
 }
 if(typeof proto.log==='function'){
  const original=proto.log;
  proto.log=function(message,type,who){const result=original.call(this,message,type,who);
   onLog(this,message,type,who);return result;};
 }
 if(typeof proto.step==='function'){
  const original=proto.step;
  proto.step=function(dt){const r=original.call(this,dt);observe(this);trackSub(this);return r;};
 }
 if(typeof proto.result==='function'){
  const original=proto.result;
  proto.result=function(){const r=original.call(this);r.neo240=report(this);return r;};
 }
 Object.defineProperty(proto,'_neo240Installed',{value:true});
 return true;
}
function mount(win){
 const doc=win.document;
 const create=(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
 function render(){
  const box=doc.getElementById('neo240-match-report');if(!box?.open)return;
  const body=box.querySelector('.neo240-body'),events=body.querySelector('.neo240-events');
  if(!events)return;
  events.replaceChildren();
  const m=win.NeoMatchBridge?.getMatch?.();
  if(!m){events.append(create('p',null,'Inicie uma partida para acompanhar os acontecimentos verdadeiros.'));return}
  const data=report(m);
  events.append(create('p',null,'Domínio territorial (amostras no terço ofensivo): '+data.territory.join(' × ')));
  events.append(create('p',null,'Conexões confirmadas: '+data.receptions+' · Defesas perigosas: '+data.greatSaves.length));
  const wrap=create('div','neo240-event-list');
  for(const e of data.narration.slice(-14).reverse()){
   wrap.append(create('p',null,e.minute+"' · "+e.text));
  }
  if(!wrap.childElementCount)wrap.append(create('p',null,'Sem acontecimentos registrados nesta partida.'));
  events.append(wrap);
 }
 function boot(){
  const tab=doc.getElementById('match');if(!tab||doc.getElementById('neo240-match-report'))return;
  const box=create('details','neo240-panel');box.id='neo240-match-report';
  box.append(create('summary',null,'📡 Central da partida · câmera, narração e táticas verificadas'));
  const body=create('div','neo240-body');box.append(body);
  tab.append(box);box.addEventListener('toggle',()=>{if(box.open)render();});
  const button=create('button','neo240-refresh','Atualizar lances da partida');button.type='button';
  button.addEventListener('click',render);body.append(button,create('div','neo240-events'));
  box.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target===button)render();});
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {state,pulse,intensity,mental,tactical,cameraCue,save,observe,onLog,trackSub,report,adapt,mount};
});