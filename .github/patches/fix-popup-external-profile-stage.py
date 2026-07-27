from pathlib import Path

path = Path('.github/patches/apply-popup-external-profile-evidence.py')
text = path.read_text()
old = """| I-07 | 外部扩展控制状态   | popup/target       | 阻断页 + external profile 导入 | MUST_MATCH | PARTIAL  | PARTIAL  | app/policy/permission/unknown 控制权阻断、整页隐藏、管理扩展入口、单测与双扩展 Chromium E2E 已实现；System 下有效 Fixed/PAC 导入仍缺 | 实现 external profile 导入 |
"""
new = """| I-07 | 外部扩展控制状态   | popup/target       | 阻断页 + external profile 导入 | MUST_MATCH | PARTIAL  | PARTIAL  | app/policy/permission/unknown 控制权阻断、整页隐藏、管理扩展入口、单测与双扩展 Chromium E2E 已实现；System 下有效 Fixed/PAC 导入仍缺        | 实现 external profile 导入 |
"""
if text.count(old) != 1:
    raise SystemExit(f'external profile evidence row match count: {text.count(old)}')
path.write_text(text.replace(old, new))
