import type {
  FixedProfile,
  ProfileRouteTarget,
  ProfileSpec,
  RuleListProfile,
  SwitchProfile,
} from '@zeroomega-nex/profile-spec';
import type { GraphDecision, ReferenceRequest } from '@zeroomega-nex/reference-interpreter';

import {
  localizeOriginalToolbarDetail,
  ORIGINAL_TOOLBAR_DETAIL_KEYS,
  type OriginalToolbarI18nApi,
} from './original-toolbar-i18n';
import type { OriginalObservableResultTrace } from './original-observable-result-trace';

const PAC_PROTOCOLS = {
  http: 'PROXY',
  https: 'HTTPS',
  socks4: 'SOCKS',
  socks5: 'SOCKS5',
} as const;

export interface ProjectOriginalAttachedRuleListTraceInput {
  readonly spec: ProfileSpec;
  readonly parent: SwitchProfile;
  readonly decision: GraphDecision;
  readonly request: ReferenceRequest;
  readonly i18n: OriginalToolbarI18nApi;
  readonly directColor: string;
}

function requireDirectName(i18n: OriginalToolbarI18nApi): string {
  const name = i18n.getMessage('routeDirect');
  if (name.length === 0) throw new Error('Missing original built-in route message: direct');
  return name;
}

function originalPacResult(endpoint: {
  readonly protocol: keyof typeof PAC_PROTOCOLS;
  readonly host: string;
  readonly port: number;
}): string {
  return `${PAC_PROTOCOLS[endpoint.protocol]} ${endpoint.host}:${endpoint.port}`;
}

function significantAutoProxyLines(content: string): readonly string[] {
  return content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 && !line.startsWith('!') && !/^\[AutoProxy\b/iu.test(line),
    );
}

function routeMatches(route: ProfileRouteTarget, expected: ProfileRouteTarget): boolean {
  if (route.kind !== expected.kind) return false;
  return route.kind !== 'profile' ||
    expected.kind !== 'profile' ||
    route.profileId === expected.profileId;
}

function attachedProfile(
  spec: ProfileSpec,
  parent: SwitchProfile,
): RuleListProfile | undefined {
  const attachedId = parent.attachedRuleListProfileId;
  if (
    attachedId === undefined ||
    parent.rules.length !== 0 ||
    parent.defaultRoute.kind !== 'profile' ||
    parent.defaultRoute.profileId !== attachedId
  ) {
    return undefined;
  }

  const profile = spec.profiles.find(
    (candidate): candidate is RuleListProfile =>
      candidate.id === attachedId && candidate.kind === 'rule-list',
  );
  if (
    profile === undefined ||
    profile.name !== `__ruleListOf_${parent.name}` ||
    profile.color !== parent.color
  ) {
    return undefined;
  }
  return profile;
}

function fixedResult(
  spec: ProfileSpec,
  route: ProfileRouteTarget,
): FixedProfile | undefined {
  if (route.kind !== 'profile') return undefined;
  return spec.profiles.find(
    (candidate): candidate is FixedProfile =>
      candidate.id === route.profileId && candidate.kind === 'fixed' && candidate.color !== undefined,
  );
}

/**
 * Project only the four attached AutoProxy Rule List shapes captured in 01H:
 * matched/default into Direct or one Fixed fallback proxy. Parent rules,
 * exclusive rules, chained profiles, Fixed bypass and other result shapes stay
 * fail-closed until separate original evidence exists.
 */
export function projectOriginalAttachedRuleListTrace(
  input: ProjectOriginalAttachedRuleListTraceInput,
): OriginalObservableResultTrace | undefined {
  const { decision, i18n, parent, request, spec } = input;
  if (
    parent.color === undefined ||
    decision.status !== 'resolved' ||
    decision.support !== 'exact'
  ) {
    return undefined;
  }

  const attached = attachedProfile(spec, parent);
  if (attached === undefined) return undefined;

  const source = spec.ruleSources.find((candidate) => candidate.id === attached.sourceId);
  if (
    source === undefined ||
    source.format !== 'autoproxy' ||
    source.location.content === undefined
  ) {
    return undefined;
  }
  const sourceLines = significantAutoProxyLines(source.location.content);
  if (sourceLines.length !== 1) return undefined;

  const trace = decision.trace;
  if (
    trace[0]?.action !== 'enter-profile' ||
    trace[0].profileId !== parent.id ||
    trace[1]?.action !== 'switch-default' ||
    trace[1].profileId !== parent.id ||
    trace[2]?.action !== 'enter-profile' ||
    trace[2].profileId !== attached.id
  ) {
    return undefined;
  }

  const ruleEntries = trace.filter(
    (entry) => entry.action === 'rule-list-rule' && entry.profileId === attached.id,
  );
  if (ruleEntries.length !== 1) return undefined;
  const ruleEntry = ruleEntries[0];
  if (
    ruleEntry?.action !== 'rule-list-rule' ||
    ruleEntry.priorityGroup !== 'normal' ||
    ruleEntry.sourceLine !== sourceLines[0]
  ) {
    return undefined;
  }

  const matched = ruleEntry.matched === true;
  if (ruleEntry.matched !== true && ruleEntry.matched !== false) return undefined;
  if (matched && ruleEntry.sourceLine.includes('^')) return undefined;

  const selectionIndex = 3 + ruleEntries.length;
  let resultIndex = selectionIndex;
  let selectedRoute: ProfileRouteTarget;
  let transition: string;
  let detailPrefix: string | undefined;

  if (matched) {
    selectedRoute = attached.matchRoute;
    detailPrefix = localizeOriginalToolbarDetail(
      i18n,
      ORIGINAL_TOOLBAR_DETAIL_KEYS.attachedPrefix,
    );
    transition = `${detailPrefix}${ruleEntry.sourceLine} => `;
  } else {
    const defaultEntry = trace[selectionIndex];
    if (
      defaultEntry?.action !== 'rule-list-default' ||
      defaultEntry.profileId !== attached.id
    ) {
      return undefined;
    }
    resultIndex += 1;
    selectedRoute = attached.defaultRoute;
    transition = `${localizeOriginalToolbarDetail(
      i18n,
      ORIGINAL_TOOLBAR_DETAIL_KEYS.defaultRule,
    )} => `;
  }

  if (selectedRoute.kind === 'direct') {
    if (
      decision.route.kind !== 'direct' ||
      trace[resultIndex]?.action !== 'direct' ||
      trace.length !== resultIndex + 1 ||
      !routeMatches(selectedRoute, { kind: 'direct' })
    ) {
      return undefined;
    }
    const directName = requireDirectName(i18n);
    return {
      currentProfile: {
        displayName: parent.name,
        badgeName: parent.name,
        color: parent.color,
        builtin: false,
      },
      resultProfile: {
        displayName: `[${directName}]`,
        badgeName: directName,
        color: input.directColor,
        builtin: true,
      },
      details: `${transition}[${directName}]\n`,
      routeKind: 'direct',
      directProfileColor: input.directColor,
      directResult: true,
      currentProfileStatic: false,
      matchedProfileIsCurrent: false,
      ...(detailPrefix === undefined ? {} : { detailPrefix }),
    };
  }

  const fixed = fixedResult(spec, selectedRoute);
  if (
    fixed === undefined ||
    fixed.color === undefined ||
    decision.route.kind !== 'proxy' ||
    fixed.bypass.length !== 0
  ) {
    return undefined;
  }

  const scheme = request.scheme as 'http' | 'https' | 'ftp';
  const endpointId = fixed.proxyByScheme.fallback;
  if (
    endpointId === undefined ||
    fixed.proxyByScheme[scheme] !== undefined ||
    decision.route.endpointId !== endpointId ||
    trace[resultIndex]?.action !== 'enter-profile' ||
    trace[resultIndex]?.profileId !== fixed.id ||
    trace[resultIndex + 1]?.action !== 'fixed-endpoint' ||
    trace[resultIndex + 1]?.profileId !== fixed.id ||
    trace[resultIndex + 1]?.endpointId !== endpointId ||
    trace.length !== resultIndex + 2
  ) {
    return undefined;
  }

  return {
    currentProfile: {
      displayName: parent.name,
      badgeName: parent.name,
      color: parent.color,
      builtin: false,
    },
    resultProfile: {
      displayName: fixed.name,
      badgeName: fixed.name,
      color: fixed.color,
      builtin: false,
    },
    details: `${transition}${fixed.name}\n${originalPacResult(decision.route.endpoint)}\n`,
    routeKind: 'proxy',
    directProfileColor: input.directColor,
    directResult: false,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
    ...(detailPrefix === undefined ? {} : { detailPrefix }),
  };
}
