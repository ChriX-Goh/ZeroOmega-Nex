import { cloneProfileSpec, type ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { createProfileWorkflowState } from './state.js';
import {
  BrowserStorageProfileWorkflowRepository,
  type ProfileWorkflowStorageArea,
} from './storage-repository.js';
import { workflowFixture } from './test-fixture.js';

class MemoryStorageArea implements ProfileWorkflowStorageArea {
  readonly values = new Map<string, unknown>();

  async get(keys: string | readonly string[]): Promise<Record<string, unknown>> {
    const selected = typeof keys === 'string' ? [keys] : keys;
    return Object.fromEntries(
      selected.flatMap((key) => (this.values.has(key) ? [[key, this.values.get(key)]] : [])),
    );
  }

  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      this.values.set(key, structuredClone(value));
    }
  }
}

function nextApplied(parent: ProfileSpec, revisionId: string): ProfileSpec {
  const spec = cloneProfileSpec(parent);
  spec.revision = {
    id: revisionId,
    parentRevisionId: parent.revision.id,
    createdAt: '2026-07-25T16:30:00.000Z',
    deviceId: 'device-revision-test',
  };
  spec.profiles[0]!.name = 'Applied Revision Two';
  return spec;
}

describe('ProfileSpec revision repositories', () => {
  it('archives initial and subsequent applied revisions in memory', async () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(initial);
    const applied = nextApplied(initial.applied, 'revision-two');
    const next = {
      ...initial,
      generation: 1,
      applied,
      draft: cloneProfileSpec(applied),
    };

    await expect(repository.compareAndSwap(0, next)).resolves.toBe(true);
    await expect(repository.listRevisions()).resolves.toEqual([
      initial.applied,
      applied,
    ]);
    await expect(repository.getRevision('revision-two')).resolves.toEqual(applied);
  });

  it('rejects attempts to reuse an archived revision ID with different content', async () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(initial);
    const changed = cloneProfileSpec(initial.applied);
    changed.profiles[0]!.name = 'Illegally Reused Revision';

    await expect(
      repository.compareAndSwap(0, {
        ...initial,
        generation: 1,
        applied: changed,
        draft: cloneProfileSpec(changed),
      }),
    ).rejects.toThrow(
      `immutable revision ${initial.applied.revision.id} differs from its archived value`,
    );
  });

  it('persists revision records and index across browser repository instances', async () => {
    const storage = new MemoryStorageArea();
    const first = new BrowserStorageProfileWorkflowRepository(storage);
    const initial = createProfileWorkflowState(workflowFixture());
    await expect(first.compareAndSwap(undefined, initial)).resolves.toBe(true);

    const applied = nextApplied(initial.applied, 'revision-two');
    await expect(
      first.compareAndSwap(0, {
        ...initial,
        generation: 1,
        applied,
        draft: cloneProfileSpec(applied),
      }),
    ).resolves.toBe(true);

    const restarted = new BrowserStorageProfileWorkflowRepository(storage);
    await expect(restarted.listRevisions()).resolves.toEqual([
      initial.applied,
      applied,
    ]);
    await expect(restarted.getRevision(initial.applied.revision.id)).resolves.toEqual(
      initial.applied,
    );
  });

  it('discovers the active legacy revision when no archive index exists', async () => {
    const storage = new MemoryStorageArea();
    const namespace = 'legacy/profile-workflow';
    const initial = createProfileWorkflowState(workflowFixture());
    storage.values.set(`${namespace}/state`, structuredClone(initial));
    const repository = new BrowserStorageProfileWorkflowRepository(storage, { namespace });

    await expect(repository.listRevisions()).resolves.toEqual([initial.applied]);
    await expect(repository.getRevision(initial.applied.revision.id)).resolves.toEqual(
      initial.applied,
    );
  });

  it('rejects malformed indexes and indexed revisions that are unavailable', async () => {
    const storage = new MemoryStorageArea();
    const namespace = 'corrupt/profile-workflow';
    const repository = new BrowserStorageProfileWorkflowRepository(storage, { namespace });

    storage.values.set(`${namespace}/revision-index`, ['revision-one', 'revision-one']);
    await expect(repository.listRevisions()).rejects.toThrow(
      'revision index contains duplicate IDs',
    );

    storage.values.set(`${namespace}/revision-index`, ['revision-missing']);
    await expect(repository.listRevisions()).rejects.toThrow(
      'revision revision-missing is indexed but unavailable',
    );
  });
});
