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
    """  await driver.switchTo().newWindow('tab');
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
  );""",
    "Firefox about blank internal tab",
)
path.write_text(text, encoding="utf-8")
