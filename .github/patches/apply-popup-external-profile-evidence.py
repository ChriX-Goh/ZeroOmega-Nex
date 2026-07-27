from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


replace_once(
    'scripts/e2e-chromium.mjs',
    """  await assertEventually(async () => direct.isDisabled(), 'Direct route did not become active');

  await options.bringToFront();
""",
    """  await assertEventually(async () => direct.isDisabled(), 'Direct route did not become active');

  const systemActivation = await worker.evaluate(async () => {
    const storage = await chrome.storage.local.get(null);
    const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
    return chrome.runtime.sendMessage({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: workflow.applied.revision.id,
      route: { kind: 'system' },
    });
  });
  assert.equal(systemActivation?.ok, true, 'System route could not be activated for external import');
  await worker.evaluate(async () =>
    chrome.proxy.settings.set({
      scope: 'regular',
      value: {
        mode: 'fixed_servers',
        rules: {
          singleProxy: { scheme: 'socks5', host: 'external.e2e.invalid', port: 1080 },
          proxyForHttp: { scheme: 'http', host: 'external-http.e2e.invalid', port: 8080 },
          bypassList: ['<local>', 'localhost', '*.external.internal'],
        },
      },
    }),
  );
  const externalPopup = await context.newPage();
  await externalPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  const externalRow = externalPopup.locator('[data-popup-external-profile]');
  await externalRow.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await externalRow.innerText(), /外部情景模式/u);
  await externalRow.locator('.external-profile-button').click();
  const externalForm = externalPopup.locator('[data-popup-external-profile-form]');
  await externalForm.getByLabel('External profile name').fill('_reserved');
  await externalForm.getByRole('button', { name: '保存名称', exact: true }).click();
  await externalForm.getByText('情景模式名称不能以下划线开头。').waitFor();
  await externalForm.getByLabel('External profile name').fill('Imported External Proxy');
  await externalForm.getByRole('button', { name: '保存名称', exact: true }).click();
  await assertEventually(async () => {
    const storage = await worker.evaluate(async () => chrome.storage.local.get(null));
    const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
    const imported = workflow?.applied?.profiles?.find(
      (profile) => profile.name === 'Imported External Proxy',
    );
    if (imported?.kind !== 'fixed') return false;
    const fallback = workflow.applied.proxyEndpoints.find(
      (endpoint) => endpoint.id === imported.proxyByScheme.fallback,
    );
    const http = workflow.applied.proxyEndpoints.find(
      (endpoint) => endpoint.id === imported.proxyByScheme.http,
    );
    const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
    const snapshot = proxyState?.activeSnapshotId
      ? storage[`zeroomega-nex/browser-proxy/v1/snapshot/${proxyState.activeSnapshotId}`]
      : undefined;
    return (
      fallback?.protocol === 'socks5' &&
      fallback.host === 'external.e2e.invalid' &&
      fallback.port === 1080 &&
      http?.protocol === 'http' &&
      http.host === 'external-http.e2e.invalid' &&
      imported.bypass?.some((entry) => entry.pattern === '<local>') &&
      imported.bypass?.some((entry) => entry.pattern === '*.external.internal') &&
      !imported.bypass?.some((entry) => entry.pattern === 'localhost') &&
      workflow.draft.revision.id === workflow.applied.revision.id &&
      snapshot?.startRoute?.kind === 'profile' &&
      snapshot.startRoute.profileId === imported.id
    );
  }, 'External Fixed profile was not imported and activated atomically');
  await externalPopup.close().catch(() => undefined);

  await options.bringToFront();
""",
)

# Permanent source guards.
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """const proxyOwnershipClientPath = 'apps/extension/src/lib/proxy-ownership-client.ts';
""",
    """const proxyOwnershipClientPath = 'apps/extension/src/lib/proxy-ownership-client.ts';
const externalProfileAdapterPath = 'packages/browser-adapters/src/external-profile.ts';
const externalProfileWorkflowPath = 'packages/profile-workflow/src/external-profile.ts';
""",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """  proxyOwnershipClient,
  popupTemporaryRules,
""",
    """  proxyOwnershipClient,
  externalProfileAdapter,
  externalProfileWorkflow,
  popupTemporaryRules,
""",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """  readFile(proxyOwnershipClientPath, 'utf8'),
  readFile(popupTemporaryRulesPath, 'utf8'),
""",
    """  readFile(proxyOwnershipClientPath, 'utf8'),
  readFile(externalProfileAdapterPath, 'utf8'),
  readFile(externalProfileWorkflowPath, 'utf8'),
  readFile(popupTemporaryRulesPath, 'utf8'),
""",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """  [
    popupApp.includes('data-popup-temporary-rule') &&
""",
    """  [
    popupApp.includes('data-popup-external-profile') &&
      popupApp.includes('data-popup-external-profile-form') &&
      popupApp.includes("action: 'import-external-profile'") &&
      popupApp.includes("name.startsWith('_')") &&
      proxyOwnershipClient.includes('ExternalProfilePreview') &&
      !proxyOwnershipClient.includes('host:') &&
      !proxyOwnershipClient.includes('script:') &&
      externalProfileAdapter.includes("case 'auto_detect'") &&
      externalProfileAdapter.includes("case 'pac_script'") &&
      externalProfileAdapter.includes("case 'fixed_servers'") &&
      externalProfileAdapter.includes('singleProxy') &&
      externalProfileWorkflow.includes('findMatchingExternalProfile') &&
      externalProfileWorkflow.includes('createExternalProfileDraft'),
    'System-mode external Fixed/PAC import must keep raw effective proxy data in the background, validate original profile-name rules, avoid exact duplicates, and use the normal verified Apply transaction.',
  ],
  [
    popupApp.includes('data-popup-temporary-rule') &&
""",
)

replace_once(
    'docs/ORIGINAL_KNOWLEDGE_GRAPH.md',
    """- Nex 的控制权阻断直接读取浏览器适配层 capability，不把有效代理值传给 Popup。`controlled-by-other-extension` 映射 `app`，`not-controllable` 映射 `policy`，缺少 Firefox 必需权限映射 `disabled`，检查异常映射 `unknown`；阻断时不渲染切换、结果、永久条件或临时规则入口。外部配置导入仍为后续独立切片。
""",
    """- Nex 的控制权阻断直接读取浏览器适配层 capability，不把有效代理值传给 Popup。`controlled-by-other-extension` 映射 `app`，`not-controllable` 映射 `policy`，缺少 Firefox 必需权限映射 `disabled`，检查异常映射 `unknown`；阻断时不渲染切换、结果、永久条件或临时规则入口。
- System 为逻辑活动路由、界面设置允许显示且 Chromium 当前有效配置可导入时，后台把 `auto_detect` 转为 WPAD PAC URL，把 `pac_script` 转为 URL/inline PAC，把 `fixed_servers` 的 single/fallback/HTTP/HTTPS/FTP 与 bypass 转为 Fixed；`singleProxy` 覆盖 fallback，`<local>` 去重等价本地主机。与现有 Profile 完全一致时不显示重复外部行。Popup 只收到 `fixed|pac` 与建议名称，不接收主机、端口或 PAC 正文。
- 外部行按原版使用内联名称表单；空名称、以下划线开头和重名均拒绝。保存命令只带名称和 Applied revision，后台重新读取有效配置、拒绝脏 Draft/非 System/并发变化，CAS 写入后走正常 verified Apply 并立即启用。原版解析实现位于 Chromium target；Firefox 不伪造未有源码依据的 external import。
""",
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    """| I-07 | 外部扩展控制状态   | popup/target       | 阻断页 + external profile 导入 | MUST_MATCH | PARTIAL  | PARTIAL  | app/policy/permission/unknown 控制权阻断、整页隐藏、管理扩展入口、单测与双扩展 Chromium E2E 已实现；System 下有效 Fixed/PAC 导入仍缺 | 实现 external profile 导入 |
""",
    """| I-07 | 外部扩展控制状态   | popup/target       | 阻断页 + external profile 导入 | MUST_MATCH | DONE     | COMPLETE | 控制权阻断与管理入口已验证；System 下 Chromium auto-detect/PAC/fixed 转换、精确匹配去重、原版命名校验、后台原子导入并立即启用已有单测和 Chromium E2E；Firefox 原版无对应解析实现 | 保持守卫 |
""",
)

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
text = text.replace(
    '- Popup System-mode external Fixed/PAC import and bounded diagnostic functions,\n',
    '- Popup bounded diagnostic functions,\n',
)
text = text.replace(
    'Proceed to System-mode external Fixed/PAC import, then bounded request diagnostics and Inspect controls.',
    'Proceed to bounded request diagnostics and Inspect controls.',
)
marker = '- Proxy-ownership integration: run `30283438960`, product commit `af25f7c2c2af5d305c3b06d2ee385a425763eb05`.\n'
addition = marker + '- System-mode external import converts Chromium auto-detect/PAC/fixed settings in the background, suppresses exact duplicates, validates the original naming rules, and atomically imports plus activates through verified Apply.\n'
if text.count(marker) != 1:
    raise SystemExit(f'status external-profile insertion point count: {text.count(marker)}')
status.write_text(text.replace(marker, addition))
