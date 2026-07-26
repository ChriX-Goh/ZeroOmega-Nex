import {
  cloneProfileSpec,
  validateProfileSpec,
  type FixedProfile,
  type ProfileRouteTarget,
  type ProfileSpec,
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
  const validation = validateProfileSpec(draft);
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

function directRoute(): ProfileRouteTarget {
  return { kind: 'direct' };
}

function replaceDeletedRoute(
  route: ProfileRouteTarget | undefined,
  profileId: string,
): ProfileRouteTarget | undefined {
  return routeTargetsProfile(route, profileId) ? directRoute() : route;
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

export function createFixedProfileDraft(
  spec: ProfileSpec,
  idFactory: ProfileWorkflowIdFactory,
  preferredName = 'New profile',
): ProfileWorkflowProfileMutation {
  const draft = cloneProfileSpec(spec);
  const profileId = idFactory('profile');
  const endpointId = idFactory('endpoint');
  const color = PROFILE_COLORS[draft.profiles.length % PROFILE_COLORS.length] ?? PROFILE_COLORS[0];
  const profile: FixedProfile = {
    id: profileId,
    name: uniqueProfileName(draft, preferredName),
    color,
    kind: 'fixed',
    proxyByScheme: { fallback: endpointId },
    bypass: [
      { id: idFactory('bypass'), pattern: '127.0.0.1' },
      { id: idFactory('bypass'), pattern: '::1' },
      { id: idFactory('bypass'), pattern: 'localhost' },
    ],
  };
  draft.proxyEndpoints.push({
    id: endpointId,
    name: `${profile.name} endpoint`,
    protocol: 'http',
    host: '127.0.0.1',
    port: 7890,
  });
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
  const draft = cloneProfileSpec(spec);
  const sourceIndex = draft.profiles.findIndex((profile) => profile.id === sourceProfileId);
  const source = draft.profiles[sourceIndex];
  if (!source) throw new RangeError(`profile ${sourceProfileId} does not exist`);

  const profileId = idFactory('profile');
  let duplicate: UserProfile;
  if (source.kind === 'fixed') {
    duplicate = duplicateFixedProfileResources(draft, source, idFactory);
  } else {
    duplicate = structuredClone(source);
    if (duplicate.kind === 'switch') {
      duplicate.rules = duplicate.rules.map((rule) => ({
        ...rule,
        id: idFactory('rule'),
      }));
    }
  }

  duplicate.id = profileId;
  duplicate.name = uniqueProfileName(draft, `${source.name} copy`);
  draft.profiles.push(duplicate);
  appendQuickSwitchRoute(draft, profileId);
  assertValidDraft(draft);
  return { draft, profileId };
}

function rewriteProfileRoutes(profile: UserProfile, deletedProfileId: string): void {
  switch (profile.kind) {
    case 'fixed':
      return;
    case 'switch':
      profile.defaultRoute = replaceDeletedRoute(profile.defaultRoute, deletedProfileId)!;
      profile.rules = profile.rules.map((rule) => ({
        ...rule,
        route: replaceDeletedRoute(rule.route, deletedProfileId)!,
      }));
      return;
    case 'rule-list':
      profile.matchRoute = replaceDeletedRoute(profile.matchRoute, deletedProfileId)!;
      profile.defaultRoute = replaceDeletedRoute(profile.defaultRoute, deletedProfileId)!;
      return;
    case 'virtual':
      profile.targetRoute = replaceDeletedRoute(profile.targetRoute, deletedProfileId)!;
      return;
    case 'pac':
    case 'auto-detect': {
      const fallbackRoute = replaceDeletedRoute(profile.fallbackRoute, deletedProfileId);
      if (fallbackRoute === undefined) delete profile.fallbackRoute;
      else profile.fallbackRoute = fallbackRoute;
    }
  }
}

export function createVirtualProfileDraft(
  spec: ProfileSpec,
  idFactory: ProfileWorkflowIdFactory,
  preferredName = 'New virtual profile',
): ProfileWorkflowProfileMutation {
  const draft = cloneProfileSpec(spec);
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
  if (fromProfileId === toProfileId) return cloneProfileSpec(spec);
  const draft = cloneProfileSpec(spec);
  if (!draft.profiles.some((profile) => profile.id === fromProfileId)) {
    throw new RangeError(`profile ${fromProfileId} does not exist`);
  }
  if (!draft.profiles.some((profile) => profile.id === toProfileId)) {
    throw new RangeError(`profile ${toProfileId} does not exist`);
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
  const draft = cloneProfileSpec(spec);
  const deleted = draft.profiles.find((profile) => profile.id === profileId);
  if (!deleted) throw new RangeError(`profile ${profileId} does not exist`);

  const deletedEndpointIds =
    deleted.kind === 'fixed'
      ? new Set(Object.values(deleted.proxyByScheme).filter((id): id is string => id !== undefined))
      : new Set<string>();
  const deletedRuleSourceIds =
    deleted.kind === 'rule-list' ? new Set([deleted.sourceId]) : new Set<string>();

  draft.profiles = draft.profiles.filter((profile) => profile.id !== profileId);
  for (const profile of draft.profiles) rewriteProfileRoutes(profile, profileId);

  if (routeTargetsProfile(draft.settings.startup.route, profileId)) {
    draft.settings.startup.route = directRoute();
  }
  draft.settings.quickSwitch.routes = draft.settings.quickSwitch.routes.filter(
    (route) => !routeTargetsProfile(route, profileId),
  );
  if (draft.settings.quickSwitch.routes.length === 0) {
    draft.settings.quickSwitch.routes = [{ kind: 'direct' }, { kind: 'system' }];
  }

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
