import {
  cloneProfileSpecDraft,
  validateProfileSpecDraft,
  type FixedProfile,
  type ProfileRouteTarget,
  type ProfileSpec,
  type RuleListProfile,
  type RuleSource,
  type SwitchProfile,
  type UserProfile,
  type VirtualProfile,
} from '@zeroomega-nex/profile-spec';

const PROFILE_COLORS = ['#64b5f6', '#8bc34a', '#ffb74d', '#9575cd', '#4db6ac', '#e57373'] as const;

export type ProfileWorkflowIdKind = 'profile' | 'endpoint' | 'bypass' | 'rule' | 'source';
export type ProfileWorkflowIdFactory = (kind: ProfileWorkflowIdKind) => string;

export interface ProfileWorkflowProfileMutation {
  readonly draft: ProfileSpec;
  readonly profileId: string;
}

function assertValidDraft(draft: ProfileSpec): void {
  const validation = validateProfileSpecDraft(draft);
  if (validation.valid) return;
  const messages = validation.issues
    .filter((entry) => entry.severity === 'error')
    .slice(0, 8)
    .map((entry) => `${entry.code} at ${entry.path}: ${entry.message}`)
    .join('; ');
  throw new TypeError(`profile operation produced an invalid ProfileSpec: ${messages}`);
}

function uniqueProfileName(spec: ProfileSpec, preferred: string): string {
  const names = new Set(spec.profiles.map((profile) => profile.name));
  if (!names.has(preferred)) return preferred;
  let suffix = 2;
  while (names.has(`${preferred} ${suffix}`)) suffix += 1;
  return `${preferred} ${suffix}`;
}

function routeTargetsProfile(route: ProfileRouteTarget | undefined, profileId: string): boolean {
  return route?.kind === 'profile' && route.profileId === profileId;
}

function appendQuickSwitchRoute(spec: ProfileSpec, profileId: string): void {
  if (
    spec.settings.quickSwitch.routes.some(
      (route) => route.kind === 'profile' && route.profileId === profileId,
    )
  ) {
    return;
  }
  spec.settings.quickSwitch.routes.push({ kind: 'profile', profileId });
}

function duplicateFixedProfileResources(
  spec: ProfileSpec,
  profile: FixedProfile,
  idFactory: ProfileWorkflowIdFactory,
): FixedProfile {
  const duplicate = structuredClone(profile);
  const endpointIds = new Map<string, string>();

  for (const endpointId of Object.values(profile.proxyByScheme)) {
    if (endpointId === undefined || endpointIds.has(endpointId)) continue;
    const endpoint = spec.proxyEndpoints.find((candidate) => candidate.id === endpointId);
    if (!endpoint) throw new RangeError(`proxy endpoint ${endpointId} does not exist`);
    const duplicateEndpointId = idFactory('endpoint');
    endpointIds.set(endpointId, duplicateEndpointId);
    spec.proxyEndpoints.push({
      ...structuredClone(endpoint),
      id: duplicateEndpointId,
      name: `${endpoint.name} copy`,
    });
  }

  duplicate.proxyByScheme = Object.fromEntries(
    Object.entries(profile.proxyByScheme).map(([scheme, endpointId]) => [
      scheme,
      endpointId === undefined ? undefined : endpointIds.get(endpointId),
    ]),
  ) as FixedProfile['proxyByScheme'];
  duplicate.bypass = profile.bypass.map((entry) => ({
    ...structuredClone(entry),
    id: idFactory('bypass'),
  }));
  return duplicate;
}

interface DuplicatedSwitchResources {
  readonly profile: SwitchProfile;
  readonly attachedProfile?: RuleListProfile;
  readonly attachedSource?: RuleSource;
}

function duplicateSwitchProfileResources(
  spec: ProfileSpec,
  source: SwitchProfile,
  duplicateProfileId: string,
  idFactory: ProfileWorkflowIdFactory,
): DuplicatedSwitchResources {
  const profile = structuredClone(source);
  profile.rules = profile.rules.map((rule) => ({
    ...rule,
    id: idFactory('rule'),
  }));

  const attachedId = source.attachedRuleListProfileId;
  if (attachedId === undefined) return { profile };
  const attached = spec.profiles.find(
    (candidate): candidate is RuleListProfile =>
      candidate.id === attachedId && candidate.kind === 'rule-list',
  );
  if (!attached) throw new RangeError(`attached Rule List profile ${attachedId} does not exist`);
  const attachedSource = spec.ruleSources.find((candidate) => candidate.id === attached.sourceId);
  if (!attachedSource) throw new RangeError(`rule source ${attached.sourceId} does not exist`);

  const duplicateAttachedId = idFactory('profile');
  const duplicateSourceId = idFactory('source');
  const duplicatedAttached: RuleListProfile = {
    ...structuredClone(attached),
    id: duplicateAttachedId,
    name: `__ruleListOf_${source.name} copy`,
    sourceId: duplicateSourceId,
  };
  const duplicatedSource: RuleSource = {
    ...structuredClone(attachedSource),
    id: duplicateSourceId,
    name: `${source.name} copy attached rules`,
  };
  profile.attachedRuleListProfileId = duplicateAttachedId;
  if (routeTargetsProfile(profile.defaultRoute, attachedId)) {
    profile.defaultRoute = { kind: 'profile', profileId: duplicateAttachedId };
  }
  return { profile, attachedProfile: duplicatedAttached, attachedSource: duplicatedSource };
}

export function createFixedProfileDraft(
  spec: ProfileSpec,
  idFactory: ProfileWorkflowIdFactory,
  preferredName = 'New profile',
): ProfileWorkflowProfileMutation {
  const draft = cloneProfileSpecDraft(spec);
  const profileId = idFactory('profile');
  const color = PROFILE_COLORS[draft.profiles.length % PROFILE_COLORS.length] ?? PROFILE_COLORS[0];
  const profile: FixedProfile = {
    id: profileId,
    name: uniqueProfileName(draft, preferredName),
    color,
    kind: 'fixed',
    proxyByScheme: {},
    bypass: [
      { id: idFactory('bypass'), pattern: '127.0.0.1' },
      { id: idFactory('bypass'), pattern: '[::1]' },
      { id: idFactory('bypass'), pattern: 'localhost' },
    ],
  };
  draft.profiles.push(profile);
  appendQuickSwitchRoute(draft, profileId);
  assertValidDraft(draft);
  return { draft, profileId };
}

export function duplicateProfileDraft(
  spec: ProfileSpec,
  sourceProfileId: string,
  idFactory: ProfileWorkflowIdFactory,
): ProfileWorkflowProfileMutation {
  const draft = cloneProfileSpecDraft(spec);
  const sourceIndex = draft.profiles.findIndex((profile) => profile.id === sourceProfileId);
  const source = draft.profiles[sourceIndex];
  if (!source) throw new RangeError(`profile ${sourceProfileId} does not exist`);

  const profileId = idFactory('profile');
  let duplicate: UserProfile;
  let attachedProfile: RuleListProfile | undefined;
  let attachedSource: RuleSource | undefined;
  if (source.kind === 'fixed') {
    duplicate = duplicateFixedProfileResources(draft, source, idFactory);
  } else if (source.kind === 'switch') {
    const resources = duplicateSwitchProfileResources(draft, source, profileId, idFactory);
    duplicate = resources.profile;
    attachedProfile = resources.attachedProfile;
    attachedSource = resources.attachedSource;
  } else {
    duplicate = structuredClone(source);
  }

  duplicate.id = profileId;
  duplicate.name = uniqueProfileName(draft, `${source.name} copy`);
  if (attachedProfile) attachedProfile.name = `__ruleListOf_${duplicate.name}`;
  if (attachedSource) attachedSource.name = `${duplicate.name} attached rules`;
  draft.profiles.push(duplicate);
  if (attachedProfile) draft.profiles.push(attachedProfile);
  if (attachedSource) draft.ruleSources.push(attachedSource);
  appendQuickSwitchRoute(draft, profileId);
  assertValidDraft(draft);
  return { draft, profileId };
}

export interface ProfileReferenceBlocker {
  readonly profileId: string;
  readonly profileName: string;
  readonly profileKind: UserProfile['kind'];
  readonly viaAttachedRuleListProfileId?: string;
}

function profileReferencesTarget(profile: UserProfile, targetProfileId: string): boolean {
  switch (profile.kind) {
    case 'fixed':
      return false;
    case 'switch':
      return (
        routeTargetsProfile(profile.defaultRoute, targetProfileId) ||
        profile.rules.some((rule) => routeTargetsProfile(rule.route, targetProfileId))
      );
    case 'rule-list':
      return (
        routeTargetsProfile(profile.matchRoute, targetProfileId) ||
        routeTargetsProfile(profile.defaultRoute, targetProfileId)
      );
    case 'pac':
    case 'auto-detect':
      return routeTargetsProfile(profile.fallbackRoute, targetProfileId);
    case 'virtual':
      return routeTargetsProfile(profile.targetRoute, targetProfileId);
  }
}

function deletionProfileIds(profile: UserProfile): ReadonlySet<string> {
  return new Set([
    profile.id,
    ...(profile.kind === 'switch' && profile.attachedRuleListProfileId !== undefined
      ? [profile.attachedRuleListProfileId]
      : []),
  ]);
}

function attachedRuleListOwnerById(spec: ProfileSpec): ReadonlyMap<string, SwitchProfile> {
  return new Map(
    spec.profiles.flatMap((profile) =>
      profile.kind === 'switch' && profile.attachedRuleListProfileId !== undefined
        ? [[profile.attachedRuleListProfileId, profile] as const]
        : [],
    ),
  );
}

export function listProfileReferenceBlockers(
  spec: ProfileSpec,
  profileId: string,
): readonly ProfileReferenceBlocker[] {
  const deleted = spec.profiles.find((profile) => profile.id === profileId);
  if (!deleted) throw new RangeError(`profile ${profileId} does not exist`);
  const deletedIds = deletionProfileIds(deleted);
  const attachedOwners = attachedRuleListOwnerById(spec);
  const blockers = new Map<string, ProfileReferenceBlocker>();

  for (const profile of spec.profiles) {
    if (deletedIds.has(profile.id)) continue;
    if (![...deletedIds].some((deletedId) => profileReferencesTarget(profile, deletedId))) continue;

    const owner = attachedOwners.get(profile.id);
    const visibleProfile = owner && !deletedIds.has(owner.id) ? owner : profile;
    if (deletedIds.has(visibleProfile.id) || blockers.has(visibleProfile.id)) continue;
    blockers.set(visibleProfile.id, {
      profileId: visibleProfile.id,
      profileName: visibleProfile.name,
      profileKind: visibleProfile.kind,
      ...(owner === undefined ? {} : { viaAttachedRuleListProfileId: profile.id }),
    });
  }

  return [...blockers.values()];
}

export function createVirtualProfileDraft(
  spec: ProfileSpec,
  idFactory: ProfileWorkflowIdFactory,
  preferredName = 'New virtual profile',
): ProfileWorkflowProfileMutation {
  const draft = cloneProfileSpecDraft(spec);
  const profileId = idFactory('profile');
  const profile: VirtualProfile = {
    id: profileId,
    name: uniqueProfileName(draft, preferredName),
    kind: 'virtual',
    targetRoute: { kind: 'direct' },
  };
  draft.profiles.push(profile);
  appendQuickSwitchRoute(draft, profileId);
  assertValidDraft(draft);
  return { draft, profileId };
}

function replaceRouteReference(
  route: ProfileRouteTarget | undefined,
  fromProfileId: string,
  toProfileId: string,
): ProfileRouteTarget | undefined {
  return routeTargetsProfile(route, fromProfileId)
    ? { kind: 'profile', profileId: toProfileId }
    : route;
}

export function replaceProfileReferencesDraft(
  spec: ProfileSpec,
  fromProfileId: string,
  toProfileId: string,
): ProfileSpec {
  if (fromProfileId === toProfileId) return cloneProfileSpecDraft(spec);
  const draft = cloneProfileSpecDraft(spec);
  if (!draft.profiles.some((profile) => profile.id === fromProfileId)) {
    throw new RangeError(`profile ${fromProfileId} does not exist`);
  }
  if (!draft.profiles.some((profile) => profile.id === toProfileId)) {
    throw new RangeError(`profile ${toProfileId} does not exist`);
  }
  const attachedIds = new Set(
    draft.profiles.flatMap((profile) =>
      profile.kind === 'switch' && profile.attachedRuleListProfileId !== undefined
        ? [profile.attachedRuleListProfileId]
        : [],
    ),
  );
  if (attachedIds.has(fromProfileId) || attachedIds.has(toProfileId)) {
    throw new RangeError('attached Rule List profiles cannot be replacement endpoints');
  }
  for (const profile of draft.profiles) {
    if (profile.id === fromProfileId || profile.id === toProfileId) continue;
    switch (profile.kind) {
      case 'fixed':
        break;
      case 'switch':
        profile.defaultRoute = replaceRouteReference(
          profile.defaultRoute,
          fromProfileId,
          toProfileId,
        )!;
        profile.rules = profile.rules.map((rule) => ({
          ...rule,
          route: replaceRouteReference(rule.route, fromProfileId, toProfileId)!,
        }));
        break;
      case 'rule-list':
        profile.matchRoute = replaceRouteReference(profile.matchRoute, fromProfileId, toProfileId)!;
        profile.defaultRoute = replaceRouteReference(
          profile.defaultRoute,
          fromProfileId,
          toProfileId,
        )!;
        break;
      case 'virtual':
        profile.targetRoute = replaceRouteReference(
          profile.targetRoute,
          fromProfileId,
          toProfileId,
        )!;
        break;
      case 'pac':
      case 'auto-detect': {
        const next = replaceRouteReference(profile.fallbackRoute, fromProfileId, toProfileId);
        if (next === undefined) delete profile.fallbackRoute;
        else profile.fallbackRoute = next;
        break;
      }
    }
  }
  const startupRoute = replaceRouteReference(
    draft.settings.startup.route,
    fromProfileId,
    toProfileId,
  );
  if (startupRoute === undefined) delete draft.settings.startup.route;
  else draft.settings.startup.route = startupRoute;
  draft.settings.quickSwitch.routes = draft.settings.quickSwitch.routes.map(
    (route) => replaceRouteReference(route, fromProfileId, toProfileId)!,
  );
  const seen = new Set<string>();
  draft.settings.quickSwitch.routes = draft.settings.quickSwitch.routes.filter((route) => {
    const key = route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  assertValidDraft(draft);
  return draft;
}

function referencedEndpointIds(spec: ProfileSpec): Set<string> {
  const ids = new Set<string>();
  for (const profile of spec.profiles) {
    if (profile.kind !== 'fixed') continue;
    for (const endpointId of Object.values(profile.proxyByScheme)) {
      if (endpointId !== undefined) ids.add(endpointId);
    }
  }
  return ids;
}

function referencedRuleSourceIds(spec: ProfileSpec): Set<string> {
  return new Set(
    spec.profiles
      .filter((profile) => profile.kind === 'rule-list')
      .map((profile) => profile.sourceId),
  );
}

export function deleteProfileDraft(spec: ProfileSpec, profileId: string): ProfileSpec {
  const deletedSource = spec.profiles.find((profile) => profile.id === profileId);
  if (!deletedSource) throw new RangeError(`profile ${profileId} does not exist`);
  const blockers = listProfileReferenceBlockers(spec, profileId);
  if (blockers.length > 0) {
    throw new RangeError(
      `profile ${deletedSource.name} is referenced by ${blockers
        .map((blocker) => blocker.profileName)
        .join(', ')}`,
    );
  }

  const draft = cloneProfileSpecDraft(spec);
  const deleted = draft.profiles.find((profile) => profile.id === profileId)!;
  const deletedProfileIds = new Set<string>(deletionProfileIds(deleted));
  const attachedOwner = draft.profiles.find(
    (profile): profile is SwitchProfile =>
      profile.kind === 'switch' && profile.attachedRuleListProfileId === profileId,
  );
  if (attachedOwner && deleted.kind === 'rule-list') {
    if (routeTargetsProfile(attachedOwner.defaultRoute, deleted.id)) {
      attachedOwner.defaultRoute = structuredClone(deleted.defaultRoute);
    }
    delete attachedOwner.attachedRuleListProfileId;
  }
  if (deleted.kind === 'switch' && deleted.attachedRuleListProfileId !== undefined) {
    deletedProfileIds.add(deleted.attachedRuleListProfileId);
  }

  const deletedProfiles = draft.profiles.filter((profile) => deletedProfileIds.has(profile.id));
  const deletedEndpointIds = new Set(
    deletedProfiles.flatMap((profile) =>
      profile.kind === 'fixed'
        ? Object.values(profile.proxyByScheme).filter((id): id is string => id !== undefined)
        : [],
    ),
  );
  const deletedRuleSourceIds = new Set(
    deletedProfiles.flatMap((profile) => (profile.kind === 'rule-list' ? [profile.sourceId] : [])),
  );

  draft.profiles = draft.profiles.filter((profile) => !deletedProfileIds.has(profile.id));

  if (
    draft.settings.startup.route?.kind === 'profile' &&
    deletedProfileIds.has(draft.settings.startup.route.profileId)
  ) {
    delete draft.settings.startup.route;
  }
  draft.settings.quickSwitch.routes = draft.settings.quickSwitch.routes.filter(
    (route) => route.kind !== 'profile' || !deletedProfileIds.has(route.profileId),
  );

  const retainedEndpointIds = referencedEndpointIds(draft);
  draft.proxyEndpoints = draft.proxyEndpoints.filter(
    (endpoint) => !deletedEndpointIds.has(endpoint.id) || retainedEndpointIds.has(endpoint.id),
  );
  const retainedRuleSourceIds = referencedRuleSourceIds(draft);
  draft.ruleSources = draft.ruleSources.filter(
    (source) => !deletedRuleSourceIds.has(source.id) || retainedRuleSourceIds.has(source.id),
  );

  assertValidDraft(draft);
  return draft;
}
