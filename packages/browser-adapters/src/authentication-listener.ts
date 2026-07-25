import type { BrowserFamily } from './contracts.js';
import type {
  ProxyAuthenticationChallenge,
  ProxyAuthenticationHandler,
  ProxyAuthenticationResponse,
} from './authentication.js';

export const PROXY_AUTH_URL_FILTERS = ['http://*/*', 'https://*/*'] as const;

export interface ProxyAuthenticationPermissionApi {
  contains(details: {
    readonly permissions: readonly string[];
    readonly origins: readonly string[];
  }): Promise<boolean>;
}

export interface ProxyAuthenticationRequiredEvent {
  addListener(
    listener: (
      details: ProxyAuthenticationChallenge,
      callback?: (response: ProxyAuthenticationResponse | Record<string, never>) => void,
    ) => ProxyAuthenticationResponse | Promise<ProxyAuthenticationResponse | undefined> | void,
    filter: { readonly urls: readonly string[] },
    extraInfoSpec: readonly string[],
  ): void;
  removeListener(listener: (...arguments_: never[]) => unknown): void;
}

export interface ProxyAuthenticationEvents {
  readonly onAuthRequired: ProxyAuthenticationRequiredEvent;
}

export interface ProxyAuthenticationListenerRegistration {
  readonly status: 'registered' | 'permissions-required';
  readonly requiredPermissions: readonly string[];
  readonly requiredOrigins: readonly string[];
  dispose(): void;
}

function permissionsFor(family: BrowserFamily): readonly string[] {
  return family === 'chromium'
    ? ['webRequest', 'webRequestAuthProvider']
    : ['webRequest', 'webRequestBlocking'];
}

export async function registerProxyAuthenticationListener(
  family: BrowserFamily,
  permissions: ProxyAuthenticationPermissionApi,
  events: ProxyAuthenticationEvents,
  handler: ProxyAuthenticationHandler,
): Promise<ProxyAuthenticationListenerRegistration> {
  const requiredPermissions = permissionsFor(family);
  const requiredOrigins = PROXY_AUTH_URL_FILTERS;
  const granted = await permissions.contains({
    permissions: requiredPermissions,
    origins: requiredOrigins,
  });
  if (!granted) {
    return {
      status: 'permissions-required',
      requiredPermissions,
      requiredOrigins,
      dispose: () => undefined,
    };
  }

  const filter = { urls: requiredOrigins };
  let authListener: (...arguments_: never[]) => unknown;
  if (family === 'chromium') {
    const chromiumListener = (
      details: ProxyAuthenticationChallenge,
      callback?: (response: ProxyAuthenticationResponse | Record<string, never>) => void,
    ): void => {
      if (!callback) return;
      void handler
        .handle(details)
        .then((response) => callback(response ?? {}))
        .catch(() => callback({}));
    };
    authListener = chromiumListener as (...arguments_: never[]) => unknown;
    events.onAuthRequired.addListener(chromiumListener, filter, ['asyncBlocking']);
  } else {
    const firefoxListener = (
      details: ProxyAuthenticationChallenge,
    ): Promise<ProxyAuthenticationResponse | undefined> => handler.handle(details);
    authListener = firefoxListener as (...arguments_: never[]) => unknown;
    events.onAuthRequired.addListener(firefoxListener, filter, ['blocking']);
  }

  return {
    status: 'registered',
    requiredPermissions,
    requiredOrigins,
    dispose: () => {
      events.onAuthRequired.removeListener(authListener);
      handler.clear();
    },
  };
}
