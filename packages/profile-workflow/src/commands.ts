import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';

import { applyProfileWorkflow } from './apply.js';
import {
  addPopupConditionDraft,
  setPopupProfileResultDraft,
  type PopupSiteCondition,
} from './popup-condition.js';
import {
  createExternalProfileDraft,
  type ProfileWorkflowExternalProfileService,
} from './external-profile.js';
import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowApplyContext,
  ProfileWorkflowRepository,
  ProfileWorkflowRevisionHistoryEntry,
  ProfileWorkflowRuleSourceUpdateView,
  ProfileWorkflowRuntimeView,
  ProfileWorkflowSnapshotHistoryEntry,
  ProfileWorkflowState,
  ProfileWorkflowView,
} from './contracts.js';
import {
  acceptProfileWorkflowImport,
  type ProfileWorkflowSecretMaterial,
  type ProfileWorkflowSecretStore,
} from './import-acceptance.js';
import {
  inspectProfileWorkflowRuleSourceUpdate,
  updateProfileWorkflowRuleSource,
  type ProfileWorkflowRuleSourceUpdateService,
} from './rule-source-update.js';
import {
  rollbackProfileWorkflowSnapshot,
  type ProfileWorkflowSnapshotRollbackService,
} from './snapshot-rollback.js';
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
      readonly action: 'get-snapshot-history';
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'get-rule-source-update-status';
      readonly sourceId: string;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'update-rule-source';
      readonly expectedGeneration: number;
      readonly sourceId: string;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'replace-draft';
      readonly expectedGeneration: number;
      readonly draft: ProfileSpec;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'accept-import';
      readonly expectedGeneration: number;
      readonly candidate: ProfileSpec;
      readonly secretMaterials: readonly ProfileWorkflowSecretMaterial[];
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'read-secret' | 'remove-secret';
      readonly expectedGeneration: number;
      readonly secretRef: string;
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
      readonly action: 'rollback-snapshot';
      readonly expectedGeneration: number;
      readonly snapshotId: string;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'activate-route';
      readonly expectedAppliedRevisionId: string;
      readonly route: ProfileRouteTarget;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'set-popup-profile-result';
      readonly expectedAppliedRevisionId: string;
      readonly profileId: string;
      readonly route: ProfileRouteTarget;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'add-current-site-condition';
      readonly expectedAppliedRevisionId: string;
      readonly switchProfileId: string;
      readonly ruleId: string;
      readonly condition: PopupSiteCondition;
      readonly route: ProfileRouteTarget;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'import-external-profile';
      readonly expectedAppliedRevisionId: string;
      readonly name: string;
    };

export type ProfileWorkflowCommandResponse =
  | {
      readonly ok: true;
      readonly state: ProfileWorkflowState;
      readonly view: ProfileWorkflowView;
      readonly appliedSnapshotId?: string;
      readonly runtime?: ProfileWorkflowRuntimeView;
      readonly snapshotHistory?: readonly ProfileWorkflowSnapshotHistoryEntry[];
      readonly revisionHistory?: readonly ProfileWorkflowRevisionHistoryEntry[];
      readonly ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView;
      readonly secretValue?: string;
    }
  | {
      readonly ok: false;
      readonly code:
        | 'conflict'
        | 'invalid'
        | 'busy'
        | 'storage-failure'
        | 'apply-failed'
        | 'activation-failed'
        | 'rollback-failed'
        | 'rule-source-update-failed';
      readonly message: string;
      readonly state?: ProfileWorkflowState;
      readonly view?: ProfileWorkflowView;
      readonly ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView;
    };

export interface ProfileWorkflowInitializer {
  createInitialProfileSpec(): ProfileSpec;
}

export interface ProfileWorkflowApplyService {
  readonly driver: ProfileWorkflowActivationDriver;
  createContext(state: ProfileWorkflowState): ProfileWorkflowApplyContext;
}

export interface ProfileWorkflowImportService {
  readonly secretStore: ProfileWorkflowSecretStore;
}

export interface ProfileWorkflowHistoryService {
  listSnapshots(): Promise<readonly ProfileWorkflowSnapshotHistoryEntry[]>;
  listRevisions(
    state: ProfileWorkflowState,
  ): Promise<readonly ProfileWorkflowRevisionHistoryEntry[]>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function response(
  state: ProfileWorkflowState,
  appliedSnapshotId?: string,
  runtime?: ProfileWorkflowRuntimeView,
  snapshotHistory?: readonly ProfileWorkflowSnapshotHistoryEntry[],
  revisionHistory?: readonly ProfileWorkflowRevisionHistoryEntry[],
): Extract<ProfileWorkflowCommandResponse, { readonly ok: true }> {
  return {
    ok: true,
    state,
    view: inspectProfileWorkflow(state),
    ...(appliedSnapshotId === undefined ? {} : { appliedSnapshotId }),
    ...(runtime === undefined ? {} : { runtime }),
    ...(snapshotHistory === undefined ? {} : { snapshotHistory }),
    ...(revisionHistory === undefined ? {} : { revisionHistory }),
  };
}

function responseWithRuleSourceUpdate(
  state: ProfileWorkflowState,
  update: ProfileWorkflowRuleSourceUpdateView,
): Extract<ProfileWorkflowCommandResponse, { readonly ok: true }> {
  return { ...response(state), ruleSourceUpdate: update };
}

function failure(
  code: Extract<ProfileWorkflowCommandResponse, { ok: false }>['code'],
  message: string,
  state?: ProfileWorkflowState,
  ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView,
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
    ...(ruleSourceUpdate === undefined ? {} : { ruleSourceUpdate }),
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

interface EnsuredProfileWorkflowState {
  readonly state: ProfileWorkflowState;
  readonly created: boolean;
}

async function ensureState(
  repository: ProfileWorkflowRepository,
  initializer: ProfileWorkflowInitializer,
): Promise<EnsuredProfileWorkflowState> {
  const current = await repository.read();
  if (current) return { state: current, created: false };
  const initial = createProfileWorkflowState(initializer.createInitialProfileSpec());
  if (await repository.compareAndSwap(undefined, initial)) return { state: initial, created: true };
  const raced = await repository.read();
  if (!raced) throw new Error('profile workflow initialization lost without persisted state');
  return { state: raced, created: false };
}

function validGeneration(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function validRoute(value: unknown): value is ProfileRouteTarget {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const route = value as Record<string, unknown>;
  if (route.kind === 'direct' || route.kind === 'system') return true;
  return (
    route.kind === 'profile' && typeof route.profileId === 'string' && route.profileId.length > 0
  );
}

function validPopupCondition(value: unknown): value is PopupSiteCondition {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const condition = value as Record<string, unknown>;
  if (typeof condition.pattern !== 'string' || condition.pattern.length === 0) return false;
  switch (condition.kind) {
    case 'host-wildcard':
    case 'host-regex':
    case 'url-wildcard':
    case 'url-regex':
      return true;
    case 'keyword':
      return condition.httpOnly === true;
    default:
      return false;
  }
}

function validSecretMaterials(value: unknown): value is readonly ProfileWorkflowSecretMaterial[] {
  return (
    Array.isArray(value) &&
    value.every(
      (material) =>
        material !== null &&
        typeof material === 'object' &&
        !Array.isArray(material) &&
        typeof (material as Record<string, unknown>).ref === 'string' &&
        typeof (material as Record<string, unknown>).value === 'string',
    )
  );
}

function profileSpecReferencesSecret(spec: ProfileSpec, secretRef: string): boolean {
  if (
    spec.proxyEndpoints.some((endpoint) => endpoint.credential?.passwordSecretRef === secretRef)
  ) {
    return true;
  }
  if (spec.settings.sync?.secretRef === secretRef) return true;
  for (const source of spec.ruleSources) {
    if (
      source.headers?.some(
        (header) => header.value.kind === 'secret' && header.value.secretRef === secretRef,
      )
    ) {
      return true;
    }
  }
  for (const profile of spec.profiles) {
    if (
      profile.kind === 'pac' &&
      profile.headers?.some(
        (header) => header.value.kind === 'secret' && header.value.secretRef === secretRef,
      )
    ) {
      return true;
    }
  }
  return false;
}

function sameRoute(left: ProfileRouteTarget, right: ProfileRouteTarget): boolean {
  if (left.kind !== right.kind) return false;
  return (
    left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId)
  );
}

function validateQuickSwitchRoute(
  state: ProfileWorkflowState,
  route: ProfileRouteTarget,
): string | undefined {
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
    case 'get-snapshot-history':
      return true;
    case 'get-rule-source-update-status':
      return typeof record.sourceId === 'string' && record.sourceId.length > 0;
    case 'update-rule-source':
      return (
        validGeneration(record.expectedGeneration) &&
        typeof record.sourceId === 'string' &&
        record.sourceId.length > 0
      );
    case 'replace-draft':
      return validGeneration(record.expectedGeneration) && record.draft !== undefined;
    case 'accept-import':
      return (
        validGeneration(record.expectedGeneration) &&
        record.candidate !== undefined &&
        validSecretMaterials(record.secretMaterials)
      );
    case 'read-secret':
    case 'remove-secret':
      return (
        validGeneration(record.expectedGeneration) &&
        typeof record.secretRef === 'string' &&
        record.secretRef.length > 0
      );
    case 'select-profile':
      return (
        validGeneration(record.expectedGeneration) &&
        (record.profileId === undefined || typeof record.profileId === 'string')
      );
    case 'revert':
    case 'apply':
      return validGeneration(record.expectedGeneration);
    case 'rollback-snapshot':
      return (
        validGeneration(record.expectedGeneration) &&
        typeof record.snapshotId === 'string' &&
        record.snapshotId.length > 0
      );
    case 'activate-route':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        validRoute(record.route)
      );
    case 'set-popup-profile-result':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        typeof record.profileId === 'string' &&
        record.profileId.length > 0 &&
        validRoute(record.route)
      );
    case 'add-current-site-condition':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        typeof record.switchProfileId === 'string' &&
        record.switchProfileId.length > 0 &&
        typeof record.ruleId === 'string' &&
        record.ruleId.length > 0 &&
        validPopupCondition(record.condition) &&
        validRoute(record.route)
      );
    case 'import-external-profile':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        typeof record.name === 'string'
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
  importService?: ProfileWorkflowImportService,
  historyService?: ProfileWorkflowHistoryService,
  rollbackService?: ProfileWorkflowSnapshotRollbackService,
  ruleSourceUpdateService?: ProfileWorkflowRuleSourceUpdateService,
  externalProfileService?: ProfileWorkflowExternalProfileService,
): Promise<ProfileWorkflowCommandResponse> {
  let ensured: EnsuredProfileWorkflowState;
  try {
    ensured = await ensureState(repository, initializer);
  } catch (error) {
    return failure('storage-failure', errorMessage(error));
  }
  const { state, created } = ensured;

  if (command.action === 'get') {
    if (created && applyService) {
      try {
        const activated = await applyService.driver.activate(state.applied, { kind: 'direct' });
        return response(state, activated.snapshotId, await runtimeView(applyService));
      } catch (error) {
        return failure('activation-failed', errorMessage(error), state);
      }
    }
    return response(state, undefined, await runtimeView(applyService));
  }

  if (command.action === 'get-snapshot-history') {
    if (!historyService) {
      return failure('invalid', 'profile workflow history service is unavailable', state);
    }
    try {
      return response(
        state,
        undefined,
        await runtimeView(applyService),
        await historyService.listSnapshots(),
        await historyService.listRevisions(state),
      );
    } catch (error) {
      return failure('storage-failure', errorMessage(error), state);
    }
  }

  if (command.action === 'get-rule-source-update-status') {
    if (!ruleSourceUpdateService) {
      return failure('invalid', 'Rule Source update service is unavailable', state);
    }
    const update = inspectProfileWorkflowRuleSourceUpdate(state, command.sourceId);
    return update === undefined
      ? failure('invalid', `Rule Source ${command.sourceId} is not a remote URL source`, state)
      : responseWithRuleSourceUpdate(state, update);
  }

  if (command.action === 'set-popup-profile-result') {
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
      return failure('invalid', 'profile workflow Apply service is unavailable', state);
    }
    if (inspectProfileWorkflow(state).dirty) {
      return failure(
        'invalid',
        'Apply or discard Options changes before changing a result profile from Popup',
        state,
      );
    }
    const activeRoute = (await runtimeView(applyService))?.activeRoute;
    if (!activeRoute) {
      return failure('invalid', 'the current browser route is unavailable', state);
    }

    let edited: ProfileWorkflowState;
    try {
      edited = replaceProfileWorkflowDraft(
        state,
        setPopupProfileResultDraft(state.applied, command.profileId, command.route),
      );
    } catch (error) {
      return failure('invalid', errorMessage(error), state);
    }
    try {
      if (!(await repository.compareAndSwap(state.generation, edited))) {
        const current = await repository.read();
        return failure(
          'conflict',
          'profile workflow changed before the Popup result profile could be persisted',
          current,
        );
      }
    } catch (error) {
      return failure('storage-failure', errorMessage(error), state);
    }

    const result = await applyProfileWorkflow(repository, applyService.driver, {
      ...applyService.createContext(edited),
      startRoute: activeRoute,
    });
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

  if (command.action === 'add-current-site-condition') {
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
      return failure('invalid', 'profile workflow Apply service is unavailable', state);
    }
    if (inspectProfileWorkflow(state).dirty) {
      return failure(
        'invalid',
        'Apply or discard Options changes before adding a current-site condition from Popup',
        state,
      );
    }
    const runtime = await runtimeView(applyService);
    const activeRoute = runtime?.activeRoute;
    if (activeRoute?.kind !== 'profile' || activeRoute.profileId !== command.switchProfileId) {
      return failure(
        'invalid',
        'current-site conditions can only be added to the active Switch Profile',
        state,
      );
    }
    const activeProfile = state.applied.profiles.find(
      (profile) => profile.id === command.switchProfileId,
    );
    if (!activeProfile || activeProfile.kind !== 'switch' || activeProfile.enabled === false) {
      return failure('invalid', 'the active profile is not an enabled Switch Profile', state);
    }

    let edited: ProfileWorkflowState;
    try {
      const draft = addPopupConditionDraft(state.applied, {
        switchProfileId: command.switchProfileId,
        ruleId: command.ruleId,
        condition: command.condition,
        route: command.route,
      });
      edited = replaceProfileWorkflowDraft(state, draft);
    } catch (error) {
      return failure('invalid', errorMessage(error), state);
    }
    try {
      if (!(await repository.compareAndSwap(state.generation, edited))) {
        const current = await repository.read();
        return failure(
          'conflict',
          'profile workflow changed before the Popup condition could be persisted',
          current,
        );
      }
    } catch (error) {
      return failure('storage-failure', errorMessage(error), state);
    }

    const result = await applyProfileWorkflow(repository, applyService.driver, {
      ...applyService.createContext(edited),
      startRoute: activeRoute,
    });
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

  if (command.action === 'import-external-profile') {
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
    if (!applyService || !externalProfileService) {
      return failure('invalid', 'external profile import service is unavailable', state);
    }
    if (inspectProfileWorkflow(state).dirty) {
      return failure(
        'invalid',
        'Apply or discard Options changes before importing an external profile from Popup',
        state,
      );
    }
    const runtime = await runtimeView(applyService);
    if (runtime?.activeRoute?.kind !== 'system') {
      return failure(
        'invalid',
        'external profiles can only be imported while System Proxy is the active route',
        state,
      );
    }

    let mutation;
    try {
      const candidate = await externalProfileService.readCandidate(state.applied);
      if (!candidate) {
        return failure(
          'invalid',
          'the current browser proxy configuration cannot be imported',
          state,
        );
      }
      mutation = createExternalProfileDraft(
        state.applied,
        candidate,
        command.name,
        externalProfileService.createId,
      );
    } catch (error) {
      return failure('invalid', errorMessage(error), state);
    }

    const route: ProfileRouteTarget = { kind: 'profile', profileId: mutation.profileId };
    if (!mutation.created) {
      try {
        const activated = await applyService.driver.activate(state.applied, route);
        return response(state, activated.snapshotId, await runtimeView(applyService));
      } catch (error) {
        return failure('activation-failed', errorMessage(error), state);
      }
    }

    let edited: ProfileWorkflowState;
    try {
      edited = replaceProfileWorkflowDraft(state, mutation.draft);
      if (!(await repository.compareAndSwap(state.generation, edited))) {
        const current = await repository.read();
        return failure(
          'conflict',
          'profile workflow changed before the external profile could be persisted',
          current,
        );
      }
    } catch (error) {
      return failure('storage-failure', errorMessage(error), state);
    }

    const result = await applyProfileWorkflow(repository, applyService.driver, {
      ...applyService.createContext(edited),
      startRoute: route,
    });
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

  if (command.action === 'update-rule-source') {
    if (!ruleSourceUpdateService) {
      return failure('invalid', 'Rule Source update service is unavailable', state);
    }
    const result = await updateProfileWorkflowRuleSource(
      repository,
      state,
      command.sourceId,
      ruleSourceUpdateService,
    );
    if (result.status === 'updated') {
      return responseWithRuleSourceUpdate(result.state, result.update);
    }
    const code =
      result.status === 'conflict'
        ? 'conflict'
        : result.status === 'storage-failure'
          ? 'storage-failure'
          : result.status === 'invalid'
            ? 'invalid'
            : 'rule-source-update-failed';
    return failure(code, result.message, result.state, result.update);
  }

  if (command.action === 'read-secret') {
    if (!importService) {
      return failure('invalid', 'profile workflow secret store is unavailable', state);
    }
    if (
      !profileSpecReferencesSecret(state.draft, command.secretRef) &&
      !profileSpecReferencesSecret(state.applied, command.secretRef)
    ) {
      return failure('invalid', `secret ${command.secretRef} is not referenced`, state);
    }
    try {
      const secretValue = (await importService.secretStore.getSecret(command.secretRef)) ?? '';
      return { ...response(state), secretValue };
    } catch (error) {
      return failure('storage-failure', errorMessage(error), state);
    }
  }

  if (command.action === 'remove-secret') {
    if (!importService) {
      return failure('invalid', 'profile workflow secret store is unavailable', state);
    }
    if (
      profileSpecReferencesSecret(state.draft, command.secretRef) ||
      profileSpecReferencesSecret(state.applied, command.secretRef)
    ) {
      return failure('invalid', `secret ${command.secretRef} is still referenced`, state);
    }
    try {
      await importService.secretStore.removeSecret(command.secretRef);
      return response(state);
    } catch (error) {
      return failure('storage-failure', errorMessage(error), state);
    }
  }

  if (command.action === 'accept-import') {
    const result = await acceptProfileWorkflowImport(
      repository,
      state,
      command.candidate,
      command.secretMaterials,
      importService?.secretStore,
    );
    if (result.status === 'accepted') return response(result.state);
    return failure(
      result.status === 'conflict'
        ? 'conflict'
        : result.status === 'invalid'
          ? 'invalid'
          : 'storage-failure',
      result.message,
      result.state,
    );
  }

  if (command.action === 'rollback-snapshot') {
    if (!rollbackService) {
      return failure('invalid', 'profile workflow snapshot rollback service is unavailable', state);
    }
    const result = await rollbackProfileWorkflowSnapshot(
      repository,
      state,
      command.snapshotId,
      rollbackService,
    );
    if (result.status === 'rolled-back') {
      return response(result.state, result.snapshotId, await runtimeView(applyService));
    }
    return failure(
      result.status === 'busy'
        ? 'busy'
        : result.status === 'conflict'
          ? 'conflict'
          : result.status === 'invalid'
            ? 'invalid'
            : result.status === 'rollback-failed'
              ? 'rollback-failed'
              : 'activation-failed',
      result.message,
      result.state,
    );
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
