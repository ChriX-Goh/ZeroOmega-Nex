export type PacProfileCapabilityReason =
  | 'proxy-settings'
  | 'proxy-script-registration'
  | 'missing-proxy-settings';

export interface PacProfileCapability {
  readonly supported: boolean;
  readonly reason: PacProfileCapabilityReason;
}

export interface BrowserTargetCapabilities {
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
): BrowserTargetCapabilities {
  if (callable(proxyApi?.register) || callable(proxyApi?.registerProxyScript)) {
    return {
      pacProfiles: {
        supported: false,
        reason: 'proxy-script-registration',
      },
    };
  }

  if (!callable(proxyApi?.settings?.get) || !callable(proxyApi?.settings?.set)) {
    return {
      pacProfiles: {
        supported: false,
        reason: 'missing-proxy-settings',
      },
    };
  }

  return {
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
  return inspectBrowserTargetCapabilities(proxyApi);
}
