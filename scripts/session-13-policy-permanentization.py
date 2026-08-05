from pathlib import Path
import json
import re


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label} marker mismatch: {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


package_path = Path("package.json")
package = json.loads(package_path.read_text(encoding="utf-8"))
package["scripts"]["test:e2e:firefox-policy-owned-popup"] = (
    "node scripts/e2e-firefox-policy-owned-popup.mjs"
)
package_path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")

Path("docs/AUDIT_EVIDENCE_02S_POPUP_POLICY_OWNERSHIP.md").write_text(
    """# Audit Evidence 02S — Popup Policy Ownership

## Scope

This evidence closes the last current-site Popup ownership boundary: a browser-managed proxy policy that makes the WebExtension proxy API genuinely not controllable.

It does not simulate ownership with a mocked adapter. Firefox is started with an enterprise `Proxy` policy using `Locked: true`; Nex is then installed through Firefox BiDi and reads the native `browser.proxy.settings` API.

## Original contract

ZeroOmega v3.5.0 maps a non-controllable browser proxy state to its proxy-not-controllable Popup. The profile menu and Options footer disappear. The panel shows the reason/details plus Cancel and Manage.

Nex must preserve that observable boundary while retaining typed ownership mapping internally.

## Probe evidence

One-shot Firefox policy run `31013840605`, job `92332623777`, Firefox `152.0.6`, returned:

```json
{
  "levelOfControl": "not_controllable",
  "reason": "policy",
  "blocked": true,
  "popupState": {
    "ready": true,
    "reason": "policy",
    "profileRows": 0,
    "footers": 0,
    "buttons": 2,
    "manage": 1
  }
}
```

The result simultaneously proves the browser-native control level, Nex ownership mapping and rendered Popup structure.

## Permanent gate

- `scripts/e2e-firefox-policy-owned-popup.mjs` remains as the browser test.
- `test:e2e:firefox-policy-owned-popup` is the stable package command.
- Browser E2E will run the test in an isolated Firefox job after installing a locked enterprise Proxy policy.
- The policy-owned job remains separate from ordinary Firefox E2E so the managed browser state cannot contaminate other journeys.

## State

- policy/browser-owned runtime surface: PROBE VERIFIED.
- permanent workflow integration: PENDING exact-Head verification.
- Session 13 current-site Popup journey is not declared complete until one clean Head passes all six permanent workflows with this new job.
- project progress remains 48%; Order 1 remains 45%.
- owner retest, merge and release remain prohibited.
""",
    encoding="utf-8",
)

session_path = Path("docs/SESSION_13_KNOWLEDGE_GRAPH.md")
session = session_path.read_text(encoding="utf-8")
session = session.replace(
    "      └─ browser-owned/policy state           OPEN",
    "      └─ browser-owned/policy state           probe verified; permanent gate pending",
    1,
)
section = """

## 02S policy-owned runtime evidence

- Firefox `152.0.6` was launched with an enterprise `Proxy` policy using `Locked: true`.
- Native `browser.proxy.settings.get({})` returned `levelOfControl=not_controllable`.
- The ownership runtime returned `blocked=true`, `reason=policy`, `controlLevel=not-controllable`.
- The actual Popup rendered `data-reason=policy`, zero profile rows, zero Options footers, two control actions and one Manage entry.
- Probe run: `31013840605`; job: `92332623777`.
- This closes the evidentiary feasibility question. Acceptance remains pending until the isolated policy job is part of permanent Browser E2E and one clean exact Head passes all six workflows.
"""
if "## 02S policy-owned runtime evidence" not in session:
    session = session.rstrip() + section + "\n"
session = session.replace(
    "- Current state: `02R_VERIFIED`.",
    "- Current state: `02S_POLICY_PROBE_VERIFIED_PENDING_PERMANENT_GATE`.",
)
session = re.sub(
    r"## Remaining Session 13 order\n\n(?:\d+\..*\n?)+",
    """## Remaining Session 13 order

1. integrate the isolated Firefox locked-policy job into permanent Browser E2E;
2. remove Chromium/Firefox one-shot probe workflows and the unsuccessful Chromium probe script;
3. verify all six permanent workflows on one clean exact Head;
4. reassess the complete Popup current-site journey without scheduling owner retest.
""",
    session,
    count=1,
)
session_path.write_text(session, encoding="utf-8")

r_path = Path("docs/AUDIT_EVIDENCE_02R_POPUP_OWNERSHIP_EXTERNAL.md")
r_text = r_path.read_text(encoding="utf-8")
r_text = r_text.replace(
    "- policy/browser-owned surface: OPEN.",
    "- policy/browser-owned surface: native Firefox probe verified; permanent 02S gate pending.",
)
if "AUDIT_EVIDENCE_02S_POPUP_POLICY_OWNERSHIP.md" not in r_text:
    r_text = r_text.rstrip() + """

## Policy ownership continuation

The remaining `policy/browser-owned` boundary is covered separately by [`AUDIT_EVIDENCE_02S_POPUP_POLICY_OWNERSHIP.md`](./AUDIT_EVIDENCE_02S_POPUP_POLICY_OWNERSHIP.md). Firefox enterprise policy produced the native `not_controllable` state and the expected blocked Popup; permanent workflow integration remains the final acceptance step.
"""
r_path.write_text(r_text + "\n", encoding="utf-8")

original_path = Path("docs/ORIGINAL_KNOWLEDGE_GRAPH.md")
replace_once(
    original_path,
    "Nex 以真实 competing-extension takeover E2E 验证 `app` 状态，以本扩展写入但未被 represented route 接纳的 Chromium proxy value 验证 external-profile。`not-controllable` policy/browser-owned 状态保持 OPEN，直到可重复浏览器策略证据存在。",
    "Nex 以真实 competing-extension takeover E2E 验证 `app` 状态，以本扩展写入但未被 represented route 接纳的 Chromium proxy value 验证 external-profile。Firefox `152.0.6` 企业 `Proxy` policy（`Locked: true`）已令原生 WebExtension API 返回 `levelOfControl=not_controllable`；ownership runtime 映射为 `reason=policy`，实际 Popup 隐藏 profile menu 与 Options，并保留 Cancel/Manage。02S 永久隔离门接入后，才可把该边界计为稳定完成。",
    "Original policy ownership boundary",
)

matrix_path = Path("docs/UI_AUDIT_MATRIX.md")nmatrix = matrix_path.read_text(encoding="utf-8")
match = re.search(r"^\| I-11 \|.*$", matrix, flags=re.MULTILINE)
if not match:
    raise SystemExit("UI_AUDIT_MATRIX I-11 row missing")
row = match.group(0)
old_phrase = "policy/browser-owned 保持 OPEN"
new_phrase = "Firefox locked Proxy policy 已真实返回 not_controllable 并渲染 reason=policy；02S 永久隔离门接入中"
if old_phrase not in row:
    raise SystemExit("UI_AUDIT_MATRIX I-11 policy marker missing")
row = row.replace(old_phrase, new_phrase, 1)
row = row.rsplit("|", 2)[0].rstrip() + " | 完成 02S 永久门与 clean exact-Head 六门验证 |"
matrix = matrix[: match.start()] + row + matrix[match.end() :]
old_conclusion = "- Popup 当前网站关闭态已验证；展开菜单与 Add-condition 表单已进入 Session 13 原版结构修正和 02Q exact-head paired gate。I-05、I-06、I-11 仍保持 `PARTIAL`，直到 02Q 全绿且 ownership/external/browser-owned surface 完成。"
new_conclusion = "- Popup 当前网站关闭态、02Q 展开菜单/Add-condition、02R app/external-profile 已验证；Firefox locked Proxy probe 已真实关闭 policy/browser-owned 的可复现性疑问。I-05、I-06、I-11 暂保持 `PARTIAL`，直到 02S 永久隔离门及 clean exact-Head 六门全绿。"
if old_conclusion not in matrix:
    raise SystemExit("UI_AUDIT_MATRIX conclusion marker missing")
matrix = matrix.replace(old_conclusion, new_conclusion, 1)
record_marker = "| 2026-08-05 | Session 13 按原版独立 Add-condition 路由"
record_row = "| 2026-08-05 | Firefox 企业 Locked Proxy policy 真实返回 `not_controllable`，ownership=`policy`，阻断 Popup 结构通过；接入 02S 永久隔离门前保持 PARTIAL |\n"
if record_row.strip() not in matrix:
    if matrix.count(record_marker) != 1:
        raise SystemExit("UI_AUDIT_MATRIX update record marker mismatch")
    matrix = matrix.replace(record_marker, record_row + record_marker, 1)
matrix_path.write_text(matrix, encoding="utf-8")
