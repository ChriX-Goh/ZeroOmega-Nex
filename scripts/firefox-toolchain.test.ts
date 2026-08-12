import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  canDeclareM1JourneySuccess,
  loadToolchainManifest,
  resolveM1CoverageStatus,
  validateMigrationBackupHash,
} from './firefox-toolchain.mjs';

const DEFAULT_BACKUP_SHA256 = '34F88783F863CDF0D29BC15B64F187D50E25F89AD21525271A57582D40686EAD';

async function sha256(path: string): Promise<string> {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
}

describe('Firefox M1 toolchain manifest', () => {
  it('pins official win64 assets and non-floating hashes', async () => {
    const manifest = await loadToolchainManifest();

    expect(manifest.platform).toBe('win64');
    expect(manifest.firefox.version).toBe('152.0.6');
    expect(manifest.geckodriver.version).toBe('0.37.1');
    expect(manifest.firefox.url).toContain('/releases/152.0.6/win64/en-US/');
    expect(manifest.geckodriver.url).toContain('/download/v0.37.1/');
    expect(manifest.firefox.url).not.toMatch(/latest/u);
    expect(manifest.geckodriver.url).not.toMatch(/latest/u);
    expect(manifest.firefox.sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(manifest.geckodriver.sha256).toMatch(/^[0-9a-f]{64}$/u);
  });

  it('fails closed when migration provenance has no valid backup hash', () => {
    expect(() => validateMigrationBackupHash({}, DEFAULT_BACKUP_SHA256, 'Corpus A')).toThrow(
      /missing or malformed/u,
    );
    expect(() =>
      validateMigrationBackupHash(
        { backupSha256: 'not-a-sha256' },
        DEFAULT_BACKUP_SHA256,
        'Corpus A',
      ),
    ).toThrow(/missing or malformed/u);
    expect(() =>
      validateMigrationBackupHash(
        { backupSha256: DEFAULT_BACKUP_SHA256 },
        `${DEFAULT_BACKUP_SHA256.slice(0, -1)}0`,
        'Corpus A',
      ),
    ).toThrow(/does not match/u);
  });

  it('checks the default, C/D, and large public fixture hashes', async () => {
    const entries = [
      [
        'Corpus A',
        'fixtures/zeroomega-v2/original-default-v3.5.0.bak',
        'fixtures/zeroomega-v2/original-default-v3.5.0.provenance.json',
      ],
      [
        'Corpus C/D',
        'fixtures/zeroomega-v2/original-complex-corpus-cd-v3.5.0.bak',
        'fixtures/zeroomega-v2/original-complex-corpus-cd-v3.5.0.provenance.json',
      ],
      [
        'large representative',
        'fixtures/zeroomega-v2/original-large-representative-v3.5.0.bak',
        'fixtures/zeroomega-v2/original-large-representative-v3.5.0.provenance.json',
      ],
    ] as const;

    for (const [label, backup, provenancePath] of entries) {
      const provenance = JSON.parse(await readFile(resolve(provenancePath), 'utf8'));
      const actualHash = await sha256(resolve(backup));
      expect(validateMigrationBackupHash(provenance, actualHash, label).toLowerCase()).toBe(
        actualHash,
      );
    }
  });

  it('keeps M1 coverage unverified before Firefox and rejects unresolved rows', () => {
    expect(resolveM1CoverageStatus('covered', false)).toBe('unverified');
    expect(resolveM1CoverageStatus('not-covered', false)).toBe('unverified');
    expect(
      canDeclareM1JourneySuccess(false, [{ status: 'covered' }, { status: 'not-covered' }]),
    ).toBe(false);
    expect(canDeclareM1JourneySuccess(true, [{ status: 'covered' }])).toBe(true);
    expect(
      canDeclareM1JourneySuccess(true, [{ status: 'covered' }, { status: 'not-covered' }]),
    ).toBe(false);
    expect(
      canDeclareM1JourneySuccess(true, [{ status: 'covered' }, { status: 'unverified' }]),
    ).toBe(false);
  });
});
