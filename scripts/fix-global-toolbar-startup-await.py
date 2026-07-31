from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


runtime_path = Path("apps/extension/src/lib/profile-workflow-runtime.ts")
runtime = runtime_path.read_text(encoding="utf-8")
runtime = replace_once(
    runtime,
    """  readonly onActivationSucceeded?: (event: ProfileWorkflowActivationEvent) => void;""",
    """  readonly onActivationSucceeded?: (
    event: ProfileWorkflowActivationEvent,
  ) => Promise<void> | void;""",
    "async activation callback contract",
)
runtime = replace_once(
    runtime,
    """export function notifyProfileWorkflowActivation(
  command: ProfileWorkflowCommand,
  response: ProfileWorkflowCommandResponse,
  listener: ProfileWorkflowRuntimeOptions['onActivationSucceeded'],
): void {
  if (!response.ok || response.appliedSnapshotId === undefined || listener === undefined) return;
  listener({
    command,
    response: {
      ...response,
      appliedSnapshotId: response.appliedSnapshotId,
    },
  });
}""",
    """export async function notifyProfileWorkflowActivation(
  command: ProfileWorkflowCommand,
  response: ProfileWorkflowCommandResponse,
  listener: ProfileWorkflowRuntimeOptions['onActivationSucceeded'],
): Promise<void> {
  if (!response.ok || response.appliedSnapshotId === undefined || listener === undefined) return;
  await listener({
    command,
    response: {
      ...response,
      appliedSnapshotId: response.appliedSnapshotId,
    },
  });
}""",
    "await activation notification",
)
runtime = replace_once(
    runtime,
    """    ).then((response) => {
      notifyProfileWorkflowActivation(command, response, options.onActivationSucceeded);
      return response;
    });""",
    """    ).then(async (response) => {
      await notifyProfileWorkflowActivation(command, response, options.onActivationSucceeded);
      return response;
    });""",
    "await activation callback before command response",
)
runtime_path.write_text(runtime, encoding="utf-8")


runtime_test_path = Path("apps/extension/src/lib/profile-workflow-runtime.test.ts")
runtime_test = runtime_test_path.read_text(encoding="utf-8")
runtime_test = replace_once(
    runtime_test,
    """  it('notifies only after a successful command returns an applied snapshot', () => {
    const listener = vi.fn();
    const apply = command('apply');

    notifyProfileWorkflowActivation(apply, success('snapshot-7'), listener);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({
      command: apply,
      response: {
        ok: true,
        state,
        view,
        appliedSnapshotId: 'snapshot-7',
      },
    });
  });""",
    """  it('notifies only after a successful command returns an applied snapshot', async () => {
    const listener = vi.fn();
    const apply = command('apply');

    await notifyProfileWorkflowActivation(apply, success('snapshot-7'), listener);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({
      command: apply,
      response: {
        ok: true,
        state,
        view,
        appliedSnapshotId: 'snapshot-7',
      },
    });
  });

  it('waits for asynchronous activation follow-up before resolving', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const listener = vi.fn(() => gate);
    const notification = notifyProfileWorkflowActivation(
      command('apply'),
      success('snapshot-8'),
      listener,
    );
    let resolved = false;
    void notification.then(() => {
      resolved = true;
    });

    expect(listener).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(resolved).toBe(false);

    release();
    await notification;
    expect(resolved).toBe(true);
  });

  it('propagates activation follow-up failures', async () => {
    const failure = new Error('toolbar refresh failed');

    await expect(
      notifyProfileWorkflowActivation(command('apply'), success('snapshot-9'), () =>
        Promise.reject(failure),
      ),
    ).rejects.toBe(failure);
  });""",
    "async activation notification tests",
)
runtime_test = replace_once(
    runtime_test,
    """  it('does not notify for successful commands that did not activate a snapshot', () => {
    const listener = vi.fn();

    notifyProfileWorkflowActivation(command('get'), success(), listener);

    expect(listener).not.toHaveBeenCalled();
  });""",
    """  it('does not notify for successful commands that did not activate a snapshot', async () => {
    const listener = vi.fn();

    await notifyProfileWorkflowActivation(command('get'), success(), listener);

    expect(listener).not.toHaveBeenCalled();
  });""",
    "async no-snapshot notification test",
)
runtime_test = replace_once(
    runtime_test,
    """  it('does not notify for failed commands', () => {
    const listener = vi.fn();

    notifyProfileWorkflowActivation(
      command('apply'),
      { ok: false, code: 'apply-failed', message: 'failed', state, view },
      listener,
    );

    expect(listener).not.toHaveBeenCalled();
  });""",
    """  it('does not notify for failed commands', async () => {
    const listener = vi.fn();

    await notifyProfileWorkflowActivation(
      command('apply'),
      { ok: false, code: 'apply-failed', message: 'failed', state, view },
      listener,
    );

    expect(listener).not.toHaveBeenCalled();
  });""",
    "async failed-command notification test",
)
runtime_test_path.write_text(runtime_test, encoding="utf-8")


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
      throw error;
    }
  };""",
    "awaitable toolbar refresh",
)
background = replace_once(
    background,
    """    onActivationSucceeded: () => refreshToolbar('profile activation'),""",
    """    onActivationSucceeded: () => refreshToolbar('profile activation'),""",
    "activation refresh callback",
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
      }""",
    "single awaited startup toolbar path",
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
