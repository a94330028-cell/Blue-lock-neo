'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const gradle = read('app/build.gradle');
const cert = read('app/RELEASE_CERT_SHA256').trim();
const workflow = read('.github/workflows/gerar-apk.yml');
const generator = read('tools/new_android_signing_key.py');

assert.match(gradle, /versionCode 120\b/, 'new binary increases Android versionCode');
assert.match(gradle, /storeType 'pkcs12'/, 'release uses the generated PKCS12 keystore');
assert.match(cert, /^[a-f0-9]{64}$/, 'pinned public certificate SHA-256 is valid');
assert.match(workflow, /name: Verificar identidade permanente do certificado Android/);
assert.match(workflow, /APKSIGNER.*verify --print-certs/, 'compiled signed APK must be verified');
assert.match(workflow, /if \[ "\$ACTUAL" != "\$EXPECTED" \]; then/, 'unexpected signing keys cannot be published');
assert.match(workflow, /tag_name: \$\{\{ steps\.release_info\.outputs\.tag \}\}/,
 'public APK uses an Android/content-specific release tag');
assert.match(workflow, /TAG="v\$\{VERSION\}-android-\$\{CONTENT_BUILD\}"/);
assert.match(workflow, /if: github\.ref == 'refs\/heads\/main' && env\.BUILD_SIGNED == '1' && steps\.unique_release\.outputs\.exists == '0'/);
assert.match(workflow, /Exporte tanto o backup da temporada/, 'old-signature installs are warned to back up first');
assert.match(generator, /secrets\.token_urlsafe\(48\)/, 'new keystore password must be random');
assert.match(generator, /never commit/i, 'private key must stay outside the repo');
assert.ok(!fs.existsSync(path.join(root, 'app', 'release-key.p12')),
 'no private signing key can be committed to the app tree');
console.log('PASS ANDROID SIGNING: permanent certificate pin, fresh release tag, backups and no Debug APK publication');
