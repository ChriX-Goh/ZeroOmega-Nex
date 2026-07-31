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
  const expectedTitles = await extensionPage.evaluate(() => {
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
    return {
      system: resultTitle(`[${systemName}]`, `[${systemName}]`, externalDetail),
      direct: resultTitle(`[${directName}]`, `[${directName}]`, directDetail),
      fixedProxy: resultTitle(
        'Toolbar Proxy',
        'Toolbar Proxy',
        'PROXY 127.0.0.1:7890\n',
      ),
      fixedBypass: resultTitle(
        'Toolbar Proxy',
        'Toolbar Proxy',
        `localhost => ${directDetail}\n`,
      ),
    };
  });

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
      port: 7890,
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

  console.log(`Chromium toolbar Action E2E passed for ${extensionId}.`);
} finally {
  await context?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
}
