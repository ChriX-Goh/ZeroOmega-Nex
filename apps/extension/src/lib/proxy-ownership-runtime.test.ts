import { describe, expect, it, vi } from 'vitest';

import { PROXY_OWNERSHIP_MESSAGE_CHANNEL, isProxyOwnershipCommand } from './proxy-ownership-client';
import { shouldPreserveExternalProxyState } from './proxy-ownership-runtime';

vi.mock('./browser-proxy-runtime', () => ({
  currentBrowserProxyRuntime: () => ({
    driver: {
      family: 'chromium',
      getCapabilities: async () => ({
        family: 'chromium',
        canSetProxy: false,
        controlLevel: 'controlled-by-other-extension',
        supportsInlinePac: true,
        requiresPrivateBrowsingAccess: false,
        privateBrowsingAllowed: true,
        supportsPersistentRegularScope: true,
        notes: [],
      }),
    },
    repository: {},
    dispose: vi.fn(),
  }),
}));

describe('proxy ownership message contract', () => {
  it('accepts only its own get command', () => {
    expect(
      isProxyOwnershipCommand({
        channel: PROXY_OWNERSHIP_MESSAGE_CHANNEL,
        action: 'get',
      }),
    ).toBe(true);
    expect(
      isProxyOwnershipCommand({ channel: 'zeroomega-nex/profile-workflow/v1', action: 'get' }),
    ).toBe(false);
  });

  it('preserves valid external Fixed and PAC states only while System is active', () => {
    const fixed = {
      family: 'chromium' as const,
      controlLevel: 'controlled-by-this-extension' as const,
      value: {
        mode: 'fixed_servers',
        rules: {
          fallbackProxy: { scheme: 'socks5', host: 'external.invalid', port: 1080 },
        },
      },
    };
    const pac = {
      family: 'chromium' as const,
      controlLevel: 'controlled-by-this-extension' as const,
      value: {
        mode: 'pac_script',
        pacScript: { data: "function FindProxyForURL() { return 'DIRECT'; }" },
      },
    };

    expect(shouldPreserveExternalProxyState('system', fixed)).toBe(true);
    expect(shouldPreserveExternalProxyState('system', pac)).toBe(true);
    expect(shouldPreserveExternalProxyState('direct', fixed)).toBe(false);
  });

  it('does not preserve built-in or invalid proxy states', () => {
    expect(
      shouldPreserveExternalProxyState('system', {
        family: 'chromium',
        controlLevel: 'controlled-by-this-extension',
        value: { mode: 'system' },
      }),
    ).toBe(false);
    expect(
      shouldPreserveExternalProxyState('system', {
        family: 'chromium',
        controlLevel: 'controlled-by-this-extension',
        value: {
          mode: 'fixed_servers',
          rules: { fallbackProxy: { scheme: 'socks5', host: '', port: 1080 } },
        },
      }),
    ).toBe(false);
  });
});
