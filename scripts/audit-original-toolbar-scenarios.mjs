import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

import {
  ORIGINAL_TOOLBAR_EVIDENCE_SCHEMA_VERSION,
  selectOriginalToolbarEvidenceScenarios,
} from './original-toolbar-evidence-scenarios.mjs';

const extensionPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_CHROMIUM_PATH ?? 'original-release/chromium',
);
const outputPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_RUNTIME_OUTPUT ?? 'original-runtime/toolbar-evidence',
);
const scenarioSelection = process.env.ZEROOMEGA_ORIGINAL_SCENARIO ?? 'nested-switch';
const scenarios = selectOriginalToolbarEvidenceScenarios(scenarioSelection);
await mkdir(outputPath, { recursive: true });

async function pause(delay = 100) {
  await new Promise((resolvePause) => setTimeout(resolvePause, delay));
}

function validateScenario(scenario) {
  const profileNames = scenario.profiles.map((profile) => profile.name);
  assert.equal(
    new Set(profileNames).size,
    profileNames.length,
    `Scenario ${scenario.id} contains duplicate profile names`,
  );
  assert.ok(scenario.captures.length > 0, `Scenario ${scenario.id} has no captures`);
  for (const capture of scenario.captures) {
    assert.ok(
      profileNames.includes(capture.profileName),
      `Scenario ${scenario.id}/${capture.label} missing profile ${capture.profileName}`,
    );
    assert.doesNotThrow(
      () => new URL(capture.url),
      `Scenario ${scenario.id} capture ${capture.label} has an invalid URL`,
    );
    const commands = capture.commands ?? [];
    assert.ok(
      Array.isArray(commands),
      `Scenario ${scenario.id}/${capture.label} commands must be an array`,
    );
    for (const [index, command] of commands.entries()) {
      assert.ok(
        command && typeof command === 'object' && !Array.isArray(command),
        `Scenario ${scenario.id}/${capture.label} command ${index} must be an object`,
      );
      assert.equal(
        typeof command.method,
        'string',
        `Scenario ${scenario.id}/${capture.label} command ${index} method is required`,
      );
      assert.ok(
        command.args === undefined || Array.isArray(command.args),
        `Scenario ${scenario.id}/${capture.label} command ${index} args must be an array`,
      );
    }
    if (capture.externalCommand !== undefined) {
      assert.equal(
        scenario.externalControl,
        true,
        `Scenario ${scenario.id}/${capture.label} uses externalCommand without externalControl`,
      );
      assert.ok(
        capture.externalCommand === 'claim' || capture.externalCommand === 'release',
        `Scenario ${scenario.id}/${capture.label} has an invalid external command`,
      );
    }
  }
}

async function createConflictExtension() {
  const directory = await mkdtemp(resolve(tmpdir(), 'zeroomega-original-external-control-'));
  await writeFile(
    resolve(directory, 'manifest.json'),
    JSON.stringify({
      manifest_version: 3,
      name: 'Original Toolbar External Control Probe',
      version: '1.0.0',
      permissions: ['proxy'],
      background: { service_worker: 'background.js' },
    }),
  );
  await writeFile(
    resolve(directory, 'background.js'),
    `globalThis.__zeroomegaClaimTimer = undefined;
setInterval(() => undefined, 1000);
`,
  );
  return directory;
}

async function runScenario(scenario) {
  validateScenario(scenario);
  const userDataDir = await mkdtemp(resolve(tmpdir(), `zeroomega-original-${scenario.id}-`));
  const conflictExtensionPath = scenario.externalControl
    ? await createConflictExtension()
    : undefined;
  let context;

  try {
    const extensionPaths = [extensionPath, conflictExtensionPath].filter(Boolean);
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      locale: 'en-US',
      args: [
        `--disable-extensions-except=${extensionPaths.join(',')}`,
        `--load-extension=${extensionPaths.join(',')}`,
      ],
    });

    let originalWorker;
    let conflictWorker;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      for (const candidate of context.serviceWorkers()) {
        const name = await candidate
          .evaluate(() => chrome.runtime.getManifest().name)
          .catch(() => '');
        if (name === 'Original Toolbar External Control Probe') conflictWorker = candidate;
        else if ((await candidate.evaluate(() => chrome.runtime.getManifest().version)) === '3.5.0') {
          originalWorker = candidate;
        }
      }
      if (originalWorker && (!scenario.externalControl || conflictWorker)) break;
      await pause();
    }
    originalWorker ??= await context.waitForEvent('serviceworker', { timeout: 20_000 });
    assert.ok(originalWorker, 'Original Chromium service worker was not resolved');
    if (scenario.externalControl) {
      assert.ok(conflictWorker, 'External-control probe service worker was not resolved');
    }

    const extensionId = new URL(originalWorker.url()).host;
    assert.match(extensionId, /^[a-p]{32}$/u, 'Original Chromium extension ID was not resolved');

    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await optionsPage.waitForLoadState('domcontentloaded');
    const packageVersion = await optionsPage.evaluate(() => chrome.runtime.getManifest().version);
    assert.equal(packageVersion, '3.5.0', 'Unexpected original package version');

    async function sendOriginalMessage(method, args = []) {
      let lastError;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        try {
          return await optionsPage.evaluate(
            async ({ requestMethod, requestArgs }) =>
              new Promise((resolveMessage, rejectMessage) => {
                chrome.runtime.sendMessage(
                  { method: requestMethod, args: requestArgs },
                  (response) => {
                    if (chrome.runtime.lastError) {
                      rejectMessage(new Error(chrome.runtime.lastError.message));
                      return;
                    }
                    if (response?.error) {
                      rejectMessage(new Error(String(response.error.message ?? response.error)));
                      return;
                    }
                    resolveMessage(response?.result ?? null);
                  },
                );
              }),
            { requestMethod: method, requestArgs: args },
          );
        } catch (error) {
          lastError = error;
          await pause();
        }
      }
      throw lastError ?? new Error(`Original runtime message ${method} failed`);
    }

    async function readState() {
      return sendOriginalMessage('getState', [
        {
          currentProfileName: '',
          isSystemProfile: false,
          validResultProfiles: [],
        },
      ]);
    }

    async function waitForCurrentProfile(name) {
      let latest;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        latest = await readState();
        if (latest?.currentProfileName === name) return latest;
        await pause();
      }
      throw new Error(`Original current profile did not become ${name}: ${JSON.stringify(latest)}`);
    }

    async function readOriginalControlLevel() {
      return optionsPage.evaluate(
        async () => (await chrome.proxy.settings.get({ incognito: false })).levelOfControl,
      );
    }

    async function readConflictControlLevel() {
      if (!conflictWorker) return undefined;
      return conflictWorker.evaluate(
        async () => (await chrome.proxy.settings.get({ incognito: false })).levelOfControl,
      );
    }

    async function waitForOriginalControlLevel(expected) {
      let latest;
      for (let attempt = 0; attempt < 80; attempt += 1) {
        latest = await readOriginalControlLevel();
        if (latest === expected) return latest;
        await pause();
      }
      throw new Error(`Original proxy control level did not become ${expected}: ${latest}`);
    }

    async function runExternalCommand(command) {
      assert.ok(conflictWorker, 'External-control probe is unavailable');
      if (command === 'claim') {
        await conflictWorker.evaluate(async () => {
          const claim = () =>
            chrome.proxy.settings.set({
              scope: 'regular',
              value: { mode: 'direct' },
            });
          if (globalThis.__zeroomegaClaimTimer !== undefined) {
            clearInterval(globalThis.__zeroomegaClaimTimer);
          }
          await claim();
          globalThis.__zeroomegaClaimTimer = setInterval(() => void claim(), 100);
        });
        return;
      }
      await conflictWorker.evaluate(async () => {
        if (globalThis.__zeroomegaClaimTimer !== undefined) {
          clearInterval(globalThis.__zeroomegaClaimTimer);
          globalThis.__zeroomegaClaimTimer = undefined;
        }
        await chrome.proxy.settings.clear({ scope: 'regular' });
      });
    }

    async function readActualAction(tabId) {
      return optionsPage.evaluate(
        async (targetTabId) => {
          const action = chrome.action ?? chrome.browserAction;
          const invoke = (method, details) =>
            new Promise((resolveValue, rejectValue) => {
              method.call(action, details, (value) => {
                if (chrome.runtime.lastError) {
                  rejectValue(new Error(chrome.runtime.lastError.message));
                  return;
                }
                resolveValue(value);
              });
            });
          return {
            title: await invoke(action.getTitle, { tabId: targetTabId }),
            badgeText: await invoke(action.getBadgeText, { tabId: targetTabId }),
            badgeBackgroundColor: await invoke(action.getBadgeBackgroundColor, {
              tabId: targetTabId,
            }),
          };
        },
        tabId,
      );
    }

    await waitForCurrentProfile('system');
    const allOptions = await sendOriginalMessage('getAll');
    const badgeKey = '-showResultProfileOnActionBadgeText';
    const previousBadgeValue = allOptions?.[badgeKey];
    await sendOriginalMessage('patch', [
      {
        [badgeKey]: previousBadgeValue === undefined ? [true] : [previousBadgeValue, true],
      },
    ]);

    for (const profile of scenario.profiles) {
      await sendOriginalMessage('addProfile', [profile]);
    }

    let targetPage;
    let targetTabId;
    if (scenario.externalControl) {
      await context.route('http://external-control.test/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<title>Original external control probe</title>',
        }),
      );
      targetPage = await context.newPage();
      await targetPage.goto('http://external-control.test/path');
      targetTabId = await optionsPage.evaluate(async () => {
        const tab = (await chrome.tabs.query({})).find((candidate) =>
          candidate.url?.startsWith('http://external-control.test/'),
        );
        return tab?.id;
      });
      assert.equal(typeof targetTabId, 'number', 'External-control target tab ID was not resolved');
    }

    const captures = [];
    for (const capture of scenario.captures) {
      if (capture.applyProfile !== false) {
        await sendOriginalMessage('applyProfile', [capture.profileName]);
        await waitForCurrentProfile(capture.profileName);
      }
      const commandResults = [];
      for (const command of capture.commands ?? []) {
        commandResults.push({
          method: command.method,
          result: await sendOriginalMessage(command.method, command.args ?? []),
        });
      }
      if (capture.externalCommand !== undefined) {
        await runExternalCommand(capture.externalCommand);
      }
      if (capture.expectedOriginalControlLevel !== undefined) {
        await waitForOriginalControlLevel(capture.expectedOriginalControlLevel);
      }
      const runtimeState =
        capture.waitForCurrentProfile === false
          ? await readState()
          : await waitForCurrentProfile(capture.profileName);
      await pause(500);
      const action = await sendOriginalMessage('_actionForUrl', [capture.url, { skipIcon: true }]);
      assert.ok(
        action,
        `Original _actionForUrl returned no result for ${scenario.id}/${capture.label}`,
      );
      captures.push({
        ...capture,
        runtimeState,
        action,
        proxyControl: {
          originalLevel: await readOriginalControlLevel(),
          conflictLevel: await readConflictControlLevel(),
        },
        ...(targetTabId === undefined ? {} : { actualAction: await readActualAction(targetTabId) }),
        ...(commandResults.length === 0 ? {} : { commandResults }),
      });
    }

    await targetPage?.close().catch(() => undefined);
    return {
      id: scenario.id,
      description: scenario.description,
      target: 'chromium',
      packageVersion,
      browserVersion: context.browser()?.version() ?? 'unknown',
      extensionId,
      badgeKey,
      profiles: scenario.profiles,
      captures,
    };
  } finally {
    await context?.close().catch(() => undefined);
    await rm(userDataDir, { recursive: true, force: true });
    if (conflictExtensionPath) {
      await rm(conflictExtensionPath, { recursive: true, force: true });
    }
  }
}

const results = [];
for (const scenario of scenarios) {
  results.push(await runScenario(scenario));
}

const evidence = {
  schemaVersion: ORIGINAL_TOOLBAR_EVIDENCE_SCHEMA_VERSION,
  requestedScenarios: scenarioSelection,
  results,
};
await writeFile(resolve(outputPath, 'runtime.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
