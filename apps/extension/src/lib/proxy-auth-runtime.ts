import {
  BrowserStorageProxyAuthenticationRepository,
  ProxyAuthenticationHandler,
  registerProxyAuthenticationListener,
  type BrowserFamily,
  type BrowserStorageArea,
  type ProxyAuthenticationEvents,
  type ProxyAuthenticationListenerRegistration,
  type ProxyAuthenticationPermissionApi,
} from '@zeroomega-nex/browser-adapters';

interface RuntimeAuthenticationApi {
  readonly runtime: {
    readonly getBrowserInfo?: () => Promise<unknown>;
  };
  readonly permissions: ProxyAuthenticationPermissionApi;
  readonly webRequest?: ProxyAuthenticationEvents;
  readonly storage: {
    readonly local: BrowserStorageArea;
  };
}

export type ProxyAuthenticationRuntimeStatus =
  | 'not-configured'
  | 'permissions-required'
  | 'api-unavailable'
  | 'registered';

export interface ProxyAuthenticationRuntime {
  readonly status: ProxyAuthenticationRuntimeStatus;
  readonly registration?: ProxyAuthenticationListenerRegistration;
  dispose(): void;
}

function browserFamily(api: RuntimeAuthenticationApi): BrowserFamily {
  return typeof api.runtime.getBrowserInfo === 'function' ? 'firefox' : 'chromium';
}

export async function registerStoredProxyAuthentication(
  api: RuntimeAuthenticationApi,
): Promise<ProxyAuthenticationRuntime> {
  const repository = new BrowserStorageProxyAuthenticationRepository(api.storage.local);
  const bindings = await repository.getBindings();
  if (bindings.length === 0) {
    return { status: 'not-configured', dispose: () => undefined };
  }
  if (!api.webRequest) {
    return { status: 'api-unavailable', dispose: () => undefined };
  }

  const handler = new ProxyAuthenticationHandler(repository, repository);
  const registration = await registerProxyAuthenticationListener(
    browserFamily(api),
    api.permissions,
    api.webRequest,
    handler,
  );
  return {
    status: registration.status,
    registration,
    dispose: () => registration.dispose(),
  };
}

export function currentProxyAuthenticationApi(): RuntimeAuthenticationApi {
  return browser as unknown as RuntimeAuthenticationApi;
}
