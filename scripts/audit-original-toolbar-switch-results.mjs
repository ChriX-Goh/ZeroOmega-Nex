import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_CHROMIUM_PATH ?? 'original-release/chromium',
);
const outputPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_RUNTIME_OUTPUT ?? 'original-runtime/switch-results',
);
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-original-switch-'));
await mkdir(outputPath, { recursive: true });

let context;

async function pause(delay = 120) {
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

  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.waitForLoadState('domcontentloaded');

  async function sendOriginalMessage(method, args = [], noReply = false) {
    let lastError;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        return await options.evaluate(
          async ({ method: requestMethod, args: requestArgs, noReply: requestNoReply }) => {
            if (requestNoReply) {
              chrome.runtime.sendMessage({
                method: requestMethod,
                args: requestArgs,
                noReply: true,
                refreshActivePage: false,
              });
              await new Promise((resolvePause) => setTimeout(resolvePause, 50));
              return null;
            }
            return new Promise((resolveMessage, rejectMessage) => {
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
            });
          },
          { method, args, noReply },
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
        availableProfiles: {},
      },
    ]);
  }

  async function waitForCurrentProfile(profileName) {
    let latest;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      latest = await readState();
      if (latest?.currentProfileName === profileName) return latest;
      await pause();
    }
    throw new Error(
      `Original current profile did not reach ${profileName}: ${JSON.stringify(latest)}`,
    );
  }

  async function actionForUrl(url) {
    const action = await sendOriginalMessage('_actionForUrl', [url, { skipIcon: true }]);
    return action === null
      ? null
      : {
          url,
          title: action.title,
          currentName: action.currentName,
          name: action.name,
          badgeText: action.badgeText ?? '',
          shortTitle: action.shortTitle,
          prefix: action.prefix,
          resultColor: action.resultColor,
          profileColor: action.profileColor,
          profile: action.profile,
        };
  }

  await waitForCurrentProfile('system');
  await sendOriginalMessage('_setOptions', [
    {
      '-showResultProfileOnActionBadgeText': true,
    },
  ]);

  const fixedProfile = {
    profileType: 'FixedProfile',
    name: 'Runtime Fixed',
    color: '#64b5f6',
    bypassList: [],
    fallbackProxy: {
      scheme: 'http',
      host: '127.0.0.1',
      port: 18181,
    },
  };
  const switchProfile = {
    profileType: 'SwitchProfile',
    name: 'Runtime Switch',
    color: '#ffb74d',
    rules: [
      {
        condition: {
          conditionType: 'HostWildcardCondition',
          pattern: 'direct-match.test',
        },
        profileName: 'direct',
      },
      {
        condition: {
          conditionType: 'HostWildcardCondition',
          pattern: 'fixed-match.test',
        },
        profileName: fixedProfile.name,
      },
    ],
    defaultProfileName: 'direct',
  };

  await sendOriginalMessage('addProfile', [fixedProfile]);
  await sendOriginalMessage('addProfile', [switchProfile]);
  await sendOriginalMessage('applyProfile', [switchProfile.name]);
  const switchState = await waitForCurrentProfile(switchProfile.name);

  const actions = {
    matchedDirect: await actionForUrl('http://direct-match.test/path'),
    matchedFixed: await actionForUrl('http://fixed-match.test/path'),
    defaultDirect: await actionForUrl('http://default-match.test/path'),
  };

  const systemProfile = {
    profileType: 'SwitchProfile',
    name: 'Runtime System Switch',
    color: '#ce93d8',
    rules: [
      {
        condition: {
          conditionType: 'HostWildcardCondition',
          pattern: 'system-match.test',
        },
        profileName: 'system',
      },
    ],
    defaultProfileName: fixedProfile.name,
  };
  let systemTarget;
  try {
    await sendOriginalMessage('addProfile', [systemProfile]);
    await sendOriginalMessage('applyProfile', [systemProfile.name]);
    const systemState = await waitForCurrentProfile(systemProfile.name);
    systemTarget = {
      accepted: true,
      state: systemState,
      matched: await actionForUrl('http://system-match.test/path'),
      fallback: await actionForUrl('http://system-fallback.test/path'),
    };
  } catch (error) {
    systemTarget = {
      accepted: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const result = {
    target: 'chromium',
    extensionId,
    browserVersion: context.browser()?.version() ?? 'unknown',
    switchState,
    actions,
    systemTarget,
  };

  await writeFile(resolve(outputPath, 'runtime.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await context?.close();
}
