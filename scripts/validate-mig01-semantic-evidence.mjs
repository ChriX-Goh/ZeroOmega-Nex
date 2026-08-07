import assert from 'node:assert/strict';

import { readEvidence } from './mig01-semantic-evidence.mjs';

const [chromiumPath, firefoxPath] = process.argv.slice(2);
assert.ok(
  chromiumPath && firefoxPath,
  'Usage: validate-mig01-semantic-evidence <chromium> <firefox>',
);

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
    assert.equal(
      Object.keys(row).every((key) => allowedSemanticKeys.has(key)),
      true,
      `${browser}/${row.corpus}: unexpected evidence field`,
    );
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
  assert.equal(
    Object.keys(leak).every((key) => allowedSecretKeys.has(key)),
    true,
    `${browser}: unexpected secret-leak evidence field`,
  );
  for (const key of [
    'uiClean',
    'commandClean',
    'workflowStorageClean',
    'exportClean',
    'reimportClean',
  ]) {
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
  assert.equal(
    left.semanticSha256,
    right.semanticSha256,
    `${corpus}: Chromium/Firefox canonical semantic projection mismatch`,
  );
  if (left.sha256 !== right.sha256 || left.bytes !== right.bytes) {
    console.log(
      `${corpus}: raw export differs across browsers; retained as diagnostics only ` +
        `(chromium bytes=${left.bytes} sha=${left.sha256}, firefox bytes=${right.bytes} sha=${right.sha256}).`,
    );
  }
}
console.log('MIG-01.7 canonical semantic evidence is cross-browser equivalent and secret-leak clean.');
