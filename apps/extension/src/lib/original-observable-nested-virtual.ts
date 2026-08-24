import type { FixedProfile, ProfileSpec, VirtualProfile } from '@zeroomega-nex/profile-spec';
import type { GraphDecision, ReferenceRequest } from '@zeroomega-nex/reference-interpreter';

import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import type {
  OriginalObservableProfileReference,
  OriginalObservableResultTrace,
} from './original-observable-result-trace';

type ResolvedGraphDecision = Extract<GraphDecision, { readonly status: 'resolved' }>;
type ColoredVirtualProfile = VirtualProfile & { readonly color: string };

interface ProjectOriginalNestedVirtualTraceInput {
  readonly spec: ProfileSpec;
  readonly parent: VirtualProfile;
  readonly decision: GraphDecision;
  readonly request: ReferenceRequest;
  readonly i18n: OriginalToolbarI18nApi;
  readonly directColor: string;
}

type ResolvedNestedVirtualTraceInput = Omit<
  ProjectOriginalNestedVirtualTraceInput,
  'parent' | 'decision'
> & {
  readonly parent: ColoredVirtualProfile;
  readonly decision: ResolvedGraphDecision;
};

function userProfile(
  displayName: string,
  color: string,
  badgeName = displayName,
): OriginalObservableProfileReference {
  return {
    displayName,
    badgeName,
    color,
    builtin: false,
  };
}

function directProfile(
  i18n: OriginalToolbarI18nApi,
  color: string,
): OriginalObservableProfileReference | undefined {
  const name = i18n.getMessage('routeDirect');
  if (name.length === 0) return undefined;
  return {
    displayName: `[${name}]`,
    badgeName: name,
    color,
    builtin: true,
  };
}

function traceProfiles(decision: GraphDecision): string[] {
  return decision.trace.flatMap((entry) =>
    entry.action === 'enter-profile' && entry.profileId !== undefined ? [entry.profileId] : [],
  );
}

function traceVirtuals(decision: GraphDecision): string[] {
  return decision.trace.flatMap((entry) =>
    entry.action === 'virtual' && entry.profileId !== undefined ? [entry.profileId] : [],
  );
}

function currentProfile(
  parent: VirtualProfile,
  inner: VirtualProfile,
  color: string,
): OriginalObservableProfileReference {
  return userProfile(`${parent.name} [${inner.name}]`, color, parent.name);
}

function defaultDetail(input: ResolvedNestedVirtualTraceInput): string | undefined {
  const detail = input.i18n.getMessage('browserAction_defaultRuleDetails');
  return detail.length === 0 ? undefined : detail;
}

function projectNestedDirect(
  input: ResolvedNestedVirtualTraceInput,
  inner: ColoredVirtualProfile,
): OriginalObservableResultTrace | undefined {
  const allowedActions = new Set(['enter-profile', 'virtual', 'direct']);
  if (
    inner.targetRoute.kind !== 'direct' ||
    input.decision.route.kind !== 'direct' ||
    input.decision.trace.some((entry) => !allowedActions.has(entry.action))
  ) {
    return undefined;
  }

  const entered = traceProfiles(input.decision);
  const virtuals = traceVirtuals(input.decision);
  if (
    entered.length !== 2 ||
    entered[0] !== input.parent.id ||
    entered[1] !== inner.id ||
    virtuals.length !== 2 ||
    virtuals[0] !== input.parent.id ||
    virtuals[1] !== inner.id
  ) {
    return undefined;
  }

  const resultProfile = directProfile(input.i18n, input.directColor);
  const selectionDetail = defaultDetail(input);
  if (resultProfile === undefined || selectionDetail === undefined) return undefined;

  return {
    currentProfile: currentProfile(input.parent, inner, inner.color),
    resultProfile,
    details: `${selectionDetail} => ${resultProfile.displayName}\n`,
    routeKind: 'direct',
    directProfileColor: input.directColor,
    directResult: true,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  };
}

function matchedBypass(
  decision: ResolvedGraphDecision,
  fixed: FixedProfile,
): { readonly pattern: string } | undefined {
  const matches = decision.trace.filter(
    (entry) =>
      entry.action === 'fixed-bypass' && entry.profileId === fixed.id && entry.matched === true,
  );
  if (matches.length !== 1) return undefined;
  const match = matches[0];
  if (match?.action !== 'fixed-bypass') return undefined;
  const bypass = fixed.bypass.find((candidate) => candidate.id === match.bypassId);
  return bypass === undefined ? undefined : { pattern: bypass.pattern };
}

function validateFixedChain(
  input: ResolvedNestedVirtualTraceInput,
  inner: ColoredVirtualProfile,
  fixed: FixedProfile,
): boolean {
  const entered = traceProfiles(input.decision);
  const virtuals = traceVirtuals(input.decision);
  return (
    input.parent.targetRoute.kind === 'profile' &&
    input.parent.targetRoute.profileId === inner.id &&
    inner.targetRoute.kind === 'profile' &&
    inner.targetRoute.profileId === fixed.id &&
    entered.length === 3 &&
    entered[0] === input.parent.id &&
    entered[1] === inner.id &&
    entered[2] === fixed.id &&
    virtuals.length === 2 &&
    virtuals[0] === input.parent.id &&
    virtuals[1] === inner.id
  );
}

function projectNestedFixedProxy(
  input: ResolvedNestedVirtualTraceInput,
  inner: ColoredVirtualProfile,
  fixed: FixedProfile & { readonly color: string },
): OriginalObservableResultTrace | undefined {
  const allowedActions = new Set(['enter-profile', 'virtual', 'fixed-bypass', 'fixed-endpoint']);
  if (
    input.decision.route.kind !== 'proxy' ||
    input.decision.route.endpoint.protocol !== 'http' ||
    input.decision.trace.some((entry) => !allowedActions.has(entry.action)) ||
    !validateFixedChain(input, inner, fixed) ||
    fixed.bypass.length !== 1 ||
    fixed.proxyByScheme.fallback !== input.decision.route.endpointId ||
    fixed.proxyByScheme.http !== undefined
  ) {
    return undefined;
  }

  const bypassEntries = input.decision.trace.filter(
    (entry) => entry.action === 'fixed-bypass' && entry.profileId === fixed.id,
  );
  const endpointEntry = input.decision.trace.findLast((entry) => entry.action === 'fixed-endpoint');
  if (
    bypassEntries.length !== 1 ||
    bypassEntries[0]?.action !== 'fixed-bypass' ||
    bypassEntries[0].matched !== false ||
    endpointEntry?.action !== 'fixed-endpoint' ||
    endpointEntry.profileId !== fixed.id ||
    endpointEntry.endpointId !== input.decision.route.endpointId
  ) {
    return undefined;
  }

  const selectionDetail = defaultDetail(input);
  if (selectionDetail === undefined) return undefined;

  return {
    currentProfile: currentProfile(input.parent, inner, inner.color),
    resultProfile: userProfile(fixed.name, fixed.color),
    details:
      `${selectionDetail} => ${fixed.name}\n` +
      `PROXY ${input.decision.route.endpoint.host}:${input.decision.route.endpoint.port}\n`,
    routeKind: 'proxy',
    directProfileColor: input.directColor,
    directResult: false,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  };
}

function projectNestedFixedBypass(
  input: ResolvedNestedVirtualTraceInput,
  inner: ColoredVirtualProfile,
  fixed: FixedProfile & { readonly color: string },
): OriginalObservableResultTrace | undefined {
  const allowedActions = new Set(['enter-profile', 'virtual', 'fixed-bypass', 'direct']);
  if (
    input.decision.route.kind !== 'direct' ||
    input.decision.trace.some((entry) => !allowedActions.has(entry.action)) ||
    !validateFixedChain(input, inner, fixed) ||
    fixed.bypass.length !== 1
  ) {
    return undefined;
  }

  const bypass = matchedBypass(input.decision, fixed);
  const selectionDetail = defaultDetail(input);
  if (bypass === undefined || selectionDetail === undefined) return undefined;

  return {
    currentProfile: currentProfile(input.parent, inner, fixed.color),
    resultProfile: userProfile(fixed.name, fixed.color),
    details: `${selectionDetail} => ${fixed.name}\n${bypass.pattern} => DIRECT\n`,
    routeKind: 'direct',
    directProfileColor: input.directColor,
    directResult: true,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  };
}

export function projectOriginalNestedVirtualTrace(
  input: ProjectOriginalNestedVirtualTraceInput,
): OriginalObservableResultTrace | undefined {
  if (
    input.parent.color === undefined ||
    input.parent.targetRoute.kind !== 'profile' ||
    input.decision.status !== 'resolved' ||
    input.decision.support !== 'exact'
  ) {
    return undefined;
  }

  const innerProfileId = input.parent.targetRoute.profileId;
  const resolvedInput: ResolvedNestedVirtualTraceInput = {
    ...input,
    parent: input.parent as ColoredVirtualProfile,
    decision: input.decision,
  };
  const inner = input.spec.profiles.find(
    (profile): profile is ColoredVirtualProfile =>
      profile.id === innerProfileId && profile.kind === 'virtual' && profile.color !== undefined,
  );
  if (inner === undefined) return undefined;

  if (inner.targetRoute.kind === 'direct') {
    return projectNestedDirect(resolvedInput, inner);
  }
  if (inner.targetRoute.kind !== 'profile') return undefined;

  const fixedProfileId = inner.targetRoute.profileId;
  const fixed = input.spec.profiles.find(
    (profile): profile is FixedProfile & { readonly color: string } =>
      profile.id === fixedProfileId && profile.kind === 'fixed' && profile.color !== undefined,
  );
  if (fixed === undefined) return undefined;

  if (resolvedInput.decision.route.kind === 'proxy') {
    return projectNestedFixedProxy(resolvedInput, inner, fixed);
  }
  if (resolvedInput.decision.route.kind === 'direct') {
    return projectNestedFixedBypass(resolvedInput, inner, fixed);
  }
  return undefined;
}
