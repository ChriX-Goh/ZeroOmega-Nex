from pathlib import Path

path = Path('packages/profile-workflow/src/profile-operations.test.ts')
text = path.read_text()
old = "  type FixedProfile,\n  type SwitchProfile,\n"
new = "  type FixedProfile,\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one generated SwitchProfile test import, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
