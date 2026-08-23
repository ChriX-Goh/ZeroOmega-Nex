import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { Browser, Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

import { firefoxService } from './firefox-service.mjs';

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000013';

const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference('intl.accept_languages', 'en-US')
  .enableBidi()
  .setPreference('extensions.webextOptionalPermissionPrompts', false)
  .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));
const driver = await new Builder()
  .forBrowser(Browser.FIREFOX)
  .setFirefoxService(firefoxService())
  .setFirefoxOptions(options)
  .build();

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
    return await new Promise((resolveResponse, rejectResponse) => {
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
  } finally {
    socket.close();
  }
}

async function navigateCurrentContext(url) {
  const context = await driver.getWindowHandle();
  const result = await bidiCommand('browsingContext.navigate', {
    context,
    url,
    wait: 'complete',
  });
  const expectedUrl = url.endsWith('/options.html') ? `${url}#/about` : url;
  assert.equal(result?.url, expectedUrl, 'Firefox navigated to an unexpected URL');
}

async function executeAsync(script, ...args) {
  return driver.executeAsyncScript(script, ...args);
}

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
  const installed = await bidiCommand('webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  assert.equal(installed?.extension, addonId, 'Firefox returned an unexpected Nex add-on ID');

  await navigateCurrentContext(`moz-extension://${extensionUuid}/options.html`);

  const policyState = await waitForValue(
    () =>
      executeAsync(`
        const done = arguments[arguments.length - 1];
        Promise.all([
          browser.proxy.settings.get({}),
          browser.runtime.sendMessage({
            channel: 'zeroomega-nex/proxy-ownership/v1',
            action: 'get',
          }),
        ]).then(
          ([settings, ownership]) => done({ settings, ownership }),
          (error) => done({ error: String(error) }),
        );
      `),
    (value) =>
      value?.settings?.levelOfControl === 'not_controllable' &&
      value.ownership?.ok === true &&
      value.ownership.view?.blocked === true &&
      value.ownership.view?.reason === 'policy' &&
      value.ownership.view?.controlLevel === 'not-controllable',
    'Firefox locked proxy policy did not produce the policy-owned ownership state',
  );

  await navigateCurrentContext(`moz-extension://${extensionUuid}/popup.html`);
  const popupState = await waitForValue(
    () =>
      driver.executeScript(`
        const panel = document.querySelector('[data-popup-proxy-not-controllable]');
        return {
          ready: Boolean(panel),
          reason: panel?.getAttribute('data-reason') ?? null,
          profileRows: document.querySelectorAll('.profile-row').length,
          footers: document.querySelectorAll('.popup-footer').length,
          buttons: panel?.querySelectorAll('.proxy-control-actions button').length ?? 0,
          manage: panel?.querySelectorAll('[data-popup-manage-extensions]').length ?? 0,
        };
      `),
    (value) => value?.ready === true,
    'Firefox policy-owned Popup panel did not render',
  );

  assert.equal(popupState.reason, 'policy');
  assert.equal(popupState.profileRows, 0);
  assert.equal(popupState.footers, 0);
  assert.equal(popupState.buttons, 2);
  assert.equal(popupState.manage, 1);

  console.log(
    JSON.stringify({
      levelOfControl: policyState.settings.levelOfControl,
      reason: policyState.ownership.view.reason,
      blocked: policyState.ownership.view.blocked,
      popupState,
    }),
  );
} finally {
  await driver.quit();
}
