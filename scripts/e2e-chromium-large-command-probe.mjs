import assert from 'node:assert/strict';
import { readFile, rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const candidate = JSON.parse(
  await readFile(
    resolve('evidence/mig01-large-runtime/original-large-representative.candidate.json'),
    'utf8',
  ),
);
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-large-command-probe-'));
const channel = 'zeroomega-nex/profile-workflow/v1';
let context;
try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.waitForLoadState('domcontentloaded');

  const send = (command) =>
    page.evaluate(
      async ({ workflowChannel, input }) =>
        chrome.runtime.sendMessage({ channel: workflowChannel, ...input }),
      { workflowChannel: channel, input: command },
    );
  const initial = await send({ action: 'get' });
  assert.equal(initial?.ok, true, JSON.stringify(initial));
  const acceptStarted = performance.now();
  const accepted = await send({
    action: 'accept-import',
    expectedGeneration: initial.state.generation,
    candidate,
    secretMaterials: [],
  });
  const acceptMs = performance.now() - acceptStarted;
  console.log(
    'CHROMIUM_LARGE_ACCEPT=' +
      JSON.stringify({
        ms: acceptMs,
        ok: accepted?.ok,
        code: accepted?.code,
        message: accepted?.message,
        generation: accepted?.state?.generation,
        profiles: accepted?.state?.draft?.profiles?.length,
      }),
  );
  assert.equal(accepted?.ok, true, JSON.stringify(accepted));

  const applyStarted = performance.now();
  const applied = await send({ action: 'apply', expectedGeneration: accepted.state.generation });
  const applyMs = performance.now() - applyStarted;
  console.log(
    'CHROMIUM_LARGE_APPLY=' +
      JSON.stringify({
        ms: applyMs,
        ok: applied?.ok,
        code: applied?.code,
        message: applied?.message,
        generation: applied?.state?.generation,
        profiles: applied?.state?.applied?.profiles?.length,
        snapshotId: applied?.appliedSnapshotId,
      }),
  );
  assert.equal(applied?.ok, true, JSON.stringify(applied));

  const storage = await page.evaluate(async () => chrome.storage.local.get(null));
  const workflowStorage = Object.fromEntries(
    Object.entries(storage).filter(([key]) => key.startsWith('zeroomega-nex/profile-workflow/v1')),
  );
  console.log(
    'CHROMIUM_LARGE_STORAGE=' +
      JSON.stringify({
        bytes: Buffer.byteLength(JSON.stringify(workflowStorage), 'utf8'),
        keys: Object.keys(workflowStorage).length,
        revisions: storage['zeroomega-nex/profile-workflow/v1/revision-index']?.length ?? 0,
      }),
  );
} finally {
  if (context) await context.close();
  await rm(userDataDir, { recursive: true, force: true });
}
