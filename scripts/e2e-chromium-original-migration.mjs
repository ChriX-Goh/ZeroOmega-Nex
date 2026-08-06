import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const originalBackupPath = resolve('fixtures/zeroomega-v2/original-default-v3.5.0.bak');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-original-migration-'));
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
  throw new Error('Original migration target server failed');
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

async function launch() {
  return chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--host-resolver-rules=MAP proxy.example.com 127.0.0.1, ' +
        'MAP internal.example.com 127.0.0.1, MAP routed.example.com 127.0.0.1',
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
    console.log(`[Original migration console:${message.type()}] ${message.text()}`);
  });
  options.on('pageerror', (error) => {
    console.error(`[Original migration pageerror] ${error.stack ?? error.message}`);
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
      return { workflow, proxySetting, storage };
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(`${label}: ${JSON.stringify(last)}`);
}

async function assertImportedState(options) {
  const [workflow] = await workflowView(options);
  assert.equal(workflow?.ok, true, `Imported workflow failed: ${JSON.stringify(workflow)}`);

  const applied = workflow.state.applied;
  const fixed = applied.profiles.find((profile) => profile.name === 'proxy');
  const autoSwitch = applied.profiles.find((profile) => profile.name === 'auto switch');
  assert.equal(fixed?.kind, 'fixed', 'Original Fixed profile was not imported');
  assert.equal(fixed.color, '#99ccee');
  assert.equal(autoSwitch?.kind, 'switch', 'Original Switch profile was not imported');
  assert.equal(autoSwitch.color, '#99dd99');
  assert.equal(applied.profiles.indexOf(fixed) < applied.profiles.indexOf(autoSwitch), true);
  assert.equal(workflow.state.draft.revision.id, applied.revision.id);

  const fallback = applied.proxyEndpoints.find(
    (endpoint) => endpoint.id === fixed.proxyByScheme.fallback,
  );
  assert.ok(fallback, 'Original Fixed fallback endpoint was not imported');
  assert.equal(fallback.protocol, 'http');
  assert.equal(fallback.host, 'proxy.example.com');
  assert.equal(fallback.port, 8080);
  assert.deepEqual(
    fixed.bypass?.map((entry) => entry.pattern),
    ['127.0.0.1', '::1', 'localhost'],
  );

  return { autoSwitchId: autoSwitch.id, applied };
}

async function enableAndActivateSwitch(options, profileId) {
  const current = assertWorkflowSuccess(
    await sendWorkflowCommand(options, { action: 'get' }),
    'Unable to read imported workflow',
  );
  const originalApplied = structuredClone(current.state.applied);
  const draft = structuredClone(current.state.applied);
  draft.settings.quickSwitch = {
    ...draft.settings.quickSwitch,
    enabled: true,
    routes: [{ kind: 'profile', profileId }],
  };

  const replaced = assertWorkflowSuccess(
    await sendWorkflowCommand(options, {
      action: 'replace-draft',
      expectedGeneration: current.state.generation,
      draft,
    }),
    'Unable to stage imported Switch profile',
  );
  const applied = assertWorkflowSuccess(
    await sendWorkflowCommand(options, {
      action: 'apply',
      expectedGeneration: replaced.state.generation,
    }),
    'Unable to apply imported Switch profile',
  );
  assertWorkflowSuccess(
    await sendWorkflowCommand(options, {
      action: 'activate-route',
      expectedAppliedRevisionId: applied.state.applied.revision.id,
      route: { kind: 'profile', profileId },
    }),
    'Unable to activate imported Switch profile',
  );

  return originalApplied;
}

async function restoreOriginalApplied(options, originalApplied) {
  const current = assertWorkflowSuccess(
    await sendWorkflowCommand(options, { action: 'get' }),
    'Unable to read temporary route-test workflow',
  );
  const replaced = assertWorkflowSuccess(
    await sendWorkflowCommand(options, {
      action: 'replace-draft',
      expectedGeneration: current.state.generation,
      draft: originalApplied,
    }),
    'Unable to restore original imported settings',
  );
  return assertWorkflowSuccess(
    await sendWorkflowCommand(options, {
      action: 'apply',
      expectedGeneration: replaced.state.generation,
    }),
    'Unable to apply restored original settings',
  );
}

async function assertRouteDecisions(context, label) {
  const directBefore = targetRequestCount;
  const proxyBefore = proxyRequests.length;

  const directPage = await context.newPage();
  const directUrl = `http://internal.example.com:${targetAddress.port}/${label}-direct`;
  await directPage.goto(directUrl, { waitUntil: 'domcontentloaded' });
  assert.equal(await directPage.locator('body').innerText(), targetMarker);
  assert.equal(targetRequestCount > directBefore, true);
  assert.equal(proxyRequests.length, proxyBefore);
  await directPage.close();

  const directAfter = targetRequestCount;
  const proxyPage = await context.newPage();
  const proxyUrl = `http://routed.example.com:${targetAddress.port}/${label}-proxy`;
  await proxyPage.goto(proxyUrl, { waitUntil: 'domcontentloaded' });
  assert.equal(await proxyPage.locator('body').innerText(), proxyMarker);
  assert.equal(targetRequestCount, directAfter);
  assert.equal(proxyRequests.length > proxyBefore, true);
  assert.equal(
    proxyRequests.slice(proxyBefore).some((request) => /routed\.example\.com/u.test(request)),
    true,
  );
  await proxyPage.close();
}

function requiredOriginalSemantics(options) {
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

async function exportOriginalSemantics(options, originalOptions) {
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  const downloadPromise = options.waitForEvent('download');
  await options.locator('[data-legacy-export]').click();
  const download = await downloadPromise;
  const exportedPath = await download.path();
  assert.ok(exportedPath, 'Original migration export did not produce a local file');
  const exportedContent = await readFile(exportedPath, 'utf8');
  const exportedOptions = JSON.parse(exportedContent);
  assert.deepEqual(
    requiredOriginalSemantics(exportedOptions),
    requiredOriginalSemantics(originalOptions),
  );
  assert.doesNotMatch(
    exportedContent,
    /passwordSecretRef|secretRef|not-a-real-secret/u,
    'Original migration export leaked secret references',
  );
}

let context;
try {
  const originalContent = await readFile(originalBackupPath, 'utf8');
  const originalOptions = JSON.parse(originalContent);

  context = await launch();
  let { options } = await extensionSurface(context);

  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await options.getByLabel('原版备份文件').setInputFiles(originalBackupPath);
  await options
    .getByRole('heading', { name: '兼容性检查', exact: true })
    .waitFor({ timeout: 20_000 });
  await options.getByRole('button', { name: '导入并立即使用', exact: true }).click();
  await options
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  const imported = await assertImportedState(options);
  assert.equal(imported.applied.settings.quickSwitch.enabled, false);
  assert.deepEqual(imported.applied.settings.quickSwitch.routes, []);

  const originalApplied = await enableAndActivateSwitch(options, imported.autoSwitchId);
  await waitForActiveSwitch(
    options,
    imported.autoSwitchId,
    'Original auto switch did not become the confirmed PAC route',
  );
  await assertRouteDecisions(context, 'before-restart');

  await context.close();
  context = undefined;

  context = await launch();
  ({ options } = await extensionSurface(context));
  const restored = await assertImportedState(options);
  assert.equal(restored.autoSwitchId, imported.autoSwitchId);
  await waitForActiveSwitch(
    options,
    imported.autoSwitchId,
    'Original auto switch did not recover after Chromium restart',
  );
  await assertRouteDecisions(context, 'after-restart');

  const originalState = await restoreOriginalApplied(options, originalApplied);
  assert.equal(originalState.state.applied.settings.quickSwitch.enabled, false);
  assert.deepEqual(originalState.state.applied.settings.quickSwitch.routes, []);
  await exportOriginalSemantics(options, originalOptions);

  console.log('Chromium original backup import, route, restart, and semantic export passed.');
} finally {
  if (context) {
    await context.close();
  }
  await Promise.all([closeServer(targetServer), closeServer(proxyServer)]);
  await rm(userDataDir, { recursive: true, force: true });
}
