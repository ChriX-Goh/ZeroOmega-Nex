import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_CHROMIUM_PATH ?? 'original-release/chromium',
);
const outputPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_RUNTIME_OUTPUT ?? 'original-runtime/attached-rule-list-results',
);
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-original-attached-rule-list-'));
await mkdir(outputPath, { recursive: true });

let context;

async function pause(delay = 100) {
  await new Promise((resolvePause) => setTimeout(resolvePause, delay));
}

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
        await pause(100);
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
    for (let attempt = 0; attempt < 40; attempt += 1) {
      latest = await readState();
      if (latest?.currentProfileName === name) return latest;
      await pause(100);
    }
    throw new Error(`Original current profile did not become ${name}: ${JSON.stringify(latest)}`);
  }

  async function applyAndCapture(profileName, url) {
    await sendOriginalMessage('applyProfile', [profileName]);
    const runtimeState = await waitForCurrentProfile(profileName);
    await pause(300);
    const action = await sendOriginalMessage('_actionForUrl', [url, { skipIcon: true }]);
    assert.ok(action, `Original _actionForUrl returned no result for ${profileName} ${url}`);
    return { profileName, url, runtimeState, action };
  }

  const options = await sendOriginalMessage('getAll');
  const badgeKey = '-showResultProfileOnActionBadgeText';
  const previousBadgeValue = options?.[badgeKey];
  const badgePatch = {
    [badgeKey]: previousBadgeValue === undefined ? [true] : [previousBadgeValue, true],
  };
  await sendOriginalMessage('patch', [badgePatch]);

  const fixedProfile = {
    name: 'Runtime Attached Fixed',
    profileType: 'FixedProfile',
    color: '#64b5f6',
    fallbackProxy: {
      scheme: 'http',
      host: '127.0.0.1',
      port: 18183,
    },
    bypassList: [],
  };

  const fixedParent = {
    name: 'Runtime Attached Fixed Switch',
    profileType: 'SwitchProfile',
    color: '#5b5',
    rules: [],
    defaultProfileName: '__ruleListOf_Runtime Attached Fixed Switch',
  };
  const fixedAttached = {
    name: fixedParent.defaultProfileName,
    profileType: 'RuleListProfile',
    color: fixedParent.color,
    format: 'AutoProxy',
    matchProfileName: fixedProfile.name,
    defaultProfileName: 'direct',
    ruleList: '[AutoProxy 0.2.9]\n||attached-fixed.test^\n',
  };

  const directParent = {
    name: 'Runtime Attached Direct Switch',
    profileType: 'SwitchProfile',
    color: '#d63',
    rules: [],
    defaultProfileName: '__ruleListOf_Runtime Attached Direct Switch',
  };
  const directAttached = {
    name: directParent.defaultProfileName,
    profileType: 'RuleListProfile',
    color: directParent.color,
    format: 'AutoProxy',
    matchProfileName: 'direct',
    defaultProfileName: fixedProfile.name,
    ruleList: '[AutoProxy 0.2.9]\n||attached-direct.test^\n',
  };

  for (const profile of [
    fixedProfile,
    fixedAttached,
    fixedParent,
    directAttached,
    directParent,
  ]) {
    await sendOriginalMessage('addProfile', [profile]);
  }

  const captures = [];
  captures.push(await applyAndCapture(fixedParent.name, 'http://attached-fixed.test/path'));
  captures.push(await applyAndCapture(fixedParent.name, 'http://attached-default-direct.test/path'));
  captures.push(await applyAndCapture(directParent.name, 'http://attached-direct.test/path'));
  captures.push(await applyAndCapture(directParent.name, 'http://attached-default-fixed.test/path'));

  const result = {
    target: 'chromium',
    packageVersion,
    browserVersion: context.browser()?.version() ?? 'unknown',
    extensionId,
    badgeKey,
    profiles: {
      fixedProfile,
      fixedParent,
      fixedAttached,
      directParent,
      directAttached,
    },
    captures,
  };

  await writeFile(
    resolve(outputPath, 'attached-rule-list-results.json'),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8',
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await context?.close().catch(() => undefined);
  await rm(userDataDir, { recursive: true, force: true });
}
