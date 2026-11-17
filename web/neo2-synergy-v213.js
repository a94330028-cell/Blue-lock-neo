/* NEO 2.0 — real combination techniques, mastery and counterplay.
 * Bonuses are deliberately small, time-limited and earned by a completed
 * team possession action. Never force scoring or bypass physics.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.Neo2Synergy=api;if(root.NeoEngine)api.adapt(root.NeoEngine);}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const calc=x=>Number.isFinite(Number(x))?Number(x):0;
const states=new WeakMap();
function memory(m){
 let v=states.get(m);if(!v){v={combos:[],counters:[],last:{},reads:{}};states.set(m,v);}return v;
}
function combo(m,p,ability,context){
 if(!m||!p||!ability||!['shot','pass','dribble'].includes(context)||m.phase!=='play')return false;
 const s=memory(m),now=calc(m.time),last=m.lastPass;
 if(!last||last.side!==p.side||!last.p||last.p===p||
    now-calc(last.time)>52||now-calc(last.time)<0)return false;
 if(m.ball?.owner!==p)return false;
 const teammates=(m.players||[]).filter(q=>q.side===p.side&&q!==p&&q.i!==0&&
     q.activeAbility&&calc(q.activeAbility.until)>now&&Math.hypot(q.x-p.x,q.y-p.y)<325);
 const partner=teammates.find(q=>q===last.p)||teammates[0];
 if(!partner)return false;
 const identity=[p.name,partner.name].sort().join('|'),turn=s.last[identity]||-1000;
 if(now-turn<190||calc(p.stamina)<14)return false;
 const pskill=ability.id,pskill2=partner.activeAbility?.id;
 if(!pskill2||pskill===pskill2)return false;
 // A verified recent pass plus two different simultaneously active abilities.
 const uses=Math.min(30,calc(p.abilityUses?.[pskill]));
 const mastery=Math.min(.012,uses*.0004);
 const bonus=clamp(.037+mastery+(context==='shot'?.006:0),.03,.055);
 const stat=ability.stat||'vision';
 p.neo2Combo={until:now+Math.min(42,calc(ability.duration)||30),
   stat,strength:bonus,partner:partner.name,context};
 p.stamina=Math.max(0,calc(p.stamina)-2.5);
 s.last[identity]=now;
 const record={minute:Math.floor(now/60),name:p.name,partner:partner.name,
   skill:pskill,partnerSkill:pskill2,context};
 s.combos.push(record);if(s.combos.length>14)s.combos.shift();
 m.log?.('🤝 Técnica combinada: '+p.name+' + '+partner.name+'!', 'skill',p.name);
 return true;
}
function counter(m,p,ability){
 if(!m||!p||!ability||!m.players)return false;
 const opponent=m.players.filter(q=>q.side!==p.side&&q.i!==0)
   .sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
 if(!opponent||Math.hypot(opponent.x-p.x,opponent.y-p.y)>100)return false;
 const s=memory(m),id=[p.name,opponent.name,ability.id].join('|');
 s.reads[id]=Math.min(50,calc(s.reads[id])+1);
 if(s.reads[id]===3){
  s.counters.push({minute:Math.floor(calc(m.time)/60),player:p.name,defender:opponent.name,skill:ability.id});
  if(s.counters.length>16)s.counters.shift();
  m.log?.('🧠 '+opponent.name+' começa a ler a técnica de '+p.name+'.','duel',opponent.name);
 }
 if(s.reads[id]>=3){p.neo2Counter={until:calc(m.time)+30,stat:ability.stat||'dribbling',penalty:.027};return true;}
 return false;
}
function statBonus(m,p,key,base){
 if(!Number.isFinite(base)||!p)return base;
 const now=calc(m.time);
 const combo=p.neo2Combo;
 const active=combo&&now<combo.until&&key===combo.stat;
 const effective=active?1+clamp(combo.strength,0,.055):1;
 const countered=p.neo2Counter&&now<p.neo2Counter.until&&p.neo2Counter.stat===key?
  1-clamp(p.neo2Counter.penalty,0,.035):1;
 if(!active&&countered===1)return base;
 return Math.max(0,base*effective*countered);
}
function report(m){const x=memory(m);return {schema:1,combinations:x.combos.slice(),counters:x.counters.slice()};}
function adapt(engine){
 const p=engine?.Match?.prototype;if(!p||p._neo2Synergy)return false;
 if(typeof p._activateAbility==='function'){
  const original=p._activateAbility;p._activateAbility=function(player,context){
   const used=original.call(this,player,context);
   if(used){combo(this,player,used,context);counter(this,player,used);}
   return used;
  };
 }
 if(typeof p._attributes==='function'){
  const original=p._attributes;p._attributes=function(player,key){
   return statBonus(this,player,key,original.call(this,player,key));
  };
 }
 if(typeof p.result==='function'){
  const original=p.result;p.result=function(){const out=original.call(this);out.neo2Synergies=report(this);return out;};
 }
 Object.defineProperty(p,'_neo2Synergy',{value:true});
 return true;
}
return {memory,combo,counter,statBonus,report,adapt};
});