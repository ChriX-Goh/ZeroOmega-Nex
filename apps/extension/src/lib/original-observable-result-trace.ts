import type {
  Condition,
  FixedProfile,
  ProfileRouteTarget,
  ProfileSpec,
  SwitchProfile,
  VirtualProfile,
} from '@zeroomega-nex/profile-spec';
import type { GraphDecision, ReferenceRequest } from '@zeroomega-nex/reference-interpreter';

import {
  localizeOriginalToolbarDetail,
  ORIGINAL_TOOLBAR_DETAIL_KEYS,
  type OriginalToolbarI18nApi,
} from './original-toolbar-i18n';

export const ORIGINAL_TOOLBAR_DIRECT_COLOR = '#aaaaaa';
export const ORIGINAL_TOOLBAR_SYSTEM_COLOR = '#000000';

const ROUTE_MESSAGE_KEYS = {
  direct: 'routeDirect',
  system: 'routeSystem',
} as const;

const PAC_PROTOCOLS = {
  http: 'PROXY',
  https: 'HTTPS',
  socks4: 'SOCKS',
  socks5: 'SOCKS5',
} as const;

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const WEEKDAY_MARKERS = 'SMTWtFs';

export interface OriginalObservableProfileReference {
  readonly displayName: string;
  readonly badgeName: string;
  readonly color: string;
  readonly builtin: boolean;
}

/**
 * Browser-independent projection of one original ZeroOmega `matchProfile`
 * result. It deliberately contains only observable profile/result semantics;
 * internal revision, snapshot, compiler and graph-trace details stay behind
 * this boundary.
 */
export interface OriginalObservableResultTrace {
  readonly currentProfile: OriginalObservableProfileReference;
  readonly resultProfile: OriginalObservableProfileReference;
  readonly details: string;
  readonly routeKind: 'direct' | 'system' | 'proxy';
  readonly directProfileColor: string;
  readonly directResult: boolean;
  readonly currentProfileStatic: boolean;
  readonly matchedProfileIsCurrent: boolean;
  readonly detailPrefix?: string;
}

export interface ProjectOriginalObservableResultTraceInput {
  readonly spec: ProfileSpec;
  readonly activeRoute: ProfileRouteTarget;
  readonly i18n: OriginalToolbarI18nApi;
  readonly request?: ReferenceRequest;
  readonly decision?: GraphDecision;
}

function requireRouteName(
  i18n: OriginalToolbarI18nApi,
  route: keyof typeof ROUTE_MESSAGE_KEYS,
): string {
  const name = i18n.getMessage(ROUTE_MESSAGE_KEYS[route]);
  if (name.length === 0) {
    throw new Error(`Missing original built-in route message: ${route}`);
  }
  return name;
}

function builtinProfile(name: string, color: string): OriginalObservableProfileReference {
  return {
    displayName: `[${name}]`,
    badgeName: name,
    color,
    builtin: true,
  };
}

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

function originalPacResult(endpoint: {
  readonly protocol: keyof typeof PAC_PROTOCOLS;
  readonly host: string;
  readonly port: number;
}): string {
  return `${PAC_PROTOCOLS[endpoint.protocol]} ${endpoint.host}:${endpoint.port}`;
}

function originalSwitchConditionDisplay(condition: Condition): string | undefined {
  const singleLine = (value: string): string | undefined =>
    value.length > 0 && !value.includes('\n') && !value.includes('\r') ? value : undefined;

  switch (condition.kind) {
    case 'url-regex':
    case 'host-regex':
      return condition.flags === undefined ? singleLine(condition.pattern) : undefined;
    case 'url-wildcard':
    case 'host-wildcard':
    case 'bypass':
    case 'keyword':
      return singleLine(condition.pattern);
    case 'true':
      return 'True:';
    case 'false':
      return condition.annotation === undefined || condition.annotation.length === 0
        ? 'False:'
        : singleLine(condition.annotation);
    case 'ip':
      return `Ip: ${condition.address}/${condition.prefixLength}`;
    case 'host-levels':
      return `HostLevels: ${condition.min}~${condition.max}`;
    case 'weekday': {
      const selected = new Set(condition.days);
      const value = WEEKDAYS.map((day, index) =>
        selected.has(day) ? WEEKDAY_MARKERS[index] : '-',
      ).join('');
      return `Weekday: ${value}`;
    }
    case 'time':
      return `Time: ${condition.startHour}~${condition.endHour}`;
  }
}

function projectBuiltIn(
  input: ProjectOriginalObservableResultTraceInput,
  route: 'direct' | 'system',
  directColor: string,
  systemColor: string,
): OriginalObservableResultTrace {
  const name = requireRouteName(input.i18n, route);
  const profile = builtinProfile(name, route === 'direct' ? directColor : systemColor);
  const details =
    route === 'direct'
      ? localizeOriginalToolbarDetail(input.i18n, ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult)
      : localizeOriginalToolbarDetail(input.i18n, ORIGINAL_TOOLBAR_DETAIL_KEYS.externalProxy);

  return {
    currentProfile: profile,
    resultProfile: profile,
    details,
    routeKind: route,
    directProfileColor: directColor,
    directResult: route === 'direct',
    currentProfileStatic: true,
    matchedProfileIsCurrent: true,
  };
}

function projectFixed(
  input: ProjectOriginalObservableResultTraceInput,
  profile: FixedProfile,
  decision: GraphDecision,
  request: ReferenceRequest,
  directColor: string,
): OriginalObservableResultTrace | undefined {
  if (
    profile.color === undefined ||
    decision.status !== 'resolved' ||
    decision.support !== 'exact'
  ) {
    return undefined;
  }

  const profileReference = userProfile(profile.name, profile.color);

  if (decision.route.kind === 'proxy') {
    const scheme = request.scheme as 'http' | 'https' | 'ftp';
    const hasSpecificEndpoint = profile.proxyByScheme[scheme] !== undefined;
    const pacResult = originalPacResult(decision.route.endpoint);
    return {
      currentProfile: profileReference,
      resultProfile: profileReference,
      details: `${hasSpecificEndpoint ? `${scheme} => ` : ''}${pacResult}\n`,
      routeKind: 'proxy',
      directProfileColor: directColor,
      directResult: false,
      currentProfileStatic: true,
      matchedProfileIsCurrent: true,
    };
  }

  if (decision.route.kind !== 'direct') return undefined;
  const matchedBypass = decision.trace.find(
    (entry) => entry.action === 'fixed-bypass' && entry.matched === true,
  );
  const bypass =
    matchedBypass?.action === 'fixed-bypass'
      ? profile.bypass.find((candidate) => candidate.id === matchedBypass.bypassId)
      : undefined;
  const hasUnmappedDirect = decision.trace.some(
    (entry) => entry.action === 'fixed-unmapped-direct',
  );
  if (bypass === undefined && !hasUnmappedDirect) return undefined;

  const directDetail = localizeOriginalToolbarDetail(
    input.i18n,
    ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult,
  );
  return {
    currentProfile: profileReference,
    resultProfile: profileReference,
    details: `${bypass === undefined ? '' : `${bypass.pattern} => `}${directDetail}\n`,
    routeKind: 'direct',
    directProfileColor: directColor,
    directResult: true,
    currentProfileStatic: true,
    matchedProfileIsCurrent: false,
  };
}

function projectSwitchDirect(
  input: ProjectOriginalObservableResultTraceInput,
  profile: SwitchProfile,
  decision: GraphDecision,
  directColor: string,
): OriginalObservableResultTrace | undefined {
  if (
    profile.color === undefined ||
    profile.attachedRuleListProfileId !== undefined ||
    decision.status !== 'resolved' ||
    decision.support !== 'exact' ||
    decision.route.kind !== 'direct'
  ) {
    return undefined;
  }

  const allowedActions = new Set(['enter-profile', 'switch-rule', 'switch-default', 'direct']);
  if (decision.trace.some((entry) => !allowedActions.has(entry.action))) return undefined;

  const enteredProfiles = decision.trace
    .filter((entry) => entry.action === 'enter-profile')
    .map((entry) => entry.profileId);
  if (enteredProfiles.length !== 1 || enteredProfiles[0] !== profile.id) return undefined;

  const switchEntries = decision.trace.filter((entry) => entry.action === 'switch-rule');
  if (switchEntries.some((entry) => entry.profileId !== profile.id)) return undefined;
  const matchedEntries = switchEntries.filter((entry) => entry.matched === true);
  const defaultEntries = decision.trace.filter((entry) => entry.action === 'switch-default');
  const directName = requireRouteName(input.i18n, 'direct');
  const directProfile = builtinProfile(directName, directColor);

  let details: string;
  if (matchedEntries.length === 1 && defaultEntries.length === 0) {
    const matchedEntry = matchedEntries[0];
    const rule = profile.rules.find((candidate) => candidate.id === matchedEntry?.ruleId);
    if (rule === undefined || rule.route.kind !== 'direct') return undefined;
    const condition = originalSwitchConditionDisplay(rule.condition);
    if (condition === undefined) return undefined;
    details = `${condition} => ${directProfile.displayName}\n`;
  } else if (matchedEntries.length === 0 && defaultEntries.length === 1) {
    if (profile.defaultRoute.kind !== 'direct') return undefined;
    const defaultDetail = localizeOriginalToolbarDetail(
      input.i18n,
      ORIGINAL_TOOLBAR_DETAIL_KEYS.defaultRule,
    );
    details = `${defaultDetail} => ${directProfile.displayName}\n`;
  } else {
    return undefined;
  }

  return {
    currentProfile: userProfile(profile.name, profile.color),
    resultProfile: directProfile,
    details,
    routeKind: 'direct',
    directProfileColor: directColor,
    directResult: true,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  };
}

function projectSwitchFixed(
  input: ProjectOriginalObservableResultTraceInput,
  profile: SwitchProfile,
  decision: GraphDecision,
  request: ReferenceRequest,
  directColor: string,
): OriginalObservableResultTrace | undefined {
  if (
    profile.color === undefined ||
    profile.attachedRuleListProfileId !== undefined ||
    decision.status !== 'resolved' ||
    decision.support !== 'exact' ||
    decision.route.kind !== 'proxy'
  ) {
    return undefined;
  }

  const allowedActions = new Set([
    'enter-profile',
    'switch-rule',
    'switch-default',
    'fixed-bypass',
    'fixed-endpoint',
  ]);
  if (decision.trace.some((entry) => !allowedActions.has(entry.action))) return undefined;

  const enteredProfiles = decision.trace
    .filter((entry) => entry.action === 'enter-profile')
    .map((entry) => entry.profileId);
  if (enteredProfiles.length !== 2 || enteredProfiles[0] !== profile.id) return undefined;

  const endpointEntry = decision.trace.findLast((entry) => entry.action === 'fixed-endpoint');
  if (
    endpointEntry?.action !== 'fixed-endpoint' ||
    endpointEntry.profileId !== enteredProfiles[1] ||
    endpointEntry.endpointId !== decision.route.endpointId
  ) {
    return undefined;
  }

  const resultProfile = input.spec.profiles.find(
    (candidate): candidate is FixedProfile =>
      candidate.id === endpointEntry.profileId &&
      candidate.kind === 'fixed' &&
      candidate.color !== undefined,
  );
  if (resultProfile === undefined || resultProfile.color === undefined) return undefined;

  const switchEntries = decision.trace.filter((entry) => entry.action === 'switch-rule');
  if (switchEntries.some((entry) => entry.profileId !== profile.id)) return undefined;
  const matchedEntries = switchEntries.filter((entry) => entry.matched === true);
  const defaultEntries = decision.trace.filter((entry) => entry.action === 'switch-default');

  let selectionDetail: string;
  if (matchedEntries.length === 1 && defaultEntries.length === 0) {
    const matchedEntry = matchedEntries[0];
    const rule = profile.rules.find((candidate) => candidate.id === matchedEntry?.ruleId);
    if (
      rule === undefined ||
      rule.route.kind !== 'profile' ||
      rule.route.profileId !== resultProfile.id
    ) {
      return undefined;
    }
    const condition = originalSwitchConditionDisplay(rule.condition);
    if (condition === undefined) return undefined;
    selectionDetail = `${condition} => ${resultProfile.name}\n`;
  } else if (matchedEntries.length === 0 && defaultEntries.length === 1) {
    if (
      profile.defaultRoute.kind !== 'profile' ||
      profile.defaultRoute.profileId !== resultProfile.id
    ) {
      return undefined;
    }
    const defaultDetail = localizeOriginalToolbarDetail(
      input.i18n,
      ORIGINAL_TOOLBAR_DETAIL_KEYS.defaultRule,
    );
    selectionDetail = `${defaultDetail} => ${resultProfile.name}\n`;
  } else {
    return undefined;
  }

  const scheme = request.scheme as 'http' | 'https' | 'ftp';
  const hasSpecificEndpoint = resultProfile.proxyByScheme[scheme] !== undefined;
  const pacResult = originalPacResult(decision.route.endpoint);

  return {
    currentProfile: userProfile(profile.name, profile.color),
    resultProfile: userProfile(resultProfile.name, resultProfile.color),
    details: `${selectionDetail}${hasSpecificEndpoint ? `${scheme} => ` : ''}${pacResult}\n`,
    routeKind: 'proxy',
    directProfileColor: directColor,
    directResult: false,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  };
}

function projectSwitch(
  input: ProjectOriginalObservableResultTraceInput,
  profile: SwitchProfile,
  decision: GraphDecision,
  request: ReferenceRequest,
  directColor: string,
): OriginalObservableResultTrace | undefined {
  if (decision.status !== 'resolved' || decision.support !== 'exact') return undefined;
  if (decision.route.kind === 'direct') {
    return projectSwitchDirect(input, profile, decision, directColor);
  }
  if (decision.route.kind === 'proxy') {
    return projectSwitchFixed(input, profile, decision, request, directColor);
  }
  return undefined;
}

function projectVirtual(
  input: ProjectOriginalObservableResultTraceInput,
  profile: VirtualProfile,
  decision: GraphDecision,
  request: ReferenceRequest,
  directColor: string,
): OriginalObservableResultTrace | undefined {
  if (decision.status !== 'resolved' || decision.support !== 'exact') return undefined;

  const virtualEntries = decision.trace.filter((entry) => entry.action === 'virtual');
  if (virtualEntries.length !== 1 || virtualEntries[0]?.profileId !== profile.id) {
    return undefined;
  }
  const enteredProfiles = decision.trace
    .filter((entry) => entry.action === 'enter-profile')
    .map((entry) => entry.profileId);
  if (enteredProfiles[0] !== profile.id) return undefined;

  if (profile.targetRoute.kind === 'direct') {
    const allowedActions = new Set(['enter-profile', 'virtual', 'direct']);
    if (
      decision.route.kind !== 'direct' ||
      enteredProfiles.length !== 1 ||
      decision.trace.some((entry) => !allowedActions.has(entry.action))
    ) {
      return undefined;
    }
    const directName = requireRouteName(input.i18n, 'direct');
    const directProfile = builtinProfile(directName, directColor);
    return {
      currentProfile: userProfile(
        `${profile.name} [${directProfile.displayName}]`,
        directColor,
        profile.name,
      ),
      resultProfile: directProfile,
      details: localizeOriginalToolbarDetail(input.i18n, ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult),
      routeKind: 'direct',
      directProfileColor: directColor,
      directResult: true,
      currentProfileStatic: true,
      matchedProfileIsCurrent: true,
    };
  }

  const targetProfile = input.spec.profiles.find(
    (candidate): candidate is FixedProfile =>
      profile.targetRoute.kind === 'profile' &&
      candidate.id === profile.targetRoute.profileId &&
      candidate.kind === 'fixed' &&
      candidate.color !== undefined,
  );
  if (
    targetProfile === undefined ||
    targetProfile.color === undefined ||
    enteredProfiles.length !== 2 ||
    enteredProfiles[1] !== targetProfile.id
  ) {
    return undefined;
  }

  const currentProfile = userProfile(
    `${profile.name} [${targetProfile.name}]`,
    targetProfile.color,
    profile.name,
  );
  const resultProfile = userProfile(targetProfile.name, targetProfile.color);

  if (decision.route.kind === 'proxy') {
    const allowedActions = new Set(['enter-profile', 'virtual', 'fixed-bypass', 'fixed-endpoint']);
    if (decision.trace.some((entry) => !allowedActions.has(entry.action))) return undefined;
    const endpointEntry = decision.trace.findLast((entry) => entry.action === 'fixed-endpoint');
    if (
      endpointEntry?.action !== 'fixed-endpoint' ||
      endpointEntry.profileId !== targetProfile.id ||
      endpointEntry.endpointId !== decision.route.endpointId
    ) {
      return undefined;
    }
    const scheme = request.scheme as 'http' | 'https' | 'ftp';
    const hasSpecificEndpoint = targetProfile.proxyByScheme[scheme] !== undefined;
    const pacResult = originalPacResult(decision.route.endpoint);
    return {
      currentProfile,
      resultProfile,
      details: `${hasSpecificEndpoint ? `${scheme} => ` : ''}${pacResult}\n`,
      routeKind: 'proxy',
      directProfileColor: directColor,
      directResult: false,
      currentProfileStatic: true,
      matchedProfileIsCurrent: true,
    };
  }

  if (decision.route.kind !== 'direct') return undefined;
  const allowedActions = new Set(['enter-profile', 'virtual', 'fixed-bypass', 'direct']);
  if (decision.trace.some((entry) => !allowedActions.has(entry.action))) return undefined;
  const matchedBypassEntries = decision.trace.filter(
    (entry) =>
      entry.action === 'fixed-bypass' &&
      entry.profileId === targetProfile.id &&
      entry.matched === true,
  );
  if (matchedBypassEntries.length !== 1) return undefined;
  const matchedBypass = matchedBypassEntries[0];
  const bypass =
    matchedBypass?.action === 'fixed-bypass'
      ? targetProfile.bypass.find((candidate) => candidate.id === matchedBypass.bypassId)
      : undefined;
  if (bypass === undefined) return undefined;

  const directDetail = localizeOriginalToolbarDetail(
    input.i18n,
    ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult,
  );
  return {
    currentProfile,
    resultProfile,
    details: `${bypass.pattern} => ${directDetail}\n`,
    routeKind: 'direct',
    directProfileColor: directColor,
    directResult: true,
    currentProfileStatic: true,
    matchedProfileIsCurrent: false,
  };
}

/**
 * Project the currently represented original result families into one stable,
 * browser-independent observable trace. Unknown nested, attached Rule List,
 * PAC, temporary-rule and external-control shapes remain fail-closed until
 * their original evidence is represented by this layer.
 */
export function projectOriginalObservableResultTrace(
  input: ProjectOriginalObservableResultTraceInput,
): OriginalObservableResultTrace | undefined {
  const directColor =
    input.spec.settings.interface.builtInProfiles?.direct?.color ?? ORIGINAL_TOOLBAR_DIRECT_COLOR;
  const systemColor =
    input.spec.settings.interface.builtInProfiles?.system?.color ?? ORIGINAL_TOOLBAR_SYSTEM_COLOR;

  const activeRoute = input.activeRoute;
  if (activeRoute.kind === 'direct' || activeRoute.kind === 'system') {
    return projectBuiltIn(input, activeRoute.kind, directColor, systemColor);
  }

  if (input.request === undefined || input.decision === undefined) return undefined;
  if (input.decision.status !== 'resolved' || input.decision.support !== 'exact') {
    return undefined;
  }

  const profile = input.spec.profiles.find(
    (candidate) => candidate.id === activeRoute.profileId,
  );
  if (profile === undefined) return undefined;

  switch (profile.kind) {
    case 'fixed':
      return projectFixed(input, profile, input.decision, input.request, directColor);
    case 'switch':
      return projectSwitch(input, profile, input.decision, input.request, directColor);
    case 'virtual':
      return projectVirtual(input, profile, input.decision, input.request, directColor);
    case 'rule-list':
    case 'pac':
    case 'auto-detect':
      return undefined;
  }
}
