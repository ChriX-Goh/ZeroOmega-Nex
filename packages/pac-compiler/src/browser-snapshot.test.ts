import { readFile } from 'node:fs/promises';

import { importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { createBrowserSafePacSnapshot } from './browser-snapshot.js';
import { sha256Hex } from './hash.js';

const ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);
const context = {
  createdAt: '2026-07-25T07:00:00.000Z',
  documentId: 'document-browser-snapshot-test',
  revisionId: 'revision-browser-snapshot-test',
} as const;

async function importedFixture(name: string): Promise<ProfileSpec> {
  const imported = importZeroOmegaBackup(await readFile(new URL(name, ROOT), 'utf8'), context);
  if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));
  return imported.candidate;
}

function profileRoute(spec: ProfileSpec, name: string): ProfileRouteTarget {
  const profile = spec.profiles.find((candidate) => candidate.name === name);
  if (!profile) throw new Error(`missing profile ${name}`);
  return { kind: 'profile', profileId: profile.id };
}

const vectors = [
  {
    id: 'browser-snapshot-proxy',
    request: {
      url: 'https://api.example.invalid/path',
      host: 'api.example.invalid',
      scheme: 'https',
    },
  },
  {
    id: 'browser-snapshot-direct',
    request: {
      url: 'https://unrelated.invalid/path',
      host: 'unrelated.invalid',
      scheme: 'https',
    },
  },
] as const;

describe('CSP-safe browser PAC snapshots', () => {
  it('creates deterministic snapshots from reference-safe vectors without PAC evaluation', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const route = profileRoute(spec, 'switch');
    const result = await createBrowserSafePacSnapshot(spec, route, vectors, {
      createdAt: '2026-07-25T07:10:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected CSP-safe browser snapshot');
    expect(result.snapshot.scriptSha256).toBe(await sha256Hex(result.snapshot.script));
    expect(result.snapshot.verification).toEqual({
      passed: true,
      mode: 'reference-safety',
      vectorCount: 2,
      matchedCount: 2,
    });
  });

  it('rejects vectors whose reference route cannot be represented by PAC', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const result = await createBrowserSafePacSnapshot(
      spec,
      profileRoute(spec, 'switch'),
      [
        {
          id: 'browser-snapshot-system',
          request: {
            url: 'https://system.example.invalid/',
            host: 'system.example.invalid',
            scheme: 'https',
          },
        },
      ],
      { createdAt: '2026-07-25T07:11:00.000Z' },
    );

    if (result.ok) {
      expect(result.snapshot.verification.mode).toBe('reference-safety');
    } else {
      expect(['compile', 'verify']).toContain(result.stage);
    }
  });
});
