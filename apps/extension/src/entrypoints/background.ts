import { recoverPendingActivation, restoreActiveSnapshot } from '@zeroomega-nex/browser-adapters';
import { productIdentity } from '@zeroomega-nex/core-contracts';
import {
  BrowserStorageProfileWorkflowRepository,
  recoverInterruptedProfileWorkflowApply,
} from '@zeroomega-nex/profile-workflow';

import { currentBrowserProxyRuntime } from '../lib/browser-proxy-runtime';
import {
  currentInspectRuntimeApi,
  registerInspectRuntime,
  type RegisteredInspectRuntime,
} from '../lib/inspect-runtime';
import { currentOriginalToolbarBrowserRuntimeApi } from '../lib/original-toolbar-browser-runtime';
import { currentOriginalToolbarCanvasFactory } from '../lib/original-toolbar-icon-renderer';
import {
  createOriginalToolbarRendererE2eProbe,
  type OriginalToolbarRendererE2eRuntimeApi,
} from '../lib/original-toolbar-renderer-e2e';
import {
  registerOriginalToolbarRuntime,
  type OriginalToolbarNavigationCommittedListener,
  type OriginalToolbarProxySettingsChangedListener,
  type OriginalToolbarTabRemovedListener,
  type RegisteredOriginalToolbarRuntime,
} from '../lib/original-toolbar-runtime';
import type { OriginalToolbarEvent } from '../lib/original-toolbar-tab-coordinator';
import {
  FIREFOX_M1_FAILURE_PLAN_CHANNEL,
  BrowserProfileWorkflowActivationDriver,
  FirefoxM1FailurePlanController,
} from '../lib/profile-workflow-activation';
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
  shouldActivateStartupRouteAfterProxyRestore,
  shouldPreserveExternalProxyState,
  type ProxyRuntimeRestoreDisposition,
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
let originalToolbarRendererE2eRuntime: { dispose(): void } | undefined;
let profileWorkflowRuntime: RegisteredProfileWorkflowRuntime | undefined;
let popupTemporaryRuleRuntime: RegisteredPopupTemporaryRuleRuntime | undefined;
let proxyOwnershipRuntime: RegisteredProxyOwnershipRuntime | undefined;
let requestDiagnosticsRuntime: RegisteredRequestDiagnosticsRuntime | undefined;
let failurePlanController: FirefoxM1FailurePlanController | undefined;
let failurePlanListener: ((message: unknown) => unknown) | undefined;

async function restoreProxyRuntime(
  manager: ProxyAuthenticationRuntimeManager,
  temporaryRules: PopupTemporaryRuleCoordinator | undefined,
): Promise<ProxyRuntimeRestoreDisposition> {
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
    return 'failed';
  }

  if (
    workflow &&
    temporaryRules &&
    (repaired || (await temporaryRules.reconcileStartup(workflow.applied, runtime.repository)))
  ) {
    console.info(`[${productIdentity.name}] temporary-rule proxy runtime reconciled.`);
    return 'startup-complete';
  }

  const activationState = await runtime.repository.getState();
  if (activationState.activeBuiltInMode === 'system') {
    const platformState = await runtime.driver.readState();
    if (shouldPreserveExternalProxyState(activationState.activeBuiltInMode, platformState)) {
      console.info(`[${productIdentity.name}] external proxy state preserved in System mode.`);
      return 'startup-complete';
    }
  }

  const restored = await restoreActiveSnapshot(runtime.repository, runtime.driver);
  if (restored.status === 'failed') {
    console.error(
      `[${productIdentity.name}] active proxy snapshot restore failed:`,
      restored.message,
    );
    return 'failed';
  }
  console.info(`[${productIdentity.name}] proxy runtime state: ${restored.status}.`);
  return 'inspect-startup-route';
}

export default defineBackground(() => {
  console.info(
    `[${productIdentity.name}] background initialized for ${productIdentity.milestone}.`,
  );

  inspectRuntime?.dispose();
  originalToolbarRendererE2eRuntime?.dispose();
  originalToolbarRuntime?.dispose();
  requestDiagnosticsRuntime?.dispose();
  if (failurePlanListener) {
    browser.runtime.onMessage.removeListener(failurePlanListener);
    failurePlanListener = undefined;
  }
  proxyOwnershipRuntime?.dispose();
  popupTemporaryRuleRuntime?.dispose();
  profileWorkflowRuntime?.dispose();
  authenticationManager?.dispose();

  const authentication = new ProxyAuthenticationRuntimeManager(currentProxyAuthenticationApi());
  authenticationManager = authentication;
  failurePlanController =
    import.meta.env.WXT_FIREFOX_M1_FAILURE_PLAN === '1'
      ? new FirefoxM1FailurePlanController({
          enabled: true,
          expectedHead: import.meta.env.WXT_FIREFOX_M1_FAILURE_PLAN_EXPECTED_HEAD,
        })
      : undefined;
  if (failurePlanController) {
    failurePlanListener = (message: unknown) => {
      if (
        message === null ||
        typeof message !== 'object' ||
        (message as { channel?: unknown }).channel !== FIREFOX_M1_FAILURE_PLAN_CHANNEL
      ) {
        return undefined;
      }
      const input = message as {
        action?: unknown;
        plan?: unknown;
        scenario?: unknown;
        context?: unknown;
      };
      try {
        if (input.action === 'configure') {
          const configured = failurePlanController!.configure(
            input.plan,
            input.scenario,
            input.context,
            (message as { exactHead?: unknown }).exactHead,
          );
          void profileWorkflowRuntime?.initialize();
          return configured;
        }
        if (input.action === 'report') return { ok: true, ...failurePlanController!.report() };
        return { ok: false, error: 'unsupported Firefox M1 failure-plan action' };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    };
    browser.runtime.onMessage.addListener(failurePlanListener);
  }
  const baseActivationDriver = new BrowserProfileWorkflowActivationDriver({
    authentication,
    ...(failurePlanController === undefined ? {} : { failurePlan: failurePlanController }),
  });
  const temporaryRuleApi = currentPopupTemporaryRuleRuntimeApi();
  const temporaryRuleCoordinator = createPopupTemporaryRuleCoordinator(
    temporaryRuleApi,
    baseActivationDriver,
  );
  const activationDriver = temporaryRuleCoordinator ?? baseActivationDriver;
  const toolbarApi = currentOriginalToolbarBrowserRuntimeApi();
  const rendererE2eProbe = createOriginalToolbarRendererE2eProbe(
    toolbarApi,
    currentOriginalToolbarCanvasFactory(),
  );
  const workflowRepository = new BrowserStorageProfileWorkflowRepository(browser.storage.local);
  const toolbarRuntime = registerOriginalToolbarRuntime({
    api: rendererE2eProbe?.api ?? toolbarApi,
    repository: workflowRepository,
    runtime: {
      inspectRuntime: async (applied) => {
        const toolbarView = temporaryRuleCoordinator
          ? await temporaryRuleCoordinator.inspectToolbarRuntime(applied)
          : ((await baseActivationDriver.inspectRuntime?.()) ?? {});
        const proxyRuntime = currentBrowserProxyRuntime();
        try {
          const proxyControlLevel = (await proxyRuntime.driver.getCapabilities()).controlLevel;
          return { ...toolbarView, proxyControlLevel };
        } catch {
          return toolbarView;
        } finally {
          proxyRuntime.dispose();
        }
      },
    },
    tabRemoved: browser.tabs
      .onRemoved as unknown as OriginalToolbarEvent<OriginalToolbarTabRemovedListener>,
    navigationCommitted: browser.webNavigation
      .onCommitted as unknown as OriginalToolbarEvent<OriginalToolbarNavigationCommittedListener>,
    proxySettingsChanged: browser.proxy.settings
      .onChange as unknown as OriginalToolbarEvent<OriginalToolbarProxySettingsChangedListener>,
    ...(rendererE2eProbe === undefined
      ? {}
      : { browserRuntime: { canvasFactory: rendererE2eProbe.canvasFactory } }),
    onError: (error, context) => {
      console.error(`[${productIdentity.name}] toolbar ${context.phase} failed:`, error, context);
    },
  });
  originalToolbarRuntime = toolbarRuntime;
  originalToolbarRendererE2eRuntime = rendererE2eProbe?.register(
    browser.runtime as unknown as OriginalToolbarRendererE2eRuntimeApi,
    (options) => toolbarRuntime.refreshAll(options),
  );
  const refreshToolbar = async (reason: string, clearIconCache = true): Promise<void> => {
    try {
      await toolbarRuntime.refreshAll(clearIconCache ? { clearIconCache: true } : {});
    } catch (error) {
      console.error(`[${productIdentity.name}] toolbar refresh failed after ${reason}:`, error);
    }
  };

  const workflowRuntime = registerProfileWorkflowRuntime(currentProfileWorkflowRuntimeApi(), {
    activationDriver,
    authentication,
    ...(failurePlanController === undefined ? {} : { failurePlan: failurePlanController }),
    onActivationSucceeded: () => refreshToolbar('profile activation'),
    completeInitialization: async (response) => {
      if (!response.ok) {
        throw new Error('profile workflow initialization command failed');
      }
      if (response.appliedSnapshotId !== undefined) return;
      const restoreDisposition = await restoreProxyRuntime(
        authentication,
        temporaryRuleCoordinator,
      );
      if (restoreDisposition === 'failed') return;
      if (response.state.pendingApply) {
        const recoveredApply = await recoverInterruptedProfileWorkflowApply(
          workflowRepository,
          activationDriver,
          new Date().toISOString(),
        );
        if (recoveredApply.status === 'recovered') {
          console.info(
            `[${productIdentity.name}] interrupted profile Apply ${recoveredApply.applyId} rolled back on restart.`,
          );
          await refreshToolbar('interrupted profile Apply recovery');
          return;
        }
        if (recoveredApply.status !== 'nothing-pending') {
          console.error(
            `[${productIdentity.name}] interrupted profile Apply recovery did not complete:`,
            recoveredApply.message,
          );
          return;
        }
      }
      const restoredRuntime = (await activationDriver.inspectRuntime?.()) ?? {};
      if (
        shouldActivateStartupRouteAfterProxyRestore(
          restoreDisposition,
          restoredRuntime.activeRoute !== undefined,
        )
      ) {
        const startupRoute = response.state.applied.settings.startup.route ?? { kind: 'system' };
        await activationDriver.activate(response.state.applied, startupRoute);
      }
      await refreshToolbar('startup recovery');
    },
  });
  profileWorkflowRuntime = workflowRuntime;
  popupTemporaryRuleRuntime = temporaryRuleCoordinator
    ? registerPopupTemporaryRuleRuntime(temporaryRuleApi, temporaryRuleCoordinator, {
        onActivationSucceeded: () => refreshToolbar('temporary rule'),
      })
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

  if (failurePlanController === undefined) {
    void workflowRuntime.initialize().catch((error: unknown) => {
      console.error(`[${productIdentity.name}] proxy runtime initialization failed:`, error);
    });
  }
});
