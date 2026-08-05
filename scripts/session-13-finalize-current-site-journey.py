from pathlib import Path
import re

VERIFIED_HEAD = "d63cd181ce68e5176c29a3fb8d8a3c59cc2018a2"
BROWSER_RUN = "31015030843"
POLICY_JOB = "92336754415"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label} marker mismatch: {count}")
    return text.replace(old, new, 1)


session_path = Path("docs/SESSION_13_KNOWLEDGE_GRAPH.md")
session = session_path.read_text(encoding="utf-8")
session = replace_once(
    session,
    "- Current state: `02S_POLICY_PROBE_VERIFIED_PENDING_PERMANENT_GATE`.",
    "- Current state: `SESSION_13_CURRENT_SITE_JOURNEY_VERIFIED`.",
    "Session state",
)
session = replace_once(
    session,
    "      └─ browser-owned/policy state           probe verified; permanent gate pending",
    "      └─ browser-owned/policy state           verified by 02S permanent gate",
    "Session graph policy state",
)
session = replace_once(
    session,
    "- Stable verified evidence Head: `49bad8aa7551e4bb6c5eabde2c8bdf375c2fea75`.\n- All six permanent workflows passed on the stable verified evidence Head.",
    "- 02R stable evidence Head: `49bad8aa7551e4bb6c5eabde2c8bdf375c2fea75`.\n- Permanent Firefox policy-owned Popup gate commit: `38861967438435a60b2ddbfc43b868716725e295`.\n- Complete current-site journey verified Head: `d63cd181ce68e5176c29a3fb8d8a3c59cc2018a2`.\n- All six permanent workflows passed on the complete current-site journey Head; Browser E2E contained four successful isolated jobs.",
    "Session execution record",
)
session = replace_once(
    session,
    "Head `49bad8aa7551e4bb6c5eabde2c8bdf375c2fea75` proves:",
    "Head `d63cd181ce68e5176c29a3fb8d8a3c59cc2018a2` proves:",
    "Session acceptance head",
)
session = replace_once(
    session,
    "- Firefox waits for the exact local current-site URL and completed tab state before Popup assertions.\n\nThis acceptance closes only 02Q and the reproducible 02R `app`/external-profile surfaces. It does not establish policy/browser-owned parity and does not increase project progress by itself.",
    "- Firefox waits for the exact local current-site URL and completed tab state before Popup assertions.\n- Firefox enterprise Locked Proxy returns native `not_controllable`, maps to `reason=policy`, and renders the blocked Popup in an isolated permanent Browser E2E job.\n- all experimental policy workflows and the unsuccessful Chromium probe were removed before exact-Head acceptance.\n\nThis acceptance closes the Session 13 current-site Popup journey: 02Q expanded actions, 02R app/external-profile, and 02S policy/browser-owned. It does not close the wider Popup/Options journey and does not increase project progress by itself.",
    "Session acceptance scope",
)
session = replace_once(
    session,
    "- `reason=policy` / browser-owned remains OPEN; unit source mapping is not promoted to product evidence.",
    "- `reason=policy` / browser-owned is verified separately by 02S using a real Firefox enterprise Locked Proxy policy; the proof is browser-native, not a mocked adapter.",
    "Session 02R boundary",
)
session = re.sub(
    r"## Remaining Session 13 order\n\n1\. integrate the isolated Firefox locked-policy job into permanent Browser E2E;\n2\. remove Chromium/Firefox one-shot probe workflows and the unsuccessful Chromium probe script;\n3\. verify all six permanent workflows on one clean exact Head;\n4\. reassess the complete Popup current-site journey without scheduling owner retest\.",
    """## Remaining Session 13 order

1. treat the current-site Popup journey as a verified bounded slice;
2. reassess the wider Popup journey and select the next original-facing surface from the project outline;
3. keep owner retest, merge and release prohibited until the parent Order 1 gate materially advances.""",
    session,
    count=1,
)
session = replace_once(
    session,
    "- This closes the evidentiary feasibility question. Acceptance remains pending until the isolated policy job is part of permanent Browser E2E and one clean exact Head passes all six workflows.",
    f"- Permanent Browser E2E run `{BROWSER_RUN}`, isolated job `{POLICY_JOB}`, passed on exact Head `{VERIFIED_HEAD}`; all six permanent workflows were green on the same Head.",
    "Session 02S final state",
)
session_path.write_text(session, encoding="utf-8")

s_path = Path("docs/AUDIT_EVIDENCE_02S_POPUP_POLICY_OWNERSHIP.md")
s_text = s_path.read_text(encoding="utf-8")
s_text = replace_once(
    s_text,
    "- Browser E2E will run the test in an isolated Firefox job after installing a locked enterprise Proxy policy.",
    "- Browser E2E runs the test in an isolated Firefox job after installing a locked enterprise Proxy policy.",
    "02S permanent gate tense",
)
s_text = replace_once(
    s_text,
    "- policy/browser-owned runtime surface: PROBE VERIFIED.\n- permanent workflow integration: PENDING exact-Head verification.\n- Session 13 current-site Popup journey is not declared complete until one clean Head passes all six permanent workflows with this new job.",
    f"- policy/browser-owned runtime surface: VERIFIED.\n- permanent workflow integration: VERIFIED on exact Head `{VERIFIED_HEAD}`.\n- Browser E2E run `{BROWSER_RUN}`, isolated policy job `{POLICY_JOB}`, passed; the other three Browser E2E jobs and the remaining five permanent workflows also passed on the same Head.\n- Session 13 current-site Popup journey: VERIFIED as a bounded slice.",
    "02S state",
)
s_path.write_text(s_text, encoding="utf-8")

r_path = Path("docs/AUDIT_EVIDENCE_02R_POPUP_OWNERSHIP_EXTERNAL.md")
r_text = r_path.read_text(encoding="utf-8")
r_text = replace_once(
    r_text,
    "- policy/browser-owned surface: native Firefox probe verified; permanent 02S gate pending.",
    f"- policy/browser-owned surface: VERIFIED by permanent 02S isolated Firefox gate on exact Head `{VERIFIED_HEAD}`.",
    "02R policy state",
)
r_text = replace_once(
    r_text,
    "Firefox enterprise policy produced the native `not_controllable` state and the expected blocked Popup; permanent workflow integration remains the final acceptance step.",
    f"Firefox enterprise policy produced the native `not_controllable` state and the expected blocked Popup; the permanent isolated gate passed in Browser E2E run `{BROWSER_RUN}` on exact Head `{VERIFIED_HEAD}`.",
    "02R policy continuation",
)
r_path.write_text(r_text, encoding="utf-8")

original_path = Path("docs/ORIGINAL_KNOWLEDGE_GRAPH.md")
original = original_path.read_text(encoding="utf-8")
original = replace_once(
    original,
    "Firefox `152.0.6` 企业 `Proxy` policy（`Locked: true`）已令原生 WebExtension API 返回 `levelOfControl=not_controllable`；ownership runtime 映射为 `reason=policy`，实际 Popup 隐藏 profile menu 与 Options，并保留 Cancel/Manage。02S 永久隔离门接入后，才可把该边界计为稳定完成。",
    f"Firefox `152.0.6` 企业 `Proxy` policy（`Locked: true`）令原生 WebExtension API 返回 `levelOfControl=not_controllable`；ownership runtime 映射为 `reason=policy`，实际 Popup 隐藏 profile menu 与 Options，并保留 Cancel/Manage。02S 永久隔离门已在 exact Head `{VERIFIED_HEAD}` 通过，policy/browser-owned 边界稳定完成。",
    "Original KG policy state",
)
section = f"""### 14.5 Session 13 当前网站 Popup 旅程验收

exact Head `{VERIFIED_HEAD}` 的六个永久 workflow 全绿；Browser E2E 四个隔离作业均通过，包括 Chromium、普通 Firefox、native Inspect 与 Firefox Locked Proxy policy-owned Popup。02Q、02R、02S 因而共同关闭当前网站 Popup 旅程。该结论不扩张到完整 Popup/Options、Order 1 或项目完成度；项目仍为 48%，Order 1 仍为 45%，owner retest、merge、release 继续禁止。

"""
marker = "## 15. 原版默认值、示例与 placeholder 规则\n"
if "### 14.5 Session 13 当前网站 Popup 旅程验收" not in original:
    if original.count(marker) != 1:
        raise SystemExit("Original KG insertion marker mismatch")
    original = original.replace(marker, section + marker, 1)
original_path.write_text(original, encoding="utf-8")

matrix_path = Path("docs/UI_AUDIT_MATRIX.md")
matrix = matrix_path.read_text(encoding="utf-8")

def patch_row(row_id: str, evidence_replacements: list[tuple[str, str]], next_step: str) -> None:
    global matrix
    match = re.search(rf"^\| {row_id} \|.*$", matrix, flags=re.MULTILINE)
    if not match:
        raise SystemExit(f"UI matrix {row_id} row missing")
    row = match.group(0)
    for old, new in evidence_replacements:
        if old not in row:
            raise SystemExit(f"UI matrix {row_id} evidence marker missing: {old}")
        row = row.replace(old, new, 1)
    parts = row.rsplit("|", 2)
    if len(parts) != 3:
        raise SystemExit(f"UI matrix {row_id} row shape mismatch")
    row = parts[0].rstrip() + f" | {next_step} |"
    matrix = matrix[: match.start()] + row + matrix[match.end() :]

patch_row(
    "I-05",
    [("02Q exact-head Original↔Nex paired gate 已接入", "02Q exact-head Original↔Nex paired gate 已通过")],
    "继续完整 Popup 其余非 current-site surface 成对证据",
)
patch_row(
    "I-06",
    [("02Q exact-head paired gate 已接入", "02Q exact-head paired gate 已通过")],
    "继续完整 Popup 其余非 current-site surface 成对证据",
)
patch_row(
    "I-11",
    [
        (
            "Firefox locked Proxy policy 已真实返回 not_controllable 并渲染 reason=policy；02S 永久隔离门接入中",
            f"Firefox locked Proxy policy 已真实返回 not_controllable 并渲染 reason=policy；02S 永久隔离门已在 `{VERIFIED_HEAD}` 通过",
        )
    ],
    "继续完整 Popup 其余非 current-site surface 成对证据",
)
old_conclusion = "- Popup 当前网站关闭态、02Q 展开菜单/Add-condition、02R app/external-profile 已验证；Firefox locked Proxy probe 已真实关闭 policy/browser-owned 的可复现性疑问。I-05、I-06、I-11 暂保持 `PARTIAL`，直到 02S 永久隔离门及 clean exact-Head 六门全绿。"
new_conclusion = f"- Session 13 当前网站 Popup 旅程已在 exact Head `{VERIFIED_HEAD}` 完成 02Q、02R、02S 六门验收。I-05、I-06、I-11 仍保持 `PARTIAL`，因为完整 Popup 其余非 current-site surface 与 Owner 视觉尚未整体闭合。"
matrix = replace_once(matrix, old_conclusion, new_conclusion, "UI matrix conclusion")
record_marker = "| 2026-08-05 | Firefox 企业 Locked Proxy policy 真实返回"
record_row = f"| 2026-08-05 | 02S Firefox policy-owned 永久隔离门接入 Browser E2E；exact Head `{VERIFIED_HEAD}` 六个永久 workflow 全绿；Session 13 当前网站 Popup 旅程作为 bounded slice 验证完成 |\n"
if record_row.strip() not in matrix:
    if matrix.count(record_marker) != 1:
        raise SystemExit("UI matrix record marker mismatch")
    matrix = matrix.replace(record_marker, record_row + record_marker, 1)
matrix_path.write_text(matrix, encoding="utf-8")
