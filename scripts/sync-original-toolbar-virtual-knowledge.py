from pathlib import Path

HEAD = "6747760e01572d47038ec4beba6dba10ef4f1f02"
CI = "30678329216"
BROWSER = "30678329237"
PARITY = "30678329224"
VISUAL = "30678329214"
TRANSACTION = "30678033747"
ORIGINAL_RUN = "30677618681"
ORIGINAL_ARTIFACT = "8811046002"
ORIGINAL_DIGEST = "sha256:f4485078f732e9d64294c13d2edd8cb09f26a3f1405dfa427f2d4072292ce2ed"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def update(path_name: str, replacements: list[tuple[str, str, str]]) -> None:
    path = Path(path_name)
    text = path.read_text(encoding="utf-8")
    for old, new, label in replacements:
        text = replace_once(text, old, new, f"{path_name}: {label}")
    path.write_text(text, encoding="utf-8")


checkpoint = f"""Clean Head `{HEAD}` passed all permanent gates after exact original immediate Virtual-to-Direct/Fixed integration and temporary-file cleanup:

- CI `{CI}`;
- Browser E2E `{BROWSER}`;
- Parity Documentation `{PARITY}`;
- Milestone 8 Visual Evidence `{VISUAL}`.

The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, Fixed proxy/bypass, exact Switch matched/default results into Direct/Fixed and exact immediate Virtual results into built-in Direct or one Fixed proxy/bypass target. The Virtual display preserves the original target suffix, including `[[Direct]]`, suppresses the Virtual default transition from details, uses the resolved target Badge and applies Direct/Fixed color inputs exactly. Dedicated transaction `{TRANSACTION}` passed full `pnpm verify`, Chromium Virtual Action acceptance and three consecutive focused Firefox Virtual journeys. Official original-package run `{ORIGINAL_RUN}` and Artifact `{ORIGINAL_ARTIFACT}` (`{ORIGINAL_DIGEST}`) fix the source/runtime contract."""

update(
    "docs/MILESTONE_8_VERIFICATION_HEAD.md",
    [
        (
            """Clean Head `0ffd09ad00d67b79c29a341a484f32d40c7d0122` passed all permanent gates after exact original Switch-to-Direct/Fixed trace integration and temporary-file cleanup:

- CI `30674564650`;
- Browser E2E `30674564634`;
- Parity Documentation `30674564648`;
- Milestone 8 Visual Evidence `30674564598`.

The permanent Browser E2E run passed the Chromium full journey, Chromium toolbar Action, Firefox full journey, the permanent focused Firefox toolbar Action job and native Chromium Inspect acceptance. Chromium and Firefox now directly verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, browser-internal/default fallback, same-tab transitions and exact no-attached-list Switch matched/default results into both built-in Direct and one Fixed proxy. The Switch result preserves the original multiline order, two-color state, localized result Badge and per-tab Popup. Native Inspect directly captures tab-local set, current-page clear, base-state restoration and cross-tab isolation. Dedicated transaction `30674297543` passed full verification, Chromium Switch-to-Direct Action acceptance and three consecutive focused Firefox Switch-to-Direct journeys.""",
            checkpoint,
            "checkpoint",
        ),
        (
            "Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy/bypass and exact Switch matched/default results into Direct or Fixed. Exact original package runtime evidence in `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md` fixes `[Direct]`, `(default)`, four-code-unit `Dire`, Direct result color and current Switch color; it also proves Switch → System is rejected by the original PAC runtime. Firefox 152.0.6 additionally verifies the historical original `about:blank` → committed web navigation path. Inspect no longer competes as a second title/Badge writer.",
            "Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy/bypass, exact Switch matched/default results into Direct or Fixed and exact immediate Virtual results into Direct or one Fixed proxy/bypass target. `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md` fixes the Switch contract; `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md` fixes the Virtual target suffix, `[[Direct]]`, detail suppression, resolved-target Badge and color inputs. Switch → System is rejected by the original PAC runtime. Firefox 152.0.6 additionally verifies the historical original `about:blank` → committed web navigation path. Inspect no longer competes as a second title/Badge writer.",
            "integration boundary",
        ),
        (
            "Still outside the verified slice are nested Switch/profile chains, attached Rule Lists, PAC/Virtual/temporary-rule/external-control traces, forced renderer fallback, headed toolbar pixels where browser-readable state is insufficient and repository-owner PASS. Switch → System is not an open parity feature because the original runtime rejects it.",
            "Still outside the verified slice are nested Switch/profile chains, nested Virtual and Virtual-to-inclusive/PAC targets, attached Rule Lists, PAC/temporary-rule/external-control traces, forced renderer fallback, headed toolbar pixels where browser-readable state is insufficient and repository-owner PASS. Switch → System is not an open parity feature because the original runtime rejects it.",
            "remaining boundary",
        ),
    ],
)

virtual_section = f"""## Exact original Virtual runtime and Nex integration

Official package workflow `{ORIGINAL_RUN}` directly called the original v3.5.0 `_actionForUrl` implementation and is preserved in `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md` (Artifact `{ORIGINAL_ARTIFACT}`, `{ORIGINAL_DIGEST}`):

- Virtual → Direct displays `Alias [[Direct]]`, uses the localized Direct description without a transition line, Badge `Dire` and Direct/Direct colors;
- Virtual → Fixed proxy displays `Alias [Target]`, preserves only the final PAC-result line, uses the target Badge and one Fixed color;
- Virtual → Fixed bypass preserves the target name/Badge, writes the bypass-to-Direct line and uses Direct outer plus Fixed inner color;
- the Virtual default transition to its immediate target is suppressed from details;
- direct original `addProfile` injection requires the post-create `rules: []` shape because Virtual reuses the Switch handler.

Product commit `1e38cff72e511beca810bdfbe7e02b0f07c6590d` adds only the source/runtime-certain immediate Virtual → Direct and Virtual → Fixed proxy/bypass shapes. Nested Virtual, Virtual → Switch/Rule List/PAC, temporary rules and external-control shapes remain fail-closed. Four focused resolver tests bring the unit total to `526`. Dedicated transaction `{TRANSACTION}` passed full `pnpm verify`, Chromium real Action acceptance and three consecutive Firefox focused Action journeys. Clean Head `{HEAD}` passed CI `{CI}`, Browser E2E `{BROWSER}`, Parity Documentation `{PARITY}` and Milestone 8 Visual Evidence `{VISUAL}`.

"""
update(
    "docs/MILESTONE_8_SESSION_8_CHECKPOINT.md",
    [
        (
            "## Remaining Order 1 work\n",
            virtual_section + "## Remaining Order 1 work\n",
            "Virtual section",
        ),
        (
            "- Virtual and attached Rule List traces;",
            "- nested Virtual targets, Virtual → inclusive/PAC targets and attached Rule List traces;",
            "remaining Virtual",
        ),
        (
            "1. Preserve and integrate the remaining original `matchProfile.results` traces for nested Switch/profile chains, attached Rule Lists, PAC/Virtual/temporary-rule/external-control states.",
            "1. Preserve and integrate the remaining original `matchProfile.results` traces for nested Switch/profile chains, nested/Virtual-to-inclusive targets, attached Rule Lists, PAC/temporary-rule/external-control states.",
            "next gate",
        ),
    ],
)

update(
    "docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md",
    [
        (
            "- Switch-result runtime evidence: `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md`.\n",
            "- Switch-result runtime evidence: `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md`.\n- Virtual-result runtime evidence: `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md`.\n",
            "evidence list",
        ),
        (
            "Resolver coverage is verified for Direct, System, Fixed proxy/bypass and exact no-attached-list Switch matched/default results into built-in Direct or one Fixed proxy; Inspect no longer competes as a second title/Badge writer.",
            "Resolver coverage is verified for Direct, System, Fixed proxy/bypass, exact no-attached-list Switch matched/default results into built-in Direct or one Fixed proxy, and exact immediate Virtual results into Direct or one Fixed proxy/bypass target; Inspect no longer competes as a second title/Badge writer.",
            "resolver summary",
        ),
        (
            """Clean Head `0ffd09ad00d67b79c29a341a484f32d40c7d0122` passed all permanent gates after exact original Switch-to-Direct/Fixed trace integration and temporary-file cleanup:

- CI `30674564650`;
- Browser E2E `30674564634`;
- Parity Documentation `30674564648`;
- Milestone 8 Visual Evidence `30674564598`.

The permanent Browser E2E run passed Chromium full/toolbar journeys, Firefox full/focused-toolbar journeys and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback, same-tab transitions and exact Switch matched/default results into Direct/Fixed. Native Inspect verifies tab-local set, current-page clear, base Action restoration and isolation. Dedicated transaction `30674297543` passed full verification, Chromium Switch-to-Direct Action acceptance and three consecutive focused Firefox Switch-to-Direct journeys.""",
            checkpoint,
            "checkpoint",
        ),
        (
            "4. current source-certain resolver coverage includes Direct, System, Fixed proxy/bypass and strict Switch matched/default transitions directly into built-in Direct or one Fixed proxy; nested/attached/PAC/Virtual shapes remain unresolved/default, while Switch → System is original-invalid.",
            "4. current source-certain resolver coverage includes Direct, System, Fixed proxy/bypass, strict Switch matched/default transitions directly into built-in Direct or one Fixed proxy, and immediate Virtual → Direct/Fixed proxy/bypass; nested/attached/PAC/Virtual-to-inclusive shapes remain unresolved/default, while Switch → System is original-invalid.",
            "trace consequence",
        ),
        (
            "RES[Repository resolver: Direct / System / Fixed + exact Switch-to-Direct-or-Fixed] --> COORD",
            "RES[Repository resolver: Direct / System / Fixed + exact Switch + immediate Virtual] --> COORD",
            "graph resolver",
        ),
        (
            "INCLUSIVE[Remaining Switch / PAC / Virtual / attached Rule List] -. full trace open .-> COORD",
            "INCLUSIVE[Remaining nested Switch / nested Virtual / PAC / attached Rule List] -. full trace open .-> COORD",
            "graph remaining",
        ),
        (
            "- nested Switch/profile chains, attached Rule Lists, plus PAC, Virtual, temporary-rule and external-control states still need the complete original `matchProfile.results` display trace; Switch → System is rejected by the original runtime;",
            "- nested Switch/profile chains, nested Virtual and Virtual-to-inclusive/PAC targets, attached Rule Lists, PAC, temporary-rule and external-control states still need the complete original `matchProfile.results` display trace; Switch → System is rejected by the original runtime;",
            "remaining gaps",
        ),
        (
            "| `TB-008` | Virtual shows Virtual name plus resolved target                       | source                             | route activation exists; toolbar mapping absent                                                                                                                                                            | `MISSING_IN_NEX`      | capture original and implement nested effective target state                 |",
            "| `TB-008` | Virtual shows Virtual name plus resolved target                       | source; exact Virtual runtime      | original runtime plus Chromium/Firefox Nex E2E verify immediate Virtual → Direct and Virtual → Fixed proxy/bypass title, details, target Badge, Popup and color inputs; nested/inclusive/PAC targets remain open | `PARTIAL`             | extend to nested/inclusive/PAC targets, headed pixels where needed and owner review |",
            "TB-008",
        ),
        (
            "4. Virtual and attached Rule List states;",
            "4. nested Virtual, Virtual-to-inclusive/PAC and attached Rule List states;",
            "unknown Virtual",
        ),
        (
            "- Fixed, Switch/PAC, Virtual, Rule List, temporary-rule, Inspect and external-control runtime states;",
            "- remaining Fixed/PAC, nested Virtual, Rule List, temporary-rule, Inspect and external-control runtime states;",
            "TO-01 remaining",
        ),
        (
            "1. Preserve and integrate the original `matchProfile.results` trace data needed for Switch/PAC/Virtual/attached Rule List/temporary-rule details.",
            "1. Preserve and integrate the original `matchProfile.results` trace data needed for nested Switch/Virtual, PAC, attached Rule List and temporary-rule details.",
            "next action",
        ),
    ],
)

update(
    "docs/ACTIVE_PARITY_AUDIT_INDEX.md",
    [
        (
            "Resolver coverage now includes Direct/System/Fixed and strict exact Switch matched/default results into Direct or one Fixed proxy.",
            "Resolver coverage now includes Direct/System/Fixed, strict exact Switch matched/default results into Direct or one Fixed proxy, and exact immediate Virtual results into Direct or one Fixed proxy/bypass target.",
            "current resolver",
        ),
        (
            "Remaining inclusive traces and owner acceptance remain open.",
            "Nested Virtual/inclusive, Rule List, PAC, temporary-rule/external-control traces and owner acceptance remain open.",
            "current remaining",
        ),
        (
            "remaining Switch/PAC/Virtual/Rule List/temp/external traces and owner PASS remain open",
            "remaining nested Switch/Virtual, PAC/Rule List/temp/external traces and owner PASS remain open",
            "order row",
        ),
        (
            "Firefox evidence is durable in `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md` and records:",
            f"""Virtual-result runtime evidence is durable in `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md` and records official Chromium workflow `{ORIGINAL_RUN}`, Artifact `{ORIGINAL_ARTIFACT}` and `{ORIGINAL_DIGEST}`:

- exact immediate Virtual → Direct `[[Direct]]`, Direct details and `Dire` Badge;
- exact Virtual → Fixed proxy and bypass details;
- target-derived Badge and color inputs;
- suppressed Virtual default transition line.

Firefox evidence is durable in `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md` and records:""",
            "Virtual evidence",
        ),
        (
            "- Virtual and attached Rule List state;",
            "- nested Virtual, Virtual-to-inclusive/PAC and attached Rule List state;",
            "unknown Virtual",
        ),
        (
            "- the repository-backed resolver covers Direct, System, Fixed proxy/bypass and exact Switch matched/default transitions directly into Direct or one Fixed proxy;",
            "- the repository-backed resolver covers Direct, System, Fixed proxy/bypass, exact Switch matched/default transitions directly into Direct or one Fixed proxy, and exact immediate Virtual → Direct/Fixed proxy/bypass;",
            "runtime resolver",
        ),
        (
            "- nested Switch/profile chains, attached Rule Lists, plus PAC, Virtual, temporary-rule and external-control states still lack the complete original result trace; Switch → System is original-invalid;",
            "- nested Switch/profile chains, nested Virtual and Virtual-to-inclusive/PAC targets, attached Rule Lists, PAC, temporary-rule and external-control states still lack the complete original result trace; Switch → System is original-invalid;",
            "remaining gap",
        ),
        (
            "- repository-backed Direct/System/Fixed resolver plus strict exact Switch matched/default reconstruction into Direct/Fixed;",
            "- repository-backed Direct/System/Fixed resolver plus strict exact Switch matched/default reconstruction into Direct/Fixed and immediate Virtual reconstruction into Direct/Fixed proxy/bypass;",
            "source implementation",
        ),
        (
            """Clean Head `0ffd09ad00d67b79c29a341a484f32d40c7d0122` passed all permanent gates after exact original Switch-to-Direct/Fixed trace integration and temporary-file cleanup:

- CI `30674564650`;
- Browser E2E `30674564634`;
- Parity Documentation `30674564648`;
- Milestone 8 Visual Evidence `30674564598`.

The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback, same-tab transitions and exact Switch matched/default results into Direct/Fixed. Native Inspect verifies tab-local set/clear/base restoration/isolation. Dedicated transaction `30674297543` passed full verification, Chromium Switch-to-Direct acceptance and three consecutive focused Firefox Switch-to-Direct journeys.""",
            checkpoint,
            "last green",
        ),
        (
            "- Switch-result runtime evidence: `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md`.",
            "- Switch-result runtime evidence: `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md`;\n- Virtual-result runtime evidence: `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md`.",
            "evidence list",
        ),
    ],
)

update(
    "docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md",
    [
        (
            """Clean Head `0ffd09ad00d67b79c29a341a484f32d40c7d0122` passed all permanent gates after exact original Switch-to-Direct/Fixed trace integration and temporary-file cleanup:

- CI `30674564650`;
- Browser E2E `30674564634`;
- Parity Documentation `30674564648`;
- Milestone 8 Visual Evidence `30674564598`.

The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback, same-tab transitions and exact Switch matched/default results into Direct/Fixed. Native Inspect verifies tab-local set, current-page clear, base restoration and isolation. Dedicated transaction `30674297543` passed full verification, Chromium Switch-to-Direct acceptance and three consecutive focused Firefox Switch-to-Direct journeys.""",
            checkpoint,
            "checkpoint",
        ),
        (
            "One background owner now drives a durable global baseline plus real per-tab System, Direct, Fixed proxy/bypass, exact Switch→Direct/Fixed matched/default, internal/default fallback, same-tab transitions and Inspect set/clear/isolation; nested/attached/PAC/Virtual/Rule List/temp/external traces and owner acceptance remain open; Switch → System is original-invalid.",
            "One background owner now drives a durable global baseline plus real per-tab System, Direct, Fixed proxy/bypass, exact Switch→Direct/Fixed matched/default, exact immediate Virtual→Direct/Fixed proxy/bypass, internal/default fallback, same-tab transitions and Inspect set/clear/isolation; nested/attached/PAC/Virtual-to-inclusive/Rule List/temp/external traces and owner acceptance remain open; Switch → System is original-invalid.",
            "defect register",
        ),
    ],
)

update(
    "docs/ORIGINAL_KNOWLEDGE_GRAPH.md",
    [
        (
            "- clean Head：`0ffd09ad00d67b79c29a341a484f32d40c7d0122`；CI `30674564650`、Browser E2E `30674564634`、Parity `30674564648`、Visual `30674564598` 全绿。",
            f"- clean Head：`{HEAD}`；CI `{CI}`、Browser E2E `{BROWSER}`、Parity `{PARITY}`、Visual `{VISUAL}` 全绿。",
            "checkpoint",
        ),
        (
            "- Chromium 与 Firefox 均直接读取每标签页 Action title、Badge、Popup，并通过 System → Direct → Fixed proxy / Fixed bypass、严格 Switch → Direct/Fixed matched/default、内部页／默认回退及同标签状态转换验收；历史原版证据固定于 Firefox `152.0.6`，Nex 永久门禁使用 runner 当前 Firefox。",
            "- Chromium 与 Firefox 均直接读取每标签页 Action title、Badge、Popup，并通过 System → Direct → Fixed proxy / Fixed bypass、严格 Switch → Direct/Fixed matched/default、Immediate Virtual → Direct/Fixed proxy/bypass、内部页／默认回退及同标签状态转换验收；历史原版证据固定于 Firefox `152.0.6`，Nex 永久门禁使用 runner 当前 Firefox。",
            "runtime summary",
        ),
        (
            "- Chromium／Firefox 内部页与同标签 URL 转换、严格 Switch → Direct/Fixed matched/default、Chromium Inspect Action set/clear/base restoration/isolation 已完成自动验收；Switch → System 已由原版运行时证实为非法结果，嵌套／附属 Rule List、PAC/Virtual/临时规则/外部控制完整 trace、真实渲染失败／像素证据和 owner PASS 仍未完成。",
            f"- Chromium／Firefox 内部页与同标签 URL 转换、严格 Switch → Direct/Fixed matched/default、Immediate Virtual → Direct/Fixed proxy/bypass、Chromium Inspect Action set/clear/base restoration/isolation 已完成自动验收；原版 Virtual 合同见 `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md`（run `{ORIGINAL_RUN}`、Artifact `{ORIGINAL_ARTIFACT}`）；Switch → System 已由原版运行时证实为非法结果，嵌套Virtual／附属 Rule List、PAC/临时规则/外部控制完整 trace、真实渲染失败／像素证据和 owner PASS 仍未完成。",
            "remaining summary",
        ),
    ],
)

update(
    "docs/MILESTONE_8_STATUS.md",
    [
        (
            "- the repository resolver covers Direct, System, Fixed proxy/bypass and strict exact Switch matched/default results into Direct or one Fixed proxy;",
            "- the repository resolver covers Direct, System, Fixed proxy/bypass, strict exact Switch matched/default results into Direct or one Fixed proxy, and exact immediate Virtual results into Direct or one Fixed proxy/bypass target;",
            "resolver",
        ),
        (
            "- permanent Chromium and Firefox Action E2E directly verify real tab IDs across System → Direct → Fixed proxy/bypass and exact Switch matched/default results into Direct/Fixed;",
            "- permanent Chromium and Firefox Action E2E directly verify real tab IDs across System → Direct → Fixed proxy/bypass, exact Switch matched/default results into Direct/Fixed and exact immediate Virtual → Direct/Fixed proxy/bypass results;",
            "E2E summary",
        ),
        (
            """Clean Head `0ffd09ad00d67b79c29a341a484f32d40c7d0122` passed all permanent gates after exact original Switch-to-Direct/Fixed trace integration and temporary-file cleanup:

- CI `30674564650`;
- Browser E2E `30674564634`;
- Parity Documentation `30674564648`;
- Milestone 8 Visual Evidence `30674564598`.

The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, simultaneous Fixed proxy / Fixed bypass, internal/default fallback, same-tab transitions and exact Switch matched/default results into Direct/Fixed. Native Inspect verifies target-tab set, current-page clear, base restoration and cross-tab isolation. Dedicated transaction `30674297543` passed full verification, Chromium Switch-to-Direct acceptance and three consecutive focused Firefox Switch-to-Direct journeys.""",
            checkpoint,
            "checkpoint",
        ),
        (
            "- nested Switch/profile chains, attached Rule Lists, plus PAC/Virtual/temporary-rule/external-control result traces; Switch → System is rejected by the original runtime;",
            "- nested Switch/profile chains, nested Virtual and Virtual-to-inclusive/PAC targets, attached Rule Lists, PAC/temporary-rule/external-control result traces; Switch → System is rejected by the original runtime;",
            "still open",
        ),
        (
            "Switch matched/default results into Direct and Fixed are now exact integrated inputs backed by official runtime evidence. Switch → System is original-invalid. Nested/attached profile chains, PAC/Virtual, temporary rules and external-control transitions remain explicit missing inputs rather than permission to add simplified invented wording.",
            "Switch matched/default results into Direct and Fixed plus immediate Virtual results into Direct/Fixed proxy/bypass are exact integrated inputs backed by official runtime evidence. Switch → System is original-invalid. Nested/attached profile chains, nested Virtual/Virtual-to-inclusive/PAC, temporary rules and external-control transitions remain explicit missing inputs rather than permission to add simplified invented wording.",
            "runtime boundary",
        ),
        (
            "- capture Virtual and attached Rule List results;",
            "- capture nested Virtual/Virtual-to-inclusive targets and attached Rule List results;",
            "work order",
        ),
        (
            "Complete the remaining Switch/PAC/Virtual/Rule List/temp/external result traces plus renderer fallback/pixel evidence where needed, then run focused Order 1 owner acceptance. No candidate is permitted.",
            "Complete the remaining nested Switch/Virtual, PAC/Rule List/temp/external result traces plus renderer fallback/pixel evidence where needed, then run focused Order 1 owner acceptance. No candidate is permitted.",
            "current next action",
        ),
    ],
)
