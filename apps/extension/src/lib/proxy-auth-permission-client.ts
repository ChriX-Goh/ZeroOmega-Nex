import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

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
    ) || spec.profiles.some((profile) => profile.kind === 'pac' && profile.credential !== undefined)
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
  if (
    profileSpecUsesProxyAuthentication(spec) &&
    !(await requestProxyAuthenticationPermission(api))
  ) {
    return { granted: false };
  }
  return { granted: true, value: await action() };
}
