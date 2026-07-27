from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(source.replace(old, new))


replace_once(
    'apps/extension/wxt.config.ts',
    "process.env.ZEROOMEGA_RULE_SOURCE_E2E === '1' ? ['http://127.0.0.1/*'] : [];",
    "process.env.ZEROOMEGA_RULE_SOURCE_E2E === '1'\n    ? ['http://127.0.0.1/*', 'https://*.example.co.uk/*']\n    : [];",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  const currentSitePage = await context.newPage();
  await currentSitePage.goto(currentSiteUrl);
  const currentSiteTabId = await worker.evaluate(async (targetUrl) => {
    const tabs = await chrome.tabs.query({});
    return tabs.find((tab) => tab.url === targetUrl)?.id;
  }, currentSiteUrl);
''',
    '''  const currentSitePage = await context.newPage();
  await currentSitePage.goto(currentSiteUrl);
  await currentSitePage.bringToFront();
  const currentSiteTabId = await worker.evaluate(async () =>
    (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id,
  );
''',
)
