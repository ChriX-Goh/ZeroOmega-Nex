import { recoverPendingActivation, restoreActiveSnapshot } from '@zeroomega-nex/browser-adapters';
import { productIdentity } from '@zeroomega-nex/core-contracts';
import { BrowserStorageProfileWorkflowRepository } from '@zeroomega-nex/profile-workflow';

import { currentBrowserProxyRuntime } from '../lib/browser-proxy-runtime';
import {
  currentInspectRuntimeApi,
  registerInspectRuntime,
  type RegisteredInspectRuntime,
} from '../lib/inspect-runtime';
import { currentOriginalToolbarBrowserRuntimeApi } from '../lib/original-toolbar-browser-runtime';
import {
  registerOriginalToolbarRuntime,
  type OriginalToolbarTabRemovedListener,
  type RegisteredOriginalToolbarRuntime,
} from '../lib/original-toolbar-runtime';
import type { OriginalToolbarEvent } from '../lib/original-toolbar-tab-coordinator';
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
import {
  currentRequestDiagnosticsRuntimeApi,
  registerRequestDiagnosticsRuntime,
  type RegisteredRequestDiagnosticsRuntime,
} from '../lib/request-diagnostics-runtime';

let authenticationManager: ProxyAuthenticationRuntimeManager | undefined;
let inspectRuntime: RegisteredInspectRuntime | undefined;
let originalToolbarRuntime: RegisteredOriginalToolbarRuntime | undefined;
let profileWorkflowRuntime: RegisteredProfileWorkflowRuntime | undefined;
let popupTemporaryRuleRuntime: RegisteredPopupTemporaryRuleRuntime | undefined;
let proxyOwnershipRuntime: RegisteredProxyOwnershipRuntime | undefined;
let requestDiagnosticsRuntime: RegisteredRequestDiagnosticsRuntime | undefined;

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
  originalToolbarRuntime?.dispose();
  requestDiagnosticsRuntime?.dispose();
  proxyOwnershipRuntime?.dispose();
  popupTemporaryRuleRuntime?.dispose();
  profileWorkflowRuntime?.dispose();
  authenticationManager?.dispose();

  const authentication = new ProxyAuthenticationRuntimeManager(currentProxyAuthenticationApi());
  authenticationManager = authentication;
  const baseActivationDriver = new BrowserProfileWorkflowActivationDriver({
    authentication,
  });
  const temporaryRuleApi = currentPopupTemporaryRuleRuntimeApi();
  const temporaryRuleCoordinator = createPopupTemporaryRuleCoordinator(
    temporaryRuleApi,
    baseActivationDriver,
  );
  const activationDriver = temporaryRuleCoordinator ?? baseActivationDriver;
  const toolbarRuntime = registerOriginalToolbarRuntime({
    api: currentOriginalToolbarBrowserRuntimeApi(),
    repository: new BrowserStorageProfileWorkflowRepository(browser.storage.local),
    runtime: {
      inspectRuntime: async () => (await activationDriver.inspectRuntime?.()) ?? {},
    },
    tabRemoved: browser.tabs
      .onRemoved as unknown as OriginalToolbarEvent<OriginalToolbarTabRemovedListener>,
    onError: (error, context) => {
      console.error(`[${productIdentity.name}] toolbar ${context.phase} failed:`, error, context);
    },
  });
  originalToolbarRuntime = toolbarRuntime;
  const refreshToolbar = (reason: string, clearIconCache = true): void => {
    void toolbarRuntime
      .refreshAll(clearIconCache ? { clearIconCache: true } : {})
      .catch((error: unknown) => {
        console.error(`[${productIdentity.name}] toolbar refresh failed after ${reason}:`, error);
      });
  };

  const workflowRuntime = registerProfileWorkflowRuntime(currentProfileWorkflowRuntimeApi(), {
    activationDriver,
    authentication,
    onActivationSucceeded: () => refreshToolbar('profile activation'),
  });
  profileWorkflowRuntime = workflowRuntime;
  popupTemporaryRuleRuntime = temporaryRuleCoordinator
    ? registerPopupTemporaryRuleRuntime(temporaryRuleApi, temporaryRuleCoordinator)
    : undefined;
  proxyOwnershipRuntime = registerProxyOwnershipRuntime(currentProxyOwnershipRuntimeApi());
  requestDiagnosticsRuntime = registerRequestDiagnosticsRuntime(
    currentRequestDiagnosticsRuntimeApi(),
  );
  const inspectApi = currentInspectRuntimeApi();
  inspectRuntime = registerInspectRuntime({
    ...inspectApi,
    action: toolbarRuntime.inspectAction,
  });

  void workflowRuntime
    .initialize()
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('profile workflow initialization command failed');
      }
      if (response.appliedSnapshotId === undefined) {
        await restoreProxyRuntime(authentication, temporaryRuleCoordinator);
        refreshToolbar('startup recovery');
        return;
      }
      refreshToolbar('initial startup activation');
    })
    .catch((error: unknown) => {
      console.error(`[${productIdentity.name}] proxy runtime initialization failed:`, error);
    });
});
