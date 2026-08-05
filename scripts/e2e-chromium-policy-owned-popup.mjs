import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-policy-owned-popup-'));
const browserChannel = process.env.ZEROOMEGA_POLICY_BROWSER_CHANNEL ?? 'chromium';
let context;

async function waitForValue(read, accept, message, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  let actual;
  while (Date.now() < deadline) {
    actual = await read();
    if (accept(actual)) return actual;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(`${message}: ${JSON.stringify(actual)}`);
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: browserChannel,
    headless: true,
    locale: 'en-US',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.waitForLoadState('domcontentloaded');

  const policyState = await waitForValue(
    async () =>
      options.evaluate(async () => {
        const [settings, ownership] = await Promise.all([
          chrome.proxy.settings.get({ incognito: false }),
          chrome.runtime.sendMessage({
            channel: 'zeroomega-nex/proxy-ownership/v1',
            action: 'get',
          }),
        ]);
        return { settings, ownership };
      }),
    (value) =>
      value?.settings?.levelOfControl === 'not_controllable' &&
      value.ownership?.ok === true &&
      value.ownership.view?.blocked === true &&
      value.ownership.view?.reason === 'policy' &&
      value.ownership.view?.controlLevel === 'not-controllable',
    'Chromium managed proxy policy did not produce the policy-owned ownership state',
  );

  assert.equal(policyState.settings.value?.mode, 'fixed_servers');

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const panel = popup.locator('[data-popup-proxy-not-controllable]');
  await panel.waitFor({ state: 'visible' });
  assert.equal(await panel.getAttribute('data-reason'), 'policy');
  assert.equal(await popup.locator('.profile-row').count(), 0);
  assert.equal(await popup.locator('.popup-footer').count(), 0);
  assert.equal(await panel.locator('.proxy-control-actions button').count(), 2);
  assert.equal(await panel.locator('[data-popup-manage-extensions]').count(), 1);

  console.log(
    JSON.stringify({
      browserChannel,
      extensionId,
      levelOfControl: policyState.settings.levelOfControl,
      mode: policyState.settings.value?.mode,
      reason: policyState.ownership.view.reason,
      blocked: policyState.ownership.view.blocked,
    }),
  );
} finally {
  await context?.close();
  await rm(userDataDir, { recursive: true, force: true });
}
