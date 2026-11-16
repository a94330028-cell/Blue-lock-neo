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
 elif 'Season progression and competitive ranking' in inside and 'const STAR_POTENTIAL' in inside:which='progression'
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
if 'kaiser-192.png?v=9.9.1' not in updated:
    if updated.count('</head>') != 1: raise RuntimeError('Cannot install Kaiser site favicon')
    updated=updated.replace('</head>','<link rel="icon" type="image/png" href="./icons/favicon-32.png?v=9.9.1">\n<link rel="apple-touch-icon" href="./icons/kaiser-192.png?v=9.9.1">\n</head>')
# v9.9.2: invalidate previous gallery styling and new-club photo search resources.
updated=updated.replace('neo-studio-v970.js?v=9.7.0','neo-studio-v970.js?v=9.9.4')
updated=updated.replace('neo-v990.css?v=9.9.0','neo-v990.css?v=9.9.4')
# v10.0: Bust stale Mobile Edition assets when building the Android web bundle.
updated=re.sub(r'src="mobile-upgrade\.js(?:\?v=[^"]*)?"','src="mobile-upgrade.js?v=10.3.0"',updated)
updated=re.sub(r'href="mobile-upgrade\.css(?:\?v=[^"]*)?"','href="mobile-upgrade.css?v=10.3.0"',updated)
html.write_text(updated,encoding='utf-8')
print('Inline game modules synchronized:',counts)
