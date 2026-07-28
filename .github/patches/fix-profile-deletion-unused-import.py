from pathlib import Path

path = Path('.github/patches/apply-profile-deletion-protection.py')
text = path.read_text()
old = "    type SwitchProfile,\n"
new = ""
if text.count(old) != 1:
    raise SystemExit(f'expected one SwitchProfile test import, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
