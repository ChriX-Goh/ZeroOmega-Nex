import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export function sha256Text(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalJson(value[key])]),
  );
}

export function semanticSha256(value) {
  return sha256Text(JSON.stringify(canonicalJson(value)));
}

export function assertNoSecretMarkers(value, label, extraMarkers = []) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const markers = [
    '<redacted>',
    'passwordSecretRef',
    'secretRef',
    'not-a-real-secret',
    ...extraMarkers,
  ];
  for (const marker of markers) {
    assert.equal(text.includes(marker), false, `${label} contained a forbidden secret marker`);
  }
}

export async function appendMig01Evidence(row) {
  const path = process.env.ZEROOMEGA_MIG01_SEMANTIC_EVIDENCE_FILE;
  if (!path) return;
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(row)}\n`, 'utf8');
}

export async function readEvidence(path) {
  const text = await readFile(path, 'utf8');
  return text
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
