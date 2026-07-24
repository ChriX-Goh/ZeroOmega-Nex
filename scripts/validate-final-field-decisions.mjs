import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = path.join(
  rootDir,
  'fixtures',
  'capabilities',
  'legacy-final-field-decisions.json',
);
const data = JSON.parse(await readFile(fixturePath, 'utf8'));

function fail(message) {
  throw new Error(`legacy-final-field-decisions.json: ${message}`);
}

function assertExactArray(actual, expected, location) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${location} must equal ${JSON.stringify(expected)}`);
  }
}

if (data.decisionSchemaVersion !== 1) {
  fail('decisionSchemaVersion must equal 1');
}
if (
  data.target?.repository !== 'zero-peak/ZeroOmega' ||
  data.target?.release !== 'v3.5.0' ||
  data.target?.schemaVersion !== 2
) {
  fail('target must remain ZeroOmega v3.5.0 schemaVersion 2');
}

const conditionTypes = data.optionDecisions?.['-showConditionTypes'];
if (conditionTypes?.classification !== 'map') {
  fail('-showConditionTypes must be mapped');
}
assertExactArray(
  conditionTypes.legacyAcceptedValues,
  [0, 1],
  'optionDecisions.-showConditionTypes.legacyAcceptedValues',
);
if (conditionTypes.affectsRouting !== false) {
  fail('-showConditionTypes must not affect routing');
}
if (conditionTypes.advancedRulesForceEditorVisibility !== true) {
  fail('advanced rules must force editor visibility');
}

const legacyExport = data.optionDecisions?.['-exportLegacyRuleList'];
if (legacyExport?.classification !== 'map') {
  fail('-exportLegacyRuleList must be mapped');
}
assertExactArray(
  legacyExport.legacyAcceptedValues,
  [false, true],
  'optionDecisions.-exportLegacyRuleList.legacyAcceptedValues',
);
if (legacyExport.affectsRouting !== false) {
  fail('-exportLegacyRuleList must not affect routing');
}
if (legacyExport.requiresLosslessRepresentability !== true) {
  fail('legacy rule-list export must require lossless representability');
}
if (legacyExport.fallbackFormat !== 'switchy-omega-modern') {
  fail('legacy export fallback must remain the modern format');
}

const syncInputs = data.syncAccountInputs;
assertExactArray(
  syncInputs?.syncBackendType?.acceptedValues,
  ['gist', 'webdav'],
  'syncAccountInputs.syncBackendType.acceptedValues',
);
if (syncInputs?.gistToken?.classification !== 'secret-ref') {
  fail('gistToken must remain a secret reference');
}
if (syncInputs?.useBuiltInSync?.classification !== 'operation-only') {
  fail('useBuiltInSync must remain operation-only');
}
if (syncInputs?.useBuiltInSync?.persistentProfileField !== false) {
  fail('useBuiltInSync must not become a persistent ProfileSpec field');
}

const expectedRuntimeDecisions = {
  syncBackendTypeManuallySet: 'ignore-runtime',
  gistUrl: 'ignore-generated',
  backendTypes: 'program-constant',
  lastGistSync: 'ignore-runtime',
  lastGistState: 'ignore-runtime',
  alertType: 'ignore-runtime',
  enableOptionsSyncing: 'ignore-runtime',
  syncOptions: 'ignore-runtime',
  'web.restoreOnlineUrl': 'restore-ui-state',
};
for (const [field, expected] of Object.entries(expectedRuntimeDecisions)) {
  if (data.syncDerivedAndRuntime?.[field] !== expected) {
    fail(`syncDerivedAndRuntime.${field} must equal ${expected}`);
  }
}

if (data.idn?.classification !== 'target-dependent') {
  fail('IDN must be explicitly target-dependent');
}
for (const field of [
  'preserveOriginalText',
  'produceCanonicalAscii',
  'requiresChromiumFirefoxDifferentialVectors',
]) {
  if (data.idn?.[field] !== true) {
    fail(`idn.${field} must equal true`);
  }
}
if (data.idn?.rewriteDisplayTextSilently !== false) {
  fail('IDN display text must not be silently rewritten');
}

const expectedUnknownDecisions = {
  safeMetadata: 'preserve',
  secretLike: 'secret-ref-or-reject',
  generatedCache: 'quarantine-until-classified',
  routingExecutablePermissionOrNetworkBehavior: 'reject',
  unclearRuntimeOrAccountState: 'outside-profile-spec-or-reject',
};
for (const [field, expected] of Object.entries(expectedUnknownDecisions)) {
  if (data.unknownFields?.[field] !== expected) {
    fail(`unknownFields.${field} must equal ${expected}`);
  }
}

assertExactArray(data.remainingInvestigateFields, [], 'remainingInvestigateFields');

console.log(
  'Validated final field closure: editor/export preferences, complete sync UI boundaries, ' +
    'explicit IDN defer, unknown-field policy, and zero remaining investigate fields.',
);
