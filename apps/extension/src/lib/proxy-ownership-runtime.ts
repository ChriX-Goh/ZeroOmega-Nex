import { inspectProxyOwnership, type ProxyOwnershipView } from '@zeroomega-nex/browser-adapters';
import { browser } from 'wxt/browser';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';
import {
  isProxyOwnershipCommand,
  type ProxyOwnershipCommandResponse,
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
}

export interface RegisteredProxyOwnershipRuntime {
  dispose(): void;
}

async function inspectCurrentOwnership(): Promise<ProxyOwnershipView> {
  const runtime = currentBrowserProxyRuntime();
  try {
    return await inspectProxyOwnership(runtime.driver);
  } finally {
    runtime.dispose();
  }
}

export function registerProxyOwnershipRuntime(
  api: ProxyOwnershipRuntimeApi,
): RegisteredProxyOwnershipRuntime {
  const listener = (message: unknown): Promise<ProxyOwnershipCommandResponse> | undefined => {
    if (!isProxyOwnershipCommand(message)) return undefined;
    return inspectCurrentOwnership().then(
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
