from pathlib import Path
import re

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    source = path.read_text()
    count = source.count(old)
    assert count == 1, f'{label}: expected 1, got {count}'
    path.write_text(source.replace(old, new, 1))


# Options reset remains behind the existing background workflow boundary.
app = ROOT / 'apps/extension/src/entrypoints/options/App.svelte'
replace_once(
    app,
    '    createFixedProfileDraft,\n',
    '    createDefaultProfileSpec,\n    createFixedProfileDraft,\n',
    'default ProfileSpec import',
)
source = app.read_text()
source, count = re.subn(
    r"  async function resetOptions\(\): Promise<void> \{\n"
    r"    if \(!globalThis\.confirm\(originalCopy\.resetConfirm\)\) return;\n"
    r"    await browser\.storage\.local\.clear\(\);\n"
    r"    globalThis\.location\.replace\('options\.html#/about'\);\n"
    r"  \}",
    """  async function resetOptions(): Promise<void> {
    if (!state || view?.busy || !globalThis.confirm(originalCopy.resetConfirm)) return;
    const resetSpec = createDefaultProfileSpec({
      documentId: `document-${crypto.randomUUID()}`,
      revisionId: `revision-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      ...(state.applied.revision.deviceId === undefined
        ? {}
        : { deviceId: state.applied.revision.deviceId }),
    });
    if (
      !(await runCommand({
        action: 'replace-draft',
        expectedGeneration: state.generation,
        draft: resetSpec,
      })) ||
      !state
    ) {
      return;
    }
    if (
      !(await runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      }))
    ) {
      return;
    }
    globalThis.location.replace('options.html#/about');
  }""",
    source,
    count=1,
)
assert count == 1, f'reset command boundary replacements: {count}'
app.write_text(source)

# Popup profile selection is independent from the keyboard quick-switch toggle.
commands = ROOT / 'packages/profile-workflow/src/commands.ts'
source = commands.read_text()
source, count = re.subn(
    r"  if \(!state\.applied\.settings\.quickSwitch\.enabled\) \{\n"
    r"    return 'quick switching is disabled in the applied ProfileSpec';\n"
    r"  \}\n",
    '',
    source,
    count=1,
)
assert count == 1, f'Popup/keyboard Quick Switch coupling replacements: {count}'
commands.write_text(source)

# Compiler/runtime capability knowledge remains, while ordinary UI exposure is forbidden.
validator = ROOT / 'scripts/validate-parity-docs.mjs'
source = validator.read_text()
source, count = re.subn(
    r"requireAll\('Fixed protocol capability UI', fixedProtocolEditor, \[.*?\n\]\);",
    """for (const forbiddenToken of [
  'data-fixed-protocol-capabilities',
  'data-browser-target',
  'data-proxy-protocol-capability',
  'data-fixed-ftp-capability',
  'fixedProxySlotCapability',
  'proxyProtocolCapability',
]) {
  if (fixedProtocolEditor.includes(forbiddenToken)) {
    failures.push(`Fixed editor must not expose engineering capability UI: ${forbiddenToken}`);
  }
}""",
    source,
    count=1,
    flags=re.S,
)
assert count == 1, f'Fixed capability UI validator replacements: {count}'
source, count = re.subn(
    r"requireAll\('protocol capability component rendering', protocolComponentRendering, \[.*?\n\]\);",
    """requireAll('protocol capability component rendering', protocolComponentRendering, [
  "not.toContain('data-fixed-protocol-capabilities')",
]);""",
    source,
    count=1,
    flags=re.S,
)
assert count == 1, f'component capability validator replacements: {count}'
replace_pairs = [
    (
        "  'data-fixed-protocol-capabilities',\n  'matrix-socks4.invalid',",
        "  'matrix-socks4.invalid',",
        'Chromium capability UI validator token',
    ),
    (
        "  'data-fixed-protocol-capabilities',\n  'data-browser-target=\"firefox\"',\n  \"['http', 'https', 'socks4', 'socks5']\",",
        "  \"['http', 'https', 'socks4', 'socks5']\",",
        'Firefox capability UI validator tokens',
    ),
]
for old, new, label in replace_pairs:
    assert source.count(old) == 1, f'{label}: expected 1, got {source.count(old)}'
    source = source.replace(old, new, 1)
validator.write_text(source)

component = ROOT / 'apps/extension/src/component-rendering.component.spec.ts'
source = component.read_text()
source, count = re.subn(
    r"    expect\(body\)\.toContain\('data-fixed-protocol-capabilities'\);\n.*?"
    r"    expect\(body\)\.toContain\('Modern Chromium and Firefox no longer issue browser FTP requests'\);\n",
    "    expect(body).not.toContain('data-fixed-protocol-capabilities');\n",
    source,
    count=1,
    flags=re.S,
)
assert count == 1, f'component capability block replacements: {count}'
component.write_text(source)

# Chromium starts on the original About page, then explicitly enters proxy.
chromium = ROOT / 'scripts/e2e-chromium.mjs'
source = chromium.read_text()
assert source.count("    name: 'Proxy',\n") >= 1
source = source.replace("    name: 'Proxy',\n", "    name: 'proxy',\n", 1)
old = """  try {
    await profileHeading.waitFor({ state: 'visible', timeout: 15_000 });
  } catch (error) {"""
new = """  try {
    await options.getByRole('heading', { name: '关于', exact: true, level: 1 }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    await options.getByRole('button', { name: 'proxy', exact: true }).click();
    await profileHeading.waitFor({ state: 'visible', timeout: 15_000 });
  } catch (error) {"""
assert source.count(old) == 1, f'Chromium initial page block: {source.count(old)}'
source = source.replace(old, new, 1)
source = source.replace(
    "  await options.getByText('当前设置已全部应用。', { exact: true }).waitFor();\n",
    '',
    1,
)
source, count = re.subn(
    r"  await options\.locator\('\.side-brand button'\)\.click\(\);\n"
    r"  const aboutSettings = .*?"
    r"  assert\.match\(\n"
    r"    await chromiumProtocolCapabilities\.locator\('\[data-fixed-ftp-capability\]'\)\.innerText\(\),\n"
    r"    /不再发起浏览器 FTP 请求/u,\n"
    r"  \);",
    """  await options.locator('.side-brand button').click();
  const aboutSettings = options.locator('[data-about-settings][data-typed-locale="zh-CN"]');
  await aboutSettings.waitFor({ state: 'visible', timeout: 20_000 });
  await aboutSettings.getByRole('heading', { name: '关于', exact: true, level: 1 }).waitFor();
  assert.doesNotMatch(
    await aboutSettings.innerText(),
    /Draft|Applied|revision|compile|snapshot|capability|兼容性优先/u,
    'Engineering concepts leaked into the normal About page',
  );

  await options.getByRole('button', { name: 'proxy', exact: true }).click();
  await profileHeading.waitFor({ state: 'visible' });

  const fixedTable = options.locator('[data-fixed-proxy-table]');
  await fixedTable.waitFor({ state: 'visible' });
  assert.equal(
    await options.locator('[data-fixed-protocol-capabilities]').count(),
    0,
    'Fixed editor exposed engineering capability documentation',
  );""",
    source,
    count=1,
    flags=re.S,
)
assert count == 1, f'Chromium About/capability replacements: {count}'
source = source.replace(
    "getByRole('button', { name: 'Proxy', exact: true })",
    "getByRole('button', { name: 'proxy', exact: true })",
)
source = source.replace(
    "assert.equal(await renameInput.inputValue(), 'Proxy');",
    "assert.equal(await renameInput.inputValue(), 'proxy');",
    1,
)
source = source.replace(
    "draft?.name === 'Chromium E2E Proxy' && applied?.name === 'Proxy'",
    "draft?.name === 'Chromium E2E Proxy' && applied?.name === 'proxy'",
    1,
)
source = source.replace(
    "  await options.getByText('当前设置已全部应用。').waitFor({ state: 'visible', timeout: 20_000 });\n",
    '',
    1,
)
chromium.write_text(source)

# Firefox is the primary browser-facing validation target.
firefox = ROOT / 'scripts/e2e-firefox.mjs'
source = firefox.read_text()
source, count = re.subn(
    r"  let profileHeading;\n  try \{\n    profileHeading = await driver\.wait\(.*?"
    r"    const protocolValues = await driver\.executeScript\(`",
    """  let profileHeading;
  try {
    const aboutHeading = await driver.wait(
      until.elementLocated(By.xpath("//h1[normalize-space(.)='關於']")),
      15_000,
    );
    await driver.wait(until.elementIsVisible(aboutHeading), 15_000);
    const proxyButton = await driver.wait(
      until.elementLocated(By.xpath("//button[normalize-space(.)='proxy']")),
      15_000,
    );
    await proxyButton.click();
    profileHeading = await driver.wait(
      until.elementLocated(By.xpath("//h1[normalize-space(.)='proxy']")),
      15_000,
    );
    await driver.wait(until.elementIsVisible(profileHeading), 15_000);
    assert.equal(
      (await driver.findElements(By.css('[data-fixed-protocol-capabilities]'))).length,
      0,
      'Fixed editor exposed engineering capability documentation',
    );
    const protocolValues = await driver.executeScript(`""",
    source,
    count=1,
    flags=re.S,
)
assert count == 1, f'Firefox initial/capability replacements: {count}'
source = source.replace(
    "assert.equal(await renameInput.getAttribute('value'), 'Proxy');",
    "assert.equal(await renameInput.getAttribute('value'), 'proxy');",
    1,
)
source, count = re.subn(
    r"\n    await driver\.wait\(\n      async \(\) => \{\n"
    r"        const statuses = await driver\.findElements\(By\.css\('\.draft-status'\)\);.*?"
    r"\n      'Firefox Options did not render the clean Apply status',\n    \);",
    '',
    source,
    count=1,
    flags=re.S,
)
assert count == 1, f'Firefox Apply status replacements: {count}'
source, count = re.subn(
    r"\n  await driver\.wait\(\n    async \(\) => \{\n"
    r"      const statuses = await driver\.findElements\(By\.css\('\.draft-status'\)\);.*?"
    r"\n    'Firefox Options did not render the clean PAC Apply status',\n  \);",
    '',
    source,
    count=1,
    flags=re.S,
)
assert count == 1, f'Firefox PAC status replacements: {count}'
firefox.write_text(source)

visual = ROOT / 'scripts/capture-visual-evidence.mjs'
replace_once(
    visual,
    "getByRole('button', { name: 'Proxy', exact: true })",
    "getByRole('button', { name: 'proxy', exact: true })",
    'visual default proxy',
)
