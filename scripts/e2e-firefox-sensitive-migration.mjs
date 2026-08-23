import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { Browser, Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

import { firefoxService } from './firefox-service.mjs';
import {
  assertNoMigrationSecretSentinels,
  materializeSensitiveOriginalBackup,
} from './migration-secret-sentinels.mjs';

const extensionPath = resolve('dist/firefox-mv3');
const fixturePath = resolve('fixtures/zeroomega-v2/credentials-and-headers.redacted.json');
const workDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-sensitive-firefox-'));
const profileDir = resolve(workDir, 'profile');
const downloadDir = resolve(workDir, 'downloads');
const backupPath = resolve(workDir, 'sensitive-original-v3.5.0.bak');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000029';
const workflowChannel = 'zeroomega-nex/profile-workflow/v1';
let driver;

async function bidiCommand(method, params) {
  const capabilities = await driver.getCapabilities();
  const webSocketUrl = capabilities.get('webSocketUrl');
  assert.equal(typeof webSocketUrl, 'string', 'Firefox did not expose a BiDi URL');
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener(
      'error',
      () => rejectOpen(new Error('Firefox BiDi connection failed')),
      {
        once: true,
      },
    );
  });
  try {
    return await new Promise((resolveResponse, rejectResponse) => {
      const id = 1;
      const timeout = setTimeout(
        () => rejectResponse(new Error(`Firefox BiDi ${method} timed out`)),
        20_000,
      );
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data));
        if (message.id !== id) return;
        clearTimeout(timeout);
        if (message.type === 'error' || message.error) {
          rejectResponse(new Error(`Firefox BiDi ${method} failed`));
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

async function sendWorkflowCommand(command) {
  return driver.executeAsyncScript(
    `
      const command = arguments[0];
      const done = arguments[1];
      browser.runtime.sendMessage(command).then(done, () => done({ ok: false }));
    `,
    { channel: workflowChannel, ...command },
  );
}

async function waitForDownloadedExport(previousFiles) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    for (const file of await readdir(downloadDir)) {
      if (previousFiles.has(file) || file.endsWith('.part')) continue;
      const candidate = resolve(downloadDir, file);
      if ((await stat(candidate)).size > 0) return candidate;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail('Firefox sensitive migration export did not appear');
}

try {
  await materializeSensitiveOriginalBackup(fixturePath, backupPath);
  await Promise.all([
    import('node:fs/promises').then(({ mkdir }) => mkdir(profileDir, { recursive: true })),
    import('node:fs/promises').then(({ mkdir }) => mkdir(downloadDir, { recursive: true })),
  ]);

  const options = new firefox.Options()
    .addArguments('-headless', '-profile', profileDir)
    .enableBidi()
    .setPreference('intl.accept_languages', 'zh-TW')
    .setPreference('intl.locale.requested', 'zh-TW')
    .setPreference('extensions.webextOptionalPermissionPrompts', false)
    .setPreference('browser.download.folderList', 2)
    .setPreference('browser.download.dir', downloadDir)
    .setPreference('browser.download.useDownloadDir', true)
    .setPreference('browser.download.alwaysOpenPanel', false)
    .setPreference(
      'browser.helperApps.neverAsk.saveToDisk',
      'application/json,text/json,application/octet-stream',
    )
    .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));

  driver = await new Builder()
    .forBrowser(Browser.FIREFOX)
    .setFirefoxService(firefoxService())
    .setFirefoxOptions(options)
    .build();

  const installed = await bidiCommand('webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  assert.equal(installed?.extension, addonId, 'Firefox returned an unexpected add-on ID');

  const context = await driver.getWindowHandle();
  const optionsUrl = `moz-extension://${extensionUuid}/options.html`;
  await bidiCommand('browsingContext.navigate', { context, url: optionsUrl, wait: 'complete' });
  await driver.wait(
    until.elementLocated(By.xpath("//button[.//*[@data-options-nav-icon='import']]")),
    20_000,
  );
  await driver.findElement(By.xpath("//button[.//*[@data-options-nav-icon='import']]")).click();
  const fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 20_000);
  await fileInput.sendKeys(backupPath);

  const review = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(review), 20_000);
  const importButton = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review] [data-legacy-import-and-use]')),
    20_000,
  );
  assertNoMigrationSecretSentinels(await review.getText(), 'Firefox migration review UI');
  assertNoMigrationSecretSentinels(
    await driver.findElement(By.css('body')).getText(),
    'Firefox rendered Options UI before import',
  );

  await importButton.click();
  const success = await driver.wait(
    until.elementLocated(
      By.xpath("//*[@data-legacy-import-review]/following-sibling::section[1]//p[@role='status']"),
    ),
    20_000,
  );
  await driver.wait(until.elementIsVisible(success), 20_000);

  const workflow = await sendWorkflowCommand({ action: 'get' });
  assert.equal(workflow?.ok, true, 'Firefox sensitive import workflow get failed');
  assertNoMigrationSecretSentinels(workflow, 'Firefox workflow command response');

  const proxySetting = await driver.executeAsyncScript(`
    const done = arguments[0];
    browser.proxy.settings.get({ incognito: false }).then(done, () => done({ ok: false }));
  `);
  assertNoMigrationSecretSentinels(proxySetting, 'Firefox public proxy/PAC setting');
  assertNoMigrationSecretSentinels(
    await driver.findElement(By.css('body')).getText(),
    'Firefox rendered Options UI after import',
  );

  await driver.findElement(By.xpath("//button[.//*[@data-options-nav-icon='import']]")).click();
  const previousFiles = new Set(await readdir(downloadDir));
  await driver.findElement(By.css('[data-legacy-export]')).click();
  const exportedPath = await waitForDownloadedExport(previousFiles);
  const exportedContent = await readFile(exportedPath, 'utf8');
  JSON.parse(exportedContent);
  assertNoMigrationSecretSentinels(exportedContent, 'Firefox ordinary .bak export');
  assert.doesNotMatch(
    exportedContent,
    /passwordSecretRef|secretRef|Authorization|X-Fixture-Token/u,
    'Firefox ordinary .bak export retained sensitive migration structure',
  );

  console.log('Firefox sensitive original backup public-surface leak gate passed.');
} finally {
  if (driver) await driver.quit();
  await rm(workDir, { recursive: true, force: true });
}
