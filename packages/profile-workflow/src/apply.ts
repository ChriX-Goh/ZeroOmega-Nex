import { cloneProfileSpec, type ProfileSpec } from '@zeroomega-nex/profile-spec';

import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowActivationResult,
  ProfileWorkflowApplyContext,
  ProfileWorkflowApplyRecord,
  ProfileWorkflowApplyResult,
  ProfileWorkflowPendingApply,
  ProfileWorkflowRepository,
  ProfileWorkflowState,
} from './contracts.js';
import { createProfileWorkflowCandidate, inspectProfileWorkflow } from './state.js';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function withoutPending(
  state: ProfileWorkflowState,
  lastApply: ProfileWorkflowApplyRecord,
): ProfileWorkflowState {
  const next = { ...state };
  delete next.pendingApply;
  delete next.lastApply;
  return {
    ...next,
    generation: state.generation + 1,
    lastApply,
  };
}

async function persistFailure(
  repository: ProfileWorkflowRepository,
  applyId: string,
  record: ProfileWorkflowApplyRecord,
  keepPendingPhase?: ProfileWorkflowPendingApply['phase'],
): Promise<ProfileWorkflowState | undefined> {
  const current = await repository.read();
  if (!current || current.pendingApply?.applyId !== applyId) return current;
  const next =
    keepPendingPhase === undefined
      ? withoutPending(current, record)
      : {
          ...current,
          generation: current.generation + 1,
          pendingApply: { ...current.pendingApply, phase: keepPendingPhase },
          lastApply: record,
        };
  return (await repository.compareAndSwap(current.generation, next)) ? next : repository.read();
}

async function rollbackAfterCommitFailure(
  repository: ProfileWorkflowRepository,
  driver: ProfileWorkflowActivationDriver,
  initial: ProfileWorkflowState,
  context: ProfileWorkflowApplyContext,
  message: string,
): Promise<ProfileWorkflowApplyResult> {
  try {
    await driver.rollback(initial.applied);
    const record: ProfileWorkflowApplyRecord = {
      status: 'failed',
      applyId: context.applyId,
      stage: 'commit',
      message,
      occurredAt: context.completedAt,
      rollbackSucceeded: true,
    };
    const state = await persistFailure(repository, context.applyId, record);
    return {
      status: 'failed',
      stage: 'commit',
      message,
      rollbackSucceeded: true,
      ...(state === undefined ? {} : { state }),
    };
  } catch (rollbackError) {
    const rollbackMessage = `${message}; rollback failed: ${errorMessage(rollbackError)}`;
    const record: ProfileWorkflowApplyRecord = {
      status: 'failed',
      applyId: context.applyId,
      stage: 'rollback',
      message: rollbackMessage,
      occurredAt: context.completedAt,
      rollbackSucceeded: false,
    };
    const state = await persistFailure(repository, context.applyId, record, 'rollback-required');
    return {
      status: 'failed',
      stage: 'rollback',
      message: rollbackMessage,
      rollbackSucceeded: false,
      ...(state === undefined ? {} : { state }),
    };
  }
}

export async function applyProfileWorkflow(
  repository: ProfileWorkflowRepository,
  driver: ProfileWorkflowActivationDriver,
  context: ProfileWorkflowApplyContext,
): Promise<ProfileWorkflowApplyResult> {
  const initial = await repository.read();
  if (!initial) {
    return { status: 'invalid', message: 'profile workflow has not been initialized' };
  }
  if (initial.pendingApply) {
    return { status: 'busy', state: initial, message: 'another Apply operation is pending' };
  }
  if (!inspectProfileWorkflow(initial).dirty) {
    return { status: 'clean', state: initial, message: 'draft has no unapplied changes' };
  }

  let candidate: ProfileSpec;
  try {
    candidate = createProfileWorkflowCandidate(initial, context);
  } catch (error) {
    return {
      status: 'invalid',
      state: initial,
      message: errorMessage(error),
    };
  }

  const pending: ProfileWorkflowState = {
    ...initial,
    generation: initial.generation + 1,
    pendingApply: {
      applyId: context.applyId,
      candidate,
      previousAppliedRevisionId: initial.applied.revision.id,
      startedAt: context.startedAt,
      phase: 'activating',
    },
  };
  if (!(await repository.compareAndSwap(initial.generation, pending))) {
    const state = await repository.read();
    return {
      status: 'conflict',
      message: 'profile workflow changed before Apply could start',
      ...(state === undefined ? {} : { state }),
    };
  }

  let activation: ProfileWorkflowActivationResult;
  try {
    activation = await driver.activate(candidate);
  } catch (error) {
    const message = errorMessage(error);
    const record: ProfileWorkflowApplyRecord = {
      status: 'failed',
      applyId: context.applyId,
      stage: 'activate',
      message,
      occurredAt: context.completedAt,
    };
    const state = await persistFailure(repository, context.applyId, record);
    return {
      status: 'failed',
      stage: 'activate',
      message,
      ...(state === undefined ? {} : { state }),
    };
  }

  const afterActivation = await repository.read();
  if (!afterActivation || afterActivation.pendingApply?.applyId !== context.applyId) {
    return rollbackAfterCommitFailure(
      repository,
      driver,
      initial,
      context,
      'pending Apply state was lost after browser activation',
    );
  }

  const committing: ProfileWorkflowState = {
    ...afterActivation,
    generation: afterActivation.generation + 1,
    pendingApply: { ...afterActivation.pendingApply, phase: 'committing' },
  };
  if (!(await repository.compareAndSwap(afterActivation.generation, committing))) {
    return rollbackAfterCommitFailure(
      repository,
      driver,
      initial,
      context,
      'profile workflow changed before Apply commit',
    );
  }

  const committingBase = { ...committing };
  delete committingBase.pendingApply;
  delete committingBase.lastApply;
  const committed: ProfileWorkflowState = {
    ...committingBase,
    generation: committing.generation + 1,
    applied: cloneProfileSpec(candidate),
    draft: cloneProfileSpec(candidate),
    lastApply: {
      status: 'succeeded',
      applyId: context.applyId,
      revisionId: candidate.revision.id,
      snapshotId: activation.snapshotId,
      completedAt: context.completedAt,
    },
  };
  if (!(await repository.compareAndSwap(committing.generation, committed))) {
    return rollbackAfterCommitFailure(
      repository,
      driver,
      initial,
      context,
      'browser activation succeeded but applied-state commit failed',
    );
  }

  return {
    status: 'applied',
    state: committed,
    snapshotId: activation.snapshotId,
  };
}
