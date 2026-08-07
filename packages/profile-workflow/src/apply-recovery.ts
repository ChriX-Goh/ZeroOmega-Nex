import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowApplyRecord,
  ProfileWorkflowRepository,
  ProfileWorkflowState,
} from './contracts.js';

export type ProfileWorkflowInterruptedApplyRecoveryResult =
  | {
      readonly status: 'nothing-pending';
      readonly state?: ProfileWorkflowState;
    }
  | {
      readonly status: 'recovered';
      readonly state: ProfileWorkflowState;
      readonly applyId: string;
    }
  | {
      readonly status: 'conflict';
      readonly state?: ProfileWorkflowState;
      readonly applyId: string;
      readonly message: string;
    }
  | {
      readonly status: 'failed';
      readonly state?: ProfileWorkflowState;
      readonly applyId: string;
      readonly message: string;
      readonly rollbackSucceeded: boolean;
    };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function recoveryRecord(
  applyId: string,
  message: string,
  occurredAt: string,
  rollbackSucceeded: boolean,
): ProfileWorkflowApplyRecord {
  return {
    status: 'failed',
    applyId,
    stage: 'recovery',
    message,
    occurredAt,
    rollbackSucceeded,
  };
}

function withRecoveryFailure(
  state: ProfileWorkflowState,
  record: ProfileWorkflowApplyRecord,
): ProfileWorkflowState {
  if (!state.pendingApply) return state;
  return {
    ...state,
    generation: state.generation + 1,
    pendingApply: { ...state.pendingApply, phase: 'rollback-required' },
    lastApply: record,
  };
}

function withRecoveredApply(
  state: ProfileWorkflowState,
  record: ProfileWorkflowApplyRecord,
): ProfileWorkflowState {
  const next = { ...state };
  delete next.pendingApply;
  delete next.lastApply;
  return {
    ...next,
    generation: state.generation + 1,
    lastApply: record,
  };
}

export async function recoverInterruptedProfileWorkflowApply(
  repository: ProfileWorkflowRepository,
  driver: ProfileWorkflowActivationDriver,
  occurredAt: string,
): Promise<ProfileWorkflowInterruptedApplyRecoveryResult> {
  let initial: ProfileWorkflowState | undefined;
  try {
    initial = await repository.read();
  } catch (error) {
    return {
      status: 'failed',
      applyId: 'unknown-interrupted-apply',
      message: `interrupted Apply recovery could not read workflow state: ${errorMessage(error)}`,
      rollbackSucceeded: false,
    };
  }

  const pending = initial?.pendingApply;
  if (!initial || !pending) {
    return { status: 'nothing-pending', ...(initial ? { state: initial } : {}) };
  }

  const successMessage =
    'interrupted Apply restored the previous confirmed configuration on restart';
  try {
    await driver.rollback(initial.applied, initial.applied.settings.startup.route);
  } catch (error) {
    const message = `interrupted Apply could not restore the previous confirmed configuration: ${errorMessage(error)}`;
    const record = recoveryRecord(pending.applyId, message, occurredAt, false);
    const failed = withRecoveryFailure(initial, record);
    try {
      if (await repository.compareAndSwap(initial.generation, failed)) {
        return {
          status: 'failed',
          state: failed,
          applyId: pending.applyId,
          message,
          rollbackSucceeded: false,
        };
      }
      const conflicted = await repository.read();
      return {
        status: 'conflict',
        ...(conflicted ? { state: conflicted } : {}),
        applyId: pending.applyId,
        message:
          'workflow state changed while interrupted Apply recovery recorded rollback failure',
      };
    } catch (storageError) {
      return {
        status: 'failed',
        state: initial,
        applyId: pending.applyId,
        message: `${message}; recovery state could not be persisted: ${errorMessage(storageError)}`,
        rollbackSucceeded: false,
      };
    }
  }

  const record = recoveryRecord(pending.applyId, successMessage, occurredAt, true);
  const recovered = withRecoveredApply(initial, record);
  try {
    if (await repository.compareAndSwap(initial.generation, recovered)) {
      return {
        status: 'recovered',
        state: recovered,
        applyId: pending.applyId,
      };
    }
    const conflicted = await repository.read();
    return {
      status: 'conflict',
      ...(conflicted ? { state: conflicted } : {}),
      applyId: pending.applyId,
      message: 'workflow state changed after the previous confirmed configuration was restored',
    };
  } catch (error) {
    return {
      status: 'failed',
      state: initial,
      applyId: pending.applyId,
      message: `previous confirmed configuration was restored but recovery state could not be persisted: ${errorMessage(error)}`,
      rollbackSucceeded: true,
    };
  }
}
