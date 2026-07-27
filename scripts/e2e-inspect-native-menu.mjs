import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-inspect-native-'));
const workflowStorageKey = 'zeroomega-nex/profile-workflow/v1/state';
const inspectStorageKey = 'zeroomega-nex/inspect/v1/state';
const targetUrl = 'https://cdn.example.test/native-menu.js';
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
  await page.setContent(`<!doctype html>
    <html><body style="font: 20px sans-serif; padding: 80px">
      <a id="inspect-target" href="${targetUrl}">Native Inspect target</a>
    </body></html>`);
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
  const action = await worker.evaluate(async (id) => {
    const [badge, title] = await Promise.all([
      chrome.action.getBadgeText({ tabId: id }),
      chrome.action.getTitle({ tabId: id }),
    ]);
    return { badge, title };
  }, tabId);
  assert.equal(action.badge, '#');
  assert.match(action.title, /^\[Inspect\] cdn\.example\.test/mu);
  console.log(`[native-inspect] success ${JSON.stringify({ tabId, stored, action })}`);
} catch (error) {
  await run('scrot', ['inspect-native-menu-failure.png']).catch(() => undefined);
  throw error;
} finally {
  await context?.close().catch(() => undefined);
  await rm(userDataDir, { recursive: true, force: true });
}
