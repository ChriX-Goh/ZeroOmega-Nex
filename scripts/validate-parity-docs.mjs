import { readFile } from 'node:fs/promises';

const graphPath = 'docs/ORIGINAL_KNOWLEDGE_GRAPH.md';
const auditPath = 'docs/UI_AUDIT_MATRIX.md';
const indexPath = 'docs/ORIGINAL_PARITY_MATRIX.md';
const decisionsPath = 'docs/DECISIONS.md';
const activationTestPath = 'apps/extension/src/lib/profile-workflow-activation.test.ts';
const legacyDecodePath = 'packages/legacy-zeroomega/src/decode.ts';
const legacyImportTestPath = 'packages/legacy-zeroomega/src/import.test.ts';
const schemaV1FixturePath = 'fixtures/zeroomega-v2/schema-v1-auto-detect.json';
const manifestConfigPath = 'apps/extension/wxt.config.ts';
const visualEvidenceScriptPath = 'scripts/capture-visual-evidence.mjs';
const visualEvidenceWorkflowPath = '.github/workflows/m8-visual-evidence.yml';
const proxyPermissionClientPath = 'apps/extension/src/lib/proxy-auth-permission-client.ts';
const proxyChallengeServerPath = 'scripts/e2e-basic-auth-proxy.mjs';
const chromiumE2ePath = 'scripts/e2e-chromium.mjs';
const firefoxE2ePath = 'scripts/e2e-firefox.mjs';
const sessionCheckpointPath = 'docs/MILESTONE_8_SESSION_7_CHECKPOINT.md';

const [
  graph,
  audit,
  index,
  decisions,
  activationTest,
  legacyDecode,
  legacyImportTest,
  schemaV1Fixture,
  manifestConfig,
  visualEvidenceScript,
  visualEvidenceWorkflow,
  proxyPermissionClient,
  proxyChallengeServer,
  chromiumE2e,
  firefoxE2e,
  sessionCheckpoint,
] = await Promise.all([
  readFile(graphPath, 'utf8'),
  readFile(auditPath, 'utf8'),
  readFile(indexPath, 'utf8'),
  readFile(decisionsPath, 'utf8'),
  readFile(activationTestPath, 'utf8'),
  readFile(legacyDecodePath, 'utf8'),
  readFile(legacyImportTestPath, 'utf8'),
  readFile(schemaV1FixturePath, 'utf8'),
  readFile(manifestConfigPath, 'utf8'),
  readFile(visualEvidenceScriptPath, 'utf8'),
  readFile(visualEvidenceWorkflowPath, 'utf8'),
  readFile(proxyPermissionClientPath, 'utf8'),
  readFile(proxyChallengeServerPath, 'utf8'),
  readFile(chromiumE2ePath, 'utf8'),
  readFile(firefoxE2ePath, 'utf8'),
  readFile(sessionCheckpointPath, 'utf8'),
]);

const [browserTargetCapabilities, optionsApp, newProfileDialog, componentRendering] =
  await Promise.all([
    readFile('apps/extension/src/lib/browser-target-capabilities.ts', 'utf8'),
    readFile('apps/extension/src/entrypoints/options/App.svelte', 'utf8'),
    readFile('apps/extension/src/entrypoints/options/NewProfileDialog.svelte', 'utf8'),
    readFile('apps/extension/src/component-rendering.component.spec.ts', 'utf8'),
  ]);

const [
  profileOperations,
  profileWorkflowIndex,
  renameDialog,
  renameOptionsApp,
  renameComponentRendering,
] = await Promise.all([
  readFile('packages/profile-workflow/src/profile-operations.ts', 'utf8'),
  readFile('packages/profile-workflow/src/index.ts', 'utf8'),
  readFile('apps/extension/src/entrypoints/options/ProfileRenameDialog.svelte', 'utf8'),
  readFile('apps/extension/src/entrypoints/options/App.svelte', 'utf8'),
  readFile('apps/extension/src/component-rendering.component.spec.ts', 'utf8'),
]);

const [
  proxyProtocolCapabilities,
  pacProtocolCapabilities,
  fixedProtocolEditor,
  protocolBrowserTargetCapabilities,
  protocolComponentRendering,
] = await Promise.all([
  readFile('packages/pac-compiler/src/proxy-capabilities.ts', 'utf8'),
  readFile('packages/pac-compiler/src/capabilities.ts', 'utf8'),
  readFile('apps/extension/src/entrypoints/options/FixedProfileEditor.svelte', 'utf8'),
  readFile('apps/extension/src/lib/browser-target-capabilities.ts', 'utf8'),
  readFile('apps/extension/src/component-rendering.component.spec.ts', 'utf8'),
]);

const [
  switchConditionCatalog,
  switchConditionEditor,
  switchConditionMatrix,
  switchConditionCatalogTest,
] = await Promise.all([
  readFile('apps/extension/src/lib/switch-condition-catalog.ts', 'utf8'),
  readFile('apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte', 'utf8'),
  readFile('docs/SWITCH_CONDITION_MATRIX.md', 'utf8'),
  readFile('apps/extension/src/lib/switch-condition-catalog.test.ts', 'utf8'),
]);

const failures = [];

function requireAll(documentName, document, tokens) {
  for (const token of tokens) {
    if (!document.includes(token)) failures.push(`${documentName} is missing: ${token}`);
  }
}

requireAll('knowledge graph', graph, [
  'zero-peak/ZeroOmega',
  'v3.5.0',
  '8625759489',
  'FixedProfile',
  'SwitchProfile',
  'RuleListProfile',
  'PacProfile',
  'VirtualProfile',
  'http://wpad/wpad.dat',
  'MUST_MATCH',
  'REFERENCE',
  'UNCERTAIN',
  'INTENTIONAL_DIVERGENCE',
  'NOT_PORTING',
  '更新协议',
]);

requireAll('session 7 checkpoint', sessionCheckpoint, [
  'ffa5a25d8679706bd0b77b3d729a2d0ca5bb93bb',
  '30410949018',
  'directTargetCount: 1',
  '94%',
  'Governance drift found',
]);

requireAll('UI audit', audit, [
  'zero-peak/ZeroOmega v3.5.0',
  'MUST_MATCH',
  'REFERENCE',
  'UNCERTAIN',
  'INTENTIONAL_DIVERGENCE',
  'NOT_PORTING',
  'DONE',
  'PARTIAL',
  'MISSING',
  'BROKEN',
  'UNVERIFIED',
  'A-04',
  'C-01',
  'D-02',
  'E-01',
  'F-09',
  'F-12',
  'G-01',
  'G-02',
  'G-13',
  'G-14',
  'G-15',
  'H-09',
  'I-05',
  'J-10',
]);

requireAll('schema-v1 decoder', legacyDecode, [
  'schema.v1-auto-detect-wpad-created',
  'schema.v1-upgraded',
  'profile.disabled-sync-state-removed',
  'http://wpad/wpad.dat',
  '#00cccc',
  'switchyRuleListReferencesAutoDetect',
]);

requireAll('schema-v1 importer regression', legacyImportTest, [
  "fixture('schema-v1-auto-detect.json')",
  "url: 'http://wpad/wpad.dat'",
  "color: '#00cccc'",
  "codes(result)).toContain('schema.v1-upgraded')",
]);

requireAll('schema-v1 source fixture', schemaV1Fixture, [
  '"schemaVersion": 1',
  '"profileName": "auto_detect"',
  '"syncOptions": "disabled"',
]);

requireAll('remote sync scope decisions', decisions, [
  'ADR-016',
  'Defer GitHub Gist synchronization beyond the first browser release',
  'ADR-017',
  'Defer WebDAV synchronization beyond the first browser release',
  'ADR-018',
  'Do not port original credential-bearing browser sync enhancement',
  'gistToken',
  'zeroomega-commit.txt',
  'INTENTIONAL_DIVERGENCE',
]);

for (const [rowId, classification, adr] of [
  ['G-13', 'NOT_PORTING', 'ADR-016'],
  ['G-14', 'NOT_PORTING', 'ADR-017'],
  ['G-15', 'INTENTIONAL_DIVERGENCE', 'ADR-018'],
]) {
  const row = audit.split('\n').find((line) => line.startsWith(`| ${rowId} `));
  if (
    !row ||
    !row.includes(`| ${classification}`) ||
    !row.includes('| DONE') ||
    !row.includes(adr)
  ) {
    failures.push(`${rowId} must be DONE with ${classification} and ${adr}`);
  }
}

requireAll('production manifest storage boundary', manifestConfig, [
  "'storage'",
  "optional_host_permissions: ['http://*/*', 'https://*/*']",
]);
if (manifestConfig.includes('storage.sync') || manifestConfig.includes("'sync'")) {
  failures.push(
    'production manifest/config must not add browser sync storage for credential propagation',
  );
}

requireAll('visual evidence script', visualEvidenceScript, [
  "{ locale: 'zh-CN', theme: 'light' }",
  "{ locale: 'zh-CN', theme: 'dark' }",
  "{ locale: 'zh-TW', theme: 'light' }",
  "{ locale: 'zh-TW', theme: 'dark' }",
  "'options-general'",
  "'fixed-profile'",
  "'import-export'",
  "'popup'",
  "'temporary-rules'",
  "'network'",
  'manifest.sha256',
  'entries.length, combinations.length * surfaces.length',
]);

requireAll('visual evidence workflow', visualEvidenceWorkflow, [
  'Milestone 8 Visual Evidence',
  'pnpm evidence:visual',
  'm8-visual-evidence-${{ github.event.pull_request.head.sha || github.sha }}',
  'retention-days: 30',
]);

requireAll('proxy authentication permission boundary', proxyPermissionClient, [
  'profileSpecUsesProxyAuthentication',
  'runWithProxyAuthenticationPermission',
  "['webRequest', 'webRequestAuthProvider']",
  "['webRequest', 'webRequestBlocking']",
  'PROXY_AUTH_PERMISSION_ORIGINS',
  'return { granted: false }',
]);

requireAll('controlled proxy challenge server', proxyChallengeServer, [
  '407',
  'proxy-authenticate',
  'Basic realm="ZeroOmega Nex E2E"',
  'timingSafeEqual',
  'targetAuthorizedCount',
  'zeroomega-auth-target.test',
  'data-proxy-auth-success',
]);

requireAll('proxy protocol target matrix', proxyProtocolCapabilities, [
  'PROXY_PROTOCOLS',
  'FIXED_PROXY_SLOTS',
  "'web-request-407'",
  "'client-ipv4-only'",
  "'proxy-side'",
  "'browser-target-default'",
  "'browser-request-removed'",
]);
requireAll('PAC protocol capability enforcement', pacProtocolCapabilities, [
  'fixed-slot.ftp-browser-request-removed',
  'endpoint.socks-authentication-unsupported',
  'dns-target-dependent',
]);
for (const forbiddenToken of [
  'data-fixed-protocol-capabilities',
  'data-browser-target',
  'data-proxy-protocol-capability',
  'data-fixed-ftp-capability',
  'fixedProxySlotCapability',
  'proxyProtocolCapability',
]) {
  if (fixedProtocolEditor.includes(forbiddenToken)) {
    failures.push(`Fixed editor must not expose engineering capability UI: ${forbiddenToken}`);
  }
}
requireAll('browser family capability', protocolBrowserTargetCapabilities, [
  "target: 'chromium' | 'firefox'",
  'browser_specific_settings',
]);
requireAll('protocol capability component rendering', protocolComponentRendering, [
  "not.toContain('data-fixed-protocol-capabilities')",
]);
requireAll('protocol capability Chromium acceptance', chromiumE2e, [
  'matrix-socks4.invalid',
  'matrix-socks5.invalid',
  "protocols.ftp !== 'socks5'",
]);
requireAll('protocol capability Firefox acceptance', firefoxE2e, [
  "['http', 'https', 'socks4', 'socks5']",
]);
requireAll('FTP and protocol decision', decisions, [
  'ADR-019',
  'browser FTP requests',
  'SOCKS credentials remain unsupported',
]);

const ftpRow = audit.split('\n').find((line) => line.startsWith('| C-05 '));
const protocolRow = audit.split('\n').find((line) => line.startsWith('| C-09 '));
if (!ftpRow || !ftpRow.includes('| DONE') || !ftpRow.includes('ADR-019')) {
  failures.push('C-05 must remain DONE with ADR-019 modern FTP resolution');
}
if (!protocolRow || !protocolRow.includes('| DONE') || !protocolRow.includes('Chromium/Firefox')) {
  failures.push('C-09 must remain DONE with dual-browser protocol matrix evidence');
}

requireAll('Profile Rename workflow operation', profileOperations, [
  'renameProfileDraft',
  'profile name is required',
  'profile name is reserved',
  'profile name already exists',
  '__ruleListOf_${name}',
  '${name} attached rules',
]);
requireAll('Profile Rename export', profileWorkflowIndex, ['renameProfileDraft']);
requireAll('Profile Rename dialog', renameDialog, [
  'data-profile-rename-dialog',
  'data-profile-rename-name-input',
  'data-profile-rename-confirm',
  "'newProfile.error.empty'",
  "'newProfile.error.reserved'",
  "'newProfile.error.conflict'",
]);
requireAll('Profile Rename Options wiring', renameOptionsApp, [
  'data-profile-rename-action',
  'requestSelectedProfileRename',
  "uiText('options.confirm.rename', locale)",
  'renameProfileDraft',
  '<ProfileRenameDialog',
]);
if (renameOptionsApp.includes('onchange={(event) => updateProfileName')) {
  failures.push('Profile page must not restore the direct inline name editor');
}
requireAll('Profile Rename component rendering', renameComponentRendering, [
  'ProfileRenameDialog',
  'data-profile-rename-dialog',
  '重命名情景模式',
]);
requireAll('Profile Rename Chromium acceptance', chromiumE2e, [
  'data-profile-rename-action',
  'Rename dialog opened before the dirty Draft was applied',
  'Rename did not remain inside the Draft boundary before Apply',
  'Chromium E2E Proxy',
]);
requireAll('Profile Rename Firefox acceptance', firefoxE2e, [
  'data-profile-rename-action',
  'data-profile-rename-dialog',
  'Firefox E2E Proxy',
  'Firefox Rename did not commit through normal Apply',
]);

const renameRow = audit.split('\n').find((line) => line.startsWith('| B-03 '));
if (!renameRow || !renameRow.includes('| DONE') || !renameRow.includes('Chromium/Firefox')) {
  failures.push('B-03 must remain DONE with dual-browser Rename evidence');
}

requireAll('PAC target capability module', browserTargetCapabilities, [
  'proxy-script-registration',
  'missing-proxy-settings',
  'proxy-settings',
  'currentBrowserTargetCapabilities',
]);
requireAll('PAC target capability wiring', optionsApp, [
  'currentBrowserTargetCapabilities',
  'pacCapability={browserTargetCapabilities.pacProfiles}',
]);
requireAll('PAC unsupported New Profile branch', newProfileDialog, [
  'data-pac-profile-supported',
  'data-pac-profile-capability-reason',
  "uiText('newProfile.pac.unsupported', locale)",
]);
requireAll('PAC capability component rendering', componentRendering, [
  "reason: 'proxy-settings'",
  "reason: 'proxy-script-registration'",
  'data-pac-profile-supported',
]);
requireAll('PAC target capability Chromium acceptance', chromiumE2e, [
  "Object.defineProperty(chrome.proxy, 'registerProxyScript'",
  "'data-pac-profile-supported'",
  "'proxy-script-registration'",
  'data-new-profile-kind',
]);

const pacCapabilityRow = audit.split('\n').find((line) => line.startsWith('| A-12 '));
if (
  !pacCapabilityRow ||
  !pacCapabilityRow.includes('| DONE') ||
  !pacCapabilityRow.includes('Chromium')
) {
  failures.push('A-12 must remain DONE with target capability and Chromium evidence');
}

requireAll('unified four-profile creation', chromiumE2e, [
  'creationUserDataDir',
  "name: 'Created Fixed'",
  "name: 'Created Switch'",
  "name: 'Created PAC'",
  "name: 'Created Virtual'",
  'The four normal New Profile flows did not converge in Draft',
  'The four normal New Profile flows did not commit through normal Apply',
]);

const fourProfileRow = audit.split('\n').find((line) => line.startsWith('| J-04 '));
if (!fourProfileRow || !fourProfileRow.includes('| DONE') || !fourProfileRow.includes('Chromium')) {
  failures.push('J-04 must remain DONE with unified Chromium creation evidence');
}

requireAll('Chromium real proxy challenge', chromiumE2e, [
  'createBasicAuthProxyChallengeServer',
  "permissions: ['webRequest', 'webRequestAuthProvider']",
  'Chromium proxy never emitted a real 407 challenge',
  'targetAuthorizedCount >= 1',
]);

requireAll('Firefox real proxy challenge', firefoxE2e, [
  'createBasicAuthProxyChallengeServer',
  "permissions: ['webRequest', 'webRequestBlocking']",
  "key.includes('/secret/') ? '<redacted>' : value",
  'Firefox port input did not re-enable after committing the proxy host',
  'Firefox Fixed editor did not persist the dynamic proxy endpoint before authentication',
  'Firefox proxy never emitted a real 407 challenge',
  'targetAuthorizedCount >= 1',
  'Firefox broad proxy-authentication permission remained after returning Direct',
]);

const fixedAuthRow = audit.split('\n').find((line) => line.startsWith('| C-08 '));
if (!fixedAuthRow || !fixedAuthRow.includes('| DONE') || !fixedAuthRow.includes('407')) {
  failures.push('C-08 must remain DONE with real 407 evidence');
}

requireAll('file PAC decision', decisions, [
  'ADR-015',
  'Preserve but do not activate local `file:` PAC URLs',
  'INTENTIONAL_DIVERGENCE',
  'silently activate an old cached script',
]);

requireAll('file PAC activation regression', activationTest, [
  "for (const family of ['chromium', 'firefox'] as const)",
  "rejects.toThrow('local file URL')",
  'expect(authentication.preparedBindings).toEqual([])',
  'expect(runtimeCreated).toBe(false)',
  'expect(proxy.installCount).toBe(0)',
]);

requireAll('parity index', index, [
  'ORIGINAL_KNOWLEDGE_GRAPH.md',
  'UI_AUDIT_MATRIX.md',
  'PR #11 remains Draft',
]);

requireAll('source-backed Switch condition catalog', switchConditionCatalog, [
  'ORIGINAL_SWITCH_BASIC_CONDITION_GROUPS',
  'ORIGINAL_SWITCH_ADVANCED_CONDITION_GROUPS',
  'SOURCE_ONLY_SWITCH_CONDITION_KINDS',
  "'true'",
  "'bypass'",
  "value: 'host-levels'",
  "value: 'weekday'",
  "value: 'time'",
]);
requireAll('Switch condition field UI', switchConditionEditor, [
  'data-switch-condition-selectable-option',
  'data-switch-source-only-condition-option',
  'data-switch-false-annotation',
  'data-switch-condition-field="ipNetwork"',
  'data-switch-host-wildcard-warning',
  'data-switch-normalize-true-condition',
]);
requireAll('Switch condition matrix document', switchConditionMatrix, [
  'HostWildcardCondition',
  'IpCondition',
  'TrueCondition',
  'BypassCondition',
  'invalid-regex rejection',
  'Chromium',
  'Firefox',
]);
requireAll('Switch condition catalog regression', switchConditionCatalogTest, [
  "['host-wildcard', 'host-regex', 'host-levels', 'ip']",
  "['weekday', 'time', 'false']",
  'SOURCE_ONLY_SWITCH_CONDITION_KINDS',
]);
requireAll('Switch condition Chromium acceptance', chromiumE2e, [
  'Source-only True/Bypass conditions leaked into the ordinary original selector',
  'Strict Apply did not reject the invalid regular expression while preserving Draft',
  'data-switch-condition-field="ipNetwork"',
  'Switch source round trip did not restore the weekday field state',
]);
requireAll('Switch condition Firefox acceptance', firefoxE2e, [
  'Firefox ordinary Switch selector exposed source-only conditions',
  'data-switch-condition-field="ipNetwork"',
  "'host-wildcard'",
  "'false'",
]);
for (const rowId of ['D-04', 'D-05']) {
  const row = audit.split('\n').find((line) => line.startsWith(`| ${rowId} `));
  if (!row || !row.includes('| DONE') || !row.includes('Chromium') || !row.includes('Firefox')) {
    failures.push(`${rowId} must remain DONE with dual-browser Switch condition evidence`);
  }
}

const auditRowLines = audit.split('\n').filter((line) => /^\|\s+[A-J]-\d+\s+\|/u.test(line));
if (auditRowLines.length < 120) {
  failures.push(`UI audit has ${auditRowLines.length} classified rows; expected at least 120`);
}

const validClassifications = [
  'MUST_MATCH',
  'REFERENCE',
  'UNCERTAIN',
  'INTENTIONAL_DIVERGENCE',
  'NOT_PORTING',
];
const validStatuses = ['DONE', 'PARTIAL', 'MISSING', 'BROKEN', 'UNVERIFIED'];
const statusCounts = Object.fromEntries(validStatuses.map((status) => [status, 0]));

for (const line of auditRowLines) {
  const columns = line.split('|').map((column) => column.trim());
  const rowId = columns[1];
  const classificationIndex = columns.findIndex((column) => validClassifications.includes(column));
  if (classificationIndex === -1) {
    failures.push(`${rowId} has no valid classification column`);
    continue;
  }
  const status = columns[classificationIndex + 1];
  if (!validStatuses.includes(status)) {
    failures.push(`${rowId} has invalid Nex status: ${status || '<empty>'}`);
    continue;
  }
  statusCounts[status] += 1;
}

if (statusCounts.DONE === 0) failures.push('UI audit has no DONE rows');

if (failures.length > 0) {
  console.error('Parity documentation validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const openCount =
  statusCounts.PARTIAL + statusCounts.MISSING + statusCounts.BROKEN + statusCounts.UNVERIFIED;
console.log(
  `Parity documentation passed: ${auditRowLines.length} UI rows; ${Object.entries(statusCounts)
    .map(([status, count]) => `${status}=${count}`)
    .join(', ')}; OPEN=${openCount}.`,
);
