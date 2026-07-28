import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const sourceRoot = 'apps/extension/src';
const outputPath = 'docs/LOCALE_INVENTORY.json';
const typedBatchFiles = [
  'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
  'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
  'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
  'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
  'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
  'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',
  'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',
  'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
  'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',
  'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',
  'apps/extension/src/entrypoints/options/ThemePanel.svelte',
  'apps/extension/src/entrypoints/popup/App.svelte',
  'apps/extension/src/entrypoints/temp-rules/App.svelte',
  'apps/extension/src/entrypoints/network/App.svelte',
];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const candidate = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(candidate)));
    else if (entry.isFile() && candidate.endsWith('.svelte')) files.push(candidate);
  }
  return files;
}

function normalize(value) {
  return value.replace(/\s+/gu, ' ').trim();
}

function visibleCandidate(value) {
  const text = normalize(value);
  if (!/[A-Za-z]/u.test(text)) return undefined;
  if (/^(?:https?:|chrome:|moz-extension:|#|\.|\/)/u.test(text)) return undefined;
  if (/^[a-z][a-z0-9_-]*$/u.test(text)) return undefined;
  if (/^(?:true|false|undefined|null)$/u.test(text)) return undefined;
  return text;
}

function extract(pathname, source) {
  let template = source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, '')
    .replace(/<!--([\s\S]*?)-->/gu, '');
  template = template.replace(/\b(?:uiText|uiMessage|profileKindText)\([^)]*\)/gu, '');
  const candidates = [];
  const seen = new Set();
  const add = (kind, raw) => {
    const text = visibleCandidate(raw);
    if (!text) return;
    const identity = `${kind}\u0000${text}`;
    if (seen.has(identity)) return;
    seen.add(identity);
    candidates.push({ path: pathname, kind, text });
  };
  for (const match of template.matchAll(/>([^<>{]*[A-Za-z][^<>{]*)</gu)) add('text', match[1]);
  for (const match of template.matchAll(
    /\b(aria-label|title|placeholder)="([^"{}]*[A-Za-z][^"{}]*)"/gu,
  )) {
    add(match[1], match[2]);
  }
  for (const expression of template.matchAll(/\{([^{}]*)\}/gu)) {
    for (const literal of expression[1].matchAll(/(['"])([^'"]*[A-Za-z][^'"]*)\1/gu)) {
      add('expression-literal', literal[2]);
    }
  }
  return candidates;
}

const files = await collect(sourceRoot);
const candidates = [];
for (const filename of files)
  candidates.push(...extract(filename, await readFile(filename, 'utf8')));
candidates.sort(
  (left, right) =>
    left.path.localeCompare(right.path) ||
    left.kind.localeCompare(right.kind) ||
    left.text.localeCompare(right.text),
);
const inventory = {
  schemaVersion: 1,
  description:
    'Machine-generated candidate inventory of remaining literal English text in Svelte templates. Typed uiText/uiMessage calls are excluded; candidates require human classification before migration.',
  typedBatchFiles,
  candidateCount: candidates.length,
  candidates,
};
const serialized = `${JSON.stringify(inventory, null, 2)}\n`;
if (process.argv.includes('--write')) {
  await writeFile(outputPath, serialized);
} else if (process.argv.includes('--check')) {
  const existing = await readFile(outputPath, 'utf8').catch(() => '');
  if (existing !== serialized) {
    console.error(`${outputPath} is stale. Run pnpm locale:inventory.`);
    process.exitCode = 1;
  }
} else {
  process.stdout.write(serialized);
}
