import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

import {
  configureNestedSwitchDraft,
  NESTED_SWITCH_SCENARIO,
  NEX_TOOLBAR_WORKFLOW_CHANNEL,
  nestedSwitchCases,
} from './nex-toolbar-profile-trace-scenarios.mjs';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-profile-traces-'));
const server = createServer((_request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end('<!doctype html><html><body>Profile trace toolbar E2E</body></html>');
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '127.0.0.1', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Chromium profile trace server failed');
}
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
      `--host-resolver-rules=${NESTED_SWITCH_SCENARIO.hosts.map((host) => `MAP ${host} 127.0.0.1`).join(',')}`,
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
  const localization = await extensionPage.evaluate(() => ({
    directName: chrome.i18n.getMessage('routeDirect'),
    defaultDetail: chrome.i18n.getMessage('browserAction_defaultRuleDetails'),
  }));
  const cases = nestedSwitchCases({ proxyPort: address.port, ...localization });

  const tabs = [];
  for (const capture of cases) {
    const url = `http://${capture.host}:${address.port}${capture.path}`;
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    tabs.push({ capture, url, tabId: await tabIdForUrl(extensionPage, url) });
  }

  const current = await sendWorkflowCommand(extensionPage, {
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'get',
  });
  assert.equal(current?.ok, true, `Workflow refresh failed: ${JSON.stringify(current)}`);
  const draft = structuredClone(current.state.draft);
  const scenario = configureNestedSwitchDraft(draft, address.port);

  const replaced = await sendWorkflowCommand(extensionPage, {
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'replace-draft',
    expectedGeneration: current.state.generation,
    draft,
  });
  assert.equal(replaced?.ok, true, `Draft replacement failed: ${JSON.stringify(replaced)}`);
  const applied = await sendWorkflowCommand(extensionPage, {
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'apply',
    expectedGeneration: replaced.state.generation,
  });
  assert.equal(applied?.ok, true, `Apply failed: ${JSON.stringify(applied)}`);
  const activated = await sendWorkflowCommand(extensionPage, {
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId: scenario.outerProfileId },
  });
  assert.equal(activated?.ok, true, `Activation failed: ${JSON.stringify(activated)}`);

  for (const { capture, tabId } of tabs) {
    const title = await extensionPage.evaluate(
      ({ resultProfileName, details }) =>
        chrome.i18n.getMessage('browserAction_titleWithResult', [
          'Runtime Nested Outer Switch',
          resultProfileName,
          details,
        ]),
      capture,
    );
    await waitForActionState(
      extensionPage,
      tabId,
      { title, badgeText: capture.badgeText, popup },
      `Chromium nested Switch case ${capture.id} failed`,
    );
  }

  console.log(`Chromium nested Switch toolbar E2E passed for ${extensionId}.`);
} finally {
  await context?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
}
