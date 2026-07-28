from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


def replace_all(path: str, old: str, new: str, expected: int) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != expected:
        raise SystemExit(f'{path}: expected {expected} matches, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new))


# Preserve established English ARIA contracts while using source-backed Chinese wording.
replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    "  'ruleList.attachedText': { en: 'Attached Rule List text', 'zh-CN': '附属规则列表正文', 'zh-TW': '附屬規則清單正文' },\n",
    "  'ruleList.attachedText': { en: 'Attached Rule List text', 'zh-CN': '附属规则列表正文', 'zh-TW': '附屬規則清單正文' },\n"
    "  'ruleList.attachedDownloadedText': { en: 'Attached Rule List downloaded text', 'zh-CN': '附属规则列表已下载正文', 'zh-TW': '附屬規則清單已下載正文' },\n"
    "  'ruleList.matchProfileAria': { en: 'Rule List match profile', 'zh-CN': '规则列表匹配时使用的情景模式', 'zh-TW': '規則清單符合時使用的情境模式' },\n"
    "  'ruleList.defaultProfileAria': { en: 'Rule List default profile', 'zh-CN': '规则列表不匹配时使用的情景模式', 'zh-TW': '規則清單不符合時使用的情境模式' },\n"
    "  'ruleList.textAria': { en: 'Rule List text', 'zh-CN': '规则列表正文', 'zh-TW': '規則清單正文' },\n",
)
replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    '''    case 'ruleList.headerAria': {
      const { scope, index, field } = params as UiMessageParameters['ruleList.headerAria'];
      const scopeText =
        scope === 'attached'
          ? locale === 'en'
            ? 'Attached'
            : locale === 'zh-CN'
              ? '附属'
              : '附屬'
          : locale === 'en'
            ? 'Rule List'
            : locale === 'zh-CN'
              ? '规则列表'
              : '規則清單';
      const fieldText =
        field === 'name'
          ? uiText('ruleList.headerName', locale)
          : field === 'type'
            ? uiText('ruleList.headerType', locale)
            : uiText('ruleList.headerValue', locale);
      return `${scopeText} ${index} ${fieldText}`;
    }
''',
    '''    case 'ruleList.headerAria': {
      const { scope, index, field } = params as UiMessageParameters['ruleList.headerAria'];
      if (locale === 'en') {
        const prefix = scope === 'attached' ? 'Attached header' : 'Rule List header';
        const suffix = field === 'name' ? 'name' : field === 'type' ? 'value type' : 'value';
        return `${prefix} ${index} ${suffix}`;
      }
      const prefix =
        scope === 'attached'
          ? locale === 'zh-CN'
            ? '附属请求头'
            : '附屬請求標頭'
          : locale === 'zh-CN'
            ? '规则列表请求头'
            : '規則清單請求標頭';
      const suffix =
        field === 'name'
          ? locale === 'zh-CN'
            ? '名称'
            : '名稱'
          : field === 'type'
            ? locale === 'zh-CN'
              ? '值类型'
              : '值類型'
            : '值';
      return `${prefix} ${index} ${suffix}`;
    }
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',
    "aria-label={uiText('ruleList.downloadedText', locale)}",
    "aria-label={uiText('ruleList.attachedDownloadedText', locale)}",
)
replace_once(
    'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',
    "aria-label={uiText('ruleList.matchProfile', locale)}",
    "aria-label={uiText('ruleList.matchProfileAria', locale)}",
)
replace_once(
    'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',
    "aria-label={uiText('ruleList.defaultProfile', locale)}",
    "aria-label={uiText('ruleList.defaultProfileAria', locale)}",
)
replace_once(
    'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',
    "aria-label={uiText('ruleList.text', locale)}",
    "aria-label={uiText('ruleList.textAria', locale)}",
)

# Options resolves one locale and passes it to all editors in this batch.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''          <SwitchProfileEditor
            spec={state.draft}
''',
    '''          <SwitchProfileEditor
            {locale}
            spec={state.draft}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''        <RuleListProfileEditor
          spec={state.draft}
''',
    '''        <RuleListProfileEditor
          {locale}
          spec={state.draft}
''',
)

# Typed catalog unit coverage for source errors, status text, and stable English ARIA.
replace_once(
    'apps/extension/src/lib/ui-messages.test.ts',
    '''  it('formats dynamic deletion and accessibility messages without English fallback', () => {
''',
    '''  it('formats Switch and Rule List dynamic messages in all three locales', () => {
    expect(
      uiMessage(
        'switch.ruleFieldAria',
        { index: 2, field: 'resultProfile' },
        'zh-CN',
      ),
    ).toBe('规则 2 的结果情景模式');
    expect(
      uiMessage(
        'switch.sourceError',
        { code: 'switch-source.no-default-rule', line: 4 },
        'zh-TW',
      ),
    ).toBe('第 4 行：必須以「* +profile」預設規則結尾。');
    expect(
      uiMessage(
        'ruleList.headerAria',
        { scope: 'attached', index: 1, field: 'name' },
        'en',
      ),
    ).toBe('Attached header 1 name');
    expect(
      uiMessage(
        'ruleList.lastUpdated',
        { timestamp: '2026/7/28 14:00', bytes: 128, stale: true },
        'zh-CN',
      ),
    ).toContain('规则列表最后更新于 2026/7/28 14:00');
  });

  it('formats dynamic deletion and accessibility messages without English fallback', () => {
''',
)

# Component-level zh-CN and zh-TW coverage for the complete second vertical batch.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''  it('renders the original PAC URL, headers, download status, and read-only cache sections', () => {
''',
    '''  it('renders the second typed locale batch for Switch and Rule List editors', () => {
    const ids = idFactory();
    const created = createSwitchProfileDraft(baseSpec(), ids, '切换');
    const withRule = addSwitchRuleDraft(created.draft, created.profileId, ids, 'host-wildcard');
    const attached = createAttachedRuleListDraft(withRule.draft, created.profileId, ids);
    const attachedSource = attached.ruleSources.at(-1);
    if (!attachedSource) throw new Error('attached source missing');
    attachedSource.location = {
      kind: 'url',
      url: 'https://rules.example.invalid/typed.txt',
      content: 'typed attached cache',
    };
    attachedSource.headers = [
      { name: 'X-Typed', value: { kind: 'literal', value: 'typed-value' } },
    ];
    const switchBody = render(SwitchProfileEditor, {
      props: {
        locale: 'zh-CN',
        spec: attached,
        profileId: created.profileId,
        disabled: false,
        idFactory: ids,
        onReplaceDraft: replaceDraft,
        onRegisterBeforeAction: () => undefined,
        onSourceDirtyChange: () => undefined,
      },
    }).body;
    expect(switchBody).toContain('data-typed-locale="zh-CN"');
    expect(switchBody).toContain('切换规则');
    expect(switchBody).toContain('条件类型');
    expect(switchBody).toContain('条件设置');
    expect(switchBody).toContain('添加条件');
    expect(switchBody).toContain('规则列表规则');
    expect(switchBody).toContain('附属规则列表设置');
    expect(switchBody).toContain('附属请求头 1 名称');
    expect(switchBody).not.toContain('Switch rules');
    expect(switchBody).not.toContain('Attached Rule List configuration');

    const independent = createRuleListProfileDraft(baseSpec(), ids, '規則');
    const independentSource = independent.draft.ruleSources.at(-1);
    if (!independentSource) throw new Error('independent source missing');
    independentSource.location = {
      kind: 'url',
      url: 'https://rules.example.invalid/independent.txt',
      content: 'typed independent cache',
    };
    const independentBody = render(RuleListProfileEditor, {
      props: {
        locale: 'zh-TW',
        spec: independent.draft,
        profileId: independent.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    }).body;
    expect(independentBody).toContain('data-typed-locale="zh-TW"');
    expect(independentBody).toContain('規則清單設定');
    expect(independentBody).toContain('規則清單網址');
    expect(independentBody).toContain('規則清單正文');
    expect(independentBody).toContain('規則清單符合時使用的情境模式');
    expect(independentBody).not.toContain('Rule List Config');
  });

  it('renders the original PAC URL, headers, download status, and read-only cache sections', () => {
''',
)

# Real Chromium uses zh-CN; update selectors and assert direct typed rendering.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  const switchRulesSection = options.locator('[data-switch-source-mode]');
  await switchRulesSection.waitFor({ state: 'visible', timeout: 20_000 });
''',
    '''  const switchRulesSection = options.locator('[data-switch-source-mode]');
  await switchRulesSection.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await switchRulesSection.getAttribute('data-typed-locale'), 'zh-CN');
  await switchRulesSection.getByRole('heading', { name: '切换规则', exact: true }).waitFor();
  await switchRulesSection.getByRole('columnheader', { name: '条件类型', exact: true }).waitFor();
  await switchRulesSection.getByRole('columnheader', { name: '条件设置', exact: true }).waitFor();
  assert.doesNotMatch(await switchRulesSection.innerText(), /Switch rules|Condition type|Condition details/u);
''',
)
replace_all(
    'scripts/e2e-chromium.mjs',
    "getByLabel('Rule 1 pattern')",
    "getByLabel('规则 1 的匹配内容')",
    3,
)
replace_all(
    'scripts/e2e-chromium.mjs',
    "getByLabel('Rule 2 pattern')",
    "getByLabel('规则 2 的匹配内容')",
    3,
)
replace_once(
    'scripts/e2e-chromium.mjs',
    "  await independentRuleEditor.getByRole('heading', { name: 'Rule List Config' }).waitFor();\n",
    "  await independentRuleEditor.getByRole('heading', { name: '规则列表设置', exact: true }).waitFor();\n  assert.equal(await independentRuleEditor.getAttribute('data-typed-locale'), 'zh-CN');\n  assert.doesNotMatch(await independentRuleEditor.innerText(), /Rule List Config|Rule List URL|Rule List Text/u);\n",
)
replace_all(
    'scripts/e2e-chromium.mjs',
    "getByLabel('Rule List match profile')",
    "getByLabel('规则列表匹配时使用的情景模式')",
    2,
)
replace_once(
    'scripts/e2e-chromium.mjs',
    "getByLabel('Rule List default profile')",
    "getByLabel('规则列表不匹配时使用的情景模式')",
)
replace_all(
    'scripts/e2e-chromium.mjs',
    "name: 'Rule List URL'",
    "name: '规则列表网址'",
    2,
)
replace_once(
    'scripts/e2e-chromium.mjs',
    "await independentStatus.filter({ hasText: 'Last updated' }).waitFor({ timeout: 20_000 });",
    "await independentStatus.filter({ hasText: '规则列表最后更新于' }).waitFor({ timeout: 20_000 });",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    "const independentText = independentRuleEditor.getByLabel('Rule List text');",
    "const independentText = independentRuleEditor.getByLabel('规则列表正文');",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    "getByRole('button', { name: 'Clear Rule List URL' })",
    "getByRole('button', { name: '清除规则列表网址' })",
)

# Inventory excludes the newly completed batch; permanent guard enforces typed wiring.
replace_once(
    'scripts/generate-locale-inventory.mjs',
    '''  'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
];
''',
    '''  'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
  'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
  'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',
  'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',
];
''',
)
replace_once(
    'scripts/validate-localization.mjs',
    '''  replacement: 'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
  app: 'apps/extension/src/entrypoints/options/App.svelte',
''',
    '''  replacement: 'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
  switchProfile: 'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
  attachedRuleList: 'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',
  independentRuleList: 'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',
  app: 'apps/extension/src/entrypoints/options/App.svelte',
''',
)
replace_once(
    'scripts/validate-localization.mjs',
    "  ['Fixed Profile', entries.fixed],\n]) {\n",
    "  ['Fixed Profile', entries.fixed],\n  ['Switch Profile', entries.switchProfile],\n  ['Attached Rule List', entries.attachedRuleList],\n  ['Independent Rule List', entries.independentRuleList],\n]) {\n",
)
replace_once(
    'scripts/validate-localization.mjs',
    '''  [
    entries.fixed,
    "authError = 'Proxy server no longer exists.'",
    'Fixed error regressed to literal English.',
  ],
])
''',
    '''  [
    entries.fixed,
    "authError = 'Proxy server no longer exists.'",
    'Fixed error regressed to literal English.',
  ],
  [entries.switchProfile, '<h2>Switch rules</h2>', 'Switch heading regressed to literal English.'],
  [entries.switchProfile, '>Condition type</th>', 'Switch condition header regressed to literal English.'],
  [entries.switchProfile, 'aria-label="Switch Profile source"', 'Switch source ARIA regressed to literal English.'],
  [entries.attachedRuleList, '<h2>Attached Rule List configuration</h2>', 'Attached Rule List heading regressed to literal English.'],
  [entries.attachedRuleList, '>Download now</button>', 'Attached Rule List action regressed to literal English.'],
  [entries.independentRuleList, '<h2>Rule List Config</h2>', 'Independent Rule List heading regressed to literal English.'],
  [entries.independentRuleList, 'aria-label="Rule List text"', 'Independent Rule List ARIA regressed to literal English.'],
])
''',
)
replace_once(
    'scripts/validate-localization.mjs',
    '''requireText(
  entries.app,
  '<ProfileDeletionDialog\n    {locale}',
  'Options must pass locale to deletion dialog.',
);
''',
    '''requireText(
  entries.app,
  '<ProfileDeletionDialog\n    {locale}',
  'Options must pass locale to deletion dialog.',
);
requireText(
  entries.app,
  '<SwitchProfileEditor\n            {locale}',
  'Options must pass locale to Switch Profile.',
);
requireText(
  entries.app,
  '<RuleListProfileEditor\n          {locale}',
  'Options must pass locale to independent Rule List.',
);
requireText(
  entries.catalog,
  "readonly 'switch.sourceError'",
  'Typed Switch source error messages are missing.',
);
requireText(
  entries.catalog,
  "readonly 'ruleList.lastUpdated'",
  'Typed Rule List update status messages are missing.',
);
''',
)

# Source-parity guards must recognize typed keys rather than literal English source.
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''      switchProfile.includes('Condition help') &&
      switchProfile.includes('<optgroup label={group.label}>') &&
      switchProfile.includes('Default profile') &&
''',
    '''      switchProfile.includes("uiText('switch.conditionHelp', locale)") &&
      switchProfile.includes('<optgroup label={uiText(group.labelKey, locale)}>') &&
      switchProfile.includes("uiText('switch.defaultProfile', locale)") &&
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    "      chromiumE2e.includes(\"getByRole('button', { name: 'Clear Rule List URL' })\"),\n",
    "      chromiumE2e.includes(\"getByRole('button', { name: '清除规则列表网址' })\"),\n",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    "      attachedRuleListConfig.includes('Existing cached content was preserved') &&\n",
    "      attachedRuleListConfig.includes(\"uiMessage('ruleList.updateFailed'\") &&\n",
)

# Durable knowledge and acceptance matrix.
kg = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg.write_text(
    kg.read_text().rstrip()
    + r'''

- typed locale 第二批覆盖 `SwitchProfileEditor`、`AttachedRuleListConfig` 与独立 `RuleListProfileEditor`：原版条件组/表格/默认情景模式/在线规则列表三段结构使用固定 v3.5.0 PO 术语，Nex 新增拖放、缓存、秘密引用与更新状态沿用同一术语体系。
- Switch source parser 已有稳定 `SwitchSourceError.code`，UI 通过 code 与可选行号生成三语消息，不再把底层英文 parser message 直接展示。Rule Source 下载 ledger 尚无稳定错误码，本批只本地化失败状态并隐藏不稳定底层 message；将下载错误码化列为后续边界，不能据此宣称所有底层错误已完整翻译。
- 第二批组件直接接收 `AppLocale`，所有条件帮助、列名、动作、placeholder、更新摘要和 ARIA 均走 `uiText/uiMessage`；English 保留既有无障碍名称顺序，zh-CN/zh-TW 使用源证据术语。机器 inventory 排除三份已完成组件，永久 locale guard 阻止字面英文回流。
'''
    + '\n'
)

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
audit = audit_path.read_text()
audit = audit.replace(
    '| H-02 | 简体中文               | `zh_CN`                  | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | typed 第一批已覆盖 New Profile、生命周期对话框、Fixed、路由/Profile 类型；机器 inventory 跟踪其余页面 | 继续 Switch/PAC/Rule List |',
    '| H-02 | 简体中文               | `zh_CN`                  | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | typed 已覆盖第一批及 Switch/Attached/Independent Rule List；inventory 跟踪 PAC 与通用页面 | 继续 PAC/General          |',
)
audit = audit.replace(
    '| H-03 | 正體中文               | `zh_TW/zh_Hant`          | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | typed 第一批使用原版 `情境模式/代理認證/連接埠` 术语；组件覆盖，机器 inventory 跟踪其余页面 | 继续 Switch/PAC/Rule List |',
    '| H-03 | 正體中文               | `zh_TW/zh_Hant`          | 全 UI locale                      | MUST_MATCH | PARTIAL    | PARTIAL  | typed 已覆盖第一批及 Switch/Rule List，沿用 `條件類型/規則清單/情境模式` 原版术语；inventory 跟踪其余页面 | 继续 PAC/General          |',
)
audit = audit.replace(
    '| H-04 | 动态文本               | locale/controller        | 状态变化后仍翻译                  | MUST_MATCH | PARTIAL    | PARTIAL  | 删除说明、Fixed 错误/ARIA 已改为 typed 参数消息；observer 仅作为未迁移页面兼容层 | 继续迁移动态状态          |',
    '| H-04 | 动态文本               | locale/controller        | 状态变化后仍翻译                  | MUST_MATCH | PARTIAL    | PARTIAL  | Switch source 按稳定 code+line 本地化；Rule List 更新摘要 typed；下载底层错误码仍缺 | 错误码化 PAC/Rule 下载    |',
)
audit = audit.replace(
    '| H-06 | placeholder/title/aria | locale/template          | 一同翻译                          | MUST_MATCH | PARTIAL    | PARTIAL  | 第一批 Fixed/New/Profile 生命周期的 placeholder/title/ARIA 直接 typed；Chromium zh-CN 断言覆盖 | 扩展自动 DOM 巡查         |',
    '| H-06 | placeholder/title/aria | locale/template          | 一同翻译                          | MUST_MATCH | PARTIAL    | PARTIAL  | 第一、二批 placeholder/title/ARIA 直接 typed；Switch 拖放/规则字段及 Rule List header 控件已覆盖 | 扩展 PAC/General DOM 巡查 |',
)
audit = audit.replace(
    '| H-07 | 错误和确认框           | locale                   | 全部本地化                        | MUST_MATCH | PARTIAL    | PARTIAL  | New Profile 校验、Fixed 错误、删除/替换确认已 typed 覆盖三语；其余编辑器仍待迁移 | 继续统一错误码翻译        |',
    '| H-07 | 错误和确认框           | locale                   | 全部本地化                        | MUST_MATCH | PARTIAL    | PARTIAL  | 第一批确认/Fixed 错误及 Switch source code 已三语；Rule Source 底层下载错误仍无稳定 code | 继续下载/PAC 错误码化     |',
)
audit_path.write_text(audit)

status_path = Path('docs/MILESTONE_8_STATUS.md')
status_path.write_text(
    status_path.read_text().rstrip()
    + r'''

### Typed locale second vertical batch

- Switch Profile condition groups/help, source mode, compact table, drag/keyboard ordering ARIA, rule actions/notes, attached Rule List row, default route, and online attachment section now render through typed three-locale keys.
- Attached and independent Rule List editors localize Config/URL/Text structure, route selectors, formats, source mode, headers, update actions/status, downloaded cache, placeholders, and ARIA. English ARIA contracts remain stable while zh-CN/zh-TW use source-backed terminology.
- Switch parser errors use stable `SwitchSourceError.code` plus line numbers. Rule Source update records do not yet expose stable failure codes, so the UI deliberately shows a localized failure summary instead of leaking an unstable English downloader message; complete downloader error localization remains open.
- Component tests cover zh-CN Switch/attached flows and zh-TW independent Rule List. Chromium asserts direct zh-CN headings, table columns, field ARIA, update status, and URL/text controls. Inventory and locale regression guards include all three components.
'''
    + '\n'
)
