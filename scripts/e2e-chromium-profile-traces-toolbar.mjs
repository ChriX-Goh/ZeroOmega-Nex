import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

import {
  configureNestedSwitchDraft,
  configureNestedVirtualDraft,
  configurePacDraft,
  configureTemporaryRuleDraft,
  NEX_TOOLBAR_WORKFLOW_CHANNEL,
  POPUP_TEMPORARY_RULE_CHANNEL,
  nestedSwitchCases,
  nestedVirtualCases,
  pacCases,
  PROFILE_TRACE_HOSTS,
  RUNTIME_PAC_SCRIPT,
  temporaryRuleCases,
} from './nex-toolbar-profile-trace-scenarios.mjs';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-profile-traces-'));
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
  server.listen(0, '127.0.0.1', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Chromium profile trace server failed');
}
const pacUrl = `http://127.0.0.1:${address.port}/runtime-pac.pac`;
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

async function openCases(extensionPage, cases) {
  const tabs = [];
  for (const capture of cases) {
    const url = `http://${capture.host}:${address.port}${capture.path}`;
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    tabs.push({ capture, url, tabId: await tabIdForUrl(extensionPage, url) });
  }
  return tabs;
}

async function activateProfile(extensionPage, appliedRevisionId, profileId, label) {
  const activated = await sendWorkflowCommand(extensionPage, {
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'activate-route',
    expectedAppliedRevisionId: appliedRevisionId,
    route: { kind: 'profile', profileId },
  });
  assert.equal(activated?.ok, true, `${label} activation failed: ${JSON.stringify(activated)}`);
}

async function expectedActionState(extensionPage, capture, popup) {
  const title = await extensionPage.evaluate(
    ({ currentProfileName, resultProfileName, details }) =>
      chrome.i18n.getMessage('browserAction_titleWithResult', [
        currentProfileName,
        resultProfileName,
        details,
      ]),
    capture,
  );
  return { title, badgeText: capture.badgeText, popup };
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      `--host-resolver-rules=${PROFILE_TRACE_HOSTS.map((host) => `MAP ${host} 127.0.0.1`).join(',')}`,
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
    temporaryPrefix: chrome.i18n.getMessage('browserAction_tempRulePrefix'),
  }));
  const switchCases = nestedSwitchCases({ proxyPort: address.port, ...localization });
  const virtualCases = nestedVirtualCases({ proxyPort: address.port, ...localization });
  const runtimePacCases = pacCases({ pacUrl });
  const temporaryCases = temporaryRuleCases({
    proxyPort: address.port,
    ...localization,
  });
  const switchTabs = await openCases(extensionPage, switchCases);
  const virtualTabs = await openCases(extensionPage, virtualCases);
  const pacTabs = await openCases(extensionPage, runtimePacCases);
  const temporaryTabs = await openCases(extensionPage, [
    temporaryCases.matched,
    temporaryCases.unmatched,
  ]);

  const current = await sendWorkflowCommand(extensionPage, {
    channel: NEX_TOOLBAR_WORKFLOW_CHANNEL,
    action: 'get',
  });
  assert.equal(current?.ok, true, `Workflow refresh failed: ${JSON.stringify(current)}`);
  const draft = structuredClone(current.state.draft);
  const switchScenario = configureNestedSwitchDraft(draft, address.port);
  const virtualScenario = configureNestedVirtualDraft(draft, address.port);
  const pacScenario = configurePacDraft(draft, pacUrl);
  const temporaryScenario = configureTemporaryRuleDraft(draft, address.port);

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

  await activateProfile(
    extensionPage,
    applied.state.applied.revision.id,
    switchScenario.outerProfileId,
    'Nested Switch',
  );
  for (const { capture, tabId } of switchTabs) {
    await waitForActionState(
      extensionPage,
      tabId,
      await expectedActionState(extensionPage, capture, popup),
      `Chromium nested Switch case ${capture.id} failed`,
    );
  }

  await activateProfile(
    extensionPage,
    applied.state.applied.revision.id,
    virtualScenario.outerDirectProfileId,
    'Nested Virtual Direct',
  );
  for (const { capture, tabId } of virtualTabs.filter(
    ({ capture }) => capture.activationProfileId === virtualScenario.outerDirectProfileId,
  )) {
    await waitForActionState(
      extensionPage,
      tabId,
      await expectedActionState(extensionPage, capture, popup),
      `Chromium nested Virtual Direct case ${capture.id} failed`,
    );
  }

  await activateProfile(
    extensionPage,
    applied.state.applied.revision.id,
    virtualScenario.outerFixedProfileId,
    'Nested Virtual Fixed',
  );
  for (const { capture, tabId } of virtualTabs.filter(
    ({ capture }) => capture.activationProfileId === virtualScenario.outerFixedProfileId,
  )) {
    await waitForActionState(
      extensionPage,
      tabId,
      await expectedActionState(extensionPage, capture, popup),
      `Chromium nested Virtual Fixed case ${capture.id} failed`,
    );
  }

  await activateProfile(
    extensionPage,
    applied.state.applied.revision.id,
    pacScenario.profileId,
    'PAC',
  );
  for (const { capture, tabId } of pacTabs) {
    await waitForActionState(
      extensionPage,
      tabId,
      await expectedActionState(extensionPage, capture, popup),
      `Chromium PAC case ${capture.id} failed`,
    );
  }

  await activateProfile(
    extensionPage,
    applied.state.applied.revision.id,
    temporaryScenario.baseProfileId,
    'Temporary rule base',
  );
  const toggled = await sendWorkflowCommand(extensionPage, {
    channel: POPUP_TEMPORARY_RULE_CHANNEL,
    action: 'toggle',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    domain: temporaryScenario.domain,
    route: { kind: 'profile', profileId: temporaryScenario.fixedProfileId },
  });
  assert.equal(
    toggled?.ok,
    true,
    `Chromium temporary rule toggle failed: ${JSON.stringify(toggled)}`,
  );
  for (const { capture, tabId } of temporaryTabs) {
    await waitForActionState(
      extensionPage,
      tabId,
      await expectedActionState(extensionPage, capture, popup),
      `Chromium temporary rule case ${capture.id} failed`,
    );
  }
  const removed = await sendWorkflowCommand(extensionPage, {
    channel: POPUP_TEMPORARY_RULE_CHANNEL,
    action: 'remove',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    domain: temporaryScenario.domain,
  });
  assert.equal(
    removed?.ok,
    true,
    `Chromium temporary rule removal failed: ${JSON.stringify(removed)}`,
  );
  const matchedTab = temporaryTabs.find(({ capture }) => capture.id === temporaryCases.matched.id);
  assert.ok(matchedTab, 'Chromium temporary rule matched tab was not found');
  await waitForActionState(
    extensionPage,
    matchedTab.tabId,
    await expectedActionState(extensionPage, temporaryCases.removed, popup),
    'Chromium removed temporary rule did not retain the hidden default overlay',
  );

  console.log(`Chromium Toolbar profile trace E2E passed for ${extensionId}.`);
} finally {
  await context?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
}
