import { recoverPendingActivation, restoreActiveSnapshot } from '@zeroomega-nex/browser-adapters';
import { productIdentity } from '@zeroomega-nex/core-contracts';

import { currentBrowserProxyRuntime } from '../lib/browser-proxy-runtime';
import {
  currentProxyAuthenticationApi,
  registerStoredProxyAuthentication,
  type ProxyAuthenticationRuntime,
} from '../lib/proxy-auth-runtime';

let authenticationRuntime: ProxyAuthenticationRuntime | undefined;

async function restoreProxyRuntime(): Promise<void> {
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

  authenticationRuntime?.dispose();
  authenticationRuntime = await registerStoredProxyAuthentication(
    currentProxyAuthenticationApi(),
  );
  console.info(
    `[${productIdentity.name}] proxy authentication state: ${authenticationRuntime.status}.`,
  );
}

export default defineBackground(() => {
  console.info(
    `[${productIdentity.name}] background initialized for ${productIdentity.milestone}.`,
  );
  void restoreProxyRuntime().catch((error: unknown) => {
    console.error(`[${productIdentity.name}] proxy runtime initialization failed:`, error);
  });
});
