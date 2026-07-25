import { describe, expect, it } from 'vitest';
import { foundationGuards, productIdentity } from './index';

describe('runtime contracts', () => {
  it('identifies the product and active milestone', () => {
    expect(productIdentity).toEqual({
      name: 'ZeroOmega Nex',
      milestone: 'Milestone 7',
      architecture: 'compile-first',
    });
  });

  it('enables verified PAC installation without a global request-time routing listener', () => {
    expect(foundationGuards).toEqual({
      proxyPermissionEnabled: true,
      globalRequestListenerEnabled: false,
      productionPolicyEngineEnabled: true,
    });
  });
});
