from pathlib import Path

path = Path('.github/patches/apply-typed-history-integration.py')
text = path.read_text()
old = '''    "    entries.pac,\n  ],\n) {",
    "    entries.pac,\n    ['Snapshot History', entries.history],\n  ],\n) {",
'''
new = '''    "    ['PAC Profile', entries.pac],\n]) {",
    "    ['PAC Profile', entries.pac],\n    ['Snapshot History', entries.history],\n]) {",
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one typed History localization-loop patch, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
