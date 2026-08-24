import {
  cloneProfileSpecDraft,
  validateProfileSpecDraft,
  type ProfileRouteTarget,
  type ProfileSpec,
  type RuleListProfile,
  type RuleSource,
  type SwitchProfile,
} from '@zeroomega-nex/profile-spec';

import type { ProfileWorkflowIdFactory } from './profile-operations.js';

export interface AttachedRuleListState {
  readonly owner: SwitchProfile;
  readonly profile: RuleListProfile;
  readonly source: RuleSource;
  readonly enabled: boolean;
  readonly defaultRoute: ProfileRouteTarget;
}

function assertValidDraft(draft: ProfileSpec): void {
  const validation = validateProfileSpecDraft(draft);
  if (validation.valid) return;
  const messages = validation.issues
    .filter((entry) => entry.severity === 'error')
    .slice(0, 8)
    .map((entry) => `${entry.code} at ${entry.path}: ${entry.message}`)
    .join('; ');
  throw new TypeError(`attached Rule List operation produced an invalid ProfileSpec: ${messages}`);
}

function findSwitchProfile(draft: ProfileSpec, switchProfileId: string): SwitchProfile {
  const profile = draft.profiles.find(
    (candidate): candidate is SwitchProfile =>
      candidate.id === switchProfileId && candidate.kind === 'switch',
  );
  if (!profile) throw new RangeError(`switch profile ${switchProfileId} does not exist`);
  return profile;
}

function routeTargetsProfile(route: ProfileRouteTarget, profileId: string): boolean {
  return route.kind === 'profile' && route.profileId === profileId;
}

export function attachedRuleListProfileIds(spec: ProfileSpec): ReadonlySet<string> {
  return new Set(
    spec.profiles.flatMap((profile) =>
      profile.kind === 'switch' && profile.attachedRuleListProfileId !== undefined
        ? [profile.attachedRuleListProfileId]
        : [],
    ),
  );
}

export function inspectAttachedRuleList(
  spec: ProfileSpec,
  switchProfileId: string,
): AttachedRuleListState | undefined {
  const owner = spec.profiles.find(
    (candidate): candidate is SwitchProfile =>
      candidate.id === switchProfileId && candidate.kind === 'switch',
  );
  if (!owner?.attachedRuleListProfileId) return undefined;
  const profile = spec.profiles.find(
    (candidate): candidate is RuleListProfile =>
      candidate.id === owner.attachedRuleListProfileId && candidate.kind === 'rule-list',
  );
  if (!profile) return undefined;
  const source = spec.ruleSources.find((candidate) => candidate.id === profile.sourceId);
  if (!source) return undefined;
  const enabled = routeTargetsProfile(owner.defaultRoute, profile.id);
  return {
    owner,
    profile,
    source,
    enabled,
    defaultRoute: enabled ? profile.defaultRoute : owner.defaultRoute,
  };
}

export function createAttachedRuleListDraft(
  spec: ProfileSpec,
  switchProfileId: string,
  idFactory: ProfileWorkflowIdFactory,
): ProfileSpec {
  const draft = cloneProfileSpecDraft(spec);
  const owner = findSwitchProfile(draft, switchProfileId);
  if (owner.attachedRuleListProfileId !== undefined) {
    throw new RangeError(`switch profile ${switchProfileId} already has an attached Rule List`);
  }

  const profileId = idFactory('profile');
  const sourceId = idFactory('source');
  const source: RuleSource = {
    id: sourceId,
    name: `${owner.name} attached rules`,
    format: 'switchy',
    location: { kind: 'inline', content: '' },
  };
  const profile: RuleListProfile = {
    id: profileId,
    name: `__ruleListOf_${owner.name}`,
    ...(owner.color === undefined ? {} : { color: owner.color }),
    kind: 'rule-list',
    sourceId,
    matchRoute: { kind: 'direct' },
    defaultRoute: structuredClone(owner.defaultRoute),
  };

  owner.attachedRuleListProfileId = profileId;
  owner.defaultRoute = { kind: 'profile', profileId };
  draft.ruleSources.push(source);
  draft.profiles.push(profile);
  assertValidDraft(draft);
  return draft;
}

export function setAttachedRuleListEnabledDraft(
  spec: ProfileSpec,
  switchProfileId: string,
  enabled: boolean,
): ProfileSpec {
  const draft = cloneProfileSpecDraft(spec);
  const owner = findSwitchProfile(draft, switchProfileId);
  const state = inspectAttachedRuleList(draft, switchProfileId);
  if (!state) throw new RangeError(`switch profile ${switchProfileId} has no attached Rule List`);
  if (state.enabled === enabled) return draft;

  if (enabled) {
    state.profile.defaultRoute = structuredClone(owner.defaultRoute);
    owner.defaultRoute = { kind: 'profile', profileId: state.profile.id };
  } else {
    owner.defaultRoute = structuredClone(state.profile.defaultRoute);
  }
  assertValidDraft(draft);
  return draft;
}

export function updateAttachedRuleListMatchRouteDraft(
  spec: ProfileSpec,
  switchProfileId: string,
  route: ProfileRouteTarget,
): ProfileSpec {
  const draft = cloneProfileSpecDraft(spec);
  const state = inspectAttachedRuleList(draft, switchProfileId);
  if (!state) throw new RangeError(`switch profile ${switchProfileId} has no attached Rule List`);
  state.profile.matchRoute = structuredClone(route);
  assertValidDraft(draft);
  return draft;
}

export function updateSwitchDefaultRouteDraft(
  spec: ProfileSpec,
  switchProfileId: string,
  route: ProfileRouteTarget,
): ProfileSpec {
  const draft = cloneProfileSpecDraft(spec);
  const owner = findSwitchProfile(draft, switchProfileId);
  const state = inspectAttachedRuleList(draft, switchProfileId);
  if (!state) {
    owner.defaultRoute = structuredClone(route);
  } else if (state.enabled) {
    state.profile.defaultRoute = structuredClone(route);
  } else {
    owner.defaultRoute = structuredClone(route);
    state.profile.defaultRoute = structuredClone(route);
  }
  assertValidDraft(draft);
  return draft;
}

export function detachAttachedRuleListDraft(
  spec: ProfileSpec,
  switchProfileId: string,
): ProfileSpec {
  const draft = cloneProfileSpecDraft(spec);
  const owner = findSwitchProfile(draft, switchProfileId);
  const state = inspectAttachedRuleList(draft, switchProfileId);
  if (!state) throw new RangeError(`switch profile ${switchProfileId} has no attached Rule List`);

  if (state.enabled) owner.defaultRoute = structuredClone(state.profile.defaultRoute);
  delete owner.attachedRuleListProfileId;
  draft.profiles = draft.profiles.filter((profile) => profile.id !== state.profile.id);
  draft.ruleSources = draft.ruleSources.filter((source) => source.id !== state.source.id);
  draft.settings.quickSwitch.routes = draft.settings.quickSwitch.routes.filter(
    (route) => !routeTargetsProfile(route, state.profile.id),
  );
  if (
    draft.settings.startup.route &&
    routeTargetsProfile(draft.settings.startup.route, state.profile.id)
  ) {
    draft.settings.startup.route = { kind: 'direct' };
  }
  assertValidDraft(draft);
  return draft;
}
