from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


Path('apps/extension/src/lib/proxy-auth-permission-client.ts').write_text(r'''import { browser } from 'wxt/browser';

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

export async function hasProxyAuthenticationPermission(
  api: ProxyAuthenticationPermissionClientApi =
    browser as unknown as ProxyAuthenticationPermissionClientApi,
): Promise<boolean> {
  return api.permissions.contains(permissionDetails(api));
}

export async function requestProxyAuthenticationPermission(
  api: ProxyAuthenticationPermissionClientApi =
    browser as unknown as ProxyAuthenticationPermissionClientApi,
): Promise<boolean> {
  if (await hasProxyAuthenticationPermission(api)) return true;
  return api.permissions.request(permissionDetails(api));
}
''')

Path('apps/extension/src/lib/proxy-auth-permission-client.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';

import {
  hasProxyAuthenticationPermission,
  requestProxyAuthenticationPermission,
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

describe('proxy authentication permission client', () => {
  it('requests Chromium authentication permissions and origins', async () => {
    const client = api(false, false);
    await expect(requestProxyAuthenticationPermission(client.value)).resolves.toBe(true);
    expect(client.calls).toEqual([
      [
        'contains',
        {
          permissions: ['webRequest', 'webRequestAuthProvider'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
      [
        'request',
        {
          permissions: ['webRequest', 'webRequestAuthProvider'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
    ]);
  });

  it('uses Firefox blocking permissions and skips a redundant request', async () => {
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
        'contains',
        {
          permissions: ['webRequest', 'webRequestBlocking'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
    ]);
  });
});
''')

# PAC editor requests permission before persisting credential or secret.
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  export let onReadSecret: (secretRef: string) => Promise<string> = async () => '';
  export let onGetPacSourceUpdateStatus: (
''',
    '''  export let onReadSecret: (secretRef: string) => Promise<string> = async () => '';
  export let onRequestAuthenticationPermission: () => Promise<boolean> = async () => false;
  export let onGetPacSourceUpdateStatus: (
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  async function saveAuthentication(): Promise<void> {
    if (!profile || authSaving) return;
    const draft = cloneProfileSpecDraft(spec);
''',
    '''  async function saveAuthentication(): Promise<void> {
    if (!profile || authSaving) return;
    authSaving = true;
    authError = '';
    let granted = false;
    try {
      granted = await onRequestAuthenticationPermission();
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
      authSaving = false;
      return;
    }
    if (!granted) {
      authError = 'Proxy authentication permission was not granted.';
      authSaving = false;
      return;
    }
    const draft = cloneProfileSpecDraft(spec);
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''    authSaving = true;
    authError = '';
    try {
      if (!(await onReplaceDraftWithSecrets(draft, materials))) return;
''',
    '''    try {
      if (!(await onReplaceDraftWithSecrets(draft, materials))) return;
''',
)

# App supplies the browser permission request from the user-gesture call chain.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  import {
    hasRequestDiagnosticsPermission,
    requestRequestDiagnosticsPermission,
  } from '../../lib/request-diagnostics-client';
''',
    '''  import { requestProxyAuthenticationPermission } from '../../lib/proxy-auth-permission-client';
  import {
    hasRequestDiagnosticsPermission,
    requestRequestDiagnosticsPermission,
  } from '../../lib/request-diagnostics-client';
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''          onReplaceDraftWithSecrets={replaceDraftWithSecrets}
          onReadSecret={readSecret}
          onGetPacSourceUpdateStatus={getPacSourceUpdateStatus}
''',
    '''          onReplaceDraftWithSecrets={replaceDraftWithSecrets}
          onReadSecret={readSecret}
          onRequestAuthenticationPermission={requestProxyAuthenticationPermission}
          onGetPacSourceUpdateStatus={getPacSourceUpdateStatus}
''',
)

# SSR component contract supplies an explicit permission decision.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
      },
''',
    '''        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
        onRequestAuthenticationPermission: async () => true,
      },
''',
)

# Permanent guard proves permission is requested before secret persistence.
validator_path = Path('scripts/validate-ui-compatibility.mjs')
validator = validator_path.read_text()
validator = validator.replace(
    "const proxyAuthenticationPlanPath = 'packages/browser-adapters/src/authentication-plan.ts';\n",
    "const proxyAuthenticationPlanPath = 'packages/browser-adapters/src/authentication-plan.ts';\nconst proxyAuthenticationPermissionClientPath =\n  'apps/extension/src/lib/proxy-auth-permission-client.ts';\n",
    1,
)
validator = validator.replace(
    '''  proxyAuthentication,
  proxyAuthenticationPlan,
] = await Promise.all([''',
    '''  proxyAuthentication,
  proxyAuthenticationPlan,
  proxyAuthenticationPermissionClient,
] = await Promise.all([''',
    1,
)
validator = validator.replace(
    '''  readFile(proxyAuthenticationPath, 'utf8'),
  readFile(proxyAuthenticationPlanPath, 'utf8'),
]);''',
    '''  readFile(proxyAuthenticationPath, 'utf8'),
  readFile(proxyAuthenticationPlanPath, 'utf8'),
  readFile(proxyAuthenticationPermissionClientPath, 'utf8'),
]);''',
    1,
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''      pacProfileEditor.includes('onReplaceDraftWithSecrets') &&
      rawPacSnapshot.includes("RAW_PAC_SNAPSHOT_VERSION = 'raw-pac/1'") &&
''',
    '''      pacProfileEditor.includes('onReplaceDraftWithSecrets') &&
      pacProfileEditor.includes('onRequestAuthenticationPermission') &&
      pacProfileEditor.includes('Proxy authentication permission was not granted.') &&
      proxyAuthenticationPermissionClient.includes("'webRequestAuthProvider'") &&
      proxyAuthenticationPermissionClient.includes("'webRequestBlocking'") &&
      proxyAuthenticationPermissionClient.includes("'http://*/*'") &&
      rawPacSnapshot.includes("RAW_PAC_SNAPSHOT_VERSION = 'raw-pac/1'") &&
''',
)

# Document the permission boundary.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg_path.write_text(
    kg_path.read_text()
    + '''
- PAC `auth.all` 保存必须先由 Options 用户手势请求认证权限：Chromium=`webRequest + webRequestAuthProvider + http/https origins`，Firefox=`webRequest + webRequestBlocking + http/https origins`。拒绝或异常时不写 ProfileSpec credential、secret 或 active binding；授权后仍由激活事务决定何时注册 listener。
'''
)
