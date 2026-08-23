import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const originalBackupPath = resolve(
  'fixtures/zeroomega-v2/original-large-representative-v3.5.0.bak',
);
const provenancePath = resolve(
  'fixtures/zeroomega-v2/original-large-representative-v3.5.0.provenance.json',
);
const invalidBackupPath = resolve('fixtures/zeroomega-v2/invalid/missing-reference.json');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-original-large-migration-'));
const reimportPath = resolve(userDataDir, 'zeroomega-large-semantic-reimport.bak');
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
  throw new Error('Original large migration target server failed');
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

async function launch() {
  return chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      `--host-resolver-rules=MAP ${proxyEndpointHost} 127.0.0.1, MAP ${proxyRouteHost} 127.0.0.1, MAP ${directHost} 127.0.0.1`,
    ],
  });
}

async function extensionSurface(context) {
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  assert.match(extensionId, /^[a-p]{32}$/u, 'Chromium extension ID was not resolved');

  const options = await context.newPage();
  options.on('console', (message) => {
    console.log(`[Original large migration console:${message.type()}] ${message.text()}`);
  });
  options.on('pageerror', (error) => {
    console.error(`[Original large migration pageerror] ${error.stack ?? error.message}`);
  });
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.waitForLoadState('domcontentloaded');
  await options
    .getByRole('button', { name: '导入 / 导出', exact: true })
    .waitFor({ timeout: 20_000 });
  return { options };
}

async function sendWorkflowCommand(options, command) {
  return options.evaluate(
    async ({ channel, input }) => chrome.runtime.sendMessage({ channel, ...input }),
    { channel: workflowChannel, input: command },
  );
}

function assertWorkflowSuccess(response, label) {
  assert.equal(response?.ok, true, `${label}: ${JSON.stringify(response)}`);
  return response;
}

async function workflowView(options) {
  return options.evaluate(
    async (channel) =>
      Promise.all([
        chrome.runtime.sendMessage({ channel, action: 'get' }),
        chrome.proxy.settings.get({ incognito: false }),
        chrome.storage.local.get(null),
      ]),
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

async function assertLargeState(options, label) {
  const [workflow, , storage] = await workflowView(options);
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

async function activateSwitch(options, profileId, label) {
  const current = assertWorkflowSuccess(
    await sendWorkflowCommand(options, { action: 'get' }),
    `${label}: unable to read workflow`,
  );
  return assertWorkflowSuccess(
    await sendWorkflowCommand(options, {
      action: 'activate-route',
      expectedAppliedRevisionId: current.state.applied.revision.id,
      route: { kind: 'profile', profileId },
    }),
    `${label}: unable to activate switch-00`,
  );
}

async function waitForActiveSwitch(options, profileId, label) {
  const deadline = Date.now() + 20_000;
  let last;
  while (Date.now() < deadline) {
    last = await workflowView(options);
    const [workflow, proxySetting, storage] = last;
    const proxyState = storage[proxyStateKey];
    const snapshot = proxyState?.activeSnapshotId
      ? storage[`zeroomega-nex/browser-proxy/v1/snapshot/${proxyState.activeSnapshotId}`]
      : undefined;
    const pacData = proxySetting?.value?.pacScript?.data;
    if (
      workflow?.ok === true &&
      workflow.runtime?.activeRoute?.kind === 'profile' &&
      workflow.runtime.activeRoute.profileId === profileId &&
      proxySetting?.levelOfControl === 'controlled_by_this_extension' &&
      proxySetting?.value?.mode === 'pac_script' &&
      typeof pacData === 'string' &&
      pacData.length > 0 &&
      snapshot?.startRoute?.kind === 'profile' &&
      snapshot.startRoute.profileId === profileId
    ) {
      return;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(`${label}: ${JSON.stringify(last)}`);
}

async function assertRouteDecisions(context, label) {
  const directBefore = targetRequestCount;
  const proxyBefore = proxyRequests.length;

  const directPage = await context.newPage();
  await directPage.goto(`http://${directHost}:${targetAddress.port}/${label}-direct`, {
    waitUntil: 'domcontentloaded',
  });
  assert.equal(await directPage.locator('body').innerText(), targetMarker);
  assert.equal(targetRequestCount > directBefore, true);
  assert.equal(proxyRequests.length, proxyBefore);
  await directPage.close();

  const directAfter = targetRequestCount;
  const proxyPage = await context.newPage();
  await proxyPage.goto(`http://${proxyRouteHost}:${targetAddress.port}/${label}-proxy`, {
    waitUntil: 'domcontentloaded',
  });
  assert.equal(await proxyPage.locator('body').innerText(), proxyMarker);
  assert.equal(targetRequestCount, directAfter);
  assert.equal(proxyRequests.length > proxyBefore, true);
  assert.equal(
    proxyRequests.slice(proxyBefore).some((request) => request.includes(proxyRouteHost)),
    true,
  );
  await proxyPage.close();
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

async function importAndUse(options, path, previousGeneration) {
  const before = assertWorkflowSuccess(
    await sendWorkflowCommand(options, { action: 'get' }),
    'Unable to read workflow before original large import',
  );
  const baselineGeneration = previousGeneration ?? before.state.generation;
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await options.getByLabel('原版备份文件').setInputFiles(path);
  await options
    .getByRole('heading', { name: '兼容性检查', exact: true })
    .waitFor({ timeout: 60_000 });
  await options.getByRole('button', { name: '导入并立即使用', exact: true }).click();
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const response = await sendWorkflowCommand(options, { action: 'get' });
    if (
      response?.ok === true &&
      response.state.generation > baselineGeneration &&
      response.state.applied.profiles.length === 36
    ) {
      return;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail('Original large Import & Use did not commit the 36-profile persistent workflow');
}

async function reimportForReview(options, path) {
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await options.getByLabel('原版备份文件').setInputFiles(path);
  await options
    .getByRole('heading', { name: '兼容性检查', exact: true })
    .waitFor({ timeout: 60_000 });
  const importButton = options.getByRole('button', { name: '导入并立即使用', exact: true });
  assert.equal(await importButton.isEnabled(), true, 'Semantic re-import was not accepted for use');
}

async function exportOriginalSemantics(options, originalOptions) {
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  const downloadPromise = options.waitForEvent('download');
  await options.locator('[data-legacy-export]').click();
  const download = await downloadPromise;
  const exportedPath = await download.path();
  assert.ok(exportedPath, 'Original large migration export did not produce a local file');
  const exportedContent = await readFile(exportedPath, 'utf8');
  const exportedOptions = JSON.parse(exportedContent);
  assert.deepEqual(
    requiredLargeSemantics(exportedOptions),
    requiredLargeSemantics(originalOptions),
  );
  assert.doesNotMatch(
    exportedContent,
    /passwordSecretRef|secretRef|not-a-real-secret/u,
    'Original large migration export leaked secret references',
  );
  await writeFile(reimportPath, exportedContent);
  return {
    bytes: Buffer.byteLength(exportedContent, 'utf8'),
    sha256: createHash('sha256').update(exportedContent).digest('hex'),
  };
}

async function workflowStorageSnapshot(options) {
  return options.evaluate(async (namespace) => {
    const all = await chrome.storage.local.get(null);
    return Object.fromEntries(Object.entries(all).filter(([key]) => key.startsWith(namespace)));
  }, workflowStorageNamespace);
}

async function analyzeRejectedBackupWithoutMutation(options, path) {
  const before = await workflowStorageSnapshot(options);
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await options.getByLabel('原版备份文件').setInputFiles(path);
  const review = options.locator('[data-legacy-import-review]');
  await review.waitFor({ state: 'visible', timeout: 20_000 });
  await review.getByRole('alert').waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(
    await review.locator('[data-legacy-import-and-use]').count(),
    0,
    'Rejected legacy backup unexpectedly exposed Import & Use',
  );
  const rejectedCount = Number(
    await review.locator('[data-legacy-status="rejected"] strong').innerText(),
  );
  assert.equal(rejectedCount > 0, true, 'Rejected legacy backup did not report a blocking item');
  const after = await workflowStorageSnapshot(options);
  assert.deepEqual(after, before, 'Rejected legacy analysis mutated workflow persistence');
  return { rejectedCount };
}

async function injectInterruptedApply(options) {
  return options.evaluate(
    async ({ namespace }) => {
      const stateKey = namespace + '/state';
      const values = await chrome.storage.local.get(stateKey);
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
      await chrome.storage.local.set({ [stateKey]: interrupted });
      await chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' });
      const platform = await chrome.proxy.settings.get({ incognito: false });
      return {
        appliedRevisionId: state.applied.revision.id,
        injectedGeneration: interrupted.generation,
        draftName: draft.profiles[0].name,
        platformMode: platform.value?.mode,
      };
    },
    { namespace: workflowStorageNamespace },
  );
}

async function assertInterruptedApplyRecovered(options, injected) {
  const current = assertWorkflowSuccess(
    await sendWorkflowCommand(options, { action: 'get' }),
    'Interrupted Apply recovery did not expose a usable workflow',
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

let context;
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

  context = await launch();
  let { options } = await extensionSurface(context);
  await importAndUse(options, originalBackupPath);
  const imported = await assertLargeState(options, 'after first Import & Use');
  await activateSwitch(options, imported.switchId, 'after first Import & Use');
  await waitForActiveSwitch(
    options,
    imported.switchId,
    'Original large switch did not become the confirmed PAC route',
  );
  await assertRouteDecisions(context, 'before-restart');

  await context.close();
  context = undefined;

  context = await launch();
  ({ options } = await extensionSurface(context));
  const restored = await assertLargeState(options, 'after Chromium restart');
  assert.equal(restored.switchId, imported.switchId);
  assert.equal(restored.metrics.bytes, imported.metrics.bytes);
  assert.equal(restored.metrics.revisionCount, imported.metrics.revisionCount);
  assert.equal(restored.metrics.appliedRevisionId, imported.metrics.appliedRevisionId);
  await waitForActiveSwitch(
    options,
    imported.switchId,
    'Original large switch did not recover after Chromium restart',
  );
  await assertRouteDecisions(context, 'after-restart');

  const exported = await exportOriginalSemantics(options, originalOptions);
  const beforeReimport = await assertLargeState(
    options,
    'after semantic export / before re-import analysis',
  );
  await reimportForReview(options, reimportPath);
  const reimported = await assertLargeState(options, 'after semantic re-import analysis');
  assert.equal(reimported.switchId, beforeReimport.switchId);
  assert.deepEqual(reimported.metrics, beforeReimport.metrics);
  await waitForActiveSwitch(
    options,
    beforeReimport.switchId,
    'Semantic re-import analysis changed the confirmed Chromium PAC route',
  );
  await assertRouteDecisions(context, 'after-reimport-analysis');

  const rejectedImport = await analyzeRejectedBackupWithoutMutation(options, invalidBackupPath);
  await waitForActiveSwitch(
    options,
    beforeReimport.switchId,
    'Rejected legacy analysis changed the confirmed Chromium PAC route',
  );
  await assertRouteDecisions(context, 'after-rejected-import-analysis');

  const interrupted = await injectInterruptedApply(options);
  assert.equal(interrupted.platformMode, 'direct');
  await context.close();
  context = undefined;

  context = await launch();
  ({ options } = await extensionSurface(context));
  const recoveredInterruptedApply = await assertInterruptedApplyRecovered(options, interrupted);
  await waitForActiveSwitch(
    options,
    beforeReimport.switchId,
    'Interrupted Apply restart recovery did not restore the previous Chromium PAC route',
  );
  await assertRouteDecisions(context, 'after-interrupted-apply-recovery');

  console.log(
    JSON.stringify(
      {
        browser: 'chromium',
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
    'Chromium original large migration plus rejected-import and interrupted-Apply preservation passed.',
  );
} finally {
  if (context) await context.close();
  await Promise.all([closeServer(targetServer), closeServer(proxyServer)]);
  await rm(userDataDir, { recursive: true, force: true });
}
