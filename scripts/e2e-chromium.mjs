import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const extensionPath = resolve('apps/extension/dist/chrome-mv3');
const userDataDir = '/tmp/zeroomega-nex-chromium-e2e';
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: true,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

async function assertEventually(check, message, timeoutMs = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await check()) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(message);
}

try {
  let [background] = context.serviceWorkers();
  if (!background) background = await context.waitForEvent('serviceworker');
  const extensionId = new URL(background.url()).host;

  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.getByRole('button', { name: 'Fixed' }).click();
  const fixedTable = options.locator('[data-fixed-profile-table]');
  const fallbackRow = fixedTable.locator('[data-proxy-scheme="fallback"]');
  const fallbackServer = fallbackRow.locator('[data-proxy-field="server"]');
  const fallbackPort = fallbackRow.locator('[data-proxy-field="port"]');
  assert.equal(await fallbackServer.inputValue(), '');
  assert.equal(await fallbackPort.inputValue(), '80');
  await fallbackServer.fill('proxy.e2e.invalid');
  await fallbackServer.press('Tab');
  await assertEventually(
    async () => !(await fallbackRow.locator('[data-proxy-action="authentication"]').isDisabled()),
    'Fixed Profile authentication button remained disabled after saving the endpoint',
  );
  await fixedTable.locator('[data-proxy-action="show-advanced"]').click();
  assert.equal(await fixedTable.locator('[data-proxy-scheme]').count(), 4);
  const httpRow = fixedTable.locator('[data-proxy-scheme="http"]');
  assert.equal(await httpRow.locator('[data-proxy-field="protocol"]').inputValue(), '');
  assert.equal(
    await httpRow.locator('[data-proxy-field="server"]').getAttribute('placeholder'),
    'proxy.e2e.invalid',
  );
  assert.equal(
    await httpRow.locator('[data-proxy-field="port"]').getAttribute('placeholder'),
    '80',
  );
  await fallbackRow.locator('[data-proxy-action="authentication"]').click();
  const authDialog = options.locator('[data-fixed-auth-dialog]');
  await authDialog.getByRole('heading', { name: '代理登录', exact: true }).waitFor();
  await authDialog.getByLabel('用户名', { exact: true }).fill('chromium-e2e');
  await authDialog.getByLabel('密码', { exact: true }).fill('not-a-real-secret');
  await authDialog.locator('[data-auth-action="save"]').click();
  await authDialog.waitFor({ state: 'detached' });

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
  await initialPopup.close();

  await options.getByRole('button', { name: 'Fixed' }).click();
  const fallbackServerAfterTheme = options
    .locator('[data-fixed-profile-table]')
    .locator('[data-proxy-scheme="fallback"]')
    .locator('[data-proxy-field="server"]');
  assert.equal(await fallbackServerAfterTheme.inputValue(), 'proxy.e2e.invalid');

  await options.getByRole('button', { name: '应用更改', exact: true }).click();
  await assertEventually(
    async () => (await options.locator('[data-draft-status]').textContent())?.includes('已应用') ?? false,
    'Draft status did not reach applied state',
  );

  await options.getByRole('button', { name: '快照历史', exact: true }).click();
  await options.getByRole('heading', { name: '快照历史', exact: true, level: 1 }).waitFor();
  await options.getByText('浏览器确认活动状态', { exact: true }).waitFor();

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole('button', { name: /直接连接/u }).click();
  await popup.getByText('浏览器确认活动状态', { exact: true }).waitFor();

  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  const upload = options.locator('input[type="file"]');
  await upload.setInputFiles('fixtures/original-zeroomega/schema-v2.json');
  await options.getByRole('button', { name: '导入并立即使用', exact: true }).click();
  await options.getByText('导入配置已应用', { exact: true }).waitFor();

  console.log('Chromium extension E2E passed.');
} finally {
  await context.close();
}
