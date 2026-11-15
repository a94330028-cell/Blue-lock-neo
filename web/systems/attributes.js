/* Individual attributes and positional OVR — fan-game balancing, not official stats. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.NeoAttributes=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const KEYS=['finishing','power','accuracy','dribbling','speed','acceleration','strength','stamina','passing','vision','tactics','defense','tackling','positioning','control','reflexes','ego'];
const LABELS={finishing:'Finalização',power:'Potência',accuracy:'Precisão',dribbling:'Drible',speed:'Velocidade',acceleration:'Aceleração',strength:'Força',stamina:'Resistência',passing:'Passe',vision:'Visão',tactics:'Inteligência',defense:'Defesa',tackling:'Desarme',positioning:'Posicionamento',control:'Controle',reflexes:'Reflexos',ego:'Ego'};
const ROLE_WEIGHTS={
 GK:{reflexes:3.0,positioning:2.0,control:.65,passing:.8,tactics:1.0,strength:.5,stamina:.35},
 DEF:{defense:3.0,tackling:2.7,positioning:2.6,tactics:1.6,strength:1.25,speed:.65,passing:.8,vision:.55},
 FB:{speed:1.4,acceleration:1.2,stamina:1.5,defense:1.9,tackling:1.65,passing:1.4,positioning:1.55,tactics:.65},
 MID:{passing:2.45,vision:2.2,control:1.8,tactics:2.05,stamina:.8,dribbling:.8,positioning:1.45,defense:.7},
 WING:{speed:2,acceleration:1.7,dribbling:1.9,control:1.4,finishing:1.15,passing:1.1,positioning:1.05},
 ST:{finishing:2.65,accuracy:1.9,positioning:2.1,control:1.35,power:1.2,speed:1.0,strength:.75}
};
const PROFILES={
 'Yoichi Isagi':{finishing:89,accuracy:88,vision:97,tactics:97,positioning:98,passing:85,ego:91},
 'Michael Kaiser':{finishing:98,power:98,accuracy:96,positioning:93,speed:88,ego:98},
 'Meguru Bachira':{dribbling:97,control:97,acceleration:90,passing:85,ego:90},
 'Seishiro Nagi':{control:99,finishing:93,accuracy:90,positioning:92,ego:82},
 'Hyoma Chigiri':{speed:99,acceleration:99,stamina:89,dribbling:86,ego:89},
 'Rin Itoshi':{finishing:96,accuracy:97,passing:93,vision:96,control:94,tactics:94,ego:96},
 'Shoei Baro':{finishing:97,power:99,strength:95,dribbling:87,ego:100},
 'Ryusei Shido':{finishing:98,positioning:96,power:95,control:86,ego:97},
 'Reo Mikage':{passing:94,tactics:93,vision:91,control:91,defense:86,ego:85},
 'Charles Chevalier':{passing:98,vision:98,control:94,tactics:88,ego:92},
 'Gin Gagamaru':{reflexes:99,positioning:89,control:82,stamina:90},
 'Oliver Aiku':{defense:97,tackling:96,positioning:95,tactics:95,strength:92},
 'Don Lorenzo':{defense:98,tackling:98,control:91,dribbling:87,tactics:96},
 'Ikki Niko':{defense:91,tactics:97,vision:96,positioning:95},
 'Ranze Kurona':{passing:90,control:89,speed:88,stamina:90},
 'Yo Hiori':{passing:97,vision:97,control:94,accuracy:88},
 'Jingo Raichi':{stamina:98,strength:92,defense:91,tackling:91},
 'Tabito Karasu':{tactics:95,defense:88,vision:90,control:91},
 'Aoshi Tokimitsu':{strength:96,stamina:95,defense:89},
 'Zantetsu Tsurugi':{acceleration:97,speed:94},
 'Noel Noa':{finishing:99,accuracy:99,tactics:98,control:98,power:99},
 'Lavinho':{dribbling:99,control:99,passing:96,acceleration:95},
 'Chris Prince':{strength:99,speed:97,power:99,finishing:96},
 'Marc Snuffy':{tactics:100,vision:99,passing:98,defense:94},
 'Julian Loki':{speed:100,acceleration:100,dribbling:98,finishing:96}
};
// Game design targets (not official anime ratings). Each value is achieved by adjusting
// role-relevant skills *before* progression boosts; the UI no longer shows an OVR
// disconnected from the actual effective abilities in the engine.
// Elenco principal limitado a 90. Só os cinco Master Strikers ultrapassam 90.
// O cálculo da nota continua usando atributos reais da posição.
const TARGET_OVR=Object.freeze({
 'Michael Kaiser':90,'Yoichi Isagi':89,'Rin Itoshi':90,'Ryusei Shido':89,
 'Shoei Baro':89,'Seishiro Nagi':87,'Meguru Bachira':88,'Hyoma Chigiri':87,
 'Reo Mikage':88,'Charles Chevalier':89,'Yo Hiori':88,'Alexis Ness':85,
 'Oliver Aiku':90,'Don Lorenzo':90,'Ikki Niko':87,'Gin Gagamaru':89,
 'Jingo Raichi':85,'Tabito Karasu':87,'Ranze Kurona':84,'Kenyu Yukimiya':85,
 'Rensuke Kunigami':87,'Eita Otoya':84,'Jyubei Aryu':86,
 'Aoshi Tokimitsu':84,'Zantetsu Tsurugi':85,'Reiji Hiiragi':82,
 'Agi':86,'Nijiro Nanase':81,'Shuto Sendo':82,'Hajime Nishioka':81,
 'Noel Noa':99,'Julian Loki':99,'Chris Prince':98,'Marc Snuffy':98,'Lavinho':98
});
function tuneToTarget(stats,role,index,target){
 const weights=ROLE_WEIGHTS[roleClass(role,index)];
 for(let n=0;n<8;n++){
  const diff=target-overall(stats,role,index);if(!diff)break;
  const options=Object.entries(weights).filter(([key])=>diff>0?stats[key]<99:stats[key]>59);
  if(!options.length)break;
  for(const [key,w] of options){
   const shift=diff>0?Math.max(1,Math.round(diff*(w/3))):Math.min(-1,Math.round(diff*(w/3)));
   stats[key]=Math.min(99,Math.max(60,stats[key]+shift));
  }
 }
 // Final integer step is weighted and still adjusts a real attribute, not the OVR label.
 let guard=0;
 while(overall(stats,role,index)!==target&&guard++<90){
  const diff=target-overall(stats,role,index);
  const choice=Object.keys(weights).sort((a,b)=>weights[b]-weights[a]).find(key=>diff>0?stats[key]<99:stats[key]>59);
  if(!choice)break;stats[choice]+=diff>0?1:-1;
 }
}
const MASTER_NAMES=['Noel Noa','Lavinho','Chris Prince','Marc Snuffy','Julian Loki'];
const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return n>>>0;};
const bound=n=>Math.max(0,Math.min(100,Math.round(n)));
function roleClass(role,index=0){if(index===0||['GK','GOL'].includes(role))return 'GK';if(['ZAG','CB'].includes(role))return 'DEF';if(['LD','LE','LB','RB','ALA','LWB','RWB'].includes(role))return 'FB';if(['PD','PE','LW','RW'].includes(role))return 'WING';if(['CA','ST','CF','SA'].includes(role))return 'ST';return 'MID';}
function overall(stats,role,index){const weights=ROLE_WEIGHTS[roleClass(role,index)];let a=0,b=0;for(const [key,w] of Object.entries(weights)){a+=(stats[key]||0)*w;b+=w;}return bound(a/b);}
function generate(name,role,index=1,experience){const h=hash(name),type=roleClass(role,index),base=MASTER_NAMES.includes(name)?93:76;const stats={};KEYS.forEach((k,i)=>{const delta=(((h>>((i%4)*7))^(h*(i+11)))%17+17)%17-8;stats[k]=bound(base+delta+(type==='GK'&&k==='reflexes'?11:0)+(type==='DEF'&&['tackling','defense'].includes(k)?10:0)+(type==='WING'&&['speed','dribbling'].includes(k)?8:0)+(type==='ST'&&k==='finishing'?10:0));});
 Object.assign(stats,PROFILES[name]||{});
 if(TARGET_OVR[name])tuneToTarget(stats,role,index,TARGET_OVR[name]);
 if(experience?.boosts)for(const [key,v] of Object.entries(experience.boosts))if(KEYS.includes(key))stats[key]=bound(stats[key]+v);
 // Carreiras antigas e treinos também respeitam a escala dos dois patamares.
 const isMaster=MASTER_NAMES.includes(name);
 const cap=isMaster?99:90;
 if(overall(stats,role,index)>cap)tuneToTarget(stats,role,index,cap);
 // A identidade Master vem da lista de personagens, jamais apenas da posição.
 if(isMaster&&overall(stats,role,index)<96)tuneToTarget(stats,role,index,96);
 stats.ovr=overall(stats,role,index);return stats;}
function effective(p,key,multiplier=1){let value=p?.attributes?.[key]??70;const fatigue=Math.max(.66,Math.min(1,p?.stamina/100??1));const flow=p?.flowUntil>p?.matchTime?1.10:1;return Math.max(0,value*multiplier*(.83+.17*fatigue)*flow);}
return {KEYS,LABELS,PROFILES,TARGET_OVR,MASTER_NAMES,roleClass,generate,overall,effective,hash,bound};
});