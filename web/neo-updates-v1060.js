/* NEO UPDATE SYSTEM v10.6 — compact, accessible change history.
 * Does not mutate matches, statistics, seasons, gallery storage or player portraits. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document){root.NeoUpdates1060=api;api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const SEEN_KEY='neo-updates-last-seen-official-v1',SOURCE='./CHANGELOG.json';
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
function formatRelease(data){
 const r=data?.releases?.[0];if(!r)return '';
 const lines=['🚀 BLUE LOCK NEO — v'+r.version,'📅 '+r.date];
 for(const [key,label] of ITEMS)if(Array.isArray(r[key])&&r[key].length){lines.push('',label);for(const x of r[key])if(String(x||'').trim())lines.push('• '+String(x).trim());}
 lines.push('', '🌐 https://a94330028-cell.github.io/Blue-lock-neo/');
 return lines.join('\n');
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
  version.textContent='v'+data.current_version+' · HISTÓRICO OFICIAL';
  const headingVersion=doc.getElementById('neo110-heading-version');
  if(headingVersion)headingVersion.textContent='v'+data.current_version;
  const avatar=doc.getElementById('neo110-avatar');
  const avatarPath=data.media?.avatar?.path;
  if(avatar&&typeof avatarPath==='string'&&/^assets\/updates\/[a-z0-9-]+\.png$/.test(avatarPath))avatar.src='./'+avatarPath;
  const latest=data.releases[0],highlights=doc.getElementById('neo110-highlights');
  if(highlights){
    highlights.replaceChildren();
    const important=[...(latest.novidades||[]),...(latest.jogabilidade||[]),...(latest.correcoes||[])].slice(0,3);
    important.forEach((msg,i)=>{
      const item=el('article','neo110-highlight');
      item.append(el('span','neo110-highlight-index',String(i+1).padStart(2,'0')),el('p',null,msg));
      highlights.append(item);
    });
  }
  // The 1.x patch had grown into dozens of items. Render only the current
  // version at startup; older patch notes stay intact in a lazy archive.
  const releaseCard=(r,i)=>{
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
    const values=(Array.isArray(r[key])?r[key]:[]).filter(v=>typeof v==='string'&&v.trim());
    if(!values.length)continue;
    const section=el('section','neo1060-group'),heading=el('h4',null,label),bullets=el('ul');
    for(const item of values)bullets.append(el('li',null,item));
    section.append(heading,bullets);body.append(section);
   }
   details.append(body);article.append(details);
   return article;
  };
  list.append(releaseCard(data.releases[0],0));
  if(data.releases.length>1){
   const archive=el('details','neo1060-archive');
   archive.id='neo1060-archive';
   const archiveToggle=el('summary','neo1060-archive-toggle',
    '📚 Histórico anterior · '+(data.releases.length-1)+' versões');
   const archiveList=el('div','neo1060-archive-list');
   archive.append(archiveToggle,archiveList);
   archive.addEventListener('toggle',()=>{
    if(!archive.open||archive.dataset.loaded==='1')return;
    archive.dataset.loaded='1';
    // Generate historic notes only when requested; avoid inflating the
    // mobile DOM for every patch accumulated since the 1.x series.
    data.releases.slice(1).forEach((r,i)=>archiveList.append(releaseCard(r,i+1)));
   });
   list.append(archive);
  }
  const banner=data.media?.banner?.path;
  const preview=doc.getElementById('neo1060-banner');
  if(preview&&typeof banner==='string'&&/^assets\/updates\/[a-z0-9-]+\.png$/.test(banner)){
   preview.src='./'+banner;preview.hidden=false;
   preview.onerror=()=>{preview.hidden=true;};
  }
  if(expanded){saveSeen(currentData.current_version);}
  indicator();
 }
 function boot(){
  const more=doc.getElementById('more');
  if(!more||doc.getElementById('neo1060-updates'))return;
  const wrapper=el('section','neo1060-card');wrapper.id='neo1060-updates';
  const top=el('button','neo1060-toggle');top.type='button';top.id='neo1060-open';
  top.setAttribute('aria-expanded','false');top.setAttribute('aria-controls','neo1060-panel');
  const icon=el('span','neo1060-icon','⚡');
  const copyHead=el('span','neo110-headings');
  const title=el('span','neo1060-headline','NEO UPDATE CENTER');
  const sub=el('span','neo110-subheading','Novidades oficiais do simulador');
  copyHead.append(title,sub);
  const dot=el('span','neo1060-notice');dot.id='neo1060-dot';dot.hidden=true;
  const arrow=el('span','neo1060-chevron','⌄');arrow.setAttribute('aria-hidden','true');
  const versionChip=el('strong','neo110-chip','v1.1.0');versionChip.id='neo110-heading-version';
  top.append(icon,copyHead,dot,versionChip,arrow);
  const panel=el('div','neo1060-panel');panel.id='neo1060-panel';panel.hidden=true;
  const header=el('div','neo110-identity');
  const emblem=el('img','neo110-avatar');emblem.id='neo110-avatar';emblem.alt='Emblema NEO UPDATE BOT';emblem.loading='lazy';
  const identity=el('div','neo110-identity-text');
  identity.append(el('span','neo110-eyebrow','BLUE LOCK NEO · PATCH NOTES'),
    el('h3','neo110-identity-title','NOVA ERA DO EGOÍSMO'),
    el('p',null,'Acompanhe cada evolução do campo, da IA e do universo NEO.'));
  header.append(emblem,identity);panel.append(header);
  const kickers=el('div','neo110-kickers');
  kickers.append(el('span',null,'⚽ FUTEBOL EM EVOLUÇÃO'),
    el('span',null,'🧠 IA TÁTICA'),
    el('span',null,'⚡ TURBO 40×'));
  panel.append(kickers);
  panel.append(el('p','neo1060-lead','Novas mecânicas e correções reais, apresentadas por versão sem interromper suas partidas.'));
  const banner=el('img','neo1060-banner');banner.id='neo1060-banner';banner.hidden=true;banner.alt='Banner oficial NEO UPDATE BOT';
  banner.loading='lazy';panel.append(banner);
  const version=el('p','neo1060-version','Consultando versão atual...');version.id='neo1060-version';panel.append(version);
  const hTitle=el('h3','neo110-section-title','🔥 DESTAQUES DA ATUALIZAÇÃO');panel.append(hTitle);
  const highlights=el('div','neo110-highlights');highlights.id='neo110-highlights';panel.append(highlights);
  panel.append(el('h3','neo110-section-title','📜 TODAS AS MUDANÇAS'));
  const copy=el('button','neo1060-copy','📋 Copiar novidades da versão');copy.type='button';copy.id='neo1060-copy';panel.append(copy);
  const copyStatus=el('p','neo1060-copy-status','');copyStatus.id='neo1060-copy-status';copyStatus.setAttribute('role','status');panel.append(copyStatus);
  copy.addEventListener('click',async()=>{
    if(!currentData)return;
    try{
      if(!win.navigator?.clipboard?.writeText)throw Error('Clipboard indisponível');
      await win.navigator.clipboard.writeText(formatRelease(currentData));
      copyStatus.textContent='✅ Novidades copiadas.';
    }catch(_){copyStatus.textContent='⚠️ Seu navegador bloqueou a cópia. Consulte o histórico abaixo.';}
  });
  const list=el('div','neo1060-list');list.id='neo1060-list';panel.append(list);
  const info=el('p','neo1060-bottom','O histórico é informativo. Consultar esta seção não altera sua temporada ou seus retratos.');panel.append(info);
  wrapper.append(top,panel);more.prepend(wrapper);
  const moreNav=doc.querySelector('#neoMobileNav [data-neo-tab="more"],#neoMobileNav [data-tab="more"]');
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
return {SEEN_KEY,compare,validate,formatRelease,mount};
});