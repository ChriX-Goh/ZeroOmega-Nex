import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { Browser, Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000008';
const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference('intl.accept_languages', 'zh-TW')
  .enableBidi()
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
  const newProfileAction = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-action]')),
    15_000,
  );
  await newProfileAction.click();
  const newPacName = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-name-input]')),
    15_000,
  );
  await driver.executeScript(
    `
      const input = arguments[0];
      const value = arguments[1];
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    `,
    newPacName,
    'Firefox PAC E2E',
  );
  const pacChoice = await driver.findElement(By.css('[data-new-profile-kind="pac"]'));
  await pacChoice.click();
  const createPac = await driver.findElement(By.css('[data-new-profile-create]'));
  await driver.wait(until.elementIsEnabled(createPac), 10_000);
  await createPac.click();
  const pacEditor = await driver.wait(
    until.elementLocated(By.css('[data-pac-profile-editor][data-typed-locale="zh-TW"]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(pacEditor), 20_000);
  await driver.wait(until.elementLocated(By.xpath("//h2[normalize-space(.)='PAC 網址']")), 15_000);
  const pacScript = await driver.wait(
    until.elementLocated(By.css('[data-pac-script-section] textarea[aria-label="PAC 指令碼"]')),
    15_000,
  );
  await driver.executeScript(
    `
      const textarea = arguments[0];
      const value = arguments[1];
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(textarea, value);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    `,
    pacScript,
    "function FindProxyForURL(url, host) { return 'DIRECT'; }\n",
  );
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
  await driver.quit();
}
