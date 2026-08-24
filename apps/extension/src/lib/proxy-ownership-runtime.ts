import {
  inspectProxyOwnership,
  parseExternalProfileCandidate,
  type BrowserStorageArea,
  type BuiltInProxyMode,
  type PlatformProxyState,
} from '@zeroomega-nex/browser-adapters';
import {
  BrowserStorageProfileWorkflowRepository,
  findMatchingExternalProfile,
  type ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';
import { browser } from 'wxt/browser';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';
import {
  isProxyOwnershipCommand,
  type ProxyOwnershipCommandResponse,
  type ProxyOwnershipView,
} from './proxy-ownership-client';

interface ProxyOwnershipMessageEvent {
  addListener(
    listener: (
      message: unknown,
    ) => ProxyOwnershipCommandResponse | Promise<ProxyOwnershipCommandResponse> | undefined,
  ): void;
  removeListener(listener: (message: unknown) => unknown): void;
}

export interface ProxyOwnershipRuntimeApi {
  readonly runtime: { readonly onMessage: ProxyOwnershipMessageEvent };
  readonly storage: {
    readonly local: ProfileWorkflowStorageArea & BrowserStorageArea;
  };
}

export interface RegisteredProxyOwnershipRuntime {
  dispose(): void;
}

export type ProxyRuntimeRestoreDisposition =
  | 'inspect-startup-route'
  | 'startup-complete'
  | 'failed';

export function shouldActivateStartupRouteAfterProxyRestore(
  disposition: ProxyRuntimeRestoreDisposition,
  hasActiveRoute: boolean,
): boolean {
  return disposition === 'inspect-startup-route' && !hasActiveRoute;
}

export function shouldPreserveExternalProxyState(
  activeBuiltInMode: BuiltInProxyMode | undefined,
  platformState: PlatformProxyState,
): boolean {
  return (
    activeBuiltInMode === 'system' && parseExternalProfileCandidate(platformState) !== undefined
  );
}

async function inspectCurrentOwnership(api: ProxyOwnershipRuntimeApi): Promise<ProxyOwnershipView> {
  const runtime = currentBrowserProxyRuntime();
  try {
    const ownership = await inspectProxyOwnership(runtime.driver);
    if (ownership.blocked) return ownership;
    const activation = await runtime.repository.getState();
    if (activation.activeBuiltInMode !== 'system') return ownership;
    const workflow = await new BrowserStorageProfileWorkflowRepository(api.storage.local).read();
    if (!workflow?.applied.settings.interface.showExternalProfile) return ownership;
    const candidate = parseExternalProfileCandidate(await runtime.driver.readState());
    if (!candidate || findMatchingExternalProfile(workflow.applied, candidate)) return ownership;
    return {
      ...ownership,
      externalProfile: {
        kind: candidate.kind,
        suggestedName: 'External Profile',
      },
    };
  } finally {
    runtime.dispose();
  }
}

export function registerProxyOwnershipRuntime(
  api: ProxyOwnershipRuntimeApi,
): RegisteredProxyOwnershipRuntime {
  const listener = (message: unknown): Promise<ProxyOwnershipCommandResponse> | undefined => {
    if (!isProxyOwnershipCommand(message)) return undefined;
    return inspectCurrentOwnership(api).then(
      (view) => ({ ok: true, view }),
      (error: unknown) => ({
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  };
  api.runtime.onMessage.addListener(listener);
  return { dispose: () => api.runtime.onMessage.removeListener(listener) };
}

export function currentProxyOwnershipRuntimeApi(): ProxyOwnershipRuntimeApi {
  return browser as unknown as ProxyOwnershipRuntimeApi;
}
