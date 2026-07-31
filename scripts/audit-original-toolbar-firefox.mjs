import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

import { Browser, Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const extensionPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_FIREFOX_PATH ?? 'original-release/firefox',
);
const outputPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_RUNTIME_OUTPUT ?? 'original-runtime/firefox',
);
const addonId = 'suziwen1@gmail.com';
const extensionUuid = '00000000-0000-4000-8000-000000000009';

await mkdir(outputPath, { recursive: true });

const server = createServer((request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(`<!doctype html><title>${request.url}</title><h1>${request.url}</h1>`);
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '127.0.0.1', resolveListen);
});
const address = server.address();
if (!address || typeof address === 'string')
  throw new Error('Original Firefox audit server failed');
const baseUrl = `http://127.0.0.1:${address.port}`;

const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference('intl.accept_languages', 'zh-CN')
  .enableBidi()
  .setPreference('extensions.webextOptionalPermissionPrompts', false)
  .setPreference('network.dns.disableIPv6', true)
  .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));

let driver;

async function pauseForOriginalUpdate(delay = 900) {
  await new Promise((resolvePause) => setTimeout(resolvePause, delay));
}

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

try {
  driver = await new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(options).build();

  const installResult = await bidiCommand('webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  assert.equal(installResult?.extension, addonId, 'Firefox returned an unexpected add-on ID');

  await driver.get(`moz-extension://${extensionUuid}/options.html`);
  await driver.wait(
    async () =>
      driver.executeScript(
        'return document.readyState === "complete" && Boolean(document.body?.innerText);',
      ),
    20_000,
  );
  const optionsHandle = await driver.getWindowHandle();

  async function withOptions(callback) {
    const currentHandle = await driver.getWindowHandle();
    await driver.switchTo().window(optionsHandle);
    try {
      return await callback();
    } finally {
      await driver.switchTo().window(currentHandle);
    }
  }

  async function sendOriginalMessage(method, args = [], noReply = false) {
    let lastError;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        return await withOptions(() =>
          driver.executeAsyncScript(
            `
              const request = arguments[0];
              const done = arguments[1];
              const api = globalThis.browser ?? globalThis.chrome;
              if (request.noReply) {
                api.runtime.sendMessage({
                  method: request.method,
                  args: request.args,
                  noReply: true,
                  refreshActivePage: false,
                }).then(() => done(null), (error) => done({ __error: String(error) }));
                return;
              }
              api.runtime.sendMessage({ method: request.method, args: request.args })
                .then((response) => {
                  if (response?.error) {
                    done({ __error: String(response.error.message ?? response.error) });
                    return;
                  }
                  done({ value: response?.result ?? null });
                }, (error) => done({ __error: String(error) }));
            `,
            { method, args, noReply },
          ),
        ).then((response) => {
          if (response?.__error) throw new Error(response.__error);
          return response?.value ?? null;
        });
      } catch (error) {
        lastError = error;
        await pauseForOriginalUpdate(100);
      }
    }
    throw lastError ?? new Error(`Original Firefox runtime message ${method} failed`);
  }

  async function readOriginalRuntimeState() {
    return sendOriginalMessage('getState', [
      {
        currentProfileName: '',
        isSystemProfile: false,
        firstRun: '',
      },
    ]);
  }

  async function waitForProfile(predicate, label) {
    let latest;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      latest = await readOriginalRuntimeState();
      if (predicate(latest)) return latest;
      await pauseForOriginalUpdate(100);
    }
    throw new Error(
      `Original Firefox profile state did not reach ${label}: ${JSON.stringify(latest)}`,
    );
  }

  async function resolveTabId(url) {
    return withOptions(() =>
      driver.executeAsyncScript(
        `
          const targetUrl = arguments[0];
          const done = arguments[1];
          const api = globalThis.browser ?? globalThis.chrome;
          api.tabs.query({}).then((tabs) => {
            const tab = tabs.find((candidate) => candidate.url === targetUrl);
            done(tab?.id === undefined ? { __error: 'tab-not-found' } : { value: tab.id });
          }, (error) => done({ __error: String(error) }));
        `,
        url,
      ),
    ).then((response) => {
      if (response?.__error)
        throw new Error(`Could not resolve original Firefox audit tab: ${url}`);
      return response.value;
    });
  }

  async function activeTabId() {
    return withOptions(() =>
      driver.executeAsyncScript(`
        const done = arguments[0];
        const api = globalThis.browser ?? globalThis.chrome;
        api.tabs.query({ active: true, lastFocusedWindow: true }).then((tabs) => {
          done(tabs[0]?.id === undefined ? { __error: 'active-tab-not-found' } : { value: tabs[0].id });
        }, (error) => done({ __error: String(error) }));
      `),
    ).then((response) => {
      if (response?.__error) throw new Error('Could not resolve original Firefox active tab');
      return response.value;
    });
  }

  async function captureTab(label, tabId, url, includePageInfo = true) {
    let pageInfo = null;
    if (includePageInfo) {
      try {
        pageInfo = await sendOriginalMessage('getPageInfo', [{ tabId, url }]);
      } catch (error) {
        pageInfo = { error: error instanceof Error ? error.message : String(error) };
      }
    }

    const captured = await withOptions(() =>
      driver.executeAsyncScript(
        `
          const input = arguments[0];
          const done = arguments[1];
          (async () => {
            const api = globalThis.browser ?? globalThis.chrome;
            const action = api.action ?? api.browserAction;
            const safe = async (method, fallback) => {
              if (typeof action?.[method] !== 'function') return fallback;
              try { return await action[method]({ tabId: input.tabId }); }
              catch (error) { return { error: String(error) }; }
            };
            done({
              label: input.label,
              tabId: input.tabId,
              url: input.url,
              action: {
                title: await safe('getTitle', ''),
                badgeText: await safe('getBadgeText', ''),
                badgeBackgroundColor: await safe('getBadgeBackgroundColor', null),
                popup: await safe('getPopup', ''),
              },
              manifest: api.runtime.getManifest(),
              localStorage: await api.storage.local.get(null),
              syncStorage: await api.storage.sync.get(null),
            });
          })().catch((error) => done({ __error: String(error) }));
        `,
        { label, tabId, url },
      ),
    );
    if (captured?.__error) throw new Error(captured.__error);
    return {
      ...captured,
      pageInfo,
      runtimeState: await readOriginalRuntimeState(),
    };
  }

  await waitForProfile(
    (state) => state?.isSystemProfile === true || typeof state?.currentProfileName === 'string',
    'initialized',
  );

  await driver.switchTo().newWindow('tab');
  await driver.get(`${baseUrl}/alpha`);
  await pauseForOriginalUpdate();
  const firstHandle = await driver.getWindowHandle();
  const firstTabId = await resolveTabId(`${baseUrl}/alpha`);

  const states = [];
  states.push(await captureTab('initial-web-page', firstTabId, `${baseUrl}/alpha`));

  await sendOriginalMessage('applyProfile', ['direct'], true);
  await waitForProfile(
    (state) => state?.currentProfileName === 'direct' && state?.isSystemProfile !== true,
    'direct',
  );
  await pauseForOriginalUpdate();
  states.push(await captureTab('direct-web-page', firstTabId, `${baseUrl}/alpha`));

  await sendOriginalMessage('applyProfile', ['system'], true);
  await waitForProfile((state) => state?.isSystemProfile === true, 'system');
  await pauseForOriginalUpdate();
  states.push(await captureTab('system-web-page', firstTabId, `${baseUrl}/alpha`));

  await driver.switchTo().newWindow('tab');
  await driver.get(`${baseUrl}/beta`);
  await pauseForOriginalUpdate();
  const secondTabId = await resolveTabId(`${baseUrl}/beta`);
  states.push(await captureTab('system-second-tab', secondTabId, `${baseUrl}/beta`));
  states.push(await captureTab('system-first-tab-inactive', firstTabId, `${baseUrl}/alpha`));

  await driver.switchTo().newWindow('tab');
  await driver.get('about:support');
  await pauseForOriginalUpdate();
  const internalTabId = await activeTabId();
  states.push(await captureTab('system-internal-page', internalTabId, 'about:support', false));

  await driver.switchTo().window(optionsHandle);
  await writeFile(
    resolve(outputPath, 'options-zh-CN.png'),
    Buffer.from(await driver.takeScreenshot(), 'base64'),
  );
  const optionsCapture = {
    url: await driver.getCurrentUrl(),
    title: await driver.getTitle(),
    bodyText: await driver.executeScript('return document.body?.innerText ?? "";'),
  };

  await driver.switchTo().newWindow('tab');
  await driver.get(`moz-extension://${extensionUuid}/popup/index.html`);
  await driver.wait(
    async () =>
      driver.executeScript(
        'return document.readyState === "complete" && Boolean(document.body?.innerText);',
      ),
    20_000,
  );
  await writeFile(
    resolve(outputPath, 'popup-zh-CN.png'),
    Buffer.from(await driver.takeScreenshot(), 'base64'),
  );
  const popupCapture = {
    url: await driver.getCurrentUrl(),
    title: await driver.getTitle(),
    bodyText: await driver.executeScript('return document.body?.innerText ?? "";'),
    viewport: await driver.executeScript(`
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      };
    `),
  };

  const capabilities = await driver.getCapabilities();
  const result = {
    target: 'firefox',
    addonId,
    extensionUuid,
    browserVersion: capabilities.get('browserVersion') ?? 'unknown',
    baseUrl,
    states,
    options: optionsCapture,
    popup: popupCapture,
  };

  await writeFile(
    resolve(outputPath, 'runtime.json'),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8',
  );
  console.log(JSON.stringify(result, null, 2));

  await driver.switchTo().window(firstHandle);
} finally {
  await driver?.quit();
  await new Promise((resolveClose) => server.close(resolveClose));
}
