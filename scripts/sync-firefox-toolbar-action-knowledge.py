from pathlib import Path


HEAD = "c37f56e818bb73806f2a42a70dc941d5e5d76e9a"
CHECKPOINT = f"""Clean Head `{HEAD}` passed all permanent gates after the Firefox new-tab Action fix and temporary-file cleanup:

- CI `30659255772`;
- Browser E2E `30659255691`;
- Parity Documentation `30659255845`;
- Milestone 8 Visual Evidence `30659255790`.

The permanent Browser E2E run directly verifies per-tab title, Badge and Popup in both Chromium and Firefox for System → Direct → Fixed proxy / Fixed bypass. Firefox additionally proves that newly created tabs and completed navigations receive computed Action state instead of remaining at the manifest loading title. Native Chromium Inspect passed in the same run.
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
    path.write_text(transform(path.read_text(encoding="utf-8")), encoding="utf-8")


def active_transform(text: str) -> str:
    text = replace_once(
        text,
        "- Exact official Chromium and Firefox packages cover the basic original reference states. Nex now has direct Chromium Action acceptance for System, Direct, Fixed proxy, Fixed bypass, two-tab isolation, localized title, four-code-unit Badge and per-tab Popup; advanced traces, direct Firefox Action API acceptance and owner acceptance remain open.",
        "- Exact official Chromium and Firefox packages cover the basic original reference states. Nex now has direct Chromium and Firefox Action acceptance for System, Direct, Fixed proxy, Fixed bypass, two-tab isolation, runtime-localized title and per-tab Popup; Chromium also verifies four-code-unit Badge truncation. Advanced traces and owner acceptance remain open.",
        "active summary",
    )
    text = replace_once(
        text,
        "|     1 | Installation / startup / toolbar                         | `DELIVERY_ORDER_01_TOOLBAR_STATE.md` | Original source/package/runtime evidence plus permanent Nex Chromium Action E2E | Background single-writer runtime, original System startup, Direct/System/Fixed resolver, Inspect overlay and real two-tab Chromium Action state are verified; Switch/PAC/Virtual/Rule List/temp/external traces, direct Firefox Action acceptance and owner PASS remain open | Complete the remaining original trace inputs, add direct Firefox Action acceptance, then run focused owner acceptance                |",
        "|     1 | Installation / startup / toolbar                         | `DELIVERY_ORDER_01_TOOLBAR_STATE.md` | Original source/package/runtime evidence plus permanent Nex Chromium and Firefox Action E2E | Background single-writer runtime, original System startup, Direct/System/Fixed resolver, new-tab refresh, Inspect overlay and real two-tab Action state are verified in both targets; Switch/PAC/Virtual/Rule List/temp/external traces and owner PASS remain open | Complete the remaining original trace inputs and explicit internal/same-tab/Inspect assertions, then run focused owner acceptance |",
        "active row",
    )
    text = replace_once(
        text,
        "- the race-safe coordinator owns tab URL updates, activation, all-tab refresh, stale-result suppression and cache invalidation;",
        "- the race-safe coordinator owns tab creation, URL updates, Firefox completion events, activation, all-tab refresh, stale-result suppression and cache invalidation;",
        "active coordinator",
    )
    text = replace_once(
        text,
        "- permanent Chromium Action E2E reads two tab IDs through `chrome.action.getTitle`, `getBadgeText` and `getPopup` across System → Direct → Fixed transitions;",
        "- permanent Chromium and Firefox Action E2E read two tab IDs through the target Action API across System → Direct → Fixed proxy / Fixed bypass transitions;",
        "active browser evidence",
    )
    text = replace_once(
        text,
        "- direct equivalent Action API acceptance in Firefox remains open;\n",
        "",
        "active Firefox gap",
    )
    text = replace_once(
        text,
        "- race-safe per-tab coordinator and background runtime manager;",
        "- race-safe per-tab coordinator with creation/update/activation coverage and background runtime manager;",
        "active source coordinator",
    )
    text = replace_once(
        text,
        "- permanent Chromium toolbar Action E2E in `scripts/e2e-chromium-toolbar.mjs`;",
        "- permanent Chromium toolbar Action E2E in `scripts/e2e-chromium-toolbar.mjs`;\n- permanent Firefox toolbar Action acceptance integrated into `scripts/e2e-firefox.mjs`;",
        "active source evidence",
    )
    return replace_between(
        text,
        "### Last fully green engineering slice",
        "### Evidence correction and official packages",
        "### Last fully green engineering slice\n\n" + CHECKPOINT + "\nThe checkpoint remains slice-level evidence. Progress stays 47%, Order 1 stays 35%, and no candidate is authorized.",
        "active checkpoint",
    )


update("docs/ACTIVE_PARITY_AUDIT_INDEX.md", active_transform)


def status_transform(text: str) -> str:
    text = replace_once(
        text,
        "- the per-tab coordinator handles URL updates, activation, serialization, stale-result suppression, lifecycle invalidation, cache invalidation and all-tab refresh;",
        "- the per-tab coordinator handles tab creation, URL updates, Firefox completion events, activation, serialization, stale-result suppression, lifecycle invalidation, cache invalidation and all-tab refresh;",
        "status coordinator",
    )
    text = replace_once(
        text,
        "- permanent Chromium Action E2E directly verifies two tab IDs through `getTitle`, `getBadgeText` and `getPopup` across System → Direct → Fixed proxy / Fixed bypass;",
        "- permanent Chromium and Firefox Action E2E directly verify two tab IDs through the target Action API across System → Direct → Fixed proxy / Fixed bypass;",
        "status evidence",
    )
    text = replace_between(
        text,
        "### Exact verified checkpoint",
        "Still open:",
        "### Exact verified checkpoint\n\n" + CHECKPOINT,
        "status checkpoint",
    )
    text = replace_once(
        text,
        "- direct equivalent Firefox Action API acceptance;\n",
        "",
        "status Firefox gap",
    )
    text = replace_once(
        text,
        "Permanent Nex Firefox E2E uses WebDriver BiDi for extension-page navigation and passes on Firefox 153.0. Historical original-package evidence remains fixed to Firefox 152.0.6; rerunning that separate original audit still requires the same BiDi migration or a pinned runtime.",
        "Permanent Nex Firefox E2E uses WebDriver BiDi for extension-page navigation and directly verifies Action title/Badge/Popup on Firefox 153.0. The coordinator handles `tabs.onCreated` and completed updates whose URL is available only on the tab object, preventing new Firefox tabs from remaining at the manifest loading title. Historical original-package evidence remains fixed to Firefox 152.0.6; rerunning that separate original audit still requires the same BiDi migration or a pinned runtime.",
        "status Firefox boundary",
    )
    text = replace_once(
        text,
        "- add direct Firefox title/Badge/Popup acceptance;\n",
        "",
        "status work item",
    )
    text = replace_once(
        text,
        "Complete the remaining original result traces and direct Firefox Action acceptance, then run focused Order 1 owner acceptance. No candidate is permitted.",
        "Complete the remaining original result traces plus explicit internal-page, same-tab and Inspect Action assertions, then run focused Order 1 owner acceptance. No candidate is permitted.",
        "status next action",
    )
    return text


update("docs/MILESTONE_8_STATUS.md", status_transform)


def verification_transform(text: str) -> str:
    text = replace_between(
        text,
        "Clean Head `e03e76e7edf310ddd6f947e77453febf0de07f58`",
        "This is an exact engineering and evidence checkpoint",
        CHECKPOINT + "\nThis is an exact engineering and evidence checkpoint",
        "verification checkpoint",
    )
    text = replace_once(
        text,
        "Permanent Chromium acceptance verifies System, Direct, Fixed proxy and Fixed bypass per-tab title/Badge/Popup state on two real tabs. Inspect no longer competes as a second title/Badge writer.",
        "Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy and Fixed bypass per-tab title/Badge/Popup state on two real tabs. The coordinator also refreshes newly created and completed Firefox tabs. Inspect no longer competes as a second title/Badge writer.",
        "verification acceptance",
    )
    text = replace_once(
        text,
        "Still outside the verified slice are complete Switch/PAC/Virtual/Rule List/temporary-rule/external-control traces, direct Firefox Action API acceptance, explicit internal-page and same-tab transition assertions, forced renderer fallback and repository-owner PASS.",
        "Still outside the verified slice are complete Switch/PAC/Virtual/Rule List/temporary-rule/external-control traces, explicit internal-page and same-tab transition assertions, direct Inspect set/clear Action capture, forced renderer fallback and repository-owner PASS.",
        "verification boundary",
    )
    return text


update("docs/MILESTONE_8_VERIFICATION_HEAD.md", verification_transform)


def delivery_transform(text: str) -> str:
    text = replace_once(
        text,
        "The current Nex branch now registers one background owner for all real browser Action writes. The owner composes the repository-backed resolver, race-safe per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Background startup proactively initializes a clean installation to the original System route, restores existing state without duplicate activation and refreshes all tabs after successful activation or recovery. Resolver coverage is verified for Direct, System, Fixed proxy and Fixed bypass results; Inspect no longer competes as a second title/Badge writer.",
        "The current Nex branch now registers one background owner for all real browser Action writes. The owner composes the repository-backed resolver, race-safe per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Background startup proactively initializes a clean installation to the original System route, restores existing state without duplicate activation and refreshes all tabs after successful activation or recovery. The coordinator additionally handles tab creation and Firefox completed-navigation events whose URL appears only on the tab object. Resolver coverage is verified for Direct, System, Fixed proxy and Fixed bypass results; Inspect no longer competes as a second title/Badge writer.",
        "delivery intro",
    )
    text = replace_between(
        text,
        "### Exact verified checkpoint — 2026-07-31",
        "No candidate may be generated",
        "### Exact verified checkpoint — 2026-08-01\n\n" + CHECKPOINT + "\nNo candidate may be generated",
        "delivery checkpoint",
    )
    text = replace_once(
        text,
        "  ACTION --> CHROME[Permanent Chromium two-tab Action E2E]",
        "  ACTION --> CHROME[Permanent Chromium two-tab Action E2E]\n  ACTION --> FIREFOX[Permanent Firefox two-tab Action E2E]",
        "delivery graph",
    )
    text = replace_once(
        text,
        "- Chromium now has direct per-tab Action acceptance for System, Direct, Fixed proxy, Fixed bypass and optional four-code-unit Badge; equivalent direct Firefox Action API acceptance remains open;",
        "- Chromium and Firefox now have direct per-tab Action acceptance for System, Direct, Fixed proxy and Fixed bypass; Chromium additionally verifies optional four-code-unit Badge truncation;",
        "delivery gap",
    )
    replacements = {
        "| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | exact target assets/title/Popup/shortcut/permissions are active; clean startup reaches System and Chromium reads the real per-tab title/Badge/Popup | `PARTIAL`                                    | add explicit internal-page and Firefox Action acceptance, then owner review |":
        "| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | exact target assets/title/Popup/shortcut/permissions are active; clean startup reaches System and both targets read real per-tab title/Badge/Popup | `PARTIAL`                                    | add explicit Nex internal-page assertions, then owner review                |",
        "| `TB-002` | Toolbar click opens target-specific original Popup; shortcut exists   | packages, Chromium/Firefox runtime | target Popup contracts are active; Chromium `getPopup()` is verified across System, Direct and Fixed states                                         | `PARTIAL`                                    | verify click/shortcut and direct Action state in Firefox                    |":
        "| `TB-002` | Toolbar click opens target-specific original Popup; shortcut exists   | packages, Chromium/Firefox runtime | target Popup contracts and per-tab `getPopup()` are verified across System, Direct and Fixed states in Chromium and Firefox                        | `PARTIAL`                                    | verify real toolbar click and shortcut behavior                             |",
        "| `TB-003` | Direct/System/Fixed static profile uses one color                     | source; Direct/System runtime      | one background owner applies Direct/System/Fixed states; Chromium verifies real titles, Badge and Popup for all three routes                        | `PARTIAL`                                    | verify exact visible icon pixels and Firefox user-Fixed state               |":
        "| `TB-003` | Direct/System/Fixed static profile uses one color                     | source; Direct/System runtime      | one background owner applies Direct/System/Fixed states; Chromium and Firefox verify real titles, Badge clearing and Popup for all three routes     | `PARTIAL`                                    | verify exact visible icon pixels and owner review                           |",
        "| `TB-005` | Current tab result equals current static profile: one-color result    | source                             | Chromium real Action acceptance verifies a Fixed proxy result on one tab while another tab resolves through Fixed bypass                            | `PARTIAL`                                    | add direct Firefox Action acceptance and owner review                       |":
        "| `TB-005` | Current tab result equals current static profile: one-color result    | source                             | Chromium and Firefox real Action acceptance verify a Fixed proxy result on one tab while another tab resolves through Fixed bypass                  | `PARTIAL`                                    | verify visible icon result and owner review                                 |",
        "| `TB-011` | Optional localized result-profile Badge, max four code units          | source                             | Chromium Fixed acceptance enables the preference and reads Badge `Tool` for `Toolbar Proxy` on both result-different tabs                           | `PARTIAL`                                    | verify imported preference and Firefox Badge behavior                       |":
        "| `TB-011` | Optional localized result-profile Badge, max four code units          | source                             | Chromium Fixed acceptance enables the preference and reads Badge `Tool` for `Toolbar Proxy`; Firefox verifies stale/empty Badge clearing            | `PARTIAL`                                    | verify imported preference and Firefox enabled-Badge truncation             |",
        "| `TB-016` | Tab activation restores each tab’s own state                          | source; basic two-tab runtime      | Chromium Action E2E verifies simultaneous Fixed proxy and Fixed bypass state on two tab IDs                                                         | `PARTIAL`                                    | repeat direct per-tab acceptance in Firefox and owner review                |":
        "| `TB-016` | Tab activation restores each tab’s own state                          | source; basic two-tab runtime      | Chromium and Firefox Action E2E verify simultaneous Fixed proxy and Fixed bypass state on two tab IDs                                               | `PARTIAL`                                    | run focused owner review                                                     |",
    }
    for old, new in replacements.items():
        text = replace_once(text, old, new, f"delivery matrix {old[:10]}")
    text = replace_once(
        text,
        "9. Firefox 153+ audit navigation method after its Marionette restriction;\n10. any modern-browser limitation that truly requires a minimized, owner-approved divergence.",
        "9. any modern-browser limitation that truly requires a minimized, owner-approved divergence.",
        "delivery unknowns",
    )
    return text


update("docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md", delivery_transform)


def delivery_kg_transform(text: str) -> str:
    return replace_between(
        text,
        "### Exact verified checkpoint — 2026-07-31",
        "## 3. Status vocabulary",
        "### Exact verified checkpoint — 2026-08-01\n\n" + CHECKPOINT + "\nThe checkpoint remains slice-level evidence and does not alter the 47% / 35% progress model.",
        "delivery KG checkpoint",
    )


update("docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md", delivery_kg_transform)


def original_kg_transform(text: str) -> str:
    marker = "## 3. 情景模式分类图"
    insertion = f"""## 2.1 当前 Nex 工具栏映射检查点（不反向定义原版）

- clean Head：`{HEAD}`；CI `30659255772`、Browser E2E `30659255691`、Parity `30659255845`、Visual `30659255790` 全绿。
- Chromium 与 Firefox 均直接读取每标签页 Action title、Badge、Popup，并通过 System → Direct → Fixed proxy / Fixed bypass 双标签验收。
- Firefox 实跑暴露新标签长期停在 manifest loading title；Nex 已加入 `tabs.onCreated` 与 `status: complete` 且 URL 仅存在于 tab 对象时的刷新路径。
- 该兼容性修复只保证原版可观察的“新标签应得到当前状态”，不是新增原版概念。
- Switch/PAC/Virtual/Rule List/临时规则/外部控制完整 trace、内部页、同标签 URL 切换、Inspect Action set/clear 和 owner PASS 仍未完成。
- 总进度仍为 47%，Order 1 仍为 35%，不得据此生成候选。

"""
    if insertion.strip() in text:
        raise SystemExit("original KG insertion already present")
    return replace_once(text, marker, insertion + marker, "original KG mapping checkpoint")


update("docs/ORIGINAL_KNOWLEDGE_GRAPH.md", original_kg_transform)
