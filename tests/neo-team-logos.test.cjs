'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
for(const id of ['bm','ba','mc','px','ub','ht']){
 const path='web/assets/team-logos/'+id+'.webp';
 assert.ok(fs.existsSync(path),'missing '+path);
 const image=fs.readFileSync(path);
 assert.ok(image.length>1500&&image.slice(0,4).toString()==='RIFF'&&image.slice(8,12).toString()==='WEBP','invalid crest '+id);
 assert.ok(fs.readFileSync('web/service-worker.js','utf8').includes('./assets/team-logos/'+id+'.webp'),'not cached '+id);
}
const app=fs.readFileSync('web/app.js','utf8'),mobile=fs.readFileSync('web/neo-reference-mobile.js','utf8'),css=fs.readFileSync('web/neo-reference-mobile.css','utf8');
assert.ok(fs.readFileSync('web/neo-clubs-v1050.js','utf8').includes('neo-team-icon'),'team pickers must use supplied crests');
assert.ok(app.includes('TEAM_LOGO_PATHS')&&app.includes('neo-club-crest-img'),'gamewide crest rendering missing');
assert.ok(fs.readFileSync('web/neo-clubs-v1050.js','utf8').includes("'ub','ht'"),'History crest needs to appear in the team selector');
assert.ok(mobile.includes("ht:'ht.webp'")&&fs.readFileSync('web/neo-mobile-ux-v111.js','utf8').includes("ht:'ht.webp'"),'History crest missing from mobile views');
assert.ok(mobile.includes('neo-ref-result-score')&&mobile.includes('neo-ref-table-logo'),'home crest slots missing');
assert.ok(css.includes('neo-ref-crest[src*="team-logos/"]'),'mobile crest styling missing');
assert.ok(fs.readFileSync('web/UPDATE_BUILD','utf8').trim().localeCompare('10.6.22',undefined,{numeric:true})>=0,'build cannot roll back');
console.log('PASS: original crests and supplied History crest in gameplay, mobile UI and offline Android cache');
