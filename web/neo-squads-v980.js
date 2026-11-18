/* Blue Lock NEO v9.8 — positional team board, real OVR and coach's form. */
(()=>{'use strict';
const E=window.NeoEngine,C=window.NeoCoach980;
if(!E||!C)return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const labels={GOL:'Goleiro',GK:'Goleiro',LD:'Lateral direito',LE:'Lateral esquerdo',ZAG:'Zagueiro',VOL:'Volante',MC:'Meia central',MEI:'Meia ofensivo',PD:'Ponta direita',PE:'Ponta esquerda',CA:'Atacante',SA:'Segundo atacante',ALA:'Ala'};
let selected=localStorage.getItem('neo980-team')||'bm';
const teams=()=>E.allTeams?E.allTeams():E.TEAMS;
const state=()=>{try{const s=JSON.parse(localStorage.getItem('neo-season-v2')||'null');return s?.schema===2?s:null}catch(_){return null}};
const context=t=>{
 const league=state();
 try{return C.contextFor(t,league,window.NeoCups970?.safeLoad?.(localStorage)||[])}
 catch(_){return C.contextFor(t,league)}
};
const profileKey=(name,club)=>encodeURIComponent(name+'|'+club);
function portrait(name,t){
 if(window.NeoPortraitUI?.html)return window.NeoPortraitUI.html(name,t,'neo980-headshot');
 const initial=String(name).split(' ').map(x=>x[0]).slice(0,2).join('');
 return '<span class="neo980-headshot neo980-no-photo" aria-hidden="true">'+esc(initial)+'</span>';
}
function rating(name,t,role,slot,season){return C.overall(E.Attr,t,name,role,slot,season)}
// Build tactical lines from the actual chosen formation (no fake lineup
// changes). Attackers appear at the top, keeper at the bottom.
function formationRows(t,formation,spots){
 const raw=window.NeoPitch1040?.formationKey(t.formationName)||String(t.formationName||'').match(/\d+(?:-\d+){2,4}/)?.[0];
 const sizes=String(raw||'').split('-').map(Number);
 let backToFront=[];
 if(sizes.length>=3&&sizes.length<=5&&sizes.every(n=>Number.isInteger(n)&&n>0)&&sizes.reduce((a,b)=>a+b,0)===10){
  let offset=1;
  backToFront=sizes.map(n=>{const indices=Array.from({length:n},(_,i)=>offset+i);offset+=n;return indices;});
 }else{
  const types=[[],[],[]];
  for(let i=1;i<11;i++){
   const role=String(formation[i]?.role||'').toUpperCase();
   const group=/^(LD|LE|ZAG|CB|LB|RB|LIB|LWB|RWB)$/.test(role)?0:/^(CA|ST|CF|SA|PD|PE|RW|LW)$/.test(role)?2:1;
   types[group].push(i);
  }
  backToFront=types.filter(a=>a.length);
 }
 return [...backToFront].reverse().map((line,lineIndex,all)=>{
  const ordered=[...line].sort((a,b)=>(Number(spots?.[a]?.lane)||50)-(Number(spots?.[b]?.lane)||50));
  const size=ordered.length;
  const title=lineIndex===all.length-1?'DEFESA':lineIndex===0?'ATAQUE':
   (all.length>3&&lineIndex===1?'MEIAS OFENSIVOS':all.length>3&&lineIndex===all.length-2?'VOLANTES':'MEIO-CAMPO');
  return {indices:ordered,title,size};
 }).concat([{indices:[0],title:'GOLEIRO',size:1}]);
}
function player(t,name,role,index,season,style={},captain=false){
 const ovr=rating(name,t,role,index,season),pos=labels[role]||role;
 const shownRole=t.id==='ht'&&role==='GOL'?'GK':role;
 const highlight=captain?' neo980-lineup-star':'';
 const left=Number.isFinite(Number(style.lane))?Number(style.lane):Number(style.y??.5)*100;
 const top=Number.isFinite(Number(style.depth))?Number(style.depth):(1-Number(style.x??.45))*100;
 const coords='style="--lane:'+Math.max(10,Math.min(90,left)).toFixed(1)+'%;--depth:'+Math.max(18,Math.min(91,top)).toFixed(1)+'%"';
 return '<button type="button" class="neo980-player neo980-lineup-card'+highlight+'" '+coords+
 ' data-neo960-profile="'+profileKey(name,t.id)+'" title="'+esc(name)+' · '+esc(pos)+' · '+ovr+' OVR"'+
 ' aria-label="Abrir ficha de '+esc(name)+', '+esc(pos)+', '+ovr+' overall">'+
 '<span class="neo980-card-portrait">'+portrait(name,t)+'<span class="neo980-card-role">'+esc(shownRole)+'</span></span>'+
 '<span class="neo980-card-body"><strong class="neo980-player-name">'+esc(name)+'</strong>'+
 '<span class="neo980-card-bottom"><span class="neo980-role">'+esc(shownRole)+'</span><b class="neo980-ovr">'+ovr+'</b></span></span></button>';
}
function chooseTeam(value){selected=value;localStorage.setItem('neo980-team',selected);render();}
function render(){
 const root=$('neo980-squad-area');if(!root)return;
 const t=teams().find(x=>x.id===selected)||teams()[0];if(!t)return;
 const s=context(t),plan=C.planLineup(t,s,E.Attr),form=plan.form,f=plan.formation||t.formation||E.DEFAULT_FORMATION;
 const tacticalTeam={...t,formationName:plan.formationName||t.formationName};
 const spots=window.NeoPitch1040?.layout(tacticalTeam,f)||null;
 const formationLabel=esc(tacticalTeam.formationName||'4-3-3');
 const masterConfig=E.Masters?.CONFIG?.[t.id];
 const masterCaption=t.id==='ht'&&masterConfig?
  ' · Mestre: '+esc(t.master)+' ('+esc(masterConfig.masterRole)+' · '+Number(masterConfig.masterOvr)+' OVR)':
  t.master?' · Master Striker: '+esc(t.master):'';
 const summary=form.played===0?'Sem jogos registrados nesta competição: técnico mantém a formação inicial.'
 :form.underPressure?`Últimos 3 jogos: ${form.lossesLast3} derrota(s). ${plan.reason}.`
 :`Últimos jogos: ${form.streak} derrota(s) consecutiva(s) · ${form.played} jogo(s) analisado(s). ${plan.reason}.`;
 // The original simulator still writes into #squadCards on every tab visit.
 // Keep that real node alive across innerHTML rerenders instead of destroying
 // it with the old accordion; otherwise renderSquads() throws on navigation.
 const preservedCards=$('squadCards');
 if(preservedCards&&root.contains(preservedCards))root.parentElement?.appendChild(preservedCards);
 const all=teams();const select=all.map(x=>`<option value="${esc(x.id)}" ${x.id===t.id?'selected':''}>${esc(x.name)}</option>`).join('');
 root.innerHTML=`<div class="neo980-intro"><div><span class="neo980-kicker">CENTRAL TÁTICA · EGOIST</span><h2>👥 Escalação & técnico IA</h2><p>Escalação em cartas grandes: posição, rosto, nome e OVR. Toque em qualquer atleta para abrir a ficha.</p></div><span class="neo980-total">${all.length} equipes</span></div>
 <label class="neo980-selector">Escolher equipe<select id="neo980-select">${select}</select></label>
 <div class="neo980-team-header"><span class="neo980-crest" style="--team:${esc(t.color||'#47b8ff')}">${window.NeoCrests1050?.icon(t)||esc(t.crest||t.short?.slice(0,2)||'FC')}</span><div><strong>${esc(t.name)}</strong><small>${formationLabel} · ${esc(t.country||'')}${masterCaption}</small></div><span class="neo980-ai-live">IA ATIVA</span></div>
 ${t.id==='ht'&&masterConfig?`<div class="neo980-master-card">${portrait(t.master,t)}<div><span>MASTER STRIKER · FORA DO XI TITULAR</span><strong>${esc(t.master)}</strong><small>${esc(masterConfig.masterRole)} · ${Number(masterConfig.masterOvr)} OVR · Foto editável em Jogadores → Novos elencos</small></div></div>`:''}
 <div class="neo980-formation-banner"><b>⚽ XI TITULAR · ${formationLabel}</b><small>11 jogadores · toque numa carta para ver todas as estatísticas</small></div>
 <div class="neo980-pitch neo980-card-pitch" role="group" aria-label="Escalação em cartas: ${esc(t.name)}, ${formationLabel}"><div class="neo980-pitch-markings"><span class="neo980-center-circle"></span><span class="neo980-penalty neo980-penalty-top"></span><span class="neo980-penalty neo980-penalty-bottom"></span></div><span class="neo980-goal goal-top"></span><span class="neo980-goal goal-bottom"></span>
 <div class="neo980-formation-rows">${formationRows(tacticalTeam,f,spots).map(line=>`<section class="neo980-tactical-line" aria-label="${line.title} · ${line.size} jogador(es)"><span class="neo980-line-title">${line.title}</span><div class="neo980-line-cards" style="--line-count:${line.size}">${line.indices.map(i=>player(t,plan.players[i],f[i]?.role||E.DEFAULT_FORMATION[i]?.role||'MC',i,s,spots?.[i]||f[i]||E.DEFAULT_FORMATION[i],i===plan.players.reduce((best,name,j)=>rating(name,t,f[j]?.role||E.DEFAULT_FORMATION[j]?.role||'MC',j,s)>rating(plan.players[best],t,f[best]?.role||E.DEFAULT_FORMATION[best]?.role||'MC',best,s)?j:best,0))).join('')}</div></section>`).join('')}</div>
 </div><div class="neo980-pitch-caption">⬆ Ataque · cartas na posição tática correta · 🧤 goleiro na base · toque em um jogador para abrir a ficha</div>
 <div class="neo980-coach-card"><div class="neo980-coach-title"><span>🧠 Técnico inteligente</span><b>${form.underPressure||plan.changes.length||plan.formationChanged?'REVENDO TIME':'ANALISANDO'}</b></div><p>${esc(summary)}</p>${plan.formationChanged?`<p class="neo980-coach-formation">📐 Novo esquema: <b>${formationLabel}</b> · escolhido após analisar os resultados.</p>`:''}${plan.changes.length?`<div class="neo980-coach-changes">${plan.changes.map(x=>`<span>🔄 ${esc(x.out)} <b>→</b> ${esc(x.in)} <small>${esc(x.role)}</small></span>`).join('')}</div>`:''}<small>O técnico considera derrotas, gols sofridos e notas ruins recentes. Pode testar outra formação, manter a que venceu ou mudar de novo se a anterior falhar, sem apagar seus dados.</small></div>
 <details class="neo980-reserves"><summary>🪑 Banco de reservas <span>${plan.reserves.length} jogadores</span></summary><div class="neo980-bench">${plan.reserves.map((name,i)=>{const role=C.reserveRole(t,name),o=rating(name,t,role,11+i,s);return `<button class="neo980-bench-row" type="button" data-neo960-profile="${profileKey(name,t.id)}" aria-label="Ver ficha de ${esc(name)}">${portrait(name,t)}<span><b>${esc(name)}</b><small>${esc(labels[role]||role)}</small></span><strong>${o} OVR</strong></button>`}).join('')||'<p>Nenhum reserva cadastrado.</p>'}</div></details>
 <details class="neo980-old-list"><summary>📚 Listagem completa e habilidades</summary><div id="neo980-legacy-anchor"></div></details>`;
 $('neo980-select')?.addEventListener('change',e=>chooseTeam(e.target.value));
 // Keep the original all-team cards available inside a collapsed area only.
 const legacy=$('squadCards'),anchor=$('neo980-legacy-anchor');if(legacy&&anchor&&legacy.parentElement!==anchor)anchor.append(legacy);
}
window.addEventListener('neo:portraits-changed',()=>{if($('neo980-squad-area'))render();});
function boot(){const root=$('squads');if(!root)return;
 if(!$('neo980-squad-area')){const top=document.createElement('div');top.id='neo980-squad-area';root.insertBefore(top,root.firstChild)}
 render();
 const observer=new MutationObserver(()=>{if(!root.classList.contains('hidden'))render()});
 observer.observe(root,{attributes:true,attributeFilter:['class']});
 document.addEventListener('click',e=>{if(e.target.closest('[data-tab="squads"],[data-neo-tab="squads"],[data-neo-open="squads"]'))setTimeout(render,90)});
 window.addEventListener('storage',e=>{if(['neo-season-v2','neo-custom-cups-v970'].includes(e.key))render()});
 window.NeoSquads980={render,chooseTeam,labels,formationRows};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
