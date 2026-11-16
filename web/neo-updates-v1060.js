/* NEO UPDATE SYSTEM v10.6 — compact, accessible change history.
 * Does not mutate matches, statistics, seasons, gallery storage or player portraits. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document){root.NeoUpdates1060=api;api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const SEEN_KEY='neo-updates-last-seen',SOURCE='./CHANGELOG.json';
const ITEMS=[
 ['novidades','✨ Novidades'],['correcoes','🛠️ Bugs corrigidos'],
 ['jogabilidade','⚽ Jogabilidade'],['visual','🎨 Melhorias visuais'],
 ['otimizacoes','⚡ Otimizações'],['importantes','📌 Informações importantes']
];
const validVersion=v=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v);
const compare=(a,b)=>{
 const aa=String(a||'0.0.0').split('.').map(Number),bb=String(b||'0.0.0').split('.').map(Number);
 for(let i=0;i<3;i++){if(aa[i]!==bb[i])return aa[i]>bb[i]?1:-1;}return 0;
};
function validate(data){
 if(!data||data.schema!==1||data.project!=='Blue Lock NEO'||!validVersion(data.current_version))return false;
 if(!Array.isArray(data.releases)||!data.releases.length||data.releases[0]?.version!==data.current_version)return false;
 const seen=new Set();
 for(const r of data.releases){
  if(!validVersion(r.version)||!r.date||seen.has(r.version))return false;
  seen.add(r.version);
  for(const [key] of ITEMS)if(r[key]!==undefined&&(!Array.isArray(r[key])||r[key].some(v=>typeof v!=='string')))return false;
 }
 return true;
}
function mount(win){
 const doc=win.document,storage=win.localStorage;
 const el=(tag,cls,text)=>{const node=doc.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
 const seen=()=>{try{return storage.getItem(SEEN_KEY)||'';}catch(_){return '';}};
 const saveSeen=v=>{try{storage.setItem(SEEN_KEY,v);}catch(_){}};
 let currentData=null,expanded=false;
 function indicator(){
  const fresh=!!(currentData?.current_version&&compare(currentData.current_version,seen())>0);
  const dot=doc.getElementById('neo1060-dot'),nav=doc.getElementById('neo1060-nav-dot');
  for(const marker of [dot,nav])if(marker){marker.hidden=!fresh;marker.setAttribute('aria-hidden','true');}
  const control=doc.getElementById('neo1060-open');if(control)control.setAttribute('aria-label',fresh?'🚀 Atualizações: há novidades não lidas':'🚀 Consultar histórico de atualizações');
 }
 function display(data){
  const list=doc.getElementById('neo1060-list'),version=doc.getElementById('neo1060-version');
  if(!list||!version)return;
  currentData=data;list.replaceChildren();
  version.textContent='Versão atual: '+data.current_version;
  for(const [i,r] of data.releases.entries()){
   const article=el('article','neo1060-release'),details=el('details','neo1060-entry');
   details.open=i===0;
   const header=el('summary','neo1060-summary');
   const title=el('span','neo1060-title','v'+r.version);
   const date=el('time','neo1060-date',r.date);
   date.dateTime=r.date;
   header.append(title,date);
   if(i===0)header.append(el('strong','neo1060-current','ATUAL'));
   details.append(header);
   const body=el('div','neo1060-body');
   for(const [key,label] of ITEMS){
    const values=(Array.isArray(r[key])?r[key]:[]).filter(v=>v.trim());
    if(!values.length)continue;
    const section=el('section','neo1060-group'),heading=el('h4',null,label),list=el('ul');
    for(const item of values)list.append(el('li',null,item));
    section.append(heading,list);body.append(section);
   }
   details.append(body);article.append(details);list.append(article);
  }
  const banner=data.media?.banner?.path;
  const preview=doc.getElementById('neo1060-banner');
  if(preview&&typeof banner==='string'&&/^assets\/updates\/[a-z0-9-]+\.jpg$/.test(banner)){
   preview.src='./'+banner;preview.hidden=false;
   preview.onerror=()=>{preview.hidden=true;};
  }
  indicator();
 }
 function boot(){
  const more=doc.getElementById('more');
  if(!more||doc.getElementById('neo1060-updates'))return;
  const wrapper=el('section','neo1060-card');wrapper.id='neo1060-updates';
  const top=el('button','neo1060-toggle');top.type='button';top.id='neo1060-open';
  top.setAttribute('aria-expanded','false');top.setAttribute('aria-controls','neo1060-panel');
  const icon=el('span','neo1060-icon','🚀');
  const title=el('span','neo1060-headline','ATUALIZAÇÕES');
  const dot=el('span','neo1060-notice');dot.id='neo1060-dot';dot.hidden=true;
  const arrow=el('span','neo1060-chevron','⌄');arrow.setAttribute('aria-hidden','true');
  top.append(icon,title,dot,arrow);
  const panel=el('div','neo1060-panel');panel.id='neo1060-panel';panel.hidden=true;
  panel.append(el('p','neo1060-lead','Histórico oficial do Blue Lock NEO — novidades, correções e melhorias realmente publicadas.'));
  const banner=el('img','neo1060-banner');banner.id='neo1060-banner';banner.hidden=true;banner.alt='Banner oficial NEO UPDATE BOT';
  banner.loading='lazy';panel.append(banner);
  const version=el('p','neo1060-version','Consultando versão atual...');version.id='neo1060-version';panel.append(version);
  const list=el('div','neo1060-list');list.id='neo1060-list';panel.append(list);
  const info=el('p','neo1060-bottom','O histórico é informativo. Consultar esta seção não altera sua temporada ou seus retratos.');panel.append(info);
  wrapper.append(top,panel);more.prepend(wrapper);
  const moreNav=doc.querySelector('#neoMobileNav [data-neo-tab="more"],#neoMobileNav [data-neo-tab="more"]');
  if(moreNav&&!doc.getElementById('neo1060-nav-dot')){
   const mark=el('i','neo1060-nav-dot');mark.id='neo1060-nav-dot';mark.hidden=true;moreNav.append(mark);
  }
  const open=()=>{
   expanded=!expanded;panel.hidden=!expanded;top.setAttribute('aria-expanded',String(expanded));
   arrow.textContent=expanded?'⌃':'⌄';
   if(expanded&&currentData){saveSeen(currentData.current_version);indicator();}
  };
  top.addEventListener('click',open);
  doc.addEventListener('click',event=>{
   const btn=event.target.closest?.('[data-neo1060-open]');
   if(!btn)return;
   win.NeoMobile?.openTab?.('more');
   if(!expanded)open();
   wrapper.scrollIntoView({block:'start',behavior:win.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  const refresh=()=>fetch(SOURCE,{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error('Changelog indisponível');return r.json();})
    .then(data=>{if(!validate(data))throw Error('Formato do changelog inválido');display(data);})
    .catch(error=>{
      version.textContent='Histórico temporariamente indisponível. O jogo pode ser usado normalmente.';
      console.warn('NEO Updates:',error.message);
    });
  refresh();
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {SEEN_KEY,compare,validate,mount};
});