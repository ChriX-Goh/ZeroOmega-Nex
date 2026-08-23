import { cloneProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { recoverInterruptedProfileWorkflowApply } from './apply-recovery.js';
import type { ProfileWorkflowActivationDriver, ProfileWorkflowState } from './contracts.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { createProfileWorkflowState, updateProfileWorkflowDraft } from './state.js';
import { workflowFixture } from './test-fixture.js';

class RecoveryDriver implements ProfileWorkflowActivationDriver {
  rollbackCount = 0;
  rollbackError?: Error;
  lastRollbackRevision?: string;

  async activate() {
    return { snapshotId: 'unused' };
  }

  async rollback(previousApplied: Parameters<ProfileWorkflowActivationDriver['rollback']>[0]) {
    this.rollbackCount += 1;
    this.lastRollbackRevision = previousApplied.revision.id;
    if (this.rollbackError) throw this.rollbackError;
  }
}

function interruptedState(
  phase: 'activating' | 'committing' | 'rollback-required',
): ProfileWorkflowState {
  const clean = createProfileWorkflowState(workflowFixture());
  const dirty = updateProfileWorkflowDraft(clean, (draft) => {
    draft.profiles[0]!.name = 'Interrupted candidate edit';
  });
  const candidate = cloneProfileSpec(dirty.draft);
  candidate.revision = {
    id: 'revision-interrupted-candidate',
    parentId: clean.applied.revision.id,
    createdAt: '2026-08-07T08:00:00.000Z',
    deviceId: 'device-recovery-test',
  };
  return {
    ...dirty,
    generation: dirty.generation + 1,
    pendingApply: {
      applyId: `apply-${phase}`,
      candidate,
      previousAppliedRevisionId: clean.applied.revision.id,
      startedAt: '2026-08-07T08:00:00.000Z',
      phase,
    },
  };
}

describe('interrupted profile Apply restart recovery', () => {
  it.each(['activating', 'committing', 'rollback-required'] as const)(
    'restores previous Applied, clears %s pending state, and preserves Draft for retry',
    async (phase) => {
      const state = interruptedState(phase);
      const repository = new MemoryProfileWorkflowRepository(state);
      const driver = new RecoveryDriver();

      const result = await recoverInterruptedProfileWorkflowApply(
        repository,
        driver,
        '2026-08-07T08:01:00.000Z',
      );

      expect(result.status).toBe('recovered');
      if (result.status !== 'recovered') throw new Error(JSON.stringify(result));
      expect(driver.rollbackCount).toBe(1);
      expect(driver.lastRollbackRevision).toBe(state.applied.revision.id);
      expect(result.state.applied).toEqual(state.applied);
      expect(result.state.draft).toEqual(state.draft);
      expect(result.state.pendingApply).toBeUndefined();
      expect(result.state.generation).toBe(state.generation + 1);
      expect(result.state.lastApply).toMatchObject({
        status: 'failed',
        applyId: `apply-${phase}`,
        stage: 'recovery',
        rollbackSucceeded: true,
      });
    },
  );

  it('keeps rollback-required pending state when previous browser configuration cannot be restored', async () => {
    const state = interruptedState('committing');
    const repository = new MemoryProfileWorkflowRepository(state);
    const driver = new RecoveryDriver();
    driver.rollbackError = new Error('browser restore failed');

    const result = await recoverInterruptedProfileWorkflowApply(
      repository,
      driver,
      '2026-08-07T08:02:00.000Z',
    );

    expect(result).toMatchObject({
      status: 'failed',
      rollbackSucceeded: false,
      state: {
        applied: state.applied,
        draft: state.draft,
        pendingApply: { phase: 'rollback-required' },
        lastApply: { stage: 'recovery', rollbackSucceeded: false },
      },
    });
  });

  it('does nothing when no Apply is pending', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    const driver = new RecoveryDriver();
    const result = await recoverInterruptedProfileWorkflowApply(
      repository,
      driver,
      '2026-08-07T08:03:00.000Z',
    );
    expect(result).toMatchObject({ status: 'nothing-pending', state });
    expect(driver.rollbackCount).toBe(0);
    await expect(repository.read()).resolves.toEqual(state);
  });
});
