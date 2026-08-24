import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-attached-toolbar-'));
const server = createServer((_request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end('<!doctype html><html><body>Attached Rule List toolbar E2E</body></html>');
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '127.0.0.1', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Attached Rule List Chromium server failed');
}

const channel = 'zeroomega-nex/profile-workflow/v1';
const fixedProfileId = 'profile-default-proxy';
const fixedEndpointId = 'endpoint-attached-rule-list-e2e';
const fixedParentId = 'profile-attached-fixed-switch';
const fixedRuleListId = 'profile-attached-fixed-rule-list';
const fixedSourceId = 'source-attached-fixed-rule-list';
const directParentId = 'profile-attached-direct-switch';
const directRuleListId = 'profile-attached-direct-rule-list';
const directSourceId = 'source-attached-direct-rule-list';
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
      '--host-resolver-rules=MAP attached-fixed.test 127.0.0.1,MAP attached-direct.test 127.0.0.1',
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
    const directName = chrome.i18n.getMessage('routeDirect');
    const defaultDetail = chrome.i18n.getMessage('browserAction_defaultRuleDetails');
    const attachedPrefix = chrome.i18n.getMessage('browserAction_attachedPrefix');
    return {
      fixedMatch: resultTitle(
        'Runtime Attached Fixed Switch',
        'Runtime Attached Fixed',
        `${attachedPrefix}||attached-fixed.test => Runtime Attached Fixed\nPROXY 127.0.0.1:${proxyPort}\n`,
      ),
      fixedDefaultDirect: resultTitle(
        'Runtime Attached Fixed Switch',
        `[${directName}]`,
        `${defaultDetail} => [${directName}]\n`,
      ),
      directMatch: resultTitle(
        'Runtime Attached Direct Switch',
        `[${directName}]`,
        `${attachedPrefix}||attached-direct.test => [${directName}]\n`,
      ),
      directDefaultFixed: resultTitle(
        'Runtime Attached Direct Switch',
        'Runtime Attached Fixed',
        `${defaultDetail} => Runtime Attached Fixed\nPROXY 127.0.0.1:${proxyPort}\n`,
      ),
    };
  }, address.port);

  const fixedMatchPage = await context.newPage();
  const fixedMatchUrl = `http://attached-fixed.test:${address.port}/fixed-match`;
  await fixedMatchPage.goto(fixedMatchUrl, { waitUntil: 'domcontentloaded' });
  const directMatchPage = await context.newPage();
  const directMatchUrl = `http://attached-direct.test:${address.port}/direct-match`;
  await directMatchPage.goto(directMatchUrl, { waitUntil: 'domcontentloaded' });
  const defaultPage = await context.newPage();
  const defaultUrl = `http://127.0.0.1:${address.port}/default`;
  await defaultPage.goto(defaultUrl, { waitUntil: 'domcontentloaded' });

  const fixedMatchTabId = await tabIdForUrl(extensionPage, fixedMatchUrl);
  const directMatchTabId = await tabIdForUrl(extensionPage, directMatchUrl);
  const defaultTabId = await tabIdForUrl(extensionPage, defaultUrl);

  const current = await sendWorkflowCommand(extensionPage, { channel, action: 'get' });
  assert.equal(current?.ok, true, `Workflow refresh failed: ${JSON.stringify(current)}`);
  const draft = structuredClone(current.state.draft);
  const fixed = draft.profiles.find((candidate) => candidate.id === fixedProfileId);
  assert.equal(fixed?.kind, 'fixed', 'Default Fixed Profile was not found');
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
  assert.equal(applied?.ok, true, `Apply failed: ${JSON.stringify(applied)}`);

  const fixedActivated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId: fixedParentId },
  });
  assert.equal(
    fixedActivated?.ok,
    true,
    `Attached Fixed activation failed: ${JSON.stringify(fixedActivated)}`,
  );
  await waitForActionState(
    extensionPage,
    fixedMatchTabId,
    { title: expectedTitles.fixedMatch, badgeText: 'Runt', popup },
    'Chromium attached match into Fixed failed',
  );
  await waitForActionState(
    extensionPage,
    defaultTabId,
    { title: expectedTitles.fixedDefaultDirect, badgeText: 'Dire', popup },
    'Chromium attached no-match default into Direct failed',
  );

  const directActivated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId: directParentId },
  });
  assert.equal(
    directActivated?.ok,
    true,
    `Attached Direct activation failed: ${JSON.stringify(directActivated)}`,
  );
  await waitForActionState(
    extensionPage,
    directMatchTabId,
    { title: expectedTitles.directMatch, badgeText: 'Dire', popup },
    'Chromium attached match into Direct failed',
  );
  await waitForActionState(
    extensionPage,
    defaultTabId,
    { title: expectedTitles.directDefaultFixed, badgeText: 'Runt', popup },
    'Chromium attached no-match default into Fixed failed',
  );

  console.log(`Chromium attached Rule List toolbar E2E passed for ${extensionId}.`);
} finally {
  await context?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
}
