import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

import { Browser, Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

import { createBasicAuthProxyChallengeServer } from './e2e-basic-auth-proxy.mjs';

const remoteRuleText = '[SwitchyOmega Conditions]\n@with result\n\n* +direct\n';
const remotePacText = "function FindProxyForURL(url, host) { return 'DIRECT'; }\n";
const remoteOnlineBackupText = await readFile(
  resolve('fixtures/zeroomega-v2/minimal-profile-types.json'),
  'utf8',
);
let ruleRequestCount = 0;
let pacRequestCount = 0;
let onlineBackupRequestCount = 0;
const sourceServer = createServer((request, response) => {
  if (request.url?.startsWith('/online-backup')) {
    onlineBackupRequestCount += 1;
    response.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(remoteOnlineBackupText);
    return;
  }
  if (request.url?.startsWith('/rules.txt')) {
    ruleRequestCount += 1;
    response.writeHead(200, {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(remoteRuleText);
    return;
  }
  if (request.url?.startsWith('/proxy.pac')) {
    pacRequestCount += 1;
    response.writeHead(200, {
      'content-type': 'application/x-ns-proxy-autoconfig; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(remotePacText);
    return;
  }
  if (request.url?.startsWith('/toolbar-')) {
    response.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end('<!doctype html><html><body>Firefox toolbar Action E2E</body></html>');
    return;
  }
  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('not found');
});
await new Promise((resolveListen, rejectListen) => {
  sourceServer.once('error', rejectListen);
  sourceServer.listen(0, '0.0.0.0', resolveListen);
});
const sourceAddress = sourceServer.address();
if (!sourceAddress || typeof sourceAddress === 'string') {
  throw new Error('Firefox source-update test server failed');
}
const remoteRuleUrl = `http://127.0.0.1:${sourceAddress.port}/rules.txt`;
const remotePacUrl = `http://127.0.0.1:${sourceAddress.port}/proxy.pac`;
const remotePermissionOrigin = 'http://127.0.0.1/*';
const onlineBackupUrl = `http://localhost:${sourceAddress.port}/online-backup`;
const onlineBackupPermissionOrigin = 'http://localhost/*';
const proxyAuthUsername = 'firefox-e2e';
const proxyAuthPassword = 'firefox-e2e-password';
const authProxy = await createBasicAuthProxyChallengeServer({
  username: proxyAuthUsername,
  password: proxyAuthPassword,
  marker: 'Firefox authenticated proxy request passed',
});

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000008';
const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference('intl.accept_languages', 'zh-TW')
  .enableBidi()
  .setPreference('extensions.webextOptionalPermissionPrompts', false)
  .setPreference('network.dns.disableIPv6', true)
  .setPreference('network.dns.localDomains', 'toolbar-a.test')
  .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));
const driver = await new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(options).build();
const toolbarOnly = process.env.ZEROOMEGA_FIREFOX_TOOLBAR_ONLY === '1';
const toolbarOnlyComplete = Symbol('firefox-toolbar-only-complete');

async function bidiCommand(method, params) {
  const capabilities = await driver.getCapabilities();
  const webSocketUrl = capabilities.get('webSocketUrl');
  assert.equal(typeof webSocketUrl, 'string', 'Firefox did not expose a BiDi WebSocket URL');
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
    const response = await new Promise((resolveResponse, rejectResponse) => {
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
    return response;
  } finally {
    socket.close();
  }
}

async function navigateExtensionPage(relativeUrl) {
  const context = await driver.getWindowHandle();
  const url = `moz-extension://${extensionUuid}/${relativeUrl}`;
  const result = await bidiCommand('browsingContext.navigate', {
    context,
    url,
    wait: 'complete',
  });
  const expectedUrl = relativeUrl === 'options.html' ? `${url}#/about` : url;
  assert.equal(result?.url, expectedUrl, `Firefox BiDi navigated to an unexpected extension URL`);
  await driver.wait(async () => (await driver.getCurrentUrl()) === expectedUrl, 20_000);
}

async function runtimeDiagnostics() {
  return driver.executeAsyncScript(`
    const done = arguments[0];
    (async () => {
      const redactStorage = (storage) => Object.fromEntries(
        Object.entries(storage).map(([key, value]) => [
          key,
          key.includes('/secret/') ? '<redacted>' : value,
        ]),
      );
      const result = {
        manifest: browser.runtime.getManifest(),
        incognitoAllowed: await browser.extension.isAllowedIncognitoAccess(),
        proxyState: await browser.proxy.settings.get({}),
        storage: redactStorage(await browser.storage.local.get(null)),
      };
      try {
        result.response = await browser.runtime.sendMessage({
          channel: 'zeroomega-nex/profile-workflow/v1',
          action: 'get',
        });
      } catch (sendError) {
        result.sendError = {
          message: sendError instanceof Error ? sendError.message : String(sendError),
          stack: sendError instanceof Error ? sendError.stack : undefined,
        };
      }
      result.storageAfterMessage = redactStorage(await browser.storage.local.get(null));
      done(result);
    })().catch((diagnosticError) => done({
      diagnosticError: diagnosticError instanceof Error
        ? { message: diagnosticError.message, stack: diagnosticError.stack }
        : String(diagnosticError),
    }));
  `);
}

async function setControlValue(element, value) {
  await driver.executeScript(
    `
      const element = arguments[0];
      const value = arguments[1];
      const prototype = element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
      setter.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    `,
    element,
    value,
  );
}

async function hasOriginPermission(origin) {
  return driver.executeAsyncScript(
    `
      const origin = arguments[0];
      const done = arguments[1];
      browser.permissions.contains({ origins: [origin] }).then(done, (error) => done(String(error)));
    `,
    origin,
  );
}

async function firefoxTabIdForUrl(url) {
  const tabId = await driver.executeAsyncScript(
    `
      const targetUrl = arguments[0];
      const done = arguments[1];
      browser.tabs.query({}).then(
        (tabs) => done(tabs.find((tab) => tab.url === targetUrl)?.id),
        (error) => done({ error: String(error) }),
      );
    `,
    url,
  );
  assert.equal(typeof tabId, 'number', `Firefox tab ID was not resolved for ${url}`);
  return tabId;
}

async function readFirefoxActionState(tabId) {
  return driver.executeAsyncScript(
    `
      const tabId = arguments[0];
      const done = arguments[1];
      Promise.all([
        browser.action.getTitle({ tabId }),
        browser.action.getBadgeText({ tabId }),
        browser.action.getPopup({ tabId }),
      ]).then(
        ([title, badgeText, popup]) => done({ title, badgeText, popup }),
        (error) => done({ error: String(error) }),
      );
    `,
    tabId,
  );
}

async function localizedFirefoxActionState(
  currentProfileName,
  resultProfileName,
  detailMessageKey,
  popup,
  detailPrefix = '',
) {
  return driver.executeScript(
    `
      const currentProfileName = arguments[0];
      const resultProfileName = arguments[1];
      const detailMessageKey = arguments[2];
      const popup = arguments[3];
      const detailPrefix = arguments[4];
      const detail = detailPrefix + browser.i18n.getMessage(detailMessageKey);
      return {
        title: browser.i18n.getMessage('browserAction_titleWithResult', [
          currentProfileName,
          resultProfileName,
          detail,
        ]),
        badgeText: '',
        popup,
      };
    `,
    currentProfileName,
    resultProfileName,
    detailMessageKey,
    popup,
    detailPrefix,
  );
}

async function literalFirefoxActionState(currentProfileName, resultProfileName, details, popup) {
  return driver.executeScript(
    `
      return {
        title: browser.i18n.getMessage('browserAction_titleWithResult', [
          arguments[0],
          arguments[1],
          arguments[2],
        ]),
        badgeText: '',
        popup: arguments[3],
      };
    `,
    currentProfileName,
    resultProfileName,
    details,
    popup,
  );
}

async function waitForFirefoxActionState(tabId, expected, label) {
  let actual;
  try {
    await driver.wait(async () => {
      actual = await readFirefoxActionState(tabId);
      return JSON.stringify(actual) === JSON.stringify(expected);
    }, 20_000);
  } catch {
    assert.deepEqual(actual, expected, label);
  }
}

async function readFirefoxGlobalActionState() {
  return driver.executeAsyncScript(`
    const done = arguments[0];
    Promise.all([
      browser.action.getTitle({}),
      browser.action.getBadgeText({}),
      browser.action.getPopup({}),
    ]).then(
      ([title, badgeText, popup]) => done({ title, badgeText, popup }),
      (error) => done({ error: String(error) }),
    );
  `);
}

async function waitForFirefoxGlobalActionState(expected, label) {
  let actual;
  try {
    await driver.wait(async () => {
      actual = await readFirefoxGlobalActionState();
      return JSON.stringify(actual) === JSON.stringify(expected);
    }, 20_000);
  } catch {
    assert.deepEqual(actual, expected, label);
  }
}

async function sendFirefoxWorkflowCommand(command) {
  return driver.executeAsyncScript(
    `
      const command = arguments[0];
      const done = arguments[1];
      browser.runtime.sendMessage(command).then(done, (error) => done({ error: String(error) }));
    `,
    command,
  );
}

async function logDiagnostics(stage) {
  console.error(`[Firefox ${stage} URL] ${await driver.getCurrentUrl()}`);
  console.error(`[Firefox ${stage} title] ${await driver.getTitle()}`);
  console.error(
    `[Firefox ${stage} body] ${await driver.executeScript('return document.body?.innerText ?? "";')}`,
  );
  console.error(`[Firefox ${stage} runtime] ${JSON.stringify(await runtimeDiagnostics())}`);
}

try {
  const installResult = await bidiCommand('webExtension.install', {
    extensionData: { type: 'path', path: extensionPath },
    'moz:allowPrivateBrowsing': true,
  });
  const installedId = installResult?.extension;
  assert.equal(installedId, addonId, 'Firefox returned an unexpected add-on ID');

  await navigateExtensionPage('options.html');
  const optionsWindow = await driver.getWindowHandle();
  let profileHeading;
  try {
    const aboutHeading = await driver.wait(
      until.elementLocated(By.xpath("//h1[normalize-space(.)='關於']")),
      15_000,
    );
    await driver.wait(until.elementIsVisible(aboutHeading), 15_000);
    const proxyButton = await driver.wait(
      until.elementLocated(By.xpath("//button[normalize-space(.)='proxy']")),
      15_000,
    );
    await proxyButton.click();
    profileHeading = await driver.wait(
      until.elementLocated(By.xpath("//h1[normalize-space(.)='proxy']")),
      15_000,
    );
    await driver.wait(until.elementIsVisible(profileHeading), 15_000);
    assert.equal(
      (await driver.findElements(By.css('[data-fixed-protocol-capabilities]'))).length,
      0,
      'Fixed editor exposed engineering capability documentation',
    );
    const protocolValues = await driver.executeScript(`
      return [...document.querySelector('[data-proxy-scheme="fallback"] [data-proxy-field="protocol"]').options]
        .map((option) => option.value)
        .filter(Boolean);
    `);
    assert.deepEqual(protocolValues, ['http', 'https', 'socks4', 'socks5']);
  } catch (error) {
    await logDiagnostics('Options initialization');
    console.error(`[Firefox Options source] ${(await driver.getPageSource()).slice(0, 20_000)}`);
    throw error;
  }
  assert.equal(
    await driver.executeAsyncScript(`
      const done = arguments[0];
      browser.extension.isAllowedIncognitoAccess().then(done, (error) => done(String(error)));
    `),
    true,
    'Firefox BiDi installation did not grant private browsing access',
  );
  assert.equal(
    await hasOriginPermission(remotePermissionOrigin),
    false,
    'Firefox remote source origin must remain optional before a user action',
  );

  const toolbarPopup = `moz-extension://${extensionUuid}/popup-iframe.html`;
  const routeSystem = await driver.executeScript(
    "return `[${browser.i18n.getMessage('routeSystem')}]`;",
  );
  const routeDirect = await driver.executeScript(
    "return `[${browser.i18n.getMessage('routeDirect')}]`;",
  );
  const systemAction = await localizedFirefoxActionState(
    routeSystem,
    routeSystem,
    'browserAction_titleExternalProxy',
    toolbarPopup,
  );
  await waitForFirefoxGlobalActionState(
    systemAction,
    'Firefox global System Action baseline failed before new-tab creation',
  );
  const defaultAction = {
    title: await driver.executeScript(
      "return browser.i18n.getMessage('manifest_icon_default_title');",
    ),
    badgeText: '',
    popup: toolbarPopup,
  };

  const toolbarProxyUrl = `http://toolbar-a.test:${sourceAddress.port}/toolbar-a`;
  const toolbarBypassUrl = `http://localhost:${sourceAddress.port}/toolbar-b`;
  await driver.switchTo().newWindow('tab');
  await driver.get(toolbarProxyUrl);
  const toolbarProxyWindow = await driver.getWindowHandle();
  await driver.switchTo().newWindow('tab');
  await driver.get(toolbarBypassUrl);
  const toolbarBypassWindow = await driver.getWindowHandle();
  await driver.switchTo().newWindow('tab');
  const toolbarInternalWindow = await driver.getWindowHandle();
  await driver.switchTo().window(optionsWindow);

  const toolbarProxyTabId = await firefoxTabIdForUrl(toolbarProxyUrl);
  const toolbarBypassTabId = await firefoxTabIdForUrl(toolbarBypassUrl);
  const toolbarInternalTabId = await driver.wait(
    async () => {
      const tabId = await driver.executeAsyncScript(`
        const done = arguments[0];
        browser.tabs.query({}).then(
          (tabs) => done(tabs.find((tab) => tab.url === 'about:blank')?.id),
          (error) => done({ error: String(error) }),
        );
      `);
      return typeof tabId === 'number' ? tabId : false;
    },
    10_000,
    'Firefox about:blank internal tab ID was not resolved',
  );
  await waitForFirefoxActionState(
    toolbarProxyTabId,
    systemAction,
    'Firefox System proxy-tab Action state failed',
  );
  await waitForFirefoxActionState(
    toolbarBypassTabId,
    systemAction,
    'Firefox System bypass-tab Action state failed',
  );
  await waitForFirefoxActionState(
    toolbarInternalTabId,
    systemAction,
    'Firefox System internal-page Action state failed',
  );

  const initialWorkflow = await sendFirefoxWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'get',
  });
  assert.equal(
    initialWorkflow?.ok,
    true,
    `Firefox initial workflow failed: ${JSON.stringify(initialWorkflow)}`,
  );
  assert.deepEqual(initialWorkflow.runtime?.activeRoute, { kind: 'system' });
  const directActivation = await sendFirefoxWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'activate-route',
    expectedAppliedRevisionId: initialWorkflow.state.applied.revision.id,
    route: { kind: 'direct' },
  });
  assert.equal(
    directActivation?.ok,
    true,
    `Firefox Direct activation failed: ${JSON.stringify(directActivation)}`,
  );
  const directAction = await localizedFirefoxActionState(
    routeDirect,
    routeDirect,
    'browserAction_directResult',
    toolbarPopup,
  );
  await waitForFirefoxActionState(
    toolbarProxyTabId,
    directAction,
    'Firefox Direct proxy-tab Action state failed',
  );
  await waitForFirefoxActionState(
    toolbarBypassTabId,
    directAction,
    'Firefox Direct bypass-tab Action state failed',
  );

  if (toolbarOnly) {
    const current = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get',
    });
    assert.equal(current?.ok, true, `Firefox workflow refresh failed: ${JSON.stringify(current)}`);
    const draft = structuredClone(current.state.draft);
    const profile = draft.profiles.find((candidate) => candidate.id === 'profile-default-proxy');
    assert.equal(profile?.kind, 'fixed', 'Firefox default Fixed Profile was not found');
    profile.name = 'Toolbar Proxy';
    profile.color = '#64b5f6';
    profile.proxyByScheme = { fallback: 'endpoint-toolbar-e2e' };
    draft.proxyEndpoints = [
      {
        id: 'endpoint-toolbar-e2e',
        name: 'Toolbar E2E endpoint',
        protocol: 'http',
        host: '127.0.0.1',
        port: sourceAddress.port,
      },
    ];
    draft.settings.interface.showResultProfileOnActionBadgeText = true;

    const replaced = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'replace-draft',
      expectedGeneration: current.state.generation,
      draft,
    });
    assert.equal(
      replaced?.ok,
      true,
      `Firefox draft replacement failed: ${JSON.stringify(replaced)}`,
    );
    const applied = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'apply',
      expectedGeneration: replaced.state.generation,
    });
    assert.equal(applied?.ok, true, `Firefox Fixed Apply failed: ${JSON.stringify(applied)}`);
    const activated = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: applied.state.applied.revision.id,
      route: { kind: 'profile', profileId: 'profile-default-proxy' },
    });
    assert.equal(
      activated?.ok,
      true,
      `Firefox Fixed activation failed: ${JSON.stringify(activated)}`,
    );

    const fixedProxyAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Proxy',
        'Toolbar Proxy',
        `PROXY 127.0.0.1:${sourceAddress.port}\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    const localizedDirectResult = await driver.executeScript(
      "return browser.i18n.getMessage('browserAction_directResult');",
    );
    const fixedBypassAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Proxy',
        'Toolbar Proxy',
        `localhost => ${localizedDirectResult}\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      fixedProxyAction,
      'Firefox focused Fixed proxy Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarBypassTabId,
      fixedBypassAction,
      'Firefox focused Fixed bypass Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarInternalTabId,
      defaultAction,
      'Firefox focused internal-page fallback Action state failed',
    );

    const sameTabBypassUrl = `http://localhost:${sourceAddress.port}/toolbar-same-tab-bypass`;
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(sameTabBypassUrl);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      fixedBypassAction,
      'Firefox focused same-tab proxy-to-bypass transition failed',
    );
    const sameTabProxyUrl = `http://toolbar-a.test:${sourceAddress.port}/toolbar-same-tab-proxy`;
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(sameTabProxyUrl);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      fixedProxyAction,
      'Firefox focused same-tab bypass-to-proxy transition failed',
    );

    const switchCurrent = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get',
    });
    assert.equal(
      switchCurrent?.ok,
      true,
      `Firefox Switch workflow refresh failed: ${JSON.stringify(switchCurrent)}`,
    );
    const switchDraft = structuredClone(switchCurrent.state.draft);
    const switchFixed = switchDraft.profiles.find(
      (candidate) => candidate.id === 'profile-default-proxy',
    );
    assert.equal(switchFixed?.kind, 'fixed', 'Firefox Switch target Fixed Profile was not found');
    switchFixed.bypass = [];
    switchDraft.profiles.push({
      id: 'profile-toolbar-switch',
      name: 'Toolbar Switch',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-toolbar-a',
          condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
          route: { kind: 'profile', profileId: 'profile-default-proxy' },
        },
        {
          id: 'rule-toolbar-direct',
          condition: { kind: 'host-wildcard', pattern: 'localhost' },
          route: { kind: 'direct' },
        },
      ],
      defaultRoute: { kind: 'direct' },
    });
    switchDraft.settings.quickSwitch.routes.push({
      kind: 'profile',
      profileId: 'profile-toolbar-switch',
    });
    const switchReplaced = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'replace-draft',
      expectedGeneration: switchCurrent.state.generation,
      draft: switchDraft,
    });
    assert.equal(
      switchReplaced?.ok,
      true,
      `Firefox Switch draft replacement failed: ${JSON.stringify(switchReplaced)}`,
    );
    const switchApplied = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'apply',
      expectedGeneration: switchReplaced.state.generation,
    });
    assert.equal(
      switchApplied?.ok,
      true,
      `Firefox Switch Apply failed: ${JSON.stringify(switchApplied)}`,
    );
    const switchActivated = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: switchApplied.state.applied.revision.id,
      route: { kind: 'profile', profileId: 'profile-toolbar-switch' },
    });
    assert.equal(
      switchActivated?.ok,
      true,
      `Firefox Switch activation failed: ${JSON.stringify(switchActivated)}`,
    );

    const defaultDetail = await driver.executeScript(
      "return browser.i18n.getMessage('browserAction_defaultRuleDetails');",
    );
    const switchMatchedAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Switch',
        'Toolbar Proxy',
        `toolbar-a.test => Toolbar Proxy\nPROXY 127.0.0.1:${sourceAddress.port}\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    const switchDirectMatchedAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Switch',
        routeDirect,
        `localhost => ${routeDirect}\n`,
        toolbarPopup,
      )),
      badgeText: 'Dire',
    };
    const switchDirectDefaultAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Switch',
        routeDirect,
        `${defaultDetail} => ${routeDirect}\n`,
        toolbarPopup,
      )),
      badgeText: 'Dire',
    };
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      switchMatchedAction,
      'Firefox focused Switch matched-rule Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarBypassTabId,
      switchDirectMatchedAction,
      'Firefox focused Switch matched-Direct Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarInternalTabId,
      defaultAction,
      'Firefox focused Switch internal-page fallback Action state failed',
    );

    const switchDefaultDirectUrl = `http://127.0.0.1:${sourceAddress.port}/toolbar-switch-default-direct`;
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(switchDefaultDirectUrl);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      switchDirectDefaultAction,
      'Firefox focused Switch same-tab Fixed-to-default-Direct transition failed',
    );
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(sameTabProxyUrl);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      switchMatchedAction,
      'Firefox focused Switch same-tab default-Direct-to-Fixed transition failed',
    );

    const virtualCurrent = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get',
    });
    assert.equal(
      virtualCurrent?.ok,
      true,
      `Firefox Virtual workflow refresh failed: ${JSON.stringify(virtualCurrent)}`,
    );
    const virtualDraft = structuredClone(virtualCurrent.state.draft);
    const virtualFixed = virtualDraft.profiles.find(
      (candidate) => candidate.id === 'profile-default-proxy',
    );
    assert.equal(virtualFixed?.kind, 'fixed', 'Firefox Virtual target Fixed Profile was not found');
    virtualFixed.bypass = [{ id: 'bypass-toolbar-localhost', pattern: 'localhost' }];
    virtualDraft.profiles.push(
      {
        id: 'profile-toolbar-virtual-fixed',
        name: 'Toolbar Virtual',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      },
      {
        id: 'profile-toolbar-virtual-direct',
        name: 'Toolbar Virtual Direct',
        kind: 'virtual',
        targetRoute: { kind: 'direct' },
      },
    );
    virtualDraft.settings.quickSwitch.routes.push(
      { kind: 'profile', profileId: 'profile-toolbar-virtual-fixed' },
      { kind: 'profile', profileId: 'profile-toolbar-virtual-direct' },
    );
    const virtualReplaced = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'replace-draft',
      expectedGeneration: virtualCurrent.state.generation,
      draft: virtualDraft,
    });
    assert.equal(
      virtualReplaced?.ok,
      true,
      `Firefox Virtual draft replacement failed: ${JSON.stringify(virtualReplaced)}`,
    );
    const virtualApplied = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'apply',
      expectedGeneration: virtualReplaced.state.generation,
    });
    assert.equal(
      virtualApplied?.ok,
      true,
      `Firefox Virtual Apply failed: ${JSON.stringify(virtualApplied)}`,
    );
    const virtualFixedActivated = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: virtualApplied.state.applied.revision.id,
      route: { kind: 'profile', profileId: 'profile-toolbar-virtual-fixed' },
    });
    assert.equal(
      virtualFixedActivated?.ok,
      true,
      `Firefox Virtual Fixed activation failed: ${JSON.stringify(virtualFixedActivated)}`,
    );

    const virtualFixedProxyAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Virtual [Toolbar Proxy]',
        'Toolbar Proxy',
        `PROXY 127.0.0.1:${sourceAddress.port}\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    const virtualFixedBypassAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Virtual [Toolbar Proxy]',
        'Toolbar Proxy',
        'localhost => DIRECT\n',
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      virtualFixedProxyAction,
      'Firefox focused Virtual-to-Fixed proxy Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarBypassTabId,
      virtualFixedBypassAction,
      'Firefox focused Virtual-to-Fixed bypass Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarInternalTabId,
      defaultAction,
      'Firefox focused Virtual-to-Fixed internal-page fallback failed',
    );

    const virtualDirectActivated = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: virtualApplied.state.applied.revision.id,
      route: { kind: 'profile', profileId: 'profile-toolbar-virtual-direct' },
    });
    assert.equal(
      virtualDirectActivated?.ok,
      true,
      `Firefox Virtual Direct activation failed: ${JSON.stringify(virtualDirectActivated)}`,
    );
    const virtualDirectAction = {
      ...(await literalFirefoxActionState(
        `Toolbar Virtual Direct [${routeDirect}]`,
        routeDirect,
        localizedDirectResult,
        toolbarPopup,
      )),
      badgeText: 'Dire',
    };
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      virtualDirectAction,
      'Firefox focused Virtual-to-Direct proxy-tab Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarBypassTabId,
      virtualDirectAction,
      'Firefox focused Virtual-to-Direct bypass-tab Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarInternalTabId,
      defaultAction,
      'Firefox focused Virtual-to-Direct internal-page fallback failed',
    );

    assert.notEqual(toolbarBypassWindow, toolbarProxyWindow);
    assert.notEqual(toolbarInternalWindow, toolbarProxyWindow);
    console.log(`Firefox toolbar Action E2E passed for ${installedId}.`);
    throw toolbarOnlyComplete;
  }

  const fixedTable = await driver.wait(
    until.elementLocated(By.css('[data-fixed-proxy-table]')),
    15_000,
  );
  const fallbackRow = await fixedTable.findElement(By.css('[data-proxy-scheme="fallback"]'));
  const fallbackProtocol = await fallbackRow.findElement(By.css('[data-proxy-field="protocol"]'));
  const fallbackServer = await fallbackRow.findElement(By.css('[data-proxy-field="server"]'));
  const fallbackPort = await fallbackRow.findElement(By.css('[data-proxy-field="port"]'));
  await setControlValue(fallbackProtocol, 'http');
  await driver.wait(async () => (await fallbackPort.getAttribute('value')) === '80', 10_000);
  await setControlValue(fallbackServer, authProxy.host);
  await driver.wait(
    until.elementIsEnabled(fallbackPort),
    10_000,
    'Firefox port input did not re-enable after committing the proxy host',
  );
  await setControlValue(fallbackPort, String(authProxy.port));
  await driver.wait(
    async () => (await fallbackPort.getAttribute('value')) === String(authProxy.port),
    10_000,
    'Firefox port input did not retain the dynamic proxy port',
  );
  await driver.wait(
    async () =>
      driver.executeAsyncScript(
        `
          const expectedHost = arguments[0];
          const expectedPort = arguments[1];
          const done = arguments[2];
          browser.runtime.sendMessage({
            channel: 'zeroomega-nex/profile-workflow/v1',
            action: 'get',
          }).then((response) => done(Boolean(
            response?.ok && response.state?.draft?.proxyEndpoints?.some(
              (endpoint) => endpoint.host === expectedHost && endpoint.port === expectedPort,
            )
          )), (error) => done(String(error)));
        `,
        authProxy.host,
        authProxy.port,
      ),
    15_000,
    'Firefox Fixed editor did not persist the dynamic proxy endpoint before authentication',
  );
  const authenticationButton = await fallbackRow.findElement(
    By.css('[data-proxy-action="authentication"]'),
  );
  await driver.wait(until.elementIsEnabled(authenticationButton), 10_000);
  await authenticationButton.click();
  const authDialog = await driver.wait(
    until.elementLocated(By.css('[data-fixed-auth-dialog]')),
    10_000,
  );
  const authInputs = await authDialog.findElements(By.css('input'));
  assert.equal(authInputs.length >= 2, true, 'Firefox authentication dialog inputs are missing');
  await setControlValue(authInputs[0], proxyAuthUsername);
  await setControlValue(authInputs[1], proxyAuthPassword);
  const saveAuthentication = await authDialog.findElement(By.css('[data-auth-action="save"]'));
  await driver.wait(until.elementIsEnabled(saveAuthentication), 10_000);
  await saveAuthentication.click();
  await driver.wait(until.stalenessOf(authDialog), 10_000);

  const apply = await driver.wait(until.elementLocated(By.css('.actions button.primary')), 15_000);
  await driver.wait(until.elementIsEnabled(apply), 15_000);
  await apply.click();
  try {
    await driver.wait(
      async () => {
        const response = await sendFirefoxWorkflowCommand({
          channel: 'zeroomega-nex/profile-workflow/v1',
          action: 'get',
        });
        return Boolean(
          response?.ok && response.view?.dirty === false && response.view?.busy !== true,
        );
      },
      45_000,
      'Firefox Apply did not reach a clean workflow state',
    );
  } catch (error) {
    await logDiagnostics('Apply');
    throw error;
  }
  assert.equal(
    await driver.executeAsyncScript(`
      const done = arguments[0];
      browser.permissions.contains({
        permissions: ['webRequest', 'webRequestBlocking'],
        origins: ['http://*/*', 'https://*/*'],
      }).then(done, (error) => done(String(error)));
    `),
    true,
    'Firefox Apply did not grant proxy-authentication permissions',
  );
  assert.equal(
    (await driver.findElements(By.css('input[aria-label="情境模式名稱"]'))).length,
    0,
    'Firefox still exposed the removed inline profile-name field',
  );
  const renameAction = await driver.findElement(By.css('[data-profile-rename-action]'));
  await renameAction.click();
  const renameDialog = await driver.wait(
    until.elementLocated(By.css('[data-profile-rename-dialog]')),
    10_000,
  );
  const renameInput = await renameDialog.findElement(By.css('[data-profile-rename-name-input]'));
  assert.equal(await renameInput.getAttribute('value'), 'proxy');
  await setControlValue(renameInput, 'Firefox E2E Proxy');
  const renameConfirm = await renameDialog.findElement(By.css('[data-profile-rename-confirm]'));
  await driver.wait(until.elementIsEnabled(renameConfirm), 10_000);
  await renameConfirm.click();
  await driver.wait(until.stalenessOf(renameDialog), 10_000);
  await driver.wait(
    until.elementLocated(By.xpath("//h1[normalize-space(.)='Firefox E2E Proxy']")),
    10_000,
  );
  await driver.wait(until.elementIsEnabled(apply), 15_000);
  await apply.click();
  await driver.wait(
    async () =>
      driver.executeAsyncScript(`
        const done = arguments[0];
        browser.runtime.sendMessage({
          channel: 'zeroomega-nex/profile-workflow/v1',
          action: 'get',
        }).then((response) => {
          const draft = response?.state?.draft?.profiles?.find(
            (profile) => profile.id === 'profile-default-proxy',
          );
          const applied = response?.state?.applied?.profiles?.find(
            (profile) => profile.id === 'profile-default-proxy',
          );
          done(draft?.name === 'Firefox E2E Proxy' && applied?.name === 'Firefox E2E Proxy');
        }, (error) => done(String(error)));
      `),
    20_000,
    'Firefox Rename did not commit through normal Apply',
  );

  await navigateExtensionPage('popup.html');
  const customProfile = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., 'Firefox E2E Proxy')]")),
    15_000,
  );
  await customProfile.click();
  await driver.wait(until.elementIsDisabled(customProfile), 20_000);

  const fixedProxyAction = await literalFirefoxActionState(
    'Firefox E2E Proxy',
    'Firefox E2E Proxy',
    `PROXY ${authProxy.host}:${authProxy.port}
`,
    toolbarPopup,
  );
  const localizedDirectResult = await driver.executeScript(
    "return browser.i18n.getMessage('browserAction_directResult');",
  );
  const fixedBypassAction = await literalFirefoxActionState(
    'Firefox E2E Proxy',
    routeDirect,
    `localhost => ${localizedDirectResult}
`,
    toolbarPopup,
  );
  await waitForFirefoxActionState(
    toolbarProxyTabId,
    fixedProxyAction,
    'Firefox Fixed proxy Action state failed',
  );
  await waitForFirefoxActionState(
    toolbarBypassTabId,
    fixedBypassAction,
    'Firefox Fixed bypass Action state failed',
  );

  await driver.get(authProxy.targetUrl);
  const authenticatedMarker = await driver.wait(
    until.elementLocated(By.css('[data-proxy-auth-success]')),
    20_000,
  );
  assert.equal(await authenticatedMarker.getText(), authProxy.marker);
  const firefoxProxyStats = authProxy.stats();
  assert.equal(
    firefoxProxyStats.unauthorizedCount >= 1,
    true,
    'Firefox proxy never emitted a real 407 challenge',
  );
  assert.equal(
    firefoxProxyStats.authorizedCount >= 1 && firefoxProxyStats.targetAuthorizedCount >= 1,
    true,
    'Firefox did not retry the target with extension-supplied proxy credentials',
  );

  await navigateExtensionPage('popup.html');
  const direct = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., '直接連線')]")),
    15_000,
  );
  await direct.click();
  await driver.wait(until.elementIsDisabled(direct), 15_000);
  assert.equal(
    (await driver.findElements(By.css('[data-popup-result-profile]'))).length,
    0,
    'Inactive default Switch exposed a result selector in the Direct Popup state',
  );
  assert.equal(
    (await driver.findElements(By.css('.profile-result-label'))).length,
    0,
    'Inactive default Switch exposed a result label in the Direct Popup state',
  );
  assert.equal(
    await driver.executeAsyncScript(`
      const done = arguments[0];
      browser.permissions.remove({
        permissions: ['webRequest', 'webRequestBlocking'],
        origins: ['http://*/*', 'https://*/*'],
      }).then(done, (error) => done(String(error)));
    `),
    true,
    'Firefox could not remove the broad proxy-authentication permission after returning Direct',
  );
  assert.equal(
    await driver.executeAsyncScript(`
      const done = arguments[0];
      browser.permissions.contains({
        permissions: ['webRequest', 'webRequestBlocking'],
        origins: ['http://*/*', 'https://*/*'],
      }).then(done, (error) => done(String(error)));
    `),
    false,
    'Firefox broad proxy-authentication permission remained after returning Direct',
  );

  await navigateExtensionPage('temp-rules.html');
  await driver.wait(
    until.elementLocated(By.css('[data-temp-rules-manager][data-typed-locale="zh-TW"]')),
    15_000,
  );
  await driver.wait(until.elementLocated(By.xpath("//h1[normalize-space(.)='暫時規則']")), 15_000);
  await driver.wait(
    until.elementLocated(By.xpath("//*[normalize-space(.)='目前沒有作用中的暫時規則。']")),
    15_000,
  );

  await navigateExtensionPage('network.html');
  await driver.wait(
    until.elementLocated(By.css('[data-network-diagnostics][data-typed-locale="zh-TW"]')),
    15_000,
  );
  await driver.wait(until.elementLocated(By.xpath("//h1[normalize-space(.)='請求診斷']")), 15_000);
  await driver.wait(
    until.elementLocated(By.xpath("//button[normalize-space(.)='開始監控']")),
    15_000,
  );
  await driver.wait(until.elementLocated(By.css('[data-request-diagnostics-stopped]')), 15_000);

  await navigateExtensionPage('options.html#/import');
  const onlineRestorePanel = await driver.wait(
    until.elementLocated(
      By.css('[data-legacy-import-source][data-typed-locale="zh-TW"] [data-legacy-online-restore]'),
    ),
    15_000,
  );
  await driver.wait(until.elementIsVisible(onlineRestorePanel), 15_000);
  assert.equal(
    await hasOriginPermission(onlineBackupPermissionOrigin),
    false,
    'Firefox online-backup origin must remain optional before Restore',
  );
  const onlineRestoreBefore = await driver.executeAsyncScript(`
    const done = arguments[0];
    browser.storage.local.get('zeroomega-nex/profile-workflow/v1/state').then((values) => {
      const workflow = values['zeroomega-nex/profile-workflow/v1/state'];
      done({
        generation: workflow?.generation,
        applied: JSON.stringify(workflow?.applied),
        draft: JSON.stringify(workflow?.draft),
      });
    }, (error) => done({ error: String(error) }));
  `);
  const onlineBackupInput = await onlineRestorePanel.findElement(
    By.css('[data-legacy-online-url]'),
  );
  await setControlValue(onlineBackupInput, onlineBackupUrl);
  const onlineRestore = await onlineRestorePanel.findElement(
    By.css('[data-legacy-online-download]'),
  );
  await driver.wait(until.elementIsEnabled(onlineRestore), 10_000);
  await onlineRestore.click();
  await driver.wait(until.elementLocated(By.css('[data-legacy-online-status]')), 20_000);
  await driver.wait(
    until.elementLocated(By.xpath("//h2[normalize-space(.)='相容性檢查']")),
    20_000,
  );
  assert.equal(
    await hasOriginPermission(onlineBackupPermissionOrigin),
    true,
    'Firefox did not retain the online-backup origin after Restore',
  );
  assert.equal(onlineBackupRequestCount, 1, 'Firefox online restore did not perform one request');
  const onlineRestoreAfter = await driver.executeAsyncScript(`
    const done = arguments[0];
    browser.storage.local.get('zeroomega-nex/profile-workflow/v1/state').then((values) => {
      const workflow = values['zeroomega-nex/profile-workflow/v1/state'];
      done({
        generation: workflow?.generation,
        applied: JSON.stringify(workflow?.applied),
        draft: JSON.stringify(workflow?.draft),
      });
    }, (error) => done({ error: String(error) }));
  `);
  assert.deepEqual(
    onlineRestoreAfter,
    onlineRestoreBefore,
    'Downloading an online backup changed the Firefox workflow before explicit import',
  );

  await navigateExtensionPage('options.html');
  const interfaceAction = await driver.wait(
    until.elementLocated(By.css('[data-interface-action]')),
    15_000,
  );
  await interfaceAction.click();
  const advancedConditionsSetting = await driver.wait(
    until.elementLocated(By.css('[data-show-advanced-conditions-setting]')),
    15_000,
  );
  if (!(await advancedConditionsSetting.isSelected())) await advancedConditionsSetting.click();

  const newRuleProfileAction = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-action]')),
    15_000,
  );
  await driver.wait(until.elementIsEnabled(newRuleProfileAction), 10_000);
  await newRuleProfileAction.click();
  const newRuleName = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-name-input]')),
    15_000,
  );
  await setControlValue(newRuleName, 'Firefox Rule Source E2E');
  const switchChoice = await driver.findElement(By.css('[data-new-profile-kind="switch"]'));
  await switchChoice.click();
  const createSwitch = await driver.findElement(By.css('[data-new-profile-create]'));
  await driver.wait(until.elementIsEnabled(createSwitch), 10_000);
  await createSwitch.click();
  await driver.wait(
    async () => (await driver.findElements(By.css('.new-profile-dialog'))).length === 0,
    20_000,
    'Firefox Switch creation dialog did not close',
  );
  await driver.wait(
    until.elementLocated(By.xpath("//h1[normalize-space(.)='Firefox Rule Source E2E']")),
    20_000,
  );
  await driver.wait(
    async () =>
      driver.executeAsyncScript(`
      const done = arguments[0];
      browser.storage.local.get('zeroomega-nex/profile-workflow/v1/state').then((values) => {
        const workflow = values['zeroomega-nex/profile-workflow/v1/state'];
        const selected = workflow?.draft?.profiles?.find(
          (candidate) => candidate.id === workflow?.selectedProfileId,
        );
        done(Boolean(
          selected?.kind === 'switch' &&
          selected.name === 'Firefox Rule Source E2E' &&
          selected.attachedRuleListProfileId === undefined
        ));
      }, (error) => done(String(error)));
    `),
    20_000,
    'Firefox newly created Switch profile did not settle before condition editing',
  );
  const switchRulesTable = await driver.wait(
    until.elementLocated(By.css('[data-switch-rules-table]')),
    20_000,
  );
  await switchRulesTable.findElement(By.css('.add-condition-row button')).click();
  const conditionRow = await driver.wait(
    until.elementLocated(By.css('[data-switch-rule-row]')),
    15_000,
  );
  const conditionSelect = await conditionRow.findElement(By.css('[data-switch-condition-select]'));
  await driver.wait(
    async () =>
      Number(
        await driver.executeScript(
          `return arguments[0].querySelectorAll('option').length;`,
          conditionSelect,
        ),
      ) === 10,
    10_000,
  );
  const originalConditionKinds = await driver.executeScript(
    `return [...arguments[0].querySelectorAll('option')].map((option) => option.value);`,
    conditionSelect,
  );
  assert.deepEqual(originalConditionKinds, [
    'host-wildcard',
    'host-regex',
    'host-levels',
    'ip',
    'url-wildcard',
    'url-regex',
    'keyword',
    'weekday',
    'time',
    'false',
  ]);
  assert.equal(
    await driver.executeScript(
      `return arguments[0].querySelectorAll('option[value="true"], option[value="bypass"]').length;`,
      conditionSelect,
    ),
    0,
    'Firefox ordinary Switch selector exposed source-only conditions',
  );
  const firefoxDraftCondition = async () =>
    driver.executeAsyncScript(`
      const done = arguments[0];
      browser.storage.local.get('zeroomega-nex/profile-workflow/v1/state').then((values) => {
        const workflow = values['zeroomega-nex/profile-workflow/v1/state'];
        const profile = workflow?.draft?.profiles?.find(
          (candidate) => candidate.name === 'Firefox Rule Source E2E',
        );
        done(profile?.kind === 'switch' ? profile.rules?.[0]?.condition : undefined);
      }, (error) => done({ error: String(error) }));
    `);
  const selectFirefoxCondition = async (kind) => {
    const currentSelect = await driver.wait(
      until.elementLocated(By.css('[data-switch-rule-row] [data-switch-condition-select]')),
      10_000,
    );
    await setControlValue(currentSelect, kind);
    await driver.wait(async () => (await firefoxDraftCondition())?.kind === kind, 10_000);
  };

  await selectFirefoxCondition('ip');
  const ipNetwork = await driver.wait(
    until.elementLocated(By.css('[data-switch-condition-field="ipNetwork"]')),
    10_000,
  );
  assert.equal(await ipNetwork.getAttribute('placeholder'), '127.0.0.1/8');
  await setControlValue(ipNetwork, '198.51.100.0/24');
  await driver.wait(async () => {
    const condition = await firefoxDraftCondition();
    return (
      condition?.kind === 'ip' &&
      condition.address === '198.51.100.0' &&
      condition.prefixLength === 24
    );
  }, 10_000);
  await selectFirefoxCondition('false');
  await driver.wait(until.elementLocated(By.css('[data-switch-false-condition]')), 10_000);
  await selectFirefoxCondition('host-wildcard');
  const hostPattern = await driver.wait(
    until.elementLocated(By.css('[data-switch-condition-field="pattern"]')),
    10_000,
  );
  await setControlValue(hostPattern, '*.firefox-condition.example.invalid');

  const attachRuleListSection = await driver.wait(
    until.elementLocated(By.css('[data-attach-rule-list-section]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(attachRuleListSection), 10_000);
  const attachRuleListButton = await attachRuleListSection.findElement(By.css('button'));
  await driver.wait(until.elementIsEnabled(attachRuleListButton), 10_000);
  await attachRuleListButton.click();
  await driver.wait(
    async () =>
      driver.executeAsyncScript(`
      const done = arguments[0];
      browser.storage.local.get('zeroomega-nex/profile-workflow/v1/state').then((values) => {
        const workflow = values['zeroomega-nex/profile-workflow/v1/state'];
        const selected = workflow?.draft?.profiles?.find(
          (candidate) => candidate.id === workflow?.selectedProfileId,
        );
        const attached = selected?.attachedRuleListProfileId
          ? workflow?.draft?.profiles?.find(
              (candidate) => candidate.id === selected.attachedRuleListProfileId,
            )
          : undefined;
        done(Boolean(selected?.kind === 'switch' && attached?.kind === 'rule-list'));
      }, (error) => done(String(error)));
    `),
    20_000,
    'Firefox Rule List attachment did not settle in Draft',
  );
  const attachedRuleList = await driver.wait(
    until.elementLocated(By.css('[data-attached-rule-list-config][data-typed-locale="zh-TW"]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(attachedRuleList), 10_000);
  const attachedSourceType = await attachedRuleList.findElement(By.css('select'));
  await setControlValue(attachedSourceType, 'url');
  const attachedUrl = await driver.wait(
    until.elementLocated(By.css('[data-attached-rule-list-config] input[type="url"]')),
    15_000,
  );
  await setControlValue(attachedUrl, remoteRuleUrl);
  const ruleDownload = await driver.wait(
    until.elementLocated(By.css('[data-rule-source-update-now]')),
    15_000,
  );
  await driver.wait(until.elementIsEnabled(ruleDownload), 15_000);
  await ruleDownload.click();
  await driver.wait(async () => {
    const statuses = await driver.findElements(By.css('[data-rule-source-update-status]'));
    return statuses.length > 0 && (await statuses[0].getText()).includes('規則清單最後更新於');
  }, 20_000);
  const downloadedRuleText = await driver.wait(
    until.elementLocated(By.css('[data-attached-rule-list-config] textarea[readonly]')),
    15_000,
  );
  assert.equal(await downloadedRuleText.getProperty('value'), remoteRuleText);
  assert.equal(
    await hasOriginPermission(remotePermissionOrigin),
    true,
    'Firefox did not retain the optional source origin after the user-triggered Rule Source download',
  );
  const ruleRuntime = await driver.executeAsyncScript(
    `
      const url = arguments[0];
      const done = arguments[1];
      browser.storage.local.get(null).then((storage) => {
        const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
        const source = workflow?.draft?.ruleSources?.find((candidate) => candidate.location?.url === url);
        done({
          content: source?.location?.content,
          lastSuccessAt: source ? workflow?.ruleSourceUpdates?.[source.id]?.lastSuccessAt : undefined,
          lastError: source ? workflow?.ruleSourceUpdates?.[source.id]?.lastError : undefined,
        });
      }, (error) => done({ error: String(error) }));
    `,
    remoteRuleUrl,
  );
  assert.equal(ruleRuntime.content, remoteRuleText, 'Firefox Rule Source cache was not persisted');
  assert.equal(typeof ruleRuntime.lastSuccessAt, 'string');
  assert.equal(
    ruleRuntime.lastError == null,
    true,
    'Firefox Rule Source update recorded an unexpected error',
  );

  const newPacProfileAction = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-action]')),
    15_000,
  );
  await driver.wait(until.elementIsEnabled(newPacProfileAction), 10_000);
  await newPacProfileAction.click();
  const newPacName = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-name-input]')),
    15_000,
  );
  await setControlValue(newPacName, 'Firefox PAC E2E');
  const pacChoice = await driver.findElement(By.css('[data-new-profile-kind="pac"]'));
  await pacChoice.click();
  await driver.wait(async () => pacChoice.isSelected(), 5_000);
  const createPac = await driver.findElement(By.css('[data-new-profile-create]'));
  await driver.wait(until.elementIsEnabled(createPac), 10_000);
  await createPac.click();
  let pacEditor;
  try {
    await driver.wait(
      async () => (await driver.findElements(By.css('.new-profile-dialog'))).length === 0,
      20_000,
    );
    pacEditor = await driver.wait(
      until.elementLocated(By.css('[data-pac-profile-editor][data-typed-locale="zh-TW"]')),
      20_000,
    );
  } catch (error) {
    await logDiagnostics('remote PAC creation');
    throw error;
  }
  await driver.wait(until.elementIsVisible(pacEditor), 20_000);
  await driver.wait(until.elementLocated(By.xpath("//h2[normalize-space(.)='PAC 網址']")), 15_000);
  const pacUrl = await driver.wait(
    until.elementLocated(By.css('[data-pac-url-section] input[aria-label="PAC 網址"]')),
    15_000,
  );
  await setControlValue(pacUrl, remotePacUrl);
  const pacDownload = await driver.wait(
    until.elementLocated(By.css('[data-pac-source-update-now]')),
    15_000,
  );
  await driver.wait(until.elementIsEnabled(pacDownload), 15_000);
  await pacDownload.click();
  await driver.wait(async () => {
    const statuses = await driver.findElements(By.css('[data-pac-source-update-status]'));
    return statuses.length > 0 && (await statuses[0].getText()).includes('PAC 指令碼最後更新時間');
  }, 20_000);
  const pacScript = await driver.wait(
    until.elementLocated(By.css('[data-pac-script-section] textarea[aria-label="PAC 指令碼"]')),
    15_000,
  );
  assert.equal(await pacScript.getProperty('value'), remotePacText);
  assert.equal(await pacScript.getProperty('readOnly'), true);
  const pacDraftRuntime = await driver.executeAsyncScript(
    `
      const url = arguments[0];
      const done = arguments[1];
      browser.storage.local.get(null).then((storage) => {
        const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
        const profile = workflow?.draft?.profiles?.find((candidate) => candidate.source?.url === url);
        const update = profile ? workflow?.ruleSourceUpdates?.['pac:' + profile.id] : undefined;
        done({ script: profile?.source?.script, lastSuccessAt: update?.lastSuccessAt, lastError: update?.lastError });
      }, (error) => done({ error: String(error) }));
    `,
    remotePacUrl,
  );
  assert.equal(pacDraftRuntime.script, remotePacText, 'Firefox PAC cache was not persisted');
  assert.equal(typeof pacDraftRuntime.lastSuccessAt, 'string');
  assert.equal(
    pacDraftRuntime.lastError == null,
    true,
    'Firefox PAC update recorded an unexpected error',
  );
  assert.equal(
    ruleRequestCount,
    1,
    'Firefox Rule Source server received an unexpected request count',
  );
  assert.equal(pacRequestCount, 1, 'Firefox PAC server received an unexpected request count');

  const pacApply = await driver.wait(
    until.elementLocated(By.css('.actions button.primary')),
    15_000,
  );
  await driver.wait(until.elementIsEnabled(pacApply), 15_000);
  await pacApply.click();
  await driver.wait(
    async () => {
      const response = await sendFirefoxWorkflowCommand({
        channel: 'zeroomega-nex/profile-workflow/v1',
        action: 'get',
      });
      return Boolean(
        response?.ok && response.view?.dirty === false && response.view?.busy !== true,
      );
    },
    45_000,
    'Firefox PAC Apply did not reach a clean workflow state',
  );
  await navigateExtensionPage('popup.html');
  const pacRoute = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., 'Firefox PAC E2E')]")),
    15_000,
  );
  await pacRoute.click();
  await driver.wait(until.elementIsDisabled(pacRoute), 20_000);
  let pacRuntime;
  try {
    await driver.wait(
      async () => {
        pacRuntime = await driver.executeAsyncScript(`
          const done = arguments[0];
          browser.storage.local.get(null).then((storage) => {
            const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
            const profile = workflow?.applied?.profiles?.find(
              (candidate) => candidate.name === 'Firefox PAC E2E',
            );
            const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
            const snapshot = proxyState?.activeSnapshotId
              ? storage['zeroomega-nex/browser-proxy/v1/snapshot/' + proxyState.activeSnapshotId]
              : undefined;
            done({
              profileId: profile?.id,
              kind: profile?.kind,
              activeSnapshotId: proxyState?.activeSnapshotId,
              compilerVersion: snapshot?.compilerVersion,
              startRoute: snapshot?.startRoute,
              script: snapshot?.script,
            });
          }, (error) => done({ error: String(error) }));
        `);
        return Boolean(
          pacRuntime?.kind === 'pac' &&
          pacRuntime?.activeSnapshotId &&
          pacRuntime?.compilerVersion === 'raw-pac/1' &&
          pacRuntime?.startRoute?.kind === 'profile' &&
          pacRuntime?.startRoute?.profileId === pacRuntime?.profileId &&
          /FindProxyForURL/u.test(pacRuntime?.script ?? ''),
        );
      },
      30_000,
      'Firefox raw PAC runtime did not settle',
    );
  } catch (error) {
    assert.equal(pacRuntime?.kind, 'pac', 'Firefox PAC profile was not applied');
    assert.equal(
      pacRuntime?.compilerVersion,
      'raw-pac/1',
      'Firefox did not install a raw PAC snapshot',
    );
    assert.equal(pacRuntime?.startRoute?.kind, 'profile');
    assert.equal(pacRuntime?.startRoute?.profileId, pacRuntime?.profileId);
    assert.match(pacRuntime?.script ?? '', /FindProxyForURL/u);
    throw error;
  }
  await navigateExtensionPage('popup.html');
  const finalDirect = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., '直接連線')]")),
    15_000,
  );
  await finalDirect.click();
  await driver.wait(until.elementIsDisabled(finalDirect), 15_000);

  console.log(`Firefox extension E2E passed for ${installedId}.`);
} catch (error) {
  if (error !== toolbarOnlyComplete) throw error;
} finally {
  try {
    await driver.quit();
  } finally {
    await new Promise((resolveClose, rejectClose) => {
      sourceServer.close((error) => (error ? rejectClose(error) : resolveClose()));
    });
    await authProxy.close();
  }
}
