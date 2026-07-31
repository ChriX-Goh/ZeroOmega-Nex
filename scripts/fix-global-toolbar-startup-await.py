from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


background_path = Path("apps/extension/src/entrypoints/background.ts")
background = background_path.read_text(encoding="utf-8")
background = replace_once(
    background,
    """  const refreshToolbar = (reason: string, clearIconCache = true): void => {
    void toolbarRuntime
      .refreshAll(clearIconCache ? { clearIconCache: true } : {})
      .catch((error: unknown) => {
        console.error(`[${productIdentity.name}] toolbar refresh failed after ${reason}:`, error);
      });
  };""",
    """  const refreshToolbar = async (
    reason: string,
    clearIconCache = true,
  ): Promise<void> => {
    try {
      await toolbarRuntime.refreshAll(clearIconCache ? { clearIconCache: true } : {});
    } catch (error) {
      console.error(`[${productIdentity.name}] toolbar refresh failed after ${reason}:`, error);
    }
  };""",
    "awaitable toolbar refresh",
)
background = replace_once(
    background,
    """    onActivationSucceeded: () => refreshToolbar('profile activation'),""",
    """    onActivationSucceeded: () => {
      void refreshToolbar('profile activation');
    },""",
    "activation refresh wrapper",
)
background = replace_once(
    background,
    """        await restoreProxyRuntime(authentication, temporaryRuleCoordinator);
        refreshToolbar('startup recovery');
        return;
      }
      refreshToolbar('initial startup activation');""",
    """        await restoreProxyRuntime(authentication, temporaryRuleCoordinator);
        await refreshToolbar('startup recovery');
        return;
      }
      await refreshToolbar('initial startup activation');""",
    "await startup toolbar refresh",
)
background_path.write_text(background, encoding="utf-8")


firefox_path = Path("scripts/e2e-firefox.mjs")
firefox = firefox_path.read_text(encoding="utf-8")
firefox = replace_once(
    firefox,
    """async function waitForFirefoxActionState(tabId, expected, label) {
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

async function sendFirefoxWorkflowCommand(command) {""",
    """async function waitForFirefoxActionState(tabId, expected, label) {
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
  } catch (error) {
    assert.deepEqual(actual, expected, label);
    throw error;
  }
}

async function sendFirefoxWorkflowCommand(command) {""",
    "Firefox global Action helpers",
)
firefox = replace_once(
    firefox,
    """  const toolbarProxyUrl = `http://toolbar-a.test:${sourceAddress.port}/toolbar-a`;
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
  );""",
    """  const toolbarPopup = `moz-extension://${extensionUuid}/popup-iframe.html`;
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

  const toolbarProxyUrl = `http://toolbar-a.test:${sourceAddress.port}/toolbar-a`;
  const toolbarBypassUrl = `http://localhost:${sourceAddress.port}/toolbar-b`;
  await driver.switchTo().newWindow('tab');
  await driver.get(toolbarProxyUrl);
  await driver.switchTo().newWindow('tab');
  await driver.get(toolbarBypassUrl);
  await driver.switchTo().window(optionsWindow);

  const toolbarProxyTabId = await firefoxTabIdForUrl(toolbarProxyUrl);
  const toolbarBypassTabId = await firefoxTabIdForUrl(toolbarBypassUrl);""",
    "Firefox global baseline assertion",
)
firefox_path.write_text(firefox, encoding="utf-8")
