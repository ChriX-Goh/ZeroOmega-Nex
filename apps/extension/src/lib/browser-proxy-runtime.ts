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
  type SnapshotHistoryRepository,
} from '@zeroomega-nex/browser-adapters';

import { SessionSnapshotActivationRepository } from './session-snapshot-repository';

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
    readonly session?: BrowserStorageArea;
  };
}

export interface BrowserProxyRuntime {
  readonly driver: BrowserProxyDriver;
  readonly repository: SnapshotActivationRepository & SnapshotHistoryRepository;
  dispose(): void;
}

export function createBrowserProxyRuntime(api: RuntimeBrowserApi): BrowserProxyRuntime {
  const persistentRepository = new BrowserStorageSnapshotActivationRepository(api.storage.local);
  const repository = api.storage.session
    ? new SessionSnapshotActivationRepository(persistentRepository, api.storage.session)
    : persistentRepository;
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
