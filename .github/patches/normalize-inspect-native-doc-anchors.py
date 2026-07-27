from pathlib import Path

path = Path('docs/UI_AUDIT_MATRIX.md')
lines = path.read_text().splitlines()
expected = "| I-09 | Inspect 菜单       | popup/network      | 可配置显示                     | MUST_MATCH | PARTIAL  | PARTIAL  | Applied flag 驱动 frame/link/media 菜单；目标按 tab session 保存；现已按活动 startRoute 求值，`#` 使用结果 Profile/Direct/System 颜色，标题恢复 `[检查] 目标` + 当前→结果两行结构；单测覆盖启停、求值、清除、tab 生命周期 | 补原生浏览器右键菜单 E2E          |"
matched = [index for index, line in enumerate(lines) if line.startswith('| I-09 |')]
if len(matched) != 1:
    raise SystemExit(f'expected one I-09 audit row, found {len(matched)}')
lines[matched[0]] = expected
path.write_text('\n'.join(lines) + '\n')
