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
    """  await driver.switchTo().newWindow('tab');
  await driver.get('about:support');
  const toolbarInternalWindow = await driver.getWindowHandle();
  await driver.switchTo().window(optionsWindow);

  const toolbarProxyTabId = await firefoxTabIdForUrl(toolbarProxyUrl);
  const toolbarBypassTabId = await firefoxTabIdForUrl(toolbarBypassUrl);
  const toolbarInternalTabId = await firefoxTabIdForUrl('about:support');""",
    """  await driver.switchTo().window(optionsWindow);
  const toolbarInternalTabId = await driver.executeAsyncScript(`
    const done = arguments[0];
    browser.tabs.create({ url: 'about:support', active: false }).then(
      (tab) => done(tab.id),
      (error) => done({ error: String(error) }),
    );
  `);
  assert.equal(
    typeof toolbarInternalTabId,
    'number',
    `Firefox internal tab creation failed: ${JSON.stringify(toolbarInternalTabId)}`,
  );

  const toolbarProxyTabId = await firefoxTabIdForUrl(toolbarProxyUrl);
  const toolbarBypassTabId = await firefoxTabIdForUrl(toolbarBypassUrl);""",
    "Firefox extension-created internal tab",
)
text = replace_once(
    text,
    """    assert.notEqual(toolbarBypassWindow, toolbarProxyWindow);
    assert.notEqual(toolbarInternalWindow, toolbarProxyWindow);
    console.log(`Firefox toolbar Action E2E passed for ${installedId}.`);""",
    """    assert.notEqual(toolbarBypassWindow, toolbarProxyWindow);
    console.log(`Firefox toolbar Action E2E passed for ${installedId}.`);""",
    "remove Firefox internal WebDriver window assertion",
)
path.write_text(text, encoding="utf-8")
