import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [chromiumPath, firefoxPath] = process.argv.slice(2);
assert.ok(
  chromiumPath && firefoxPath,
  'Usage: research-compare-mig01-component-hashes <chromium> <firefox>',
);

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

function compareHashes(left, right, label) {
  assert.match(left, /^[0-9a-f]{64}$/u, `chromium ${label}: invalid hash`);
  assert.match(right, /^[0-9a-f]{64}$/u, `firefox ${label}: invalid hash`);
  return { equal: left === right, chromium: left, firefox: right };
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
  result[name] = compareHashes(
    chromium.componentHashes[name],
    firefox.componentHashes[name],
    name,
  );
}

const rulePartNames = [
  'identity',
  'revision',
  'color',
  'defaultProfileName',
  'matchProfileName',
  'format',
  'ruleList',
  'safeMetadata',
  'otherKeys',
  'otherValues',
];
const ruleParts = {};
for (const name of rulePartNames) {
  ruleParts[name] = compareHashes(
    chromium.componentHashes.corpusRulesParts[name],
    firefox.componentHashes.corpusRulesParts[name],
    `corpusRules.${name}`,
  );
}

console.log(
  JSON.stringify(
    {
      corpus: 'C/D',
      bytesEqual: chromium.bytes === firefox.bytes,
      rawShaEqual: chromium.sha256 === firefox.sha256,
      semanticShaEqual: chromium.semanticSha256 === firefox.semanticSha256,
      components: result,
      corpusRulesParts: ruleParts,
    },
    null,
    2,
  ),
);
