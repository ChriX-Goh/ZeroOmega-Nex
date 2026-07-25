import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

import { applyProfileWorkflow } from './apply.js';
import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowApplyContext,
  ProfileWorkflowRepository,
  ProfileWorkflowState,
  ProfileWorkflowView,
} from './contracts.js';
import {
  createProfileWorkflowState,
  inspectProfileWorkflow,
  replaceProfileWorkflowDraft,
  revertProfileWorkflowDraft,
  selectProfileWorkflowProfile,
} from './state.js';

export const PROFILE_WORKFLOW_MESSAGE_CHANNEL = 'zeroomega-nex/profile-workflow/v1' as const;

export type ProfileWorkflowCommand =
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'get';
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'replace-draft';
      readonly expectedGeneration: number;
      readonly draft: ProfileSpec;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'select-profile';
      readonly expectedGeneration: number;
      readonly profileId?: string;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'revert' | 'apply';
      readonly expectedGeneration: number;
    };

export type ProfileWorkflowCommandResponse =
  | {
      readonly ok: true;
      readonly state: ProfileWorkflowState;
      readonly view: ProfileWorkflowView;
      readonly appliedSnapshotId?: string;
    }
  | {
      readonly ok: false;
      readonly code:
        | 'conflict'
        | 'invalid'
        | 'busy'
        | 'storage-failure'
        | 'apply-failed';
      readonly message: string;
      readonly state?: ProfileWorkflowState;
      readonly view?: ProfileWorkflowView;
    };

export interface ProfileWorkflowInitializer {
  createInitialProfileSpec(): ProfileSpec;
}

export interface ProfileWorkflowApplyService {
  readonly driver: ProfileWorkflowActivationDriver;
  createContext(state: ProfileWorkflowState): ProfileWorkflowApplyContext;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function response(
  state: ProfileWorkflowState,
  appliedSnapshotId?: string,
): ProfileWorkflowCommandResponse {
  return {
    ok: true,
    state,
    view: inspectProfileWorkflow(state),
    ...(appliedSnapshotId === undefined ? {} : { appliedSnapshotId }),
  };
}

function failure(
  code: Extract<ProfileWorkflowCommandResponse, { ok: false }>['code'],
  message: string,
  state?: ProfileWorkflowState,
): ProfileWorkflowCommandResponse {
  return {
    ok: false,
    code,
    message,
    ...(state === undefined
      ? {}
      : {
          state,
          view: inspectProfileWorkflow(state),
        }),
  };
}

async function ensureState(
  repository: ProfileWorkflowRepository,
  initializer: ProfileWorkflowInitializer,
): Promise<ProfileWorkflowState> {
  const current = await repository.read();
  if (current) return current;
  const initial = createProfileWorkflowState(initializer.createInitialProfileSpec());
  if (await repository.compareAndSwap(undefined, initial)) return initial;
  const raced = await repository.read();
  if (!raced) throw new Error('profile workflow initialization lost without persisted state');
  return raced;
}

function validGeneration(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

export function isProfileWorkflowCommand(value: unknown): value is ProfileWorkflowCommand {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.channel !== PROFILE_WORKFLOW_MESSAGE_CHANNEL) return false;
  switch (record.action) {
    case 'get':
      return true;
    case 'replace-draft':
      return validGeneration(record.expectedGeneration) && record.draft !== undefined;
    case 'select-profile':
      return (
        validGeneration(record.expectedGeneration) &&
        (record.profileId === undefined || typeof record.profileId === 'string')
      );
    case 'revert':
    case 'apply':
      return validGeneration(record.expectedGeneration);
    default:
      return false;
  }
}

export async function executeProfileWorkflowCommand(
  repository: ProfileWorkflowRepository,
  initializer: ProfileWorkflowInitializer,
  command: ProfileWorkflowCommand,
  applyService?: ProfileWorkflowApplyService,
): Promise<ProfileWorkflowCommandResponse> {
  let state: ProfileWorkflowState;
  try {
    state = await ensureState(repository, initializer);
  } catch (error) {
    return failure('storage-failure', errorMessage(error));
  }

  if (command.action === 'get') return response(state);
  if (state.generation !== command.expectedGeneration) {
    return failure(
      'conflict',
      `expected generation ${command.expectedGeneration}, current generation is ${state.generation}`,
      state,
    );
  }
  if (state.pendingApply) {
    return failure('busy', 'profile workflow is busy applying another revision', state);
  }

  if (command.action === 'apply') {
    if (!applyService) {
      return failure('invalid', 'profile workflow Apply service is unavailable', state);
    }
    const result = await applyProfileWorkflow(
      repository,
      applyService.driver,
      applyService.createContext(state),
    );
    if (result.status === 'applied') {
      return response(result.state, result.snapshotId);
    }
    return failure(
      result.status === 'busy'
        ? 'busy'
        : result.status === 'conflict'
          ? 'conflict'
          : result.status === 'failed'
            ? 'apply-failed'
            : 'invalid',
      result.message,
      result.state,
    );
  }

  let next: ProfileWorkflowState;
  try {
    switch (command.action) {
      case 'replace-draft':
        next = replaceProfileWorkflowDraft(state, command.draft);
        break;
      case 'select-profile':
        next = selectProfileWorkflowProfile(state, command.profileId);
        break;
      case 'revert':
        next = revertProfileWorkflowDraft(state);
        break;
    }
  } catch (error) {
    return failure('invalid', errorMessage(error), state);
  }

  try {
    if (!(await repository.compareAndSwap(state.generation, next))) {
      const current = await repository.read();
      return failure(
        'conflict',
        'profile workflow changed before the command could be persisted',
        current,
      );
    }
  } catch (error) {
    return failure('storage-failure', errorMessage(error), state);
  }
  return response(next);
}
