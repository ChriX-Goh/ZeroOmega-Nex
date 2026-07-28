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
  'm8-visual-evidence-${{ github.sha }}',
  'retention-days: 30',
]);

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

const auditRows = audit.match(/^\|\s+[A-J]-\d+\s+\|/gmu) ?? [];
if (auditRows.length < 120) {
  failures.push(`UI audit has ${auditRows.length} classified rows; expected at least 120`);
}

const statusCounts = Object.fromEntries(
  ['DONE', 'PARTIAL', 'MISSING', 'BROKEN', 'UNVERIFIED'].map((status) => [
    status,
    (audit.match(new RegExp(`\\|\\s+${status}\\s+\\|`, 'gu')) ?? []).length,
  ]),
);

for (const status of ['DONE', 'PARTIAL', 'MISSING', 'UNVERIFIED']) {
  if (statusCounts[status] === 0) failures.push(`UI audit has no ${status} rows`);
}

const openCount =
  statusCounts.PARTIAL + statusCounts.MISSING + statusCounts.BROKEN + statusCounts.UNVERIFIED;
if (openCount === 0) failures.push('UI audit has no open rows while PR #11 remains Draft');

if (failures.length > 0) {
  console.error('Parity documentation validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Parity documentation passed: ${auditRows.length} UI rows; ${Object.entries(statusCounts)
    .map(([status, count]) => `${status}=${count}`)
    .join(', ')}.`,
);
