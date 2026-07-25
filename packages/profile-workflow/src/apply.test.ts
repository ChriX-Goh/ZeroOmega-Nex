import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { applyProfileWorkflow } from './apply.js';
import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowApplyContext,
} from './contracts.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import {
  createProfileWorkflowState,
  inspectProfileWorkflow,
  updateProfileWorkflowDraft,
} from './state.js';
import { workflowFixture } from './test-fixture.js';

const context: ProfileWorkflowApplyContext = {
  applyId: 'apply-1',
  revisionId: 'revision-applied-2',
  startedAt: '2026-07-25T08:10:00.000Z',
  completedAt: '2026-07-25T08:10:01.000Z',
  deviceId: 'device-test',
};

class ActivationDriver implements ProfileWorkflowActivationDriver {
  readonly activated: ProfileSpec[] = [];
  readonly rolledBack: ProfileSpec[] = [];
  activateError?: Error;
  rollbackError?: Error;
  beforeActivateReturn?: () => void;

  async activate(candidate: ProfileSpec): Promise<{ snapshotId: string }> {
    this.activated.push(structuredClone(candidate));
    if (this.activateError) throw this.activateError;
    this.beforeActivateReturn?.();
    return { snapshotId: 'snapshot-applied-2' };
  }

  async rollback(previousApplied: ProfileSpec): Promise<void> {
    this.rolledBack.push(structuredClone(previousApplied));
    if (this.rollbackError) throw this.rollbackError;
  }
}

function dirtyState() {
  return updateProfileWorkflowDraft(createProfileWorkflowState(workflowFixture()), (draft) => {
    draft.profiles[0]!.name = 'Edited Proxy';
  });
}

describe('atomic profile Apply transaction', () => {
  it('commits Applied only after activation succeeds', async () => {
    const repository = new MemoryProfileWorkflowRepository(dirtyState());
    const driver = new ActivationDriver();
    const result = await applyProfileWorkflow(repository, driver, context);
    expect(result.status).toBe('applied');
    if (result.status !== 'applied') throw new Error(result.message);
    expect(result.snapshotId).toBe('snapshot-applied-2');
    expect(result.state.applied.revision.id).toBe('revision-applied-2');
    expect(result.state.applied.revision.parentId).toBe('revision-applied');
    expect(result.state.applied.profiles[0]!.name).toBe('Edited Proxy');
    expect(result.state.draft).toEqual(result.state.applied);
    expect(result.state.pendingApply).toBeUndefined();
    expect(inspectProfileWorkflow(result.state).dirty).toBe(false);
    expect(driver.rolledBack).toHaveLength(0);
  });

  it('keeps Applied intact and Draft recoverable when activation fails', async () => {
    const repository = new MemoryProfileWorkflowRepository(dirtyState());
    const driver = new ActivationDriver();
    driver.activateError = new Error('browser activation failed');
    const result = await applyProfileWorkflow(repository, driver, context);
    expect(result).toMatchObject({
      status: 'failed',
      stage: 'activate',
      message: 'browser activation failed',
    });
    const state = await repository.read();
    expect(state?.applied.revision.id).toBe('revision-applied');
    expect(state?.applied.profiles[0]!.name).toBe('Proxy');
    expect(state?.draft.profiles[0]!.name).toBe('Edited Proxy');
    expect(state?.pendingApply).toBeUndefined();
    expect(state?.lastApply).toMatchObject({ status: 'failed', stage: 'activate' });
  });

  it('rolls browser state back when persistent commit conflicts after activation', async () => {
    const repository = new MemoryProfileWorkflowRepository(dirtyState());
    const driver = new ActivationDriver();
    driver.beforeActivateReturn = () => {
      repository.failNextCompareAndSwap = true;
    };
    const result = await applyProfileWorkflow(repository, driver, context);
    expect(result).toMatchObject({
      status: 'failed',
      stage: 'commit',
      rollbackSucceeded: true,
    });
    expect(driver.rolledBack).toHaveLength(1);
    expect(driver.rolledBack[0]!.revision.id).toBe('revision-applied');
    const state = await repository.read();
    expect(state?.applied.revision.id).toBe('revision-applied');
    expect(state?.draft.profiles[0]!.name).toBe('Edited Proxy');
    expect(state?.pendingApply).toBeUndefined();
  });

  it('persists rollback-required state when browser rollback also fails', async () => {
    const repository = new MemoryProfileWorkflowRepository(dirtyState());
    const driver = new ActivationDriver();
    driver.beforeActivateReturn = () => {
      repository.failNextCompareAndSwap = true;
    };
    driver.rollbackError = new Error('rollback unavailable');
    const result = await applyProfileWorkflow(repository, driver, context);
    expect(result).toMatchObject({
      status: 'failed',
      stage: 'rollback',
      rollbackSucceeded: false,
    });
    const state = await repository.read();
    expect(state?.applied.revision.id).toBe('revision-applied');
    expect(state?.pendingApply).toMatchObject({
      applyId: 'apply-1',
      phase: 'rollback-required',
    });
    expect(state?.lastApply).toMatchObject({
      status: 'failed',
      stage: 'rollback',
      rollbackSucceeded: false,
    });
  });

  it('returns a conflict without touching the browser when Apply cannot acquire state', async () => {
    const repository = new MemoryProfileWorkflowRepository(dirtyState());
    repository.failNextCompareAndSwap = true;
    const driver = new ActivationDriver();
    const result = await applyProfileWorkflow(repository, driver, context);
    expect(result.status).toBe('conflict');
    expect(driver.activated).toHaveLength(0);
    expect(driver.rolledBack).toHaveLength(0);
  });

  it('rejects clean and busy workspaces before browser activation', async () => {
    const clean = new MemoryProfileWorkflowRepository(
      createProfileWorkflowState(workflowFixture()),
    );
    const driver = new ActivationDriver();
    await expect(applyProfileWorkflow(clean, driver, context)).resolves.toMatchObject({
      status: 'clean',
    });

    const busyState = dirtyState();
    busyState.pendingApply = {
      applyId: 'existing-apply',
      candidate: workflowFixture(),
      previousAppliedRevisionId: 'revision-applied',
      startedAt: context.startedAt,
      phase: 'activating',
    };
    const busy = new MemoryProfileWorkflowRepository(busyState);
    await expect(applyProfileWorkflow(busy, driver, context)).resolves.toMatchObject({
      status: 'busy',
    });
    expect(driver.activated).toHaveLength(0);
  });

  it('rejects an uninitialized repository', async () => {
    const result = await applyProfileWorkflow(
      new MemoryProfileWorkflowRepository(),
      new ActivationDriver(),
      context,
    );
    expect(result).toEqual({
      status: 'invalid',
      message: 'profile workflow has not been initialized',
    });
  });
});
