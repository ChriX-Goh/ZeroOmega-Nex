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
      until.elementLocated(By.css('input[aria-label="情景模式名稱"]')),
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

  const historyButton = await driver.findElement(
    By.xpath("//button[.//span[normalize-space(.)='設定歷史']]"),
  );
  await historyButton.click();
  await driver.wait(until.elementLocated(By.xpath("//h1[normalize-space(.)='設定歷史']")), 15_000);
  await driver.wait(until.elementLocated(By.css('article.settings-section')), 20_000);

  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
  await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., 'Firefox E2E Proxy')]")),
    15_000,
  );
  const direct = await driver.findElement(By.xpath("//button[contains(., '直接連線')]"));
  await direct.click();
  await driver.wait(until.elementIsDisabled(direct), 15_000);

  console.log(`Firefox extension E2E passed for ${installedId}.`);
} finally {
  await driver.quit();
}
