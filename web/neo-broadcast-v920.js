/* Blue Lock NEO 9.2 — update center + extended live simulation.
   Extends the existing simulator, never generates imaginary goals or match results. */
(() => {
  'use strict';
  if (window.NeoBroadcast92) return;
  const VERSION='1.8.0', HOST='https://a94330028-cell.github.io/Blue-lock-neo/';
  const MODES=Object.freeze({classic:{label:'Clássica',rate:18,physics:1,mins:5},long:{label:'Estendida',rate:12,physics:.75,mins:10},cinema:{label:'Cinematográfica',rate:10,physics:.60,mins:15},epic:{label:'Épica',rate:9,physics:.50,mins:20}});
  const $=id=>document.getElementById(id);
  const APP_KEY='neo-broadcast-mode-v92', HISTORY_KEY='neo-broadcast-history-v92';
  const toNum=x=>Number.isFinite(Number(x))?Number(x):0;
  const fmt=x=>Number(x||0).toFixed(2).replace('.',',');
  const pct=x=>Math.max(0,Math.min(100,Math.round(x)));
  let mode='cinema', current=null, snapshots=[], lastSnapshotAt=-1000, lastRendered=0, statusVersion='';
  const finished=new WeakSet();
  try {const chosen=localStorage.getItem(APP_KEY);if(MODES[chosen])mode=chosen;}catch(_){}
  const styles=`
  .neo920-up-btn{position:fixed;z-index:170;top:78px;right:12px;padding:8px 12px;border:1px solid #50baff;border-radius:999px;background:linear-gradient(110deg,#0e2746,#125884);box-shadow:0 8px 22px #061421c8;color:#fff;font:800 12px system-ui;cursor:pointer}
  .neo920-up-btn[data-new="1"]{border-color:#ffcb57;box-shadow:0 0 0 2px #ffcb5736,0 10px 24px #0008}
  .neo920-up-btn:active{transform:scale(.98)}
  .neo920-pane{position:fixed;z-index:260;top:116px;right:12px;width:min(390px,calc(100vw - 24px));max-height:min(75vh,700px);overflow-y:auto;padding:17px;border:1px solid #4b8cc1;border-radius:17px;background:#0b1c30;color:#f1f9ff;box-shadow:0 20px 90px #000b}
  .neo920-pane[hidden]{display:none!important}
  .neo920-uphead{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
  .neo920-uphead strong{font-size:18px}
  .neo920-pane button,.neo920-long-panel button{cursor:pointer}
  .neo920-primary{background:linear-gradient(100deg,#036aa1,#1994d5);border:1px solid #62c7ff;color:white;padding:10px 13px;border-radius:10px;font-weight:800}
  .neo920-link{background:transparent;border:1px solid #436b8d;border-radius:9px;padding:9px 11px;color:#ccecff;font-weight:700}
  .neo920-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}
  .neo920-muted{color:#a6c8dd;font-size:12px;line-height:1.5;margin:9px 0}
  .neo920-long-panel{margin:12px auto 16px;border:1px solid #35769f;border-radius:16px;background:linear-gradient(128deg,#112c49,#0a1929);padding:15px;color:#e8f7ff}
  .neo920-long-panel h3{margin:0 0 5px;font-size:18px}
  .neo920-durations{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:12px 0}
  .neo920-durations button{padding:10px 3px;border-radius:10px;border:1px solid #3e6889;background:#142c46;color:#d3ebff;font-size:12px;font-weight:750}
  .neo920-durations button[aria-pressed="true"]{background:linear-gradient(120deg,#086cad,#129fe2);border-color:#75d6ff;color:#fff}
  .neo920-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:13px 0}
  .neo920-stat{border:1px solid #305672;background:#11243a;border-radius:11px;padding:9px 8px;text-align:center}
  .neo920-stat strong{display:block;font:900 17px system-ui;color:#f4f9ff;white-space:nowrap}
  .neo920-stat small{display:block;color:#a9c7dc;font-size:10px;margin-top:3px}
  .neo920-pressure{display:flex;width:100%;height:8px;background:#e55c77;border-radius:50px;overflow:hidden;margin:8px 0}
  .neo920-pressure i{display:block;background:#1cbdf2;transition:width .5s ease}
  .neo920-pressure-label{display:flex;justify-content:space-between;font-size:11px;color:#bdd5e5}
  .neo920-timeline{display:flex;align-items:center;gap:3px;min-height:27px;overflow-x:auto;padding:7px 0}
  .neo920-timeline span{flex:1 0 4px;height:15px;background:#2c628b;border-radius:3px;min-width:4px;opacity:.4}
  .neo920-timeline span[data-active="1"]{background:#19baf0;opacity:.9}
  .neo920-timeline span[data-goal="1"]{background:#f9ce6a;opacity:1;height:23px}
  .neo920-live-events{list-style:none;margin:9px 0 0;padding:0;max-height:220px;overflow-y:auto}
  .neo920-live-events li{padding:8px 0;border-bottom:1px solid #284057;color:#cfe7f6;font-size:12px;line-height:1.35}
  .neo920-stamp{color:#7cc7f6;font-weight:850;margin-right:7px}
  .neo920-extra{margin-top:10px;font-size:12px;line-height:1.4;color:#c7deec}
  .neo920-more{margin:14px 0;padding:16px;border:1px solid #3e7097;border-radius:15px;background:#102338;color:#e9f8ff}
  .neo920-more h3{margin:0 0 6px}
  .neo920-more button{font-weight:750;margin-top:7px;padding:10px 12px;border:1px solid #73c7fa;border-radius:10px;color:white;background:#1475ad}
  @media(max-width:700px){.neo920-up-btn{top:60px;right:7px;font-size:11px;padding:7px 9px}.neo920-pane{top:95px}.neo920-stats{gap:5px}.neo920-stat strong{font-size:14px}.neo920-long-panel{padding:11px}.neo920-durations{gap:4px}.neo920-durations button{font-size:10px}}
  @media(prefers-reduced-motion:reduce){.neo920-pressure i{transition:none}}
  `;
  function installCSS(){const s=document.createElement('style');s.id='neo920-styles';s.textContent=styles;document.head.appendChild(s)}
  function installedVersion(){return VERSION;}
  function parts(v){return String(v||'0.0.0').split('.').slice(0,3).map(x=>parseInt(x,10)||0)}
  function compare(a,b){const x=parts(a),y=parts(b);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0}
  const native=()=>!!window.BlueLockAndroid?.checkForUpdates;
  function setUpdateStatus(message, newVersion=''){
    const text=$('neo920-up-status');if(text)text.textContent=message;
    const floating=$('neo920-up-btn');if(floating){floating.dataset.new=newVersion?'1':'0';floating.textContent=newVersion?'⬆️ Nova v'+newVersion:'⬆️ Atualizar';}
    statusVersion=newVersion;
  }
  async function verifyWebVersion(){
    if(native()){
      setUpdateStatus('Versão instalada: v'+installedVersion()+'. Toque em Verificar pelo Android para consultar o servidor oficial.');
      return;
    }
    try{
      setUpdateStatus('Consultando novas versões…');
      const controller=new AbortController(),stop=setTimeout(()=>controller.abort(),7000);
      let response;try{response=await fetch('./updates/latest.json?ver='+Date.now(),{cache:'no-store',signal:controller.signal})}finally{clearTimeout(stop)}
      if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json();
      // The APK update stream is monotonic (10.x), while public release notes use 1.x.
      const published=data.displayVersion||data.version;
      if(!/^\d+\.\d+\.\d+$/.test(published||''))throw new Error('Versão inválida');
      setUpdateStatus(compare(published,VERSION)>0?'Versão '+published+' publicada. Atualize a página para carregar os novos arquivos.':'Você está usando a versão mais recente: v'+VERSION,compare(published,VERSION)>0?published:'');
    }catch(_){setUpdateStatus('Sem conexão com o servidor de atualizações. O jogo offline continua disponível.');}
  }
  function requestUpdate(){
    if(native()){
      setUpdateStatus('Consultando a atualização pelo Android…');
      try{window.BlueLockAndroid.checkForUpdates()}catch(_){setUpdateStatus('Não foi possível consultar o Android.');}
    }else{verifyWebVersion().then(()=>{if(statusVersion)location.reload()});}
  }
  function updateUI(){
    const trigger=document.createElement('button');trigger.type='button';trigger.id='neo920-up-btn';trigger.className='neo920-up-btn';trigger.textContent='⬆️ Atualizar';trigger.setAttribute('aria-expanded','false');
    const pane=document.createElement('aside');pane.className='neo920-pane';pane.id='neo920-update-pane';pane.hidden=true;
    pane.innerHTML=`<div class="neo110-bot-header"><img src="./assets/updates/neo-update-banner.png" loading="lazy" alt="NEO UPDATE BOT — arte oficial de atualizações"></div><div class="neo920-uphead"><div><strong>⚡ NEO UPDATE CENTER</strong><p class="neo920-muted">BLUE LOCK NEO · versão instalada <b id="neo920-installed-version"></b></p></div><button id="neo920-close" class="neo920-link" type="button" aria-label="Fechar">✕</button></div><p id="neo920-up-status" class="neo920-muted" role="status">Pronto para verificar.</p><div class="neo920-actions"><button id="neo920-check" type="button" class="neo920-primary">🔄 Verificar / atualizar</button><button id="neo920-check-web" type="button" class="neo920-link">↻ Conferir versão</button></div><p class="neo920-muted">Atualizações de conteúdo preservam os dados locais. Faça backups periodicamente. Para mudanças no aplicativo Android, pode ser necessário instalar um APK com a mesma assinatura.</p>`;
    document.body.append(trigger,pane);
    const open=()=>{pane.hidden=false;trigger.setAttribute('aria-expanded','true');$('neo920-installed-version').textContent='v'+installedVersion();verifyWebVersion();};
    const close=()=>{pane.hidden=true;trigger.setAttribute('aria-expanded','false')};
    trigger.addEventListener('click',()=>pane.hidden?open():close());
    $('neo920-close').addEventListener('click',close);
    $('neo920-check').addEventListener('click',requestUpdate);
    $('neo920-check-web').addEventListener('click',verifyWebVersion);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    const more=$('more');if(more){const section=document.createElement('section');section.className='neo920-more';section.innerHTML=`<h3>🔄 Atualizar o aplicativo</h3><p class="neo920-muted">Veja a versão instalada e procure atualizações sem sair do jogo.</p><button id="neo920-more-check" type="button">⬆️ Abrir central de atualizações</button>`;more.prepend(section);$('neo920-more-check').addEventListener('click',open);}
    setUpdateStatus('Versão v'+installedVersion()+' instalada · toque para verificar.');
  }
  function modeUI(){
    const host=$('match');if(!host)return;
    const panel=document.createElement('section');panel.id='neo920-broadcast';panel.className='neo920-long-panel';
    panel.innerHTML=`<h3>🎥 EGO BROADCAST — Partida ampliada</h3><p class="neo920-muted">Mais tempo de jogo, mais construção de jogadas, disputas e oportunidades reais. A duração é aproximada em 1×; aumentar a velocidade acelera a transmissão.</p><div class="neo920-durations" role="group" aria-label="Duração da transmissão">${Object.entries(MODES).map(([id,o])=>`<button type="button" data-neo920-mode="${id}" aria-pressed="false">${o.mins} min<br><small>${o.label}</small></button>`).join('')}</div><div class="neo920-pressure-label"><b id="neo920-team-a">Mandante</b><span id="neo920-press-text">Pressão ofensiva real</span><b id="neo920-team-b">Visitante</b></div><div class="neo920-pressure"><i id="neo920-press-a" style="width:50%"></i></div><div class="neo920-stats" id="neo920-stats"><div class="neo920-stat"><strong>—</strong><small>Finalizações</small></div></div><div class="neo920-pressure-label"><strong>📍 Linha do tempo real</strong><span id="neo920-watch-clock">00:00 / 90'</span></div><div class="neo920-timeline" id="neo920-timeline"></div><p class="neo920-extra" id="neo920-mvp">⭐ MVP parcial: aguarde a partida.</p><p class="neo920-extra" id="neo920-ability">⚡ Técnicas e duelos serão mostrados quando ocorrerem.</p><ul class="neo920-live-events" id="neo920-live-events" aria-label="Lances recentes"></ul>`;
    const layout=host.querySelector('.match-layout');if(layout)layout.before(panel);else host.prepend(panel);
    for(const b of panel.querySelectorAll('[data-neo920-mode]')) b.addEventListener('click',()=>chooseMode(b.dataset.neo920Mode));
    const more=$('more');if(more){const section=document.createElement('section');section.className='neo920-more';section.innerHTML=`<h3>🎥 Partidas maiores</h3><p class="neo920-muted">Selecione 5, 10, 15 ou 20 minutos no painel Jogar. O modo Cinematográfico de 15 minutos vem ativado por padrão. A simulação automática da temporada continua rápida.</p><button type="button" id="neo920-go-match">▶ Configurar transmissão longa</button>`;more.append(section);$('neo920-go-match').addEventListener('click',()=>{window.NeoMobile?.openTab('match');$('neo920-broadcast')?.scrollIntoView({behavior:'smooth',block:'start'})});}
    chooseMode(mode,false);
  }
  function chooseMode(next,save=true){
    if(!MODES[next])return;mode=next;
    for(const button of document.querySelectorAll('[data-neo920-mode]'))button.setAttribute('aria-pressed',String(button.dataset.neo920Mode===mode));
    if(save)try{localStorage.setItem(APP_KEY,mode)}catch(_){}
    if(mode!=='classic'){
      const speed=$('speed');if(speed)speed.value='1';
      const auto=$('broadcastRhythm');if(auto)auto.checked=false;
    }
    const clock=$('neo920-watch-clock');if(clock)clock.textContent=`≈${MODES[mode].mins} min em 1× · 0/90'`;
    const info=$('neo920-press-text');if(info)info.textContent='Modo '+MODES[mode].label;
  }
  function isLive(){
    const tab=$('match');return tab&&!tab.classList.contains('hidden')&&/Pausar/i.test($('play')?.textContent||'');
  }
  function collectSnapshot(m){
    const shot=m.shotMap||[];
    const latest=m.events?.[0]||null;
    snapshots.push({time:Math.floor(m.time/60),score:[...m.score],shots:[...(m.stats.shots||[0,0])],goals:m.goalRecords?.length||0,events:m.events?.length||0,shotCount:shot.length,eventId:latest?.id||0});
    if(snapshots.length>160)snapshots.shift();lastSnapshotAt=m.time;
  }
  function storeFinished(m){
    if(finished.has(m))return;finished.add(m);
    try{
      const old=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
      const entry={date:new Date().toISOString(),home:m.teams[0].name,away:m.teams[1].name,score:[...m.score],mode,shots:[...(m.stats.shots||[])],xg:[...(m.stats.xg||[])],duels:m.duelHistory?.length||0};
      const data=Array.isArray(old)?old:[];data.unshift(entry);localStorage.setItem(HISTORY_KEY,JSON.stringify(data.slice(0,35)));
      renderHistory();
    }catch(_){}
  }
  function recentShotPressure(m){
    const minute=m.time/60;let a=0,b=0;
    for(const s of m.shotMap||[]){if(minute-toNum(s.minute)>15||toNum(s.minute)>minute)continue;
      const add=1+toNum(s.xg)*3+(s.goal?4:0)+(s.onTarget?1:0);
      if(s.side===0)a+=add;else if(s.side===1)b+=add;
    }
    const owner=m.ball?.owner?.side;if(owner===0)a+=.75;else if(owner===1)b+=.75;
    return pct((a+1)/(a+b+2)*100);
  }
  function renderMatch(m){
    if(!$('neo920-stats'))return;
    $('neo920-team-a').textContent=m.teams[0].short;
    $('neo920-team-b').textContent=m.teams[1].short;
    const st=m.stats||{};
    const val=(key)=>Array.isArray(st[key])?st[key].map(v=>Math.round(toNum(v))).join(' × '):'0 × 0';
    const output=[['Finalizações',val('shots')],['No alvo',val('onTarget')],['Defesas',val('saves')],['Desarmes',val('tackles')],['xG',Array.isArray(st.xg)?st.xg.map(fmt).join(' × '):'0 × 0'],['Duelos',String(m.duelHistory?.length||0)],['Habilidades',val('abilityActivations')],['Escanteios',val('corners')],['Gols',m.score.join(' × ')]];
    $('neo920-stats').innerHTML=output.map(([label,value])=>`<div class="neo920-stat"><strong>${value}</strong><small>${label}</small></div>`).join('');
    const pressure=recentShotPressure(m);$('neo920-press-a').style.width=pressure+'%';$('neo920-press-text').textContent=`Pressão ${pressure}% × ${100-pressure}%`;
    $('neo920-watch-clock').textContent=`${Math.min(90,Math.floor(m.time/60))}' / 90' · ≈${MODES[mode].mins} min em 1×`;
    const goals=(m.goalRecords||[]).map(g=>Number(g.minute));
    const timeline=$('neo920-timeline');if(timeline){let html='';for(let i=0;i<18;i++){
      const begin=i*5+1,end=(i+1)*5;
      const hasGoal=goals.some(t=>t>=begin&&t<=end);
      html+=`<span title="${begin}'–${end}'" data-goal="${hasGoal?'1':'0'}" data-active="${m.time/60>=begin?'1':'0'}"></span>`;
    }timeline.innerHTML=html;}
    const people=[...(m.players||[])].filter(p=>p&&p.i!==0&&p.rating>0).sort((a,b)=>b.rating-a.rating);
    const best=people[0];$('neo920-mvp').textContent=best?`⭐ MVP parcial: ${best.name} (${m.teams[best.side].short}) · nota ${toNum(best.rating).toFixed(1)} · ${best.goals} gol(s), ${best.assists} assistência(s)`:'⭐ MVP parcial: aguardando destaques';
    const duel=m.duelHistory?.at(-1),effect=m.abilityHistory?.at(-1),bits=[];
    if(duel)bits.push(`⚔️ ${duel.winner} levou a melhor sobre ${duel.winner===duel.attacker?duel.defender:duel.attacker}`);
    if(effect)bits.push(`⚡ ${effect.player||effect.name||'Habilidade'}${effect.label?' · '+effect.label:''}`);
    $('neo920-ability').textContent=bits.join(' · ')||'⚡ As habilidades e os duelos serão contabilizados durante a partida.';
    const ul=$('neo920-live-events');ul.replaceChildren();for(const ev of (m.events||[]).slice(0,7)){
      const li=document.createElement('li'),minute=document.createElement('b');minute.className='neo920-stamp';minute.textContent=Math.min(90,toNum(ev.minute))+"'";
      li.append(minute,document.createTextNode(String(ev.text||'')));ul.append(li);
    }
    if(m.finished)storeFinished(m);
  }
  function patchMatchEngine(){
    const Match=window.NeoEngine?.Match;if(!Match||Match.prototype.__neo920Wrapped)return;
    const original=Match.prototype.step;
    Match.prototype.step=function(dt){
      const live=isLive();
      // The selected rate changes only the watched match. Background season fixtures
      // keep the original 18x clock and use the unchanged runToEnd implementation.
      if(live){
        if(current!==this){current=this;snapshots=[];lastSnapshotAt=-1000;}
        this.gameRate=MODES[mode].rate;
      }
      const result=original.call(this,live?dt*MODES[mode].physics:dt);
      if(live){
        if(this.time-lastSnapshotAt>=45||!snapshots.length)collectSnapshot(this);
        const now=performance.now();if(now-lastRendered>=360||this.finished){renderMatch(this);lastRendered=now;}
      }
      return result;
    };
    Match.prototype.__neo920Wrapped=true;
  }
  function renderHistory(){
    const holder=$('neo920-history');if(!holder)return;
    let records=[];try{records=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch(_){}
    holder.replaceChildren();if(!Array.isArray(records)||!records.length){holder.textContent='Nenhuma partida longa concluída ainda.';return;}
    for(const game of records.slice(0,6)){
      const p=document.createElement('p');p.className='neo920-extra';p.textContent=`${game.home} ${game.score[0]} × ${game.score[1]} ${game.away} · ${MODES[game.mode]?.label||'Partida'} · ${game.shots?.join(' × ')||'?'} finalizações`;holder.append(p);
    }
  }
  function historyUI(){const more=$('more');if(!more)return;const section=document.createElement('section');section.className='neo920-more';section.innerHTML='<h3>📚 Arquivo de transmissões</h3><p class="neo920-muted">Últimas partidas completas assistidas (registro local, sem enviar dados para servidores).</p><div id="neo920-history" aria-live="polite"></div>';more.append(section);renderHistory();}
  function boot(){
    if(!$('match')||!window.NeoEngine?.Match)return;
    installCSS();updateUI();modeUI();patchMatchEngine();historyUI();
    // The update control stays visible even offline, instead of appearing only when a release exists.
    window.NeoBroadcast92={version:VERSION,modes:MODES,getMode:()=>mode,setMode:chooseMode,compareVersions:compare};
    if(!native())verifyWebVersion();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();