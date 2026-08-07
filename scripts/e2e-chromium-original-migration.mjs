import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const complexCorpus = process.env.ZEROOMEGA_ORIGINAL_MIGRATION_CORPUS === 'complex';
const originalBackupPath = resolve(
  complexCorpus
    ? 'fixtures/zeroomega-v2/original-complex-corpus-cd-v3.5.0.bak'
    : 'fixtures/zeroomega-v2/original-default-v3.5.0.bak',
);
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
        'MAP internal.example.com 127.0.0.1, MAP routed.example.com 127.0.0.1, ' +
        'MAP proxy-corpus.example.com 127.0.0.1, MAP direct.corpus.test 127.0.0.1, ' +
        'MAP nested.corpus.example.com 127.0.0.1, ' +
        'MAP rulelist.corpus.example.com 127.0.0.1, ' +
        'MAP pac.corpus.example.com 127.0.0.1',
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
  const directHost = complexCorpus ? 'direct.corpus.test' : 'internal.example.com';
  const directUrl = `http://${directHost}:${targetAddress.port}/${label}-direct`;
  await directPage.goto(directUrl, { waitUntil: 'domcontentloaded' });
  assert.equal(await directPage.locator('body').innerText(), targetMarker);
  assert.equal(targetRequestCount > directBefore, true);
  assert.equal(proxyRequests.length, proxyBefore);
  await directPage.close();

  const directAfter = targetRequestCount;
  const proxyPage = await context.newPage();
  const proxyHost = complexCorpus ? 'nested.corpus.example.com' : 'routed.example.com';
  const proxyUrl = `http://${proxyHost}:${targetAddress.port}/${label}-proxy`;
  await proxyPage.goto(proxyUrl, { waitUntil: 'domcontentloaded' });
  assert.equal(await proxyPage.locator('body').innerText(), proxyMarker);
  assert.equal(targetRequestCount, directAfter);
  assert.equal(proxyRequests.length > proxyBefore, true);
  assert.equal(
    proxyRequests.slice(proxyBefore).some((request) => request.includes(proxyHost)),
    true,
  );
  await proxyPage.close();

  if (complexCorpus) {
    const ruleListPage = await context.newPage();
    const ruleListUrl = `http://rulelist.corpus.example.com:${targetAddress.port}/${label}-rules`;
    await ruleListPage.goto(ruleListUrl, { waitUntil: 'domcontentloaded' });
    assert.equal(await ruleListPage.locator('body').innerText(), proxyMarker);
    assert.equal(
      proxyRequests.some((request) => request.includes('rulelist.corpus.example.com')),
      true,
    );
    await ruleListPage.close();
  }
}

async function assertPacRouteDecisions(context, label) {
  const directBefore = targetRequestCount;
  const proxyBefore = proxyRequests.length;
  const directPage = await context.newPage();
  await directPage.goto(`http://direct.corpus.test:${targetAddress.port}/${label}-direct`, {
    waitUntil: 'domcontentloaded',
  });
  assert.equal(await directPage.locator('body').innerText(), targetMarker);
  assert.equal(targetRequestCount > directBefore, true);
  assert.equal(proxyRequests.length, proxyBefore);
  await directPage.close();

  const proxyPage = await context.newPage();
  await proxyPage.goto(`http://pac.corpus.example.com:${targetAddress.port}/${label}-proxy`, {
    waitUntil: 'domcontentloaded',
  });
  assert.equal(await proxyPage.locator('body').innerText(), proxyMarker);
  assert.equal(proxyRequests.length > proxyBefore, true);
  assert.equal(
    proxyRequests.slice(proxyBefore).some((request) => request.includes('pac.corpus.example.com')),
    true,
  );
  await proxyPage.close();
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
  if (complexCorpus) {
    await options.evaluate(() => {
      const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);
      globalThis.__zeroOmegaComplexImportCandidate = undefined;
      chrome.runtime.sendMessage = async (message) => {
        if (message?.action === 'accept-import') {
          globalThis.__zeroOmegaComplexImportCandidate = structuredClone(message.candidate);
        }
        return sendMessage(message);
      };
    });
  }
  await options.getByRole('button', { name: '导入并立即使用', exact: true }).click();
  await options
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  if (complexCorpus) {
    const sentCandidate = await options.evaluate(
      () => globalThis.__zeroOmegaComplexImportCandidate,
    );
    const sentNamesById = new Map(
      sentCandidate.profiles.map((profile) => [profile.id, profile.name]),
    );
    assert.deepEqual(
      sentCandidate.settings.quickSwitch.routes.map((route) =>
        route.kind === 'profile' ? sentNamesById.get(route.profileId) : route.kind,
      ),
      ['outer switch', 'PAC 中文'],
      'Browser import candidate lost complex Quick Switch intent before accept-import',
    );
  }

  const imported = await assertImportedState(options);
  assert.equal(imported.applied.settings.quickSwitch.enabled, complexCorpus);
  if (!complexCorpus) assert.deepEqual(imported.applied.settings.quickSwitch.routes, []);

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
  assert.equal(originalState.state.applied.settings.quickSwitch.enabled, complexCorpus);
  if (!complexCorpus) {
    assert.deepEqual(originalState.state.applied.settings.quickSwitch.routes, []);
  } else {
    assert.ok(imported.pacId, 'Corpus D PAC route was not available after import');
    assertWorkflowSuccess(
      await sendWorkflowCommand(options, {
        action: 'activate-route',
        expectedAppliedRevisionId: originalState.state.applied.revision.id,
        route: { kind: 'profile', profileId: imported.pacId },
      }),
      'Unable to activate imported Corpus D PAC profile',
    );
    await waitForActiveSwitch(options, imported.pacId, 'Corpus D PAC did not become active');
    await assertPacRouteDecisions(context, 'pac');
  }
  await exportOriginalSemantics(options, originalOptions);

  console.log(
    `Chromium original ${complexCorpus ? 'Corpus C/D' : 'Corpus A'} import, route, restart, and semantic export passed.`,
  );
} finally {
  if (context) {
    await context.close();
  }
  await Promise.all([closeServer(targetServer), closeServer(proxyServer)]);
  await rm(userDataDir, { recursive: true, force: true });
}
