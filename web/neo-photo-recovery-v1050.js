/* NEO 10.5 — alternate photo import when an older Android file picker cannot read content://.
 * Never deletes previous photo: validates and stores the new image before showing success. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root?.document){root.NeoPhotoRecovery1050=api;api.mount(root);}})(typeof window!=='undefined'?window:null,function(){
'use strict';
function findCard(node){return node?.closest?.('.portrait-card')||null;}
function label(name,error){return String(error?.message||error||'Erro desconhecido').slice(0,150)+' · '+name;}
function mount(win){
 const doc=win.document,$=id=>doc.getElementById(id);
 let pending=null;
 const picker=doc.createElement('input');picker.type='file';picker.accept='image/jpeg,image/png,image/webp,image/*';
 picker.id='neo1050-alternative-file';picker.hidden=true;picker.style.display='none';
 function status(message,bad=false){
  let notice=$('neo1050-photo-status');
  if(!notice){notice=doc.createElement('div');notice.id='neo1050-photo-status';notice.setAttribute('role','status');notice.className='neo1050-photo-status';
   const place=$('portraitNotice')||$('portraitGallery')||doc.body;place.insertAdjacentElement('afterend',notice);}
  notice.textContent=(bad?'⚠️ ':'✅ ')+message;
  notice.dataset.bad=bad?'1':'0';
  const current=$('portraitNotice');if(current)current.textContent=notice.textContent;
 }
 async function store(name,blob){
  if(!name||!(blob instanceof Blob)||blob.size===0)throw Error('A imagem escolhida está vazia.');
  if(blob.size>15*1024*1024)throw Error('Imagem maior que 15 MB. Reduza o arquivo.');
  if(!win.NeoPortraitManager?.saveFile)throw Error('Biblioteca de retratos indisponível.');
  await win.NeoPortraitManager.saveFile(name,blob);
  win.dispatchEvent(new Event('neo:portraits-changed'));
  status('Foto de '+name+' salva. Confira a galeria e o Melhor XI.');
 }
 function offer(){
  const gallery=$('portraitGallery');if(!gallery)return;
  for(const card of gallery.querySelectorAll('.portrait-card:not([data-recovery-ready])')){
   card.dataset.recoveryReady='1';
   const name=card.dataset.galleryPlayer;
   if(!name)continue;
   const actions=card.querySelector('.neo-extra-content')||card.querySelector('.portrait-actions');
   if(!actions)continue;
   const holder=doc.createElement('div');holder.className='neo1050-recovery-actions';
   const select=doc.createElement('button');select.type='button';select.className='button ghost';
   select.dataset.neo1050Files=name;select.textContent='📁 Tentar pelo Arquivos';
   const paste=doc.createElement('button');paste.type='button';paste.className='button ghost';
   paste.dataset.neo1050Paste=name;paste.textContent='📋 Colar imagem copiada';
   holder.append(select,paste);actions.append(holder);
  }
 }
 picker.addEventListener('change',async()=>{
  const blob=picker.files?.[0],name=pending;pending=null;picker.value='';
  if(!blob||!name)return;
  try{status('Importando imagem para '+name+'...');await store(name,blob);}
  catch(error){status(label(name,error),true);}
 });
 async function paste(name){
  try{
   if(!win.navigator?.clipboard?.read)throw Error('Este Android não permite ler imagens copiadas. Use Arquivos ou o seletor nativo.');
   const items=await win.navigator.clipboard.read();
   for(const item of items)for(const type of item.types||[]){
    if(!['image/png','image/jpeg','image/webp'].includes(type))continue;
    const blob=await item.getType(type);await store(name,blob);return;
   }
   throw Error('A área de transferência não contém uma foto. Copie uma imagem primeiro.');
  }catch(error){status(label(name,error),true);}
 }
 doc.addEventListener('click',event=>{
  const file=event.target.closest('[data-neo1050-files]');
  if(file){pending=decodeURIComponent(file.dataset.neo1050Files);picker.value='';picker.click();return;}
  const clip=event.target.closest('[data-neo1050-paste]');
  if(clip){const name=decodeURIComponent(clip.dataset.neo1050Paste);paste(name);}
 });
 function boot(){
  doc.body.append(picker);offer();
  const gallery=$('portraitGallery');if(gallery){
   let queued=false;
   new MutationObserver(()=>{if(queued)return;queued=true;win.requestAnimationFrame(()=>{queued=false;offer();});}).observe(gallery,{childList:true,subtree:true});
  }
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
return {mount,label};
});