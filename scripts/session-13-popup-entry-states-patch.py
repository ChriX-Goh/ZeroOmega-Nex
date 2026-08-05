from pathlib import Path
import json
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if text.count(old) != 1:
        raise SystemExit(f"{label} marker mismatch: {text.count(old)}")
    return text.replace(old, new, 1)


app_path = Path("apps/extension/src/entrypoints/popup/App.svelte")
app = app_path.read_text(encoding="utf-8")

app = replace_once(
    app,
    "    externalProfileName = '';\n    externalProfileNameError = '';\n    externalProfileFormOpen = true;",
    "    externalProfileName = proxyOwnership?.externalProfile?.suggestedName ?? '';\n    externalProfileNameError = '';\n    externalProfileFormOpen = true;",
    "openExternalProfileForm",
)

app, removed_close = re.subn(
    r"\n  function closeExternalProfileForm\(\): void \{\n.*?\n  \}\n",
    "\n",
    app,
    count=1,
    flags=re.DOTALL,
)
if removed_close != 1:
    raise SystemExit("closeExternalProfileForm marker mismatch")

external_start = '\n      {#if proxyOwnership?.externalProfile}\n        <div class="profile-divider" role="separator"></div>\n'
parent_end = "\n      {/if}\n    {/if}\n  </section>"
start = app.find(external_start)
if start < 0:
    raise SystemExit("external profile block start missing")
end = app.find(parent_end, start)
if end < 0:
    raise SystemExit("external profile block end missing")
end += len("\n      {/if}")
app = app[:start] + app[end:]

external_block = '''        {#if index === 2 && proxyOwnership?.externalProfile}
          <div class="external-profile-row" data-popup-external-profile>
            {#if externalProfileFormOpen}
              <form
                class="external-profile-form"
                data-popup-external-profile-form
                onsubmit={(event) => {
                  event.preventDefault();
                  void importExternalProfile();
                }}
              >
                <OriginalPopupIcon
                  kind={proxyOwnership.externalProfile.kind}
                  color={proxyOwnership.externalProfile.kind === 'fixed' ? '#64b5f6' : '#ffb74d'}
                />
                <input
                  aria-label={uiText('popup.externalNameAria', locale)}
                  bind:value={externalProfileName}
                  placeholder={uiText('popup.profileName', locale)}
                  disabled={importingExternalProfile}
                  oninput={() => (externalProfileNameError = '')}
                  onblur={() => void importExternalProfile()}
                />
                {#if externalProfileNameError}
                  <p class="external-profile-error" role="alert">{externalProfileNameError}</p>
                {/if}
              </form>
            {:else}
              <button
                type="button"
                class="external-profile-button"
                disabled={switching || importingExternalProfile}
                onclick={openExternalProfileForm}
              >
                <OriginalPopupIcon
                  kind={proxyOwnership.externalProfile.kind}
                  color={proxyOwnership.externalProfile.kind === 'fixed' ? '#64b5f6' : '#ffb74d'}
                />
                <span>{uiText('popup.externalProfile', locale)}</span>
              </button>
            {/if}
          </div>
        {/if}
'''
loop_marker = '''      {#each items as item, index (item.key)}
        {#if index === 2}<div class="profile-divider" role="separator"></div>{/if}'''
app = replace_once(
    app,
    loop_marker,
    "      {#each items as item, index (item.key)}\n" + external_block + "        {#if index === 2}<div class=\"profile-divider\" role=\"separator\"></div>{/if}",
    "profile loop",
)

footer_pattern = re.compile(r"\n  <footer class=\"popup-footer\">.*?\n  </footer>(?=\n</main>)", re.DOTALL)
footer_match = footer_pattern.search(app)
if not footer_match:
    raise SystemExit("Popup footer marker mismatch")
footer = footer_match.group(0).lstrip("\n")
wrapped_footer = "\n  {#if !loading && !proxyOwnership?.blocked}\n" + "\n".join(
    "  " + line for line in footer.splitlines()
) + "\n  {/if}"
app = app[: footer_match.start()] + wrapped_footer + app[footer_match.end() :]
app_path.write_text(app, encoding="utf-8")

css_path = Path("apps/extension/src/entrypoints/popup/session-13-compat.css")
css = css_path.read_text(encoding="utf-8")
css_marker = "/* Original external profile is a normal row between built-ins and user profiles. */"
if css_marker not in css:
    css += r'''

/* Original external profile is a normal row between built-ins and user profiles. */
.external-profile-row {
  min-height: 40px;
  border: 0;
}

.external-profile-button,
.external-profile-form {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 8px 10px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #333;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 20px;
  text-align: left;
}

.external-profile-form input {
  min-width: 0;
  flex: 1;
  height: 26px;
  padding: 3px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font: inherit;
}

.external-profile-error {
  position: absolute;
  z-index: 2;
  margin: 34px 8px 0 32px;
  padding: 2px 6px;
  border: 1px solid #d9534f;
  border-radius: 3px;
  background: #fff;
  color: #a94442;
  font-size: 12px;
}

.proxy-not-controllable {
  min-width: 360px;
  margin: 10px;
  color: #333;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 20px;
}

.proxy-control-message {
  margin: 0 0 10px;
  font-weight: 700;
}

.proxy-control-details {
  margin: 0 0 15px;
}

.proxy-control-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.proxy-control-actions button {
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font: inherit;
}

.proxy-control-actions button.primary {
  border-color: #2e6da4;
  background: #337ab7;
  color: #fff;
}
'''
css_path.write_text(css, encoding="utf-8")

Path("scripts/validate-popup-entry-contract.mjs").write_text(
    r'''import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile('apps/extension/src/entrypoints/popup/App.svelte', 'utf8');
const css = await readFile('apps/extension/src/entrypoints/popup/session-13-compat.css', 'utf8');
const externalIndex = app.indexOf('data-popup-external-profile');
const dividerIndex = app.indexOf('{#if index === 2}<div class="profile-divider"');
assert.ok(externalIndex >= 0 && externalIndex < dividerIndex, 'external row must precede user divider');
assert.ok(app.includes("externalProfileName = proxyOwnership?.externalProfile?.suggestedName ?? ''"));
assert.ok(app.includes('onblur={() => void importExternalProfile()}'));
assert.ok(!app.includes('class="external-profile-actions"'));
assert.match(app, /\{#if !loading && !proxyOwnership\?\.blocked\}[\s\S]*?<footer class="popup-footer">/u);
assert.ok(css.includes('.proxy-not-controllable'));
assert.ok(css.includes('.external-profile-form input'));
console.log('Popup entry-state source contract passed.');
''',
    encoding="utf-8",
)

package_path = Path("package.json")
package = json.loads(package_path.read_text(encoding="utf-8"))
extra_validator = "node scripts/validate-popup-entry-contract.mjs"
if extra_validator not in package["scripts"]["validate:ui"]:
    package["scripts"]["validate:ui"] += f" && {extra_validator}"
package["scripts"]["test:e2e:chromium-popup-external-profile"] = (
    "node scripts/e2e-chromium-popup-external-profile.mjs"
)
package_path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")

Path("scripts/e2e-chromium-popup-external-profile.mjs").write_text(
    r'''import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-popup-external-profile-'));
let context;

async function waitForValue(read, accept, message, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  let actual;
  while (Date.now() < deadline) {
    actual = await read();
    if (accept(actual)) return actual;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(`${message}: ${JSON.stringify(actual)}`);
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'en-US',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.waitForLoadState('domcontentloaded');
  await options.evaluate(async () => {
    await chrome.proxy.settings.set({
      scope: 'regular',
      value: {
        mode: 'fixed_servers',
        rules: {
          singleProxy: { scheme: 'http', host: '127.0.0.1', port: 18188 },
          bypassList: ['<local>'],
        },
      },
    });
  });

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const row = popup.locator('[data-popup-external-profile]');
  await row.waitFor({ state: 'visible' });
  const order = await popup.locator('.profile-list').evaluate((list) => {
    const children = [...list.children];
    return {
      external: children.findIndex((child) => child.hasAttribute('data-popup-external-profile')),
      divider: children.findIndex((child) => child.classList.contains('profile-divider')),
    };
  });
  assert.ok(order.external >= 0 && order.external < order.divider, 'external row ordering differs');
  await row.locator('.external-profile-button').click();
  const form = popup.locator('[data-popup-external-profile-form]');
  await form.waitFor({ state: 'visible' });
  assert.equal(await form.locator('button').count(), 0, 'external form exposes Nex-only actions');
  const input = form.locator('input');
  await input.fill('Imported Browser Proxy');
  const closePromise = popup.waitForEvent('close');
  await input.blur();
  await closePromise;

  await waitForValue(
    async () => options.evaluate(async () => {
      const response = await chrome.runtime.sendMessage({
        channel: 'zeroomega-nex/profile-workflow/v1',
        action: 'get',
      });
      return response?.state?.applied?.profiles?.some(
        (profile) => profile.name === 'Imported Browser Proxy' && profile.kind === 'fixed',
      );
    }),
    (value) => value === true,
    'external profile was not imported on blur',
  );
  console.log(`Chromium Popup external-profile E2E passed for ${extensionId}.`);
} finally {
  await context?.close();
  await rm(userDataDir, { recursive: true, force: true });
}
''',
    encoding="utf-8",
)

chromium_path = Path("scripts/e2e-chromium-external-control-toolbar.mjs")
chromium = chromium_path.read_text(encoding="utf-8")
takeover_marker = "    'Chromium takeover Action did not switch to original Direct warning state',\n  );"
popup_assertion = r'''

  const blockedPopup = await context.newPage();
  await blockedPopup.goto(`chrome-extension://${extensionId}/popup.html?activeTabId=${tabId}`);
  const blockedPanel = blockedPopup.locator('[data-popup-proxy-not-controllable]');
  await blockedPanel.waitFor({ state: 'visible' });
  assert.equal(await blockedPanel.getAttribute('data-reason'), 'app');
  assert.equal(await blockedPopup.locator('.profile-row').count(), 0);
  assert.equal(await blockedPopup.locator('.popup-footer').count(), 0);
  assert.equal(await blockedPanel.locator('.proxy-control-actions button').count(), 2);
  assert.equal(await blockedPanel.locator('[data-popup-manage-extensions]').count(), 1);
  await blockedPopup.close();
'''
if "const blockedPopup = await context.newPage();" not in chromium:
    chromium = replace_once(
        chromium,
        takeover_marker,
        takeover_marker + popup_assertion,
        "Chromium takeover assertion",
    )
chromium_path.write_text(chromium, encoding="utf-8")

workflow_path = Path(".github/workflows/browser-e2e.yml")
workflow = workflow_path.read_text(encoding="utf-8")
step_marker = "      - name: Run Chromium external-control Toolbar E2E\n        run: pnpm test:e2e:chromium-external-control-toolbar\n"
step_add = "\n      - name: Run Chromium Popup external-profile E2E\n        run: pnpm test:e2e:chromium-popup-external-profile\n"
if "Run Chromium Popup external-profile E2E" not in workflow:
    workflow = replace_once(workflow, step_marker, step_marker + step_add, "Browser E2E step")
workflow_path.write_text(workflow, encoding="utf-8")

Path("docs/AUDIT_EVIDENCE_02R_POPUP_OWNERSHIP_EXTERNAL.md").write_text(
    """# Audit Evidence 02R — Popup Ownership and External Profile

## Scope

This slice covers two reproducible original-facing Popup entry states:

1. proxy control taken by another extension (`app`);
2. a Chromium proxy configuration owned by this extension but not represented by the active Nex profile (`external profile`).

The policy/browser-owned `not-controllable` state remains open because CI cannot truthfully create browser policy ownership. Source mapping exists, but it is not counted as browser evidence.

## Original contract

Pinned ZeroOmega v3.5.0 source and the official Chromium build establish that a blocked Popup hides the profile menu and Options row, shows reason/details, and exposes only Cancel and Manage. An external profile is a normal row after built-ins and before user profiles; clicking it replaces the row label with one naming input. Enter or blur saves it. No separate Cancel/Save action row appears.

## Permanent gates

- Chromium external-control Toolbar E2E opens the Popup during a real competing-extension takeover and asserts the blocked surface.
- Chromium Popup external-profile E2E writes an external fixed proxy through Nex's own browser API, verifies row order and form structure, then verifies blur-to-import.
- `validate-popup-entry-contract.mjs` permanently guards source structure.

## State

- `app` ownership surface: pending exact-Head verification.
- external-profile surface: pending exact-Head verification.
- policy/browser-owned surface: OPEN.
- project progress remains 48%; Order 1 remains 45%.
- owner retest, merge, and release remain prohibited.
""",
    encoding="utf-8",
)

session_path = Path("docs/SESSION_13_KNOWLEDGE_GRAPH.md")
session = session_path.read_text(encoding="utf-8")nsession = session.replace(
    "      ├─ ownership-blocked state              still open\n      ├─ external-profile state               still open\n      └─ browser-owned state                  still open",
    "      ├─ ownership-blocked/app state          active 02R slice\n      ├─ external-profile state               active 02R slice\n      └─ browser-owned/policy state           still open",
    1,
)
if "## 02R execution boundary" not in session:
    session += """

## 02R execution boundary

- Real competing-extension takeover is the acceptance fixture for `reason=app`.
- A proxy value written through Nex while no represented route matches is the acceptance fixture for external profile.
- `reason=policy` / browser-owned remains OPEN; unit source mapping is not promoted to product evidence.
- Passing 02R will not increase project or Order 1 progress by itself.
"""
session_path.write_text(session, encoding="utf-8")

original_path = Path("docs/ORIGINAL_KNOWLEDGE_GRAPH.md")
original = original_path.read_text(encoding="utf-8")
original_section = """### 14.3 Popup 所有权阻塞与外部配置

固定依据：原版 `popup.jade`、`popup/js/proxy_not_controllable.js`、profile controller 和官方 v3.5.0 Chromium 运行时。其他扩展接管时，Popup 隐藏 profile menu 与 Options，只显示原因、详情、Cancel 和 Manage。外部配置作为 built-in 后、用户 profile 前的一行；点击后同一行出现命名 input，submit 或 blur 保存，不出现独立 Cancel/Save 行。

Nex 以真实 competing-extension takeover E2E 验证 `app` 状态，以本扩展写入但未被 represented route 接纳的 Chromium proxy value 验证 external-profile。`not-controllable` policy/browser-owned 状态保持 OPEN，直到可重复浏览器策略证据存在。

"""
marker = "## 15. 原版默认值、示例与 placeholder 规则\n"
if "### 14.3 Popup 所有权阻塞与外部配置" not in original:
    original = replace_once(original, marker, original_section + marker, "Original KG section")
original_path.write_text(original, encoding="utf-8")

matrix_path = Path("docs/UI_AUDIT_MATRIX.md")
matrix = matrix_path.read_text(encoding="utf-8")
match = re.search(r"^\| I-11 \|.*$", matrix, flags=re.MULTILINE)
if not match:
    raise SystemExit("UI_AUDIT_MATRIX I-11 row missing")
line = match.group(0)
phrase = "02R 真实接管与外部配置 E2E 已接入；policy/browser-owned 保持 OPEN"
if phrase not in line:
    parts = line.split("|")
    if len(parts) < 5:
        raise SystemExit("UI_AUDIT_MATRIX I-11 row shape mismatch")
    parts[-3] = parts[-3].rstrip() + f"；{phrase} "
    line = "|".join(parts)
    matrix = matrix[: match.start()] + line + matrix[match.end() :]
matrix_path.write_text(matrix, encoding="utf-8")
