import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

import { createBasicAuthProxyChallengeServer } from './e2e-basic-auth-proxy.mjs';

const extensionPath = resolve('dist/chrome-mv3');
const legacyBackupPath = resolve('fixtures/zeroomega-v2/minimal-profile-types.json');
const virtualMigrationBackupPath = resolve(
  'fixtures/zeroomega-v2/virtual-reference-migration.json',
);
const remoteOnlineBackupText = await readFile(virtualMigrationBackupPath, 'utf8');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-chromium-'));
const conflictUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-conflict-user-'));
const virtualUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-virtual-user-'));
const creationUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-creation-user-'));
const conflictExtensionPath = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-conflict-ext-'));
await mkdir(conflictExtensionPath, { recursive: true });
await writeFile(
  resolve(conflictExtensionPath, 'manifest.json'),
  JSON.stringify({
    manifest_version: 3,
    name: 'Proxy Ownership Conflict E2E',
    version: '1.0.0',
    permissions: ['proxy'],
    background: { service_worker: 'background.js' },
  }),
);
await writeFile(
  resolve(conflictExtensionPath, 'background.js'),
  `const claim = async () => chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' });
void claim();
setInterval(() => void claim(), 250);
`,
);
let remoteRuleText = '[AutoProxy 0.2.9]\n||downloaded.e2e.invalid';
let remotePacText = "function FindProxyForURL(url, host) { return 'DIRECT'; }\n";
let receivedRuleHeader = '';
let ruleRequestCount = 0;
let onlineBackupRequestCount = 0;
const ruleServer = createServer((request, response) => {
  if (request.url?.startsWith('/online-backup')) {
    onlineBackupRequestCount += 1;
    response.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(remoteOnlineBackupText);
    return;
  }
  if (request.url?.startsWith('/diagnostic-error')) {
    request.socket.destroy();
    return;
  }
  if (request.url?.startsWith('/source-http-error')) {
    response.writeHead(503, {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end('private response body must never be rendered');
    return;
  }
  if (request.url?.startsWith('/source-empty')) {
    response.writeHead(200, {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end('');
    return;
  }
  if (request.url?.startsWith('/proxy.pac')) {
    response.writeHead(200, {
      'content-type': 'application/x-ns-proxy-autoconfig; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(remotePacText);
    return;
  }
  ruleRequestCount += 1;
  receivedRuleHeader = String(request.headers['x-e2e'] ?? '');
  response.writeHead(200, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(remoteRuleText);
});
await new Promise((resolveListen, rejectListen) => {
  ruleServer.once('error', rejectListen);
  ruleServer.listen(0, '127.0.0.1', resolveListen);
});
const ruleAddress = ruleServer.address();
if (!ruleAddress || typeof ruleAddress === 'string')
  throw new Error('Rule List test server failed');
const remoteRuleUrl = `http://127.0.0.1:${ruleAddress.port}/rules.txt`;
const remotePacUrl = `http://127.0.0.1:${ruleAddress.port}/proxy.pac`;
const sourceHttpErrorUrl = `http://127.0.0.1:${ruleAddress.port}/source-http-error`;
const sourceEmptyUrl = `http://127.0.0.1:${ruleAddress.port}/source-empty`;
const onlineBackupUrl = `http://127.0.0.1:${ruleAddress.port}/online-backup`;
const proxyAuthUsername = 'chromium-e2e';
const proxyAuthPassword = 'chromium-e2e-password';
const authProxy = await createBasicAuthProxyChallengeServer({
  username: proxyAuthUsername,
  password: proxyAuthPassword,
  marker: 'Chromium authenticated proxy request passed',
});
let context;
let conflictContext;
let virtualContext;
let creationContext;

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
  const profileHeading = options.getByRole('heading', {
    name: 'Proxy',
    exact: true,
    level: 1,
  });
  try {
    await profileHeading.waitFor({ state: 'visible', timeout: 15_000 });
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
  assert.equal(
    await options.locator('.app-shell').getAttribute('data-options-shell-locale'),
    'zh-CN',
  );
  await options.getByRole('button', { name: '应用选项', exact: true }).waitFor();
  await options.getByRole('button', { name: '撤销更改', exact: true }).waitFor();
  await options.getByText('当前设置已全部应用。', { exact: true }).waitFor();

  await options.getByRole('button', { name: '通用', exact: true }).click();
  const generalSettings = options.locator('[data-general-settings]');
  await generalSettings.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await generalSettings.getAttribute('data-typed-locale'), 'zh-CN');
  await generalSettings.getByRole('heading', { name: '通用', exact: true, level: 1 }).waitFor();
  await options.getByRole('heading', { name: '启动情景模式', exact: true }).waitFor();
  await options.getByLabel('启动路由', { exact: true }).waitFor();
  await options.getByRole('heading', { name: '快速切换', exact: true }).waitFor();
  await options.getByLabel('快速切换路由顺序', { exact: true }).waitFor();
  await options.getByRole('heading', { name: '请求诊断', exact: true }).waitFor();
  assert.doesNotMatch(
    await options.locator('main').innerText(),
    /Startup profile|Quick Switch|Request diagnostics|Grant monitoring permission/u,
    'Options General typed locale coverage regressed',
  );

  await options.getByRole('button', { name: '界面', exact: true }).click();
  const interfaceSettings = options.locator('[data-interface-settings]');
  await interfaceSettings.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await interfaceSettings.getAttribute('data-typed-locale'), 'zh-CN');
  await interfaceSettings.getByRole('heading', { name: '界面', exact: true, level: 1 }).waitFor();
  await options.getByRole('heading', { name: '确认和编辑', exact: true }).waitFor();
  await options.getByText('删除情景模式前要求确认', { exact: true }).waitFor();
  await options.getByRole('heading', { name: '菜单和状态', exact: true }).waitFor();
  await options.getByText('显示检查菜单', { exact: true }).waitFor();
  assert.doesNotMatch(
    await options.locator('main').innerText(),
    /Confirmation and editing|Menus and status|Show inspect menu|Show result profile/u,
    'Options Interface typed locale coverage regressed',
  );

  await options.getByRole('button', { name: '内置情景模式', exact: true }).click();
  const builtinSettings = options.locator('[data-builtin-settings][data-typed-locale="zh-CN"]');
  await builtinSettings.waitFor({ state: 'visible', timeout: 20_000 });
  await builtinSettings.getByRole('heading', { name: '内置情景模式', exact: true }).waitFor();
  await options.getByLabel('直接连接情景模式颜色', { exact: true }).waitFor();
  await options.getByLabel('系统代理情景模式颜色', { exact: true }).waitFor();
  assert.doesNotMatch(
    await options.locator('main').innerText(),
    /Built-in Profiles|Connect without a proxy|operating-system proxy/u,
    'Normal Options typed locale coverage regressed',
  );

  await options.locator('.side-brand button').click();
  const aboutSettings = options.locator('[data-about-settings][data-typed-locale="zh-CN"]');
  await aboutSettings.waitFor({ state: 'visible', timeout: 20_000 });
  await aboutSettings.getByRole('heading', { name: '兼容性优先的延续版本', exact: true }).waitFor();
  assert.doesNotMatch(
    await aboutSettings.innerText(),
    /Compatibility-first continuation|This build preserves/u,
    'Normal Options typed locale coverage regressed',
  );

  await options.getByRole('button', { name: 'Proxy', exact: true }).click();
  await profileHeading.waitFor({ state: 'visible' });

  const fixedTable = options.locator('[data-fixed-proxy-table]');
  await fixedTable.waitFor({ state: 'visible' });
  const chromiumProtocolCapabilities = options.locator(
    '[data-fixed-protocol-capabilities][data-browser-target="chromium"]',
  );
  await chromiumProtocolCapabilities.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(
    await chromiumProtocolCapabilities.locator('[data-proxy-protocol-capability]').count(),
    4,
  );
  assert.match(
    await chromiumProtocolCapabilities.locator('[data-fixed-ftp-capability]').innerText(),
    /不再发起浏览器 FTP 请求/u,
  );
  await options.getByRole('heading', { name: '代理服务器', exact: true }).waitFor();
  assert.equal(await fixedTable.locator('[data-proxy-scheme]').count(), 1);
  const fallbackRow = fixedTable.locator('[data-proxy-scheme="fallback"]');
  const fallbackProtocol = fallbackRow.locator('[data-proxy-field="protocol"]');
  const fallbackServer = fallbackRow.locator('[data-proxy-field="server"]');
  const fallbackPort = fallbackRow.locator('[data-proxy-field="port"]');
  assert.equal(await fallbackProtocol.inputValue(), '');
  assert.equal(await fallbackServer.inputValue(), '');
  assert.equal(await fallbackServer.getAttribute('placeholder'), 'example.com');
  assert.equal(await fallbackPort.inputValue(), '');
  await fallbackProtocol.selectOption('http');
  assert.equal(await fallbackServer.inputValue(), '');
  assert.equal(await fallbackPort.inputValue(), '80');
  await fallbackServer.fill(authProxy.host);
  await fallbackServer.press('Tab');
  await fallbackPort.fill(String(authProxy.port));
  await fallbackPort.press('Tab');
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
    authProxy.host,
  );
  assert.equal(
    await httpRow.locator('[data-proxy-field="port"]').getAttribute('placeholder'),
    String(authProxy.port),
  );
  await fallbackRow.locator('[data-proxy-action="authentication"]').click();
  const authDialog = options.locator('[data-fixed-auth-dialog]');
  await authDialog.getByRole('heading', { name: '代理登录', exact: true }).waitFor();
  const fixedAuthUsername = authDialog.getByLabel('用户名', { exact: true });
  await assertEventually(
    async () => fixedAuthUsername.evaluate((element) => element === document.activeElement),
    'Fixed authentication dialog did not focus the username field',
  );
  await fixedAuthUsername.fill(proxyAuthUsername);
  await authDialog.getByRole('textbox', { name: '密码', exact: true }).fill(proxyAuthPassword);
  await authDialog.locator('[data-auth-action="save"]').click();
  await authDialog.waitFor({ state: 'detached' });

  await options.getByRole('button', { name: '主题', exact: true }).click();
  await options.getByRole('heading', { name: '主题', exact: true, level: 1 }).waitFor();
  const themePanel = options.locator('[data-theme-panel]');
  assert.equal(await themePanel.getAttribute('data-typed-locale'), 'zh-CN');
  await themePanel.getByRole('heading', { name: '外观', exact: true }).waitFor();
  assert.doesNotMatch(await themePanel.innerText(), /Appearance|Automatic|Light|Dark/u);
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
  assert.equal(
    await initialPopup.locator('.popup-shell').getAttribute('data-popup-locale'),
    'zh-CN',
  );
  await initialPopup
    .getByRole('button', { name: '打开 ZeroOmega Nex 选项', exact: true })
    .waitFor();
  await initialPopup.getByRole('button', { name: /直接连接/u }).waitFor();
  const initialButtons = initialPopup.locator('.profile-list button');
  assert.match(await initialButtons.nth(0).innerText(), /直接连接/u);
  assert.match(await initialButtons.nth(1).innerText(), /系统代理/u);
  assert.equal(await initialButtons.nth(0).isDisabled(), false);
  assert.equal(await initialButtons.nth(1).isDisabled(), true);
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
  await profileHeading.waitFor({ state: 'visible' });
  assert.equal(await options.getByLabel('情景模式名称').count(), 0);
  const apply = options.getByRole('button', { name: '应用选项' });
  await apply.waitFor({ state: 'visible' });
  await assertEventually(
    async () => !(await apply.isDisabled()),
    'Proxy edits did not leave an applicable Draft before Rename',
  );
  options.once('dialog', async (dialog) => {
    assert.match(dialog.message(), /重命名此情景模式前，先应用当前更改吗/u);
    await dialog.accept();
  });
  await options.locator('[data-profile-rename-action]').click();
  const renameDialog = options.locator('[data-profile-rename-dialog]');
  await renameDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow !== undefined &&
          workflow.pendingApply === undefined &&
          JSON.stringify(workflow.draft) === JSON.stringify(workflow.applied)
        );
      }),
    'Rename dialog opened before the dirty Draft was applied',
    20_000,
  );
  const renameInput = renameDialog.locator('[data-profile-rename-name-input]');
  await assertEventually(
    async () => renameInput.evaluate((element) => element === document.activeElement),
    'Rename dialog did not focus the name field',
  );
  assert.equal(await renameInput.inputValue(), 'Proxy');
  await renameInput.fill('');
  assert.equal(await renameDialog.locator('[data-profile-rename-confirm]').isDisabled(), true);
  await renameInput.fill('direct');
  assert.equal(await renameDialog.locator('[data-profile-rename-confirm]').isDisabled(), true);
  await renameInput.fill('_Hidden Proxy');
  assert.equal(await renameDialog.locator('[data-profile-rename-confirm]').isDisabled(), false);
  assert.match(await renameDialog.innerText(), /以下划线开头/u);
  await renameInput.fill('Chromium E2E Proxy');
  await renameDialog.locator('[data-profile-rename-confirm]').click();
  await renameDialog.waitFor({ state: 'detached', timeout: 20_000 });
  await options
    .getByRole('heading', { name: 'Chromium E2E Proxy', exact: true, level: 1 })
    .waitFor();
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        const draft = workflow?.draft?.profiles?.find(
          (profile) => profile.id === 'profile-default-proxy',
        );
        const applied = workflow?.applied?.profiles?.find(
          (profile) => profile.id === 'profile-default-proxy',
        );
        return draft?.name === 'Chromium E2E Proxy' && applied?.name === 'Proxy';
      }),
    'Rename did not remain inside the Draft boundary before Apply',
  );
  await assertEventually(async () => !(await apply.isDisabled()), 'Rename did not enable Apply');
  await apply.click();
  await options.getByText('当前设置已全部应用。').waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(
    await worker.evaluate(async () =>
      chrome.permissions.contains({
        permissions: ['webRequest', 'webRequestAuthProvider'],
        origins: ['http://*/*', 'https://*/*'],
      }),
    ),
    true,
    'Chromium Apply did not grant proxy-authentication permissions',
  );

  const popup = await context.newPage();
  popup.on('pageerror', (error) =>
    console.error(`[Chromium Popup pageerror] ${error.stack ?? error.message}`),
  );
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const customProfile = popup.getByRole('button', { name: /Chromium E2E Proxy/u });
  await customProfile.waitFor();
  await customProfile.click();
  await assertEventually(
    async () => customProfile.isDisabled(),
    'Custom profile did not become active',
  );

  const authenticatedPage = await context.newPage();
  let chromiumNavigationError = '';
  try {
    await authenticatedPage.goto(authProxy.targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });
  } catch (error) {
    chromiumNavigationError = error instanceof Error ? error.message : String(error);
  }
  await authenticatedPage.waitForTimeout(2_000);
  const chromiumProxyStats = authProxy.stats();
  const chromiumProxySetting = await worker.evaluate(
    async ({ expectedHost, expectedPort }) => {
      const setting = await chrome.proxy.settings.get({ incognito: false });
      const value = setting.value ?? {};
      const pacData = String(value?.pacScript?.data ?? '');
      return {
        levelOfControl: setting.levelOfControl,
        mode: value?.mode ?? null,
        containsExpectedProxy: pacData.includes(`${expectedHost}:${expectedPort}`),
      };
    },
    { expectedHost: authProxy.host, expectedPort: authProxy.port },
  );
  const successMarker = authenticatedPage.locator('[data-proxy-auth-success]');
  const successVisible = await successMarker.isVisible().catch(() => false);
  if (!successVisible) {
    throw new Error(
      `Chromium proxy authentication target failed: ${JSON.stringify({
        currentUrl: authenticatedPage.url(),
        title: await authenticatedPage.title().catch(() => ''),
        navigationError: chromiumNavigationError,
        stats: chromiumProxyStats,
        proxySetting: chromiumProxySetting,
      })}`,
    );
  }
  assert.equal(await successMarker.innerText(), authProxy.marker);
  assert.equal(
    chromiumProxyStats.unauthorizedCount >= 1,
    true,
    'Chromium proxy never emitted a real 407 challenge',
  );
  assert.equal(
    chromiumProxyStats.authorizedCount >= 1 && chromiumProxyStats.targetAuthorizedCount >= 1,
    true,
    'Chromium did not retry the target with extension-supplied proxy credentials',
  );
  await authenticatedPage.close();

  await options.getByRole('button', { name: '配置历史' }).click();
  await options.getByRole('heading', { name: '配置历史', exact: true, level: 1 }).waitFor();
  await options.getByRole('heading', { name: '已验证的 PAC 快照', exact: true }).waitFor();
  await options.locator('.settings-section').first().waitFor({ timeout: 20_000 });

  await popup.bringToFront();
  const direct = popup.getByRole('button', { name: /直接连接/u });
  if (!(await direct.isDisabled())) await direct.click();
  await assertEventually(async () => direct.isDisabled(), 'Direct route did not become active');

  const system = popup.getByRole('button', { name: /系统代理/u });
  await system.click();
  await assertEventually(async () => system.isDisabled(), 'System route did not become active');
  await worker.evaluate(async () =>
    chrome.proxy.settings.set({
      scope: 'regular',
      value: {
        mode: 'fixed_servers',
        rules: {
          fallbackProxy: { scheme: 'socks5', host: 'external.e2e.invalid', port: 1080 },
          proxyForHttp: { scheme: 'http', host: 'external-http.e2e.invalid', port: 8080 },
          bypassList: ['<local>', 'localhost', '*.external.internal'],
        },
      },
    }),
  );
  const externalPopup = await context.newPage();
  await externalPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  const externalRow = externalPopup.locator('[data-popup-external-profile]');
  await externalRow.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await externalRow.innerText(), /外部情景模式/u);
  await externalRow.locator('.external-profile-button').click();
  const externalForm = externalPopup.locator('[data-popup-external-profile-form]');
  await externalForm.getByLabel('外部情景模式名称').fill('_reserved');
  await externalForm.getByRole('button', { name: '保存名称', exact: true }).click();
  await externalForm.getByText('情景模式名称不能以下划线开头。').waitFor();
  await externalForm.getByLabel('外部情景模式名称').fill('Imported External Proxy');
  await externalForm.getByRole('button', { name: '保存名称', exact: true }).click();
  await assertEventually(async () => {
    const storage = await worker.evaluate(async () => chrome.storage.local.get(null));
    const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
    const imported = workflow?.applied?.profiles?.find(
      (profile) => profile.name === 'Imported External Proxy',
    );
    if (imported?.kind !== 'fixed') return false;
    const fallback = workflow.applied.proxyEndpoints.find(
      (endpoint) => endpoint.id === imported.proxyByScheme.fallback,
    );
    const http = workflow.applied.proxyEndpoints.find(
      (endpoint) => endpoint.id === imported.proxyByScheme.http,
    );
    const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
    const snapshot = proxyState?.activeSnapshotId
      ? storage[`zeroomega-nex/browser-proxy/v1/snapshot/${proxyState.activeSnapshotId}`]
      : undefined;
    return (
      fallback?.protocol === 'socks5' &&
      fallback.host === 'external.e2e.invalid' &&
      fallback.port === 1080 &&
      http?.protocol === 'http' &&
      http.host === 'external-http.e2e.invalid' &&
      imported.bypass?.some((entry) => entry.pattern === '<local>') &&
      imported.bypass?.some((entry) => entry.pattern === '*.external.internal') &&
      !imported.bypass?.some((entry) => entry.pattern === 'localhost') &&
      workflow.draft.revision.id === workflow.applied.revision.id &&
      snapshot?.startRoute?.kind === 'profile' &&
      snapshot.startRoute.profileId === imported.id
    );
  }, 'External Fixed profile was not imported and activated atomically');
  await externalPopup.close().catch(() => undefined);

  await options.bringToFront();
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await options.getByLabel('原版备份文件').setInputFiles(legacyBackupPath);
  await options.getByRole('heading', { name: '兼容性检查', exact: true }).waitFor();
  const importAndUse = options.getByRole('button', {
    name: '导入并立即使用',
    exact: true,
  });
  await importAndUse.click();
  await options
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });
  const importReview = options.locator('[data-legacy-import-review]');
  assert.equal(await importReview.getAttribute('data-typed-locale'), 'zh-CN');
  await importReview.getByRole('heading', { name: '兼容性检查', exact: true }).waitFor();
  await importReview.getByLabel('导入状态统计').waitFor();
  assert.doesNotMatch(
    await importReview.innerText(),
    /Compatibility check|Technical migration details|Import and use now/u,
  );

  const importedStartup = await assertEventuallyValue(async () => {
    return worker.evaluate(async () => {
      const storage = await chrome.storage.local.get(null);
      const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
      const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
      const switchProfile = workflow?.applied?.profiles?.find(
        (profile) => profile.name === 'switch',
      );
      const snapshot = proxyState?.activeSnapshotId
        ? storage[`zeroomega-nex/browser-proxy/v1/snapshot/${proxyState.activeSnapshotId}`]
        : undefined;
      const effective = await chrome.proxy.settings.get({ incognito: false });
      if (
        switchProfile?.kind !== 'switch' ||
        workflow?.applied?.settings?.startup?.route?.kind !== 'profile' ||
        workflow.applied.settings.startup.route.profileId !== switchProfile.id ||
        workflow?.draft?.revision?.id !== workflow?.applied?.revision?.id ||
        snapshot?.startRoute?.kind !== 'profile' ||
        snapshot.startRoute.profileId !== switchProfile.id ||
        effective?.value?.mode !== 'pac_script' ||
        effective?.levelOfControl !== 'controlled_by_this_extension'
      ) {
        return undefined;
      }
      return {
        profileId: switchProfile.id,
        activeSnapshotId: proxyState.activeSnapshotId,
        mode: effective.value.mode,
        levelOfControl: effective.levelOfControl,
      };
    });
  }, 'Imported non-default startup route did not become the browser-confirmed active start route');
  assert.equal(importedStartup.mode, 'pac_script');
  assert.equal(importedStartup.levelOfControl, 'controlled_by_this_extension');

  const firstExportPromise = options.waitForEvent('download');
  await options.locator('[data-legacy-export]').click();
  const firstExport = await firstExportPromise;
  assert.match(firstExport.suggestedFilename(), /^ZeroOmegaOptions-\d{4}-\d{2}-\d{2}T.*\.bak$/u);
  const firstExportPath = await firstExport.path();
  assert.ok(firstExportPath, 'The first Options export did not produce a local file');
  const firstExportContent = await readFile(firstExportPath, 'utf8');
  const firstExportOptions = JSON.parse(firstExportContent);
  assert.equal(firstExportOptions.schemaVersion, 2);
  assert.equal(firstExportOptions['+switch']?.profileType, 'SwitchProfile');
  assert.equal(firstExportOptions['+fixed']?.profileType, 'FixedProfile');
  assert.doesNotMatch(firstExportContent, /passwordSecretRef|secretRef|not-a-real-secret/u);

  await worker.evaluate(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
  });
  await options.reload();
  await options.waitForLoadState('domcontentloaded');
  await options.getByRole('button', { name: 'Proxy', exact: true }).waitFor({ timeout: 20_000 });
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await options.getByLabel('原版备份文件').setInputFiles(firstExportPath);
  await options.getByRole('heading', { name: '兼容性检查', exact: true }).waitFor();
  await options.getByRole('button', { name: '导入并立即使用', exact: true }).click();
  await options
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  const secondExportPromise = options.waitForEvent('download');
  await options.locator('[data-legacy-export]').click();
  const secondExport = await secondExportPromise;
  const secondExportPath = await secondExport.path();
  assert.ok(secondExportPath, 'The second Options export did not produce a local file');
  const secondExportContent = await readFile(secondExportPath, 'utf8');
  assert.equal(
    secondExportContent,
    firstExportContent,
    'Export → clear → import → export did not preserve the original-compatible Options semantics',
  );
  const switchNavigation = options.getByRole('button', { name: 'switch', exact: true });
  await switchNavigation.waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  await switchNavigation.click();
  const switchRulesSection = options.locator('[data-switch-source-mode]');
  await switchRulesSection.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await switchRulesSection.getAttribute('data-typed-locale'), 'zh-CN');
  await switchRulesSection.getByRole('heading', { name: '切换规则', exact: true }).waitFor();
  await switchRulesSection.getByRole('columnheader', { name: '条件类型', exact: true }).waitFor();
  await switchRulesSection.getByRole('columnheader', { name: '条件设置', exact: true }).waitFor();
  assert.doesNotMatch(
    await switchRulesSection.innerText(),
    /Switch rules|Condition type|Condition details/u,
  );
  const switchSourceToggle = switchRulesSection.locator('[data-switch-source-toggle]');
  await switchSourceToggle.click();
  await switchRulesSection.locator('[data-switch-source-editor]').waitFor();
  const switchProfileId = await worker.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(key))[key];
    const profile = workflow?.draft?.profiles?.find((candidate) => candidate.name === 'switch');
    if (!profile || profile.kind !== 'switch') throw new Error('Switch Profile fixture is missing');
    return profile.id;
  });
  const switchEditorStateKey = `zeroomega-nex/options/switch-source-editor/${switchProfileId}`;
  assert.equal(
    await options.evaluate((key) => localStorage.getItem(key), switchEditorStateKey),
    'source',
  );

  await options.reload();
  await options.waitForLoadState('domcontentloaded');
  const restoredSwitchRulesSection = options.locator('[data-switch-source-mode="source"]');
  await restoredSwitchRulesSection.waitFor({ state: 'visible', timeout: 20_000 });
  await restoredSwitchRulesSection.locator('[data-switch-source-editor]').waitFor();
  await restoredSwitchRulesSection.locator('[data-switch-source-toggle]').click();
  await options.locator('[data-switch-rules-table]').waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(
    await options.evaluate((key) => localStorage.getItem(key), switchEditorStateKey),
    null,
  );

  const switchRows = options.locator('[data-switch-rule-row]');
  await options.locator('.add-condition-row button').click();
  await assertEventually(
    async () => (await switchRows.count()) === 2,
    'Switch editor did not append the second rule',
  );
  const firstPattern = switchRows.nth(0).getByLabel('规则 1 的匹配内容');
  const secondPattern = switchRows.nth(1).getByLabel('规则 2 的匹配内容');
  await firstPattern.fill('first.drag.invalid');
  await firstPattern.press('Tab');
  await secondPattern.fill('second.drag.invalid');
  await secondPattern.press('Tab');
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        const profile = workflow?.draft?.profiles?.find((candidate) => candidate.name === 'switch');
        return (
          profile?.kind === 'switch' &&
          profile.rules?.[0]?.condition?.pattern === 'first.drag.invalid' &&
          profile.rules?.[1]?.condition?.pattern === 'second.drag.invalid'
        );
      }),
    'Switch rule patterns did not reach the Draft before dragging',
  );
  await switchRows.nth(0).locator('[data-switch-drag-handle]').dragTo(switchRows.nth(1));
  await assertEventually(
    async () =>
      (await switchRows.nth(0).getByLabel('规则 1 的匹配内容').inputValue()) ===
        'second.drag.invalid' &&
      (await switchRows.nth(1).getByLabel('规则 2 的匹配内容').inputValue()) ===
        'first.drag.invalid',
    'Switch drag handle did not reorder the visible rows',
  );
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        const profile = workflow?.draft?.profiles?.find((candidate) => candidate.name === 'switch');
        return (
          profile?.kind === 'switch' &&
          profile.rules?.[0]?.condition?.pattern === 'second.drag.invalid' &&
          profile.rules?.[1]?.condition?.pattern === 'first.drag.invalid'
        );
      }),
    'Switch drag order was not persisted in the Draft',
  );
  await options.reload();
  await options.waitForLoadState('domcontentloaded');
  await options.locator('[data-switch-rules-table]').waitFor({ state: 'visible', timeout: 20_000 });
  const reloadedSwitchRows = options.locator('[data-switch-rule-row]');
  assert.equal(
    await reloadedSwitchRows.nth(0).getByLabel('规则 1 的匹配内容').inputValue(),
    'second.drag.invalid',
  );
  assert.equal(
    await reloadedSwitchRows.nth(1).getByLabel('规则 2 的匹配内容').inputValue(),
    'first.drag.invalid',
  );

  await options.getByRole('button', { name: 'pac', exact: true }).click();
  const pacEditor = options.locator('[data-pac-profile-editor]');
  await pacEditor.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await pacEditor.getAttribute('data-typed-locale'), 'zh-CN');
  await pacEditor.getByRole('heading', { name: 'PAC 网址', exact: true }).waitFor();
  assert.doesNotMatch(await pacEditor.innerText(), /PAC URL|PAC Script|Proxy Authentication/u);
  const pacUrl = pacEditor.getByRole('textbox', { name: 'PAC 网址', exact: true });
  await pacUrl.fill(remotePacUrl);
  await pacUrl.press('Tab');
  const pacDownload = pacEditor.locator('[data-pac-source-update-now]');
  await assertEventually(
    async () => !(await pacDownload.isDisabled()),
    'PAC download button remained disabled after saving the URL',
  );
  await pacDownload.click();
  await pacEditor
    .locator('[data-pac-source-update-status]')
    .filter({ hasText: 'PAC 脚本下载时间' })
    .waitFor({ timeout: 20_000 });
  const pacScript = pacEditor.getByLabel('PAC 脚本', { exact: true });
  assert.equal(await pacScript.inputValue(), remotePacText);
  assert.equal(await pacScript.isEditable(), false);
  await pacUrl.fill(sourceEmptyUrl);
  await pacUrl.press('Tab');
  await assertEventually(
    async () => !(await pacDownload.isDisabled()),
    'PAC stable-error download button remained disabled',
  );
  await pacDownload.click();
  const pacFailureStatus = pacEditor.locator('[data-pac-source-update-status]');
  await pacFailureStatus.filter({ hasText: '下载内容为空' }).waitFor({ timeout: 20_000 });
  assert.match(await pacFailureStatus.innerText(), /已保留现有缓存脚本/u);
  assert.doesNotMatch(await pacFailureStatus.innerText(), /private response body|source-empty/u);
  assert.equal(await pacScript.inputValue(), remotePacText);
  const pacFailureRecord = await worker.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const state = (await chrome.storage.local.get(key))[key];
    return Object.values(state?.ruleSourceUpdates ?? {}).find((record) =>
      record?.sourceId?.startsWith('pac:'),
    )?.lastError;
  });
  assert.equal(pacFailureRecord?.code, 'response-empty');
  await pacEditor.getByRole('button', { name: '清空 PAC 网址', exact: true }).click();
  await assertEventually(
    async () => (await pacScript.isEditable()) && (await pacScript.inputValue()) === remotePacText,
    'Clearing PAC URL did not preserve the downloaded script as editable inline text',
  );
  await pacScript.fill(
    "function FindProxyForURL(url, host) { return 'PROXY proxy.invalid:8080'; }\n",
  );
  await pacScript.press('Tab');
  await pacEditor.locator('[data-pac-auth-action="edit"]').click();
  const pacAuthDialog = options.locator('[data-pac-auth-dialog]');
  await pacAuthDialog.waitFor({ state: 'visible', timeout: 20_000 });
  const pacAuthUsername = pacAuthDialog.getByLabel('PAC 代理登录用户名');
  await assertEventually(
    async () => pacAuthUsername.evaluate((element) => element === document.activeElement),
    'PAC authentication dialog did not focus the username field',
  );
  await pacAuthUsername.fill('pac-e2e-user');
  await pacAuthDialog.getByLabel('PAC 代理登录密码').fill('pac-e2e-secret');
  await pacAuthDialog.locator('[data-pac-auth-action="save"]').click();
  await pacAuthDialog.waitFor({ state: 'detached', timeout: 20_000 });
  await options.evaluate(() => {
    window.location.hash = '#/general';
  });
  const addPacQuickRoute = options.getByLabel('添加快速切换路由');
  await addPacQuickRoute.waitFor({ state: 'visible', timeout: 20_000 });
  await addPacQuickRoute.selectOption({ label: 'pac' });
  await options
    .locator('ol[aria-label="快速切换路由顺序"]')
    .getByText('pac', { exact: true })
    .waitFor({ state: 'visible', timeout: 20_000 });

  await options.getByRole('button', { name: 'rule-switchy', exact: true }).click();
  const independentRuleEditor = options.locator('[data-rule-list-profile-editor]');
  await independentRuleEditor.waitFor({ state: 'visible', timeout: 20_000 });
  await independentRuleEditor.getByRole('heading', { name: '规则列表设置', exact: true }).waitFor();
  assert.equal(await independentRuleEditor.getAttribute('data-typed-locale'), 'zh-CN');
  assert.doesNotMatch(
    await independentRuleEditor.innerText(),
    /Rule List Config|Rule List URL|Rule List Text/u,
  );
  assert.equal(
    await independentRuleEditor.getByLabel('规则列表匹配时使用的情景模式').inputValue(),
    await independentRuleEditor
      .getByLabel('规则列表匹配时使用的情景模式')
      .locator('option', { hasText: 'fixed' })
      .getAttribute('value'),
  );
  assert.equal(
    await independentRuleEditor.getByLabel('规则列表不匹配时使用的情景模式').inputValue(),
    'direct',
  );
  assert.equal(
    await independentRuleEditor.getByRole('radio', { name: 'Switchy' }).isChecked(),
    true,
  );
  const independentUrl = independentRuleEditor.getByRole('textbox', {
    name: '规则列表网址',
    exact: true,
  });
  await independentUrl.fill(remoteRuleUrl);
  await independentUrl.press('Tab');
  const independentDownload = independentRuleEditor.locator(
    '[data-independent-rule-source-update-now]',
  );
  await assertEventually(
    async () => !(await independentDownload.isDisabled()),
    'Independent Rule List download button remained disabled after saving the URL',
  );
  await independentDownload.click();
  const independentStatus = independentRuleEditor.locator(
    '[data-independent-rule-source-update-status]',
  );
  await independentStatus.filter({ hasText: '规则列表最后更新于' }).waitFor({ timeout: 20_000 });
  const independentText = independentRuleEditor.getByLabel('规则列表正文');
  assert.equal(await independentText.inputValue(), remoteRuleText);
  assert.equal(await independentText.isEditable(), false);
  await independentUrl.fill(sourceHttpErrorUrl);
  await independentUrl.press('Tab');
  await assertEventually(
    async () => !(await independentDownload.isDisabled()),
    'Rule Source stable-error download button remained disabled',
  );
  await independentDownload.click();
  await independentStatus
    .filter({ hasText: '服务器返回 HTTP 错误（503）' })
    .waitFor({ timeout: 20_000 });
  assert.match(await independentStatus.innerText(), /已保留现有缓存内容/u);
  assert.doesNotMatch(
    await independentStatus.innerText(),
    /private response body|source-http-error/u,
  );
  assert.equal(await independentText.inputValue(), remoteRuleText);
  const ruleFailureRecord = await worker.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const state = (await chrome.storage.local.get(key))[key];
    return Object.values(state?.ruleSourceUpdates ?? {}).find((record) =>
      record?.url?.endsWith('/source-http-error'),
    )?.lastError;
  });
  assert.deepEqual(
    { code: ruleFailureRecord?.code, httpStatus: ruleFailureRecord?.httpStatus },
    { code: 'response-http-error', httpStatus: 503 },
  );
  await independentRuleEditor.getByRole('button', { name: '清除规则列表网址' }).click();
  await assertEventually(
    async () =>
      (await independentRuleEditor
        .getByRole('textbox', { name: '规则列表网址', exact: true })
        .inputValue()) === '',
    'Clearing the independent Rule List URL did not return to inline mode',
  );
  assert.equal(await independentText.isEditable(), true);
  assert.equal(await independentText.inputValue(), remoteRuleText);
  await independentText.fill('[SwitchyOmega Conditions]\n@with result\n\n* +direct\n');
  await independentText.press('Tab');
  const independentApply = options.locator('.nav-group.actions button.primary');
  await assertEventually(
    async () => !(await independentApply.isDisabled()),
    'Independent Rule List changes did not reach the Options Draft',
  );
  await independentApply.click();
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const state = (await chrome.storage.local.get(key))[key];
        return (
          state !== undefined &&
          state.pendingApply === undefined &&
          JSON.stringify(state.draft) === JSON.stringify(state.applied)
        );
      }),
    'Independent Rule List Apply did not commit the Draft to Applied state',
    20_000,
  );

  const resultPopup = await context.newPage();
  await resultPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  assert.equal(
    await resultPopup.locator('.popup-shell').getAttribute('data-popup-locale'),
    'zh-CN',
  );
  assert.doesNotMatch(
    await resultPopup.locator('main').innerText(),
    /Loading applied profiles|Quick switching is disabled|No quick-switch routes|Result profile/u,
    'Popup typed locale coverage regressed',
  );
  const switchResult = resultPopup.getByLabel('switch 的结果情景模式');
  await switchResult.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await switchResult.inputValue(), 'direct');
  await switchResult.selectOption({ label: 'fixed' });
  await assertEventually(async () => {
    const resultStorage = await worker.evaluate(async () => chrome.storage.local.get(null));
    const workflow = resultStorage['zeroomega-nex/profile-workflow/v1/state'];
    const switchProfile = workflow?.applied?.profiles?.find((profile) => profile.name === 'switch');
    const proxyState = resultStorage['zeroomega-nex/browser-proxy/v1/state'];
    const activeSnapshot = proxyState?.activeSnapshotId
      ? resultStorage[`zeroomega-nex/browser-proxy/v1/snapshot/${proxyState.activeSnapshotId}`]
      : undefined;
    return (
      switchProfile?.defaultRoute?.kind === 'profile' &&
      workflow?.draft?.revision?.id === workflow?.applied?.revision?.id &&
      activeSnapshot?.startRoute?.kind === 'profile' &&
      activeSnapshot.startRoute.profileId === switchProfile.id
    );
  }, 'Popup result profile was not applied while preserving the active Switch route');
  await resultPopup.close().catch(() => undefined);

  const currentSiteUrl = 'https://www.dev.example.co.uk/current-site';
  await context.route(currentSiteUrl, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Current site</title>' }),
  );
  const currentSitePage = await context.newPage();
  await currentSitePage.goto(currentSiteUrl);
  await currentSitePage.bringToFront();
  const currentSiteTabId = await worker.evaluate(
    async () => (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id,
  );
  assert.equal(typeof currentSiteTabId, 'number', 'Current-site tab ID was not resolved');
  const temporaryPopup = await context.newPage();
  await temporaryPopup.goto(
    `chrome-extension://${extensionId}/popup.html?activeTabId=${currentSiteTabId}`,
  );
  const historyRollbackTarget = await assertEventuallyValue(async () => {
    return worker.evaluate(async () => {
      const storage = await chrome.storage.local.get(null);
      const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
      const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
      const snapshotId = proxyState?.activeSnapshotId;
      if (
        !workflow ||
        typeof snapshotId !== 'string' ||
        snapshotId.startsWith('popup-temporary-v1/')
      ) {
        return undefined;
      }
      const snapshot = storage[`zeroomega-nex/browser-proxy/v1/snapshot/${snapshotId}`];
      if (!snapshot || snapshot.sourceRevisionId !== workflow.applied.revision.id) return undefined;
      return {
        snapshotId,
        sourceRevisionId: snapshot.sourceRevisionId,
        startRoute: snapshot.startRoute,
      };
    });
  }, 'Verified rollback target was not available before temporary-rule evidence');

  const temporarySelect = temporaryPopup.getByLabel('example.co.uk 的临时情景模式');
  await temporarySelect.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await temporarySelect.inputValue(), '');
  await temporarySelect.selectOption({ label: 'fixed' });
  await assertEventually(async () => {
    const [local, session] = await worker.evaluate(async () =>
      Promise.all([chrome.storage.local.get(null), chrome.storage.session.get(null)]),
    );
    const temporaryState = session['zeroomega-nex/popup-temporary-rules/v1/state'];
    const proxyState = local['zeroomega-nex/browser-proxy/v1/state'];
    const snapshotId = proxyState?.activeSnapshotId;
    const sessionSnapshotKey = snapshotId
      ? `zeroomega-nex/browser-proxy/v1/session-snapshot/${snapshotId}`
      : '';
    return (
      temporaryState?.rules?.[0]?.domain === 'example.co.uk' &&
      temporaryState.rules[0].route?.kind === 'profile' &&
      typeof snapshotId === 'string' &&
      snapshotId.startsWith('popup-temporary-v1/') &&
      local[`zeroomega-nex/browser-proxy/v1/snapshot/${snapshotId}`] === undefined &&
      session[sessionSnapshotKey]?.snapshotId === snapshotId
    );
  }, 'Popup temporary rule was not stored only in the browser session');
  await temporaryPopup.close().catch(() => undefined);

  const conditionPopup = await context.newPage();
  await conditionPopup.goto(
    `chrome-extension://${extensionId}/popup.html?activeTabId=${currentSiteTabId}`,
  );
  const addCurrentSite = conditionPopup.locator('[data-popup-add-current-site]');
  await addCurrentSite.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await addCurrentSite.innerText(), /example\.co\.uk/u);
  await addCurrentSite.click();
  const conditionForm = conditionPopup.locator('[data-popup-condition-form]');
  await conditionForm.waitFor();
  assert.equal(
    await conditionForm.getByLabel('当前网站条件匹配内容').inputValue(),
    '*.example.co.uk',
  );
  await conditionForm.getByLabel('当前网站结果情景模式').selectOption({ label: 'fixed' });
  await conditionForm.getByRole('button', { name: '添加条件', exact: true }).click();
  await assertEventually(async () => {
    const popupStorage = await worker.evaluate(async () => chrome.storage.local.get(null));
    const workflow = popupStorage['zeroomega-nex/profile-workflow/v1/state'];
    const switchProfile = workflow?.applied?.profiles?.find((profile) => profile.name === 'switch');
    return (
      switchProfile?.rules?.[0]?.condition?.kind === 'host-wildcard' &&
      switchProfile.rules[0].condition.pattern === '*.example.co.uk'
    );
  }, 'Popup current-site condition was not applied at the top of the active Switch Profile');
  const popupRuntime = await worker.evaluate(async () => chrome.storage.local.get(null));
  const popupWorkflow = popupRuntime['zeroomega-nex/profile-workflow/v1/state'];
  assert.equal(popupWorkflow.applied.revision.id, popupWorkflow.draft.revision.id);
  assert.match(
    popupRuntime['zeroomega-nex/browser-proxy/v1/state']?.activeSnapshotId ?? '',
    /^popup-temporary-v1\//u,
    'Permanent Popup Apply did not preserve the temporary overlay',
  );
  await conditionPopup.close().catch(() => undefined);

  const temporaryManager = await context.newPage();
  await temporaryManager.goto(`chrome-extension://${extensionId}/temp-rules.html`);
  const temporaryRulesShell = temporaryManager.locator(
    '[data-temp-rules-manager][data-typed-locale="zh-CN"]',
  );
  await temporaryRulesShell.waitFor({ state: 'visible', timeout: 20_000 });
  await temporaryManager.getByRole('heading', { name: '临时规则', exact: true }).waitFor();
  assert.doesNotMatch(
    await temporaryRulesShell.innerText(),
    /Temporary Rules|Delete all temporary rules|Result profile/u,
    'Temporary Rules typed locale coverage regressed',
  );
  const temporaryRow = temporaryManager.locator('[data-temp-rule-domain="example.co.uk"]');
  await temporaryRow.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await temporaryRow.innerText(), /fixed/u);
  await temporaryRow.getByRole('button', { name: '删除 example.co.uk 的临时规则' }).click();
  await assertEventually(async () => {
    const [local, session] = await worker.evaluate(async () =>
      Promise.all([chrome.storage.local.get(null), chrome.storage.session.get(null)]),
    );
    const temporaryState = session['zeroomega-nex/popup-temporary-rules/v1/state'];
    return (
      temporaryState?.overlayActive === true &&
      Array.isArray(temporaryState.rules) &&
      temporaryState.rules.length === 0 &&
      String(local['zeroomega-nex/browser-proxy/v1/state']?.activeSnapshotId ?? '').startsWith(
        'popup-temporary-v1/',
      )
    );
  }, 'Deleting the final temporary rule did not retain the original empty overlay');

  const temporaryCleanup = await temporaryManager.evaluate(async () => {
    const channel = 'zeroomega-nex/profile-workflow/v1';
    const current = await chrome.runtime.sendMessage({ channel, action: 'get' });
    if (current?.ok !== true) return { stage: 'get', response: current };

    let state = current.state;
    const draft = structuredClone(state.draft);
    const hasSystemRoute = draft.settings.quickSwitch.routes.some(
      (route) => route.kind === 'system',
    );
    if (!hasSystemRoute) {
      draft.settings.quickSwitch.routes.push({ kind: 'system' });
      const replaced = await chrome.runtime.sendMessage({
        channel,
        action: 'replace-draft',
        expectedGeneration: state.generation,
        draft,
      });
      if (replaced?.ok !== true) return { stage: 'replace-draft', response: replaced };
      const applied = await chrome.runtime.sendMessage({
        channel,
        action: 'apply',
        expectedGeneration: replaced.state.generation,
      });
      if (applied?.ok !== true) return { stage: 'apply', response: applied };
      state = applied.state;
    }

    const activated = await chrome.runtime.sendMessage({
      channel,
      action: 'activate-route',
      expectedAppliedRevisionId: state.applied.revision.id,
      route: { kind: 'system' },
    });
    return { stage: 'activate-route', response: activated };
  });
  assert.equal(
    temporaryCleanup?.response?.ok,
    true,
    `System cleanup after temporary-rule evidence failed at ${temporaryCleanup?.stage}: ${JSON.stringify(temporaryCleanup?.response)}`,
  );
  await assertEventually(async () => {
    const local = await worker.evaluate(async () => chrome.storage.local.get(null));
    return !String(
      local['zeroomega-nex/browser-proxy/v1/state']?.activeSnapshotId ?? '',
    ).startsWith('popup-temporary-v1/');
  }, 'System cleanup did not leave the temporary overlay');
  await temporaryManager.close();

  const diagnosticsPage = await context.newPage();
  await diagnosticsPage.goto(
    `chrome-extension://${extensionId}/network.html?tabId=${currentSiteTabId}`,
  );
  const diagnosticsShell = diagnosticsPage.locator(
    '[data-network-diagnostics][data-typed-locale="zh-CN"]',
  );
  await diagnosticsShell.waitFor({ state: 'visible', timeout: 20_000 });
  await diagnosticsPage.getByRole('heading', { name: '请求诊断', exact: true }).waitFor();
  await diagnosticsPage.getByRole('button', { name: '开始监控', exact: true }).waitFor();
  assert.doesNotMatch(
    await diagnosticsShell.innerText(),
    /Request diagnostics|Start monitoring|Clear diagnostics|No request errors recorded/u,
    'Network typed locale coverage regressed',
  );
  const diagnosticsStart = diagnosticsPage.locator('[data-request-diagnostics-start]');
  await diagnosticsStart.waitFor({ state: 'visible', timeout: 20_000 });
  await diagnosticsStart.click();
  await assertEventually(
    async () => (await diagnosticsPage.locator('[data-request-diagnostics-stop]').count()) === 1,
    'Request diagnostics did not start after the explicit user gesture',
  );
  await currentSitePage.goto(`http://127.0.0.1:${ruleAddress.port}/diagnostic-page`);
  const diagnosticErrorUrl = `http://127.0.0.1:${ruleAddress.port}/diagnostic-error?token=private#fragment`;
  await currentSitePage.evaluate(async (url) => {
    await fetch(url).catch(() => undefined);
  }, diagnosticErrorUrl);
  const diagnosticsTable = diagnosticsPage.locator('[data-request-diagnostics-table]');
  await diagnosticsTable.waitFor({ state: 'visible', timeout: 20_000 });
  const diagnosticsText = await diagnosticsTable.innerText();
  assert.match(diagnosticsText, /diagnostic-error/u);
  assert.doesNotMatch(diagnosticsText, /token=private|fragment/u);
  const diagnosticsPopup = await context.newPage();
  await diagnosticsPopup.goto(
    `chrome-extension://${extensionId}/popup.html?activeTabId=${currentSiteTabId}`,
  );
  const diagnosticsSummary = diagnosticsPopup.locator('[data-popup-request-diagnostics]');
  await diagnosticsSummary.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await diagnosticsSummary.innerText(), /请求错误/u);
  await diagnosticsPopup.close();
  await diagnosticsPage.locator('[data-request-diagnostics-clear]').click();
  await diagnosticsPage.getByText('没有记录到请求错误。').waitFor({ timeout: 20_000 });
  await diagnosticsPage.locator('[data-request-diagnostics-stop]').click();
  await diagnosticsPage.locator('[data-request-diagnostics-stopped]').waitFor();
  await diagnosticsPage.close();

  await currentSitePage.close();
  await options.bringToFront();

  await options.getByRole('button', { name: 'switch', exact: true }).click();
  const attachRuleList = options.getByRole('button', { name: /添加规则列表/u });
  try {
    await attachRuleList.waitFor({ state: 'visible', timeout: 15_000 });
  } catch (error) {
    console.error(`[Scheduler Switch body] ${await options.locator('body').innerText()}`);
    console.error(
      `[Scheduler Switch alerts] ${JSON.stringify(await options.getByRole('alert').allInnerTexts())}`,
    );
    console.error(
      `[Scheduler Switch storage] ${JSON.stringify(await worker.evaluate(async () => chrome.storage.local.get(null)))}`,
    );
    throw error;
  }
  await attachRuleList.click();
  const attachedRow = options.locator('[data-attached-rule-list-row]');
  await attachedRow.waitFor();
  assert.equal(
    await options.getByRole('button', { name: '__ruleListOf_switch', exact: true }).count(),
    0,
  );
  const attachedEnabled = attachedRow.getByRole('checkbox', { name: '规则列表规则' });
  assert.equal(await attachedEnabled.isChecked(), true);
  await attachedEnabled.uncheck();
  assert.equal(await attachedEnabled.isChecked(), false);
  await attachedEnabled.check();
  await attachedRow.getByLabel('规则列表匹配时使用的情景模式').selectOption('system');
  const attachedConfig = options.locator('[data-attached-rule-list-config]');
  await attachedConfig.waitFor();
  const attachedText = attachedConfig.getByLabel('附属规则列表正文');
  await attachedText.fill('[AutoProxy 0.2.9]\n||attached.example.invalid');
  await attachedText.press('Tab');
  const attachedHeaders = options.locator('[data-attached-rule-list-headers]');
  const addHeader = attachedHeaders.locator('button').filter({ hasText: '添加请求头' });
  await assertEventually(
    async () => !(await addHeader.isDisabled()),
    'Attached Rule List header button remained disabled after saving text',
  );
  const headerDetails = attachedHeaders.locator('details');
  if (!(await headerDetails.evaluate((element) => element.open))) {
    await headerDetails.locator('summary').click();
  }
  await addHeader.click();
  await assertEventually(
    async () => (await attachedHeaders.locator('.header-row').count()) === 1,
    'Attached Rule List did not create a blank request-header row',
  );
  if (!(await headerDetails.evaluate((element) => element.open))) {
    await headerDetails.locator('summary').click();
  }
  const attachedHeaderName = attachedHeaders.locator('input[aria-label="附属请求头 1 名称"]');
  const attachedHeaderValue = attachedHeaders.locator('input[aria-label="附属请求头 1 值"]');
  await attachedHeaderName.fill('X-E2E');
  await attachedHeaderName.press('Tab');
  await attachedHeaderValue.fill('attached');
  await attachedHeaderValue.press('Tab');

  const sourceType = attachedConfig.getByLabel('附属规则列表来源类型');
  await assertEventually(
    async () => !(await sourceType.isDisabled()),
    'Attached Rule List source type remained disabled after saving headers',
  );
  await sourceType.selectOption('url');
  const sourceUrl = attachedConfig.getByLabel('附属规则列表网址');
  await sourceUrl.waitFor();
  await sourceUrl.fill(remoteRuleUrl);
  await sourceUrl.press('Tab');
  const downloadNow = attachedConfig.locator('[data-rule-source-update-now]');
  await assertEventually(
    async () => !(await downloadNow.isDisabled()),
    'Rule Source download button remained disabled after saving the URL',
  );
  await downloadNow.click();
  const ruleUpdateStatus = options.locator('[data-rule-source-update-status]');
  try {
    await ruleUpdateStatus.filter({ hasText: '规则列表最后更新于' }).waitFor({ timeout: 20_000 });
  } catch (error) {
    console.error(`[Rule Source update status] ${await ruleUpdateStatus.innerText()}`);
    console.error(
      `[Rule Source alerts] ${JSON.stringify(await options.getByRole('alert').allInnerTexts())}`,
    );
    console.error(`[Rule Source server header] ${receivedRuleHeader || '<none>'}`);
    const updateStorage = await worker.evaluate(async () => chrome.storage.local.get(null));
    console.error(`[Rule Source storage] ${JSON.stringify(updateStorage)}`);
    throw error;
  }
  assert.equal(
    await attachedConfig.getByLabel('附属规则列表已下载正文').inputValue(),
    remoteRuleText,
  );
  assert.equal(receivedRuleHeader, 'attached');

  const scheduledRuleText = '[AutoProxy 0.2.9]\n||scheduled.e2e.invalid';
  remoteRuleText = scheduledRuleText;
  await worker.evaluate(
    async ({ sourceUrl, alarmName }) => {
      const key = 'zeroomega-nex/profile-workflow/v1/state';
      const values = await chrome.storage.local.get(key);
      const state = values[key];
      const source = state?.draft?.ruleSources?.find(
        (candidate) => candidate.location?.kind === 'url' && candidate.location.url === sourceUrl,
      );
      if (!state || !source) throw new Error('Scheduled Rule Source fixture was not found');
      const update = state.ruleSourceUpdates?.[source.id];
      if (!update) throw new Error('Scheduled Rule Source update record was not found');
      update.lastAttemptAt = '2000-01-01T00:00:00.000Z';
      update.lastSuccessAt = '2000-01-01T00:00:00.000Z';
      delete update.lastError;
      await chrome.storage.local.set({ [key]: state });
      chrome.alarms.create(alarmName, { when: Date.now() + 250 });
    },
    {
      sourceUrl: remoteRuleUrl,
      alarmName: 'zeroomega-nex/rule-source-update-scan',
    },
  );
  await assertEventually(
    async () =>
      worker.evaluate(
        async ({ sourceUrl, expected }) => {
          const key = 'zeroomega-nex/profile-workflow/v1/state';
          const values = await chrome.storage.local.get(key);
          const source = values[key]?.draft?.ruleSources?.find(
            (candidate) =>
              candidate.location?.kind === 'url' && candidate.location.url === sourceUrl,
          );
          return source?.location?.content === expected;
        },
        { sourceUrl: remoteRuleUrl, expected: scheduledRuleText },
      ),
    'Scheduled Rule Source alarm did not refresh due cached content',
    20_000,
  );
  assert.equal(ruleRequestCount >= 2, true);
  assert.equal(receivedRuleHeader, 'attached');

  options.once('dialog', (dialog) => dialog.accept());
  await attachedRow.getByRole('button', { name: '移除规则列表' }).click();
  await attachRuleList.waitFor();
  assert.equal(await options.locator('[data-attached-rule-list-row]').count(), 0);

  const revertedDraft = await options.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(key))[key];
    if (!workflow) throw new Error('Workflow state is unavailable before History rollback E2E');
    if (workflow.draft.revision.id === workflow.applied.revision.id) return { ok: true };
    return chrome.runtime.sendMessage({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'revert',
      expectedGeneration: workflow.generation,
    });
  });
  assert.equal(revertedDraft?.ok, true, 'Draft could not be reverted before History rollback E2E');
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return workflow?.draft?.revision?.id === workflow?.applied?.revision?.id;
      }),
    'Draft remained dirty before History rollback E2E',
  );

  const rawPacActivation = await options.evaluate(async () => {
    const workflowKey = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(workflowKey))[workflowKey];
    const pac = workflow?.applied?.profiles?.find((profile) => profile.name === 'pac');
    if (!workflow || !pac || pac.kind !== 'pac') throw new Error('Applied PAC profile is missing');
    const response = await chrome.runtime.sendMessage({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: workflow.applied.revision.id,
      route: { kind: 'profile', profileId: pac.id },
    });
    return {
      response,
      profileId: pac.id,
      secretRef: pac.credential?.passwordSecretRef,
      quickSwitchRoutes: workflow.applied.settings.quickSwitch.routes,
      appliedRevisionId: workflow.applied.revision.id,
      draftRevisionId: workflow.draft.revision.id,
    };
  });
  if (rawPacActivation.response?.ok !== true) {
    console.error(`[Raw PAC activation diagnostics] ${JSON.stringify(rawPacActivation)}`);
  }
  assert.equal(
    rawPacActivation.response?.ok,
    true,
    `Top-level raw PAC activation was rejected: ${JSON.stringify(rawPacActivation.response)}`,
  );
  assert.doesNotMatch(JSON.stringify(rawPacActivation.response), /pac-e2e-secret/u);
  await assertEventually(
    async () => {
      const storage = await worker.evaluate(async () => chrome.storage.local.get(null));
      const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
      const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
      const snapshot = proxyState?.activeSnapshotId
        ? storage[`zeroomega-nex/browser-proxy/v1/snapshot/${proxyState.activeSnapshotId}`]
        : undefined;
      const bindings = storage['zeroomega-nex/proxy-auth/v1/bindings'];
      const secret = rawPacActivation.secretRef
        ? storage[`zeroomega-nex/proxy-auth/v1/secret/${rawPacActivation.secretRef}`]
        : undefined;
      return (
        snapshot?.compilerVersion === 'raw-pac/1' &&
        snapshot?.verification?.mode === 'structural' &&
        snapshot?.startRoute?.kind === 'profile' &&
        snapshot.startRoute.profileId === rawPacActivation.profileId &&
        snapshot.script.includes("return 'PROXY proxy.invalid:8080'") &&
        Array.isArray(bindings) &&
        bindings.length === 1 &&
        bindings[0]?.scope === 'all-proxies' &&
        bindings[0]?.profileId === rawPacActivation.profileId &&
        bindings[0]?.username === 'pac-e2e-user' &&
        secret === 'pac-e2e-secret' &&
        !JSON.stringify(workflow).includes('pac-e2e-secret')
      );
    },
    'Raw PAC snapshot, all-proxy binding, or isolated secret was not installed',
    20_000,
  );

  await options.bringToFront();
  await options.getByRole('button', { name: '配置历史', exact: true }).click();
  const historyPanel = options.locator('[data-snapshot-history-panel]');
  await historyPanel.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await historyPanel.getAttribute('data-typed-locale'), 'zh-CN');
  const verifiedSnapshotsHeading = historyPanel.getByRole('heading', {
    name: '已验证的 PAC 快照',
    exact: true,
  });
  try {
    await verifiedSnapshotsHeading.waitFor({ timeout: 8_000 });
  } catch (error) {
    const loadAlert = historyPanel.getByRole('alert');
    if ((await loadAlert.count()) === 0) throw error;
    await historyPanel.getByRole('button', { name: '刷新历史', exact: true }).click();
    await verifiedSnapshotsHeading.waitFor({ timeout: 20_000 });
  }
  assert.doesNotMatch(
    await historyPanel.innerText(),
    /Configuration history|Verified PAC snapshots/u,
  );
  const rollbackEntry = historyPanel.locator(
    `[data-snapshot-history-entry="${historyRollbackTarget.snapshotId}"]`,
  );
  await rollbackEntry.waitFor({ state: 'visible', timeout: 20_000 });
  await rollbackEntry
    .locator(`[data-snapshot-rollback-request="${historyRollbackTarget.snapshotId}"]`)
    .click();
  const rollbackDialog = historyPanel.locator(
    `[data-snapshot-rollback-dialog="${historyRollbackTarget.snapshotId}"]`,
  );
  await rollbackDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await rollbackDialog.getByText('确认回滚快照', { exact: true }).waitFor();
  await rollbackDialog
    .locator(`[data-snapshot-rollback-confirm="${historyRollbackTarget.snapshotId}"]`)
    .click();
  await assertEventually(
    async () => {
      const state = await worker.evaluate(async () => {
        const storage = await chrome.storage.local.get(null);
        const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
        const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
        return {
          activeSnapshotId: proxyState?.activeSnapshotId,
          appliedRevisionId: workflow?.applied?.revision?.id,
          draftRevisionId: workflow?.draft?.revision?.id,
        };
      });
      return (
        state.activeSnapshotId === historyRollbackTarget.snapshotId &&
        state.appliedRevisionId === historyRollbackTarget.sourceRevisionId &&
        state.draftRevisionId === historyRollbackTarget.sourceRevisionId
      );
    },
    'History rollback did not restore browser state and both workflow revisions',
    20_000,
  );
  await assertEventually(
    async () => (await rollbackEntry.getAttribute('data-snapshot-active')) === 'true',
    'History UI did not mark the restored snapshot active',
  );

  virtualContext = await chromium.launchPersistentContext(virtualUserDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let [virtualWorker] = virtualContext.serviceWorkers();
  virtualWorker ??= await virtualContext.waitForEvent('serviceworker', { timeout: 15_000 });
  const virtualOptions = await virtualContext.newPage();
  await virtualOptions.goto(`chrome-extension://${extensionId}/options.html`);
  await virtualOptions.waitForLoadState('domcontentloaded');
  await virtualOptions.locator('[data-new-profile-action]').waitFor({ timeout: 20_000 });
  await virtualOptions.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  const onlineRestoreBefore = await virtualWorker.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(key))[key];
    return {
      generation: workflow?.generation,
      applied: JSON.stringify(workflow?.applied),
      draft: JSON.stringify(workflow?.draft),
    };
  });
  const onlineBackupInput = virtualOptions.getByLabel('在线备份网址', { exact: true });
  await onlineBackupInput.fill(onlineBackupUrl);
  await virtualOptions.locator('[data-legacy-online-download]').click();
  await virtualOptions
    .locator('[data-legacy-online-status]')
    .filter({ hasText: '备份已下载。请先检查兼容性，再决定是否导入。' })
    .waitFor({ timeout: 20_000 });
  await virtualOptions.getByRole('heading', { name: '兼容性检查', exact: true }).waitFor();
  assert.equal(onlineBackupRequestCount, 1, 'Chromium online restore did not perform one request');
  const onlineRestoreAfter = await virtualWorker.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(key))[key];
    return {
      generation: workflow?.generation,
      applied: JSON.stringify(workflow?.applied),
      draft: JSON.stringify(workflow?.draft),
    };
  });
  assert.deepEqual(
    onlineRestoreAfter,
    onlineRestoreBefore,
    'Downloading an online backup changed the Chromium workflow before explicit import',
  );
  assert.equal(
    await virtualOptions.getByText('导入完成，原版配置现已启用。').count(),
    0,
    'Online review activated the backup without the explicit import action',
  );
  await virtualOptions.getByLabel('原版备份文件').setInputFiles(virtualMigrationBackupPath);
  await virtualOptions.getByRole('heading', { name: '兼容性检查', exact: true }).waitFor();
  await virtualOptions.locator('.import-actions button.primary').click();
  await virtualOptions
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  await virtualOptions.getByRole('button', { name: 'Route Matrix', exact: true }).click();
  const [modernRuleDownload] = await Promise.all([
    virtualOptions.waitForEvent('download'),
    virtualOptions.locator('[data-profile-export-rule-list]').click(),
  ]);
  assert.equal(modernRuleDownload.suggestedFilename(), 'OmegaRules_Route_Matrix.sorl');
  const modernRulePath = await modernRuleDownload.path();
  assert.ok(modernRulePath, 'Modern Rule List download path was not available');
  const modernRuleExport = await readFile(modernRulePath, 'utf8');
  await virtualOptions
    .locator('[data-profile-export-status]')
    .filter({ hasText: '已导出 OmegaRules_Route_Matrix.sorl。' })
    .waitFor({ timeout: 20_000 });
  assert.match(modernRuleExport, /\[SwitchyOmega Conditions\]/u);
  assert.match(modernRuleExport, /; Require: ZeroOmega >= 2\.3\.2/u);
  assert.match(modernRuleExport, /\*\.virtual-migration\.invalid \+Target Proxy/u);

  await virtualOptions.locator('[data-interface-action]').click();
  await virtualOptions.locator('[data-export-legacy-rule-list-setting]').check();
  await virtualOptions.getByRole('button', { name: 'Route Matrix', exact: true }).click();
  const [legacyRuleDownload] = await Promise.all([
    virtualOptions.waitForEvent('download'),
    virtualOptions.locator('[data-profile-export-rule-list]').click(),
  ]);
  assert.equal(legacyRuleDownload.suggestedFilename(), 'SwitchyRules_Route_Matrix.ssrl');
  const legacyRulePath = await legacyRuleDownload.path();
  assert.ok(legacyRulePath, 'Legacy Rule List download path was not available');
  const legacyRuleExport = await readFile(legacyRulePath, 'utf8');
  assert.match(legacyRuleExport, /; Summary: Proxy Switchy! Exported Rule List/u);
  assert.match(legacyRuleExport, /@\*:\/\/\*\.virtual-migration\.invalid\/\*/u);

  await virtualOptions.locator('[data-interface-action]').click();
  await virtualOptions.locator('[data-show-advanced-conditions-setting]').check();
  await virtualOptions.getByRole('button', { name: 'Route Matrix', exact: true }).click();
  const warnedRuleExport = virtualOptions.locator('[data-profile-export-rule-list]');
  assert.equal(
    await warnedRuleExport.getAttribute('data-profile-export-rule-list-warning'),
    'true',
  );
  const [fallbackRuleDownload] = await Promise.all([
    virtualOptions.waitForEvent('download'),
    warnedRuleExport.click(),
  ]);
  assert.equal(fallbackRuleDownload.suggestedFilename(), 'OmegaRules_Route_Matrix.sorl');

  await virtualOptions.getByRole('button', { name: 'Target Proxy', exact: true }).click();
  const [generatedPacDownload] = await Promise.all([
    virtualOptions.waitForEvent('download'),
    virtualOptions.locator('[data-profile-export-pac]').click(),
  ]);
  assert.equal(generatedPacDownload.suggestedFilename(), 'OmegaProfile_Target_Proxy.pac');
  const generatedPacPath = await generatedPacDownload.path();
  assert.ok(generatedPacPath, 'Generated PAC download path was not available');
  const generatedPacExport = await readFile(generatedPacPath, 'utf8');
  assert.match(generatedPacExport, /function FindProxyForURL/u);
  assert.match(generatedPacExport, /PROXY target\.proxy\.invalid:8080/u);

  await virtualOptions.getByRole('button', { name: 'PAC Matrix', exact: true }).click();
  const [rawPacDownload] = await Promise.all([
    virtualOptions.waitForEvent('download'),
    virtualOptions.locator('[data-profile-export-pac]').click(),
  ]);
  assert.equal(rawPacDownload.suggestedFilename(), 'OmegaProfile_PAC_Matrix.pac');
  const rawPacPath = await rawPacDownload.path();
  assert.ok(rawPacPath, 'Raw PAC download path was not available');
  assert.equal(
    await readFile(rawPacPath, 'utf8'),
    "function FindProxyForURL(url, host) { return 'DIRECT'; }\n",
  );

  await virtualOptions.getByRole('button', { name: 'Auto Matrix', exact: true }).click();
  await virtualOptions.getByRole('heading', { name: 'Auto Matrix', exact: true }).waitFor();
  const autoDetectEditor = virtualOptions.locator(
    '[data-auto-detect-profile-editor][data-typed-locale="zh-CN"]',
  );
  await autoDetectEditor.waitFor({ state: 'visible', timeout: 20_000 });
  await autoDetectEditor.getByRole('heading', { name: '自动检测情景模式', exact: true }).waitFor();
  const autoDetectFallback = autoDetectEditor.getByLabel('自动检测失败时使用的情景模式', {
    exact: true,
  });
  assert.equal(await autoDetectFallback.locator('option:checked').innerText(), 'Target Proxy');
  assert.doesNotMatch(
    await autoDetectEditor.innerText(),
    /Browser auto-detection support|Fallback route|No fallback/u,
    'Auto Detect typed locale coverage regressed',
  );
  assert.equal(await virtualOptions.locator('[data-profile-export-pac]').count(), 0);

  await virtualOptions.getByRole('button', { name: 'Target Proxy', exact: true }).click();
  await virtualOptions.locator('[data-profile-delete-action]').click();
  const blockedDeletion = virtualOptions.locator(
    '[data-profile-deletion-dialog][data-profile-deletion-mode="blocked"]',
  );
  await blockedDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  await blockedDeletion.getByRole('heading', { name: '情景模式无法删除', exact: true }).waitFor();
  assert.equal(await blockedDeletion.getAttribute('data-typed-locale'), 'zh-CN');
  assert.match(await blockedDeletion.innerText(), /自动切换情景模式/u);
  await assertEventually(
    async () =>
      blockedDeletion
        .locator('[data-profile-deletion-close]')
        .evaluate((element) => element === document.activeElement),
    'Blocked deletion dialog did not focus its Close action',
  );
  const blockerNames = await blockedDeletion
    .locator('[data-profile-deletion-blocker] strong')
    .allTextContents();
  assert.deepEqual(blockerNames.sort(), [
    'Auto Matrix',
    'Existing Alias',
    'PAC Matrix',
    'Route Matrix',
    'Rule Matrix',
  ]);
  assert.equal(await blockedDeletion.locator('[data-profile-deletion-confirm]').count(), 0);
  await blockedDeletion.locator('[data-profile-deletion-close]').click();
  assert.equal(
    await virtualOptions.getByRole('button', { name: 'Target Proxy', exact: true }).count(),
    1,
  );

  await virtualOptions.locator('[data-new-profile-action]').click();
  const newProfileShell = virtualOptions.locator(
    '[data-new-profile-shell][data-typed-locale="zh-CN"]',
  );
  await newProfileShell
    .getByText('按照原版 ZeroOmega 流程创建情景模式。', { exact: true })
    .waitFor();
  const newVirtualDialog = virtualOptions.locator('.new-profile-dialog');
  await newVirtualDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await newVirtualDialog.getByRole('heading', { name: '新建情景模式', exact: true }).waitFor();
  assert.equal(await newVirtualDialog.getAttribute('data-typed-locale'), 'zh-CN');
  assert.match(await newVirtualDialog.innerText(), /请选择情景模式的类型/u);
  assert.doesNotMatch(await newVirtualDialog.innerText(), /New Profile|Profile type/u);
  const newVirtualName = newVirtualDialog.locator('[data-new-profile-name-input]');
  await assertEventually(
    async () => newVirtualName.evaluate((element) => element === document.activeElement),
    'New Profile dialog did not focus the profile-name field',
  );
  await newVirtualName.fill('Stable Alias');
  await newVirtualDialog.locator('[data-new-profile-kind="virtual"]').check();
  await newVirtualDialog.locator('[data-new-profile-create]').click();
  const virtualEditor = virtualOptions.locator(
    '[data-virtual-profile-editor][data-typed-locale="zh-CN"]',
  );
  await virtualEditor.waitFor({ state: 'visible', timeout: 20_000 });
  await virtualEditor.getByRole('heading', { name: '目标情景模式', exact: true }).waitFor();
  await virtualEditor.getByRole('heading', { name: '迁移到虚拟情景模式', exact: true }).waitFor();
  assert.doesNotMatch(
    await virtualEditor.innerText(),
    /Target profile|Migrate to Virtual Profile|Replace target profile/u,
    'Virtual Profile typed locale coverage regressed',
  );
  const virtualTarget = virtualEditor.getByLabel('虚拟情景模式目标', { exact: true });
  await virtualTarget.selectOption({ label: 'Target Proxy' });
  const virtualIds = await assertEventuallyValue(async () => {
    return virtualWorker.evaluate(async () => {
      const key = 'zeroomega-nex/profile-workflow/v1/state';
      const workflow = (await chrome.storage.local.get(key))[key];
      const target = workflow?.draft?.profiles?.find((profile) => profile.name === 'Target Proxy');
      const alias = workflow?.draft?.profiles?.find((profile) => profile.name === 'Stable Alias');
      if (
        target?.kind !== 'fixed' ||
        alias?.kind !== 'virtual' ||
        alias.targetRoute?.kind !== 'profile' ||
        alias.targetRoute.profileId !== target.id
      ) {
        return undefined;
      }
      return { targetId: target.id, aliasId: alias.id };
    });
  }, 'Virtual target selection did not reach the Draft');

  virtualOptions.once('dialog', async (dialog) => {
    assert.match(dialog.message(), /替换情景模式引用前，先应用当前更改吗/u);
    await dialog.accept();
  });
  await virtualOptions.locator('[data-virtual-replace]').click();
  const replacementDialog = virtualOptions.locator('[data-profile-replacement-dialog]');
  await replacementDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await replacementDialog.getByRole('heading', { name: '替换情景模式', exact: true }).waitFor();
  assert.equal(await replacementDialog.getAttribute('data-typed-locale'), 'zh-CN');
  await replacementDialog.getByLabel('要被替换的情景模式', { exact: true }).waitFor();
  await replacementDialog.getByLabel('用于替换的情景模式', { exact: true }).waitFor();
  const replacementFrom = replacementDialog.locator('[data-profile-replacement-from]');
  const replacementTo = replacementDialog.locator('[data-profile-replacement-to]');
  assert.equal(await replacementFrom.inputValue(), virtualIds.targetId);
  assert.equal(await replacementTo.inputValue(), virtualIds.aliasId);
  await assertEventually(
    async () =>
      virtualWorker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow !== undefined &&
          workflow.pendingApply === undefined &&
          JSON.stringify(workflow.draft) === JSON.stringify(workflow.applied)
        );
      }),
    'Profile replacement dialog opened before the dirty Draft was applied',
    20_000,
  );
  await replacementFrom.selectOption({ label: 'Unrelated Proxy' });
  assert.match(
    await replacementDialog.locator('[data-profile-replacement-preview]').innerText(),
    /Unrelated Proxy/u,
  );
  await replacementFrom.selectOption(virtualIds.targetId);
  await replacementTo.selectOption({ label: 'Existing Alias' });
  assert.match(
    await replacementDialog.locator('[data-profile-replacement-preview]').innerText(),
    /Existing Alias/u,
  );
  await replacementTo.selectOption(virtualIds.aliasId);
  await replacementDialog.locator('[data-profile-replacement-confirm]').click();
  await assertEventually(
    async () =>
      virtualWorker.evaluate(async ({ targetId, aliasId }) => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        const draft = workflow?.draft;
        if (!draft) return false;
        const routeMatches = (route) => route?.kind === 'profile' && route.profileId === aliasId;
        const target = draft.profiles.find((profile) => profile.id === targetId);
        const alias = draft.profiles.find((profile) => profile.id === aliasId);
        const routeMatrix = draft.profiles.find((profile) => profile.name === 'Route Matrix');
        const ruleMatrix = draft.profiles.find((profile) => profile.name === 'Rule Matrix');
        const pacMatrix = draft.profiles.find((profile) => profile.name === 'PAC Matrix');
        const autoMatrix = draft.profiles.find((profile) => profile.name === 'Auto Matrix');
        const existingAlias = draft.profiles.find((profile) => profile.name === 'Existing Alias');
        const aliasQuickRoutes = draft.settings.quickSwitch.routes.filter(
          (route) => route.kind === 'profile' && route.profileId === aliasId,
        );
        return (
          target?.kind === 'fixed' &&
          alias?.kind === 'virtual' &&
          alias.targetRoute?.kind === 'profile' &&
          alias.targetRoute.profileId === targetId &&
          routeMatches(draft.settings.startup.route) &&
          aliasQuickRoutes.length === 1 &&
          !draft.settings.quickSwitch.routes.some(
            (route) => route.kind === 'profile' && route.profileId === targetId,
          ) &&
          routeMatrix?.kind === 'switch' &&
          routeMatches(routeMatrix.defaultRoute) &&
          routeMatrix.rules.every((rule) => routeMatches(rule.route)) &&
          ruleMatrix?.kind === 'rule-list' &&
          routeMatches(ruleMatrix.matchRoute) &&
          routeMatches(ruleMatrix.defaultRoute) &&
          pacMatrix?.kind === 'pac' &&
          routeMatches(pacMatrix.fallbackRoute) &&
          autoMatrix?.kind === 'auto-detect' &&
          routeMatches(autoMatrix.fallbackRoute) &&
          existingAlias?.kind === 'virtual' &&
          routeMatches(existingAlias.targetRoute)
        );
      }, virtualIds),
    'Virtual reference migration did not rewrite every typed route surface',
    20_000,
  );
  const virtualApply = virtualOptions.locator('.nav-group.actions button.primary');
  await assertEventually(
    async () => !(await virtualApply.isDisabled()),
    'Virtual migration did not leave an applicable Draft',
  );
  await virtualApply.click();
  await assertEventually(
    async () =>
      virtualWorker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow !== undefined &&
          workflow.pendingApply === undefined &&
          JSON.stringify(workflow.draft) === JSON.stringify(workflow.applied)
        );
      }),
    'Virtual reference migration did not commit through normal Apply',
    20_000,
  );
  assert.equal(
    await virtualOptions.getByRole('button', { name: 'Target Proxy', exact: true }).count(),
    1,
  );
  assert.equal(
    await virtualOptions.getByRole('button', { name: 'Stable Alias', exact: true }).count(),
    1,
  );

  const unrelatedProfileId = await virtualWorker.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(key))[key];
    const profile = workflow?.applied?.profiles?.find(
      (candidate) => candidate.name === 'Unrelated Proxy',
    );
    if (!profile) throw new Error('Unrelated Proxy is missing');
    return profile.id;
  });
  await virtualOptions.getByRole('button', { name: 'Unrelated Proxy', exact: true }).click();
  await virtualOptions.locator('[data-profile-delete-action]').click();
  const confirmDeletion = virtualOptions.locator(
    '[data-profile-deletion-dialog][data-profile-deletion-mode="confirm"]',
  );
  await confirmDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  await confirmDeletion.getByRole('heading', { name: '删除情景模式', exact: true }).waitFor();
  assert.equal(await confirmDeletion.getAttribute('data-typed-locale'), 'zh-CN');
  await assertEventually(
    async () =>
      confirmDeletion
        .locator('[data-profile-deletion-cancel]')
        .evaluate((element) => element === document.activeElement),
    'Deletion confirmation dialog did not focus its Cancel action',
  );
  await confirmDeletion.locator('[data-profile-deletion-confirm]').click();
  await assertEventually(
    async () =>
      (await virtualOptions
        .getByRole('button', { name: 'Unrelated Proxy', exact: true })
        .count()) === 0,
    'Unreferenced profile remained in navigation after confirmed deletion',
  );
  await assertEventually(
    async () =>
      virtualWorker.evaluate(async (deletedId) => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow?.draft?.profiles?.every((profile) => profile.id !== deletedId) &&
          workflow.draft.settings.quickSwitch.routes.every(
            (route) => route.kind !== 'profile' || route.profileId !== deletedId,
          )
        );
      }, unrelatedProfileId),
    'Confirmed deletion did not remove the profile and its Quick Switch route from Draft',
  );
  await assertEventually(
    async () => !(await virtualApply.isDisabled()),
    'Confirmed profile deletion did not leave an applicable Draft',
  );
  await virtualApply.click();
  await assertEventually(
    async () =>
      virtualWorker.evaluate(async (deletedId) => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow !== undefined &&
          workflow.pendingApply === undefined &&
          workflow.applied.profiles.every((profile) => profile.id !== deletedId) &&
          JSON.stringify(workflow.draft) === JSON.stringify(workflow.applied)
        );
      }, unrelatedProfileId),
    'Confirmed profile deletion did not commit through normal Apply',
    20_000,
  );
  await virtualContext.close();
  virtualContext = undefined;

  creationContext = await chromium.launchPersistentContext(creationUserDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let [creationWorker] = creationContext.serviceWorkers();
  creationWorker ??= await creationContext.waitForEvent('serviceworker', { timeout: 15_000 });
  const creationExtensionId = new URL(creationWorker.url()).host;
  assert.match(
    creationExtensionId,
    /^[a-p]{32}$/u,
    'Four-profile creation extension ID was not resolved',
  );
  const creationOptions = await creationContext.newPage();
  await creationOptions.goto(`chrome-extension://${creationExtensionId}/options.html`);
  await creationOptions.waitForLoadState('domcontentloaded');
  await creationOptions.locator('[data-new-profile-action]').waitFor({
    state: 'visible',
    timeout: 20_000,
  });

  const createNormalProfile = async ({ name, kind, editor }) => {
    await creationOptions.locator('[data-new-profile-action]').click();
    const dialog = creationOptions.locator('.new-profile-dialog');
    await dialog.waitFor({ state: 'visible', timeout: 20_000 });
    assert.equal(await dialog.getAttribute('data-pac-profile-supported'), 'true');
    assert.equal(await dialog.getAttribute('data-pac-profile-capability-reason'), 'proxy-settings');
    const nameInput = dialog.locator('[data-new-profile-name-input]');
    await assertEventually(
      async () => nameInput.evaluate((element) => element === document.activeElement),
      `${name} dialog did not focus the profile-name field`,
    );
    await nameInput.fill(name);
    const kindInput = dialog.locator(`[data-new-profile-kind="${kind}"]`);
    await kindInput.check();
    assert.equal(await kindInput.isChecked(), true, `${name} kind was not selected`);
    await dialog.locator('[data-new-profile-create]').click();
    await dialog.waitFor({ state: 'detached', timeout: 20_000 });
    await creationOptions
      .getByRole('heading', { name, exact: true, level: 1 })
      .waitFor({ state: 'visible', timeout: 20_000 });
    assert.equal(await creationOptions.getByLabel('情景模式名称').count(), 0);
    await editor().waitFor({ state: 'visible', timeout: 20_000 });
  };

  await createNormalProfile({
    name: 'Created Fixed',
    kind: 'fixed',
    editor: () => creationOptions.locator('[data-fixed-proxy-table]'),
  });
  await createNormalProfile({
    name: 'Created Switch',
    kind: 'switch',
    editor: () => creationOptions.locator('[data-switch-rules-table]'),
  });
  await createNormalProfile({
    name: 'Created PAC',
    kind: 'pac',
    editor: () => creationOptions.locator('[data-pac-profile-editor][data-typed-locale="zh-CN"]'),
  });
  await createNormalProfile({
    name: 'Created Virtual',
    kind: 'virtual',
    editor: () =>
      creationOptions.locator('[data-virtual-profile-editor][data-typed-locale="zh-CN"]'),
  });
  await creationOptions
    .getByLabel('虚拟情景模式目标', { exact: true })
    .selectOption({ label: 'Created Fixed' });

  await creationOptions.getByRole('button', { name: '界面', exact: true }).click();
  const advancedConditionsSetting = creationOptions.locator(
    '[data-show-advanced-conditions-setting]',
  );
  await advancedConditionsSetting.waitFor({ state: 'visible', timeout: 20_000 });
  if (!(await advancedConditionsSetting.isChecked())) await advancedConditionsSetting.check();

  await creationOptions.getByRole('button', { name: 'Created Switch', exact: true }).click();
  const createdSwitchTable = creationOptions.locator('[data-switch-rules-table]');
  await createdSwitchTable.waitFor({ state: 'visible', timeout: 20_000 });
  await createdSwitchTable.locator('.add-condition-row button').click();
  const conditionRow = createdSwitchTable.locator('[data-switch-rule-row]').first();
  const conditionSelect = conditionRow.locator('[data-switch-condition-select]');
  await assertEventually(
    async () => (await conditionSelect.locator('option').count()) === 10,
    'Original Switch condition options did not finish rendering',
  );
  const originalConditionKinds = await conditionSelect
    .locator('option')
    .evaluateAll((options) => options.map((option) => option.value));
  assert.deepEqual(originalConditionKinds, [
    'host-wildcard',
    'host-regex',
    'host-levels',
    'ip',
    'url-wildcard',
    'url-regex',
    'keyword',
    'weekday',
    'time',
    'false',
  ]);
  assert.equal(
    await conditionSelect.locator('option[value="true"], option[value="bypass"]').count(),
    0,
    'Source-only True/Bypass conditions leaked into the ordinary original selector',
  );

  const selectCondition = async (kind) => {
    await conditionSelect.selectOption(kind);
    await assertEventually(
      async () => (await conditionSelect.inputValue()) === kind,
      `Switch condition ${kind} did not become active`,
    );
  };

  await selectCondition('host-wildcard');
  let patternField = conditionRow.locator('[data-switch-condition-field="pattern"]');
  await patternField.fill('https://wrong.example.invalid/path');
  await patternField.press('Tab');
  await conditionRow.locator('[data-switch-host-wildcard-warning]').waitFor({ state: 'visible' });
  await patternField.fill('*.matrix.example.invalid');
  await patternField.press('Tab');

  await selectCondition('host-regex');
  patternField = conditionRow.locator('[data-switch-condition-field="pattern"]');
  await patternField.fill('[');
  await patternField.press('Tab');
  const conditionApply = creationOptions.getByRole('button', { name: '应用选项', exact: true });
  await assertEventually(
    async () => !(await conditionApply.isDisabled()),
    'Invalid regex Draft did not remain available for strict Apply validation',
  );
  await conditionApply.click();
  await creationOptions.locator('.global-error [role="alert"]').waitFor({
    state: 'visible',
    timeout: 20_000,
  });
  await assertEventually(
    async () =>
      creationWorker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        const draftProfile = workflow?.draft?.profiles?.find(
          (profile) => profile.name === 'Created Switch',
        );
        return (
          workflow !== undefined &&
          workflow.pendingApply === undefined &&
          draftProfile?.kind === 'switch' &&
          draftProfile.rules?.[0]?.condition?.kind === 'host-regex' &&
          draftProfile.rules[0].condition.pattern === '[' &&
          !workflow.applied.profiles.some((profile) => profile.name === 'Created Switch')
        );
      }),
    'Strict Apply did not reject the invalid regular expression while preserving Draft',
    20_000,
  );
  await patternField.fill('(^|\\.)matrix\\.example\\.invalid$');
  await patternField.press('Tab');

  await selectCondition('host-levels');
  await conditionRow.locator('[data-switch-condition-field="minimumHostLevels"]').fill('2');
  await conditionRow.locator('[data-switch-condition-field="minimumHostLevels"]').press('Tab');
  await conditionRow.locator('[data-switch-condition-field="maximumHostLevels"]').fill('4');
  await conditionRow.locator('[data-switch-condition-field="maximumHostLevels"]').press('Tab');

  await selectCondition('ip');
  const ipNetwork = conditionRow.locator('[data-switch-condition-field="ipNetwork"]');
  assert.equal(await ipNetwork.getAttribute('placeholder'), '127.0.0.1/8');
  await ipNetwork.fill('192.0.2.0/24');
  await ipNetwork.press('Tab');

  await selectCondition('url-wildcard');
  patternField = conditionRow.locator('[data-switch-condition-field="pattern"]');
  await patternField.fill('https://*.assets.example.invalid/*');
  await patternField.press('Tab');

  await selectCondition('url-regex');
  patternField = conditionRow.locator('[data-switch-condition-field="pattern"]');
  await patternField.fill('^https://secure\\.example\\.invalid/');
  await patternField.press('Tab');

  await selectCondition('keyword');
  patternField = conditionRow.locator('[data-switch-condition-field="pattern"]');
  await patternField.fill('matrix-keyword');
  await patternField.press('Tab');

  await selectCondition('false');
  await conditionRow.locator('[data-switch-false-condition]').waitFor({ state: 'visible' });

  await selectCondition('weekday');
  const monday = conditionRow.locator('[data-switch-weekday="mon"]');
  const friday = conditionRow.locator('[data-switch-weekday="fri"]');
  assert.equal(await monday.isChecked(), true);
  await monday.uncheck();
  await friday.check();

  await selectCondition('time');
  await conditionRow.locator('[data-switch-condition-field="startHour"]').fill('8');
  await conditionRow.locator('[data-switch-condition-field="startHour"]').press('Tab');
  await conditionRow.locator('[data-switch-condition-field="endHour"]').fill('18');
  await conditionRow.locator('[data-switch-condition-field="endHour"]').press('Tab');

  await creationOptions.locator('[data-switch-source-toggle]').click();
  const conditionSource = creationOptions.locator('[data-switch-source-editor] textarea');
  await conditionSource.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await conditionSource.inputValue(), /Time: 8~18 \+direct/u);
  await conditionSource.fill(
    '[SwitchyOmega Conditions]\n@with result\n\nWeekday: -M----- +direct\n\n* +direct\n',
  );
  await creationOptions.locator('[data-switch-source-toggle]').click();
  await createdSwitchTable.waitFor({ state: 'visible', timeout: 20_000 });
  await assertEventually(
    async () => (await conditionSelect.inputValue()) === 'weekday' && (await monday.isChecked()),
    'Switch source round trip did not restore the weekday field state',
  );

  await creationOptions.getByRole('button', { name: 'Created Fixed', exact: true }).click();
  const createdFixedTable = creationOptions.locator('[data-fixed-proxy-table]');
  await createdFixedTable.waitFor({ state: 'visible', timeout: 20_000 });
  await createdFixedTable.locator('[data-proxy-action="show-advanced"]').click();
  const createdProtocolMatrix = [
    ['http', 'https', 'matrix-https.invalid', '8443'],
    ['https', 'socks4', 'matrix-socks4.invalid', '1080'],
    ['ftp', 'socks5', 'matrix-socks5.invalid', '1081'],
    ['fallback', 'http', 'matrix-http.invalid', '8080'],
  ];
  for (const [scheme, protocol, host, port] of createdProtocolMatrix) {
    const row = createdFixedTable.locator(`[data-proxy-scheme="${scheme}"]`);
    await row.locator('[data-proxy-field="protocol"]').selectOption(protocol);
    await row.locator('[data-proxy-field="server"]').fill(host);
    await row.locator('[data-proxy-field="server"]').press('Tab');
    await row.locator('[data-proxy-field="port"]').fill(port);
    await row.locator('[data-proxy-field="port"]').press('Tab');
  }

  const createdProfileIds = await assertEventuallyValue(async () => {
    return creationWorker.evaluate(async () => {
      const key = 'zeroomega-nex/profile-workflow/v1/state';
      const workflow = (await chrome.storage.local.get(key))[key];
      const names = ['Created Fixed', 'Created Switch', 'Created PAC', 'Created Virtual'];
      const profiles = Object.fromEntries(
        names.map((name) => [
          name,
          workflow?.draft?.profiles?.find((profile) => profile.name === name),
        ]),
      );
      if (
        profiles['Created Fixed']?.kind !== 'fixed' ||
        profiles['Created Switch']?.kind !== 'switch' ||
        profiles['Created PAC']?.kind !== 'pac' ||
        profiles['Created Virtual']?.kind !== 'virtual' ||
        profiles['Created Virtual'].targetRoute?.kind !== 'profile' ||
        profiles['Created Virtual'].targetRoute.profileId !== profiles['Created Fixed'].id ||
        profiles['Created Fixed'].proxyByScheme === undefined ||
        profiles['Created Switch'].rules?.[0]?.condition?.kind !== 'weekday' ||
        !profiles['Created Switch'].rules[0].condition.days?.includes('mon')
      ) {
        return undefined;
      }
      const fixed = profiles['Created Fixed'];
      const protocols = Object.fromEntries(
        Object.entries(fixed.proxyByScheme).map(([scheme, endpointId]) => [
          scheme,
          workflow.draft.proxyEndpoints.find((endpoint) => endpoint.id === endpointId)?.protocol,
        ]),
      );
      if (
        protocols.fallback !== 'http' ||
        protocols.http !== 'https' ||
        protocols.https !== 'socks4' ||
        protocols.ftp !== 'socks5'
      ) {
        return undefined;
      }
      return Object.fromEntries(
        Object.entries(profiles).map(([name, profile]) => [name, profile.id]),
      );
    });
  }, 'The four normal New Profile flows did not converge in Draft');
  assert.deepEqual(Object.keys(createdProfileIds).sort(), [
    'Created Fixed',
    'Created PAC',
    'Created Switch',
    'Created Virtual',
  ]);

  const creationApply = creationOptions.getByRole('button', { name: '应用选项', exact: true });
  await assertEventually(
    async () => !(await creationApply.isDisabled()),
    'Four-profile creation did not leave an applicable Draft',
  );
  await creationApply.click();
  await assertEventually(
    async () =>
      creationWorker.evaluate(async (expectedIds) => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        if (
          !workflow ||
          workflow.pendingApply !== undefined ||
          JSON.stringify(workflow.draft) !== JSON.stringify(workflow.applied)
        ) {
          return false;
        }
        return Object.entries(expectedIds).every(([name, id]) =>
          workflow.applied.profiles.some((profile) => profile.id === id && profile.name === name),
        );
      }, createdProfileIds),
    'The four normal New Profile flows did not commit through normal Apply',
    20_000,
  );
  await creationOptions.getByRole('button', { name: 'Created Fixed', exact: true }).click();
  await creationOptions.locator('[data-profile-rename-action]').click();
  const creationRenameDialog = creationOptions.locator('[data-profile-rename-dialog]');
  await creationRenameDialog.waitFor({ state: 'visible', timeout: 20_000 });
  const creationRenameInput = creationRenameDialog.locator('[data-profile-rename-name-input]');
  await creationRenameInput.fill('created pac');
  await assertEventually(
    async () => creationRenameDialog.locator('[data-profile-rename-confirm]').isDisabled(),
    'Case-insensitive existing Profile name did not disable Rename confirmation',
  );
  await creationRenameDialog.locator('[data-profile-rename-cancel]').click();
  await creationRenameDialog.waitFor({ state: 'detached', timeout: 20_000 });

  const unsupportedPacOptions = await creationContext.newPage();
  await unsupportedPacOptions.addInitScript(() => {
    Object.defineProperty(chrome.proxy, 'registerProxyScript', {
      configurable: true,
      value: () => undefined,
    });
  });
  await unsupportedPacOptions.goto(`chrome-extension://${creationExtensionId}/options.html`);
  await unsupportedPacOptions.waitForLoadState('domcontentloaded');
  await unsupportedPacOptions.locator('[data-new-profile-action]').click();
  const unsupportedPacDialog = unsupportedPacOptions.locator('.new-profile-dialog');
  await unsupportedPacDialog.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await unsupportedPacDialog.getAttribute('data-pac-profile-supported'), 'false');
  assert.equal(
    await unsupportedPacDialog.getAttribute('data-pac-profile-capability-reason'),
    'proxy-script-registration',
  );
  assert.equal(
    await unsupportedPacDialog.locator('[data-new-profile-kind="pac"]').isDisabled(),
    true,
  );
  assert.match(await unsupportedPacDialog.innerText(), /由于技术限制/u);
  await unsupportedPacOptions.close();

  await creationContext.close();
  creationContext = undefined;

  conflictContext = await chromium.launchPersistentContext(conflictUserDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [
      `--disable-extensions-except=${extensionPath},${conflictExtensionPath}`,
      `--load-extension=${extensionPath},${conflictExtensionPath}`,
    ],
  });
  let conflictWorker;
  await assertEventually(async () => {
    for (const candidate of conflictContext.serviceWorkers()) {
      const name = await candidate
        .evaluate(() => chrome.runtime.getManifest().name)
        .catch(() => '');
      if (name === 'Proxy Ownership Conflict E2E') {
        conflictWorker = candidate;
        return true;
      }
    }
    return false;
  }, 'Conflicting proxy extension service worker was not resolved');
  await assertEventually(
    async () =>
      conflictWorker.evaluate(
        async () =>
          (await chrome.proxy.settings.get({ incognito: false })).levelOfControl ===
          'controlled_by_this_extension',
      ),
    'Conflicting extension did not obtain proxy control',
  );
  const blockedPopup = await conflictContext.newPage();
  await blockedPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  const ownershipBlocker = blockedPopup.locator(
    '[data-popup-proxy-not-controllable][data-reason="app"]',
  );
  await ownershipBlocker.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(
    await blockedPopup.locator('.popup-shell').getAttribute('data-popup-locale'),
    'zh-CN',
  );
  assert.match(await ownershipBlocker.innerText(), /其他应用正在控制代理设置/u);
  assert.doesNotMatch(await ownershipBlocker.innerText(), /Another application|Manage extensions/u);
  await ownershipBlocker.locator('[data-popup-manage-extensions]').waitFor();
  assert.equal(await blockedPopup.locator('.profile-row').count(), 0);
  assert.equal(await blockedPopup.locator('[data-popup-temporary-rule]').count(), 0);
  assert.equal(await blockedPopup.locator('[data-popup-add-current-site]').count(), 0);
  await blockedPopup.close();

  console.log(`Chromium extension E2E passed for ${extensionId}.`);
} finally {
  await conflictContext?.close();
  await creationContext?.close();
  await virtualContext?.close();
  await context?.close();
  await new Promise((resolveClose) => ruleServer.close(resolveClose));
  await authProxy.close();
  await rm(userDataDir, { recursive: true, force: true });
  await rm(conflictUserDataDir, { recursive: true, force: true });
  await rm(virtualUserDataDir, { recursive: true, force: true });
  await rm(creationUserDataDir, { recursive: true, force: true });
  await rm(conflictExtensionPath, { recursive: true, force: true });
}

async function assertEventuallyValue(check, message, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await check();
    if (value !== undefined) return value;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(message);
}

async function assertEventually(check, message, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(message);
}
