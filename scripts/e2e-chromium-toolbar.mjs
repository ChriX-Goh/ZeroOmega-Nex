import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-toolbar-'));
const server = createServer((_request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end('<!doctype html><html><body>ZeroOmega toolbar Action E2E</body></html>');
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '127.0.0.1', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Toolbar E2E server failed');

const channel = 'zeroomega-nex/profile-workflow/v1';
const proxyProfileId = 'profile-default-proxy';
const proxyEndpointId = 'endpoint-toolbar-e2e';
let context;

async function readActionState(extensionPage, tabId) {
  return extensionPage.evaluate(
    async (targetTabId) => ({
      title: await chrome.action.getTitle({ tabId: targetTabId }),
      badgeText: await chrome.action.getBadgeText({ tabId: targetTabId }),
      popup: await chrome.action.getPopup({ tabId: targetTabId }),
    }),
    tabId,
  );
}

async function waitForActionState(extensionPage, tabId, expected, label) {
  const deadline = Date.now() + 20_000;
  let actual;
  while (Date.now() < deadline) {
    actual = await readActionState(extensionPage, tabId);
    if (JSON.stringify(actual) === JSON.stringify(expected)) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.deepEqual(actual, expected, label);
}

async function sendWorkflowCommand(extensionPage, command) {
  return extensionPage.evaluate(
    async (workflowCommand) => chrome.runtime.sendMessage(workflowCommand),
    command,
  );
}

async function tabIdForUrl(extensionPage, url) {
  const tabId = await extensionPage.evaluate(async (targetUrl) => {
    const tab = (await chrome.tabs.query({})).find((candidate) => candidate.url === targetUrl);
    return tab?.id;
  }, url);
  assert.equal(typeof tabId, 'number', `Chromium tab ID was not resolved for ${url}`);
  return tabId;
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--host-resolver-rules=MAP toolbar-a.test 127.0.0.1',
    ],
  });

  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  assert.match(extensionId, /^[a-p]{32}$/u, 'Chromium extension ID was not resolved');
  const popup = `chrome-extension://${extensionId}/popup-iframe.html`;

  const extensionPage = await context.newPage();
  await extensionPage.goto(`chrome-extension://${extensionId}/options.html`);
  await extensionPage.waitForLoadState('domcontentloaded');
  const expectedTitles = await extensionPage.evaluate((proxyPort) => {
    const resultTitle = (currentProfileName, resultProfileName, details) =>
      chrome.i18n.getMessage('browserAction_titleWithResult', [
        currentProfileName,
        resultProfileName,
        details,
      ]);
    const systemName = chrome.i18n.getMessage('routeSystem');
    const directName = chrome.i18n.getMessage('routeDirect');
    const externalDetail = chrome.i18n.getMessage('browserAction_titleExternalProxy');
    const directDetail = chrome.i18n.getMessage('browserAction_directResult');
    const defaultDetail = chrome.i18n.getMessage('browserAction_defaultRuleDetails');
    return {
      system: resultTitle(`[${systemName}]`, `[${systemName}]`, externalDetail),
      direct: resultTitle(`[${directName}]`, `[${directName}]`, directDetail),
      fixedProxy: resultTitle('Toolbar Proxy', 'Toolbar Proxy', `PROXY 127.0.0.1:${proxyPort}\n`),
      fixedBypass: resultTitle('Toolbar Proxy', 'Toolbar Proxy', `localhost => ${directDetail}\n`),
      switchMatched: resultTitle(
        'Toolbar Switch',
        'Toolbar Proxy',
        `toolbar-a.test => Toolbar Proxy\nPROXY 127.0.0.1:${proxyPort}\n`,
      ),
      switchDirectMatched: resultTitle(
        'Toolbar Switch',
        `[${directName}]`,
        `localhost => [${directName}]\n`,
      ),
      switchDirectDefault: resultTitle(
        'Toolbar Switch',
        `[${directName}]`,
        `${defaultDetail} => [${directName}]\n`,
      ),
      virtualFixedProxy: resultTitle(
        'Toolbar Virtual [Toolbar Proxy]',
        'Toolbar Proxy',
        `PROXY 127.0.0.1:${proxyPort}\n`,
      ),
      virtualFixedBypass: resultTitle(
        'Toolbar Virtual [Toolbar Proxy]',
        'Toolbar Proxy',
        `localhost => ${directDetail}\n`,
      ),
      virtualDirect: resultTitle(
        `Toolbar Virtual Direct [[${directName}]]`,
        `[${directName}]`,
        directDetail,
      ),
      default: chrome.i18n.getMessage('manifest_icon_default_title'),
    };
  }, address.port);

  const internalPage = await context.newPage();
  await internalPage.goto('chrome://version/');
  const internalUrl = internalPage.url();
  const internalTabId = await tabIdForUrl(extensionPage, internalUrl);

  const proxyPage = await context.newPage();
  const proxyUrl = `http://toolbar-a.test:${address.port}/alpha`;
  await proxyPage.goto(proxyUrl, { waitUntil: 'domcontentloaded' });
  const bypassPage = await context.newPage();
  const bypassUrl = `http://localhost:${address.port}/beta`;
  await bypassPage.goto(bypassUrl, { waitUntil: 'domcontentloaded' });
  const proxyTabId = await tabIdForUrl(extensionPage, proxyUrl);
  const bypassTabId = await tabIdForUrl(extensionPage, bypassUrl);

  const systemState = { title: expectedTitles.system, badgeText: '', popup };
  await waitForActionState(extensionPage, proxyTabId, systemState, 'System Action state failed');
  await waitForActionState(extensionPage, bypassTabId, systemState, 'System two-tab state failed');
  await waitForActionState(
    extensionPage,
    internalTabId,
    systemState,
    'System internal-page Action state failed',
  );

  const initial = await sendWorkflowCommand(extensionPage, { channel, action: 'get' });
  assert.equal(initial?.ok, true, `Initial workflow failed: ${JSON.stringify(initial)}`);
  assert.deepEqual(initial.runtime?.activeRoute, { kind: 'system' });

  const direct = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: initial.state.applied.revision.id,
    route: { kind: 'direct' },
  });
  assert.equal(direct?.ok, true, `Direct activation failed: ${JSON.stringify(direct)}`);
  const directState = { title: expectedTitles.direct, badgeText: '', popup };
  await waitForActionState(extensionPage, proxyTabId, directState, 'Direct Action state failed');
  await waitForActionState(extensionPage, bypassTabId, directState, 'Direct two-tab state failed');

  const current = await sendWorkflowCommand(extensionPage, { channel, action: 'get' });
  assert.equal(current?.ok, true, `Workflow refresh failed: ${JSON.stringify(current)}`);
  const draft = structuredClone(current.state.draft);
  const profile = draft.profiles.find((candidate) => candidate.id === proxyProfileId);
  assert.equal(profile?.kind, 'fixed', 'Default Fixed Profile was not found');
  profile.name = 'Toolbar Proxy';
  profile.color = '#64b5f6';
  profile.proxyByScheme = { fallback: proxyEndpointId };
  draft.proxyEndpoints = [
    {
      id: proxyEndpointId,
      name: 'Toolbar E2E endpoint',
      protocol: 'http',
      host: '127.0.0.1',
      port: address.port,
    },
  ];
  draft.settings.interface.showResultProfileOnActionBadgeText = true;

  const replaced = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'replace-draft',
    expectedGeneration: current.state.generation,
    draft,
  });
  assert.equal(replaced?.ok, true, `Draft replacement failed: ${JSON.stringify(replaced)}`);
  const applied = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'apply',
    expectedGeneration: replaced.state.generation,
  });
  assert.equal(applied?.ok, true, `Fixed Apply failed: ${JSON.stringify(applied)}`);
  const activated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId: proxyProfileId },
  });
  assert.equal(activated?.ok, true, `Fixed activation failed: ${JSON.stringify(activated)}`);

  await waitForActionState(
    extensionPage,
    proxyTabId,
    {
      title: expectedTitles.fixedProxy,
      badgeText: 'Tool',
      popup,
    },
    'Fixed proxy Action state failed',
  );
  await waitForActionState(
    extensionPage,
    bypassTabId,
    {
      title: expectedTitles.fixedBypass,
      badgeText: 'Tool',
      popup,
    },
    'Fixed bypass Action state failed',
  );
  await waitForActionState(
    extensionPage,
    internalTabId,
    { title: expectedTitles.default, badgeText: '', popup },
    'Fixed internal-page fallback Action state failed',
  );

  const sameTabBypassUrl = `http://localhost:${address.port}/same-tab-bypass`;
  await proxyPage.goto(sameTabBypassUrl, { waitUntil: 'domcontentloaded' });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    { title: expectedTitles.fixedBypass, badgeText: 'Tool', popup },
    'Same-tab proxy-to-bypass Action transition failed',
  );
  const sameTabProxyUrl = `http://toolbar-a.test:${address.port}/same-tab-proxy`;
  await proxyPage.goto(sameTabProxyUrl, { waitUntil: 'domcontentloaded' });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    { title: expectedTitles.fixedProxy, badgeText: 'Tool', popup },
    'Same-tab bypass-to-proxy Action transition failed',
  );

  const switchCurrent = await sendWorkflowCommand(extensionPage, { channel, action: 'get' });
  assert.equal(
    switchCurrent?.ok,
    true,
    `Switch workflow refresh failed: ${JSON.stringify(switchCurrent)}`,
  );
  const switchDraft = structuredClone(switchCurrent.state.draft);
  const switchFixed = switchDraft.profiles.find((candidate) => candidate.id === proxyProfileId);
  assert.equal(switchFixed?.kind, 'fixed', 'Switch target Fixed Profile was not found');
  switchFixed.bypass = [];
  switchDraft.profiles.push({
    id: 'profile-toolbar-switch',
    name: 'Toolbar Switch',
    color: '#ffb74d',
    kind: 'switch',
    rules: [
      {
        id: 'rule-toolbar-a',
        condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
        route: { kind: 'profile', profileId: proxyProfileId },
      },
      {
        id: 'rule-toolbar-direct',
        condition: { kind: 'host-wildcard', pattern: 'localhost' },
        route: { kind: 'direct' },
      },
    ],
    defaultRoute: { kind: 'direct' },
  });
  switchDraft.settings.quickSwitch.routes.push({
    kind: 'profile',
    profileId: 'profile-toolbar-switch',
  });
  const switchReplaced = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'replace-draft',
    expectedGeneration: switchCurrent.state.generation,
    draft: switchDraft,
  });
  assert.equal(
    switchReplaced?.ok,
    true,
    `Switch draft replacement failed: ${JSON.stringify(switchReplaced)}`,
  );
  const switchApplied = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'apply',
    expectedGeneration: switchReplaced.state.generation,
  });
  assert.equal(switchApplied?.ok, true, `Switch Apply failed: ${JSON.stringify(switchApplied)}`);
  const switchActivated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: switchApplied.state.applied.revision.id,
    route: { kind: 'profile', profileId: 'profile-toolbar-switch' },
  });
  assert.equal(
    switchActivated?.ok,
    true,
    `Switch activation failed: ${JSON.stringify(switchActivated)}`,
  );

  const switchMatchedState = { title: expectedTitles.switchMatched, badgeText: 'Tool', popup };
  const switchDirectMatchedState = {
    title: expectedTitles.switchDirectMatched,
    badgeText: 'Dire',
    popup,
  };
  const switchDirectDefaultState = {
    title: expectedTitles.switchDirectDefault,
    badgeText: 'Dire',
    popup,
  };
  await waitForActionState(
    extensionPage,
    proxyTabId,
    switchMatchedState,
    'Switch matched-rule Action state failed',
  );
  await waitForActionState(
    extensionPage,
    bypassTabId,
    switchDirectMatchedState,
    'Switch matched-Direct Action state failed',
  );
  await waitForActionState(
    extensionPage,
    internalTabId,
    { title: expectedTitles.default, badgeText: '', popup },
    'Switch internal-page fallback Action state failed',
  );

  const switchDefaultDirectUrl = `http://127.0.0.1:${address.port}/switch-default-direct`;
  await proxyPage.goto(switchDefaultDirectUrl, { waitUntil: 'domcontentloaded' });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    switchDirectDefaultState,
    'Switch same-tab Fixed-to-default-Direct transition failed',
  );
  await proxyPage.goto(sameTabProxyUrl, { waitUntil: 'domcontentloaded' });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    switchMatchedState,
    'Switch same-tab default-Direct-to-Fixed transition failed',
  );

  const virtualCurrent = await sendWorkflowCommand(extensionPage, { channel, action: 'get' });
  assert.equal(
    virtualCurrent?.ok,
    true,
    `Virtual workflow refresh failed: ${JSON.stringify(virtualCurrent)}`,
  );
  const virtualDraft = structuredClone(virtualCurrent.state.draft);
  const virtualFixed = virtualDraft.profiles.find((candidate) => candidate.id === proxyProfileId);
  assert.equal(virtualFixed?.kind, 'fixed', 'Virtual target Fixed Profile was not found');
  virtualFixed.bypass = [{ id: 'bypass-toolbar-localhost', pattern: 'localhost' }];
  virtualDraft.profiles.push(
    {
      id: 'profile-toolbar-virtual-fixed',
      name: 'Toolbar Virtual',
      kind: 'virtual',
      targetRoute: { kind: 'profile', profileId: proxyProfileId },
    },
    {
      id: 'profile-toolbar-virtual-direct',
      name: 'Toolbar Virtual Direct',
      kind: 'virtual',
      targetRoute: { kind: 'direct' },
    },
  );
  virtualDraft.settings.quickSwitch.routes.push(
    { kind: 'profile', profileId: 'profile-toolbar-virtual-fixed' },
    { kind: 'profile', profileId: 'profile-toolbar-virtual-direct' },
  );
  const virtualReplaced = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'replace-draft',
    expectedGeneration: virtualCurrent.state.generation,
    draft: virtualDraft,
  });
  assert.equal(
    virtualReplaced?.ok,
    true,
    `Virtual draft replacement failed: ${JSON.stringify(virtualReplaced)}`,
  );
  const virtualApplied = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'apply',
    expectedGeneration: virtualReplaced.state.generation,
  });
  assert.equal(virtualApplied?.ok, true, `Virtual Apply failed: ${JSON.stringify(virtualApplied)}`);
  const virtualFixedActivated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: virtualApplied.state.applied.revision.id,
    route: { kind: 'profile', profileId: 'profile-toolbar-virtual-fixed' },
  });
  assert.equal(
    virtualFixedActivated?.ok,
    true,
    `Virtual Fixed activation failed: ${JSON.stringify(virtualFixedActivated)}`,
  );

  await waitForActionState(
    extensionPage,
    proxyTabId,
    { title: expectedTitles.virtualFixedProxy, badgeText: 'Tool', popup },
    'Virtual-to-Fixed proxy Action state failed',
  );
  await waitForActionState(
    extensionPage,
    bypassTabId,
    { title: expectedTitles.virtualFixedBypass, badgeText: 'Tool', popup },
    'Virtual-to-Fixed bypass Action state failed',
  );
  await waitForActionState(
    extensionPage,
    internalTabId,
    { title: expectedTitles.default, badgeText: '', popup },
    'Virtual-to-Fixed internal-page fallback Action state failed',
  );

  const virtualDirectActivated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: virtualApplied.state.applied.revision.id,
    route: { kind: 'profile', profileId: 'profile-toolbar-virtual-direct' },
  });
  assert.equal(
    virtualDirectActivated?.ok,
    true,
    `Virtual Direct activation failed: ${JSON.stringify(virtualDirectActivated)}`,
  );
  const virtualDirectState = {
    title: expectedTitles.virtualDirect,
    badgeText: 'Dire',
    popup,
  };
  await waitForActionState(
    extensionPage,
    proxyTabId,
    virtualDirectState,
    'Virtual-to-Direct proxy-tab Action state failed',
  );
  await waitForActionState(
    extensionPage,
    bypassTabId,
    virtualDirectState,
    'Virtual-to-Direct bypass-tab Action state failed',
  );
  await waitForActionState(
    extensionPage,
    internalTabId,
    { title: expectedTitles.default, badgeText: '', popup },
    'Virtual-to-Direct internal-page fallback Action state failed',
  );

  console.log(`Chromium toolbar Action E2E passed for ${extensionId}.`);
} finally {
  await context?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
}
