from pathlib import Path
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:160]!r}')
    target.write_text(text.replace(old, new, 1))


# Options wiring.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """  import LegacyImportPanel from './LegacyImportPanel.svelte';
  import NewProfileDialog from './NewProfileDialog.svelte';""",
    """  import LegacyImportPanel from './LegacyImportPanel.svelte';
  import NewProfileDialog from './NewProfileDialog.svelte';
  import RuleListProfileEditor from './RuleListProfileEditor.svelte';""",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """      {:else if selectedProfile.kind === 'rule-list' || selectedProfile.kind === 'pac' || selectedProfile.kind === 'auto-detect'}
        <AdvancedProfileEditor
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
      {/if}""",
    """      {:else if selectedProfile.kind === 'rule-list'}
        <RuleListProfileEditor
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onGetRuleSourceUpdateStatus={getRuleSourceUpdateStatus}
          onUpdateRuleSource={updateRuleSource}
        />
      {:else if selectedProfile.kind === 'pac' || selectedProfile.kind === 'auto-detect'}
        <AdvancedProfileEditor
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
      {/if}""",
)

# Component rendering test now targets the dedicated editor.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    """import NewProfileDialog from './entrypoints/options/NewProfileDialog.svelte';
import VirtualProfileEditor from './entrypoints/options/VirtualProfileEditor.svelte';""",
    """import NewProfileDialog from './entrypoints/options/NewProfileDialog.svelte';
import RuleListProfileEditor from './entrypoints/options/RuleListProfileEditor.svelte';
import VirtualProfileEditor from './entrypoints/options/VirtualProfileEditor.svelte';""",
)
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    """  it('renders the Rule List source and routing editors', () => {
    const mutation = createRuleListProfileDraft(baseSpec(), idFactory());
    const { body } = render(AdvancedProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    });

    expect(body).toContain('Rule source');
    expect(body).toContain('Update interval (minutes)');
    expect(body).toContain('aria-label="Inline rule source"');
    expect(body).toContain('Matching rules use');
    expect(body).toContain('Default route');
  });""",
    """  it('renders the original independent Rule List sections and update controls', () => {
    const mutation = createRuleListProfileDraft(baseSpec(), idFactory());
    const source = mutation.draft.ruleSources.at(-1);
    if (!source) throw new Error('Rule List source was not created');
    source.location = {
      kind: 'url',
      url: 'https://rules.example.invalid/component.txt',
      content: 'cached independent rules',
    };
    const { body } = render(RuleListProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    });

    expect(body).toContain('data-rule-list-profile-editor');
    expect(body).toContain('Rule List Config');
    expect(body).toContain('Rule List URL');
    expect(body).toContain('Rule List Text');
    expect(body).toContain('aria-label="Rule List match profile"');
    expect(body).toContain('aria-label="Rule List default profile"');
    expect(body).toContain('aria-label="Rule List URL"');
    expect(body).toContain('data-independent-rule-source-update-now');
    expect(body).toContain('data-independent-rule-source-update-status');
    expect(body).toContain('readonly');
    expect(body).toContain('cached independent rules');
    expect(body).not.toContain('Source name');
    expect(body).not.toContain('Update interval (minutes)');
  });""",
)

# Chromium E2E: independent imported Rule List before Popup workflows.
replace_once(
    'scripts/e2e-chromium.mjs',
    """  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  const resultPopup = await context.newPage();""",
    """  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  await options.getByRole('button', { name: 'rule-switchy', exact: true }).click();
  const independentRuleEditor = options.locator('[data-rule-list-profile-editor]');
  await independentRuleEditor.waitFor({ state: 'visible', timeout: 20_000 });
  await independentRuleEditor.getByRole('heading', { name: 'Rule List Config' }).waitFor();
  assert.equal(
    await independentRuleEditor.getByLabel('Rule List match profile').inputValue(),
    await independentRuleEditor.getByLabel('Rule List match profile').locator('option', { hasText: 'fixed' }).getAttribute('value'),
  );
  assert.equal(await independentRuleEditor.getByLabel('Rule List default profile').inputValue(), 'direct');
  assert.equal(await independentRuleEditor.getByRole('radio', { name: 'Switchy' }).isChecked(), true);
  const independentUrl = independentRuleEditor.getByLabel('Rule List URL');
  await independentUrl.fill(remoteRuleUrl);
  await independentUrl.press('Tab');
  const independentDownload = independentRuleEditor.locator(
    '[data-independent-rule-source-update-now]',
  );
  await assertEventually(
    async () => !(await independentDownload.isDisabled()),
    'Independent Rule List download button remained disabled after saving the URL',
  );
  await independentDownload.click();
  const independentStatus = independentRuleEditor.locator(
    '[data-independent-rule-source-update-status]',
  );
  await independentStatus.filter({ hasText: 'Last updated' }).waitFor({ timeout: 20_000 });
  const independentText = independentRuleEditor.getByLabel('Rule List text');
  assert.equal(await independentText.inputValue(), remoteRuleText);
  assert.equal(await independentText.isEditable(), false);
  await independentRuleEditor.getByRole('button', { name: 'Clear Rule List URL' }).click();
  await assertEventually(
    async () => (await independentRuleEditor.getByLabel('Rule List URL').inputValue()) === '',
    'Clearing the independent Rule List URL did not return to inline mode',
  );
  assert.equal(await independentText.isEditable(), true);
  assert.equal(await independentText.inputValue(), remoteRuleText);
  await independentText.fill('[SwitchyOmega Conditions]\\n@with result\\n\\n* +direct\\n');
  await independentText.press('Tab');

  const resultPopup = await context.newPage();""",
)

# Permanent UI compatibility guard.
validator_path = Path('scripts/validate-ui-compatibility.mjs')
validator = validator_path.read_text()
replace_once(
    str(validator_path),
    """const originalBackupProvenancePath =
  'fixtures/zeroomega-v2/original-default-v3.5.0.provenance.json';
""",
    """const originalBackupProvenancePath =
  'fixtures/zeroomega-v2/original-default-v3.5.0.provenance.json';
const independentRuleListEditorPath =
  'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte';
""",
)
validator = validator_path.read_text()
replace_once(
    str(validator_path),
    """  originalBackupProvenance,
] = await Promise.all([""",
    """  originalBackupProvenance,
  independentRuleListEditor,
] = await Promise.all([""",
)
validator = validator_path.read_text()
replace_once(
    str(validator_path),
    """  readFile(originalBackupProvenancePath, 'utf8'),
]);""",
    """  readFile(originalBackupProvenancePath, 'utf8'),
  readFile(independentRuleListEditorPath, 'utf8'),
]);""",
)
validator = validator_path.read_text()
anchor = """  [
    popupStyle.includes("font-family: 'Segoe UI'"),"""
check = """  [
    optionsApp.includes("import RuleListProfileEditor from './RuleListProfileEditor.svelte'") &&
      optionsApp.includes("selectedProfile.kind === 'rule-list'") &&
      optionsApp.includes('onGetRuleSourceUpdateStatus={getRuleSourceUpdateStatus}') &&
      optionsApp.includes('onUpdateRuleSource={updateRuleSource}') &&
      independentRuleListEditor.includes('data-rule-list-profile-editor') &&
      independentRuleListEditor.includes('data-rule-list-config') &&
      independentRuleListEditor.includes('data-rule-list-url-section') &&
      independentRuleListEditor.includes('data-rule-list-text-section') &&
      independentRuleListEditor.includes('data-independent-rule-source-update-now') &&
      independentRuleListEditor.includes("readonly={source.location.kind === 'url'}") &&
      independentRuleListEditor.includes("target.location = url") &&
      !independentRuleListEditor.includes('Source type') &&
      !independentRuleListEditor.includes('Update interval (minutes)') &&
      chromiumE2e.includes("getByRole('button', { name: 'rule-switchy', exact: true })") &&
      chromiumE2e.includes('data-independent-rule-source-update-now') &&
      chromiumE2e.includes("getByRole('button', { name: 'Clear Rule List URL' })"),
    'Independent Rule List profiles must use the original Config/URL/Text page, presence-of-URL mode switching, existing bounded downloader/status path, read-only downloaded text, and real Chromium interaction coverage.',
  ],
"""
if validator.count(anchor) != 1:
    raise SystemExit('independent Rule List validator insertion anchor missing')
validator_path.write_text(validator.replace(anchor, check + anchor, 1))

# Source-backed docs.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg_path.write_text(
    kg_path.read_text()
    + """
- 独立 Rule List Profile 与附属 Rule List 共享 RuleSource 下载器、权限、secret header 解析、10 秒/4 MiB 边界、CAS 更新记录和调度器，但不共享隐藏 ownership、父 Switch 默认路由代理或 detach 事务。
- 原版独立 Rule List 页面只有三组：Config（match/default/format）、URL、Text。URL 是否为空直接决定模式；没有 Nex-only Source type、Source name 或 per-profile interval 控件。URL 非空时规则文本只读并可 Download now；清空 URL 后保留当前缓存并恢复可编辑 inline 文本。
"""
)

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
updates = {
    'E-02': "| E-02 | 独立编辑页       | `profile_rule_list.jade` | 导入/附属后可见            | MUST_MATCH | DONE     | PARTIAL  | 独立导入类型使用 Config / URL / Text 三段原版结构；附属类型仍由父 Switch 管理 | 补完整 locale 与 Firefox 巡查 |",
    'E-03': "| E-03 | 匹配情景模式     | 同上                     | profile selector           | MUST_MATCH | DONE     | PARTIAL  | 独立编辑页已有 match profile selector，排除自身与隐藏附属类型 | 补 locale                     |",
    'E-04': "| E-04 | 默认情景模式     | 同上                     | profile selector           | MUST_MATCH | DONE     | PARTIAL  | 独立编辑页已有 default profile selector，浏览器 E2E 验证 | 补 locale                     |",
    'E-05': "| E-05 | 格式单选         | 同上                     | 原版格式列表               | MUST_MATCH | DONE     | PARTIAL  | AutoProxy / Switchy radio 已恢复；导入旧专用类型仍归一化 | 补原版命名 locale             |",
    'E-06': "| E-06 | URL 与清除       | 同上                     | URL input                  | MUST_MATCH | DONE     | PARTIAL  | URL 存在即 remote 模式；Clear 保留缓存并返回 inline；Chromium E2E 覆盖 | 补 locale                     |",
    'E-07': "| E-07 | 立即下载         | 同上                     | 下载按钮                   | MUST_MATCH | DONE     | PARTIAL  | 复用已验证后台权限/边界/CAS 下载器与状态；Chromium 真实 HTTP 下载覆盖 | 补 Firefox 与 locale          |",
    'E-08': "| E-08 | 规则文本只读语义 | 同上                     | 有 URL 只读，无 URL 可编辑 | MUST_MATCH | DONE     | PARTIAL  | URL 时缓存文本只读，清除后同一内容恢复可编辑；组件与 Chromium E2E 覆盖 | 补 locale                     |",
}
for key, replacement in updates.items():
    matches = [index for index, line in enumerate(lines) if line.startswith(f'| {key} ')]
    if len(matches) != 1:
        raise SystemExit(f'expected one audit row {key}, found {len(matches)}')
    lines[matches[0]] = replacement
audit_path.write_text('\n'.join(lines) + '\n')

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
integration_run = os.environ.get('INTEGRATION_RUN_ID', 'pending')
status = status.replace(
    "**Current product implementation head:** `5a4782f17d0f2e55ec389f46231a639bc5e5b40e`  ",
    "**Current product implementation head:** independent Rule List editor product commit containing this document  ",
)
status = status.replace(
    "**Latest integration verification:** run `30300955079` validates original-compatible Options export, pinned original fixture, secret omission, and Chromium export→clear→import→export equivalence with full `pnpm verify` and browser regression  ",
    f"**Latest integration verification:** run `{integration_run}` validates the original independent Rule List Config/URL/Text editor, bounded remote update, URL-clear inline restoration, and Chromium interaction with full `pnpm verify` and regression  ",
)
insert_anchor = """### Original-compatible Options export and backup round trip
"""
section = f"""### Independent imported Rule List editor

- Independent imported Rule List profiles now use the original three-section page: Rule List Config, Rule List URL, and Rule List Text.
- Match/default route selectors and AutoProxy/Switchy radio controls are separated from source location. Presence of a URL defines remote mode; clearing it keeps cached text and returns to editable inline mode.
- Remote text is read-only, uses the already verified optional host-permission/background downloader, secret-header resolution, 10-second/4 MiB bounds, CAS conflict protection, update status, and failure-preserves-cache behavior.
- Hidden attached Rule Lists remain owned and edited through their parent Switch; no ownership or detach transaction is shared with the independent editor.
- Component tests and Chromium E2E cover the structure, imported `rule-switchy` navigation, real local HTTP download, update status, read-only cache, URL clear, and inline editing.
- Integration run `{integration_run}`; product commit containing this document.

"""
if status.count(insert_anchor) != 1:
    raise SystemExit('status independent Rule List insertion anchor missing')
status = status.replace(insert_anchor, section + insert_anchor, 1)
status = status.replace(
    "- dedicated imported Rule List and PAC download/update semantics,\n",
    "- PAC URL/download/cache/authentication semantics,\n",
)
status = status.replace(
    "Rebuild the dedicated imported Rule List and PAC download/update/read-only/authentication semantics, then continue Virtual browser coverage and complete localization.",
    "Extend the PAC model with remote-script cache/update state, then rebuild its original URL/headers/download/read-only/file-warning/authentication editor and browser coverage.",
)
status_path.write_text(status)
