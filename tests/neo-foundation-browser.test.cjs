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
  await page.waitForFunction(()=>{
   const s=JSON.parse(localStorage.getItem('neo-season-v2')||'null');
   const home=s?.rounds?.[0]?.games?.[0]?.home;
   return s?.career?.masterBidVersion===2&&s.scorers?.['Teste Histórico|'+home]===1;
  },null,{timeout:35000});
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
  console.log('PASS NEO FOUNDATION browser: verified IndexedDB backup precedes factual migration');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});
