import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FIXED_PROFILE_COUNT,
  LARGE_FIXTURE_PATH,
  RULE_LIST_LINES,
  RULE_LIST_PROFILE_COUNT,
  RULES_PER_SWITCH,
  SWITCH_PROFILE_COUNT,
  serializeLargeLegacyFixture,
} from './large-legacy-fixture-lib.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = path.join(rootDir, LARGE_FIXTURE_PATH);
const actual = await readFile(fixturePath, 'utf8');
const expected = serializeLargeLegacyFixture();

function fail(message) {
  throw new Error(`large-representative.json: ${message}`);
}

if (actual !== expected) {
  fail('committed file differs from deterministic generator output');
}

const data = JSON.parse(actual);
const profiles = Object.entries(data).filter(([key]) => key.startsWith('+'));
const fixedProfiles = profiles.filter(([, profile]) => profile.profileType === 'FixedProfile');
const switchProfiles = profiles.filter(([, profile]) => profile.profileType === 'SwitchProfile');
const ruleListProfiles = profiles.filter(([, profile]) => profile.profileType === 'RuleListProfile');

if (fixedProfiles.length !== FIXED_PROFILE_COUNT) {
  fail(`expected ${FIXED_PROFILE_COUNT} FixedProfiles, received ${fixedProfiles.length}`);
}
if (switchProfiles.length !== SWITCH_PROFILE_COUNT) {
  fail(`expected ${SWITCH_PROFILE_COUNT} SwitchProfiles, received ${switchProfiles.length}`);
}
if (ruleListProfiles.length !== RULE_LIST_PROFILE_COUNT) {
  fail(`expected ${RULE_LIST_PROFILE_COUNT} RuleListProfiles, received ${ruleListProfiles.length}`);
}

const switchRuleCount = switchProfiles.reduce((sum, [, profile]) => sum + profile.rules.length, 0);
const expectedSwitchRuleCount = SWITCH_PROFILE_COUNT * RULES_PER_SWITCH;
if (switchRuleCount !== expectedSwitchRuleCount) {
  fail(`expected ${expectedSwitchRuleCount} switch rules, received ${switchRuleCount}`);
}

for (const [key, profile] of switchProfiles) {
  if (profile.rules.length !== RULES_PER_SWITCH) {
    fail(`${key} must contain exactly ${RULES_PER_SWITCH} rules`);
  }
}

for (const [key, profile] of ruleListProfiles) {
  const lines = profile.ruleList.split('\n');
  const expectedLines = RULE_LIST_LINES + 2;
  if (lines.length !== expectedLines) {
    fail(`${key}.ruleList must contain ${expectedLines} deterministic lines`);
  }
  if (!profile.sourceUrl.endsWith('.example.invalid/list.txt')) {
    fail(`${key}.sourceUrl must use a reserved .invalid domain`);
  }
}

const byteLength = Buffer.byteLength(actual, 'utf8');
if (byteLength < 200_000) {
  fail(`fixture is too small to exercise large-import paths (${byteLength} bytes)`);
}
if (byteLength > 1_000_000) {
  fail(`fixture exceeds the one-megabyte research budget (${byteLength} bytes)`);
}

if (data['-startupProfileName'] !== 'switch-00') {
  fail('-startupProfileName must remain switch-00');
}
if (!Array.isArray(data['-quickSwitchProfiles']) || data['-quickSwitchProfiles'].length !== 7) {
  fail('-quickSwitchProfiles must contain seven deterministic entries');
}

console.log(
  `Validated deterministic large fixture: ${profiles.length} profiles, ` +
    `${switchRuleCount} switch rules, ${RULE_LIST_PROFILE_COUNT * RULE_LIST_LINES} rule-list entries, ` +
    `${byteLength} bytes.`,
);
