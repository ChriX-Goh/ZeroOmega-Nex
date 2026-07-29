import { describe, expect, it } from 'vitest';

import { inspectBrowserTargetCapabilities } from './browser-target-capabilities';

describe('browser target capabilities', () => {
  const proxySettings = {
    get: () => undefined,
    set: () => undefined,
  };

  it('records the independently selected Chromium or Firefox target', () => {
    expect(inspectBrowserTargetCapabilities({ settings: proxySettings }, 'chromium').target).toBe(
      'chromium',
    );
    expect(inspectBrowserTargetCapabilities({ settings: proxySettings }, 'firefox').target).toBe(
      'firefox',
    );
  });

  it('supports PAC profiles through writable proxy.settings', () => {
    expect(inspectBrowserTargetCapabilities({ settings: proxySettings }).pacProfiles).toEqual({
      supported: true,
      reason: 'proxy-settings',
    });
  });

  it.each(['register', 'registerProxyScript'] as const)(
    'preserves the original unsupported PAC branch for proxy.%s targets',
    (method) => {
      expect(
        inspectBrowserTargetCapabilities({
          settings: proxySettings,
          [method]: () => undefined,
        }).pacProfiles,
      ).toEqual({
        supported: false,
        reason: 'proxy-script-registration',
      });
    },
  );

  it('fails closed when the target lacks writable proxy.settings', () => {
    expect(inspectBrowserTargetCapabilities(undefined).pacProfiles).toEqual({
      supported: false,
      reason: 'missing-proxy-settings',
    });
    expect(
      inspectBrowserTargetCapabilities({ settings: { get: () => undefined } }).pacProfiles,
    ).toEqual({
      supported: false,
      reason: 'missing-proxy-settings',
    });
  });
});
