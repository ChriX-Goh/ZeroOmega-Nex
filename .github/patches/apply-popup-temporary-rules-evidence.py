from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    target.write_text(text.replace(old, new))


replace_once(
    'scripts/e2e-chromium.mjs',
    """  const conditionPopup = await context.newPage();
  await conditionPopup.goto(
    `chrome-extension://${extensionId}/popup.html?activeTabId=${currentSiteTabId}`,
  );
""",
    """  const temporaryPopup = await context.newPage();
  await temporaryPopup.goto(
    `chrome-extension://${extensionId}/popup.html?activeTabId=${currentSiteTabId}`,
  );
  const temporarySelect = temporaryPopup.getByLabel('Temporary profile for example.co.uk');
  await temporarySelect.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await temporarySelect.inputValue(), '');
  await temporarySelect.selectOption({ label: 'fixed' });
  await assertEventually(async () => {
    const [local, session] = await worker.evaluate(async () =>
      Promise.all([chrome.storage.local.get(null), chrome.storage.session.get(null)]),
    );
    const temporaryState = session['zeroomega-nex/popup-temporary-rules/v1/state'];
    const proxyState = local['zeroomega-nex/browser-proxy/v1/state'];
    const snapshotId = proxyState?.activeSnapshotId;
    const sessionSnapshotKey = snapshotId
      ? `zeroomega-nex/browser-proxy/v1/session-snapshot/${snapshotId}`
      : '';
    return (
      temporaryState?.rules?.[0]?.domain === 'example.co.uk' &&
      temporaryState.rules[0].route?.kind === 'profile' &&
      typeof snapshotId === 'string' &&
      snapshotId.startsWith('popup-temporary-v1/') &&
      local[`zeroomega-nex/browser-proxy/v1/snapshot/${snapshotId}`] === undefined &&
      session[sessionSnapshotKey]?.snapshotId === snapshotId
    );
  }, 'Popup temporary rule was not stored only in the browser session');
  await temporaryPopup.close().catch(() => undefined);

  const conditionPopup = await context.newPage();
  await conditionPopup.goto(
    `chrome-extension://${extensionId}/popup.html?activeTabId=${currentSiteTabId}`,
  );
""",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    """  const popupRuntime = await worker.evaluate(async () => chrome.storage.local.get(null));
  const popupWorkflow = popupRuntime['zeroomega-nex/profile-workflow/v1/state'];
  assert.equal(popupWorkflow.applied.revision.id, popupWorkflow.draft.revision.id);
  await conditionPopup.close().catch(() => undefined);
  await currentSitePage.close();
  await options.bringToFront();
""",
    """  const popupRuntime = await worker.evaluate(async () => chrome.storage.local.get(null));
  const popupWorkflow = popupRuntime['zeroomega-nex/profile-workflow/v1/state'];
  assert.equal(popupWorkflow.applied.revision.id, popupWorkflow.draft.revision.id);
  assert.match(
    popupRuntime['zeroomega-nex/browser-proxy/v1/state']?.activeSnapshotId ?? '',
    /^popup-temporary-v1\//u,
    'Permanent Popup Apply did not preserve the temporary overlay',
  );
  await conditionPopup.close().catch(() => undefined);

  const temporaryManager = await context.newPage();
  await temporaryManager.goto(`chrome-extension://${extensionId}/temp-rules.html`);
  const temporaryRow = temporaryManager.locator('[data-temp-rule-domain="example.co.uk"]');
  await temporaryRow.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await temporaryRow.innerText(), /fixed/u);
  await temporaryRow.getByRole('button', { name: 'Delete temporary rule for example.co.uk' }).click();
  await assertEventually(async () => {
    const [local, session] = await worker.evaluate(async () =>
      Promise.all([chrome.storage.local.get(null), chrome.storage.session.get(null)]),
    );
    return (
      session['zeroomega-nex/popup-temporary-rules/v1/state'] === undefined &&
      !String(local['zeroomega-nex/browser-proxy/v1/state']?.activeSnapshotId ?? '').startsWith(
        'popup-temporary-v1/',
      )
    );
  }, 'Deleting the final temporary rule did not restore the underlying route');
  await temporaryManager.close();
  await currentSitePage.close();
  await options.bringToFront();
""",
)

replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """const currentSitePath = 'apps/extension/src/lib/current-site.ts';
""",
    """const currentSitePath = 'apps/extension/src/lib/current-site.ts';
const popupTemporaryRulesPath = 'packages/profile-workflow/src/popup-temporary-rules.ts';
const popupTemporaryRuntimePath = 'apps/extension/src/lib/popup-temporary-rule-runtime.ts';
const sessionSnapshotRepositoryPath = 'apps/extension/src/lib/session-snapshot-repository.ts';
const temporaryRulesManagerPath = 'apps/extension/src/entrypoints/temp-rules/App.svelte';
""",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """  currentSite,
  optionsApp,
""",
    """  currentSite,
  popupTemporaryRules,
  popupTemporaryRuntime,
  sessionSnapshotRepository,
  temporaryRulesManager,
  optionsApp,
""",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """  readFile(currentSitePath, 'utf8'),
  readFile(optionsAppPath, 'utf8'),
""",
    """  readFile(currentSitePath, 'utf8'),
  readFile(popupTemporaryRulesPath, 'utf8'),
  readFile(popupTemporaryRuntimePath, 'utf8'),
  readFile(sessionSnapshotRepositoryPath, 'utf8'),
  readFile(temporaryRulesManagerPath, 'utf8'),
  readFile(optionsAppPath, 'utf8'),
""",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """  [
    popupApp.includes('class="popup-footer"'),
    'Popup must retain the familiar bottom options action area.',
  ],
""",
    """  [
    popupApp.includes('class="popup-footer"'),
    'Popup must retain the familiar bottom options action area.',
  ],
  [
    popupApp.includes('data-popup-temporary-rule') &&
      popupApp.includes('data-popup-manage-temporary-rules') &&
      popupApp.includes("action: 'toggle'") &&
      popupTemporaryRules.includes('POPUP_TEMPORARY_PROFILE_ID_PREFIX') &&
      popupTemporaryRules.includes("condition: temporaryCondition(rule.domain)") &&
      popupTemporaryRules.includes('listPopupTemporaryRuleResultRoutes') &&
      popupTemporaryRuntime.includes("'zeroomega-nex/popup-temporary-rules/v1/state'") &&
      popupTemporaryRuntime.includes('storage.session') &&
      popupTemporaryRuntime.includes('reconcileStartup') &&
      sessionSnapshotRepository.includes('POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX') &&
      sessionSnapshotRepository.includes('listSnapshots(): Promise<readonly PacRuntimeSnapshot[]>') &&
      temporaryRulesManager.includes('data-temp-rules-table') &&
      temporaryRulesManager.includes('Delete all temporary rules'),
    'Popup temporary rules must use a separate browser-session state and session-only PAC snapshot, wrap the current route, survive worker restarts, clear on browser restart, and provide a dedicated manager.',
  ],
""",
)

replace_once(
    'docs/ORIGINAL_KNOWLEDGE_GRAPH.md',
    """- 当前网站临时规则是独立内存覆盖，不与永久条件混合，本切片仍未实现。
""",
    """- 当前网站临时规则是独立运行时覆盖，不与永久条件混合：原版用隐藏临时 Switch，规则为 base domain 的 `HostWildcardCondition('*.domain')`，相同结果再次选择即删除、不同结果替换；规则和临时 profile 状态写入 `chrome.storage.session`，浏览器会话内跨 service worker 重启保留，浏览器重启自动清空。
- Nex 用 session-only 状态和 session-only PAC snapshot 实现同一生命周期；持久化 proxy state 只保留可解码的临时 snapshot ID，不保存域名或脚本。正常 Apply、Popup 切换与结果修改均通过临时协调器重新叠加；System Proxy 暂停叠加但保留规则。启动时 session 已清空则拆除临时 snapshot 并恢复其底层路由。独立管理页支持逐条删除和全部删除。
""",
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    """| I-06 | 临时规则           | `popup/temp_rules` | 非持久临时覆盖               | MUST_MATCH | MISSING  | MISSING  | 无                                                                                                                                          | 定义生命周期          |
""",
    """| I-06 | 临时规则           | `popup/temp_rules` | 非持久临时覆盖               | MUST_MATCH | DONE     | PARTIAL  | session-only 状态与 PAC snapshot、当前域切换、跨 worker 保留/浏览器重启清理、活动路由叠加及独立管理页已实现；单测与 Chromium E2E 覆盖 | locale 与 Firefox 交互 |
""",
)

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
text = text.replace(
    '- Popup temporary-rule, external-ownership, and bounded diagnostic functions,\n',
    '- Popup external-ownership and bounded diagnostic functions,\n',
)
text = text.replace(
    'Proceed to the Popup temporary current-site rule runtime layer, preserving its non-persistent lifecycle and separation from permanent ProfileSpec conditions.',
    'Proceed to the Popup external-extension ownership state, then bounded request diagnostics and Inspect controls.',
)
insert = '- Current-site exact Head `716a765eac8279c2201b652187efddb9d800650a`: CI `30245778282`, Browser E2E `30245778414`, Parity Documentation `30245778397`.\n'
addition = insert + '- Temporary current-site rules now use a hidden runtime Switch, session-only state and PAC snapshots, transparent activation wrapping, startup cleanup, and a dedicated manager. Chromium E2E verifies session-only storage, survival across a permanent Apply, and restoration after deletion.\n'
if text.count(insert) != 1:
    raise SystemExit(f'status insertion point count: {text.count(insert)}')
status.write_text(text.replace(insert, addition))
