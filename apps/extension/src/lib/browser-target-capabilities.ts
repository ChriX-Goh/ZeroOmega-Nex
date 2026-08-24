export type PacProfileCapabilityReason =
  | 'proxy-settings'
  | 'proxy-script-registration'
  | 'missing-proxy-settings';

export interface PacProfileCapability {
  readonly supported: boolean;
  readonly reason: PacProfileCapabilityReason;
}

export interface BrowserTargetCapabilities {
  readonly target: 'chromium' | 'firefox';
  readonly pacProfiles: PacProfileCapability;
}

interface BrowserProxySettingsProbe {
  readonly get?: unknown;
  readonly set?: unknown;
}

interface BrowserProxyApiProbe {
  readonly settings?: BrowserProxySettingsProbe;
  readonly register?: unknown;
  readonly registerProxyScript?: unknown;
}

function callable(value: unknown): boolean {
  return typeof value === 'function';
}

export function inspectBrowserTargetCapabilities(
  proxyApi: BrowserProxyApiProbe | undefined,
  target: BrowserTargetCapabilities['target'] = 'chromium',
): BrowserTargetCapabilities {
  if (callable(proxyApi?.register) || callable(proxyApi?.registerProxyScript)) {
    return {
      target,
      pacProfiles: {
        supported: false,
        reason: 'proxy-script-registration',
      },
    };
  }

  if (!callable(proxyApi?.settings?.get) || !callable(proxyApi?.settings?.set)) {
    return {
      target,
      pacProfiles: {
        supported: false,
        reason: 'missing-proxy-settings',
      },
    };
  }

  return {
    target,
    pacProfiles: {
      supported: true,
      reason: 'proxy-settings',
    },
  };
}

export function currentBrowserTargetCapabilities(): BrowserTargetCapabilities {
  const proxyApi =
    typeof browser === 'undefined'
      ? undefined
      : (browser.proxy as unknown as BrowserProxyApiProbe | undefined);
  const manifest =
    typeof browser === 'undefined'
      ? undefined
      : (browser.runtime.getManifest() as { browser_specific_settings?: { gecko?: unknown } });
  const target: BrowserTargetCapabilities['target'] = manifest?.browser_specific_settings?.gecko
    ? 'firefox'
    : 'chromium';
  return inspectBrowserTargetCapabilities(proxyApi, target);
}
