#!/usr/bin/env python3
"""Sync versioned JS modules into index.html's legacy inline script slots.

The game ships an offline all-in-one HTML for Android WebView. Changing only
engine.js/attributes.js/progression.js does NOT change the actual running game.
This step therefore embeds the exact current modules into the canonical page
before both the site/web-update build and the Android APK build.
"""
from pathlib import Path
import re,sys
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'web'
html=root/'index.html'
src=html.read_text(encoding='utf-8')
# The expansion must execute before the legacy app's immediate init() call.
# Strip any previously inserted copy so repeating this build remains idempotent.
src=re.sub(r'\s*<script[^>]*src="neo2-(?:abilities-v200|deep-ai-v202)\.js[^"]*"[^>]*>\s*</script>', '', src)
patterns=re.compile(r'(<script\b[^>]*>)(.*?)(</script\s*>)',re.DOTALL|re.IGNORECASE)
paths={
 'attributes':root/'systems/attributes.js',
 'masters':root/'systems/masters.js',
 'progression':root/'systems/progression.js',
 'engine':root/'engine.js',
 'app':root/'app.js',
}
counts={name:0 for name in paths}
def change(m):
 inside=m.group(2);which=None
 if 'Individual attributes and positional OVR' in inside and 'const ROLE_WEIGHTS' in inside:which='attributes'
 elif 'Master-Striker entry profiles' in inside and 'WINDOW_SECONDS' in inside:which='masters'
 elif 'Season progression and competitive ranking' in inside:which='progression'
 elif 'const TICK = 1/30' in inside and 'const SKILLS =' in inside:which='engine'
 elif 'function renderScorerBoard(){' in inside and 'const $=id=>document.getElementById(id);' in inside:which='app'
 if which is None:return m.group(0)
 counts[which]+=1
 content=paths[which].read_text(encoding='utf-8').strip()
 if '</script' in content.lower():raise ValueError('Unexpected script end tag in '+which)
 return m.group(1)+'\n'+content+'\n'+m.group(3)
updated=patterns.sub(change,src)
if 'window.NeoPortraitUI=Object.freeze' not in updated:
    bridge_marker='// Load only the players who actually appear in the match, rather than requesting all 87 at launch.'
    bridge="""window.NeoPortraitUI=Object.freeze({
 html:(name,club,cls='neo960-avatar')=>portrait(name,club,cls),
 url:(name,color)=>portraitUrl(name,color)
});
"""
    if updated.count(bridge_marker)!=1:raise RuntimeError('Portrait bridge requires exactly one game script marker')
    updated=updated.replace(bridge_marker,bridge+bridge_marker)
if any(v!=1 for v in counts.values()):raise RuntimeError('Inline sync must replace each module exactly once: '+str(counts))
# The repository's canonical HTML predates 9.6, so add the player helper
# BEFORE positioning historic teams in front of it. Repeated runs are idempotent.
if 'neo-player-data-v960.js' not in updated:
    player_marker='<script defer src="mobile-upgrade.js'
    if updated.count(player_marker)!=1:raise RuntimeError('Cannot insert player data before mobile UI')
    updated=updated.replace(player_marker,'<script defer src="neo-player-data-v960.js?v=9.7.0"></script>\n'+player_marker)
if 'neo-historic-teams-v970.js' not in updated:
    marker='<script defer src="neo-player-data-v960.js'
    if updated.count(marker)!=1:raise RuntimeError('Historical teams need to load before the player registry')
    updated=updated.replace(marker,'<script defer src="neo-historic-teams-v970.js?v=9.7.0"></script>\n<script defer src="neo-cups-v970.js?v=9.7.0"></script>\n'+marker)
if 'neo-studio-v970.js' not in updated:
    marker='<script defer src="matchday-plus.js'
    if updated.count(marker)!=1:raise RuntimeError('Cannot find addons insertion point')
    updated=updated.replace(marker,'<script defer src="neo-studio-v970.js?v=9.7.0"></script>\n'+marker)
if 'neo-studio-v970.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Cannot locate page head')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-studio-v970.css?v=9.7.0">\n</head>')
if 'neo-player-data-v960.js' not in updated:
    marker='<script defer src="mobile-upgrade.js'
    if updated.count(marker)!=1:raise RuntimeError('Cannot insert player data helper before mobile UI')
    updated=updated.replace(marker,'<script defer src="neo-player-data-v960.js?v=9.6.0"></script>\n'+marker)
updated=updated.replace('neo-player-data-v960.js?v=9.6.0','neo-player-data-v960.js?v=9.7.0')
# v9.8: coaching logic is loaded before historic clubs and before user pages.
if 'neo-coach-v980.js' not in updated:
    anchor='<script defer src="neo-historic-teams-v970.js'
    if updated.count(anchor)!=1:raise RuntimeError('Coach needs the historic teams script anchor')
    updated=updated.replace(anchor,'<script defer src="neo-coach-v980.js?v=9.8.0"></script>\n'+anchor)
if 'neo-squads-v980.js' not in updated:
    anchor='<script defer src="neo-studio-v970.js?v=9.7.0"></script>'
    if updated.count(anchor)!=1:raise RuntimeError('Squad screen needs its studio script anchor')
    updated=updated.replace(anchor,anchor+'\n<script defer src="neo-squads-v980.js?v=9.8.0"></script>')
if 'neo-squads-v980.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Could not find page head')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-squads-v980.css?v=9.8.0">\n</head>')
# v9.8.1: accessible match cues and verified cinematic cup highlights.
# Both builds (Pages and Android) use exactly this same set of scripts.
if 'neo-match-v981.js' not in updated:
    if updated.count('</body>') != 1: raise RuntimeError('Cannot attach match effects')
    updated=updated.replace('</body>','<script defer src="neo-match-v981.js?v=9.8.1"></script>\n</body>')
if 'neo-match-v981.css' not in updated:
    if updated.count('</head>') != 1: raise RuntimeError('Cannot attach match styling')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-match-v981.css?v=9.8.1">\n</head>')
# v9.9: gallery expansion, real-data Team of the Round and adaptive football.
if 'neo-round-v990.js' not in updated:
    if updated.count('</body>') != 1: raise RuntimeError('Cannot attach 9.9 gameplay')
    updated=updated.replace('</body>','<script defer src="neo-round-v990.js?v=9.9.0"></script>\n</body>')
if 'neo-v990.css' not in updated:
    if updated.count('</head>') != 1: raise RuntimeError('Cannot attach 9.9 styles')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-v990.css?v=9.9.0">\n</head>')
# v9.9.1: New Kaiser icon for tab favicon and Android/PWA homescreen.
# Preserve existing manifest link and change its URL to force a fresh browser fetch.
updated=updated.replace('href="manifest.webmanifest"','href="manifest.webmanifest?v=9.9.1"')
updated=updated.replace('href="./manifest.webmanifest"','href="./manifest.webmanifest?v=9.9.1"')
if 'href="./icons/kaiser-192.png' not in updated:
    if updated.count('</head>') != 1: raise RuntimeError('Cannot install Kaiser site favicon')
    updated=updated.replace('</head>','<link rel="icon" type="image/png" href="./icons/favicon-32.png?v=9.9.1">\n<link rel="apple-touch-icon" href="./icons/kaiser-192.png?v=9.9.1">\n</head>')
# v9.9.2: invalidate previous gallery styling and new-club photo search resources.
updated=updated.replace('neo-studio-v970.js?v=9.7.0','neo-studio-v970.js?v=2.0.0-history-photos')
updated=updated.replace('neo-studio-v970.js?v=9.9.4','neo-studio-v970.js?v=2.0.0-history-photos')
updated=updated.replace('neo-v990.css?v=9.9.0','neo-v990.css?v=9.9.4')
# v10.0: Bust stale Mobile Edition assets when building the Android web bundle.
updated=re.sub(r'src="mobile-upgrade\.js(?:\?v=[^"]*)?"','src="mobile-upgrade.js?v=10.6.38"',updated)
updated=re.sub(r'href="mobile-upgrade\.css(?:\?v=[^"]*)?"','href="mobile-upgrade.css?v=10.5.0"',updated)
# v10.4: load the positional layout BEFORE Squad and Best XI scripts.
# The generated page is shared by GitHub Pages and the Android WebView.
if 'neo-pitch-layout-v1040.js' not in updated:
    anchor='<script defer src="neo-squads-v980.js'
    if updated.count(anchor)!=1:raise RuntimeError('Unable to place position helper before Squad screen')
    updated=updated.replace(anchor,'<script defer src="neo-pitch-layout-v1040.js?v=10.4.0"></script>\n'+anchor)
if 'neo-pitch-v1040.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Unable to install pitch styling')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-pitch-v1040.css?v=10.4.0">\n</head>')
# Existing squads and best-XI scripts changed and must bypass the previous cached copy.
for file in ('neo-squads-v980.js','neo-round-v990.js'):
    updated=re.sub(r'src="'+re.escape(file)+r'(?:\?v=[^"]*)?"','src="'+file+'?v=10.4.0"',updated)
updated=re.sub(r'href="neo-squads-v980\.css(?:\?v=[^"]*)?"','href="neo-squads-v980.css?v=10.4.0"',updated)
# 10.5: club crests in selectors must be available before the squad field renders.
if 'neo-clubs-v1050.js' not in updated:
    anchor='<script defer src="neo-squads-v980.js'
    if updated.count(anchor)!=1:raise RuntimeError('Club crests script must precede squads')
    updated=updated.replace(anchor,'<script defer src="neo-clubs-v1050.js?v=10.5.0"></script>\n'+anchor)
if 'neo-photo-recovery-v1050.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Unable to install alternate photo importer')
    updated=updated.replace('</body>','<script defer src="neo-photo-recovery-v1050.js?v=10.5.0"></script>\n</body>')
if 'neo-polish-v1050.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Unable to install new styles')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-polish-v1050.css?v=10.5.0">\n</head>')
for file in ('neo-round-v990.js','neo-squads-v980.js','neo-pitch-layout-v1040.js'):
    updated=re.sub(r'src="'+re.escape(file)+r'(?:\?v=[^"]*)?"','src="'+file+'?v=10.5.0"',updated)
for file in ('neo-pitch-v1040.css','neo-squads-v980.css'):
    updated=re.sub(r'href="'+re.escape(file)+r'(?:\?v=[^"]*)?"','href="'+file+'?v=10.5.0"',updated)
# 10.5.1: reload the real league data and refreshed dynamic Best XI.
for file in ('neo-round-v990.js',):
    updated=re.sub(r'src="'+re.escape(file)+r'(?:\?v=[^"]*)?"','src="'+file+'?v=10.5.1"',updated)
updated=re.sub(r'src="neo-player-data-v960\.js(?:\?v=[^"]*)?"','src="neo-player-data-v960.js?v=10.6.38"',updated)
# NEO 10.6: add the full history without duplicating it as a second data source.
source_history=root.parent/'CHANGELOG.json'
if not source_history.is_file():raise RuntimeError('Official changelog missing')
(root/'CHANGELOG.json').write_bytes(source_history.read_bytes())
if 'neo-updates-v1060.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Unable to load official updates page')
    updated=updated.replace('</body>','<script defer src="neo-updates-v1060.js?v=10.6.0"></script>\n</body>')
if 'neo-updates-v1060.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Unable to load official updates styles')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-updates-v1060.css?v=10.6.0">\n</head>')
updated=re.sub(r'src="neo-updates-v1060\.js(?:\?v=[^"]*)?"','src="neo-updates-v1060.js?v=10.6.0"',updated)
updated=re.sub(r'href="neo-updates-v1060\.css(?:\?v=[^"]*)?"','href="neo-updates-v1060.css?v=10.6.0"',updated)
# First official public release: bust every legacy cached JS/CSS version query.
# Internal module filenames remain unchanged to preserve user data.
updated=re.sub(r'(\?v=)\d+\.\d+\.\d+', r'\g<1>1.8.0', updated)
# v1.1: AI tactics and Turbo control styling, available on both browser and Android.
if 'neo-ai-v110.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Cannot attach tactical AI')
    updated=updated.replace('</body>','<script defer src="neo-ai-v110.js?v=1.4.0"></script>\n</body>')
if 'neo-ai-v110.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Cannot attach Turbo UI styling')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-ai-v110.css?v=1.4.0">\n</head>')
# v1.2 — real match ego memory, rivalry and chemistry loaded after the 1.1 tactical engine.
if 'neo-evolution-v120.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Unable to install NEO EGO Evolution')
    updated=updated.replace('</body>','<script defer src="neo-evolution-v120.js?v=1.4.0"></script>\n</body>')
if 'neo-evolution-v120.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Unable to attach EGO Chronicle styles')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-evolution-v120.css?v=1.4.0">\n</head>')
if 'neo-living-v130.js' not in updated:
    updated=updated.replace('</body>','<script defer src="neo-living-v130.js?v=1.4.0"></script>\n</body>')
# v1.3: earned skill confrontations, Flow profiles and Metavision.
if 'neo-ego-combat-v140.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Unable to load Ego Combat')
    updated=updated.replace('</body>','<script defer src="neo-ego-combat-v140.js?v=1.4.0"></script>\n</body>')
if 'neo-ego-combat-v140.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Unable to load Ego Combat styling')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-ego-combat-v140.css?v=1.4.0">\n</head>')
# NEO 1.4: weapon-reading, tactical counterplay and authentic highlights.
if 'neo-ascension-v150.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Cannot install Ego Ascension')
    updated=updated.replace('</body>','<script defer src="neo-ascension-v150.js?v=1.4.0"></script>\n</body>')
if 'neo-ascension-v150.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Cannot install Ascension styling')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-ascension-v150.css?v=1.4.0">\n</head>')
# NEO 1.5: real keeper memory, adaptive team shape and persistent Ego Encyclopedia.
if 'neo-world-brain-v160.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Could not load World Brain 1.5')
    updated=updated.replace('</body>','<script defer src="neo-world-brain-v160.js?v=1.5.0"></script>\n</body>')
if 'neo-world-brain-v160.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Could not attach World Brain 1.5 styles')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-world-brain-v160.css?v=1.5.0">\n</head>')
# v1.6: first five pillars, loaded after existing Ego mechanics.
if 'neo-five-pillars-v170.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Could not install Five Pillars')
    updated=updated.replace('</body>','<script defer src="neo-five-pillars-v170.js?v=1.6.0"></script>\n</body>')
if 'neo-five-pillars-v170.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Could not install Five Pillars styles')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-five-pillars-v170.css?v=1.6.0">\n</head>')
# v1.7 — dynamic football, real ability clashes, Devouring and cinematic stories.
if 'neo-ego-saga-v180.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Could not install Ego Saga')
    updated=updated.replace('</body>','<script defer src="neo-ego-saga-v180.js?v=1.7.0"></script>\n</body>')
if 'neo-ego-saga-v180.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Could not load Ego Saga styling')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-ego-saga-v180.css?v=1.7.0">\n</head>')
# v1.8 — real careers, rivalries, earned training, transfer market and official newsroom.
if 'neo-living-career-v190.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Unable to load Living Career 1.8')
    updated=updated.replace('</body>','<script defer src="neo-living-career-v190.js?v=1.8.0"></script>\n</body>')
if 'neo-living-career-v190.css' not in updated:
    if updated.count('</head>')!=1:raise RuntimeError('Unable to attach Living Career styles')
    updated=updated.replace('</head>','<link rel="stylesheet" href="neo-living-career-v190.css?v=1.8.0">\n</head>')
# Desktop layout is shared by the GitHub Pages site and Windows package.
# The CSS is activated only on wide screens; Android remains unchanged.
if 'neo-desktop.css' not in updated:
    if updated.count('</head>') != 1:
        raise RuntimeError('Unable to attach desktop layout')
    updated = updated.replace('</head>', '<link rel="stylesheet" href="neo-desktop.css?v=1.8.0">\n</head>')
# PC only: force refresh the desktop CSS and attach the density controls.
# Scripts only reorganize existing DOM nodes, without changing game saves or handlers.
import re
updated = re.sub(
    r'neo-desktop\.css\?v=[0-9.]+',
    'neo-desktop.css?v=1.9.1',
    updated
)
if 'neo-pc-compact.js' not in updated:
    if updated.count('</body>') != 1:
        raise RuntimeError('Unable to attach PC compact layout')
    updated = updated.replace('</body>', '<script defer src="neo-pc-compact.js?v=1.8.2"></script>\n</body>')
# v1.9 — bounded, real-event advanced Ego and Living Universe.
if 'neo-advanced-v200.js' not in updated:
    if updated.count('</body>') != 1: raise RuntimeError('Cannot load advanced Ego decisions')
    updated = updated.replace('</body>', '<script defer src="neo-advanced-v200.js?v=1.9.0"></script>\n</body>')
if 'neo-universe-v220.js' not in updated:
    if updated.count('</body>') != 1: raise RuntimeError('Cannot load Living Universe archive')
    updated = updated.replace('</body>', '<script defer src="neo-universe-v220.js?v=1.9.0"></script>\n</body>')
if 'neo-universe-v220.css' not in updated:
    if updated.count('</head>') != 1: raise RuntimeError('Cannot load Living Universe styles')
    updated = updated.replace('</head>', '<link rel="stylesheet" href="neo-universe-v220.css?v=1.9.0">\n</head>')
# A changed query key avoids retaining stale tactical XI Javascript in old browsers.
updated = re.sub(
    r'neo-round-v990\.js\?v=[0-9.]+',
    'neo-round-v990.js?v=1.9.1',
    updated
)
# NEO Evolution Pack 19–30: web site and Android use the same real-match code.
if 'neo-twelve-v230.js' not in updated:
    if updated.count('</body>') != 1: raise RuntimeError('Cannot add NEO Evolution Pack')
    updated = updated.replace('</body>', '<script defer src="neo-twelve-v230.js?v=1.8.0-12"></script>\n</body>')
if 'neo-twelve-v230.css' not in updated:
    if updated.count('</head>') != 1: raise RuntimeError('Cannot add NEO Evolution styles')
    updated = updated.replace('</head>', '<link rel="stylesheet" href="neo-twelve-v230.css?v=1.8.0-12">\n</head>')
# Match and universe content update (ideas 31-55, visual V10.0).
for file in ('neo-match-pulse-v240.js','neo-universe-spotlight-v250.js'):
    if file not in updated:
        if updated.count('</body>') != 1: raise RuntimeError('No valid document body for '+file)
        updated = updated.replace('</body>', '<script defer src="'+file+'?v=10.6.12"></script>\n</body>')
for file in ('neo-match-pulse-v240.css','neo-universe-spotlight-v250.css'):
    if file not in updated:
        if updated.count('</head>') != 1: raise RuntimeError('No valid document head for '+file)
        updated = updated.replace('</head>', '<link rel="stylesheet" href="'+file+'?v=10.6.12">\n</head>')
# NEO 2.0 development: version only the updated release-history UI.
# Keep all legacy asset paths, save keys and loading order intact.
for asset,attr in (('neo-updates-v1060.js','src'),('neo-updates-v1060.css','href')):
    updated=re.sub(r'(' + attr + r'="' + re.escape(asset) + r')(?:\\?v=[^"]*)?(?=")',
                   r'\\g<1>?v=2.0.0', updated)
# NEO 2.0: keep 2,520 generated skills in their own light JS file.
# This module is loaded synchronously after the engine but before app.init().
if 'neo2-abilities-v200.js' not in updated:
    if updated.count('</body>')!=1:raise RuntimeError('Cannot load NEO 2.0 ability expansion')
    updated=updated.replace('</body>','<script defer src="neo2-abilities-v200.js?v=2.0.0"></script>\n</body>',1)
updated=re.sub(r'src="neo2-abilities-v200\.js(?:\?v=[^"]*)?"',
               'src="neo2-abilities-v200.js?v=2.0.0"',updated)
# 2.0: the canonical stylesheet is installed after all generated modules.
# Remove duplicate older tags first to keep repeated sync strictly idempotent.
# NEO 2.0: one synchronous skill script and one deep-AI script, between
# the real inline match engine and app.init(). Idempotent across Android/site.
for module in ('neo2-abilities-v200.js','neo2-history-team-v201.js','neo2-deep-ai-v202.js','neo2-world-v210.js','neo2-insights-v211.js','neo2-synergy-v213.js','neo2-hub-v212.js'):
    updated=re.sub(r'\s*<script\b[^>]*src="' + re.escape(module) + r'(?:\?[^"]*)?"[^>]*>\s*</script>', '', updated, flags=re.I)
app_scripts=[m for m in patterns.finditer(updated) if 'function renderScorerBoard(){' in m.group(2) and 'const $=id=>document.getElementById(id);' in m.group(2)]
if len(app_scripts)!=1:raise RuntimeError('NEO 2.0 app entrypoint missing or ambiguous: '+str(len(app_scripts)))
boot=app_scripts[0].start()
tags='<script src="neo2-abilities-v200.js?v=2.0.0"></script>\n<script src="neo2-history-team-v201.js?v=2.0.0"></script>\n<script src="neo2-deep-ai-v202.js?v=2.0.0"></script>\n<script src="neo2-world-v210.js?v=2.0.0"></script>\n<script src="neo2-insights-v211.js?v=2.0.0"></script>\n<script src="neo2-synergy-v213.js?v=2.0.0"></script>\n<script src="neo2-hub-v212.js?v=2.0.0"></script>\n'
updated=updated[:boot]+tags+updated[boot:]
for module in ('neo2-abilities-v200.js','neo2-history-team-v201.js','neo2-deep-ai-v202.js','neo2-world-v210.js','neo2-insights-v211.js','neo2-synergy-v213.js','neo2-hub-v212.js'):
    if updated.count(module+'?v=2.0.0')!=1:raise RuntimeError('NEO 2.0 module not loaded once: '+module)
print('NEO 2.0 boot order checked: inline engine → ability registry → deep AI → app')
# Normalise the two versioned stylesheets: never append a second copy.
for stylesheet in ('neo2-abilities-v200.css','neo2-hub-v212.css'):
    updated=re.sub(r'<link\b[^>]*\bhref="(?:\./)?'+re.escape(stylesheet)+r'(?:\?[^"]*)?"[^>]*>\s*','',updated,flags=re.I)
if updated.count('</head>')!=1:raise RuntimeError('Cannot attach NEO 2.0 stylesheets')
for stylesheet in ('neo2-abilities-v200.css','neo2-hub-v212.css'):
    updated=updated.replace('</head>','<link rel="stylesheet" href="'+stylesheet+'?v=2.0.0">\n</head>',1)
# Apply the current release's cache keys LAST: legacy normalization above
# intentionally rewrites generic query strings, otherwise masking new builds.
for asset in ('neo-player-data-v960.js','mobile-upgrade.js','neo-historic-teams-v970.js',
              'neo2-history-team-v201.js','neo-studio-v970.js','neo-squads-v980.js',
              'neo-round-v990.js','neo-v960.js','neo-ego-v91.js','neo-coach-v980.js',
              'neo-pc-compact.js'):
    updated=re.sub(r'src="'+re.escape(asset)+r'(?:\?v=[^"]*)?"',
                   'src="'+asset+'?v=10.6.38"',updated)
updated=re.sub(r'href="neo-squads-v980\.css(?:\?v=[^"]*)?"',
               'href="neo-squads-v980.css?v=10.6.38"',updated)
updated=re.sub(r'href="neo-pitch-v1040\.css(?:\?v=[^"]*)?"',
               'href="neo-pitch-v1040.css?v=10.6.38"',updated)
updated=re.sub(r'href="neo-desktop\.css(?:\?v=[^"]*)?"',
               'href="neo-desktop.css?v=10.6.38"',updated)
# EGO ARENA is a distinct stylesheet: keep it LAST so legacy PC density rules
# cannot undo the new stage, side channel or compact interactive modes.
updated=re.sub(r'\s*<link\b[^>]*href="neo-ego-arena-v300\.css(?:\?v=[^"]*)?"[^>]*>', '',updated,flags=re.I)
updated=updated.replace('</head>','<link rel="stylesheet" href="neo-ego-arena-v300.css?v=10.6.38">\n</head>',1)
html.write_text(updated,encoding='utf-8')
print('Inline game modules synchronized:',counts)
