import { recoverPendingActivation, restoreActiveSnapshot } from '@zeroomega-nex/browser-adapters';
import { productIdentity } from '@zeroomega-nex/core-contracts';

import { currentBrowserProxyRuntime } from '../lib/browser-proxy-runtime';
import { BrowserProfileWorkflowActivationDriver } from '../lib/profile-workflow-activation';
import {
  currentProfileWorkflowRuntimeApi,
  registerProfileWorkflowRuntime,
  type RegisteredProfileWorkflowRuntime,
} from '../lib/profile-workflow-runtime';
import {
  currentProxyAuthenticationApi,
  ProxyAuthenticationRuntimeManager,
} from '../lib/proxy-auth-runtime';

let authenticationManager: ProxyAuthenticationRuntimeManager | undefined;
let profileWorkflowRuntime: RegisteredProfileWorkflowRuntime | undefined;

async function restoreProxyRuntime(manager: ProxyAuthenticationRuntimeManager): Promise<void> {
  const authenticationStatus = await manager.initialize();
  console.info(`[${productIdentity.name}] proxy authentication state: ${authenticationStatus}.`);

  const runtime = currentBrowserProxyRuntime();
  const recovered = await recoverPendingActivation(
    runtime.repository,
    runtime.driver,
    new Date().toISOString(),
  );
  if (recovered.status === 'failed') {
    console.error(`[${productIdentity.name}] proxy activation recovery failed:`, recovered.message);
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

  profileWorkflowRuntime?.dispose();
  authenticationManager?.dispose();

  authenticationManager = new ProxyAuthenticationRuntimeManager(currentProxyAuthenticationApi());
  const activationDriver = new BrowserProfileWorkflowActivationDriver({
    authentication: authenticationManager,
  });
  profileWorkflowRuntime = registerProfileWorkflowRuntime(currentProfileWorkflowRuntimeApi(), {
    activationDriver,
  });

  void restoreProxyRuntime(authenticationManager).catch((error: unknown) => {
    console.error(`[${productIdentity.name}] proxy runtime initialization failed:`, error);
  });
});
