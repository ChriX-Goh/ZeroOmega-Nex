import type {
  FixedProfile,
  ProfileSpec,
  SwitchProfile,
  VirtualProfile,
} from '@zeroomega-nex/profile-spec';
import type { GraphDecision, ReferenceRequest } from '@zeroomega-nex/reference-interpreter';

import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import type {
  OriginalObservableProfileReference,
  OriginalObservableResultTrace,
} from './original-observable-result-trace';

type ResolvedGraphDecision = Extract<GraphDecision, { readonly status: 'resolved' }>;
type ColoredVirtualProfile = VirtualProfile & { readonly color: string };
type ColoredSwitchProfile = SwitchProfile & { readonly color: string };

interface ProjectOriginalVirtualSwitchTraceInput {
  readonly spec: ProfileSpec;
  readonly parent: VirtualProfile;
  readonly decision: GraphDecision;
  readonly request: ReferenceRequest;
  readonly i18n: OriginalToolbarI18nApi;
  readonly directColor: string;
}

type ResolvedVirtualSwitchTraceInput = Omit<
  ProjectOriginalVirtualSwitchTraceInput,
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

function matchedHostWildcard(
  profile: SwitchProfile,
  decision: GraphDecision,
):
  | {
      readonly pattern: string;
      readonly route: SwitchProfile['rules'][number]['route'];
    }
  | undefined {
  const matched = decision.trace.filter(
    (entry) =>
      entry.action === 'switch-rule' && entry.profileId === profile.id && entry.matched === true,
  );
  if (matched.length !== 1) return undefined;
  const entry = matched[0];
  if (entry?.action !== 'switch-rule') return undefined;
  const rule = profile.rules.find((candidate) => candidate.id === entry.ruleId);
  if (
    rule === undefined ||
    rule.condition.kind !== 'host-wildcard' ||
    rule.condition.pattern.length === 0 ||
    rule.condition.pattern.includes('\n') ||
    rule.condition.pattern.includes('\r')
  ) {
    return undefined;
  }
  return { pattern: rule.condition.pattern, route: rule.route };
}

function validateSharedChain(
  input: ResolvedVirtualSwitchTraceInput,
  inner: ColoredSwitchProfile,
): boolean {
  const entered = traceProfiles(input.decision);
  const virtuals = traceVirtuals(input.decision);
  return (
    input.parent.targetRoute.kind === 'profile' &&
    input.parent.targetRoute.profileId === inner.id &&
    entered.length >= 2 &&
    entered[0] === input.parent.id &&
    entered[1] === inner.id &&
    virtuals.length === 1 &&
    virtuals[0] === input.parent.id &&
    input.decision.trace.every(
      (entry) => entry.action !== 'switch-rule' || entry.profileId === inner.id,
    )
  );
}

function currentProfile(
  parent: ColoredVirtualProfile,
  inner: ColoredSwitchProfile,
): OriginalObservableProfileReference {
  return userProfile(`${parent.name} [${inner.name}]`, inner.color, parent.name);
}

function projectDirect(
  input: ResolvedVirtualSwitchTraceInput,
  inner: ColoredSwitchProfile,
): OriginalObservableResultTrace | undefined {
  const allowedActions = new Set([
    'enter-profile',
    'virtual',
    'switch-rule',
    'switch-default',
    'direct',
  ]);
  if (
    input.decision.route.kind !== 'direct' ||
    input.decision.trace.some((entry) => !allowedActions.has(entry.action)) ||
    !validateSharedChain(input, inner) ||
    traceProfiles(input.decision).length !== 2
  ) {
    return undefined;
  }

  const matched = matchedHostWildcard(inner, input.decision);
  const defaults = input.decision.trace.filter(
    (entry) => entry.action === 'switch-default' && entry.profileId === inner.id,
  );
  let detail: string | undefined;
  if (matched !== undefined) {
    if (matched.route.kind !== 'direct' || defaults.length !== 0) return undefined;
    detail = matched.pattern;
  } else {
    if (
      defaults.length !== 1 ||
      inner.defaultRoute.kind !== 'direct' ||
      input.decision.trace.some(
        (entry) =>
          entry.action === 'switch-default' &&
          (entry.profileId !== inner.id || entry !== defaults[0]),
      )
    ) {
      return undefined;
    }
    const defaultDetail = input.i18n.getMessage('browserAction_defaultRuleDetails');
    if (defaultDetail.length === 0) return undefined;
    detail = defaultDetail;
  }

  const resultProfile = directProfile(input.i18n, input.directColor);
  if (resultProfile === undefined) return undefined;

  return {
    currentProfile: currentProfile(input.parent, inner),
    resultProfile,
    details: `${detail} => ${resultProfile.displayName}\n`,
    routeKind: 'direct',
    directProfileColor: input.directColor,
    directResult: true,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  };
}

function projectFixed(
  input: ResolvedVirtualSwitchTraceInput,
  inner: ColoredSwitchProfile,
): OriginalObservableResultTrace | undefined {
  const allowedActions = new Set(['enter-profile', 'virtual', 'switch-rule', 'fixed-endpoint']);
  if (
    input.decision.route.kind !== 'proxy' ||
    input.decision.route.endpoint.protocol !== 'http' ||
    input.decision.trace.some((entry) => !allowedActions.has(entry.action)) ||
    !validateSharedChain(input, inner)
  ) {
    return undefined;
  }

  const entered = traceProfiles(input.decision);
  if (entered.length !== 3) return undefined;
  const fixed = input.spec.profiles.find(
    (profile): profile is FixedProfile & { readonly color: string } =>
      profile.id === entered[2] && profile.kind === 'fixed' && profile.color !== undefined,
  );
  if (
    fixed === undefined ||
    fixed.bypass.length !== 0 ||
    fixed.proxyByScheme.fallback !== input.decision.route.endpointId ||
    fixed.proxyByScheme.http !== undefined
  ) {
    return undefined;
  }

  const matched = matchedHostWildcard(inner, input.decision);
  const endpoint = input.decision.trace.findLast((entry) => entry.action === 'fixed-endpoint');
  if (
    matched === undefined ||
    matched.route.kind !== 'profile' ||
    matched.route.profileId !== fixed.id ||
    input.decision.trace.some((entry) => entry.action === 'switch-default') ||
    endpoint?.action !== 'fixed-endpoint' ||
    endpoint.profileId !== fixed.id ||
    endpoint.endpointId !== input.decision.route.endpointId
  ) {
    return undefined;
  }

  return {
    currentProfile: currentProfile(input.parent, inner),
    resultProfile: userProfile(fixed.name, fixed.color),
    details:
      `${matched.pattern} => ${fixed.name}\n` +
      `PROXY ${input.decision.route.endpoint.host}:${input.decision.route.endpoint.port}\n`,
    routeKind: 'proxy',
    directProfileColor: input.directColor,
    directResult: false,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  };
}

export function projectOriginalVirtualSwitchTrace(
  input: ProjectOriginalVirtualSwitchTraceInput,
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
  const inner = input.spec.profiles.find(
    (profile): profile is ColoredSwitchProfile =>
      profile.id === innerProfileId &&
      profile.kind === 'switch' &&
      profile.color !== undefined &&
      profile.attachedRuleListProfileId === undefined,
  );
  if (inner === undefined) return undefined;

  const resolvedInput: ResolvedVirtualSwitchTraceInput = {
    ...input,
    parent: input.parent as ColoredVirtualProfile,
    decision: input.decision,
  };
  if (resolvedInput.decision.route.kind === 'direct') {
    return projectDirect(resolvedInput, inner);
  }
  if (resolvedInput.decision.route.kind === 'proxy') {
    return projectFixed(resolvedInput, inner);
  }
  return undefined;
}
