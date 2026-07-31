from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


path = Path("scripts/e2e-firefox.mjs")
text = path.read_text(encoding="utf-8")

text = replace_once(
    text,
    """  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('not found');""",
    """  if (request.url?.startsWith('/toolbar-')) {
    response.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end('<!doctype html><html><body>Firefox toolbar Action E2E</body></html>');
    return;
  }
  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('not found');""",
    "Firefox toolbar web routes",
)

text = replace_once(
    text,
    """  .setPreference('network.dns.disableIPv6', true)
  .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));""",
    """  .setPreference('network.dns.disableIPv6', true)
  .setPreference('network.dns.localDomains', 'toolbar-a.test')
  .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));""",
    "Firefox local toolbar domain",
)

text = replace_once(
    text,
    """async function logDiagnostics(stage) {""",
    """async function firefoxTabIdForUrl(url) {
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

async function literalFirefoxActionState(
  currentProfileName,
  resultProfileName,
  details,
  popup,
) {
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
  } catch (error) {
    assert.deepEqual(actual, expected, label);
    throw error;
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

async function logDiagnostics(stage) {""",
    "Firefox Action helpers",
)

text = replace_once(
    text,
    """  await navigateExtensionPage('options.html');
  let profileHeading;""",
    """  await navigateExtensionPage('options.html');
  const optionsWindow = await driver.getWindowHandle();
  let profileHeading;""",
    "Firefox options window",
)

text = replace_once(
    text,
    """  assert.equal(
    await hasOriginPermission(remotePermissionOrigin),
    false,
    'Firefox remote source origin must remain optional before a user action',
  );

  const fixedTable = await driver.wait(""",
    """  assert.equal(
    await hasOriginPermission(remotePermissionOrigin),
    false,
    'Firefox remote source origin must remain optional before a user action',
  );

  const toolbarProxyUrl = `http://toolbar-a.test:${sourceAddress.port}/toolbar-a`;
  const toolbarBypassUrl = `http://localhost:${sourceAddress.port}/toolbar-b`;
  await driver.switchTo().newWindow('tab');
  await driver.get(toolbarProxyUrl);
  await driver.switchTo().newWindow('tab');
  await driver.get(toolbarBypassUrl);
  await driver.switchTo().window(optionsWindow);

  const toolbarProxyTabId = await firefoxTabIdForUrl(toolbarProxyUrl);
  const toolbarBypassTabId = await firefoxTabIdForUrl(toolbarBypassUrl);
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

  const fixedTable = await driver.wait(""",
    "Firefox initial Action acceptance",
)

text = replace_once(
    text,
    """  await customProfile.click();
  await driver.wait(until.elementIsDisabled(customProfile), 20_000);

  await driver.get(authProxy.targetUrl);""",
    """  await customProfile.click();
  await driver.wait(until.elementIsDisabled(customProfile), 20_000);

  const fixedProxyAction = await literalFirefoxActionState(
    'Firefox E2E Proxy',
    'Firefox E2E Proxy',
    `PROXY ${authProxy.host}:${authProxy.port}\n`,
    toolbarPopup,
  );
  const localizedDirectResult = await driver.executeScript(
    "return browser.i18n.getMessage('browserAction_directResult');",
  );
  const fixedBypassAction = await literalFirefoxActionState(
    'Firefox E2E Proxy',
    routeDirect,
    `localhost => ${localizedDirectResult}\n`,
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

  await driver.get(authProxy.targetUrl);""",
    "Firefox Fixed Action acceptance",
)

path.write_text(text, encoding="utf-8")
