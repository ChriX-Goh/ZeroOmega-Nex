from pathlib import Path

path = Path('docs/UI_AUDIT_MATRIX.md')
lines = path.read_text().splitlines()
replacement = '| G-04 | JSON 对象/字符串 | `options.coffee#parseOptions` | 均接受 | MUST_MATCH | DONE | N/A | `decodeZeroOmegaBackup` 接受对象或字符串输入；对象输入、JSON 文本及完整 importer 测试均覆盖 | 保持边界测试 |'
indices = [index for index, line in enumerate(lines) if line.startswith('| G-04 |')]
if len(indices) != 1:
    raise SystemExit(f'expected one G-04 audit row, found {len(indices)}')
lines[indices[0]] = replacement
path.write_text('\n'.join(lines) + '\n')
