import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-renderer-fallback-'));
const channel = 'zeroomega-nex/original-toolbar-renderer-e2e/v1';
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
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 20_000 });
  const extensionId = new URL(worker.url()).host;
  assert.match(extensionId, /^[a-p]{32}$/u, 'Chromium extension ID was not resolved');

  const targetUrl = 'http://renderer-fallback.test/path';
  await context.route(targetUrl, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<title>Renderer fallback target</title>',
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
  assert.equal(typeof tabId, 'number', 'Chromium renderer target tab ID was not resolved');

  const send = (message) => optionsPage.evaluate((value) => chrome.runtime.sendMessage(value), message);
  const sendProbe = (action, details = {}) => send({ channel, action, ...details });
  const current = await send({ channel: 'zeroomega-nex/profile-workflow/v1', action: 'get' });
  assert.equal(current?.ok, true, `Chromium workflow read failed: ${JSON.stringify(current)}`);

  const draft = structuredClone(current.state.draft);
  draft.settings.interface.showResultProfileOnActionBadgeText = true;
  const fixed = draft.profiles.find((profile) => profile.id === 'profile-default-proxy');
  assert.equal(fixed?.kind, 'fixed', 'Chromium default Fixed profile is unavailable');
  fixed.name = 'Runtime Renderer Fallback Fixed';
  fixed.color = '#ab47bc';
  fixed.bypass = [];
  const endpointId = 'endpoint-renderer-fallback';
  draft.proxyEndpoints.push({
    id: endpointId,
    name: 'Runtime Renderer Fallback Proxy',
    protocol: 'http',
    host: '127.0.0.1',
    port: 18189,
  });
  fixed.proxyByScheme = { fallback: endpointId };

  const replaced = await send({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'replace-draft',
    expectedGeneration: current.state.generation,
    draft,
  });
  assert.equal(replaced?.ok, true, `Chromium draft replacement failed: ${JSON.stringify(replaced)}`);
  const applied = await send({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'apply',
    expectedGeneration: replaced.state.generation,
  });
  assert.equal(applied?.ok, true, `Chromium Apply failed: ${JSON.stringify(applied)}`);
  const activated = await send({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId: fixed.id },
  });
  assert.equal(activated?.ok, true, `Chromium Fixed activation failed: ${JSON.stringify(activated)}`);

  const expectedTitle = await optionsPage.evaluate((profileName) =>
    chrome.i18n.getMessage('browserAction_titleWithResult', [
      profileName,
      profileName,
      'PROXY 127.0.0.1:18189\n',
    ]),
  fixed.name);
  const readAction = () =>
    optionsPage.evaluate(async (targetTabId) => ({
      title: await chrome.action.getTitle({ tabId: targetTabId }),
      badgeText: await chrome.action.getBadgeText({ tabId: targetTabId }),
    }), tabId);
  await waitForValue(
    readAction,
    (value) => value.title === expectedTitle && value.badgeText === 'Runt',
    'Chromium baseline Action did not become the renderer fixture',
  );

  const manifestIcons = await optionsPage.evaluate(() => chrome.runtime.getManifest().action?.default_icon);
  assert.deepEqual(manifestIcons, {
    16: 'icon/original-action-16.png',
    19: 'icon/original-action-19.png',
    24: 'icon/original-action-24.png',
    32: 'icon/original-action-32.png',
  });

  const configured = await sendProbe('configure', { mode: 'opaque', reset: true });
  assert.equal(configured?.ok, true, `Chromium renderer configure failed: ${JSON.stringify(configured)}`);
  const firstFailure = await sendProbe('refresh', { clearIconCache: true });
  assert.equal(firstFailure?.ok, true, `Chromium first renderer refresh failed: ${JSON.stringify(firstFailure)}`);
  assert.equal(firstFailure.state.mode, 'opaque');
  assert.equal(firstFailure.state.imageReads > 0, true, 'Chromium first failure did not read pixels');
  assert.deepEqual(firstFailure.state.iconWrites, []);
  await waitForValue(
    readAction,
    (value) => value.title === expectedTitle && value.badgeText === 'Runt',
    'Chromium failure changed title or Badge state',
  );

  const secondFailure = await sendProbe('refresh');
  assert.equal(secondFailure?.ok, true, `Chromium second renderer refresh failed: ${JSON.stringify(secondFailure)}`);
  assert.equal(
    secondFailure.state.imageReads > firstFailure.state.imageReads,
    true,
    'Chromium failed colors were cached instead of retried',
  );
  assert.deepEqual(secondFailure.state.iconWrites, []);

  const normal = await sendProbe('configure', { mode: 'normal' });
  assert.equal(normal?.ok, true, `Chromium renderer restore failed: ${JSON.stringify(normal)}`);
  const recovered = await sendProbe('refresh');
  assert.equal(recovered?.ok, true, `Chromium recovered refresh failed: ${JSON.stringify(recovered)}`);
  assert.equal(
    recovered.state.imageReads >= secondFailure.state.imageReads + 5,
    true,
    'Chromium recovered renderer did not produce all five original sizes',
  );
  assert.equal(recovered.state.iconWrites.length > 0, true, 'Chromium recovery did not write an icon');
  assert.equal(
    recovered.state.iconWrites.every(
      (write) =>
        write.kind === 'imageData' &&
        JSON.stringify(write.sizes) === JSON.stringify(['16', '19', '24', '32', '38']),
    ),
    true,
    `Chromium recovery wrote a non-original icon shape: ${JSON.stringify(recovered.state.iconWrites)}`,
  );

  console.log(`Chromium renderer fallback Toolbar E2E passed for ${extensionId}.`);
} finally {
  await context?.close();
  await rm(userDataDir, { recursive: true, force: true });
}
