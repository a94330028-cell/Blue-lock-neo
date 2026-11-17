/* NEO 2.0 — newsroom, player dossiers and verified match analytics.
   All user-facing strings come from existing recorded matches/save entries. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.Neo2Hub=api;if(root.document)api.mount(root)}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const view={page:'news',player:'',open:false};
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const fmt=x=>new Intl.NumberFormat('pt-BR').format(Math.round(num(x)));
function summary(season,match){
 const W=season?.career?.neo2World;
 const news=(W?.news||[]).slice(-16).reverse();
 const players=Object.values(season?.career?.players||{}).filter(p=>p?.name&&p.club&&!p.isMaster)
   .sort((a,b)=>(num(b.value)-num(a.value))||(num(b.games)-num(a.games))||a.name.localeCompare(b.name,'pt-BR'));
 const completed=(season?.rounds||[]).flatMap(r=>(r.games||[]).filter(g=>Array.isArray(g.result))
  .map(g=>({round:r.round,...g})));
 const last=completed.at(-1)?.details?.neo2Insights||null;
 const current=match?.result?.()?.neo2Insights||last;
 return {news,players,completed,insights:current,
  rivalries:Object.entries(W?.rivals||{}).sort((a,b)=>num(b[1].duels)-num(a[1].duels)).slice(0,12)};
}
function mount(win){
 const doc=win.document;if(!doc)return;
 const ready=()=>{
  if(doc.getElementById('neo2HubToggle'))return;
  const make=(tag,className,text)=>{
   const e=doc.createElement(tag);if(className)e.className=className;
   if(text!==undefined)e.textContent=String(text);return e;
  };
  const launcher=make('button','neo2-hub-toggle','✦ NEO 2.0 · Centro de Evolução');
  launcher.id='neo2HubToggle';launcher.type='button';
  const overlay=make('section','neo2-hub');overlay.id='neo2Hub';
  overlay.hidden=true;overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Centro de Evolução NEO 2.0');
  const panel=make('div','neo2-hub-panel');
  const top=make('div','neo2-hub-top'),heading=make('div','neo2-hub-heading');
  heading.append(make('strong',null,'✦ BLUE LOCK NEO 2.0'),make('span',null,'Dossiês, notícias e estatísticas verificadas'));
  const close=make('button','neo2-hub-close','✕ Fechar');close.type='button';
  top.append(heading,close);panel.append(top);
  const nav=make('div','neo2-hub-nav');
  for(const [id,label] of [['news','Noticiário'],['dossier','Dossiês'],['analysis','Dados avançados'],['rivals','Rivalidades']]){
   const btn=make('button','neo2-hub-tab',label);
   btn.type='button';btn.dataset.neo2Page=id;nav.append(btn);
  }
  const body=make('div','neo2-hub-body');body.id='neo2HubBody';
  panel.append(nav,body);overlay.append(panel);
  doc.body.append(launcher,overlay);
  const textline=(container,label,value)=>{
   const row=make('div','neo2-hub-line');row.append(make('span',null,label),make('strong',null,value));container.append(row);return row;
  };
  const section=(title)=>{
   const el=make('section','neo2-hub-section');el.append(make('h3',null,title));body.append(el);return el;
  };
  function render(){
   const season=win.NeoCareerBridge?.getSeason?.();
   const match=win.NeoMatchBridge?.getMatch?.();
   const E=win.NeoEngine;
   const data=summary(season,match);
   body.replaceChildren();
   [...nav.children].forEach(x=>{x.classList.toggle('active',x.dataset.neo2Page===view.page);x.setAttribute('aria-selected',String(x.dataset.neo2Page===view.page));});
   if(view.page==='news'){
    const box=section('📰 Notícias de partidas oficiais');
    if(!data.news.length){box.append(make('p','neo2-hub-muted','As notícias aparecem quando uma partida oficial termina.'));return;}
    for(const item of data.news){
     const card=make('article','neo2-news-card');card.append(make('small',null,'RODADA '+item.round),make('strong',null,item.title));
     if(item.hero)card.append(make('span',null,'Destaque da partida: '+item.hero));
     const goals=(item.goals||[]).map(g=>g.scorer+' '+g.minute+'’').join(' · ');
     if(goals)card.append(make('small',null,'Gols registrados: '+goals));box.append(card);
    }
   }else if(view.page==='dossier'){
    const box=section('📋 Dossiê de Evolução Individual');
    if(!data.players.length){box.append(make('p','neo2-hub-muted','Nenhum jogador com dados registrados.'));return;}
    const select=make('select','neo2-hub-select');
    for(const p of data.players.slice(0,300)){
     const opt=make('option',null,p.name+' · '+p.club);
     opt.value=p.name+'|'+p.club;select.append(opt);
    }
    if(view.player&&[...select.options].some(opt=>opt.value===view.player))select.value=view.player;
    else view.player=select.value;
    select.addEventListener('change',()=>{view.player=select.value;render()});box.append(select);
    const split=view.player.lastIndexOf('|');
    const record=E?.Neo2World?.dossier?.(season,view.player.slice(0,split),view.player.slice(split+1));
    if(!record)return;
    const stats=make('div','neo2-hub-stats');
    for(const [label,number] of [['Jogos',record.appearances],['Nota média',record.rating?record.rating.toFixed(2):'—'],
      ['Valor de mercado','¥ '+fmt(record.value)],['Gols',record.totals.goals],
      ['Assistências',record.totals.assists],['Confiança',record.confidence||'—']])
      textline(stats,label,number);
    box.append(stats);
    box.append(make('p','neo2-hub-muted','Perfil: '+(record.signature||'Em formação')+
      (record.recentOpponent?' · Último adversário: '+record.recentOpponent:'')));
    const form=make('div','neo2-hub-form');
    for(const match of record.form.slice(-10))textline(form,'Rodada '+match.round+' · '+match.opponent,
      match.rating.toFixed(1)+' · '+match.goals+' G · '+match.assists+' A');
    if(record.form.length){box.append(make('h4',null,'Últimas atuações'),form);}
    if(record.skills.length){
     const skills=section('Armas utilizadas e progressão');
     for(const [id,count] of record.skills.slice(0,8))
      textline(skills,E?.Abilities?.get(id)?.label||id,fmt(count)+' usos registrados');
    }
    if(record.upgrades?.length){
     const mastery=section('⭐ Maestria comprovada');
     const labels={1:'Inicial',2:'Avançado',3:'Supremo'};
     for(const [id,tier] of record.upgrades)textline(mastery,E?.Abilities?.get(id)?.label||id,labels[tier]||'Nível '+tier);
    }
    if(record.partners.length){
     const pairs=section('Entrosamento em passes tentados');
     for(const [name,count] of record.partners.slice(0,6))textline(pairs,name,fmt(count));
    }
   }else if(view.page==='analysis'){
    const box=section('📊 Estatísticas extraídas dos lances');
    const r=data.insights;
    if(!r){box.append(make('p','neo2-hub-muted','Comece uma partida ou conclua uma rodada para ver as estatísticas.'));return;}
    const stats=make('div','neo2-hub-stats');
    textline(stats,'Amostras de posição',fmt(r.samples));
    for(const s of r.shots||[]) {
     textline(stats,(s.team===0?'Mandante':'Visitante')+' · xG',s.xg.toFixed(2));
     textline(stats,(s.team===0?'Mandante':'Visitante')+' · chutes',fmt(s.attempts));
     textline(stats,(s.team===0?'Mandante':'Visitante')+' · gols',fmt(s.goals));
     textline(stats,(s.team===0?'Mandante':'Visitante')+' · passes progressivos tentados',fmt(r.progressivePassAttempts?.[s.team]));
    }
    box.append(stats);
    const heatEntries=Object.entries(r.heat||{}).filter(([,counts])=>Array.isArray(counts)&&counts.some(v=>Number(v)>0));
    if(heatEntries.length){
     const hm=section('🔥 Mapa de calor de movimentação');
     const picker=make('select','neo2-hub-select');
     for(const [key] of heatEntries){
      const opt=make('option',null,key.replace(/\|/g,' · '));opt.value=key;picker.append(opt);
     }
     const grid=make('div','neo2-hub-heatmap');
     grid.setAttribute('role','img');grid.setAttribute('aria-label','Mapa de calor gerado das posições amostradas no jogo');
     const draw=()=>{
      const values=r.heat[picker.value]||[],peak=Math.max(1,...values);
      grid.replaceChildren();
      for(const n of values){
       const cell=make('span','neo2-hub-heat');
       cell.style.opacity=String(.1+.9*Math.min(1,Number(n)/peak));
       cell.title=fmt(n)+' amostras';
       grid.append(cell);
      }
     };
     picker.addEventListener('change',draw);draw();
     hm.append(picker,grid,make('p','neo2-hub-muted','Cada quadrado mostra ocupação real observada durante a partida. Quanto mais forte a cor, mais vezes o jogador ocupou a região.'));
    }
    const clips=section('🎥 Momentos verificados');
    for(const x of r.highlights||[]){
     const card=make('article','neo2-news-card');
     card.append(make('small',null,x.minute+'’ · '+x.type),make('strong',null,x.detail));
     clips.append(card);
    }
    if(!(r.highlights||[]).length)clips.append(make('p','neo2-hub-muted','Nenhum lance decisivo foi registrado ainda.'));
    const liveClips=Array.isArray(match?.goalClips)?match.goalClips.slice(-7):[];
    if(liveClips.length){
     clips.append(make('h4',null,'Rever gols da transmissão atual'));
     liveClips.forEach((clip,i)=>{
      if(!Array.isArray(clip.frames)||!clip.frames.length)return;
      const button=make('button','neo2-hub-replay','▶ Replay · '+clip.scorer+' · '+clip.minute+'’');
      button.type='button';
      button.addEventListener('click',()=>{
       match.lastGoal=clip;hide();
       if(typeof win.NeoReferenceMobile?.go==='function'&&win.matchMedia?.('(max-width:700px)').matches)
        win.NeoReferenceMobile.go('match');
       else doc.querySelector('.nav [data-tab="match"]')?.click();
       const replay=doc.getElementById('replay');
       if(replay){replay.disabled=false;replay.click();}
      });
      clips.append(button);
     });
    }
    clips.append(make('p','neo2-hub-muted','Replays reproduzem apenas os quadros ainda disponíveis da partida atual. Temporadas antigas preservam dados e destaques, mas não quadros de vídeo.'));
   }else{
    const box=section('⚔️ Rivalidades nascidas de duelos reais');
    if(!data.rivalries.length){box.append(make('p','neo2-hub-muted','Rivalidades aparecem depois de confrontos registrados.'));return;}
    for(const [name,rival] of data.rivalries)textline(box,name,fmt(rival.duels)+' duelos');
   }
  }
  function open(page){
   if(page)view.page=page;
   const wasOpen=!overlay.hidden;
   overlay.hidden=false;view.open=true;render();doc.body.classList.add('neo2-hub-open');
   if(!wasOpen)launcher.setAttribute('aria-expanded','true');
   close.focus({preventScroll:true});
  }
  function hide(){
   overlay.hidden=true;view.open=false;doc.body.classList.remove('neo2-hub-open');
   launcher.setAttribute('aria-expanded','false');launcher.focus({preventScroll:true});
  }
  launcher.setAttribute('aria-controls','neo2Hub');
  launcher.setAttribute('aria-expanded','false');
  launcher.addEventListener('click',()=>open());
  close.addEventListener('click',hide);
  nav.addEventListener('click',e=>{const btn=e.target.closest('[data-neo2-page]');if(btn)open(btn.dataset.neo2Page)});
  overlay.addEventListener('click',e=>{if(e.target===overlay)hide()});
  doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&view.open)hide()});
  win.addEventListener('neo2-recorded',()=>{if(view.open)render()});
  return {open,hide,render};
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
}
return {summary,mount};
});