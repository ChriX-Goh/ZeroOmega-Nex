import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { exportZeroOmegaBackup, importZeroOmegaBackup } from './index.js';

const FIXTURE_ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);

const CASES = [
  ['Corpus A official default', 'original-default-v3.5.0.bak'],
  ['Corpus C/D original complex', 'original-complex-corpus-cd-v3.5.0.bak'],
  ['large original-runtime representative', 'original-large-representative-v3.5.0.bak'],
] as const;

function importContext(caseId: string, pass: number) {
  return {
    createdAt: `2026-08-07T10:0${pass}:00.000Z`,
    documentId: `document-mig-01-7-${caseId}-${pass}`,
    revisionId: `revision-mig-01-7-${caseId}-${pass}`,
    deviceId: 'device-mig-01-7',
  } as const;
}

function mustImport(source: string, caseId: string, pass: number) {
  const result = importZeroOmegaBackup(source, importContext(caseId, pass));
  if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
  return result;
}

function mustExport(candidate: ReturnType<typeof mustImport>['candidate'], pass: number) {
  const result = exportZeroOmegaBackup(candidate, {
    createdAt: `2026-08-07T11:0${pass}:00.000Z`,
  });
  if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));
  return result;
}

describe('MIG-01.7 semantic export/re-import consolidation', () => {
  for (const [label, fixtureName] of CASES) {
    it(`${label} reaches a byte-stable ordinary export after re-import`, async () => {
      const source = await readFile(new URL(fixtureName, FIXTURE_ROOT), 'utf8');
      const caseId = fixtureName.replace(/[^a-z0-9]+/giu, '-');

      const firstImport = mustImport(source, caseId, 1);
      const firstExport = mustExport(firstImport.candidate, 1);
      expect(() => JSON.parse(firstExport.content)).not.toThrow();
      expect(firstExport.content).not.toMatch(/passwordSecretRef|secretRef/u);

      const secondImport = mustImport(firstExport.content, caseId, 2);
      const secondExport = mustExport(secondImport.candidate, 2);
      expect(secondExport.content).toBe(firstExport.content);

      const thirdImport = mustImport(secondExport.content, caseId, 3);
      const thirdExport = mustExport(thirdImport.candidate, 3);
      expect(thirdExport.content).toBe(firstExport.content);
      expect(secondImport.secretMaterials).toHaveLength(0);
      expect(thirdImport.secretMaterials).toHaveLength(0);
    });
  }
});
