import {
  cloneProfileSpec,
  validateProfileSpec,
  type ProfileSpec,
} from '@zeroomega-nex/profile-spec';

import type { ProfileWorkflowRepository, ProfileWorkflowState } from './contracts.js';
import { inspectProfileWorkflow } from './state.js';

export interface ProfileWorkflowSnapshotRollbackPreparation {
  readonly snapshotId: string;
  readonly targetRevision: ProfileSpec;
  commit(): void;
  rollback(): Promise<void>;
}

export interface ProfileWorkflowSnapshotRollbackService {
  prepare(
    snapshotId: string,
    currentApplied: ProfileSpec,
  ): Promise<ProfileWorkflowSnapshotRollbackPreparation>;
}

export type ProfileWorkflowSnapshotRollbackResult =
  | {
      readonly status: 'rolled-back';
      readonly state: ProfileWorkflowState;
      readonly snapshotId: string;
    }
  | {
      readonly status: 'busy' | 'invalid' | 'conflict' | 'failed' | 'rollback-failed';
      readonly message: string;
      readonly state?: ProfileWorkflowState;
    };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function selectedProfileId(state: ProfileWorkflowState, target: ProfileSpec): string | undefined {
  if (
    state.selectedProfileId !== undefined &&
    target.profiles.some((profile) => profile.id === state.selectedProfileId)
  ) {
    return state.selectedProfileId;
  }
  return target.profiles[0]?.id;
}

function createRollbackState(
  state: ProfileWorkflowState,
  targetRevision: ProfileSpec,
): ProfileWorkflowState {
  const applied = cloneProfileSpec(targetRevision);
  const draft = cloneProfileSpec(targetRevision);
  const selected = selectedProfileId(state, targetRevision);
  const { pendingApply: _pendingApply, ...rest } = state;
  return {
    ...rest,
    generation: state.generation + 1,
    applied,
    draft,
    ...(selected === undefined ? {} : { selectedProfileId: selected }),
  };
}

export async function rollbackProfileWorkflowSnapshot(
  repository: ProfileWorkflowRepository,
  state: ProfileWorkflowState,
  snapshotId: string,
  service: ProfileWorkflowSnapshotRollbackService,
): Promise<ProfileWorkflowSnapshotRollbackResult> {
  if (state.pendingApply) {
    return { status: 'busy', message: 'profile workflow is busy applying another revision', state };
  }
  if (inspectProfileWorkflow(state).dirty) {
    return {
      status: 'invalid',
      message: 'Draft contains unapplied changes; Apply or Revert before snapshot rollback',
      state,
    };
  }
  if (!snapshotId.trim()) {
    return { status: 'invalid', message: 'snapshot rollback ID must not be empty', state };
  }

  let preparation: ProfileWorkflowSnapshotRollbackPreparation;
  try {
    preparation = await service.prepare(snapshotId, state.applied);
  } catch (error) {
    return { status: 'failed', message: errorMessage(error), state };
  }

  const target = preparation.targetRevision;
  const validation = validateProfileSpec(target);
  if (!validation.valid || target.documentId !== state.applied.documentId) {
    try {
      await preparation.rollback();
    } catch (rollbackError) {
      return {
        status: 'rollback-failed',
        message: `target revision is invalid; ${errorMessage(rollbackError)}`,
        state,
      };
    }
    return {
      status: 'invalid',
      message:
        target.documentId !== state.applied.documentId
          ? `target revision belongs to document ${target.documentId}`
          : 'target revision is not a valid ProfileSpec',
      state,
    };
  }

  const next = createRollbackState(state, target);
  try {
    if (await repository.compareAndSwap(state.generation, next)) {
      preparation.commit();
      return { status: 'rolled-back', state: next, snapshotId: preparation.snapshotId };
    }
    const current = await repository.read();
    try {
      await preparation.rollback();
    } catch (rollbackError) {
      return {
        status: 'rollback-failed',
        message: `workflow state changed and browser rollback failed: ${errorMessage(rollbackError)}`,
        ...(current === undefined ? {} : { state: current }),
      };
    }
    return {
      status: 'conflict',
      message: 'profile workflow changed before snapshot rollback could be committed',
      ...(current === undefined ? {} : { state: current }),
    };
  } catch (error) {
    try {
      await preparation.rollback();
    } catch (rollbackError) {
      return {
        status: 'rollback-failed',
        message: `${errorMessage(error)}; browser rollback failed: ${errorMessage(rollbackError)}`,
        state,
      };
    }
    return { status: 'failed', message: errorMessage(error), state };
  }
}
