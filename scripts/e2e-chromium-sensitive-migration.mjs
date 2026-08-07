import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

import {
  assertNoMigrationSecretSentinels,
  materializeSensitiveOriginalBackup,
} from './migration-secret-sentinels.mjs';

const extensionPath = resolve('dist/chrome-mv3');
const fixturePath = resolve('fixtures/zeroomega-v2/credentials-and-headers.redacted.json');
const workDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-sensitive-chromium-'));
const backupPath = resolve(workDir, 'sensitive-original-v3.5.0.bak');
const userDataDir = resolve(workDir, 'profile');
const workflowChannel = 'zeroomega-nex/profile-workflow/v1';
let context;

async function sendWorkflowCommand(options, command) {
  return options.evaluate(
    async ({ channel, input }) => chrome.runtime.sendMessage({ channel, ...input }),
    { channel: workflowChannel, input: command },
  );
}

try {
  await materializeSensitiveOriginalBackup(fixturePath, backupPath);
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  assert.match(extensionId, /^[a-p]{32}$/u, 'Chromium extension ID was not resolved');

  const options = await context.newPage();
  options.on('console', (message) => {
    console.log(`[Sensitive migration console:${message.type()}] ${message.text()}`);
  });
  options.on('pageerror', (error) => {
    console.error(`[Sensitive migration pageerror] ${error.stack ?? error.message}`);
  });
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.waitForLoadState('domcontentloaded');
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await options.getByLabel('原版备份文件').setInputFiles(backupPath);

  const review = options.locator('[data-legacy-import-review]');
  await review.getByRole('heading', { name: '兼容性检查', exact: true }).waitFor({ timeout: 20_000 });
  const importButton = review.locator('[data-legacy-import-and-use]');
  await importButton.waitFor({ state: 'visible', timeout: 20_000 });
  assertNoMigrationSecretSentinels(await review.innerText(), 'Chromium migration review UI');
  assertNoMigrationSecretSentinels(await options.locator('body').innerText(), 'Chromium rendered Options UI before import');

  await importButton.click();
  await options
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  const workflow = await sendWorkflowCommand(options, { action: 'get' });
  assert.equal(workflow?.ok, true, 'Chromium sensitive import workflow get failed');
  assertNoMigrationSecretSentinels(workflow, 'Chromium workflow command response');

  const proxySetting = await options.evaluate(
    async () => chrome.proxy.settings.get({ incognito: false }),
  );
  assertNoMigrationSecretSentinels(proxySetting, 'Chromium public proxy/PAC setting');
  assertNoMigrationSecretSentinels(await options.locator('body').innerText(), 'Chromium rendered Options UI after import');

  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  const downloadPromise = options.waitForEvent('download');
  await options.locator('[data-legacy-export]').click();
  const download = await downloadPromise;
  const exportedPath = await download.path();
  assert.ok(exportedPath, 'Chromium sensitive migration export did not produce a file');
  const exportedContent = await readFile(exportedPath, 'utf8');
  JSON.parse(exportedContent);
  assertNoMigrationSecretSentinels(exportedContent, 'Chromium ordinary .bak export');
  assert.doesNotMatch(
    exportedContent,
    /passwordSecretRef|secretRef|Authorization|X-Fixture-Token/u,
    'Chromium ordinary .bak export retained sensitive migration structure',
  );

  console.log('Chromium sensitive original backup public-surface leak gate passed.');
} finally {
  if (context) await context.close();
  await rm(workDir, { recursive: true, force: true });
}
