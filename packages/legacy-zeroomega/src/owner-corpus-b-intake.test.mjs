import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertSanitizedSafety,
  buildManifest,
  isInsideRepository,
  parseBackup,
  verifyAgainstManifest,
} from '../../../scripts/owner-corpus-b-intake.mjs';

const fixturePath = resolve('fixtures/zeroomega-v2/original-complex-corpus-cd-v3.5.0.bak');

async function fixture() {
  const source = await readFile(fixturePath, 'utf8');
  return { source, data: parseBackup(source, 'Corpus B intake test fixture') };
}

describe('owner Corpus B intake', () => {
  it('creates a structure-only manifest and verifies an unchanged safe candidate', async () => {
    const { source, data } = await fixture();
    const manifest = buildManifest(data, Buffer.byteLength(source));

    expect(manifest.containsRawValues).toBe(false);
    expect(JSON.stringify(manifest)).not.toContain('nested.corpus.example.com');
    expect(JSON.stringify(manifest)).not.toContain('corpus proxy');
    expect(verifyAgainstManifest(data, manifest)).toEqual(manifest.metrics);
  });

  it('rejects structural drift after sanitization', async () => {
    const { source, data } = await fixture();
    const manifest = buildManifest(data, Buffer.byteLength(source));
    const changed = structuredClone(data);
    changed['+inner switch'].profileType = 'FixedProfile';

    expect(() => verifyAgainstManifest(changed, manifest)).toThrow(/structural fingerprint changed/u);
  });

  it('rejects usable credentials and non-reserved endpoints', async () => {
    const { data } = await fixture();

    const endpoint = structuredClone(data);
    endpoint['+corpus proxy'].fallbackProxy.host = '10.23.45.67';
    expect(() => assertSanitizedSafety(endpoint)).toThrow(
      /usable network endpoint|non-reserved network identifier/u,
    );

    const credentials = structuredClone(data);
    credentials['+corpus proxy'].auth = {
      all: { username: 'owner-user', password: 'owner-password' },
    };
    expect(() => assertSanitizedSafety(credentials)).toThrow(
      /unredacted proxy credential|unredacted secret-like field/u,
    );
  });

  it('identifies repository paths so raw owner backups can be refused', () => {
    expect(isInsideRepository(fixturePath)).toBe(true);
    expect(isInsideRepository(resolve('..', 'zeroomega-private-owner.bak'))).toBe(false);
  });
});
