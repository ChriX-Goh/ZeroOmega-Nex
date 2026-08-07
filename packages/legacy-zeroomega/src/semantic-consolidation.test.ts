import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { exportZeroOmegaBackup, importZeroOmegaBackup } from './index.js';

const FIXTURE_ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);
const BASE_CONTEXT = {
  createdAt: '2026-08-07T09:30:00.000Z',
  documentId: 'document-mig-01-semantic-consolidation',
  revisionId: 'revision-mig-01-semantic-consolidation',
  deviceId: 'device-mig-01-semantic-consolidation',
} as const;
const FORBIDDEN_EXPORT_MARKERS = [
  '<redacted>',
  'passwordSecretRef',
  'secretRef',
  'Authorization',
  'X-Fixture-Token',
] as const;

async function fixture(name: string): Promise<string> {
  return readFile(new URL(name, FIXTURE_ROOT), 'utf8');
}

function importOrThrow(source: string, revisionId: string = BASE_CONTEXT.revisionId) {
  const result = importZeroOmegaBackup(source, { ...BASE_CONTEXT, revisionId });
  if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
  return result;
}

function exportOrThrow(candidate: ReturnType<typeof importOrThrow>['candidate']) {
  const result = exportZeroOmegaBackup(candidate, { createdAt: BASE_CONTEXT.createdAt });
  if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));
  return result;
}

function expectNoForbiddenExportMarkers(content: string) {
  for (const marker of FORBIDDEN_EXPORT_MARKERS) expect(content).not.toContain(marker);
}

describe('MIG-01.7 semantic export and re-import consolidation', () => {
  for (const [label, fixtureName] of [
    ['Corpus A', 'original-default-v3.5.0.bak'],
    ['Corpus C/D', 'original-complex-corpus-cd-v3.5.0.bak'],
    ['large capacity', 'original-large-representative-v3.5.0.bak'],
  ] as const) {
    it(`${label} stabilizes after semantic export and re-import`, async () => {
      const first = importOrThrow(await fixture(fixtureName), `revision-${label}-first`);
      const exportedOnce = exportOrThrow(first.candidate);
      expectNoForbiddenExportMarkers(exportedOnce.content);

      const second = importOrThrow(exportedOnce.content, `revision-${label}-second`);
      expect(second.secretMaterials).toHaveLength(0);

      const exportedTwice = exportOrThrow(second.candidate);
      expect(exportedTwice.options).toEqual(exportedOnce.options);
      expect(exportedTwice.content).toBe(exportedOnce.content);
      expect(exportedTwice.omittedSecretCount).toBe(exportedOnce.omittedSecretCount);
      expectNoForbiddenExportMarkers(exportedTwice.content);
    });
  }

  it('sensitive migration converges to a stable sanitized backup with no secret values or refs', async () => {
    const source = await fixture('credentials-and-headers.redacted.json');
    const first = importOrThrow(source, 'revision-sensitive-first');
    expect(first.secretMaterials.length).toBeGreaterThan(0);
    expect(first.secretMaterials.every((material) => material.value === '<redacted>')).toBe(true);
    expect(JSON.stringify(first.candidate)).not.toContain('<redacted>');

    const exportedOnce = exportOrThrow(first.candidate);
    expect(exportedOnce.omittedSecretCount).toBeGreaterThan(0);
    expect(exportedOnce.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['secret.proxy-credential-omitted', 'secret.request-header-omitted']),
    );
    expectNoForbiddenExportMarkers(exportedOnce.content);

    const second = importOrThrow(exportedOnce.content, 'revision-sensitive-second');
    expect(second.secretMaterials).toHaveLength(0);
    const exportedTwice = exportOrThrow(second.candidate);
    expect(exportedTwice.content).toBe(exportedOnce.content);
    expect(exportedTwice.options).toEqual(exportedOnce.options);
    expect(exportedTwice.omittedSecretCount).toBe(0);
    expectNoForbiddenExportMarkers(exportedTwice.content);
  });
});