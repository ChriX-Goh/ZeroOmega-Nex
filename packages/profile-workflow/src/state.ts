import {
  cloneProfileSpec,
  createProfileSpecRevision,
  serializeProfileSpec,
  validateProfileSpec,
  type ProfileSpec,
} from '@zeroomega-nex/profile-spec';

import {
  PROFILE_WORKFLOW_SCHEMA_VERSION,
  type ProfileWorkflowApplyContext,
  type ProfileWorkflowState,
  type ProfileWorkflowView,
} from './contracts.js';

function assertValidSpec(spec: ProfileSpec, label: string): void {
  const validation = validateProfileSpec(spec);
  if (!validation.valid) {
    throw new TypeError(`${label} is not a valid ProfileSpec`);
  }
}

function normalizeSelectedProfileId(
  spec: ProfileSpec,
  selectedProfileId: string | undefined,
): string | undefined {
  if (
    selectedProfileId !== undefined &&
    spec.profiles.some((profile) => profile.id === selectedProfileId)
  ) {
    return selectedProfileId;
  }
  return spec.profiles[0]?.id;
}

function normalizeDraft(applied: ProfileSpec, draft: ProfileSpec): ProfileSpec {
  if (draft.documentId !== applied.documentId) {
    throw new TypeError('draft and applied ProfileSpec must use the same documentId');
  }
  const normalized = cloneProfileSpec(draft);
  normalized.revision = structuredClone(applied.revision);
  assertValidSpec(normalized, 'draft');
  return normalized;
}

function userContent(spec: ProfileSpec): string {
  const normalized = cloneProfileSpec(spec);
  normalized.revision = {
    id: 'workflow-content-comparison',
    createdAt: '1970-01-01T00:00:00.000Z',
  };
  return serializeProfileSpec(normalized, { space: 0, trailingNewline: false });
}

export function createProfileWorkflowState(
  applied: ProfileSpec,
  selectedProfileId?: string,
): ProfileWorkflowState {
  assertValidSpec(applied, 'applied');
  const appliedCopy = cloneProfileSpec(applied);
  const selected = normalizeSelectedProfileId(appliedCopy, selectedProfileId);
  const state: ProfileWorkflowState = {
    workflowSchemaVersion: PROFILE_WORKFLOW_SCHEMA_VERSION,
    generation: 0,
    applied: appliedCopy,
    draft: cloneProfileSpec(appliedCopy),
  };
  return selected === undefined ? state : { ...state, selectedProfileId: selected };
}

export function replaceProfileWorkflowDraft(
  state: ProfileWorkflowState,
  draft: ProfileSpec,
): ProfileWorkflowState {
  if (state.pendingApply) throw new Error('cannot replace draft while Apply is in progress');
  const normalized = normalizeDraft(state.applied, draft);
  const selected = normalizeSelectedProfileId(normalized, state.selectedProfileId);
  const { selectedProfileId: _selectedProfileId, ...base } = state;
  const next: ProfileWorkflowState = {
    ...base,
    generation: state.generation + 1,
    draft: normalized,
  };
  return selected === undefined ? next : { ...next, selectedProfileId: selected };
}

export function updateProfileWorkflowDraft(
  state: ProfileWorkflowState,
  update: (draft: ProfileSpec) => void,
): ProfileWorkflowState {
  const draft = cloneProfileSpec(state.draft);
  update(draft);
  return replaceProfileWorkflowDraft(state, draft);
}

export function selectProfileWorkflowProfile(
  state: ProfileWorkflowState,
  profileId: string | undefined,
): ProfileWorkflowState {
  if (
    profileId !== undefined &&
    !state.draft.profiles.some((profile) => profile.id === profileId)
  ) {
    throw new RangeError(`profile ${profileId} does not exist in the draft`);
  }
  if (state.selectedProfileId === profileId) return state;
  const { selectedProfileId: _selectedProfileId, ...base } = state;
  const next: ProfileWorkflowState = {
    ...base,
    generation: state.generation + 1,
  };
  return profileId === undefined ? next : { ...next, selectedProfileId: profileId };
}

export function revertProfileWorkflowDraft(state: ProfileWorkflowState): ProfileWorkflowState {
  if (state.pendingApply) throw new Error('cannot revert draft while Apply is in progress');
  const draft = cloneProfileSpec(state.applied);
  const selected = normalizeSelectedProfileId(draft, state.selectedProfileId);
  const { selectedProfileId: _selectedProfileId, ...base } = state;
  const next: ProfileWorkflowState = {
    ...base,
    generation: state.generation + 1,
    draft,
  };
  return selected === undefined ? next : { ...next, selectedProfileId: selected };
}

export function inspectProfileWorkflow(state: ProfileWorkflowState): ProfileWorkflowView {
  const selectedProfileId = normalizeSelectedProfileId(state.draft, state.selectedProfileId);
  const view: ProfileWorkflowView = {
    dirty: userContent(state.applied) !== userContent(state.draft),
    busy: state.pendingApply !== undefined,
    appliedRevisionId: state.applied.revision.id,
    draftRevisionId: state.draft.revision.id,
    selectedProfileExists:
      selectedProfileId !== undefined &&
      state.draft.profiles.some((profile) => profile.id === selectedProfileId),
  };
  return selectedProfileId === undefined ? view : { ...view, selectedProfileId };
}

export function createProfileWorkflowCandidate(
  state: ProfileWorkflowState,
  context: Pick<ProfileWorkflowApplyContext, 'revisionId' | 'startedAt' | 'deviceId'>,
): ProfileSpec {
  if (!inspectProfileWorkflow(state).dirty) {
    throw new Error('cannot create an Apply candidate from a clean draft');
  }
  return createProfileSpecRevision(state.applied, {
    id: context.revisionId,
    createdAt: context.startedAt,
    ...(context.deviceId === undefined ? {} : { deviceId: context.deviceId }),
    update(candidate) {
      const draft = cloneProfileSpec(state.draft);
      candidate.profiles = draft.profiles;
      candidate.proxyEndpoints = draft.proxyEndpoints;
      candidate.ruleSources = draft.ruleSources;
      candidate.settings = draft.settings;
      if (draft.extensions === undefined) delete candidate.extensions;
      else candidate.extensions = draft.extensions;
    },
  });
}
