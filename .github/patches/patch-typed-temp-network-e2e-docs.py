from pathlib import Path

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:120]!r}')
    path.write_text(text.replace(old, new, 1))


def insert_before(path: Path, anchor: str, addition: str) -> None:
    text = path.read_text()
    count = text.count(anchor)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {anchor[:120]!r}')
    path.write_text(text.replace(anchor, addition + anchor, 1))


temp_path = ROOT / 'apps/extension/src/entrypoints/temp-rules/App.svelte'
network_path = ROOT / 'apps/extension/src/entrypoints/network/App.svelte'

chromium_path = ROOT / 'scripts/e2e-chromium.mjs'
replace_once(
    chromium_path,
    "  await temporaryManager.goto(`chrome-extension://${extensionId}/temp-rules.html`);\n  const temporaryRow = temporaryManager.locator('[data-temp-rule-domain=\"example.co.uk\"]');",
    "  await temporaryManager.goto(`chrome-extension://${extensionId}/temp-rules.html`);\n"
    "  const temporaryRulesShell = temporaryManager.locator(\n"
    "    '[data-temp-rules-manager][data-typed-locale=\"zh-CN\"]',\n"
    "  );\n"
    "  await temporaryRulesShell.waitFor({ state: 'visible', timeout: 20_000 });\n"
    "  await temporaryManager.getByRole('heading', { name: '临时规则', exact: true }).waitFor();\n"
    "  assert.doesNotMatch(\n"
    "    await temporaryRulesShell.innerText(),\n"
    "    /Temporary Rules|Delete all temporary rules|Result profile/u,\n"
    "    'Temporary Rules typed locale coverage regressed',\n"
    "  );\n"
    "  const temporaryRow = temporaryManager.locator('[data-temp-rule-domain=\"example.co.uk\"]');",
)
replace_once(
    chromium_path,
    ".getByRole('button', { name: 'Delete temporary rule for example.co.uk' })",
    ".getByRole('button', { name: '删除 example.co.uk 的临时规则' })",
)
replace_once(
    chromium_path,
    "  const diagnosticsStart = diagnosticsPage.locator('[data-request-diagnostics-start]');",
    "  const diagnosticsShell = diagnosticsPage.locator(\n"
    "    '[data-network-diagnostics][data-typed-locale=\"zh-CN\"]',\n"
    "  );\n"
    "  await diagnosticsShell.waitFor({ state: 'visible', timeout: 20_000 });\n"
    "  await diagnosticsPage.getByRole('heading', { name: '请求诊断', exact: true }).waitFor();\n"
    "  await diagnosticsPage.getByRole('button', { name: '开始监控', exact: true }).waitFor();\n"
    "  assert.doesNotMatch(\n"
    "    await diagnosticsShell.innerText(),\n"
    "    /Request diagnostics|Start monitoring|Clear diagnostics|No request errors recorded/u,\n"
    "    'Network typed locale coverage regressed',\n"
    "  );\n"
    "  const diagnosticsStart = diagnosticsPage.locator('[data-request-diagnostics-start]');",
)

firefox_path = ROOT / 'scripts/e2e-firefox.mjs'
firefox_anchor = """  await driver.get(`moz-extension://${extensionUuid}/options.html`);
  const newProfileAction = await driver.wait(
"""
firefox_insert = """  await driver.get(`moz-extension://${extensionUuid}/temp-rules.html`);
  await driver.wait(
    until.elementLocated(By.css('[data-temp-rules-manager][data-typed-locale="zh-TW"]')),
    15_000,
  );
  await driver.wait(
    until.elementLocated(By.xpath("//h1[normalize-space(.)='暫時規則']")),
    15_000,
  );
  await driver.wait(
    until.elementLocated(By.xpath("//*[normalize-space(.)='目前沒有作用中的暫時規則。']")),
    15_000,
  );

  await driver.get(`moz-extension://${extensionUuid}/network.html`);
  await driver.wait(
    until.elementLocated(By.css('[data-network-diagnostics][data-typed-locale="zh-TW"]')),
    15_000,
  );
  await driver.wait(
    until.elementLocated(By.xpath("//h1[normalize-space(.)='請求診斷']")),
    15_000,
  );
  await driver.wait(
    until.elementLocated(By.xpath("//button[normalize-space(.)='開始監控']")),
    15_000,
  );
  await driver.wait(
    until.elementLocated(By.css('[data-request-diagnostics-stopped]')),
    15_000,
  );

"""
insert_before(firefox_path, firefox_anchor, firefox_insert)

ui_guard_path = ROOT / 'scripts/validate-ui-compatibility.mjs'
replace_once(
    ui_guard_path,
    "      temporaryRulesManager.includes('Delete all temporary rules'),",
    "      temporaryRulesManager.includes('data-typed-locale={locale}') &&\n"
    "      temporaryRulesManager.includes(\"uiText('tempRules.clearAll', locale)\") &&\n"
    "      temporaryRulesManager.includes(\"uiMessage('tempRules.deleteAria'\") &&\n"
    "      chromiumE2e.includes('Temporary Rules typed locale coverage regressed') &&\n"
    "      firefoxE2e.includes('[data-temp-rules-manager][data-typed-locale=\"zh-TW\"]'),",
)
replace_once(
    ui_guard_path,
    "      requestDiagnosticsPage.includes('data-request-diagnostics-start') &&\n      requestDiagnosticsPage.includes('data-request-diagnostics-stop') &&",
    "      requestDiagnosticsPage.includes('data-request-diagnostics-start') &&\n"
    "      requestDiagnosticsPage.includes('data-request-diagnostics-stop') &&\n"
    "      requestDiagnosticsPage.includes('data-typed-locale={locale}') &&\n"
    "      requestDiagnosticsPage.includes(\"uiMessage(\\n        'network.bounds'\") &&\n"
    "      !requestDiagnosticsPage.includes(\"translate('Request diagnostics')\") &&\n"
    "      !requestDiagnosticsPage.includes('error instanceof Error ? error.message') &&",
)
replace_once(
    ui_guard_path,
    "      !requestDiagnosticsPage.includes('<a href={record.url}'),",
    "      !requestDiagnosticsPage.includes('<a href={record.url}') &&\n"
    "      chromiumE2e.includes('Network typed locale coverage regressed') &&\n"
    "      firefoxE2e.includes('[data-network-diagnostics][data-typed-locale=\"zh-TW\"]'),",
)

status_path = ROOT / 'docs/MILESTONE_8_STATUS.md'
insert_before(
    status_path,
    "### Typed Theme and Popup\n",
    """### Typed Temporary Rules and Network

- Temporary Rules and Network now directly render English, Simplified Chinese, and Traditional Chinese for page shells, tables, actions, empty/loading/error states, permission/session status, dynamic bounds, titles, buttons, and ARIA.
- Temporary Rules retains browser-session-only storage and session-only PAC snapshots. Network retains explicit start/stop, bounded session storage, sanitized non-navigating URLs, and production-disabled automatic monitoring.
- Both pages replace raw backend/exception messages with safe typed summaries; stable technical request codes such as `ERR_TIMEOUT` remain visible as evidence.
- Chromium verifies zh-CN manager/table/delete and diagnostics start/capture/clear/stop flows. Firefox verifies zh-TW empty/stopped shells without starting monitoring or broadening permissions.

""",
)
replace_once(
    status_path,
    "- remaining Temporary Rules/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,\n",
    "",
)
replace_once(
    status_path,
    "Migrate Temporary Rules and Network as the next typed vertical batch. Cover manager tables, delete/clear actions, diagnostics permission/start/stop/refresh/clear states, request columns/status, empty/error states, buttons, titles, dynamic counts, safe errors, and ARIA in all three locales while preserving session-only storage, bounded monitoring, sanitized URLs, and non-navigating request records.",
    "Audit and migrate the remaining literal-English Options surfaces from `docs/LOCALE_INVENTORY.json`, beginning with Built-in Profiles, About, new-profile shell text, profile headers/export actions, and any residual lifecycle status while preserving the original navigation and Draft/Applied boundaries.",
)

kg_path = ROOT / 'docs/ORIGINAL_KNOWLEDGE_GRAPH.md'
kg_addition = """

### Temporary Rules and Network typed presentation boundary

- Temporary Rules remain a browser-session overlay: rule state and temporary PAC snapshots stay in `storage.session`, survive worker restarts, clear on browser restart, and never enter the Options Draft.
- Network diagnostics remain explicit-session and bounded: monitoring starts only from the diagnostics page, stores sanitized failures in session storage, renders URLs as non-navigating code, and never collects headers, bodies, cookies, credentials, query strings, fragments, or response content.
- Both pages resolve one typed locale at entry, render all user-facing labels/status/ARIA through `ui-messages.ts`, and replace unstable backend or exception prose with safe semantic summaries. Stable request error codes remain visible as technical evidence.
- Chromium proves zh-CN temporary-rule deletion plus diagnostics start/capture/clear/stop. Firefox proves zh-TW empty/stopped shells without granting or starting request monitoring.
"""
text = kg_path.read_text()
if '### Temporary Rules and Network typed presentation boundary' not in text:
    kg_path.write_text(text.rstrip() + kg_addition + '\n')

matrix_path = ROOT / 'docs/UI_AUDIT_MATRIX.md'
text = matrix_path.read_text()
text = text.replace(
    '| I-06 | 临时规则           | `popup/temp_rules` | 非持久临时覆盖                 | MUST_MATCH | DONE     | PARTIAL',
    '| I-06 | 临时规则           | `popup/temp_rules` | 非持久临时覆盖                 | MUST_MATCH | DONE     | COMPLETE',
)
text = text.replace(
    '| I-08 | 请求错误列表       | popup/network      | 有界错误/请求查看              | MUST_MATCH | DONE     | PARTIAL',
    '| I-08 | 请求错误列表       | popup/network      | 有界错误/请求查看              | MUST_MATCH | DONE     | COMPLETE',
)
text = text.replace('locale 与 Firefox 交互', '保持 session-only 与双浏览器守卫', 1)
text = text.replace('补 Firefox 真实错误与完整 locale', '保持 bounded/privacy 与双浏览器守卫', 1)
if '2026-07-29 | 完成 Temporary Rules/Network typed 三语' not in text:
    text = text.rstrip() + (
        '\n| 2026-07-29 | 完成 Temporary Rules/Network typed 三语、safe error、Chromium 完整交互及 Firefox zh-TW 页面守卫 |\n'
    )
matrix_path.write_text(text)

for path, forbidden in [
    (temp_path, ['errorMessage = response.message', 'error instanceof Error ? error.message', '<h1>Temporary Rules</h1>']),
    (network_path, ["translate('Request diagnostics')", 'error instanceof Error ? error.message']),
]:
    source = path.read_text()
    for marker in forbidden:
        if marker in source:
            raise SystemExit(f'{path}: forbidden marker remains: {marker}')

print('Applied typed Temporary Rules and Network E2E, guards, and docs.')
