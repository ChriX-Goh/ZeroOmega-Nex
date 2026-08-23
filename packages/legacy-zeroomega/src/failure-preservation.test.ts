import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LEGACY_DECODE_LIMITS,
  decodeZeroOmegaBackup,
  exportZeroOmegaBackup,
  importZeroOmegaBackup,
} from './index.js';

const FIXTURE_ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);

function minimalBackup(): Record<string, unknown> {
  return {
    schemaVersion: 2,
    '+proxy': {
      name: 'proxy',
      profileType: 'FixedProfile',
      fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 7890 },
      rules: [{ condition: { conditionType: 'TrueCondition' }, profileName: 'direct' }],
    },
  };
}

function decodeFailureCode(
  input: Parameters<typeof decodeZeroOmegaBackup>[0],
  limits = DEFAULT_LEGACY_DECODE_LIMITS,
): string {
  const result = decodeZeroOmegaBackup(input, limits);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('expected decoder failure');
  return result.issues[0]!.code;
}

const importContext = {
  createdAt: '2026-08-07T08:30:00.000Z',
  documentId: 'document-failure-preservation',
  revisionId: 'revision-failure-preservation',
  deviceId: 'device-failure-preservation',
} as const;

describe('MIG-01.6 legacy failure preservation', () => {
  it('keeps decoder resource rejections machine-readable and fail-closed', () => {
    expect(
      decodeFailureCode(JSON.stringify(minimalBackup()), {
        ...DEFAULT_LEGACY_DECODE_LIMITS,
        maxInputBytes: 10,
      }),
    ).toBe('decode.input-too-large');

    expect(
      decodeFailureCode(
        { schemaVersion: 2, nested: { deeper: { value: true } } },
        { ...DEFAULT_LEGACY_DECODE_LIMITS, maxDepth: 2 },
      ),
    ).toBe('decode.too-deep');

    expect(
      decodeFailureCode(minimalBackup(), {
        ...DEFAULT_LEGACY_DECODE_LIMITS,
        maxNodes: 2,
      }),
    ).toBe('decode.too-many-nodes');

    expect(
      decodeFailureCode(minimalBackup(), {
        ...DEFAULT_LEGACY_DECODE_LIMITS,
        maxProfiles: 0,
      }),
    ).toBe('decode.too-many-profiles');

    expect(
      decodeFailureCode(minimalBackup(), {
        ...DEFAULT_LEGACY_DECODE_LIMITS,
        maxRules: 0,
      }),
    ).toBe('decode.too-many-rules');

    const cyclic: Record<string, unknown> = { schemaVersion: 2 };
    cyclic.self = cyclic;
    expect(decodeFailureCode(cyclic)).toBe('decode.cyclic-object');
    expect(decodeFailureCode('{')).toBe('decode.invalid-json');
    expect(decodeFailureCode({ schemaVersion: 3 })).toBe('decode.unsupported-schema');
  });

  it('fails semantic export without mutating the invalid candidate', async () => {
    const source = await readFile(new URL('original-default-v3.5.0.bak', FIXTURE_ROOT), 'utf8');
    const imported = importZeroOmegaBackup(source, importContext);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));

    const invalid = structuredClone(imported.candidate);
    invalid.settings.startup.route = {
      kind: 'profile',
      profileId: 'profile-missing-on-export',
    };
    const before = structuredClone(invalid);

    const exported = exportZeroOmegaBackup(invalid, {
      createdAt: '2026-08-07T08:31:00.000Z',
    });

    expect(exported.ok).toBe(false);
    if (exported.ok) throw new Error('expected semantic export failure');
    expect(exported.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          code: 'profile-spec.profile.missing-startup-reference',
        }),
      ]),
    );
    expect(invalid).toEqual(before);
  });
});
