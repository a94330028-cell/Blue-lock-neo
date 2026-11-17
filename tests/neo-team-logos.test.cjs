'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
for(const id of ['bm','ba','mc','px','ub']){
 const path='web/assets/team-logos/'+id+'.webp';
 assert.ok(fs.existsSync(path),'missing '+path);
 const image=fs.readFileSync(path);
 assert.ok(image.length>1500&&image.slice(0,4).toString()==='RIFF'&&image.slice(8,12).toString()==='WEBP','invalid crest '+id);
 assert.ok(fs.readFileSync('web/service-worker.js','utf8').includes('./assets/team-logos/'+id+'.webp'),'not cached '+id);
}
const app=fs.readFileSync('web/app.js','utf8'),mobile=fs.readFileSync('web/neo-reference-mobile.js','utf8'),css=fs.readFileSync('web/neo-reference-mobile.css','utf8');
assert.ok(fs.readFileSync('web/neo-clubs-v1050.js','utf8').includes('neo-team-icon'),'team pickers must use supplied crests');
assert.ok(app.includes('TEAM_LOGO_PATHS')&&app.includes('neo-club-crest-img'),'gamewide crest rendering missing');
assert.ok(mobile.includes('neo-ref-result-score')&&mobile.includes('neo-ref-table-logo'),'home crest slots missing');
assert.ok(css.includes('neo-ref-crest[src*="team-logos/"]'),'mobile crest styling missing');
assert.equal(fs.readFileSync('web/UPDATE_BUILD','utf8').trim(),'10.6.21');
console.log('PASS: 5 original crest assets, gameplay display, mobile UI and offline Android cache');
