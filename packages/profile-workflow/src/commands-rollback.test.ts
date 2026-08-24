import { cloneProfileSpec, type ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  type ProfileWorkflowInitializer,
} from './commands.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import type {
  ProfileWorkflowSnapshotRollbackPreparation,
  ProfileWorkflowSnapshotRollbackService,
} from './snapshot-rollback.js';
import { createProfileWorkflowState } from './state.js';
import { workflowFixture } from './test-fixture.js';

class Initializer implements ProfileWorkflowInitializer {
  createInitialProfileSpec(): ProfileSpec {
    return workflowFixture();
  }
}

class RollbackService implements ProfileWorkflowSnapshotRollbackService {
  readonly target: ProfileSpec;
  rollbackError?: Error;
  rollbackCount = 0;

  constructor() {
    this.target = cloneProfileSpec(workflowFixture());
    this.target.revision = {
      id: 'revision-rollback-target',
      createdAt: '2026-07-25T16:45:00.000Z',
    };
  }

  async prepare(snapshotId: string): Promise<ProfileWorkflowSnapshotRollbackPreparation> {
    return {
      snapshotId,
      targetRevision: cloneProfileSpec(this.target),
      commit: () => undefined,
      rollback: async () => {
        this.rollbackCount += 1;
        if (this.rollbackError) throw this.rollbackError;
      },
    };
  }
}

describe('profile workflow snapshot rollback command', () => {
  it('recognizes structurally valid rollback commands', () => {
    expect(
      isProfileWorkflowCommand({
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'rollback-snapshot',
        expectedGeneration: 0,
        snapshotId: 'snapshot-target',
      }),
    ).toBe(true);
    expect(
      isProfileWorkflowCommand({
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'rollback-snapshot',
        expectedGeneration: 0,
        snapshotId: '',
      }),
    ).toBe(false);
  });

  it('commits the target revision and reports the activated snapshot', async () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(initial);
    const response = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'rollback-snapshot',
        expectedGeneration: initial.generation,
        snapshotId: 'snapshot-target',
      },
      undefined,
      undefined,
      undefined,
      new RollbackService(),
    );

    expect(response).toMatchObject({
      ok: true,
      appliedSnapshotId: 'snapshot-target',
      state: {
        generation: 1,
        applied: { revision: { id: 'revision-rollback-target' } },
      },
      view: { dirty: false },
    });
  });

  it('rejects rollback when the background service is unavailable', async () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const response = await executeProfileWorkflowCommand(
      new MemoryProfileWorkflowRepository(initial),
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'rollback-snapshot',
        expectedGeneration: initial.generation,
        snapshotId: 'snapshot-target',
      },
    );

    expect(response).toMatchObject({
      ok: false,
      code: 'invalid',
      message: 'profile workflow snapshot rollback service is unavailable',
    });
  });

  it('maps browser rollback failure to an explicit response code', async () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(initial);
    repository.failNextCompareAndSwap = true;
    const service = new RollbackService();
    service.rollbackError = new Error('browser restore failed');

    const response = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'rollback-snapshot',
        expectedGeneration: initial.generation,
        snapshotId: 'snapshot-target',
      },
      undefined,
      undefined,
      undefined,
      service,
    );

    expect(response).toMatchObject({
      ok: false,
      code: 'rollback-failed',
      message: 'workflow state changed and browser rollback failed: browser restore failed',
    });
  });
});
