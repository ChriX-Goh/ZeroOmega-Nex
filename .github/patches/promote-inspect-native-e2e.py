from pathlib import Path
import json
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:140]!r}')
    target.write_text(text.replace(old, new, 1))


native_e2e = r"""import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-inspect-native-'));
const workflowStorageKey = 'zeroomega-nex/profile-workflow/v1/state';
const inspectStorageKey = 'zeroomega-nex/inspect/v1/state';
const targetUrl = 'https://cdn.example.test/native-menu.js';
let context;

function run(command, args, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.once('error', rejectRun);
    child.once('exit', (code, signal) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} exited with code ${code} signal ${signal ?? 'none'}`));
    });
  });
}

async function eventually(check, message, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      last = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error(`${message}${last ? `: ${last}` : ''}`);
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: false,
    locale: 'en-US',
    viewport: { width: 1280, height: 800 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--window-position=0,0',
      '--window-size=1280,800',
    ],
  });

  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  assert.match(extensionId, /^[a-p]{32}$/u);

  const bootstrapPage = await context.newPage();
  await bootstrapPage.goto(`chrome-extension://${extensionId}/options.html`);
  await bootstrapPage.waitForLoadState('domcontentloaded');
  await eventually(
    async () =>
      worker.evaluate(async (key) => {
        const values = await chrome.storage.local.get(key);
        return Boolean(values[key]);
      }, workflowStorageKey),
    'Profile workflow did not initialize from Options',
  );
  await bootstrapPage.close();

  const page = await context.newPage();
  await page.setContent(`<!doctype html>
    <html><body style="font: 20px sans-serif; padding: 80px">
      <a id="inspect-target" href="${targetUrl}">Native Inspect target</a>
    </body></html>`);
  await page.bringToFront();
  await new Promise((resolveWait) => setTimeout(resolveWait, 500));

  await page.locator('#inspect-target').click({ button: 'right' });
  await new Promise((resolveWait) => setTimeout(resolveWait, 800));
  await run('scrot', ['inspect-native-menu-before.png']);

  // Chromium places extension link actions immediately before its built-in Inspect item.
  // End selects built-in Inspect; one Up selects ZeroOmega's real native Inspect link item.
  await run('xdotool', ['key', '--clearmodifiers', 'End', 'Up', 'Return']);

  const stored = await eventually(
    async () =>
      worker.evaluate(async (key) => {
        const values = await chrome.storage.session.get(key);
        return values[key];
      }, inspectStorageKey),
    'Keyboard-selected native context-menu action did not create Inspect session state',
  );
  const entries = stored?.entries ?? {};
  const matched = Object.entries(entries).find(([, entry]) => entry?.url === targetUrl);
  assert.ok(matched, `Inspect state did not contain the native link target: ${JSON.stringify(stored)}`);

  const tabId = Number(matched[0]);
  assert.ok(Number.isInteger(tabId) && tabId >= 0, `Inspect state had an invalid tab ID: ${matched[0]}`);
  const action = await worker.evaluate(async (id) => {
    const [badge, title] = await Promise.all([
      chrome.action.getBadgeText({ tabId: id }),
      chrome.action.getTitle({ tabId: id }),
    ]);
    return { badge, title };
  }, tabId);
  assert.equal(action.badge, '#');
  assert.match(action.title, /^\[Inspect\] cdn\.example\.test/mu);
  console.log(`[native-inspect] success ${JSON.stringify({ tabId, stored, action })}`);
} catch (error) {
  await run('scrot', ['inspect-native-menu-failure.png']).catch(() => undefined);
  throw error;
} finally {
  await context?.close().catch(() => undefined);
  await rm(userDataDir, { recursive: true, force: true });
}
"""
Path('scripts/e2e-inspect-native-menu.mjs').write_text(native_e2e)

package_path = Path('package.json')
package_data = json.loads(package_path.read_text())
package_data['scripts']['test:e2e:inspect-native'] = 'node scripts/e2e-inspect-native-menu.mjs'
package_path.write_text(json.dumps(package_data, ensure_ascii=False, indent=2) + '\n')

workflow_path = Path('.github/workflows/browser-e2e.yml')
workflow = workflow_path.read_text()
workflow += r"""

  chromium-native-inspect:
    runs-on: ubuntu-latest
    timeout-minutes: 25

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24

      - name: Activate pnpm
        run: |
          corepack enable
          corepack prepare pnpm@11.4.0 --activate

      - name: Install locked dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright Chromium and native UI tools
        run: |
          pnpm exec playwright install --with-deps chromium
          sudo apt-get update
          sudo apt-get install -y --no-install-recommends dbus-x11 scrot xauth xdotool xvfb

      - name: Build Chromium extension
        run: ZEROOMEGA_RULE_SOURCE_E2E=1 pnpm build:chromium

      - name: Run native Inspect context-menu E2E
        shell: bash
        run: |
          set -o pipefail
          dbus-run-session -- bash -lc '
            xvfb-run -a -s "-screen 0 1280x800x24 -ac +extension RANDR" \
              pnpm test:e2e:inspect-native
          ' 2>&1 | tee inspect-native-menu-e2e.log

      - name: Upload native Inspect evidence
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: inspect-native-menu-e2e
          path: |
            inspect-native-menu-e2e.log
            inspect-native-menu-before.png
            inspect-native-menu-failure.png
          if-no-files-found: warn
"""
workflow_path.write_text(workflow)

validator_path = Path('scripts/validate-ui-compatibility.mjs')
validator = validator_path.read_text()
replace_once(
    str(validator_path),
    "const inspectRuntimePath = 'apps/extension/src/lib/inspect-runtime.ts';\n",
    """const inspectRuntimePath = 'apps/extension/src/lib/inspect-runtime.ts';
const nativeInspectE2ePath = 'scripts/e2e-inspect-native-menu.mjs';
const browserE2eWorkflowPath = '.github/workflows/browser-e2e.yml';
""",
)
validator = validator_path.read_text()
replace_once(
    str(validator_path),
    """const requirements = [
""",
    """const [nativeInspectE2e, browserE2eWorkflow] = await Promise.all([
  readFile(nativeInspectE2ePath, 'utf8'),
  readFile(browserE2eWorkflowPath, 'utf8'),
]);

const requirements = [
""",
)
validator = validator_path.read_text()
anchor = """  [
    popupStyle.includes("font-family: 'Segoe UI'"),"""
check = """  [
    nativeInspectE2e.includes("click({ button: 'right' })") &&
      nativeInspectE2e.includes("['key', '--clearmodifiers', 'End', 'Up', 'Return']") &&
      nativeInspectE2e.includes("chrome.storage.session.get(key)") &&
      nativeInspectE2e.includes("assert.equal(action.badge, '#')") &&
      nativeInspectE2e.includes("assert.match(action.title") &&
      !nativeInspectE2e.match(/xdotool[^\\n]*(?:mousemove|click)\\s+\\d+/u) &&
      browserE2eWorkflow.includes('chromium-native-inspect:') &&
      browserE2eWorkflow.includes('pnpm test:e2e:inspect-native') &&
      browserE2eWorkflow.includes('xvfb-run') &&
      browserE2eWorkflow.includes('xdotool'),
    'Inspect must retain a real headed Chromium native-menu E2E that right-clicks the page, uses focused keyboard navigation rather than coordinates, and verifies session state plus toolbar presentation.',
  ],
"""
if validator.count(anchor) != 1:
    raise SystemExit('UI validator native Inspect insertion anchor missing')
validator_path.write_text(validator.replace(anchor, check + anchor, 1))

kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg_path.write_text(
    kg_path.read_text()
    + """
- Inspect 的浏览器级验收必须触发 Chromium 原生上下文菜单，而不能用 DOM `contextmenu` 事件或直接调用 `onClicked` 监听器替代。永久 E2E 在 headed Chromium/Xvfb 中真实右击链接，菜单获得原生键盘焦点后使用 `End → Up → Enter` 选择唯一已加载扩展的 `Inspect link`，再从 `storage.session`、`chrome.action` 徽章和标题三处验证结果。
- 该 E2E 不使用屏幕坐标。测试构建只加载 ZeroOmega Nex；Chromium 内置 `Inspect` 是链接菜单最后一项，扩展 `Inspect link` 紧邻其上。菜单结构变化会让 session-state 断言失败，而不是误报成功。
"""
)

replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    "| I-09 | Inspect 菜单       | popup/network      | 可配置显示                     | MUST_MATCH | PARTIAL  | PARTIAL  | Applied flag 驱动 frame/link/media 菜单；目标按 tab session 保存；现已按活动 startRoute 求值，`#` 使用结果 Profile/Direct/System 颜色，标题恢复 `[检查] 目标` + 当前→结果两行结构；单测覆盖启停、求值、清除、tab 生命周期 | 补原生浏览器右键菜单 E2E          |",
    "| I-09 | Inspect 菜单       | popup/network      | 可配置显示                     | MUST_MATCH | DONE     | PARTIAL  | Applied flag 驱动 frame/link/media 菜单；目标按 tab session 保存；按活动 startRoute 求值并显示结果颜色/两行标题；headed Chromium 真实右击链接、键盘选择原生 `Inspect link`，再验证 session 状态、`#` 徽章和标题 | 补完整 locale 与 Firefox 人工巡查 |",
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    "- **明确 MISSING**：在线恢复、单 Profile 导出；请求诊断已恢复有界会话实现；Inspect 已恢复结果颜色与两行标题，但原生浏览器右键菜单 E2E 仍缺；Virtual 已实现但浏览器创建 E2E 仍不完整。",
    "- **明确 MISSING**：在线恢复、单 Profile 导出；请求诊断已恢复有界会话实现；Inspect 原生菜单、结果颜色与两行标题已有自动验收；Virtual 已实现但浏览器创建 E2E 仍不完整。",
)

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
integration_run = os.environ.get('INTEGRATION_RUN_ID', 'pending')
status = status.replace(
    "**Current product implementation head:** `7e394cf23b6e0035fc58a2a55592c5d22e737367`  ",
    "**Current product implementation head:** native Inspect E2E product commit containing this document  ",
)
status = status.replace(
    "**Latest integration verification:** run `30294936789` validates Inspect result-route badge/title evaluation with full `pnpm verify`, Chromium/Firefox builds, and the complete Chromium regression suite  ",
    f"**Latest integration verification:** run `{integration_run}` validates the real headed Chromium Inspect context-menu path with full `pnpm verify`, complete Chromium regression, and native-menu session/badge/title assertions  ",
)
status = status.replace(
    "- Inspect result-presentation integration: run `30294936789`, product commit `7e394cf23b6e0035fc58a2a55592c5d22e737367`.\n",
    f"- Inspect result-presentation integration: run `30294936789`, product commit `7e394cf23b6e0035fc58a2a55592c5d22e737367`.\n- Native Inspect context-menu E2E integration: run `{integration_run}`; product commit containing this document.\n",
)
status = status.replace(
    "- a real native browser context-menu interaction E2E for Inspect,\n",
    "",
)
status = status.replace(
    "Add a real native Chromium context-menu interaction E2E for Inspect, then continue the remaining profile/export/localization blockers.",
    "Implement full Options `.bak` export and a real original v3.5.0 export → reset → import semantic round trip, then continue the remaining profile/PAC/localization blockers.",
)
status = status.replace(
    "The latest product slices passed architecture guards, permanent UI compatibility guards, all 124 parity-document rows, ESLint, Prettier, workspace type checks, 388 unit/integration tests, component rendering, manifest and MV3 CSP inspection, Chromium/Firefox builds and packaging, and the complete Chromium regression suite.",
    "The latest product slices passed architecture guards, permanent UI compatibility guards, all 124 parity-document rows, ESLint, Prettier, workspace type checks, unit/integration tests, component rendering, manifest and MV3 CSP inspection, Chromium/Firefox builds and packaging, the complete Chromium regression suite, and a real headed Chromium native Inspect menu path.",
)
status_path.write_text(status)
