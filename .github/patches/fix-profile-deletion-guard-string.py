from pathlib import Path

path = Path('.github/patches/apply-profile-deletion-protection.py')
text = path.read_text()
old = "      profileOperations.includes('profile is referenced by') &&\n"
new = "      profileOperations.includes('is referenced by') &&\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one profile deletion guard string, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
