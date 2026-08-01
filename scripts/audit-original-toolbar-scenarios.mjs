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
      `Scenario ${scenario.id} capture ${capture.label} references missing profile ${capture.profileName}`,
    );
    assert.doesNotThrow(
      () => new URL(capture.url),
      `Scenario ${scenario.id} capture ${capture.label} has an invalid URL`,
    );
  }
}

async function runScenario(scenario) {
  validateScenario(scenario);
  const userDataDir = await mkdtemp(resolve(tmpdir(), `zeroomega-original-${scenario.id}-`));
  let context;

  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      locale: 'en-US',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });

    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker', { timeout: 20_000 });
    const extensionId = new URL(worker.url()).host;
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
      throw new Error(
        `Original current profile did not become ${name}: ${JSON.stringify(latest)}`,
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

    const captures = [];
    for (const capture of scenario.captures) {
      await sendOriginalMessage('applyProfile', [capture.profileName]);
      const runtimeState = await waitForCurrentProfile(capture.profileName);
      await pause(300);
      const action = await sendOriginalMessage('_actionForUrl', [capture.url, { skipIcon: true }]);
      assert.ok(
        action,
        `Original _actionForUrl returned no result for ${scenario.id}/${capture.label}`,
      );
      captures.push({ ...capture, runtimeState, action });
    }

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
