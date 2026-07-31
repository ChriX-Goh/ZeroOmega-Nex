from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


chromium_path = Path("scripts/e2e-chromium-toolbar.mjs")
chromium = chromium_path.read_text(encoding="utf-8")
chromium = replace_once(
    chromium,
    """      fixedBypass: resultTitle('Toolbar Proxy', 'Toolbar Proxy', `localhost => ${directDetail}\\n`),
    };""",
    """      fixedBypass: resultTitle('Toolbar Proxy', 'Toolbar Proxy', `localhost => ${directDetail}\\n`),
      default: chrome.i18n.getMessage('manifest_icon_default_title'),
    };""",
    "Chromium default title",
)
chromium = replace_once(
    chromium,
    """  const proxyPage = await context.newPage();
  const proxyUrl = `http://toolbar-a.test:${address.port}/alpha`;""",
    """  const internalPage = await context.newPage();
  await internalPage.goto('chrome://version/');
  const internalUrl = internalPage.url();
  const internalTabId = await tabIdForUrl(extensionPage, internalUrl);

  const proxyPage = await context.newPage();
  const proxyUrl = `http://toolbar-a.test:${address.port}/alpha`;""",
    "Chromium internal tab",
)
chromium = replace_once(
    chromium,
    """  await waitForActionState(extensionPage, bypassTabId, systemState, 'System two-tab state failed');

  const initial = await sendWorkflowCommand""",
    """  await waitForActionState(extensionPage, bypassTabId, systemState, 'System two-tab state failed');
  await waitForActionState(
    extensionPage,
    internalTabId,
    systemState,
    'System internal-page Action state failed',
  );

  const initial = await sendWorkflowCommand""",
    "Chromium System internal assertion",
)
chromium = replace_once(
    chromium,
    """  await waitForActionState(
    extensionPage,
    bypassTabId,
    {
      title: expectedTitles.fixedBypass,
      badgeText: 'Tool',
      popup,
    },
    'Fixed bypass Action state failed',
  );

  console.log(`Chromium toolbar Action E2E passed for ${extensionId}.`);""",
    """  await waitForActionState(
    extensionPage,
    bypassTabId,
    {
      title: expectedTitles.fixedBypass,
      badgeText: 'Tool',
      popup,
    },
    'Fixed bypass Action state failed',
  );
  await waitForActionState(
    extensionPage,
    internalTabId,
    { title: expectedTitles.default, badgeText: '', popup },
    'Fixed internal-page fallback Action state failed',
  );

  const sameTabBypassUrl = `http://localhost:${address.port}/same-tab-bypass`;
  await proxyPage.goto(sameTabBypassUrl, { waitUntil: 'domcontentloaded' });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    { title: expectedTitles.fixedBypass, badgeText: 'Tool', popup },
    'Same-tab proxy-to-bypass Action transition failed',
  );
  const sameTabProxyUrl = `http://toolbar-a.test:${address.port}/same-tab-proxy`;
  await proxyPage.goto(sameTabProxyUrl, { waitUntil: 'domcontentloaded' });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    { title: expectedTitles.fixedProxy, badgeText: 'Tool', popup },
    'Same-tab bypass-to-proxy Action transition failed',
  );

  console.log(`Chromium toolbar Action E2E passed for ${extensionId}.`);""",
    "Chromium internal and same-tab assertions",
)
chromium_path.write_text(chromium, encoding="utf-8")


firefox_path = Path("scripts/e2e-firefox.mjs")
firefox = firefox_path.read_text(encoding="utf-8")
firefox = replace_once(
    firefox,
    """  await waitForFirefoxGlobalActionState(
    systemAction,
    'Firefox global System Action baseline failed before new-tab creation',
  );

  const toolbarProxyUrl = `http://toolbar-a.test:${sourceAddress.port}/toolbar-a`;""",
    """  await waitForFirefoxGlobalActionState(
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

  const toolbarProxyUrl = `http://toolbar-a.test:${sourceAddress.port}/toolbar-a`;""",
    "Firefox default Action state",
)
firefox = replace_once(
    firefox,
    """  await driver.switchTo().newWindow('tab');
  await driver.get(toolbarProxyUrl);
  await driver.switchTo().newWindow('tab');
  await driver.get(toolbarBypassUrl);
  await driver.switchTo().window(optionsWindow);

  const toolbarProxyTabId = await firefoxTabIdForUrl(toolbarProxyUrl);
  const toolbarBypassTabId = await firefoxTabIdForUrl(toolbarBypassUrl);""",
    """  await driver.switchTo().newWindow('tab');
  await driver.get(toolbarProxyUrl);
  const toolbarProxyWindow = await driver.getWindowHandle();
  await driver.switchTo().newWindow('tab');
  await driver.get(toolbarBypassUrl);
  const toolbarBypassWindow = await driver.getWindowHandle();
  await driver.switchTo().newWindow('tab');
  await driver.get('about:support');
  const toolbarInternalWindow = await driver.getWindowHandle();
  await driver.switchTo().window(optionsWindow);

  const toolbarProxyTabId = await firefoxTabIdForUrl(toolbarProxyUrl);
  const toolbarBypassTabId = await firefoxTabIdForUrl(toolbarBypassUrl);
  const toolbarInternalTabId = await firefoxTabIdForUrl('about:support');""",
    "Firefox toolbar windows and internal tab",
)
firefox = replace_once(
    firefox,
    """  await waitForFirefoxActionState(
    toolbarBypassTabId,
    systemAction,
    'Firefox System bypass-tab Action state failed',
  );

  const initialWorkflow = await sendFirefoxWorkflowCommand""",
    """  await waitForFirefoxActionState(
    toolbarBypassTabId,
    systemAction,
    'Firefox System bypass-tab Action state failed',
  );
  await waitForFirefoxActionState(
    toolbarInternalTabId,
    systemAction,
    'Firefox System internal-page Action state failed',
  );

  const initialWorkflow = await sendFirefoxWorkflowCommand""",
    "Firefox System internal assertion",
)
firefox = replace_once(
    firefox,
    """    await waitForFirefoxActionState(
      toolbarBypassTabId,
      fixedBypassAction,
      'Firefox focused Fixed bypass Action state failed',
    );

    console.log(`Firefox toolbar Action E2E passed for ${installedId}.`);""",
    """    await waitForFirefoxActionState(
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

    assert.notEqual(toolbarBypassWindow, toolbarProxyWindow);
    assert.notEqual(toolbarInternalWindow, toolbarProxyWindow);
    console.log(`Firefox toolbar Action E2E passed for ${installedId}.`);""",
    "Firefox focused internal and same-tab assertions",
)
firefox_path.write_text(firefox, encoding="utf-8")


inspect_path = Path("scripts/e2e-inspect-native-menu.mjs")
inspect = inspect_path.read_text(encoding="utf-8")
inspect = replace_once(
    inspect,
    """import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';""",
    """import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';""",
    "Inspect HTTP import",
)
inspect = replace_once(
    inspect,
    """const targetUrl = 'https://cdn.example.test/native-menu.js';
let context;
""",
    """const targetUrl = 'https://cdn.example.test/native-menu.js';
const sourceServer = createServer((request, response) => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  });
  const currentUrl = `http://127.0.0.1:${sourceServer.address().port}${request.url}`;
  response.end(`<!doctype html><html><body style="font: 20px sans-serif; padding: 80px">
    <a id="inspect-target" href="${targetUrl}">Native Inspect target</a>
    <a id="inspect-clear" href="${currentUrl}">Clear Inspect using current page URL</a>
  </body></html>`);
});
await new Promise((resolveListen, rejectListen) => {
  sourceServer.once('error', rejectListen);
  sourceServer.listen(0, '127.0.0.1', resolveListen);
});
const sourceAddress = sourceServer.address();
if (!sourceAddress || typeof sourceAddress === 'string') {
  throw new Error('Inspect source server failed');
}
const pageUrl = `http://127.0.0.1:${sourceAddress.port}/inspect`;
const isolationUrl = `http://127.0.0.1:${sourceAddress.port}/isolation`;
let context;
""",
    "Inspect source server",
)
inspect = replace_once(
    inspect,
    """  const page = await context.newPage();
  await page.setContent(`<!doctype html>
    <html><body style="font: 20px sans-serif; padding: 80px">
      <a id="inspect-target" href="${targetUrl}">Native Inspect target</a>
    </body></html>`);
  await page.bringToFront();""",
    """  const page = await context.newPage();
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  const isolationPage = await context.newPage();
  await isolationPage.goto(isolationUrl, { waitUntil: 'domcontentloaded' });
  const tabIds = await eventually(
    () =>
      worker.evaluate(async ({ target, isolation }) => {
        const tabs = await chrome.tabs.query({});
        return {
          target: tabs.find((tab) => tab.url === target)?.id,
          isolation: tabs.find((tab) => tab.url === isolation)?.id,
        };
      }, { target: pageUrl, isolation: isolationUrl }),
    'Inspect target and isolation tab IDs were not resolved',
  );
  assert.equal(typeof tabIds.target, 'number');
  assert.equal(typeof tabIds.isolation, 'number');
  const baseActions = await worker.evaluate(async ({ target, isolation }) => {
    const read = async (tabId) => ({
      badge: await chrome.action.getBadgeText({ tabId }),
      title: await chrome.action.getTitle({ tabId }),
    });
    return { target: await read(target), isolation: await read(isolation) };
  }, tabIds);
  await page.bringToFront();""",
    "Inspect real pages and base actions",
)
inspect = replace_once(
    inspect,
    """  assert.ok(
    Number.isInteger(tabId) && tabId >= 0,
    `Inspect state had an invalid tab ID: ${matched[0]}`,
  );
  const action = await worker.evaluate""",
    """  assert.ok(
    Number.isInteger(tabId) && tabId >= 0,
    `Inspect state had an invalid tab ID: ${matched[0]}`,
  );
  assert.equal(tabId, tabIds.target, 'Inspect overlay was stored on the wrong tab');
  const action = await worker.evaluate""",
    "Inspect target tab assertion",
)
inspect = replace_once(
    inspect,
    """  assert.equal(action.badge, '#');
  assert.match(action.title, /^\\[Inspect\\] cdn\\.example\\.test/mu);
  console.log(`[native-inspect] success ${JSON.stringify({ tabId, stored, action })}`);""",
    """  assert.equal(action.badge, '#');
  assert.match(action.title, /^\\[Inspect\\] cdn\\.example\\.test/mu);
  const isolatedAfterSet = await worker.evaluate(async (id) => ({
    badge: await chrome.action.getBadgeText({ tabId: id }),
    title: await chrome.action.getTitle({ tabId: id }),
  }), tabIds.isolation);
  assert.deepEqual(isolatedAfterSet, baseActions.isolation, 'Inspect leaked into another tab');

  await page.bringToFront();
  await page.locator('#inspect-clear').click({ button: 'right' });
  await new Promise((resolveWait) => setTimeout(resolveWait, 800));
  await run('xdotool', ['key', '--clearmodifiers', 'End', 'Up', 'Return']);
  const cleared = await eventually(
    async () =>
      worker.evaluate(async ({ key, target, expected }) => {
        const values = await chrome.storage.session.get(key);
        const entry = values[key]?.entries?.[String(target)];
        const action = {
          badge: await chrome.action.getBadgeText({ tabId: target }),
          title: await chrome.action.getTitle({ tabId: target }),
        };
        return entry === undefined && JSON.stringify(action) === JSON.stringify(expected)
          ? { entry, action }
          : undefined;
      }, { key: inspectStorageKey, target: tabIds.target, expected: baseActions.target }),
    'Inspect clear did not remove the overlay and restore the base Action',
  );
  const isolatedAfterClear = await worker.evaluate(async (id) => ({
    badge: await chrome.action.getBadgeText({ tabId: id }),
    title: await chrome.action.getTitle({ tabId: id }),
  }), tabIds.isolation);
  assert.deepEqual(isolatedAfterClear, baseActions.isolation, 'Inspect clear changed another tab');
  console.log(
    `[native-inspect] success ${JSON.stringify({ tabId, stored, action, cleared, isolatedAfterSet, isolatedAfterClear })}`,
  );""",
    "Inspect set clear isolation assertions",
)
inspect = replace_once(
    inspect,
    """  await context?.close().catch(() => undefined);
  await rm(userDataDir, { recursive: true, force: true });""",
    """  await context?.close().catch(() => undefined);
  await new Promise((resolveClose) => sourceServer.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });""",
    "Inspect source server cleanup",
)
inspect_path.write_text(inspect, encoding="utf-8")


workflow_path = Path(".github/workflows/browser-e2e.yml")
workflow = workflow_path.read_text(encoding="utf-8")
workflow = replace_once(
    workflow,
    """      - name: Upload Firefox diagnostics
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: firefox-e2e-diagnostics
          path: firefox-e2e.log
          if-no-files-found: warn""",
    """      - name: Run Firefox toolbar Action E2E
        shell: bash
        run: |
          set -o pipefail
          pnpm test:e2e:firefox-toolbar 2>&1 | tee firefox-toolbar-e2e.log

      - name: Upload Firefox diagnostics
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: firefox-e2e-diagnostics
          path: |
            firefox-e2e.log
            firefox-toolbar-e2e.log
          if-no-files-found: warn""",
    "permanent Firefox focused Action job",
)
workflow_path.write_text(workflow, encoding="utf-8")
