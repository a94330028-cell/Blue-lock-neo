'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(file, 'utf8');
const page = read('web/index.html');
const arena = read('web/neo-ego-arena-v300.css');
const style = read('web/style.css');
const game = read('web/app.js');
const mobile = read('web/neo-mobile-ux-v111.js');
const menu = read('web/neo-reference-mobile.js');
const mobileCss = read('web/neo-reference-mobile.css');
const sw = read('web/service-worker.js');
const mobileLoader = read('web/mobile-upgrade.js');

assert.equal(read('web/UPDATE_BUILD').trim(), '10.6.46');
assert.equal((page.match(/href="neo-ego-arena-v300\.css\?v=10\.6\.46"/g) || []).length, 1,
 'EGO ARENA stylesheet must load in the source page, not just be cached offline');
assert.match(style, /#stadium \.field-bottom #stadiumMode\{pointer-events:auto!important/,
 'fullscreen cannot inherit pointer-events:none from the HUD');
assert.match(style, /body\.neo-pseudo-fullscreen #stadium\.fullscreen-active/);
assert.match(game, /function togglePseudoFullscreen\(\)/,
 'Android WebView receives a full-screen field when the native API refuses');
assert.match(mobile, /if\(b\.dataset\.refPage==='ranking'\)/,
 'ranking mobile tab is synchronized with the actual highlighted tab');
assert.match(menu, /else if\(target==='neo980-squad-area'\)/,
 'lineup shortcut has a real fallback when its optional panel is missing');
assert.match(mobileCss, /\.neo-ux-hub button:focus-visible/);
assert.match(arena, /#neoArenaOptions\[aria-expanded="true"\]/);
assert.match(sw, /neo-foundation-10-6-46/);
assert.match(sw, /neo-ego-arena-v300\.css\?v=10\.6\.46/);
assert.match(sw, /neo-reference-mobile\.js\?v=10\.6\.46/);
assert.match(mobileLoader, /neo-reference-mobile\.js\?v=10\.6\.46/);
console.log('PASS 10.6.46 UI controls: fullscreen hit area, mobile ranking and lineup, stylesheet, focus and cache');
