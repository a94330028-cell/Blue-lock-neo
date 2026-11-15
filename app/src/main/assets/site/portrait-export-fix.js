/* Blue Lock NEO — exportação confiável de retratos. Lê somente retratos salvos neste app. */
(() => {
  'use strict';
  const DB = 'neo-portrait-library-v1';
  const MAX_ANDROID_TEXT = 28 * 1024 * 1024; // Compatível com a ponte Android das versões antigas.
  let busy = false;
  const by = id => document.getElementById(id);

  function notice(message, kind='info') {
    const node=by('portraitNotice');
    if(node) { node.textContent=message; node.dataset.exportStatus=kind; }
    window.NeoMobile?.toast?.(message);
  }
  function openDatabase() {
    return new Promise((resolve,reject) => {
      if(!window.indexedDB) return reject(new Error('O armazenamento de fotos do aplicativo está indisponível.'));
      const req=indexedDB.open(DB, 1);
      req.onupgradeneeded=() => {
        const db=req.result;
        if(!db.objectStoreNames.contains('images'))db.createObjectStore('images', {keyPath:'key'});
        if(!db.objectStoreNames.contains('choices'))db.createObjectStore('choices',{keyPath:'name'});
      };
      req.onsuccess=() => resolve(req.result);
      req.onerror=() => reject(req.error||new Error('Não foi possível abrir os retratos.'));
      req.onblocked=() => reject(new Error('O banco de imagens está ocupado. Feche outras janelas do jogo.'));
    });
  }
  async function readData() {
    if(window.NeoPortraitsReady) await window.NeoPortraitsReady;
    const db=await openDatabase();
    try {
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(['images','choices'],'readonly');
        const imageReq=tx.objectStore('images').getAll();
        const choiceReq=tx.objectStore('choices').getAll();
        tx.oncomplete=()=>resolve({images:imageReq.result||[],choices:choiceReq.result||[]});
        tx.onerror=()=>reject(tx.error||new Error('Não foi possível consultar o banco de fotos.'));
        tx.onabort=()=>reject(tx.error||new Error('Leitura das fotos interrompida.'));
      });
    } finally {db.close();}
  }
  function asDataUri(blob) {
    return new Promise((resolve,reject)=>{
      if(!(blob instanceof Blob))return reject(new Error('Uma imagem salva não é um arquivo válido.'));
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=()=>reject(reader.error||new Error('Não foi possível ler uma imagem.'));
      reader.readAsDataURL(blob);
    });
  }
  function nativeExporterAvailable() {
    return typeof window.BlueLockAndroid?.saveJson==='function';
  }
  function downloadInBrowser(text, name){
    const blob=new Blob([text],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),20000);
  }
  async function exportPhotos() {
    const button=by('exportPortraits');
    if(busy)return;
    busy=true;if(button)button.disabled=true;
    try{
      notice('⏳ Preparando backup das fotos salvas no aplicativo...');
      const records=await readData();
      const selected=records.images.filter(x=>
        x && ['manga','custom'].includes(x.type) && typeof x.name==='string' && x.blob instanceof Blob
      );
      if(!selected.length) throw new Error('Não há retratos enviados salvos neste aplicativo. Fotos da internet não entram neste backup.');
      const images=[];
      for(let i=0;i<selected.length;i++){
        const rec=selected[i];
        const data=await asDataUri(rec.blob);
        images.push({name:rec.name,type:rec.type,data});
        if((i+1)%10===0)notice('⏳ Preparando '+(i+1)+' de '+selected.length+' imagens...');
      }
      const payload=JSON.stringify({
        app:'blue-lock-neo-portraits',version:1,exportedAt:new Date().toISOString(),
        images,choices:records.choices
      });
      const name='blue-lock-retratos-backup.json';
      if(nativeExporterAvailable()) {
        if(payload.length>MAX_ANDROID_TEXT)throw new Error('Backup maior que 28 MB. É necessário exportar em partes menores; não desinstale o aplicativo.');
        // No APK, apenas o seletor nativo pode gravar o arquivo. O download blob: é ignorado pelo WebView.
        const accepted=window.BlueLockAndroid.saveJson(name,payload);
        if(accepted===false)throw new Error('O Android não conseguiu preparar a exportação.');
        notice('📁 Escolha a pasta Downloads na tela do Android e toque em SALVAR. Seu arquivo ainda não foi salvo.', 'pending');
        setTimeout(()=>{
          if(by('portraitNotice')?.dataset.exportStatus==='pending')
            notice('⚠️ Não apareceu a janela do Android? Use a opção Atualizar do aplicativo; não desinstale nem limpe os dados.', 'warning');
        },12000);
      } else if(typeof window.showSaveFilePicker==='function'){
        // Browser padrão: salva com confirmação real.
        const handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:'Backup JSON',accept:{'application/json':['.json']}}]});
        const writable=await handle.createWritable();
        await writable.write(payload);await writable.close();
        notice('✅ Backup salvo: '+name,'success');
      }else{
        downloadInBrowser(payload,name);
        notice('⬇️ Download solicitado. Procure o arquivo JSON em Downloads.','pending');
      }
    }catch(error){
      if(error?.name==='AbortError')notice('Exportação cancelada; suas fotos continuam no aplicativo.','warning');
      else notice('⚠️ '+(error?.message||'Falha ao exportar imagens.'),'error');
    }finally{
      busy=false;if(button)button.disabled=false;
    }
  }
  // Captura ANTES do botão antigo: evita que o download blob: falho seja executado.
  document.addEventListener('click', event=>{
    const target=event.target?.closest?.('#exportPortraits');
    if(!target)return;
    event.preventDefault();event.stopImmediatePropagation();
    exportPhotos();
  },true);
  window.addEventListener('neo-backup-result',event=>{
    const detail=event.detail||{};
    notice((detail.success?'✅ ':'⚠️ ')+(detail.message||'Resultado do backup indisponível.'),
      detail.success?'success':'warning');
  });
})();