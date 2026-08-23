import { cloneProfileSpec, type ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import {
  rollbackProfileWorkflowSnapshot,
  type ProfileWorkflowSnapshotRollbackPreparation,
  type ProfileWorkflowSnapshotRollbackService,
} from './snapshot-rollback.js';
import { createProfileWorkflowState, updateProfileWorkflowDraft } from './state.js';
import { workflowFixture } from './test-fixture.js';

class FakeRollbackService implements ProfileWorkflowSnapshotRollbackService {
  readonly target: ProfileSpec;
  prepareCount = 0;
  commitCount = 0;
  rollbackCount = 0;
  prepareError?: Error;
  rollbackError?: Error;

  constructor(target: ProfileSpec) {
    this.target = cloneProfileSpec(target);
  }

  async prepare(snapshotId: string): Promise<ProfileWorkflowSnapshotRollbackPreparation> {
    this.prepareCount += 1;
    if (this.prepareError) throw this.prepareError;
    let settled = false;
    return {
      snapshotId,
      targetRevision: cloneProfileSpec(this.target),
      commit: () => {
        if (settled) return;
        settled = true;
        this.commitCount += 1;
      },
      rollback: async () => {
        if (settled) return;
        settled = true;
        this.rollbackCount += 1;
        if (this.rollbackError) throw this.rollbackError;
      },
    };
  }
}

function previousRevision(): ProfileSpec {
  const spec = cloneProfileSpec(workflowFixture());
  spec.revision = {
    id: 'revision-previous',
    createdAt: '2026-07-25T16:40:00.000Z',
    deviceId: 'device-rollback-test',
  };
  spec.profiles = [spec.profiles[1]!];
  spec.proxyEndpoints = [spec.proxyEndpoints[1]!];
  spec.settings.quickSwitch.routes = [
    { kind: 'profile', profileId: spec.profiles[0]!.id },
    { kind: 'direct' },
  ];
  spec.settings.startup.route = {
    kind: 'profile',
    profileId: spec.profiles[0]!.id,
  };
  return spec;
}

describe('profile workflow snapshot rollback transaction', () => {
  it('restores the target revision only after browser preparation succeeds', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    const service = new FakeRollbackService(previousRevision());

    const result = await rollbackProfileWorkflowSnapshot(
      repository,
      state,
      'snapshot-previous',
      service,
    );

    expect(result).toMatchObject({
      status: 'rolled-back',
      snapshotId: 'snapshot-previous',
      state: {
        generation: 1,
        applied: { revision: { id: 'revision-previous' } },
        draft: { revision: { id: 'revision-previous' } },
        selectedProfileId: 'profile-secondary',
      },
    });
    expect(service.commitCount).toBe(1);
    expect(service.rollbackCount).toBe(0);
    await expect(repository.read()).resolves.toMatchObject({
      applied: { revision: { id: 'revision-previous' } },
    });
  });

  it('rejects rollback while Draft contains unapplied changes', async () => {
    const clean = createProfileWorkflowState(workflowFixture());
    const dirty = updateProfileWorkflowDraft(clean, (draft) => {
      draft.profiles[0]!.name = 'Unsaved Edit';
    });
    const service = new FakeRollbackService(previousRevision());

    const result = await rollbackProfileWorkflowSnapshot(
      new MemoryProfileWorkflowRepository(dirty),
      dirty,
      'snapshot-previous',
      service,
    );

    expect(result).toMatchObject({
      status: 'invalid',
      message: 'Draft contains unapplied changes; Apply or Revert before snapshot rollback',
    });
    expect(service.prepareCount).toBe(0);
  });

  it('restores browser state when workflow commit loses a generation race', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    repository.failNextCompareAndSwap = true;
    const service = new FakeRollbackService(previousRevision());

    const result = await rollbackProfileWorkflowSnapshot(
      repository,
      state,
      'snapshot-previous',
      service,
    );

    expect(result).toMatchObject({ status: 'conflict' });
    expect(service.commitCount).toBe(0);
    expect(service.rollbackCount).toBe(1);
    await expect(repository.read()).resolves.toEqual(state);
  });

  it('surfaces browser rollback failure after a workflow conflict', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    repository.failNextCompareAndSwap = true;
    const service = new FakeRollbackService(previousRevision());
    service.rollbackError = new Error('previous browser snapshot could not be restored');

    const result = await rollbackProfileWorkflowSnapshot(
      repository,
      state,
      'snapshot-previous',
      service,
    );

    expect(result).toMatchObject({
      status: 'rollback-failed',
      message:
        'workflow state changed and browser rollback failed: previous browser snapshot could not be restored',
    });
  });

  it('does not mutate workflow state when browser preparation fails', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    const service = new FakeRollbackService(previousRevision());
    service.prepareError = new Error('snapshot is unavailable');

    const result = await rollbackProfileWorkflowSnapshot(
      repository,
      state,
      'snapshot-missing',
      service,
    );

    expect(result).toMatchObject({ status: 'failed', message: 'snapshot is unavailable' });
    await expect(repository.read()).resolves.toEqual(state);
  });

  it('rejects a target revision from another document and rolls browser state back', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const target = previousRevision();
    target.documentId = 'document-foreign';
    const service = new FakeRollbackService(target);

    const result = await rollbackProfileWorkflowSnapshot(
      new MemoryProfileWorkflowRepository(state),
      state,
      'snapshot-foreign',
      service,
    );

    expect(result).toMatchObject({
      status: 'invalid',
      message: 'target revision belongs to document document-foreign',
    });
    expect(service.rollbackCount).toBe(1);
  });
});
