import { describe, expect, it } from 'vitest';

import { createProfileWorkflowState, updateProfileWorkflowDraft } from './state.js';
import {
  BrowserStorageProfileWorkflowRepository,
  parseProfileWorkflowState,
  type ProfileWorkflowStorageArea,
} from './storage-repository.js';
import { workflowFixture } from './test-fixture.js';

class MemoryArea implements ProfileWorkflowStorageArea {
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

describe('persistent profile workflow repository', () => {
  it('persists a working copy across repository instances', async () => {
    const area = new MemoryArea();
    const first = new BrowserStorageProfileWorkflowRepository(area);
    const initial = createProfileWorkflowState(workflowFixture(), 'profile-secondary');
    expect(await first.compareAndSwap(undefined, initial)).toBe(true);

    const edited = updateProfileWorkflowDraft(initial, (draft) => {
      draft.profiles[0]!.name = 'Persistent Edit';
    });
    expect(await first.compareAndSwap(initial.generation, edited)).toBe(true);

    const restarted = new BrowserStorageProfileWorkflowRepository(area);
    await expect(restarted.read()).resolves.toEqual(edited);
  });

  it('rejects stale generations and invalid generation increments', async () => {
    const area = new MemoryArea();
    const repository = new BrowserStorageProfileWorkflowRepository(area);
    const initial = createProfileWorkflowState(workflowFixture());
    await repository.compareAndSwap(undefined, initial);

    const edited = updateProfileWorkflowDraft(initial, (draft) => {
      draft.profiles[0]!.name = 'Edit';
    });
    await expect(repository.compareAndSwap(99, edited)).resolves.toBe(false);
    await expect(
      repository.compareAndSwap(initial.generation, { ...edited, generation: 9 }),
    ).rejects.toThrow('next generation must be 1');
  });

  it('round-trips pending Apply state and failure records', async () => {
    const area = new MemoryArea();
    const repository = new BrowserStorageProfileWorkflowRepository(area);
    const initial = createProfileWorkflowState(workflowFixture());
    await repository.compareAndSwap(undefined, initial);
    const pending = {
      ...initial,
      generation: 1,
      pendingApply: {
        applyId: 'apply-persisted',
        candidate: {
          ...workflowFixture(),
          revision: {
            id: 'revision-candidate',
            parentId: 'revision-applied',
            createdAt: '2026-07-25T08:20:00.000Z',
          },
        },
        previousAppliedRevisionId: 'revision-applied',
        startedAt: '2026-07-25T08:20:00.000Z',
        phase: 'rollback-required' as const,
      },
      lastApply: {
        status: 'failed' as const,
        applyId: 'apply-persisted',
        stage: 'rollback' as const,
        message: 'rollback failed',
        occurredAt: '2026-07-25T08:20:01.000Z',
        rollbackSucceeded: false,
      },
    };
    expect(await repository.compareAndSwap(0, pending)).toBe(true);
    await expect(repository.read()).resolves.toEqual(pending);
  });

  it('rejects corrupt schemas, invalid ProfileSpec values, and mismatched draft revisions', () => {
    expect(() => parseProfileWorkflowState({})).toThrow('schema version is unsupported');
    expect(() =>
      parseProfileWorkflowState({
        workflowSchemaVersion: 1,
        generation: 0,
        applied: {},
        draft: {},
      }),
    ).toThrow('applied must be a valid ProfileSpec');

    const initial = createProfileWorkflowState(workflowFixture());
    expect(() =>
      parseProfileWorkflowState({
        ...initial,
        draft: {
          ...initial.draft,
          revision: {
            id: 'uncommitted-revision',
            createdAt: '2026-07-25T08:21:00.000Z',
          },
        },
      }),
    ).toThrow('draft must retain the applied revision');
  });

  it('isolates versioned namespaces', async () => {
    const area = new MemoryArea();
    const first = new BrowserStorageProfileWorkflowRepository(area, { namespace: 'first' });
    const second = new BrowserStorageProfileWorkflowRepository(area, { namespace: 'second' });
    const initial = createProfileWorkflowState(workflowFixture());
    await first.compareAndSwap(undefined, initial);
    await expect(second.read()).resolves.toBeUndefined();
  });
});
