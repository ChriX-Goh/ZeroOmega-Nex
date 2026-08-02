import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

import { Browser, Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

import {
  configureNestedSwitchDraft,
  configureNestedVirtualDraft,
  configurePacDraft,
  configureTemporaryRuleDraft,
  configureVirtualSwitchDraft,
  NEX_TOOLBAR_WORKFLOW_CHANNEL,
  POPUP_TEMPORARY_RULE_CHANNEL,
  nestedSwitchCases,
  nestedVirtualCases,
  pacCases,
  PROFILE_TRACE_HOSTS,
  RUNTIME_PAC_SCRIPT,
  temporaryRuleCases,
  virtualSwitchCases,
} from './nex-toolbar-profile-trace-scenarios.mjs';

const server = createServer((request, response) => {
  if (request.url === '/runtime-pac.pac') {
    response.writeHead(200, {
      'content-type': 'application/x-ns-proxy-autoconfig; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(RUNTIME_PAC_SCRIPT);
    return;
  }
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
const pacUrl = `http://127.0.0.1:${address.port}/runtime-pac.pac`;

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000010';
const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference('intl.accept_languages', 'zh-TW')
  .enableBidi()
  .setPreference('extensions.webextOptionalPermissionPrompts', false)
  .setPreference('network.dns.disableIPv6', true)
  .setPreference('network.dns.localDomains', PROFILE_TRACE_HOSTS.join(','))
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

async function localizedActionState(capture, popup) {
  return driver.executeScript(
    `
      return {
        title: browser.i18n.getMessage('browserAction_titleWithResult', [
          arguments[0],
          arguments[1],
          arguments[2],
        ]),
        badgeText: arguments[3],
        popup: arguments[4],
      };
    `,
    capture.currentProfileName,
    capture.resultProfileName,
    capture.details,
    capture.badgeText,
    popup,
  );
}

async function openCases(cases) {
  const tabs = [];
  for (const capture of cases) {
    const url = `http://${capture.host}:${address.port}${capture.path}`;
    await driver.switchTo().newWindow('tab');
    await driver.get(url);
    tabs.push({ capture, url });
  }
  return tabs;
}

async function resolveTabIds(tabs) {
  for (const tab of tabs) {
    tab.tabId = await tabIdForUrl(tab.url);
  }
}

async function activateProfile(appliedRevisionId, profileId, label) {
  const activated = await sendWorkflowCommand({
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'activate-route',
    expectedAppliedRevisionId: appliedRevisionId,
    route: { kind: 'profile', profileId },
  });
  assert.equal(activated?.ok, true, `${label} activation failed: ${JSON.stringify(activated)}`);
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
      temporaryPrefix: browser.i18n.getMessage('browserAction_tempRulePrefix'),
    };
  `);
  const switchCases = nestedSwitchCases({ proxyPort: address.port, ...localization });
  const virtualCases = nestedVirtualCases({ proxyPort: address.port, ...localization });
  const virtualSwitchTraceCases = virtualSwitchCases({
    proxyPort: address.port,
    ...localization,
  });
  const runtimePacCases = pacCases({ pacUrl });
  const temporaryCases = temporaryRuleCases({
    proxyPort: address.port,
    ...localization,
  });
  const switchTabs = await openCases(switchCases);
  const virtualTabs = await openCases(virtualCases);
  const virtualSwitchTabs = await openCases(virtualSwitchTraceCases);
  const pacTabs = await openCases(runtimePacCases);
  const temporaryTabs = await openCases([temporaryCases.matched, temporaryCases.unmatched]);
  await driver.switchTo().window(optionsWindow);
  await resolveTabIds(switchTabs);
  await resolveTabIds(virtualTabs);
  await resolveTabIds(virtualSwitchTabs);
  await resolveTabIds(pacTabs);
  await resolveTabIds(temporaryTabs);

  const current = await sendWorkflowCommand({
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'get',
  });
  assert.equal(current?.ok, true, `Firefox workflow refresh failed: ${JSON.stringify(current)}`);
  const draft = structuredClone(current.state.draft);
  const switchScenario = configureNestedSwitchDraft(draft, address.port);
  const virtualScenario = configureNestedVirtualDraft(draft, address.port);
  const virtualSwitchScenario = configureVirtualSwitchDraft(draft, address.port);
  const pacScenario = configurePacDraft(draft, pacUrl);
  const temporaryScenario = configureTemporaryRuleDraft(draft, address.port);

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

  await activateProfile(applied.state.applied.revision.id, switchScenario.outerProfileId, 'Switch');
  for (const { capture, tabId } of switchTabs) {
    await waitForActionState(
      tabId,
      await localizedActionState(capture, popup),
      `Firefox nested Switch case ${capture.id} failed`,
    );
  }

  await activateProfile(
    applied.state.applied.revision.id,
    virtualScenario.outerDirectProfileId,
    'Nested Virtual Direct',
  );
  for (const { capture, tabId } of virtualTabs.filter(
    ({ capture }) => capture.activationProfileId === virtualScenario.outerDirectProfileId,
  )) {
    await waitForActionState(
      tabId,
      await localizedActionState(capture, popup),
      `Firefox nested Virtual Direct case ${capture.id} failed`,
    );
  }

  await activateProfile(
    applied.state.applied.revision.id,
    virtualScenario.outerFixedProfileId,
    'Nested Virtual Fixed',
  );
  for (const { capture, tabId } of virtualTabs.filter(
    ({ capture }) => capture.activationProfileId === virtualScenario.outerFixedProfileId,
  )) {
    await waitForActionState(
      tabId,
      await localizedActionState(capture, popup),
      `Firefox nested Virtual Fixed case ${capture.id} failed`,
    );
  }

  await activateProfile(
    applied.state.applied.revision.id,
    virtualSwitchScenario.outerProfileId,
    'Virtual Switch',
  );
  for (const { capture, tabId } of virtualSwitchTabs) {
    await waitForActionState(
      tabId,
      await localizedActionState(capture, popup),
      `Firefox Virtual to Switch case ${capture.id} failed`,
    );
  }

  await activateProfile(applied.state.applied.revision.id, pacScenario.profileId, 'PAC');
  for (const { capture, tabId } of pacTabs) {
    await waitForActionState(
      tabId,
      await localizedActionState(capture, popup),
      `Firefox PAC case ${capture.id} failed`,
    );
  }

  await activateProfile(
    applied.state.applied.revision.id,
    temporaryScenario.baseProfileId,
    'Temporary rule base',
  );
  const toggled = await sendWorkflowCommand({
    channel: POPUP_TEMPORARY_RULE_CHANNEL,
    action: 'toggle',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    domain: temporaryScenario.domain,
    route: { kind: 'profile', profileId: temporaryScenario.fixedProfileId },
  });
  assert.equal(
    toggled?.ok,
    true,
    `Firefox temporary rule toggle failed: ${JSON.stringify(toggled)}`,
  );
  for (const { capture, tabId } of temporaryTabs) {
    await waitForActionState(
      tabId,
      await localizedActionState(capture, popup),
      `Firefox temporary rule case ${capture.id} failed`,
    );
  }
  const removed = await sendWorkflowCommand({
    channel: POPUP_TEMPORARY_RULE_CHANNEL,
    action: 'remove',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    domain: temporaryScenario.domain,
  });
  assert.equal(
    removed?.ok,
    true,
    `Firefox temporary rule removal failed: ${JSON.stringify(removed)}`,
  );
  const matchedTab = temporaryTabs.find(({ capture }) => capture.id === temporaryCases.matched.id);
  assert.ok(matchedTab, 'Firefox temporary rule matched tab was not found');
  await waitForActionState(
    matchedTab.tabId,
    await localizedActionState(temporaryCases.removed, popup),
    'Firefox removed temporary rule did not retain the hidden default overlay',
  );

  console.log(`Firefox Toolbar profile trace E2E passed for ${addonId}.`);
} finally {
  await driver.quit();
  await new Promise((resolveClose) => server.close(resolveClose));
}
