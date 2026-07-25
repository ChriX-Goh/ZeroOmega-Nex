import {
  BrowserStorageSnapshotActivationRepository,
  createChromiumProxyDriver,
  createFirefoxProxyDriver,
  type BrowserProxyDriver,
  type BrowserStorageArea,
  type ChromiumProxySettingsApi,
  type FirefoxExtensionApi,
  type FirefoxProxyDriver,
  type FirefoxProxyErrorEvent,
  type FirefoxProxySettingsApi,
  type SnapshotActivationRepository,
} from '@zeroomega-nex/browser-adapters';

interface RuntimeBrowserApi {
  readonly runtime: {
    readonly getBrowserInfo?: () => Promise<unknown>;
  };
  readonly proxy: {
    readonly settings: unknown;
    readonly onError?: FirefoxProxyErrorEvent;
  };
  readonly extension?: FirefoxExtensionApi;
  readonly storage: {
    readonly local: BrowserStorageArea;
  };
}

export interface BrowserProxyRuntime {
  readonly driver: BrowserProxyDriver;
  readonly repository: SnapshotActivationRepository;
  dispose(): void;
}

export function createBrowserProxyRuntime(api: RuntimeBrowserApi): BrowserProxyRuntime {
  const repository = new BrowserStorageSnapshotActivationRepository(api.storage.local);
  const firefox = typeof api.runtime.getBrowserInfo === 'function';
  if (firefox) {
    if (!api.extension) throw new Error('Firefox extension API is unavailable');
    const driver: FirefoxProxyDriver = createFirefoxProxyDriver(
      api.proxy.settings as FirefoxProxySettingsApi,
      api.extension,
      api.proxy.onError,
    );
    return {
      driver,
      repository,
      dispose: () => driver.dispose(),
    };
  }

  return {
    driver: createChromiumProxyDriver(api.proxy.settings as ChromiumProxySettingsApi),
    repository,
    dispose: () => undefined,
  };
}

export function currentBrowserProxyRuntime(): BrowserProxyRuntime {
  return createBrowserProxyRuntime(browser as unknown as RuntimeBrowserApi);
}
