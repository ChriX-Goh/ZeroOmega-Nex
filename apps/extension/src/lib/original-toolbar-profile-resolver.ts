import type {
  ProfileWorkflowRuntimeView,
  ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import { evaluateProfileGraph, type ReferenceRequest } from '@zeroomega-nex/reference-interpreter';

import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import {
  ORIGINAL_TOOLBAR_DIRECT_COLOR,
  ORIGINAL_TOOLBAR_SYSTEM_COLOR,
  projectOriginalObservableResultTrace,
  type OriginalObservableResultTrace,
} from './original-observable-result-trace';
import { deriveOriginalToolbarTabState } from './original-toolbar-tab-state';
import type { OriginalToolbarTabStateResolver } from './original-toolbar-tab-coordinator';

export { ORIGINAL_TOOLBAR_DIRECT_COLOR, ORIGINAL_TOOLBAR_SYSTEM_COLOR };

const FIXED_REQUEST_PROTOCOLS = new Set(['http:', 'https:', 'ftp:']);

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

function originalActionMatchedColor(trace: OriginalObservableResultTrace): string {
  if (trace.routeKind === 'direct' && !trace.currentProfileStatic && trace.resultProfile.builtin) {
    return trace.currentProfile.color;
  }
  return trace.resultProfile.color;
}

function deriveToolbarState(state: ProfileWorkflowState, trace: OriginalObservableResultTrace) {
  return deriveOriginalToolbarTabState({
    currentProfileName: trace.currentProfile.displayName,
    resultProfileName: trace.resultProfile.displayName,
    details: trace.details,
    icon: {
      currentProfileColor: trace.currentProfile.color,
      matchedProfileColor: originalActionMatchedColor(trace),
      directProfileColor: trace.directProfileColor,
      directResult: trace.directResult,
      currentProfileStatic: trace.currentProfileStatic,
      matchedProfileIsCurrent: trace.matchedProfileIsCurrent,
    },
    badge: {
      enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
      resultProfileName: trace.resultProfile.badgeName,
      resultProfileBuiltin: trace.resultProfile.builtin,
      ...(trace.resultProfile.builtin ? { builtinBadgeText: trace.resultProfile.badgeName } : {}),
    },
    ...(trace.detailPrefix === undefined ? {} : { detailPrefix: trace.detailPrefix }),
  });
}

/**
 * Resolve the applied profile workflow into the original browser Action state.
 * Repository/runtime access and URL parsing stay here; interpretation of the
 * internal graph decision is delegated to the browser-independent original
 * observable result projection.
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
    const activeRoute = runtime.activeRoute;
    if (activeRoute === undefined) return undefined;

    if (activeRoute.kind === 'direct' || activeRoute.kind === 'system') {
      const trace = projectOriginalObservableResultTrace({
        spec: state.applied,
        activeRoute,
        i18n: this.#i18n,
      });
      return trace === undefined ? undefined : deriveToolbarState(state, trace);
    }

    const request = referenceRequest(input.url);
    if (request === undefined) return undefined;
    const decision = evaluateProfileGraph(state.applied, activeRoute, request);
    const trace = projectOriginalObservableResultTrace({
      spec: state.applied,
      activeRoute,
      request,
      decision,
      i18n: this.#i18n,
    });

    return trace === undefined ? undefined : deriveToolbarState(state, trace);
  }
}
