import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vectorDir = path.join(rootDir, 'fixtures', 'zeroomega-v2', 'vectors');
const conditionPath = path.join(vectorDir, 'condition-decisions.json');
const ruleListPath = path.join(vectorDir, 'rule-list-decisions.json');
const ruleListFixturePath = path.join(rootDir, 'fixtures', 'zeroomega-v2', 'rule-list-formats.json');

const knownConditionTypes = new Set([
  'TrueCondition',
  'FalseCondition',
  'UrlRegexCondition',
  'UrlWildcardCondition',
  'HostRegexCondition',
  'HostWildcardCondition',
  'BypassCondition',
  'KeywordCondition',
  'IpCondition',
  'HostLevelsCondition',
  'WeekdayCondition',
  'TimeCondition',
]);
const expectedSupports = new Set(['exact', 'target-dependent']);
const expectedProfiles = new Set(['fixed', 'direct']);

function fail(file, message) {
  throw new Error(`${path.basename(file)}: ${message}`);
}

function assertVectorBase(file, vector, ids) {
  if (!vector || typeof vector !== 'object' || Array.isArray(vector)) {
    fail(file, 'each vector must be an object');
  }
  if (typeof vector.id !== 'string' || vector.id.length === 0) {
    fail(file, 'each vector requires a non-empty id');
  }
  if (ids.has(vector.id)) {
    fail(file, `duplicate vector id ${JSON.stringify(vector.id)}`);
  }
  ids.add(vector.id);
  if (!expectedSupports.has(vector.support)) {
    fail(file, `${vector.id} has unsupported support classification`);
  }
  if (!vector.request || typeof vector.request !== 'object') {
    fail(file, `${vector.id} requires a request object`);
  }
  for (const field of ['url', 'host', 'scheme']) {
    if (typeof vector.request[field] !== 'string' || vector.request[field].length === 0) {
      fail(file, `${vector.id}.request.${field} must be a non-empty string`);
    }
  }
  if (!vector.expected || typeof vector.expected !== 'object') {
    fail(file, `${vector.id} requires expected results`);
  }
  if (!expectedProfiles.has(vector.expected.selectedProfileName)) {
    fail(file, `${vector.id} selects an unknown profile`);
  }
}

const conditionData = JSON.parse(await readFile(conditionPath, 'utf8'));
if (conditionData.vectorSchemaVersion !== 1) {
  fail(conditionPath, 'vectorSchemaVersion must equal 1');
}
if (!Array.isArray(conditionData.vectors) || conditionData.vectors.length < 24) {
  fail(conditionPath, 'must contain at least 24 condition vectors');
}

const conditionIds = new Set();
const coveredConditionTypes = new Set();
let targetDependentConditionCount = 0;
for (const vector of conditionData.vectors) {
  assertVectorBase(conditionPath, vector, conditionIds);
  const type = vector.condition?.conditionType;
  if (!knownConditionTypes.has(type)) {
    fail(conditionPath, `${vector.id} has unknown conditionType ${JSON.stringify(type)}`);
  }
  coveredConditionTypes.add(type);
  if (typeof vector.expected.matched !== 'boolean') {
    fail(conditionPath, `${vector.id}.expected.matched must be boolean`);
  }
  const expectedProfile = vector.expected.matched ? 'fixed' : 'direct';
  if (vector.expected.selectedProfileName !== expectedProfile) {
    fail(conditionPath, `${vector.id} selected profile disagrees with matched state`);
  }
  if (type === 'WeekdayCondition' && !Number.isInteger(vector.request.localWeekday)) {
    fail(conditionPath, `${vector.id} requires integer request.localWeekday`);
  }
  if (type === 'TimeCondition' && !Number.isInteger(vector.request.localHour)) {
    fail(conditionPath, `${vector.id} requires integer request.localHour`);
  }
  if (vector.support === 'target-dependent') {
    targetDependentConditionCount += 1;
  }
}

for (const type of knownConditionTypes) {
  if (!coveredConditionTypes.has(type)) {
    fail(conditionPath, `missing coverage for ${type}`);
  }
}
if (targetDependentConditionCount < 3) {
  fail(conditionPath, 'must retain explicit target-dependent vectors');
}

const ruleListData = JSON.parse(await readFile(ruleListPath, 'utf8'));
const ruleListFixture = JSON.parse(await readFile(ruleListFixturePath, 'utf8'));
if (ruleListData.vectorSchemaVersion !== 1) {
  fail(ruleListPath, 'vectorSchemaVersion must equal 1');
}
if (!Array.isArray(ruleListData.vectors) || ruleListData.vectors.length < 12) {
  fail(ruleListPath, 'must contain at least 12 rule-list vectors');
}

const ruleListIds = new Set(conditionIds);
const parserFamilies = new Set();
const constructs = new Set();
for (const vector of ruleListData.vectors) {
  assertVectorBase(ruleListPath, vector, ruleListIds);
  parserFamilies.add(vector.parserFamily);
  constructs.add(vector.construct);

  const profile = ruleListFixture[`+${vector.fixtureProfileName}`];
  if (!profile || profile.profileType !== 'RuleListProfile') {
    fail(ruleListPath, `${vector.id} references missing RuleListProfile`);
  }

  let source = profile.ruleList;
  if (vector.parserFamily === 'autoproxy-base64') {
    source = Buffer.from(source, 'base64').toString('utf8');
  }
  const sourceLines = source.split(/\r?\n/).map((line) => line.trim());
  if (!sourceLines.includes(vector.sourceLine)) {
    fail(ruleListPath, `${vector.id} sourceLine is absent from the referenced fixture`);
  }

  if (!knownConditionTypes.has(vector.expected.parsedConditionType)) {
    fail(ruleListPath, `${vector.id} expects an unknown parsed condition type`);
  }
  if (typeof vector.expected.parsedPattern !== 'string') {
    fail(ruleListPath, `${vector.id}.expected.parsedPattern must be a string`);
  }
  if (!['exclusive', 'normal', 'ordered'].includes(vector.expected.priorityGroup)) {
    fail(ruleListPath, `${vector.id} has an unknown priority group`);
  }
}

const requiredParserFamilies = [
  'autoproxy-plain',
  'autoproxy-base64',
  'switchy-omega',
  'switchy-legacy-wildcard',
  'switchy-legacy-regexp',
];
for (const family of requiredParserFamilies) {
  if (!parserFamilies.has(family)) {
    fail(ruleListPath, `missing parser-family coverage for ${family}`);
  }
}

const requiredConstructs = [
  'exclusive-host',
  'host-anchor',
  'url-prefix',
  'url-regex',
  'keyword',
  'generic-wildcard',
  'base64-host-anchor',
  'base64-exclusive-host',
  'explicit-result-note',
  'explicit-catch-all',
  'leading-bang-with-result',
  'exclusive-wildcard',
  'normal-wildcard',
  'regexp-section',
];
for (const construct of requiredConstructs) {
  if (!constructs.has(construct)) {
    fail(ruleListPath, `missing rule-list construct coverage for ${construct}`);
  }
}

console.log(
  `Validated ${conditionData.vectors.length} condition decisions covering ${coveredConditionTypes.size} types ` +
    `and ${ruleListData.vectors.length} rule-list decisions covering ${parserFamilies.size} parser families.`,
);
