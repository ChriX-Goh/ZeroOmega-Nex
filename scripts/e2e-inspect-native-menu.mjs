import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-inspect-native-'));
const workflowStorageKey = 'zeroomega-nex/profile-workflow/v1/state';
const inspectStorageKey = 'zeroomega-nex/inspect/v1/state';
const targetUrl = 'https://cdn.example.test/native-menu.js';
const sourceServer = createServer((request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  const currentUrl = `http://127.0.0.1:${sourceServer.address().port}${request.url}`;
  response.end(`<!doctype html><html><body style="font: 20px sans-serif; padding: 80px">
    <a id="inspect-target" href="${targetUrl}">Native Inspect target</a>
    <a id="inspect-clear" href="${currentUrl}">Clear Inspect using current page URL</a>
  </body></html>`);
});
await new Promise((resolveListen, rejectListen) => {
  sourceServer.once('error', rejectListen);
  sourceServer.listen(0, '127.0.0.1', resolveListen);
});
const sourceAddress = sourceServer.address();
if (!sourceAddress || typeof sourceAddress === 'string') {
  throw new Error('Inspect source server failed');
}
const pageUrl = `http://127.0.0.1:${sourceAddress.port}/inspect`;
const isolationUrl = `http://127.0.0.1:${sourceAddress.port}/isolation`;
let context;

function run(command, args, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.once('error', rejectRun);
    child.once('exit', (code, signal) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} exited with code ${code} signal ${signal ?? 'none'}`));
    });
  });
}

async function eventually(check, message, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      last = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error(`${message}${last ? `: ${last}` : ''}`);
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: false,
    locale: 'en-US',
    viewport: { width: 1280, height: 800 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--window-position=0,0',
      '--window-size=1280,800',
    ],
  });

  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  assert.match(extensionId, /^[a-p]{32}$/u);

  const bootstrapPage = await context.newPage();
  await bootstrapPage.goto(`chrome-extension://${extensionId}/options.html`);
  await bootstrapPage.waitForLoadState('domcontentloaded');
  await eventually(
    async () =>
      worker.evaluate(async (key) => {
        const values = await chrome.storage.local.get(key);
        return Boolean(values[key]);
      }, workflowStorageKey),
    'Profile workflow did not initialize from Options',
  );
  await bootstrapPage.close();

  const page = await context.newPage();
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  const isolationPage = await context.newPage();
  await isolationPage.goto(isolationUrl, { waitUntil: 'domcontentloaded' });
  const tabIds = await eventually(
    () =>
      worker.evaluate(
        async ({ target, isolation }) => {
          const tabs = await chrome.tabs.query({});
          return {
            target: tabs.find((tab) => tab.url === target)?.id,
            isolation: tabs.find((tab) => tab.url === isolation)?.id,
          };
        },
        { target: pageUrl, isolation: isolationUrl },
      ),
    'Inspect target and isolation tab IDs were not resolved',
  );
  assert.equal(typeof tabIds.target, 'number');
  assert.equal(typeof tabIds.isolation, 'number');
  const baseActions = await eventually(
    () =>
      worker.evaluate(async ({ target, isolation }) => {
        const read = async (tabId) => ({
          badge: await chrome.action.getBadgeText({ tabId }),
          title: await chrome.action.getTitle({ tabId }),
        });
        const loadingTitle = chrome.i18n.getMessage('manifest_icon_default_title');
        const globalTitle = await chrome.action.getTitle({});
        const actions = { target: await read(target), isolation: await read(isolation) };
        return globalTitle !== loadingTitle &&
          actions.target.badge === '' &&
          actions.isolation.badge === '' &&
          actions.target.title === globalTitle &&
          actions.isolation.title === globalTitle
          ? actions
          : undefined;
      }, tabIds),
    'Inspect target and isolation Action baselines did not settle',
  );
  await page.bringToFront();
  await new Promise((resolveWait) => setTimeout(resolveWait, 500));

  await page.locator('#inspect-target').click({ button: 'right' });
  await new Promise((resolveWait) => setTimeout(resolveWait, 800));
  await run('scrot', ['inspect-native-menu-before.png']);

  // Chromium places extension link actions immediately before its built-in Inspect item.
  // End selects built-in Inspect; one Up selects ZeroOmega's real native Inspect link item.
  await run('xdotool', ['key', '--clearmodifiers', 'End', 'Up', 'Return']);

  const stored = await eventually(
    async () =>
      worker.evaluate(async (key) => {
        const values = await chrome.storage.session.get(key);
        return values[key];
      }, inspectStorageKey),
    'Keyboard-selected native context-menu action did not create Inspect session state',
  );
  const entries = stored?.entries ?? {};
  const matched = Object.entries(entries).find(([, entry]) => entry?.url === targetUrl);
  assert.ok(
    matched,
    `Inspect state did not contain the native link target: ${JSON.stringify(stored)}`,
  );

  const tabId = Number(matched[0]);
  assert.ok(
    Number.isInteger(tabId) && tabId >= 0,
    `Inspect state had an invalid tab ID: ${matched[0]}`,
  );
  assert.equal(tabId, tabIds.target, 'Inspect overlay was stored on the wrong tab');
  const action = await worker.evaluate(async (id) => {
    const [badge, title] = await Promise.all([
      chrome.action.getBadgeText({ tabId: id }),
      chrome.action.getTitle({ tabId: id }),
    ]);
    return { badge, title };
  }, tabId);
  assert.equal(action.badge, '#');
  assert.match(action.title, /^\[Inspect\] cdn\.example\.test/mu);
  const isolatedAfterSet = await worker.evaluate(
    async (id) => ({
      badge: await chrome.action.getBadgeText({ tabId: id }),
      title: await chrome.action.getTitle({ tabId: id }),
    }),
    tabIds.isolation,
  );
  assert.deepEqual(isolatedAfterSet, baseActions.isolation, 'Inspect leaked into another tab');

  await page.bringToFront();
  await page.locator('#inspect-clear').click({ button: 'right' });
  await new Promise((resolveWait) => setTimeout(resolveWait, 800));
  await run('xdotool', ['key', '--clearmodifiers', 'End', 'Up', 'Return']);
  const cleared = await eventually(
    async () =>
      worker.evaluate(
        async ({ key, target, expected }) => {
          const values = await chrome.storage.session.get(key);
          const entry = values[key]?.entries?.[String(target)];
          const action = {
            badge: await chrome.action.getBadgeText({ tabId: target }),
            title: await chrome.action.getTitle({ tabId: target }),
          };
          return entry === undefined && JSON.stringify(action) === JSON.stringify(expected)
            ? { entry, action }
            : undefined;
        },
        { key: inspectStorageKey, target: tabIds.target, expected: baseActions.target },
      ),
    'Inspect clear did not remove the overlay and restore the base Action',
  );
  const isolatedAfterClear = await worker.evaluate(
    async (id) => ({
      badge: await chrome.action.getBadgeText({ tabId: id }),
      title: await chrome.action.getTitle({ tabId: id }),
    }),
    tabIds.isolation,
  );
  assert.deepEqual(isolatedAfterClear, baseActions.isolation, 'Inspect clear changed another tab');
  console.log(
    `[native-inspect] success ${JSON.stringify({ tabId, stored, action, cleared, isolatedAfterSet, isolatedAfterClear })}`,
  );
} catch (error) {
  await run('scrot', ['inspect-native-menu-failure.png']).catch(() => undefined);
  throw error;
} finally {
  await context?.close().catch(() => undefined);
  await new Promise((resolveClose) => sourceServer.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
}
