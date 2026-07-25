import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';

import type {
  BrowserProxyCapabilities,
  BrowserProxyDriver,
  PacInstallConfirmation,
  PlatformProxyState,
} from './contracts.js';
import { jsonValue, mapProxyControlLevel, recordValue, stringProperty } from './platform-utils.js';

export interface FirefoxProxySettingResult {
  readonly value: unknown;
  readonly levelOfControl: string;
}

export interface FirefoxProxySettingsApi {
  get(details: Record<string, never>): Promise<FirefoxProxySettingResult>;
  set(details: { readonly value: unknown }): Promise<void>;
  clear(details: Record<string, never>): Promise<void>;
}

export interface FirefoxExtensionApi {
  isAllowedIncognitoAccess(): Promise<boolean>;
}

export interface FirefoxProxyErrorEvent {
  addListener(listener: (error: unknown) => void): void;
  removeListener(listener: (error: unknown) => void): void;
}

export interface FirefoxProxyDriver extends BrowserProxyDriver {
  getLastPacError(): string | undefined;
  dispose(): void;
}

function supportsSnapshot(snapshot: PacRuntimeSnapshot): boolean {
  return snapshot.target === 'cross-browser' || snapshot.target === 'firefox';
}

export function firefoxPacDataUrl(script: string): string {
  return `data:application/x-ns-proxy-autoconfig;charset=utf-8,${encodeURIComponent(script)}`;
}

function pacConfig(snapshot: PacRuntimeSnapshot): Record<string, unknown> {
  return {
    proxyType: 'autoConfig',
    autoConfigUrl: firefoxPacDataUrl(snapshot.script),
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error !== null && typeof error === 'object' && 'message' in error) {
    const message = (error as { readonly message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Firefox reported an unknown PAC error';
}

export function createFirefoxProxyDriver(
  settings: FirefoxProxySettingsApi,
  extension: FirefoxExtensionApi,
  onError?: FirefoxProxyErrorEvent,
): FirefoxProxyDriver {
  let lastPacError: string | undefined;
  const errorListener = (error: unknown): void => {
    lastPacError = errorMessage(error);
  };
  onError?.addListener(errorListener);

  const read = async (): Promise<FirefoxProxySettingResult> => settings.get({});

  return {
    family: 'firefox',

    async getCapabilities(): Promise<BrowserProxyCapabilities> {
      const [current, privateBrowsingAllowed] = await Promise.all([
        read(),
        extension.isAllowedIncognitoAccess(),
      ]);
      const controlLevel = mapProxyControlLevel(current.levelOfControl);
      const canSetProxy =
        privateBrowsingAllowed &&
        (controlLevel === 'controllable-by-this-extension' ||
          controlLevel === 'controlled-by-this-extension');
      return {
        family: 'firefox',
        canSetProxy,
        controlLevel,
        supportsInlinePac: false,
        requiresPrivateBrowsingAccess: true,
        privateBrowsingAllowed,
        supportsPersistentRegularScope: true,
        notes: [
          'Firefox installs generated PAC through an autoConfig data URL.',
          'Private browsing access is required because proxy settings affect all windows.',
          'PAC runtime errors are retained and make installation confirmation fail.',
        ],
      };
    },

    async readState(): Promise<PlatformProxyState> {
      const current = await read();
      return {
        family: 'firefox',
        controlLevel: mapProxyControlLevel(current.levelOfControl),
        value: jsonValue(current.value),
      };
    },

    async installPac(snapshot: PacRuntimeSnapshot): Promise<void> {
      if (!supportsSnapshot(snapshot)) {
        throw new TypeError(`PAC snapshot target ${snapshot.target} cannot be installed on Firefox`);
      }
      if (!(await extension.isAllowedIncognitoAccess())) {
        throw new Error('Firefox private browsing access is required before installing PAC');
      }
      lastPacError = undefined;
      await settings.set({ value: pacConfig(snapshot) });
    },

    async confirmPac(snapshot: PacRuntimeSnapshot): Promise<PacInstallConfirmation> {
      const current = await read();
      const controlLevel = mapProxyControlLevel(current.levelOfControl);
      if (controlLevel !== 'controlled-by-this-extension') {
        return {
          confirmed: false,
          controlLevel,
          reason: 'Firefox does not report this extension as the active proxy controller',
        };
      }
      const value = recordValue(jsonValue(current.value));
      const expectedUrl = firefoxPacDataUrl(snapshot.script);
      if (
        stringProperty(value, 'proxyType') !== 'autoConfig' ||
        stringProperty(value, 'autoConfigUrl') !== expectedUrl
      ) {
        return {
          confirmed: false,
          controlLevel,
          reason: 'Firefox effective autoConfig URL does not match the verified snapshot',
        };
      }
      if (lastPacError !== undefined) {
        return {
          confirmed: false,
          controlLevel,
          reason: `Firefox PAC runtime error: ${lastPacError}`,
        };
      }
      return {
        confirmed: true,
        controlLevel,
        installedScriptSha256: snapshot.scriptSha256,
      };
    },

    async setDirect(): Promise<void> {
      await settings.set({ value: { proxyType: 'none' } });
    },

    async setSystem(): Promise<void> {
      await settings.set({ value: { proxyType: 'system' } });
    },

    async restoreState(state: PlatformProxyState): Promise<void> {
      if (state.family !== 'firefox') throw new TypeError('cannot restore non-Firefox proxy state');
      if (state.controlLevel !== 'controlled-by-this-extension') {
        await settings.clear({});
        return;
      }
      await settings.set({ value: state.value });
    },

    async clearControl(): Promise<void> {
      await settings.clear({});
    },

    getLastPacError(): string | undefined {
      return lastPacError;
    },

    dispose(): void {
      onError?.removeListener(errorListener);
    },
  };
}
