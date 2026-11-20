'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('/tmp/neo-ui-validate/node_modules/playwright-core');
const root=path.resolve(__dirname,'../web');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
 '.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 let file;
 try{file=path.resolve(root,'.'+decodeURIComponent(url.pathname));}catch(_){res.writeHead(400).end();return;}
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
 if(file===root)file=path.join(root,'index.html');
 fs.readFile(file,(err,data)=>err?res.writeHead(404).end():res.writeHead(200,{
  'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'
 }).end(data));
});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const chrome=['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
  assert.ok(chrome,'Chromium obrigatório para validar migração real');
  browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  const warnings=[];
  page.on('console',message=>{if(['warning','error'].includes(message.type()))warnings.push(message.text().slice(0,250));});
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.NeoCareerBridge,{timeout:30000});
  const original=await page.evaluate(()=>{
   const s=window.NeoCareerBridge.getSeason(),f=s.rounds[0].games[0];
   f.result=[1,0];f.details={players:[
    {name:'Teste Histórico',side:0,role:'CA',rating:8.2,goals:1,assists:0},
    {name:'Adversário Histórico',side:1,role:'GOL',rating:6.1,goals:0,assists:0}
   ],masterEntries:[],goalRecords:[{side:0,scorer:'Teste Histórico',assister:null,
    minute:32,score:[1,0]}]};
   s.scorers={'Contador Antigo|bm':25};s.assists={'Incorreto|bm':4};s.goalLog=[];
   s.career={players:{},bidVersion:3,masterBidVersion:1,masterBids:{},history:[]};
   const serialized=JSON.stringify(s);
   localStorage.setItem('neo-season-v2',serialized);
   return serialized;
  });
  await page.reload({waitUntil:'domcontentloaded'});
  try{
   await page.waitForFunction(()=>{
    const s=JSON.parse(localStorage.getItem('neo-season-v2')||'null');
    const home=s?.rounds?.[0]?.games?.[0]?.home;
    return s?.career?.masterBidVersion===2&&s.scorers?.['Teste Histórico|'+home]===1;
   },null,{timeout:15000});
  }catch(error){
   const debug=await page.evaluate(async()=>{
    const s=JSON.parse(localStorage.getItem('neo-season-v2')||'null');
    const runtime=window.NeoCareerBridge?.getSeason?.();
    const backups=await new Promise(resolve=>{
     const req=indexedDB.open('neo-season-archive-v1',1);
     req.onerror=()=>resolve(['db error']);
     req.onsuccess=()=>{
      const db=req.result,tx=db.transaction('seasons','readonly'),all=tx.objectStore('seasons').getAllKeys();
      all.onsuccess=()=>{db.close();resolve(all.result);};all.onerror=()=>resolve(['keys error']);
     };
    });
    return {storedVersion:s?.career?.masterBidVersion,storedScorers:s?.scorers,
     runtimeVersion:runtime?.career?.masterBidVersion,loadedGame:s?.rounds?.[0]?.games?.[0],
     backups,playing:document.getElementById('play')?.textContent};
   });
   console.error('FOUNDATION MIGRATION DEBUG:',JSON.stringify({debug,warnings}));
   throw error;
  }
  const result=await page.evaluate(async()=>{
   const saved=JSON.parse(localStorage.getItem('neo-season-v2'));
   const db=await new Promise((resolve,reject)=>{
    const req=indexedDB.open('neo-season-archive-v1',1);
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });
   const all=await new Promise((resolve,reject)=>{
    const req=db.transaction('seasons','readonly').objectStore('seasons').getAll();
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });db.close();
   return {saved,backup:all.find(x=>x.key.startsWith('foundation-before-repair-'))?.data};
  });
  assert.equal(result.backup,original,'the exact original season was archived before repair');
  assert.deepEqual(result.saved.rounds[0].games[0].result,[1,0]);
  assert.equal(result.saved.scorers['Teste Histórico|'+result.saved.rounds[0].games[0].home],1);
  assert.equal(result.saved.assists['Incorreto|bm'],undefined);
  assert.equal(result.saved.goalLog.length,1);
  // Android web updates use HOME + '?web=version', retaining the exact same
  // HTTPS WebView origin. Reproduce that navigation on an isolated browser
  // origin and verify that BOTH stores (league and user-uploaded portraits)
  // survive without the migration running again or resetting player choices.
  const beforeUpdate=await page.evaluate(async()=>{
   await window.NeoPortraitsReady;
   const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
   const context=canvas.getContext('2d');
   context.fillStyle='#00aacc';context.fillRect(0,0,96,96);
   context.fillStyle='#fcba03';context.fillRect(12,12,72,72);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   assertSourceImage(blob);
   await window.NeoPortraitManager.saveFile('Retrato de Teste NEO',
    new File([blob],'retrato-qa.png',{type:'image/png'}));
   const url=window.NeoPortraitManager.current('Retrato de Teste NEO');
   if(!url.startsWith('blob:'))throw Error('Retrato não foi salvo no IndexedDB');
   const image=await (await fetch(url)).arrayBuffer();
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',image)))
    .map(n=>n.toString(16).padStart(2,'0')).join('');
   localStorage.setItem('neo-foundation-update-canary','preservado');
   return {season:localStorage.getItem('neo-season-v2'),digest,bytes:image.byteLength};
   function assertSourceImage(input){if(!input||!input.size)throw Error('Canvas de teste inválido');}
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/?web=10.6.45',
   {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.NeoPortraitManager&&!!window.NeoCareerBridge,{timeout:30000});
  const afterUpdate=await page.evaluate(async()=>{
   await window.NeoPortraitsReady;
   const url=window.NeoPortraitManager.current('Retrato de Teste NEO');
   if(!url.startsWith('blob:'))throw Error('Retrato perdeu a seleção após atualização');
   const image=await (await fetch(url)).arrayBuffer();
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',image)))
    .map(n=>n.toString(16).padStart(2,'0')).join('');
   const record=await new Promise((resolve,reject)=>{
    const req=indexedDB.open('neo-portrait-library-v1',1);
    req.onerror=()=>reject(req.error);
    req.onsuccess=()=>{
     const db=req.result,tx=db.transaction('images','readonly');
     const get=tx.objectStore('images').get('custom|Retrato de Teste NEO');
     tx.oncomplete=()=>{resolve({bytes:get.result?.blob?.size||0});db.close();};
     tx.onerror=()=>{reject(tx.error);db.close();};
    };
   });
   return {season:localStorage.getItem('neo-season-v2'),
    canary:localStorage.getItem('neo-foundation-update-canary'),
    digest,bytes:image.byteLength,idbBytes:record.bytes};
  });
  assert.equal(afterUpdate.season,beforeUpdate.season,'official save survives a versioned URL reload');
  assert.equal(afterUpdate.canary,'preservado','WebView localStorage origin stays the same');
  assert.equal(afterUpdate.digest,beforeUpdate.digest,'custom portrait pixels survive web update');
  assert.equal(afterUpdate.bytes,beforeUpdate.bytes);
  assert.equal(afterUpdate.idbBytes,beforeUpdate.bytes,'photo remains in IndexedDB, not just memory');
  console.log('PASS NEO FOUNDATION browser: archived migration, same-origin web update, full save and portrait persistence');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});
