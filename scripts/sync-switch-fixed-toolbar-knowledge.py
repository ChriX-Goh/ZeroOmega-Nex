from pathlib import Path


HEAD = "5ce5a21a865a569e327a78062d7d255fe0f76126"
RUNS = {
    "ci": "30672861182",
    "browser": "30672861154",
    "parity": "30672861161",
    "visual": "30672861171",
}
PRODUCT_COMMIT = "b55b2b61404f9cdaf4cf3d8f5d664f5b7d1e22b9"
TRANSACTION = "30672598304"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def update(path_name: str, transform) -> None:
    path = Path(path_name)
    text = path.read_text(encoding="utf-8")
    path.write_text(transform(text), encoding="utf-8")


def checkpoint_block() -> str:
    return f"""Clean Head `{HEAD}` passed all permanent gates after the exact Switch-to-Fixed toolbar trace slice and temporary-file cleanup:

- CI `{RUNS['ci']}`;
- Browser E2E `{RUNS['browser']}`;
- Parity Documentation `{RUNS['parity']}`;
- Milestone 8 Visual Evidence `{RUNS['visual']}`."""


def verification(text: str) -> str:
    old = """Clean Head `d201d203cd0fd64a14342414935a48c3c295e60c` passed all permanent gates after the durable global Action baseline, serialized profile-workflow initialization and temporary-file cleanup:

- CI `30671118969`;
- Browser E2E `30671118975`;
- Parity Documentation `30671118993`;
- Milestone 8 Visual Evidence `30671118990`."""
    text = replace_once(text, old, checkpoint_block(), "verification checkpoint")
    text = replace_once(
        text,
        "The permanent Browser E2E run passed the Chromium full journey, Chromium toolbar Action, Firefox full journey, the permanent focused Firefox toolbar Action job and native Chromium Inspect acceptance. Chromium and Firefox now directly verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, browser-internal/default fallback and same-tab proxy ↔ bypass transitions. Native Inspect directly captures tab-local set, current-page clear, base-state restoration and cross-tab isolation. The dedicated pre-commit transaction also passed full verification and three consecutive focused Firefox toolbar transition journeys.",
        f"The permanent Browser E2E run passed the Chromium full journey, Chromium toolbar Action, Firefox full journey, the permanent focused Firefox toolbar Action job and native Chromium Inspect acceptance. Chromium and Firefox now directly verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, browser-internal/default fallback, same-tab proxy ↔ bypass transitions and an exact no-attached-list Switch → Fixed proxy matched/default slice with runtime-localized multiline details, two-color state, result Badge and per-tab Popup. Native Inspect directly captures tab-local set, current-page clear, base-state restoration and cross-tab isolation. Dedicated transaction `{TRANSACTION}` passed full verification, Chromium Switch Action acceptance and three consecutive focused Firefox Switch Action journeys.",
        "verification browser paragraph",
    )
    text = replace_once(
        text,
        "Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy and Fixed bypass per-tab title/Badge/Popup state on two real tabs. Firefox 152.0.6 additionally verifies the `about:blank` → committed web navigation path. Inspect no longer competes as a second title/Badge writer.",
        "Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy, Fixed bypass and the exact Switch → Fixed matched/default per-tab title/Badge/Popup state on real tabs. The Switch slice preserves the original condition/default transition line followed by the final Fixed PAC-result line and uses a two-color icon contract. Firefox 152.0.6 additionally verifies the historical original `about:blank` → committed web navigation path. Inspect no longer competes as a second title/Badge writer.",
        "verification integration boundary",
    )
    text = replace_once(
        text,
        "Still outside the verified slice are complete Switch/PAC/Virtual/Rule List/temporary-rule/external-control traces, forced renderer fallback, headed toolbar pixels where browser-readable state is insufficient and repository-owner PASS.",
        "Still outside the verified slice are Switch results into Direct/System, nested or attached Rule Lists, PAC/Virtual/temporary-rule/external-control traces, forced renderer fallback, headed toolbar pixels where browser-readable state is insufficient and repository-owner PASS.",
        "verification remaining boundary",
    )
    return text


def session(text: str) -> str:
    marker = "## Remaining Order 1 work\n"
    section = f"""## Exact Switch → Fixed toolbar trace

Product commit `{PRODUCT_COMMIT}` adds a deliberately narrow original-backed inclusive-profile slice:

- active profile is one colored Switch profile without an attached Rule List;
- exactly one matched rule or the Switch default directly targets one colored Fixed profile;
- the graph decision must be exact and end in that Fixed proxy endpoint;
- visible details preserve the original order: condition or localized `(default)` transition to the result profile, followed by the final PAC-result line;
- current/result names, two-color icon inputs, optional four-code-unit result Badge and per-tab Popup follow the original `actionForUrl` contract;
- Switch results into Direct/System, nested profiles, attached Rule Lists, PAC, Virtual, temporary-rule or external-control traces remain fail-closed.

The resolver gained three focused tests, bringing the unit total to `520`. Dedicated transaction `{TRANSACTION}` passed full `pnpm verify`, Chromium real Action acceptance and three consecutive Firefox focused Action journeys covering matched, default, internal fallback and same-tab matched ↔ default transitions. Clean Head `{HEAD}` then passed CI `{RUNS['ci']}`, Browser E2E `{RUNS['browser']}`, Parity Documentation `{RUNS['parity']}` and Milestone 8 Visual Evidence `{RUNS['visual']}`.

"""
    if marker not in text:
        raise SystemExit("session remaining marker missing")
    text = text.replace(marker, section + marker, 1)
    text = replace_once(
        text,
        "- complete Switch/PAC default and matched-result traces;",
        "- Switch results into Direct/System, nested or attached Rule Lists, plus PAC default and matched-result traces;",
        "session remaining switch",
    )
    text = replace_once(
        text,
        "1. Preserve and integrate the complete original `matchProfile.results` traces for Switch/PAC/Virtual/attached Rule List/temporary-rule/external-control states.",
        "1. Preserve and integrate the remaining original `matchProfile.results` traces for Switch→Direct/System, nested/attached Rule Lists, PAC/Virtual/temporary-rule/external-control states.",
        "session next trace",
    )
    return text


def delivery(text: str) -> str:
    text = replace_once(
        text,
        "Resolver coverage is verified for Direct, System, Fixed proxy and Fixed bypass results; Inspect no longer competes as a second title/Badge writer.",
        "Resolver coverage is verified for Direct, System, Fixed proxy, Fixed bypass and an exact no-attached-list Switch → Fixed proxy matched/default slice; Inspect no longer competes as a second title/Badge writer.",
        "delivery top resolver",
    )
    old = """Clean Head `d201d203cd0fd64a14342414935a48c3c295e60c` passed all permanent gates after the durable global Action baseline, serialized profile-workflow initialization and temporary-file cleanup:

- CI `30671118969`;
- Browser E2E `30671118975`;
- Parity Documentation `30671118993`;
- Milestone 8 Visual Evidence `30671118990`."""
    text = replace_once(text, old, checkpoint_block(), "delivery checkpoint")
    text = replace_once(
        text,
        "The permanent Browser E2E run passed Chromium full/toolbar journeys, Firefox full/focused-toolbar journeys and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback and same-tab proxy ↔ bypass transitions. Native Inspect verifies tab-local set, current-page clear, base Action restoration and isolation. The dedicated transaction also passed full verification and three consecutive focused Firefox toolbar transition journeys.",
        f"The permanent Browser E2E run passed Chromium full/toolbar journeys, Firefox full/focused-toolbar journeys and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback, same-tab proxy ↔ bypass transitions and the exact Switch → Fixed matched/default slice. Native Inspect verifies tab-local set, current-page clear, base Action restoration and isolation. Dedicated transaction `{TRANSACTION}` passed full verification, Chromium Switch Action acceptance and three consecutive focused Firefox Switch Action journeys.",
        "delivery browser paragraph",
    )
    text = replace_once(
        text,
        "4. current source-certain resolver coverage is limited to Direct, System and Fixed profiles whose evaluated result remains that Fixed profile's proxy endpoint.",
        "4. current source-certain resolver coverage includes Direct, System, Fixed proxy/bypass and a strict Switch matched/default transition directly into one Fixed proxy; all other inclusive trace shapes remain unresolved/default.",
        "delivery action trace consequence",
    )
    text = replace_once(
        text,
        "RES[Repository resolver: Direct / System / Fixed proxy / Fixed bypass] --> COORD",
        "RES[Repository resolver: Direct / System / Fixed + exact Switch-to-Fixed] --> COORD",
        "delivery graph resolver",
    )
    text = replace_once(
        text,
        "INCLUSIVE[Switch / PAC / Virtual / attached Rule List] -. full trace open .-> COORD",
        "INCLUSIVE[Remaining Switch / PAC / Virtual / attached Rule List] -. full trace open .-> COORD",
        "delivery graph inclusive",
    )
    text = replace_once(
        text,
        "- Switch, PAC, Virtual, attached Rule List, temporary-rule and external-control states still need the complete original `matchProfile.results` display trace;",
        "- Switch results into Direct/System, nested or attached Rule Lists, plus PAC, Virtual, temporary-rule and external-control states still need the complete original `matchProfile.results` display trace;",
        "delivery remaining traces",
    )
    text = replace_once(
        text,
        "| `TB-006` | Switch/PAC resolves to another profile: two-color result/current icon | source                             | no runtime coordinator                                                                                                                                                                                     | `MISSING_IN_NEX`; original runtime `UNKNOWN` | capture two URLs/results, then implement exact transition              |",
        "| `TB-006` | Switch/PAC resolves to another profile: two-color result/current icon | source                             | Chromium and Firefox now verify one exact Switch matched/default path directly into a Fixed proxy, including multiline title, result Badge, Popup and same-tab matched ↔ default transitions                 | `PARTIAL`; original runtime still `UNKNOWN`  | capture original runtime and extend Direct/System/nested/PAC results   |",
        "delivery TB006",
    )
    text = replace_once(
        text,
        "| `TB-015` | Tab URL update recalculates result                                    | source                             | both targets navigate one real tab from Fixed proxy to bypass and back to proxy, reading the exact per-tab Action state after each committed URL                                                           | `PARTIAL`                                    | extend the same transition proof to inclusive/temp/external inputs     |",
        "| `TB-015` | Tab URL update recalculates result                                    | source                             | both targets verify same-tab Fixed proxy ↔ bypass and Switch matched ↔ default transitions, reading the exact per-tab Action state after each committed URL                                                | `PARTIAL`                                    | extend the same transition proof to remaining inclusive/temp/external inputs |",
        "delivery TB015",
    )
    text = replace_once(
        text,
        "3. Switch/PAC default and matched-result states;",
        "3. Switch results into Direct/System/nested/attached profiles and PAC default/matched-result states;",
        "delivery unknown 3",
    )
    text = replace_once(
        text,
        "- repository-backed Direct/System/Fixed resolver;",
        "- repository-backed Direct/System/Fixed resolver plus the strict Switch → Fixed matched/default trace slice;",
        "delivery source implementation resolver",
    )
    return text


def audit(text: str) -> str:
    text = replace_once(
        text,
        "- Current implementation registers one background owner for real browser Action writes and composes the repository resolver, global/per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Startup establishes a browser-level System/Direct Action baseline, serializes profile-workflow commands through activation follow-up, repairs missing proxy runtime from the saved startup route and refreshes all tabs after activation or recovery. Top-level `webNavigation.onCommitted` remains a final-URL coordinator input.",
        "- Current implementation registers one background owner for real browser Action writes and composes the repository resolver, global/per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Resolver coverage now includes Direct/System/Fixed and a strict exact Switch → Fixed matched/default slice. Startup establishes a browser-level System/Direct Action baseline, serializes profile-workflow commands through activation follow-up, repairs missing proxy runtime from the saved startup route and refreshes all tabs after activation or recovery. Top-level `webNavigation.onCommitted` remains a final-URL coordinator input.",
        "audit current implementation",
    )
    text = replace_once(
        text,
        "- Exact official Chromium and Firefox packages cover the basic original reference states. Nex now has direct Chromium and Firefox Action acceptance for System, Direct, Fixed proxy, Fixed bypass, internal/default fallback, same-tab proxy ↔ bypass, two-tab isolation, runtime-localized title and per-tab Popup; Chromium also verifies four-code-unit Badge truncation, while native Inspect verifies set/clear/base restoration/isolation. Advanced traces and owner acceptance remain open.",
        "- Exact official Chromium and Firefox packages cover the basic original reference states. Nex now has direct Chromium and Firefox Action acceptance for System, Direct, Fixed proxy, Fixed bypass, internal/default fallback, same-tab proxy ↔ bypass, the exact Switch → Fixed matched/default path, two-tab isolation, runtime-localized title and per-tab Popup; Chromium also verifies four-code-unit Badge truncation, while native Inspect verifies set/clear/base restoration/isolation. Remaining inclusive traces and owner acceptance remain open.",
        "audit acceptance summary",
    )
    text = replace_once(
        text,
        "Background single-writer runtime, durable global Action baseline, serialized original System startup, Direct/System/Fixed resolver, top-level navigation refresh, Inspect overlay and real two-tab Action state are verified in both targets; Switch/PAC/Virtual/Rule List/temp/external traces and owner PASS remain open",
        "Background single-writer runtime, durable global Action baseline, serialized original System startup, Direct/System/Fixed plus exact Switch→Fixed resolver, top-level navigation refresh, Inspect overlay and real Action state are verified in both targets; remaining Switch/PAC/Virtual/Rule List/temp/external traces and owner PASS remain open",
        "audit order table",
    )
    text = replace_once(
        text,
        "- the repository-backed resolver covers Direct, System, Fixed proxy and Fixed bypass results;",
        "- the repository-backed resolver covers Direct, System, Fixed proxy/bypass and an exact Switch matched/default transition directly into one Fixed proxy;",
        "audit runtime resolver",
    )
    text = replace_once(
        text,
        "- permanent Chromium and Firefox Action E2E read real tab IDs across System → Direct → Fixed proxy / Fixed bypass, internal/default fallback and same-tab proxy ↔ bypass transitions; native Chromium Inspect captures set/clear/base restoration/isolation;",
        "- permanent Chromium and Firefox Action E2E read real tab IDs across System → Direct → Fixed proxy / Fixed bypass, internal/default fallback, same-tab proxy ↔ bypass and exact Switch → Fixed matched/default transitions; native Chromium Inspect captures set/clear/base restoration/isolation;",
        "audit E2E bullet",
    )
    text = replace_once(
        text,
        "- Switch, PAC, Virtual, attached Rule List, temporary-rule and external-control states still lack the complete original result trace;",
        "- Switch results into Direct/System, nested or attached Rule Lists, plus PAC, Virtual, temporary-rule and external-control states still lack the complete original result trace;",
        "audit remaining gap",
    )
    text = replace_once(
        text,
        "- repository-backed Direct/System/Fixed resolver;",
        "- repository-backed Direct/System/Fixed resolver plus strict exact Switch → Fixed matched/default reconstruction;",
        "audit source resolver",
    )
    old = """Clean Head `d201d203cd0fd64a14342414935a48c3c295e60c` passed all permanent gates after the durable global Action baseline, serialized profile-workflow initialization and temporary-file cleanup:

- CI `30671118969`;
- Browser E2E `30671118975`;
- Parity Documentation `30671118993`;
- Milestone 8 Visual Evidence `30671118990`."""
    text = replace_once(text, old, checkpoint_block(), "audit checkpoint")
    text = replace_once(
        text,
        "The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback and same-tab proxy ↔ bypass transitions. Native Inspect verifies tab-local set/clear/base restoration/isolation. Dedicated transaction `30670819111` also passed full verification and three consecutive focused Firefox toolbar transition journeys.",
        f"The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback, same-tab proxy ↔ bypass and exact Switch → Fixed matched/default transitions. Native Inspect verifies tab-local set/clear/base restoration/isolation. Dedicated transaction `{TRANSACTION}` passed full verification, Chromium Switch acceptance and three consecutive focused Firefox Switch journeys.",
        "audit browser checkpoint paragraph",
    )
    return text


def status(text: str) -> str:
    text = replace_once(
        text,
        "- the repository resolver covers Direct, System, Fixed proxy and Fixed bypass;",
        "- the repository resolver covers Direct, System, Fixed proxy/bypass and a strict exact Switch → Fixed matched/default slice;",
        "status resolver",
    )
    text = replace_once(
        text,
        "- permanent Chromium and Firefox Action E2E directly verify two tab IDs through the target Action API across System → Direct → Fixed proxy / Fixed bypass;",
        "- permanent Chromium and Firefox Action E2E directly verify real tab IDs across System → Direct → Fixed proxy / Fixed bypass and exact Switch → Fixed matched/default transitions;",
        "status E2E",
    )
    old = """Clean Head `d201d203cd0fd64a14342414935a48c3c295e60c` passed all permanent gates after the durable global Action baseline, serialized profile-workflow initialization and temporary-file cleanup:

- CI `30671118969`;
- Browser E2E `30671118975`;
- Parity Documentation `30671118993`;
- Milestone 8 Visual Evidence `30671118990`."""
    text = replace_once(text, old, checkpoint_block(), "status checkpoint")
    text = replace_once(
        text,
        "The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback and same-tab proxy ↔ bypass transitions. Native Inspect verifies target-tab set, current-page clear, base restoration and cross-tab isolation. Dedicated transaction `30670819111` also passed full verification and three consecutive focused Firefox toolbar transition journeys.",
        f"The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback, same-tab proxy ↔ bypass and exact Switch → Fixed matched/default transitions. Native Inspect verifies target-tab set, current-page clear, base restoration and cross-tab isolation. Dedicated transaction `{TRANSACTION}` passed full verification, Chromium Switch acceptance and three consecutive focused Firefox Switch journeys.",
        "status browser paragraph",
    )
    text = replace_once(
        text,
        "- complete Switch/PAC/Virtual/attached Rule List/temporary-rule/external-control result traces;",
        "- Switch results into Direct/System, nested or attached Rule Lists, plus PAC/Virtual/temporary-rule/external-control result traces;",
        "status remaining traces",
    )
    text = text.replace(
        "- headed toolbar pixels where browser-readable state is insufficient;\n- headed toolbar pixels where browser-readable state is insufficient;",
        "- headed toolbar pixels where browser-readable state is insufficient;",
        1,
    )
    text = replace_once(
        text,
        "Temporary rules, inclusive-profile traces and external-control transitions remain explicit missing inputs rather than permission to add simplified invented wording.",
        "Switch → Fixed matched/default traces are now an exact integrated input. Switch → Direct/System, nested/attached profiles, PAC/Virtual, temporary rules and external-control transitions remain explicit missing inputs rather than permission to add simplified invented wording.",
        "status runtime boundary",
    )
    text = replace_once(
        text,
        "- capture and map Switch/PAC default and matched results;",
        "- capture and map Switch → Direct/System, nested/attached results and PAC default/matched results;",
        "status work order switch",
    )
    text = replace_once(
        text,
        "Complete the remaining original result traces plus renderer fallback/pixel evidence where needed, then run focused Order 1 owner acceptance. No candidate is permitted.",
        "Complete the remaining Switch/PAC/Virtual/Rule List/temp/external result traces plus renderer fallback/pixel evidence where needed, then run focused Order 1 owner acceptance. No candidate is permitted.",
        "status next action",
    )
    return text


def delivery_graph(text: str) -> str:
    old = """Clean Head `d201d203cd0fd64a14342414935a48c3c295e60c` passed all permanent gates after the durable global Action baseline, serialized profile-workflow initialization and temporary-file cleanup:

- CI `30671118969`;
- Browser E2E `30671118975`;
- Parity Documentation `30671118993`;
- Milestone 8 Visual Evidence `30671118990`."""
    text = replace_once(text, old, checkpoint_block(), "delivery graph checkpoint")
    text = replace_once(
        text,
        "The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback and same-tab proxy ↔ bypass transitions. Native Inspect verifies tab-local set, current-page clear, base restoration and isolation. Dedicated transaction `30670819111` also passed full verification and three consecutive focused Firefox toolbar transition journeys.",
        f"The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback, same-tab proxy ↔ bypass and exact Switch → Fixed matched/default transitions. Native Inspect verifies tab-local set, current-page clear, base restoration and isolation. Dedicated transaction `{TRANSACTION}` passed full verification, Chromium Switch acceptance and three consecutive focused Firefox Switch journeys.",
        "delivery graph browser paragraph",
    )
    text = replace_once(
        text,
        "One background owner now drives a durable global baseline plus real per-tab System, Direct, Fixed proxy/bypass, internal/default fallback, same-tab transitions and Inspect set/clear/isolation; Switch/PAC/Virtual/Rule List/temp/external traces and owner acceptance remain open.",
        "One background owner now drives a durable global baseline plus real per-tab System, Direct, Fixed proxy/bypass, exact Switch→Fixed matched/default, internal/default fallback, same-tab transitions and Inspect set/clear/isolation; remaining Switch/PAC/Virtual/Rule List/temp/external traces and owner acceptance remain open.",
        "delivery graph KG icon",
    )
    return text


def original_graph(text: str) -> str:
    text = replace_once(
        text,
        "- clean Head：`d201d203cd0fd64a14342414935a48c3c295e60c`；CI `30671118969`、Browser E2E `30671118975`、Parity `30671118993`、Visual `30671118990` 全绿。",
        f"- clean Head：`{HEAD}`；CI `{RUNS['ci']}`、Browser E2E `{RUNS['browser']}`、Parity `{RUNS['parity']}`、Visual `{RUNS['visual']}` 全绿。",
        "original graph checkpoint",
    )
    text = replace_once(
        text,
        "- Chromium 与 Firefox 均直接读取每标签页 Action title、Badge、Popup，并通过 System → Direct → Fixed proxy / Fixed bypass、内部页／默认回退及同标签 proxy ↔ bypass 转换验收；历史原版证据固定于 Firefox `152.0.6`，Nex 永久门禁使用 runner 当前 Firefox。",
        "- Chromium 与 Firefox 均直接读取每标签页 Action title、Badge、Popup，并通过 System → Direct → Fixed proxy / Fixed bypass、严格 Switch → Fixed matched/default、内部页／默认回退及同标签状态转换验收；历史原版证据固定于 Firefox `152.0.6`，Nex 永久门禁使用 runner 当前 Firefox。",
        "original graph action acceptance",
    )
    text = replace_once(
        text,
        "- Chromium／Firefox 内部页与同标签 URL 转换、Chromium Inspect Action set/clear/base restoration/isolation 已完成自动验收；Switch/PAC/Virtual/Rule List/临时规则/外部控制完整 trace、真实渲染失败／像素证据和 owner PASS 仍未完成。",
        "- Chromium／Firefox 内部页与同标签 URL 转换、严格 Switch → Fixed matched/default、Chromium Inspect Action set/clear/base restoration/isolation 已完成自动验收；Switch → Direct/System、嵌套／附属 Rule List、PAC/Virtual/临时规则/外部控制完整 trace、真实渲染失败／像素证据和 owner PASS 仍未完成。",
        "original graph remaining trace",
    )
    return text


update("docs/MILESTONE_8_VERIFICATION_HEAD.md", verification)
update("docs/MILESTONE_8_SESSION_8_CHECKPOINT.md", session)
update("docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md", delivery)
update("docs/ACTIVE_PARITY_AUDIT_INDEX.md", audit)
update("docs/MILESTONE_8_STATUS.md", status)
update("docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md", delivery_graph)
update("docs/ORIGINAL_KNOWLEDGE_GRAPH.md", original_graph)
