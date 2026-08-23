import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { popupTemporarySnapshotId } from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import { BrowserStorageSnapshotActivationRepository } from '@zeroomega-nex/browser-adapters';

import {
  POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX,
  SessionSnapshotActivationRepository,
} from './session-snapshot-repository';

class Area {
  readonly values = new Map<string, unknown>();

  async get(keys: string | readonly string[]): Promise<Record<string, unknown>> {
    const selected = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(
      selected.flatMap((key) => (this.values.has(key) ? [[key, this.values.get(key)]] : [])),
    );
  }

  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) this.values.set(key, structuredClone(value));
  }

  async remove(keys: string | readonly string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) this.values.delete(key);
  }
}

function snapshot(id: string): PacRuntimeSnapshot {
  return {
    snapshotSchemaVersion: 1,
    snapshotId: id,
    createdAt: '2026-07-27T13:00:00.000Z',
    sourceDocumentId: 'document',
    sourceRevisionId: 'revision',
    sourceProfileSpecSha256: 'a'.repeat(64),
    startRoute: { kind: 'direct' },
    target: 'chromium',
    compilerVersion: 'test',
    scriptSha256: 'b'.repeat(64),
    capability: 'exact',
    script: 'function FindProxyForURL(){return "DIRECT";}',
    stats: {
      scriptBytes: 1,
      profileCount: 0,
      endpointCount: 0,
      conditionCount: 0,
      ruleListRuleCount: 0,
    },
    warnings: [],
    verification: { passed: true, vectorCount: 1, matchedCount: 1 },
  };
}

describe('session-aware snapshot repository', () => {
  it('keeps temporary snapshots out of persistent history', async () => {
    const local = new Area();
    const session = new Area();
    const repository = new SessionSnapshotActivationRepository(
      new BrowserStorageSnapshotActivationRepository(local),
      session,
    );
    const id = popupTemporarySnapshotId({ kind: 'direct' }, 'test');
    await repository.putSnapshot(snapshot(id));
    expect(await repository.getSnapshot(id)).toMatchObject({ snapshotId: id });
    expect(await repository.listSnapshots()).toEqual([]);
    expect(session.values.has(`${POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX}${id}`)).toBe(true);
    expect([...local.values.keys()].some((key) => key.includes(id))).toBe(false);
    await repository.removeSnapshot(id);
    expect(await repository.getSnapshot(id)).toBeUndefined();
  });
});
