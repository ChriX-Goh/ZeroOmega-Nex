import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const legacyBackupPath = resolve('fixtures/zeroomega-v2/minimal-profile-types.json');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-chromium-'));
const conflictUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-conflict-user-'));
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
let receivedRuleHeader = '';
let ruleRequestCount = 0;
const ruleServer = createServer((request, response) => {
  if (request.url?.startsWith('/diagnostic-error')) {
    request.socket.destroy();
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
let context;
let conflictContext;

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

  const fixedTable = options.locator('[data-fixed-proxy-table]');
  await fixedTable.waitFor({ state: 'visible' });
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
  await authDialog.getByRole('textbox', { name: '密码', exact: true }).fill('not-a-real-secret');
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
  await externalForm.getByLabel('External profile name').fill('_reserved');
  await externalForm.getByRole('button', { name: '保存名称', exact: true }).click();
  await externalForm.getByText('情景模式名称不能以下划线开头。').waitFor();
  await externalForm.getByLabel('External profile name').fill('Imported External Proxy');
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
  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

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
  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  const resultPopup = await context.newPage();
  await resultPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  const switchResult = resultPopup.getByLabel('Result profile for switch');
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
  const temporarySelect = temporaryPopup.getByLabel('Temporary profile for example.co.uk');
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
    await conditionForm.getByLabel('Current site condition pattern').inputValue(),
    '*.example.co.uk',
  );
  await conditionForm.getByLabel('Current site result profile').selectOption({ label: 'fixed' });
  await conditionForm.getByRole('button', { name: 'Add condition', exact: true }).click();
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
  const temporaryRow = temporaryManager.locator('[data-temp-rule-domain="example.co.uk"]');
  await temporaryRow.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await temporaryRow.innerText(), /fixed/u);
  await temporaryRow
    .getByRole('button', { name: 'Delete temporary rule for example.co.uk' })
    .click();
  await assertEventually(async () => {
    const [local, session] = await worker.evaluate(async () =>
      Promise.all([chrome.storage.local.get(null), chrome.storage.session.get(null)]),
    );
    return (
      session['zeroomega-nex/popup-temporary-rules/v1/state'] === undefined &&
      !String(local['zeroomega-nex/browser-proxy/v1/state']?.activeSnapshotId ?? '').startsWith(
        'popup-temporary-v1/',
      )
    );
  }, 'Deleting the final temporary rule did not restore the underlying route');
  await temporaryManager.close();

  const diagnosticsPage = await context.newPage();
  await diagnosticsPage.goto(
    `chrome-extension://${extensionId}/network.html?tabId=${currentSiteTabId}`,
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
  const attachRuleList = options.getByRole('button', { name: /Attach Rule List/u });
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
  const attachedEnabled = attachedRow.getByRole('checkbox', { name: 'Use attached Rule List' });
  assert.equal(await attachedEnabled.isChecked(), true);
  await attachedEnabled.uncheck();
  assert.equal(await attachedEnabled.isChecked(), false);
  await attachedEnabled.check();
  await attachedRow.getByLabel('Attached Rule List matching route').selectOption('system');
  const attachedConfig = options.locator('[data-attached-rule-list-config]');
  await attachedConfig.waitFor();
  const attachedText = attachedConfig.getByLabel('Attached Rule List text');
  await attachedText.fill('[AutoProxy 0.2.9]\n||attached.example.invalid');
  await attachedText.press('Tab');
  const attachedHeaders = options.locator('[data-attached-rule-list-headers]');
  const addHeader = attachedHeaders.locator('button').filter({ hasText: 'Add header' });
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
  const attachedHeaderName = attachedHeaders.locator('input[aria-label="Attached header 1 name"]');
  const attachedHeaderValue = attachedHeaders.locator(
    'input[aria-label="Attached header 1 value"]',
  );
  await attachedHeaderName.fill('X-E2E');
  await attachedHeaderName.press('Tab');
  await attachedHeaderValue.fill('attached');
  await attachedHeaderValue.press('Tab');

  const sourceType = attachedConfig.getByLabel('Attached Rule List source type');
  await assertEventually(
    async () => !(await sourceType.isDisabled()),
    'Attached Rule List source type remained disabled after saving headers',
  );
  await sourceType.selectOption('url');
  const sourceUrl = attachedConfig.getByLabel('Attached Rule List URL');
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
    await ruleUpdateStatus.filter({ hasText: 'Last updated' }).waitFor({ timeout: 20_000 });
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
    await attachedConfig.getByLabel('Attached Rule List downloaded text').inputValue(),
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
  await attachedRow.getByRole('button', { name: 'Delete attached Rule List' }).click();
  await attachRuleList.waitFor();
  assert.equal(await options.locator('[data-attached-rule-list-row]').count(), 0);

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
  assert.match(await ownershipBlocker.innerText(), /其他应用正在控制代理设置/u);
  await ownershipBlocker.locator('[data-popup-manage-extensions]').waitFor();
  assert.equal(await blockedPopup.locator('.profile-row').count(), 0);
  assert.equal(await blockedPopup.locator('[data-popup-temporary-rule]').count(), 0);
  assert.equal(await blockedPopup.locator('[data-popup-add-current-site]').count(), 0);
  await blockedPopup.close();

  console.log(`Chromium extension E2E passed for ${extensionId}.`);
} finally {
  await conflictContext?.close();
  await context?.close();
  await new Promise((resolveClose) => ruleServer.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
  await rm(conflictUserDataDir, { recursive: true, force: true });
  await rm(conflictExtensionPath, { recursive: true, force: true });
}

async function assertEventually(check, message, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(message);
}
