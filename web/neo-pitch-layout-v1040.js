/* Blue Lock NEO 10.4 — deterministic 11-player tactical field layout.
 * Visual-only: does not modify real squads, match physics, saves or tactics. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.NeoPitch1040=api;})(typeof window!=='undefined'?window:null,function(){
'use strict';
const SLOTS=Object.freeze({
 '4-3-3':[[50,91],[16,75],[39,78],[61,78],[84,75],[50,58],[29,43],[71,43],[15,22],[50,18],[85,22]],
 '3-5-2':[[50,91],[22,76],[50,77],[78,76],[50,58],[32,43],[12,49],[68,43],[88,49],[34,21],[66,21]],
 '3-4-3':[[50,91],[23,76],[50,78],[77,76],[12,52],[36,53],[64,53],[88,52],[16,22],[50,18],[84,22]],
 '4-4-2':[[50,91],[16,76],[39,78],[61,78],[84,76],[14,51],[38,52],[62,52],[86,51],[34,21],[66,21]],
 '4-2-3-1':[[50,91],[16,76],[39,78],[61,78],[84,76],[37,59],[63,59],[15,38],[50,38],[85,38],[50,18]],
 '4-1-4-1':[[50,91],[16,76],[39,78],[61,78],[84,76],[50,62],[14,43],[37,43],[63,43],[86,43],[50,18]],
 '5-3-2':[[50,91],[11,75],[29,77],[50,78],[71,77],[89,75],[30,49],[50,53],[70,49],[34,21],[66,21]],
 '4-5-1':[[50,91],[16,76],[39,78],[61,78],[84,76],[12,52],[32,49],[50,57],[68,49],[88,52],[50,20]]
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function formationKey(value){
 const groups=String(value||'').match(/\d+(?:-\d+){2,4}/);
 return groups?groups[0]:null;
}
function valid(p){return !!p&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y));}
const group=role=>{
 const r=String(role||'').toUpperCase();
 if(['GOL','GK'].includes(r))return 0;
 if(['LD','LE','ZAG','CB','LB','RB','LIB'].includes(r))return 1;
 if(['CA','ST','CF','SA','PD','PE','RW','LW'].includes(r))return 3;
 return 2;
};
function fallback(formation=[]){
 const result=Array.from({length:11},()=>null),buckets=[[],[],[],[]];
 for(let i=0;i<11;i++)buckets[group(formation[i]?.role||(i===0?'GOL':i>=8?'CA':i<5?'ZAG':'MC'))].push(i);
 const plans={0:[50,91],1:[50,77],2:[50,52],3:[50,22]};
 for(let b=0;b<4;b++){
  const indices=buckets[b],n=indices.length;if(!n)continue;
  indices.sort((a,z)=>(Number(formation[a]?.y)||.5)-(Number(formation[z]?.y)||.5));
  for(let j=0;j<n;j++){
   const lane=n===1?50:12+76*j/(n-1);
   const depth=plans[b][1]+(b===2&&n>=5?(j%2===0?5:-7):b===1&&n>=5?(j%2===0?-2:1):0);
   result[indices[j]]=[lane,depth];
  }
 }
 return result;
}
// Browser card width and height are limited by the CSS. Test in proportion units
// so the same layout fits a 320px phone and a tablet.
function adjust(points){
 const result=points.map((p,i)=>({
  lane:clamp(Number(p?.[0]??50),10,90),
  depth:clamp(Number(p?.[1]??50),18,91),slot:i
 }));
 // Existing tactical presets should remain symmetrical. Resolve only true collisions;
 // never move a player to the wrong tactical line.
 for(let iteration=0;iteration<14;iteration++){
  let collisions=0;
  for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++){
   const a=result[i],b=result[j],dx=Math.abs(a.lane-b.lane),dy=Math.abs(a.depth-b.depth);
   if(dx>=18||dy>=14)continue;
   collisions++;
   const sign=a.lane<=b.lane?-1:1;
   const needed=Math.max(0,18-dx);
   const move=needed*.5+.1;
   if(i===0){b.lane=clamp(b.lane-sign*move*2,10,90);continue;}
   a.lane=clamp(a.lane+sign*move,10,90);
   b.lane=clamp(b.lane-sign*move,10,90);
  }
  if(!collisions)break;
 }
 return result.map(p=>({lane:+p.lane.toFixed(1),depth:+p.depth.toFixed(1),slot:p.slot}));
}
function layout(team,formation){
 const shape=formationKey(team?.formationName)||'';
 const source=Array.isArray(formation)&&formation.length===11?formation:team?.formation||[];
 const preset=SLOTS[shape];
 const points=(preset||fallback(source)).map(x=>x.slice());
 return adjust(points);
}
function collisions(points,screenWidth=330,pitchHeight=540,cardWidth=55,cardHeight=68){
 const overlap=[];
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
  const x=Math.abs(points[i].lane-points[j].lane)*screenWidth/100;
  const y=Math.abs(points[i].depth-points[j].depth)*pitchHeight/100;
  if(x<cardWidth&&y<cardHeight)overlap.push([i,j]);
 }
 return overlap;
}
return {SLOTS,formationKey,fallback,adjust,layout,collisions};
});