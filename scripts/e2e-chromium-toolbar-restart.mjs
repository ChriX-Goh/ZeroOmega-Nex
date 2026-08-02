import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-chromium-restart-'));
const channel = 'zeroomega-nex/profile-workflow/v1';
const profileId = 'profile-default-proxy';
const endpointId = 'endpoint-toolbar-restart';

const server = createServer((_request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end('<!doctype html><html><body>Chromium Toolbar restart acceptance</body></html>');
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '127.0.0.1', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Restart server failed');

async function launch() {
  return chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--host-resolver-rules=MAP toolbar-restart.test 127.0.0.1',
    ],
  });
}

async function extensionPageFor(context) {
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  assert.match(extensionId, /^[a-p]{32}$/u, 'Chromium extension ID was not resolved');
  const extensionPage = await context.newPage();
  await extensionPage.goto(`chrome-extension://${extensionId}/options.html`);
  await extensionPage.waitForLoadState('domcontentloaded');
  return {
    extensionPage,
    popup: `chrome-extension://${extensionId}/popup-iframe.html`,
  };
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

async function expectedFixedState(extensionPage, popup) {
  return extensionPage.evaluate(
    ({ proxyPort, popupPath }) => ({
      title: chrome.i18n.getMessage('browserAction_titleWithResult', [
        'Restart Proxy',
        'Restart Proxy',
        `PROXY 127.0.0.1:${proxyPort}\n`,
      ]),
      badgeText: 'Rest',
      popup: popupPath,
    }),
    { proxyPort: address.port, popupPath: popup },
  );
}

let context;
try {
  context = await launch();
  let { extensionPage, popup } = await extensionPageFor(context);

  const initial = await sendWorkflowCommand(extensionPage, { channel, action: 'get' });
  assert.equal(initial?.ok, true, `Initial workflow failed: ${JSON.stringify(initial)}`);
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

  const replaced = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'replace-draft',
    expectedGeneration: initial.state.generation,
    draft,
  });
  assert.equal(replaced?.ok, true, `Draft replacement failed: ${JSON.stringify(replaced)}`);
  const applied = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'apply',
    expectedGeneration: replaced.state.generation,
  });
  assert.equal(applied?.ok, true, `Apply failed: ${JSON.stringify(applied)}`);
  const activated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId },
  });
  assert.equal(activated?.ok, true, `Activation failed: ${JSON.stringify(activated)}`);

  const firstPage = await context.newPage();
  const firstUrl = `http://toolbar-restart.test:${address.port}/before-restart`;
  await firstPage.goto(firstUrl, { waitUntil: 'domcontentloaded' });
  const firstTabId = await tabIdForUrl(extensionPage, firstUrl);
  const expected = await expectedFixedState(extensionPage, popup);
  await waitForActionState(
    extensionPage,
    firstTabId,
    expected,
    'Chromium pre-restart Fixed Action state failed',
  );

  await context.close();
  context = undefined;

  context = await launch();
  ({ extensionPage, popup } = await extensionPageFor(context));
  const restored = await sendWorkflowCommand(extensionPage, { channel, action: 'get' });
  assert.equal(restored?.ok, true, `Restored workflow failed: ${JSON.stringify(restored)}`);
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

  const restartedPage = await context.newPage();
  const restartedUrl = `http://toolbar-restart.test:${address.port}/after-restart`;
  await restartedPage.goto(restartedUrl, { waitUntil: 'domcontentloaded' });
  const restartedTabId = await tabIdForUrl(extensionPage, restartedUrl);
  await waitForActionState(
    extensionPage,
    restartedTabId,
    await expectedFixedState(extensionPage, popup),
    'Chromium post-restart Fixed Action state failed',
  );

  console.log('Chromium Toolbar normal-restart acceptance passed.');
} finally {
  if (context) await context.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
}
