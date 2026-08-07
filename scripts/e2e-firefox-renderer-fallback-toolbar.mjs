import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Browser, Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const server = createServer((_request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end('<!doctype html><html><body>Firefox renderer fallback target</body></html>');
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '127.0.0.1', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Firefox renderer server failed');

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000021';
const channel = 'zeroomega-nex/original-toolbar-renderer-e2e/v1';
const options = new firefox.Options()
  .addArguments('-headless', '--remote-allow-system-access')
  .setPreference('intl.accept_languages', 'en-US')
  .enableBidi()
  .setPreference('extensions.webextOptionalPermissionPrompts', false)
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

async function send(message) {
  return executeAsync(
    `
      const message = arguments[0];
      const done = arguments[arguments.length - 1];
      browser.runtime.sendMessage(message).then(done, (error) => done({ error: String(error) }));
    `,
    message,
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

function normalizeManifestIconPaths(iconPaths) {
  return Object.fromEntries(
    Object.entries(iconPaths ?? {}).map(([size, path]) => {
      const value = String(path);
      const prefix = `moz-extension://${extensionUuid}/`;
      return [size, value.startsWith(prefix) ? value.slice(prefix.length) : value];
    }),
  );
}

try {
  const install = await bidiCommand('webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  assert.equal(install?.extension, addonId, 'Firefox returned an unexpected add-on ID');

  await navigateCurrentContext(`moz-extension://${extensionUuid}/options.html`);
  const optionsWindow = await driver.getWindowHandle();
  const targetUrl = `http://127.0.0.1:${address.port}/path`;
  await driver.switchTo().newWindow('tab');
  await driver.get(targetUrl);
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
  assert.equal(typeof tabId, 'number', 'Firefox renderer target tab ID was not resolved');

  const sendProbe = (action, details = {}) => send({ channel, action, ...details });
  const current = await send({ channel: 'zeroomega-nex/profile-workflow/v1', action: 'get' });
  assert.equal(current?.ok, true, `Firefox workflow read failed: ${JSON.stringify(current)}`);

  const draft = structuredClone(current.state.draft);
  draft.settings.interface.showResultProfileOnActionBadgeText = true;
  const fixed = draft.profiles.find((profile) => profile.id === 'profile-default-proxy');
  assert.equal(fixed?.kind, 'fixed', 'Firefox default Fixed profile is unavailable');
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
  assert.equal(replaced?.ok, true, `Firefox draft replacement failed: ${JSON.stringify(replaced)}`);
  const applied = await send({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'apply',
    expectedGeneration: replaced.state.generation,
  });
  assert.equal(applied?.ok, true, `Firefox Apply failed: ${JSON.stringify(applied)}`);
  const activated = await send({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'activate-route',
    expectedAppliedRevisionId: applied.state.applied.revision.id,
    route: { kind: 'profile', profileId: fixed.id },
  });
  assert.equal(
    activated?.ok,
    true,
    `Firefox Fixed activation failed: ${JSON.stringify(activated)}`,
  );

  const expectedTitle = await driver.executeScript(
    `
      const profileName = arguments[0];
      return browser.i18n.getMessage('browserAction_titleWithResult', [
        profileName,
        profileName,
        'PROXY 127.0.0.1:18189\\n',
      ]);
    `,
    fixed.name,
  );
  const readAction = () =>
    executeAsync(
      `
        const tabId = arguments[0];
        const done = arguments[arguments.length - 1];
        Promise.all([
          browser.action.getTitle({ tabId }),
          browser.action.getBadgeText({ tabId }),
        ]).then(
          ([title, badgeText]) => done({ title, badgeText }),
          (error) => done({ error: String(error) }),
        );
      `,
      tabId,
    );
  await waitForValue(
    readAction,
    (value) => value.title === expectedTitle && value.badgeText === 'Runt',
    'Firefox baseline Action did not become the renderer fixture',
  );

  const manifestIcons = await driver.executeScript(
    'return browser.runtime.getManifest().action?.default_icon;',
  );
  assert.deepEqual(normalizeManifestIconPaths(manifestIcons), {
    16: 'icon/original-action-16.png',
    19: 'icon/original-action-19.png',
    24: 'icon/original-action-24.png',
    32: 'icon/original-action-32.png',
  });

  const configured = await sendProbe('configure', { mode: 'opaque', reset: true });
  assert.equal(
    configured?.ok,
    true,
    `Firefox renderer configure failed: ${JSON.stringify(configured)}`,
  );
  const firstFailure = await sendProbe('refresh', { clearIconCache: true });
  assert.equal(
    firstFailure?.ok,
    true,
    `Firefox first renderer refresh failed: ${JSON.stringify(firstFailure)}`,
  );
  assert.equal(firstFailure.state.mode, 'opaque');
  assert.equal(
    firstFailure.state.imageReads > 0,
    true,
    'Firefox first failure did not read pixels',
  );
  assert.deepEqual(firstFailure.state.iconWrites, []);
  await waitForValue(
    readAction,
    (value) => value.title === expectedTitle && value.badgeText === 'Runt',
    'Firefox failure changed title or Badge state',
  );

  const secondFailure = await sendProbe('refresh');
  assert.equal(
    secondFailure?.ok,
    true,
    `Firefox second renderer refresh failed: ${JSON.stringify(secondFailure)}`,
  );
  assert.equal(
    secondFailure.state.imageReads > firstFailure.state.imageReads,
    true,
    'Firefox failed colors were cached instead of retried',
  );
  assert.deepEqual(secondFailure.state.iconWrites, []);

  const normal = await sendProbe('configure', { mode: 'normal' });
  assert.equal(normal?.ok, true, `Firefox renderer restore failed: ${JSON.stringify(normal)}`);
  const recovered = await sendProbe('refresh');
  assert.equal(
    recovered?.ok,
    true,
    `Firefox recovered refresh failed: ${JSON.stringify(recovered)}`,
  );
  assert.equal(
    recovered.state.imageReads >= secondFailure.state.imageReads + 5,
    true,
    'Firefox recovered renderer did not produce all five original sizes',
  );
  assert.equal(
    recovered.state.iconWrites.length > 0,
    true,
    'Firefox recovery did not write an icon',
  );
  assert.equal(
    recovered.state.iconWrites.every(
      (write) =>
        write.kind === 'imageData' &&
        JSON.stringify(write.sizes) === JSON.stringify(['16', '19', '24', '32', '38']),
    ),
    true,
    `Firefox recovery wrote a non-original icon shape: ${JSON.stringify(recovered.state.iconWrites)}`,
  );

  console.log(`Firefox renderer fallback Toolbar E2E passed for ${addonId}.`);
} finally {
  await driver.quit();
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(resolve('geckodriver.log'), { force: true }).catch(() => undefined);
}
