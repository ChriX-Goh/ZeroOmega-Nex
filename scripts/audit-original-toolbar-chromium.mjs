import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_CHROMIUM_PATH ?? 'original-release/chromium',
);
const outputPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_RUNTIME_OUTPUT ?? 'original-runtime/chromium',
);
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-original-chromium-'));
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
if (!address || typeof address === 'string') throw new Error('Original audit server failed');
const baseUrl = `http://127.0.0.1:${address.port}`;

let context;

async function pauseForOriginalUpdate() {
  await new Promise((resolvePause) => setTimeout(resolvePause, 900));
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 20_000 });
  const extensionId = new URL(worker.url()).host;
  assert.match(extensionId, /^[a-p]{32}$/u, 'Original Chromium extension ID was not resolved');

  const first = await context.newPage();
  await first.goto(`${baseUrl}/alpha`);
  await first.bringToFront();
  await pauseForOriginalUpdate();

  const firstTabId = await worker.evaluate(async (url) => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find((candidate) => candidate.url === url);
    if (tab?.id === undefined) throw new Error(`Could not resolve original audit tab: ${url}`);
    return tab.id;
  }, `${baseUrl}/alpha`);

  async function sendOriginalMessage(method, args = [], noReply = false) {
    return worker.evaluate(
      async ({ method: requestMethod, args: requestArgs, noReply: requestNoReply }) => {
        if (requestNoReply) {
          chrome.runtime.sendMessage({
            method: requestMethod,
            args: requestArgs,
            noReply: true,
            refreshActivePage: false,
          });
          return null;
        }
        return new Promise((resolveMessage, rejectMessage) => {
          chrome.runtime.sendMessage(
            { method: requestMethod, args: requestArgs },
            (response) => {
              if (chrome.runtime.lastError) {
                rejectMessage(new Error(chrome.runtime.lastError.message));
                return;
              }
              if (response?.error) {
                rejectMessage(new Error(String(response.error.message ?? response.error)));
                return;
              }
              resolveMessage(response?.result ?? null);
            },
          );
        });
      },
      { method, args, noReply },
    );
  }

  async function captureTab(label, tabId, url) {
    return worker.evaluate(
      async ({ captureLabel, captureTabId, captureUrl }) => {
        const manifest = chrome.runtime.getManifest();
        const action = {
          title: await chrome.action.getTitle({ tabId: captureTabId }),
          badgeText: await chrome.action.getBadgeText({ tabId: captureTabId }),
          badgeBackgroundColor: await chrome.action.getBadgeBackgroundColor({
            tabId: captureTabId,
          }),
          popup: await chrome.action.getPopup({ tabId: captureTabId }),
        };
        const pageInfo = await new Promise((resolveMessage, rejectMessage) => {
          chrome.runtime.sendMessage(
            { method: 'getPageInfo', args: [{ tabId: captureTabId, url: captureUrl }] },
            (response) => {
              if (chrome.runtime.lastError) {
                rejectMessage(new Error(chrome.runtime.lastError.message));
                return;
              }
              if (response?.error) {
                rejectMessage(new Error(String(response.error.message ?? response.error)));
                return;
              }
              resolveMessage(response?.result ?? null);
            },
          );
        });
        return {
          label: captureLabel,
          tabId: captureTabId,
          url: captureUrl,
          action,
          pageInfo,
          manifest: {
            name: manifest.name,
            version: manifest.version,
            manifestVersion: manifest.manifest_version,
            action: manifest.action,
            permissions: manifest.permissions,
          },
          localStorage: await chrome.storage.local.get(null),
          syncStorage: await chrome.storage.sync.get(null),
        };
      },
      { captureLabel: label, captureTabId: tabId, captureUrl: url },
    );
  }

  const states = [];
  states.push(await captureTab('initial-web-page', firstTabId, `${baseUrl}/alpha`));

  await sendOriginalMessage('applyProfile', ['direct'], true);
  await pauseForOriginalUpdate();
  states.push(await captureTab('direct-web-page', firstTabId, `${baseUrl}/alpha`));

  await sendOriginalMessage('applyProfile', ['system'], true);
  await pauseForOriginalUpdate();
  states.push(await captureTab('system-web-page', firstTabId, `${baseUrl}/alpha`));

  const second = await context.newPage();
  await second.goto(`${baseUrl}/beta`);
  await second.bringToFront();
  await pauseForOriginalUpdate();
  const secondTabId = await worker.evaluate(async (url) => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find((candidate) => candidate.url === url);
    if (tab?.id === undefined) throw new Error(`Could not resolve original audit tab: ${url}`);
    return tab.id;
  }, `${baseUrl}/beta`);
  states.push(await captureTab('system-second-tab', secondTabId, `${baseUrl}/beta`));
  states.push(await captureTab('system-first-tab-inactive', firstTabId, `${baseUrl}/alpha`));

  const internal = await context.newPage();
  await internal.goto('chrome://version/');
  await internal.bringToFront();
  await pauseForOriginalUpdate();
  const internalTabId = await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tabs[0]?.id === undefined) throw new Error('Could not resolve internal audit tab');
    return tabs[0].id;
  });
  states.push(await captureTab('system-internal-page', internalTabId, 'chrome://version/'));

  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.waitForLoadState('domcontentloaded');
  await options.screenshot({ path: resolve(outputPath, 'options-zh-CN.png'), fullPage: true });

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup-iframe.html`);
  await popup.waitForLoadState('domcontentloaded');
  await popup.screenshot({ path: resolve(outputPath, 'popup-iframe-zh-CN.png'), fullPage: true });

  const result = {
    target: 'chromium',
    extensionId,
    browserVersion: context.browser()?.version() ?? 'unknown',
    baseUrl,
    states,
    options: {
      url: options.url(),
      title: await options.title(),
      bodyText: await options.locator('body').innerText(),
    },
    popup: {
      url: popup.url(),
      title: await popup.title(),
      bodyText: await popup.locator('body').innerText(),
      viewport: await popup.evaluate(() => ({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      })),
    },
  };

  await writeFile(
    resolve(outputPath, 'runtime.json'),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8',
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await context?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
