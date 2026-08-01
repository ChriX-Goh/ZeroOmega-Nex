import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

import { Browser, Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

import {
  configureNestedSwitchDraft,
  NESTED_SWITCH_SCENARIO,
  NEX_TOOLBAR_WORKFLOW_CHANNEL,
  nestedSwitchCases,
} from './nex-toolbar-profile-trace-scenarios.mjs';

const server = createServer((_request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end('<!doctype html><html><body>Profile trace toolbar E2E</body></html>');
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '0.0.0.0', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Firefox profile trace server failed');
}

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000010';
const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference('intl.accept_languages', 'zh-TW')
  .enableBidi()
  .setPreference('extensions.webextOptionalPermissionPrompts', false)
  .setPreference('network.dns.disableIPv6', true)
  .setPreference('network.dns.localDomains', NESTED_SWITCH_SCENARIO.hosts.join(','))
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

async function navigateExtensionPage(relativeUrl) {
  const context = await driver.getWindowHandle();
  const url = `moz-extension://${extensionUuid}/${relativeUrl}`;
  const result = await bidiCommand('browsingContext.navigate', {
    context,
    url,
    wait: 'complete',
  });
  assert.equal(result?.url, url, 'Firefox navigated to an unexpected extension URL');
}

async function sendWorkflowCommand(command) {
  return driver.executeAsyncScript(
    `
      const command = arguments[0];
      const done = arguments[1];
      browser.runtime.sendMessage(command).then(done, (error) => done({ error: String(error) }));
    `,
    command,
  );
}

async function tabIdForUrl(url) {
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

async function readActionState(tabId) {
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

async function waitForActionState(tabId, expected, label) {
  let actual;
  try {
    await driver.wait(async () => {
      actual = await readActionState(tabId);
      return JSON.stringify(actual) === JSON.stringify(expected);
    }, 20_000);
  } catch {
    assert.deepEqual(actual, expected, label);
  }
}

async function localizedActionState(resultProfileName, details, badgeText, popup) {
  return driver.executeScript(
    `
      return {
        title: browser.i18n.getMessage('browserAction_titleWithResult', [
          'Runtime Nested Outer Switch',
          arguments[0],
          arguments[1],
        ]),
        badgeText: arguments[2],
        popup: arguments[3],
      };
    `,
    resultProfileName,
    details,
    badgeText,
    popup,
  );
}

try {
  const installResult = await bidiCommand('webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  assert.equal(installResult?.extension, addonId, 'Firefox returned an unexpected add-on ID');

  await navigateExtensionPage('options.html');
  const optionsWindow = await driver.getWindowHandle();
  const popup = `moz-extension://${extensionUuid}/popup-iframe.html`;
  const localization = await driver.executeScript(`
    return {
      directName: browser.i18n.getMessage('routeDirect'),
      defaultDetail: browser.i18n.getMessage('browserAction_defaultRuleDetails'),
    };
  `);
  const cases = nestedSwitchCases({ proxyPort: address.port, ...localization });

  const tabs = [];
  for (const capture of cases) {
    const url = `http://${capture.host}:${address.port}${capture.path}`;
    await driver.switchTo().newWindow('tab');
    await driver.get(url);
    tabs.push({ capture, url });
  }
  await driver.switchTo().window(optionsWindow);
  for (const tab of tabs) {
    tab.tabId = await tabIdForUrl(tab.url);
  }

  const current = await sendWorkflowCommand({
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'get',
  });
  assert.equal(current?.ok, true, `Firefox workflow refresh failed: ${JSON.stringify(current)}`);
  const draft = structuredClone(current.state.draft);
  const scenario = configureNestedSwitchDraft(draft, address.port);

  const replaced = await sendWorkflowCommand({
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'replace-draft',
    expectedGeneration: current.state.generation,
    draft,
  });
  assert.equal(replaced?.ok, true, `Firefox draft replacement failed: ${JSON.stringify(replaced)}`);
  const applied = await sendWorkflowCommand({
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'apply',
    expectedGeneration: replaced.state.generation,
  });
  assert.equal(applied?.ok, true, `Firefox Apply failed: ${JSON.stringify(applied)}`);
  const activated = await sendWorkflowCommand({
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId: scenario.outerProfileId },
  });
  assert.equal(activated?.ok, true, `Firefox activation failed: ${JSON.stringify(activated)}`);

  for (const { capture, tabId } of tabs) {
    await waitForActionState(
      tabId,
      await localizedActionState(
        capture.resultProfileName,
        capture.details,
        capture.badgeText,
        popup,
      ),
      `Firefox nested Switch case ${capture.id} failed`,
    );
  }

  console.log(`Firefox nested Switch toolbar E2E passed for ${addonId}.`);
} finally {
  await driver.quit();
  await new Promise((resolveClose) => server.close(resolveClose));
}
