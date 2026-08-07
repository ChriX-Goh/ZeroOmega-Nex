import { readFile, writeFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { parseBackup, verifyAgainstManifest } from './owner-corpus-b-intake.mjs';
import { buildSafeCorpusBPreflightReport } from './owner-corpus-b-preflight-core.ts';

const candidatePath = process.env.ZEROOMEGA_CORPUS_B_PREFLIGHT_CANDIDATE;
const manifestPath = process.env.ZEROOMEGA_CORPUS_B_PREFLIGHT_MANIFEST;
const reportPath = process.env.ZEROOMEGA_CORPUS_B_PREFLIGHT_REPORT;

describe('owner Corpus B external preflight runner', () => {
  it('verifies intake again and writes the safe importer report', async () => {
    expect(candidatePath).toBeTruthy();
    expect(manifestPath).toBeTruthy();
    expect(reportPath).toBeTruthy();
    if (!candidatePath || !manifestPath || !reportPath) {
      throw new Error('Corpus B preflight runner paths are required');
    }

    const [source, manifestSource] = await Promise.all([
      readFile(candidatePath, 'utf8'),
      readFile(manifestPath, 'utf8'),
    ]);
    const manifest = JSON.parse(manifestSource);
    const backup = parseBackup(source, 'sanitized owner backup');
    const metrics = verifyAgainstManifest(backup, manifest);
    const report = buildSafeCorpusBPreflightReport(source, metrics);

    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    expect(report.containsRawValues).toBe(false);
  });
});
