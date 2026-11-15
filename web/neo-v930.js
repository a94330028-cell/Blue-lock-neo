/* Blue Lock NEO v9.3 – positional parity, clean navigation and real defending data. */
(() => {
  'use strict';
  if(window.NeoPosition930) return;
  const $=id=>document.getElementById(id);
  const E=window.NeoEngine;
  const VERSION='9.3.0';
  const safe=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=(v)=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
  const millions=(n)=>n?`¥ ${(n/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})} mi`:'¥ 0';
  const ROLE_FILTERS={all:{label:'Todas as posições',accept:()=>true},back:{label:'Zagueiros',accept:r=>['ZAG','CB'].includes(r)},side:{label:'Laterais e alas',accept:r=>['LD','LE','RB','LB','ALA','LWB','RWB'].includes(r)},mid:{label:'Volantes e meias',accept:r=>['VOL','CDM','MC','CM','MEI','CAM'].includes(r)},keeper:{label:'Goleiros',accept:r=>['GOL','GK'].includes(r)}};
  let filter='all', lastLive=0, currentMatch=null;
  function season(){try{const s=JSON.parse(localStorage.getItem('neo-season-v2')||'null');return s&&s.schema===2?s:null;}catch(_){return null}}
  function players(){const s=season();return Object.values(s?.career?.players||{}).filter(p=>num(p.games)>0)}
  function value(p){return E?.Progression?.estimateValue(p,p.ovr,p.role)||0}
  function impact(p){return num(p.tackles)*2.3+num(p.interceptions)*2.2+num(p.shotBlocks)*3.5+num(p.aerialWins)*1.3+num(p.duelsWon)*.6+num(p.saves)*1.7+num(p.keyPasses)*1.2}
  function stats(p){return [
    ['DES',num(p.tackles)],['INT',num(p.interceptions)],['BLQ',num(p.shotBlocks)],['AÉR',num(p.aerialWins)],['DUE',num(p.duelsWon)],['PAS+',num(p.keyPasses)]
  ];}
  function installStyle(){if($('neo930-style'))return;const link=document.createElement('link');link.id='neo930-style';link.rel='stylesheet';link.href='./neo-v930.css?v=9.3.0';document.head.appendChild(link)}
  function fold(parent,children,title,open=false){
    if(!parent||!children.length)return;
    const details=document.createElement('details');details.className='neo930-fold';details.open=open;
    const summary=document.createElement('summary');summary.textContent=title;
    const wrap=document.createElement('div');wrap.className='neo930-fold-body';
    details.append(summary,wrap);
    parent.insertBefore(details,children[0]);children.forEach(el=>wrap.appendChild(el));
    return details;
  }
  function declutter(){
    const broadcast=$('neo920-broadcast');
    if(broadcast&&!broadcast.classList.contains('neo930-compact')){
      broadcast.classList.add('neo930-compact');
      const heading=broadcast.querySelector('h3');if(heading)heading.textContent='🎥 Duração da partida';
      const note=broadcast.querySelector('p.neo920-muted');if(note)note.textContent='Escolha a duração antes de jogar. As análises detalhadas ficam recolhidas para deixar a quadra em destaque.';
      const first=broadcast.querySelector('.neo920-pressure-label');if(first){
        const children=[];for(let el=first;el;el=el.nextElementSibling)children.push(el);
        const d=fold(broadcast,children,'📊 Mostrar análises, pressão e lances',false);
        if(d)d.id='neo930-watch-details';
      }
      const spotlight=document.createElement('div');spotlight.id='neo930-live-defender';spotlight.className='neo930-live-defender';spotlight.textContent='🛡️ Destaque defensivo: aguardando a partida.';
      const dur=broadcast.querySelector('.neo920-durations');if(dur)dur.insertAdjacentElement('afterend',spotlight);
    }
    const ranking=$('ranking');if(ranking&&!ranking.dataset.neo930Fold){
      const extra=[...ranking.children].filter(el=>['masterProfiles','careerConnections','careerStories'].some(id=>el.querySelector?.('#'+id)));
      if(extra.length)fold(ranking,extra,'📂 Ver mestres, rivalidades e histórias da temporada');
      ranking.dataset.neo930Fold='1';
    }
    const records=$('records');if(records&&!records.dataset.neo930Fold){
      const detailed=[...records.children].filter(el=>el.classList?.contains('current-game-records')||['recordsScorers','recordsAssists'].some(id=>el.querySelector?.('#'+id))===false&&/Momentos memoráveis|Histórico de gols|Participações em gols/i.test(el.textContent?.slice(0,90)||''));
      if(detailed.length)fold(records,detailed,'📂 Histórico, participações e momentos');
      records.dataset.neo930Fold='1';
    }
    const more=$('more');if(more&&!more.dataset.neo930Fold){
      const extra=[...more.children].filter(el=>el.classList?.contains('neo920-more')&&!/Atualizar o aplicativo/.test(el.textContent||''));
      if(extra.length)fold(more,extra,'🎥 Transmissões e histórico anteriores');
      more.dataset.neo930Fold='1';
    }
  }
  function injectRanking(){
    const page=$('ranking');if(!page||$('neo930-defense-rank'))return;
    const card=document.createElement('section');card.id='neo930-defense-rank';card.className='card neo930-defense-rank';
    card.innerHTML=`<header class="neo930-head"><div><span class="neo930-eyebrow">RANKING POSICIONAL</span><h3>🛡️ Defesas, desarmes e valorização</h3><p>Preços e destaques baseados apenas em partidas registradas, não em fama.</p></div><label>Posição<select id="neo930-role-filter"><option value="all">Todas</option><option value="back">Zagueiros</option><option value="side">Laterais / alas</option><option value="mid">Volantes / meias</option><option value="keeper">Goleiros</option></select></label></header><div id="neo930-defenders" class="neo930-defenders" aria-live="polite"></div><p class="neo930-footnote">DES: desarmes · INT: interceptações · BLQ: bloqueios · AÉR: duelos aéreos · DUE: duelos vencidos · PAS+: passes para finalizações. Estatísticas antigas indisponíveis permanecem em zero.</p>`;
    const hero=page.querySelector('.hero-card');(hero||page.firstElementChild)?.insertAdjacentElement('afterend',card);
    $('neo930-role-filter')?.addEventListener('change',e=>{filter=e.target.value;renderRanking()});
    renderRanking();
  }
  function renderRanking(){
    const el=$('neo930-defenders');if(!el)return;
    const rows=players().filter(p=>ROLE_FILTERS[filter]?.accept(p.role)||false).sort((a,b)=>impact(b)-impact(a)||value(b)-value(a)).slice(0,10);
    if(!rows.length){el.innerHTML='<p class="neo930-empty">Ainda não há partidas suficientes nessa posição. Jogue ou simule uma rodada para registrar as ações individuais.</p>';return;}
    el.innerHTML=rows.map((p,i)=>{
      const team=E?.teamById(p.club);
      const ovr=E?.Attr.generate(p.name,p.role||'MC',p.role==='GOL'?0:1,p).ovr||p.ovr||'—';
      return `<article class="neo930-defender"><div class="neo930-defender-head"><b class="neo930-place">${i+1}º</b><div><strong>${safe(p.name)}</strong><small>${safe(team?.short||p.club||'')} · ${safe(p.role||'')} · OVR ${ovr}</small></div><b class="neo930-bid">${millions(value(p))}</b></div><div class="neo930-tags">${stats(p).map(([key,n])=>`<span><b>${n}</b> ${key}</span>`).join('')}</div></article>`;
    }).join('');
  }
  function playerDetails(){
    const panel=$('playerDetails');if(!panel)return;
    let current='';
    const refresh=()=>{
      const header=panel.querySelector('.player-name');const name=header?.textContent?.trim()||'';
      if(!name||(name===current&&panel.querySelector('.neo930-personal')))return;current=name;
      const entry=players().find(p=>p.name===name);
      const older=panel.querySelector('.neo930-personal');if(older)older.remove();
      const src=panel.querySelector('.player-stats');if(!src)return;
      const div=document.createElement('div');div.className='neo930-personal';
      div.innerHTML=`<strong>🛡️ Defesa e participação na liga</strong>${entry?`<div class="neo930-tags">${stats(entry).map(([k,n])=>`<span>${k} <b>${n}</b></span>`).join('')}</div><p>Valor registrado: <b>${millions(value(entry))}</b> · ${num(entry.games)} jogos</p>`:'<p>Sem partidas registradas para este atleta ainda.</p>'}`;
      src.insertAdjacentElement('afterend',div);
    };
    new MutationObserver(refresh).observe(panel,{childList:true,subtree:true});refresh();
  }
  function liveUpdate(m){
    if(!$('neo930-live-defender')||!m)return;
    const pool=[...(m.players||[])].filter(p=>p&&p.i!==0);
    const strongest=pool.sort((a,b)=>impact(b)-impact(a))[0];
    if(!strongest||impact(strongest)<=0){$('neo930-live-defender').textContent='🛡️ Destaque defensivo: aguardando duelos e interceptações.';return;}
    const label=strongest.name+' · '+m.teams[strongest.side]?.short;
    $('neo930-live-defender').textContent=`🛡️ ${label}: ${num(strongest.tackles)} desarmes · ${num(strongest.interceptions)} interceptações · ${num(strongest.shotBlocks)} bloqueios`;
  }
  function patchLive(){
    const Match=E?.Match;if(!Match||Match.prototype.__neo930Wrapped)return;
    const original=Match.prototype.step;
    Match.prototype.step=function(dt){
      const r=original.call(this,dt);
      if($('match')&&!$('match').classList.contains('hidden')&&(this!==currentMatch||performance.now()-lastLive>1400||this.finished)){
        currentMatch=this;lastLive=performance.now();liveUpdate(this);
      }
      return r;
    };
    Match.prototype.__neo930Wrapped=true;
  }
  function boot(){
    if(!E)return;
    installStyle();declutter();injectRanking();playerDetails();patchLive();
    document.addEventListener('click',event=>{
      const tab=event.target.closest('[data-tab],[data-neo-tab],[data-neo-open]');
      if(tab&&(tab.dataset.tab==='ranking'||tab.dataset.neoTab==='ranking'||tab.dataset.neoOpen==='ranking'))setTimeout(renderRanking,120);
      if(event.target.closest('#simulateRound,#simulateSeason,#newSeason'))setTimeout(renderRanking,700);
    });
    $('rankMode')?.addEventListener('change',renderRanking);
    window.addEventListener('storage',e=>{if(e.key==='neo-season-v2')renderRanking()});
    window.NeoPosition930={version:VERSION,renderRanking,impact};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();