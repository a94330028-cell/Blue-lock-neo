/* Blue Lock NEO 9.8.1 — cinematic cues and verified cup match recaps.
 * No score or statistic is fabricated; all report data comes from saved fixtures. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document){root.NeoMatchVisual981=api;api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function classifyEvent(text){
  const s=String(text||'').toLocaleLowerCase('pt-BR');
  if(/(?:\bgol!|\bgol de\b|\bgoo+l|\bmarcou!|\bbalança a rede\b|\bbola na rede\b)/i.test(s))return {kind:'goal',label:'⚽ GOL!',duration:3100};
  if(/(?:defende|espalma|grande defesa|defesa incrível|defesa milagrosa|goleiro salva|milagre do goleiro|segura firme)/i.test(s))return {kind:'save',label:'🧤 DEFESA!',duration:2100};
  if(/(?:intercepta|desarma|rouba a bola|bloqueia o chute|corta a jogada|corte providencial)/i.test(s))return {kind:'defense',label:'🛡️ DEFESA!',duration:1700};
  if(/(?:na trave|quase gol|chuta|finaliza|bate pro gol|bomba de fora|na área)/i.test(s))return {kind:'shot',label:'🎯 CHANCE!',duration:1650};
  if(/(?:assistência|passe magistral|passe decisivo|lançamento perfeito|lançamento preciso)/i.test(s))return {kind:'pass',label:'🎯 PASSE DECISIVO!',duration:1550};
  return null;
}
function report(game,round=0){
  if(!game||!Array.isArray(game.result)||!game.details)return null;
  const d=game.details,sc=d.stats||{},players=Array.isArray(d.players)?d.players:[];
  const n=v=>Math.max(0,Number(v)||0),list=k=>Array.isArray(sc[k])?sc[k].slice(0,2).map(n):[0,0];
  const goals=(Array.isArray(d.goalRecords)?d.goalRecords:[]).filter(x=>Number.isFinite(Number(x.minute))&&x.scorer).map(x=>({minute:Math.max(0,Math.min(90,Number(x.minute))),scorer:String(x.scorer),assister:x.assister?String(x.assister):null,side:x.side===1?1:0})).sort((a,b)=>a.minute-b.minute);
  const saves=list('saves'),shots=list('shots');
  const spotlight=players.slice().sort((a,b)=>{
    const weight=p=>n(p.goals)*5+n(p.assists)*3+n(p.saves)*.8+n(p.tackles)*.45+n(p.interceptions)*.55+n(p.shotBlocks)*.4;
    return weight(b)-weight(a)||n(b.rating)-n(a.rating);
  })[0]||null;
  return {home:game.home,away:game.away,score:game.result.slice(0,2).map(n),round,goals,saves,shots,spotlight};
}
function savedRecaps(cups,activeId,limit=5){
  const cup=(cups||[]).find(x=>x.id===activeId)||cups?.[0];if(!cup)return [];
  const rows=[];
  for(const round of cup.rounds||[])for(const game of round.games||[]){const data=report(game,round.round);if(data)rows.push(data);}
  return rows.slice(-Math.max(1,limit)).reverse();
}
function mount(win){
  const doc=win.document,$=id=>doc.getElementById(id);if(!doc)return;
  let lastCue='',timeout=0;
  function showCue(){
    const ticker=$('commentaryTicker'),field=$('stadium');if(!ticker||!field)return;
    const text=ticker.textContent?.trim()||'';if(!text||text===lastCue)return;lastCue=text;
    const category=classifyEvent(text);if(!category)return;
    let cue=$('neo981-cue');if(!cue){cue=doc.createElement('div');cue.id='neo981-cue';cue.className='neo981-cue';cue.setAttribute('aria-hidden','true');field.appendChild(cue);}
    win.clearTimeout(timeout);cue.className='neo981-cue neo981-'+category.kind;
    cue.innerHTML='<strong>'+esc(category.label)+'</strong><span>'+esc(text.slice(0,100))+'</span>';
    cue.classList.add('neo981-visible');field.classList.remove('neo981-impact-goal','neo981-impact-save');
    if(category.kind==='goal'||category.kind==='save')field.classList.add('neo981-impact-'+category.kind);
    timeout=win.setTimeout(()=>{cue.classList.remove('neo981-visible');field.classList.remove('neo981-impact-goal','neo981-impact-save');},category.duration);
  }
  function cupRows(){
    const node=$('neo970-active-cups');if(!node||node.querySelector('.neo981-recap-container'))return;
    const C=win.NeoCups970,E=win.NeoEngine;if(!C||!E)return;
    const cups=C.safeLoad(win.localStorage),id=win.localStorage.getItem('neo970-active-cup');
    const rows=savedRecaps(cups,id,7);if(!rows.length)return;
    const section=doc.createElement('details');section.className='neo981-recap-container';
    section.innerHTML='<summary>🎬 Rever destaques das partidas ('+rows.length+')</summary><div class="neo981-recap-grid">'+rows.map((r,i)=>{
      const h=E.teamById(r.home)?.short||r.home,a=E.teamById(r.away)?.short||r.away;
      return '<button type="button" class="neo981-recap-row" data-recap="'+i+'"><span><b>'+esc(h)+' '+r.score.join(' × ')+' '+esc(a)+'</b><small>Rodada '+r.round+'</small></span><strong>▶ Ver lances</strong></button>';
    }).join('')+'</div>';
    node.appendChild(section);
    section.addEventListener('click',e=>{const btn=e.target.closest('[data-recap]');if(!btn)return;openRecap(rows[Number(btn.dataset.recap)],E);});
  }
  function openRecap(r,E){if(!r)return;
    let modal=$('neo981-recap-dialog');if(!modal){modal=doc.createElement('div');modal.id='neo981-recap-dialog';modal.className='neo981-dialog';doc.body.appendChild(modal);}
    const h=E.teamById(r.home)?.name||r.home,a=E.teamById(r.away)?.name||r.away;
    const goals=r.goals.length?r.goals.map(g=>'<div class="neo981-goal-row"><span class="neo981-time">'+Math.round(g.minute)+"'"+'</span><div><b>⚽ '+esc(g.scorer)+'</b><small>'+esc(g.side? a:h)+(g.assister?' · Passe: '+esc(g.assister):'')+'</small></div></div>').join(''):'<p class="neo981-empty">Nenhum gol nesta partida.</p>';
    const person=r.spotlight?'<div class="neo981-star">⭐ Destaque nas ações: <b>'+esc(r.spotlight.name)+'</b></div>':'';
    modal.innerHTML='<div class="neo981-shade" data-close></div><section class="neo981-sheet" role="dialog" aria-modal="true" aria-label="Destaques da partida"><button type="button" class="neo981-close" data-close aria-label="Fechar">✕</button><small>🎬 TRANSMISSÃO · RODADA '+r.round+'</small><h2>'+esc(h)+' <em>'+r.score.join(' × ')+'</em> '+esc(a)+'</h2><div class="neo981-match-stats"><span>🎯 Finalizações <b>'+r.shots.join(' × ')+'</b></span><span>🧤 Defesas <b>'+r.saves.join(' × ')+'</b></span></div><h3>⚽ Gols e lances decisivos</h3><div class="neo981-goals">'+goals+'</div>'+person+'<p class="neo981-foot">Exibindo apenas os fatos registrados pelo simulador. Esta visualização não altera o resultado.</p></section>';
    modal.classList.add('open');modal.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>modal.classList.remove('open')));
    modal.querySelector('.neo981-close')?.focus();
  }
  function boot(){
    const ticker=$('commentaryTicker');if(ticker&&win.MutationObserver)new win.MutationObserver(showCue).observe(ticker,{childList:true,characterData:true,subtree:true});
    let target=$('neo970-active-cups');if(target&&win.MutationObserver)new win.MutationObserver(cupRows).observe(target,{childList:true,subtree:true});
    cupRows();doc.addEventListener('keydown',e=>{if(e.key==='Escape')$('neo981-recap-dialog')?.classList.remove('open');});
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {classifyEvent,report,savedRecaps,mount};
});