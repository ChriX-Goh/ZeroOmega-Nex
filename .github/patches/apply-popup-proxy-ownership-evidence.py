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
    """import { mkdtemp, rm } from 'node:fs/promises';
""",
    """import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
""",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    """const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-chromium-'));
""",
    """const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-chromium-'));
const conflictUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-conflict-user-'));
const conflictExtensionPath = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-conflict-ext-'));
await mkdir(conflictExtensionPath, { recursive: true });
await writeFile(
  resolve(conflictExtensionPath, 'manifest.json'),
  JSON.stringify({
    manifest_version: 3,
    name: 'Proxy Ownership Conflict E2E',
    version: '1.0.0',
    permissions: ['proxy'],
    background: { service_worker: 'background.js' },
  }),
);
await writeFile(
  resolve(conflictExtensionPath, 'background.js'),
  `const claim = async () => chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' });\nvoid claim();\nsetInterval(() => void claim(), 250);\n`,
);
""",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    """let context;

try {
""",
    """let context;
let conflictContext;

try {
""",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    """  console.log(`Chromium extension E2E passed for ${extensionId}.`);
""",
    """  conflictContext = await chromium.launchPersistentContext(conflictUserDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [
      `--disable-extensions-except=${extensionPath},${conflictExtensionPath}`,
      `--load-extension=${extensionPath},${conflictExtensionPath}`,
    ],
  });
  let conflictWorker;
  await assertEventually(async () => {
    for (const candidate of conflictContext.serviceWorkers()) {
      const name = await candidate
        .evaluate(() => chrome.runtime.getManifest().name)
        .catch(() => '');
      if (name === 'Proxy Ownership Conflict E2E') {
        conflictWorker = candidate;
        return true;
      }
    }
    return false;
  }, 'Conflicting proxy extension service worker was not resolved');
  await assertEventually(
    async () =>
      conflictWorker.evaluate(
        async () =>
          (await chrome.proxy.settings.get({ incognito: false })).levelOfControl ===
          'controlled_by_this_extension',
      ),
    'Conflicting extension did not obtain proxy control',
  );
  const blockedPopup = await conflictContext.newPage();
  await blockedPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  const ownershipBlocker = blockedPopup.locator(
    '[data-popup-proxy-not-controllable][data-reason="app"]',
  );
  await ownershipBlocker.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await ownershipBlocker.innerText(), /其他应用正在控制代理设置/u);
  await ownershipBlocker.locator('[data-popup-manage-extensions]').waitFor();
  assert.equal(await blockedPopup.locator('.profile-row').count(), 0);
  assert.equal(await blockedPopup.locator('[data-popup-temporary-rule]').count(), 0);
  assert.equal(await blockedPopup.locator('[data-popup-add-current-site]').count(), 0);
  await blockedPopup.close();

  console.log(`Chromium extension E2E passed for ${extensionId}.`);
""",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    """} finally {
  await context?.close();
  await new Promise((resolveClose) => ruleServer.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
}
""",
    """} finally {
  await conflictContext?.close();
  await context?.close();
  await new Promise((resolveClose) => ruleServer.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
  await rm(conflictUserDataDir, { recursive: true, force: true });
  await rm(conflictExtensionPath, { recursive: true, force: true });
}
""",
)

replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """const currentSitePath = 'apps/extension/src/lib/current-site.ts';
""",
    """const currentSitePath = 'apps/extension/src/lib/current-site.ts';
const proxyOwnershipCorePath = 'packages/browser-adapters/src/ownership.ts';
const proxyOwnershipRuntimePath = 'apps/extension/src/lib/proxy-ownership-runtime.ts';
const proxyOwnershipClientPath = 'apps/extension/src/lib/proxy-ownership-client.ts';
""",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """  currentSite,
  popupTemporaryRules,
""",
    """  currentSite,
  proxyOwnershipCore,
  proxyOwnershipRuntime,
  proxyOwnershipClient,
  popupTemporaryRules,
""",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """  readFile(currentSitePath, 'utf8'),
  readFile(popupTemporaryRulesPath, 'utf8'),
""",
    """  readFile(currentSitePath, 'utf8'),
  readFile(proxyOwnershipCorePath, 'utf8'),
  readFile(proxyOwnershipRuntimePath, 'utf8'),
  readFile(proxyOwnershipClientPath, 'utf8'),
  readFile(popupTemporaryRulesPath, 'utf8'),
""",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """  [
    popupApp.includes('data-popup-temporary-rule') &&
""",
    """  [
    popupApp.includes('data-popup-proxy-not-controllable') &&
      popupApp.includes('data-popup-manage-extensions') &&
      popupApp.includes('loadProxyOwnership()') &&
      popupApp.includes("'chrome://extensions/'") &&
      popupApp.includes("'about:addons'") &&
      proxyOwnershipCore.includes("reason: 'app'") &&
      proxyOwnershipCore.includes("reason: 'policy'") &&
      proxyOwnershipCore.includes("reason: 'disabled'") &&
      proxyOwnershipRuntime.includes('if (!isProxyOwnershipCommand(message)) return undefined;') &&
      !proxyOwnershipRuntime.includes('const listener = async') &&
      proxyOwnershipClient.includes('PROXY_OWNERSHIP_MESSAGE_CHANNEL'),
    'Popup must fail closed when another extension, policy, or missing browser capability prevents proxy control, and every ownership message listener must synchronously reject unrelated channels.',
  ],
  [
    popupApp.includes('data-popup-temporary-rule') &&
""",
)

replace_once(
    'docs/ORIGINAL_KNOWLEDGE_GRAPH.md',
    """- 外部扩展控制的代理状态。
""",
    """- 外部代理行为分为两个独立节点：其一是控制权阻断，Chromium/Firefox 的 `levelOfControl` 为其他扩展控制或策略不可控时，原版隐藏正常 Popup 菜单、显示原因和通用说明，并提供取消与管理扩展入口；其二是在 System 模式下把浏览器当前有效 Fixed/PAC 设置作为外部情景模式导入，不能因完成阻断页就宣称整个 external profile 功能完成。
- Nex 的控制权阻断直接读取浏览器适配层 capability，不把有效代理值传给 Popup。`controlled-by-other-extension` 映射 `app`，`not-controllable` 映射 `policy`，缺少 Firefox 必需权限映射 `disabled`，检查异常映射 `unknown`；阻断时不渲染切换、结果、永久条件或临时规则入口。外部配置导入仍为后续独立切片。
""",
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    """| I-07 | 外部扩展控制状态   | popup/target       | 显示 external profile        | MUST_MATCH | MISSING  | MISSING  | 无                                                                                                                                          | 读取 proxy ownership   |
""",
    """| I-07 | 外部扩展控制状态   | popup/target       | 阻断页 + external profile 导入 | MUST_MATCH | PARTIAL  | PARTIAL  | app/policy/permission/unknown 控制权阻断、整页隐藏、管理扩展入口、单测与双扩展 Chromium E2E 已实现；System 下有效 Fixed/PAC 导入仍缺 | 实现 external profile 导入 |
""",
)

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
text = text.replace(
    '- Popup external-ownership and bounded diagnostic functions,\n',
    '- Popup System-mode external Fixed/PAC import and bounded diagnostic functions,\n',
)
text = text.replace(
    'Proceed to the Popup external-extension ownership state, then bounded request diagnostics and Inspect controls.',
    'Proceed to System-mode external Fixed/PAC import, then bounded request diagnostics and Inspect controls.',
)
marker = '- Temporary-rule integration: run `30281637537`, product commit `625ceb598423c0dda5641490e4a8cdefdf915cfb`.\n'
addition = marker + '- Proxy ownership blocking now distinguishes other-extension, policy, missing-capability, and unknown states; it hides all switching/current-site actions and provides the original management escape hatch. System-mode external configuration import remains separate.\n'
if text.count(marker) != 1:
    raise SystemExit(f'status ownership insertion point count: {text.count(marker)}')
status.write_text(text.replace(marker, addition))
