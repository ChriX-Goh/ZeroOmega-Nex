from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old!r}")
    target.write_text(source.replace(old, new, 1))


replace_once(
    "scripts/validate-ui-compatibility.mjs",
    '''      optionsApp.includes("uiText('options.builtin.directHelp', locale)") &&''',
    '''      !optionsApp.includes("uiText('options.builtin.directHelp', locale)") &&''',
)

replace_once(
    "scripts/e2e-chromium.mjs",
    """  await options.getByRole('button', { name: '配置历史' }).click();
  await options.getByRole('heading', { name: '配置历史', exact: true, level: 1 }).waitFor();
  await options.getByRole('heading', { name: '已验证的 PAC 快照', exact: true }).waitFor();
  await options.locator('.settings-section').first().waitFor({ timeout: 20_000 });""",
    """  assert.equal(
    await options.getByRole('button', { name: '配置历史', exact: true }).count(),
    0,
    'Original-facing Options exposed Nex-only configuration history navigation',
  );""",
)

replace_once(
    "scripts/e2e-firefox-toolbar-restart.mjs",
    """  assert.equal(result?.url, url, 'Firefox did not navigate to the extension options page');
  await driver.wait(async () => (await driver.getCurrentUrl()) === url, 20_000);""",
    """  const expectedUrl = `${url}#/about`;
  assert.equal(
    result?.url,
    expectedUrl,
    'Firefox did not navigate to the extension options page',
  );
  await driver.wait(async () => (await driver.getCurrentUrl()) === expectedUrl, 20_000);""",
)

replace_once(
    "apps/extension/src/lib/ui-messages.ts",
    "en: 'ZeroOmega Nex profile switcher'",
    "en: 'ZeroOmega profile switcher'",
)
replace_once(
    "apps/extension/src/lib/ui-messages.ts",
    "'zh-CN': 'ZeroOmega Nex 情景模式切换器'",
    "'zh-CN': 'ZeroOmega 情景模式切换器'",
)
replace_once(
    "apps/extension/src/lib/ui-messages.ts",
    "'zh-TW': 'ZeroOmega Nex 情境模式切換器'",
    "'zh-TW': 'ZeroOmega 情境模式切換器'",
)

replace_once(
    "apps/extension/src/component-rendering.component.spec.ts",
    '''    expect(body).toContain('aria-label="ZeroOmega Nex profile switcher"');''',
    '''    expect(body).toContain('aria-label="ZeroOmega profile switcher"');''',
)
replace_once(
    "apps/extension/src/component-rendering.component.spec.ts",
    '''    expect(body).toContain('aria-label="Open ZeroOmega Nex options"');''',
    '''    expect(body).toContain('aria-label="Open ZeroOmega options"');''',
)
replace_once(
    "apps/extension/src/component-rendering.component.spec.ts",
    '''    expect(traditionalPopup).toContain('aria-label="開啟 ZeroOmega Nex 選項"');''',
    '''    expect(traditionalPopup).toContain('aria-label="開啟 ZeroOmega 選項"');''',
)
replace_once(
    "apps/extension/src/component-rendering.component.spec.ts",
    '''    expect(traditionalPopup).not.toContain('Open ZeroOmega Nex options');''',
    '''    expect(traditionalPopup).not.toContain('Open ZeroOmega options');
    expect(traditionalPopup).not.toContain('ZeroOmega Nex');''',
)
