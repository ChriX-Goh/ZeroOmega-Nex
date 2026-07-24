import { describe, expect, it } from 'vitest';
import { foundationGuards, productIdentity } from './index';

describe('foundation contracts', () => {
  it('identifies the product and active milestone', () => {
    expect(productIdentity).toEqual({
      name: 'ZeroOmega Nex',
      milestone: 'Milestone 1',
      architecture: 'compile-first',
    });
  });

  it('keeps request-time proxy behavior disabled in the tooling milestone', () => {
    expect(foundationGuards).toEqual({
      proxyPermissionEnabled: false,
      globalRequestListenerEnabled: false,
      productionPolicyEngineEnabled: false,
    });
  });
});
