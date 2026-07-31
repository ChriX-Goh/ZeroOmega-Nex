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

export const ORIGINAL_TOOLBAR_DIRECT_COLOR = '#bdbdbd';
export const ORIGINAL_TOOLBAR_SYSTEM_COLOR = '#616161';

const ROUTE_MESSAGE_KEYS = {
  direct: 'routeDirect',
  system: 'routeSystem',
} as const;
const SUPPORTED_REQUEST_PROTOCOLS = new Set(['http:', 'https:', 'ftp:', 'ws:', 'wss:']);

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
  if (!SUPPORTED_REQUEST_PROTOCOLS.has(parsed.protocol) || parsed.hostname.length === 0) {
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

/**
 * Resolve source- and runtime-proven built-in and static Fixed Action states
 * from the applied profile workflow. Switch, Rule List, Virtual, PAC and
 * auto-detect title traces remain deliberately unsupported in this slice;
 * returning undefined keeps the coordinator on the localized Loading fallback
 * instead of inventing original-facing details.
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
      return deriveOriginalToolbarTabState({
        currentProfileName: profile.name,
        resultProfileName: profile.name,
        details: localizeOriginalToolbarDetail(
          this.#i18n,
          ORIGINAL_TOOLBAR_DETAIL_KEYS.defaultRule,
        ),
        icon: {
          currentProfileColor: profile.color,
          matchedProfileColor: profile.color,
          directProfileColor: directColor,
          directResult: false,
          currentProfileStatic: true,
          matchedProfileIsCurrent: true,
        },
        badge: {
          enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
          resultProfileName: profile.name,
          resultProfileBuiltin: false,
        },
      });
    }

    if (decision.route.kind !== 'direct') return undefined;
    const directName = this.requireRouteName('direct');
    return deriveOriginalToolbarTabState({
      currentProfileName: profile.name,
      resultProfileName: `[${directName}]`,
      details: localizeOriginalToolbarDetail(
        this.#i18n,
        ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult,
      ),
      icon: {
        currentProfileColor: profile.color,
        matchedProfileColor: profile.color,
        directProfileColor: directColor,
        directResult: true,
        currentProfileStatic: true,
        matchedProfileIsCurrent: false,
      },
      badge: {
        enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
        resultProfileName: directName,
        resultProfileBuiltin: true,
        builtinBadgeText: directName,
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
    if (name.length === 0) throw new Error(`Missing original built-in route message: ${route}`);
    return name;
  }
}
