/* NEO 10.5: Original offline badges, not official copyrighted team logos. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root?.document){root.NeoCrests1050=api;api.mount(root);}})(typeof window!=='undefined'?window:null,function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const TEAMS=Object.freeze({
 bm:['BM','♜','#2eaaff','#052d63','#b7ecff'],ba:['BA','✦','#e7ab35','#871d38','#ffe9b7'],
 mc:['MC','⚡','#ff729f','#432565','#ffe0ee'],px:['PXG','◇','#aa85f9','#221361','#ede1ff'],
 ub:['UB','◆','#e9edf1','#1d2631','#dae2ec'],'neo-bestxi':['XI','★','#f5c553','#2b3047','#fff2c2'],
 mu08:['MU','⚽','#f52d37','#66050f','#ffe9a2'],fla19:['CRF','◆','#e73539','#1c111b','#ffecdf'],
 sport15:['SCR','★','#c5222c','#181514','#fff1ad'],mir25:['MFC','✦','#2bc66a','#1c4632','#ecffe9'],
 ht:['HT','★','#1550ff','#071021','#f5f8ff']
});
function design(t){const id=typeof t==='string'?t:t?.id;return TEAMS[id]||[String(t?.crest||'FC').slice(0,3),'★',t?.color||'#42aeec',t?.dark||'#11253c','#e3f6ff'];}
function icon(t,cls='neo1050-crest'){
 const id=typeof t==='string'?t:t?.id;
 if(['bm','ba','mc','px','ub','ht'].includes(id)){
  return '<img class="'+esc(cls)+' neo-team-icon" src="assets/team-logos/'+id+'.webp" alt="Escudo '+esc(id)+'" loading="lazy" decoding="async">';
 }
 const [name,symbol,accent,dark,light]=design(t);
 return '<svg class="'+esc(cls)+'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 82" aria-hidden="true" focusable="false">'+
 '<path d="M36 4 Q54 9 66 15 L64 45 Q59 66 36 78 Q13 66 8 45 L6 15 Q18 9 36 4Z" fill="'+esc(dark)+'" stroke="'+esc(accent)+'" stroke-width="3"/>'+
 '<path d="M36 10 Q52 14 59 19 L57 43 Q53 58 36 70 Q19 58 15 43 L13 19 Q22 14 36 10Z" fill="none" stroke="'+esc(light)+'" stroke-width="1.6" opacity=".88"/>'+
 '<path d="M16 26H56" stroke="'+esc(accent)+'" stroke-width="3"/>'+
 '<text x="36" y="23" font-family="system-ui,sans-serif" text-anchor="middle" fill="'+esc(light)+'" font-size="11" font-weight="900">'+esc(name)+'</text>'+
 '<text x="36" y="54" font-family="system-ui,sans-serif" text-anchor="middle" fill="'+esc(light)+'" font-size="28" font-weight="900">'+esc(symbol)+'</text>'+
 '<path d="M27 61H45" stroke="'+esc(accent)+'" stroke-width="3" stroke-linecap="round"/></svg>';
}
function mount(win){
 const doc=win.document;
 const style=doc.createElement('style');style.id='neo1050-logos-css';
 style.textContent='.neo1050-crest{display:block;width:43px;height:49px;flex:none;filter:drop-shadow(0 2px 3px #001a3488)}.neo1050-crest.neo-team-icon{object-fit:contain;background:transparent}'+
 '.neo1050-selectline{display:flex;align-items:center;gap:9px;min-width:0;width:100%}.neo1050-selectline>select{min-width:0;flex:1 1 auto}'+
 '.neo1050-pict{width:42px;height:47px;display:grid;place-items:center;flex:none;border:1px solid #3b6385;border-radius:10px;background:#0e223b}'+
 '.neo1050-pict .neo1050-crest{width:32px;height:37px}.neo980-team-header .neo980-crest{background:transparent!important;width:49px;height:53px;padding:0}'+
 '.neo980-team-header .neo980-crest .neo1050-crest{width:46px;height:51px}.neo1050-inline{width:28px;height:32px;vertical-align:middle;display:inline-block;margin-right:6px}'+
 '@media(max-width:500px){.neo1050-pict{width:35px;height:41px}.neo1050-pict .neo1050-crest{width:27px;height:32px}}';
 doc.head.append(style);
 const ids=new Set(['home','away','neo980-select','neo970-home','neo970-away','neo1030-select']);
 function enhance(){
  const E=win.NeoEngine;if(!E)return;
  for(const sel of doc.querySelectorAll('select')){
   if(!ids.has(sel.id)||![...sel.options].some(o=>E.teamById(o.value)))continue;
   let parent=sel.parentElement,badge=parent?.querySelector(':scope > .neo1050-pict');
   if(!badge){
    badge=doc.createElement('span');badge.className='neo1050-pict';badge.setAttribute('aria-hidden','true');
    if(parent?.classList.contains('neo1050-selectline'))parent.prepend(badge);
    else {const wrap=doc.createElement('span');wrap.className='neo1050-selectline';sel.before(wrap);wrap.append(badge,sel);}
    sel.addEventListener('change',()=>paint(sel,badge));
   }
   paint(sel,badge);
  }
 }
 function paint(sel,badge){badge.innerHTML=win.NeoEngine?.teamById(sel.value)?icon(sel.value):'';}
 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;win.requestAnimationFrame(()=>{queued=false;enhance();});};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
 new MutationObserver(changes=>{if(changes.some(c=>c.type==='childList'&&[...c.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('select')||n.querySelector?.('select')))))schedule();}).observe(doc.body,{childList:true,subtree:true});
}
return {TEAMS,design,icon,mount};
});
