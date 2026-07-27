from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """import { productIdentity } from '@zeroomega-nex/core-contracts';

import { currentBrowserProxyRuntime } from '../lib/browser-proxy-runtime';
""",
    """import { productIdentity } from '@zeroomega-nex/core-contracts';
import { BrowserStorageProfileWorkflowRepository } from '@zeroomega-nex/profile-workflow';

import { currentBrowserProxyRuntime } from '../lib/browser-proxy-runtime';
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """import {
  currentProxyAuthenticationApi,
  ProxyAuthenticationRuntimeManager,
} from '../lib/proxy-auth-runtime';
""",
    """import {
  createPopupTemporaryRuleCoordinator,
  currentPopupTemporaryRuleRuntimeApi,
  registerPopupTemporaryRuleRuntime,
  type PopupTemporaryRuleCoordinator,
  type RegisteredPopupTemporaryRuleRuntime,
} from '../lib/popup-temporary-rule-runtime';
import {
  currentProxyAuthenticationApi,
  ProxyAuthenticationRuntimeManager,
} from '../lib/proxy-auth-runtime';
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """let authenticationManager: ProxyAuthenticationRuntimeManager | undefined;
let profileWorkflowRuntime: RegisteredProfileWorkflowRuntime | undefined;

async function restoreProxyRuntime(manager: ProxyAuthenticationRuntimeManager): Promise<void> {
""",
    """let authenticationManager: ProxyAuthenticationRuntimeManager | undefined;
let profileWorkflowRuntime: RegisteredProfileWorkflowRuntime | undefined;
let popupTemporaryRuleRuntime: RegisteredPopupTemporaryRuleRuntime | undefined;

async function restoreProxyRuntime(
  manager: ProxyAuthenticationRuntimeManager,
  temporaryRules: PopupTemporaryRuleCoordinator | undefined,
): Promise<void> {
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """  const runtime = currentBrowserProxyRuntime();
  const recovered = await recoverPendingActivation(
    runtime.repository,
    runtime.driver,
    new Date().toISOString(),
  );
""",
    """  const runtime = currentBrowserProxyRuntime();
  const workflow = await new BrowserStorageProfileWorkflowRepository(
    browser.storage.local,
  ).read();
  const repaired =
    workflow && temporaryRules
      ? await temporaryRules.repairMissingSessionPending(workflow.applied, runtime.repository)
      : false;
  const recovered = repaired
    ? { status: 'nothing-pending' as const }
    : await recoverPendingActivation(
        runtime.repository,
        runtime.driver,
        new Date().toISOString(),
      );
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """  const restored = await restoreActiveSnapshot(runtime.repository, runtime.driver);
""",
    """  if (
    workflow &&
    temporaryRules &&
    (repaired || (await temporaryRules.reconcileStartup(workflow.applied, runtime.repository)))
  ) {
    console.info(`[${productIdentity.name}] temporary-rule proxy runtime reconciled.`);
    return;
  }

  const restored = await restoreActiveSnapshot(runtime.repository, runtime.driver);
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """  profileWorkflowRuntime?.dispose();
  authenticationManager?.dispose();

  authenticationManager = new ProxyAuthenticationRuntimeManager(currentProxyAuthenticationApi());
  const activationDriver = new BrowserProfileWorkflowActivationDriver({
    authentication: authenticationManager,
  });
  profileWorkflowRuntime = registerProfileWorkflowRuntime(currentProfileWorkflowRuntimeApi(), {
    activationDriver,
    authentication: authenticationManager,
  });

  void restoreProxyRuntime(authenticationManager).catch((error: unknown) => {
""",
    """  popupTemporaryRuleRuntime?.dispose();
  profileWorkflowRuntime?.dispose();
  authenticationManager?.dispose();

  authenticationManager = new ProxyAuthenticationRuntimeManager(currentProxyAuthenticationApi());
  const baseActivationDriver = new BrowserProfileWorkflowActivationDriver({
    authentication: authenticationManager,
  });
  const temporaryRuleApi = currentPopupTemporaryRuleRuntimeApi();
  const temporaryRuleCoordinator = createPopupTemporaryRuleCoordinator(
    temporaryRuleApi,
    baseActivationDriver,
  );
  const activationDriver = temporaryRuleCoordinator ?? baseActivationDriver;
  profileWorkflowRuntime = registerProfileWorkflowRuntime(currentProfileWorkflowRuntimeApi(), {
    activationDriver,
    authentication: authenticationManager,
  });
  popupTemporaryRuleRuntime = temporaryRuleCoordinator
    ? registerPopupTemporaryRuleRuntime(temporaryRuleApi, temporaryRuleCoordinator)
    : undefined;

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch((error: unknown) => {
""",
)

patch = Path('.github/patches/apply-popup-temporary-rules-runtime.py')
text = patch.read_text()
text = text.replace(
    "raise SystemExit(f'{path}: expected one match, found {count}')",
    "raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')",
)
old_import = """import {
  isPopupTemporarySnapshotId,
  popupTemporarySnapshotId,
"""
new_import = """import {
  POPUP_TEMPORARY_PROFILE_ID_PREFIX,
  popupTemporarySnapshotId,
"""
if text.count(old_import) != 1:
    raise SystemExit(f'activation import patch match count: {text.count(old_import)}')
text = text.replace(old_import, new_import)
old = """        const temporarySnapshotId =
          route.kind === 'profile' && route.profileId.startsWith('__zeroomega_nex_popup_temporary__/')
            ? popupTemporarySnapshotId(route.profileId, this.#temporarySnapshotNonce())
            : undefined;
"""
new = """        const temporarySnapshotId =
          route.kind === 'profile' && route.profileId.startsWith(POPUP_TEMPORARY_PROFILE_ID_PREFIX)
            ? popupTemporarySnapshotId(route.profileId, this.#temporarySnapshotNonce())
            : undefined;
"""
if text.count(old) != 1:
    raise SystemExit(f'activation temporary snapshot patch match count: {text.count(old)}')
patch.write_text(text.replace(old, new))
