from pathlib import Path
import re


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label} marker mismatch: {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


app = Path("apps/extension/src/entrypoints/popup/App.svelte")
replace_once(
    app,
    "{#if !loading && !proxyOwnership?.blocked}",
    "{#if !proxyOwnership?.blocked}",
    "Popup footer condition",
)

validator = Path("scripts/validate-popup-entry-contract.mjs")
replace_once(
    validator,
    """assert.match(
  app,
  /\\{#if !loading && !proxyOwnership\\?\\.blocked\\}[\\s\\S]*?<footer class=\"popup-footer\">/u,
);""",
    """assert.match(
  app,
  /\\{#if !proxyOwnership\\?\\.blocked\\}[\\s\\S]*?<footer class=\"popup-footer\">/u,
);
assert.ok(
  !app.includes('{#if !loading && !proxyOwnership?.blocked}'),
  'loading state must retain the original Options footer',
);""",
    "Popup validator footer condition",
)

e2e = Path("scripts/e2e-chromium.mjs")
replace_once(
    e2e,
    """  await externalForm.getByLabel('外部情景模式名称').fill('_reserved');
  await externalForm.getByRole('button', { name: '保存名称', exact: true }).click();
  await externalForm.getByText('情景模式名称不能以下划线开头。').waitFor();
  await externalForm.getByLabel('外部情景模式名称').fill('Imported External Proxy');
  await externalForm.getByRole('button', { name: '保存名称', exact: true }).click();""",
    """  const externalNameInput = externalForm.getByLabel('外部情景模式名称');
  await externalNameInput.fill('_reserved');
  await externalNameInput.blur();
  await externalForm.getByText('情景模式名称不能以下划线开头。').waitFor();
  await externalNameInput.fill('Imported External Proxy');
  const externalPopupClosed = externalPopup.waitForEvent('close');
  await externalNameInput.blur();
  await externalPopupClosed;""",
    "Chromium external-profile legacy actions",
)

session = Path("docs/SESSION_13_KNOWLEDGE_GRAPH.md")
text = session.read_text(encoding="utf-8")
if "## 02R verification correction" not in text:
    text = text.rstrip() + """

## 02R verification correction

- Head `8c9c75d` exposed two stale contracts rather than a new product redesign: the loading shell incorrectly hid Options, and the older Chromium journey still clicked removed Cancel/Save controls.
- The corrected contract keeps Options during loading, hides it only when proxy ownership is blocked, and validates external-profile names through submit/blur behavior.
- Exact-Head verification must restart after this correction; no prior green result is inherited.
"""
    session.write_text(text + "\n", encoding="utf-8")

evidence = Path("docs/AUDIT_EVIDENCE_02R_POPUP_OWNERSHIP_EXTERNAL.md")
text = evidence.read_text(encoding="utf-8")
if "## Verification correction" not in text:
    text = text.rstrip() + """

## Verification correction

The first exact-Head run found two stale gates. Loading must retain the original Options footer; ownership-blocked states alone hide it. The pre-existing Chromium journey must use the original inline input's blur/submit save contract rather than Nex-only action buttons. Both gates are corrected before 02R can be marked verified.
"""
    evidence.write_text(text + "\n", encoding="utf-8")

original = Path("docs/ORIGINAL_KNOWLEDGE_GRAPH.md")
text = original.read_text(encoding="utf-8")
if "### 14.4 Popup 加载 Footer 与外部配置保存合同" not in text:
    marker = "## 15. 原版默认值、示例与 placeholder 规则\n"
    addendum = """### 14.4 Popup 加载 Footer 与外部配置保存合同

Popup 加载态仍显示原版 Options footer；只有 proxy ownership blocked 状态隐藏该 footer。外部配置命名沿用同一行 input 的 submit/blur 保存，不恢复 Nex-only Cancel/Save 按钮。旧自动化若仍点击“保存名称”，属于过期验收合同，必须改为失焦或提交表单。

"""
    if text.count(marker) != 1:
        raise SystemExit("ORIGINAL_KNOWLEDGE_GRAPH insertion marker mismatch")
    original.write_text(text.replace(marker, addendum + marker, 1), encoding="utf-8")

matrix = Path("docs/UI_AUDIT_MATRIX.md")
text = matrix.read_text(encoding="utf-8")
match = re.search(r"^\| I-11 \|.*$", text, flags=re.MULTILINE)
if not match:
    raise SystemExit("UI_AUDIT_MATRIX I-11 row missing")
phrase = "加载态保留 Options；仅 ownership blocked 隐藏；外部配置按 blur/submit 保存"
row = match.group(0)
if phrase not in row:
    parts = row.split("|")
    if len(parts) < 5:
        raise SystemExit("UI_AUDIT_MATRIX I-11 row shape mismatch")
    parts[-3] = parts[-3].rstrip() + f"；{phrase} "
    text = text[: match.start()] + "|".join(parts) + text[match.end() :]
    matrix.write_text(text, encoding="utf-8")
