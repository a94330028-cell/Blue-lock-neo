'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const E=require('../web/engine.js');
const addon=fs.readFileSync('web/neo-broadcast-v920.js','utf8');
const mobile=fs.readFileSync('web/mobile-upgrade.js','utf8');
assert.ok(mobile.includes('neo-broadcast-v920.js?v=9.2.0'));
for(const item of ['neo920-up-btn','neo920-check','BlueLockAndroid.checkForUpdates','neo920-broadcast','neo920-stats','neo920-live-events','neo920-history'])assert.ok(addon.includes(item),item);
for(const [rate,expected] of [[18,0.6],[9,0.3],[6,0.2],[4.5,0.15]]){
 const m=new E.Match('bm','px',13579);m.gameRate=rate;m.step(E.TICK);
 assert.ok(Math.abs(m.time-expected)<1e-8,'Game rate '+rate);
}
const sim=new E.Match('bm','px',252525);const result=sim.runToEnd();
assert.ok(sim.finished&&sim.time>=90*60);
assert.deepEqual(result.score,sim.score);
assert.equal(result.shots.length,sim.shotMap.length);
assert.ok(result.events.length>0);
assert.equal(E.GAME_RATE,18);
assert.equal(fs.readFileSync('web/VERSION','utf8') .trim(),'9.9.1');
console.log('OK: updater visible, live-clock modes, native updater action, live data, background season simulation');
