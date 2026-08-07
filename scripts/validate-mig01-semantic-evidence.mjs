import assert from 'node:assert/strict';

import { readEvidence } from './mig01-semantic-evidence.mjs';

const [chromiumPath, firefoxPath] = process.argv.slice(2);
assert.ok(chromiumPath && firefoxPath, 'Usage: validate-mig01-semantic-evidence <chromium> <firefox>');

const allowedSemanticKeys = new Set([
  'kind',
  'browser',
  'corpus',
  'bytes',
  'sha256',
  'semanticSha256',
  'reimportAccepted',
  'persistentMutation',
  'secretScanClean',
]);
const allowedSecretKeys = new Set([
  'kind',
  'browser',
  'corpus',
  'uiClean',
  'commandClean',
  'workflowStorageClean',
  'exportClean',
  'reimportClean',
  'persistentMutation',
]);

function validateRows(rows, browser) {
  assert.equal(rows.length, 4, `${browser}: expected 4 MIG-01.7 evidence rows`);
  const semantic = rows.filter((row) => row.kind === 'semantic');
  const secret = rows.filter((row) => row.kind === 'secret-leak');
  assert.deepEqual(
    semantic.map((row) => row.corpus).sort(),
    ['A', 'C/D', 'large'],
    `${browser}: semantic corpus set mismatch`,
  );
  assert.equal(secret.length, 1, `${browser}: expected one secret-leak row`);
  for (const row of semantic) {
    assert.equal(row.browser, browser);
    assert.deepEqual(Object.keys(row).every((key) => allowedSemanticKeys.has(key)), true);
    assert.equal(row.bytes > 0, true);
    assert.match(row.sha256, /^[0-9a-f]{64}$/u);
    assert.match(row.semanticSha256, /^[0-9a-f]{64}$/u);
    assert.equal(row.reimportAccepted, true);
    assert.equal(row.persistentMutation, false);
    assert.equal(row.secretScanClean, true);
  }
  const leak = secret[0];
  assert.equal(leak.browser, browser);
  assert.equal(leak.corpus, 'sensitive');
  assert.deepEqual(Object.keys(leak).every((key) => allowedSecretKeys.has(key)), true);
  for (const key of ['uiClean', 'commandClean', 'workflowStorageClean', 'exportClean', 'reimportClean']) {
    assert.equal(leak[key], true, `${browser}: ${key} failed`);
  }
  assert.equal(leak.persistentMutation, false);
  return { semantic, leak };
}

const chromium = validateRows(await readEvidence(chromiumPath), 'chromium');
const firefox = validateRows(await readEvidence(firefoxPath), 'firefox');
for (const corpus of ['A', 'C/D', 'large']) {
  const left = chromium.semantic.find((row) => row.corpus === corpus);
  const right = firefox.semantic.find((row) => row.corpus === corpus);
  assert.deepEqual(
    { bytes: left.bytes, sha256: left.sha256, semanticSha256: left.semanticSha256 },
    { bytes: right.bytes, sha256: right.sha256, semanticSha256: right.semanticSha256 },
    `${corpus}: Chromium/Firefox semantic export mismatch`,
  );
}
console.log('MIG-01.7 semantic evidence is cross-browser equivalent and secret-leak clean.');
