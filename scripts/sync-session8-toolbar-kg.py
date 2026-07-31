from pathlib import Path


FILES = [
    Path("docs/MILESTONE_8_VERIFICATION_HEAD.md"),
    Path("docs/MILESTONE_8_STATUS.md"),
    Path("docs/ACTIVE_PARITY_AUDIT_INDEX.md"),
    Path("docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md"),
    Path("docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md"),
    Path("docs/ORIGINAL_KNOWLEDGE_GRAPH.md"),
    Path("docs/MILESTONE_8_SESSION_8_CHECKPOINT.md"),
]

OLD_HEAD = "f782f802a78ace277de938bdd4dfed2bf6315951"
NEW_HEAD = "db1b10ebe6d41637246d777e34b1afd4eb6ca170"
RUNS = {
    "30660824011": "30666472249",
    "30660824007": "30666473257",
    "30660824047": "30666472570",
    "30660823998": "30666472029",
}


def replace_required(text: str, old: str, new: str, label: str, minimum: int = 1) -> str:
    count = text.count(old)
    if count < minimum:
        raise SystemExit(f"{label}: expected at least {minimum} match(es), found {count}")
    return text.replace(old, new)


for path in FILES:
    text = path.read_text(encoding="utf-8")
    if path.name != "MILESTONE_8_SESSION_8_CHECKPOINT.md":
        text = replace_required(text, OLD_HEAD, NEW_HEAD, f"{path}: checkpoint Head")
        for old_run, new_run in RUNS.items():
            text = replace_required(text, old_run, new_run, f"{path}: run {old_run}")

    text = text.replace(
        "passed all permanent gates after the top-level navigation refresh fix and temporary-file cleanup",
        "passed all permanent gates after the durable global Action baseline, serialized profile-workflow initialization and temporary-file cleanup",
    )
    text = text.replace(
        "The permanent Browser E2E run passed Chromium Action, Firefox Action and native Chromium Inspect acceptance. Its Firefox job ran Firefox `152.0.6` and proved that newly opened tabs receive System, Direct and Fixed proxy / Fixed bypass Action state instead of remaining at the manifest loading title. Firefox diagnostics Artifact `8805083911` has digest `sha256:198cc198a90a39a1def2d93d416f6f0c3b66a0f90c70eff6f7ea633d069dc2b9`.",
        "The permanent Browser E2E run passed Chromium Action, Firefox Action and native Chromium Inspect acceptance. Firefox directly verified System, Direct and simultaneous Fixed proxy / Fixed bypass state on two real tabs. Before cleanup, the same product transaction also passed one complete Firefox journey and ten consecutive command-driven focused Firefox Action journeys.",
    )

    if path.name == "MILESTONE_8_VERIFICATION_HEAD.md":
        text = replace_required(
            text,
            "The top-level navigation listener only calls the existing coordinator and is protected by the exact manifest permission audit.",
            "The runtime now establishes a browser-level Action baseline before per-tab overrides, serializes profile-workflow commands so concurrent startup reads cannot observe half-initialized proxy state, and repairs missing persisted proxy runtime from the saved startup route. Top-level navigation remains an exact-guarded coordinator input rather than a second writer.",
            "verification integration summary",
        )
        text = text.replace(
            "This is an exact engineering and evidence checkpoint, not a release-completeness Head.\n\nThis is an exact engineering and evidence checkpoint, not a release-completeness Head. It proves the mapped toolbar slice and permanent gates only.",
            "This is an exact engineering and evidence checkpoint, not a release-completeness Head. It proves the mapped toolbar slice and permanent gates only.",
        )
        text = replace_required(
            text,
            "The background now registers one real browser Action writer composed from the repository resolver, per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Clean installation initializes to System, existing state follows restore/recovery, successful activation refreshes all tabs, and top-level navigation commits provide final URLs without creating another writer.",
            "The background now registers one real browser Action writer composed from the repository resolver, global/per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Clean installation initializes to System, profile-workflow commands are serialized through activation and Action follow-up, missing proxy runtime is repaired from the saved startup route, and top-level navigation commits provide final URLs without creating another writer.",
            "verification confirmed boundary",
        )

    if path.name == "MILESTONE_8_STATUS.md":
        text = replace_required(
            text,
            "- the per-tab coordinator handles tab creation, URL updates, activation, serialization, stale-result suppression, lifecycle invalidation, cache invalidation and all-tab refresh; a top-level navigation-commit listener supplies final URLs when Firefox tab events are incomplete;\n- clean installations proactively initialize to the original System route without opening UI; existing state follows restore/recovery without duplicate activation;",
            "- the coordinator establishes a browser-level Action baseline, then handles tab creation, URL updates, activation, serialization, stale-result suppression, lifecycle invalidation, cache invalidation and all-tab refresh; a top-level navigation-commit listener supplies final URLs when Firefox tab events are incomplete;\n- clean installations proactively initialize to the original System route without opening UI; profile-workflow commands are serialized so concurrent reads cannot observe half-initialized startup, and missing proxy runtime is repaired from the saved startup route;",
            "status runtime bullets",
        )
        text = replace_required(
            text,
            "Permanent Nex Firefox E2E uses WebDriver BiDi for extension-page navigation and directly verifies Action title/Badge/Popup. It has passed on runner Firefox 153.0 and, at the current clean checkpoint, Firefox 152.0.6. Firefox 152.0.6 exposed that a WebDriver-created tab can begin at `about:blank` without a useful follow-up tab URL event; top-level `webNavigation.onCommitted` now supplies the final URL and wakes the background while preserving the single Action writer. Historical original-package evidence remains fixed to its separate Firefox 152.0.6 audit.",
            "Permanent Nex Firefox E2E uses WebDriver BiDi for extension-page navigation and directly verifies Action title/Badge/Popup. Diagnosis showed that concurrent workflow reads could observe a persisted ProfileSpec before initial System activation and Action follow-up completed. The runtime now serializes all profile-workflow commands, awaits activation follow-up and repairs missing proxy runtime on startup. Top-level `webNavigation.onCommitted` remains a final-URL coordinator input. Historical original-package evidence remains fixed to its separate Firefox 152.0.6 audit.",
            "status Firefox runtime boundary",
        )

    if path.name == "ACTIVE_PARITY_AUDIT_INDEX.md":
        text = replace_required(
            text,
            "- Current implementation registers one background owner for real browser Action writes and composes the repository resolver, per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Startup proactively initializes clean installations to the original System route and refreshes all tabs after activation or recovery. Top-level `webNavigation.onCommitted` supplies the final navigation URL when Firefox tab events expose only `about:blank` or omit a useful URL.",
            "- Current implementation registers one background owner for real browser Action writes and composes the repository resolver, global/per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Startup establishes a browser-level System/Direct Action baseline, serializes profile-workflow commands through activation follow-up, repairs missing proxy runtime from the saved startup route and refreshes all tabs after activation or recovery. Top-level `webNavigation.onCommitted` remains a final-URL coordinator input.",
            "active index repository state",
        )
        text = text.replace(
            "Background single-writer runtime, original System startup, Direct/System/Fixed resolver, top-level navigation refresh, Inspect overlay and real two-tab Action state are verified in both targets",
            "Background single-writer runtime, durable global Action baseline, serialized original System startup, Direct/System/Fixed resolver, top-level navigation refresh, Inspect overlay and real two-tab Action state are verified in both targets",
        )
        text = replace_required(
            text,
            "- the race-safe coordinator owns tab creation, URL updates, activation, all-tab refresh, stale-result suppression and cache invalidation; top-level `webNavigation.onCommitted` supplies the committed URL when Firefox tab events are incomplete;\n- clean installations proactively initialize to System without opening Popup or Options; existing state follows restore/recovery without duplicate activation;",
            "- the race-safe coordinator owns the global baseline, tab creation, URL updates, activation, all-tab refresh, stale-result suppression and cache invalidation; top-level `webNavigation.onCommitted` supplies the committed URL when Firefox tab events are incomplete;\n- clean installations proactively initialize to System without opening Popup or Options; command serialization prevents half-initialized concurrent reads, and missing proxy runtime is repaired from the saved startup route;",
            "active index runtime bullets",
        )
        text = text.replace(
            "- proactive System initialization and ordered restore/recovery;",
            "- proactive System initialization, serialized workflow commands and missing-runtime recovery;",
        )

    if path.name == "DELIVERY_ORDER_01_TOOLBAR_STATE.md":
        text = replace_required(
            text,
            "The current Nex branch now registers one background owner for all real browser Action writes. The owner composes the repository-backed resolver, race-safe per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Background startup proactively initializes a clean installation to the original System route, restores existing state without duplicate activation and refreshes all tabs after successful activation or recovery. Tab creation/update/activation remain coordinator inputs; top-level `webNavigation.onCommitted` supplies the final URL when Firefox tab events expose only `about:blank` or omit a useful URL. Resolver coverage is verified for Direct, System, Fixed proxy and Fixed bypass results; Inspect no longer competes as a second title/Badge writer.",
            "The current Nex branch now registers one background owner for all real browser Action writes. The owner composes the repository-backed resolver, race-safe global/per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Background startup proactively initializes a clean installation to the original System route, serializes concurrent workflow commands through activation and Action follow-up, repairs missing proxy runtime from the saved startup route and refreshes all tabs after successful activation or recovery. Tab creation/update/activation and top-level `webNavigation.onCommitted` remain coordinator inputs. Resolver coverage is verified for Direct, System, Fixed proxy and Fixed bypass results; Inspect no longer competes as a second title/Badge writer.",
            "delivery current runtime summary",
        )
        text = text.replace(
            "COORD[Per-tab coordinator]",
            "COORD[Global / per-tab coordinator]",
        )
        text = text.replace(
            "NOTICE[Successful activation / startup notification]",
            "NOTICE[Serialized activation / startup notification]",
        )
        text = text.replace(
            "EXEC --> ACTION[Real per-tab browser Action]",
            "EXEC --> ACTION[Real global and per-tab browser Action]",
        )

    if path.name == "ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md":
        text = replace_required(
            text,
            "Firefox 152.0.6 proved the top-level `webNavigation.onCommitted` fallback needed when tab events expose only `about:blank` or no useful final URL. The listener feeds the existing coordinator only; the exact manifest guard requires `webNavigation` and still rejects required global host access.",
            "Firefox diagnosis proved a second startup boundary: concurrent workflow reads could observe a persisted ProfileSpec before initial System activation and Action follow-up completed. Profile-workflow commands are now serialized, activation follow-up is awaited and missing proxy runtime is repaired from the saved startup route. Top-level `webNavigation.onCommitted` remains an exact-guarded coordinator input and required global host access remains forbidden.",
            "delivery KG checkpoint diagnosis",
        )
        text = text.replace(
            "One background owner now drives real per-tab System, Direct, Fixed proxy/bypass and Inspect-overlay state",
            "One background owner now drives a durable global baseline plus real per-tab System, Direct, Fixed proxy/bypass and Inspect-overlay state",
        )

    if path.name == "ORIGINAL_KNOWLEDGE_GRAPH.md":
        text = replace_required(
            text,
            "- Firefox 152.0.6 暴露：WebDriver 新标签可能先停在 `about:blank`，随后不给 `tabs` 监听器可用的最终 URL，令 Action 保留 manifest loading title。\n- Nex 使用顶层 `webNavigation.onCommitted` 取得最终 URL并唤醒后台；该监听器只调用现有 coordinator，不成为第二个 Action writer。",
            "- Firefox 诊断进一步暴露初始化竞态：并发 `get` 可在 ProfileSpec 已保存、System 激活及 Action follow-up 尚未完成时观察到空 runtime，令全局 Action 保留 manifest loading title。\n- Nex 现在串行化 profile-workflow 命令、等待激活后的 Action 刷新，并在已保存配置但代理 runtime 缺失时按 startup route 补激活；顶层 `webNavigation.onCommitted` 继续只作为 coordinator 的最终 URL 输入。",
            "original KG Firefox diagnosis",
        )
        text = text.replace(
            "- 该兼容修复只保证原版可观察的“已导航标签必须得到当前状态”，不是新增原版概念。",
            "- 全局基线、命令串行化与缺失 runtime 恢复只保证原版可观察的启动／标签状态一致性，不新增原版概念。",
        )

    if path.name == "MILESTONE_8_SESSION_8_CHECKPOINT.md":
        text = replace_required(
            text,
            "The bot-authored cleanup Head produced `action_required` rather than executed permanent PR gates. This checkpoint is the authenticated trigger commit for the same product tree plus this record. The exact permanent CI, Browser E2E, Parity Documentation and Milestone 8 Visual Evidence results must be recorded only after they complete on this Head.",
            "Authenticated clean checkpoint `db1b10ebe6d41637246d777e34b1afd4eb6ca170` passed all four permanent gates: CI `30666472249`, Browser E2E `30666473257`, Parity Documentation `30666472570` and Milestone 8 Visual Evidence `30666472029`. Browser E2E passed Firefox, Chromium toolbar Action and native Chromium Inspect jobs. This remains slice-level engineering evidence only.",
            "Session 8 verification completion",
        )
        text = text.replace(
            "1. Require all four permanent gates on this authenticated clean checkpoint.\n2. Synchronize the authoritative knowledge graph and PR description to the exact successful Head and run IDs.\n3. Continue with internal-page, same-tab transition and direct Inspect Action acceptance without increasing progress until their acceptance gates close.",
            "1. Synchronize the authoritative knowledge graph and PR description to the exact successful Head and run IDs.\n2. Continue with internal-page, same-tab transition and direct Inspect Action acceptance.\n3. Keep progress at 47% / 35% until their real-browser and owner-acceptance gates close.",
        )

    path.write_text(text, encoding="utf-8")
