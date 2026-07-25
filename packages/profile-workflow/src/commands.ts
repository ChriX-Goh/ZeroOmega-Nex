import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';

import { applyProfileWorkflow } from './apply.js';
import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowApplyContext,
  ProfileWorkflowRepository,
  ProfileWorkflowRuntimeView,
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
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'activate-route';
      readonly expectedAppliedRevisionId: string;
      readonly route: ProfileRouteTarget;
    };

export type ProfileWorkflowCommandResponse =
  | {
      readonly ok: true;
      readonly state: ProfileWorkflowState;
      readonly view: ProfileWorkflowView;
      readonly appliedSnapshotId?: string;
      readonly runtime?: ProfileWorkflowRuntimeView;
    }
  | {
      readonly ok: false;
      readonly code:
        | 'conflict'
        | 'invalid'
        | 'busy'
        | 'storage-failure'
        | 'apply-failed'
        | 'activation-failed';
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
  runtime?: ProfileWorkflowRuntimeView,
): ProfileWorkflowCommandResponse {
  return {
    ok: true,
    state,
    view: inspectProfileWorkflow(state),
    ...(appliedSnapshotId === undefined ? {} : { appliedSnapshotId }),
    ...(runtime === undefined ? {} : { runtime }),
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

async function runtimeView(
  applyService: ProfileWorkflowApplyService | undefined,
): Promise<ProfileWorkflowRuntimeView | undefined> {
  if (!applyService?.driver.inspectRuntime) return undefined;
  try {
    return await applyService.driver.inspectRuntime();
  } catch {
    return undefined;
  }
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

function validRoute(value: unknown): value is ProfileRouteTarget {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const route = value as Record<string, unknown>;
  if (route.kind === 'direct' || route.kind === 'system') return true;
  return route.kind === 'profile' && typeof route.profileId === 'string' && route.profileId.length > 0;
}

function sameRoute(left: ProfileRouteTarget, right: ProfileRouteTarget): boolean {
  if (left.kind !== right.kind) return false;
  return left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId);
}

function validateQuickSwitchRoute(state: ProfileWorkflowState, route: ProfileRouteTarget): string | undefined {
  if (!state.applied.settings.quickSwitch.enabled) {
    return 'quick switching is disabled in the applied ProfileSpec';
  }
  if (!state.applied.settings.quickSwitch.routes.some((candidate) => sameRoute(candidate, route))) {
    return 'route is not present in the applied quick-switch list';
  }
  if (route.kind !== 'profile') return undefined;
  const profile = state.applied.profiles.find((candidate) => candidate.id === route.profileId);
  if (!profile) return `profile ${route.profileId} does not exist in the applied ProfileSpec`;
  if (profile.enabled === false) return `profile ${route.profileId} is disabled`;
  return undefined;
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
    case 'activate-route':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        validRoute(record.route)
      );
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

  if (command.action === 'get') {
    return response(state, undefined, await runtimeView(applyService));
  }

  if (command.action === 'activate-route') {
    if (state.applied.revision.id !== command.expectedAppliedRevisionId) {
      return failure(
        'conflict',
        `expected applied revision ${command.expectedAppliedRevisionId}, current revision is ${state.applied.revision.id}`,
        state,
      );
    }
    if (state.pendingApply) {
      return failure('busy', 'profile workflow is busy applying another revision', state);
    }
    if (!applyService) {
      return failure('invalid', 'profile workflow activation service is unavailable', state);
    }
    const invalidRoute = validateQuickSwitchRoute(state, command.route);
    if (invalidRoute) return failure('invalid', invalidRoute, state);
    try {
      const activated = await applyService.driver.activate(state.applied, command.route);
      return response(state, activated.snapshotId, await runtimeView(applyService));
    } catch (error) {
      return failure('activation-failed', errorMessage(error), state);
    }
  }

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
      return response(result.state, result.snapshotId, await runtimeView(applyService));
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
