import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const legacyBackupPath = resolve('fixtures/zeroomega-v2/minimal-profile-types.json');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-chromium-'));
let context;

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  assert.match(extensionId, /^[a-p]{32}$/u, 'Chromium extension ID was not resolved');

  const options = await context.newPage();
  options.on('console', (message) =>
    console.log(`[Chromium Options console:${message.type()}] ${message.text()}`),
  );
  options.on('pageerror', (error) =>
    console.error(`[Chromium Options pageerror] ${error.stack ?? error.message}`),
  );
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.waitForLoadState('domcontentloaded');
  const profileName = options.getByLabel('Profile name');
  try {
    await profileName.waitFor({ state: 'visible', timeout: 15_000 });
  } catch (error) {
    const diagnostics = await worker.evaluate(async () => ({
      location: globalThis.location.href,
      storage: await chrome.storage.local.get(null),
    }));
    console.error(`[Chromium Options URL] ${options.url()}`);
    console.error(`[Chromium Options title] ${await options.title()}`);
    console.error(`[Chromium Options body] ${await options.locator('body').innerText()}`);
    console.error(`[Chromium worker] ${JSON.stringify(diagnostics)}`);
    throw error;
  }
  assert.equal(await profileName.inputValue(), 'Proxy');

  await options.getByRole('button', { name: 'Theme', exact: true }).click();
  await options.getByRole('heading', { name: 'Theme', exact: true, level: 1 }).waitFor();
  const automaticTheme = options.getByRole('radio', { name: /^Automatic/u });
  const darkTheme = options.getByRole('radio', { name: /^Dark/u });
  assert.equal(await automaticTheme.getAttribute('aria-checked'), 'true');
  await darkTheme.click();
  assert.equal(await options.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(
    await options.evaluate(() => localStorage.getItem('zeroomega-nex/theme-mode')),
    'dark',
  );
  await automaticTheme.click();
  assert.equal(await options.locator('html').getAttribute('data-theme'), null);
  assert.equal(
    await options.evaluate(() => localStorage.getItem('zeroomega-nex/theme-mode')),
    'auto',
  );

  await options.getByRole('button', { name: 'Proxy', exact: true }).click();
  await profileName.waitFor({ state: 'visible' });
  await profileName.fill('Chromium E2E Proxy');
  await profileName.press('Tab');
  const apply = options.getByRole('button', { name: 'Apply changes' });
  await apply.waitFor({ state: 'visible' });
  await assertEventually(async () => !(await apply.isDisabled()), 'Apply button remained disabled');
  await apply.click();
  await options
    .getByText('Draft matches the currently applied revision.')
    .waitFor({ state: 'visible', timeout: 20_000 });

  await options.getByRole('button', { name: 'Snapshot History' }).click();
  await options
    .getByRole('heading', { name: 'Configuration History', exact: true, level: 1 })
    .waitFor();
  await options.getByRole('heading', { name: 'Verified PAC snapshots', exact: true }).waitFor();
  await options
    .getByText(/^Snapshot pac-/u)
    .first()
    .waitFor({ timeout: 20_000 });

  const popup = await context.newPage();
  popup.on('pageerror', (error) =>
    console.error(`[Chromium Popup pageerror] ${error.stack ?? error.message}`),
  );
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole('button', { name: /Chromium E2E Proxy/u }).waitFor();
  const direct = popup.getByRole('button', { name: /Direct/u });
  await direct.click();
  await assertEventually(async () => direct.isDisabled(), 'Direct route did not become active');

  await options.bringToFront();
  await options.getByRole('button', { name: 'Import / Export', exact: true }).click();
  await options.getByLabel('Legacy backup file').setInputFiles(legacyBackupPath);
  await options.getByRole('heading', { name: 'Compatibility check', exact: true }).waitFor();
  const importAndUse = options.getByRole('button', { name: 'Import and use now', exact: true });
  await importAndUse.click();
  await options
    .getByText('Import completed. The original configuration is now active.')
    .waitFor({ state: 'visible', timeout: 20_000 });
  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  console.log(`Chromium extension E2E passed for ${extensionId}.`);
} finally {
  await context?.close();
  await rm(userDataDir, { recursive: true, force: true });
}

async function assertEventually(check, message, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(message);
}
