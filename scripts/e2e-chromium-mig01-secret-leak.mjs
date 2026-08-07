import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

import { appendMig01Evidence } from './mig01-semantic-evidence.mjs';

const extensionPath = resolve('dist/chrome-mv3');
const fixturePath = resolve('fixtures/zeroomega-v2/credentials-and-headers.redacted.json');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-secret-leak-chromium-'));
const inputPath = resolve(userDataDir, 'sensitive-input.bak');
const channel = 'zeroomega-nex/profile-workflow/v1';
const namespace = 'zeroomega-nex/profile-workflow/v1';
const sentinel = `MIG01_SECRET_${randomUUID()}`;

function assertSentinelAbsent(value, label) {
  assert.equal(
    (typeof value === 'string' ? value : JSON.stringify(value)).includes(sentinel),
    false,
    `${label} exposed the secret sentinel`,
  );
}

async function workflowSnapshot(page) {
  return page.evaluate(async (prefix) => {
    const all = await chrome.storage.local.get(null);
    return Object.fromEntries(Object.entries(all).filter(([key]) => key.startsWith(prefix)));
  }, namespace);
}

let context;
try {
  const source = (await readFile(fixturePath, 'utf8')).replaceAll('<redacted>', sentinel);
  await writeFile(inputPath, source);
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await page.getByLabel('原版备份文件').setInputFiles(inputPath);
  const review = page.locator('[data-legacy-import-review]');
  await review.waitFor({ state: 'visible', timeout: 60_000 });
  assertSentinelAbsent(await review.innerText(), 'Chromium compatibility review');
  await review.locator('[data-legacy-import-and-use]').click();
  await page.getByText('导入完成，原版配置现已启用。').waitFor({ timeout: 60_000 });

  const command = await page.evaluate(async (workflowChannel) => {
    return chrome.runtime.sendMessage({ channel: workflowChannel, action: 'get' });
  }, channel);
  assert.equal(command?.ok, true, 'Chromium workflow command failed after sensitive import');
  assertSentinelAbsent(command, 'Chromium workflow command response');
  const workflowStorage = await workflowSnapshot(page);
  assertSentinelAbsent(workflowStorage, 'Chromium workflow storage');

  await page.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-legacy-export]').click();
  const download = await downloadPromise;
  const exportedPath = await download.path();
  assert.ok(exportedPath, 'Chromium sensitive export did not produce a file');
  const exported = await readFile(exportedPath, 'utf8');
  assertSentinelAbsent(exported, 'Chromium ordinary export');
  for (const marker of ['passwordSecretRef', 'secretRef', 'Authorization', 'X-Fixture-Token']) {
    assert.equal(exported.includes(marker), false, 'Chromium ordinary export retained sensitive metadata');
  }

  const beforeReimport = await workflowSnapshot(page);
  await page.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await page.getByLabel('原版备份文件').setInputFiles(exportedPath);
  const reimportReview = page.locator('[data-legacy-import-review]');
  await reimportReview.waitFor({ state: 'visible', timeout: 60_000 });
  assertSentinelAbsent(await reimportReview.innerText(), 'Chromium sanitized re-import review');
  assert.equal(await reimportReview.locator('[data-legacy-import-and-use]').isEnabled(), true);
  const afterReimport = await workflowSnapshot(page);
  assert.deepEqual(afterReimport, beforeReimport, 'Chromium sanitized re-import review mutated workflow state');

  await appendMig01Evidence({
    kind: 'secret-leak',
    browser: 'chromium',
    corpus: 'sensitive',
    uiClean: true,
    commandClean: true,
    workflowStorageClean: true,
    exportClean: true,
    reimportClean: true,
    persistentMutation: false,
  });
  console.log('Chromium MIG-01.7 secret-leak sentinel passed.');
} finally {
  if (context) await context.close();
  await rm(userDataDir, { recursive: true, force: true });
}
