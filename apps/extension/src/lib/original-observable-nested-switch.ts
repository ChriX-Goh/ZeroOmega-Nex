import type { FixedProfile, ProfileSpec, SwitchProfile } from '@zeroomega-nex/profile-spec';
import type { GraphDecision, ReferenceRequest } from '@zeroomega-nex/reference-interpreter';

import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import type {
  OriginalObservableProfileReference,
  OriginalObservableResultTrace,
} from './original-observable-result-trace';

type ResolvedGraphDecision = Extract<GraphDecision, { readonly status: 'resolved' }>;
type ColoredSwitchProfile = SwitchProfile & { readonly color: string };

interface ProjectOriginalNestedSwitchTraceInput {
  readonly spec: ProfileSpec;
  readonly parent: SwitchProfile;
  readonly decision: GraphDecision;
  readonly request: ReferenceRequest;
  readonly i18n: OriginalToolbarI18nApi;
  readonly directColor: string;
}

type ResolvedNestedSwitchTraceInput = Omit<
  ProjectOriginalNestedSwitchTraceInput,
  'parent' | 'decision'
> & {
  readonly parent: ColoredSwitchProfile;
  readonly decision: ResolvedGraphDecision;
};

function userProfile(name: string, color: string): OriginalObservableProfileReference {
  return {
    displayName: name,
    badgeName: name,
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

function matchedHostWildcard(
  profile: SwitchProfile,
  decision: GraphDecision,
): { readonly pattern: string; readonly targetProfileId: string } | undefined {
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
    rule.condition.pattern.includes('\r') ||
    rule.route.kind !== 'profile'
  ) {
    return undefined;
  }
  return { pattern: rule.condition.pattern, targetProfileId: rule.route.profileId };
}

function traceProfiles(decision: GraphDecision): string[] {
  return decision.trace.flatMap((entry) =>
    entry.action === 'enter-profile' && entry.profileId !== undefined ? [entry.profileId] : [],
  );
}

function onlySwitchProfiles(
  decision: GraphDecision,
  parent: SwitchProfile,
  inner: SwitchProfile,
): boolean {
  return decision.trace.every(
    (entry) =>
      entry.action !== 'switch-rule' ||
      entry.profileId === parent.id ||
      entry.profileId === inner.id,
  );
}

function projectNestedDirect(
  input: ResolvedNestedSwitchTraceInput,
  inner: SwitchProfile,
  outerSelection: { readonly pattern: string; readonly targetProfileId: string },
): OriginalObservableResultTrace | undefined {
  const allowedActions = new Set(['enter-profile', 'switch-rule', 'switch-default', 'direct']);
  if (
    input.decision.route.kind !== 'direct' ||
    input.decision.trace.some((entry) => !allowedActions.has(entry.action)) ||
    !onlySwitchProfiles(input.decision, input.parent, inner)
  ) {
    return undefined;
  }

  const entered = traceProfiles(input.decision);
  if (entered.length !== 2 || entered[0] !== input.parent.id || entered[1] !== inner.id) {
    return undefined;
  }
  if (outerSelection.targetProfileId !== inner.id) return undefined;

  const innerMatched = input.decision.trace.filter(
    (entry) =>
      entry.action === 'switch-rule' && entry.profileId === inner.id && entry.matched === true,
  );
  const defaults = input.decision.trace.filter((entry) => entry.action === 'switch-default');
  if (
    innerMatched.length !== 0 ||
    defaults.length !== 1 ||
    defaults[0]?.action !== 'switch-default' ||
    defaults[0].profileId !== inner.id ||
    inner.defaultRoute.kind !== 'direct'
  ) {
    return undefined;
  }

  const resultProfile = directProfile(input.i18n, input.directColor);
  const defaultDetail = input.i18n.getMessage('browserAction_defaultRuleDetails');
  if (resultProfile === undefined || defaultDetail.length === 0) return undefined;

  return {
    currentProfile: userProfile(input.parent.name, input.parent.color),
    resultProfile,
    details:
      `${outerSelection.pattern} => ${inner.name}\n` +
      `${defaultDetail} => ${resultProfile.displayName}\n`,
    routeKind: 'direct',
    directProfileColor: input.directColor,
    directResult: true,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  };
}

function projectNestedFixed(
  input: ResolvedNestedSwitchTraceInput,
  inner: SwitchProfile,
  outerSelection: { readonly pattern: string; readonly targetProfileId: string },
): OriginalObservableResultTrace | undefined {
  const allowedActions = new Set([
    'enter-profile',
    'switch-rule',
    'switch-default',
    'fixed-endpoint',
  ]);
  if (
    input.decision.route.kind !== 'proxy' ||
    input.decision.route.endpoint.protocol !== 'http' ||
    input.decision.trace.some((entry) => !allowedActions.has(entry.action)) ||
    !onlySwitchProfiles(input.decision, input.parent, inner)
  ) {
    return undefined;
  }

  const entered = traceProfiles(input.decision);
  if (entered.length !== 3 || entered[0] !== input.parent.id || entered[1] !== inner.id) {
    return undefined;
  }
  if (outerSelection.targetProfileId !== inner.id) return undefined;

  const fixed = input.spec.profiles.find(
    (profile): profile is FixedProfile =>
      profile.id === entered[2] && profile.kind === 'fixed' && profile.color !== undefined,
  );
  if (
    fixed === undefined ||
    fixed.color === undefined ||
    fixed.bypass.length !== 0 ||
    fixed.proxyByScheme.fallback !== input.decision.route.endpointId ||
    fixed.proxyByScheme.http !== undefined
  ) {
    return undefined;
  }

  const innerSelection = matchedHostWildcard(inner, input.decision);
  const defaults = input.decision.trace.filter((entry) => entry.action === 'switch-default');
  const endpointEntry = input.decision.trace.findLast((entry) => entry.action === 'fixed-endpoint');
  if (
    innerSelection === undefined ||
    innerSelection.targetProfileId !== fixed.id ||
    defaults.length !== 0 ||
    endpointEntry?.action !== 'fixed-endpoint' ||
    endpointEntry.profileId !== fixed.id ||
    endpointEntry.endpointId !== input.decision.route.endpointId
  ) {
    return undefined;
  }

  return {
    currentProfile: userProfile(input.parent.name, input.parent.color),
    resultProfile: userProfile(fixed.name, fixed.color),
    details:
      `${outerSelection.pattern} => ${inner.name}\n` +
      `${innerSelection.pattern} => ${fixed.name}\n` +
      `PROXY ${input.decision.route.endpoint.host}:${input.decision.route.endpoint.port}\n`,
    routeKind: 'proxy',
    directProfileColor: input.directColor,
    directResult: false,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  };
}

export function projectOriginalNestedSwitchTrace(
  input: ProjectOriginalNestedSwitchTraceInput,
): OriginalObservableResultTrace | undefined {
  if (
    input.parent.color === undefined ||
    input.parent.attachedRuleListProfileId !== undefined ||
    input.decision.status !== 'resolved' ||
    input.decision.support !== 'exact'
  ) {
    return undefined;
  }

  const resolvedInput: ResolvedNestedSwitchTraceInput = {
    ...input,
    parent: input.parent as ColoredSwitchProfile,
    decision: input.decision,
  };
  const entered = traceProfiles(resolvedInput.decision);
  if (entered.length < 2 || entered[0] !== resolvedInput.parent.id) return undefined;
  const inner = input.spec.profiles.find(
    (profile): profile is SwitchProfile =>
      profile.id === entered[1] &&
      profile.kind === 'switch' &&
      profile.color !== undefined &&
      profile.attachedRuleListProfileId === undefined,
  );
  if (inner === undefined) return undefined;

  const outerSelection = matchedHostWildcard(resolvedInput.parent, resolvedInput.decision);
  if (outerSelection === undefined) return undefined;

  if (resolvedInput.decision.route.kind === 'direct') {
    return projectNestedDirect(resolvedInput, inner, outerSelection);
  }
  if (resolvedInput.decision.route.kind === 'proxy') {
    return projectNestedFixed(resolvedInput, inner, outerSelection);
  }
  return undefined;
}
