from pathlib import Path


OLD_HEAD = "db1b10ebe6d41637246d777e34b1afd4eb6ca170"
NEW_HEAD = "d201d203cd0fd64a14342414935a48c3c295e60c"
RUN_REPLACEMENTS = {
    "30666472249": "30671118969",
    "30666473257": "30671118975",
    "30666472570": "30671118993",
    "30666472029": "30671118990",
}


def must_replace(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_checkpoint_ids(text: str) -> str:
    text = text.replace(OLD_HEAD, NEW_HEAD)
    for old, new in RUN_REPLACEMENTS.items():
        text = text.replace(old, new)
    return text


def update(path_name: str, transform) -> None:
    path = Path(path_name)
    text = path.read_text(encoding="utf-8")
    text = transform(replace_checkpoint_ids(text))
    path.write_text(text, encoding="utf-8")


def verification(text: str) -> str:
    text = must_replace(
        text,
        "The permanent Browser E2E run passed Chromium Action, Firefox Action and native Chromium Inspect acceptance. Firefox directly verified System, Direct and simultaneous Fixed proxy / Fixed bypass state on two real tabs. Before cleanup, the same product transaction also passed one complete Firefox journey and ten consecutive command-driven focused Firefox Action journeys.",
        "The permanent Browser E2E run passed the Chromium full journey, Chromium toolbar Action, Firefox full journey, the permanent focused Firefox toolbar Action job and native Chromium Inspect acceptance. Chromium and Firefox now directly verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, browser-internal/default fallback and same-tab proxy ↔ bypass transitions. Native Inspect directly captures tab-local set, current-page clear, base-state restoration and cross-tab isolation. The dedicated pre-commit transaction also passed full verification and three consecutive focused Firefox toolbar transition journeys.",
        "verification permanent browser paragraph",
    )
    text = must_replace(
        text,
        "The runtime now establishes a browser-level Action baseline before per-tab overrides, serializes profile-workflow commands so concurrent startup reads cannot observe half-initialized proxy state, and repairs missing persisted proxy runtime from the saved startup route. Top-level navigation remains an exact-guarded coordinator input rather than a second writer.",
        "The runtime now establishes a browser-level Action baseline before per-tab overrides, serializes profile-workflow commands so concurrent startup reads cannot observe half-initialized proxy state, and repairs missing persisted proxy runtime from the saved startup route. Top-level navigation remains an exact-guarded coordinator input rather than a second writer. Permanent acceptance now exercises the coordinator across internal/default fallback, same-tab URL result changes and Inspect overlay set/clear/isolation rather than only static two-tab snapshots.",
        "verification runtime paragraph",
    )
    text = must_replace(
        text,
        "Still outside the verified slice are complete Switch/PAC/Virtual/Rule List/temporary-rule/external-control traces, explicit internal-page and same-tab transition assertions, direct Inspect set/clear Action capture, forced renderer fallback and repository-owner PASS.",
        "Still outside the verified slice are complete Switch/PAC/Virtual/Rule List/temporary-rule/external-control traces, forced renderer fallback, headed toolbar pixels where browser-readable state is insufficient and repository-owner PASS.",
        "verification remaining slice",
    )
    return text


def session_checkpoint(text: str) -> str:
    text = must_replace(
        text,
        "The authoritative knowledge graph, audit index, Delivery Order 1, Milestone 8 status and Verification Head were synchronized to that exact checkpoint in `16fdd72ca32e109778f54b0eb2a61993059ba60c`; the temporary synchronization files were removed in `7eb7077ba11c500ebc12829f822da9dd67f246ad`.",
        "That earlier synchronization checkpoint is superseded by the transition/Inspect acceptance below. The progress model remains unchanged because automation does not replace owner acceptance.",
        "session superseded sync",
    )
    marker = "## Remaining Order 1 work\n"
    insertion = """## Toolbar transition and Inspect acceptance

Permanent test commit `adf53faa98825729d5a6c5782dd21c61864e3087` adds the missing source-certain browser assertions:

- Chromium verifies System behavior on a real `chrome://version/` tab, Fixed fallback to the localized default Action, and same-tab Fixed proxy → bypass → proxy transitions;
- Firefox verifies the equivalent contract on a real `about:blank` browser tab and same-tab proxy ↔ bypass transitions; the dedicated transaction passed three consecutive focused Firefox journeys;
- Firefox Action waits now accept a final sample that reaches the exact expected state at the timeout boundary instead of rethrowing a stale WebDriver timeout;
- native Chromium Inspect now waits for the target and isolation tabs to settle to the same System baseline, captures `#`/Inspect title on the target tab, clears the overlay by selecting the current page URL, restores the base Action and proves the isolation tab remains unchanged;
- permanent Browser E2E now runs the focused Firefox toolbar Action job and uploads its diagnostics separately.

The dedicated transaction `30670819111` passed full `pnpm verify`, Chromium toolbar acceptance, three Firefox toolbar transition iterations and native Inspect set/clear/isolation. Clean authenticated Head `d201d203cd0fd64a14342414935a48c3c295e60c` then passed CI `30671118969`, Browser E2E `30671118975`, Parity Documentation `30671118993` and Milestone 8 Visual Evidence `30671118990`.

"""
    if marker not in text:
        raise SystemExit("session remaining marker missing")
    text = text.replace(marker, insertion + marker, 1)
    text = must_replace(
        text,
        "- explicit internal-page fallback and same-tab proxy↔bypass assertions;\n- direct Inspect set/clear/isolation Action capture;\n",
        "",
        "session completed remaining items",
    )
    text = must_replace(
        text,
        "1. Require all four permanent gates on this authenticated post-stabilization Head.\n2. Update PR #11 and the Session 8 PR checkpoint to the exact successful Head and run IDs.\n3. Continue with internal-page, same-tab transition and direct Inspect Action acceptance.\n4. Keep progress at 47% / 35% until their real-browser and owner-acceptance gates close.",
        "1. Preserve and integrate the complete original `matchProfile.results` traces for Switch/PAC/Virtual/attached Rule List/temporary-rule/external-control states.\n2. Force dynamic-render failure/static fallback where feasible and capture headed toolbar pixels only where Action API state is insufficient.\n3. Run focused repository-owner acceptance for startup/System, Direct, user Fixed, two-tab isolation, Popup and Inspect.\n4. Keep progress at 47% / 35% until the remaining real-browser and owner-acceptance gates close.",
        "session next gate",
    )
    return text


def delivery(text: str) -> str:
    text = must_replace(
        text,
        "The permanent Browser E2E run passed Chromium Action, Firefox Action and native Chromium Inspect acceptance. Firefox directly verified System, Direct and simultaneous Fixed proxy / Fixed bypass state on two real tabs. Before cleanup, the same product transaction also passed one complete Firefox journey and ten consecutive command-driven focused Firefox Action journeys.",
        "The permanent Browser E2E run passed Chromium full/toolbar journeys, Firefox full/focused-toolbar journeys and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback and same-tab proxy ↔ bypass transitions. Native Inspect verifies tab-local set, current-page clear, base Action restoration and isolation. The dedicated transaction also passed full verification and three consecutive focused Firefox toolbar transition journeys.",
        "delivery permanent browser paragraph",
    )
    text = must_replace(
        text,
        "- Chromium and Firefox now have direct per-tab Action acceptance for System, Direct, Fixed proxy and Fixed bypass; Chromium additionally verifies optional four-code-unit Badge truncation;",
        "- Chromium and Firefox now have direct per-tab Action acceptance for System, Direct, Fixed proxy, Fixed bypass, browser-internal/default fallback and same-tab proxy ↔ bypass transitions; Chromium additionally verifies optional four-code-unit Badge truncation;",
        "delivery confirmed gaps acceptance",
    )
    row_replacements = {
        "| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | exact target assets/title/Popup/shortcut/permissions are active; clean startup reaches System and both targets read real per-tab title/Badge/Popup; `webNavigation` is exact-guarded       | `PARTIAL`                                    | add explicit Nex internal-page assertions, then owner review           |":
        "| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | exact target assets/title/Popup/shortcut/permissions are active; clean startup reaches System and both targets verify internal-page System inheritance plus Fixed fallback to the localized default Action | `PARTIAL`                                    | verify headed fallback pixels where needed, then owner review          |",
        "| `TB-012` | Inspect sets tab-specific `#`, result color and Inspect title         | source                             | Inspect feeds a single-writer overlay; native Chromium menu E2E and overlay lifecycle tests pass                                                                                           | `PARTIAL`                                    | add direct real Action set/clear/isolation capture                     |":
        "| `TB-012` | Inspect sets tab-specific `#`, result color and Inspect title         | source                             | native Chromium E2E captures target-tab `#`/Inspect title, current-page clear, base Action restoration and unchanged isolation-tab state through the single writer                           | `PARTIAL`                                    | verify exact visible icon/result color and owner review                |",
        "| `TB-014` | Internal/unsupported URL clears result and uses default state         | source; basic runtime capture      | coordinator owns fallback/default clearing; Built-in route handling is registered                                                                                                          | `PARTIAL`                                    | add explicit Nex internal-page Action assertions in both targets       |":
        "| `TB-014` | Internal/unsupported URL clears result and uses default state         | source; basic runtime capture      | Chromium `chrome://version/` and Firefox `about:blank` Action acceptance verify System inheritance and Fixed fallback to the localized default state                                         | `PARTIAL`                                    | owner review and any necessary headed pixel evidence                   |",
        "| `TB-015` | Tab URL update recalculates result                                    | source                             | registered coordinator handles tab updates and top-level navigation commits; Firefox 152.0.6 new-tab navigation is verified, while result-different same-tab navigation remains unasserted | `PARTIAL`                                    | navigate one tab across proxy/bypass URLs and read Action transitions  |":
        "| `TB-015` | Tab URL update recalculates result                                    | source                             | both targets navigate one real tab from Fixed proxy to bypass and back to proxy, reading the exact per-tab Action state after each committed URL                                             | `PARTIAL`                                    | extend the same transition proof to inclusive/temp/external inputs     |",
    }
    for old, new in row_replacements.items():
        text = must_replace(text, old, new, f"delivery row {old[:12]}")
    text = must_replace(
        text,
        "6. Inspect state and clearing sequence;\n7. external-control transition sequence;\n8. optional Badge enabled state after real original import;\n9. any modern-browser limitation that truly requires a minimized, owner-approved divergence.",
        "6. original-runtime Inspect sequence beyond source-certain behavior;\n7. external-control transition sequence;\n8. optional Badge enabled state after real original import;\n9. any modern-browser limitation that truly requires a minimized, owner-approved divergence.",
        "delivery unknowns",
    )
    text = must_replace(
        text,
        "- direct equivalent Action API acceptance in Firefox;\n- headed icon pixels and forced dynamic-render fallback evidence;",
        "- headed icon pixels and forced dynamic-render fallback evidence;",
        "delivery TO04 remaining",
    )
    text = must_replace(
        text,
        "- explicit same-tab URL transition and direct Firefox per-tab Action acceptance.",
        "- equivalent transition inputs for inclusive profiles, temporary rules and external control.",
        "delivery TO05 remaining",
    )
    text = must_replace(
        text,
        "Remaining inputs include temporary-rule transitions, ownership/external control, inclusive-profile trace display and equivalent direct Firefox Action acceptance.",
        "Remaining inputs include temporary-rule transitions, ownership/external control and inclusive-profile trace display.",
        "delivery TO06 remaining",
    )
    text = must_replace(
        text,
        "Status: `NOT STARTED` for the corrected integrated subsystem.\n\nAutomation must assert visible browser Action state, not internal model output alone.",
        "Status: `PARTIAL`, permanent real-browser automation covers the source-certain subsystem.\n\nAutomation now asserts visible Action title/Badge/Popup for System, Direct, Fixed proxy/bypass, internal/default fallback, same-tab URL transitions and Inspect set/clear/isolation. Inclusive traces, renderer failure and owner acceptance remain open.",
        "delivery TO07 status",
    )
    old_verification = """Exact clean engineering checkpoint Head `e0ec31bd88ce4ff2d40937daee0b63def45fb2e8` passed:

- CI `30615270403`;
- Browser E2E `30615270448`, including Chromium, Firefox and native Inspect;
- Parity Documentation `30615270389`;
- Milestone 8 Visual Evidence `30615270430`.

This checkpoint validates the target manifest/locales/assets, real browser API construction, activation notification seam, exact renderer/executor/coordinator and the conservative Direct/System/Fixed-proxy resolver. It intentionally leaves Fixed bypass and inclusive-profile traces unresolved. It does not close a `TB-*` row because the coordinator is not registered against visible Action state and no repository-owner acceptance exists."""
    new_verification = """Exact clean engineering checkpoint Head `d201d203cd0fd64a14342414935a48c3c295e60c` passed:

- CI `30671118969`;
- Browser E2E `30671118975`, including Chromium full/toolbar, Firefox full/focused-toolbar and native Inspect;
- Parity Documentation `30671118993`;
- Milestone 8 Visual Evidence `30671118990`.

The dedicated transaction `30670819111` additionally passed full verification, Chromium toolbar acceptance, three consecutive Firefox toolbar transition journeys and native Inspect set/clear/isolation before the permanent files were committed. This checkpoint validates visible Action state for the mapped source-certain slice but does not close a `TB-*` row without owner acceptance."""
    text = must_replace(text, old_verification, new_verification, "delivery verification checkpoint")
    old_next = """1. Preserve the original `matchProfile.results` trace data needed for visible details: default transitions, condition strings, attached Rule Lists and temporary-rule prefixes.
2. Build a pure trace-to-title/result adapter and test Fixed bypass before expanding Switch/Rule List/Virtual coverage.
3. Keep PAC and auto-detect target-dependent results unresolved until an exact result source exists.
4. Establish a single Action owner by converting Inspect and external-control state into coordinator inputs.
5. Register startup/tab/activation refresh only after unsupported states can no longer overwrite valid visible state.
6. Add Chromium/Firefox two-tab Action assertions, then request repository-owner review."""
    new_next = """1. Preserve and integrate the original `matchProfile.results` trace data needed for Switch/PAC/Virtual/attached Rule List/temporary-rule details.
2. Keep PAC and target-dependent results unresolved until an exact source exists; unsupported trace shapes must fail closed.
3. Connect temporary-rule and external-control transitions as inputs to the existing single writer.
4. Force dynamic-render failure/static fallback where feasible and capture headed toolbar pixels only where browser-readable state is insufficient.
5. Run focused repository-owner review for startup/System, Direct, user Fixed, two-tab isolation, Popup and Inspect."""
    text = must_replace(text, old_next, new_next, "delivery next action")
    return text


def active_audit(text: str) -> str:
    text = must_replace(
        text,
        "- Exact official Chromium and Firefox packages cover the basic original reference states. Nex now has direct Chromium and Firefox Action acceptance for System, Direct, Fixed proxy, Fixed bypass, two-tab isolation, runtime-localized title and per-tab Popup; Chromium also verifies four-code-unit Badge truncation. Advanced traces and owner acceptance remain open.",
        "- Exact official Chromium and Firefox packages cover the basic original reference states. Nex now has direct Chromium and Firefox Action acceptance for System, Direct, Fixed proxy, Fixed bypass, internal/default fallback, same-tab proxy ↔ bypass, two-tab isolation, runtime-localized title and per-tab Popup; Chromium also verifies four-code-unit Badge truncation, while native Inspect verifies set/clear/base restoration/isolation. Advanced traces and owner acceptance remain open.",
        "audit repository acceptance summary",
    )
    text = must_replace(
        text,
        "Complete the remaining original trace inputs and explicit internal/same-tab/Inspect assertions, then run focused owner acceptance",
        "Complete the remaining original trace inputs, renderer fallback/pixel evidence where needed, then run focused owner acceptance",
        "audit order1 next gate",
    )
    text = must_replace(
        text,
        "- permanent Chromium and Firefox Action E2E read two tab IDs through the target Action API across System → Direct → Fixed proxy / Fixed bypass transitions;",
        "- permanent Chromium and Firefox Action E2E read real tab IDs across System → Direct → Fixed proxy / Fixed bypass, internal/default fallback and same-tab proxy ↔ bypass transitions; native Chromium Inspect captures set/clear/base restoration/isolation;",
        "audit runtime E2E",
    )
    text = must_replace(
        text,
        "- explicit internal-page, same-tab URL-transition, Inspect set/clear Action capture and forced renderer-fallback evidence remain open;",
        "- forced renderer-fallback evidence and headed toolbar pixels remain open where browser-readable Action state is insufficient;",
        "audit remaining gap",
    )
    text = must_replace(
        text,
        "- permanent Firefox toolbar Action acceptance integrated into `scripts/e2e-firefox.mjs`;",
        "- permanent Firefox toolbar Action acceptance integrated into `scripts/e2e-firefox.mjs`, including internal/default fallback and same-tab proxy ↔ bypass transitions;\n- native Inspect Action set/clear/base restoration/isolation in `scripts/e2e-inspect-native-menu.mjs`;",
        "audit source certain scripts",
    )
    text = must_replace(
        text,
        "The permanent Browser E2E run passed Chromium Action, Firefox Action and native Chromium Inspect acceptance. Firefox directly verified System, Direct and simultaneous Fixed proxy / Fixed bypass state on two real tabs. Before cleanup, the same product transaction also passed one complete Firefox journey and ten consecutive command-driven focused Firefox Action journeys.",
        "The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback and same-tab proxy ↔ bypass transitions. Native Inspect verifies tab-local set/clear/base restoration/isolation. Dedicated transaction `30670819111` also passed full verification and three consecutive focused Firefox toolbar transition journeys.",
        "audit permanent browser paragraph",
    )
    return text


def delivery_graph(text: str) -> str:
    text = must_replace(
        text,
        "The permanent Browser E2E run passed Chromium Action, Firefox Action and native Chromium Inspect acceptance. Firefox directly verified System, Direct and simultaneous Fixed proxy / Fixed bypass state on two real tabs. Before cleanup, the same product transaction also passed one complete Firefox journey and ten consecutive command-driven focused Firefox Action journeys.",
        "The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback and same-tab proxy ↔ bypass transitions. Native Inspect verifies tab-local set, current-page clear, base restoration and isolation. Dedicated transaction `30670819111` also passed full verification and three consecutive focused Firefox toolbar transition journeys.",
        "delivery graph checkpoint paragraph",
    )
    old_row = "| `KG-ICON-001`      | Browser toolbar           | Icon, title and visible toolbar state follow the current profile/runtime situation.    | One background owner now drives a durable global baseline plus real per-tab System, Direct, Fixed proxy/bypass and Inspect-overlay state; Switch/PAC/Virtual/Rule List/temp/external traces and owner acceptance remain open. | `FAILED` | Complete remaining original states, direct Firefox Action acceptance and owner review.        |"
    new_row = "| `KG-ICON-001`      | Browser toolbar           | Icon, title and visible toolbar state follow the current profile/runtime situation.    | One background owner now drives a durable global baseline plus real per-tab System, Direct, Fixed proxy/bypass, internal/default fallback, same-tab transitions and Inspect set/clear/isolation; Switch/PAC/Virtual/Rule List/temp/external traces and owner acceptance remain open. | `FAILED` | Complete remaining original traces, renderer/pixel evidence where needed and owner review.     |"
    text = must_replace(text, old_row, new_row, "delivery graph KG-ICON row")
    return text


def original_graph(text: str) -> str:
    text = must_replace(
        text,
        "- Chromium 与 Firefox 均直接读取每标签页 Action title、Badge、Popup，并通过 System → Direct → Fixed proxy / Fixed bypass 双标签验收；当前 Firefox 永久门禁运行于 `152.0.6`。",
        "- Chromium 与 Firefox 均直接读取每标签页 Action title、Badge、Popup，并通过 System → Direct → Fixed proxy / Fixed bypass、内部页／默认回退及同标签 proxy ↔ bypass 转换验收；历史原版证据固定于 Firefox `152.0.6`，Nex 永久门禁使用 runner 当前 Firefox。",
        "original graph browser acceptance",
    )
    text = must_replace(
        text,
        "- Switch/PAC/Virtual/Rule List/临时规则/外部控制完整 trace、内部页、同标签 URL 切换、Inspect Action set/clear 和 owner PASS 仍未完成。",
        "- Chromium／Firefox 内部页与同标签 URL 转换、Chromium Inspect Action set/clear/base restoration/isolation 已完成自动验收；Switch/PAC/Virtual/Rule List/临时规则/外部控制完整 trace、真实渲染失败／像素证据和 owner PASS 仍未完成。",
        "original graph remaining toolbar",
    )
    return text


def milestone_status(text: str) -> str:
    text = must_replace(
        text,
        "The permanent Browser E2E run passed Chromium Action, Firefox Action and native Chromium Inspect acceptance. Firefox directly verified System, Direct and simultaneous Fixed proxy / Fixed bypass state on two real tabs. Before cleanup, the same product transaction also passed one complete Firefox journey and ten consecutive command-driven focused Firefox Action journeys.",
        "The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback and same-tab proxy ↔ bypass transitions. Native Inspect verifies target-tab set, current-page clear, base restoration and cross-tab isolation. Dedicated transaction `30670819111` also passed full verification and three consecutive focused Firefox toolbar transition journeys.",
        "status permanent browser paragraph",
    )
    text = must_replace(
        text,
        "- explicit internal-page, same-tab URL-transition, Inspect set/clear and forced renderer-fallback Action evidence;",
        "- forced renderer-fallback Action evidence and headed toolbar pixels where browser-readable state is insufficient;",
        "status still open",
    )
    text = must_replace(
        text,
        "### 2. Expand direct real-browser Action acceptance\n\n- add explicit internal-page fallback and same-tab proxy↔bypass transition assertions;\n- capture Inspect set/clear/isolation through the real Action API;\n- force renderer failure and verify static fallback where feasible.",
        "### 2. Finish the remaining renderer evidence\n\n- force renderer failure and verify static fallback where feasible;\n- capture headed toolbar pixels only where browser-readable Action state cannot establish equivalence.",
        "status immediate work order 2",
    )
    text = must_replace(
        text,
        "Complete the remaining original result traces plus explicit internal-page, same-tab and Inspect Action assertions, then run focused Order 1 owner acceptance. No candidate is permitted.",
        "Complete the remaining original result traces plus renderer fallback/pixel evidence where needed, then run focused Order 1 owner acceptance. No candidate is permitted.",
        "status current next action",
    )
    return text


update("docs/MILESTONE_8_VERIFICATION_HEAD.md", verification)
update("docs/MILESTONE_8_SESSION_8_CHECKPOINT.md", session_checkpoint)
update("docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md", delivery)
update("docs/ACTIVE_PARITY_AUDIT_INDEX.md", active_audit)
update("docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md", delivery_graph)
update("docs/ORIGINAL_KNOWLEDGE_GRAPH.md", original_graph)
update("docs/MILESTONE_8_STATUS.md", milestone_status)
