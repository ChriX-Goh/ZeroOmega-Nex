import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { Browser, Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const server = createServer((_request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end('<!doctype html><html><body>Firefox external control target</body></html>');
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '127.0.0.1', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Firefox external-control server failed');
}

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000011';
const conflictAddonId = 'zeroomega-nex-external-control-probe@e2e.invalid';
const conflictUuid = '00000000-0000-4000-8000-000000000012';
const conflictExtensionPath = await mkdtemp(
  resolve(tmpdir(), 'zeroomega-nex-firefox-external-control-'),
);
await mkdir(conflictExtensionPath, { recursive: true });
await writeFile(
  resolve(conflictExtensionPath, 'manifest.json'),
  JSON.stringify({
    manifest_version: 3,
    name: 'ZeroOmega Nex Firefox External Control Probe',
    version: '1.0.0',
    permissions: ['proxy'],
    background: { scripts: ['background.js'] },
    browser_specific_settings: { gecko: { id: conflictAddonId } },
  }),
);
await writeFile(
  resolve(conflictExtensionPath, 'background.js'),
  'setInterval(() => undefined, 1000);\n',
);
await writeFile(
  resolve(conflictExtensionPath, 'control.html'),
  '<!doctype html><html><body>External control probe</body></html>\n',
);

const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference('intl.accept_languages', 'en-US')
  .enableBidi()
  .setPreference('extensions.webextOptionalPermissionPrompts', false)
  .setPreference(
    'extensions.webextensions.uuids',
    JSON.stringify({ [addonId]: extensionUuid, [conflictAddonId]: conflictUuid }),
  );
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

async function navigateCurrentContext(url) {
  const context = await driver.getWindowHandle();
  const result = await bidiCommand('browsingContext.navigate', {
    context,
    url,
    wait: 'complete',
  });
  const expectedUrl = url.endsWith('/options.html') ? `${url}#/about` : url;
  assert.equal(result?.url, expectedUrl, 'Firefox navigated to an unexpected URL');
}

async function executeAsync(script, ...args) {
  return driver.executeAsyncScript(script, ...args);
}

async function sendWorkflowCommand(command) {
  return executeAsync(
    `
      const command = arguments[0];
      const done = arguments[arguments.length - 1];
      browser.runtime.sendMessage(command).then(done, (error) => done({ error: String(error) }));
    `,
    command,
  );
}

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
  const nexInstall = await bidiCommand('webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  assert.equal(nexInstall?.extension, addonId, 'Firefox returned an unexpected Nex add-on ID');
  const conflictInstall = await bidiCommand('webExtension.install', {
    extensionData: { type: 'path', path: conflictExtensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  assert.equal(
    conflictInstall?.extension,
    conflictAddonId,
    'Firefox returned an unexpected conflict add-on ID',
  );

  await navigateCurrentContext(`moz-extension://${extensionUuid}/options.html`);
  const optionsWindow = await driver.getWindowHandle();
  const targetUrl = `http://127.0.0.1:${address.port}/path`;
  await driver.switchTo().newWindow('tab');
  await driver.get(targetUrl);
  const targetWindow = await driver.getWindowHandle();
  await driver.switchTo().window(optionsWindow);

  const tabId = await executeAsync(
    `
      const targetUrl = arguments[0];
      const done = arguments[arguments.length - 1];
      browser.tabs.query({}).then(
        (tabs) => done(tabs.find((tab) => tab.url === targetUrl)?.id),
        (error) => done({ error: String(error) }),
      );
    `,
    targetUrl,
  );
  assert.equal(typeof tabId, 'number', 'Firefox external-control target tab ID was not resolved');

  const current = await sendWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'get',
  });
  assert.equal(current?.ok, true, `Firefox workflow read failed: ${JSON.stringify(current)}`);
  const draft = structuredClone(current.state.draft);
  draft.settings.interface.showResultProfileOnActionBadgeText = true;
  const fixed = draft.profiles.find((profile) => profile.id === 'profile-default-proxy');
  assert.equal(fixed?.kind, 'fixed', 'Firefox default Fixed profile is unavailable');
  fixed.name = 'Runtime External Control Fixed';
  fixed.color = '#4fc3f7';
  fixed.bypass = [];
  const endpointId = 'endpoint-external-control';
  draft.proxyEndpoints.push({
    id: endpointId,
    name: 'Runtime External Control Proxy',
    protocol: 'http',
    host: '127.0.0.1',
    port: 18188,
  });
  fixed.proxyByScheme = { fallback: endpointId };

  const replaced = await sendWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'replace-draft',
    expectedGeneration: current.state.generation,
    draft,
  });
  assert.equal(replaced?.ok, true, `Firefox draft replacement failed: ${JSON.stringify(replaced)}`);
  const applied = await sendWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'apply',
    expectedGeneration: replaced.state.generation,
  });
  assert.equal(applied?.ok, true, `Firefox Apply failed: ${JSON.stringify(applied)}`);

  const activateFixed = () =>
    sendWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: applied.state.applied.revision.id,
      route: { kind: 'profile', profileId: fixed.id },
    });
  const activated = await activateFixed();
  assert.equal(
    activated?.ok,
    true,
    `Firefox Fixed activation failed: ${JSON.stringify(activated)}`,
  );

  const localized = await driver.executeScript(
    `
      const profileName = arguments[0];
      const title = (currentProfileName, resultProfileName, details) =>
        browser.i18n.getMessage('browserAction_titleWithResult', [
          currentProfileName,
          resultProfileName,
          details,
        ]);
      const directName = browser.i18n.getMessage('routeDirect');
      return {
        fixedTitle: title(profileName, profileName, 'PROXY 127.0.0.1:18188\\n'),
        directTitle: title(
          '[' + directName + ']',
          '[' + directName + ']',
          browser.i18n.getMessage('browserAction_directResult'),
        ),
      };
    `,
    fixed.name,
  );

  const readNexControlLevel = () =>
    executeAsync(`
      const done = arguments[arguments.length - 1];
      browser.proxy.settings.get({}).then(
        (value) => done(value.levelOfControl),
        (error) => done({ error: String(error) }),
      );
    `);
  const readAction = () =>
    executeAsync(
      `
        const tabId = arguments[0];
        const done = arguments[arguments.length - 1];
        Promise.all([
          browser.action.getTitle({ tabId }),
          browser.action.getBadgeText({ tabId }),
          browser.action.getBadgeBackgroundColor({ tabId }),
        ]).then(
          ([title, badgeText, badgeBackgroundColor]) =>
            done({ title, badgeText, badgeBackgroundColor }),
          (error) => done({ error: String(error) }),
        );
      `,
      tabId,
    );

  await waitForValue(
    readNexControlLevel,
    (value) => value === 'controlled_by_this_extension',
    'Firefox Nex did not obtain proxy control',
  );
  await waitForValue(
    readAction,
    (value) =>
      value.title === localized.fixedTitle &&
      value.badgeText === 'Runt' &&
      JSON.stringify(value.badgeBackgroundColor) === JSON.stringify([0, 0, 0, 0]),
    'Firefox baseline Fixed Action did not match the original contract',
  );

  await driver.switchTo().newWindow('tab');
  await navigateCurrentContext(`moz-extension://${conflictUuid}/control.html`);
  const conflictWindow = await driver.getWindowHandle();
  const setResult = await executeAsync(`
    const done = arguments[arguments.length - 1];
    browser.proxy.settings.set({ value: { proxyType: 'none' } }).then(
      () => done({ ok: true }),
      (error) => done({ ok: false, error: String(error) }),
    );
  `);
  assert.equal(
    setResult?.ok,
    true,
    `Firefox conflict proxy set failed: ${JSON.stringify(setResult)}`,
  );
  const readConflictControlLevel = () =>
    executeAsync(`
      const done = arguments[arguments.length - 1];
      browser.proxy.settings.get({}).then(
        (value) => done(value.levelOfControl),
        (error) => done({ error: String(error) }),
      );
    `);
  await waitForValue(
    readConflictControlLevel,
    (value) => value === 'controlled_by_this_extension',
    'Firefox conflict extension did not take proxy control',
  );

  await driver.switchTo().window(optionsWindow);
  await waitForValue(
    readNexControlLevel,
    (value) => value === 'controlled_by_other_extensions',
    'Firefox Nex did not observe external proxy control',
  );
  await waitForValue(
    readAction,
    (value) =>
      value.title === localized.directTitle &&
      value.badgeText === 'Dire' &&
      JSON.stringify(value.badgeBackgroundColor) === JSON.stringify([218, 79, 73, 255]),
    'Firefox takeover Action did not switch to original Direct warning state',
  );

  await driver.switchTo().window(conflictWindow);
  const clearResult = await executeAsync(`
    const done = arguments[arguments.length - 1];
    browser.proxy.settings.clear({}).then(
      () => done({ ok: true }),
      (error) => done({ ok: false, error: String(error) }),
    );
  `);
  assert.equal(
    clearResult?.ok,
    true,
    `Firefox conflict proxy clear failed: ${JSON.stringify(clearResult)}`,
  );

  await driver.switchTo().window(optionsWindow);
  await waitForValue(
    readNexControlLevel,
    (value) => value === 'controlled_by_this_extension',
    'Firefox Nex did not regain proxy control after release',
  );
  await waitForValue(
    readAction,
    (value) =>
      value.title === localized.fixedTitle &&
      value.badgeText === 'Runt' &&
      JSON.stringify(value.badgeBackgroundColor) === JSON.stringify([218, 79, 73, 255]),
    'Firefox release did not restore Fixed content with the warning latched',
  );

  const reapplied = await activateFixed();
  assert.equal(reapplied?.ok, true, `Firefox Fixed reapply failed: ${JSON.stringify(reapplied)}`);
  await waitForValue(
    readAction,
    (value) =>
      value.title === localized.fixedTitle &&
      value.badgeText === 'Runt' &&
      JSON.stringify(value.badgeBackgroundColor) === JSON.stringify([218, 79, 73, 255]),
    'Firefox explicit reapply cleared the original warning latch',
  );

  await driver.switchTo().window(targetWindow);
  console.log(`Firefox external-control Toolbar E2E passed for ${addonId}.`);
} finally {
  await driver.quit();
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(conflictExtensionPath, { recursive: true, force: true });
}
