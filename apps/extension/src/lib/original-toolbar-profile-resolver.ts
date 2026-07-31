import type {
  ProfileWorkflowRuntimeView,
  ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import { evaluateProfileGraph, type ReferenceRequest } from '@zeroomega-nex/reference-interpreter';

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

/**
 * Resolve source- and runtime-proven built-in and static Fixed Action states
 * from the applied profile workflow. The Fixed details reproduce the original
 * `Profiles.match` arrays consumed by `actionForUrl`: bypass pattern to Direct,
 * scheme to PAC result, or the fallback PAC result alone. Switch, Rule List,
 * Virtual, PAC and auto-detect traces remain fail-closed until their complete
 * original `matchProfile.results` display chain is represented.
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
    if (profile?.kind !== 'fixed' || profile.color === undefined) return undefined;

    const request = referenceRequest(input.url);
    if (request === undefined) return undefined;
    const decision = evaluateProfileGraph(state.applied, route, request);
    if (decision.status !== 'resolved') return undefined;

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
