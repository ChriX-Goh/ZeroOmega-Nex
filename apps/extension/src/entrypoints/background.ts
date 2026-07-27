import { recoverPendingActivation, restoreActiveSnapshot } from '@zeroomega-nex/browser-adapters';
import { productIdentity } from '@zeroomega-nex/core-contracts';
import { BrowserStorageProfileWorkflowRepository } from '@zeroomega-nex/profile-workflow';

import { currentBrowserProxyRuntime } from '../lib/browser-proxy-runtime';
import {
  currentInspectRuntimeApi,
  registerInspectRuntime,
  type RegisteredInspectRuntime,
} from '../lib/inspect-runtime';
import { BrowserProfileWorkflowActivationDriver } from '../lib/profile-workflow-activation';
import {
  currentProfileWorkflowRuntimeApi,
  registerProfileWorkflowRuntime,
  type RegisteredProfileWorkflowRuntime,
} from '../lib/profile-workflow-runtime';
import {
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
import {
  currentProxyOwnershipRuntimeApi,
  registerProxyOwnershipRuntime,
  type RegisteredProxyOwnershipRuntime,
} from '../lib/proxy-ownership-runtime';

let authenticationManager: ProxyAuthenticationRuntimeManager | undefined;
let inspectRuntime: RegisteredInspectRuntime | undefined;
let profileWorkflowRuntime: RegisteredProfileWorkflowRuntime | undefined;
let popupTemporaryRuleRuntime: RegisteredPopupTemporaryRuleRuntime | undefined;
let proxyOwnershipRuntime: RegisteredProxyOwnershipRuntime | undefined;

async function restoreProxyRuntime(
  manager: ProxyAuthenticationRuntimeManager,
  temporaryRules: PopupTemporaryRuleCoordinator | undefined,
): Promise<void> {
  const authenticationStatus = await manager.initialize();
  console.info(`[${productIdentity.name}] proxy authentication state: ${authenticationStatus}.`);

  const runtime = currentBrowserProxyRuntime();
  const workflow = await new BrowserStorageProfileWorkflowRepository(browser.storage.local).read();
  const repaired =
    workflow && temporaryRules
      ? await temporaryRules.repairMissingSessionPending(workflow.applied, runtime.repository)
      : false;
  const recovered = repaired
    ? { status: 'nothing-pending' as const }
    : await recoverPendingActivation(runtime.repository, runtime.driver, new Date().toISOString());
  if (recovered.status === 'failed') {
    console.error(`[${productIdentity.name}] proxy activation recovery failed:`, recovered.message);
    return;
  }

  if (
    workflow &&
    temporaryRules &&
    (repaired || (await temporaryRules.reconcileStartup(workflow.applied, runtime.repository)))
  ) {
    console.info(`[${productIdentity.name}] temporary-rule proxy runtime reconciled.`);
    return;
  }

  const restored = await restoreActiveSnapshot(runtime.repository, runtime.driver);
  if (restored.status === 'failed') {
    console.error(
      `[${productIdentity.name}] active proxy snapshot restore failed:`,
      restored.message,
    );
    return;
  }
  console.info(`[${productIdentity.name}] proxy runtime state: ${restored.status}.`);
}

export default defineBackground(() => {
  console.info(
    `[${productIdentity.name}] background initialized for ${productIdentity.milestone}.`,
  );

  inspectRuntime?.dispose();
  proxyOwnershipRuntime?.dispose();
  popupTemporaryRuleRuntime?.dispose();
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
  proxyOwnershipRuntime = registerProxyOwnershipRuntime(currentProxyOwnershipRuntimeApi());
  inspectRuntime = registerInspectRuntime(currentInspectRuntimeApi());

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch(
    (error: unknown) => {
      console.error(`[${productIdentity.name}] proxy runtime initialization failed:`, error);
    },
  );
});
