from pathlib import Path


CHECKPOINT = """### Exact verified checkpoint — 2026-07-31

Clean Head `dbb237ffd0c65358fbe9bd483ae85bc9538f6976` passed all permanent gates:

- CI run `30632153986`;
- Browser E2E run `30632154001`;
- Parity Documentation run `30632154009`;
- Milestone 8 Visual Evidence run `30632153953`.

The permanent Chromium browser job now executes a separate real Action acceptance script after the existing full extension journey. It reads `chrome.action.getTitle`, `getBadgeText` and `getPopup` for two real web tabs and verifies System → Direct → Fixed proxy / Fixed bypass transitions, localized titles from the runtime extension locale, four-code-unit Badge text and per-tab Popup state. Firefox and native Chromium Inspect also passed in the same Browser E2E run.
"""


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_between(text: str, start: str, end: str, replacement: str, label: str) -> str:
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{label}: start marker missing")
    end_index = text.find(end, start_index + len(start))
    if end_index < 0:
        raise SystemExit(f"{label}: end marker missing")
    return text[:start_index] + replacement.rstrip() + "\n\n" + text[end_index:]


def replace_table_row(text: str, row_id: str, replacement: str) -> str:
    lines = text.splitlines()
    matches = [index for index, line in enumerate(lines) if line.startswith(f"| `{row_id}`")]
    if len(matches) != 1:
        raise SystemExit(f"{row_id}: expected one table row, found {len(matches)}")
    lines[matches[0]] = replacement
    return "\n".join(lines) + ("\n" if text.endswith("\n") else "")


order_path = Path("docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md")
order = order_path.read_text(encoding="utf-8")
old_summary_start = "The current Nex branch now has the source-derived pure models"
old_summary_end = "No candidate may be generated from this order"
summary_start = order.find(old_summary_start)
summary_end = order.find(old_summary_end, summary_start)
if summary_start < 0 or summary_end < 0:
    raise SystemExit("toolbar current summary markers missing")
new_summary = """The current Nex branch now registers one background owner for all real browser Action writes. The owner composes the repository-backed resolver, race-safe per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Background startup proactively initializes a clean installation to the original System route, restores existing state without duplicate activation and refreshes all tabs after successful activation or recovery. Resolver coverage is verified for Direct, System, Fixed proxy and Fixed bypass results; Inspect no longer competes as a second title/Badge writer.

""" + CHECKPOINT + "\n"
order = order[:summary_start] + new_summary + order[summary_end:]

current_graph = """## 4. Current Nex graph

```mermaid
graph TD
  M[Target manifest / locale / exact static assets] --> B[Registered Nex background]
  API[Real browser Action / i18n / tabs / OffscreenCanvas] --> EXEC[Verified Action executor]
  PURE[Pure original toolbar models] --> EXEC
  WF[Profile workflow] --> NOTICE[Successful activation / startup notification]
  NOTICE --> COORD[Race-safe per-tab coordinator]
  RES[Repository resolver: Direct / System / Fixed proxy / Fixed bypass] --> COORD
  INSPECT[Inspect runtime] --> OVERLAY[Single-writer Inspect overlay]
  OVERLAY --> EXEC
  COORD --> EXEC
  EXEC --> ACTION[Real per-tab browser Action]
  ACTION --> CHROME[Permanent Chromium two-tab Action E2E]
  TEMP[Temporary rules] -. trace adapter open .-> COORD
  OWN[Ownership / external control] -. transition adapter open .-> COORD
  INCLUSIVE[Switch / PAC / Virtual / attached Rule List] -. full trace open .-> COORD
```

Confirmed remaining gaps:

- Switch, PAC, Virtual, attached Rule List, temporary-rule and external-control states still need the complete original `matchProfile.results` display trace;
- Chromium now has direct per-tab Action acceptance for System, Direct, Fixed proxy, Fixed bypass and optional four-code-unit Badge; equivalent direct Firefox Action API acceptance remains open;
- exact headed toolbar pixels and forced dynamic-draw fallback remain open where source/unit evidence is insufficient;
- complete owner-facing Order 1 acceptance remains `NOT RUN`, so no row is owner-complete.
"""
order = replace_between(
    order,
    "## 4. Current Nex graph",
    "## 5. Original ↔ Nex state matrix",
    current_graph,
    "toolbar current graph",
)

rows = {
    "TB-001": "| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | exact target assets/title/Popup/shortcut/permissions are active; clean startup reaches System and Chromium reads the real per-tab title/Badge/Popup | `PARTIAL` | add explicit internal-page and Firefox Action acceptance, then owner review |",
    "TB-002": "| `TB-002` | Toolbar click opens target-specific original Popup; shortcut exists   | packages, Chromium/Firefox runtime | target Popup contracts are active; Chromium `getPopup()` is verified across System, Direct and Fixed states                               | `PARTIAL` | verify click/shortcut and direct Action state in Firefox              |",
    "TB-003": "| `TB-003` | Direct/System/Fixed static profile uses one color                     | source; Direct/System runtime      | one background owner applies Direct/System/Fixed states; Chromium verifies real titles, Badge and Popup for all three routes             | `PARTIAL` | verify exact visible icon pixels and Firefox user-Fixed state         |",
    "TB-005": "| `TB-005` | Current tab result equals current static profile: one-color result    | source                             | Chromium real Action acceptance verifies a Fixed proxy result on one tab while another tab resolves through Fixed bypass                 | `PARTIAL` | add direct Firefox Action acceptance and owner review                 |",
    "TB-007": "| `TB-007` | Direct result receives Direct color                                   | source; Direct runtime title       | Direct is activated through the real workflow and reflected across two Chromium tabs; renderer/color contract remains source/unit-backed | `PARTIAL` | capture visible icon pixels or another browser-readable equivalent    |",
    "TB-011": "| `TB-011` | Optional localized result-profile Badge, max four code units          | source                             | Chromium Fixed acceptance enables the preference and reads Badge `Tool` for `Toolbar Proxy` on both result-different tabs                | `PARTIAL` | verify imported preference and Firefox Badge behavior                 |",
    "TB-012": "| `TB-012` | Inspect sets tab-specific `#`, result color and Inspect title         | source                             | Inspect feeds a single-writer overlay; native Chromium menu E2E and overlay lifecycle tests pass                                          | `PARTIAL` | add direct real Action set/clear/isolation capture                    |",
    "TB-014": "| `TB-014` | Internal/unsupported URL clears result and uses default state         | source; basic runtime capture      | coordinator owns fallback/default clearing; Built-in route handling is registered                                                        | `PARTIAL` | add explicit Nex internal-page Action assertions in both targets      |",
    "TB-015": "| `TB-015` | Tab URL update recalculates result                                    | source                             | registered coordinator listens to URL updates; real result-different same-tab navigation remains unasserted                              | `PARTIAL` | navigate one tab across proxy/bypass URLs and read Action transitions |",
    "TB-016": "| `TB-016` | Tab activation restores each tab’s own state                          | source; basic two-tab runtime      | Chromium Action E2E verifies simultaneous Fixed proxy and Fixed bypass state on two tab IDs                                               | `PARTIAL` | repeat direct per-tab acceptance in Firefox and owner review          |",
    "TB-017": "| `TB-017` | Profile change invalidates cache and resets tabs                      | source                             | System → Direct → Fixed activation refreshes both Chromium tabs through the real successful-activation callback                         | `PARTIAL` | cover import/temp-rule/external-control refresh inputs                |",
    "TB-018": "| `TB-018` | Dynamic drawing failure uses static fallback                          | source                             | exact renderer is connected to the real executor and fallback behavior is unit-tested                                                     | `PARTIAL` | force a real browser draw failure and confirm original static fallback |",
}
for row_id, row in rows.items():
    order = replace_table_row(order, row_id, row)

order = replace_between(
    order,
    "### `TO-04` — browser Action adapter",
    "### `TO-05` — per-tab coordinator",
    """### `TO-04` — browser Action adapter

Status: `PARTIAL`, registered real browser owner with Chromium Action acceptance.

Implemented and verified:

- one browser-API boundary for icon, title, Badge/background and Popup;
- exact original localization, renderer, static fallback and manifest contract;
- one registered background executor as the sole real Action writer;
- Inspect requests are intercepted as overlays and reapplied by the same executor;
- permanent Chromium E2E reads real per-tab title, Badge and Popup for System, Direct, Fixed proxy and Fixed bypass.

Remaining:

- direct equivalent Action API acceptance in Firefox;
- headed icon pixels and forced dynamic-render fallback evidence;
- Switch/PAC/Virtual/Rule List/temp-rule/external-control states.
""",
    "TO-04",
)
order = replace_between(
    order,
    "### `TO-05` — per-tab coordinator",
    "### `TO-06` — workflow/runtime integration",
    """### `TO-05` — per-tab coordinator

Status: `PARTIAL`, registered and real-browser verified for the source-certain slice.

Implemented and verified:

- URL-update and tab-activation listeners, per-tab queues and stale-result suppression;
- all-tab refresh with icon-cache invalidation;
- repository-backed Direct, System, Fixed proxy and Fixed bypass resolution;
- per-tab Fixed proxy/bypass isolation in permanent Chromium Action E2E;
- default fallback and resolver/Action error reporting.

Remaining:

- complete original multiline trace for Switch, PAC, Virtual, attached Rule List and temporary rules;
- external-control transition input;
- explicit same-tab URL transition and direct Firefox per-tab Action acceptance.
""",
    "TO-05",
)
order = replace_between(
    order,
    "### `TO-06` — workflow/runtime integration",
    "### `TO-07`",
    """### `TO-06` — workflow/runtime integration

Status: `PARTIAL`, real background integration complete for startup, activation and Inspect.

Implemented and verified:

- clean installations proactively initialize to the original System route without opening Popup or Options;
- concurrent initialization is deduplicated and existing state follows restore/recovery without duplicate activation;
- successful activation and startup recovery refresh all toolbar tabs;
- Inspect is a coordinator overlay rather than a competing Action writer;
- cross-document revision archives are isolated before current-document validation, preventing background initialization from breaking history reads.

Remaining inputs include temporary-rule transitions, ownership/external control, inclusive-profile trace display and equivalent direct Firefox Action acceptance.
""",
    "TO-06",
)
order_path.write_text(order, encoding="utf-8")


delivery_path = Path("docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md")
delivery = delivery_path.read_text(encoding="utf-8")
delivery = replace_once(
    delivery,
    "- Provisional total progress: **46%** with a **42%–50% confidence band**, calculated by `docs/PROJECT_PROGRESS_MODEL.md`.",
    "- Provisional total progress: **47%** with a **42%–50% confidence band**, calculated by `docs/PROJECT_PROGRESS_MODEL.md`.",
    "delivery progress",
)
marker = "## 3. Status vocabulary"
if CHECKPOINT not in delivery:
    delivery = replace_once(delivery, marker, CHECKPOINT + "\n\n" + marker, "delivery checkpoint")
delivery = replace_table_row(
    delivery,
    "KG-ICON-001",
    "| `KG-ICON-001`      | Browser toolbar           | Icon, title and visible toolbar state follow the current profile/runtime situation.    | One background owner now drives real per-tab System, Direct, Fixed proxy/bypass and Inspect-overlay state; Switch/PAC/Virtual/Rule List/temp/external traces and owner acceptance remain open. | `FAILED` | Complete remaining original states, direct Firefox Action acceptance and owner review. |",
)
delivery_path.write_text(delivery, encoding="utf-8")


original_path = Path("docs/ORIGINAL_KNOWLEDGE_GRAPH.md")
original = original_path.read_text(encoding="utf-8")
section_heading = "## Session 8 — 工具栏真实运行时检查点（2026-07-31）"
if section_heading not in original:
    original += """

## Session 8 — 工具栏真实运行时检查点（2026-07-31）

- clean Head：`dbb237ffd0c65358fbe9bd483ae85bc9538f6976`。
- 永久门禁：CI `30632153986`、Browser E2E `30632154001`、Parity `30632154009`、Visual `30632153953` 全绿。
- 后台已注册唯一 Action 写入者；`browser.action`、`browser.i18n`、`browser.tabs`、OffscreenCanvas、resolver、coordinator 与 Inspect overlay 已组成真实运行链。
- 新安装无需打开 UI，后台会主动初始化到原版 System；已有状态走恢复链，初始化并发去重。
- Direct / System / Fixed proxy / Fixed bypass 已由 repository resolver 生成原版标题、Badge 与 Popup 状态。
- 永久 Chromium Action E2E 直接读取两个真实标签页的 `getTitle/getBadgeText/getPopup`，验证 System → Direct → Fixed proxy / Fixed bypass，以及 `Toolbar Proxy` 截断为四字符 Badge `Tool`。
- Inspect 不再直接竞争写 Action；它只维护 overlay，由同一 executor 写入。
- 跨 document revision 历史先按当前 `documentId` 隔离，防止旧导入文档历史破坏新安装／当前文档历史读取。
- 仍未闭合：Switch、PAC、Virtual、附属 Rule List、临时规则、外部控制完整 trace；Firefox 直接 Action API 验收；headed 图标像素；Owner PASS。
- 总进度仍为 47%，Order 1 仍为 35%；新增自动化证据不等于 Owner 完成度。
"""
original_path.write_text(original, encoding="utf-8")
