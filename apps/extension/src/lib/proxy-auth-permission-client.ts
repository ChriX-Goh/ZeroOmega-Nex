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
  api: ProxyAuthenticationPermissionClientApi = browser as unknown as ProxyAuthenticationPermissionClientApi,
): Promise<boolean> {
  return api.permissions.contains(permissionDetails(api));
}

export async function requestProxyAuthenticationPermission(
  api: ProxyAuthenticationPermissionClientApi = browser as unknown as ProxyAuthenticationPermissionClientApi,
): Promise<boolean> {
  if (await hasProxyAuthenticationPermission(api)) return true;
  return api.permissions.request(permissionDetails(api));
}
