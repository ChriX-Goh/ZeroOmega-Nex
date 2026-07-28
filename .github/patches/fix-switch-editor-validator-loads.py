from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
lines = path.read_text().splitlines()

if not any('switchEditorStatePath' in line for line in lines):
    for index, line in enumerate(lines):
        if line.strip() == "const switchSourcePath = 'packages/profile-workflow/src/switch-source.ts';":
            lines[index + 1:index + 1] = [
                'const switchEditorStatePath =',
                "  'apps/extension/src/entrypoints/options/switch-editor-state.ts';",
            ]
            break
    else:
        raise SystemExit('Switch editor state path anchor missing')

if not any(line.strip() == 'switchEditorState,' for line in lines):
    for index, line in enumerate(lines):
        if line.strip() == 'switchSource,':
            lines.insert(index + 1, '  switchEditorState,')
            break
    else:
        raise SystemExit('Switch editor state destructuring anchor missing')

read_line = "  readFile(switchEditorStatePath, 'utf8'),"
if read_line not in lines:
    for index, line in enumerate(lines):
        if line.strip() == "readFile(switchSourcePath, 'utf8'),":
            lines.insert(index + 1, read_line)
            break
    else:
        raise SystemExit('Switch editor state read anchor missing')

path.write_text('\n'.join(lines) + '\n')
