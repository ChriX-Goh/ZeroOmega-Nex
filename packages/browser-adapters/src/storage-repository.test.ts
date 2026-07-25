import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { describe, expect, it } from 'vitest';

import {
  BrowserStorageSnapshotActivationRepository,
  type BrowserStorageArea,
} from './storage-repository.js';

const snapshot: PacRuntimeSnapshot = {
  snapshotSchemaVersion: 1,
  snapshotId: 'pac-storage-test',
  createdAt: '2026-07-25T06:30:00.000Z',
  sourceDocumentId: 'document-storage',
  sourceRevisionId: 'revision-storage',
  sourceProfileSpecSha256: 'a'.repeat(64),
  startRoute: { kind: 'direct' },
  target: 'cross-browser',
  compilerVersion: '0.1.0',
  scriptSha256: 'b'.repeat(64),
  capability: 'exact',
  script: 'function FindProxyForURL(){return "DIRECT";}',
  stats: {
    scriptBytes: 48,
    profileCount: 0,
    endpointCount: 0,
    conditionCount: 0,
    ruleListRuleCount: 0,
  },
  warnings: [],
  verification: { passed: true, vectorCount: 1, matchedCount: 1 },
};

class MemoryStorageArea implements BrowserStorageArea {
  readonly values = new Map<string, unknown>();

  async get(keys: string | readonly string[]): Promise<Record<string, unknown>> {
    const selected = typeof keys === 'string' ? [keys] : keys;
    return Object.fromEntries(selected.flatMap((key) => (this.values.has(key) ? [[key, this.values.get(key)]] : [])));
  }

  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) this.values.set(key, structuredClone(value));
  }

  async remove(keys: string | readonly string[]): Promise<void> {
    const selected = typeof keys === 'string' ? [keys] : keys;
    for (const key of selected) this.values.delete(key);
  }
}

describe('browser storage activation repository', () => {
  it('persists activation state and verified snapshots across repository instances', async () => {
    const storage = new MemoryStorageArea();
    const first = new BrowserStorageSnapshotActivationRepository(storage);
    await first.putSnapshot(snapshot);
    await first.setState({
      activeSnapshotId: snapshot.snapshotId,
      lastKnownGoodSnapshotId: snapshot.snapshotId,
    });

    const restarted = new BrowserStorageSnapshotActivationRepository(storage);
    await expect(restarted.getSnapshot(snapshot.snapshotId)).resolves.toEqual(snapshot);
    await expect(restarted.getState()).resolves.toEqual({
      activeSnapshotId: snapshot.snapshotId,
      lastKnownGoodSnapshotId: snapshot.snapshotId,
    });
  });

  it('round-trips pending activation and failure records', async () => {
    const storage = new MemoryStorageArea();
    const repository = new BrowserStorageSnapshotActivationRepository(storage);
    await repository.setState({
      pending: {
        snapshotId: snapshot.snapshotId,
        previousActiveSnapshotId: 'pac-previous',
        platformBefore: {
          family: 'chromium',
          controlLevel: 'controllable-by-this-extension',
          value: { mode: 'system' },
        },
        startedAt: '2026-07-25T06:31:00.000Z',
      },
      lastFailure: {
        snapshotId: snapshot.snapshotId,
        stage: 'confirm',
        message: 'not confirmed',
        occurredAt: '2026-07-25T06:32:00.000Z',
        rollbackSucceeded: true,
      },
    });
    await expect(repository.getState()).resolves.toMatchObject({
      pending: { snapshotId: snapshot.snapshotId, previousActiveSnapshotId: 'pac-previous' },
      lastFailure: { stage: 'confirm', rollbackSucceeded: true },
    });
  });

  it('rejects corrupted state and mismatched snapshot identities', async () => {
    const storage = new MemoryStorageArea();
    const namespace = 'test/browser-proxy';
    const repository = new BrowserStorageSnapshotActivationRepository(storage, { namespace });
    storage.values.set(`${namespace}/state`, { activeSnapshotId: 42 });
    await expect(repository.getState()).rejects.toThrow('activeSnapshotId must be a string');

    storage.values.set(`${namespace}/snapshot/${snapshot.snapshotId}`, {
      ...snapshot,
      snapshotId: 'pac-wrong-id',
    });
    await expect(repository.getSnapshot(snapshot.snapshotId)).rejects.toThrow('is invalid');
  });

  it('separates namespaces and removes snapshots explicitly', async () => {
    const storage = new MemoryStorageArea();
    const first = new BrowserStorageSnapshotActivationRepository(storage, { namespace: 'first' });
    const second = new BrowserStorageSnapshotActivationRepository(storage, { namespace: 'second' });
    await first.putSnapshot(snapshot);
    await expect(second.getSnapshot(snapshot.snapshotId)).resolves.toBeUndefined();
    await first.removeSnapshot(snapshot.snapshotId);
    await expect(first.getSnapshot(snapshot.snapshotId)).resolves.toBeUndefined();
  });
});
