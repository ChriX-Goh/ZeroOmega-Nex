import type { Condition, FixedProfile, SwitchProfile } from '@zeroomega-nex/profile-spec';
import type {
  ProfileWorkflowRuntimeView,
  ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import {
  evaluateProfileGraph,
  type GraphDecision,
  type ReferenceRequest,
} from '@zeroomega-nex/reference-interpreter';

import {
  localizeOriginalToolbarDetail,
  ORIGINAL_TOOLBAR_DETAIL_KEYS,
  type OriginalToolbarI18nApi,
} from './original-toolbar-i18n';
import { deriveOriginalToolbarTabState } from './original-toolbar-tab-state';
import type { OriginalToolbarTabStateResolver } from './original-toolbar-tab-coordinator';

export const ORIGINAL_TOOLBAR_DIRECT_COLOR = '#aaaaaa';
export const ORIGINAL_TOOLBAR_SYSTEM_COLOR = '#000000';

const ROUTE_MESSAGE_KEYS = {
  direct: 'routeDirect',
  system: 'routeSystem',
} as const;
const FIXED_REQUEST_PROTOCOLS = new Set(['http:', 'https:', 'ftp:']);
const PAC_PROTOCOLS = {
  http: 'PROXY',
  https: 'HTTPS',
  socks4: 'SOCKS',
  socks5: 'SOCKS5',
} as const;
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const WEEKDAY_MARKERS = 'SMTWtFs';

export interface OriginalToolbarProfileStateRepository {
  read(): Promise<ProfileWorkflowState | undefined>;
}

export interface OriginalToolbarRuntimeInspector {
  inspectRuntime(): Promise<ProfileWorkflowRuntimeView>;
}

export interface OriginalToolbarProfileResolverOptions {
  readonly repository: OriginalToolbarProfileStateRepository;
  readonly runtime: OriginalToolbarRuntimeInspector;
  readonly i18n: OriginalToolbarI18nApi;
}

function referenceRequest(url: string): ReferenceRequest | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (!FIXED_REQUEST_PROTOCOLS.has(parsed.protocol) || parsed.hostname.length === 0) {
    return undefined;
  }

  const port = parsed.port.length === 0 ? undefined : Number(parsed.port);
  return {
    url: parsed.href,
    host: parsed.hostname.replace(/^\[|\]$/gu, ''),
    scheme: parsed.protocol.slice(0, -1),
    ...(port === undefined ? {} : { port }),
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

/**
 * Resolve source- and runtime-proven built-in, static Fixed and exact
 * Switch-to-Fixed proxy Action states from the applied profile workflow. Fixed
 * details reproduce the original `Profiles.match` arrays consumed by
 * `actionForUrl`: bypass pattern to Direct, scheme to PAC result, or fallback
 * PAC result alone. The Switch slice accepts only a direct matched/default rule
 * into one colored Fixed profile without an attached Rule List. Switch results
 * into Direct/System, nested or attached Rule Lists, Virtual, PAC,
 * temporary-rule and external-control traces remain fail-closed until their
 * complete original `matchProfile.results` display chain is represented.
 */
export class OriginalToolbarProfileResolver implements OriginalToolbarTabStateResolver {
  readonly #repository: OriginalToolbarProfileStateRepository;
  readonly #runtime: OriginalToolbarRuntimeInspector;
  readonly #i18n: OriginalToolbarI18nApi;

  constructor(options: OriginalToolbarProfileResolverOptions) {
    this.#repository = options.repository;
    this.#runtime = options.runtime;
    this.#i18n = options.i18n;
  }

  async resolve(input: { readonly tabId: number; readonly url: string }) {
    if (input.url.length === 0) return undefined;

    const state = await this.#repository.read();
    if (state === undefined) return undefined;

    const runtime = await this.#runtime.inspectRuntime();
    const route = runtime.activeRoute;
    if (route === undefined) return undefined;

    const directColor =
      state.applied.settings.interface.builtInProfiles?.direct?.color ??
      ORIGINAL_TOOLBAR_DIRECT_COLOR;
    const systemColor =
      state.applied.settings.interface.builtInProfiles?.system?.color ??
      ORIGINAL_TOOLBAR_SYSTEM_COLOR;

    if (route.kind === 'direct' || route.kind === 'system') {
      return this.resolveBuiltIn(state, route.kind, directColor, systemColor);
    }

    const profile = state.applied.profiles.find((candidate) => candidate.id === route.profileId);
    if (profile === undefined || profile.color === undefined) return undefined;

    const request = referenceRequest(input.url);
    if (request === undefined) return undefined;
    const decision = evaluateProfileGraph(state.applied, route, request);
    if (decision.status !== 'resolved' || decision.support !== 'exact') return undefined;

    if (profile.kind === 'switch') {
      return this.resolveSwitchFixedProxy(state, profile, decision, request, directColor);
    }
    if (profile.kind !== 'fixed') return undefined;

    if (decision.route.kind === 'proxy') {
      const scheme = request.scheme as 'http' | 'https' | 'ftp';
      const hasSpecificEndpoint = profile.proxyByScheme[scheme] !== undefined;
      const pacResult = originalPacResult(decision.route.endpoint);
      return this.resolveFixed(
        state,
        profile.name,
        profile.color,
        directColor,
        `${hasSpecificEndpoint ? `${scheme} => ` : ''}${pacResult}\n`,
        false,
      );
    }

    if (decision.route.kind !== 'direct') return undefined;
    const directDetail = localizeOriginalToolbarDetail(
      this.#i18n,
      ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult,
    );
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

    return this.resolveFixed(
      state,
      profile.name,
      profile.color,
      directColor,
      `${bypass === undefined ? '' : `${bypass.pattern} => `}${directDetail}\n`,
      true,
    );
  }

  private resolveFixed(
    state: ProfileWorkflowState,
    profileName: string,
    profileColor: string,
    directColor: string,
    details: string,
    directResult: boolean,
  ) {
    return deriveOriginalToolbarTabState({
      currentProfileName: profileName,
      resultProfileName: profileName,
      details,
      icon: {
        currentProfileColor: profileColor,
        matchedProfileColor: profileColor,
        directProfileColor: directColor,
        directResult,
        currentProfileStatic: true,
        matchedProfileIsCurrent: !directResult,
      },
      badge: {
        enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
        resultProfileName: profileName,
        resultProfileBuiltin: false,
      },
    });
  }

  private resolveSwitchFixedProxy(
    state: ProfileWorkflowState,
    profile: SwitchProfile,
    decision: GraphDecision,
    request: ReferenceRequest,
    directColor: string,
  ) {
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

    const resultProfile = state.applied.profiles.find(
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
        this.#i18n,
        ORIGINAL_TOOLBAR_DETAIL_KEYS.defaultRule,
      );
      selectionDetail = `${defaultDetail} => ${resultProfile.name}\n`;
    } else {
      return undefined;
    }

    const scheme = request.scheme as 'http' | 'https' | 'ftp';
    const hasSpecificEndpoint = resultProfile.proxyByScheme[scheme] !== undefined;
    const pacResult = originalPacResult(decision.route.endpoint);
    const details = `${selectionDetail}${hasSpecificEndpoint ? `${scheme} => ` : ''}${pacResult}\n`;

    return deriveOriginalToolbarTabState({
      currentProfileName: profile.name,
      resultProfileName: resultProfile.name,
      details,
      icon: {
        currentProfileColor: profile.color,
        matchedProfileColor: resultProfile.color,
        directProfileColor: directColor,
        directResult: false,
        currentProfileStatic: false,
        matchedProfileIsCurrent: false,
      },
      badge: {
        enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
        resultProfileName: resultProfile.name,
        resultProfileBuiltin: false,
      },
    });
  }

  private resolveBuiltIn(
    state: ProfileWorkflowState,
    route: keyof typeof ROUTE_MESSAGE_KEYS,
    directColor: string,
    systemColor: string,
  ) {
    const currentColor = route === 'direct' ? directColor : systemColor;
    const routeName = this.requireRouteName(route);
    const detail =
      route === 'direct'
        ? localizeOriginalToolbarDetail(this.#i18n, ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult)
        : localizeOriginalToolbarDetail(this.#i18n, ORIGINAL_TOOLBAR_DETAIL_KEYS.externalProxy);

    return deriveOriginalToolbarTabState({
      currentProfileName: `[${routeName}]`,
      resultProfileName: `[${routeName}]`,
      details: detail,
      icon: {
        currentProfileColor: currentColor,
        matchedProfileColor: currentColor,
        directProfileColor: directColor,
        directResult: route === 'direct',
        currentProfileStatic: true,
        matchedProfileIsCurrent: true,
      },
      badge: {
        enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
        resultProfileName: routeName,
        resultProfileBuiltin: true,
        builtinBadgeText: routeName,
      },
    });
  }

  private requireRouteName(route: keyof typeof ROUTE_MESSAGE_KEYS): string {
    const name = this.#i18n.getMessage(ROUTE_MESSAGE_KEYS[route]);
    if (name.length === 0) {
      throw new Error(`Missing original built-in route message: ${route}`);
    }
    return name;
  }
}
