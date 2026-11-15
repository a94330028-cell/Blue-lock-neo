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
const context=t=>{if(E.TEAMS.some(q=>q.id===t.id))return state();try{const cups=window.NeoCups970?.safeLoad?.(localStorage)||[];return cups.find(c=>c.teams?.includes(t.id))||null}catch(_){return null}};
const profileKey=(name,club)=>encodeURIComponent(name+'|'+club);
function portrait(name,t){
 if(window.NeoPortraitUI?.html)return window.NeoPortraitUI.html(name,t,'neo980-headshot');
 const initial=String(name).split(' ').map(x=>x[0]).slice(0,2).join('');
 return '<span class="neo980-headshot neo980-no-photo" aria-hidden="true">'+esc(initial)+'</span>';
}
function rating(name,t,role,slot,season){return C.overall(E.Attr,t,name,role,slot,season)}
function player(t,name,role,index,season,style={}){
 const ovr=rating(name,t,role,index,season),isGK=index===0,pos=labels[role]||role;
 const xy={x:Math.max(4,Math.min(96,Number(style.x||0)*100)),y:Math.max(5,Math.min(95,Number(style.y||0)*100))};
 const coords=isGK||style.x!=null?`style="--lane:${xy.y}%;--depth:${Math.min(93,Math.max(7,(1-Number(style.x))*100)).toFixed(1)}%"`:'';
 return `<button type="button" class="neo980-player" ${coords} data-neo960-profile="${profileKey(name,t.id)}" title="${esc(name)} · ${esc(pos)} · ${ovr} OVR" aria-label="Abrir ficha de ${esc(name)}, ${esc(pos)}, ${ovr} overall">
 ${portrait(name,t)}<span class="neo980-role">${esc(role)}</span><span class="neo980-player-name">${esc(name)}</span><b class="neo980-ovr">${ovr}</b></button>`;
}
function chooseTeam(value){selected=value;localStorage.setItem('neo980-team',selected);render();}
function render(){
 const root=$('neo980-squad-area');if(!root)return;
 const t=teams().find(x=>x.id===selected)||teams()[0];if(!t)return;
 const s=context(t),plan=C.planLineup(t,s,E.Attr),form=plan.form,f=t.formation||E.DEFAULT_FORMATION;
 const formationLabel=esc(t.formationName||'4-3-3');
 const summary=form.played===0?'Sem jogos registrados: técnico mantém a formação inicial.'
 :form.underPressure?`Últimos 3 jogos: ${form.lossesLast3} derrota(s). ${plan.reason}.`
 :`Últimos jogos: ${form.streak} derrota(s) consecutiva(s). ${plan.reason}.`;
 const all=teams();const select=all.map(x=>`<option value="${esc(x.id)}" ${x.id===t.id?'selected':''}>${esc(x.name)}</option>`).join('');
 root.innerHTML=`<div class="neo980-intro"><div><span class="neo980-kicker">CENTRAL TÁTICA · EGOIST</span><h2>👥 Escalação & técnico IA</h2><p>Veja os 11 titulares nas posições de jogo. Toque em qualquer atleta para abrir a ficha.</p></div><span class="neo980-total">${all.length} equipes</span></div>
 <label class="neo980-selector">Escolher equipe<select id="neo980-select">${select}</select></label>
 <div class="neo980-team-header"><span class="neo980-crest" style="--team:${esc(t.color||'#47b8ff')}">${esc(t.crest||t.short?.slice(0,2)||'FC')}</span><div><strong>${esc(t.name)}</strong><small>${formationLabel} · ${esc(t.country||'')}${t.master?' · Master Striker: '+esc(t.master):''}</small></div><span class="neo980-ai-live">IA ATIVA</span></div>
 <div class="neo980-pitch" role="group" aria-label="Escalação visual: ${esc(t.name)}, ${formationLabel}"><div class="neo980-pitch-markings"><span class="neo980-center-circle"></span><span class="neo980-penalty neo980-penalty-top"></span><span class="neo980-penalty neo980-penalty-bottom"></span></div><span class="neo980-goal goal-top"></span><span class="neo980-goal goal-bottom"></span>
 ${plan.players.map((name,i)=>player(t,name,f[i]?.role||E.DEFAULT_FORMATION[i]?.role||'MC',i,s,f[i]||E.DEFAULT_FORMATION[i])).join('')}
 </div><div class="neo980-pitch-caption">⬆ Ataque · OVR calculado para a posição de cada jogador · 🧤 goleiro na base</div>
 <div class="neo980-coach-card"><div class="neo980-coach-title"><span>🧠 Técnico inteligente</span><b>${form.underPressure?'REVENDO TIME':'ANALISANDO'}</b></div><p>${esc(summary)}</p>${plan.changes.length?`<div class="neo980-coach-changes">${plan.changes.map(x=>`<span>🔄 ${esc(x.out)} <b>→</b> ${esc(x.in)} <small>${esc(x.role)}</small></span>`).join('')}</div>`:''}<small>Se houver sequência de derrotas, o técnico avalia reservas da mesma posição. Durante o jogo, ajusta pressão e substituições conforme o placar. Mudanças não alteram seus dados salvos.</small></div>
 <details class="neo980-reserves"><summary>🪑 Banco de reservas <span>${plan.reserves.length} jogadores</span></summary><div class="neo980-bench">${plan.reserves.map((name,i)=>{const role=C.reserveRole(t,name),o=rating(name,t,role,11+i,s);return `<button class="neo980-bench-row" type="button" data-neo960-profile="${profileKey(name,t.id)}" aria-label="Ver ficha de ${esc(name)}">${portrait(name,t)}<span><b>${esc(name)}</b><small>${esc(labels[role]||role)}</small></span><strong>${o} OVR</strong></button>`}).join('')||'<p>Nenhum reserva cadastrado.</p>'}</div></details>
 <details class="neo980-old-list"><summary>📚 Listagem completa e habilidades</summary><div id="neo980-legacy-anchor"></div></details>`;
 $('neo980-select')?.addEventListener('change',e=>chooseTeam(e.target.value));
 // Keep the original all-team cards available inside a collapsed area only.
 const legacy=$('squadCards'),anchor=$('neo980-legacy-anchor');if(legacy&&anchor&&legacy.parentElement!==anchor)anchor.append(legacy);
}
function boot(){const root=$('squads');if(!root)return;
 if(!$('neo980-squad-area')){const top=document.createElement('div');top.id='neo980-squad-area';root.insertBefore(top,root.firstChild)}
 render();
 const observer=new MutationObserver(()=>{if(!root.classList.contains('hidden'))render()});
 observer.observe(root,{attributes:true,attributeFilter:['class']});
 document.addEventListener('click',e=>{if(e.target.closest('[data-tab="squads"],[data-neo-tab="squads"],[data-neo-open="squads"]'))setTimeout(render,90)});
 window.addEventListener('storage',e=>{if(['neo-season-v2','neo-custom-cups-v970'].includes(e.key))render()});
 window.NeoSquads980={render,chooseTeam,labels};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
