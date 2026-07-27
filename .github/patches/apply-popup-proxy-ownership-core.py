from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


Path('packages/browser-adapters/src/ownership.ts').write_text(r'''import type {
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
''')

Path('packages/browser-adapters/src/ownership.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';

import type { BrowserProxyCapabilities, BrowserProxyDriver } from './contracts.js';
import { inspectProxyOwnership, proxyOwnershipFromCapabilities } from './ownership.js';

function capabilities(
  overrides: Partial<BrowserProxyCapabilities> = {},
): BrowserProxyCapabilities {
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
      proxyOwnershipFromCapabilities(
        capabilities({ controlLevel: 'controlled-by-this-extension' }),
      ).blocked,
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
''')

replace_once(
    'packages/browser-adapters/src/index.ts',
    """export { MemorySnapshotActivationRepository } from './memory-repository.js';
""",
    """export { MemorySnapshotActivationRepository } from './memory-repository.js';
export {
  inspectProxyOwnership,
  proxyOwnershipFromCapabilities,
  type ProxyOwnershipBlockReason,
  type ProxyOwnershipView,
} from './ownership.js';
""",
)
