/* Blue Lock NEO Mobile Edition — progressive enhancement, preserves the original simulator. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const mobile=()=>window.matchMedia('(max-width:700px)').matches;
// Same six destinations on Android and desktop. Legacy pages live in Mais.
const tabNames={
 match:['🎮','Jogar'],league:['🏆','Liga'],records:['📜','Recordes'],
 ranking:['👑','Ranking'],squads:['👥','Jogadores'],more:['⚙️','Mais']
};
function toast(message){
 let el=$('neo-mobile-toast');
 if(!el){el=document.createElement('div');el.id='neo-mobile-toast';el.setAttribute('role','status');Object.assign(el.style,{position:'fixed',bottom:'calc(85px + env(safe-area-inset-bottom,0px))',left:'16px',right:'16px',zIndex:'250',maxWidth:'540px',margin:'auto',padding:'13px 15px',borderRadius:'12px',background:'#163855',border:'1px solid #427da7',boxShadow:'0 10px 26px #0009',color:'#eef9ff',fontSize:'12px',fontWeight:'750'});document.body.appendChild(el);}
 el.textContent=message;el.hidden=false;clearTimeout(el._neoHide);el._neoHide=setTimeout(()=>{el.hidden=true;},5200);
}
function makeNav(){
 if($('neoMobileNav'))return;
 const bar=document.createElement('nav');bar.id='neoMobileNav';bar.className='neo-mobile-bottom';bar.setAttribute('aria-label','Navegação principal — Blue Lock NEO');
 const ids=['match','league','records','ranking','squads','more'];
 const buttons=new Map();
 for(const id of ids){
  const b=document.createElement('button');b.type='button';b.dataset.neoTab=id;
  b.innerHTML='<span aria-hidden="true">'+tabNames[id][0]+'</span><b>'+tabNames[id][1]+'</b>';
  b.addEventListener('click',()=>openTab(id));bar.append(b);buttons.set(id,b);
 }
 document.body.append(bar);
 // Use original navigation handlers: they pause matches and render each screen.
 function openTab(id){
  const source=document.querySelector('.nav button[data-tab="'+id+'"]');
  if(!source)return;
  source.click();sync();window.scrollTo({top:0,behavior:'instant'});
 }
 function sync(){
  const active=document.querySelector('.nav button[data-tab].active')?.dataset.tab||'match';
  const selected=['stats','arsenal','gallery'].includes(active)?'more':active;
  for(const [id,b] of buttons){
   b.classList.toggle('active',id===selected);
   if(id===selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  }
 }
 const nav=document.querySelector('.nav');
 if(nav)new MutationObserver(sync).observe(nav,{attributes:true,attributeFilter:['class'],subtree:true});
 sync();
 window.NeoMobile={openTab,toast,sync};
}
function neutralAvatar(name){
 const initials=(name||'?').trim().split(/\s+/).slice(0,2).map(s=>s.slice(0,1).toUpperCase()).join('');
 const safe=initials.replace(/[^A-ZÀ-Ú0-9]/g,'')||'?';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 360"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#0d2b4e"/><stop offset="1" stop-color="#0c1728"/></linearGradient></defs><rect width="320" height="360" fill="url(#g)"/><path d="M0 290L320 80M0 345L320 135" stroke="#168bda" opacity=".16" stroke-width="14"/><circle cx="160" cy="154" r="62" fill="#234c77"/><path d="M52 315c5-83 60-111 108-111s103 28 108 111" fill="#234c77"/><text x="160" y="340" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="bold" fill="#bde9ff">'+safe+'</text></svg>';
 return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
function beautifyCards(){
 const gallery=$('portraitGallery');if(!gallery)return;
 for(const card of gallery.querySelectorAll('.portrait-card:not(.neo-card-ready)')){
  const actions=card.querySelector('.portrait-actions');if(!actions)continue;
  const encoded=card.dataset.galleryPlayer||'';
  let name='';try{name=decodeURIComponent(encoded);}catch(_){name=encoded;}
  const details=document.createElement('details');details.className='neo-extra-options';
  const summary=document.createElement('summary');summary.textContent='Outras opções de retrato';
  const extra=document.createElement('div');extra.className='neo-extra-content';
  while(actions.firstChild)extra.appendChild(actions.firstChild);
  details.append(summary,extra);
  const primary=document.createElement('button');primary.type='button';primary.className='button primary neo-main-action';primary.textContent='📷 Trocar imagem de '+name.split(' ')[0];primary.dataset.portraitEdit=encoded;
  actions.append(primary,details);card.classList.add('neo-card-ready');
  const badge=card.querySelector('.gallery-tag');
  const photo=card.querySelector('img.portrait-card-photo');
  if(photo&&badge){
   const makeNeutral=()=>{
    const status=badge.textContent.toLowerCase();
    if((status.includes('reserva')||status.includes('indisponível')||status.includes('genérica'))&&photo.dataset.photoLoaded!=='1'){
     const placeholder=neutralAvatar(name);if(photo.src!==placeholder)photo.src=placeholder;
    }
   };
   makeNeutral();
   // The original remote photo loader remains responsible for switching to a valid image.
   const watcher=new MutationObserver(makeNeutral);watcher.observe(badge,{childList:true,characterData:true,subtree:true});
  }
 }
 updateImageSummary();
}
function updateImageSummary(){
 const box=$('neoImageSummary'),gallery=$('portraitGallery');if(!box||!gallery)return;
 const cards=[...gallery.querySelectorAll('.portrait-card')];
 const offline=cards.filter(card=>/reserva|indisponível|genérica/i.test(card.querySelector('.gallery-tag')?.textContent||'')).length;
 const custom=cards.filter(card=>/enviada|personalizada/i.test(card.querySelector('.gallery-tag')?.textContent||'')).length;
 box.innerHTML='<span>🖼️ <b>'+cards.length+'</b> exibidos</span> <span>✅ <b>'+custom+'</b> importados</span> <span>🔎 <b>'+offline+'</b> aguardam retrato</span>';
}
function setupGalleryTools(){
 const tools=document.querySelector('.manga-gallery-tools');
 if(tools&&!tools.classList.contains('neo-condensed')){
  tools.classList.add('neo-condensed');
  const details=document.createElement('details');details.className='neo-extra-options neo-tools-more';
  const summary=document.createElement('summary');summary.textContent='Gerenciar fontes, backups e outros modos';
  const extra=document.createElement('div');extra.className='neo-extra-content';
  const keep=new Set(['mangaBatchImport','portraitRepair']);
  for(const child of [...tools.children])if(!keep.has(child.id)&&child.tagName!=='DETAILS')extra.append(child);
  details.append(summary,extra);tools.append(details);
 }
 const filters=document.querySelector('.gallery-tools');
 if(filters&&!$('neoImageSummary')){
  const p=document.createElement('div');p.className='neo-image-status';p.id='neoImageSummary';p.setAttribute('role','status');
  const list=filters.querySelector('.gallery-meta');if(list)list.insertAdjacentElement('afterend',p);else filters.append(p);
 }
 if(tools&&!$('neoZipButton')){
  const button=document.createElement('button');button.type='button';button.id='neoZipButton';button.className='button ghost';button.textContent='📦 Importar imagens ZIP';tools.insertBefore(button,tools.querySelector('details'));
  const chooser=document.createElement('input');chooser.type='file';chooser.accept='.zip,application/zip,application/x-zip-compressed';chooser.style.display='none';chooser.id='neoZipInput';document.body.append(chooser);
  button.addEventListener('click',()=>{chooser.value='';chooser.click();});
  chooser.addEventListener('change',async()=>{
   const file=chooser.files&&chooser.files[0];if(!file)return;
   button.disabled=true;button.textContent='⏳ Lendo ZIP...';
   try{
    const images=await extractZipImages(file);
    if(!images.length)throw Error('Nenhuma imagem PNG, JPG ou WebP encontrada no ZIP.');
    const target=[...document.querySelectorAll('input[type="file"][multiple]')].find(x=>(x.accept||'').includes('image/'));
    if(!target||typeof DataTransfer==='undefined')throw Error('Este navegador não permite enviar várias imagens. Extraia o ZIP e selecione as fotos diretamente.');
    const transfer=new DataTransfer();images.forEach(f=>transfer.items.add(f));target.files=transfer.files;
    target.dispatchEvent(new Event('change',{bubbles:true}));
    toast('📦 '+images.length+' imagens enviadas ao importador. Veja o resultado na galeria.');
   }catch(e){toast('⚠️ '+String(e?.message||'Falha ao abrir ZIP'));}
   finally{button.disabled=false;button.textContent='📦 Importar imagens ZIP';chooser.value='';}
  });
 }
 const help=document.querySelector('.manga-help');
 if(help&&help.parentElement&&!$('neoImportHelp')){
  const notice=document.createElement('p');notice.className='neo-import-help';notice.id='neoImportHelp';
  notice.textContent='Fotos online podem falhar no Android. Selecione JPG, PNG ou WebP do celular, ou importe um ZIP com os nomes dos jogadores (ex.: Yoichi Isagi.png). Nenhuma foto pessoal será enviada a um servidor.';
  help.insertAdjacentElement('afterend',notice);
 }
}
async function extractZipImages(file){
 if(file.size>32*1024*1024)throw Error('ZIP maior que 32 MB.');
 const data=new Uint8Array(await file.arrayBuffer()),view=new DataView(data.buffer);
 const u16=o=>view.getUint16(o,true),u32=o=>view.getUint32(o,true);
 let end=-1;for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--)if(u32(i)===0x06054b50){end=i;break;}
 if(end<0)throw Error('ZIP inválido ou incompleto.');
 const total=u16(end+10),start=u32(end+16);if(total>400)throw Error('ZIP com arquivos demais.');
 let position=start,expanded=0;const images=[];
 const decoder=new TextDecoder('utf-8');
 for(let i=0;i<total;i++){
  if(position+46>data.length||u32(position)!==0x02014b50)throw Error('Índice ZIP corrompido.');
  const method=u16(position+10),compressed=u32(position+20),size=u32(position+24);
  const nameLen=u16(position+28),extra=u16(position+30),comment=u16(position+32),local=u32(position+42);
  const name=decoder.decode(data.subarray(position+46,position+46+nameLen));
  position+=46+nameLen+extra+comment;
  if(!/\.(png|jpe?g|webp)$/i.test(name)||name.includes('..')||name.startsWith('/'))continue;
  if(size>15*1024*1024||size<100)continue;
  expanded+=size;if(expanded>60*1024*1024)throw Error('ZIP contém imagens muito grandes.');
  if(local+30>data.length||u32(local)!==0x04034b50)continue;
  const offset=local+30+u16(local+26)+u16(local+28);
  if(offset+compressed>data.length)continue;
  const bytes=data.slice(offset,offset+compressed);
  let raw;
  if(method===0)raw=bytes;
  else if(method===8&&typeof DecompressionStream!=='undefined'){
   try{raw=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());}
   catch(_){throw Error('Este Android não consegue descompactar esse ZIP. Extraia primeiro no gerenciador de arquivos.');}
  }else throw Error('Compressão ZIP não compatível. Extraia o ZIP e importe as imagens diretamente.');
  if(raw.length!==size)continue;
  const ext=name.split('.').pop().toLowerCase();
  const mime=ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg';
  const simple=name.split('/').pop();
  images.push(new File([raw],simple,{type:mime}));
  if(images.length>=120)break;
 }
 return images;
}
function boot(){
 makeNav();setupGalleryTools();beautifyCards();
 const gallery=$('portraitGallery');
 if(gallery)new MutationObserver(beautifyCards).observe(gallery,{childList:true});
 // Use the existing import/storage system. The enhancements only improve its navigation.
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
