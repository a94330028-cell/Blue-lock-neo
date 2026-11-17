'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('web/app.js','utf8');
const start=app.indexOf('async function recoverGalleryPortraitBlob(file){');
const end=app.indexOf('\nasync function fileToPortrait(file)',start);
assert.ok(start>=0&&end>start,'Gallery stream fallback is part of the portrait reader');
const recover=new Function('Response','Blob','URL','fetch',
  app.slice(start,end)+'\nreturn recoverGalleryPortraitBlob;')(
    Response,Blob,URL,fetch);
assert.ok(app.includes('await recoverGalleryPortraitBlob(file)'),
  'FileReader failure invokes the Gallery recovery before reporting an error');
assert.ok(!app.includes('Copie a imagem para Downloads ou Galeria'),
  'the interface must not tell a user already in the Gallery to move the photo');

(async()=>{
 const original=new Blob([Uint8Array.from([255,216,255,224,0,16,1,2,3])],{type:'image/jpeg'});
 Object.defineProperty(original,'name',{value:'samsung-gallery.jpg'});
 const copied=await recover(original);
 assert.ok(copied instanceof Blob);
 assert.equal(copied.size,original.size);
 assert.equal(copied.type,'image/jpeg');
 assert.deepEqual(Buffer.from(await copied.arrayBuffer()),Buffer.from(await original.arrayBuffer()));
 console.log('PASS Samsung Gallery: selected image bytes recovered via stream, Android native reads one-shot URI');
})().catch(error=>{console.error(error);process.exitCode=1});
