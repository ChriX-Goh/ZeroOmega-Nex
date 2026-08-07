import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { Browser, Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

import {
  appendMig01Evidence,
  assertNoSecretMarkers,
  semanticSha256,
  sha256Text,
} from './mig01-semantic-evidence.mjs';

import { firefoxService } from './firefox-service.mjs';

const extensionPath = resolve('dist/firefox-mv3');
const complexCorpus = process.env.ZEROOMEGA_ORIGINAL_MIGRATION_CORPUS === 'complex';
const originalBackupPath = resolve(
  complexCorpus
    ? 'fixtures/zeroomega-v2/original-complex-corpus-cd-v3.5.0.bak'
    : 'fixtures/zeroomega-v2/original-default-v3.5.0.bak',
);
const profileDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-firefox-migration-'));
const downloadDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-firefox-export-'));
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000028';
const workflowChannel = 'zeroomega-nex/profile-workflow/v1';
const proxyStateKey = 'zeroomega-nex/browser-proxy/v1/state';
const targetMarker = 'Original backup direct route';
const proxyMarker = 'Original backup proxy route';
const proxyRequests = [];
let targetRequestCount = 0;

const targetServer = createServer((_request, response) => {
  targetRequestCount += 1;
  response.writeHead(200, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(targetMarker);
});
await listen(targetServer, 0);
const targetAddress = targetServer.address();
if (!targetAddress || typeof targetAddress === 'string') {
  throw new Error('Firefox original migration target server failed');
}

const proxyServer = createServer((request, response) => {
  proxyRequests.push(String(request.url ?? ''));
  response.writeHead(200, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(proxyMarker);
});
await listen(proxyServer, 8080);

async function listen(server, port) {
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(port, '127.0.0.1', resolveListen);
  });
}

async function closeServer(server) {
  await new Promise((resolveClose) => server.close(resolveClose));
}

function firefoxOptions() {
  return new firefox.Options()
    .addArguments('-headless', '-profile', profileDir)
    .enableBidi()
    .setPreference('intl.accept_languages', 'zh-TW')
    .setPreference('intl.locale.requested', 'zh-TW')
    .setPreference('extensions.webextOptionalPermissionPrompts', false)
    .setPreference('network.dns.disableIPv6', true)
    .setPreference(
      'network.dns.localDomains',
      'proxy.example.com,internal.example.com,routed.example.com,' +
        'proxy-corpus.example.com,direct.corpus.test,nested.corpus.example.com,' +
        'rulelist.corpus.example.com,pac.corpus.example.com',
    )
    .setPreference('network.proxy.allow_hijacking_localhost', true)
    .setPreference('browser.download.folderList', 2)
    .setPreference('browser.download.dir', downloadDir)
    .setPreference('browser.download.useDownloadDir', true)
    .setPreference('browser.download.alwaysOpenPanel', false)
    .setPreference('browser.download.manager.showWhenStarting', false)
    .setPreference(
      'browser.helperApps.neverAsk.saveToDisk',
      'application/json,text/json,application/octet-stream',
    )
    .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));
}

async function launch() {
  return new Builder()
    .forBrowser(Browser.FIREFOX)
    .setFirefoxService(firefoxService())
    .setFirefoxOptions(firefoxOptions())
    .build();
}

async function bidiCommand(driver, method, params) {
  const capabilities = await driver.getCapabilities();
  const webSocketUrl = capabilities.get('webSocketUrl');
  assert.equal(typeof webSocketUrl, 'string', 'Firefox did not expose a BiDi URL');
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

async function installExtension(driver) {
  const result = await bidiCommand(driver, 'webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  assert.equal(result?.extension, addonId, 'Firefox returned an unexpected add-on ID');
}

async function navigateOptions(driver) {
  const context = await driver.getWindowHandle();
  const url = `moz-extension://${extensionUuid}/options.html`;
  const result = await bidiCommand(driver, 'browsingContext.navigate', {
    context,
    url,
    wait: 'complete',
  });
  const expectedUrl = `${url}#/about`;
  assert.equal(result?.url, expectedUrl, 'Firefox did not navigate to the Options page');
  await driver.wait(async () => (await driver.getCurrentUrl()) === expectedUrl, 20_000);
  await driver.wait(
    until.elementLocated(By.xpath("//button[.//*[@data-options-nav-icon='import']]")),
    20_000,
  );
  return driver.getWindowHandle();
}

async function sendWorkflowCommand(driver, command) {
  return driver.executeAsyncScript(
    `
      const command = arguments[0];
      const done = arguments[1];
      browser.runtime.sendMessage(command).then(done, (error) => done({ error: String(error) }));
    `,
    { channel: workflowChannel, ...command },
  );
}

function assertWorkflowSuccess(response, label) {
  assert.equal(response?.ok, true, `${label}: ${JSON.stringify(response)}`);
  return response;
}

async function workflowView(driver) {
  return driver.executeAsyncScript(
    `
      const channel = arguments[0];
      const done = arguments[1];
      Promise.all([
        browser.runtime.sendMessage({ channel, action: 'get' }),
        browser.proxy.settings.get({}),
        browser.storage.local.get(null),
      ]).then(done, (error) => done({ error: String(error) }));
    `,
    workflowChannel,
  );
}

async function waitForActiveSwitch(driver, profileId, label) {
  const deadline = Date.now() + 20_000;
  let last;
  while (Date.now() < deadline) {
    last = await workflowView(driver);
    if (!Array.isArray(last)) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
      continue;
    }
    const [workflow, proxySetting, storage] = last;
    const proxyState = storage[proxyStateKey];
    const snapshot = proxyState?.activeSnapshotId
      ? storage[`zeroomega-nex/browser-proxy/v1/snapshot/${proxyState.activeSnapshotId}`]
      : undefined;
    const autoConfigUrl = proxySetting?.value?.autoConfigUrl;
    if (
      workflow?.ok === true &&
      workflow.runtime?.activeRoute?.kind === 'profile' &&
      workflow.runtime.activeRoute.profileId === profileId &&
      proxySetting?.levelOfControl === 'controlled_by_this_extension' &&
      proxySetting?.value?.proxyType === 'autoConfig' &&
      typeof autoConfigUrl === 'string' &&
      autoConfigUrl.startsWith('data:application/x-ns-proxy-autoconfig;charset=utf-8,') &&
      snapshot?.startRoute?.kind === 'profile' &&
      snapshot.startRoute.profileId === profileId
    ) {
      return { workflow, proxySetting, storage };
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(`${label}: ${JSON.stringify(last)}`);
}

async function assertImportedState(driver) {
  const view = await workflowView(driver);
  assert.ok(Array.isArray(view), `Imported workflow view failed: ${JSON.stringify(view)}`);
  const [workflow] = view;
  assert.equal(workflow?.ok, true, `Imported workflow failed: ${JSON.stringify(workflow)}`);

  const applied = workflow.state.applied;
  const fixedName = complexCorpus ? 'corpus proxy' : 'proxy';
  const switchName = complexCorpus ? 'outer switch' : 'auto switch';
  const fixed = applied.profiles.find((profile) => profile.name === fixedName);
  const autoSwitch = applied.profiles.find((profile) => profile.name === switchName);
  assert.equal(fixed?.kind, 'fixed', 'Original Fixed profile was not imported');
  assert.equal(fixed.color, complexCorpus ? '#5c9ded' : '#99ccee');
  assert.equal(autoSwitch?.kind, 'switch', 'Original Switch profile was not imported');
  assert.equal(autoSwitch.color, complexCorpus ? '#4aa3a2' : '#99dd99');
  assert.equal(applied.profiles.indexOf(fixed) < applied.profiles.indexOf(autoSwitch), true);
  assert.equal(workflow.state.draft.revision.id, applied.revision.id);

  const fallback = applied.proxyEndpoints.find(
    (endpoint) => endpoint.id === fixed.proxyByScheme.fallback,
  );
  assert.ok(fallback, 'Original Fixed fallback endpoint was not imported');
  assert.equal(fallback.protocol, 'http');
  assert.equal(fallback.host, complexCorpus ? 'proxy-corpus.example.com' : 'proxy.example.com');
  assert.equal(fallback.port, 8080);
  assert.deepEqual(
    fixed.bypass?.map((entry) => entry.pattern),
    complexCorpus ? ['127.0.0.1', '[::1]', 'localhost'] : ['127.0.0.1', '::1', 'localhost'],
  );

  if (!complexCorpus) return { autoSwitchId: autoSwitch.id, applied };

  const innerSwitch = applied.profiles.find((profile) => profile.name === 'inner switch');
  const virtualRoute = applied.profiles.find((profile) => profile.name === 'virtual route');
  const corpusRules = applied.profiles.find((profile) => profile.name === 'corpus rules');
  const unicodePac = applied.profiles.find((profile) => profile.name === 'PAC 中文');
  assert.equal(innerSwitch?.kind, 'switch', 'Corpus C inner Switch was not imported');
  assert.equal(virtualRoute?.kind, 'virtual', 'Corpus C Virtual profile was not imported');
  assert.equal(corpusRules?.kind, 'rule-list', 'Corpus C Rule List was not imported');
  assert.equal(unicodePac?.kind, 'pac', 'Corpus D Unicode PAC was not imported');
  assert.deepEqual(applied.settings.startup.route, { kind: 'profile', profileId: autoSwitch.id });
  assert.equal(applied.settings.quickSwitch.enabled, true);
  assert.deepEqual(applied.settings.quickSwitch.routes, [
    { kind: 'profile', profileId: autoSwitch.id },
    { kind: 'profile', profileId: unicodePac.id },
  ]);

  return { autoSwitchId: autoSwitch.id, pacId: unicodePac.id, applied };
}

async function enableAndActivateSwitch(driver, profileId) {
  const current = assertWorkflowSuccess(
    await sendWorkflowCommand(driver, { action: 'get' }),
    'Unable to read imported workflow',
  );
  const originalApplied = structuredClone(current.state.applied);
  let applied = current;
  if (!complexCorpus) {
    const draft = structuredClone(current.state.applied);
    draft.settings.quickSwitch = {
      ...draft.settings.quickSwitch,
      enabled: true,
      routes: [{ kind: 'profile', profileId }],
    };
    const replaced = assertWorkflowSuccess(
      await sendWorkflowCommand(driver, {
        action: 'replace-draft',
        expectedGeneration: current.state.generation,
        draft,
      }),
      'Unable to stage imported Switch profile',
    );
    applied = assertWorkflowSuccess(
      await sendWorkflowCommand(driver, {
        action: 'apply',
        expectedGeneration: replaced.state.generation,
      }),
      'Unable to apply imported Switch profile',
    );
  }
  assertWorkflowSuccess(
    await sendWorkflowCommand(driver, {
      action: 'activate-route',
      expectedAppliedRevisionId: applied.state.applied.revision.id,
      route: { kind: 'profile', profileId },
    }),
    'Unable to activate imported Switch profile',
  );

  return originalApplied;
}

async function restoreOriginalApplied(driver, originalApplied) {
  const current = assertWorkflowSuccess(
    await sendWorkflowCommand(driver, { action: 'get' }),
    'Unable to read temporary route-test workflow',
  );
  const replaced = assertWorkflowSuccess(
    await sendWorkflowCommand(driver, {
      action: 'replace-draft',
      expectedGeneration: current.state.generation,
      draft: originalApplied,
    }),
    'Unable to restore original imported settings',
  );
  return assertWorkflowSuccess(
    await sendWorkflowCommand(driver, {
      action: 'apply',
      expectedGeneration: replaced.state.generation,
    }),
    'Unable to apply restored original settings',
  );
}

async function readBodyText(driver) {
  const body = await driver.wait(until.elementLocated(By.css('body')), 20_000);
  return body.getText();
}

async function navigateAndRead(driver, optionsWindow, url) {
  await driver.switchTo().newWindow('tab');
  try {
    await driver.get(url);
    return await readBodyText(driver);
  } finally {
    await driver.close();
    await driver.switchTo().window(optionsWindow);
  }
}

async function assertRouteDecisions(driver, optionsWindow, label) {
  const directBefore = targetRequestCount;
  const proxyBefore = proxyRequests.length;

  const directHost = complexCorpus ? 'direct.corpus.test' : 'internal.example.com';
  const directUrl = `http://${directHost}:${targetAddress.port}/${label}-direct`;
  assert.equal(await navigateAndRead(driver, optionsWindow, directUrl), targetMarker);
  assert.equal(targetRequestCount > directBefore, true);
  assert.equal(proxyRequests.length, proxyBefore);

  const directAfter = targetRequestCount;
  const proxyHost = complexCorpus ? 'nested.corpus.example.com' : 'routed.example.com';
  const proxyUrl = `http://${proxyHost}:${targetAddress.port}/${label}-proxy`;
  assert.equal(await navigateAndRead(driver, optionsWindow, proxyUrl), proxyMarker);
  assert.equal(targetRequestCount, directAfter);
  assert.equal(proxyRequests.length > proxyBefore, true);
  assert.equal(
    proxyRequests.slice(proxyBefore).some((request) => request.includes(proxyHost)),
    true,
  );

  if (complexCorpus) {
    const ruleListUrl = `http://rulelist.corpus.example.com:${targetAddress.port}/${label}-rules`;
    assert.equal(await navigateAndRead(driver, optionsWindow, ruleListUrl), proxyMarker);
    assert.equal(
      proxyRequests.some((request) => request.includes('rulelist.corpus.example.com')),
      true,
    );
  }
}

async function assertPacRouteDecisions(driver, optionsWindow, label) {
  const directBefore = targetRequestCount;
  const proxyBefore = proxyRequests.length;
  const directUrl = `http://direct.corpus.test:${targetAddress.port}/${label}-direct`;
  assert.equal(await navigateAndRead(driver, optionsWindow, directUrl), targetMarker);
  assert.equal(targetRequestCount > directBefore, true);
  assert.equal(proxyRequests.length, proxyBefore);

  const proxyUrl = `http://pac.corpus.example.com:${targetAddress.port}/${label}-proxy`;
  assert.equal(await navigateAndRead(driver, optionsWindow, proxyUrl), proxyMarker);
  assert.equal(proxyRequests.length > proxyBefore, true);
  assert.equal(
    proxyRequests.slice(proxyBefore).some((request) => request.includes('pac.corpus.example.com')),
    true,
  );
}

function requiredOriginalSemantics(options) {
  if (complexCorpus) {
    const corpusRules = structuredClone(options['+corpus rules']);
    if (corpusRules && typeof corpusRules === 'object') delete corpusRules.pacScript;
    return {
      schemaVersion: options.schemaVersion,
      startupProfileName: options['-startupProfileName'],
      enableQuickSwitch: options['-enableQuickSwitch'],
      quickSwitchProfiles: options['-quickSwitchProfiles'],
      corpusProxy: options['+corpus proxy'],
      innerSwitch: options['+inner switch'],
      virtualRoute: options['+virtual route'],
      corpusRules,
      outerSwitch: options['+outer switch'],
      unicodePac: options['+PAC 中文'],
    };
  }
  return {
    schemaVersion: options.schemaVersion,
    startupProfileName: options['-startupProfileName'],
    enableQuickSwitch: options['-enableQuickSwitch'],
    quickSwitchProfiles: options['-quickSwitchProfiles'],
    proxy: {
      profileType: options['+proxy']?.profileType,
      name: options['+proxy']?.name,
      color: options['+proxy']?.color,
      fallbackProxy: options['+proxy']?.fallbackProxy,
      bypassList: options['+proxy']?.bypassList,
    },
    autoSwitch: {
      profileType: options['+auto switch']?.profileType,
      name: options['+auto switch']?.name,
      color: options['+auto switch']?.color,
      defaultProfileName: options['+auto switch']?.defaultProfileName,
      rules: options['+auto switch']?.rules,
    },
  };
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
  assert.fail(`Firefox original migration export did not appear in ${downloadDir}`);
}

async function exportOriginalSemantics(driver, originalOptions) {
  const importExportButton = await driver.findElement(
    By.xpath("//button[.//*[@data-options-nav-icon='import']]"),
  );
  await importExportButton.click();
  const previousFiles = new Set(await readdir(downloadDir));
  await driver.findElement(By.css('[data-legacy-export]')).click();
  const exportedPath = await waitForDownloadedExport(previousFiles);
  const exportedContent = await readFile(exportedPath, 'utf8');
  const exportedOptions = JSON.parse(exportedContent);
  assert.deepEqual(
    requiredOriginalSemantics(exportedOptions),
    requiredOriginalSemantics(originalOptions),
  );
  assert.doesNotMatch(
    exportedContent,
    /passwordSecretRef|secretRef|not-a-real-secret/u,
    'Firefox original migration export leaked secret references',
  );
  assertNoSecretMarkers(exportedContent, 'Firefox original semantic export');
  return {
    exportedPath,
    bytes: Buffer.byteLength(exportedContent, 'utf8'),
    sha256: sha256Text(exportedContent),
    semanticSha256: semanticSha256(requiredOriginalSemantics(exportedOptions)),
  };
}

async function workflowStorageSnapshot(driver) {
  return driver.executeAsyncScript(
    `
      const done = arguments[0];
      browser.storage.local.get(null).then((all) => {
        done(Object.fromEntries(Object.entries(all).filter(([key]) => key.startsWith('zeroomega-nex/profile-workflow/v1'))));
      }, (error) => done({ error: String(error) }));
    `,
  );
}

async function reimportForReview(driver, path) {
  const importExportButton = await driver.findElement(
    By.xpath("//button[.//*[@data-options-nav-icon='import']]"),
  );
  await importExportButton.click();
  const fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 60_000);
  await fileInput.sendKeys(path);
  const review = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review]')),
    60_000,
  );
  await driver.wait(until.elementIsVisible(review), 60_000);
  assertNoSecretMarkers(await review.getText(), 'Firefox semantic re-import review');
  const importButton = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-and-use]')),
    60_000,
  );
  assert.equal(await importButton.isEnabled(), true, 'Firefox semantic re-import was not accepted');
}

async function importOriginalBackup(driver) {
  const importExportButton = await driver.findElement(
    By.xpath("//button[.//*[@data-options-nav-icon='import']]"),
  );
  await importExportButton.click();
  const fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 20_000);
  await fileInput.sendKeys(originalBackupPath);
  const compatibilityHeading = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(compatibilityHeading), 20_000);
  const importButton = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-and-use]')),
    20_000,
  );
  await importButton.click();
  const success = await driver.wait(
    until.elementLocated(
      By.xpath("//*[@data-legacy-import-review]/following-sibling::section[1]//p[@role='status']"),
    ),
    20_000,
  );
  await driver.wait(until.elementIsVisible(success), 20_000);
}

let driver;
try {
  const originalContent = await readFile(originalBackupPath, 'utf8');
  const originalOptions = JSON.parse(originalContent);

  driver = await launch();
  await installExtension(driver);
  let optionsWindow = await navigateOptions(driver);
  await importOriginalBackup(driver);

  const imported = await assertImportedState(driver);
  assert.equal(imported.applied.settings.quickSwitch.enabled, complexCorpus);
  if (!complexCorpus) assert.deepEqual(imported.applied.settings.quickSwitch.routes, []);

  const originalApplied = await enableAndActivateSwitch(driver, imported.autoSwitchId);
  await waitForActiveSwitch(
    driver,
    imported.autoSwitchId,
    'Original auto switch did not become the confirmed Firefox PAC route',
  );
  await assertRouteDecisions(driver, optionsWindow, 'before-restart');

  await driver.quit();
  driver = undefined;

  driver = await launch();
  await installExtension(driver);
  optionsWindow = await navigateOptions(driver);
  const restored = await assertImportedState(driver);
  assert.equal(restored.autoSwitchId, imported.autoSwitchId);
  await waitForActiveSwitch(
    driver,
    imported.autoSwitchId,
    'Original auto switch did not recover after Firefox restart',
  );
  await assertRouteDecisions(driver, optionsWindow, 'after-restart');

  const originalState = complexCorpus
    ? assertWorkflowSuccess(
        await sendWorkflowCommand(driver, { action: 'get' }),
        'Unable to read restored complex import',
      )
    : await restoreOriginalApplied(driver, originalApplied);
  assert.equal(originalState.state.applied.settings.quickSwitch.enabled, complexCorpus);
  if (!complexCorpus) {
    assert.deepEqual(originalState.state.applied.settings.quickSwitch.routes, []);
  } else {
    assert.ok(imported.pacId, 'Corpus D PAC route was not available after import');
    assertWorkflowSuccess(
      await sendWorkflowCommand(driver, {
        action: 'activate-route',
        expectedAppliedRevisionId: originalState.state.applied.revision.id,
        route: { kind: 'profile', profileId: imported.pacId },
      }),
      'Unable to activate imported Corpus D PAC profile',
    );
    await waitForActiveSwitch(driver, imported.pacId, 'Corpus D PAC did not become active');
    await assertPacRouteDecisions(driver, optionsWindow, 'pac');
  }
  const exported = await exportOriginalSemantics(driver, originalOptions);
  const beforeReimport = await workflowStorageSnapshot(driver);
  await reimportForReview(driver, exported.exportedPath);
  const afterReimport = await workflowStorageSnapshot(driver);
  assert.deepEqual(
    afterReimport,
    beforeReimport,
    'Firefox semantic re-import review mutated workflow persistence',
  );
  await appendMig01Evidence({
    kind: 'semantic',
    browser: 'firefox',
    corpus: complexCorpus ? 'C/D' : 'A',
    bytes: exported.bytes,
    sha256: exported.sha256,
    semanticSha256: exported.semanticSha256,
    reimportAccepted: true,
    persistentMutation: false,
    secretScanClean: true,
  });

  console.log(
    `Firefox original ${complexCorpus ? 'Corpus C/D' : 'Corpus A'} import, route, restart, and semantic export passed.`,
  );
} finally {
  if (driver) await driver.quit();
  await Promise.all([closeServer(targetServer), closeServer(proxyServer)]);
  await Promise.all([
    rm(profileDir, { recursive: true, force: true }),
    rm(downloadDir, { recursive: true, force: true }),
  ]);
}
