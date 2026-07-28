from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


# Options passes the already-resolved locale into PAC.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '        <PacProfileEditor\n          spec={state.draft}\n',
    '        <PacProfileEditor\n          {locale}\n          spec={state.draft}\n',
)

# Component rendering validates source-backed zh-CN PAC text and no English fallback.
component_path = 'apps/extension/src/component-rendering.component.spec.ts'
component_anchor = "  it('renders the inactive legacy import review entry point without secret values', () => {\n"
pac_component_test = r'''  it('renders the typed PAC editor in Simplified Chinese without literal English fallback', () => {
    const mutation = createPacProfileDraft(baseSpec(), idFactory(), 'PAC typed');
    const profile = mutation.draft.profiles.find(
      (candidate) => candidate.id === mutation.profileId,
    );
    if (!profile || profile.kind !== 'pac') throw new Error('typed PAC profile was not created');
    profile.source = {
      kind: 'url',
      url: 'https://pac.example.invalid/typed.pac',
      script: "function FindProxyForURL() { return 'DIRECT'; }",
    };
    profile.headers = [{ name: 'X-Typed', value: { kind: 'literal', value: 'typed' } }];
    profile.credential = { username: '测试用户', passwordSecretRef: 'secret-pac-typed' };
    const body = render(PacProfileEditor, {
      props: {
        locale: 'zh-CN',
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
        onRequestAuthenticationPermission: async () => true,
      },
    }).body;

    expect(body).toContain('data-typed-locale="zh-CN"');
    expect(body).toContain('PAC 网址');
    expect(body).toContain('PAC 脚本');
    expect(body).toContain('PAC 请求头 1 名称');
    expect(body).toContain('已为 测试用户 配置。');
    expect(body).toContain('警告: 用户名密码将会提供给PAC脚本返回的任何服务器');
    expect(body).not.toContain('Clear PAC URL');
    expect(body).not.toContain('Proxy Authentication permission was not granted');
    expect(body).not.toContain('secret-pac-typed');
  });

'''
replace_once(component_path, component_anchor, pac_component_test + component_anchor)

# Chromium uses direct typed PAC labels and validates locale identity.
chromium_path = 'scripts/e2e-chromium.mjs'
replace_once(
    chromium_path,
    "  await pacEditor.waitFor({ state: 'visible', timeout: 20_000 });\n  const pacUrl = pacEditor.getByRole('textbox', { name: 'PAC URL', exact: true });\n",
    "  await pacEditor.waitFor({ state: 'visible', timeout: 20_000 });\n  assert.equal(await pacEditor.getAttribute('data-typed-locale'), 'zh-CN');\n  await pacEditor.getByRole('heading', { name: 'PAC 网址', exact: true }).waitFor();\n  assert.doesNotMatch(await pacEditor.innerText(), /PAC URL|PAC Script|Proxy Authentication/u);\n  const pacUrl = pacEditor.getByRole('textbox', { name: 'PAC 网址', exact: true });\n",
)
replace_once(chromium_path, ".filter({ hasText: 'Last updated' })", ".filter({ hasText: 'PAC 脚本下载时间' })")
replace_once(
    chromium_path,
    "  const pacScript = pacEditor.getByLabel('PAC Script', { exact: true });\n",
    "  const pacScript = pacEditor.getByLabel('PAC 脚本', { exact: true });\n",
)
replace_once(
    chromium_path,
    "  await pacEditor.getByRole('button', { name: 'Clear PAC URL', exact: true }).click();\n",
    "  await pacEditor.getByRole('button', { name: '清空 PAC 网址', exact: true }).click();\n",
)
replace_once(
    chromium_path,
    "  const pacAuthUsername = pacAuthDialog.getByLabel('PAC authentication username');\n",
    "  const pacAuthUsername = pacAuthDialog.getByLabel('PAC 代理登录用户名');\n",
)
replace_once(
    chromium_path,
    "  await pacAuthDialog.getByLabel('PAC authentication password').fill('pac-e2e-secret');\n",
    "  await pacAuthDialog.getByLabel('PAC 代理登录密码').fill('pac-e2e-secret');\n",
)

# Firefox creates, applies, activates, and verifies a top-level inline raw PAC through real UI.
firefox_path = 'scripts/e2e-firefox.mjs'
firefox_anchor = "  console.log(`Firefox extension E2E passed for ${installedId}.`);\n"
firefox_pac = r'''  await driver.get(`moz-extension://${extensionUuid}/options.html`);
  const newProfileAction = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-action]')),
    15_000,
  );
  await newProfileAction.click();
  const newPacName = await driver.wait(
    until.elementLocated(By.css('[data-new-profile-name-input]')),
    15_000,
  );
  await driver.executeScript(
    `
      const input = arguments[0];
      const value = arguments[1];
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    `,
    newPacName,
    'Firefox PAC E2E',
  );
  const pacChoice = await driver.findElement(By.css('[data-new-profile-kind="pac"]'));
  await pacChoice.click();
  const createPac = await driver.findElement(By.css('[data-new-profile-create]'));
  await driver.wait(until.elementIsEnabled(createPac), 10_000);
  await createPac.click();
  const pacEditor = await driver.wait(
    until.elementLocated(By.css('[data-pac-profile-editor][data-typed-locale="zh-TW"]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(pacEditor), 20_000);
  await driver.wait(until.elementLocated(By.xpath("//h2[normalize-space(.)='PAC 網址']")), 15_000);
  const pacScript = await driver.wait(
    until.elementLocated(By.css('[data-pac-script-section] textarea[aria-label="PAC 指令碼"]')),
    15_000,
  );
  await driver.executeScript(
    `
      const textarea = arguments[0];
      const value = arguments[1];
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(textarea, value);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    `,
    pacScript,
    "function FindProxyForURL(url, host) { return 'DIRECT'; }\n",
  );
  const pacApply = await driver.wait(
    until.elementLocated(By.css('.actions button.primary')),
    15_000,
  );
  await driver.wait(until.elementIsEnabled(pacApply), 15_000);
  await pacApply.click();
  await driver.wait(
    until.elementLocated(By.xpath("//*[contains(normalize-space(.), '目前設定已全部套用。') ]")),
    20_000,
  );
  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
  const pacRoute = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., 'Firefox PAC E2E')]")),
    15_000,
  );
  await pacRoute.click();
  await driver.wait(until.elementIsDisabled(pacRoute), 20_000);
  const pacRuntime = await driver.executeAsyncScript(`
    const done = arguments[0];
    browser.storage.local.get(null).then((storage) => {
      const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
      const profile = workflow?.applied?.profiles?.find((candidate) => candidate.name === 'Firefox PAC E2E');
      const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
      const snapshot = proxyState?.activeSnapshotId
        ? storage['zeroomega-nex/browser-proxy/v1/snapshot/' + proxyState.activeSnapshotId]
        : undefined;
      done({
        profileId: profile?.id,
        kind: profile?.kind,
        compilerVersion: snapshot?.compilerVersion,
        startRoute: snapshot?.startRoute,
        script: snapshot?.script,
      });
    }, (error) => done({ error: String(error) }));
  `);
  assert.equal(pacRuntime.kind, 'pac', 'Firefox PAC profile was not applied');
  assert.equal(pacRuntime.compilerVersion, 'raw-pac/1', 'Firefox did not install a raw PAC snapshot');
  assert.equal(pacRuntime.startRoute?.kind, 'profile');
  assert.equal(pacRuntime.startRoute?.profileId, pacRuntime.profileId);
  assert.match(pacRuntime.script ?? '', /FindProxyForURL/u);
  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
  const finalDirect = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., '直接連線')]")),
    15_000,
  );
  await finalDirect.click();
  await driver.wait(until.elementIsDisabled(finalDirect), 15_000);

'''
replace_once(firefox_path, firefox_anchor, firefox_pac + firefox_anchor)

# Machine inventory now treats PAC as a completed typed component.
replace_once(
    'scripts/generate-locale-inventory.mjs',
    "  'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',\n];\n",
    "  'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',\n  'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',\n];\n",
)

# Permanent locale guard includes PAC, App wiring, dynamic status, and Firefox raw-PAC evidence.
validator_path = 'scripts/validate-localization.mjs'
replace_once(
    validator_path,
    "  independentRuleList: 'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',\n  app: 'apps/extension/src/entrypoints/options/App.svelte',\n",
    "  independentRuleList: 'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',\n  pac: 'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',\n  firefoxE2e: 'scripts/e2e-firefox.mjs',\n  app: 'apps/extension/src/entrypoints/options/App.svelte',\n",
)
replace_once(
    validator_path,
    "  ['Independent Rule List', entries.independentRuleList],\n]) {\n",
    "  ['Independent Rule List', entries.independentRuleList],\n  ['PAC Profile', entries.pac],\n]) {\n",
)
replace_once(
    validator_path,
    "  [\n    entries.independentRuleList,\n    'aria-label=\"Rule List text\"',\n    'Independent Rule List ARIA regressed to literal English.',\n  ],\n])\n",
    "  [\n    entries.independentRuleList,\n    'aria-label=\"Rule List text\"',\n    'Independent Rule List ARIA regressed to literal English.',\n  ],\n  [entries.pac, '<h2>PAC URL</h2>', 'PAC URL heading regressed to literal English.'],\n  [entries.pac, 'aria-label=\"PAC Script\"', 'PAC Script ARIA regressed to literal English.'],\n  [entries.pac, '>Download now</button>', 'PAC download action regressed to literal English.'],\n  [entries.pac, 'Proxy authentication permission was not granted.', 'PAC auth error regressed to literal English.'],\n])\n",
)
replace_once(
    validator_path,
    "requireText(\n  entries.app,\n  '<RuleListProfileEditor\\n          {locale}',\n  'Options must pass locale to independent Rule List.',\n);\n",
    "requireText(\n  entries.app,\n  '<RuleListProfileEditor\\n          {locale}',\n  'Options must pass locale to independent Rule List.',\n);\nrequireText(\n  entries.app,\n  '<PacProfileEditor\\n          {locale}',\n  'Options must pass locale to PAC Profile.',\n);\n",
)
replace_once(
    validator_path,
    "requireText(\n  entries.catalog,\n  \"readonly 'ruleList.lastUpdated'\",\n  'Typed Rule List update status messages are missing.',\n);\n",
    "requireText(\n  entries.catalog,\n  \"readonly 'ruleList.lastUpdated'\",\n  'Typed Rule List update status messages are missing.',\n);\nrequireText(\n  entries.catalog,\n  \"readonly 'pac.lastUpdated'\",\n  'Typed PAC update status messages are missing.',\n);\nrequireText(\n  entries.firefoxE2e,\n  \"compilerVersion, 'raw-pac/1'\",\n  'Firefox PAC raw-snapshot interaction coverage is missing.',\n);\n",
)

# Existing UI guard recognizes typed PAC text and translated Chromium selectors.
ui_guard = 'scripts/validate-ui-compatibility.mjs'
replace_once(
    ui_guard,
    "      pacProfileEditor.includes('data-pac-profile-editor') &&\n",
    "      pacProfileEditor.includes('data-pac-profile-editor') &&\n      pacProfileEditor.includes('data-typed-locale={locale}') &&\n      pacProfileEditor.includes(\"uiText('pac.url', locale)\") &&\n      pacProfileEditor.includes(\"'pac.lastUpdated'\") &&\n",
)
replace_once(
    ui_guard,
    "      chromiumE2e.includes(\"name: 'Clear PAC URL'\") &&\n",
    "      chromiumE2e.includes(\"name: '清空 PAC 网址'\") &&\n",
)
replace_once(
    ui_guard,
    "      pacProfileEditor.includes('Proxy authentication permission was not granted.') &&\n",
    "      pacProfileEditor.includes(\"uiText('pac.authPermissionDenied', locale)\") &&\n",
)

# Durable knowledge graph and audit reflect implemented scope without claiming file activation.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg = kg_path.read_text()
kg_append = r'''

- typed locale PAC 批次直接覆盖 `PacProfileEditor` 的 URL/Clear、远程请求头、下载/缓存状态、脚本文本、`auth.all`、file 警告、fallback、按钮、placeholder 与 ARIA。zh-CN/zh-TW 文案来自固定 v3.5.0 `profile_pac.jade` 与 PO；现代背景秘密引用、结构验证和能力 fallback 使用同一术语体系。
- PAC 更新 ledger 与 Rule Source 一样仍只有底层 `message`，没有稳定错误码；UI 只显示 typed 失败摘要并保留旧缓存，不直接暴露不稳定英文。认证读取/授权/保存/删除异常改为不含秘密的 typed 通用错误，避免把后台异常或凭据细节渲染到页面。
- 原版 `auth.all` 三层警告已恢复：任意 PAC 返回代理可能收到凭据、URL/内联脚本必须可信、被其他 Profile 引用时可能把凭据发送到其他配置的代理。现代运行时仍只在顶层活动 PAC 下响应代理 Basic/Digest，不响应网站认证。
- Firefox E2E 通过真实 New Profile 模态框创建内联 PAC、编辑脚本、正常 Apply、Popup 激活并读取后台存储验证 `raw-pac/1` structural snapshot 与 startRoute；这证明现代顶层 PAC 可跨浏览器激活，但不代表 Firefox 远程下载权限流程或 `file:` PAC 已完成。
'''
if kg_append.strip() not in kg:
    kg_path.write_text(kg.rstrip() + kg_append)

# Audit rows F-01..F-07 and localization summary.
audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
rows = {
    'F-01': '| F-01 | PAC URL | `profile_pac.jade` | 单独 URL 输入/清除 | MUST_MATCH | DONE | COMPLETE | URL/Clear/帮助/placeholder/ARIA 已按固定原版 PO 直接三语渲染；Clear 保留缓存并回到 inline，Chromium 覆盖 | 保持回归 |',
    'F-02': '| F-02 | file URL 警告 | 同上 | 按引用和 target 显示 | MUST_MATCH | PARTIAL | COMPLETE | standalone 与 referenced 警告使用原版中繁文案；脚本隐藏；现代 adapter 仍明确不支持 `file:` 激活 | 形成 target 能力决定 |',
    'F-03': '| F-03 | PAC 请求头 | 同上 | 远程 URL 时可展开 | MUST_MATCH | DONE | COMPLETE | 远程 HTTP/HTTPS 时显示；标题、帮助、类型、动作及动态 ARIA 三语化；秘密值仍后台持有 | 补秘密值编辑 UX |',
    'F-04': '| F-04 | PAC 立即下载 | 同上 | 更新远程脚本 | MUST_MATCH | DONE | COMPLETE | 安全 downloader/权限/10 秒/4 MiB/CAS/失败保旧缓存保持；动作和更新摘要三语化；Chromium 真实下载 | 补 Firefox 远程权限下载 |',
    'F-05': '| F-05 | PAC Script | 同上 | URL 时下载结果/只读；无 URL 可编辑 | MUST_MATCH | DONE | COMPLETE | Script 标题/ARIA/file 隐藏说明三语化；Chromium 覆盖下载→Clear→编辑，Firefox 覆盖 inline Apply/激活与 `raw-pac/1` | 保持双浏览器回归 |',
    'F-06': '| F-06 | PAC 认证全部代理 | 同上 | 入口和浏览器警告 | MUST_MATCH | DONE | COMPLETE | `auth.all` 原版三层警告、状态、对话框、错误及 ARIA 三语化；secret/ref 与 exact/wildcard 安全边界保持 | 真实 407 人工巡查 |',
    'F-07': '| F-07 | 不支持目标提示 | 同上 | 明确错误 | MUST_MATCH | DONE | COMPLETE | 顶层 inline/缓存 PAC 跨 Chromium/Firefox 激活；file/无缓存/无入口点及嵌套任意 PAC 继续明确失败；UI 能力/fallback 文案三语化 | 明确 `file:` 范围 |',
    'H-02': '| H-02 | 简体中文 | `zh_CN` | 全 UI locale | MUST_MATCH | PARTIAL | PARTIAL | typed 已覆盖第一、Switch/Rule List 与 PAC 垂直批次；inventory 跟踪通用页面、Popup 与 Network | 继续 General/辅助页 |',
    'H-03': '| H-03 | 正體中文 | `zh_TW/zh_Hant` | 全 UI locale | MUST_MATCH | PARTIAL | PARTIAL | typed 使用原版 `情境模式/代理認證/PAC 指令碼` 术语；Firefox 已验证 PAC 创建与激活 | 继续通用页面 |',
    'H-04': '| H-04 | 动态文本 | locale/controller | 状态变化后仍翻译 | MUST_MATCH | PARTIAL | PARTIAL | 生命周期、Fixed、Switch parser、Rule List/PAC 更新摘要与 PAC auth 异常使用 typed 参数/状态；下载底层错误码仍待统一 | 错误码化与剩余页面 |',
    'H-05': '| H-05 | select option | locale | 条件/协议/格式均翻译 | MUST_MATCH | PARTIAL | PARTIAL | Fixed、Switch、Rule List、PAC fallback 选项已 typed；General/其他组件仍由 observer/英文源码混合 | 继续 inventory 批次 |',
    'H-06': '| H-06 | placeholder/title/aria | locale/template | 一同翻译 | MUST_MATCH | PARTIAL | PARTIAL | Fixed/New/生命周期/Switch/Rule List/PAC 已直接 typed；Chromium zh-CN 与 Firefox zh-TW 断言覆盖 | 扩展自动 DOM 巡查 |',
    'H-07': '| H-07 | 错误和确认框 | locale | 全部本地化 | MUST_MATCH | PARTIAL | PARTIAL | New/Fixed/生命周期/Switch/PAC auth 已 typed；Rule/PAC 下载底层错误码与其他页面仍待迁移 | 继续统一错误码翻译 |',
}
seen = set()
for index, line in enumerate(lines):
    if not line.startswith('| '):
        continue
    parts = line.split('|')
    if len(parts) < 3:
        continue
    row_id = parts[1].strip()
    if row_id in rows:
        lines[index] = rows[row_id]
        seen.add(row_id)
missing = set(rows) - seen
if missing:
    raise SystemExit(f'audit rows not found: {sorted(missing)}')
audit_path.write_text('\n'.join(lines) + '\n')

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
section = r'''

### Typed PAC locale and Firefox interaction

- `PacProfileEditor` now directly renders English, Simplified Chinese, and Traditional Chinese for URL/Clear, remote headers, download/cache state, script, `auth.all`, file warnings, fallback, actions, placeholders and ARIA using the semantic typed catalog.
- Fixed v3.5.0 `profile_pac.jade` and PO files are the source for PAC URL/script terminology, file warnings, obsolete state, download action, username/password, and the three original all-proxy credential warnings.
- Unstable lower-level PAC downloader messages are not rendered directly; the UI emits localized status while preserving cached script. Authentication read/permission/save/remove failures use non-secret typed errors.
- Chromium keeps remote HTTP download, Clear-to-inline and all-proxy authentication coverage with zh-CN selectors. Firefox creates an inline PAC through the real New Profile flow, applies it, activates it from Popup, and verifies a `raw-pac/1` snapshot and PAC start route.
- This slice does not claim Firefox remote-origin permission/download coverage, real 407 acceptance, or `file:` PAC activation.
'''
if section.strip() not in status:
    marker = '\n## Automated acceptance state\n'
    if status.count(marker) != 1:
        raise SystemExit('status automated acceptance marker missing')
    status_path.write_text(status.replace(marker, section + marker, 1))
