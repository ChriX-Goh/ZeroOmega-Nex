import type {
  ProfileWorkflowRuntimeView,
  ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';

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

/**
 * Resolve source- and runtime-proven built-in Action states from the applied
 * profile workflow. Profile graph matching remains deliberately unsupported in
 * this slice; returning undefined keeps the coordinator on the localized
 * Loading fallback instead of inventing a result trace.
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

  async resolve() {
    const state = await this.#repository.read();
    if (state === undefined) return undefined;

    const runtime = await this.#runtime.inspectRuntime();
    const route = runtime.activeRoute;
    if (route === undefined || route.kind === 'profile') return undefined;

    const directColor =
      state.applied.settings.interface.builtInProfiles?.direct?.color ??
      ORIGINAL_TOOLBAR_DIRECT_COLOR;
    const systemColor =
      state.applied.settings.interface.builtInProfiles?.system?.color ??
      ORIGINAL_TOOLBAR_SYSTEM_COLOR;
    const currentColor = route.kind === 'direct' ? directColor : systemColor;
    const routeName = this.requireRouteName(route.kind);
    const detail =
      route.kind === 'direct'
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
        directResult: route.kind === 'direct',
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
