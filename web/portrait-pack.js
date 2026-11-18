/* Blue Lock NEO 10.6.41: 131 retratos offline. Preserva escolhas e fotos do jogador. */
(() => {
  'use strict';
  const DB_NAME = 'neo-portrait-library-v1';
  const BASE = 'assets/imported-portraits/';
  const STATUS_KEY = 'neo-builtin-portraits-10633';

  function show(text) {
    const el = document.getElementById('portraitNotice');
    if (el && !/Falha|Erro/i.test(el.textContent || '')) el.textContent = text;
    window.NeoMobile?.toast?.(text);
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', {keyPath:'key'});
        if (!db.objectStoreNames.contains('choices')) db.createObjectStore('choices', {keyPath:'name'});
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || Error('Falha ao abrir imagens'));
      request.onblocked = () => reject(Error('Banco de imagens ocupado'));
    });
  }

  function readSaved(db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['images', 'choices'], 'readonly');
      const a = tx.objectStore('images').getAll();
      const b = tx.objectStore('choices').getAll();
      tx.oncomplete = () => resolve({images:a.result || [], choices:b.result || []});
      tx.onerror = () => reject(tx.error || Error('Leitura interrompida'));
    });
  }

  function insert(db, list, existingChoices) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['images', 'choices'], 'readwrite');
      const photos = tx.objectStore('images');
      const choices = tx.objectStore('choices');
      for (const x of list) {
        photos.put({key:'custom|' + x.name, name:x.name, type:'custom', blob:x.blob, updatedAt:Date.now()});
        if (!existingChoices.has(x.name)) choices.put({name:x.name, style:'custom'});
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || Error('Falha ao salvar retratos'));
      tx.onabort = () => reject(tx.error || Error('Salvamento interrompido'));
    });
  }

  async function matchesPreviousBundledPhoto(record, previousSha256) {
    if (!/^[0-9a-f]{64}$/.test(previousSha256 || '') || record?.type !== 'custom'
        || !(record.blob instanceof Blob) || !globalThis.crypto?.subtle) return false;
    try {
      const buffer = await record.blob.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      return actual === previousSha256;
    } catch (_) { return false; } // No crypto on old WebViews: keep the user's existing photo.
  }

  async function installOfflinePhotos() {
    if (!window.indexedDB) return;
    let db;
    try {
      if (window.NeoPortraitsReady) await window.NeoPortraitsReady;
      const response = await fetch(BASE + 'index.json', {cache:'no-store'});
      if (!response.ok) return; // Alguns builds web antigos não possuem o pacote.
      const manifest = await response.json();
      if (manifest?.app !== 'blue-lock-neo-portraits-offline' || !Array.isArray(manifest.images)) return;
      db = await openDb();
      const existing = await readSaved(db);
      const photosByName = new Map(existing.images.filter(x => x?.name).map(x => [x.name, x]));
      const chosen = new Set(existing.choices.map(x => x.name).filter(Boolean));
      const missing = [];
      for (const item of manifest.images) {
        if (!item?.name || !item?.file) continue;
        const current = photosByName.get(item.name);
        // A new edition may replace only pixels identical to its previous
        // shipped pack. Never replace a player's independently edited image.
        if (!current || await matchesPreviousBundledPhoto(current, item.previousSha256)) missing.push(item);
      }
      if (!missing.length) {
        try {localStorage.setItem(STATUS_KEY, 'ok');} catch (_) {}
        return;
      }
      let done=0;
      // Não ultrapassar a memória de celulares mais simples. Tudo é processado em lotes.
      for (let i = 0; i < missing.length; i += 8) {
        const current = missing.slice(i, i + 8);
        const loaded = await Promise.all(current.map(async item => {
          if (!/^[a-z0-9-]+\.jpe?g$/.test(item.file)) throw Error('Arquivo de retrato inválido');
          const img = await fetch(BASE + item.file);
          if (!img.ok) throw Error('Não foi possível carregar '+item.name);
          const blob = await img.blob();
          if (!blob.type.startsWith('image/') || !blob.size || blob.size > 2000000)
            throw Error('Retrato inválido para '+item.name);
          return {name:item.name,blob};
        }));
        await insert(db,loaded,chosen);
        done += loaded.length;
      }
      try {localStorage.setItem(STATUS_KEY, 'ok');} catch (_) {}
      show('✅ '+done+' retratos corretos incluídos no jogo offline! As imagens pessoais foram preservadas.');
      // O simulador lê os retratos ao iniciar, então carregar novamente mostra os arquivos salvos.
      if (done > 0) window.location.reload();
    } catch(error) {
      console.warn('Blue Lock: instalação do pacote de retratos incompleta', error);
      const msg = '⚠️ Não foi possível instalar todos os retratos offline. Suas fotos atuais continuam salvas.';
      const el = document.getElementById('portraitNotice');
      if (el) el.textContent = msg;
    } finally {
      if(db) db.close();
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installOfflinePhotos, {once:true});
  else installOfflinePhotos();
})();
