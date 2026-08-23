import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { describe, expect, it } from 'vitest';

import { MemorySnapshotActivationRepository } from './memory-repository.js';
import { listPacSnapshotHistory, type SnapshotHistoryRepository } from './snapshot-history.js';

function snapshot(
  id: string,
  createdAt: string,
  overrides: Partial<PacRuntimeSnapshot> = {},
): PacRuntimeSnapshot {
  return {
    snapshotSchemaVersion: 1,
    snapshotId: id,
    createdAt,
    sourceDocumentId: 'document-history-test',
    sourceRevisionId: `revision-${id}`,
    sourceProfileSpecSha256: `source-profile-sha-${id}-1234567890`,
    startRoute: { kind: 'profile', profileId: 'profile-primary' },
    target: 'chromium',
    compilerVersion: '0.1.0',
    scriptSha256: `script-sha-${id}-1234567890`,
    capability: 'exact',
    script: `function FindProxyForURL(){return '${id}';}`,
    stats: {
      scriptBytes: 64,
      profileCount: 1,
      endpointCount: 1,
      conditionCount: 0,
      ruleListRuleCount: 0,
    },
    warnings: [],
    verification: {
      passed: true,
      mode: 'reference-safety',
      vectorCount: 3,
      matchedCount: 3,
    },
    ...overrides,
  };
}

describe('PAC snapshot history', () => {
  it('returns newest-first redacted metadata with active markers', async () => {
    const repository = new MemorySnapshotActivationRepository({
      activeSnapshotId: 'snapshot-new',
      lastKnownGoodSnapshotId: 'snapshot-old',
    });
    await repository.putSnapshot(snapshot('snapshot-old', '2026-07-25T10:00:00.000Z'));
    await repository.putSnapshot(
      snapshot('snapshot-new', '2026-07-25T11:00:00.000Z', {
        warnings: [
          {
            code: 'TARGET_DEPENDENT',
            message: 'Target-dependent behavior',
            path: '$.profiles[0]',
            capability: 'target-dependent',
            severity: 'warning',
            blocking: false,
          },
        ],
      }),
    );

    const history = await listPacSnapshotHistory(repository);

    expect(history.map((entry) => entry.snapshotId)).toEqual(['snapshot-new', 'snapshot-old']);
    expect(history[0]).toMatchObject({
      sourceRevisionId: 'revision-snapshot-new',
      active: true,
      lastKnownGood: false,
      target: 'chromium',
      compilerVersion: '0.1.0',
      verification: {
        passed: true,
        mode: 'reference-safety',
        vectorCount: 3,
        matchedCount: 3,
      },
    });
    expect(history[1]).toMatchObject({
      active: false,
      lastKnownGood: true,
    });
    expect(history[0]?.scriptSha256Prefix.length).toBeLessThanOrEqual(12);
    expect(JSON.stringify(history)).not.toContain('FindProxyForURL');
    expect(JSON.stringify(history)).not.toContain('script:');
  });

  it('uses snapshot ID as a deterministic tie-breaker', async () => {
    const repository = new MemorySnapshotActivationRepository();
    await repository.putSnapshot(snapshot('snapshot-a', '2026-07-25T11:00:00.000Z'));
    await repository.putSnapshot(snapshot('snapshot-b', '2026-07-25T11:00:00.000Z'));

    await expect(listPacSnapshotHistory(repository)).resolves.toMatchObject([
      { snapshotId: 'snapshot-b' },
      { snapshotId: 'snapshot-a' },
    ]);
  });

  it('rejects snapshots with incomplete compiler identity', async () => {
    const repository = new MemorySnapshotActivationRepository();
    await repository.putSnapshot(
      snapshot('snapshot-incomplete', '2026-07-25T11:00:00.000Z', {
        scriptSha256: '',
      }),
    );

    await expect(listPacSnapshotHistory(repository)).rejects.toThrow(
      'snapshot snapshot-incomplete has incomplete compiler identity',
    );
  });

  it('rejects invalid creation timestamps', async () => {
    const repository = new MemorySnapshotActivationRepository();
    await repository.putSnapshot(snapshot('snapshot-invalid-time', 'not-a-date'));

    await expect(listPacSnapshotHistory(repository)).rejects.toThrow(
      'snapshot snapshot-invalid-time has an invalid creation time',
    );
  });

  it('rejects duplicate snapshot IDs returned by a repository', async () => {
    const duplicate = snapshot('snapshot-duplicate', '2026-07-25T11:00:00.000Z');
    const repository: SnapshotHistoryRepository = {
      getState: async () => ({}),
      listSnapshots: async () => [duplicate, structuredClone(duplicate)],
    };

    await expect(listPacSnapshotHistory(repository)).rejects.toThrow(
      'snapshot history contains duplicate ID snapshot-duplicate',
    );
  });
});
