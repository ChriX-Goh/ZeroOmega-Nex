import {
  BrowserStorageProxyAuthenticationRepository,
  ProxyAuthenticationHandler,
  registerProxyAuthenticationListener,
  type BrowserFamily,
  type BrowserStorageArea,
  type ProxyAuthenticationBinding,
  type ProxyAuthenticationEvents,
  type ProxyAuthenticationListenerRegistration,
  type ProxyAuthenticationPermissionApi,
} from '@zeroomega-nex/browser-adapters';

export interface RuntimeAuthenticationApi {
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

export interface ProxyAuthenticationPreparation {
  readonly status: 'prepared';
  readonly runtimeStatus: 'not-configured' | 'registered';
  commit(): void;
  rollback(): Promise<void>;
}

export type ProxyAuthenticationPreparationResult =
  | {
      readonly ok: true;
      readonly preparation: ProxyAuthenticationPreparation;
    }
  | {
      readonly ok: false;
      readonly status: 'busy' | 'permissions-required' | 'api-unavailable' | 'storage-failure';
      readonly message: string;
    };

function browserFamily(api: RuntimeAuthenticationApi): BrowserFamily {
  return typeof api.runtime.getBrowserInfo === 'function' ? 'firefox' : 'chromium';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

export class ProxyAuthenticationRuntimeManager {
  readonly #api: RuntimeAuthenticationApi;
  readonly #repository: BrowserStorageProxyAuthenticationRepository;
  #runtime: ProxyAuthenticationRuntime | undefined;
  #activePreparation = false;
  #disposed = false;

  constructor(api: RuntimeAuthenticationApi) {
    this.#api = api;
    this.#repository = new BrowserStorageProxyAuthenticationRepository(api.storage.local);
  }

  get status(): ProxyAuthenticationRuntimeStatus | undefined {
    return this.#runtime?.status;
  }

  async initialize(): Promise<ProxyAuthenticationRuntimeStatus> {
    this.#assertUsable();
    if (this.#activePreparation) {
      throw new Error('proxy authentication preparation is already in progress');
    }
    this.#runtime?.dispose();
    this.#runtime = await registerStoredProxyAuthentication(this.#api);
    return this.#runtime.status;
  }

  async prepare(
    bindings: readonly ProxyAuthenticationBinding[],
  ): Promise<ProxyAuthenticationPreparationResult> {
    this.#assertUsable();
    if (this.#activePreparation) {
      return {
        ok: false,
        status: 'busy',
        message: 'proxy authentication preparation is already in progress',
      };
    }
    this.#activePreparation = true;

    let previousBindings: readonly ProxyAuthenticationBinding[];
    try {
      previousBindings = await this.#repository.getBindings();
      await this.#repository.putBindings(bindings);
    } catch (error) {
      this.#activePreparation = false;
      return { ok: false, status: 'storage-failure', message: errorMessage(error) };
    }

    const previousRuntime = this.#runtime;
    previousRuntime?.dispose();
    let nextRuntime: ProxyAuthenticationRuntime;
    try {
      nextRuntime = await registerStoredProxyAuthentication(this.#api);
    } catch (error) {
      const restored = await this.#restore(previousBindings);
      this.#activePreparation = false;
      return {
        ok: false,
        status: 'storage-failure',
        message: restored
          ? errorMessage(error)
          : `${errorMessage(error)}; previous authentication state could not be restored`,
      };
    }

    if (
      bindings.length > 0 &&
      (nextRuntime.status === 'permissions-required' || nextRuntime.status === 'api-unavailable')
    ) {
      nextRuntime.dispose();
      const failedStatus = nextRuntime.status;
      const restored = await this.#restore(previousBindings);
      this.#activePreparation = false;
      return {
        ok: false,
        status: failedStatus,
        message: restored
          ? failedStatus === 'permissions-required'
            ? 'proxy authentication permissions are required before activation'
            : 'proxy authentication API is unavailable'
          : 'proxy authentication preparation failed and previous state could not be restored',
      };
    }

    this.#runtime = nextRuntime;
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      this.#activePreparation = false;
    };
    return {
      ok: true,
      preparation: {
        status: 'prepared',
        runtimeStatus: nextRuntime.status as 'not-configured' | 'registered',
        commit: finish,
        rollback: async () => {
          if (settled) return;
          nextRuntime.dispose();
          const restored = await this.#restore(previousBindings);
          finish();
          if (!restored) {
            throw new Error('previous proxy authentication state could not be restored');
          }
        },
      },
    };
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#runtime?.dispose();
    this.#runtime = undefined;
  }

  async #restore(bindings: readonly ProxyAuthenticationBinding[]): Promise<boolean> {
    try {
      await this.#repository.putBindings(bindings);
      this.#runtime?.dispose();
      this.#runtime = await registerStoredProxyAuthentication(this.#api);
      if (bindings.length === 0) return this.#runtime.status === 'not-configured';
      return this.#runtime.status === 'registered';
    } catch {
      return false;
    }
  }

  #assertUsable(): void {
    if (this.#disposed) throw new Error('proxy authentication runtime manager is disposed');
  }
}

export function currentProxyAuthenticationApi(): RuntimeAuthenticationApi {
  return browser as unknown as RuntimeAuthenticationApi;
}
