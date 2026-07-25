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
    locale: 'zh-CN',
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
  const profileName = options.getByLabel('情景模式名称');
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

  await options.getByRole('button', { name: '主题', exact: true }).click();
  await options.getByRole('heading', { name: '主题', exact: true, level: 1 }).waitFor();
  const automaticTheme = options.getByRole('radio', { name: /^自动/u });
  const darkTheme = options.getByRole('radio', { name: /^深色/u });
  assert.equal(await automaticTheme.getAttribute('aria-checked'), 'true');
  await darkTheme.click();
  assert.equal(await options.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(
    await options.evaluate(() => localStorage.getItem('zeroomega-nex/theme-mode')),
    'dark',
  );
  const initialPopup = await context.newPage();
  await initialPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  await initialPopup.getByRole('button', { name: /直接连接/u }).waitFor();
  const initialButtons = initialPopup.locator('.profile-list button');
  assert.match(await initialButtons.nth(0).innerText(), /直接连接/u);
  assert.match(await initialButtons.nth(1).innerText(), /系统代理/u);
  assert.equal(await initialButtons.nth(0).isDisabled(), true);
  assert.equal(await initialPopup.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal((await initialPopup.locator('[data-profile-kind]').count()) >= 3, true);
  await initialPopup.close();
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
  const apply = options.getByRole('button', { name: '应用选项' });
  await apply.waitFor({ state: 'visible' });
  await assertEventually(async () => !(await apply.isDisabled()), 'Apply button remained disabled');
  await apply.click();
  await options.getByText('当前设置已全部应用。').waitFor({ state: 'visible', timeout: 20_000 });

  await options.getByRole('button', { name: '配置历史' }).click();
  await options.getByRole('heading', { name: '配置历史', exact: true, level: 1 }).waitFor();
  await options.getByRole('heading', { name: '已验证的 PAC 快照', exact: true }).waitFor();
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
  const direct = popup.getByRole('button', { name: /直接连接/u });
  await direct.click();
  await assertEventually(async () => direct.isDisabled(), 'Direct route did not become active');

  await options.bringToFront();
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await options.getByLabel('原版备份文件').setInputFiles(legacyBackupPath);
  await options.getByRole('heading', { name: '兼容性检查', exact: true }).waitFor();
  const importAndUse = options.getByRole('button', { name: '导入并立即使用', exact: true });
  await importAndUse.click();
  await options
    .getByText('导入完成，原版配置现已启用。')
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
