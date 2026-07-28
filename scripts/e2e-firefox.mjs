import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

import { Browser, Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const remoteRuleText = '[SwitchyOmega Conditions]\n@with result\n\n* +direct\n';
const remotePacText = "function FindProxyForURL(url, host) { return 'DIRECT'; }\n";
let ruleRequestCount = 0;
let pacRequestCount = 0;
const sourceServer = createServer((request, response) => {
  if (request.url?.startsWith('/rules.txt')) {
    ruleRequestCount += 1;
    response.writeHead(200, {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(remoteRuleText);
    return;
  }
  if (request.url?.startsWith('/proxy.pac')) {
    pacRequestCount += 1;
    response.writeHead(200, {
      'content-type': 'application/x-ns-proxy-autoconfig; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(remotePacText);
    return;
  }
  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('not found');
});
await new Promise((resolveListen, rejectListen) => {
  sourceServer.once('error', rejectListen);
  sourceServer.listen(0, '127.0.0.1', resolveListen);
});
const sourceAddress = sourceServer.address();
if (!sourceAddress || typeof sourceAddress === 'string') {
  throw new Error('Firefox source-update test server failed');
}
const remoteRuleUrl = `http://127.0.0.1:${sourceAddress.port}/rules.txt`;
const remotePacUrl = `http://127.0.0.1:${sourceAddress.port}/proxy.pac`;
const remotePermissionOrigin = 'http://127.0.0.1/*';

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000008';
const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference('intl.accept_languages', 'zh-TW')
  .enableBidi()
  .setPreference('extensions.webextOptionalPermissionPrompts', false)
  .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));
const driver = await new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(options).build();

async function bidiCommand(method, params) {
  const capabilities = await driver.getCapabilities();
  const webSocketUrl = capabilities.get('webSocketUrl');
  assert.equal(typeof webSocketUrl, 'string', 'Firefox did not expose a BiDi WebSocket URL');
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener(
      'error',
      () => rejectOpen(new Error(`Could not connect to Firefox BiDi at ${webSocketUrl}`)),
      { once: true },
    );
  });
  try {
    const id = 1;
    const response = await new Promise((resolveResponse, rejectResponse) => {
      const timeout = setTimeout(
        () => rejectResponse(new Error(`Firefox BiDi command ${method} timed out`)),
        20_000,
      );
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data));
        if (message.id !== id) return;
        clearTimeout(timeout);
        if (message.type === 'error' || message.error) {
          rejectResponse(
            new Error(
              `Firefox BiDi ${method} failed: ${message.error ?? 'unknown'} ${message.message ?? ''}`,
            ),
          );
          return;
        }
        resolveResponse(message.result);
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
    return response;
  } finally {
    socket.close();
  }
}

async function runtimeDiagnostics() {
  return driver.executeAsyncScript(`
    const done = arguments[0];
    (async () => {
      const result = {
        manifest: browser.runtime.getManifest(),
        incognitoAllowed: await browser.extension.isAllowedIncognitoAccess(),
        proxyState: await browser.proxy.settings.get({}),
        storage: await browser.storage.local.get(null),
      };
      try {
        result.response = await browser.runtime.sendMessage({
          channel: 'zeroomega-nex/profile-workflow/v1',
          action: 'get',
        });
      } catch (sendError) {
        result.sendError = {
          message: sendError instanceof Error ? sendError.message : String(sendError),
          stack: sendError instanceof Error ? sendError.stack : undefined,
        };
      }
      result.storageAfterMessage = await browser.storage.local.get(null);
      done(result);
    })().catch((diagnosticError) => done({
      diagnosticError: diagnosticError instanceof Error
        ? { message: diagnosticError.message, stack: diagnosticError.stack }
        : String(diagnosticError),
    }));
  `);
}

async function setControlValue(element, value) {
  await driver.executeScript(
    `
      const element = arguments[0];
      const value = arguments[1];
      const prototype = element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
      setter.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    `,
    element,
    value,
  );
}

async function hasOriginPermission(origin) {
  return driver.executeAsyncScript(
    `
      const origin = arguments[0];
      const done = arguments[1];
      browser.permissions.contains({ origins: [origin] }).then(done, (error) => done(String(error)));
    `,
    origin,
  );
}

async function logDiagnostics(stage) {
  console.error(`[Firefox ${stage} URL] ${await driver.getCurrentUrl()}`);
  console.error(`[Firefox ${stage} title] ${await driver.getTitle()}`);
  console.error(
    `[Firefox ${stage} body] ${await driver.executeScript('return document.body?.innerText ?? "";')}`,
  );
  console.error(`[Firefox ${stage} runtime] ${JSON.stringify(await runtimeDiagnostics())}`);
}

try {
  const installResult = await bidiCommand('webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  const installedId = installResult?.extension;
  assert.equal(installedId, addonId, 'Firefox returned an unexpected add-on ID');

  await driver.get(`moz-extension://${extensionUuid}/options.html`);
  let profileName;
  try {
    profileName = await driver.wait(
      until.elementLocated(By.css('input[aria-label="情境模式名稱"]')),
      15_000,
    );
    await driver.wait(until.elementIsVisible(profileName), 15_000);
  } catch (error) {
    await logDiagnostics('Options initialization');
    console.error(`[Firefox Options source] ${(await driver.getPageSource()).slice(0, 20_000)}`);
    throw error;
  }
  assert.equal(await profileName.getAttribute('value'), 'Proxy');
  assert.equal(
    await driver.executeAsyncScript(`
      const done = arguments[0];
      browser.extension.isAllowedIncognitoAccess().then(done, (error) => done(String(error)));
    `),
    true,
    'Firefox BiDi installation did not grant private browsing access',
  );
  assert.equal(
    await hasOriginPermission(remotePermissionOrigin),
    false,
    'Firefox remote source origin must remain optional before a user action',
  );

  await driver.executeScript(
    `
      const input = arguments[0];
      const value = arguments[1];
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    `,
    profileName,
    'Firefox E2E Proxy',
  );
  await driver.wait(
    async () => (await profileName.getAttribute('value')) === 'Firefox E2E Proxy',
    5_000,
  );
  const apply = await driver.wait(until.elementLocated(By.css('.actions button.primary')), 15_000);
  await driver.wait(until.elementIsEnabled(apply), 15_000);
  await apply.click();
  try {
    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(normalize-space(.), '目前設定已全部套用。') ]")),
      20_000,
    );
  } catch (error) {
    await logDiagnostics('Apply');
    throw error;
  }

  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
  const customProfile = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., 'Firefox E2E Proxy')]")),
    15_000,
  );
  await customProfile.click();
  await driver.wait(until.elementIsDisabled(customProfile), 20_000);

  await driver.get(`moz-extension://${extensionUuid}/options.html#/history`);
  await driver.wait(until.elementLocated(By.xpath("//h1[normalize-space(.)='設定歷史']")), 15_000);
  await driver.wait(until.elementLocated(By.css('article.settings-section')), 20_000);

  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
  const direct = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., '直接連線')]")),
    15_000,
  );
  await direct.click();
  await driver.wait(until.elementIsDisabled(direct), 15_000);

  await driver.get(`moz-extension://${extensionUuid}/temp-rules.html`);
  await driver.wait(
    until.elementLocated(By.css('[data-temp-rules-manager][data-typed-locale="zh-TW"]')),
    15_000,
  );
  await driver.wait(until.elementLocated(By.xpath("//h1[normalize-space(.)='暫時規則']")), 15_000);
  await driver.wait(
    until.elementLocated(By.xpath("//*[normalize-space(.)='目前沒有作用中的暫時規則。']")),
    15_000,
  );

  await driver.get(`moz-extension://${extensionUuid}/network.html`);
  await driver.wait(
    until.elementLocated(By.css('[data-network-diagnostics][data-typed-locale="zh-TW"]')),
    15_000,
  );
  await driver.wait(until.elementLocated(By.xpath("//h1[normalize-space(.)='請求診斷']")), 15_000);
  await driver.wait(
    until.elementLocated(By.xpath("//button[normalize-space(.)='開始監控']")),
    15_000,
  );
  await driver.wait(until.elementLocated(By.css('[data-request-diagnostics-stopped]')), 15_000);

  await driver.get(`moz-extension://${extensionUuid}/options.html`);
  const newRuleProfileAction = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-action]')),
    15_000,
  );
  await newRuleProfileAction.click();
  const newRuleName = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-name-input]')),
    15_000,
  );
  await setControlValue(newRuleName, 'Firefox Rule Source E2E');
  const switchChoice = await driver.findElement(By.css('[data-new-profile-kind="switch"]'));
  await switchChoice.click();
  const createSwitch = await driver.findElement(By.css('[data-new-profile-create]'));
  await driver.wait(until.elementIsEnabled(createSwitch), 10_000);
  await createSwitch.click();
  const attachRuleListSection = await driver.wait(
    until.elementLocated(By.css('[data-attach-rule-list-section]')),
    20_000,
  );
  await attachRuleListSection.findElement(By.css('button')).click();
  const attachedRuleList = await driver.wait(
    until.elementLocated(By.css('[data-attached-rule-list-config][data-typed-locale="zh-TW"]')),
    20_000,
  );
  const attachedSourceType = await attachedRuleList.findElement(By.css('select'));
  await setControlValue(attachedSourceType, 'url');
  const attachedUrl = await driver.wait(
    until.elementLocated(By.css('[data-attached-rule-list-config] input[type="url"]')),
    15_000,
  );
  await setControlValue(attachedUrl, remoteRuleUrl);
  const ruleDownload = await driver.wait(
    until.elementLocated(By.css('[data-rule-source-update-now]')),
    15_000,
  );
  await driver.wait(until.elementIsEnabled(ruleDownload), 15_000);
  await ruleDownload.click();
  await driver.wait(async () => {
    const statuses = await driver.findElements(By.css('[data-rule-source-update-status]'));
    return statuses.length > 0 && (await statuses[0].getText()).includes('規則清單最後更新於');
  }, 20_000);
  const downloadedRuleText = await driver.wait(
    until.elementLocated(By.css('[data-attached-rule-list-config] textarea[readonly]')),
    15_000,
  );
  assert.equal(await downloadedRuleText.getProperty('value'), remoteRuleText);
  assert.equal(
    await hasOriginPermission(remotePermissionOrigin),
    true,
    'Firefox did not retain the optional source origin after the user-triggered Rule Source download',
  );
  const ruleRuntime = await driver.executeAsyncScript(
    `
      const url = arguments[0];
      const done = arguments[1];
      browser.storage.local.get(null).then((storage) => {
        const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
        const source = workflow?.draft?.ruleSources?.find((candidate) => candidate.location?.url === url);
        done({
          content: source?.location?.content,
          lastSuccessAt: source ? workflow?.ruleSourceUpdates?.[source.id]?.lastSuccessAt : undefined,
          lastError: source ? workflow?.ruleSourceUpdates?.[source.id]?.lastError : undefined,
        });
      }, (error) => done({ error: String(error) }));
    `,
    remoteRuleUrl,
  );
  assert.equal(ruleRuntime.content, remoteRuleText, 'Firefox Rule Source cache was not persisted');
  assert.equal(typeof ruleRuntime.lastSuccessAt, 'string');
  assert.equal(
    ruleRuntime.lastError == null,
    true,
    'Firefox Rule Source update recorded an unexpected error',
  );

  const newPacProfileAction = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-action]')),
    15_000,
  );
  await newPacProfileAction.click();
  const newPacName = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-name-input]')),
    15_000,
  );
  await setControlValue(newPacName, 'Firefox PAC E2E');
  const pacChoice = await driver.findElement(By.css('[data-new-profile-kind="pac"]'));
  await pacChoice.click();
  await driver.wait(async () => pacChoice.isSelected(), 5_000);
  const createPac = await driver.findElement(By.css('[data-new-profile-create]'));
  await driver.wait(until.elementIsEnabled(createPac), 10_000);
  await createPac.click();
  let pacEditor;
  try {
    await driver.wait(
      async () => (await driver.findElements(By.css('.new-profile-dialog'))).length === 0,
      20_000,
    );
    pacEditor = await driver.wait(
      until.elementLocated(By.css('[data-pac-profile-editor][data-typed-locale="zh-TW"]')),
      20_000,
    );
  } catch (error) {
    await logDiagnostics('remote PAC creation');
    throw error;
  }
  await driver.wait(until.elementIsVisible(pacEditor), 20_000);
  await driver.wait(until.elementLocated(By.xpath("//h2[normalize-space(.)='PAC 網址']")), 15_000);
  const pacUrl = await driver.wait(
    until.elementLocated(By.css('[data-pac-url-section] input[aria-label="PAC 網址"]')),
    15_000,
  );
  await setControlValue(pacUrl, remotePacUrl);
  const pacDownload = await driver.wait(
    until.elementLocated(By.css('[data-pac-source-update-now]')),
    15_000,
  );
  await driver.wait(until.elementIsEnabled(pacDownload), 15_000);
  await pacDownload.click();
  await driver.wait(async () => {
    const statuses = await driver.findElements(By.css('[data-pac-source-update-status]'));
    return statuses.length > 0 && (await statuses[0].getText()).includes('PAC 指令碼最後更新時間');
  }, 20_000);
  const pacScript = await driver.wait(
    until.elementLocated(By.css('[data-pac-script-section] textarea[aria-label="PAC 指令碼"]')),
    15_000,
  );
  assert.equal(await pacScript.getProperty('value'), remotePacText);
  assert.equal(await pacScript.getProperty('readOnly'), true);
  const pacDraftRuntime = await driver.executeAsyncScript(
    `
      const url = arguments[0];
      const done = arguments[1];
      browser.storage.local.get(null).then((storage) => {
        const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
        const profile = workflow?.draft?.profiles?.find((candidate) => candidate.source?.url === url);
        const update = profile ? workflow?.ruleSourceUpdates?.['pac:' + profile.id] : undefined;
        done({ script: profile?.source?.script, lastSuccessAt: update?.lastSuccessAt, lastError: update?.lastError });
      }, (error) => done({ error: String(error) }));
    `,
    remotePacUrl,
  );
  assert.equal(pacDraftRuntime.script, remotePacText, 'Firefox PAC cache was not persisted');
  assert.equal(typeof pacDraftRuntime.lastSuccessAt, 'string');
  assert.equal(
    pacDraftRuntime.lastError == null,
    true,
    'Firefox PAC update recorded an unexpected error',
  );
  assert.equal(
    ruleRequestCount,
    1,
    'Firefox Rule Source server received an unexpected request count',
  );
  assert.equal(pacRequestCount, 1, 'Firefox PAC server received an unexpected request count');

  const pacApply = await driver.wait(
    until.elementLocated(By.css('.actions button.primary')),
    15_000,
  );
  await driver.wait(until.elementIsEnabled(pacApply), 15_000);
  await pacApply.click();
  await driver.wait(
    until.elementLocated(By.xpath("//*[contains(normalize-space(.), '目前設定已全部套用。') ]")),
    20_000,
  );
  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
  const pacRoute = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., 'Firefox PAC E2E')]")),
    15_000,
  );
  await pacRoute.click();
  await driver.wait(until.elementIsDisabled(pacRoute), 20_000);
  const pacRuntime = await driver.executeAsyncScript(`
    const done = arguments[0];
    browser.storage.local.get(null).then((storage) => {
      const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
      const profile = workflow?.applied?.profiles?.find((candidate) => candidate.name === 'Firefox PAC E2E');
      const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
      const snapshot = proxyState?.activeSnapshotId
        ? storage['zeroomega-nex/browser-proxy/v1/snapshot/' + proxyState.activeSnapshotId]
        : undefined;
      done({
        profileId: profile?.id,
        kind: profile?.kind,
        compilerVersion: snapshot?.compilerVersion,
        startRoute: snapshot?.startRoute,
        script: snapshot?.script,
      });
    }, (error) => done({ error: String(error) }));
  `);
  assert.equal(pacRuntime.kind, 'pac', 'Firefox PAC profile was not applied');
  assert.equal(
    pacRuntime.compilerVersion,
    'raw-pac/1',
    'Firefox did not install a raw PAC snapshot',
  );
  assert.equal(pacRuntime.startRoute?.kind, 'profile');
  assert.equal(pacRuntime.startRoute?.profileId, pacRuntime.profileId);
  assert.match(pacRuntime.script ?? '', /FindProxyForURL/u);
  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
  const finalDirect = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., '直接連線')]")),
    15_000,
  );
  await finalDirect.click();
  await driver.wait(until.elementIsDisabled(finalDirect), 15_000);

  console.log(`Firefox extension E2E passed for ${installedId}.`);
} finally {
  try {
    await driver.quit();
  } finally {
    await new Promise((resolveClose, rejectClose) => {
      sourceServer.close((error) => (error ? rejectClose(error) : resolveClose()));
    });
  }
}
