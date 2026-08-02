from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old!r}")
    target.write_text(source.replace(old, new, 1))


validator = Path("scripts/validate-ui-compatibility.mjs")
source = validator.read_text()
marker = (
    "'Built-in Profiles, About, new-profile shell, empty state, branding, "
    "and profile export presentation must render through the typed catalog.'"
)
if source.count(marker) != 1:
    raise RuntimeError(f"validator marker count: {source.count(marker)}")
marker_index = source.index(marker)
start = source.rfind("\n  [", 0, marker_index)
end_marker = "\n  ],"
end = source.index(end_marker, marker_index) + len(end_marker)
if start < 0 or end <= marker_index:
    raise RuntimeError("could not isolate redesign-era validator requirement")
requirement = '''
  [
    optionsApp.includes('data-builtin-settings data-typed-locale={locale}') &&
      optionsApp.includes("uiText('options.builtin.directHelp', locale)") &&
      optionsApp.includes('data-about-settings data-typed-locale={locale}') &&
      optionsApp.includes('const originalCopy =') &&
      optionsApp.includes('<h2>ZeroOmega</h2>') &&
      optionsApp.includes('data-new-profile-shell') &&
      optionsApp.includes('data-empty-profiles') &&
      !optionsApp.includes('ZeroOmega Nex') &&
      !optionsApp.includes('<span>Zero Omega</span>') &&
      !optionsApp.includes("uiText('history.nav'") &&
      !optionsApp.includes('class="draft-status"') &&
      !fixedProfile.includes('data-fixed-protocol-capabilities') &&
      chromiumE2e.includes('Engineering concepts leaked into the normal About page'),
    'Original-facing Options must keep typed dynamic UI while preserving official fixed product text and excluding Nex branding, History, Draft status, and capability research.',
  ],'''
validator.write_text(source[:start] + requirement + source[end:])

replace_once(
    "apps/extension/src/lib/ui-messages.ts",
    "en: 'Open ZeroOmega Nex options'",
    "en: 'Open ZeroOmega options'",
)
replace_once(
    "apps/extension/src/lib/ui-messages.ts",
    "'zh-CN': '打开 ZeroOmega Nex 选项'",
    "'zh-CN': '打开 ZeroOmega 选项'",
)
replace_once(
    "apps/extension/src/lib/ui-messages.ts",
    "'zh-TW': '開啟 ZeroOmega Nex 選項'",
    "'zh-TW': '開啟 ZeroOmega 選項'",
)

replace_once(
    "scripts/e2e-firefox.mjs",
    """  assert.equal(result?.url, url, `Firefox BiDi navigated to an unexpected extension URL`);
  await driver.wait(async () => (await driver.getCurrentUrl()) === url, 20_000);""",
    """  const expectedUrl = relativeUrl === 'options.html' ? `${url}#/about` : url;
  assert.equal(
    result?.url,
    expectedUrl,
    `Firefox BiDi navigated to an unexpected extension URL`,
  );
  await driver.wait(async () => (await driver.getCurrentUrl()) === expectedUrl, 20_000);""",
)

replace_once(
    "scripts/e2e-chromium.mjs",
    "getByRole('button', { name: '打开 ZeroOmega Nex 选项', exact: true })",
    "getByRole('button', { name: '打开 ZeroOmega 选项', exact: true })",
)
replace_once(
    "scripts/e2e-chromium.mjs",
    "getByRole('button', { name: /直接连接/u }).waitFor()",
    "getByRole('button', { name: '直接连接', exact: true }).waitFor()",
)
