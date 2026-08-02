import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-external-control-user-'));
const conflictExtensionPath = await mkdtemp(
  resolve(tmpdir(), 'zeroomega-nex-external-control-extension-'),
);
await mkdir(conflictExtensionPath, { recursive: true });
await writeFile(
  resolve(conflictExtensionPath, 'manifest.json'),
  JSON.stringify({
    manifest_version: 3,
    name: 'ZeroOmega Nex External Control Probe',
    version: '1.0.0',
    permissions: ['proxy'],
    background: { service_worker: 'background.js' },
  }),
);
await writeFile(
  resolve(conflictExtensionPath, 'background.js'),
  `globalThis.__zeroomegaClaimTimer = undefined;
setInterval(() => undefined, 1000);
`,
);

let context;

async function waitForValue(read, accept, message, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  let actual;
  while (Date.now() < deadline) {
    actual = await read();
    if (accept(actual)) return actual;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(`${message}: ${JSON.stringify(actual)}`);
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'en-US',
    args: [
      `--disable-extensions-except=${extensionPath},${conflictExtensionPath}`,
      `--load-extension=${extensionPath},${conflictExtensionPath}`,
    ],
  });

  let nexWorker;
  let conflictWorker;
  await waitForValue(
    async () => {
      for (const candidate of context.serviceWorkers()) {
        const name = await candidate
          .evaluate(() => chrome.runtime.getManifest().name)
          .catch(() => '');
        if (name === 'ZeroOmega Nex External Control Probe') conflictWorker = candidate;
        else if (name === 'ZeroOmega Nex') nexWorker = candidate;
      }
      return { nex: Boolean(nexWorker), conflict: Boolean(conflictWorker) };
    },
    (value) => value.nex && value.conflict,
    'Chromium external-control service workers were not resolved',
  );

  const extensionId = new URL(nexWorker.url()).host;
  assert.match(extensionId, /^[a-p]{32}$/u, 'Chromium Nex extension ID was not resolved');

  const targetUrl = 'http://external-control.test/path';
  await context.route(targetUrl, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<title>Nex external control target</title>',
    }),
  );
  const targetPage = await context.newPage();
  await targetPage.goto(targetUrl);

  const optionsPage = await context.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
  await optionsPage.waitForLoadState('domcontentloaded');
  const tabId = await optionsPage.evaluate(async (url) => {
    const tab = (await chrome.tabs.query({})).find((candidate) => candidate.url === url);
    return tab?.id;
  }, targetUrl);
  assert.equal(typeof tabId, 'number', 'Chromium external-control target tab ID was not resolved');

  const sendWorkflowCommand = (command) =>
    optionsPage.evaluate((message) => chrome.runtime.sendMessage(message), command);
  const current = await sendWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'get',
  });
  assert.equal(current?.ok, true, `Chromium workflow read failed: ${JSON.stringify(current)}`);
  const draft = structuredClone(current.state.draft);
  draft.settings.interface.showResultProfileOnActionBadgeText = true;
  const fixed = draft.profiles.find((profile) => profile.id === 'profile-default-proxy');
  assert.equal(fixed?.kind, 'fixed', 'Chromium default Fixed profile is unavailable');
  fixed.name = 'Runtime External Control Fixed';
  fixed.color = '#4fc3f7';
  fixed.bypass = [];
  const endpointId = fixed.proxyByScheme.fallback;
  const endpoint = draft.proxyEndpoints.find((candidate) => candidate.id === endpointId);
  assert.ok(endpoint, 'Chromium default Fixed endpoint is unavailable');
  endpoint.protocol = 'http';
  endpoint.host = '127.0.0.1';
  endpoint.port = 18188;

  const replaced = await sendWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'replace-draft',
    expectedGeneration: current.state.generation,
    draft,
  });
  assert.equal(replaced?.ok, true, `Chromium draft replacement failed: ${JSON.stringify(replaced)}`);
  const applied = await sendWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'apply',
    expectedGeneration: replaced.state.generation,
  });
  assert.equal(applied?.ok, true, `Chromium Apply failed: ${JSON.stringify(applied)}`);

  const activateFixed = () =>
    sendWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: applied.state.applied.revision.id,
      route: { kind: 'profile', profileId: fixed.id },
    });
  const activated = await activateFixed();
  assert.equal(activated?.ok, true, `Chromium Fixed activation failed: ${JSON.stringify(activated)}`);

  const localized = await optionsPage.evaluate((profileName) => {
    const title = (currentProfileName, resultProfileName, details) =>
      chrome.i18n.getMessage('browserAction_titleWithResult', [
        currentProfileName,
        resultProfileName,
        details,
      ]);
    const directName = chrome.i18n.getMessage('routeDirect');
    return {
      fixedTitle: title(profileName, profileName, 'PROXY 127.0.0.1:18188\n'),
      directTitle: title(
        `[${directName}]`,
        `[${directName}]`,
        chrome.i18n.getMessage('browserAction_directResult'),
      ),
    };
  }, fixed.name);

  const readNexControlLevel = () =>
    optionsPage.evaluate(
      async () => (await chrome.proxy.settings.get({ incognito: false })).levelOfControl,
    );
  const readConflictControlLevel = () =>
    conflictWorker.evaluate(
      async () => (await chrome.proxy.settings.get({ incognito: false })).levelOfControl,
    );
  const readAction = () =>
    optionsPage.evaluate(async (targetTabId) => {
      const action = chrome.action;
      return {
        title: await action.getTitle({ tabId: targetTabId }),
        badgeText: await action.getBadgeText({ tabId: targetTabId }),
        badgeBackgroundColor: await action.getBadgeBackgroundColor({ tabId: targetTabId }),
      };
    }, tabId);

  await waitForValue(
    readNexControlLevel,
    (value) => value === 'controlled_by_this_extension',
    'Chromium Nex did not obtain proxy control',
  );
  await waitForValue(
    readAction,
    (value) =>
      value.title === localized.fixedTitle &&
      value.badgeText === 'Runt' &&
      JSON.stringify(value.badgeBackgroundColor) === JSON.stringify([0, 0, 0, 0]),
    'Chromium baseline Fixed Action did not match the original contract',
  );

  await conflictWorker.evaluate(async () => {
    const claim = () =>
      chrome.proxy.settings.set({ scope: 'regular', value: { mode: 'direct' } });
    await claim();
    globalThis.__zeroomegaClaimTimer = setInterval(() => void claim(), 100);
  });
  await waitForValue(
    readConflictControlLevel,
    (value) => value === 'controlled_by_this_extension',
    'Chromium conflict extension did not take proxy control',
  );
  await waitForValue(
    readNexControlLevel,
    (value) => value === 'controlled_by_other_extensions',
    'Chromium Nex did not observe external proxy control',
  );
  await waitForValue(
    readAction,
    (value) =>
      value.title === localized.directTitle &&
      value.badgeText === 'Dire' &&
      JSON.stringify(value.badgeBackgroundColor) === JSON.stringify([218, 79, 73, 255]),
    'Chromium takeover Action did not switch to original Direct warning state',
  );

  await conflictWorker.evaluate(async () => {
    if (globalThis.__zeroomegaClaimTimer !== undefined) {
      clearInterval(globalThis.__zeroomegaClaimTimer);
      globalThis.__zeroomegaClaimTimer = undefined;
    }
    await chrome.proxy.settings.clear({ scope: 'regular' });
  });
  await waitForValue(
    readNexControlLevel,
    (value) => value === 'controlled_by_this_extension',
    'Chromium Nex did not regain proxy control after release',
  );
  await waitForValue(
    readAction,
    (value) =>
      value.title === localized.fixedTitle &&
      value.badgeText === 'Runt' &&
      JSON.stringify(value.badgeBackgroundColor) === JSON.stringify([218, 79, 73, 255]),
    'Chromium release did not restore Fixed content with the warning latched',
  );

  const reapplied = await activateFixed();
  assert.equal(reapplied?.ok, true, `Chromium Fixed reapply failed: ${JSON.stringify(reapplied)}`);
  await waitForValue(
    readAction,
    (value) =>
      value.title === localized.fixedTitle &&
      value.badgeText === 'Runt' &&
      JSON.stringify(value.badgeBackgroundColor) === JSON.stringify([218, 79, 73, 255]),
    'Chromium explicit reapply cleared the original warning latch',
  );

  console.log(`Chromium external-control Toolbar E2E passed for ${extensionId}.`);
} finally {
  await context?.close();
  await rm(userDataDir, { recursive: true, force: true });
  await rm(conflictExtensionPath, { recursive: true, force: true });
}
