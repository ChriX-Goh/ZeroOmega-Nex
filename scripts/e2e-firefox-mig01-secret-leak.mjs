import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { Browser, Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

import { firefoxService } from './firefox-service.mjs';
import { appendMig01Evidence } from './mig01-semantic-evidence.mjs';

const extensionPath = resolve('dist/firefox-mv3');
const fixturePath = resolve('fixtures/zeroomega-v2/credentials-and-headers.redacted.json');
const profileDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-secret-leak-firefox-'));
const downloadDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-secret-export-firefox-'));
const inputPath = resolve(profileDir, 'sensitive-input.bak');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000031';
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

function firefoxOptions() {
  return new firefox.Options()
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
}

async function bidiCommand(driver, method, params) {
  const capabilities = await driver.getCapabilities();
  const webSocketUrl = capabilities.get('webSocketUrl');
  assert.equal(typeof webSocketUrl, 'string');
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener(
      'error',
      () => rejectOpen(new Error('Could not connect to Firefox BiDi')),
      { once: true },
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

async function installExtension(driver) {
  const result = await bidiCommand(driver, 'webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  assert.equal(result?.extension, addonId);
}

async function navigateOptions(driver) {
  const context = await driver.getWindowHandle();
  const url = `moz-extension://${extensionUuid}/options.html`;
  const result = await bidiCommand(driver, 'browsingContext.navigate', {
    context,
    url,
    wait: 'complete',
  });
  assert.equal(result?.url, `${url}#/about`);
  await driver.wait(
    until.elementLocated(By.xpath("//button[.//*[@data-options-nav-icon='import']]")),
    20_000,
  );
}

async function workflowSnapshot(driver) {
  return driver.executeAsyncScript(
    `
      const prefix = arguments[0];
      const done = arguments[1];
      browser.storage.local.get(null).then((all) => {
        done(Object.fromEntries(Object.entries(all).filter(([key]) => key.startsWith(prefix))));
      }, () => done({ error: 'storage-read-failed' }));
    `,
    namespace,
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
  assert.fail('Firefox sensitive export did not appear');
}

let driver;
try {
  const source = (await readFile(fixturePath, 'utf8')).replaceAll('<redacted>', sentinel);
  await writeFile(inputPath, source);
  driver = await new Builder()
    .forBrowser(Browser.FIREFOX)
    .setFirefoxService(firefoxService())
    .setFirefoxOptions(firefoxOptions())
    .build();
  await installExtension(driver);
  await navigateOptions(driver);

  const importExport = await driver.findElement(
    By.xpath("//button[.//*[@data-options-nav-icon='import']]"),
  );
  await importExport.click();
  let fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 60_000);
  await fileInput.sendKeys(inputPath);
  let review = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review]')),
    60_000,
  );
  await driver.wait(until.elementIsVisible(review), 60_000);
  assertSentinelAbsent(await review.getText(), 'Firefox compatibility review');
  let importButton = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-and-use]')),
    60_000,
  );
  await importButton.click();
  await driver.wait(async () => {
    const response = await driver.executeAsyncScript(
      `
        const channel = arguments[0];
        const done = arguments[1];
        browser.runtime.sendMessage({ channel, action: 'get' }).then(done, () => done({ ok: false }));
      `,
      channel,
    );
    return response?.ok === true && response.state?.applied?.profiles?.length > 0;
  }, 60_000);

  const command = await driver.executeAsyncScript(
    `
      const channel = arguments[0];
      const done = arguments[1];
      browser.runtime.sendMessage({ channel, action: 'get' }).then(done, () => done({ ok: false }));
    `,
    channel,
  );
  assert.equal(command?.ok, true);
  assertSentinelAbsent(command, 'Firefox workflow command response');
  const workflowStorage = await workflowSnapshot(driver);
  assertSentinelAbsent(workflowStorage, 'Firefox workflow storage');

  await importExport.click();
  const previousFiles = new Set(await readdir(downloadDir));
  await driver.findElement(By.css('[data-legacy-export]')).click();
  const exportedPath = await waitForDownloadedExport(previousFiles);
  const exported = await readFile(exportedPath, 'utf8');
  assertSentinelAbsent(exported, 'Firefox ordinary export');
  for (const marker of ['passwordSecretRef', 'secretRef', 'Authorization', 'X-Fixture-Token']) {
    assert.equal(
      exported.includes(marker),
      false,
      'Firefox ordinary export retained sensitive metadata',
    );
  }

  const beforeReimport = await workflowSnapshot(driver);
  await importExport.click();
  fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 60_000);
  await fileInput.sendKeys(exportedPath);
  review = await driver.wait(until.elementLocated(By.css('[data-legacy-import-review]')), 60_000);
  await driver.wait(until.elementIsVisible(review), 60_000);
  assertSentinelAbsent(await review.getText(), 'Firefox sanitized re-import review');
  importButton = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-and-use]')),
    60_000,
  );
  assert.equal(await importButton.isEnabled(), true);
  const afterReimport = await workflowSnapshot(driver);
  assert.deepEqual(
    afterReimport,
    beforeReimport,
    'Firefox sanitized re-import review mutated workflow state',
  );

  await appendMig01Evidence({
    kind: 'secret-leak',
    browser: 'firefox',
    corpus: 'sensitive',
    uiClean: true,
    commandClean: true,
    workflowStorageClean: true,
    exportClean: true,
    reimportClean: true,
    persistentMutation: false,
  });
  console.log('Firefox MIG-01.7 secret-leak sentinel passed.');
} finally {
  if (driver) await driver.quit();
  await Promise.all([
    rm(profileDir, { recursive: true, force: true }),
    rm(downloadDir, { recursive: true, force: true }),
  ]);
}
