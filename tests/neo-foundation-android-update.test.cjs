'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const java=fs.readFileSync('app/src/main/java/com/neoegoist/simulator/MainActivity.java','utf8');
const manifest=fs.readFileSync('app/src/main/AndroidManifest.xml','utf8');
const gradle=fs.readFileSync('app/build.gradle','utf8');
const app=fs.readFileSync('web/app.js','utf8');

// This is a source-level guard, not a substitute for installing both signed
// APK versions on an Android device. It protects the assumptions that make
// Chromium's persistent-storage upgrade test relevant to the real WebView.
assert.match(gradle,/applicationId 'com\.neoegoist\.simulator'/,'Android package ID must stay stable');
assert.match(java,/private static final String HOST = "appassets\.androidplatform\.net"/);
assert.match(java,/private static final String HOME = "https:\/\/" \+ HOST \+ "\/index\.html"/);
assert.match(java,/settings\.setDomStorageEnabled\(true\)/,'localStorage must remain enabled');
assert.match(java,/settings\.setDatabaseEnabled\(true\)/,'IndexedDB must remain enabled');
assert.match(java,/webView\.loadUrl\(HOME \+ "\?web=" \+ info\.version\)/,
 'an updated bundle must reload on the existing origin');
assert.match(java,/webView\.loadUrl\(HOME \+ "\?original=1"\)/,
 'rollback must use the same origin');
assert.match(manifest,/android:allowBackup="true"/);
assert.match(java,/if \(hasCompleteBundle\(installed\)\) return version/,
 'a half-installed web update cannot be selected on Android startup');

// Asset packages may be replaced; the WebView's private storage must not be.
assert.match(java,/new File\(getFilesDir\(\), "web-updates"\)/);
assert.match(java,/hex\(digest\.digest\(\)\)\.equals\(info\.sha256\)/,
 'update ZIP must be checked before activation');
assert.match(java,/compareVersion\(info\.version, getCurrentWebVersion\(\)\) <= 0/,
 'older updates must not replace newer content');
assert.match(java,/\.setPositiveButton\("Atualizar",/, 'updates require user confirmation');
assert.match(java,/if \(destination\.exists\(\)\) \{\s*deleteRecursive\(destination\);/,
 'a stale target is replaced by the freshly verified ZIP rather than silently reused');
assert.match(java,/putString\(PREF_WEB_VERSION, info\.version\)\.commit\(\)/,
 'the installed version marker must be confirmed before activating new assets');
assert.match(java,/if \(staging != null && staging\.exists\(\)\) deleteRecursive\(staging\)/,
 'cleanup must target only the temporary update directory');
for(const forbidden of [
 /WebStorage\.getInstance\(\)\.deleteAllData\(/,
 /\.deleteDatabase\(/,
 /\.clearFormData\(/,
 /\.clearHistory\(/,
 /getDir\("app_webview"/,
 /getDataDir\(\)[\s\S]{0,80}deleteRecursive\(/,
 /localStorage\.clear\(/,
 /indexedDB\.deleteDatabase\(/
])assert.ok(!forbidden.test(java+'\n'+app),'never wipe saves or portrait databases when updating');

console.log('PASS NEO FOUNDATION ANDROID UPDATE: stable package/origin, IndexedDB, HTTPS integrity, non-destructive rollback');
