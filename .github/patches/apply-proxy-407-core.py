from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new))

# Make permission acquisition a testable, fail-closed user-gesture boundary.
Path('apps/extension/src/lib/proxy-auth-permission-client.ts').write_text("""import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

import { browser } from 'wxt/browser';

export const PROXY_AUTH_PERMISSION_ORIGINS = ['http://*/*', 'https://*/*'] as const;

interface ProxyAuthenticationPermissionClientApi {
  readonly runtime: {
    readonly getBrowserInfo?: () => Promise<unknown>;
  };
  readonly permissions: {
    contains(details: { permissions: string[]; origins: string[] }): Promise<boolean>;
    request(details: { permissions: string[]; origins: string[] }): Promise<boolean>;
  };
}

export type ProxyAuthenticationPermissionResult<T> =
  | { readonly granted: false }
  | { readonly granted: true; readonly value: T };

function permissionDetails(api: ProxyAuthenticationPermissionClientApi): {
  permissions: string[];
  origins: string[];
} {
  return {
    permissions:
      typeof api.runtime.getBrowserInfo === 'function'
        ? ['webRequest', 'webRequestBlocking']
        : ['webRequest', 'webRequestAuthProvider'],
    origins: [...PROXY_AUTH_PERMISSION_ORIGINS],
  };
}

export function profileSpecUsesProxyAuthentication(spec: ProfileSpec): boolean {
  return (
    spec.proxyEndpoints.some(
      (endpoint) =>
        endpoint.credential !== undefined &&
        (endpoint.protocol === 'http' || endpoint.protocol === 'https'),
    ) ||
    spec.profiles.some(
      (profile) => profile.kind === 'pac' && profile.credential !== undefined,
    )
  );
}

export async function hasProxyAuthenticationPermission(
  api: ProxyAuthenticationPermissionClientApi = browser as unknown as ProxyAuthenticationPermissionClientApi,
): Promise<boolean> {
  return api.permissions.contains(permissionDetails(api));
}

export async function requestProxyAuthenticationPermission(
  api: ProxyAuthenticationPermissionClientApi = browser as unknown as ProxyAuthenticationPermissionClientApi,
): Promise<boolean> {
  // Firefox requires permissions.request to remain in the original user activation.
  // Do not await permissions.contains first: an already-granted request is idempotent,
  // while the preliminary asynchronous check can consume the activation boundary.
  return api.permissions.request(permissionDetails(api));
}

export async function runWithProxyAuthenticationPermission<T>(
  spec: ProfileSpec,
  action: () => Promise<T>,
  api: ProxyAuthenticationPermissionClientApi = browser as unknown as ProxyAuthenticationPermissionClientApi,
): Promise<ProxyAuthenticationPermissionResult<T>> {
  if (profileSpecUsesProxyAuthentication(spec) && !(await requestProxyAuthenticationPermission(api))) {
    return { granted: false };
  }
  return { granted: true, value: await action() };
}
""")

Path('apps/extension/src/lib/proxy-auth-permission-client.test.ts').write_text("""import { createDefaultProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it, vi } from 'vitest';

import {
  hasProxyAuthenticationPermission,
  profileSpecUsesProxyAuthentication,
  requestProxyAuthenticationPermission,
  runWithProxyAuthenticationPermission,
} from './proxy-auth-permission-client';

function api(firefox: boolean, contains: boolean, request = true) {
  const calls: unknown[] = [];
  return {
    calls,
    value: {
      runtime: firefox ? { getBrowserInfo: async () => ({ name: 'Firefox' }) } : {},
      permissions: {
        contains: async (details: unknown) => {
          calls.push(['contains', details]);
          return contains;
        },
        request: async (details: unknown) => {
          calls.push(['request', details]);
          return request;
        },
      },
    },
  };
}

function credentialedSpec() {
  const spec = createDefaultProfileSpec();
  const fixed = spec.profiles.find((profile) => profile.kind === 'fixed');
  if (!fixed || fixed.kind !== 'fixed') throw new Error('default Fixed profile is missing');
  spec.proxyEndpoints.push({
    id: 'endpoint-auth-e2e',
    name: 'Authenticated proxy',
    protocol: 'http',
    host: '127.0.0.1',
    port: 3128,
    credential: { username: 'alice', passwordSecretRef: 'secret-auth-e2e' },
  });
  fixed.proxyByScheme.fallback = 'endpoint-auth-e2e';
  return spec;
}

describe('proxy authentication permission client', () => {
  it('requests Chromium authentication permissions and origins without a preliminary await', async () => {
    const client = api(false, false);
    await expect(requestProxyAuthenticationPermission(client.value)).resolves.toBe(true);
    expect(client.calls).toEqual([
      [
        'request',
        {
          permissions: ['webRequest', 'webRequestAuthProvider'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
    ]);
  });

  it('checks Firefox permission separately and requests blocking permissions directly', async () => {
    const client = api(true, true);
    await expect(hasProxyAuthenticationPermission(client.value)).resolves.toBe(true);
    await expect(requestProxyAuthenticationPermission(client.value)).resolves.toBe(true);
    expect(client.calls).toEqual([
      [
        'contains',
        {
          permissions: ['webRequest', 'webRequestBlocking'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
      [
        'request',
        {
          permissions: ['webRequest', 'webRequestBlocking'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
    ]);
  });

  it('detects endpoint and PAC credentials but ignores a credential-free spec', () => {
    const plain = createDefaultProfileSpec();
    expect(profileSpecUsesProxyAuthentication(plain)).toBe(false);
    expect(profileSpecUsesProxyAuthentication(credentialedSpec())).toBe(true);

    const pac = createDefaultProfileSpec();
    pac.profiles.push({
      id: 'pac-auth-e2e',
      name: 'PAC auth',
      kind: 'pac',
      source: { kind: 'inline', script: "function FindProxyForURL(){return 'DIRECT';}" },
      credential: { username: 'pac-user', passwordSecretRef: 'secret-pac-e2e' },
    });
    expect(profileSpecUsesProxyAuthentication(pac)).toBe(true);
  });

  it('does not run the guarded action when permission is denied', async () => {
    const action = vi.fn(async () => 'mutated');
    const client = api(false, false, false);
    await expect(
      runWithProxyAuthenticationPermission(credentialedSpec(), action, client.value),
    ).resolves.toEqual({ granted: false });
    expect(action).not.toHaveBeenCalled();
  });

  it('runs credential-free actions without requesting optional permissions', async () => {
    const action = vi.fn(async () => 'unchanged');
    const client = api(false, false, false);
    await expect(
      runWithProxyAuthenticationPermission(createDefaultProfileSpec(), action, client.value),
    ).resolves.toEqual({ granted: true, value: 'unchanged' });
    expect(client.calls).toEqual([]);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
""")

# Typed permission-denial presentation.
ui = Path('apps/extension/src/lib/ui-messages.ts')
replace_once(
    ui,
    """  'options.error.safeMessage': {
    en: 'The operation could not be completed. Retry or review the relevant status panel.',
    'zh-CN': '无法完成此操作。请重试或查看相关状态区域。',
    'zh-TW': '無法完成此操作。請重試或查看相關狀態區域。',
  },
""",
    """  'options.error.safeMessage': {
    en: 'The operation could not be completed. Retry or review the relevant status panel.',
    'zh-CN': '无法完成此操作。请重试或查看相关状态区域。',
    'zh-TW': '無法完成此操作。請重試或查看相關狀態區域。',
  },
  'options.error.proxyAuthPermission': {
    en: 'Proxy authentication permission is required before applying credentials.',
    'zh-CN': '应用代理登录凭据前，需要授予代理认证权限。',
    'zh-TW': '套用代理登入憑證前，需要授予代理驗證權限。',
  },
""",
    'typed proxy authentication permission error',
)

# Route every Apply-capable UI path through the permission boundary while the click gesture is active.
app = Path('apps/extension/src/entrypoints/options/App.svelte')
replace_once(
    app,
    """  import { requestProxyAuthenticationPermission } from '../../lib/proxy-auth-permission-client';
""",
    """  import { runWithProxyAuthenticationPermission } from '../../lib/proxy-auth-permission-client';
""",
    'App proxy permission import',
)
replace_once(
    app,
    """  async function acceptImportedAndApply(
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    if (!(await acceptImportedDraft(expectedGeneration, candidate, secretMaterials)) || !state) {
      return false;
    }
    return runCommand({
      action: 'apply',
      expectedGeneration: state.generation,
    });
  }
""",
    """  async function acceptImportedAndApply(
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    const permission = await runWithProxyAuthenticationPermission(candidate, async () => {
      if (!(await acceptImportedDraft(expectedGeneration, candidate, secretMaterials)) || !state) {
        return false;
      }
      return runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      });
    });
    if (!permission.granted) {
      errorMessage = uiText('options.error.proxyAuthPermission', locale);
      return false;
    }
    return permission.value;
  }
""",
    'import and apply permission boundary',
)
replace_once(
    app,
    """  async function applyDraft(): Promise<void> {
    if (!state || !hasUnappliedChanges || !(await commitActiveProfileEditor())) return;
    if (!view?.dirty) return;
    await runCommand({
      action: 'apply',
      expectedGeneration: state.generation,
    });
  }
""",
    """  async function applyDraft(): Promise<void> {
    if (!state || !hasUnappliedChanges) return;
    const permission = await runWithProxyAuthenticationPermission(state.draft, async () => {
      if (!state || !(await commitActiveProfileEditor()) || !view?.dirty) return false;
      return runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      });
    });
    if (!permission.granted) {
      errorMessage = uiText('options.error.proxyAuthPermission', locale);
    }
  }
""",
    'normal Apply permission boundary',
)
replace_once(
    app,
    """      const applied = await runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      });
      if (!applied) return undefined;
""",
    """      const permission = await runWithProxyAuthenticationPermission(state.draft, () =>
        runCommand({
          action: 'apply',
          expectedGeneration: state!.generation,
        }),
      );
      if (!permission.granted) {
        errorMessage = uiText('options.error.proxyAuthPermission', locale);
        return undefined;
      }
      if (!permission.value) return undefined;
""",
    'Apply-before-export permission boundary',
)
replace_once(
    app,
    """      const applied = await runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      });
      if (!applied) return;
""",
    """      const permission = await runWithProxyAuthenticationPermission(state.draft, () =>
        runCommand({
          action: 'apply',
          expectedGeneration: state!.generation,
        }),
      );
      if (!permission.granted) {
        errorMessage = uiText('options.error.proxyAuthPermission', locale);
        return;
      }
      if (!permission.value) return;
""",
    'Apply-before-replacement permission boundary',
)
