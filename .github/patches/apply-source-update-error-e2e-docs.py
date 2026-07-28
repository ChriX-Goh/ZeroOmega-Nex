from pathlib import Path

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:220]!r}')
    path.write_text(text.replace(old, new, 1))


def insert_before(path: Path, anchor: str, addition: str) -> None:
    text = path.read_text()
    count = text.count(anchor)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {anchor[:220]!r}')
    path.write_text(text.replace(anchor, addition + anchor, 1))


chromium = ROOT / 'scripts/e2e-chromium.mjs'
replace_once(
    chromium,
    """  if (request.url?.startsWith('/proxy.pac')) {
""",
    """  if (request.url?.startsWith('/source-http-error')) {
    response.writeHead(503, {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end('private response body must never be rendered');
    return;
  }
  if (request.url?.startsWith('/source-empty')) {
    response.writeHead(200, {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end('');
    return;
  }
  if (request.url?.startsWith('/proxy.pac')) {
""",
)
replace_once(
    chromium,
    """const remoteRuleUrl = `http://127.0.0.1:${ruleAddress.port}/rules.txt`;
const remotePacUrl = `http://127.0.0.1:${ruleAddress.port}/proxy.pac`;
""",
    """const remoteRuleUrl = `http://127.0.0.1:${ruleAddress.port}/rules.txt`;
const remotePacUrl = `http://127.0.0.1:${ruleAddress.port}/proxy.pac`;
const sourceHttpErrorUrl = `http://127.0.0.1:${ruleAddress.port}/source-http-error`;
const sourceEmptyUrl = `http://127.0.0.1:${ruleAddress.port}/source-empty`;
""",
)
replace_once(
    chromium,
    """  const pacScript = pacEditor.getByLabel('PAC 脚本', { exact: true });
  assert.equal(await pacScript.inputValue(), remotePacText);
  assert.equal(await pacScript.isEditable(), false);
  await pacEditor.getByRole('button', { name: '清空 PAC 网址', exact: true }).click();
""",
    """  const pacScript = pacEditor.getByLabel('PAC 脚本', { exact: true });
  assert.equal(await pacScript.inputValue(), remotePacText);
  assert.equal(await pacScript.isEditable(), false);
  await pacUrl.fill(sourceEmptyUrl);
  await pacUrl.press('Tab');
  await assertEventually(
    async () => !(await pacDownload.isDisabled()),
    'PAC stable-error download button remained disabled',
  );
  await pacDownload.click();
  const pacFailureStatus = pacEditor.locator('[data-pac-source-update-status]');
  await pacFailureStatus.filter({ hasText: '下载内容为空' }).waitFor({ timeout: 20_000 });
  assert.match(await pacFailureStatus.innerText(), /已保留现有缓存脚本/u);
  assert.doesNotMatch(await pacFailureStatus.innerText(), /private response body|source-empty/u);
  assert.equal(await pacScript.inputValue(), remotePacText);
  const pacFailureRecord = await worker.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const state = (await chrome.storage.local.get(key))[key];
    return Object.values(state?.ruleSourceUpdates ?? {}).find(
      (record) => record?.sourceId?.startsWith('pac:'),
    )?.lastError;
  });
  assert.equal(pacFailureRecord?.code, 'response-empty');
  await pacEditor.getByRole('button', { name: '清空 PAC 网址', exact: true }).click();
""",
)
replace_once(
    chromium,
    """  const independentText = independentRuleEditor.getByLabel('规则列表正文');
  assert.equal(await independentText.inputValue(), remoteRuleText);
  assert.equal(await independentText.isEditable(), false);
  await independentRuleEditor.getByRole('button', { name: '清除规则列表网址' }).click();
""",
    """  const independentText = independentRuleEditor.getByLabel('规则列表正文');
  assert.equal(await independentText.inputValue(), remoteRuleText);
  assert.equal(await independentText.isEditable(), false);
  await independentUrl.fill(sourceHttpErrorUrl);
  await independentUrl.press('Tab');
  await assertEventually(
    async () => !(await independentDownload.isDisabled()),
    'Rule Source stable-error download button remained disabled',
  );
  await independentDownload.click();
  await independentStatus
    .filter({ hasText: '服务器返回 HTTP 错误（503）' })
    .waitFor({ timeout: 20_000 });
  assert.match(await independentStatus.innerText(), /已保留现有缓存内容/u);
  assert.doesNotMatch(await independentStatus.innerText(), /private response body|source-http-error/u);
  assert.equal(await independentText.inputValue(), remoteRuleText);
  const ruleFailureRecord = await worker.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const state = (await chrome.storage.local.get(key))[key];
    return Object.values(state?.ruleSourceUpdates ?? {}).find(
      (record) => record?.url?.endsWith('/source-http-error'),
    )?.lastError;
  });
  assert.deepEqual(
    { code: ruleFailureRecord?.code, httpStatus: ruleFailureRecord?.httpStatus },
    { code: 'response-http-error', httpStatus: 503 },
  );
  await independentRuleEditor.getByRole('button', { name: '清除规则列表网址' }).click();
""",
)

locale_guard = ROOT / 'scripts/validate-localization.mjs'
requirements = """
requireText(
  entries.catalog,
  'export interface SourceUpdateFailureMessageParameters',
  'Stable source-update UI parameters are missing.',
);
requireText(
  entries.catalog,
  "'response-http-error':",
  'Code-specific source-update localization is missing.',
);
requireText(
  entries.attachedRuleList,
  'code: view.lastError.code',
  'Attached Rule List must render failure status from the stable code.',
);
requireText(
  entries.independentRuleList,
  'code: view.lastError.code',
  'Independent Rule List must render failure status from the stable code.',
);
requireText(
  entries.pac,
  'code: view.lastError.code',
  'PAC must render failure status from the stable code.',
);
requireText(
  entries.chromiumE2e,
  "ruleFailureRecord?.code",
  'Chromium stable Rule Source failure-code coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  "pacFailureRecord?.code",
  'Chromium stable PAC failure-code coverage is missing.',
);
"""
insert_before(
    locale_guard,
    "requireText(\n  entries.catalog,\n  \"readonly 'switch.sourceError'\"",
    requirements,
)

ui_guard = ROOT / 'scripts/validate-ui-compatibility.mjs'
replace_once(
    ui_guard,
    "const ruleSourceUpdatePath = 'packages/profile-workflow/src/rule-source-update.ts';",
    "const ruleSourceUpdatePath = 'packages/profile-workflow/src/rule-source-update.ts';\n"
    "const sourceUpdateErrorPath = 'packages/profile-workflow/src/source-update-error.ts';",
)
replace_once(
    ui_guard,
    "  ruleSourceUpdate,\n  switchOperations,",
    "  ruleSourceUpdate,\n  sourceUpdateError,\n  switchOperations,",
)
replace_once(
    ui_guard,
    "  readFile(ruleSourceUpdatePath, 'utf8'),\n  readFile(switchOperationsPath, 'utf8'),",
    "  readFile(ruleSourceUpdatePath, 'utf8'),\n"
    "  readFile(sourceUpdateErrorPath, 'utf8'),\n"
    "  readFile(switchOperationsPath, 'utf8'),",
)
stable_requirement = """  [
    sourceUpdateError.includes('PROFILE_WORKFLOW_SOURCE_UPDATE_ERROR_CODES') &&
      sourceUpdateError.includes("'response-http-error'") &&
      sourceUpdateError.includes("'response-too-large'") &&
      sourceUpdateError.includes("'header-secret-unavailable'") &&
      sourceUpdateError.includes("'unknown-failure'") &&
      ruleSourceDownloader.includes('ProfileWorkflowSourceUpdateError') &&
      ruleSourceDownloader.includes("'request-timeout'") &&
      ruleSourceDownloader.includes("'request-network-failed'") &&
      ruleSourceUpdate.includes('normalizeProfileWorkflowSourceUpdateFailure') &&
      pacSourceUpdate.includes('normalizeProfileWorkflowSourceUpdateFailure') &&
      attachedRuleListConfig.includes('code: view.lastError.code') &&
      independentRuleListEditor.includes('code: view.lastError.code') &&
      pacProfileEditor.includes('code: view.lastError.code') &&
      chromiumE2e.includes("ruleFailureRecord?.code") &&
      chromiumE2e.includes("pacFailureRecord?.code") &&
      chromiumE2e.includes('服务器返回 HTTP 错误（503）') &&
      chromiumE2e.includes('下载内容为空'),
    'Rule Source and PAC failures must use stable serializable codes, safe localized UI details, preserved caches, and real Chromium failure-path evidence.',
  ],
"""
insert_before(
    ui_guard,
    "  [\n    attachedRuleListConfig.includes('data-rule-source-update-now')",
    stable_requirement,
)

status = ROOT / 'docs/MILESTONE_8_STATUS.md'
section = """### Stable Rule Source and PAC update failure codes

- Rule Source and PAC updates share fifteen stable semantic failure codes covering URL, request-header, timeout/network, HTTP, size, empty response, byte-count, and unknown failures.
- Persisted update records retain a bounded safe message plus optional HTTP status or byte limit. Raw exception text, response bodies, URLs, secret references, and secret values are not stored or rendered.
- Existing records without a code remain readable and normalize to `unknown-failure`; invalid codes or numeric details are rejected at the storage boundary.
- Attached/independent Rule List and PAC editors localize the same code in English, Simplified Chinese, and Traditional Chinese while explicitly stating that the previous cache remains in use.
- Unit tests cover downloader typing, unknown-exception redaction, controlled headers, legacy storage compatibility, PAC empty responses, and code-specific messages. Chromium injects HTTP 503 and empty-response failures and verifies both the localized UI and persisted codes without losing cached content.

"""
insert_before(status, '### Typed imported Auto Detect and closed visible locale inventory\n', section)
replace_once(
    status,
    '- stable Rule Source/PAC downloader failure codes for complete semantic error localization,\n',
    '',
)
replace_once(
    status,
    'Proceed to non-localization closure: Firefox remote-origin PAC/Rule Source permission and download coverage, stable downloader failure codes, explicit `file:` PAC scope, schema-v1/online restore decisions, and consolidated owner visual/real-backup QC.',
    'Add Firefox remote-origin PAC and Rule Source permission/download coverage through the same bounded downloader and stable failure-code contract, then resolve the explicit `file:` PAC scope and remaining import/sync decisions.',
)
replace_once(
    status,
    '- Switch parser errors use stable `SwitchSourceError.code` plus line numbers. Rule Source update records do not yet expose stable failure codes, so the UI deliberately shows a localized failure summary instead of leaking an unstable English downloader message; complete downloader error localization remains open.',
    '- Switch parser errors and Rule Source/PAC download failures now use stable semantic codes. Download UIs localize code-specific details and never render unstable downloader exception text.',
)

kg = ROOT / 'docs/ORIGINAL_KNOWLEDGE_GRAPH.md'
kg_text = kg.read_text()
kg_section = """

### Stable remote-source failure contract

- Rule Source and PAC use one serializable fifteen-code failure taxonomy. Stored records include code, occurredAt, a bounded safe message, and only non-sensitive parameters such as HTTP status or byte limit.
- Browser downloader exceptions are converted at the adapter boundary. Raw response bodies, URLs, credentials, request-header secret references, and lower-level exception text never cross into workflow state or UI.
- Existing cached Rule List text or PAC script remains unchanged on every failed update. The failure record is committed atomically with compare-and-swap and remains separate from ProfileSpec.
- Legacy stored failures without code normalize to `unknown-failure`; new invalid codes and malformed numeric parameters fail storage parsing.
- Chromium verifies HTTP and empty-response failure paths, localized code-specific status, persisted codes, and unchanged cache content.
"""
if '### Stable remote-source failure contract' not in kg_text:
    kg.write_text(kg_text.rstrip() + kg_section + '\n')

matrix = ROOT / 'docs/UI_AUDIT_MATRIX.md'
text = matrix.read_text()
text = text.replace(
    '完整错误码与 Firefox 下载',
    '补 Firefox 远程权限/下载',
)
text = text.replace(
    '补完整错误码与 Firefox 下载',
    '补 Firefox 远程权限/下载',
)
if '2026-07-29 | 完成 Rule Source/PAC 稳定失败码' not in text:
    text = text.rstrip() + (
        '\n| 2026-07-29 | 完成 Rule Source/PAC 稳定失败码、三语语义状态、缓存保留与 Chromium HTTP/空响应失败闭环 |\n'
    )
matrix.write_text(text)

print('Patched stable source-update Chromium failures, permanent guards, and durable documentation.')
