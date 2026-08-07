import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { Browser, Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

import { firefoxService } from './firefox-service.mjs';

const extensionPath = resolve('dist/firefox-mv3');
const originalBackupPath = resolve(
  'fixtures/zeroomega-v2/original-large-representative-v3.5.0.bak',
);
const provenancePath = resolve(
  'fixtures/zeroomega-v2/original-large-representative-v3.5.0.provenance.json',
);
const invalidBackupPath = resolve('fixtures/zeroomega-v2/invalid/missing-reference.json');
const profileDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-firefox-large-migration-'));
const downloadDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-firefox-large-export-'));
const reimportPath = resolve(downloadDir, 'zeroomega-large-semantic-reimport.bak');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000029';
const workflowChannel = 'zeroomega-nex/profile-workflow/v1';
const workflowStorageNamespace = 'zeroomega-nex/profile-workflow/v1';
const proxyStateKey = 'zeroomega-nex/browser-proxy/v1/state';
const targetMarker = 'Original large backup direct route';
const proxyMarker = 'Original large backup proxy route';
const directHost = 'direct-large.example.test';
const proxyRouteHost = 'host-00-024.example.invalid';
const proxyEndpointHost = 'proxy-00.example.invalid';
const proxyEndpointPort = 10_000;
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
  throw new Error('Firefox original large migration target server failed');
}

const proxyServer = createServer((request, response) => {
  proxyRequests.push(String(request.url ?? ''));
  response.writeHead(200, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(proxyMarker);
});
await listen(proxyServer, proxyEndpointPort);

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
      `${proxyEndpointHost},${proxyRouteHost},${directHost}`,
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

function routeName(route, applied) {
  if (!route) return undefined;
  if (route.kind !== 'profile') return route.kind;
  return (
    applied.profiles.find((profile) => profile.id === route.profileId)?.name ?? route.profileId
  );
}

function storageMetrics(storage) {
  const entries = Object.entries(storage).filter(([key]) =>
    key.startsWith(workflowStorageNamespace),
  );
  const workflowStorage = Object.fromEntries(entries);
  const state = storage[`${workflowStorageNamespace}/state`];
  const revisionIndex = storage[`${workflowStorageNamespace}/revision-index`];
  return {
    bytes: Buffer.byteLength(JSON.stringify(workflowStorage), 'utf8'),
    stateBytes: state === undefined ? 0 : Buffer.byteLength(JSON.stringify(state), 'utf8'),
    keyCount: entries.length,
    revisionCount: Array.isArray(revisionIndex) ? revisionIndex.length : 0,
    generation: state?.generation,
    appliedRevisionId: state?.applied?.revision?.id,
  };
}

async function assertLargeState(driver, label) {
  const view = await workflowView(driver);
  assert.ok(Array.isArray(view), `${label}: ${JSON.stringify(view)}`);
  const [workflow, , storage] = view;
  assert.equal(workflow?.ok, true, `${label}: ${JSON.stringify(workflow)}`);
  const applied = workflow.state.applied;
  const fixedProfiles = applied.profiles.filter((profile) => profile.kind === 'fixed');
  const switchProfiles = applied.profiles.filter((profile) => profile.kind === 'switch');
  const ruleListProfiles = applied.profiles.filter((profile) => profile.kind === 'rule-list');
  assert.equal(applied.profiles.length, 36, `${label}: profile count changed`);
  assert.equal(fixedProfiles.length, 24, `${label}: fixed-profile count changed`);
  assert.equal(switchProfiles.length, 8, `${label}: switch-profile count changed`);
  assert.equal(ruleListProfiles.length, 4, `${label}: rule-list profile count changed`);
  assert.equal(
    switchProfiles.reduce((sum, profile) => sum + profile.rules.length, 0),
    1024,
    `${label}: Switch rule count changed`,
  );
  assert.equal(applied.ruleSources.length, 4, `${label}: Rule Source count changed`);

  const fixed = applied.profiles.find((profile) => profile.name === 'proxy-00');
  const autoSwitch = applied.profiles.find((profile) => profile.name === 'switch-00');
  const rules = applied.profiles.find((profile) => profile.name === 'rules-00');
  assert.equal(fixed?.kind, 'fixed', `${label}: proxy-00 missing`);
  assert.equal(autoSwitch?.kind, 'switch', `${label}: switch-00 missing`);
  assert.equal(rules?.kind, 'rule-list', `${label}: rules-00 missing`);
  assert.equal(autoSwitch.rules.length, 128, `${label}: switch-00 rule count changed`);
  const fallback = applied.proxyEndpoints.find(
    (endpoint) => endpoint.id === fixed.proxyByScheme.fallback,
  );
  assert.ok(fallback, `${label}: proxy-00 fallback endpoint missing`);
  assert.equal(fallback.protocol, 'http');
  assert.equal(fallback.host, proxyEndpointHost);
  assert.equal(fallback.port, proxyEndpointPort);
  assert.equal(routeName(applied.settings.startup.route, applied), 'switch-00');
  assert.equal(applied.settings.quickSwitch.enabled, true);
  assert.deepEqual(
    applied.settings.quickSwitch.routes.map((route) => routeName(route, applied)),
    ['switch-00', 'switch-01', 'rules-00', 'rules-01', 'proxy-00', 'proxy-01', 'direct'],
  );
  assert.equal(workflow.state.draft.revision.id, applied.revision.id);

  return {
    workflow,
    applied,
    switchId: autoSwitch.id,
    metrics: storageMetrics(storage),
  };
}

async function activateSwitch(driver, profileId, label) {
  const current = assertWorkflowSuccess(
    await sendWorkflowCommand(driver, { action: 'get' }),
    `${label}: unable to read workflow`,
  );
  return assertWorkflowSuccess(
    await sendWorkflowCommand(driver, {
      action: 'activate-route',
      expectedAppliedRevisionId: current.state.applied.revision.id,
      route: { kind: 'profile', profileId },
    }),
    `${label}: unable to activate switch-00`,
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
      return;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(`${label}: ${JSON.stringify(last)}`);
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
  assert.equal(
    await navigateAndRead(
      driver,
      optionsWindow,
      `http://${directHost}:${targetAddress.port}/${label}-direct`,
    ),
    targetMarker,
  );
  assert.equal(targetRequestCount > directBefore, true);
  assert.equal(proxyRequests.length, proxyBefore);

  const directAfter = targetRequestCount;
  assert.equal(
    await navigateAndRead(
      driver,
      optionsWindow,
      `http://${proxyRouteHost}:${targetAddress.port}/${label}-proxy`,
    ),
    proxyMarker,
  );
  assert.equal(targetRequestCount, directAfter);
  assert.equal(proxyRequests.length > proxyBefore, true);
  assert.equal(
    proxyRequests.slice(proxyBefore).some((request) => request.includes(proxyRouteHost)),
    true,
  );
}

function requiredLargeSemantics(options) {
  const profiles = Object.fromEntries(
    Object.entries(options)
      .filter(([key]) => key.startsWith('+'))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => {
        const profile = structuredClone(value);
        if (profile && typeof profile === 'object') delete profile.pacScript;
        return [key, profile];
      }),
  );
  return {
    schemaVersion: options.schemaVersion,
    startupProfileName: options['-startupProfileName'],
    enableQuickSwitch: options['-enableQuickSwitch'],
    quickSwitchProfiles: options['-quickSwitchProfiles'],
    downloadInterval: options['-downloadInterval'],
    profiles,
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
  assert.fail(`Firefox original large migration export did not appear in ${downloadDir}`);
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
    requiredLargeSemantics(exportedOptions),
    requiredLargeSemantics(originalOptions),
  );
  assert.doesNotMatch(
    exportedContent,
    /passwordSecretRef|secretRef|not-a-real-secret/u,
    'Firefox original large migration export leaked secret references',
  );
  await writeFile(reimportPath, exportedContent);
  return {
    bytes: Buffer.byteLength(exportedContent, 'utf8'),
    sha256: createHash('sha256').update(exportedContent).digest('hex'),
  };
}

async function reimportForReview(driver, path) {
  const importExportButton = await driver.findElement(
    By.xpath("//button[.//*[@data-options-nav-icon='import']]"),
  );
  await importExportButton.click();
  const fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 60_000);
  await fileInput.sendKeys(path);
  const compatibilityHeading = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review]')),
    60_000,
  );
  await driver.wait(until.elementIsVisible(compatibilityHeading), 60_000);
  const importButton = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-and-use]')),
    60_000,
  );
  assert.equal(
    await importButton.isEnabled(),
    true,
    'Firefox semantic re-import was not accepted for use',
  );
}

async function importAndUse(driver, path, previousGeneration) {
  const before = assertWorkflowSuccess(
    await sendWorkflowCommand(driver, { action: 'get' }),
    'Unable to read workflow before Firefox original large import',
  );
  const baselineGeneration = previousGeneration ?? before.state.generation;
  const importExportButton = await driver.findElement(
    By.xpath("//button[.//*[@data-options-nav-icon='import']]"),
  );
  await importExportButton.click();
  const fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 60_000);
  await fileInput.sendKeys(path);
  const compatibilityHeading = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review]')),
    60_000,
  );
  await driver.wait(until.elementIsVisible(compatibilityHeading), 60_000);
  const importButton = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-and-use]')),
    60_000,
  );
  await importButton.click();
  await driver.wait(async () => {
    const response = await sendWorkflowCommand(driver, { action: 'get' });
    return (
      response?.ok === true &&
      response.state.generation > baselineGeneration &&
      response.state.applied.profiles.length === 36
    );
  }, 60_000);
}

async function workflowStorageSnapshot(driver) {
  return driver.executeAsyncScript(
    `
      const namespace = arguments[0];
      const done = arguments[1];
      browser.storage.local.get(null).then((all) => {
        done(Object.fromEntries(Object.entries(all).filter(([key]) => key.startsWith(namespace))));
      }, (error) => done({ error: String(error) }));
    `,
    workflowStorageNamespace,
  );
}

async function analyzeRejectedBackupWithoutMutation(driver, path) {
  const before = await workflowStorageSnapshot(driver);
  const importExportButton = await driver.findElement(
    By.xpath("//button[.//*[@data-options-nav-icon='import']]"),
  );
  await importExportButton.click();
  const fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 20_000);
  await fileInput.sendKeys(path);
  const review = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(review), 20_000);
  const alert = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review] [role="alert"]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(alert), 20_000);
  assert.equal(
    (await driver.findElements(By.css('[data-legacy-import-review] [data-legacy-import-and-use]')))
      .length,
    0,
    'Rejected legacy backup unexpectedly exposed Import & Use in Firefox',
  );
  const rejectedText = await driver
    .findElement(By.css('[data-legacy-import-review] [data-legacy-status="rejected"] strong'))
    .getText();
  const rejectedCount = Number(rejectedText);
  assert.equal(rejectedCount > 0, true, 'Firefox rejected import did not report a blocking item');
  const after = await workflowStorageSnapshot(driver);
  assert.deepEqual(after, before, 'Firefox rejected legacy analysis mutated workflow persistence');
  return { rejectedCount };
}

async function injectInterruptedApply(driver) {
  return driver.executeAsyncScript(
    `
      const namespace = arguments[0];
      const done = arguments[1];
      (async () => {
        const stateKey = namespace + '/state';
        const values = await browser.storage.local.get(stateKey);
        const state = values[stateKey];
        if (!state) throw new Error('workflow state is unavailable for interrupted Apply injection');
        const draft = structuredClone(state.draft);
        if (!draft.profiles?.[0]) throw new Error('workflow Draft has no profile to edit');
        draft.profiles[0].name = draft.profiles[0].name + ' [interrupted draft]';
        const candidate = structuredClone(draft);
        candidate.revision = {
          id: 'revision-e2e-interrupted-apply',
          parentId: state.applied.revision.id,
          createdAt: '2026-08-07T08:30:00.000Z',
          deviceId: 'device-e2e-interrupted-apply',
        };
        const interrupted = {
          ...state,
          generation: state.generation + 1,
          draft,
          pendingApply: {
            applyId: 'apply-e2e-interrupted-commit',
            candidate,
            previousAppliedRevisionId: state.applied.revision.id,
            startedAt: '2026-08-07T08:30:00.000Z',
            phase: 'committing',
          },
        };
        await browser.storage.local.set({ [stateKey]: interrupted });
        await browser.proxy.settings.set({ value: { proxyType: 'none' } });
        const platform = await browser.proxy.settings.get({});
        return {
          appliedRevisionId: state.applied.revision.id,
          injectedGeneration: interrupted.generation,
          draftName: draft.profiles[0].name,
          platformMode: platform.value?.proxyType,
        };
      })().then(done, (error) => done({ error: String(error) }));
    `,
    workflowStorageNamespace,
  );
}

async function assertInterruptedApplyRecovered(driver, injected) {
  const current = assertWorkflowSuccess(
    await sendWorkflowCommand(driver, { action: 'get' }),
    'Firefox interrupted Apply recovery did not expose a usable workflow',
  );
  assert.equal(current.state.applied.revision.id, injected.appliedRevisionId);
  assert.equal(current.state.pendingApply, undefined);
  assert.equal(current.view.busy, false);
  assert.equal(current.view.dirty, true);
  assert.equal(current.state.draft.profiles[0]?.name, injected.draftName);
  assert.equal(current.state.lastApply?.status, 'failed');
  assert.equal(current.state.lastApply?.stage, 'recovery');
  assert.equal(current.state.lastApply?.rollbackSucceeded, true);
  assert.equal(current.state.generation > injected.injectedGeneration, true);
  return current;
}

let driver;
try {
  const [originalContent, provenanceContent] = await Promise.all([
    readFile(originalBackupPath, 'utf8'),
    readFile(provenancePath, 'utf8'),
  ]);
  const originalOptions = JSON.parse(originalContent);
  const provenance = JSON.parse(provenanceContent);
  const sourceBytes = Buffer.byteLength(originalContent, 'utf8');
  const sourceSha256 = createHash('sha256').update(originalContent).digest('hex');
  assert.equal(sourceBytes, provenance.stableBackup.bytes);
  assert.equal(sourceSha256, provenance.stableBackup.sha256);
  assert.equal(provenance.dimensions.profiles, 36);
  assert.equal(provenance.dimensions.switchRules, 1024);
  assert.equal(provenance.dimensions.ruleListEntries, 1024);

  driver = await launch();
  await installExtension(driver);
  let optionsWindow = await navigateOptions(driver);
  await importAndUse(driver, originalBackupPath);
  const imported = await assertLargeState(driver, 'after first Import & Use');
  await activateSwitch(driver, imported.switchId, 'after first Import & Use');
  await waitForActiveSwitch(
    driver,
    imported.switchId,
    'Original large switch did not become the confirmed Firefox PAC route',
  );
  await assertRouteDecisions(driver, optionsWindow, 'before-restart');

  await driver.quit();
  driver = undefined;

  driver = await launch();
  await installExtension(driver);
  optionsWindow = await navigateOptions(driver);
  const restored = await assertLargeState(driver, 'after Firefox restart');
  assert.equal(restored.switchId, imported.switchId);
  assert.equal(restored.metrics.bytes, imported.metrics.bytes);
  assert.equal(restored.metrics.revisionCount, imported.metrics.revisionCount);
  assert.equal(restored.metrics.appliedRevisionId, imported.metrics.appliedRevisionId);
  await waitForActiveSwitch(
    driver,
    imported.switchId,
    'Original large switch did not recover after Firefox restart',
  );
  await assertRouteDecisions(driver, optionsWindow, 'after-restart');

  const exported = await exportOriginalSemantics(driver, originalOptions);
  const beforeReimport = await assertLargeState(
    driver,
    'after semantic export / before re-import analysis',
  );
  await reimportForReview(driver, reimportPath);
  const reimported = await assertLargeState(driver, 'after semantic re-import analysis');
  assert.equal(reimported.switchId, beforeReimport.switchId);
  assert.deepEqual(reimported.metrics, beforeReimport.metrics);
  await waitForActiveSwitch(
    driver,
    beforeReimport.switchId,
    'Semantic re-import analysis changed the confirmed Firefox PAC route',
  );
  await assertRouteDecisions(driver, optionsWindow, 'after-reimport-analysis');

  const rejectedImport = await analyzeRejectedBackupWithoutMutation(driver, invalidBackupPath);
  await waitForActiveSwitch(
    driver,
    beforeReimport.switchId,
    'Rejected legacy analysis changed the confirmed Firefox PAC route',
  );
  await assertRouteDecisions(driver, optionsWindow, 'after-rejected-import-analysis');

  const interrupted = await injectInterruptedApply(driver);
  assert.equal(interrupted.platformMode, 'none');
  await driver.quit();
  driver = undefined;

  driver = await launch();
  await installExtension(driver);
  optionsWindow = await navigateOptions(driver);
  const recoveredInterruptedApply = await assertInterruptedApplyRecovered(driver, interrupted);
  await waitForActiveSwitch(
    driver,
    beforeReimport.switchId,
    'Interrupted Apply restart recovery did not restore the previous Firefox PAC route',
  );
  await assertRouteDecisions(driver, optionsWindow, 'after-interrupted-apply-recovery');

  console.log(
    JSON.stringify(
      {
        browser: 'firefox',
        source: { bytes: sourceBytes, sha256: sourceSha256 },
        dimensions: provenance.dimensions,
        storage: {
          afterImport: imported.metrics,
          afterRestart: restored.metrics,
          afterExportBeforeReimport: beforeReimport.metrics,
          afterReimportAnalysis: reimported.metrics,
        },
        semanticExport: exported,
        failurePreservation: {
          rejectedImport,
          interruptedApply: {
            injected: interrupted,
            recoveredGeneration: recoveredInterruptedApply.state.generation,
            lastApply: recoveredInterruptedApply.state.lastApply,
          },
        },
      },
      null,
      2,
    ),
  );
  console.log(
    'Firefox original large migration plus rejected-import and interrupted-Apply preservation passed.',
  );
} finally {
  if (driver) {
    try {
      await driver.quit();
    } catch (error) {
      if (error?.name !== 'NoSuchSessionError') throw error;
    }
  }
  await Promise.all([closeServer(targetServer), closeServer(proxyServer)]);
  await Promise.all([
    rm(profileDir, { recursive: true, force: true }),
    rm(downloadDir, { recursive: true, force: true }),
  ]);
}
