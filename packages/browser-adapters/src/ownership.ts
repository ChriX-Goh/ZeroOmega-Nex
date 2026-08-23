import type {
  BrowserFamily,
  BrowserProxyCapabilities,
  BrowserProxyDriver,
  ProxyControlLevel,
} from './contracts.js';

export type ProxyOwnershipBlockReason = 'app' | 'policy' | 'disabled' | 'unknown';

export interface ProxyOwnershipView {
  readonly family: BrowserFamily;
  readonly controlLevel: ProxyControlLevel;
  readonly blocked: boolean;
  readonly reason?: ProxyOwnershipBlockReason;
}

export function proxyOwnershipFromCapabilities(
  capabilities: BrowserProxyCapabilities,
): ProxyOwnershipView {
  if (capabilities.controlLevel === 'controlled-by-other-extension') {
    return {
      family: capabilities.family,
      controlLevel: capabilities.controlLevel,
      blocked: true,
      reason: 'app',
    };
  }
  if (capabilities.controlLevel === 'not-controllable') {
    return {
      family: capabilities.family,
      controlLevel: capabilities.controlLevel,
      blocked: true,
      reason: 'policy',
    };
  }
  if (!capabilities.canSetProxy) {
    return {
      family: capabilities.family,
      controlLevel: capabilities.controlLevel,
      blocked: true,
      reason: 'disabled',
    };
  }
  return {
    family: capabilities.family,
    controlLevel: capabilities.controlLevel,
    blocked: false,
  };
}

export async function inspectProxyOwnership(
  driver: BrowserProxyDriver,
): Promise<ProxyOwnershipView> {
  try {
    return proxyOwnershipFromCapabilities(await driver.getCapabilities());
  } catch {
    return {
      family: driver.family,
      controlLevel: 'not-controllable',
      blocked: true,
      reason: 'unknown',
    };
  }
}
