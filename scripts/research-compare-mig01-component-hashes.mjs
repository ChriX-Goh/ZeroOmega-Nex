import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [chromiumPath, firefoxPath] = process.argv.slice(2);
assert.ok(chromiumPath && firefoxPath, 'Usage: research-compare-mig01-component-hashes <chromium> <firefox>');

async function readRow(path, browser) {
  const rows = (await readFile(path, 'utf8'))
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const row = rows.find((candidate) => candidate.kind === 'semantic' && candidate.corpus === 'C/D');
  assert.ok(row, `${browser}: missing C/D semantic row`);
  assert.equal(row.browser, browser);
  assert.ok(row.componentHashes && typeof row.componentHashes === 'object');
  return row;
}

const chromium = await readRow(chromiumPath, 'chromium');
const firefox = await readRow(firefoxPath, 'firefox');
const componentNames = [
  'settings',
  'corpusProxy',
  'innerSwitch',
  'virtualRoute',
  'corpusRules',
  'outerSwitch',
  'unicodePac',
];

const result = {};
for (const name of componentNames) {
  const left = chromium.componentHashes[name];
  const right = firefox.componentHashes[name];
  assert.match(left, /^[0-9a-f]{64}$/u, `chromium ${name}: invalid hash`);
  assert.match(right, /^[0-9a-f]{64}$/u, `firefox ${name}: invalid hash`);
  result[name] = { equal: left === right, chromium: left, firefox: right };
}

console.log(JSON.stringify({
  corpus: 'C/D',
  bytesEqual: chromium.bytes === firefox.bytes,
  rawShaEqual: chromium.sha256 === firefox.sha256,
  semanticShaEqual: chromium.semanticSha256 === firefox.semanticSha256,
  components: result,
}, null, 2));
