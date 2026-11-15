/* Blue Lock NEO v8.7 — EGO Broadcast Deck: no invented match outcomes. */
(()=>{
'use strict';
const by=id=>document.getElementById(id);
let lastScore='',lastEvent='',lastView='',panel=null;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const liveText=id=>clean(by(id)?.textContent);
const eventSafe=text=>{const d=document.createElement('div');d.textContent=text||'';return d.textContent;};
function execButton(id){
 const source=by(id);
 if(!source||source.disabled){notify('Prepare a partida primeiro.');return false;}
 source.click();return true;
}
function notify(message){
 if(window.NeoMobile?.toast)window.NeoMobile.toast(message);
 else{const output=by('egoFeedback');if(output){output.textContent=message;setTimeout(()=>{if(output.textContent===message)output.textContent='';},3500);}}
}
function setup(){
 const match=by('match');if(!match||by('egoBroadcastDeck'))return;
 panel=document.createElement('section');panel.id='egoBroadcastDeck';panel.className='ego-broadcast-deck';
 panel.setAttribute('aria-label','Central premium da transmissão');
 panel.innerHTML='<div class="ego-topline"><span class="ego-live-dot"></span><span class="ego-kicker">EGO BROADCAST <b>· MATCHDAY</b></span><span class="ego-round">LIGA NEO EGOÍSTA</span></div>'+
 '<div class="ego-board"><div class="ego-team ego-home"><small>MANDANTE</small><strong id="egoHome">HOME</strong></div>'+
 '<div class="ego-score-zone"><div id="egoScore" class="ego-score">0 <span>:</span> 0</div><div class="ego-clock-row"><span id="egoClock">00:00</span><span id="egoHalf">PRÉ-JOGO</span></div></div>'+
 '<div class="ego-team ego-away"><small>VISITANTE</small><strong id="egoAway">AWAY</strong></div></div>'+
 '<div class="ego-actions" role="group" aria-label="Controles rápidos"><button type="button" id="egoPlay">▶ Iniciar</button><button type="button" id="egoSpeed">⚡ 1×</button><button type="button" id="egoCamera">🎥 Câmera</button><button type="button" id="egoCinema">⛶ Tela cheia</button></div>'+
 '<div class="ego-pulse"><div class="ego-pulse-top"><b>🔥 MOMENTO DO JOGO</b><span id="egoPulseText">Aguardando a partida</span></div><div class="ego-pulse-meter"><span id="egoPulseHome" style="width:50%"></span><span id="egoPulseAway" style="width:50%"></span></div></div>'+
 '<div class="ego-live-story"><div class="ego-story-title"><span>◉ LANCE MAIS RECENTE</span><span id="egoEventKind">AO VIVO</span></div><div id="egoStory">Selecione os times e prepare a partida para acompanhar os lances.</div></div>'+
 '<div class="ego-feedback" id="egoFeedback" role="status" aria-live="polite"></div>';
 match.insertBefore(panel,match.firstElementChild);
 by('egoPlay').addEventListener('click',()=>execButton('play'));
 by('egoCamera').addEventListener('click',()=>execButton('cameraMode'));
 by('egoCinema').addEventListener('click',()=>execButton('stadiumMode'));
 by('egoSpeed').addEventListener('click',()=>{
  const sel=by('speed');if(!sel)return notify('Controle de velocidade indisponível.');
  const options=[...sel.options].filter(o=>o.value&&!o.disabled);
  if(!options.length)return;
  const current=options.findIndex(o=>o.value===sel.value);
  sel.value=options[(current+1)%options.length].value;
  sel.dispatchEvent(new Event('change',{bubbles:true}));
  notify('Velocidade de transmissão: '+sel.options[sel.selectedIndex].text);
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 refresh();setInterval(()=>{if(!document.hidden)refresh();},700);
}
function refresh(){
 if(!panel)return;
 const home=liveText('homeLabel'),away=liveText('awayLabel'),clock=liveText('clock'),score=liveText('score');
 const goalSource=score.replace(/[^\d×x:–-]/g,'').replace(/[×x–-]/g,':');
 const clockText=clock||'00:00';
 if(by('egoHome').textContent!==(home||'MANDANTE'))by('egoHome').textContent=home||'MANDANTE';
 if(by('egoAway').textContent!==(away||'VISITANTE'))by('egoAway').textContent=away||'VISITANTE';
 if(goalSource&&lastScore!==goalSource){
  by('egoScore').textContent=goalSource.replace(':',' : ');
  if(lastScore){panel.classList.remove('ego-goal-flash');void panel.offsetWidth;panel.classList.add('ego-goal-flash');}
  lastScore=goalSource;
 }
 if(liveText('egoClock')!==clockText)by('egoClock').textContent=clockText;
 by('egoHalf').textContent=liveText('halfChip')||'PRÉ-JOGO';
 const play=by('play'),speed=by('speed'),camera=by('cameraMode');
 if(play){
  by('egoPlay').textContent=clean(play.textContent)||'▶ Começar';
  by('egoPlay').disabled=play.disabled;
  by('egoPlay').classList.toggle('ego-btn-active',!play.disabled && /pausar|⏸/i.test(play.textContent));
 }
 if(speed)by('egoSpeed').textContent='⚡ '+(speed.selectedOptions?.[0]?.textContent||speed.value);
 if(camera)by('egoCamera').textContent=clean(camera.textContent)||'🎥 Câmera';
 const pulseH=by('pulseHome'),pulseA=by('pulseAway'),label=liveText('pulseStatus');
 const wH=parseFloat(pulseH?.style.width),wA=parseFloat(pulseA?.style.width);
 if(Number.isFinite(wH)&&Number.isFinite(wA)){
  by('egoPulseHome').style.width=Math.max(0,Math.min(100,wH))+'%';
  by('egoPulseAway').style.width=Math.max(0,Math.min(100,wA))+'%';
 }
 if(label)by('egoPulseText').textContent=label.slice(0,100);
 const ticker=by('commentaryTicker'),recent=clean(ticker?.textContent);
 const event=by('events')?.querySelector('.event');
 const moment=event?clean(event.textContent):recent;
 const kind=event?.className||ticker?.dataset.kind||'';
 if(moment && moment!=='—' && moment!==lastEvent){
  lastEvent=moment;by('egoStory').textContent=moment.slice(0,300);
  by('egoEventKind').textContent=/goal|gol/i.test(kind)?'⚽ GOL':/save|defesa/i.test(kind)?'🧤 DEFESA':/shot|chute/i.test(kind)?'🎯 CHUTE':'EM CAMPO';
  const story=by('egoStory');story.classList.remove('ego-story-in');void story.offsetWidth;story.classList.add('ego-story-in');
 }
 const mode=document.querySelector('.nav [data-tab].active')?.dataset.tab||'match';
 if(lastView!==mode){lastView=mode;panel.dataset.active=String(mode==='match');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();