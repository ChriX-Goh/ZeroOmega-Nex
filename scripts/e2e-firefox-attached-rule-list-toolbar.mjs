import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

import { Browser, Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const server = createServer((_request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end('<!doctype html><html><body>Attached Rule List toolbar E2E</body></html>');
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '0.0.0.0', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Attached Rule List Firefox server failed');
}

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000009';
const channel = 'zeroomega-nex/profile-workflow/v1';
const fixedProfileId = 'profile-default-proxy';
const fixedEndpointId = 'endpoint-attached-rule-list-e2e';
const fixedParentId = 'profile-attached-fixed-switch';
const fixedRuleListId = 'profile-attached-fixed-rule-list';
const fixedSourceId = 'source-attached-fixed-rule-list';
const directParentId = 'profile-attached-direct-switch';
const directRuleListId = 'profile-attached-direct-rule-list';
const directSourceId = 'source-attached-direct-rule-list';

const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference('intl.accept_languages', 'zh-TW')
  .enableBidi()
  .setPreference('extensions.webextOptionalPermissionPrompts', false)
  .setPreference('network.dns.disableIPv6', true)
  .setPreference('network.dns.localDomains', 'attached-fixed.test,attached-direct.test')
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

async function literalActionState(currentProfileName, resultProfileName, details, popup) {
  return driver.executeScript(
    `
      return {
        title: browser.i18n.getMessage('browserAction_titleWithResult', [
          arguments[0],
          arguments[1],
          arguments[2],
        ]),
        badgeText: '',
        popup: arguments[3],
      };
    `,
    currentProfileName,
    resultProfileName,
    details,
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
  const directName = await driver.executeScript(
    "return `[${browser.i18n.getMessage('routeDirect')}]`;",
  );
  const defaultDetail = await driver.executeScript(
    "return browser.i18n.getMessage('browserAction_defaultRuleDetails');",
  );
  const attachedPrefix = await driver.executeScript(
    "return browser.i18n.getMessage('browserAction_attachedPrefix');",
  );

  const fixedMatchUrl = `http://attached-fixed.test:${address.port}/fixed-match`;
  await driver.switchTo().newWindow('tab');
  await driver.get(fixedMatchUrl);
  const fixedMatchWindow = await driver.getWindowHandle();
  const directMatchUrl = `http://attached-direct.test:${address.port}/direct-match`;
  await driver.switchTo().newWindow('tab');
  await driver.get(directMatchUrl);
  const directMatchWindow = await driver.getWindowHandle();
  const defaultUrl = `http://127.0.0.1:${address.port}/default`;
  await driver.switchTo().newWindow('tab');
  await driver.get(defaultUrl);
  const defaultWindow = await driver.getWindowHandle();
  await driver.switchTo().window(optionsWindow);

  const fixedMatchTabId = await tabIdForUrl(fixedMatchUrl);
  const directMatchTabId = await tabIdForUrl(directMatchUrl);
  const defaultTabId = await tabIdForUrl(defaultUrl);

  const current = await sendWorkflowCommand({ channel, action: 'get' });
  assert.equal(current?.ok, true, `Firefox workflow refresh failed: ${JSON.stringify(current)}`);
  const draft = structuredClone(current.state.draft);
  const fixed = draft.profiles.find((candidate) => candidate.id === fixedProfileId);
  assert.equal(fixed?.kind, 'fixed', 'Firefox default Fixed Profile was not found');
  fixed.name = 'Runtime Attached Fixed';
  fixed.color = '#64b5f6';
  fixed.bypass = [];
  fixed.proxyByScheme = { fallback: fixedEndpointId };
  draft.proxyEndpoints = [
    {
      id: fixedEndpointId,
      name: 'Attached Rule List E2E endpoint',
      protocol: 'http',
      host: '127.0.0.1',
      port: address.port,
    },
  ];
  draft.settings.interface.showResultProfileOnActionBadgeText = true;
  draft.ruleSources.push(
    {
      id: fixedSourceId,
      name: 'Attached Fixed Rules',
      format: 'autoproxy',
      location: { kind: 'inline', content: '||attached-fixed.test\n' },
    },
    {
      id: directSourceId,
      name: 'Attached Direct Rules',
      format: 'autoproxy',
      location: { kind: 'inline', content: '||attached-direct.test\n' },
    },
  );
  draft.profiles.push(
    {
      id: fixedRuleListId,
      name: '__ruleListOf_Runtime Attached Fixed Switch',
      color: '#55bb55',
      kind: 'rule-list',
      sourceId: fixedSourceId,
      matchRoute: { kind: 'profile', profileId: fixedProfileId },
      defaultRoute: { kind: 'direct' },
    },
    {
      id: fixedParentId,
      name: 'Runtime Attached Fixed Switch',
      color: '#55bb55',
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'profile', profileId: fixedRuleListId },
      attachedRuleListProfileId: fixedRuleListId,
    },
    {
      id: directRuleListId,
      name: '__ruleListOf_Runtime Attached Direct Switch',
      color: '#dd6633',
      kind: 'rule-list',
      sourceId: directSourceId,
      matchRoute: { kind: 'direct' },
      defaultRoute: { kind: 'profile', profileId: fixedProfileId },
    },
    {
      id: directParentId,
      name: 'Runtime Attached Direct Switch',
      color: '#dd6633',
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'profile', profileId: directRuleListId },
      attachedRuleListProfileId: directRuleListId,
    },
  );
  draft.settings.quickSwitch.routes.push(
    { kind: 'profile', profileId: fixedParentId },
    { kind: 'profile', profileId: directParentId },
  );

  const replaced = await sendWorkflowCommand({
    channel,
    action: 'replace-draft',
    expectedGeneration: current.state.generation,
    draft,
  });
  assert.equal(
    replaced?.ok,
    true,
    `Firefox draft replacement failed: ${JSON.stringify(replaced)}`,
  );
  const applied = await sendWorkflowCommand({
    channel,
    action: 'apply',
    expectedGeneration: replaced.state.generation,
  });
  assert.equal(applied?.ok, true, `Firefox Apply failed: ${JSON.stringify(applied)}`);

  const fixedActivated = await sendWorkflowCommand({
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId: fixedParentId },
  });
  assert.equal(
    fixedActivated?.ok,
    true,
    `Firefox attached Fixed activation failed: ${JSON.stringify(fixedActivated)}`,
  );
  await waitForActionState(
    fixedMatchTabId,
    {
      ...(await literalActionState(
        'Runtime Attached Fixed Switch',
        'Runtime Attached Fixed',
        `${attachedPrefix}||attached-fixed.test => Runtime Attached Fixed\nPROXY 127.0.0.1:${address.port}\n`,
        popup,
      )),
      badgeText: 'Runt',
    },
    'Firefox attached match into Fixed failed',
  );
  await waitForActionState(
    defaultTabId,
    {
      ...(await literalActionState(
        'Runtime Attached Fixed Switch',
        directName,
        `${defaultDetail} => ${directName}\n`,
        popup,
      )),
      badgeText: 'Dire',
    },
    'Firefox attached no-match default into Direct failed',
  );

  const directActivated = await sendWorkflowCommand({
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId: directParentId },
  });
  assert.equal(
    directActivated?.ok,
    true,
    `Firefox attached Direct activation failed: ${JSON.stringify(directActivated)}`,
  );
  await waitForActionState(
    directMatchTabId,
    {
      ...(await literalActionState(
        'Runtime Attached Direct Switch',
        directName,
        `${attachedPrefix}||attached-direct.test => ${directName}\n`,
        popup,
      )),
      badgeText: 'Dire',
    },
    'Firefox attached match into Direct failed',
  );
  await waitForActionState(
    defaultTabId,
    {
      ...(await literalActionState(
        'Runtime Attached Direct Switch',
        'Runtime Attached Fixed',
        `${defaultDetail} => Runtime Attached Fixed\nPROXY 127.0.0.1:${address.port}\n`,
        popup,
      )),
      badgeText: 'Runt',
    },
    'Firefox attached no-match default into Fixed failed',
  );

  assert.notEqual(fixedMatchWindow, directMatchWindow);
  assert.notEqual(defaultWindow, fixedMatchWindow);
  console.log(`Firefox attached Rule List toolbar E2E passed for ${addonId}.`);
} finally {
  await driver.quit();
  await new Promise((resolveClose) => server.close(resolveClose));
}
