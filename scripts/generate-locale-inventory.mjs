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
  'apps/extension/src/entrypoints/options/AdvancedProfileEditor.svelte',
  'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',
  'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',
  'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
  'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',
  'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',
  'apps/extension/src/entrypoints/options/ThemePanel.svelte',
  'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',
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

const formatNames = new Set(['AutoProxy', 'Switchy']);
const keyboardKeys = new Set(['Enter', 'Escape']);
const stableTechnicalCodes = new Set(['ERR_TIMEOUT']);
const originalProductNames = new Set(['ZeroOmega']);
const originalLegalTexts = new Set([
  'Copyright 2012-2017 The SwitchyOmega Authors. All rights reserved.',
  'Copyright 2024-2025 The ZeroOmega Authors.',
  'ZeroOmega is free software licensed under GNU General Public License Version 3 or later.',
]);

function classifyCandidate(candidate) {
  const { kind, path: pathname, text } = candidate;
  if (stableTechnicalCodes.has(text)) return 'stable-technical-code';
  if (originalProductNames.has(text)) return 'original-product-name';
  if (originalLegalTexts.has(text)) return 'original-legal-text';
  if (formatNames.has(text)) return 'format-name';
  if (text === 'URL') return 'standard-technical-term';
  if (keyboardKeys.has(text)) return 'keyboard-key';
  if (text === 'example.com') return 'example-placeholder';
  if (pathname.endsWith('/LegacyImportPanel.svelte') && text.startsWith('; ')) {
    return 'scanner-code-fragment';
  }
  if (kind === 'expression-literal' && /^[a-z][A-Za-z0-9]*$/u.test(text)) {
    return 'source-token';
  }
  return 'user-visible-untranslated';
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
const classifiedCandidates = candidates.map((candidate) => ({
  ...candidate,
  classification: classifyCandidate(candidate),
}));
const classificationSummary = Object.fromEntries(
  [...new Set(classifiedCandidates.map((candidate) => candidate.classification))]
    .sort()
    .map((classification) => [
      classification,
      classifiedCandidates.filter((candidate) => candidate.classification === classification)
        .length,
    ]),
);
const untranslatedUserVisibleCount = classificationSummary['user-visible-untranslated'] ?? 0;
const inventory = {
  schemaVersion: 2,
  description:
    'Machine-generated inventory of literal-English candidates remaining in Svelte templates. Each entry is explicitly classified; typed uiText/uiMessage calls are excluded.',
  typedBatchFiles,
  candidateCount: classifiedCandidates.length,
  untranslatedUserVisibleCount,
  classificationSummary,
  candidates: classifiedCandidates,
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
  if (untranslatedUserVisibleCount > 0) {
    console.error(
      `${outputPath} contains ${untranslatedUserVisibleCount} unclassified user-visible English candidate(s).`,
    );
    for (const candidate of classifiedCandidates.filter(
      (entry) => entry.classification === 'user-visible-untranslated',
    )) {
      console.error(`- ${candidate.path}: ${candidate.text}`);
    }
    process.exitCode = 1;
  }
} else {
  process.stdout.write(serialized);
}
