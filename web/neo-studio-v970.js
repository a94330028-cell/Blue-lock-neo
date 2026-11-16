/* Blue Lock NEO 9.7: creator, portrait importer, real exhibition/cup fixtures. */
(()=>{'use strict';
const E=window.NeoEngine,H=window.NeoHistoric970,C=window.NeoCups970;
if(!E||!H||!C)return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const SAVED_PLAYER_KEY='neo-created-players-v970';
const ROLE_LABELS={GOL:'Goleiro',LD:'Lateral direito',ZAG:'Zagueiro',LE:'Lateral esquerdo',VOL:'Volante',MC:'Meio-campista',MEI:'Meia ofensivo',PD:'Ponta direita',CA:'Atacante',PE:'Ponta esquerda'};
const errtext=e=>String(e?.message||e||'Erro inesperado');
let own=[],cups=[],activeId=null,photoTeam='all',photoQuery='';
function load(){try{const x=JSON.parse(localStorage.getItem(SAVED_PLAYER_KEY)||'[]');own=Array.isArray(x)?x.filter(p=>p?.name&&p?.club).slice(0,12):[];}catch(_){own=[]}
 cups=C.safeLoad(localStorage);activeId=localStorage.getItem('neo970-active-cup')||cups[0]?.id||null;
 for(const p of own)E.registerCreatedPlayer(p);
}
const persistOwn=()=>localStorage.setItem(SAVED_PLAYER_KEY,JSON.stringify(own));
const persistCups=()=>C.save(localStorage,cups);
const clubs=()=>E.allTeams();
const optionHtml=(selected=null)=>clubs().map(t=>`<option value="${esc(t.id)}" ${t.id===selected?'selected':''}>${esc(t.name)}</option>`).join('');
function portraitHtml(name,t,cls='neo970-photo'){
 if(window.NeoPortraitUI?.html)return window.NeoPortraitUI.html(name,t,cls);
 return `<span class="${cls} neo970-photo-empty" aria-label="Retrato não cadastrado">${esc(name.slice(0,2).toUpperCase())}</span>`;
}
function setStatus(id,message,bad=false){const el=$(id);if(el){el.textContent=message;el.classList.toggle('bad',!!bad);}}
function restoreGameOptions(){
 for(const id of ['home','away']){
  const select=$(id);if(!select)continue;
  for(const t of H.teams){if(select.querySelector(`option[value="${t.id}"]`))continue;
   const option=document.createElement('option');option.value=t.id;option.textContent=t.name+' · '+t.formationName;select.append(option);
  }
 }
}
function setupCreator(){const root=$('more')||$('squads');if(!root)return;
 const sec=document.createElement('section');sec.id='neo970-creator';sec.className='neo970-panel';
 sec.innerHTML=`<div class="neo970-heading"><span>🧬</span><div><strong>Criar meu jogador</strong><small>Monte seu personagem e coloque-o num time de verdade</small></div></div>
  <form id="neo970-character-form" class="neo970-create-form">
   <label>Nome do personagem<input id="neo970-char-name" required maxlength="36" minlength="2" placeholder="Nome do seu jogador" autocomplete="off"></label>
   <label>Equipe<select id="neo970-char-club">${optionHtml('bm')}</select></label>
   <label>Posição<select id="neo970-char-role">${Object.entries(ROLE_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
   <label>Camisa<input id="neo970-char-number" type="number" min="1" max="99" value="10"></label>
   <label>Pé dominante<select id="neo970-char-foot"><option value="destro">Direito</option><option value="canhoto">Esquerdo</option><option value="ambidestro">Ambidestro</option></select></label>
   <label>Estilo<select id="neo970-char-style"><option value="equilibrado">Equilibrado</option><option value="finalizador">Finalizador</option><option value="criador">Criador de jogadas</option><option value="marcador">Defensivo</option><option value="veloz">Velocista</option><option value="goleiro">Reflexos de goleiro</option></select></label>
   <label>Overall inicial (máximo 85)<input id="neo970-char-ovr" type="range" min="60" max="85" step="1" value="74"><output id="neo970-ovr-value">74 OVR</output></label>
   <label>Foto do personagem (opcional)<input id="neo970-char-file" type="file" accept="image/png,image/jpeg,image/webp"></label>
   <button type="submit" class="neo970-primary">Criar e escalar jogador</button>
  </form><p class="neo970-hint">Seu personagem ocupa uma vaga na escalação; o titular substituído vai para o banco. Os cinco clubes originais e a temporada salva continuam disponíveis.</p>
  <div id="neo970-char-status" class="neo970-feedback" role="status"></div><div id="neo970-my-players"></div>`;
 root.prepend(sec);
 $('neo970-char-ovr').addEventListener('input',e=>{$('neo970-ovr-value').textContent=e.target.value+' OVR'});
 $('neo970-character-form').addEventListener('submit',async e=>{
  e.preventDefault();const name=$('neo970-char-name').value.trim(),club=$('neo970-char-club').value,role=$('neo970-char-role').value;
  const shirt=Number($('neo970-char-number').value),ovr=Number($('neo970-char-ovr').value),file=$('neo970-char-file').files[0];
  if(own.length>=12)return setStatus('neo970-char-status','Limite de 12 personagens próprios por aparelho.',true);
  if(own.some(p=>p.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')))return setStatus('neo970-char-status','Já existe um personagem seu com esse nome.',true);
  const p={name,club,role,number:Math.max(1,Math.min(99,shirt||10)),ovr,foot:$('neo970-char-foot').value,style:$('neo970-char-style').value};
  const registered=E.registerCreatedPlayer(p);
  if(!registered)return setStatus('neo970-char-status','Nome já pertence a outro atleta ou não existe vaga na equipe.',true);
  own.push(p);persistOwn();renderCreated();$('neo970-character-form').reset();$('neo970-ovr-value').textContent='74 OVR';
  if(file){try{await importPortrait(name,file);setStatus('neo970-char-status','Personagem criado e foto salva. Já está na escalação!');}catch(err){setStatus('neo970-char-status','Personagem criado, mas não foi possível salvar a foto: '+errtext(err),true)}}
  else setStatus('neo970-char-status','✅ '+name+' criado, com '+ovr+' OVR e escalado no '+E.teamById(club).name+'.');
  refreshExternal();
 });
 sec.addEventListener('click',e=>{const b=e.target.closest('[data-neo970-delete]');if(!b)return;const id=b.dataset.neo970Delete;const i=own.findIndex(p=>p.name+'|'+p.club===id);if(i<0)return;
  E.unregisterCreatedPlayer(id);own.splice(i,1);persistOwn();renderCreated();refreshExternal();setStatus('neo970-char-status','Personagem removido da escalação. Resultados anteriores não foram apagados.');
 });
 renderCreated();
}
function renderCreated(){const el=$('neo970-my-players');if(!el)return;
 el.innerHTML=own.length?'<h3>Meus personagens</h3>'+own.map(p=>`<div class="neo970-created-row">${portraitHtml(p.name,E.teamById(p.club))}<div><b>${esc(p.name)}</b><small>${esc(E.teamById(p.club)?.short||p.club)} · ${esc(p.role)} · ${p.ovr} OVR · #${p.number}</small></div><button type="button" data-neo970-delete="${esc(p.name+'|'+p.club)}" aria-label="Remover ${esc(p.name)}">✕</button></div>`).join(''):
  '<p class="neo970-hint">Nenhum personagem próprio criado ainda.</p>';
}
async function importPortrait(name,file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Use JPG, PNG ou WebP.');
 if(file.size>8*1024*1024)throw Error('Imagem acima de 8 MB.');
 if(!window.NeoPortraitManager?.saveFile)throw Error('Biblioteca de retratos ainda não está disponível.');
 await window.NeoPortraitManager.saveFile(name,file);
}
function setupPhotos(){const root=$('squads')||$('more');if(!root)return;
 const sec=document.createElement('section');sec.className='neo970-panel';sec.id='neo970-new-squads';
 sec.innerHTML=`<div class="neo970-heading"><span>📸</span><div><strong>Novos elencos — imagens por jogador</strong><small>4 times históricos completos; escolha a foto de cada atleta</small></div></div>
 <label class="neo970-search">Buscar jogador ou time<input id="neo970-photo-search" type="search" placeholder="Cristiano Ronaldo, Flamengo..." autocomplete="off"></label>
 <label class="neo970-search">Equipe<select id="neo970-photo-club"><option value="all">Todos os quatro times</option>${H.teams.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select></label>
 <div id="neo970-photo-list" class="neo970-photo-list"></div><p id="neo970-photo-status" role="status" class="neo970-feedback">Não coloquei imagens inventadas: você adiciona cada retrato aqui.</p>
 <input id="neo970-photo-input" type="file" accept="image/png,image/jpeg,image/webp" hidden>`;
 root.append(sec);
 $('neo970-photo-search').addEventListener('input',e=>{photoQuery=e.target.value.trim().toLocaleLowerCase('pt-BR');renderPhotos()});
 $('neo970-photo-club').addEventListener('change',e=>{photoTeam=e.target.value;renderPhotos()});
 const file=$('neo970-photo-input');
 sec.addEventListener('click',e=>{
  const selected=e.target.closest('[data-neo992-photo-select]');
  if(selected){
    photoTeam=selected.dataset.neo992PhotoTeam;
    photoQuery='';
    $('neo970-photo-club').value=photoTeam;
    $('neo970-photo-search').value='';
    renderPhotos();
    const row=[...sec.querySelectorAll('[data-neo970-photo]')].find(el=>el.dataset.neo970Photo===selected.dataset.neo992PhotoSelect)?.closest('.neo970-photo-row');
    if(row){row.classList.add('neo992-selected');row.scrollIntoView?.({behavior:'smooth',block:'center'});}
    return;
  }
  const b=e.target.closest('[data-neo970-photo]');if(!b)return;
  file.dataset.player=b.dataset.neo970Photo;file.value='';file.click();
});
 file.addEventListener('change',async()=>{const name=file.dataset.player,photo=file.files[0];if(!photo||!name)return;
  setStatus('neo970-photo-status','Salvando retrato de '+name+'...');
  try{await importPortrait(name,photo);setStatus('neo970-photo-status','✅ Foto salva para '+name+'. Será usada nas listas, nas partidas e na ficha.');renderPhotos();refreshExternal();}
  catch(err){setStatus('neo970-photo-status',errtext(err),true)}
 });
 renderPhotos();
}
function renderPhotos(){const el=$('neo970-photo-list');if(!el)return;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
 const q=norm(photoQuery);
 // Searching shows just name + club, not a huge open panel for every player.
 if(q){
   const hits=H.teams.filter(t=>photoTeam==='all'||photoTeam===t.id)
     .flatMap(t=>[...t.starters,...t.reserves].filter(([name])=>norm(name).includes(q)||norm(t.name).includes(q))
       .map(([name])=>({name,t})));
   el.innerHTML='<div class="neo992-search-results" role="list">'+hits.map(({name,t})=>
     `<button type="button" class="neo992-search-result" data-neo992-photo-select="${esc(name)}" data-neo992-photo-team="${esc(t.id)}"><strong>${esc(name)}</strong><small>${esc(t.name)}</small></button>`
   ).join('')+'</div>'+(hits.length?'':'<p class="neo970-hint">Nenhum atleta corresponde à busca.</p>');
   return;
 }
 el.innerHTML=H.teams.filter(t=>photoTeam==='all'||photoTeam===t.id).map(t=>{
  const all=[...t.starters,...t.reserves].filter(([name])=>!q||norm(name).includes(q)||norm(t.name).includes(q));if(!all.length)return '';
  return `<details class="neo970-club-roster" ${q||photoTeam===t.id?'open':''}><summary><strong>${esc(t.name)}</strong><span>${all.length} jogadores · titulares e reservas</span></summary>
   <div>${all.map(([name,role,number])=>`<div class="neo970-photo-row">${portraitHtml(name,E.teamById(t.id))}<div><b>${esc(name)}</b><small>#${number} · ${esc(ROLE_LABELS[role]||role)}</small></div><button type="button" data-neo970-photo="${esc(name)}" aria-label="Adicionar imagem de ${esc(name)}">📷 Foto</button></div>`).join('')}</div></details>`;
 }).join('')||'<p class="neo970-hint">Nenhum atleta corresponde à busca.</p>';
}
function setupCups(){const root=$('more')||$('league');if(!root)return;
 const sec=document.createElement('section');sec.id='neo970-cups';sec.className='neo970-panel';
 sec.innerHTML=`<div class="neo970-heading"><span>🏆</span><div><strong>Campeonatos personalizados</strong><small>Escolha quem joga: Blue Lock + clubes históricos</small></div></div>
  <form id="neo970-cup-form" class="neo970-cup-form"><label>Nome do campeonato<input id="neo970-cup-title" maxlength="45" value="Copa dos Egoístas"></label>
  <fieldset class="neo970-check-teams"><legend>Escolha de 2 a 9 equipes</legend>${clubs().map(t=>`<label><input type="checkbox" name="neo970-cup-team" value="${esc(t.id)}" ${H.getTeam(t.id)?'checked':''}><span>${esc(t.name)}</span></label>`).join('')}</fieldset>
  <label class="neo970-legs"><input type="checkbox" id="neo970-cup-legs"> Ida e volta</label><button class="neo970-primary" type="submit">Criar campeonato</button></form>
  <div id="neo970-cup-status" role="status" class="neo970-feedback"></div><div id="neo970-active-cups"></div>`;
 root.insertBefore(sec,root.firstChild);
 $('neo970-cup-form').addEventListener('submit',e=>{e.preventDefault();const ids=[...sec.querySelectorAll('input[name=neo970-cup-team]:checked')].map(x=>x.value);
  try{const cup=C.createCup(E,ids,$('neo970-cup-title').value,$('neo970-cup-legs').checked);cups.unshift(cup);cups=cups.slice(0,12);activeId=cup.id;localStorage.setItem('neo970-active-cup',activeId);persistCups();renderCup();setStatus('neo970-cup-status','✅ Campeonato criado. Simule os confrontos um por vez.');}
  catch(err){setStatus('neo970-cup-status',errtext(err),true)}
 });
 sec.addEventListener('click',e=>{const button=e.target.closest('[data-neo970-cup-act]');if(!button)return;
  const action=button.dataset.neo970CupAct;
  if(action==='play'){button.disabled=true;setStatus('neo970-cup-status','Simulando a próxima partida com o motor de futebol...');
   setTimeout(()=>{try{const cup=cups.find(x=>x.id===activeId),res=C.playNext(E,cup);if(!res)throw Error('Todos os jogos já terminaram.');persistCups();renderCup();refreshExternal();setStatus('neo970-cup-status','⚽ '+E.teamById(res.home).short+' '+res.score.join(' × ')+' '+E.teamById(res.away).short+' · rodada '+res.round);}
    catch(err){setStatus('neo970-cup-status',errtext(err),true);renderCup()}},30);
  }else if(action==='select'){activeId=button.dataset.cupId;localStorage.setItem('neo970-active-cup',activeId);renderCup();}
  else if(action==='delete'){cups=cups.filter(x=>x.id!==activeId);activeId=cups[0]?.id||null;persistCups();renderCup();setStatus('neo970-cup-status','Campeonato excluído. A Liga Neo Egoísta continua intacta.');}
 });
 renderCup();
}
function renderCup(){const box=$('neo970-active-cups');if(!box)return;
 const current=cups.find(x=>x.id===activeId);
 if(!current){box.innerHTML='<p class="neo970-hint">Selecione seus clubes e crie o primeiro campeonato personalizado.</p>';return}
 const standings=C.standings(E,current),all=C.fixtures(current),played=all.filter(x=>x.result).length,next=C.nextUnplayed(current);
 const rank=standings.map((t,i)=>`<tr><td>${i+1}º</td><td>${esc(E.teamById(t.id)?.short||t.id)}</td><td>${t.J}</td><td>${t.V}</td><td>${t.E}</td><td>${t.D}</td><td><b>${t.Pts}</b></td></tr>`).join('');
 box.innerHTML=`<div class="neo970-cup-menu"><label>Campeonato<select id="neo970-choose-cup">${cups.map(c=>`<option value="${esc(c.id)}" ${c.id===current.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><button type="button" data-neo970-cup-act="delete" class="neo970-tertiary">Excluir</button></div>
 <div class="neo970-cup-progress"><strong>${esc(current.name)}</strong><span>${played} de ${all.length} jogos · ${next?'Rodada '+next.round:'🏆 Campeão: '+(standings[0]?.name||'—')}</span></div>
 <table class="neo970-table" aria-label="Classificação da copa"><thead><tr><th>#</th><th>Equipe</th><th>J</th><th>V</th><th>E</th><th>D</th><th>Pts</th></tr></thead><tbody>${rank}</tbody></table>
 <div class="neo970-next-match">${next?'<b>Próximo:</b> '+esc(E.teamById(next.game.home).name)+' × '+esc(E.teamById(next.game.away).name):'<b>Campeonato concluído!</b>'}</div>
 <button class="neo970-primary neo970-play" data-neo970-cup-act="play" type="button" ${next?'':'disabled'}>${next?'▶ Simular próxima partida':'✓ Campeonato encerrado'}</button>
 <details class="neo970-previous"><summary>📅 Resultados e tabela de jogos</summary><div>${current.rounds.map(r=>`<div class="neo970-round"><b>Rodada ${r.round}</b>${r.games.map(g=>`<span>${esc(E.teamById(g.home).short)} <b>${g.result?g.result.join(' × '):'×'}</b> ${esc(E.teamById(g.away).short)}</span>`).join('')}</div>`).join('')}</div></details>
 <p class="neo970-hint">Todas as partidas usam o mesmo motor de gols, defesas, desarmes, habilidades e goleiros. Estatísticas registradas aparecem nas fichas dos jogadores. Esta copa não altera a liga principal.</p>`;
 $('neo970-choose-cup').addEventListener('change',e=>{activeId=e.target.value;localStorage.setItem('neo970-active-cup',activeId);renderCup()});
}
function refreshExternal(){
 window.NeoSquads980?.render?.();
 window.NeoMarket96?.showRanking?.();
 if($('neo970-photo-list'))renderPhotos();
 if($('neo970-my-players'))renderCreated();
}
function setupQuickLinks(){const parent=$('match');if(!parent)return;
 const mini=document.createElement('div');mini.className='neo970-quick';mini.innerHTML='<strong>⚽ Novos modos</strong><button type="button" data-neo970-quick="cup">🏆 Campeonatos</button><button type="button" data-neo970-quick="player">🧬 Criar jogador</button><span>4 novos clubes disponíveis nos seletores de amistosos.</span>';
 parent.prepend(mini);
 mini.addEventListener('click',e=>{const b=e.target.closest('[data-neo970-quick]');if(!b)return;
  document.querySelector('.nav button[data-tab="more"]')?.click();const id=b.dataset.neo970Quick==='cup'?'neo970-cups':'neo970-creator';setTimeout(()=>$((id))?.scrollIntoView({behavior:'smooth',block:'start'}),100);
 });
}
function boot(){if($('neo970-creator'))return;
 try{load();restoreGameOptions();setupCups();setupCreator();setupPhotos();setupQuickLinks();refreshExternal();}
 catch(e){console.error('Novos modos 9.7 indisponíveis:',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
