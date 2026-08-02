import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { Browser, Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const extensionPath = resolve('dist/firefox-mv3');
const profileDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-firefox-restart-'));
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000018';
const channel = 'zeroomega-nex/profile-workflow/v1';
const profileId = 'profile-default-proxy';
const endpointId = 'endpoint-toolbar-restart';

const server = createServer((_request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end('<!doctype html><html><body>Firefox Toolbar restart acceptance</body></html>');
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '0.0.0', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Restart server failed');

function firefoxOptions() {
  return new firefox.Options()
    .addArguments('-headless', '-profile', profileDir)
    .enableBidi()
    .setPreference('intl.accept_languages', 'zh-TW')
    .setPreference('extensions.webextOptionalPermissionPrompts', false)
    .setPreference('network.dns.disableIPv6', true)
    .setPreference('network.dns.localDomains', 'toolbar-restart.test')
    .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));
}

async function launch() {
  return new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(firefoxOptions()).build();
}

async function bidiCommand(driver, method, params) {
  const capabilities = await driver.getCapabilities();
  const webSocketUrl = capabilities.get('webSocketUrl');
  assert.equal(typeof webSocketUrl, 'string', 'Firefox did not expose a BiDi URL');
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', () => rejectOpen(new Error('Firefox BiDi connection failed')), {
      once: true,
    });
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

async function installExtension(driver) {
  const result = await bidiCommand(driver, 'webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  assert.equal(result?.extension, addonId, 'Firefox returned an unexpected add-on ID');
}

async function navigateExtensionPage(driver) {
  const context = await driver.getWindowHandle();
  const url = `moz-extension://${extensionUuid}/options.html`;
  const result = await bidiCommand(driver, 'browsingContext.navigate', {
    context,
    url,
    wait: 'complete',
  });
  assert.equal(result?.url, url, 'Firefox did not navigate to the extension options page');
  await driver.wait(async () => (await driver.getCurrentUrl()) === url, 20_000);
}

async function sendWorkflowCommand(driver, command) {
  return driver.executeAsyncScript(
    `
      const command = arguments[0];
      const done = arguments[1];
      browser.runtime.sendMessage(command).then(done, (error) => done({ error: String(error) }));
    `,
    command,
  );
}

async function waitForWorkflowGet(driver) {
  let response;
  await driver.wait(async () => {
    response = await sendWorkflowCommand(driver, { channel, action: 'get' });
    return response?.ok === true;
  }, 20_000);
  return response;
}

async function tabIdForUrl(driver, url) {
  const tabId = await driver.executeAsyncScript(
    `
      const targetUrl = arguments[0];
      const done = arguments[1];
      browser.tabs.query({}).then(
        (tabs) => done(tabs.find((tab) => tab.url === targetUrl)?.id),
        (error) => done({ error: String(error) }),
      );
    `,
    url,
  );
  assert.equal(typeof tabId, 'number', `Firefox tab ID was not resolved for ${url}`);
  return tabId;
}

async function readActionState(driver, tabId) {
  return driver.executeAsyncScript(
    `
      const tabId = arguments[0];
      const done = arguments[1];
      Promise.all([
        browser.action.getTitle({ tabId }),
        browser.action.getBadgeText({ tabId }),
        browser.action.getPopup({ tabId }),
      ]).then(
        ([title, badgeText, popup]) => done({ title, badgeText, popup }),
        (error) => done({ error: String(error) }),
      );
    `,
    tabId,
  );
}

async function expectedFixedState(driver) {
  return driver.executeScript(
    `
      return {
        title: browser.i18n.getMessage('browserAction_titleWithResult', [
          'Restart Proxy',
          'Restart Proxy',
          'PROXY 127.0.0.1:' + arguments[0] + '\\n',
        ]),
        badgeText: 'Rest',
        popup: 'moz-extension://${extensionUuid}/popup-iframe.html',
      };
    `,
    address.port,
  );
}

async function waitForActionState(driver, tabId, expected, label) {
  let actual;
  try {
    await driver.wait(async () => {
      actual = await readActionState(driver, tabId);
      return JSON.stringify(actual) === JSON.stringify(expected);
    }, 20_000);
  } catch {
    assert.deepEqual(actual, expected, label);
  }
}

async function openAcceptancePage(driver, optionsWindow, suffix) {
  await driver.switchTo().newWindow('tab');
  const pageWindow = await driver.getWindowHandle();
  const url = `http://toolbar-restart.test:${address.port}/${suffix}`;
  await driver.get(url);
  await driver.switchTo().window(optionsWindow);
  return { pageWindow, url };
}

let driver;
try {
  driver = await launch();
  await installExtension(driver);
  await navigateExtensionPage(driver);
  let optionsWindow = await driver.getWindowHandle();

  const initial = await waitForWorkflowGet(driver);
  assert.deepEqual(initial.runtime?.activeRoute, { kind: 'system' });

  const draft = structuredClone(initial.state.draft);
  const profile = draft.profiles.find((candidate) => candidate.id === profileId);
  assert.equal(profile?.kind, 'fixed', 'Default Fixed profile was not found');
  profile.name = 'Restart Proxy';
  profile.color = '#64b5f6';
  profile.bypass = [];
  profile.proxyByScheme = { fallback: endpointId };
  draft.proxyEndpoints = [
    {
      id: endpointId,
      name: 'Toolbar restart endpoint',
      protocol: 'http',
      host: '127.0.0.1',
      port: address.port,
    },
  ];
  draft.settings.interface.showResultProfileOnActionBadgeText = true;

  const replaced = await sendWorkflowCommand(driver, {
    channel,
    action: 'replace-draft',
    expectedGeneration: initial.state.generation,
    draft,
  });
  assert.equal(replaced?.ok, true, `Draft replacement failed: ${JSON.stringify(replaced)}`);
  const applied = await sendWorkflowCommand(driver, {
    channel,
    action: 'apply',
    expectedGeneration: replaced.state.generation,
  });
  assert.equal(applied?.ok, true, `Apply failed: ${JSON.stringify(applied)}`);
  const activated = await sendWorkflowCommand(driver, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId },
  });
  assert.equal(activated?.ok, true, `Activation failed: ${JSON.stringify(activated)}`);

  const beforeRestart = await openAcceptancePage(driver, optionsWindow, 'before-restart');
  const beforeTabId = await tabIdForUrl(driver, beforeRestart.url);
  await waitForActionState(
    driver,
    beforeTabId,
    await expectedFixedState(driver),
    'Firefox pre-restart Fixed Action state failed',
  );

  await driver.quit();
  driver = undefined;

  driver = await launch();
  await installExtension(driver);
  await navigateExtensionPage(driver);
  optionsWindow = await driver.getWindowHandle();

  const restored = await waitForWorkflowGet(driver);
  assert.deepEqual(restored.runtime?.activeRoute, { kind: 'profile', profileId });
  assert.equal(
    restored.state.applied.document.profiles.find((item) => item.id === profileId)?.name,
    'Restart Proxy',
  );
  assert.deepEqual(
    restored.state.applied.document.proxyEndpoints.find((item) => item.id === endpointId),
    {
      id: endpointId,
      name: 'Toolbar restart endpoint',
      protocol: 'http',
      host: '127.0.0.1',
      port: address.port,
    },
  );

  const afterRestart = await openAcceptancePage(driver, optionsWindow, 'after-restart');
  const afterTabId = await tabIdForUrl(driver, afterRestart.url);
  await waitForActionState(
    driver,
    afterTabId,
    await expectedFixedState(driver),
    'Firefox post-restart Fixed Action state failed',
  );

  console.log('Firefox Toolbar normal-restart acceptance passed.');
} finally {
  if (driver) await driver.quit();
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(profileDir, { recursive: true, force: true });
}
