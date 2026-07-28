from pathlib import Path


def replace_once(pathname: str, old: str, new: str) -> None:
    path = Path(pathname)
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{pathname}: expected one match, found {count}: {old[:160]!r}')
    path.write_text(text.replace(old, new, 1))


# Options passes the resolved locale into History and localizes its navigation/header directly.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '<span aria-hidden="true">↶</span><span>Snapshot History</span>',
    '<span aria-hidden="true">↶</span><span>{uiText(\'history.nav\', locale)}</span>',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''    {:else if activeSection === 'history' && state}
      <header class="editor-heading">
        <div>
          <h1>Configuration History</h1>
          <p>Inspect or restore a previously verified configuration.</p>
        </div>
      </header>
      <SnapshotHistoryPanel
        disabled={saving || view?.busy === true}
''',
    '''    {:else if activeSection === 'history' && state}
      <header class="editor-heading">
        <div>
          <h1>{uiText('history.pageTitle', locale)}</h1>
          <p>{uiText('history.pageHelp', locale)}</p>
        </div>
      </header>
      <SnapshotHistoryPanel
        {locale}
        disabled={saving || view?.busy === true}
''',
)

# Component evidence for direct Simplified/Traditional Chinese rendering.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''    expect(body).not.toContain('Confirm rollback');
  });
  it('renders the original four new-profile choices and name validation shell', () => {
''',
    '''    expect(body).not.toContain('Confirm rollback');
  });

  it('renders typed snapshot history text in both Chinese locales', () => {
    const simplified = render(SnapshotHistoryPanel, {
      props: {
        locale: 'zh-CN',
        disabled: false,
        dirty: true,
        generation: 4,
        onRollbackSnapshot: async () => true,
      },
    }).body;
    expect(simplified).toContain('配置历史');
    expect(simplified).toContain('草稿包含尚未应用的更改');
    expect(simplified).toContain('正在加载已验证的快照和修订历史');
    expect(simplified).not.toContain('Configuration history');

    const traditional = render(SnapshotHistoryPanel, {
      props: {
        locale: 'zh-TW',
        disabled: false,
        dirty: true,
        generation: 4,
        onRollbackSnapshot: async () => true,
      },
    }).body;
    expect(traditional).toContain('設定歷史');
    expect(traditional).toContain('草稿包含尚未套用的變更');
    expect(traditional).toContain('正在載入已驗證的快照與修訂歷史');
    expect(traditional).not.toContain('Configuration history');
  });

  it('renders the original four new-profile choices and name validation shell', () => {
''',
)

# Capture a persistent verified snapshot after the temporary overlay is removed.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await temporaryManager.close();

  const diagnosticsPage = await context.newPage();
''',
    '''  await temporaryManager.close();

  const historyRollbackTarget = await assertEventuallyValue(async () => {
    return worker.evaluate(async () => {
      const storage = await chrome.storage.local.get(null);
      const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
      const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
      const snapshotId = proxyState?.activeSnapshotId;
      if (!workflow || typeof snapshotId !== 'string' || snapshotId.startsWith('popup-temporary-v1/')) {
        return undefined;
      }
      const snapshot = storage[`zeroomega-nex/browser-proxy/v1/snapshot/${snapshotId}`];
      if (!snapshot || snapshot.sourceRevisionId !== workflow.applied.revision.id) return undefined;
      return {
        snapshotId,
        sourceRevisionId: snapshot.sourceRevisionId,
        startRoute: snapshot.startRoute,
      };
    });
  }, 'Underlying verified snapshot was not restored after removing the final temporary rule');

  const diagnosticsPage = await context.newPage();
''',
)

# Clear the intentionally exercised post-Apply Draft changes before testing the History rollback UI.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await attachedRow.getByRole('button', { name: '移除规则列表' }).click();
  await attachRuleList.waitFor();
  assert.equal(await options.locator('[data-attached-rule-list-row]').count(), 0);

  const rawPacActivation = await options.evaluate(async () => {
''',
    '''  await attachedRow.getByRole('button', { name: '移除规则列表' }).click();
  await attachRuleList.waitFor();
  assert.equal(await options.locator('[data-attached-rule-list-row]').count(), 0);

  const revertedDraft = await options.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(key))[key];
    if (!workflow) throw new Error('Workflow state is unavailable before History rollback E2E');
    if (workflow.draft.revision.id === workflow.applied.revision.id) return { ok: true };
    return chrome.runtime.sendMessage({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'revert',
      expectedGeneration: workflow.generation,
    });
  });
  assert.equal(revertedDraft?.ok, true, 'Draft could not be reverted before History rollback E2E');
  await assertEventually(async () =>
    worker.evaluate(async () => {
      const key = 'zeroomega-nex/profile-workflow/v1/state';
      const workflow = (await chrome.storage.local.get(key))[key];
      return workflow?.draft?.revision?.id === workflow?.applied?.revision?.id;
    }),
  'Draft remained dirty before History rollback E2E');

  const rawPacActivation = await options.evaluate(async () => {
''',
)

# Perform a real user-visible rollback and verify browser, workflow, and UI converge.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  );

  virtualContext = await chromium.launchPersistentContext(virtualUserDataDir, {
''',
    '''  );

  await options.bringToFront();
  await options.getByRole('button', { name: '配置历史', exact: true }).click();
  const historyPanel = options.locator('[data-snapshot-history-panel]');
  await historyPanel.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await historyPanel.getAttribute('data-typed-locale'), 'zh-CN');
  await historyPanel.getByRole('heading', { name: '已验证的 PAC 快照', exact: true }).waitFor();
  assert.doesNotMatch(await historyPanel.innerText(), /Configuration history|Verified PAC snapshots/u);
  const rollbackEntry = historyPanel.locator(
    `[data-snapshot-history-entry="${historyRollbackTarget.snapshotId}"]`,
  );
  await rollbackEntry.waitFor({ state: 'visible', timeout: 20_000 });
  await rollbackEntry
    .locator(`[data-snapshot-rollback-request="${historyRollbackTarget.snapshotId}"]`)
    .click();
  const rollbackDialog = historyPanel.locator(
    `[data-snapshot-rollback-dialog="${historyRollbackTarget.snapshotId}"]`,
  );
  await rollbackDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await rollbackDialog.getByText('确认回滚快照', { exact: true }).waitFor();
  await rollbackDialog
    .locator(`[data-snapshot-rollback-confirm="${historyRollbackTarget.snapshotId}"]`)
    .click();
  await assertEventually(async () => {
    const state = await worker.evaluate(async () => {
      const storage = await chrome.storage.local.get(null);
      const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
      const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
      return {
        activeSnapshotId: proxyState?.activeSnapshotId,
        appliedRevisionId: workflow?.applied?.revision?.id,
        draftRevisionId: workflow?.draft?.revision?.id,
      };
    });
    return (
      state.activeSnapshotId === historyRollbackTarget.snapshotId &&
      state.appliedRevisionId === historyRollbackTarget.sourceRevisionId &&
      state.draftRevisionId === historyRollbackTarget.sourceRevisionId
    );
  }, 'History rollback did not restore browser state and both workflow revisions', 20_000);
  await assertEventually(
    async () => (await rollbackEntry.getAttribute('data-snapshot-active')) === 'true',
    'History UI did not mark the restored snapshot active',
  );

  virtualContext = await chromium.launchPersistentContext(virtualUserDataDir, {
''',
)

# Add History to the machine inventory and permanent localization guard.
replace_once(
    'scripts/generate-locale-inventory.mjs',
    "  'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',\n];",
    "  'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',\n  'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',\n];",
)
replace_once(
    'scripts/validate-localization.mjs',
    "  pac: 'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',\n  firefoxE2e:",
    "  pac: 'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',\n  history: 'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',\n  chromiumE2e: 'scripts/e2e-chromium.mjs',\n  firefoxE2e:",
)
replace_once(
    'scripts/validate-localization.mjs',
    "    entries.pac,\n  ],\n) {",
    "    entries.pac,\n    ['Snapshot History', entries.history],\n  ],\n) {",
)
replace_once(
    'scripts/validate-localization.mjs',
    '''  [entries.pac, '>Download now</button>', 'PAC download action regressed to literal English.'],
  [
    entries.pac,
''',
    '''  [entries.pac, '>Download now</button>', 'PAC download action regressed to literal English.'],
  [entries.history, '<h2>Configuration history</h2>', 'History heading regressed to literal English.'],
  [entries.history, '>Rollback to this snapshot</button>', 'History rollback action regressed to literal English.'],
  [
    entries.pac,
''',
)
replace_once(
    'scripts/validate-localization.mjs',
    '''requireText(
  entries.firefoxE2e,
  "'raw-pac/1'",
  'Firefox PAC raw-snapshot interaction coverage is missing.',
);
''',
    '''requireText(
  entries.chromiumE2e,
  'data-snapshot-rollback-confirm',
  'Chromium real snapshot rollback interaction coverage is missing.',
);
requireText(
  entries.firefoxE2e,
  "'raw-pac/1'",
  'Firefox PAC raw-snapshot interaction coverage is missing.',
);
''',
)

# Permanent UI compatibility guard for the complete History transaction.
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''  [
    popupStyle.includes("font-family: 'Segoe UI'"),
''',
    '''  [
    snapshotHistory.includes('data-snapshot-history-panel') &&
      snapshotHistory.includes('data-typed-locale={locale}') &&
      snapshotHistory.includes('data-snapshot-rollback-request') &&
      snapshotHistory.includes('data-snapshot-rollback-confirm') &&
      snapshotHistory.includes("uiText('history.confirmTitle', locale)") &&
      optionsApp.includes('<SnapshotHistoryPanel\\n        {locale}') &&
      chromiumE2e.includes('historyRollbackTarget') &&
      chromiumE2e.includes('data-snapshot-rollback-confirm') &&
      chromiumE2e.includes('History rollback did not restore browser state'),
    'Snapshot History must render through the typed catalog and retain a real Chromium rollback that converges browser, Applied, Draft, and UI state.',
  ],
  [
    popupStyle.includes("font-family: 'Segoe UI'"),
''',
)

# Knowledge graph: distinguish original backup history from Nex verified snapshot history.
replace_once(
    'docs/ORIGINAL_KNOWLEDGE_GRAPH.md',
    '## 16. 实现决策分类',
    '''## 15.5 Nex 已验证快照历史与回滚

原版 Options 的导入/恢复、启动情景模式应用和浏览器代理回退语义是兼容基线；Nex 另外把新架构中的不可变已验证快照暴露为用户可见历史。这是保障原子激活与可恢复性的 Nex 产品能力，不得冒充原版 v3.5.0 页面。

- History 页面只读取修订、编译器、哈希、能力、验证、统计和 warning 元数据；不得把 ProfileSpec 内容、PAC 正文、请求头或秘密材料返回页面。
- 每个快照必须关联可恢复的 `sourceRevisionId`。缺少源修订时仅显示元数据，回滚按钮禁用。
- Draft 脏时回滚禁用；用户必须先 Apply 或 Discard，防止历史操作覆盖未应用工作。
- 回滚确认必须明确会立即切换浏览器流量，并同时替换 Applied 与 Draft。
- 后台先验证并安装归档快照，再以 CAS 提交源修订；工作流提交失败时必须恢复操作前浏览器状态，不能把部分成功报告为完成。
- Chromium 永久 E2E 必须从 History 页面真实点击回滚，并同时验证 `activeSnapshotId`、Applied revision、Draft revision 与页面 Active 标记收敛到同一快照。
- History 的标题、帮助、状态、元数据标签、确认框、按钮、空状态、错误和 ARIA 必须直接通过 typed 英文/简体中文/正體中文 catalog 渲染。

## 16. 实现决策分类''',
)

# Audit matrix and status now record the delivery-plan obligation explicitly.
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '''| J-10 | 每次 parity-sensitive 提交同步文档 | MUST_MATCH | DONE     | Parity Documentation workflow 已持续阻断缺失/未同步文档提交，并在 Exact Head 重复验证                                                      | 保持 workflow                    |
''',
    '''| J-10 | 每次 parity-sensitive 提交同步文档 | MUST_MATCH | DONE     | Parity Documentation workflow 已持续阻断缺失/未同步文档提交，并在 Exact Head 重复验证                                                      | 保持 workflow                    |
| J-11 | 快照历史与回滚 UI                 | MUST_MATCH | DONE     | History 以 typed 三语展示修订/快照元数据；Chromium 从真实页面回滚旧快照并验证 browser activeSnapshot、Applied、Draft 与 Active 标记一致      | 保持双浏览器与失败注入回归       |
''',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '- **明确 BROKEN**：编辑器翻译仍不完整；Fixed/Switch/PAC/Rule List 核心结构、Profile 导出、完整 Options 导出和基础本地恢复已恢复。',
    '- **明确 BROKEN**：其余通用页面翻译仍不完整；Fixed/Switch/PAC/Rule List 核心编辑器、导入审阅、快照历史/回滚、Profile 导出、完整 Options 导出和基础本地恢复已恢复。',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| 2026-07-28 | Profile PAC/Rule List 导出、Virtual/Fixed E2E 与 parity workflow 状态纠偏；清除全部 7 个 Svelte 警告并固定 warning-fatal 门禁 |',
    '| 2026-07-28 | Profile PAC/Rule List 导出、Virtual/Fixed E2E 与 parity workflow 状态纠偏；清除全部 7 个 Svelte 警告并固定 warning-fatal 门禁 |\n| 2026-07-28 | 完成 PAC typed 三语与 Firefox 顶层激活；核实导入审阅已存在；补齐 History typed 三语及 Chromium 真实原子回滚闭环                         |',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    '## Automated acceptance state',
    '''### Typed Snapshot History and real rollback closure

- The existing revision/snapshot repositories and atomic rollback command were retained; no second state machine was introduced.
- Snapshot History now renders English, Simplified Chinese, and Traditional Chinese directly for page/navigation text, revision and snapshot metadata, verification modes, status, warnings, empty/error states, confirmation, actions, and ARIA.
- The page continues to receive metadata only. ProfileSpec content, PAC source, request headers, and secret material remain background-owned and are never returned by the history command.
- Chromium captures a verified persistent snapshot, activates a distinct raw PAC snapshot, then uses the real History confirmation flow to restore the first snapshot. The regression requires browser `activeSnapshotId`, Applied revision, Draft revision, and the History Active marker to converge.
- The import-review audit confirmed the existing compatibility summary, technical migration details, secret-material warning, inactive import, immediate apply, and byte-identical backup round trip; its remaining gap is direct typed locale coverage rather than missing workflow behavior.

## Automated acceptance state''',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    '- remaining General/Interface/Import/Theme/History/Popup/Temporary Rules/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,',
    '- remaining General/Interface/Import/Theme/Popup/Temporary Rules/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    'Reconcile the remaining Milestone 8 delivery-plan obligations before another broad locale batch. Audit the user-visible import review and snapshot history/rollback UI against the fixed source baseline and current implementation, classify each row as implemented, missing, or an explicit scope decision, then implement the first missing `MUST_MATCH` slice. Continue General/Interface/Import/History/Popup/Temporary Rules/Network typed localization from the resulting closure order.',
    'Migrate the existing Legacy Import review panel as the next typed vertical batch. Cover export, file/pasted input, compatibility category counts, technical details, secret-material notices, inactive import, immediate apply, success/error states, buttons, titles, placeholders, and ARIA in all three locales while preserving the verified schema-v2 round trip and secret isolation.',
)
