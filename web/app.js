
/* Neo Egoist Simulator 8.2 - dynamic run tracking & Android-friendly match visualization. */
(() => {
'use strict';
const E=window.NeoEngine,{TEAMS,COUNTRY_KITS,PITCH,TICK,SKILLS,Match,avatarTheme,avatarHTML,avatarSVG,REAL_PORTRAITS}=E;
const $=id=>document.getElementById(id);
function skillArtUrl(id){if(String(id).startsWith('neo2-'))return 'assets/neo2-skills/'+(E.Abilities.get(id)?.contexts?.[0]||'pass')+'.svg';return window.NeoOfflineSkillArts?.[id]||window.NeoCommonArts?.[id]||window.NeoRarityArts?.[id]||`assets/skill-arts/${id}.svg`;}
let lastBroadcastGoalCount=0,entranceShown=false,lastScorerBoardKey="",lastMobilePanAt=0,lastMobilePanValue="";
let lastHudTeamsKey='',lastGoalHudKey='',lastSkillHudKey='',lastHeavyUiAt=0,lastEgoUiAt=0,lastRunsUiAt=0,lastUiMatch=null;
const setIfChanged=(el,html)=>{if(el&&el.innerHTML!==html)el.innerHTML=html;};

// Placar persistente: cada gol continua visível desde o momento em que acontece.
function renderScorerBoard(){
  const goals=match?.goalRecords||[];
  const key=(match?.teams?.map(t=>t.id).join('|')||'')+'|'+goals.map(g=>[g.side,g.scorer,g.minute].join(':')).join('|');
  if(lastScorerBoardKey===key)return;
  lastScorerBoardKey=key;
  for(const side of [0,1]){
    const node=$(side===0?'homeScorers':'awayScorers');
    if(!node)continue;
    const scored=goals.filter(g=>g.side===side);
    node.innerHTML=scored.length?scored.map(g=>`<div class="scorer-line" title="${esc(g.scorer)} — ${g.minute}' · ${esc(goalStyleText(g.goalType))}${g.assister?' · Assistência: '+esc(g.assister):''}"><span class="scorer-ball" aria-hidden="true">⚽</span><span class="scorer-name">${esc(g.scorer)}</span><b class="scorer-minute">${g.minute}'</b></div>`).join(''):'<span class="no-goals">Ainda sem gols</span>';
    node.setAttribute('aria-label',scored.length?scored.length+' gol(s) '+match.teams[side].short:'Ainda sem gols '+match.teams[side].short);
  }
  const board=document.querySelector('.broadcast-scoreboard');
  if(board){board.classList.remove('goal-flash');if(goals.length){void board.offsetWidth;board.classList.add('goal-flash');}}
}
const GOAL_STYLE_LABELS={
 'tap-in':'⚽ Empurrada de perto','chip':'🌙 Cobertura no goleiro','first-time':'⚡ Chute de primeira',
 'far-post':'🎯 Finalização cruzada','low-drive':'💨 Rasteiro forte','turn-shot':'↪️ Giro e chute',
 'box-combo':'🔺 Tabela na área','inside':'🥅 Dentro da área','acrobatic':'⭐ Acrobacia',
 'header':'🪽 Cabeceio','long':'🚀 Bomba de longe','placed':'🎯 Chute colocado','curve':'🌀 Bola com efeito','penalty':'🎯 Pênalti'};
function goalStyleText(kind){return GOAL_STYLE_LABELS[kind]||'⚽ Finalização';}
const SKILL_SYMBOLS={dribble:'↝',shot:'✦',pass:'➶',tackle:'⬡',save:'✋'};
function skillVisual(a){
 const c=a?.contexts?.[0]||'dribble';
 return {type:c,icon:SKILL_SYMBOLS[c]||'✦',color:/^#[0-9A-Fa-f]{6}$/.test(a?.color||'')?a.color:'#5bd4ff',label:{dribble:'DRIBLE',shot:'FINALIZAÇÃO',pass:'PASSE / VISÃO',tackle:'MARCAÇÃO',save:'DEFESA'}[c]||'TÉCNICA'};
}
function syncMobilePitch(){
  const stadium=$('stadium');if(!stadium||!match)return;
  stadium.classList.toggle('full-pitch-mobile',!cameraFollow);
  if(window.innerWidth>650||document.fullscreenElement===stadium||stadium.classList.contains('fullscreen-active')){stadium.style.removeProperty('--pitch-pan');return;}
  const panNow=performance.now();
  if(panNow-lastMobilePanAt<75)return; // max. ~13 updates/s, leve para Android
  lastMobilePanAt=panNow;
  const wide=canvas.clientWidth;
  const overflow=Math.max(0,wide-stadium.clientWidth);
  if(!overflow){stadium.style.setProperty('--pitch-pan','0px');return;}
  const camX=cameraFollow?cameraX:PITCH.cx;
  const visualX=PITCH.cx+(match.ball.x-camX)*(cameraFollow?cameraActualZoom:1);
  const fraction=Math.max(0,Math.min(1,visualX/PITCH.width));
  const value=((.5-fraction)*overflow).toFixed(1)+'px';
  if(lastMobilePanValue!==value){stadium.style.setProperty('--pitch-pan',value);lastMobilePanValue=value;}
}
function syncFullscreenUI(){
  if(!$('fsScoreboard'))return;
  $('fsHomeLabel').textContent=$('homeLabel').textContent;
  $('fsAwayLabel').textContent=$('awayLabel').textContent;
  setIfChanged($('fsScore'),$('score').innerHTML);
  $('fsClock').textContent=$('clock').textContent;
  $('fsLive').textContent=$('liveBadge').textContent;
  if(match?.ball){const camY=Math.max(0,Math.min(100,((match.ball.y-198)/204)*100));$('stadium').style.setProperty('--camera-y',`${Math.round(camY)}%`);}if($('fsHalf'))$('fsHalf').textContent=$('halfChip')?.textContent||'1º TEMPO';
  for(const side of ['Home','Away']){
    const source=$(side==='Home'?'homeDot':'awayDot');const target=$('fs'+side+'Dot');
    target.className='team-dot crest';if(target.innerHTML!==source.innerHTML)target.innerHTML=source.innerHTML;
    for(const k of ['--crest','--crest-dark','--crest-accent'])target.style.setProperty(k,source.style.getPropertyValue(k));
  }
  const goals=match?.goalRecords||[];
  const ticker=$('fsScorer');
  if(goals.length){
    const goal=goals[goals.length-1];const team=match.teams[goal.side];
    ticker.textContent=`⚽ ${goal.minute}'  ${goal.scorer} · ${team.short}${goal.assister?'  🎯 '+goal.assister:''}`;
    ticker.classList.add('has-goal');
    if(lastBroadcastGoalCount!==goals.length){lastBroadcastGoalCount=goals.length;ticker.classList.remove('celebrate');void ticker.offsetWidth;ticker.classList.add('celebrate');}
  }else{ticker.textContent='';ticker.classList.remove('has-goal');lastBroadcastGoalCount=0;}
}
function showEntrance(){
  if(entranceShown||!match||!$('teamIntro'))return;
  entranceShown=true;
  const overlay=$('teamIntro');
  overlay.innerHTML=`<div class="intro-label">NEO EGOIST LEAGUE · ENTRADA DOS TIMES</div><div class="intro-clubs"><div class="intro-club">${teamArt(match.teams[0])}<strong>${esc(match.teams[0].short)}</strong><small>${esc(match.teams[0].formationName)}</small></div><div class="intro-versus">VS</div><div class="intro-club">${teamArt(match.teams[1])}<strong>${esc(match.teams[1].short)}</strong><small>${esc(match.teams[1].formationName)}</small></div></div><div class="intro-tagline">22 jogadores · Uma partida · Cada lance importa</div>`;
  overlay.classList.add('show');
  overlay.addEventListener('animationend',()=>overlay.classList.remove('show'),{once:true});
  setTimeout(()=>overlay.classList.remove('show'),3300);
}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const px=(x,n=0)=>Number(x).toFixed(n);
const line=(a,b)=>`${a} — ${b}`;
const TEAM_ART={"bm":"data:image/webp;base64,UklGRuIPAABXRUJQVlA4INYPAABwQgCdASqAAHwAPlUijkSjoiEauPecOAVEtABOnMbpHyrzK8Kfsf7l+xeF9MfZD9bW4vmpG0JuJOJf4585/mf7x+6Pu9fhmNfrH+iPUX+Xfeb9p/g/QT/meJfxb1C/yn+c/7D+2+tjC46LUEbyX2f2N46d/q/+30yfnX+r9G9pXVZl/OnmnRtfmTDotCKggDUiFHZhuHVmxKQY+qc9hRsN6jau0b5GtWDCRypRXIyae8/ICltF+h1JKAVTVgmdmmVlUy2FzDlGFIphcZ4idXPccnlK+KBUiC900ELu3NsQSYbQM8bF4aNpxoa04Zuv47UoVFOOarZ2FYbkh8KDq7npKDmqjlHFSCj3MvmpjqV827jYAGMPHpPiJCWExk1mkw7Vfkd/y7Reodqef2iiRbuNSoZqr9zLPSDNCGf/6nRx9j7UwQjvXCH5Jr6RDWN5ZLTo/QKI5aZ88bgMRbeOVjWv+buH7P6YrfX+5hcWyFd32+YSK86sOrQjV+3ETFsPf10YZZgHAJ8VKLHTW0c8zzbNQi0hSiclO9f2dC1xxOtPNVTNY1CCxwoBX2tb3ODWeWae57CcPyZIEpCW+sZqv1Sm5Ap93SdsfwVeh3T0a8e/iThOApw8JzFRCe8+1aftGiAocYx6o4Z24il17Z9KAQ1iYnUWjJf4Ojbkk8FrEYW2yB+3HgCO2CiXmML4djKxfE5OHCMMphFWXAB+JoAA/v9cGXr2E3GcsfggIQUbLCVWXDOE0+IOFVuA8xUw2Ecq1xEW/mqx+6BlSIR1Qi8qb8VyIqvOxIU63GkiAXKcbc2Ta3BEU7gFLUpr8zVI3mw/HDjYoDRFP1TCc544/RPAi+F3dmoGblSmeQsQ8vsGAaOzLDpeLigplqFfM/Svm2x52QPfbzLVEbDVYV6LmJO3XFVuA0TluzgOx4BoyyGicyrIK2+Pc4qu6hLHXT3tTgL36yrB0ijWb4rfI3KrIlc6DREea2m3Fs5/7q3B4Z1Wu0DtT61qODZOXuXrzL/YmzI27pXi9ERrV3sGHo+TwRdXr72rjEFcyrK586VkgB9Qkq829Tm/C2RNkA91H2j2S7aIwebdsYempk+UfHRnbdLTXfTxbtoAdMysbhTX8gNGI4frheB5lQZgVH6F5StwJ2SM8uDZiT75vDBpH1ig8QItyG+DFqywjcqaiqxtT5mZEegmAPE/eec4wp9nLmpVswKnCyLU8Ce2w6lW208JiNitrkDkltHrXukxQnneZOpQAfapwePbidEUdOnwtofwE13DcCq8Ms0AE1njeFj+2zoHALbzYRMNuk6ue3sWkGrhKX5JSijFbVyMS2ji7fJ/MQO0J7GZKerhC92S7tw8sUBr14hpyi5KChiA49oewmNLp+e7GcKrej3+B+lSS6D1qHLaJaHvpHUdAs+HzKKHuNo9zP0eIGsYBpCYjWLADNvZDqEpeit8XAe2NIUpWiL4aDzZ3SK9iuFQmeM69YZKgMS5uJJKi7RjNCDGz/G5q2GEMQiNOtKAp3LbOUffRwrN4dMBvFfEqj1lEIcSk4Nccl5fg8sPJSZEnYklbaVCh82mudOGI1/u5WkUnU3OMQesz8QI5vOvHHZRsJd0+aBcVEjC0NGi/7vd/4PBtU8uLIBCOnimtIJskoW/JeazpqeYiR4k8AayZFWlkTKpprWJ7dA/CZRNAC763TiwdvqztimYP3l8NpevIp//SY/D+Z8cI2usswB8g7hnwAmMjQbKynAFUF/+BcUosW345XyqEoaUmC8vqcohvHb17UUBw5WoxC87xl04priw8nzhnUAzt9818/V3cQA7GRtQGkgsKXUk0X8sC5hFQKwKYsn9Ac13cTx+ALx/qpHnGyke0C39XXQF57TMsrvTvjWbQ+T6Z482vPLJ0wPJHbLmR9YnRtOhqpuxArTs/h2f58C6SAlN7b3Sr3qpW7GBJTgwFBD5lcl+ciS6cr/ffhsxW6luRWsJif8HNY9m8CgYsj0GoPd7a2WHQ8CevigINjA2ztKn1i4fSqAo+jZAjl26xrDx+Jnzjxucze0Aiq25A1FaOi03xsfhV1+uJ6JFesbWx1BPaToysfZ/24THDKlwzsL9NwmjLhmGZegv1bAEBXedHAzbVa9Q0OZM37CW5yOTzrA10PBR19YP4/fvhMYFDb7WQYjw61p6ERHWRyswZO/LepC52zxlH5ps8DwmqsM5iSEr92kkGfz3452ihdNM2ME/+KcBpqdsoeHIUrxcE9/JyJ+q9QWA+rz6b2aGhDoRC5ONs0wdwcQEZtXW1fYtMPr+op7DNtzIowdSFBe+U7xaXNTMiRQd43rY+vfCMHkztFbZEtfPUSeqNhRVgpOEHtvlbUCxPaFXf1QEG60Q1nnVdnRJ5f2OIv2OURSQR5Ec5ibNTq7cmcL0xMW5+wna0PbUslCTkcEOziLPwlqYfRtQHCUSGvYl5zid5zqGS1MOOC9X2qdWrvRMuw77h6W2WeC4JtGdDHCbIeTpzP/FfapFoTYfCR60DCzFiNIEA3D2d5cSuS//6sEDH9F4WJky7vZj5NWyMN6tYm8qG4SAzj1Pd0mJkfNsMrCmBkO1lOvi/5keFa7DGLOQIogddjiZlfdFiI4cRyeumbyWOlCWQxG8vcdwHNvByU6pASLnNyBFbhi+mmuKy8FozbYxB2Rmg13l98IUxZ8wkIzMqGub/o9iG3rSJLF2eMLZ4Rs3r1rgP2rBYJcIK70FWpNA6UgBuk4ohoMCyTgIXj/IXzOUFXx3+F7u/JP/xYDu4ndUDGdyYlMngLMvl4kMaq5aCr4t5322dWDEQoY1g+Ug2X0sDVN3Pk4rKAmNShLGUIkw7ioB7nCtDaQuEaLK4IeuuCgLHXDRLwjsDNzJm3gEJVLD/FvOl0H0Q0LpvTtw85Z1Sa0FpIR4yaqXBFoVqeCYNk6KXh9l5EvhimWuLI5cOSMpX+qOy7a9vOby0qSa+JdMT10oQjPDutN2D4YRsA2f4Ui4H0QBXb7zO+AsJEKFZAhbYPCPbCobDuALPoY+OTOFfUG8hWLCbA2LRnK/+BHPf5mkJqJpMJysZ3Uq7LFzz2jFwOC9+LCU1HoRKRJJeKKn5PVol3g342bcA+lvbCrhSjzWonwBzn9ODd1B8BdrQbfSswx9zdSLo3all7hWtTQ1ib6xqaaLNEtBy1G6iQh8Qrmk6cbG1rumk+9Fc9Gl/+vC3wgsMuhFbVfiKGe0sjvRMShPW4l7h+KJlbef8VO7ix8XEhwb9HelUEfyMBFAxsbgPvwSg5hWUqXlyo1YH69X5GXgGGRDaANQ3DN1FY5Ul9WAiJZ9NdHqk4taoGHTmWF52zOc7Nygv0exJFfOQVck4gU38YU7EFzMp/gpOHZT3n0XhPoDqjvIL9Z/IdoXZZEX/DLhpLmGt5w3/32H533UqZjVnBIOToR4D7ylNB6bv8JZxXKIc5r/0qxviF2rBaO2/FYaNjvIPfC/CP4OEEh7/ik1HcBQlR7YFNe4sOgVWhJHpQXUrozGXiPqyORpSgcX1ggbm1jEqPkM4SzRKPQ8MNKR6UB5JTfs6h788ffKE0kmNhtzoxaLdGcsZ6Xggc3/xIt+Rui6xjcQTZhN8U9/estmnqf19HwaOIC25DHBApx6oCxoewr8NVbo/d7sCsYd7/0a1asrc+FckvqlojVNdHi6Bz495ehzIFaZNhpRtRplXDxcdTVQOxk2PV5+jazfrupomXQelSL5lO0b2jFo2Y1Rk/E2JANUq7dzo59WoINANOdWNwAR3y0rIJghXcCMwjirsWFgRWsrsUhvqo4x9OFCjnvrdkLlyrzUKDhBkQGb9CurrfxfIaxJWzBRvLSOluqcwkWeqzjKk3+cJLjgfSxsY/QBThW+OTvxIqwxV+b8g22EIzSpH9BjnIYAAWB0qvvycZsywlGivcr3VGdIOpNtSoXdXLuc2qf13xti9JDKoapTxV6H2MqzNnfe5QiTEVhAXzfAJJ9eM0q+QBIgGqVsJUH/z2ejPtX+8onC6pQzI2+k0bKtoQ+bWny/oVzL5WrpYkenp6m8JSDaQKfAsdaqpj62IrqhL13XuLNal8e+ZxP9/f5XF3JC60ltLjF+pxKf1W8ghYjFEPKHQEqEhdEPFs5Z5adoNqh43N2hZP/G/fzaPMpwfU+I/S7OT5zjValOhem24D4jaCsthBZYPrYRiuQ7kxEejx3Qb1QM+cFsrJ2EQT5HaJ3aCa2PuZ7ciRT2im8CsZRwHFTGHU9VjC+GuLYtp1MPuJEqylBTDmo0naJ4Wk0o7N6Ue9T473rAESgEuNJXSnPva9VSM/M5ZONFuaH6w25/xkuZ5XcH29k89hKZ66UOH2+g0GAY8OAH0sGE8zo9dUzBNL8f8wpVP+4Vb/Ie9naK+21C8rB+LorW7SXQ7cc4gfqPF/2UV42OVW6CpxdTi3YyGxDf5+zEUN22MMs9HCWRMe0iB57FREW+1wfUpYYAnccXfzO9beDOBkgiREKZLAQHJTpCgPvpfI2QbSxUitYUybD+9FZa5pmDI7Q5szNPxCTk5ZSmlHDRy2IeqgEIAI01d5LifznP72y478aSBfLYu1S3OkiK0wEzPxUrdn/sL4EBwz1FR82s2YCUweZOsGf9gT1xNukC6UlblpZX2RiLL/rTjQ7Voamn9uraCLC7Um/1v+4lVUt6TA3Un+SsvGzsTsgTJ4VOrr4VHy/VS7PMqVdCDh/LxhMNDspwuY4+THBwDidnNpdmLOVMUpmcTOESRHY3/xUqbM4j9UMmToYhyPPykPlSiz8H5V8CRdivQvJNUyxlw7cPNbi35zGS8zOSvJCmtgI7O29li/SYseMq9zMI/rEuP4Ho8X+UytHkYj7Izs4EmxOQBbOqyQX9grViWkHA9sTkNbbFMb0r+1M5GPxYy2yUPOZ1Q9GysbDFIvWFPYqun6WVrCXsySDQpwE3/2QbBVe7R4+SEztt/ZdRHNXoN+NUOkyyPj6vLqnHtz4KAQeC3hG6nTPDvQaE6tug8QNlxLBC0CeM1jzaz3ZgUqRcsjh6UhVZmwh63TrXtHt46M2muksbISFlQDCO2R0CNONtyGG11qEuviM93X8b/B9Zi6kFSUJySlSjlwdBtWp1g1re9vAzgaE8+VhDdiyHLGdYnhWIWm0Zk3Npr7FfWkfCLaWZazQQsBrWt/EY7zvtSyjzRMF+kc3mzfBf3+z0sPhHlpQMz8JjCNq9qVXHJrzYgZVIe8ShH7Mvo25OKe0CoY4bSiSpJA2dhvG7yZCR5zdnYnCGM/AlrF/vavKShH3i5F71ZVzgiG/1Edrh31lpp7q64jCg2XZYj/reQV3osoKyZ9JQsRl7UBTMfc3igxBZewxuuUb1ItGHVcwxpPEcRqEJ6g6uqPc10EJLeMVYYfTmteOoU8AA","ba":"data:image/webp;base64,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","mc":"data:image/webp;base64,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","px":"data:image/webp;base64,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","ub":"data:image/webp;base64,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"};
const TEAM_LOGO_PATHS=Object.freeze({bm:'assets/team-logos/bm.webp',ba:'assets/team-logos/ba.webp',mc:'assets/team-logos/mc.webp',px:'assets/team-logos/px.webp',ub:'assets/team-logos/ub.webp'});
const historyCrestSVG='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="35" fill="#151327"/><path d="M80 13 L140 42 L129 119 L80 151 L31 119 L20 42Z" fill="#e9bf3c" stroke="#fff4be" stroke-width="5"/><path d="M80 25L128 48L116 111L80 137L44 111L32 48Z" fill="#211932"/><text x="80" y="100" font-family="Arial,sans-serif" font-weight="900" font-size="53" fill="#f9d951" text-anchor="middle">HT</text></svg>');
const teamArt=(t,cls='')=>'<img class="club-art '+esc(cls)+'" src="'+(TEAM_LOGO_PATHS[t?.id]||TEAM_ART[t?.id]||(t?.id==='ht'?historyCrestSVG:''))+'" alt="'+esc(t?.name||'clube')+'" loading="lazy">';
const PORTRAIT_KEY='neo-custom-portraits-v36';
const PORTRAIT_STYLE_KEY='neo-portrait-style-v37';
const PORTRAIT_REPORT_KEY='neo-portrait-reports-v41';
const MANGA_PORTRAIT_KEY='neo-manga-portraits-v602';
const MANGA_MIGRATION_KEY='neo-manga-preference-migration-v602';
const ORIGINAL_ART = window.NeoOriginalPortraits || Object.create(null);
const BUNDLED_PORTRAITS=Object.freeze({"Abdi":"assets/imported-portraits/abdi.jpg","Agi":"assets/imported-portraits/agi.jpg","Aiki Himizu":"assets/imported-portraits/aiki-himizu.jpg","Akira Endoji":"assets/imported-portraits/akira-endoji.jpg","Alexis Ness":"assets/imported-portraits/alexis-ness.jpg","Aoshi Tokimitsu":"assets/imported-portraits/aoshi-tokimitsu.jpg","Arthur":"assets/imported-portraits/arthur.jpg","Bachman":"assets/imported-portraits/bachman.jpg","Benedict Grim":"assets/imported-portraits/benedict-grim.jpg","Birkenstock":"assets/imported-portraits/birkenstock.jpg","Bos":"assets/imported-portraits/bos.jpg","Busby":"assets/imported-portraits/busby.jpg","Canali":"assets/imported-portraits/canali.jpg","Chapa":"assets/imported-portraits/chapa.jpg","Charles Chevalier":"assets/imported-portraits/charles-chevalier.jpg","Chris Prince":"assets/imported-portraits/chris-prince.jpg","Damon":"assets/imported-portraits/damon.jpg","Don Lorenzo":"assets/imported-portraits/don-lorenzo.jpg","Drago":"assets/imported-portraits/drago.jpg","Driver":"assets/imported-portraits/driver.jpg","Eita Otoya":"assets/imported-portraits/eita-otoya.jpg","Erik Gesner":"assets/imported-portraits/erik-gesner.jpg","Espresso":"assets/imported-portraits/espresso.jpg","Gabin":"assets/imported-portraits/gabin.jpg","Gen Fukaku":"assets/imported-portraits/gen-fukaku.jpg","Gin Gagamaru":"assets/imported-portraits/gin-gagamaru.jpg","Gomez":"assets/imported-portraits/gomez.jpg","Gurimu Igarashi":"assets/imported-portraits/gurimu-igarashi.jpg","Hajime Nishioka":"assets/imported-portraits/hajime-nishioka.jpg","Haru Hayate":"assets/imported-portraits/haru-hayate.jpg","Haruhiko Yuzu":"assets/imported-portraits/haruhiko-yuzu.jpg","Hyoma Chigiri":"assets/imported-portraits/hyoma-chigiri.jpg","Ignacio Lara":"assets/imported-portraits/ignacio-lara.jpg","Ikki Niko":"assets/imported-portraits/ikki-niko.jpg","Itsuki Wakatsuki":"assets/imported-portraits/itsuki-wakatsuki.jpg","Jin Kiyora":"assets/imported-portraits/jin-kiyora.jpg","Jingo Raichi":"assets/imported-portraits/jingo-raichi.jpg","Julian Loki":"assets/imported-portraits/julian-loki.jpg","Junichi Wanima":"assets/imported-portraits/junichi-wanima.jpg","Jyubei Aryu":"assets/imported-portraits/jyubei-aryu.jpg","Kairu Saramadara":"assets/imported-portraits/kairu-saramadara.jpg","Kazuma Nio":"assets/imported-portraits/kazuma-nio.jpg","Kento Cho":"assets/imported-portraits/kento-cho.jpg","Kenyu Yukimiya":"assets/imported-portraits/kenyu-yukimiya.jpg","Kyohei Shiguma":"assets/imported-portraits/kyohei-shiguma.jpg","Lavinho":"assets/imported-portraits/lavinho.jpg","Marc Snuffy":"assets/imported-portraits/marc-snuffy.jpg","Meguru Bachira":"assets/imported-portraits/meguru-bachira.jpg","Mensah":"assets/imported-portraits/mensah.jpg","Michael Kaiser":"assets/imported-portraits/michael-kaiser.jpg","Michelin":"assets/imported-portraits/michelin.jpg","Miroku Darai":"assets/imported-portraits/miroku-darai.jpg","Moro":"assets/imported-portraits/moro.jpg","Nijiro Nanase":"assets/imported-portraits/nijiro-nanase.jpg","Noel Noa":"assets/imported-portraits/noel-noa.jpg","Oliver Aiku":"assets/imported-portraits/oliver-aiku.jpg","Peron":"assets/imported-portraits/peron.jpg","Picasso":"assets/imported-portraits/picasso.jpg","Ranze Kurona":"assets/imported-portraits/ranze-kurona.jpg","Reiji Hiiragi":"assets/imported-portraits/reiji-hiiragi.jpg","Renoir":"assets/imported-portraits/renoir.jpg","Rensuke Kunigami":"assets/imported-portraits/rensuke-kunigami.jpg","Reo Mikage":"assets/imported-portraits/reo-mikage.jpg","Rico":"assets/imported-portraits/rico.jpg","Rin Itoshi":"assets/imported-portraits/rin-itoshi.jpg","Rook":"assets/imported-portraits/rook.jpg","Ruiz":"assets/imported-portraits/ruiz.jpg","Ryusei Shido":"assets/imported-portraits/ryusei-shido.jpg","Seishiro Nagi":"assets/imported-portraits/seishiro-nagi.jpg","Shingen Tanaka":"assets/imported-portraits/shingen-tanaka.jpg","Shizuka Haiji":"assets/imported-portraits/shizuka-haiji.jpg","Shoei Baro":"assets/imported-portraits/shoei-baro.jpg","Shuto Sendo":"assets/imported-portraits/shuto-sendo.jpg","So":"assets/imported-portraits/so.jpg","Swift":"assets/imported-portraits/swift.jpg","Tabito Karasu":"assets/imported-portraits/tabito-karasu.jpg","Taiga Tsunzaki":"assets/imported-portraits/taiga-tsunzaki.jpg","Teppei Neru":"assets/imported-portraits/teppei-neru.jpg","Teru Kitsunezato":"assets/imported-portraits/teru-kitsunezato.jpg","Tetsu Sokura":"assets/imported-portraits/tetsu-sokura.jpg","Theo Sachs":"assets/imported-portraits/theo-sachs.jpg","Urzaiz":"assets/imported-portraits/urzaiz.jpg","Yo Hiori":"assets/imported-portraits/yo-hiori.jpg","Yoichi Isagi":"assets/imported-portraits/yoichi-isagi.jpg","Young":"assets/imported-portraits/young.jpg","Yukio Ishikari":"assets/imported-portraits/yukio-ishikari.jpg","Zantetsu Tsurugi":"assets/imported-portraits/zantetsu-tsurugi.jpg"});
const explicitPortraitStyles=Object.create(null);
const OFFICIAL_MANGA=window.NeoOfficialManga || Object.create(null);
const WIKI_REFERENCES=window.NeoWikiSources || Object.create(null);
const WIKI_PORTRAITS=window.NeoWikiPortraits || Object.create(null);
const portraitIdentity=window.NeoIdentityCard || avatarSVG;
const WIKI_PORTRAIT_MIGRATION_KEY='neo-wiki-real-portraits-v632';
const OFFICIAL_MANGA_MIGRATION_KEY='neo-verified-manga-v63';
const ORIGINAL_ART_MIGRATION_KEY='neo-original-art-portraits-v603';

let mangaPortraits={};
try {const value=JSON.parse(localStorage.getItem(MANGA_PORTRAIT_KEY));if(value&&typeof value==='object'&&!Array.isArray(value))mangaPortraits=value;}catch(e){}
function hasManga(name){return typeof mangaPortraits[name]==='string'&&/^(data:image\/|blob:)/.test(mangaPortraits[name]);}

let reportedPortraits={};try{reportedPortraits=JSON.parse(localStorage.getItem(PORTRAIT_REPORT_KEY))||{};}catch(e){reportedPortraits={};}
const failedPortraits=new Set();
const OFFICIAL_NAMES=new Set(); // third-party image hosts do not establish official asset ownership
function isPortraitAvailable(name){return !!REAL_PORTRAITS[name]&&!reportedPortraits[name]&&!failedPortraits.has(name);}
function portraitSourceKind(name){if(!REAL_PORTRAITS[name]||reportedPortraits[name])return 'reserva';return OFFICIAL_NAMES.has(name)?'oficial':'externa';}
function savePortraitReports(){try{localStorage.setItem(PORTRAIT_REPORT_KEY,JSON.stringify(reportedPortraits));}catch(e){}}

let portraitStyles={};try{portraitStyles=JSON.parse(localStorage.getItem(PORTRAIT_STYLE_KEY))||{};}catch(e){portraitStyles={};}
// Use bundled, individually named original manga-style artwork by default, preserving
// any user-uploaded manga and custom portraits.  Do not re-enable old remote images.
try{if(!localStorage.getItem(ORIGINAL_ART_MIGRATION_KEY)){
  for(const name of Object.keys(ORIGINAL_ART)){
    if(!['custom','manga'].includes(portraitStyles[name]))portraitStyles[name]='original';
  }
  localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));
  localStorage.setItem(ORIGINAL_ART_MIGRATION_KEY,'1');
}}catch(e){}
// Never silently show third-party anime art as if it came from manga panels.
try{if(!localStorage.getItem(MANGA_MIGRATION_KEY)){
  for(const [name,mode] of Object.entries(portraitStyles))if(mode==='anime')portraitStyles[name]='premium';
  localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));
  localStorage.setItem(MANGA_MIGRATION_KEY,'1');
}}catch(e){}
// Activar somente referências identificadas pela editora, preservando fotos enviadas.
try{if(!localStorage.getItem(OFFICIAL_MANGA_MIGRATION_KEY)){
  for(const name of Object.keys(OFFICIAL_MANGA)){
    if(!hasManga(name)&&portraitStyles[name]!=='custom')portraitStyles[name]='official';
  }
  localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));
  localStorage.setItem(OFFICIAL_MANGA_MIGRATION_KEY,'1');
}}catch(e){}
// Migração única: substituir a arte genérica por uma fonte identificada ou por cartão sem rosto.
// Respeitar sempre qualquer imagem importada pelo usuário.
try{if(!localStorage.getItem(WIKI_PORTRAIT_MIGRATION_KEY)){
 for(const member of TEAMS.flatMap(t=>[...t.players,...t.reserves,t.master])){
   if(hasManga(member)||portraitStyles[member]==='custom')continue;
   portraitStyles[member]=OFFICIAL_MANGA[member]?'official':WIKI_PORTRAITS[member]?'wiki':'premium';
 }
 localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));
 localStorage.setItem(WIKI_PORTRAIT_MIGRATION_KEY,'1');
}}catch(e){}
function portraitStyle(name){
  if(reportedPortraits[name]&&!hasManga(name)&&portraitStyles[name]!=='custom')return 'premium';
  const mode=portraitStyles[name];
  if(BUNDLED_PORTRAITS[name]&&(mode==='premium'||mode==='original'||!mode)&&!explicitPortraitStyles[name])return 'bundled';
  if(mode==='bundled'&&BUNDLED_PORTRAITS[name])return 'bundled';
  if(mode==='manga'&&hasManga(name))return 'manga';
  if(mode==='official'&&OFFICIAL_MANGA[name])return 'official';
  if(mode==='wiki'&&WIKI_PORTRAITS[name])return 'wiki';
  if(mode==='custom'&&customPortraits[name])return 'custom';
  if(mode==='anime')return WIKI_PORTRAITS[name]?'wiki':'premium'; // Unverified old URL, never automatic

  if(mode==='premium')return 'premium';
  if(mode==='original'&&ORIGINAL_ART[name])return 'original';
  return hasManga(name)?'manga':customPortraits[name]?'custom':OFFICIAL_MANGA[name]?'official':WIKI_PORTRAITS[name]?'wiki':'premium';
}
function setPortraitStyle(name,style){
  if(!['anime','premium','custom','manga','original','official','wiki','bundled'].includes(style))return;
  if(style==='anime')return; // Never enable unverified third-party image pointers
  if(style==='official'&&!OFFICIAL_MANGA[name])return;
  if(style==='wiki'&&!WIKI_PORTRAITS[name])return;
  if(style==='custom'&&!customPortraits[name])return;
  if(style==='manga'&&!hasManga(name))return;
  if(style==='original'&&!ORIGINAL_ART[name])return;
  if(style==='bundled'&&!BUNDLED_PORTRAITS[name])return;
  portraitStyles[name]=style;
  explicitPortraitStyles[name]=style;
  try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}
  // A preferência também fica no IndexedDB, caso o localStorage esteja cheio.
  rememberPortraitChoice(name,style).catch(e=>console.warn('Preferência de retrato não gravada:',e));
  refreshPortraits();
}

let customPortraits={};
try{const parsed=JSON.parse(localStorage.getItem(PORTRAIT_KEY));if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))customPortraits=parsed;}catch(e){}

// v7.9: actual image files belong in IndexedDB (Blob), never in localStorage.
// IndexedDB is scoped to the page's origin (host + port), so export/import is provided.
const PORTRAIT_DB_NAME='neo-portrait-library-v1';
let portraitDBPromise=null;
function openPortraitDB(){
  if(portraitDBPromise)return portraitDBPromise;
  portraitDBPromise=new Promise((resolve,reject)=>{
    if(!('indexedDB' in window))return reject(Error('Seu navegador não disponibiliza armazenamento de imagens (IndexedDB).'));
    let req;
    try{req=indexedDB.open(PORTRAIT_DB_NAME,1);}catch(e){return reject(e);}
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('images'))db.createObjectStore('images',{keyPath:'key'});
      if(!db.objectStoreNames.contains('choices'))db.createObjectStore('choices',{keyPath:'name'});
    };
    req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db);};
    req.onerror=()=>reject(req.error||Error('Não foi possível abrir o armazenamento de retratos.'));
    req.onblocked=()=>reject(Error('Feche outra aba antiga do simulador e tente novamente.'));
  }).catch(error=>{portraitDBPromise=null;throw error;});
  return portraitDBPromise;
}
function idbTransaction(storeNames,mode,action){
  return openPortraitDB().then(db=>new Promise((resolve,reject)=>{
    let tx;
    try{tx=db.transaction(storeNames,mode);action(tx);}catch(e){try{tx?.abort();}catch(_){}return reject(e);}
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||Error('Falha ao salvar imagem no IndexedDB.'));
    tx.onabort=()=>reject(tx.error||Error('A gravação do retrato foi interrompida.'));
  }));
}
function readPortraitDB(){
  return openPortraitDB().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(['images','choices'],'readonly');
    const images=tx.objectStore('images').getAll();
    const choices=tx.objectStore('choices').getAll();
    tx.oncomplete=()=>resolve({images:images.result||[],choices:choices.result||[]});
    tx.onerror=()=>reject(tx.error||Error('Falha ao recuperar retratos.'));
    tx.onabort=()=>reject(tx.error||Error('Leitura dos retratos interrompida.'));
  }));
}
function dataPortraitToBlob(data){
  if(typeof data!=='string'||!data.startsWith('data:image/'))throw Error('O arquivo de imagem está inválido.');
  const parts=data.split(',',2);
  if(parts.length!==2||!parts[0].includes(';base64'))throw Error('Codificação de imagem não suportada.');
  const mime=parts[0].slice(5).split(';')[0];
  const binary=atob(parts[1]);const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type:mime});
}
function blobToPortraitData(blob){return new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onload=()=>resolve(reader.result);
  reader.onerror=()=>reject(Error('Falha ao exportar imagem.'));reader.readAsDataURL(blob);
});}
function assignPortraitBlob(type,name,blob){
  const collection=type==='manga'?mangaPortraits:customPortraits;
  const previous=collection[name];
  const url=URL.createObjectURL(blob);
  collection[name]=url;
  if(typeof previous==='string'&&previous.startsWith('blob:'))URL.revokeObjectURL(previous);
}
async function putPortraitBlob(type,name,blob,choose=true){
  if(!['manga','custom'].includes(type)||!name||!(blob instanceof Blob)||!blob.size)throw Error('Retrato inválido.');
  await idbTransaction(['images','choices'],'readwrite',tx=>{
    tx.objectStore('images').put({key:type+'|'+name,name,type,blob,updatedAt:Date.now()});
    if(choose)tx.objectStore('choices').put({name,style:type});
  });
  assignPortraitBlob(type,name,blob);
  if(choose){portraitStyles[name]=type;explicitPortraitStyles[name]=type;try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}}
}
async function savePortraitImage(type,name,data){
  if(!['custom','manga'].includes(type)||typeof name!=='string'||!name.trim()
       ||typeof data!=='string'||!data.startsWith('data:image/')||!data.includes(';base64,'))
    throw Error('Retrato inválido. Use JPG, PNG ou WebP.');
  let error=null;
  try{await portraitStorageReady;await putPortraitBlob(type,name,dataPortraitToBlob(data));return;}
  catch(e){error=e;}
  // Android WebViews sometimes disable IndexedDB. Persist compact canvas
  // JPEGs to legacy localStorage, with rollback if the quota is exhausted.
  const collection=type==='manga'?mangaPortraits:customPortraits;
  const key=type==='manga'?MANGA_PORTRAIT_KEY:PORTRAIT_KEY;
  const old=collection[name];collection[name]=data;
  try{
    localStorage.setItem(key,JSON.stringify(collection));
    portraitStyles[name]=type;explicitPortraitStyles[name]=type;
    localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));
  }catch(e){
    if(old===undefined)delete collection[name];else collection[name]=old;
    throw Error('Armazenamento de imagens cheio ou indisponível. Faça backup de retratos e libere espaço. '+(e?.message||error?.message||''));
  }
}
async function rememberPortraitChoice(name,style){
  try{await portraitStorageReady;await idbTransaction(['choices'],'readwrite',tx=>tx.objectStore('choices').put({name,style}));}
  catch(error){console.warn('Preferência de retrato armazenada localmente:',error);}
}
async function initPortraitStorage(){
  try{
    let saved=await readPortraitDB();
    const keys=new Set(saved.images.map(x=>x.key));
    // Migrate old base64 portraits without losing even one image if the migration fails.
    const legacy=[...Object.entries(customPortraits).map(([name,data])=>({type:'custom',name,data})),
                  ...Object.entries(mangaPortraits).map(([name,data])=>({type:'manga',name,data}))]
       .filter(x=>typeof x.data==='string'&&x.data.startsWith('data:image/'));
    let migrationErrors=0;
    for(const record of legacy){
      const key=record.type+'|'+record.name;
      if(keys.has(key))continue;
      const choose=portraitStyles[record.name]===record.type;
      try{
        const blob=dataPortraitToBlob(record.data);
        await idbTransaction(['images','choices'],'readwrite',tx=>{
          tx.objectStore('images').put({key,name:record.name,type:record.type,blob,updatedAt:Date.now()});
          if(choose)tx.objectStore('choices').put({name:record.name,style:record.type});
        });
        keys.add(key);
      }catch(error){
        // An old bad image must never prevent new valid uploads.
        migrationErrors++;console.warn('Retrato legado não migrado: '+record.name,error);
      }
    }
    // Only AFTER every old image is confirmed in IndexedDB may the old bulky copies go.
    saved=await readPortraitDB();
    if(migrationErrors===0&&legacy.every(x=>saved.images.some(v=>v.key===x.type+'|'+x.name))){
      try{localStorage.removeItem(PORTRAIT_KEY);localStorage.removeItem(MANGA_PORTRAIT_KEY);}catch(e){}
    }
    for(const rec of saved.images){if(rec?.blob instanceof Blob&&['manga','custom'].includes(rec.type))assignPortraitBlob(rec.type,rec.name,rec.blob);}
    for(const choice of saved.choices){if(choice?.name&&typeof choice.style==='string'){portraitStyles[choice.name]=choice.style;explicitPortraitStyles[choice.name]=choice.style;}}
    try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}
    try{refreshPortraits();}catch(e){console.warn('Fotos carregadas; galeria será atualizada depois:',e);}
    const status=document.getElementById('portraitNotice');
    if(status&&saved.images.length&&status.textContent.includes('Se a internet'))status.textContent=`✅ ${saved.images.length} retrato(s) recuperado(s) do armazenamento de imagens.`;
    return saved;
  }catch(error){
    console.warn('Armazenamento de retratos indisponível:',error);
    const status=document.getElementById('portraitNotice');
    if(status)status.textContent='⚠️ Armazenamento de imagens indisponível: '+String(error?.message||error);
    throw error;
  }
}
const portraitStorageReady=initPortraitStorage();
// Avoid unhandled-rejection reports until a user explicitly tries to import.
portraitStorageReady.catch(()=>{});
window.NeoPortraitsReady=portraitStorageReady;

async function exportPortraitBackup(){
  // Backups must include both IndexedDB photos and Android fallbacks.
  await portraitStorageReady.catch(()=>null);
  const records=await readPortraitDB().catch(()=>({images:[],choices:[]}));
  const images=[],used=new Set();
  for(const item of records.images||[]){
    if(!item?.blob||!['custom','manga'].includes(item.type))continue;
    const name=item.name,type=item.type;
    images.push({name,type,data:await blobToPortraitData(item.blob)});
    used.add(type+'|'+name);
  }
  for(const [type,collection] of [['custom',customPortraits],['manga',mangaPortraits]]){
    for(const [name,data] of Object.entries(collection||{})){
      if(typeof data!=='string'||!data.startsWith('data:image/')||used.has(type+'|'+name))continue;
      images.push({name,type,data});used.add(type+'|'+name);
    }
  }
  if(!images.length)throw Error('Ainda não existem imagens personalizadas para exportar.');
  const choices=[...new Map([
    ...(records.choices||[]).map(x=>[x.name,x]),
    ...Object.entries(portraitStyles).map(([name,style])=>[name,{name,style}])
  ])].map(([,choice])=>choice);
  const payload={app:'blue-lock-neo-portraits',version:1,exportedAt:new Date().toISOString(),images,choices};
  if(window.BlueLockAndroid?.saveJson){window.BlueLockAndroid.saveJson('blue-lock-retratos-backup.json',JSON.stringify(payload));}
  else{
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='blue-lock-retratos-backup.json';document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  return images.length;
}
async function importPortraitBackup(file){
  if(!file||file.size>30*1024*1024)throw Error('Backup inválido ou maior que 30 MB.');
  const backup=JSON.parse(await file.text());
  if(backup?.app!=='blue-lock-neo-portraits'||!Array.isArray(backup.images))throw Error('Arquivo de backup de retratos inválido.');
  let count=0;
  for(const rec of backup.images){
    if(!rec||!['custom','manga'].includes(rec.type)||typeof rec.name!=='string'||rec.name.length>120)continue;
    await savePortraitImage(rec.type,rec.name,rec.data);count++;
  }
  for(const choice of backup.choices||[]){
    if(!choice?.name||typeof choice.style!=='string')continue;
    portraitStyles[choice.name]=choice.style;
    await rememberPortraitChoice(choice.name,choice.style);
  }
  if(!(backup.choices||[]).length){
    for(const rec of backup.images){if(rec?.name&&['custom','manga'].includes(rec.type)){
      portraitStyles[rec.name]=rec.type;
      await rememberPortraitChoice(rec.name,rec.type);
    }}
  }
  try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}
  refreshPortraits();return count;
}

const avatarCache=Object.create(null);
function portraitUrl(name,color='#3aa8ff'){
  const mode=portraitStyle(name);
  // O retrato do Kaiser foi enviado pelo próprio usuário. Uma foto customizada
  // posterior continua tendo prioridade sobre esta imagem embarcada.
  if(name==='Michael Kaiser'&&!['custom','manga'].includes(mode))return 'assets/kaiser-retrato-enviado.jpg';
  if(mode==='bundled'&&BUNDLED_PORTRAITS[name])return BUNDLED_PORTRAITS[name];
  if(mode==='premium')return BUNDLED_PORTRAITS[name]||ORIGINAL_ART[name]||portraitIdentity(name,color);
  if(mode==='official'&&OFFICIAL_MANGA[name])return OFFICIAL_MANGA[name].image;
  if(mode==='wiki'&&WIKI_PORTRAITS[name])return WIKI_PORTRAITS[name].image;
  if(mode==='original'&&ORIGINAL_ART[name])return ORIGINAL_ART[name];
  if(mode==='manga'&&hasManga(name))return mangaPortraits[name];
  if(mode==='custom'&&typeof customPortraits[name]==='string'&&/^(data:image\/|blob:)/.test(customPortraits[name]))return customPortraits[name];
  return BUNDLED_PORTRAITS[name]||portraitIdentity(name,color);
}
// Exibir primeiro a identificação neutra. Carregar somente imagens com arquivo identificado.
function remotePortraitCandidates(name){
 const mode=portraitStyle(name),o=OFFICIAL_MANGA[name]?.image,w=WIKI_PORTRAITS[name]?.image;
 return [...new Set((mode==='official'?[o,w]:mode==='wiki'?[w,o]:[]).filter(Boolean))];
}
function makePortraitImage(name,color){
 const result=new Image(),url=portraitUrl(name,color),fallback=BUNDLED_PORTRAITS[name]||ORIGINAL_ART[name]||portraitIdentity(name,color);
 result.src=url.startsWith('http')?fallback:url;
 const sources=remotePortraitCandidates(name);let pos=0;
 const retry=()=>{if(pos>=sources.length)return;
   const candidate=sources[pos++],photo=new Image();photo.referrerPolicy='no-referrer';
   photo.onload=()=>{if(photo.naturalWidth>=96&&photo.naturalHeight>=96&&remotePortraitCandidates(name).includes(candidate))result.src=candidate;else retry();};
   photo.onerror=retry;photo.src=candidate;
 };retry();
 result.onerror=()=>{result.onerror=null;result.src=fallback;};return result;
}
function portrait(name,t,cls='mini-avatar'){
 const fallback=BUNDLED_PORTRAITS[name]||ORIGINAL_ART[name]||portraitIdentity(name,t.color),url=portraitUrl(name,t.color),remote=url.startsWith('http')?url:'';
 const first=remote?fallback:url;
 return `<img class="${cls}" data-portrait="1" data-player-name="${encodeURIComponent(name)}" data-photo-loaded="${!remote&&url===BUNDLED_PORTRAITS[name]?'1':'0'}" data-fallback="${esc(fallback)}" ${remote?`data-online-src="${esc(remote)}"`:''} src="${esc(first)}" alt="${esc(name)}" loading="lazy" decoding="async">`;
}
window.NeoPortraitUI=Object.freeze({
 html:(name,club,cls='neo960-avatar')=>portrait(name,club,cls),
 url:(name,color)=>portraitUrl(name,color)
});
window.NeoPortraitManager=Object.freeze({
 saveFile:async(name,file)=>{
  if(typeof name!=='string'||!name.trim()||!(file instanceof Blob))throw Error('Imagem inválida.');
  if(file.size>15*1024*1024||!(file.type?.startsWith('image/')||/\.(png|jpe?g|webp)$/i.test(file.name||'')))throw Error('Escolha JPG, PNG ou WebP (até 15 MB).');
  // Copy pixels into a real JPEG Blob, not the transient content:// File from Android.
  const data=await fileToPortrait(file);
  await savePortraitImage('custom',name,data);
  refreshPortraits();
 },
 current:name=>portraitUrl(name)
});
// Load only the players who actually appear in the match, rather than requesting all 87 at launch.
const defaultAvatar=makePortraitImage('Jogador','#3aa8ff');
function cachedPortrait(name,color){return avatarCache[name]||(avatarCache[name]=makePortraitImage(name,color));}
function refreshPortraits(){
  for(const name of Object.keys(avatarCache))delete avatarCache[name];
  for(const render of [renderSquads,renderPortraitGallery,()=>{if(match)updateAll();}])
    try{render();}catch(error){console.warn('Imagem salva, painel não atualizado:',error);}
  window.dispatchEvent(new Event('neo:portraits-changed'));
}

document.addEventListener('error',e=>{const el=e.target;
 if(el?.dataset?.portrait==='1'&&el.dataset.fallback&&el.src!==el.dataset.fallback){
   const name=el.dataset.playerName?decodeURIComponent(el.dataset.playerName):'';
   if(name&&el.src.startsWith('http'))failedPortraits.add(name);
   el.src=el.dataset.fallback;
   if(el.classList.contains('portrait-card-photo')){
     const badge=el.closest('.portrait-card')?.querySelector('.gallery-tag');if(badge)badge.textContent='Foto indisponível · avatar reserva';
   }
 }
},true);
document.addEventListener('load',e=>{const el=e.target;if(el?.dataset?.portrait==='1'&&el.src.startsWith('http')&&Math.min(el.naturalWidth,el.naturalHeight)<96&&el.dataset.fallback){el.src=el.dataset.fallback;}},true);

function loadRemoteImageFor(el){
 if(!el.isConnected||el.dataset.remoteRequested)return;
 el.dataset.remoteRequested='1';
 const url=el.dataset.onlineSrc,name=el.dataset.playerName?decodeURIComponent(el.dataset.playerName):'';
 if(!url)return;
 const candidates=remotePortraitCandidates(name);let index=0;
 const attempt=()=>{
  if(!el.isConnected||el.dataset.onlineSrc!==url)return;
  if(index>=candidates.length){
    failedPortraits.add(name);
    const badge=el.closest('.portrait-card')?.querySelector('.gallery-tag');
    if(badge)badge.textContent='Fonte indisponível · nome identificado';
    return;
  }
  const candidate=candidates[index++],photo=new Image();photo.referrerPolicy='no-referrer';
  photo.onload=()=>{
   if(!el.isConnected||el.dataset.onlineSrc!==url)return;
   if(photo.naturalWidth<96||photo.naturalHeight<96){attempt();return;}
   el.src=candidate;el.dataset.photoLoaded='1';
   const badge=el.closest('.portrait-card')?.querySelector('.gallery-tag');
   if(badge)badge.textContent=candidate===OFFICIAL_MANGA[name]?.image?'✓ Editora · imagem carregada':'✓ Wiki · arquivo identificado';
  };
  photo.onerror=attempt;photo.src=candidate;
 };attempt();
}
const remotePortraitObserver=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){remotePortraitObserver.unobserve(entry.target);loadRemoteImageFor(entry.target);}
},{rootMargin:'130px'}):null;
function watchRemotePortraits(){
  for(const el of document.querySelectorAll('img[data-online-src]:not([data-image-watched])')){
    el.dataset.imageWatched='1';
    if(remotePortraitObserver)remotePortraitObserver.observe(el);else loadRemoteImageFor(el);
  }
}
if(typeof MutationObserver==='function')new MutationObserver(watchRemotePortraits).observe(document.body,{childList:true,subtree:true});
watchRemotePortraits();
let match=null,matchFixture=null,playing=false,replaying=false,replayIndex=0,replayFrame=0,activeTab='match',lastFrame=0,accumulator=0,roundView=1,season=loadSeason(),lastEventId=0,lastScore='0:0',audio=null,finishedRecorded=false,uiTimer=0,simBusy=false,cancelSim=false;
const canvas=$('pitch'),ctx=canvas.getContext('2d',{alpha:false});
let renderScale=1,actualGraphics='medium',requestedGraphics='',lastResampleKey='',autoResolutionFactor=1;
let fpsSampleAt=0,fpsSampleFrames=0,measuredFps=0,lastAutoAdjustment=0;
function configureCanvasResolution(){
  const chosen=$('graphicsLevel')?.value||'auto';
  const mobile=window.innerWidth<=750;
  const budget=Number(navigator.deviceMemory||4);
  const autoQuality=mobile||budget<=3?'low':'medium';
  actualGraphics=chosen==='auto'?autoQuality:chosen;
  const baseTarget=mobile?(actualGraphics==='low'?.52:actualGraphics==='medium'?.70:.90):
    actualGraphics==='low'?.70:actualGraphics==='medium'?.90:1;
  const target=chosen==='auto'?baseTarget*autoResolutionFactor:baseTarget;
  const key=mobile+'|'+chosen+'|'+target;
  if(key===lastResampleKey)return;
  lastResampleKey=key;renderScale=target;
  canvas.width=Math.round(PITCH.width*target);
  canvas.height=Math.round(PITCH.height*target);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality=actualGraphics==='high'?'high':'medium';
  updatePerformanceLabel();
}
function updatePerformanceLabel(){
 const tag=$('perfStatus');if(!tag)return;
 const chosen=$('graphicsLevel')?.value||'auto';
 tag.textContent=`⚡ ${chosen==='auto'?'Auto · ':''}${Math.round(renderScale*100)}%${measuredFps?' · '+measuredFps+' FPS':''}`;
 tag.title='Resolução interna e fluidez medida. O Ritmo TV é opcional e começa desligado.';
}
function monitorFrameRate(now){
 if(!playing&&!replaying){fpsSampleAt=now;fpsSampleFrames=0;return;}
 if(!fpsSampleAt)fpsSampleAt=now;
 fpsSampleFrames++;
 if(now-fpsSampleAt<2400)return;
 measuredFps=Math.max(1,Math.round(fpsSampleFrames*1000/(now-fpsSampleAt)));
 fpsSampleAt=now;fpsSampleFrames=0;
 const auto=$('graphicsLevel')?.value==='auto';
 if(auto&&now-lastAutoAdjustment>8500){
   const next=measuredFps<23?.72:measuredFps<34?.84:measuredFps>53?1:autoResolutionFactor;
   if(next!==autoResolutionFactor){
     autoResolutionFactor=next;lastResampleKey='';lastAutoAdjustment=now;
     configureCanvasResolution();
   }
 }
 updatePerformanceLabel();
}
function graphicsMode(){return actualGraphics||'medium';}

// Real 2D world-space broadcast camera. The pitch's physics dimensions never change.
let cameraFollow=true,cameraZoom=window.innerWidth<=650?1.18:1.58,cameraActualZoom=window.innerWidth<=650?1.18:1.58,cameraX=PITCH.cx,cameraY=PITCH.cy,lastCameraMatch=null;
function clampCam(v,min,max){return Math.max(min,Math.min(max,v));}
function cameraView(ball){
  if(!cameraFollow||!ball){cameraActualZoom=1;return {zoom:1,x:PITCH.cx,y:PITCH.cy};}
  const cinematic=$('cinematicCamera')?.checked!==false;
  // Camera cues come from the actual game engine; never from scripted or fake goals.
  const neoCue=!replaying?window.NeoMatchPulseV240?.cameraCue?.(match):null;
  const speed=Math.hypot(ball.vx||0,ball.vy||0);
  const fx=match?.skillEffects?.slice(-1)[0];
  const activeSkill=!!fx&&match.time>=fx.start&&match.time<fx.until&&
    (ball.owner?.name===fx.player||Math.hypot(ball.x-fx.x,ball.y-fx.y)<210);
  // Wider framing for aerial balls/long shots, tighter for skills near the ball.
  let zoomTarget=cameraZoom;
  if(cinematic){
    if(ball.mode==='air'||(ball.mode==='pass'&&speed>400))zoomTarget-=.18;
    if(ball.mode==='shot')zoomTarget-=.14;
    if(activeSkill)zoomTarget+=.08;
    if(neoCue?.kind==='shot')zoomTarget-=.055;
    if(neoCue?.kind==='skill')zoomTarget+=.045;
    if(ball.owner&&Math.abs(ball.x-(ball.owner.side===0?PITCH.right:PITCH.left))<410)zoomTarget+=.03;
  }
  zoomTarget=clampCam(zoomTarget,1.08,2.75);
  cameraActualZoom+=(zoomTarget-cameraActualZoom)*(cinematic?.10:.29);
  const zoom=cameraActualZoom,halfW=PITCH.width/(2*zoom),halfH=PITCH.height/(2*zoom);
  const directionalLead=ball.owner?(ball.owner.side===0?92:-92):clampCam((ball.vx||0)*.24,-155,155);
  const focal=neoCue?.kind==='skill'&&Number.isFinite(neoCue.x)&&Number.isFinite(neoCue.y)?neoCue:ball;
  const targetX=clampCam(focal.x+(cinematic?directionalLead:directionalLead*.46),halfW,PITCH.width-halfW);
  const targetY=clampCam(focal.y+(ball.vy||0)*(cinematic?.10:.035),halfH,PITCH.height-halfH);
  if(lastCameraMatch!==match){cameraX=targetX;cameraY=targetY;cameraActualZoom=zoomTarget;lastCameraMatch=match;}
  const smooth=cinematic?.087:.15;
  cameraX+=(targetX-cameraX)*smooth;cameraY+=(targetY-cameraY)*smooth;
  return {zoom,x:cameraX,y:cameraY};
}
function worldToScreen(x,y){const z=cameraFollow?cameraActualZoom:1;return {x:(x-cameraX)*z+PITCH.cx,y:(y-cameraY)*z+PITCH.cy};}
function showCameraHud(){
  if(!$('zoomValue'))return;
  $('zoomValue').textContent=cameraFollow?`${cameraZoom.toFixed(1)}×`:'1×';
  if($('countryClubs')&&match)$('countryClubs').textContent=`${COUNTRY_KITS[match.teams[0].id]?.flag||''} ${match.teams[0].short} × ${COUNTRY_KITS[match.teams[1].id]?.flag||''} ${match.teams[1].short}`;
  $('cameraMode').textContent=cameraFollow?'🎥 Seguindo':'🗺️ Campo todo';
  $('cameraMode').setAttribute('aria-pressed',String(cameraFollow));
  $('zoomMinus').disabled=!cameraFollow||cameraZoom<=1.05;
  $('zoomPlus').disabled=!cameraFollow||cameraZoom>=2.7;
}

function loadSeason(){
  try{
    const saved=JSON.parse(localStorage.getItem('neo-season-v2'));
    if(saved?.schema===2&&[10,20,30].includes(saved.rounds?.length)){
      if(saved.career?.bidVersion!==E.Progression.BID_VERSION||saved.career?.masterBidVersion!==1){
        try{
          // Restore earned regular and Master Striker offers ONLY from recorded matches.
          // Never edit scores, player portraits, abilities or match reports.
          if(saved.career?.bidVersion!==E.Progression.BID_VERSION)E.Progression.reconcileBids(saved);
          if(saved.career?.masterBidVersion!==1)E.Progression.reconcileMasterBids(saved);
          localStorage.setItem('neo-season-v2',JSON.stringify(saved));
        }catch(error){console.warn('Lances recalculados em memória; save original preservado:',error);}
      }
      return saved;
    }
  }catch(error){console.warn('Falha ao recuperar temporada anterior:',error);}
  try{const old=JSON.parse(localStorage.getItem('neo-season-v1'));const migrated=E.migrateLegacySeason(old);if(migrated){localStorage.setItem('neo-season-v2',JSON.stringify(migrated));return migrated;}}catch(e){}
  return E.createSchedule();
}
function saveSeason(){
  try{localStorage.setItem('neo-season-v2',JSON.stringify(season));return true;}
  catch(e){console.warn('Não foi possível salvar a liga',e);
    const warning=$('saveWarning')||$('matchBanner');
    if(warning)warning.textContent='⚠️ Armazenamento do navegador cheio: a última partida ainda não foi gravada. Exporte ou libere espaço antes de fechar.';
    return false;
  }
}
function team(id){return E.teamById(id);}
function currentRound(){return season.rounds.find(r=>r.games.some(f=>!f.result))||null;}
function setTab(id){
 if(id!=='match'&&playing&&!match?.finished){
   playing=false;accumulator=0;lastFrame=0;
   if($('play'))$('play').textContent='▶ Continuar';
   if($('matchBanner'))$('matchBanner').textContent='⏸️ A partida foi pausada automaticamente enquanto você explora outros painéis. Retorne e toque em Continuar.';
 }
 activeTab=id;document.querySelectorAll('.tab-content').forEach(s=>s.classList.toggle('hidden',s.id!==id));document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));if(id==='league')renderLeague();if(id==='stats')renderStats();if(id==='records')renderRecords();if(id==='squads')renderSquads();if(id==='gallery')renderPortraitGallery();if(id==='ranking')renderCareerRanking();if(id==='arsenal')renderArsenal();}
function sound(kind){if(!$('sound').checked)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audio=audio||new C();if(audio.state==='suspended')audio.resume();const now=audio.currentTime,notes=kind==='goal'?[523,659,784]:kind==='save'?[380,280]:[650,610];notes.forEach((freq,i)=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.type=kind==='goal'?'sine':'triangle';osc.frequency.setValueAtTime(freq,now+i*.13);gain.gain.setValueAtTime(0,now+i*.13);gain.gain.linearRampToValueAtTime(.065,now+i*.13+.02);gain.gain.exponentialRampToValueAtTime(.001,now+i*.13+.12);osc.connect(gain);gain.connect(audio.destination);osc.start(now+i*.13);osc.stop(now+i*.13+.14);});}catch(e){/* audio optional */}}

const GAMEPLAN_FIELDS=['gameplayPreset','weatherSetting','pressHome','pressAway','widthHome','widthAway','buildHome','buildAway','homeTactic','awayTactic','crossStyleHome','crossStyleAway','setPieceHome','setPieceAway'];
function setGameplanControls(){
  const auto=$('autoGameplan').checked;
  for(const id of GAMEPLAN_FIELDS){$(id).disabled=auto;}
  $('rollGameplan').disabled=!auto;
  $('autoGameplanHint').textContent=auto?'A cada jogo, dois planos táticos diferentes são sorteados automaticamente.':'Modo manual ativado: ajuste as opções abaixo apenas se quiser.';
}
function syncGameplanSelectors(){
  if(!match)return;
  $('gameplayPreset').value=match.gameplayPreset;$('weatherSetting').value=match.weather;
  for(const [id,field,index] of [['pressHome','pressing',0],['pressAway','pressing',1],['widthHome','attackWidth',0],['widthAway','attackWidth',1],['buildHome','buildUp',0],['buildAway','buildUp',1]])$(id).value=match[field][index];
  for(const [id,values,index] of [['homeTactic',match.tactics,0],['awayTactic',match.tactics,1],['crossStyleHome',match.crossPreference,0],['crossStyleAway',match.crossPreference,1],['setPieceHome',match.setPieceStyle,0],['setPieceAway',match.setPieceStyle,1]])$(id).value=values[index];
  setGameplanControls();
  const names=match.planNames||['Personalizado','Personalizado'];
  $('gameplanDraw').innerHTML=match.autoGameplan
    ? `<strong>🎲 SORTEIO DA PARTIDA</strong><div class="drawn-team"><b>${esc(match.teams[0].short)}</b><span>${esc(names[0])}</span></div><div class="drawn-team"><b>${esc(match.teams[1].short)}</b><span>${esc(names[1])}</span></div><small>${match.gameplayPreset==='fast'?'⚡ Competitivo':'⚽ Autêntico'} · ${match.weather==='rain'?'🌧️ Chuva':match.weather==='wind'?'💨 Vento':'☀️ Tempo seco'}</small>`
    : '<strong>🎮 MODO MANUAL</strong><small>Você controla o plano de jogo de cada clube.</small>';
}
function applyManualGameplan(){
  if(!match)return;
  match.gameplayPreset=$('gameplayPreset').value;match.weather=$('weatherSetting').value;
  match.pressing=[$('pressHome').value,$('pressAway').value];
  match.attackWidth=[$('widthHome').value,$('widthAway').value];
  match.buildUp=[$('buildHome').value,$('buildAway').value];
  match.tactics=[$('homeTactic').value,$('awayTactic').value];
  match.crossPreference=[$('crossStyleHome').value,$('crossStyleAway').value];
  match.setPieceStyle=[$('setPieceHome').value,$('setPieceAway').value];
  match.coachLocked=[true,true];match.autoGameplan=false;match.planNames=['Personalizado','Personalizado'];
}

function prepare(homeId=$('home').value,awayId=$('away').value,fixture=null){
  if(homeId===awayId){alert('Escolha duas equipes diferentes.');return;}
  playing=false;replaying=false;replayIndex=0;replayFrame=0;lastCommentaryId=null;renderReplayDirector();accumulator=0;lastFrame=0;lastEventId=0;lastCameraMatch=null;finishedRecorded=false;lastHudTeamsKey='';lastGoalHudKey='';lastSkillHudKey='';lastHeavyUiAt=0;lastEgoUiAt=0;lastRunsUiAt=0;lastUiMatch=null;matchFixture=fixture;entranceShown=false;lastBroadcastGoalCount=0;const intro=$('teamIntro');if(intro){intro.classList.remove('show');intro.innerHTML='';}
  match=new Match(homeId,awayId,Math.floor(Math.random()*0xffffffff),E.Progression.ensure(season),season);
  stageState={match:null,key:'',lastKey:'',start:0,duration:0,event:null};lastBroadcastDangerAt=-1e6;
  if($('autoGameplan').checked)match.rollGameplan();
  else applyManualGameplan();
  $('fcHomeName').textContent=match.teams[0].short;$('fcAwayName').textContent=match.teams[1].short;
  $('play').textContent='▶ Começar';$('replay').disabled=true;$('home').value=homeId;$('away').value=awayId;
  $('homeTacticLabel').textContent=match.teams[0].name;$('awayTacticLabel').textContent=match.teams[1].name;const labels=document.querySelectorAll('.sp-tactic-grid label');if(labels.length===2){labels[0].firstChild.textContent=match.teams[0].short;labels[1].firstChild.textContent=match.teams[1].short;}
  $('autoSubs').checked=true;$('autoCoach').checked=true;syncGameplanSelectors();
  $('tacticsSummary').textContent=`${match.teams[0].name}: ${styleDescription(match.teams[0])}. ${match.teams[1].name}: ${styleDescription(match.teams[1])}. ${match.autoGameplan?'🎲 Táticas sorteadas automaticamente.':'🎮 Táticas manuais.'}`;
  $('mvp').textContent='A partida ainda não terminou.';
  $('matchPreview').classList.remove('hidden');$('matchResultCard').classList.add('hidden');
  $('previewHome').innerHTML=`${teamArt(match.teams[0],'club-art-preview')}<strong>${esc(match.teams[0].name)}</strong><small>${esc(match.teams[0].formationName)} · ${esc(styleDescription(match.teams[0]))}</small>`;
  $('previewAway').innerHTML=`${teamArt(match.teams[1],'club-art-preview')}<strong>${esc(match.teams[1].name)}</strong><small>${esc(match.teams[1].formationName)} · ${esc(styleDescription(match.teams[1]))}</small>`;
  $('previewNote').textContent=match.autoGameplan?`🎲 Planos sorteados: ${match.teams[0].short} — ${match.planNames[0]} · ${match.teams[1].short} — ${match.planNames[1]}.`:'Escalações e plano manual prontos para o apito.';

  $('matchBanner').textContent=fixture?`📅 Partida oficial da rodada ${season.rounds.find(r=>r.games.includes(fixture))?.round||'?'} — resultado será salvo no campeonato.`:'Escolha a velocidade e acompanhe as 22 bolinhas jogando. No modo 1×, a partida dura aproximadamente 5 minutos.';
  $('abilities').innerHTML=match.players.filter(p=>p.i===0||p.i>=7||E.Abilities.forPlayer(p.name)).map(p=>{
    const career=season.career?.players?.[p.name+'|'+match.teams[p.side].id];
    const all=E.Abilities.available(p.name,p.role,p.i,career);
    return `<div class="skill-item"><div class="skill-name"><span style="color:${match.teams[p.side].color}">●</span> ${esc(p.name)} <small>${all.length} armas</small></div><div class="skill-shortlist">${all.filter(x=>x.owner||x.id===E.Abilities.DEFAULTS[p.name]).slice(0,3).map(x=>`<span>✦ ${esc(x.label)}</span>`).join('')||'<span>Técnicas de equipe</span>'}</div><button type="button" class="arsenal-open-mini" data-open-player-arsenal="${encodeURIComponent(p.name)}">Ver arsenal completo</button></div>`;
  }).join('');
  updateAll();draw();
}
function styleDescription(t){return ({build:'construção paciente',dribble:'dribles e criatividade',pace:'velocidade pelas pontas',counter:'contra-ataques rápidos',defend:'defesa compacta'})[t.style]||'equilibrado';}
function crestLetters(t){return esc(t.crest||t.short.replace(/[^A-Z]/g,'').slice(0,2)||t.name.slice(0,2).toUpperCase());}
function crest(t,cls=''){const url=TEAM_LOGO_PATHS[t?.id];return url?'<span class="crest neo-club-crest '+esc(cls)+'"><img class="neo-club-crest-img" src="'+url+'" alt="'+esc(t?.name||'Clube')+'" loading="lazy"></span>':'<span class="crest '+esc(cls)+'" style="--crest:'+esc(t.color)+';--crest-dark:'+esc(t.dark)+';--crest-accent:'+esc(t.accent||t.color)+'">'+crestLetters(t)+'</span>';}
function roleList(t){return (t.formation||E.DEFAULT_FORMATION||[]).map(v=>v.role);}
function phaseLabel(k){return ({'build':'organização ofensiva','attack':'ataque posicional','transition-attack':'transição ofensiva','block':'organização defensiva','transition-defense':'transição defensiva'}[k]||'jogo');}
const RUN_LABELS=Object.freeze({'byline':'corrida à linha de fundo','overlap':'ultrapassagem pela linha','underlap':'infiltração por dentro','box':'chegada à área','third-man':'terceiro homem','diagonal':'diagonal em profundidade','channel':'ataque ao corredor','check':'apoio curto','far-post':'chegada ao segundo pau','cutback':'opção de passe para trás','support':'apoio no triângulo','half-space':'chegada ao meio-espaço','blindside':'ataque nas costas','decoy':'arrasta defensor','drop-off':'falso nove recuando','inside-cut':'cortando da ponta para o centro','late-box':'meia chegando de trás'});
function runText(run){return RUN_LABELS[run?.type]||'desmarque';}


function timeText(){const n=Math.round(match.time);const firstEnd=match?.firstHalfEnd||45*60;const fullEnd=match?.fullTimeEnd||90*60;if(n>=90*60&&!match.finished&&n<fullEnd)return `90+${Math.max(1,Math.ceil((n-90*60)/60))}`;if(match.finished&&fullEnd>90*60&&n>=90*60)return `90+${Math.max(1,Math.ceil((n-90*60)/60))}`;if(n>=45*60&&n<firstEnd)return `45+${Math.max(1,Math.ceil((n-45*60)/60))}`;const m=Math.floor(n/60),sec=n%60;return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
function updateAll(){if(!match)return;
  const [a,b]=match.teams;
  $('homeLabel').textContent=a.short;$('awayLabel').textContent=b.short;
  const teamsKey=a.id+'-'+b.id;
  if(teamsKey!==lastHudTeamsKey){
    $('homeDot').className='team-dot crest';$('awayDot').className='team-dot crest';
    $('homeDot').style.setProperty('--crest',a.color);$('homeDot').style.setProperty('--crest-dark',a.dark);$('homeDot').style.setProperty('--crest-accent',a.accent||a.color);$('homeDot').innerHTML=teamArt(a,'club-art-mini');
    $('awayDot').style.setProperty('--crest',b.color);$('awayDot').style.setProperty('--crest-dark',b.dark);$('awayDot').style.setProperty('--crest-accent',b.accent||b.color);$('awayDot').innerHTML=teamArt(b,'club-art-mini');lastHudTeamsKey=teamsKey;
  }
  setIfChanged($('score'),`${match.score[0]} <em>:</em> ${match.score[1]}`);
  renderScorerBoard();
  $('clock').textContent=timeText();
  const now=performance.now(),fresh=lastUiMatch!==match;
  if(fresh){lastUiMatch=match;lastEgoUiAt=0;lastHeavyUiAt=0;lastRunsUiAt=0;}
  const heavyNow=fresh||now-lastHeavyUiAt>=1400||match.finished;
  const egoNow=fresh||now-lastEgoUiAt>=1200||match.finished;
  if(egoNow){lastEgoUiAt=now;renderEgoLive();renderMastersLive();renderLiveArsenal();renderLiveDuel();}
  const ev=match.events?.[0];
  if($('tvEventText'))$('tvEventText').textContent=ev?`${ev.minute}' ${ev.text}`:'Apito inicial · Os dois times entram em campo';
  if($('tvPlanHome'))$('tvPlanHome').textContent=match.planNames?.[0]||'Equilibrado';
  if($('tvPlanAway'))$('tvPlanAway').textContent=match.planNames?.[1]||'Equilibrado';
  if($('tvInfoBar'))$('tvInfoBar').style.setProperty('--side',match.ball.owner?.side===0?'#42b9ff':match.ball.owner?.side===1?'#daacff':'#ffd36e');
  const halfLabel=match.phase==='halftime'?'INTERVALO':match.half===2?'2º TEMPO':'1º TEMPO';
  $('halfChip').textContent=halfLabel;const halfOverlay=$('halfOverlay');halfOverlay.classList.toggle('hidden',match.phase!=='halftime');
  if(match.phase==='halftime')$('halfScore').textContent=`${match.teams[0].short} ${match.score[0]} × ${match.score[1]} ${match.teams[1].short}`;
  $('fcModeStatus').textContent=`${match.gameplayPreset==='fast'?'⚡ Competitivo':'⚽ Autêntico'} · ${match.weather==='rain'?'🌧️ Chuva':match.weather==='wind'?'💨 Vento':'☀️ Tempo seco'} · ${halfLabel} · Acréscimos: +${Math.round((match.half===1?match.addedTimeFirst:match.addedTimeSecond)/60)}'`;
  const phase=match.finished?'FIM DE JOGO':replaying?'REPLAY':match.phase==='goal'?'GOOOOL!':match.phase==='halftime'?'INTERVALO':playing?'AO VIVO':'PAUSADO';
  $('liveBadge').textContent=phase;$('liveBadge').className='live-badge'+(match.phase==='goal'?' goal':playing?' live':'');
  $('goalOverlay').classList.toggle('hidden',match.phase!=='goal'||replaying);
  const rs=match.restart;const sp=$('setPieceStatus');if(sp){sp.classList.toggle('hidden',!(rs&&match.phase==='restart'));if(rs)sp.innerHTML=`<span class="sp-whistle">${rs.kind==='penalty'?'🎯':rs.kind==='corner'?'🚩':rs.kind==='freeKick'?'⚽':'↪️'}</span><span><b>${esc(rs.reason.toUpperCase())}</b><small>${esc(match.teams[rs.side].short)} · ${esc(rs.takerName||'Preparando a cobrança')}</small></span>`;}

  if(match.phase==='goal'&&match.goalRecords.length){const g=match.goalRecords[match.goalRecords.length-1],club=match.teams[g.side];
    if(lastGoalHudKey!==String(match.goalRecords.length)+'|'+match.score.join('-')){lastGoalHudKey=String(match.goalRecords.length)+'|'+match.score.join('-');$('goalOverlay').innerHTML=`<div class="goal-pop-title">${g.legendary?'GOLAÇO LENDÁRIO!':'GOOOOOOL!'}</div><div class="celebrate-title">${esc(g.celebration?.label||'Comemoração em equipe')} ✦</div><div class="goal-pop-category">${esc(goalStyleText(g.goalType))}</div><div class="goal-pop-player">${portrait(g.scorer,club,'goal-pop-avatar')}<div><strong>${esc(g.scorer)}</strong><small>${esc(club.name)} · ${g.minute}' ${g.assister?' · 🎯 '+esc(g.assister):''}</small></div></div><div class="goal-pop-score">${match.score[0]} <span>×</span> ${match.score[1]}</div>`;}
  }

  const lastSkill=match.lastSkill,skillVisible=lastSkill&&playing&&match.time-lastSkill.time<27;
  $('skillToast').classList.toggle('hidden',!skillVisible);
  if(skillVisible&&lastSkillHudKey!==String(lastSkill.id||lastSkill.label)+'|'+lastSkill.time){lastSkillHudKey=String(lastSkill.id||lastSkill.label)+'|'+lastSkill.time;const sk=E.Abilities.get(lastSkill.id);
    const style=skillVisual(sk);
    $('skillToast').innerHTML=`<i class="skill-mini-icon" style="--skill-accent:${style.color}" aria-hidden="true">${style.icon}</i><span class="skill-activity-name">${esc(lastSkill.name)}</span><b class="skill-activity-label">${esc(lastSkill.label)}</b><small class="skill-activity-type">${style.label}</small>`;
    $('skillToast').style.setProperty('--skill-accent',style.color);
  }
  const owner=match.ball.owner;$('ballOwner').textContent=owner?`${owner.name} · ${match.teams[owner.side].short}`:match.ball.mode==='shot'?'⚽ FINALIZAÇÃO':match.ball.mode==='pass'?'⚪ Bola em movimento':'⚽ Bola livre';
  const [ph0,ph1]=match.currentPhases();
  $('tacticsSummary').innerHTML=`<strong>${match.teams[0].short}</strong>: ${phaseLabel(ph0)} · <strong>${match.teams[1].short}</strong>: ${phaseLabel(ph1)}.`;
  if(!match.finished && !replaying){$('matchBanner').textContent=(matchFixture?`📅 Partida oficial da rodada ${season.rounds.find(r=>r.games.includes(matchFixture))?.round||'?'} — `:'')+`${match.teams[0].short} em ${phaseLabel(ph0)} · ${match.teams[1].short} em ${phaseLabel(ph1)}.`;}
  const onRuns=match.players.filter(p=>p.run&&p!==match.ball.owner).sort((a,b)=>b.run.started-a.run.started).slice(0,4);
  if(heavyNow){$('runFeed').innerHTML=`<span class="run-feed-title">🏃 MOVIMENTAÇÃO ATIVA</span>${onRuns.length?onRuns.map(p=>`<span class="run-feed-chip"><i style="background:${match.teams[p.side].color}"></i><b>${esc(p.name.split(' ').slice(-1)[0])}</b><small>${esc(runText(p.run))}</small></span>`).join(''):'<span class="run-feed-empty">Aguardando infiltrações e ultrapassagens...</span>'}`;}
  renderEvents();if(heavyNow){lastHeavyUiAt=now;renderCoachPanel();renderPulse();renderModernTactics();renderMoments();renderSetPieces();if(document.getElementById('matchStats')?.getClientRects().length)renderMatchStats();if(document.getElementById('shotMap')?.getClientRects().length)drawShotMap();if(activeTab==='records')renderRecords();}
  if(match.finished){if(match._resultUiRendered)return;match._resultUiRendered=true;$('play').disabled=true;$('play').textContent='🏁 Encerrado';$('matchBanner').textContent=`🏁 Fim de jogo! ${a.name} ${match.score[0]} × ${match.score[1]} ${b.name}.`;
    const best=[...match.retiredPlayers,...match.players].sort((x,y)=>y.rating-x.rating||y.goals-x.goals)[0];
    $('matchPreview').classList.add('hidden');$('matchResultCard').classList.remove('hidden');
    const goalrows=(match.goalRecords||[]).slice().sort((a,b)=>a.minute-b.minute);
    const subSummary=match.subRecords.length?`<div class="result-subs">🔄 ${match.subRecords.length} substituições · ↔️ ${match.stats.switches[0]+match.stats.switches[1]} inversões de lado</div>`:'';
    $('matchResultCard').innerHTML=`<div class="result-title">🏁 FIM DE JOGO · MELHORES MOMENTOS</div><div class="result-score">${teamArt(a,'club-art-result')}<span>${match.score[0]} <em>×</em> ${match.score[1]}</span>${teamArt(b,'club-art-result')}</div><div class="result-teams"><span>${esc(a.short)}</span><span>${esc(b.short)}</span></div><div class="result-mvp">⭐ Melhor em campo: ${portrait(best.name,match.teams[best.side])} <strong>${esc(best.name)}</strong> · ${px(best.rating,1)}</div><div class="result-goals">${goalrows.length?goalrows.map(g=>`<div><strong>${g.minute}'</strong> ${g.legendary?'🌟':'⚽'} ${esc(g.scorer)} <span>(${esc(match.teams[g.side].short)})</span>${g.assister?`<small>🎯 ${esc(g.assister)}</small>`:''}</div>`).join(''):'Nenhum gol nesta partida.'}</div>${subSummary}`;
    $('mvp').innerHTML=`<strong style="font-size:16px">⭐ ${esc(best.name)}</strong><div class="hint">${esc(match.teams[best.side].short)} · Nota ${px(best.rating,1)} · ${best.goals} gol(s) · ${best.assists} assistência(s)</div>`;
    if(matchFixture&&!finishedRecorded&&!matchFixture.result){E.recordFixture(season,matchFixture,match);saveSeason();finishedRecorded=true;}
  }else{$('play').disabled=false;}
  $('replay').disabled=!match.lastGoal;
  syncFullscreenUI();
}

// Duelo de bola e ameaça: leituras reais do motor, sem criar gols, chances ou eventos falsos.
function renderLiveDuel(){
  const node=$('liveDuel');if(!node||!match)return;
  const owner=match.ball?.owner;
  if(!owner){node.innerHTML='<span class="duel-icon">⚪</span><span>Bola em disputa</span><small>Os times buscam a posse</small>';node.dataset.level='0';return;}
  const others=match.players.filter(p=>p.side!==owner.side);
  let rival=null,dist=Infinity;
  for(const p of others){const d=Math.hypot(p.x-owner.x,p.y-owner.y);if(d<dist){dist=d;rival=p;}}
  const max=PITCH.right-PITCH.left;const forward=owner.side===0?owner.x-PITCH.left:PITCH.right-owner.x;
  const zone=forward/max;const inArea=zone>.82&&Math.abs(owner.y-PITCH.cy)<PITCH.boxHalf;
  const danger=inArea?'NA ÁREA':zone>.72?'ATAQUE PERIGOSO':zone>.48?'AVANÇANDO':'CONSTRUINDO';
  const duel=dist<85?'DUELO DIRETO':dist<155?'SOB PRESSÃO':'COM ESPAÇO';
  const level=inArea?3:zone>.72?2:zone>.48?1:0;
  const current=owner.name+'|'+(rival?.name||'')+'|'+danger+'|'+duel;
  if(node.dataset.state===current)return;node.dataset.state=current;node.dataset.level=String(level);
  node.innerHTML=`<span class="duel-icon" aria-hidden="true">⚔</span><span class="duel-main"><b>${esc(owner.name)}</b><small>${esc(match.teams[owner.side].short)} · ${danger}</small></span><span class="duel-versus">VS</span><span class="duel-rival"><b>${esc(rival?.name||'Sem marcação')}</b><small>${duel}</small></span>`;
}
function renderMoments(){
  const node=$('specialMoments');if(!node||!match)return;
  const list=(match.specialMoments||[]).slice(0,8);
  node.innerHTML=list.length?list.map(m=>`<div class="special-moment ${esc(m.type)}"><span>${m.minute}'</span><strong>${esc(match.teams[m.side].short)}</strong><div>${esc(m.description)}</div></div>`).join(''):'<p class="hint">Duplas entrosadas, arrancadas individuais, defesas decisivas e golaços aparecerão aqui quando acontecerem de verdade.</p>';
}
function renderSetPieces(){
  if(!match||!$('setPieceFeed'))return;
  const recent=match.events.filter(e=>['corner','freeKick','penalty','throwIn','goalKick','foul','card','restart'].includes(e.type)).slice(0,7);
  $('setPieceFeed').innerHTML=recent.length?recent.map(e=>`<div class="setpiece-event"><strong>${e.minute}'</strong><span>${esc(e.text)}</span></div>`).join(''):'<div class="hint">Faltas, escanteios, laterais e pênaltis aparecerão aqui durante a partida.</div>';
}
function renderModernTactics(){
  if(!match||!$('modernHome'))return;
  const s=match.stats,tot=k=>(s[k]?.[0]||0)+(s[k]?.[1]||0);
  for(let side=0;side<2;side++){
    const id=side===0?'modernHome':'modernAway',label=match.modernPattern(side),node=$(id);
    if(node.textContent!==label){node.classList.remove('formation-shift');void node.offsetWidth;node.classList.add('formation-shift');}
    node.textContent=label;
    const plan=$(side===0?'modernHomePlan':'modernAwayPlan');
    plan.textContent=match.modernPrinciple(side);
  }
  $('modernInv').textContent=tot('invertedRuns');
  $('modernHalf').textContent=tot('halfSpaceRuns');
  $('modernBlind').textContent=tot('blindsideRuns');
}
function renderMatchStats(){const st=match.stats;
  const metrics=[['Entradas na área',st.boxEntries],['Chutes dentro da área',st.boxShots],['Chutes de longe',st.longShots],['Golaços especiais',st.legendaryGoals],['Tabelas finalizadas na área',st.boxCombinations],['Espalmadas dos goleiros',st.keeperParries],['Jogadas de união',st.unionPlays],['Arrancadas individuais',st.soloRuns],['Duelos defensivos vencidos',st.duelsWon],['Chutes bloqueados',st.shotBlocks],['Antecipações do goleiro',st.sweeperRecoveries],['Finalizações',st.shots],['Domínios difíceis',st.heavyTouches],['Recuperações na pressão',st.pressingRecoveries],['Pênaltis cobrados',st.penalties],['Pênaltis convertidos',st.penaltiesScored],['Faltas a favor',st.freeKicks],['Chutes de falta',st.directFreeKickShots],['Tiros de meta',st.goalKicks],['Laterais cobrados',st.throwIns],['Cartões vermelhos',st.redCards],['Vantagens',st.advantages],['Recuos punidos',st.backpasses],['8s do goleiro',st.keeperDelays],['Cabeceios',st.headers],['Dribles tentados',st.dribbles],['Dribles certos',st.dribblesWon],['Conduções com bola',st.carries],['Conduções progressivas',st.progressiveCarries],['Posse reciclada',st.recycles],['Bolas paradas ensaiadas',st.setPieceRoutines],['Fintas especiais',st.specialMoves],['Fintas bem-sucedidas',st.specialMovesWon],['Despertares de Flow',st.flowAwakenings],['Leituras avançadas',st.visionReads],['Mestres em campo',st.masterEntries],['Zagueiros no ataque',st.defenderAttacks],['Tabelas (1–2)',st.oneTwos],['Interceptações',st.interceptions],['No alvo',st.onTarget],['Posse de bola',null],['Passes certos',st.completed],['Passes tentados',st.passes],['Corridas sem bola',st.runs],['Inversões de lateral',st.invertedRuns],['Meio-espaço',st.halfSpaceRuns],['Corridas cegas',st.blindsideRuns],['Terceiro homem',st.thirdManRuns],['Pressões coordenadas',st.counterPressWaves],['Ultrapassagens',st.overlaps],['Infiltrações na área',st.boxRuns],['Cruzamentos',st.crosses],['Passes para trás na linha de fundo',st.cutbacks],['Cruzamentos rasteiros',st.crossLow],['Cruzamentos fortes',st.crossDriven],['Cruzamentos altos',st.crossHigh],['Disputas aéreas vencidas',st.aerialWins],['Passes em profundidade',st.throughBalls],['Inversões de jogo',st.switches],['Trocas de jogadores',st.substitutions],['Passes para finalização',st.keyPasses],['Defesas',st.saves],['Desarmes',st.tackles],['Faltas',st.fouls],['Impedimentos',st.offsides],['Escanteios',st.corners],['Cartões amarelos',st.yellows],['xG estimado',st.xg]];
  $('matchStats').innerHTML=metrics.map(([name,data])=>{
    let l,r;if(name==='Posse de bola'){const all=st.possession[0]+st.possession[1];l=all?Math.round(st.possession[0]/all*100):50;r=100-l;}
    else{l=data[0];r=data[1];}
    const lText=name==='Posse de bola'?l+'%':name==='xG estimado'?px(l,1):l;
    const rText=name==='Posse de bola'?r+'%':name==='xG estimado'?px(r,1):r;
    const total=Math.max(.001,l+r);
    return `<div class="stat-title">${name}</div><div class="stat-row"><strong>${lText}</strong><div class="stat-bars"><b style="width:${Math.max(0,l/total*100)}%;background:${match.teams[0].color}"></b><b style="width:${Math.max(0,r/total*100)}%;background:${match.teams[1].color}"></b></div><strong>${rText}</strong></div>`;
  }).join('');
}
function renderCoachPanel(){
 if(!match||!$('subFeed'))return;
 const subs=match.subRecords.slice(-6).reverse();
 const queued=match.pendingSubs.reduce((sum,sub)=>sum+(Array.isArray(sub)?sub.length:sub?1:0),0);
 $('subFeed').innerHTML=subs.length?subs.map(x=>`<div class="sub-row"><span class="sub-min">${x.minute}'</span><span><b>${esc(x.in)}</b> <small>entrou por ${esc(x.out)}</small></span><strong style="color:${match.teams[x.side].color}">${esc(match.teams[x.side].short)}</strong></div>`).join(''):'<span class="hint">Os técnicos ainda não fizeram alterações.</span>';
 const state=match.tactics.map((t,i)=>`${match.teams[i].short}: ${t==='attack'?'ataque':t==='defend'?'defesa':'equilibrado'}`).join(' · ');
 $('coachStatus').textContent=state+(queued?` · ${queued} troca(s) aguardando a próxima parada`:'');
  for(let i=0;i<2;i++){if(!match.coachLocked[i])$(i===0?'homeTactic':'awayTactic').value=match.tactics[i];}
}
function renderPulse(){
 if(!match||!$('pulseHome'))return;
 const minute=match.time/60,threat=[.5,.5];
 const recent=match.shotMap.filter(x=>minute-x.minute<=12&&minute-x.minute>=0);
 for(const x of recent)threat[x.side]+=(x.onTarget?3:1.5)+(x.goal?6:0);
 const b=match.ball,side=b.owner?.side??b.by?.side;
 if(side===0||side===1){const forward=match.progress(side,b.x);threat[side]+=0.8+Math.max(0,(forward-400)/400)*1.9;}
 const denom=threat[0]+threat[1];const pct=Math.round(threat[0]/denom*100);
 $('pulseHome').style.width=pct+'%';$('pulseAway').style.width=(100-pct)+'%';
 $('pulseStatus').textContent=minute<1?'Aquecendo o jogo...':pct>62?`${match.teams[0].short} pressiona`:pct<38?`${match.teams[1].short} pressiona`:'Jogo equilibrado';
}
function drawShotMap(){
 const c=$('shotMap');if(!c||!match)return;
 const g=c.getContext('2d'),W=c.width,H=c.height;g.clearRect(0,0,W,H);
 const pad=12,sw=W-pad*2,sh=H-pad*2;
 g.fillStyle='#155538';g.fillRect(0,0,W,H);
 for(let i=0;i<10;i++){g.fillStyle=i%2?'#0e613e':'#175639';g.fillRect(pad+i*sw/10,pad,sw/10+1,sh);}
 g.strokeStyle='#dbf9e4aa';g.lineWidth=1.3;g.strokeRect(pad,pad,sw,sh);
 // Keep the miniature pitch consistent with the physical field drawn in the match.
 const boxW=PITCH.boxDepth/(PITCH.right-PITCH.left)*sw;
 const boxHalf=PITCH.boxHalf/(PITCH.bottom-PITCH.top)*sh;
 const miniMidY=pad+sh/2;
 const miniRadius=Math.min(sw*(9.15/105),sh*(9.15/68));
 g.beginPath();g.moveTo(W/2,pad);g.lineTo(W/2,H-pad);g.stroke();
 g.strokeRect(pad,miniMidY-boxHalf,boxW,2*boxHalf);
 g.strokeRect(W-pad-boxW,miniMidY-boxHalf,boxW,2*boxHalf);
 g.beginPath();g.arc(W/2,miniMidY,miniRadius,0,Math.PI*2);g.stroke();
 let home=0,away=0;for(const sh0 of match.shotMap){
  const x=pad+(sh0.x-PITCH.left)/(PITCH.right-PITCH.left)*sw,y=pad+(sh0.y-PITCH.top)/(PITCH.bottom-PITCH.top)*sh;
  g.beginPath();g.arc(x,y,sh0.goal?6.1:sh0.onTarget?4.4:3.6,0,Math.PI*2);
  g.fillStyle=sh0.goal?'#ffdf77':match.teams[sh0.side].color;g.fill();
  g.lineWidth=sh0.goal?2.2:1;g.strokeStyle='#ffffffc9';g.stroke();
  if(sh0.side===0)home++;else away++;
 }
 $('shotLegend').innerHTML=`<span style="color:${match.teams[0].color}">● ${esc(match.teams[0].short)} ${home}</span> <span style="color:${match.teams[1].color}">● ${esc(match.teams[1].short)} ${away}</span> <span style="color:#ffdf77">● Gol</span>`;
}
// Narração contextual de eventos reais. Nenhum lance fictício é criado para preencher o feed.
function commentaryText(event){
 if(!event)return '🎙️ A bola vai rolar. Os craques estão prontos.';
 const text=event.text||'',id=Number(event.id)||0;
 const mood={goal:['GOOOOOOOL!','É REDE!','QUE MOMENTO!'],save:['DEFESA ABSURDA!','QUE REFLEXO!','O GOLEIRO SALVA!'],
   cross:['BOLA NA ÁREA!','CRUZAMENTO PERIGOSO!'],shot:['LÁ VEM BOMBA!','ARRISCOU!'],
   tackle:['QUE DUELO!','ROUBADA DE BOLA!'],skill:['EGO EM AÇÃO!','HABILIDADE DESPERTA!'],
   offside:['BANDEIRA LEVANTADA!'],foul:['PAROU O JOGO!'],start:['APITA O ÁRBITRO!']}[event.type];
 return `${mood?mood[id%mood.length]:'NA TRANSMISSÃO'} · ${text}`;
}
let lastCommentaryId=null;
function renderCommentary(){const node=$('commentaryTicker');if(!node||!match)return;
 const event=match.events?.[0]||null,key=event?.id??0;
 if(key===lastCommentaryId)return;lastCommentaryId=key;
 node.textContent=commentaryText(event);node.dataset.kind=event?.type||'idle';
 node.classList.remove('commentary-pop');void node.offsetWidth;node.classList.add('commentary-pop');
}
function renderEvents(){const el=$('events');if(!match.events.length){el.innerHTML='<p class="hint">Os lances vão aparecer aqui.</p>';return;}
  if(match.events[0].id===lastEventId)return;lastEventId=match.events[0].id;
  el.innerHTML=match.events.slice(0,45).map(e=>`<div class="event ${esc(e.type)}"><span class="minute">${e.minute}'</span><span>${esc(e.text)}</span></div>`).join('');
  $('eventCount').textContent=`${match.events.length} lances`;renderCommentary();
  const e=match.events[0];if(e.type==='goal')sound('goal');else if(e.type==='save')sound('save');
}
// v8.2 — Static grass/markings are rasterized ONCE, not redrawn 30 times/s.
let pitchBackground=null;
function drawPitchStatic(g){
  // v6.0.1: every marking is derived from the SAME dimensions used by match physics.
  // This also fixes the 270-degree bottom-right corner arc from v6.0.
  const {width:w,height:h,left:L,right:R,top:T,bottom:B,cx:X,cy:Y}=PITCH;
  const fieldWidth=R-L,fieldHeight=B-T;
  const depth=PITCH.boxDepth,half=PITCH.boxHalf,goal=PITCH.goalHalf;
  // Penalty box (16.5 m), goal box (5.5 m), spot (11 m) are proportional.
  const smallDepth=depth/3,smallHalf=half*(9.16/20.16);
  const penaltyDepth=depth*(11/16.5);
  const centerRadius=Math.min(fieldWidth*9.15/105,fieldHeight*9.15/68);
  const cornerRadius=fieldHeight/68;
  const line='#effff2dc';
  g.fillStyle='#155238';g.fillRect(0,0,w,h);
  for(let i=0;i<14;i++){
    g.fillStyle=i%2===0?'#1b6e45':'#20754a';
    g.fillRect(L+i*fieldWidth/14,T,fieldWidth/14+1,fieldHeight);
  }
  const shade=g.createLinearGradient(L,T,R,B);
  shade.addColorStop(0,'#021b0d22');shade.addColorStop(.5,'#ffffff02');shade.addColorStop(1,'#021b0d22');
  g.fillStyle=shade;g.fillRect(L,T,fieldWidth,fieldHeight);
  g.strokeStyle=line;g.lineWidth=2.1;
  // Draw the pitch border, halfway line, and both boxes as separate, closed paths.
  g.strokeRect(L,T,fieldWidth,fieldHeight);
  g.beginPath();g.moveTo(X,T);g.lineTo(X,B);g.stroke();
  for(const isLeft of [true,false]){
    const startX=isLeft?L:R-depth;
    const smallX=isLeft?L:R-smallDepth;
    g.strokeRect(startX,Y-half,depth,2*half);
    g.strokeRect(smallX,Y-smallHalf,smallDepth,2*smallHalf);
  }
  g.beginPath();g.arc(X,Y,centerRadius,0,Math.PI*2);g.stroke();
  g.fillStyle='#effff2';
  for(const [cx,cy] of [[X,Y],[L+penaltyDepth,Y],[R-penaltyDepth,Y]]){
    g.beginPath();g.arc(cx,cy,3.1,0,Math.PI*2);g.fill();
  }
  // Compute the precise angle where each penalty arc meets its penalty-box edge.
  const offset=depth-penaltyDepth;
  const opening=Math.acos(Math.max(-1,Math.min(1,offset/centerRadius)));
  g.beginPath();g.arc(L+penaltyDepth,Y,centerRadius,-opening,opening);g.stroke();
  g.beginPath();g.arc(R-penaltyDepth,Y,centerRadius,Math.PI-opening,Math.PI+opening);g.stroke();
  // Each corner gets a 90-degree quadrant, ALWAYS facing into the pitch.
  for(const [x,y,a0,a1] of [
    [L,T,0,Math.PI/2],
    [R,T,Math.PI/2,Math.PI],
    [R,B,Math.PI,3*Math.PI/2],
    [L,B,3*Math.PI/2,2*Math.PI]
  ]){g.beginPath();g.arc(x,y,cornerRadius,a0,a1);g.stroke();}
  // Goal nets remain OUTSIDE the touchline at the exact positions of the physics engine.
  g.fillStyle='#e8faff29';g.fillRect(L-23,Y-goal,23,goal*2);g.fillRect(R,Y-goal,23,goal*2);
  g.strokeStyle='#f5ffffd8';g.lineWidth=2.5;
  g.strokeRect(L-23,Y-goal,23,goal*2);g.strokeRect(R,Y-goal,23,goal*2);
  g.strokeStyle='#d9faff48';g.lineWidth=.8;
  for(let j=1;j<6;j++){
    const v=Y-goal+2*goal*j/6;
    g.beginPath();g.moveTo(L-23,v);g.lineTo(L,v);g.moveTo(R,v);g.lineTo(R+23,v);g.stroke();
  }
  g.textAlign='center';g.fillStyle='#e4fff622';g.font='900 17px system-ui';
  g.fillText('NEO EGOIST LEAGUE',X,h-18);
 }
function drawPitch(){
  if(!pitchBackground){
    pitchBackground=document.createElement('canvas');
    pitchBackground.width=PITCH.width;pitchBackground.height=PITCH.height;
    const backing=pitchBackground.getContext('2d',{alpha:false});
    drawPitchStatic(backing);
  }
  ctx.drawImage(pitchBackground,0,0,PITCH.width,PITCH.height);
  const {left:L,right:R,cy:Y,goalHalf:goal}=PITCH;
  if(match&&match.phase==='goal'&&match.lastGoal){
    const xx=match.lastGoal.side===0?R:L,power=match.goalFlash;
    ctx.save();ctx.strokeStyle=`rgba(255,241,160,${Math.min(.65,power*.36)})`;
    ctx.lineWidth=4;
    for(let i=0;i<3;i++){
      ctx.beginPath();ctx.ellipse(xx,Y,26+i*30+power*18,goal*.85+i*14,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
 }
// Team-country colors are painted on the player ring, keeping each portrait readable.
function paintCountryRing(ctx,x,y,r,clubId){
  const kit=COUNTRY_KITS[clubId];if(!kit)return;
  ctx.save();ctx.lineWidth=4.6;ctx.lineCap='butt';
  kit.colors.forEach((c,i)=>{ctx.beginPath();ctx.strokeStyle=c;ctx.arc(x,y,r+.8,-Math.PI/2+i*2*Math.PI/3,-Math.PI/2+(i+1)*2*Math.PI/3);ctx.stroke();});
  ctx.restore();
}
// Animated top-down athlete silhouette behind each original portrait. Actions come from the engine.
function drawAnimatedAthlete(p,x,y,r,video){
  if(!$('animatedPlayers')?.checked)return;
  const speed=Math.hypot(p.vx||0,p.vy||0),moving=speed>18&&!video;
  let kind='';
  if(!video&&match?.actionEffects){
    for(let i=match.actionEffects.length-1;i>=0;i--){const e=match.actionEffects[i];
      if(e.player===p.name&&e.side===p.side&&match.time>=e.start&&match.time<e.until){kind=e.kind;break;}}
  }
  const time=match?.time||0,celebrating=!video&&match?.phase==='goal'&&match.celebration?.scorer===p.name,step=moving?Math.sin(time*.16+p.id*1.7):0;
  const vx=p.vx||0,vy=p.vy||0,angle=Math.atan2(moving?vy:0,moving?vx:(p.side===0?1:-1));
  const kick=['shot','chip','volley','acro-shot','low-shot','tap-in','header'].includes(kind);
  const keeper=p.i===0&&kind.startsWith('keeper');
  const clash=kind==='duel'||kind==='block';
  const team=match.teams[p.side];
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.globalAlpha=.95;ctx.lineCap='round';ctx.lineJoin='round';
  // Small legs are visible without enlarging the face or adding a big overlay.
  for(let leg=0;leg<2;leg++){
    const sign=leg?1:-1,foot=kick&&leg===0?21:(10+(moving?step*sign*5:0));
    ctx.strokeStyle='#071421';ctx.lineWidth=5.5;ctx.beginPath();ctx.moveTo(-r*.32,sign*r*.56);ctx.lineTo(-r*.73-foot*.40,sign*(r*.67+foot*.28));ctx.stroke();
    ctx.strokeStyle=leg?'#e9f4ff':team.color;ctx.lineWidth=3.8;ctx.beginPath();ctx.moveTo(-r*.32,sign*r*.56);ctx.lineTo(-r*.73-foot*.40,sign*(r*.67+foot*.28));ctx.stroke();
    ctx.strokeStyle='#e7f6ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-r*.73-foot*.4,sign*(r*.67+foot*.28));ctx.lineTo(-r*.95-foot*.46,sign*(r*.67+foot*.28));ctx.stroke();
  }
  // Arm swing, forward lean during a sprint, reaching hands during saves.
  const swing=celebrating?20:keeper?15:clash?11:moving?step*4.8:0;
  for(let arm=0;arm<2;arm++){const sign=arm?1:-1;
    ctx.strokeStyle='#091b2e';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(r*.22,sign*r*.54);ctx.lineTo((celebrating?26:keeper?16:6)+swing*(celebrating?.20:1)*sign,sign*(celebrating?26:keeper?23:r*1.28));ctx.stroke();
    ctx.strokeStyle=team.color;ctx.lineWidth=4;ctx.stroke();
  }
  if(kick){ctx.strokeStyle='#fff2bc';ctx.lineWidth=1.7;ctx.globalAlpha=.80;
    ctx.beginPath();ctx.arc(r*.7,0,r+6,Math.PI*1.42,Math.PI*.37);ctx.stroke();}
  if(keeper){ctx.globalAlpha=.80;ctx.strokeStyle='#b9f5ff';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(10,0,27,14,0,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}

function drawPlayer(p,x,y,owner=false,video=false){
  const t=match.teams[p.side],isGk=p.i===0,r=isGk?16.3:14.4,look=avatarTheme(p.name,t.color);
  ctx.save();
  drawAnimatedAthlete(p,x,y,r,video);
  // shadow and outer team ring
  ctx.shadowColor='#0008';ctx.shadowBlur=5;
  ctx.beginPath();ctx.fillStyle=t.color;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  const ava=cachedPortrait(p.name,t.color);const imageOn=$('portraitsOnField')?.checked!==false;
  if(imageOn&&ava?.complete&&ava.naturalWidth>0){
    ctx.save();ctx.beginPath();ctx.arc(x,y,r-2.4,0,Math.PI*2);ctx.clip();
    ctx.drawImage(ava,x-r+2.4,y-r+2.4,2*r-4.8,2*r-4.8);ctx.restore();
  }else{ctx.beginPath();ctx.fillStyle=look.face;ctx.arc(x,y,r-3.2,0,Math.PI*2);ctx.fill();}

  // Do not draw cartoon hair/eyes over loaded real anime portraits.
  if(!(imageOn&&ava?.complete&&ava.naturalWidth>0)){
    ctx.beginPath();ctx.fillStyle=look.hair;ctx.arc(x,y-2,r-5.1,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1c1c1c';ctx.beginPath();ctx.arc(x-3.2,y+.4,1.1,0,Math.PI*2);ctx.arc(x+3.2,y+.4,1.1,0,Math.PI*2);ctx.fill();
  }
  // outline
  paintCountryRing(ctx,x,y,r,t.id);
  if(owner){ctx.lineWidth=2.3;ctx.strokeStyle='#fff2a0';ctx.beginPath();ctx.arc(x,y,r+4.5,0,Math.PI*2);ctx.stroke();}
  if(!video&&p.flowUntil>match.time){ctx.save();ctx.lineWidth=3;ctx.strokeStyle='#ce8aff';ctx.shadowBlur=16;ctx.shadowColor='#8f42ff';ctx.beginPath();ctx.arc(x,y,r+8+Math.sin(match.time*.07)*2.8,0,Math.PI*2);ctx.stroke();ctx.restore();}
  // number badge
  ctx.beginPath();ctx.fillStyle=look.mark||'#fff';ctx.arc(x+r-3.0,y-r+5.5,6.2,0,Math.PI*2);ctx.fill();
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 8.5px system-ui';ctx.fillStyle='#082035';ctx.fillText(isGk?'G':String(p.i+1),x+r-3.0,y-r+5.8);
  if(owner){ctx.strokeStyle='#ffe37d80';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,r+6,0,Math.PI*2);ctx.stroke();}
  if(!video&&p.run&&!owner){ctx.strokeStyle=t.accent||'#c5f5ff';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(x,y,r+5,0,Math.PI*2);ctx.stroke();}
  if(owner||hasAbility(p)||p.run||(!cameraFollow&&p.i>=8)){const full=p.name.split(' ');const label=full.length>1?full.slice(-1)[0]:p.name;
    ctx.font='800 8px system-ui';const labelW=ctx.measureText(label).width+16;ctx.fillStyle='#061321c4';ctx.fillRect(x-labelW/2,y-r-20,labelW,13);
    const ava=cachedPortrait(p.name,t.color)||defaultAvatar;if(ava.complete&&ava.naturalWidth>0)ctx.drawImage(ava,x-labelW/2+2,y-r-18.5,8,8);
    ctx.fillStyle='#edf8ff';ctx.textAlign='left';ctx.fillText(label,x-labelW/2+12,y-r-10);ctx.textAlign='center';
  }
  if(!video&&(SKILLS[p.name]||[]).length&&owner){ctx.fillStyle='#ffe687';ctx.font='900 12px system-ui';ctx.fillText('✦',x+r+4,y-r+1);}
  ctx.restore();
}

function drawRadar(){
  if(!cameraFollow||!match)return;
  const x=PITCH.width-188,y=$('stadium').classList.contains('wide-crop')?155:48,w=169,h=101,pad=9;
  const innerX=x+pad,innerY=y+25,innerW=w-2*pad,innerH=h-32;
  ctx.save();ctx.globalAlpha=.96;
  ctx.fillStyle='#061624dc';ctx.strokeStyle='#8bcbee66';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fill();ctx.stroke();
  ctx.font='900 10px system-ui';ctx.textAlign='left';ctx.fillStyle='#adf1ff';ctx.fillText('RADAR · CAMPO TODO',x+10,y+16);
  ctx.fillStyle='#174a36';ctx.fillRect(innerX,innerY,innerW,innerH);
  ctx.strokeStyle='#ffffff86';ctx.lineWidth=.9;ctx.strokeRect(innerX,innerY,innerW,innerH);
  ctx.beginPath();ctx.moveTo(innerX+innerW/2,innerY);ctx.lineTo(innerX+innerW/2,innerY+innerH);
  ctx.ellipse(innerX+innerW/2,innerY+innerH/2,10,8,0,0,Math.PI*2);ctx.stroke();
  const rX=innerW/PITCH.width,rY=innerH/PITCH.height;
  for(const p of match.players){const px=innerX+p.x*rX,py=innerY+p.y*rY;
    ctx.fillStyle=COUNTRY_KITS[match.teams[p.side].id]?.colors[1]||match.teams[p.side].color;ctx.strokeStyle='#021525';ctx.lineWidth=.7;
    ctx.beginPath();ctx.arc(px,py,2.2,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.fillStyle='#fff5b7';ctx.beginPath();ctx.arc(innerX+match.ball.x*rX,innerY+match.ball.y*rY,3.3,0,Math.PI*2);ctx.fill();
  const vX=PITCH.width/cameraActualZoom,vY=PITCH.height/cameraActualZoom;
  ctx.strokeStyle='#fff2a1';ctx.lineWidth=1.5;
  ctx.strokeRect(innerX+(cameraX-vX/2)*rX,innerY+(cameraY-vY/2)*rY,vX*rX,vY*rY);
  ctx.restore();
}
// Uma assinatura visual determinística por técnica (ID) — sem baixar animações ou cobrir o campo.
const abilitySignatureCache=new Map();
function abilitySignature(fx){
 const key=String(fx.abilityId||fx.id||fx.label||fx.kind);
 let sig=abilitySignatureCache.get(key);if(sig)return sig;
 let h=2166136261;for(let i=0;i<key.length;i++)h=Math.imul(h^key.charCodeAt(i),16777619);
 h>>>=0;
 sig={count:3+h%5,points:3+(h>>>5)%6,shape:(h>>>11)%5,tilt:(h%628)/100,
   radius:23+(h>>>18)%16,phase:(h>>>9)%70/11,pattern:String(fx.kind||'flow')};
 if(abilitySignatureCache.size>800)abilitySignatureCache.clear();
 abilitySignatureCache.set(key,sig);return sig;
}
function paintAbilitySignature(fx,x,y,t,subtle){
 const s=abilitySignature(fx),alpha=Math.max(0,1-t);
 ctx.save();ctx.globalAlpha=(subtle?.46:.78)*alpha;ctx.strokeStyle=fx.color||'#9addff';ctx.lineWidth=subtle?1.5:2.5;
 const count=subtle?Math.min(3,s.count):s.count,center=s.tilt+t*(subtle?.9:2.4);
 for(let j=0;j<count;j++){
   const a=center+j*2*Math.PI/count,r=s.radius+(j%2)*5+t*(subtle?7:18);
   const xx=x+Math.cos(a)*r, yy=y+Math.sin(a)*r;
   ctx.beginPath();
   if(s.shape===0){ctx.arc(xx,yy,subtle?2.8:5,0,Math.PI*2);}
   else if(s.shape===1){ctx.moveTo(xx-4,yy);ctx.lineTo(xx+4,yy);ctx.lineTo(xx,yy-7);ctx.closePath();}
   else if(s.shape===2){ctx.moveTo(xx-5,yy-4);ctx.lineTo(xx+5,yy+4);ctx.moveTo(xx-5,yy+4);ctx.lineTo(xx+5,yy-4);}
   else if(s.shape===3){ctx.arc(xx,yy,subtle?4.5:7,a,a+Math.PI*1.15);}
   else {ctx.moveTo(x,y);ctx.quadraticCurveTo(xx,yy,xx+Math.cos(a+.7)*8,yy+Math.sin(a+.7)*8);}
   ctx.stroke();
 }
 ctx.restore();
}
function drawSkillEffects(){
  if(replaying||!match.skillEffects?.length)return;
  const quality=graphicsMode();
  const styleLevel=$('skillFxLevel')?.value||'subtle';if(styleLevel==='off')return;
  for(const fx of (styleLevel==='subtle'?match.skillEffects.slice(-2):match.skillEffects)){
    const age=match.time-fx.start;if(age<0||age>(fx.until-fx.start))continue;
    const actor=match.players.find(p=>p.name===fx.player&&p.side===fx.side);
    if(!actor)continue;
    const t=age/Math.max(1,fx.until-fx.start),life=1-t,x=actor.x,y=actor.y,color=fx.success?'#a5f4ff':'#ffc09f';
    // v7.0 bugfix: these were undefined for spiral/shadow/aerial techniques.
    const motionSeed=fx.id*17+fx.player.length*11, fan=quality==='low'?2:quality==='medium'?3:5;
    const phase=motionSeed*.073+age*.016, sway=fx.lateral||1;
    ctx.save();
    const effectScale=styleLevel==='subtle'?.50:.66;ctx.translate(x,y);ctx.scale(effectScale,effectScale);ctx.translate(-x,-y);
    if(styleLevel==='subtle'){
      // Efeito curto e discreto: a identidade visual fica, mas o jogador e o gol continuam visíveis.
      ctx.globalAlpha=Math.min(.40,life*.58);ctx.lineWidth=1.7;ctx.strokeStyle=fx.color||color;
      const radius=17+(1-life)*13;
      ctx.beginPath();ctx.arc(x,y,radius,Math.PI*(.2+age*.006),Math.PI*(1.30+age*.006));ctx.stroke();
      if(['speed','burst','shadow','chameleon','monster'].includes(fx.kind)){
        for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(x-(fx.dir||1)*(28+j*4),y+j*7);ctx.lineTo(x-(fx.dir||1)*12,y+j*7);ctx.stroke();}
      }else if(['puzzle','radar','lines','link'].includes(fx.kind)){
        ctx.strokeRect(x-17,y-17,34,34);
      }else if(['impact','predator','dual','acro'].includes(fx.kind)){
        for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(fx.dir||1)*(20+j*6),y+(j-1)*13);ctx.stroke();}
      }else{
        ctx.beginPath();ctx.arc(x,y,10+age*.035,0,Math.PI*2);ctx.stroke();
      }
      paintAbilitySignature(fx,x,y,t,true);ctx.restore();continue;
    }
    ctx.globalAlpha=Math.min(1,life*1.1);ctx.lineWidth=3;
    ctx.translate(x,y);ctx.scale(.72,.72);ctx.translate(-x,-y);
    ctx.strokeStyle=fx.color||(fx.success?'#40dff7':'#f8b58b');ctx.shadowColor=fx.color||(fx.success?'#34d1ff':'#ff9a5e');ctx.shadowBlur=quality==='low'?0:17;
    ctx.setLineDash([10,7]);ctx.beginPath();ctx.moveTo(fx.x,fx.y);ctx.quadraticCurveTo((fx.x+x)/2,((fx.y+y)/2)+fx.lateral*32,x,y);ctx.stroke();ctx.setLineDash([]);ctx.shadowBlur=0;

    if(quality==='low'&&fx!==match.skillEffects[match.skillEffects.length-1]){ctx.restore();continue;}
    // A distinct visual grammar for every registered technique family.
    const accent=fx.color||color;ctx.strokeStyle=accent;ctx.fillStyle=accent;ctx.lineWidth=2.6;
    if(['puzzle','radar','lines','link'].includes(fx.kind)){
      const mates=match.players.filter(p=>p.side===fx.side&&p!==actor&&p.i>0).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).slice(0,4);
      for(const q of mates){ctx.beginPath();ctx.setLineDash(fx.kind==='puzzle'?[5,7]:[9,4]);ctx.moveTo(x,y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.setLineDash([]);}
      for(let j=0;j<6;j++){const ang=j*Math.PI/3+age*.024;ctx.save();ctx.translate(x+Math.cos(ang)*(35+j*7),y+Math.sin(ang)*(35+j*7));ctx.rotate(ang);ctx.strokeRect(-6,-6,12,12);ctx.restore();}
    }else if(['impact','predator','dual'].includes(fx.kind)){
      for(let j=0;j<4;j++){const ang=(-.55+j*.36)*(fx.dir||1),len=68+j*9+age*.30;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+fx.dir*len*Math.cos(ang),y+len*Math.sin(ang));ctx.stroke();}
      if(fx.kind==='predator'){for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(x-18+j*11,y-33);ctx.lineTo(x+j*10,y+33);ctx.stroke();}}
    }else if(['speed','burst'].includes(fx.kind)){
      for(let j=0;j<6;j++){ctx.beginPath();const dy=(j-3)*8;ctx.moveTo(x-fx.dir*(36+j*13)-age*.26*fx.dir,y+dy);ctx.lineTo(x-fx.dir*12,y+dy);ctx.stroke();}
    }else if(['monster','chameleon'].includes(fx.kind)){
      for(let j=0;j<5;j++){const ang=j*Math.PI*2/5;ctx.beginPath();for(let k=0;k<15;k++){const r=22+k*4.1;const pt=ang+k*.24+age*.018;const qx=x+Math.cos(pt)*r,qy=y+Math.sin(pt)*r; if(k===0)ctx.moveTo(qx,qy);else ctx.lineTo(qx,qy);}ctx.stroke();}
    }else if(fx.kind==='spiral'){
      for(let j=0;j<fan;j++){ctx.beginPath();for(let k=0;k<27;k++){const angle=phase+j*Math.PI*2/fan+k*.18+sway*age*.012,r=8+k*3.3;
        const xx=x+Math.cos(angle)*r,yy=y+Math.sin(angle)*r;if(k===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}
        ctx.stroke();}
    }else if(fx.kind==='shadow'){
      for(let j=0;j<fan;j++){const shift=j*(8+motionSeed%8);ctx.globalAlpha=Math.max(.09,(1-t)*(.6-j*.06));
        ctx.strokeRect(x-fx.dir*(shift+10),y+fx.lateral*(j-2)*12,18+j*4,24+j*3);}
      ctx.globalAlpha=Math.min(1,life*1.5);
    }else if(fx.kind==='aerial'){
      for(let j=0;j<fan;j++){ctx.beginPath();ctx.ellipse(x+Math.cos(phase+j)*15,y-(j-2)*10-t*24,26+j*8,12+j*5,phase*.12,0,Math.PI*2);ctx.stroke();}
    }else if(['ice','trap','acro','flow','wild','shield','master'].includes(fx.kind)){
      for(let j=0;j<6;j++){const a=j*Math.PI/3+age*.020;const radius=25+(j%2)*13+t*26;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*radius,y+Math.sin(a)*radius);ctx.lineTo(x+Math.cos(a)*(radius+23),y+Math.sin(a)*(radius+23));ctx.stroke();}
      if(fx.kind==='flow'){ctx.save();ctx.rotate(0);ctx.strokeStyle='#e5a7ff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,50+t*25,age*.015,age*.015+Math.PI*1.4);ctx.stroke();ctx.restore();}
    }
    // Animated feint trails and movement-style-specific symbols.
    for(let j=0;j<3;j++){
      const r=28+j*20+t*38;ctx.strokeStyle=j===0?color:'#c8b7ff';ctx.beginPath();
      if(fx.kind==='roulette')ctx.arc(x,y,r,Math.PI*.28+t*Math.PI*2+j*.6,Math.PI*1.4+t*Math.PI*2+j*.6);
      else if(fx.kind==='elastico')ctx.ellipse(x+fx.dir*6,y+fx.lateral*j*4,r,r*.50,fx.lateral*.65,0,Math.PI*1.65);
      else ctx.arc(x,y,r,Math.PI*.7,Math.PI*1.8);
      ctx.stroke();
    }
    const sparks=quality==='low'?2:quality==='medium'?5:fx.kind==='burst'?10:8;
    for(let j=0;j<sparks;j++){
      const ang=(j/sparks)*Math.PI*2+age*.09,dist=34+t*52;
      ctx.fillStyle=j%2===0?'#fef4ba':color;ctx.beginPath();ctx.arc(x+Math.cos(ang)*dist,y+Math.sin(ang)*dist,2.5*life+1,0,Math.PI*2);ctx.fill();
    }
    paintAbilitySignature(fx,x,y,t,false);
    // Nomes ficam somente no feed fora do campo, nunca sobre a jogada.
    ctx.restore();
  }
}


function drawActionEffects(){
  if(replaying||!match?.actionEffects?.length)return;
  const styleLevel=$('skillFxLevel')?.value||'subtle';if(styleLevel==='off')return;
  const quality=graphicsMode();
  const styles={
    save:{color:'#64efff',title:'DEFESA',r:30},
    sweep:{color:'#a4ffcc',title:'ANTECIPAÇÃO',r:24},
    block:{color:'#ffd17b',title:'BLOQUEIO',r:28},
    duel:{color:'#ffb6ab',title:'DUELO',r:25},
    shot:{color:'#ffb05a',title:'CHUTAÇO',r:32},
    cross:{color:'#9ad9ff',title:'CRUZAMENTO',r:26},
    header:{color:'#efe39b',title:'CABECEIO',r:28},
    chip:{color:'#a9d9ff',title:'COBERTURA',r:32},
    volley:{color:'#ffce84',title:'PRIMEIRA',r:27},
    'acro-shot':{color:'#edb0ff',title:'ACROBACIA',r:30},
    'low-shot':{color:'#a8f1ff',title:'RASTEIRO',r:27},
    'tap-in':{color:'#fff2a0',title:'GOL DE PERTO',r:20},
    'keeper-wild':{color:'#b8ffe2',title:'DEFESA INSTINTIVA',r:31},
    'keeper-air':{color:'#c7dbff',title:'VOO AÉREO',r:34},
    'keeper-dive':{color:'#83c8ff',title:'MERGULHO',r:30},
    'keeper-wall':{color:'#c8ffe0',title:'MURALHA',r:26},
    'keeper-reflex':{color:'#f2d3ff',title:'REFLEXO',r:27},
    'keeper-hold':{color:'#9ff5d7',title:'SEGURA',r:23},
    aerial:{color:'#d5c4ff',title:'DISPUTA AÉREA',r:30},
    goal:{color:'#ffe586',title:'GOOOL!',r:44},
    legend:{color:'#ffcf74',title:'GOLAÇO!',r:53}
  };
  const active=match.actionEffects.filter(e=>match.time>=e.start&&match.time<e.until).slice(quality==='low'?-2:-6);
  for(const e of active){
    const st=styles[e.kind]||styles.duel,t=(match.time-e.start)/Math.max(.1,e.until-e.start);
    ctx.save();
    const effectScale=styleLevel==='subtle'?.50:.66;ctx.translate(e.x,e.y);ctx.scale(effectScale,effectScale);ctx.translate(-e.x,-e.y);
    if(styleLevel==='subtle'){
      ctx.globalAlpha=(1-t)*.40;ctx.strokeStyle=st.color;ctx.lineWidth=1.6;
      ctx.beginPath();ctx.arc(e.x,e.y,13+t*13,Math.PI*.2,Math.PI*1.7);ctx.stroke();
      ctx.restore();continue;
    }ctx.globalAlpha=Math.min(1,(1-t)*1.45);ctx.strokeStyle=st.color;ctx.lineWidth=3;
    ctx.shadowColor=st.color;ctx.shadowBlur=quality==='high'?20:quality==='low'?0:8;
    if(['save','sweep','keeper-wild','keeper-air','keeper-dive','keeper-wall','keeper-reflex','keeper-hold'].includes(e.kind)){
      // Glove-like open arcs for keeper interventions.
      for(let j=0;j<3;j++){ctx.beginPath();ctx.arc(e.x,e.y,st.r+j*13+t*18,Math.PI*.1,Math.PI*.9);ctx.stroke();}
    }else if(e.kind==='block'){
      ctx.save();ctx.translate(e.x,e.y);ctx.rotate(t*1.2);
      ctx.strokeRect(-20-t*15,-20-t*15,40+t*30,40+t*30);ctx.restore();
      ctx.beginPath();ctx.arc(e.x,e.y,st.r+t*28,0,Math.PI*2);ctx.stroke();
    }else if(['chip','volley','acro-shot','low-shot','tap-in'].includes(e.kind)){
      const a=e.kind==='chip'?-Math.PI*.65:e.kind==='volley'?Math.PI*.3:Math.PI*.1;
      for(let j=0;j<(e.kind==='tap-in'?2:4);j++){ctx.beginPath();ctx.arc(e.x,e.y,st.r+j*6+t*17,a+j*.2,a+Math.PI*(e.kind==='chip'?.9:1.5));ctx.stroke();}
    }else if(e.kind==='aerial'){
      for(let j=0;j<2;j++){ctx.beginPath();ctx.ellipse(e.x,e.y-(j*18+t*28),st.r+t*15,10+j*5,0,0,Math.PI*2);ctx.stroke();}
    }else if(e.kind==='shot'){
      for(let j=0;j<3;j++){ctx.beginPath();ctx.arc(e.x,e.y,st.r+j*10+t*18,Math.PI*.15,Math.PI*1.85);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(e.x-12,e.y);ctx.lineTo(e.x+24+t*25,e.y);ctx.stroke();
    }else if(e.kind==='cross'||e.kind==='header'){
      for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(e.x+(j-1)*10,e.y-6-j*8,st.r*.65+t*12,8+j*3,0,Math.PI*.15,Math.PI*1.85);ctx.stroke();}
    }else{
      for(let j=0;j<(quality==='low'?4:9);j++){
        const a=2*Math.PI*j/(quality==='low'?4:9)+t*.45,r=st.r+t*50;
        ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*(r-12),e.y+Math.sin(a)*(r-12));
        ctx.lineTo(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r);ctx.stroke();
      }
    }
    ctx.shadowBlur=0;if(window.innerWidth<=650){ctx.restore();continue;}ctx.font='850 9px system-ui';ctx.textAlign='center';
    const width=Math.min(145,Math.max(44,ctx.measureText(e.label).width+12));
    ctx.fillStyle='#061526a9';ctx.fillRect(e.x-width/2,e.y-43-t*9,width,14);
    ctx.fillStyle=st.color;ctx.fillText(e.label,e.x,e.y-33-t*9);
    ctx.restore();
  }
}

function drawSkillSpotlight(){
  if(replaying||!match?.skillEffects?.length)return;
  const fx=match.skillEffects.slice().reverse().find(v=>match.time>=v.start&&match.time<v.until);
  if(!fx)return;
  const t=(match.time-fx.start)/Math.max(1,fx.until-fx.start);
  const club=match.teams[fx.side],kit=COUNTRY_KITS[club.id],actor=match.players.find(p=>p.name===fx.player&&p.side===fx.side);
  ctx.save();
  const xx=PITCH.cx-200,yy=$('stadium').classList.contains('wide-crop')?148:64,w=400,h=66,alpha=Math.min(1,(1-t)*2.6);
  ctx.globalAlpha=alpha;
  ctx.shadowColor=fx.success?'#23bdfc':'#e8ae6a';ctx.shadowBlur=22;
  ctx.fillStyle='#06182ae9';ctx.strokeStyle=fx.success?'#69e6ff':'#ffbba0';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(xx,yy,w,h,12);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  for(let i=0;i<3;i++){ctx.fillStyle=kit?.colors[i]||club.color;ctx.fillRect(xx+12+i*9,yy+9,8,6);}
  const av=actor?cachedPortrait(actor.name,club.color):null;
  if(av?.complete&&av.naturalWidth>0){ctx.save();ctx.beginPath();ctx.arc(xx+44,yy+38,23,0,Math.PI*2);ctx.clip();ctx.drawImage(av,xx+21,yy+15,46,46);ctx.restore();}
  else{ctx.beginPath();ctx.fillStyle=club.color;ctx.arc(xx+44,yy+38,23,0,Math.PI*2);ctx.fill();}
  ctx.textAlign='left';ctx.fillStyle='#a9cde7';ctx.font='900 11px system-ui';ctx.fillText(`${fx.player} • ${club.short}`,xx+79,yy+20);
  ctx.fillStyle='#fff2b8';ctx.font='1000 21px system-ui';ctx.fillText('✦ '+fx.label.toUpperCase(),xx+79,yy+46,300);
  ctx.fillStyle='#152e48';ctx.fillRect(xx+79,yy+53,299,4);ctx.fillStyle='#4fe0fc';ctx.fillRect(xx+79,yy+53,299*(1-t),4);
  ctx.restore();
}
function hasAbility(p){return p.i===0&&(SKILLS[p.name]||[]).length>0;}
function drawTrails(){const hist=match.history||[];if(hist.length<2)return;ctx.save();for(let i=Math.max(1,hist.length-12);i<hist.length;i++){const prev=hist[i-1],cur=hist[i],a=(i-(hist.length-12))/12;ctx.strokeStyle=`rgba(255,255,255,${0.03+a*0.10})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(prev.ball.x,prev.ball.y);ctx.lineTo(cur.ball.x,cur.ball.y);ctx.stroke();}ctx.restore();}
function drawBall(x,y,height=0){
  ctx.save();const lifted=height*.65;
  if(match&&!replaying&&match.ball.mode!=='carry'&&match.ball.mode!=='dead'){
    const b=match.ball,speed=Math.hypot(b.vx||0,b.vy||0);
    if(speed>150){
      const ux=b.vx/speed,uy=b.vy/speed;
      const shot=b.mode==='shot',aerial=b.mode==='air'||b.crossType==='high';
      const trail=Math.min(shot?135:110,speed*(shot?.20:.17));
      const gradient=ctx.createLinearGradient(x,y,x-ux*trail,y-uy*trail);
      gradient.addColorStop(0,shot?'#fff3b8e6':aerial?'#c3eefff0':'#e8faffb5');
      gradient.addColorStop(1,shot?'#ff9f3d00':aerial?'#8adbff00':'#7cdbff00');
      ctx.strokeStyle=gradient;ctx.lineWidth=shot?10:aerial?6:4;
      ctx.beginPath();ctx.moveTo(x,y-lifted);ctx.lineTo(x-ux*trail,y-uy*trail-lifted);ctx.stroke();
      if(shot){
        ctx.globalAlpha=.60;ctx.strokeStyle='#ffd17f';ctx.lineWidth=2.4;
        for(let j=0;j<2;j++){ctx.beginPath();ctx.arc(x-ux*(8+j*6),y-uy*(8+j*6)-lifted,11+j*6,0,Math.PI*2);ctx.stroke();}
      }
      if(aerial){
        ctx.globalAlpha=.33;ctx.strokeStyle='#d9f5ff';ctx.lineWidth=1.8;
        ctx.beginPath();ctx.moveTo(x,y-lifted);ctx.quadraticCurveTo(x-ux*trail*.45,y-uy*trail*.45-lifted-18,x-ux*trail,y-uy*trail-lifted);ctx.stroke();
      }
    }
  }
  if(height>0){ctx.beginPath();ctx.ellipse(x+2,y+3,8,4,0,0,Math.PI*2);ctx.fillStyle='#00180b55';ctx.fill();}
  ctx.shadowColor=match?.ball?.mode==='shot'?'#ffd08c':height>12?'#fff8d0':'#000d';ctx.shadowBlur=match?.ball?.mode==='shot'?16:(height>12?15:5);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y-lifted,height>0?10.4:9.3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#111';ctx.lineWidth=1.7;ctx.stroke();ctx.fillStyle='#151515';ctx.beginPath();ctx.arc(x+1,y-lifted-1,2.2,0,Math.PI*2);ctx.fill();ctx.restore();
}

function blendedReplayFrame(){
 const list=match?.lastGoal?.frames;if(!replaying||!list?.length)return null;
 const i=Math.min(Math.floor(replayIndex),list.length-1),j=Math.min(i+1,list.length-1);
 const a=list[i],b=list[j],t=replayIndex-i;
 const lerp=(v,w)=>Number(v||0)+(Number(w||0)-Number(v||0))*t;
 return {ball:{...a.ball,x:lerp(a.ball.x,b.ball.x),y:lerp(a.ball.y,b.ball.y),height:lerp(a.ball.height,b.ball.height)},
   positions:a.positions.map((pos,k)=>{const next=b.positions[k]||pos;return [lerp(pos[0],next[0]),lerp(pos[1],next[1])];})};
}
function renderReplayDirector(){const node=$('replayDirector');if(!node)return;
 if(!replaying||!match?.lastGoal?.frames?.length){node.classList.add('hidden');return;}
 const clip=match.lastGoal,frames=clip.frames.length,percent=Math.round(100*replayIndex/Math.max(1,frames-1));
 node.classList.remove('hidden');
 const head=$('replayTitle');if(head)head.textContent=`🎬 ${clip.scorer} · ${goalStyleText(clip.goalType)} · ${clip.minute}'`;
 const assist=$('replayAssist');if(assist)assist.textContent=clip.assister?`🎯 Passe de ${clip.assister}`:'Jogada individual / sem assistência';
 const progress=$('replayProgress');if(progress)progress.style.width=Math.max(0,Math.min(100,percent))+'%';
 const speed=$('replaySpeed');if(speed)speed.textContent=percent>72?'● CÂMERA LENTA':'▶ MELHORES ÂNGULOS';
}
// v7.7 animated close-up. A stylized illustration of real engine actors/actions, not a second simulated match.
const stageCanvas=$('actionStage'),stageCtx=stageCanvas?.getContext('2d');
let stageVisible=!('IntersectionObserver' in window);
if('IntersectionObserver' in window&&stageCanvas){
  new IntersectionObserver(entries=>{
    stageVisible=entries.some(e=>e.isIntersecting);
    if(stageVisible)stageLastDraw=0;
  },{rootMargin:'120px'}).observe(stageCanvas);
}

let stageState={match:null,key:'',lastKey:'',start:0,duration:0,event:null},stageLastDraw=0,lastBroadcastDangerAt=-1e6;
const STAGE_NAMES={shot:'CHUTAÇO!',chip:'COBERTURA!',volley:'DE PRIMEIRA!',header:'CABEÇADA!',
 'acro-shot':'ACROBACIA!',duel:'DUELO 1 × 1',block:'BLOQUEIO!',cross:'BOLA NA ÁREA!',
 'keeper-dive':'DEFESA VOADORA!','keeper-wild':'REFLEXO SELVAGEM!','keeper-wall':'MURALHA!',
 'keeper-air':'VOO DO GOLEIRO!','keeper-reflex':'REFLEXO!', 'keeper-hold':'SEGURA FIRME!',
 save:'DEFESA!',goal:'GOOOL!',legend:'GOLAÇO!', 'low-shot':'CHUTE RASTEIRO!',
 'tap-in':'TOQUE DE PERTO!',sweep:'SAÍDA DO GOLEIRO!',aerial:'DISPUTA AÉREA!'};
function stagePriority(kind){return ({legend:7,goal:7,shot:5,chip:5,volley:5,header:5,
 'acro-shot':5,'low-shot':5,'tap-in':5,'keeper-dive':6,'keeper-wild':6,'keeper-wall':6,
 'keeper-air':6,'keeper-reflex':6,'keeper-hold':6,save:6,cross:4,duel:3,block:4,aerial:3,sweep:4})[kind]||2;}
function stageActorByName(name,side){return match.players.find(p=>p.name===name&&p.side===side)||null;}
function stageNearest(actor,oppositeSide){if(!actor)return null;
 let best=null,dist=Infinity;for(const p of match.players){if(p.side!==oppositeSide)continue;
 const d=Math.hypot(p.x-actor.x,p.y-actor.y);if(d<dist){dist=d;best=p;}}
 return best;}
function currentStageScene(now){
 if(!match||!stageCtx)return null;
 if(stageState.match!==match){stageState={match,key:'',lastKey:'',start:0,duration:0,event:null};}
 if(match.phase==='goal'&&match.celebration){
   const c=match.celebration,actor=stageActorByName(c.scorer,c.side);
   if(actor){const rival=match.players.filter(p=>p.side===c.side&&p!==actor&&p.i>0).sort((a,b)=>Math.hypot(a.x-actor.x,a.y-actor.y)-Math.hypot(b.x-actor.x,b.y-actor.y))[0];
     return {actor,rival,kind:'celebration',label:'⚽ '+c.label.toUpperCase()+'!',t:(now*.001)%1,highlighted:true,celebration:c};}
 }
 const active=match.actionEffects.filter(e=>match.time>=e.start&&match.time<e.until);
 let event=active.sort((a,b)=>stagePriority(b.kind)-stagePriority(a.kind)||b.start-a.start)[0];
 // Skill cut-ins use actual activated techniques, never made-up actions or achievements.
 const skill=match.lastSkill;
 if(skill&&match.time>=skill.time&&match.time-skill.time<42&&(!event||stagePriority(event.kind)<=3)){
   const who=match.players.find(p=>p.name===skill.name);
   if(who)event={kind:'skill',label:skill.label,player:skill.name,side:who.side,start:skill.time,abilityId:skill.id||skill.label};
 }
 const signature=event?`${event.start}|${event.kind}|${event.side}|${event.player}`:'';
 if(event&&signature!==stageState.lastKey){
   const force=stagePriority(event.kind)>=6;
   if(force||now-stageState.start>Math.min(1200,stageState.duration*.7)){
     stageState.key=signature;stageState.lastKey=signature;stageState.start=now;
     stageState.duration=force?3300:stagePriority(event.kind)>=4?2700:2100;
     stageState.event={...event};
   }
 }
 const highlighted=stageState.event&&now-stageState.start<stageState.duration;
 const ev=highlighted?stageState.event:null;
 let actor=ev?stageActorByName(ev.player,ev.side):match.ball.owner;
 if(!actor&&ev)actor=match.players.find(p=>p.side===ev.side&&p.i>0)||null;
 if(!actor){actor=match.players.find(p=>p.side===(match.possessionSide===1?1:0)&&p.i>0)||match.players[0];}
 if(!actor)return null;
 const rival=stageNearest(actor,actor.side===0?1:0);
 const label=ev?(STAGE_NAMES[ev.kind]||ev.label||'LANCE!'):
   (match.ball.mode==='shot'?'CHUTE EM ANDAMENTO':match.ball.mode==='air'?'BOLA PELO ALTO':
    match.phase==='goal'?'GOL CONFIRMADO':match.phase==='halftime'?'INTERVALO':
    match.ball.owner?'CONSTRUINDO A JOGADA':'BOLA EM DISPUTA');
 return {actor,rival,kind:ev?.kind||match.ball.mode||'carry',label,
     t:highlighted?Math.min(1,(now-stageState.start)/stageState.duration):((now*.001)%1),highlighted};
}
function stageFigure(g,p,x,y,scale,animationTime,kind,mirror=false){
 const club=match.teams[p.side],portrait=cachedPortrait(p.name,club.color);
 g.save();g.translate(x,y);g.scale(mirror?-scale:scale,scale);
 const celebrating=kind==='celebration';if(celebrating)g.translate(0,-Math.abs(Math.sin(animationTime*7+p.id*.7))*15);
 const run=Math.sin(animationTime*14+p.id)*10,shoot=['shot','chip','volley','acro-shot','low-shot','tap-in','header'].includes(kind);
 const guard=kind==='duel'||kind==='block',goalie=kind.startsWith('keeper')||kind==='save';
 g.fillStyle='#00132388';g.beginPath();g.ellipse(0,96,71,15,0,0,Math.PI*2);g.fill();
 // Animated boots and leaning legs.
 for(const s of [-1,1]){
   g.strokeStyle='#101b32';g.lineWidth=26;g.lineCap='round';g.beginPath();g.moveTo(s*23,28);g.lineTo(s*29+(shoot&&s===1?65:run*s),90+(shoot&&s===1?-12:run*.25));g.stroke();
   g.strokeStyle='#f6f6f6';g.lineWidth=10;g.beginPath();g.moveTo(s*29+(shoot&&s===1?65:run*s),90+(shoot&&s===1?-12:run*.25));g.lineTo(s*36+(shoot&&s===1?75:run*s),94+(shoot&&s===1?-12:run*.25));g.stroke();
 }
 g.fillStyle=club.color;g.strokeStyle='#e6f8ff';g.lineWidth=4;
 g.beginPath();g.moveTo(-48,-45);g.lineTo(44,-48);g.lineTo(34,38);g.lineTo(-33,38);g.closePath();g.fill();g.stroke();
 for(const s of [-1,1]){
   g.strokeStyle=club.color;g.lineWidth=19;g.beginPath();g.moveTo(s*39,-35);g.lineTo(s*(celebrating?92:goalie?93:guard?85:60),celebrating?-114:goalie?-60:-7-run*s);g.stroke();
   g.strokeStyle='#ffe0b6';g.lineWidth=11;g.beginPath();g.moveTo(s*(celebrating?92:goalie?93:guard?85:60),celebrating?-114:goalie?-60:-7-run*s);g.lineTo(s*(celebrating?105:goalie?105:guard?93:66),celebrating?-132:goalie?-65:-1-run*s);g.stroke();
 }
 g.save();g.translate(0,-85+Math.sin(animationTime*12+p.id)*3);
 g.fillStyle='#09223b';g.beginPath();g.arc(0,0,61,0,Math.PI*2);g.fill();
 if(portrait?.complete&&portrait.naturalWidth>0){g.save();g.beginPath();g.arc(0,0,54,0,Math.PI*2);g.clip();g.drawImage(portrait,-54,-54,108,108);g.restore();}
 else {g.fillStyle='#f1c69e';g.beginPath();g.arc(0,0,54,0,Math.PI*2);g.fill();}
 g.strokeStyle='#dcf6ff';g.lineWidth=6;g.beginPath();g.arc(0,0,58,0,Math.PI*2);g.stroke();g.restore();
 g.restore();
}
function drawActionStage(now){
 if(!stageCtx||!match||$('actionTheater')?.classList.contains('collapsed'))return;
 const st=currentStageScene(now);if(!st)return;
 const g=stageCtx,W=stageCanvas.width,H=stageCanvas.height;
 g.clearRect(0,0,W,H);
 const theme=match.teams[st.actor.side].color,other=match.teams[st.rival?.side??1-st.actor.side].color;
 const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#07192b');bg.addColorStop(.48,'#0b3245');bg.addColorStop(1,'#172340');g.fillStyle=bg;g.fillRect(0,0,W,H);
 // Stylized pitch and moving speed-lines, independent from the tactical field canvas.
 g.save();g.globalAlpha=.25;for(let i=0;i<15;i++){g.strokeStyle=i%2?theme:other;g.lineWidth=i%3===0?3:1.5;
  const y=((i*49+now*.045)%420)-45;g.beginPath();g.moveTo(-70,y);g.lineTo(1050,y-85);g.stroke();}g.restore();
 g.fillStyle='#18684a70';g.beginPath();g.moveTo(0,285);g.lineTo(W,247);g.lineTo(W,H);g.lineTo(0,H);g.closePath();g.fill();
 g.strokeStyle='#d6faff45';g.lineWidth=2;g.beginPath();g.moveTo(0,302);g.lineTo(W,271);g.stroke();
 const wave=Math.sin(now*.006),impact=st.highlighted?(1-Math.abs(st.t-.5)*2):.25;
 if(st.kind==='celebration'){g.save();for(let i=0;i<24;i++){
   const xx=35+((i*137+now*.09)%900),yy=((i*51+now*.056)%260)-12;
   g.fillStyle=i%3===0?'#ffe58b':i%3===1?'#75e1ff':'#eab8ff';g.globalAlpha=.62;
   g.save();g.translate(xx,yy);g.rotate(i*.9+now*.002);g.fillRect(-4,-2,8,4);g.restore();}g.restore();}
 stageFigure(g,st.actor,246+wave*11,196,1.02,now*.001,st.kind,false);
 if(st.rival)stageFigure(g,st.rival,714-wave*10,199,.87,now*.001,st.kind==='duel'?'duel':'guard',true);
 // Ball is continuously animated and follows the highlight's phase.
 const ballX=st.kind==='celebration'?480:st.highlighted?375+st.t*280:450+Math.sin(now*.003)*70;
 const ballY=st.kind==='celebration'?284:st.highlighted?242-Math.sin(st.t*Math.PI)*90:231+Math.sin(now*.007)*12;
 g.save();g.strokeStyle=st.highlighted?'#ffe38a':'#bdefff';g.globalAlpha=.42;g.lineWidth=7;
 g.beginPath();g.moveTo(ballX-105,ballY+18);g.lineTo(ballX-6,ballY);g.stroke();g.restore();
 g.shadowColor=st.highlighted?'#ffdc80':'#d7f4ff';g.shadowBlur=st.highlighted?25:10;
 g.fillStyle='#f6fbff';g.beginPath();g.arc(ballX,ballY,14+impact*3,0,Math.PI*2);g.fill();g.shadowBlur=0;
 g.fillStyle='#12283f';g.beginPath();g.arc(ballX+3,ballY-2,5,0,Math.PI*2);g.fill();
 if(st.highlighted){g.strokeStyle=theme;g.lineWidth=4;g.globalAlpha=Math.max(0,.65-st.t*.45);
  for(let j=0;j<3;j++){g.beginPath();g.arc(ballX,ballY,26+j*15+st.t*18,-.6,2.5);g.stroke();}g.globalAlpha=1;}
 if(st.kind==='skill'&&st.highlighted){
   const phrase=String(st.label),seed=[...phrase].reduce((acc,ch)=>(Math.imul(acc,31)+ch.charCodeAt(0))>>>0,17);
   const count=5+seed%6,spin=now*.002*(seed%2?-1:1);
   g.save();g.lineWidth=2.8;g.strokeStyle=theme;g.globalAlpha=.70*(1-st.t*.55);
   for(let i=0;i<count;i++){const a=spin+i*Math.PI*2/count,r=90+(i%3)*18+Math.sin(now*.008+i)*7;
     const px=246+Math.cos(a)*r,py=173+Math.sin(a)*r*.72;
     g.beginPath();if(seed%3===0)g.arc(px,py,8,0,Math.PI*2);
     else if(seed%3===1){g.moveTo(px-7,py+6);g.lineTo(px,py-9);g.lineTo(px+7,py+6);g.closePath();}
     else {g.moveTo(px-9,py);g.lineTo(px+9,py);g.moveTo(px,py-9);g.lineTo(px,py+9);}g.stroke();}
   g.restore();
 }
 // Large headline and true actor names; not drawn over the live pitch.
 g.textAlign='center';g.shadowColor='#010a14';g.shadowBlur=8;g.fillStyle='#ffffff';g.font='900 32px system-ui';
 g.fillText(st.label,W/2,49,600);g.shadowBlur=0;
 g.font='800 19px system-ui';g.fillStyle='#cceeff';g.textAlign='left';g.fillText(st.actor.name,35,H-23,350);
 if(st.rival){g.textAlign='right';g.fillStyle='#ead8ff';g.fillText(st.rival.name,W-35,H-23,350);}
 if($('actionMoment')){
   const label=st.highlighted?st.label:'Câmera acompanha a posse e os confrontos';
   if($('actionMoment').textContent!==label)$('actionMoment').textContent=label;
 }
 const actors=st.rival?st.actor.name+' × '+st.rival.name:st.actor.name;
 if($('actionNames')&&$('actionNames').textContent!==actors)$('actionNames').textContent=actors;
}

function draw(){if(!match)return;
  const replayScene=blendedReplayFrame(),replayBall=replayScene?.ball;
  const cam=cameraView(replayBall||match.ball);
  configureCanvasResolution();ctx.setTransform(renderScale,0,0,renderScale,0,0);ctx.clearRect(0,0,PITCH.width,PITCH.height);
  ctx.save();
  ctx.translate(PITCH.cx,PITCH.cy);ctx.scale(cam.zoom,cam.zoom);ctx.translate(-cam.x,-cam.y);
  drawPitch();
  if(match.weather==='rain'){ctx.save();ctx.fillStyle='#91c7ff16';ctx.fillRect(PITCH.left,PITCH.top,PITCH.right-PITCH.left,PITCH.bottom-PITCH.top);ctx.restore();}
  if(match.weather==='wind'){ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='#d8f3ff';ctx.font='900 15px system-ui';ctx.fillText('↝ VENTO',PITCH.cx,PITCH.top+22);ctx.restore();}
  drawTrails();const frame=replayScene;
  const possessor=!replaying?match.ball.owner:null;
  for(let i=0;i<match.players.length;i++){
    const p=match.players[i],coords=frame?.positions?.[i];
    let px=coords?coords[0]:p.x,py=coords?coords[1]:p.y;
    const celebration=match.phase==='goal'&&!replaying?match.celebration:null;
    if(celebration&&p.side===celebration.side){
      const sec=performance.now()/1000,scorer=match.players.find(q=>q.name===celebration.scorer&&q.side===celebration.side);
      if(p===scorer){py-=Math.abs(Math.sin(sec*6))*12;}
      else if(scorer&&Math.abs(p.x-scorer.x)<330&&Math.abs(p.y-scorer.y)<280){
        const dx=scorer.x-p.x,dy=scorer.y-p.y,dist=Math.hypot(dx,dy)||1;
        px+=dx/dist*Math.min(60,dist*.23);py+=dy/dist*Math.min(60,dist*.23)+Math.sin(sec*5+p.id)*6;
      }
    }
    drawPlayer(p,px,py,possessor===p,replaying);
  }
  if(match.phase==='goal'&&match.celebration&&!replaying){
    const c=match.celebration,hero=match.players.find(p=>p.side===c.side&&p.name===c.scorer);
    if(hero){ctx.save();const clock=performance.now()/500;
      for(let j=0;j<12;j++){const a=j*Math.PI/6+clock*.15,rr=27+(clock*17+j*7)%67;
        ctx.fillStyle=j%2?'#ffe08c':'#9be6ff';ctx.globalAlpha=.32;
        ctx.fillRect(hero.x+Math.cos(a)*rr,hero.y+Math.sin(a)*rr,4,3);}
      ctx.restore();}
  }
  const b=frame?.ball||match.ball;
  drawSkillEffects();
  drawActionEffects();
  if(!replaying&&$('showTactics').checked){
    ctx.save();
    // Preview current team shape, and render persistent off-ball runs with real arrows.
    for(const p of match.players){
      if(p.i===0)continue;
      const route=p.run,target=route||match._tacticTarget(p),d=Math.hypot(target.x-p.x,target.y-p.y);
      if(d<31)continue;
      if(route){
        const color=match.teams[p.side].accent||match.teams[p.side].color;
        const ux=(target.x-p.x)/d,uy=(target.y-p.y)/d;
        ctx.setLineDash([14,7]);ctx.lineWidth=3.2;ctx.strokeStyle=color+'d8';ctx.shadowColor=color;ctx.shadowBlur=8;
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.shadowBlur=0;
        ctx.setLineDash([]);ctx.fillStyle=color;
        ctx.beginPath();ctx.moveTo(target.x,target.y);ctx.lineTo(target.x-ux*14-uy*7,target.y-uy*14+ux*7);ctx.lineTo(target.x-ux*14+uy*7,target.y-uy*14-ux*7);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.arc(target.x,target.y,6,0,Math.PI*2);ctx.strokeStyle='#ffffffb8';ctx.lineWidth=1;ctx.stroke();
      }else{
        ctx.setLineDash([6,10]);ctx.lineWidth=1.1;ctx.strokeStyle=match.teams[p.side].color+'2d';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(target.x-p.x)*.44,p.y+(target.y-p.y)*.44);ctx.stroke();
      }
    }
    ctx.restore();
  }
  if(!replaying&&!possessor&&match.ball.mode==='shot'){
    ctx.strokeStyle='#ffffff70';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-match.ball.vx*.11,b.y-match.ball.vy*.11);ctx.stroke();
    ctx.strokeStyle='#ffbf735a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-match.ball.vx*.07,b.y-match.ball.vy*.07);ctx.stroke();}
  if(possessor&&cameraFollow){
    ctx.save();const v=Math.hypot(possessor.vx||0,possessor.vy||0);
    if(v>12){const wiggle=Math.sin(match.time*.38)*2.5;
      ctx.strokeStyle='#fffbd35c';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(b.x-possessor.vx/Math.max(1,v)*19,b.y-possessor.vy/Math.max(1,v)*19+wiggle);
      ctx.lineTo(b.x-possessor.vx/Math.max(1,v)*5,b.y-possessor.vy/Math.max(1,v)*5);ctx.stroke();}
    ctx.restore();
  }
  // Replay: rastro elegante da bola, baseado apenas nas posições gravadas do lance.
  if(replaying&&replayScene&&match.lastGoal?.frames?.length){
    const frames=match.lastGoal.frames,index=Math.floor(replayIndex);
    ctx.save();ctx.lineWidth=4;ctx.strokeStyle='#ffe5ac9e';ctx.beginPath();
    let started=false;
    for(let j=Math.max(0,index-7);j<=Math.min(index,frames.length-1);j++){
      const pos=frames[j].ball;if(!pos)continue;
      if(!started){ctx.moveTo(pos.x,pos.y);started=true;}else ctx.lineTo(pos.x,pos.y);
    }
    if(started){ctx.lineTo(b.x,b.y);ctx.stroke();}
    ctx.restore();
  }
  drawBall(b.x,b.y,b.height||0);
  if(!replaying&&b.mode==='air'&&b.height>8){ctx.fillStyle='#fff0b6';ctx.textAlign='center';ctx.font='900 12px system-ui';ctx.fillText('CRUZAMENTO ALTO',b.x,b.y-b.height*.65-23);}
  if(match.phase==='goal'&&!replaying){ctx.fillStyle=`rgba(250,205,80,${Math.min(.23,match.goalFlash*.12)})`;ctx.fillRect(0,0,PITCH.width,PITCH.height);}
  ctx.restore(); // From world-space camera to fixed TV overlay coordinates.
  if(window.innerWidth>650||document.fullscreenElement===$('stadium'))drawRadar(); // Radar não cobre o campo no celular.
  syncMobilePitch();
  // Arsenal v7: o destaque fica no HUD lateral e não cobre a quadra.
  // drawSkillSpotlight();
  // Compact translucent phase tags: prioritize the actual play in full-screen.
  const phases=match.phaseCache||match.currentPhases();
  const isTV=!!document.fullscreenElement||$('stadium').classList.contains('fullscreen-active');
  ctx.font='800 11px system-ui';ctx.textAlign='left';
  const leftText=`${match.teams[0].short} · ${phaseLabel(phases[0])}`;
  ctx.fillStyle=isTV?'#0714259a':'#071425bf';ctx.fillRect(18,16,isTV?200:250,isTV?23:28);
  ctx.fillStyle='#e9f6ff';ctx.fillText(leftText,25,isTV?31:33);
  ctx.textAlign='right';ctx.fillStyle=isTV?'#0714259a':'#071425bf';ctx.fillRect(PITCH.width-(isTV?218:266),16,isTV?200:250,isTV?23:28);
  ctx.fillStyle='#f4efff';ctx.fillText(`${match.teams[1].short} · ${phaseLabel(phases[1])}`,PITCH.width-25,isTV?31:33);
  // O diretor do replay usa uma faixa externa para não cobrir a quadra.
  if(replaying)renderReplayDirector();
}

function highlightNewScore(){const s=match.score.join(':');if(s!==lastScore){lastScore=s;updateAll();}}
let lastCanvasAt=0,previousSlowFrame=0;
function frame(now){
 try{
  const dt=lastFrame?Math.min((now-lastFrame)/1000,.06):0;lastFrame=now;monitorFrameRate(now);
  if(replaying&&match.lastGoal?.frames?.length){const lastIndex=match.lastGoal.frames.length-1;const slowAt=lastIndex*.72;replayIndex+=dt*(replayIndex>=slowAt?4.5:12);replayFrame=Math.min(Math.floor(replayIndex),lastIndex);
    renderReplayDirector();
    if(replayFrame>=lastIndex){replaying=false;replayIndex=0;replayFrame=0;renderReplayDirector();$('liveBadge').textContent=match.finished?'FIM DE JOGO':'PAUSADO';$('matchBanner').textContent='Replay encerrado. Toque em Continuar para voltar à partida.';}}
  else if(playing&&match&&!match.finished){const speed=Number($('speed').value),tv=$('broadcastRhythm')?.checked&&speed<=2;
    const ball=match.ball,side=ball.owner?.side;
    const danger=ball.mode==='shot'||ball.mode==='air'||match.phase!=='play'||
      (side!=null&&match.progress(side,ball.x)>PITCH.right-PITCH.left-420)||
      (match.actionEffects||[]).some(e=>match.time>=e.start&&match.time<e.until&&stagePriority(e.kind)>=4);
    if(danger)lastBroadcastDangerAt=now;
    const linger=now-lastBroadcastDangerAt<1500;
    const requested=dt*(tv?(linger?1:Math.max(2.5,speed*1.5)):speed);
    // Turbo runs the SAME deterministic engine ticks as 1x, never skipping
    // shots, fouls, interceptions or goal events. Protect the UI from long
    // blocking frames and cap unbounded work after tab suspension.
    const turbo=speed>=40;
    accumulator=Math.min(turbo?1.5:.55,accumulator+requested);let iterations=0;
    const mode=graphicsMode(),limit=turbo?(mode==='low'?52:mode==='medium'?65:78):(mode==='low'?26:mode==='medium'?32:42);
    const start=performance.now(),maxWorkMs=turbo?(mode==='low'?19:mode==='medium'?23:26):(mode==='low'?13:mode==='medium'?17:19);
    while(accumulator>=TICK&&iterations<limit&&!match.finished){
      match.step(TICK);accumulator-=TICK;iterations++;
      if(iterations%5===0&&performance.now()-start>maxWorkMs)break;
    }
    if(match.finished){playing=false;$('play').textContent='🏁 Encerrado';}
    uiTimer+=dt;
    const freshEvent=match.events?.[0]?.id!==lastEventId;
    const scoreChanged=match.score.join(':')!==lastScore;
    if(uiTimer>.35||match.finished||scoreChanged||freshEvent){
      uiTimer=0;lastScore=match.score.join(':');updateAll();
    }
  }
  // The broadcast cut-in only consumes GPU/CPU when actually visible.
  const quality=graphicsMode();
  const turboDrawing=Number($('speed')?.value)>=40&&playing;
  const stageFps=turboDrawing?8:quality==='low'?12:quality==='medium'?18:24;
  if(activeTab==='match'&&stageVisible&&now-stageLastDraw>=1000/stageFps&&match){drawActionStage(now);stageLastDraw=now;}
  const fps=turboDrawing?18:quality==='low'?22:quality==='medium'?30:40;
  if(activeTab==='match'&&now-lastCanvasAt>=1000/fps){draw();lastCanvasAt=now;}
 }catch(error){
   console.error('Erro recuperável da partida:',error);
   playing=false;replaying=false;accumulator=0;lastFrame=0;
   const banner=$('matchBanner');if(banner)banner.textContent='⚠️ Uma animação falhou e foi pausada. Mude Gráficos para Leve e toque em Continuar. Detalhe: '+String(error?.message||error).slice(0,125);
   if($('play')&&!match?.finished)$('play').textContent='▶ Continuar';
 }finally{requestAnimationFrame(frame);}
}

function careerPlayerPortrait(name,club){const t=team(club)||TEAMS[0];return portrait(name,t);}
function formatBid(value){const amount=Math.max(0,Number(value)||0)/1000000;if(amount===0)return '¥ 0';return `¥ ${amount.toLocaleString('pt-BR',{maximumFractionDigits:1,minimumFractionDigits:amount<10?1:0})} mi`;}
function rankingHead(p,index,mode){const club=team(p.club);const value=mode==='ovr'?p.ovr:mode==='market'?E.Progression.estimateValue(p,p.ovr,p.role):mode==='evolution'?Object.values(p.boosts||{}).reduce((a,b)=>a+b,0):p.score;
  const delta=p.rankChange>0?`<span class="rank-change-up">▲${p.rankChange}</span>`:p.rankChange<0?`<span class="rank-change-down">▼${Math.abs(p.rankChange)}</span>`:'<span class="rank-change-flat">—</span>';
  const marketChange=Number(p.change||0);const marketBadge=mode==='market'&&p.games>0&&marketChange?`<small class="bid-trend ${marketChange>0?'up':'down'}">${marketChange>0?'▲':'▼'} ${formatBid(Math.abs(marketChange))} no último jogo</small>`:'';
  return `<div class="career-row"><span class="rank-position">${index+1}º</span>${careerPlayerPortrait(p.name,p.club)}<div class="career-data"><strong>${esc(p.name)}</strong><small>${esc(club?.short||p.club)} · ${p.ovr||'—'} OVR · ${p.games||0} jogos · ${p.goals||0} G · ${p.assists||0} A</small></div><div class="career-numbers"><b>${mode==='market'?formatBid(value):mode==='ovr'?value+' OVR':mode==='evolution'?'+'+value+' nível':Number(value||0).toFixed(1)+' pts'}</b>${marketBadge}${mode==='performance'?delta:''}</div></div>`;
}
function rosterMarket(career,clubFilter){
  const list=[],seen=new Set();
  for(const t of TEAMS.filter(t=>clubFilter==='all'||t.id===clubFilter)){
    for(const [i,name] of [...t.players,...t.reserves].entries()){
      const id=name+'|'+t.id;if(seen.has(id))continue;seen.add(id);
      const stored=career.players[id]||{};const role=i<t.players.length?t.formation[i]?.role||'MC':stored.role||'MC';
      const ovr=E.Attr.generate(name,role,i<t.players.length?i:1,stored).ovr;
      list.push({...stored,name,club:t.id,role,ovr,games:stored.games||0,goals:stored.goals||0,assists:stored.assists||0,score:stored.score||0});
    }
  }
  return list;
}
function renderCareerRanking(){if(!$('careerRankings'))return;const mode=$('rankMode')?.value||'performance',club=$('rankClub')?.value||'all';const career=E.Progression.ensure(season),ranked=E.Progression.rank(season,club);
  let data=ranked;
  if(mode==='ovr')data=rosterMarket(career,club).sort((a,b)=>b.ovr-a.ovr);
  else if(mode==='market')data=rosterMarket(career,club).sort((a,b)=>E.Progression.estimateValue(b,b.ovr,b.role)-E.Progression.estimateValue(a,a.ovr,a.role));
  else if(mode==='evolution')data=[...ranked].sort((a,b)=>Object.values(b.boosts||{}).reduce((x,y)=>x+y,0)-Object.values(a.boosts||{}).reduce((x,y)=>x+y,0)||b.score-a.score);
  const labels={performance:'Ranking por atuações registradas: gols, assistências, defesa, consistência e resultados.',ovr:'Capacidade posicional do elenco. O OVR não é o valor de mercado.',market:'Leilão fictício da Liga Neo Egoísta: atletas sem estreia começam com ¥0. Quem participa recebe ofertas ligadas a passes, defesa, gols e nota; atuações ruins podem diminuir o lance, mas não apagar a estreia. São ienes fictícios, não salário nem dinheiro real.',evolution:'Evolução real de atributos conquistada em partidas registradas.'};
  $('rankExplanation').textContent=labels[mode];$('rankCount').textContent=['ovr','market'].includes(mode)?`${data.length} atletas`:`${Object.keys(career.players).length} com jogos registrados`;
  $('careerRankings').innerHTML=data.length?data.slice(0,90).map((p,i)=>rankingHead(p,i,mode)).join(''):'<div class="empty-ranking">Nenhuma partida registrada ainda. Assista ou simule uma rodada para criar o ranking competitivo.</div>';
  renderCareerNarrative();
}
function renderCareerNarrative(){const c=E.Progression.ensure(season);const conn=Object.values(c.links||{}).sort((a,b)=>b.plays-a.plays).slice(0,12),rivals=Object.values(c.rivals||{}).sort((a,b)=>b.duels-a.duels).slice(0,8);
  $('careerConnections').innerHTML=(conn.map(x=>`<div class="connection-item"><b>🤝 ${esc(x.names.join(' + '))}</b><small>${esc(team(x.club)?.short||x.club)} · ${x.plays} gols criados juntos</small></div>`).join('')+rivals.map(x=>`<div class="connection-item rivalry"><b>⚔️ ${esc(x.names.join(' × '))}</b><small>${x.duels} confronto(s) com gols dos dois</small></div>`).join(''))||'<p class="hint">As conexões começam a aparecer quando houver gols com assistências ou duelos reais.</p>';
  $('careerStories').innerHTML=(c.stories||[]).slice(-16).reverse().map(x=>`<div class="story-item"><b>R${x.round}</b><span>${esc(x.text)}</span></div>`).join('')||'<p class="hint">As histórias surgirão de gols, grandes defesas, mestres e atuações decisivas registradas.</p>';
}
function renderMasterProfiles(){const box=$('masterProfiles');if(!box)return;box.innerHTML=(E.allTeams?.()||TEAMS).filter(t=>t.id!=='neo-bestxi'&&E.Masters.CONFIG[t.id]).map(t=>{const m=E.Masters.CONFIG[t.id],attr=E.Attr.generate(m.name,'ST',9);if(m.masterOvr)attr.ovr=m.masterOvr;return `<div class="master-profile">${portrait(m.name,t)}<div><strong>${esc(m.name)}</strong><small>${esc(t.short)} · ${esc(m.philosophy)} · OVR ${attr.ovr}</small><p>Arma: ${esc(E.Abilities.get(m.skill)?.label||'Especial')}</p></div></div>`;}).join('');}

// Galeria original: 239 SVGs locais, sem bloqueios de CDN nem artes de rosto trocado.
function initArsenal(){const team=$('arsenalTeam');if(!team)return;
 // Thousands of skills remain navigable on Android without rendering them all.
 if($('arsenalRarity')&&!$('neo2ArsenalSearch')){
  const find=document.createElement('input');
  find.id='neo2ArsenalSearch';find.type='search';find.className='neo2-arsenal-search';
  find.placeholder='Buscar habilidade pelo nome, efeito ou ID...';
  find.setAttribute('aria-label','Pesquisar no catálogo de habilidades');
  find.setAttribute('autocomplete','off');
  $('arsenalRarity').insertAdjacentElement('afterend',find);
  find.addEventListener('input',()=>{arsenalPageSize=36;renderArsenal();});
 }
 team.innerHTML=TEAMS.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('');team.value='bm';
 team.addEventListener('change',()=>{fillArsenalPlayers();renderArsenal();});
 $('arsenalPlayer').addEventListener('change',renderArsenal);
 $('arsenalRarity').addEventListener('change',()=>{arsenalPageSize=36;renderArsenal();});
 $('arsenalMode').addEventListener('change',()=>{arsenalPageSize=36;renderArsenal();});
 $('arsenalCategory').addEventListener('change',()=>{arsenalPageSize=36;renderArsenal();});
 $('arsenalPaging').addEventListener('click',e=>{if(e.target.closest('[data-more-arsenal]')){arsenalPageSize+=36;renderArsenal();}});
 fillArsenalPlayers();
}
function fillArsenalPlayers(preferred=null){const club=TEAMS.find(t=>t.id===$('arsenalTeam')?.value)||TEAMS[0],select=$('arsenalPlayer');if(!select)return;
 const prev=preferred||select.value,names=[...club.players,...club.reserves,club.master];
 select.innerHTML=names.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');
 select.value=names.includes(prev)?prev:names.find(n=>n==='Yoichi Isagi')||names.find(n=>n==='Michael Kaiser')||names.find(n=>E.Abilities.forPlayer(n))||names[0];
}
function openArsenalFor(name){const club=TEAMS.find(t=>[...t.players,...t.reserves,t.master].includes(name));if(!club)return;
 $('arsenalTeam').value=club.id;fillArsenalPlayers(name);$('arsenalCategory').value='all';$('arsenalMode').value='all';$('arsenalRarity').value='all';if($('neo2ArsenalSearch'))$('neo2ArsenalSearch').value='';setTab('arsenal');
 $('playerModal')?.classList.add('hidden');
}
let arsenalPageSize=36;
function renderArsenal(){const box=$('arsenalGrid');if(!box)return;
 const t=TEAMS.find(c=>c.id===$('arsenalTeam').value)||TEAMS[0];const name=$('arsenalPlayer').value;
 if(!name)return;
 const i=t.players.indexOf(name),reserve=i<0;
 const role=reserve?(name===t.master?'CA':'MEI'):(t.formation[i]?.role||'MEI');
 const career=season.career?.players?.[name+'|'+t.id]||{};
 const arsenal=E.Abilities.loadout(name,role,i<0?1:i,career);
 const usable=arsenal.filter(a=>!a.locked),signature=arsenal.filter(a=>a.owner===name);
 const selectedCategory=$('arsenalCategory').value,mode=$('arsenalMode').value,rarity=$('arsenalRarity')?.value||'all';
 const collection=mode==='common-catalog'?E.Abilities.commonCatalog():mode==='full-catalog'?E.Abilities.fullCatalog():arsenal;
 const needle=String($('neo2ArsenalSearch')?.value||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
 const filtered=collection.filter(a=>(!needle||[a.label,a.description,a.category,a.id].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').includes(needle))&&
   (selectedCategory==='all'||a.contexts.includes(selectedCategory))&&(rarity==='all'||a.rarity===rarity)&&
   (mode==='common-catalog'||mode==='full-catalog'||mode==='all'||mode==='available'&&!a.locked||mode==='locked'&&a.locked||mode==='signature'&&a.owner===name));
 $('arsenalTotal').textContent=E.Abilities.list().length+' ARTES';
 $('arsenalPlayerInfo').innerHTML=`${portrait(name,t,'arsenal-featured-portrait')}<div><small>${esc(t.short)} · ${esc(role)}</small><h3>${esc(name)}</h3><p>${arsenal.length} técnicas no arsenal · ${usable.length} desbloqueadas · ${signature.length} exclusivas · ${arsenal.filter(a=>a.rarity==='Comum').length} Comuns · 7 raridades</p></div>`;
 const nGames=career.games||0;
 const mechanic={dribble:'Fintas, espaço e controle em duelos.',shot:'Precisão, posicionamento e risco de bloqueio.',pass:'Ângulo, química e leitura de espaços.',save:'Reflexo, alcance e disputa com o chute.',tackle:'Bote, antecipação e reação do atacante.'};
 $('arsenalProgress').innerHTML=`<div><b>⚡ ${usable.length} prontas para a partida</b><small>${arsenal.length-usable.length} evoluções pendentes · ${nGames} partida(s) registrada(s)</small></div><div class="arsenal-track"><i style="width:${(100*usable.length/Math.max(1,arsenal.length)).toFixed(1)}%"></i></div><span>✦ Rara: 2 jogos · Épica: 5 · Lendária: 8 · Mítica: 12 · Divina: 17 + desempenho e Flow.</span>`;
 box.innerHTML=filtered.slice(0,arsenalPageSize).map(a=>`<article class="arsenal-card ${a.locked?'locked':''}" style="--skill-color:${a.color}">
 <div class="arsenal-art"><img src="${skillArtUrl(a.id)}" alt="Arte original: ${esc(a.label)}" loading="lazy">${a.locked?'<span class="skill-lock">🔒 EM EVOLUÇÃO</span>':a.owner?'<span class="skill-signature">✦ EXCLUSIVA</span>':''}</div>
 <div class="arsenal-copy"><div class="skill-rarity rarity-${({Comum:'common',Incomum:'uncommon',Rara:'rare','Épica':'epic','Lendária':'legendary','Mítica':'mythic',Divina:'divine'})[a.rarity]||'legacy'}">${esc(a.rarity||'Legado')}</div><h3>${esc(a.label)}</h3><p>${esc(a.description)}</p><div class="arsenal-tags"><span>${esc(a.category)}</span><span>×${a.multiplier.toFixed(2)} ${esc(E.Attr.LABELS[a.stat]||a.stat)}</span><span>⚡ ${a.cost} energia</span><span>↻ ${a.cooldown}s</span><span>⏱ ${a.duration}s</span></div>${a.rarity!=='Legado'?`<small class="skill-condition">↪ ${esc(a.condition||'Durante uma jogada compatível.')}</small>`:''}<small class="skill-behavior">${esc(mechanic[a.contexts[0]]||'Efeito contextual')} ${a.rarity==='Divina'||a.rarity==='Legado'&&a.tier===3?'Requer Flow.':''}</small>${a.locked?`<small class="skill-unlock">Desbloqueio: ${a.minGames|| (a.tier===2?3:8)} jogos${a.minPerformance?' + desempenho '+a.minPerformance:''}${a.rarity==='Divina'?' + Flow para ativar':''}.</small>`:a.requiresFlow?'<small class="skill-unlock">Ativação apenas no estado Flow.</small>':''}</div></article>`).join('')||'<p class="hint">Nenhuma técnica corresponde a este filtro.</p>';
 const paging=$('arsenalPaging');if(paging)paging.innerHTML=filtered.length>arsenalPageSize?`<p class="hint">Mostrando ${Math.min(arsenalPageSize,filtered.length)} de ${filtered.length} técnicas</p><button type="button" class="button ghost" data-more-arsenal="1">Mostrar mais 36 habilidades</button>`:`<p class="hint">${filtered.length} técnica(s) neste filtro</p>`;
}
function renderAbilityCatalog(){const box=$('abilityCatalog');if(!box)return;const all=E.Abilities.list();const signatures=all.filter(a=>a.owner),common=all.filter(a=>a.rarity==='Comum'),tiers=E.Abilities.RARITY_ORDER;
 box.innerHTML=`<div class="ability-catalog-summary"><b>${all.length} técnicas registradas · ${tiers.map(r=>r+": "+all.filter(a=>a.rarity===r).length).join(" · ")} · ${signatures.length} assinaturas individuais · artes offline</b><p class="hint">Os personagens possuem arsenais com tempo de recarga, custo de energia e desbloqueios. Abra a galeria para consultar cada arte.</p><button type="button" class="button primary" data-open-arsenal="1">✦ Explorar Arsenal completo</button></div>`;
}
function renderEgoLive(){const e=$('egoLive');if(!e||!match)return;const owner=match.ball.owner,second=match.players.filter(p=>p.side!==owner?.side).sort((a,b)=>(b.ego||0)-(a.ego||0))[0];const picks=[owner,second].filter(Boolean);e.innerHTML=picks.map(p=>{const flow=p.flowUntil>match.time,ability=E.Abilities.forPlayer(p.name);return `<div class="ego-player">${portrait(p.name,match.teams[p.side])}<div><div class="ego-head"><b>${esc(p.name)}</b><span>${p.attributes?.ovr||'—'} OVR ${flow?'<strong class="flow-tag">FLOW!</strong>':''}</span></div><div class="ego-meter"><i style="width:${Math.round(p.ego||0)}%;background:${flow?'#d6a8ff':'#55baff'}"></i></div><small>Ego ${Math.round(p.ego||0)}/100${ability?' · '+esc(ability.label):''}</small></div></div>`;}).join('');}
function renderLiveArsenal(){
  const box=$('liveArsenal');if(!box||!match)return;
  const history=match.abilityHistory||[];
  const recent=history.slice(-4).reverse();
  $('liveAbilityCount').textContent=history.length+' ativaç'+(history.length===1?'ão':'ões');
  const html=recent.map(x=>{
    const a=E.Abilities.get(x.id),player=match.players.find(p=>p.name===x.name&&match.teams[p.side]?.id===x.team);
    const cool=player&&a?Math.max(0,Math.ceil((player.abilityCooldowns?.[a.id]||0)-match.time)):0;
    const style=skillVisual(a);
    return `<div class="live-arsenal-item" style="--skill-accent:${style.color}" title="${esc(x.name)} · ${esc(x.label)}"><span class="live-skill-symbol skill-type-${style.type}" aria-hidden="true">${style.icon}</span><div><b>${esc(x.name)}</b><span>${esc(x.label)}</span></div><small>${cool?'↻ '+cool+'s':'✓'}</small></div>`;
  }).join('');
  setIfChanged(box,html||'<span class="hint">Nenhuma técnica foi utilizada ainda.</span>');
}
function renderMastersLive(){const el=$('mastersLive');if(!el||!match)return;const active=match.masterStates.filter(Boolean);if(!active.length){el.innerHTML='';return;}el.innerHTML=active.map(s=>`<div class="active-master">🌟 <b>${esc(s.player.name)}</b> · ${esc(s.record.philosophy)} <span>⏱ ${Math.max(0,Math.ceil(s.record.until-match.time))}s restantes</span></div>`).join('');}

function renderSeasonHistory(){const el=$('seasonHistory');if(!el)return;const past=season.pastSeasons||[];
  el.innerHTML=past.length?past.slice().reverse().map(p=>`<div class="archive-row"><strong>Edição ${p.number}: ${esc(p.champion?'🏆 '+p.champion:'Líder: '+p.leader)}</strong><small>${p.played}/${p.total} jogos registrados · tabela arquivada</small></div>`).join(''):'<p class="hint">Ao iniciar outra edição, a tabela anterior será arquivada aqui. Nenhuma partida será inventada.</p>';
}
function renderLeague(){const round=currentRound();$('round').textContent=round?`RODADA ${round.round} / ${season.rounds.length}`:'TEMPORADA ENCERRADA';$('simulateRound').disabled=!round||simBusy;$('simulateSeason').disabled=!round&& !simBusy;
  const ranks=E.standings(season);
  $('standings').innerHTML=ranks.map((r,i)=>`<tr><td>${i+1}º</td><td><div class="club-row">${teamArt(r.team,'club-art-table')}<span>${esc(r.team.short)}</span></div></td><td>${r.J}</td><td>${r.V}</td><td>${r.E}</td><td>${r.D}</td><td>${r.GP}</td><td>${r.GC}</td><td>${r.SG>0?'+':''}${r.SG}</td><td>${r.PTS}</td></tr>`).join('');
  $('champion').hidden=!!round;if(!round)$('champion').textContent=`🏆 CAMPEÃO: ${ranks[0].team.name} — ${ranks[0].PTS} pontos!`;
  $('fixtures').innerHTML=round?round.games.map((f,i)=>`<div class="fixture"><div class="fixture-title fixture-title-rich"><span class="fixture-club">${crest(team(f.home),'crest-xs')} ${esc(team(f.home).short)}</span><span style="color:#8294a9">×</span><span class="fixture-club">${crest(team(f.away),'crest-xs')} ${esc(team(f.away).short)}</span></div><span class="fixture-score">${f.result?line(...f.result):'—'}</span>${f.result?'':`<button class="button" data-watch="${i}">Assistir</button>`}</div>`).join(''):'<p class="hint">Todos os 40 jogos foram disputados! 🏆</p>';
  document.querySelectorAll('[data-watch]').forEach(b=>b.addEventListener('click',()=>{const r=currentRound(),f=r.games[Number(b.dataset.watch)];prepare(f.home,f.away,f);setTab('match');window.scrollTo({top:0,behavior:'smooth'});}));
  if(!roundView||roundView>season.rounds.length)roundView=round?.round||season.rounds.length;renderCalendar();renderSeasonHistory();
}
function renderCalendar(){const r=season.rounds[roundView-1];$('shownRound').textContent=`Rodada ${roundView} / ${season.rounds.length}`;$('prevRound').disabled=roundView===1;$('nextRound').disabled=roundView===season.rounds.length;
  $('calendar').innerHTML=r.games.map(f=>`<div class="calendar-entry"><span class="calendar-clubs"><span class="fixture-club">${crest(team(f.home),'crest-xs')} ${esc(team(f.home).name)}</span> <span style="color:#7189a6">vs</span> <span class="fixture-club">${crest(team(f.away),'crest-xs')} ${esc(team(f.away).name)}</span></span><strong>${f.result?`${f.result[0]} — ${f.result[1]}`:'A disputar'}</strong></div>`).join('');
}
function renderStats(){const rank=(data,id)=>{const entries=Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,25);
  $(id).innerHTML=entries.length?entries.map(([key,val],i)=>{const sep=key.lastIndexOf('|'),name=key.slice(0,sep),t=team(key.slice(sep+1));return `<div class="rank"><span class="rank-num">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><span class="fixture-club">${t?portrait(name,t,'mini-avatar'):''}<span>${esc(name)} <small>· ${esc(t?.short||'')}</small></span></span><b>${val}</b></div>`;}).join(''):'<p class="hint">Comece o campeonato para registrar jogadores no ranking.</p>';
 };rank(season.scorers,'scorers');rank(season.assists,'assists');}

function galleryMembers(){
  // Include all playable squads, not just the five original Neo Egoist teams.
  // System-generated Best XI is excluded to avoid duplicating players' photos.
  const available=typeof E.allTeams==='function'?E.allTeams():TEAMS;
  return available.filter(t=>t&&t.id!=='neo-bestxi').flatMap(t=>[
   ...(t.players||[]).map((name,i)=>({name,t,kind:'Titular',role:(roleList(t)[i]||'JOG')})),
   ...(t.reserves||[]).map(name=>({name,t,kind:'Reserva',role:'RES'})),
   ...(t.master?[{name:t.master,t,kind:'Master Striker',role:'★'}]:[])
  ]);
}
function renderPortraitGallery(){
  const el=$('portraitGallery');if(!el)return;
  const members=galleryMembers(),teamId=$('galleryTeam')?.value||'bm',kind=$('galleryType')?.value||'all',needle=($('gallerySearch')?.value||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const hasImage=name=>isPortraitAvailable(name);
  const results=members.filter(({name,t})=>(teamId==='all'||t.id===teamId)&&(!needle||[name,t.name,t.short].some(value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').includes(needle)))&&(kind==='all'||(kind==='anime'&&hasImage(name))||(kind==='official'&&!!OFFICIAL_MANGA[name])||(kind==='premium'&&portraitStyle(name)==='premium')||(kind==='custom'&&!!customPortraits[name])||(kind==='manga'&&hasManga(name))||(kind==='original'&&!!ORIGINAL_ART[name])||(kind==='wiki'&&!!WIKI_REFERENCES[name])||(kind==='wikiphoto'&&!!WIKI_PORTRAITS[name])));
  const total=members.length,available=members.filter(m=>hasImage(m.name)).length;
  $('galleryCount').textContent=`${total} integrantes`;
  $('galleryStats').textContent=`${total} integrantes · ${members.filter(m=>!!OFFICIAL_MANGA[m.name]).length} retratos oficiais remotos · ${members.filter(m=>!!WIKI_PORTRAITS[m.name]).length} arquivos Wiki vinculados · ${members.filter(m=>!!WIKI_REFERENCES[m.name]).length} páginas Wiki · ${members.filter(m=>hasManga(m.name)).length} imagens importadas · ${members.filter(m=>!!ORIGINAL_ART[m.name]).length} reservas offline` ;
  $('galleryShown').textContent=`${results.length} MOSTRADOS`;
  // While searching, show only the player's name and team. Open the card after selecting.
  if(needle){
    el.innerHTML='<div class="neo992-search-results" role="list">'+results.map(({name,t})=>
      `<button type="button" class="neo992-search-result" data-gallery-jump="${encodeURIComponent(name)}" data-gallery-jump-team="${esc(t.id)}" aria-label="Abrir ${esc(name)} do ${esc(t.name)}"><strong>${esc(name)}</strong><small>${esc(t.name)}</small></button>`
    ).join('')+'</div>'+(results.length?'':'<p class="hint">Nenhum jogador encontrado.</p>');
    return;
  }
  el.innerHTML=results.map(({name,t,kind,role})=>{
    const mode=portraitStyle(name),hasAnime=hasImage(name),hasCustom=!!customPortraits[name],manga=hasManga(name);
    const status=mode==='bundled'&&BUNDLED_PORTRAITS[name]?'✅ Foto principal offline':mode==='official'&&OFFICIAL_MANGA[name]?'📚 Editora · buscando foto':mode==='wiki'&&WIKI_PORTRAITS[name]?'📸 Wiki · buscando foto':manga&&mode==='manga'?'Mangá · imagem enviada':hasCustom&&mode==='custom'?'Personalizada':mode==='original'?'Ilustração genérica opcional':hasAnime&&mode==='anime'?'Imagem externa não verificada':'Avatar reserva';
    return `<article class="portrait-card" data-gallery-player="${encodeURIComponent(name)}">${portrait(name,t,'portrait-card-photo')}<span class="gallery-tag ${hasAnime?'real':hasCustom?'custom':''}">${status}</span><div class="portrait-card-info"><strong>${esc(name)}</strong><small>${esc(t.short)} · ${kind} · ${role}</small></div><div class="portrait-actions">${BUNDLED_PORTRAITS[name]?`<button class="button ghost ${mode==='bundled'?'active':''}" data-portrait-style="bundled" data-player="${encodeURIComponent(name)}" type="button">⭐ Foto principal</button>`:''}${manga?`<button class="button ghost ${mode==='manga'?'active':''}" data-portrait-style="manga" data-player="${encodeURIComponent(name)}" type="button">📖 Mangá</button>`:''}${WIKI_PORTRAITS[name]?`<button class="button ghost ${mode==='wiki'?'active':''}" data-portrait-style="wiki" data-player="${encodeURIComponent(name)}" type="button">📸 Retrato Wiki</button><a class="button ghost manga-search-link" href="${esc(WIKI_PORTRAITS[name].source)}" target="_blank" rel="noopener noreferrer">🔗 Arquivo</a>`:''}${OFFICIAL_MANGA[name]?`<button class="button ghost ${mode==='official'?'active':''}" data-portrait-style="official" data-player="${encodeURIComponent(name)}" type="button">📚 Editora</button><a class="button ghost manga-search-link" href="${esc(OFFICIAL_MANGA[name].source)}" target="_blank" rel="noopener noreferrer">🔗 Fonte</a>`:''}<button class="button ghost ${mode==='original'?'active':''}" data-portrait-style="original" data-player="${encodeURIComponent(name)}" type="button">🎨 Original</button><button class="button ghost ${mode==='premium'?'active':''}" data-portrait-style="premium" data-player="${encodeURIComponent(name)}" type="button">Premium</button>${WIKI_REFERENCES[name]?`<a class="button ghost manga-search-link" href="${esc(WIKI_REFERENCES[name].source)}" target="_blank" rel="noopener noreferrer" title="Fonte da Wiki, não é foto incluída no ZIP">🔗 Wiki</a>`:''}<a class="button ghost manga-search-link" href="https://www.pinterest.com/search/pins/?q=${encodeURIComponent(TEAMS.some(original=>original.id===t.id)?'Blue Lock '+name+' manga panel':name+' '+t.name+' football player photo')}" target="_blank" rel="noopener noreferrer" aria-label="Pesquisar ${esc(name)} no Pinterest">🔎 Pinterest</a><button class="button ghost" data-manga-edit="${encodeURIComponent(name)}" type="button">📖 Enviar mangá</button><button class="button ghost ${mode==='custom'?'active':''}" data-portrait-edit="${encodeURIComponent(name)}" type="button">📷 Trocar</button><button class="button ghost" data-portrait-restore="${encodeURIComponent(name)}" type="button">↻ Restaurar</button>${hasAnime?`<button class="button ghost" data-portrait-report="${encodeURIComponent(name)}" type="button">⚠ Imagem errada</button>`:''}</div></article>`;
  }).join('')||'<p class="hint">Nenhum jogador encontrado. Experimente outro time ou limpe os filtros.</p>';
}
function renderSquads(){
 $('squadCards').innerHTML=(E.allTeams?.()||TEAMS).filter(t=>TEAMS.includes(t)||t.id==='ht').map(t=>`<article class="squad-card"><div class="squad-top"><h3>${teamArt(t,'club-art-squad')} ${esc(t.name)}</h3><span style="color:#92b5d9;font-size:10px">${esc(styleDescription(t))}</span></div><div class="squad-master">★ Master Striker: ${esc(t.master)} · Formação ${esc(t.formationName||'')}</div><div class="bars">${[['ATAQUE',t.atk],['DEFESA',t.def],['PASSE',t.pas]].map(([label,val])=>`<div class="bar-line"><span>${label}</span><div><i style="width:${val}%;background:${t.color}"></i></div><b>${val}</b></div>`).join('')}</div><div class="roster">${t.players.map((name,i)=>`<div class="roster-player"><small>${(roleList(t)[i]||'JOG')}</small><span>${portrait(name,t,'mini-avatar')}${esc(name)} ${(SKILLS[name]||[]).length?'<span class="star">✦</span>':''}</span><button class="arsenal-open-mini" type="button" data-open-player-arsenal="${encodeURIComponent(name)}">✦ ${E.Abilities.loadout(name,roleList(t)[i]||'MEI',i,season.career?.players?.[name+'|'+t.id]).length}</button><button class="portrait-change" type="button" data-portrait-edit="${encodeURIComponent(name)}" aria-label="Trocar imagem de ${esc(name)}">📷</button></div>`).join('')}</div><div class="reserve-title">RESERVAS</div><div class="reserve-list reserve-gallery">${t.reserves.map(name=>`<span class="reserve-entry">${portrait(name,t,'mini-avatar')}<span>${esc(name)}</span></span>`).join('')}</div></article>`).join('');}
function renderRecords(){
  const now=match?.goalRecords||[];
  $('currentGameGoals').innerHTML=now.length?now.map((g,i)=>`<div class="goal-entry">${teamArt(match.teams[g.side],'club-art-table')}<span class="goal-entry-main"><b>${portrait(g.scorer,match.teams[g.side])} ⚽ ${esc(g.scorer)}</b><small>${esc(match.teams[g.side].name)} · ${g.score[0]} × ${g.score[1]}${g.assister?' · 🎯 '+esc(g.assister):' · Sem assistência'}</small></span><span class="goal-minute">${g.minute}'</span><button class="replay-goal" data-replay-goal="${i}" ${match.goalClips?.[i]?'':'disabled'}>▶ Lance</button></div>`).join(''):'<p class="hint">Nenhum gol ainda. Comece uma partida e os autores e assistentes aparecerão aqui.</p>';
  const filter=$('recordsTeam').value||'all',query=($('recordsSearch').value||'').trim().toLocaleLowerCase('pt-BR');
  const parsed=(data)=>Object.entries(data||{}).map(([key,value])=>{const at=key.lastIndexOf('|');return {name:key.slice(0,at),teamId:key.slice(at+1),value:Number(value)||0};}).filter(e=>(filter==='all'||filter===e.teamId)&&e.name.toLocaleLowerCase('pt-BR').includes(query));
  const scorers=parsed(season.scorers).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name));
  const assists=parsed(season.assists).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name));
  const drawRank=(rows)=>rows.length?rows.slice(0,50).map((p,i)=>`<div class="record-row"><span class="record-number">${i+1}</span>${teamArt(team(p.teamId),'club-art-table')}<span class="record-name"><b>${portrait(p.name,team(p.teamId))}${esc(p.name)}</b><small>${esc(team(p.teamId).short)}</small></span><strong class="record-value">${p.value}</strong></div>`).join(''):'<p class="hint">Nenhum registro para este filtro.</p>';
  $('recordsScorers').innerHTML=drawRank(scorers);
  $('recordsAssists').innerHTML=drawRank(assists);
  const map=new Map();for(const x of scorers){map.set(x.name+'|'+x.teamId,{...x,goals:x.value,assists:0});}
  for(const x of assists){const key=x.name+'|'+x.teamId;const old=map.get(key)||{...x,goals:0};old.assists=x.value;map.set(key,old);}
  const contributions=[...map.values()].map(p=>({...p,value:(p.goals||0)+(p.assists||0)})).sort((a,b)=>b.value-a.value||b.goals-a.goals);
  $('contributions').innerHTML=contributions.length?contributions.slice(0,30).map((p,i)=>`<div class="record-row"><span class="record-number">${i+1}</span>${teamArt(team(p.teamId),'club-art-table')}<span class="record-name"><b>${portrait(p.name,team(p.teamId))}${esc(p.name)}</b><small>${p.goals||0} gols · ${p.assists||0} assistências</small></span><strong class="record-value">${p.value}</strong></div>`).join(''):'<p class="hint">Ainda não há participações registradas.</p>';
  const all=Array.isArray(season.goalLog)?season.goalLog:[];
  const log=all.filter(g=>(filter==='all'||g.team===filter)&&(!query||g.scorer.toLocaleLowerCase('pt-BR').includes(query)||(g.assister||'').toLocaleLowerCase('pt-BR').includes(query))).sort((a,b)=>b.round-a.round||b.minute-a.minute);
  const totalGoals=Object.values(season.scorers||{}).reduce((sum,v)=>sum+(Number(v)||0),0);
  $('recordsTotal').textContent=totalGoals+' gol'+(totalGoals===1?'':'s');
  $('goalHistory').innerHTML=log.length?log.slice(0,250).map(g=>`<div class="goal-entry">${teamArt(team(g.team),'club-art-table')}<span class="goal-entry-main"><b>${portrait(g.scorer,team(g.team))}${esc(g.scorer)}</b><small>Rodada ${g.round} · ${esc(team(g.home).short)} ${g.score[0]} × ${g.score[1]} ${esc(team(g.away).short)}${g.assister?' · 🎯 '+esc(g.assister):''}</small></span><span class="goal-minute">${g.minute}'</span></div>`).join(''):'<p class="hint">Sem gols registrados neste filtro. Os jogos da liga preenchem o histórico automaticamente.</p>';
  if(!all.length&&totalGoals>0)$('goalHistory').innerHTML='<p class="hint">Sua temporada anterior conserva os totais; o histórico minuto a minuto só será preenchido nos jogos disputados nesta versão.</p>';
}
async function runFixture(f){
  const sim=new Match(f.home,f.away,Math.floor(Math.random()*0xffffffff),E.Progression.ensure(season),season);
  sim.rollGameplan(); // Every simulated fixture has its own independent strategy draw.
  let ticks=0;
  // Yield every ~13 virtual seconds: do not block touch interactions on Android.
  while(!sim.finished&&ticks<14000){
    for(let j=0;j<400&&!sim.finished;j++,ticks++)sim.step(TICK);
    if(cancelSim)return false;
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(!sim.finished)sim.finish();
  E.recordFixture(season,f,sim);saveSeason();return true;
}
function setSimButtons(){
  $('simulateRound').textContent=simBusy?'⏳ Simulando...':'⚡ Simular rodada';
  $('simulateSeason').textContent=simBusy?'⏹ Parar simulação':'⏩ Simular temporada';
  $('simulateRound').disabled=simBusy||!currentRound();
  $('newSeason').disabled=simBusy;
  $('simulateSeason').disabled=!simBusy&&!currentRound();
}
async function simulateRound(){
  if(simBusy||!currentRound())return;
  simBusy=true;cancelSim=false;playing=false;replaying=false;setSimButtons();
  try{const r=currentRound();for(const f of r.games)if(!f.result){if(!await runFixture(f))break;}}
  finally{simBusy=false;cancelSim=false;setSimButtons();renderLeague();renderStats();}
}
async function simulateSeason(){
  if(simBusy){cancelSim=true;$('simulateSeason').textContent='⏳ Parando...';return;}
  if(!currentRound())return;
  simBusy=true;cancelSim=false;playing=false;replaying=false;setSimButtons();
  try{
    let r=currentRound();
    while(r&&!cancelSim){
      for(const f of r.games){if(!f.result){if(!await runFixture(f))break;}}
      roundView=r.round;renderLeague();renderStats();setSimButtons();
      if(cancelSim)break;
      r=currentRound();await new Promise(resolve=>setTimeout(resolve,12));
    }
  }finally{simBusy=false;cancelSim=false;setSimButtons();renderLeague();renderStats();}
}
function openPlayer(clientX,clientY){if(!match)return;
  const rect=canvas.getBoundingClientRect();
  // Correct mapping for aspect-ratio crop/letterboxing on portrait mobile screens.
  // CSS object-fit:cover enlarges the field without changing ball physics.
  const css=getComputedStyle(canvas),fit=css.objectFit||'contain';
  const baseW=PITCH.width,baseH=PITCH.height;
  const scale=fit==='cover'?Math.max(rect.width/baseW,rect.height/baseH):Math.min(rect.width/baseW,rect.height/baseH);
  const drawW=baseW*scale,drawH=baseH*scale;
  const left=(rect.width-drawW)/2,top=(rect.height-drawH)/2;
  const canvasX=(clientX-rect.left-left)/scale,canvasY=(clientY-rect.top-top)/scale;
  const z=cameraFollow?cameraActualZoom:1;
  const x=cameraFollow?(canvasX-PITCH.cx)/z+cameraX:canvasX;
  const y=cameraFollow?(canvasY-PITCH.cy)/z+cameraY:canvasY;
  const hit=match.players.map(p=>({p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];if(!hit||hit.d>(cameraFollow?23:29))return;
  const p=hit.p,t=match.teams[p.side],s=SKILLS[p.name]||[],identity=E.PLAYER_STYLES?.[p.name];
  const career=season.career?.players?.[p.name+'|'+t.id];const ownArsenal=E.Abilities.loadout(p.name,p.role,p.i,career);
  $('playerDetails').innerHTML=`<div class="player-head">${portrait(p.name,t)}<div><div class="player-overline">${esc(t.name)} · ${p.role}</div><h2 class="player-name">${esc(p.name)}</h2></div></div>${identity?`<div class="hint">✦ Estilo: ${esc(identity.label)}</div>`:''}<div class="player-pill">✦ ${ownArsenal.length} técnicas · ${ownArsenal.filter(v=>!v.locked).length} disponíveis · ${Object.values(p.abilityUses||{}).reduce((sum,n)=>sum+n,0)} ativações</div><div class="player-skill-peek">${ownArsenal.slice(0,6).map(a=>`<img src="${skillArtUrl(a.id)}" alt="Arte da habilidade ${esc(a.label)}" title="${esc(a.label)}" loading="lazy">`).join('')}</div><button type="button" class="button primary" data-open-player-arsenal="${encodeURIComponent(p.name)}">✦ Abrir arsenal completo</button><div><button type="button" class="button ghost" data-portrait-edit="${encodeURIComponent(p.name)}">📷 Trocar imagem do jogador</button></div><div class="player-stats">⚡ Velocidade: ${Math.round(p.speed)}<br>💪 Resistência: ${Math.round(p.stamina)}%<br>⚽ Gols: ${p.goals}<br>🎯 Assistências: ${p.assists}<br>🏃 Corridas: ${p.runCount||0}<br>⚡ Ultrapassagens: ${p.overlapCount||0}<br>📊 Finalizações: ${p.shots}<br>🛡️ Desarmes: ${p.tackles}<br>⭐ Nota: ${px(p.rating,1)}<br>⚡ Ego: ${Math.round(p.ego||0)}/100 · Flow: ${p.flowUntil>match.time?'ATIVO':'Inativo'}<br>🌟 OVR: ${p.attributes?.ovr||'—'}</div><div class="modal-attr-grid">${E.Attr.KEYS.map(k=>`<div><small>${esc(E.Attr.LABELS[k])}</small><b>${p.attributes?.[k]||0}</b><i style="width:${p.attributes?.[k]||0}%"></i></div>`).join('')}</div>`;
  $('playerModal').classList.remove('hidden');
}

const portraitInput=document.createElement('input');portraitInput.type='file';portraitInput.accept='image/*';portraitInput.style.display='none';document.body.appendChild(portraitInput);
let portraitEditing=null;
function selectPortrait(name){
  portraitEditing=name;
  const status=$('portraitNotice');
  if(status)status.textContent='📷 Selecione uma foto de '+name+'.';
  if(window.BlueLockAndroid?.pickPortrait){
    try{window.BlueLockAndroid.pickPortrait(name);return;}
    catch(error){console.warn('Seletor nativo indisponível, tentando seletor padrão:',error);}
  }
  portraitInput.value='';portraitInput.click();
}
window.addEventListener('neo:native-portrait',async event=>{
  const {name,data}=event.detail||{};
  if(typeof name!=='string'||!name||typeof data!=='string'||!data.startsWith('data:image/jpeg;base64,'))return;
  const note=$('portraitNotice');
  try{
    await savePortraitImage('custom',name,data);
    if(note)note.textContent='✅ Foto de '+name+' salva com sucesso no aparelho!';
    refreshPortraits();
  }catch(error){
    if(note)note.textContent='⚠️ Não foi possível salvar a imagem: '+String(error?.message||error);
  }
});
window.addEventListener('neo:native-portrait-error',event=>{
  const note=$('portraitNotice'),message=String(event.detail?.message||'Falha na leitura da imagem.');
  if(note){
    note.textContent='⚠️ '+message+' ';
    const button=document.createElement('button');
    button.type='button';button.textContent='📂 Tentar pela Galeria';
    button.addEventListener('click',()=>{portraitInput.value='';portraitInput.click();},{once:true});
    note.append(button);
  }
});
portraitInput.addEventListener('change',async()=>{
  const file=portraitInput.files?.[0];if(!file||!portraitEditing)return;
  const name=portraitEditing;
  try{
    const data=await fileToPortrait(file);
    await savePortraitImage('custom',name,data);
    const note=$('portraitNotice');if(note)note.textContent=`✅ Imagem de ${name} salva com sucesso.`;
    try{refreshPortraits();}catch(e){console.warn('Imagem salva; falha ao atualizar galeria:',e);}
    if($('playerModal'))$('playerModal').classList.add('hidden');
  }catch(e){
    console.warn('Falha na importação do retrato:',e);
    const message=String(e?.message||'Falha desconhecida');
    const note=$('portraitNotice');if(note)note.textContent='⚠️ '+message;
    else alert('⚠️ '+message);
  }finally{portraitInput.value='';portraitEditing=null;}
});

document.addEventListener('click',e=>{const b=e.target.closest('[data-portrait-edit]');if(b){const name=decodeURIComponent(b.dataset.portraitEdit||'');if(name)selectPortrait(name);}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-portrait-style]');if(b){setPortraitStyle(decodeURIComponent(b.dataset.player||''),b.dataset.portraitStyle);}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-portrait-report]');if(!b)return;const name=decodeURIComponent(b.dataset.portraitReport||'');if(!name)return;reportedPortraits[name]=true;portraitStyles[name]='premium';savePortraitReports();try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}refreshPortraits();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-portrait-restore]');if(!b)return;const name=decodeURIComponent(b.dataset.portraitRestore||'');if(!name)return;delete reportedPortraits[name];failedPortraits.delete(name);portraitStyles[name]=hasManga(name)?'manga':OFFICIAL_MANGA[name]?'official':WIKI_PORTRAITS[name]?'wiki':'premium';savePortraitReports();try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}refreshPortraits();});


// v6.0.2: bulk import of images supplied by the player. Only unambiguous names are auto-assigned.
function simplifyPortraitName(value){return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\.(png|jpg|jpeg|webp|gif)$/i,'').replace(/[^a-z0-9]+/g,' ').trim();}
const PORTRAIT_ALIASES={'Espresso':['espesso'],'Rook':['rooke'],'Michael Kaiser':['kaiser'],'Yoichi Isagi':['isagi'], 'Rin Itoshi':['rin'], 'Shoei Baro':['barou','baro'], 'Ryusei Shido':['shidou','shido'], 'Seishiro Nagi':['nagi'], 'Meguru Bachira':['bachira'],'Hyoma Chigiri':['chigiri'],'Reo Mikage':['reo'], 'Rensuke Kunigami':['kunigami'], 'Gin Gagamaru':['gagamaru'],'Jyubei Aryu':['aryu'], 'Aoshi Tokimitsu':['tokimitsu'], 'Oliver Aiku':['aiku'], 'Don Lorenzo':['lorenzo'], 'Noel Noa':['noa'], 'Marc Snuffy':['snuffy'], 'Julian Loki':['loki'], 'Chris Prince':['prince'], 'Alexis Ness':['ness']};
function uniquePortraitMatch(filename){
  const words=simplifyPortraitName(filename).split(' '), key=words.join(' ');
  const all=galleryMembers().map(v=>v.name);
  const matches=all.filter(name=>{
    const full=simplifyPortraitName(name),parts=full.split(' ');
    const aliases=[full,[...parts].reverse().join(' '),...(PORTRAIT_ALIASES[name]||[])];
    return aliases.some(alias=>alias.length>=3&&((key===alias)||(key.startsWith(alias+' '))||(key.endsWith(' '+alias))||(key.includes(' '+alias+' '))));
  });
  return matches.length===1?matches[0]:null;
}
// Some Samsung/Android Gallery providers expose a File that FileReader cannot
// reopen. Copy the selected bytes through a stream or blob URL before giving up.
async function recoverGalleryPortraitBlob(file){
  const mime=file.type?.startsWith('image/')?file.type:
    /\.png$/i.test(file.name||'')?'image/png':/\.webp$/i.test(file.name||'')?'image/webp':'image/jpeg';
  if(typeof file.stream==='function'&&typeof Response==='function'){
    try{
      const bytes=await new Response(file.stream()).arrayBuffer();
      if(bytes.byteLength&&bytes.byteLength<=15*1024*1024)return new Blob([bytes],{type:mime});
    }catch(error){console.warn('Galeria: leitura por stream indisponível:',error);}
  }
  if(typeof fetch==='function'&&typeof URL?.createObjectURL==='function'){
    let link=null;
    try{
      link=URL.createObjectURL(file);
      const reply=await fetch(link);
      if(reply.ok){
        const bytes=await reply.arrayBuffer();
        if(bytes.byteLength&&bytes.byteLength<=15*1024*1024)return new Blob([bytes],{type:mime});
      }
    }catch(error){console.warn('Galeria: leitura por URL temporária indisponível:',error);}
    finally{if(link)URL.revokeObjectURL(link);}
  }
  return null;
}
async function fileToPortrait(file){
  if(!file||!file.size)throw Error('Escolha uma imagem válida.');
  if(file.size>15*1024*1024)throw Error('Imagem maior que 15 MB. Reduza o arquivo.');
  const isImage=file.type?.startsWith('image/')||/\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(file.name||'');
  if(!isImage)throw Error('Arquivo não é uma imagem. Escolha uma foto PNG, JPG ou WebP.');
  // Modern Android WebView: decode the original File directly whenever possible.
  // Older WebViews fall back to FileReader and then File.arrayBuffer().
  let picture=null;
  if(typeof createImageBitmap==='function'){
    try{picture=await createImageBitmap(file);}catch(e){/* try other readers */ }
  }
  // FileReader may fail for Android content:// URIs even when an image can be decoded.
  // Try the short-lived Blob URL before falling back to FileReader/arrayBuffer.
  if(!picture&&URL?.createObjectURL){
    let localURL=null;
    try{
      localURL=URL.createObjectURL(file);
      picture=await new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(Error('Não foi possível decodificar a imagem local.'));
        img.src=localURL;
      });
    }catch(_){picture=null;}
    finally{if(localURL)URL.revokeObjectURL(localURL);}
  }
  if(!picture){
    let data=null;
    try{
      data=await new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(reader.result);
        reader.onerror=()=>reject(reader.error||Error('FileReader falhou'));
        reader.onabort=()=>reject(Error('Leitura cancelada'));
        reader.readAsDataURL(file);
      });
    }catch(firstError){
      // Some document providers expose files that FileReader cannot access.
      if(typeof file.arrayBuffer==='function'){
        try{
          const bytes=new Uint8Array(await file.arrayBuffer()),pieces=[];
          for(let i=0;i<bytes.length;i+=32768)pieces.push(String.fromCharCode(...bytes.subarray(i,i+32768)));
          data='data:'+(file.type||'image/jpeg')+';base64,'+btoa(pieces.join(''));
        }catch(e){/* show a useful Android-specific error below */ }
      }
      if(!data){
        const recovered=await recoverGalleryPortraitBlob(file);
        if(recovered){
          try{data=await new Promise((resolve,reject)=>{
            const reader=new FileReader();
            reader.onload=()=>resolve(reader.result);
            reader.onerror=()=>reject(reader.error||Error('Falha ao preparar a cópia da imagem'));
            reader.readAsDataURL(recovered);
          });}catch(error){console.warn('Galeria: cópia não pôde ser convertida:',error);}
        }
      }
      if(!data)throw Error('A Galeria não disponibilizou os dados desta foto ao navegador. Tente escolher novamente pelo seletor Fotos do Android. Nenhum retrato salvo foi apagado.');
    }
    picture=new Image();
    await new Promise((resolve,reject)=>{
      picture.onload=resolve;
      picture.onerror=()=>reject(Error('Formato de imagem não suportado. Use JPG, PNG ou WebP salvo no aparelho.'));
      picture.src=data;
    });
  }
  const width=picture.naturalWidth||picture.width,height=picture.naturalHeight||picture.height;
  if(Math.min(width,height)<60)throw Error('A imagem precisa ter ao menos 60 pixels em cada lado.');
  const c=document.createElement('canvas');c.width=c.height=320;const g=c.getContext('2d');
  if(!g)throw Error('O navegador não conseguiu preparar a imagem.');
  const side=Math.min(width,height);
  const sx=(width-side)/2,sy=(height-side)/2;
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(picture,sx,sy,side,side,0,0,320,320);
  picture.close?.();
  try{return c.toDataURL('image/jpeg',.84);}
  catch(e){throw Error('Falha ao converter a imagem. Escolha uma foto JPG, PNG ou WebP salva no aparelho.');}
}
const mangaSingleInput=document.createElement('input');mangaSingleInput.type='file';mangaSingleInput.accept='image/png,image/jpeg,image/webp,image/gif';mangaSingleInput.hidden=true;document.body.appendChild(mangaSingleInput);
let mangaEditing=null;
function selectManga(name){mangaEditing=name;mangaSingleInput.value='';mangaSingleInput.click();}
mangaSingleInput.addEventListener('change',async()=>{
  const file=mangaSingleInput.files?.[0];if(!file||!mangaEditing)return;
  try{
    const data=await fileToPortrait(file),name=mangaEditing;
    await savePortraitImage('manga',name,data);
    $('portraitNotice').textContent=`📷 Imagem associada a ${name}.`;
    refreshPortraits();
  }catch(err){$('portraitNotice').textContent='Não foi possível salvar: '+err.message;}
});
const mangaBatchInput=document.createElement('input');mangaBatchInput.type='file';mangaBatchInput.accept='image/png,image/jpeg,image/webp,image/gif';mangaBatchInput.multiple=true;mangaBatchInput.hidden=true;document.body.appendChild(mangaBatchInput);
function useOfficialMangaPack(){
  let count=0;
  for(const name of Object.keys(OFFICIAL_MANGA)){
    if(hasManga(name)||customPortraits[name]&&portraitStyle(name)==='custom')continue;
    portraitStyles[name]='official';count++;
  }
  try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}
  for(const [name,style] of Object.entries(portraitStyles))if(style==='official')rememberPortraitChoice(name,style).catch(()=>{});
  $('portraitNotice').textContent=`${count} retratos da editora selecionados. Dependem de internet; seus retratos enviados continuam guardados.`;
  refreshPortraits();
}
function activateVerifiedPortraits(){
 let count=0;
 for(const member of galleryMembers()){
  const name=member.name;
  if(hasManga(name)||portraitStyles[name]==='custom'&&customPortraits[name])continue;
  portraitStyles[name]=OFFICIAL_MANGA[name]?'official':WIKI_PORTRAITS[name]?'wiki':'premium';count++;
 }
 try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}
 $('portraitNotice').textContent=`${count} retratos revisados. Fontes externas por nome, e identificação sem rosto onde não há imagem confirmada.`;
 refreshPortraits();
}
function bindMangaBatchImport(){
  $('exportPortraits')?.addEventListener('click',async()=>{
    try{const n=await exportPortraitBackup();$('portraitNotice').textContent=`✅ Backup de ${n} retratos preparado. Guarde esse JSON para mudar de navegador ou endereço.`;}
    catch(e){$('portraitNotice').textContent='⚠️ '+e.message;}
  });
  $('importPortraits')?.addEventListener('click',()=>{const input=$('importPortraitsFile');if(input){input.value='';input.click();}});
  $('importPortraitsFile')?.addEventListener('change',async e=>{
    try{const n=await importPortraitBackup(e.target.files?.[0]);$('portraitNotice').textContent=`✅ ${n} retratos restaurados. A liga não foi alterada.`;}
    catch(err){$('portraitNotice').textContent='⚠️ Falha no backup: '+err.message;}
  });
  $('useOfficialManga')?.addEventListener('click',useOfficialMangaPack);
  $('useVerifiedPortraits')?.addEventListener('click',activateVerifiedPortraits);
  $('useOriginalArtPack')?.addEventListener('click',()=>{
    let n=0;
    for(const name of Object.keys(ORIGINAL_ART)){
      if(hasManga(name)||customPortraits[name]&&portraitStyle(name)==='custom')continue;
      portraitStyles[name]='original';n++;
    }
    try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}
    $('portraitNotice').textContent=`${n} retratos substitutos offline ativados. Fotos importadas permanecem salvas.`;
    refreshPortraits();
  });
  $('mangaBatchImport')?.addEventListener('click',()=>{mangaBatchInput.value='';mangaBatchInput.click();});
  $('wikiCatalogFilter')?.addEventListener('click',()=>{ $('galleryTeam').value='all'; $('galleryType').value='wiki';$('gallerySearch').value='';renderPortraitGallery();$('portraitNotice').textContent='O pacote enviado lista 35 personagens, mas não contém retratos. Use 🔗 Wiki ou 📷 Importar vários retratos.';});
  $('mangaOfflineMode')?.addEventListener('click',()=>{
    for(const member of galleryMembers())if(!['custom','manga'].includes(portraitStyles[member.name]))portraitStyles[member.name]='premium';
    try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}
    $('portraitNotice').textContent='Modo Mangá: somente imagens enviadas; sem retratos aleatórios do anime.';refreshPortraits();
  });
  mangaBatchInput.addEventListener('change',async()=>{
    const files=Array.from(mangaBatchInput.files||[]);if(!files.length)return;
    const staged={};let errors=0,skipped=[];
    for(const file of files){
      const name=uniquePortraitMatch(file.name);
      if(!name||staged[name]){skipped.push(file.name);continue;}
      try{staged[name]=await fileToPortrait(file);}catch(e){errors++;}
    }
    let saved=0;
    for(const [name,data] of Object.entries(staged)){
      try{await savePortraitImage('manga',name,data);saved++;}catch(e){errors++;console.warn('Erro ao salvar '+name,e);}
    }
    $('portraitNotice').textContent=`✅ ${saved} imagens salvas no armazenamento de retratos. ${skipped.length} sem nome único (${skipped.slice(0,3).join(', ')||'nenhuma'}). ${errors} falharam.`;
    refreshPortraits();
  });
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-manga-edit]');if(button){const name=decodeURIComponent(button.dataset.mangaEdit||'');if(name)selectManga(name);}});
function init(){
  // 40x turbo is a live simulation setting, not a visual playback trick.
  const speedPicker=$('speed');
  if(speedPicker && ![...speedPicker.options].some(opt=>opt.value==='40')){
    const fast=document.createElement('option');fast.value='40';fast.textContent='⚡ 40× · Turbo';
    speedPicker.append(fast);
  }
  if(speedPicker){
    if(!document.getElementById('neo110-turbo')){
      const turboButton=document.createElement('button');
      turboButton.type='button';turboButton.id='neo110-turbo';turboButton.className='neo110-turbo';
      turboButton.textContent='⚡ TURBO 40×';
      turboButton.setAttribute('aria-pressed','false');
      turboButton.title='Alternar entre 1× e até 40×. A velocidade real depende do desempenho do aparelho.';
      turboButton.addEventListener('click',()=>{
        speedPicker.value=speedPicker.value==='40'?'1':'40';
        speedPicker.dispatchEvent(new Event('change',{bubbles:true}));
      });
      speedPicker.insertAdjacentElement('afterend',turboButton);
    }
    speedPicker.addEventListener('change',()=>{
      const turboButton=document.getElementById('neo110-turbo');
      if(turboButton){
        const enabled=speedPicker.value==='40';
        turboButton.setAttribute('aria-pressed',String(enabled));
        turboButton.textContent=enabled?'⚡ TURBO ATIVO':'⚡ TURBO 40×';
      }
      // Never carry a backlog from a previous speed into the next one.
      accumulator=0;lastFrame=0;
      speedPicker.title=speedPicker.value==='40'
        ?'Turbo 40×: acelera a simulação real. Em celulares lentos, a velocidade efetiva pode ser menor.'
        :'Ajusta o avanço do tempo da partida ao vivo.';
    });
  }
  const memory=Number(navigator.deviceMemory||4),mobile=window.matchMedia?.('(max-width: 650px)')?.matches;
  if(mobile||memory<=3){$('showTactics').checked=false;}
  configureCanvasResolution();
  $('graphicsLevel').addEventListener('change',()=>{autoResolutionFactor=1;lastResampleKey='';configureCanvasResolution();});
  for(const id of ['home','away'])$(id).innerHTML=(E.allTeams?.()||TEAMS).filter(t=>t.id!=='neo-bestxi').map(t=>`<option value="${t.id}">${esc(t.name)} · ${esc(t.formationName||'')}</option>`).join('');
  $('home').value='bm';$('away').value='px';$('rankClub').innerHTML='<option value="all">Todos os clubes</option>'+TEAMS.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('');$('rankClub').onchange=renderCareerRanking;$('rankMode').onchange=renderCareerRanking;renderMasterProfiles();renderAbilityCatalog();$('recordsTeam').innerHTML='<option value="all">Todos os clubes</option>'+TEAMS.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('');$('recordsTeam').onchange=renderRecords;$('recordsSearch').oninput=renderRecords;
  bindMangaBatchImport();
  const gt=$('galleryTeam');if(gt){for(const t of (E.allTeams?.()||TEAMS).filter(t=>t.id!=='neo-bestxi')){const option=document.createElement('option');option.value=t.id;option.textContent=t.name;gt.appendChild(option);}gt.value='all';}
  for(const id of ['galleryTeam','galleryType'])$(id)?.addEventListener('change',renderPortraitGallery);
  $('gallerySearch')?.addEventListener('input',renderPortraitGallery);
  $('portraitRepair')?.addEventListener('click',()=>{
    failedPortraits.clear();
    for(const name of Object.keys(reportedPortraits))delete reportedPortraits[name];
    for(const name of Object.keys(REAL_PORTRAITS)){
      if(!['custom','manga'].includes(portraitStyles[name]))portraitStyles[name]=OFFICIAL_MANGA[name]?'official':WIKI_PORTRAITS[name]?'wiki':'premium';
    }
    savePortraitReports();
    try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}
    refreshPortraits();
    // A failed photo-picker read can leave an old warning visible here.
    // Repair only resets unavailable references; it must not request a file.
    $('portraitNotice').textContent='✅ Imagens verificadas. Retratos personalizados e temporadas preservados. Para trocar uma foto, use 📷 Trocar no jogador.';
  });
  $('portraitOffline')?.addEventListener('click',()=>{
    for(const name of Object.keys(REAL_PORTRAITS))if(!['custom','manga'].includes(portraitStyles[name]))portraitStyles[name]=OFFICIAL_MANGA[name]?'official':WIKI_PORTRAITS[name]?'wiki':'premium';
    try{localStorage.setItem(PORTRAIT_STYLE_KEY,JSON.stringify(portraitStyles));}catch(e){}
    $('portraitNotice').textContent='Modo offline ativado. Todos terão avatar; fotos personalizadas foram preservadas.';
    refreshPortraits();
  });
  $('portraitGallery')?.addEventListener('click',e=>{
    const choice=e.target.closest('[data-gallery-jump]');
    if(choice){
      const name=choice.dataset.galleryJump,team=choice.dataset.galleryJumpTeam;
      if($('galleryTeam'))$('galleryTeam').value=team;
      if($('galleryType'))$('galleryType').value='all';
      if($('gallerySearch'))$('gallerySearch').value='';
      renderPortraitGallery();
      const card=[...document.querySelectorAll('#portraitGallery [data-gallery-player]')].find(el=>el.dataset.galleryPlayer===name);
      if(card){card.classList.add('neo992-selected');card.scrollIntoView?.({behavior:'smooth',block:'center'});}
      return;
    }
    const picture=e.target.closest('.portrait-card-photo');if(!picture)return;
    const card=picture.closest('[data-gallery-player]');if(card)selectPortrait(decodeURIComponent(card.dataset.galleryPlayer));
  });
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
  initArsenal();
  document.addEventListener('click',e=>{
    const player=e.target.closest('[data-open-player-arsenal]');if(player){openArsenalFor(decodeURIComponent(player.dataset.openPlayerArsenal));return;}
    const catalog=e.target.closest('[data-open-arsenal]');if(catalog){setTab('arsenal');return;}
  });
  $('autoGameplan').onchange=()=>{
    setGameplanControls();
    if(match){
      if($('autoGameplan').checked){match.rollGameplan();syncGameplanSelectors();}
      else{match.autoGameplan=false;match.planNames=['Personalizado','Personalizado'];syncGameplanSelectors();}
      updateAll();
    }
  };
  $('rollGameplan').onclick=()=>{if(!match||!$('autoGameplan').checked)return;match.rollGameplan();syncGameplanSelectors();updateAll();};
  $('prepare').onclick=()=>prepare();
  $('play').onclick=()=>{if(!match||match.finished)return;if(replaying){replaying=false;replayFrame=0;replayIndex=0;}playing=!playing;if(playing){$('matchPreview').classList.add('hidden');if(match.time<.1)showEntrance();}$('play').textContent=playing?'⏸ Pausar':'▶ Continuar';updateAll();};
  $('reset').onclick=()=>{if(match)prepare(match.teams[0].id,match.teams[1].id,matchFixture);};
  $('replay').onclick=()=>{if(!match?.lastGoal)return;playing=false;replaying=true;replayFrame=0;replayIndex=0;$('play').textContent=match.finished?'🏁 Encerrado':'▶ Continuar';$('matchBanner').textContent=`🎬 Replay: ${match.lastGoal.scorer} · ${goalStyleText(match.lastGoal.goalType)} · ${match.lastGoal.minute}'`;renderReplayDirector();};
  $('currentGameGoals').addEventListener('click',e=>{const button=e.target.closest('[data-replay-goal]');if(!button||!match)return;const clip=match.goalClips?.[Number(button.dataset.replayGoal)];if(!clip)return;match.lastGoal=clip;setTab('match');$('replay').click();window.scrollTo({top:0,behavior:'smooth'});});
  for(const [id,field,index] of [['pressHome','pressing',0],['pressAway','pressing',1],['widthHome','attackWidth',0],['widthAway','attackWidth',1],['buildHome','buildUp',0],['buildAway','buildUp',1]]){$(id).onchange=()=>{if(match)match[field][index]=$(id).value;};}
  $('gameplayPreset').onchange=()=>{if(match){match.gameplayPreset=$('gameplayPreset').value;updateAll();}};
  $('weatherSetting').onchange=()=>{if(match){match.weather=$('weatherSetting').value;updateAll();}};
  $('homeTactic').onchange=()=>{if(match){match.tactics[0]=$('homeTactic').value;match.coachLocked[0]=true;}};$('awayTactic').onchange=()=>{if(match){match.tactics[1]=$('awayTactic').value;match.coachLocked[1]=true;}};
  $('crossStyleHome').onchange=()=>{if(match)match.crossPreference[0]=$('crossStyleHome').value;};
  $('crossStyleAway').onchange=()=>{if(match)match.crossPreference[1]=$('crossStyleAway').value;};
  $('setPieceHome').onchange=()=>{if(match)match.setPieceStyle[0]=$('setPieceHome').value;};
  $('setPieceAway').onchange=()=>{if(match)match.setPieceStyle[1]=$('setPieceAway').value;};
  $('autoSubs').onchange=()=>{if(match)match.autoSubs=$('autoSubs').checked;};
  $('autoCoach').onchange=()=>{if(match)match.autoCoach=$('autoCoach').checked;};
  $('simulateRound').onclick=simulateRound;$('simulateSeason').onclick=simulateSeason;
  $('backupSeason').onclick=()=>{
    try{
      const data=JSON.stringify({app:'blue-lock-neo',version:7,exportedAt:new Date().toISOString(),season});
      if(window.BlueLockAndroid?.saveJson){window.BlueLockAndroid.saveJson('blue-lock-neo-backup-temporada.json',data);}
      else{
        const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
        const link=document.createElement('a');link.href=url;link.download='blue-lock-neo-backup-temporada.json';
        document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
      }
    }catch(error){alert('Não foi possível exportar: '+error.message);}
  };
  $('restoreSeason').onclick=()=>{if(!simBusy){$('restoreSeasonFile').value='';$('restoreSeasonFile').click();}};
  $('restoreSeasonFile').onchange=async e=>{
    const file=e.target.files?.[0];if(!file||simBusy)return;
    try{
      if(file.size>15*1024*1024)throw Error('Arquivo muito grande');
      const data=JSON.parse(await file.text());const restored=data?.app==='blue-lock-neo'?data.season:data;
      if(restored?.schema!==2||![10,20,30].includes(restored.rounds?.length)||!Array.isArray(restored.rounds?.[0]?.games))throw Error('Backup incompatível com a Liga Neo Egoísta');
      if(!confirm('Restaurar a temporada escolhida? A liga salva neste navegador será substituída. Faça um backup antes de continuar.'))return;
      // Persist first: never wipe the in-memory season if the storage write fails.
      localStorage.setItem('neo-season-v2',JSON.stringify(restored));
      season=restored;playing=false;replaying=false;roundView=currentRound()?.round||1;
      prepare('bm','px');renderLeague();renderStats();renderCareerRanking();renderRecords();
      alert('Liga restaurada com sucesso. Retratos personalizados não foram alterados.');
    }catch(error){alert('Não foi possível restaurar: '+error.message);}
  };
  $('newSeason').onclick=()=>{if(simBusy)return;if(!confirm('Iniciar nova temporada? Isso apaga a tabela, artilharia e os resultados salvos desta liga.'))return;const played=season.rounds.flatMap(r=>r.games).filter(f=>f.result).length;
    const past=[...(season.pastSeasons||[])];if(played){const leader=E.standings(season)[0];past.push({number:past.length+1,champion:currentRound()?null:leader.team.name,leader:leader.team.name,played,total:season.rounds.flatMap(r=>r.games).length,standings:E.standings(season).map(r=>({club:r.team.name,pts:r.PTS,gp:r.GP,gc:r.GC}))});}
    season=E.createSchedule(Number($('seasonFormat').value));season.pastSeasons=past;
    // Uma temporada NOVA sempre recomeça o leilão e os atributos da liga do zero.
    season.career={players:{},history:[],version:2,links:{},rivals:{},stories:[]};
    saveSeason();roundView=1;renderLeague();renderStats();renderCareerRanking();};
  $('prevRound').onclick=()=>{roundView=Math.max(1,roundView-1);renderCalendar();};$('nextRound').onclick=()=>{roundView=Math.min(season.rounds.length,roundView+1);renderCalendar();};
  canvas.addEventListener('click',e=>openPlayer(e.clientX,e.clientY));$('closePlayer').onclick=()=>$('playerModal').classList.add('hidden');$('playerModal').onclick=e=>{if(e.target===$('playerModal'))$('playerModal').classList.add('hidden');};
  const effects=$('skillFxLevel');
  if(effects){
    try{const saved=localStorage.getItem('neo-skill-fx');if(['off','subtle','cinematic'].includes(saved))effects.value=saved;}catch(e){}
    effects.addEventListener('change',()=>{try{localStorage.setItem('neo-skill-fx',effects.value);}catch(e){}draw();});
  }
  $('focusMode')?.addEventListener('click',()=>{const enabled=$('match').classList.toggle('focus-match');$('focusMode').setAttribute('aria-pressed',String(enabled));$('focusMode').textContent=enabled?'▣ Mostrar painéis':'▣ Modo foco';});
  $('cameraMode').onclick=()=>{cameraFollow=!cameraFollow;showCameraHud();syncMobilePitch();};
  $('zoomMinus').onclick=()=>{cameraZoom=Math.max(1.05,Math.round((cameraZoom-.16)*100)/100);showCameraHud();};
  $('zoomPlus').onclick=()=>{cameraZoom=Math.min(2.7,Math.round((cameraZoom+.16)*100)/100);showCameraHud();};
  showCameraHud();
  function fitFullscreenPitch(){
    const active=document.fullscreenElement===$('stadium')||$('stadium').classList.contains('fullscreen-active');
    if(!active){canvas.style.removeProperty('width');canvas.style.removeProperty('height');canvas.style.removeProperty('object-fit');$('stadium').classList.remove('wide-crop');return;}
    const room=Math.max(210,window.innerHeight-(window.innerHeight<420?64:80));
    const landscape=window.innerWidth>window.innerHeight*1.55;
    $('stadium').classList.toggle('wide-crop',landscape);
    if(landscape){
      // No stretching. Wide screens may crop a little vertically, never distort the pitch.
      const height=Math.max(room,Math.round((window.innerWidth-12)*.6));
      const width=Math.round(height*5/3);
      canvas.style.setProperty('width',width+'px','important');
      canvas.style.setProperty('height',height+'px','important');
      canvas.style.setProperty('object-fit','contain','important');
      canvas.style.setProperty('object-position','50% 50%','important');
    }else{
      // Portrait broadcast: crop the *sides* while the camera follows the ball.
      const height=Math.max(360,Math.floor(window.innerHeight-151));
      const width=Math.round(height*5/3);
      canvas.style.setProperty('width',width+'px','important');
      canvas.style.setProperty('height',height+'px','important');
      canvas.style.setProperty('object-fit','contain','important');
      canvas.style.setProperty('object-position','50% 50%','important');
    }
  }
  $('stadiumMode').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('stadium').requestFullscreen)await $('stadium').requestFullscreen();else $('matchBanner').textContent='Tela cheia não disponível neste navegador. Vire o celular para jogar na horizontal.';}catch(e){$('matchBanner').textContent='Tela cheia indisponível neste dispositivo.';}};document.addEventListener('fullscreenchange',()=>{$('stadium').classList.toggle('fullscreen-active',document.fullscreenElement===$('stadium'));fitFullscreenPitch();syncFullscreenUI();});window.addEventListener('resize',fitFullscreenPitch);
  document.addEventListener('visibilitychange',()=>{lastFrame=0;if(document.hidden&&playing){playing=false;$('play').textContent='▶ Continuar';}});
  prepare('bm','px');renderLeague();renderSquads();renderStats();requestAnimationFrame(frame);
}
init();
// v7.7 cinematic stage interactions
if($('actionTheaterToggle'))$('actionTheaterToggle').addEventListener('click',()=>{
 const node=$('actionTheater'),collapsed=node.classList.toggle('collapsed');
 $('actionTheaterToggle').textContent=collapsed?'Mostrar animações':'Ocultar';
 $('actionTheaterToggle').setAttribute('aria-expanded',String(!collapsed));
});
// Safe integration point for season-specific add-ons. Never replaces saved portraits.
window.NeoCareerBridge={
 getSeason:()=>season,
 save:()=>saveSeason(),
 busy:()=>!!(simBusy||(match&&!match.finished)),
 refresh:()=>{renderLeague();renderRecords();renderSquads();}
};

})();
// Fotos verificadas da editora requerem internet; substitutos e imagens importadas funcionam offline.
if (!window.BlueLockAndroid && 'serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});





// v8.3: installable PWA with origin-bound persistent portrait library.
let neoDeferredInstall=null;
const neoAppInstalled=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function neoAppMessage(message){
  const node=document.getElementById('appStorageStatus');if(node)node.textContent=message;
}
async function neoStorageReport(){
  try{
    const persistent=await navigator.storage?.persisted?.();
    const info=await navigator.storage?.estimate?.();
    const percent=info?.quota?Math.round((info.usage||0)/info.quota*100):null;
    const status=(persistent?'🔐 Fotos protegidas contra limpeza automática':'📷 Fotos no armazenamento deste aplicativo')+(percent!==null?' · '+percent+'% do espaço permitido':'');
    const originWarning=location.hostname==='127.0.0.1'||location.hostname==='localhost'
      ?' · ⚠️ Porta local variável: use sempre o mesmo endereço ou instale numa hospedagem HTTPS fixa.'
      :'';
    neoAppMessage(status+originWarning);
  }catch(e){neoAppMessage('📷 Retratos salvos no dispositivo; mantenha um backup de segurança.');}
}
async function neoProtectPortraits(){
  if(!navigator.storage?.persist){neoAppMessage('Seu navegador não oferece armazenamento persistente. Exporte os retratos como backup.');return;}
  try{
    const ok=await navigator.storage.persist();
    await neoStorageReport();
    if(!ok)neoAppMessage('⚠️ O navegador ainda não autorizou proteção permanente. As fotos continuam salvas, mas exporte um backup.');
  }catch(e){neoAppMessage('Não foi possível solicitar proteção: '+(e?.message||e));}
}
async function neoInstallApp(){
  if(neoAppInstalled()){neoAppMessage('✅ Aplicativo instalado. Seus retratos ficam neste aparelho.');return;}
  if(neoDeferredInstall){
    const event=neoDeferredInstall;neoDeferredInstall=null;
    try{await event.prompt();await event.userChoice;}catch(e){console.warn('Instalação indisponível',e);}
    await neoStorageReport();return;
  }
  neoAppMessage('📱 Abra esta versão em HTTPS no Chrome ou Samsung Internet, menu ⋮ → Instalar aplicativo / Adicionar à tela inicial. O arquivo HTML isolado não instala um PWA.');
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();neoDeferredInstall=e;const btn=document.getElementById('installApp');if(btn)btn.hidden=false;});
window.addEventListener('appinstalled',()=>{neoDeferredInstall=null;neoAppMessage('✅ Aplicativo instalado! Faça backup dos seus retratos periodicamente.');});
document.getElementById('installApp')?.addEventListener('click',neoInstallApp);
document.getElementById('keepPortraits')?.addEventListener('click',neoProtectPortraits);
window.NeoAppStorage={report:neoStorageReport,protect:neoProtectPortraits};
// Read-only match reference for verified live commentary (no game controls).
window.NeoMatchBridge=Object.freeze({getMatch:()=>match});

if(!window.BlueLockAndroid && 'serviceWorker' in navigator && location.protocol!=='file:' && !location.pathname.endsWith('/jogar-offline.html')){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./service-worker.js',{scope:'./'})
      .catch(e=>console.warn('Sem modo app offline neste endereço:',e));
  });
}
window.addEventListener('load',()=>neoStorageReport());
