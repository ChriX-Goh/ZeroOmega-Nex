from pathlib import Path

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:180]!r}')
    path.write_text(text.replace(old, new, 1))


def insert_before(path: Path, anchor: str, addition: str) -> None:
    text = path.read_text()
    count = text.count(anchor)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {anchor[:180]!r}')
    path.write_text(text.replace(anchor, addition + anchor, 1))


locale_guard = ROOT / 'scripts/validate-localization.mjs'
replace_once(
    locale_guard,
    "  attachedRuleList: 'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',",
    "  autoDetect: 'apps/extension/src/entrypoints/options/AdvancedProfileEditor.svelte',\n"
    "  attachedRuleList: 'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',",
)
replace_once(
    locale_guard,
    "  ['Switch Profile', entries.switchProfile],",
    "  ['Switch Profile', entries.switchProfile],\n  ['Auto Detect', entries.autoDetect],",
)
auto_forbids = """  [
    entries.autoDetect,
    '<h2>Auto Detect</h2>',
    'Auto Detect title regressed to literal English.',
  ],
  [
    entries.autoDetect,
    '>Fallback route',
    'Auto Detect fallback label regressed to literal English.',
  ],
  [
    entries.autoDetect,
    '>No fallback</option>',
    'Auto Detect fallback option regressed to literal English.',
  ],
  [
    entries.autoDetect,
    "candidate.kind === 'rule-list'",
    'Advanced Profile editor regressed to the superseded Rule List branch.',
  ],
  [
    entries.autoDetect,
    "profile?.kind === 'pac'",
    'Advanced Profile editor regressed to the superseded PAC branch.',
  ],
"""
insert_before(locale_guard, "  [entries.app, '<h1>General</h1>'", auto_forbids)
auto_requirements = """
requireText(
  entries.autoDetect,
  "uiText('autoDetect.fallbackAria', locale)",
  'Auto Detect fallback ARIA must use the typed catalog.',
);
requireText(
  entries.app,
  '<AdvancedProfileEditor\\n          {locale}',
  'Options must pass locale to imported Auto Detect.',
);
requireText(
  entries.chromiumE2e,
  'Auto Detect typed locale coverage regressed',
  'Chromium imported Auto Detect typed-locale coverage is missing.',
);
"""
insert_before(
    locale_guard,
    "requireText(\n  entries.catalog,\n  \"readonly 'switch.sourceError'\"",
    auto_requirements,
)

ui_guard = ROOT / 'scripts/validate-ui-compatibility.mjs'
auto_guard = """  [
    advancedProfileEditor.includes('data-auto-detect-profile-editor') &&
      advancedProfileEditor.includes('data-typed-locale={locale}') &&
      advancedProfileEditor.includes("uiText('autoDetect.help', locale)") &&
      advancedProfileEditor.includes("uiText('autoDetect.fallbackAria', locale)") &&
      advancedProfileEditor.includes('cloneProfileSpecDraft') &&
      !advancedProfileEditor.includes("candidate.kind === 'rule-list'") &&
      !advancedProfileEditor.includes("profile?.kind === 'pac'") &&
      optionsApp.includes("selectedProfile.kind === 'auto-detect'") &&
      optionsApp.includes('<AdvancedProfileEditor\\n          {locale}') &&
      chromiumE2e.includes('Auto Detect typed locale coverage regressed'),
    'Imported Auto Detect must use one typed fallback-only editor without the superseded Rule List or PAC branches.',
  ],
"""
insert_before(ui_guard, "  [\n    !advancedProfileEditor.includes('https://example.invalid/')", auto_guard)

chromium = ROOT / 'scripts/e2e-chromium.mjs'
replace_once(
    chromium,
    """  await virtualOptions.getByRole('button', { name: 'Auto Matrix', exact: true }).click();
  await virtualOptions.getByRole('heading', { name: 'Auto Matrix', exact: true }).waitFor();
  assert.equal(await virtualOptions.locator('[data-profile-export-pac]').count(), 0);
""",
    """  await virtualOptions.getByRole('button', { name: 'Auto Matrix', exact: true }).click();
  await virtualOptions.getByRole('heading', { name: 'Auto Matrix', exact: true }).waitFor();
  const autoDetectEditor = virtualOptions.locator(
    '[data-auto-detect-profile-editor][data-typed-locale="zh-CN"]',
  );
  await autoDetectEditor.waitFor({ state: 'visible', timeout: 20_000 });
  await autoDetectEditor.getByRole('heading', { name: '自动检测', exact: true }).waitFor();
  const autoDetectFallback = autoDetectEditor.getByLabel('自动检测失败时使用的情景模式', {
    exact: true,
  });
  assert.equal(await autoDetectFallback.locator('option:checked').innerText(), 'Target Proxy');
  assert.doesNotMatch(
    await autoDetectEditor.innerText(),
    /Browser auto-detection support|Fallback route|No fallback/u,
    'Auto Detect typed locale coverage regressed',
  );
  assert.equal(await virtualOptions.locator('[data-profile-export-pac]').count(), 0);
""",
)

status = ROOT / 'docs/MILESTONE_8_STATUS.md'
insert_before(
    status,
    "### Typed normal Options surfaces and Virtual Profile\n",
    """### Typed imported Auto Detect and closed visible locale inventory

- `AdvancedProfileEditor` now has one actual responsibility: editing the optional fallback of an imported Auto Detect profile. Superseded Rule List and PAC branches were removed because those types use their dedicated editors.
- Auto Detect title, target-dependent help, fallback selector/options, route labels, and ARIA render directly in English, Simplified Chinese, and Traditional Chinese while preserving the existing Draft mutation and imported profile shape.
- Chromium opens the source-backed `Auto Matrix` profile, verifies the typed zh-CN editor and selected `Target Proxy` fallback, confirms that Auto Detect still has no PAC export action, and continues through the full Virtual migration chain.
- Locale inventory schema v2 classifies every remaining literal candidate. Verification now fails when any candidate is `user-visible-untranslated`; field keys, format names, keyboard keys, examples, stable technical codes, and scanner code fragments remain explicitly classified rather than mistranslated.

""",
)
replace_once(
    status,
    "Audit the remaining imported Auto Detect editor and classify residual locale inventory entries as user-visible text, stable technical identifiers, or non-rendered source tokens before deciding the final localization slice.",
    "Proceed to non-localization closure: Firefox remote-origin PAC/Rule Source permission and download coverage, stable downloader failure codes, explicit `file:` PAC scope, schema-v1/online restore decisions, and consolidated owner visual/real-backup QC.",
)

kg = ROOT / 'docs/ORIGINAL_KNOWLEDGE_GRAPH.md'
text = kg.read_text()
section = """

### Imported Auto Detect and locale classification boundary

- Auto Detect is not a normal New Profile choice. It survives only as an imported compatibility profile with an optional fallback route; Options therefore exposes one fallback-only editor and no PAC export action.
- Rule List and PAC no longer share `AdvancedProfileEditor`; their dedicated editors own their complete source, download, authentication, and request-header workflows.
- Literal-English inventory schema v2 distinguishes unresolved user-facing text from source tokens, format names, standard technical terms, keyboard keys, examples, stable error codes, and scanner code fragments. Exact-Head verification fails whenever `user-visible-untranslated` is non-zero.
- Chromium proves the imported Auto Detect page, typed fallback selection, and absence of PAC export while retaining complete cross-profile reference migration.
"""
if '### Imported Auto Detect and locale classification boundary' not in text:
    kg.write_text(text.rstrip() + section + '\n')

matrix = ROOT / 'docs/UI_AUDIT_MATRIX.md'
text = matrix.read_text()
text = text.replace(
    '| F-10 | Virtual 引用替换       | `profile_virtual.jade`、`master.coffee`、`options.coffee` | 用 Virtual 替换目标的全部引用；两个端点不变 | MUST_MATCH | DONE     | PARTIAL',
    '| F-10 | Virtual 引用替换       | `profile_virtual.jade`、`master.coffee`、`options.coffee` | 用 Virtual 替换目标的全部引用；两个端点不变 | MUST_MATCH | DONE     | COMPLETE',
)
text = text.replace('补确认文案翻译', '保持跨类型回归', 1)
text = text.replace(
    '- **明确 BROKEN**：其余通用页面翻译仍不完整；Fixed/Switch/PAC/Rule List 核心编辑器、导入审阅、快照历史/回滚、Profile 导出、完整 Options 导出和基础本地恢复已恢复。',
    '- **用户可见本地化已闭合**：所有实际 Svelte 页面均使用 typed 三语 catalog；locale inventory schema v2 对剩余技术项显式分类，并以 `user-visible-untranslated = 0` 作为永久门禁。',
)
if '2026-07-29 | 完成 imported Auto Detect typed 三语与 locale schema v2 分类门禁' not in text:
    text = text.rstrip() + (
        '\n| 2026-07-29 | 完成 imported Auto Detect typed 三语与 locale schema v2 分类门禁，删除不可达 Rule List/PAC 重复分支 |\n'
    )
matrix.write_text(text)

print('Patched typed Auto Detect E2E, permanent guards, docs, and audit matrix.')
