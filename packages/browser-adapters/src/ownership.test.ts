import { describe, expect, it } from 'vitest';

import type { BrowserProxyCapabilities, BrowserProxyDriver } from './contracts.js';
import { inspectProxyOwnership, proxyOwnershipFromCapabilities } from './ownership.js';

function capabilities(overrides: Partial<BrowserProxyCapabilities> = {}): BrowserProxyCapabilities {
  return {
    family: 'chromium',
    canSetProxy: true,
    controlLevel: 'controllable-by-this-extension',
    supportsInlinePac: true,
    requiresPrivateBrowsingAccess: false,
    privateBrowsingAllowed: true,
    supportsPersistentRegularScope: true,
    notes: [],
    ...overrides,
  };
}

describe('proxy ownership inspection', () => {
  it('maps another extension and policy to distinct blocking reasons', () => {
    expect(
      proxyOwnershipFromCapabilities(
        capabilities({
          canSetProxy: false,
          controlLevel: 'controlled-by-other-extension',
        }),
      ),
    ).toMatchObject({ blocked: true, reason: 'app' });
    expect(
      proxyOwnershipFromCapabilities(
        capabilities({ canSetProxy: false, controlLevel: 'not-controllable' }),
      ),
    ).toMatchObject({ blocked: true, reason: 'policy' });
  });

  it('treats missing required browser capability as disabled', () => {
    expect(
      proxyOwnershipFromCapabilities(
        capabilities({
          family: 'firefox',
          canSetProxy: false,
          privateBrowsingAllowed: false,
          requiresPrivateBrowsingAccess: true,
        }),
      ),
    ).toMatchObject({ family: 'firefox', blocked: true, reason: 'disabled' });
  });

  it('allows both controllable and already-controlled states', () => {
    expect(proxyOwnershipFromCapabilities(capabilities()).blocked).toBe(false);
    expect(
      proxyOwnershipFromCapabilities(capabilities({ controlLevel: 'controlled-by-this-extension' }))
        .blocked,
    ).toBe(false);
  });

  it('fails closed when browser ownership inspection throws', async () => {
    const driver = {
      family: 'chromium',
      getCapabilities: async () => {
        throw new Error('unavailable');
      },
    } as unknown as BrowserProxyDriver;
    await expect(inspectProxyOwnership(driver)).resolves.toMatchObject({
      blocked: true,
      reason: 'unknown',
    });
  });
});
