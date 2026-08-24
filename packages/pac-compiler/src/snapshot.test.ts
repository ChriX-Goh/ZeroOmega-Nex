import { readFile } from 'node:fs/promises';

import { importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { sha256Hex } from './hash.js';
import { createVerifiedPacSnapshot } from './snapshot.js';

const ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);
const context = {
  createdAt: '2026-07-25T07:00:00.000Z',
  documentId: 'document-snapshot-test',
  revisionId: 'revision-snapshot-test',
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
    id: 'snapshot-proxy',
    request: {
      url: 'https://api.example.invalid/path',
      host: 'api.example.invalid',
      scheme: 'https',
    },
  },
  {
    id: 'snapshot-direct',
    request: {
      url: 'https://unrelated.invalid/path',
      host: 'unrelated.invalid',
      scheme: 'https',
    },
  },
] as const;

describe('verified PAC runtime snapshots', () => {
  it('creates deterministic content hashes and identity from verified output', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const route = profileRoute(spec, 'switch');
    const first = await createVerifiedPacSnapshot(spec, route, vectors, {
      createdAt: '2026-07-25T07:01:00.000Z',
    });
    const second = await createVerifiedPacSnapshot(spec, route, vectors, {
      createdAt: '2026-07-26T07:01:00.000Z',
    });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error('expected successful snapshots');

    expect(first.snapshot.snapshotId).toBe(second.snapshot.snapshotId);
    expect(first.snapshot.sourceProfileSpecSha256).toBe(second.snapshot.sourceProfileSpecSha256);
    expect(first.snapshot.scriptSha256).toBe(second.snapshot.scriptSha256);
    expect(first.snapshot.createdAt).not.toBe(second.snapshot.createdAt);
    expect(first.snapshot.scriptSha256).toBe(await sha256Hex(first.snapshot.script));
    expect(first.snapshot.verification).toEqual({
      passed: true,
      mode: 'differential',
      vectorCount: 2,
      matchedCount: 2,
    });
  });

  it('changes snapshot identity when the canonical ProfileSpec and generated script change', async () => {
    const firstSpec = await importedFixture('minimal-profile-types.json');
    const firstRoute = profileRoute(firstSpec, 'switch');
    const first = await createVerifiedPacSnapshot(firstSpec, firstRoute, vectors, {
      createdAt: '2026-07-25T07:02:00.000Z',
    });
    if (!first.ok) throw new Error('expected first snapshot');

    const fixed = firstSpec.profiles.find((profile) => profile.name === 'fixed');
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing fixed profile');
    const endpoint = firstSpec.proxyEndpoints.find(
      (candidate) => candidate.id === fixed.proxyByScheme.https,
    );
    if (!endpoint) throw new Error('missing HTTPS endpoint');
    endpoint.port = 9443;

    const second = await createVerifiedPacSnapshot(firstSpec, firstRoute, vectors, {
      createdAt: '2026-07-25T07:03:00.000Z',
    });
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error('expected second snapshot');
    expect(second.snapshot.sourceProfileSpecSha256).not.toBe(
      first.snapshot.sourceProfileSpecSha256,
    );
    expect(second.snapshot.scriptSha256).not.toBe(first.snapshot.scriptSha256);
    expect(second.snapshot.snapshotId).not.toBe(first.snapshot.snapshotId);
  });

  it('does not create a snapshot when compilation is unsupported', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const result = await createVerifiedPacSnapshot(spec, { kind: 'system' }, [], {
      createdAt: '2026-07-25T07:04:00.000Z',
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected compile failure');
    expect(result.stage).toBe('compile');
  });

  it('does not create a snapshot when verification evidence does not match', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const route = profileRoute(spec, 'switch');
    const result = await createVerifiedPacSnapshot(
      spec,
      route,
      [
        {
          id: 'invalid-clock-vector',
          request: {
            url: 'https://api.example.invalid/path',
            host: 'api.example.invalid',
            scheme: 'https',
            localHour: 99,
          },
        },
      ],
      { createdAt: '2026-07-25T07:05:00.000Z' },
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected verification failure');
    expect(result.stage).toBe('verify');
    if (result.stage !== 'verify') throw new Error('expected verify stage');
    expect(result.mismatches[0]?.vectorId).toBe('invalid-clock-vector');
  });

  it('supports a caller-supplied immutable snapshot ID', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const result = await createVerifiedPacSnapshot(spec, profileRoute(spec, 'switch'), vectors, {
      snapshotId: 'snapshot-release-candidate-001',
      createdAt: '2026-07-25T07:06:00.000Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected snapshot');
    expect(result.snapshot.snapshotId).toBe('snapshot-release-candidate-001');
  });
});
