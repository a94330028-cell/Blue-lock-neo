'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const png=(rel,size)=>{
 const b=fs.readFileSync(path.join(base,rel));
 assert.equal(b.subarray(1,4).toString('ascii'),'PNG','PNG signature: '+rel);
 assert.equal(b.readUInt32BE(16),size,'Width: '+rel);
 assert.equal(b.readUInt32BE(20),size,'Height: '+rel);
};
for(const [p,n] of [
 ['web/icons/neo-192.png',192],
 ['web/icons/neo-512.png',512],
 ['web/icons/kaiser-192.png',192],
 ['web/icons/kaiser-512.png',512],
 ['web/icons/favicon-32.png',32],
 ['app/src/main/res/mipmap-mdpi/ic_launcher.png',48],
 ['app/src/main/res/mipmap-hdpi/ic_launcher.png',72],
 ['app/src/main/res/mipmap-xhdpi/ic_launcher.png',96],
 ['app/src/main/res/mipmap-xxhdpi/ic_launcher.png',144],
 ['app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',192],
])png(p,n);
const manifest=JSON.parse(fs.readFileSync(path.join(base,'web/manifest.webmanifest'),'utf8'));
assert.ok(manifest.icons.some(i=>i.src.includes('kaiser-192.png')));
assert.ok(manifest.icons.some(i=>i.src.includes('kaiser-512.png')));
const sw=fs.readFileSync(path.join(base,'web/service-worker.js'),'utf8');
for(const f of ['kaiser-192.png','kaiser-512.png','favicon-32.png'])assert.ok(sw.includes(f));
const sync=fs.readFileSync(path.join(base,'tools/sync_inline_v930.py'),'utf8');
assert.ok(sync.includes('apple-touch-icon'));
assert.ok(sync.includes('favicon-32.png?v=9.9.1'));
assert.equal(fs.readFileSync(path.join(base,'web/VERSION'),'utf8').trim(),'1.8.0');
const gradle=fs.readFileSync(path.join(base,'app/build.gradle'),'utf8');
assert.ok(gradle.includes('versionCode 116'));
assert.ok(gradle.includes("versionName '1.8.0'"));
console.log('PASS: Kaiser icon assets, manifest, Android mipmaps, cache and version 9.9.1');
