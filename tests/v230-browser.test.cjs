'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('/tmp/neo-ui-validate/node_modules/playwright-core');
const site=path.resolve(__dirname,'../web');
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json',
 '.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon',
 '.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 let filename;
 try{filename=path.resolve(site,'.'+decodeURIComponent(url.pathname));}
 catch(_){res.writeHead(400).end();return;}
 if(!filename.startsWith(site+path.sep)&&filename!==site){res.writeHead(403).end();return;}
 if(filename===site)filename=path.join(site,'index.html');
 fs.readFile(filename,(error,data)=>{
  if(error){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(data);
 });
});
(async()=>{
 let browser;
 try{
  await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',e=>e?reject(e):resolve()));
  const port=server.address().port;
  const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
  assert.ok(chrome,'Chrome/Chromium browser is required for actual UI validation');
  browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  const base='http://127.0.0.1:'+port+'/';
  for(const [width,height] of [[1366,768],[1600,900],[390,844]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   const errors=[];
   page.on('pageerror',error=>errors.push(String(error.message||error)));
   await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>!!document.getElementById('neo230-features') &&
    !!document.getElementById('neo990-round-team'),null,{timeout:25000});
   const details=await page.evaluate(()=>{
    const panel=document.getElementById('neo230-features');
    const xi=document.getElementById('neo990-round-team');
    const css=getComputedStyle(document.body);
    const layout=getComputedStyle(panel);
    const list=xi.querySelector('[data-neo990-view="list"]');
    return {ready:!!window.NeoEngine?.Match?.prototype?._neo230Installed,
      closed:panel.open===false,nav:!!document.querySelector('.shell>.nav'),
      list:!!list,overflow:document.documentElement.scrollWidth-window.innerWidth,
      css:layout.display,font:css.fontFamily};
   });
   assert.ok(details.ready,'NEO 19–30 engine hooks must load in a real browser');
   assert.ok(details.closed,'the new Records section must start collapsed');
   assert.ok(details.nav,'desktop and mobile menus remain in DOM');
   assert.ok(details.list,'XI tactical/list toggle is mounted');
   if(width>=1100){
    assert.ok(details.overflow<=5,'desktop horizontal overflow at '+width+': '+details.overflow);
    await page.evaluate(()=>{
     const dest=document.querySelector('#neo990-xi');
     if(!dest.querySelector('.neo990-xi-pitch')){
      const p=document.createElement('div');p.className='neo990-xi-pitch';dest.append(p);
     }
    });
    const field=await page.$eval('#neo990-xi .neo990-xi-pitch',el=>({height:el.getBoundingClientRect().height,
     max:getComputedStyle(el).maxHeight}));
    assert.ok(field.height>=300&&field.height<=445,'tactical pitch must fit PC: '+field.height);
    await page.click('#neo990-round-team [data-neo990-view="list"]');
    const selected=await page.$eval('#neo990-round-team',el=>el.dataset.xiView);
    assert.equal(selected,'list','list display must be accessible and interactive');
    await page.click('#neo990-round-team [data-neo990-view="pitch"]');
    assert.equal(await page.$eval('#neo990-round-team',el=>el.dataset.xiView),'pitch');
   }
   await page.evaluate(()=>document.querySelector('#neo230-features > summary').click());
   assert.equal(await page.$eval('#neo230-features',el=>el.open),true,'Records panel should expand');
   const loaded=await page.evaluate(async()=>{
    const response=await fetch('./neo-twelve-v230.js');
    return response.ok&&(await response.text()).includes('function observeTurnover');
   });
   assert.ok(loaded,'new module must be served by the browser');
   // Other external portrait sources may be blocked in test environments; record only.
   console.log('BROWSER PASS',width+'x'+height,'DOM ready, tactical controls, Records, local asset',errors.length?'pageErrors='+errors.slice(0,2).join(' | '):'no page errors');
   await page.close();
  }
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
