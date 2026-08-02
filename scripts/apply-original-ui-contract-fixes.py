import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


ownership_path = 'apps/extension/src/lib/proxy-ownership-runtime.ts'
background_path = 'apps/extension/src/entrypoints/background.ts'
test_path = 'apps/extension/src/lib/proxy-ownership-runtime.test.ts'

replace_once(
    ownership_path,
    """  parseExternalProfileCandidate,
  type BrowserStorageArea,
} from '@zeroomega-nex/browser-adapters';""",
    """  parseExternalProfileCandidate,
  type BrowserStorageArea,
  type BuiltInProxyMode,
  type PlatformProxyState,
} from '@zeroomega-nex/browser-adapters';""",
)
replace_once(
    ownership_path,
    """export interface RegisteredProxyOwnershipRuntime {
  dispose(): void;
}

async function inspectCurrentOwnership""",
    """export interface RegisteredProxyOwnershipRuntime {
  dispose(): void;
}

export function shouldPreserveExternalProxyState(
  activeBuiltInMode: BuiltInProxyMode | undefined,
  platformState: PlatformProxyState,
): boolean {
  return (
    activeBuiltInMode === 'system' && parseExternalProfileCandidate(platformState) !== undefined
  );
}

async function inspectCurrentOwnership""",
)

replace_once(
    background_path,
    """  currentProxyOwnershipRuntimeApi,
  registerProxyOwnershipRuntime,
  type RegisteredProxyOwnershipRuntime,
} from '../lib/proxy-ownership-runtime';""",
    """  currentProxyOwnershipRuntimeApi,
  registerProxyOwnershipRuntime,
  shouldPreserveExternalProxyState,
  type RegisteredProxyOwnershipRuntime,
} from '../lib/proxy-ownership-runtime';""",
)
replace_once(
    background_path,
    """  const restored = await restoreActiveSnapshot(runtime.repository, runtime.driver);""",
    """  const activationState = await runtime.repository.getState();
  if (activationState.activeBuiltInMode === 'system') {
    const platformState = await runtime.driver.readState();
    if (shouldPreserveExternalProxyState(activationState.activeBuiltInMode, platformState)) {
      console.info(`[${productIdentity.name}] external proxy state preserved in System mode.`);
      return;
    }
  }

  const restored = await restoreActiveSnapshot(runtime.repository, runtime.driver);""",
)

replace_once(
    test_path,
    """import { PROXY_OWNERSHIP_MESSAGE_CHANNEL, isProxyOwnershipCommand } from './proxy-ownership-client';""",
    """import { PROXY_OWNERSHIP_MESSAGE_CHANNEL, isProxyOwnershipCommand } from './proxy-ownership-client';
import { shouldPreserveExternalProxyState } from './proxy-ownership-runtime';""",
)
replace_once(
    test_path,
    """  it('accepts only its own get command', () => {
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
});""",
    """  it('accepts only its own get command', () => {
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
});""",
)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        ownership_path,
        background_path,
        test_path,
    ],
    check=True,
)
