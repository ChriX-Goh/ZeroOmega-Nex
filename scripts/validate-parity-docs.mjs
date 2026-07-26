import { readFile } from 'node:fs/promises';

const graphPath = 'docs/ORIGINAL_KNOWLEDGE_GRAPH.md';
const auditPath = 'docs/UI_AUDIT_MATRIX.md';
const indexPath = 'docs/ORIGINAL_PARITY_MATRIX.md';

const [graph, audit, index] = await Promise.all([
  readFile(graphPath, 'utf8'),
  readFile(auditPath, 'utf8'),
  readFile(indexPath, 'utf8'),
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
  'G-01',
  'G-02',
  'H-09',
  'I-05',
  'J-10',
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

for (const [status, count] of Object.entries(statusCounts)) {
  if (count === 0) failures.push(`UI audit has no ${status} rows`);
}

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
