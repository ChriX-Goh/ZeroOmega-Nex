import { describe, expect, it, vi } from 'vitest';

import { PROXY_OWNERSHIP_MESSAGE_CHANNEL, isProxyOwnershipCommand } from './proxy-ownership-client';

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
});
