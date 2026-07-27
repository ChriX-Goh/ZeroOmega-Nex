from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


Path('apps/extension/src/lib/proxy-ownership-client.ts').write_text(r'''import type { ProxyOwnershipView } from '@zeroomega-nex/browser-adapters';
import { browser } from 'wxt/browser';

export const PROXY_OWNERSHIP_MESSAGE_CHANNEL = 'zeroomega-nex/proxy-ownership/v1' as const;

export interface ProxyOwnershipCommand {
  readonly channel: typeof PROXY_OWNERSHIP_MESSAGE_CHANNEL;
  readonly action: 'get';
}

export type ProxyOwnershipCommandResponse =
  | { readonly ok: true; readonly view: ProxyOwnershipView }
  | { readonly ok: false; readonly message: string };

export function isProxyOwnershipCommand(value: unknown): value is ProxyOwnershipCommand {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.channel === PROXY_OWNERSHIP_MESSAGE_CHANNEL && record.action === 'get';
}

function isResponse(value: unknown): value is ProxyOwnershipCommandResponse {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.ok === false) return typeof record.message === 'string';
  if (record.ok !== true || record.view === null || typeof record.view !== 'object') return false;
  const view = record.view as Record<string, unknown>;
  return (
    (view.family === 'chromium' || view.family === 'firefox') &&
    typeof view.blocked === 'boolean' &&
    typeof view.controlLevel === 'string'
  );
}

export async function sendProxyOwnershipCommand(): Promise<ProxyOwnershipCommandResponse> {
  const response = await browser.runtime.sendMessage({
    channel: PROXY_OWNERSHIP_MESSAGE_CHANNEL,
    action: 'get',
  } satisfies ProxyOwnershipCommand);
  if (!isResponse(response)) {
    return { ok: false, message: 'proxy ownership runtime returned an invalid response' };
  }
  return response;
}
''')

Path('apps/extension/src/lib/proxy-ownership-runtime.ts').write_text(r'''import {
  inspectProxyOwnership,
  type ProxyOwnershipView,
} from '@zeroomega-nex/browser-adapters';
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
  const listener = (
    message: unknown,
  ): Promise<ProxyOwnershipCommandResponse> | undefined => {
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
''')

Path('apps/extension/src/lib/proxy-ownership-runtime.test.ts').write_text(r'''import { describe, expect, it, vi } from 'vitest';

import {
  PROXY_OWNERSHIP_MESSAGE_CHANNEL,
  isProxyOwnershipCommand,
} from './proxy-ownership-client';

vi.mock('./browser-proxy-runtime', () => ({
  currentBrowserProxyRuntime: () => ({
    driver: {
      family: 'chromium',
      getCapabilities: async () => ({
        family: 'chromium',
        canSetProxy: false,
        controlLevel: 'controlled-by-other-extension',
        supportsInlinePac: true,
        requiresPrivateBrowsingAccess: false,
        privateBrowsingAllowed: true,
        supportsPersistentRegularScope: true,
        notes: [],
      }),
    },
    repository: {},
    dispose: vi.fn(),
  }),
}));

describe('proxy ownership message contract', () => {
  it('accepts only its own get command', () => {
    expect(
      isProxyOwnershipCommand({
        channel: PROXY_OWNERSHIP_MESSAGE_CHANNEL,
        action: 'get',
      }),
    ).toBe(true);
    expect(
      isProxyOwnershipCommand({ channel: 'zeroomega-nex/profile-workflow/v1', action: 'get' }),
    ).toBe(false);
  });
});
''')

replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """import {
  currentProxyAuthenticationApi,
  ProxyAuthenticationRuntimeManager,
} from '../lib/proxy-auth-runtime';
""",
    """import {
  currentProxyAuthenticationApi,
  ProxyAuthenticationRuntimeManager,
} from '../lib/proxy-auth-runtime';
import {
  currentProxyOwnershipRuntimeApi,
  registerProxyOwnershipRuntime,
  type RegisteredProxyOwnershipRuntime,
} from '../lib/proxy-ownership-runtime';
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """let popupTemporaryRuleRuntime: RegisteredPopupTemporaryRuleRuntime | undefined;
""",
    """let popupTemporaryRuleRuntime: RegisteredPopupTemporaryRuleRuntime | undefined;
let proxyOwnershipRuntime: RegisteredProxyOwnershipRuntime | undefined;
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """  popupTemporaryRuleRuntime?.dispose();
  profileWorkflowRuntime?.dispose();
""",
    """  proxyOwnershipRuntime?.dispose();
  popupTemporaryRuleRuntime?.dispose();
  profileWorkflowRuntime?.dispose();
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """  popupTemporaryRuleRuntime = temporaryRuleCoordinator
    ? registerPopupTemporaryRuleRuntime(temporaryRuleApi, temporaryRuleCoordinator)
    : undefined;

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch((error: unknown) => {
""",
    """  popupTemporaryRuleRuntime = temporaryRuleCoordinator
    ? registerPopupTemporaryRuleRuntime(temporaryRuleApi, temporaryRuleCoordinator)
    : undefined;
  proxyOwnershipRuntime = registerProxyOwnershipRuntime(currentProxyOwnershipRuntimeApi());

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch((error: unknown) => {
""",
)
