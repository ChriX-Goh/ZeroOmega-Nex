from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(source.replace(old, new))


# Chromium serves a local remote list and verifies custom headers and cache replacement.
replace_once(
    'scripts/e2e-chromium.mjs',
    "import { mkdtemp, rm } from 'node:fs/promises';\n",
    "import { mkdtemp, rm } from 'node:fs/promises';\nimport { createServer } from 'node:http';\n",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-chromium-'));
let context;

try {
''',
    '''const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-chromium-'));
const remoteRuleText = '[AutoProxy 0.2.9]\\n||downloaded.e2e.invalid';
let receivedRuleHeader = '';
const ruleServer = createServer((request, response) => {
  receivedRuleHeader = String(request.headers['x-e2e'] ?? '');
  response.writeHead(200, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(remoteRuleText);
});
await new Promise((resolveListen, rejectListen) => {
  ruleServer.once('error', rejectListen);
  ruleServer.listen(0, '127.0.0.1', resolveListen);
});
const ruleAddress = ruleServer.address();
if (!ruleAddress || typeof ruleAddress === 'string') throw new Error('Rule List test server failed');
const remoteRuleUrl = `http://127.0.0.1:${ruleAddress.port}/rules.txt`;
let context;

try {
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await attachedHeaders.locator('input[aria-label="Attached header 1 name"]').fill('X-E2E');
  await attachedHeaders.locator('input[aria-label="Attached header 1 value"]').fill('attached');
  options.once('dialog', (dialog) => dialog.accept());
''',
    '''  const attachedHeaderName = attachedHeaders.locator(
    'input[aria-label="Attached header 1 name"]',
  );
  const attachedHeaderValue = attachedHeaders.locator(
    'input[aria-label="Attached header 1 value"]',
  );
  await attachedHeaderName.fill('X-E2E');
  await attachedHeaderName.press('Tab');
  await attachedHeaderValue.fill('attached');
  await attachedHeaderValue.press('Tab');

  const sourceType = attachedConfig.getByLabel('Attached Rule List source type');
  await assertEventually(
    async () => !(await sourceType.isDisabled()),
    'Attached Rule List source type remained disabled after saving headers',
  );
  await sourceType.selectOption('url');
  const sourceUrl = attachedConfig.getByLabel('Attached Rule List URL');
  await sourceUrl.waitFor();
  await sourceUrl.fill(remoteRuleUrl);
  await sourceUrl.press('Tab');
  const downloadNow = attachedConfig.locator('[data-rule-source-update-now]');
  await assertEventually(
    async () => !(await downloadNow.isDisabled()),
    'Rule Source download button remained disabled after saving the URL',
  );
  await downloadNow.click();
  await options
    .locator('[data-rule-source-update-status]')
    .filter({ hasText: 'Last updated' })
    .waitFor({ timeout: 20_000 });
  assert.equal(
    await attachedConfig.getByLabel('Attached Rule List downloaded text').inputValue(),
    remoteRuleText,
  );
  assert.equal(receivedRuleHeader, 'attached');

  options.once('dialog', (dialog) => dialog.accept());
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''} finally {
  await context?.close();
  await rm(userDataDir, { recursive: true, force: true });
}
''',
    '''} finally {
  await context?.close();
  await new Promise((resolveClose) => ruleServer.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
}
''',
)

# Component rendering includes remote update controls and status shell.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''    attachedSource.headers = [
      { name: 'X-Component', value: { kind: 'literal', value: 'component-value' } },
    ];
    const { body } = render(SwitchProfileEditor, {
''',
    '''    attachedSource.headers = [
      { name: 'X-Component', value: { kind: 'literal', value: 'component-value' } },
    ];
    attachedSource.location = {
      kind: 'url',
      url: 'https://rules.example.invalid/component.txt',
      content: 'cached component rules',
    };
    const { body } = render(SwitchProfileEditor, {
''',
)
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''    expect(body).toContain('component-value');
    expect(body).toContain('Delete attached Rule List');
''',
    '''    expect(body).toContain('component-value');
    expect(body).toContain('data-rule-source-update-now');
    expect(body).toContain('data-rule-source-update-status');
    expect(body).toContain('Never downloaded.');
    expect(body).toContain('cached component rules');
    expect(body).toContain('Delete attached Rule List');
''',
)

# Permanent implementation guard.
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''const runtimePath = 'apps/extension/src/lib/profile-workflow-runtime.ts';
const switchOperationsPath = 'packages/profile-workflow/src/switch-operations.ts';
''',
    '''const runtimePath = 'apps/extension/src/lib/profile-workflow-runtime.ts';
const ruleSourceDownloaderPath = 'apps/extension/src/lib/rule-source-downloader.ts';
const ruleSourceUpdatePath = 'packages/profile-workflow/src/rule-source-update.ts';
const switchOperationsPath = 'packages/profile-workflow/src/switch-operations.ts';
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''  runtime,
  switchOperations,
''',
    '''  runtime,
  ruleSourceDownloader,
  ruleSourceUpdate,
  switchOperations,
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''  readFile(runtimePath, 'utf8'),
  readFile(switchOperationsPath, 'utf8'),
''',
    '''  readFile(runtimePath, 'utf8'),
  readFile(ruleSourceDownloaderPath, 'utf8'),
  readFile(ruleSourceUpdatePath, 'utf8'),
  readFile(switchOperationsPath, 'utf8'),
''',
)
marker = '''  [
    !switchOperations.includes('`${source.note} copy`') &&
'''
addition = '''  [
    attachedRuleListConfig.includes('data-rule-source-update-now') &&
      attachedRuleListConfig.includes('data-rule-source-update-status') &&
      attachedRuleListConfig.includes('Existing cached content was preserved') &&
      optionsApp.includes("action: 'update-rule-source'") &&
      optionsApp.includes('requestRuleSourceOriginPermission') &&
      runtime.includes('BrowserRuleSourceDownloader') &&
      ruleSourceDownloader.includes("credentials: 'omit'") &&
      ruleSourceDownloader.includes("cache: 'no-store'") &&
      ruleSourceDownloader.includes("referrerPolicy: 'no-referrer'") &&
      ruleSourceUpdate.includes('RULE_SOURCE_UPDATE_TIMEOUT_MS = 10_000') &&
      ruleSourceUpdate.includes('RULE_SOURCE_UPDATE_MAX_BYTES = 4 * 1024 * 1024') &&
      ruleSourceUpdate.includes('repository.compareAndSwap(current.generation, next)') &&
      ruleSourceUpdate.includes('Rule Source request header') &&
      ruleSourceUpdate.includes('old cached content') === false,
    'Remote Rule Sources must use background-only bounded downloads, user-granted host permission, safe secret headers, atomic CAS replacement, and preserved old cache on failure.',
  ],
'''
replace_once('scripts/validate-ui-compatibility.mjs', marker, addition + marker)

# Source-backed facts and audit state: manual update is implemented; scheduling remains open.
replace_once(
    'docs/ORIGINAL_KNOWLEDGE_GRAPH.md',
    '- “立即下载”、更新时间和下载错误属于后台网络更新服务，未实现前保持独立缺口，不能用已有缓存冒充下载功能。',
    '- “立即下载”由后台网络服务执行：Options 的用户手势先请求 URL origin 权限；后台解析秘密 header，使用 10 秒 timeout、4 MiB 解压后上限、`credentials: omit` 与无 referrer 请求。成功内容与状态在同一 workflow CAS 中替换；失败、空内容、超限或并发编辑保留旧缓存。更新时间、字节数、错误与 stale 状态属于 workflow 运行元数据，不进入 ProfileSpec。自动按 interval 调度仍是独立缺口。',
)
replace_once(
    'docs/ORIGINAL_KNOWLEDGE_GRAPH.md',
    '- 图形/源码编辑已闭环；附属 RuleList 的创建、启停、路由、格式/URL/headers/文本、隐藏导航、导入重建、复制与删除事务已实现。网络立即下载/更新时间/错误状态、完整 locale、源码模式跨重载持久化和浏览器拖放 E2E 仍未完成，因此 Switch 整体仍是 `PARTIAL`。',
    '- 图形/源码编辑已闭环；附属 RuleList 的创建、启停、路由、格式/URL/headers/文本、隐藏导航、导入重建、复制、删除事务和手动后台下载状态已实现。自动 interval 调度、完整 locale、源码模式跨重载持久化和浏览器拖放 E2E 仍未完成，因此 Switch 整体仍是 `PARTIAL`。',
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    '| D-19 | 附属立即下载     | 同上                                           | 下载状态/更新时间/错误                     | MUST_MATCH | MISSING  | MISSING | 本切片只保留 URL 缓存和只读语义，尚无后台安全下载、时间戳与错误状态                              | 下一切片实现           |',
    '| D-19 | 附属立即下载     | 同上                                           | 下载状态/更新时间/错误                     | MUST_MATCH | PARTIAL  | PARTIAL | 已有用户授权、后台安全 header/secret 解析、10 秒/4 MiB 边界、原子缓存替换、时间/字节/stale/错误状态及 Chromium 本地 HTTP E2E；自动 interval 调度未实现 | 增加 alarms 定时调度   |',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    '- Network download/update state remains deliberately separate and is the next slice.',
    '- Manual background download/update now uses user-granted host permission, secret header resolution, bounded isolated fetches, atomic cached-content replacement, persisted timestamps/bytes/errors, and stale calculation. Automatic interval scheduling remains separate.',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    '- attached Rule List background download, update timestamp, stale/error state, and safe request execution,',
    '- attached Rule List automatic interval scheduling and startup/due-source refresh,',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    'Implement the background Rule List download/update service with timestamps, stale/error states, safe request headers, and atomic cached-content replacement.',
    'Verify the manual background Rule List download/update service, then implement automatic interval scheduling or proceed to the next source-backed blocker according to the audit matrix.',
)
