import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';

import type {
  BrowserProxyCapabilities,
  BrowserProxyDriver,
  PacInstallConfirmation,
  PlatformProxyState,
} from './contracts.js';
import { jsonValue, mapProxyControlLevel, recordValue, stringProperty } from './platform-utils.js';

export interface ChromiumProxySettingResult {
  readonly value: unknown;
  readonly levelOfControl: string;
}

export interface ChromiumProxySettingsApi {
  get(details: { readonly incognito: false }): Promise<ChromiumProxySettingResult>;
  set(details: { readonly value: unknown; readonly scope: 'regular' }): Promise<void>;
  clear(details: { readonly scope: 'regular' }): Promise<void>;
}

function supportsSnapshot(snapshot: PacRuntimeSnapshot): boolean {
  return snapshot.target === 'cross-browser' || snapshot.target === 'chromium';
}

function pacConfig(snapshot: PacRuntimeSnapshot): Record<string, unknown> {
  return {
    mode: 'pac_script',
    pacScript: {
      data: snapshot.script,
      mandatory: true,
    },
  };
}

function installedPacScript(value: unknown): string | undefined {
  const config = recordValue(jsonValue(value));
  if (stringProperty(config, 'mode') !== 'pac_script') return undefined;
  const pacScript = recordValue(config?.pacScript ?? null);
  return stringProperty(pacScript, 'data');
}

export function createChromiumProxyDriver(
  settings: ChromiumProxySettingsApi,
): BrowserProxyDriver {
  const read = async (): Promise<ChromiumProxySettingResult> => settings.get({ incognito: false });

  return {
    family: 'chromium',

    async getCapabilities(): Promise<BrowserProxyCapabilities> {
      const current = await read();
      const controlLevel = mapProxyControlLevel(current.levelOfControl);
      const canSetProxy =
        controlLevel === 'controllable-by-this-extension' ||
        controlLevel === 'controlled-by-this-extension';
      return {
        family: 'chromium',
        canSetProxy,
        controlLevel,
        supportsInlinePac: true,
        requiresPrivateBrowsingAccess: false,
        privateBrowsingAllowed: true,
        supportsPersistentRegularScope: true,
        notes: [
          'Chromium installs an inline mandatory PAC script in regular scope.',
          'Control conflicts are derived from levelOfControl before installation.',
        ],
      };
    },

    async readState(): Promise<PlatformProxyState> {
      const current = await read();
      return {
        family: 'chromium',
        controlLevel: mapProxyControlLevel(current.levelOfControl),
        value: jsonValue(current.value),
      };
    },

    async installPac(snapshot: PacRuntimeSnapshot): Promise<void> {
      if (!supportsSnapshot(snapshot)) {
        throw new TypeError(`PAC snapshot target ${snapshot.target} cannot be installed on Chromium`);
      }
      await settings.set({ value: pacConfig(snapshot), scope: 'regular' });
    },

    async confirmPac(snapshot: PacRuntimeSnapshot): Promise<PacInstallConfirmation> {
      const current = await read();
      const controlLevel = mapProxyControlLevel(current.levelOfControl);
      const script = installedPacScript(current.value);
      if (controlLevel !== 'controlled-by-this-extension') {
        return {
          confirmed: false,
          controlLevel,
          reason: 'Chromium does not report this extension as the active proxy controller',
        };
      }
      if (script !== snapshot.script) {
        return {
          confirmed: false,
          controlLevel,
          reason: 'Chromium effective PAC script does not match the verified snapshot',
        };
      }
      return {
        confirmed: true,
        controlLevel,
        installedScriptSha256: snapshot.scriptSha256,
      };
    },

    async setDirect(): Promise<void> {
      await settings.set({ value: { mode: 'direct' }, scope: 'regular' });
    },

    async setSystem(): Promise<void> {
      await settings.set({ value: { mode: 'system' }, scope: 'regular' });
    },

    async restoreState(state: PlatformProxyState): Promise<void> {
      if (state.family !== 'chromium') throw new TypeError('cannot restore non-Chromium proxy state');
      if (state.controlLevel !== 'controlled-by-this-extension') {
        await settings.clear({ scope: 'regular' });
        return;
      }
      await settings.set({ value: state.value, scope: 'regular' });
    },

    async clearControl(): Promise<void> {
      await settings.clear({ scope: 'regular' });
    },
  };
}
