import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-popup-external-profile-'));
let context;

async function waitForValue(read, accept, message, timeout = 20_000) {
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
    channel: 'chromium',
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
  await options.evaluate(async () => {
    await chrome.proxy.settings.set({
      scope: 'regular',
      value: {
        mode: 'fixed_servers',
        rules: {
          singleProxy: { scheme: 'http', host: '127.0.0.1', port: 18188 },
          bypassList: ['<local>'],
        },
      },
    });
  });

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const row = popup.locator('[data-popup-external-profile]');
  await row.waitFor({ state: 'visible' });
  const order = await popup.locator('.profile-list').evaluate((list) => {
    const children = [...list.children];
    return {
      external: children.findIndex((child) => child.hasAttribute('data-popup-external-profile')),
      divider: children.findIndex((child) => child.classList.contains('profile-divider')),
    };
  });
  assert.ok(order.external >= 0 && order.external < order.divider, 'external row ordering differs');
  await row.locator('.external-profile-button').click();
  const form = popup.locator('[data-popup-external-profile-form]');
  await form.waitFor({ state: 'visible' });
  assert.equal(await form.locator('button').count(), 0, 'external form exposes Nex-only actions');
  const input = form.locator('input');
  await input.fill('Imported Browser Proxy');
  const closePromise = popup.waitForEvent('close');
  await input.blur();
  await closePromise;

  await waitForValue(
    async () =>
      options.evaluate(async () => {
        const response = await chrome.runtime.sendMessage({
          channel: 'zeroomega-nex/profile-workflow/v1',
          action: 'get',
        });
        return response?.state?.applied?.profiles?.some(
          (profile) => profile.name === 'Imported Browser Proxy' && profile.kind === 'fixed',
        );
      }),
    (value) => value === true,
    'external profile was not imported on blur',
  );
  console.log(`Chromium Popup external-profile E2E passed for ${extensionId}.`);
} finally {
  await context?.close();
  await rm(userDataDir, { recursive: true, force: true });
}
