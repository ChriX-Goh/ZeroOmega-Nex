from pathlib import Path

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:160]!r}')
    path.write_text(text.replace(old, new, 1))


def insert_before(path: Path, anchor: str, addition: str) -> None:
    text = path.read_text()
    count = text.count(anchor)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {anchor[:160]!r}')
    path.write_text(text.replace(anchor, addition + anchor, 1))


spec = ROOT / 'apps/extension/src/component-rendering.component.spec.ts'
anchor = """  it('renders typed Temporary Rules and Network loading shells in both Chinese locales', () => {
"""
test = """  it('renders the typed Virtual Profile editor in both Chinese locales', () => {
    const mutation = createVirtualProfileDraft(baseSpec(), idFactory(), '虛擬');
    const simplified = render(VirtualProfileEditor, {
      props: {
        locale: 'zh-CN',
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
        onRequestReplacement: async () => undefined,
      },
    }).body;
    expect(simplified).toContain('data-typed-locale="zh-CN"');
    expect(simplified).toContain('目标情景模式');
    expect(simplified).toContain('迁移到虚拟情景模式');
    expect(simplified).toContain('替换目标情景模式');
    expect(simplified).not.toContain('Target profile');
    expect(simplified).not.toContain('Migrate to Virtual Profile');

    const traditional = render(VirtualProfileEditor, {
      props: {
        locale: 'zh-TW',
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
        onRequestReplacement: async () => undefined,
      },
    }).body;
    expect(traditional).toContain('data-typed-locale="zh-TW"');
    expect(traditional).toContain('目標情境模式');
    expect(traditional).toContain('移轉到虛擬情境模式');
    expect(traditional).toContain('取代目標情境模式');
    expect(traditional).not.toContain('Target profile');
  });

"""
insert_before(spec, anchor, test)

inventory = ROOT / 'scripts/generate-locale-inventory.mjs'
replace_once(
    inventory,
    "  'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',\n  'apps/extension/src/entrypoints/options/ThemePanel.svelte',",
    "  'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',\n"
    "  'apps/extension/src/entrypoints/options/ThemePanel.svelte',\n"
    "  'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',",
)

locale_guard = ROOT / 'scripts/validate-localization.mjs'
replace_once(
    locale_guard,
    "  network: 'apps/extension/src/entrypoints/network/App.svelte',",
    "  network: 'apps/extension/src/entrypoints/network/App.svelte',\n"
    "  virtual: 'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',",
)
replace_once(
    locale_guard,
    "  ['Network', entries.network],\n]) {",
    "  ['Network', entries.network],\n  ['Virtual Profile', entries.virtual],\n]) {",
)
forbid = """  [
    entries.virtual,
    '<h2>Target profile</h2>',
    'Virtual target title regressed to literal English.',
  ],
  [
    entries.virtual,
    'aria-label="Virtual Profile target"',
    'Virtual target ARIA regressed to literal English.',
  ],
  [
    entries.virtual,
    '>Replace target profile</button>',
    'Virtual migration action regressed to literal English.',
  ],
  [entries.app, '<h1>Built-in Profiles</h1>', 'Built-in page title regressed to literal English.'],
  [
    entries.app,
    '<h2>Compatibility-first continuation</h2>',
    'About compatibility text regressed to literal English.',
  ],
  [entries.app, '<h1>No user profiles</h1>', 'Empty profile state regressed to literal English.'],
  [
    entries.app,
    "translate('Publish rule list')",
    'Profile Rule List export action regressed to the observer translation layer.',
  ],
  [
    entries.app,
    "translate('Export PAC')",
    'Profile PAC export action regressed to the observer translation layer.',
  ],
  [
    entries.app,
    '`Exported ${result.exported.filename}.`',
    'Profile export status regressed to literal English.',
  ],
"""
insert_before(locale_guard, "  [entries.app, '<h1>General</h1>'", forbid)
requirements = """
requireText(
  entries.app,
  "uiMessage(\n        'options.exported'",
  'Profile export status must use the typed dynamic message.',
);
requireText(
  entries.app,
  'data-builtin-settings data-typed-locale={locale}',
  'Built-in Profiles must expose typed browser evidence.',
);
requireText(
  entries.app,
  'data-about-settings data-typed-locale={locale}',
  'About must expose typed browser evidence.',
);
requireText(
  entries.app,
  '<VirtualProfileEditor\n          {locale}',
  'Options must pass locale to Virtual Profile.',
);
requireText(
  entries.chromiumE2e,
  'Normal Options typed locale coverage regressed',
  'Chromium normal Options typed-locale coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  'Virtual Profile typed locale coverage regressed',
  'Chromium Virtual Profile typed-locale coverage is missing.',
);
"""
insert_before(locale_guard, "requireText(\n  entries.catalog,\n  \"readonly 'switch.sourceError'\"", requirements)

ui_guard = ROOT / 'scripts/validate-ui-compatibility.mjs'
replace_once(
    ui_guard,
    "      virtualProfile.includes('data-virtual-profile-editor') &&\n      virtualProfile.includes('data-virtual-target') &&",
    "      virtualProfile.includes('data-virtual-profile-editor') &&\n"
    "      virtualProfile.includes('data-typed-locale={locale}') &&\n"
    "      virtualProfile.includes(\"uiText('virtual.target.title', locale)\") &&\n"
    "      virtualProfile.includes(\"uiText('virtual.migrate.action', locale)\") &&\n"
    "      virtualProfile.includes('data-virtual-target') &&",
)
replace_once(
    ui_guard,
    "      optionsApp.includes('data-profile-export-rule-list') &&\n      optionsApp.includes('data-profile-export-pac') &&",
    "      optionsApp.includes('data-profile-export-rule-list') &&\n"
    "      optionsApp.includes('data-profile-export-pac') &&\n"
    "      optionsApp.includes(\"uiText('options.export.ruleList', locale)\") &&\n"
    "      optionsApp.includes(\"uiText('options.export.pac', locale)\") &&\n"
    "      optionsApp.includes(\"uiMessage(\\n        'options.exported'\") &&",
)
normal_requirement = """  [
    optionsApp.includes('data-builtin-settings data-typed-locale={locale}') &&
      optionsApp.includes("uiText('options.builtin.directHelp', locale)") &&
      optionsApp.includes('data-about-settings data-typed-locale={locale}') &&
      optionsApp.includes("uiText('options.about.compatibilityTitle', locale)") &&
      optionsApp.includes('data-new-profile-shell') &&
      optionsApp.includes('data-empty-profiles') &&
      !optionsApp.includes('<span>Zero Omega</span>') &&
      chromiumE2e.includes('Normal Options typed locale coverage regressed'),
    'Built-in Profiles, About, new-profile shell, empty state, branding, and profile export presentation must render through the typed catalog.',
  ],
"""
insert_before(ui_guard, "  [\n    ['fallback', 'http', 'https', 'ftp'].every", normal_requirement)

chromium = ROOT / 'scripts/e2e-chromium.mjs'
insert = """  await options.getByRole('button', { name: '内置情景模式', exact: true }).click();
  const builtinSettings = options.locator('[data-builtin-settings][data-typed-locale="zh-CN"]');
  await builtinSettings.waitFor({ state: 'visible', timeout: 20_000 });
  await builtinSettings.getByRole('heading', { name: '内置情景模式', exact: true }).waitFor();
  await options.getByLabel('直接连接情景模式颜色', { exact: true }).waitFor();
  await options.getByLabel('系统代理情景模式颜色', { exact: true }).waitFor();
  assert.doesNotMatch(
    await options.locator('main').innerText(),
    /Built-in Profiles|Connect without a proxy|operating-system proxy/u,
    'Normal Options typed locale coverage regressed',
  );

  await options.locator('.side-brand button').click();
  const aboutSettings = options.locator('[data-about-settings][data-typed-locale="zh-CN"]');
  await aboutSettings.waitFor({ state: 'visible', timeout: 20_000 });
  await aboutSettings.getByRole('heading', { name: '兼容性优先的延续版本', exact: true }).waitFor();
  assert.doesNotMatch(
    await aboutSettings.innerText(),
    /Compatibility-first continuation|This build preserves/u,
    'Normal Options typed locale coverage regressed',
  );

"""
insert_before(
    chromium,
    "  await options.getByRole('button', { name: 'Proxy', exact: true }).click();\n  await profileName.waitFor({ state: 'visible' });",
    insert,
)
replace_once(
    chromium,
    """  const modernRuleExport = await readFile(modernRulePath, 'utf8');
  assert.match(modernRuleExport, /\[SwitchyOmega Conditions\]/u);
""",
    """  const modernRuleExport = await readFile(modernRulePath, 'utf8');
  await virtualOptions
    .locator('[data-profile-export-status]')
    .filter({ hasText: '已导出 OmegaRules_Route_Matrix.sorl。' })
    .waitFor({ timeout: 20_000 });
  assert.match(modernRuleExport, /\[SwitchyOmega Conditions\]/u);
""",
)
replace_once(
    chromium,
    """  const newVirtualDialog = virtualOptions.locator('.new-profile-dialog');
  await newVirtualDialog.waitFor({ state: 'visible', timeout: 20_000 });
""",
    """  const newProfileShell = virtualOptions.locator(
    '[data-new-profile-shell][data-typed-locale="zh-CN"]',
  );
  await newProfileShell.getByText('按照原版 ZeroOmega 流程创建情景模式。', { exact: true }).waitFor();
  const newVirtualDialog = virtualOptions.locator('.new-profile-dialog');
  await newVirtualDialog.waitFor({ state: 'visible', timeout: 20_000 });
""",
)
replace_once(
    chromium,
    """  const virtualEditor = virtualOptions.locator('[data-virtual-profile-editor]');
  await virtualEditor.waitFor({ state: 'visible', timeout: 20_000 });
  const virtualTarget = virtualEditor.locator('[data-virtual-target]');
""",
    """  const virtualEditor = virtualOptions.locator(
    '[data-virtual-profile-editor][data-typed-locale="zh-CN"]',
  );
  await virtualEditor.waitFor({ state: 'visible', timeout: 20_000 });
  await virtualEditor.getByRole('heading', { name: '目标情景模式', exact: true }).waitFor();
  await virtualEditor.getByRole('heading', { name: '迁移到虚拟情景模式', exact: true }).waitFor();
  assert.doesNotMatch(
    await virtualEditor.innerText(),
    /Target profile|Migrate to Virtual Profile|Replace target profile/u,
    'Virtual Profile typed locale coverage regressed',
  );
  const virtualTarget = virtualEditor.getByLabel('虚拟情景模式目标', { exact: true });
""",
)

status = ROOT / 'docs/MILESTONE_8_STATUS.md'
insert_before(
    status,
    "### Typed Temporary Rules and Network\n",
    """### Typed normal Options surfaces and Virtual Profile

- Built-in Profiles, About, new-profile shell, empty-profile state, product branding, profile export actions/titles/status, and Virtual target/migration controls now render directly in English, Simplified Chinese, and Traditional Chinese.
- Profile export keeps the existing Draft commit, warning calculation, filenames, MIME types, and download semantics; only the visible action/title/status contract moved to typed messages.
- Virtual keeps the same target Draft mutation and complete reference-replacement workflow. Direct/System route labels and target/migration ARIA now use the shared semantic catalog.
- Chromium visits the real Built-in and About pages, verifies localized color controls, observes localized profile export status, and completes the existing Virtual creation/reference migration chain through the typed zh-CN editor.

""",
)
replace_once(
    status,
    "Audit and migrate the remaining literal-English Options surfaces from `docs/LOCALE_INVENTORY.json`, beginning with Built-in Profiles, About, new-profile shell text, profile headers/export actions, and any residual lifecycle status while preserving the original navigation and Draft/Applied boundaries.",
    "Audit the remaining imported Auto Detect editor and classify residual locale inventory entries as user-visible text, stable technical identifiers, or non-rendered source tokens before deciding the final localization slice.",
)

kg = ROOT / 'docs/ORIGINAL_KNOWLEDGE_GRAPH.md'
text = kg.read_text()
section = """

### Normal Options and Virtual typed presentation boundary

- Built-in Profiles, About, new-profile/empty shells, product branding, and profile export presentation are part of the normal Options information architecture and resolve through the typed three-locale catalog.
- Profile exports still commit the active editor first, preserve Draft/Applied separation, use the original filenames/MIME contracts, and expose warning counts without rendering raw issue text.
- Virtual target changes remain ordinary Draft mutations. General reference replacement still requires the existing Apply boundary and rewrites every typed route surface without deleting either endpoint profile.
- Chromium verifies the real zh-CN Built-in, About, export status, and Virtual migration path. Imported Auto Detect remains a separate compatibility editor and is not claimed by this slice.
"""
if '### Normal Options and Virtual typed presentation boundary' not in text:
    kg.write_text(text.rstrip() + section + '\n')

matrix = ROOT / 'docs/UI_AUDIT_MATRIX.md'
text = matrix.read_text()
if '2026-07-29 | 完成正常 Options/Virtual typed 三语' not in text:
    text = text.rstrip() + (
        '\n| 2026-07-29 | 完成正常 Options/Virtual typed 三语、导出状态与 Chromium 实际页面/迁移守卫 |\n'
    )
matrix.write_text(text)

print('Patched typed normal Options and Virtual tests, guards, E2E, and docs.')
