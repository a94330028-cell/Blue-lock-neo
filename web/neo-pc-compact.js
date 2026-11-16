/* Compact PC layout: preserve every original game panel and game listener. */
(function () {
  'use strict';
  function setup() {
    if (!window.matchMedia('(min-width: 1100px)').matches) return;
    const match = document.getElementById('match');
    if (!match || match.dataset.neoPcCompact === '1') return;
    match.dataset.neoPcCompact = '1';

    // Controls are intentionally not persisted: always start in compact layout.
    const top = document.createElement('div');
    top.className = 'neo-pc-toolbar';
    top.innerHTML = '<div class="neo-pc-toolbar-title"><span class="neo-pc-led"></span><strong>CENTRAL DE PARTIDAS</strong><small>Visão organizada para PC</small></div><button class="neo-pc-density" type="button" aria-pressed="true">▣ Visão compacta: ligada</button>';
    match.insertBefore(top, match.firstChild);
    const btn = top.querySelector('.neo-pc-density');
    btn.addEventListener('click', () => {
      const compact = !match.classList.toggle('neo-pc-expanded');
      btn.setAttribute('aria-pressed', String(compact));
      btn.textContent = compact ? '▣ Visão compacta: ligada' : '▤ Visão expandida';
    });

    // Put secondary analytical cards inside an accordion, without rebuilding their content.
    // All ids, canvas elements and bound listeners remain the same DOM objects.
    const main = match.querySelector('.match-main');
    if (main) {
      const optional = Array.from(main.children).filter(el =>
        el.matches('.moments-card, .shot-map-card, .setpiece-card')
      );
      if (optional.length) {
        const more = document.createElement('details');
        more.className = 'neo-pc-analyses';
        const summary = document.createElement('summary');
        summary.textContent = '📊 Análises avançadas da partida';
        more.appendChild(summary);
        optional[0].before(more);
        optional.forEach(el => more.appendChild(el));
      }
    }

    const aside = match.querySelector('.match-side');
    if (aside) {
      aside.classList.add('neo-pc-aside');
      const panels = Array.from(aside.children);
      // Keep essential coach controls above the fold; additional tools remain available.
      if (panels.length > 3) {
        const extra = document.createElement('details');
        extra.className = 'neo-pc-side-extra';
        const title = document.createElement('summary');
        title.textContent = '⚙️ Mais controles e painéis';
        extra.appendChild(title);
        panels[3].before(extra);
        panels.slice(3).forEach(el => extra.appendChild(el));
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, {once:true});
  else setup();
})();
