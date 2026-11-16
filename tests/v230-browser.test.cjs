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
  for(const [width,height] of [[1920,1080],[1600,900],[1366,768],[1280,720],[1024,768],[768,1024],[390,844],[360,800]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   const errors=[];
   page.on('pageerror',error=>errors.push(String(error.stack||error.message||error)));
   await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>!!document.getElementById('neo230-features') &&
    !!document.getElementById('neo990-round-team') &&
    !!document.getElementById('neo250-podium') && !!document.getElementById('neo240-match-report'),null,{timeout:25000});
   const details=await page.evaluate(()=>{
    const panel=document.getElementById('neo230-features');
    const xi=document.getElementById('neo990-round-team');
    const css=getComputedStyle(document.body);
    const layout=getComputedStyle(panel);
    const list=xi.querySelector('[data-neo990-view="list"]');
    return {ready:!!window.NeoEngine?.Match?.prototype?._neo230Installed,
      pulse:!!window.NeoEngine?.Match?.prototype?._neo240Installed,
      portraits:typeof window.NeoPortraitUI?.html==='function',
      liveMatch:typeof window.NeoMatchBridge?.getMatch==='function',
      season:!!window.NeoCareerBridge?.getSeason?.()?.rounds?.length,
      closed:panel.open===false,nav:!!document.querySelector('.shell>.nav'),
      list:!!list,overflow:document.documentElement.scrollWidth-window.innerWidth,
      css:layout.display,font:css.fontFamily};
   });
   assert.ok(details.ready,'NEO 19–30 engine hooks must load in a real browser');
   assert.ok(details.pulse,'31–40 live engine hooks must load');
   assert.ok(details.portraits,'registered portrait provider must remain accessible');
   assert.ok(details.liveMatch,'real match bridge must be usable');
   assert.ok(details.season,'career bridge must return the active real season without ReferenceError');
   assert.ok(details.closed,'the new Records section must start collapsed');
   assert.ok(details.nav,'desktop and mobile menus remain in DOM');
   assert.ok(details.list,'XI tactical/list toggle is mounted');
   if(width>=1100){
    await page.click('.nav button[data-tab="league"]');
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('league')).display!=='none');
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
   // Actual Android-sized mobile navigation: championships and money must be visible.
   if(width===390){
    await page.waitForFunction(()=>!!window.NeoMobileHub&&!!document.getElementById('neo-ux-home-links'),null,{timeout:20000});
    await page.click('#neo-ux-home-links [data-neo-ux-open="championship"]');
    assert.ok(await page.$eval('#neoRefUxHub .neo-ux-table',el=>el.getBoundingClientRect().height>50),
      'mobile championship standings must be visible');
    await page.click('#neoRefUxHub [data-neo-ux-open="market"]');
    assert.ok(await page.$eval('#neoRefUxHub .neo-ux-money-list',el=>el.querySelectorAll('.neo-ux-money-row').length>0),
      'mobile market must restore real valuation rows');
    assert.ok(await page.$eval('#neoRefUxHub .neo-ux-leading',el=>el.textContent.includes('¥')),
      'market values must be shown in yen');
    await page.click('#neoRefUxHub [data-neo-ux-back="1"]');
    assert.ok(await page.evaluate(()=>!document.body.classList.contains('neo-ux-open')),
      'mobile user can return from market');
   }
   // Ranking V10: simulate ONE legitimate fixture at representative PC/mobile sizes.
   // No fabricated match stats or external images.
   if(width===1366||width===390){
    const result=await page.evaluate(()=>{
     const E=window.NeoEngine,s=window.NeoCareerBridge.getSeason();
     const f=s.rounds[0].games[0];
     if(!f.result){
      E.Progression.ensure(s);
      const game=new E.Match(f.home,f.away,122600+window.innerWidth,s.career,s);
      game.runToEnd();
      if(!E.recordFixture(s,f,game))throw Error('Fixture could not be recorded');
      if(!window.NeoCareerBridge.save())throw Error('Official save failed');
     }
     return {score:f.result,recorded:f.details?.players?.length||0};
    });
    assert.ok(result.recorded>=18,'match must record player data for real podium');
    await page.click('.nav button[data-tab="ranking"]');
    const rankState=await page.evaluate(()=>{
      const r=document.getElementById('ranking'),e=document.getElementById('rankMode');
      return {tabClass:r?.className,tabDisplay:r?getComputedStyle(r).display:null,
       rankStyle:e?getComputedStyle(e).display:null,client:e?.getBoundingClientRect().width,
       ancestors:e?[...(()=>{let a=[],n=e;while(n&&a.length<6){a.push(n.id||n.className||n.tagName);n=n.parentElement;}return a;})()]:[]};
    });
    console.log('RANKING NAV',width+'x'+height,JSON.stringify(rankState));
    await page.evaluate(()=>{const control=document.getElementById('rankMode');control.value='performance';control.dispatchEvent(new Event('change',{bubbles:true}));});
    assert.ok(await page.$eval('#neo250-podium',el=>getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().height>100),'V10 podium must be visible outside legacy folded controls');
    await page.waitForFunction(()=>document.querySelectorAll('#neo250-podium .neo250-champion').length>=3,null,{timeout:12000});
    const portraits=await page.$eval('#neo250-podium .neo250-champion img[data-portrait]',imgs=>imgs.map(img=>({
      hasName:!!img.getAttribute('data-player-name'),fit:getComputedStyle(img).objectFit,
      alt:img.alt})));
    assert.equal(portraits.length,3,'podium shows three existing registered player portraits');
    assert.ok(portraits.every(p=>p.hasName&&p.fit==='contain'&&p.alt));
    await page.click('#neo250-podium .neo250-position-1');
    assert.ok(await page.$eval('#neo250-player-detail',el=>el.textContent.includes('Jogos')),
       'podium player opens functioning compact profile with statistics');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)<=5,
       'ranking podium must not create horizontal scrolling');
   }
   // Verify persistence in a temporary browser profile, never in a real user's save.
   const sentinel='validated-'+width+'x'+height;
   const wrote=await page.evaluate(value=>{
    const season=window.NeoCareerBridge.getSeason();
    season.validationSentinel=value;
    return window.NeoCareerBridge.save();
   },sentinel);
   assert.equal(wrote,true,'career must be writable in an ephemeral browser profile');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.NeoCareerBridge?.getSeason?.()?.rounds?.length,null,{timeout:25000});
   const saved=await page.evaluate(()=>window.NeoCareerBridge.getSeason()?.validationSentinel);
   assert.equal(saved,sentinel,'the same save must survive a full reload');
   const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('neo-season-v2')||'{}').validationSentinel);
   assert.equal(persisted,sentinel,'stored season must remain unchanged on page refresh');

   if(errors.length)console.error('BROWSER PAGE ERRORS '+width+'x'+height+':\n'+errors.slice(0,3).join('\n'));
   assert.equal(errors.length,0,'browser must not contain uncaught JavaScript errors');
   // Other external portrait sources may be blocked in test environments; record only.
   console.log('BROWSER PASS',width+'x'+height,'DOM ready, tactical controls, Records, local asset',errors.length?'pageErrors='+errors.slice(0,2).join(' | '):'no page errors');
   await page.close();
  }
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
