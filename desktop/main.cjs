'use strict';
const {app,BrowserWindow,dialog,shell}=require('electron');
const {autoUpdater}=require('electron-updater');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
let window,server;
const siteRoot=path.resolve(app.isPackaged?path.join(process.resourcesPath,'site'):path.join(__dirname,'../web'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.webmanifest':'application/manifest+json','.wasm':'application/wasm','.mp3':'audio/mpeg'};
function startLocalSite(){
 return new Promise((resolve,reject)=>{
  server=http.createServer((request,response)=>{
   try{
    const url=new URL(request.url,'http://localhost');
    if(!['GET','HEAD'].includes(request.method)){response.writeHead(405).end();return;}
    let relative=decodeURIComponent(url.pathname).replace(/^\/+/,'');
    if(!relative||relative.endsWith('/'))relative+='index.html';
    const file=path.resolve(siteRoot,relative);
    if(file!==siteRoot&&!file.startsWith(siteRoot+path.sep)){response.writeHead(403).end();return;}
    fs.stat(file,(error,stat)=>{
     if(error||!stat.isFile()){response.writeHead(404).end();return;}
     response.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
     if(request.method==='HEAD'){response.end();return;}
     fs.createReadStream(file).pipe(response);
    });
   }catch(_){response.writeHead(400).end();}
  });
  server.on('error',reject);
  server.listen(43819,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port+'/'));
 });
}
function openGame(origin){
 window=new BrowserWindow({width:1600,height:950,minWidth:1050,minHeight:680,backgroundColor:'#061321',title:'Blue Lock NEO — Desktop',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 window.loadURL(origin);
 window.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//i.test(url))shell.openExternal(url);return {action:'deny'};});
 window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(origin)){event.preventDefault();if(/^https:\/\//i.test(url))shell.openExternal(url);}});
}
async function initUpdater(){
 if(!app.isPackaged)return;
 autoUpdater.autoDownload=true;
 autoUpdater.autoInstallOnAppQuit=true;
 autoUpdater.on('update-downloaded',()=>{
  if(!window||window.isDestroyed())return;
  dialog.showMessageBox(window,{type:'info',title:'Blue Lock NEO',message:'Nova atualização pronta. Seus dados serão preservados.',buttons:['Reiniciar e atualizar','Mais tarde'],defaultId:1}).then(({response})=>{if(response===0)autoUpdater.quitAndInstall();});
 });
 autoUpdater.on('error',e=>console.warn('Update:',e.message));
 try{
  // Android and Windows share a repository, not the same update feed.
  // Select the newest published release that includes a Windows latest.yml.
  const response=await fetch('https://api.github.com/repos/a94330028-cell/Blue-lock-neo/releases?per_page=100',{headers:{'Accept':'application/vnd.github+json','User-Agent':'Blue-Lock-NEO-Desktop'}});
  if(!response.ok)throw new Error('GitHub releases HTTP '+response.status);
  const releases=await response.json();
  const desktopReleases=releases.filter(release=>!release.draft&&release.assets&&release.assets.some(asset=>asset.name==='latest.yml')&&/^v\d+\.\d+\.\d+$/.test(release.tag_name));
  desktopReleases.sort((a,b)=>{
   const av=a.tag_name.slice(1).split('.').map(Number),bv=b.tag_name.slice(1).split('.').map(Number);
   for(let i=0;i<3;i++){if(av[i]!==bv[i])return bv[i]-av[i];}return 0;
  });
  if(!desktopReleases.length)return;
  const tag=encodeURIComponent(desktopReleases[0].tag_name);
  autoUpdater.setFeedURL({provider:'generic',url:'https://github.com/a94330028-cell/Blue-lock-neo/releases/download/'+tag+'/'});
  await autoUpdater.checkForUpdatesAndNotify();
 }catch(e){console.warn('Desktop update check:',e.message);}
}
const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) app.quit();
else app.on('second-instance',()=>{ if(window){if(window.isMinimized())window.restore();window.focus();} });
if(singleInstance) app.whenReady().then(async()=>{try{const origin=await startLocalSite();openGame(origin);initUpdater();}catch(error){dialog.showErrorBox('Blue Lock NEO','Falha ao iniciar: '+error.message);app.quit();}});
app.on('window-all-closed',()=>{if(server)server.close();if(process.platform!=='darwin')app.quit();});
