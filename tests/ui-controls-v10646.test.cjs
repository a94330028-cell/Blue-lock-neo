'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = (() => {
  try { return require('playwright-core'); }
  catch { return require('/tmp/neo-ui-validate/node_modules/playwright-core'); }
})();

const root = path.resolve(__dirname, '../web');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400).end(); return; }
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  if (file === root) file = path.join(root, 'index.html');
  fs.readFile(file, (error, body) => error ? res.writeHead(404).end() : res.writeHead(200, {
    'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'
  }).end(body));
});

async function run() {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const chrome = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(fs.existsSync);
    assert.ok(chrome, 'Chromium required for real interaction tests');
    browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    for (const [name, viewport] of [['PC', { width: 1366, height: 768 }], ['mobile', { width: 390, height: 844 }]]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', dialog => dialog.dismiss());
      await page.goto('http://127.0.0.1:' + server.address().port + '/', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !!window.NeoCareerBridge && !!document.querySelector('#play'), { timeout: 30000 });
      await page.waitForTimeout(300);
      assert.deepEqual(errors, [], name + ': startup must not throw');

      // Fullscreen must remain usable in Android WebView, where the native
      // Fullscreen API can exist but reject the request.
      await page.evaluate(() => {
        document.getElementById('stadium').requestFullscreen = () => Promise.reject(new Error('API bloqueada'));
      });
      if (name === 'mobile') await page.locator('#neoMobileNav [data-ref-page="match"]').click();
      await page.locator('#stadiumMode').click();
      assert.equal(await page.locator('body').evaluate(node => node.classList.contains('neo-pseudo-fullscreen')), true,
        name + ': fullscreen falls back to an actual full-viewport field');
      await page.locator('#stadiumMode').click();
      assert.equal(await page.locator('body').evaluate(node => node.classList.contains('neo-pseudo-fullscreen')), false,
        name + ': fullscreen button closes the fallback');

      if (name === 'PC') {
        await page.waitForFunction(() => document.body.classList.contains('neo-arena-active'));
        assert.equal(await page.locator('link[href*="neo-ego-arena-v300.css"]').count(), 1,
          'desktop card and button styling must be loaded');
        assert.equal(await page.locator('#stadiumMode').evaluate(node => getComputedStyle(node).pointerEvents), 'auto',
          'fullscreen button must receive clicks despite passive field HUD');
        for (const mode of ['coach', 'analysis', 'broadcast']) {
          await page.locator('[data-arena-view="' + mode + '"]').click();
          assert.equal(await page.locator('#match').getAttribute('data-arena-mode'), mode);
        }
        await page.locator('#neoArenaOptions').click();
        assert.equal(await page.locator('.neo-arena-settings').evaluate(node => node.open), true);
        await page.locator('#neoArenaOptions').click();
        assert.equal(await page.locator('.neo-arena-settings').evaluate(node => node.open), false);
        await page.locator('#focusMode').click();
        assert.equal(await page.locator('#focusMode').getAttribute('aria-pressed'), 'true');
        await page.locator('#focusMode').click();
        await page.locator('#play').click();
        assert.match(await page.locator('#play').innerText(), /Pausar/);
        await page.locator('#play').click();
        assert.match(await page.locator('#play').innerText(), /Continuar/);
        await page.locator('nav.nav [data-tab="league"]').click();
        await page.locator('#neoArenaLeagueXI').click();
        assert.equal(await page.locator('.neo-arena-league-xi').evaluate(node => node.open), true);
        await page.locator('#neoArenaLeagueFixtures').click();
      } else {
        await page.waitForFunction(() => !!document.querySelector('#neoMobileNav button[data-ref-page="home"]'));
        for (const section of ['ranking', 'players', 'match', 'home']) {
          await page.locator('#neoMobileNav [data-ref-page="' + section + '"]').click();
          assert.equal(await page.locator('body').getAttribute('data-neo-ref-page'), section,
            'mobile button opens ' + section);
          assert.equal(await page.locator('#neoMobileNav [data-ref-page="' + section + '"]').getAttribute('aria-current'), 'page',
            'mobile active tab is decorated and announced for ' + section);
        }
        await page.locator('#neoMobileNav [data-ref-page="match"]').click();
        await page.locator('#neoRefMatchTabs [data-ref-target="squads"]').waitFor();
        await page.locator('#neoRefMatchTabs [data-ref-target="squads"]').click();
        assert.equal(await page.locator('body').getAttribute('data-neo-ref-page'), 'players',
          'players pill must lead to a working list instead of an empty panel');
      }
      assert.deepEqual(errors, [], name + ': interactive controls must not throw');
      await page.close();
    }
    console.log('PASS 10.6.46 UI controls: PC and mobile navigation, match, league, view modes and settings');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
