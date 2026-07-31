from pathlib import Path


HEAD = "f782f802a78ace277de938bdd4dfed2bf6315951"
CHECKPOINT = f"""Clean Head `{HEAD}` passed all permanent gates after the top-level navigation refresh fix and temporary-file cleanup:

- CI `30660824011`;
- Browser E2E `30660824007`;
- Parity Documentation `30660824047`;
- Milestone 8 Visual Evidence `30660823998`.

The permanent Browser E2E run passed Chromium Action, Firefox Action and native Chromium Inspect acceptance. Its Firefox job ran Firefox `152.0.6` and proved that newly opened tabs receive System, Direct and Fixed proxy / Fixed bypass Action state instead of remaining at the manifest loading title. Firefox diagnostics Artifact `8805083911` has digest `sha256:198cc198a90a39a1def2d93d416f6f0c3b66a0f90c70eff6f7ea633d069dc2b9`.
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


def update(path_name: str, transform) -> None:
    path = Path(path_name)
    original = path.read_text(encoding="utf-8")
    updated = transform(original)
    if updated == original:
        raise SystemExit(f"{path_name}: no changes produced")
    path.write_text(updated, encoding="utf-8")


def active_transform(text: str) -> str:
    text = replace_once(
        text,
        "- Current implementation registers one background owner for real browser Action writes and composes the repository resolver, per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Startup proactively initializes clean installations to the original System route and refreshes all tabs after activation or recovery.",
        "- Current implementation registers one background owner for real browser Action writes and composes the repository resolver, per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Startup proactively initializes clean installations to the original System route and refreshes all tabs after activation or recovery. Top-level `webNavigation.onCommitted` supplies the final navigation URL when Firefox tab events expose only `about:blank` or omit a useful URL.",
        "active current implementation",
    )
    text = replace_once(
        text,
        "|     1 | Installation / startup / toolbar                         | `DELIVERY_ORDER_01_TOOLBAR_STATE.md` | Original source/package/runtime evidence plus permanent Nex Chromium and Firefox Action E2E | Background single-writer runtime, original System startup, Direct/System/Fixed resolver, new-tab refresh, Inspect overlay and real two-tab Action state are verified in both targets; Switch/PAC/Virtual/Rule List/temp/external traces and owner PASS remain open | Complete the remaining original trace inputs and explicit internal/same-tab/Inspect assertions, then run focused owner acceptance    |",
        "|     1 | Installation / startup / toolbar                         | `DELIVERY_ORDER_01_TOOLBAR_STATE.md` | Original source/package/runtime evidence plus permanent Nex Chromium and Firefox Action E2E | Background single-writer runtime, original System startup, Direct/System/Fixed resolver, top-level navigation refresh, Inspect overlay and real two-tab Action state are verified in both targets; Switch/PAC/Virtual/Rule List/temp/external traces and owner PASS remain open | Complete the remaining original trace inputs and explicit internal/same-tab/Inspect assertions, then run focused owner acceptance |",
        "active order row",
    )
    text = replace_once(
        text,
        "- the background constructs the real Action/i18n/tabs/OffscreenCanvas boundary and registers one Action writer;",
        "- the background constructs the real Action/i18n/tabs/webNavigation/OffscreenCanvas boundary and registers one Action writer;",
        "active browser boundary",
    )
    text = replace_once(
        text,
        "- the race-safe coordinator owns tab creation, URL updates, Firefox completion events, activation, all-tab refresh, stale-result suppression and cache invalidation;",
        "- the race-safe coordinator owns tab creation, URL updates, activation, all-tab refresh, stale-result suppression and cache invalidation; top-level `webNavigation.onCommitted` supplies the committed URL when Firefox tab events are incomplete;",
        "active coordinator boundary",
    )
    text = replace_once(
        text,
        "- race-safe per-tab coordinator with creation/update/activation coverage and background runtime manager;",
        "- race-safe per-tab coordinator with creation/update/activation coverage, top-level navigation-commit refresh and background runtime manager;",
        "active source coordinator",
    )
    text = replace_once(
        text,
        "- target-specific manifest Action contract and isolated browser Action adapter;",
        "- target-specific manifest Action contract, exact required `webNavigation` permission guard and isolated browser Action adapter;",
        "active manifest source",
    )
    return replace_between(
        text,
        "### Last fully green engineering slice",
        "### Evidence correction and official packages",
        "### Last fully green engineering slice\n\n" + CHECKPOINT + "\nThe listener only requests a coordinator refresh for top-level commits; it never writes Action state directly. The exact manifest audit requires `webNavigation` in both targets and still forbids global host access.\n\nThe checkpoint remains slice-level evidence. Progress stays 47%, Order 1 stays 35%, and no candidate is authorized.",
        "active checkpoint",
    )


update("docs/ACTIVE_PARITY_AUDIT_INDEX.md", active_transform)


def status_transform(text: str) -> str:
    text = replace_once(
        text,
        "- real `browser.action`, `browser.i18n`, `browser.tabs` and OffscreenCanvas boundaries are constructed in the background;",
        "- real `browser.action`, `browser.i18n`, `browser.tabs`, top-level `browser.webNavigation` and OffscreenCanvas boundaries are constructed in the background;",
        "status browser boundary",
    )
    text = replace_once(
        text,
        "- the per-tab coordinator handles tab creation, URL updates, Firefox completion events, activation, serialization, stale-result suppression, lifecycle invalidation, cache invalidation and all-tab refresh;",
        "- the per-tab coordinator handles tab creation, URL updates, activation, serialization, stale-result suppression, lifecycle invalidation, cache invalidation and all-tab refresh; a top-level navigation-commit listener supplies final URLs when Firefox tab events are incomplete;",
        "status coordinator",
    )
    text = replace_between(
        text,
        "### Exact verified checkpoint",
        "Still open:",
        "### Exact verified checkpoint\n\n" + CHECKPOINT + "\nThe `webNavigation` listener is a refresh input to the existing coordinator, not a second Action writer. Both built manifests require the permission through the exact manifest guard and retain no required global host access.",
        "status checkpoint",
    )
    text = replace_once(
        text,
        "Permanent Nex Firefox E2E uses WebDriver BiDi for extension-page navigation and directly verifies Action title/Badge/Popup on Firefox 153.0. The coordinator handles `tabs.onCreated` and completed updates whose URL is available only on the tab object, preventing new Firefox tabs from remaining at the manifest loading title. Historical original-package evidence remains fixed to Firefox 152.0.6; rerunning that separate original audit still requires the same BiDi migration or a pinned runtime.",
        "Permanent Nex Firefox E2E uses WebDriver BiDi for extension-page navigation and directly verifies Action title/Badge/Popup. It has passed on runner Firefox 153.0 and, at the current clean checkpoint, Firefox 152.0.6. Firefox 152.0.6 exposed that a WebDriver-created tab can begin at `about:blank` without a useful follow-up tab URL event; top-level `webNavigation.onCommitted` now supplies the final URL and wakes the background while preserving the single Action writer. Historical original-package evidence remains fixed to its separate Firefox 152.0.6 audit.",
        "status Firefox boundary",
    )
    return text


update("docs/MILESTONE_8_STATUS.md", status_transform)


def verification_transform(text: str) -> str:
    text = replace_between(
        text,
        "Clean Head `c37f56e818bb73806f2a42a70dc941d5e5d76e9a`",
        "This is an exact engineering and evidence checkpoint, not a release-completeness Head.",
        CHECKPOINT + "\nThe top-level navigation listener only calls the existing coordinator and is protected by the exact manifest permission audit.\n\nThis is an exact engineering and evidence checkpoint, not a release-completeness Head.",
        "verification checkpoint",
    )
    text = replace_once(
        text,
        "The background now registers one real browser Action writer composed from the repository resolver, per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Clean installation initializes to System, existing state follows restore/recovery, and successful activation refreshes all tabs.",
        "The background now registers one real browser Action writer composed from the repository resolver, per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Clean installation initializes to System, existing state follows restore/recovery, successful activation refreshes all tabs, and top-level navigation commits provide final URLs without creating another writer.",
        "verification integration",
    )
    text = replace_once(
        text,
        "Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy and Fixed bypass per-tab title/Badge/Popup state on two real tabs. The coordinator also refreshes newly created and completed Firefox tabs. Inspect no longer competes as a second title/Badge writer.",
        "Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy and Fixed bypass per-tab title/Badge/Popup state on two real tabs. Firefox 152.0.6 additionally verifies the `about:blank` → committed web navigation path. Inspect no longer competes as a second title/Badge writer.",
        "verification acceptance",
    )
    return text


update("docs/MILESTONE_8_VERIFICATION_HEAD.md", verification_transform)


def delivery_transform(text: str) -> str:
    text = replace_once(
        text,
        "The current Nex branch now registers one background owner for all real browser Action writes. The owner composes the repository-backed resolver, race-safe per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Background startup proactively initializes a clean installation to the original System route, restores existing state without duplicate activation and refreshes all tabs after successful activation or recovery. The coordinator additionally handles tab creation and Firefox completed-navigation events whose URL appears only on the tab object. Resolver coverage is verified for Direct, System, Fixed proxy and Fixed bypass results; Inspect no longer competes as a second title/Badge writer.",
        "The current Nex branch now registers one background owner for all real browser Action writes. The owner composes the repository-backed resolver, race-safe per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Background startup proactively initializes a clean installation to the original System route, restores existing state without duplicate activation and refreshes all tabs after successful activation or recovery. Tab creation/update/activation remain coordinator inputs; top-level `webNavigation.onCommitted` supplies the final URL when Firefox tab events expose only `about:blank` or omit a useful URL. Resolver coverage is verified for Direct, System, Fixed proxy and Fixed bypass results; Inspect no longer competes as a second title/Badge writer.",
        "delivery introduction",
    )
    text = replace_between(
        text,
        "### Exact verified checkpoint — 2026-08-01",
        "No candidate may be generated from this order",
        "### Exact verified checkpoint — 2026-08-01\n\n" + CHECKPOINT + "\nThe navigation listener only feeds the existing coordinator. Required `webNavigation` permission is exact-guarded in both manifests; no global host permission was added.\n\nNo candidate may be generated from this order",
        "delivery checkpoint",
    )
    text = replace_once(
        text,
        "API[Real browser Action / i18n / tabs / OffscreenCanvas] --> EXEC[Verified Action executor]",
        "API[Real browser Action / i18n / tabs / webNavigation / OffscreenCanvas] --> EXEC[Verified Action executor]",
        "delivery graph API",
    )
    text = replace_once(
        text,
        "  NOTICE --> COORD[Race-safe per-tab coordinator]",
        "  NOTICE --> COORD[Race-safe per-tab coordinator]\n  NAV[Top-level webNavigation commits] --> COORD",
        "delivery graph navigation",
    )
    text = replace_once(
        text,
        "| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | exact target assets/title/Popup/shortcut/permissions are active; clean startup reaches System and both targets read real per-tab title/Badge/Popup | `PARTIAL`                                    | add explicit Nex internal-page assertions, then owner review           |",
        "| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | exact target assets/title/Popup/shortcut/permissions are active; clean startup reaches System and both targets read real per-tab title/Badge/Popup; `webNavigation` is exact-guarded | `PARTIAL`                                    | add explicit Nex internal-page assertions, then owner review           |",
        "delivery TB-001",
    )
    text = replace_once(
        text,
        "| `TB-015` | Tab URL update recalculates result                                    | source                             | registered coordinator listens to URL updates; real result-different same-tab navigation remains unasserted                                        | `PARTIAL`                                    | navigate one tab across proxy/bypass URLs and read Action transitions  |",
        "| `TB-015` | Tab URL update recalculates result                                    | source                             | registered coordinator handles tab updates and top-level navigation commits; Firefox 152.0.6 new-tab navigation is verified, while result-different same-tab navigation remains unasserted | `PARTIAL`                                    | navigate one tab across proxy/bypass URLs and read Action transitions  |",
        "delivery TB-015",
    )
    return text


update("docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md", delivery_transform)


def delivery_kg_transform(text: str) -> str:
    return replace_between(
        text,
        "### Exact verified checkpoint — 2026-08-01",
        "## 3. Status vocabulary",
        "### Exact verified checkpoint — 2026-08-01\n\n" + CHECKPOINT + "\nFirefox 152.0.6 proved the top-level `webNavigation.onCommitted` fallback needed when tab events expose only `about:blank` or no useful final URL. The listener feeds the existing coordinator only; the exact manifest guard requires `webNavigation` and still rejects required global host access.\n\nThe checkpoint remains slice-level evidence and does not alter the 47% / 35% progress model.",
        "delivery KG checkpoint",
    )


update("docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md", delivery_kg_transform)


def original_kg_transform(text: str) -> str:
    return replace_between(
        text,
        "## 2.1 当前 Nex 工具栏映射检查点（不反向定义原版）",
        "## 3. 情景模式分类图",
        f"""## 2.1 当前 Nex 工具栏映射检查点（不反向定义原版）

- clean Head：`{HEAD}`；CI `30660824011`、Browser E2E `30660824007`、Parity `30660824047`、Visual `30660823998` 全绿。
- Chromium 与 Firefox 均直接读取每标签页 Action title、Badge、Popup，并通过 System → Direct → Fixed proxy / Fixed bypass 双标签验收；当前 Firefox 永久门禁运行于 `152.0.6`。
- Firefox 152.0.6 暴露：WebDriver 新标签可能先停在 `about:blank`，随后不给 `tabs` 监听器可用的最终 URL，令 Action 保留 manifest loading title。
- Nex 使用顶层 `webNavigation.onCommitted` 取得最终 URL并唤醒后台；该监听器只调用现有 coordinator，不成为第二个 Action writer。
- `webNavigation` 已成为 Chromium/Firefox 精确必需权限并纳入 manifest 守卫；仍无 required host access 或 `<all_urls>`。
- 该兼容修复只保证原版可观察的“已导航标签必须得到当前状态”，不是新增原版概念。
- Switch/PAC/Virtual/Rule List/临时规则/外部控制完整 trace、内部页、同标签 URL 切换、Inspect Action set/clear 和 owner PASS 仍未完成。
- 总进度仍为 47%，Order 1 仍为 35%，不得据此生成候选。

""",
        "original KG checkpoint",
    )


update("docs/ORIGINAL_KNOWLEDGE_GRAPH.md", original_kg_transform)
