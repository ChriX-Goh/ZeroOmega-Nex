from pathlib import Path

path = Path("scripts/e2e-chromium-toolbar.mjs")
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    text = text.replace(old, new, 1)


replace_once(
    "const systemTitle = 'ZeroOmega:: [系统代理]\\n（代理服务器由其它扩展或环境控制。）';\n"
    "const directTitle = 'ZeroOmega:: [直接连接]\\n（未使用代理服务器）';\n",
    "",
    "hard-coded toolbar locale titles",
)
replace_once(
    "  await extensionPage.waitForLoadState('domcontentloaded');",
    """  await extensionPage.waitForLoadState('domcontentloaded');
  const expectedTitles = await extensionPage.evaluate(() => {
    const resultTitle = (currentProfileName, resultProfileName, details) =>
      chrome.i18n.getMessage('browserAction_titleWithResult', [
        currentProfileName,
        resultProfileName,
        details,
      ]);
    const systemName = chrome.i18n.getMessage('routeSystem');
    const directName = chrome.i18n.getMessage('routeDirect');
    const externalDetail = chrome.i18n.getMessage('browserAction_titleExternalProxy');
    const directDetail = chrome.i18n.getMessage('browserAction_directResult');
    return {
      system: resultTitle(`[${systemName}]`, `[${systemName}]`, externalDetail),
      direct: resultTitle(`[${directName}]`, `[${directName}]`, directDetail),
      fixedProxy: resultTitle(
        'Toolbar Proxy',
        'Toolbar Proxy',
        'PROXY 127.0.0.1:7890\\n',
      ),
      fixedBypass: resultTitle(
        'Toolbar Proxy',
        'Toolbar Proxy',
        `localhost => ${directDetail}\\n`,
      ),
    };
  });""",
    "runtime toolbar locale expectations",
)
replace_once(
    "const systemState = { title: systemTitle, badgeText: '', popup };",
    "const systemState = { title: expectedTitles.system, badgeText: '', popup };",
    "System title expectation",
)
replace_once(
    "const directState = { title: directTitle, badgeText: '', popup };",
    "const directState = { title: expectedTitles.direct, badgeText: '', popup };",
    "Direct title expectation",
)
replace_once(
    "title: 'ZeroOmega:: Toolbar Proxy\\nPROXY 127.0.0.1:7890\\n',",
    "title: expectedTitles.fixedProxy,",
    "Fixed proxy title expectation",
)
replace_once(
    "title: 'ZeroOmega:: Toolbar Proxy\\nlocalhost => （未使用代理服务器）\\n',",
    "title: expectedTitles.fixedBypass,",
    "Fixed bypass title expectation",
)
path.write_text(text, encoding="utf-8")
