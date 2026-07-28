from pathlib import Path

path = Path('.github/patches/apply-typed-history-integration.py')
text = path.read_text()
source_old = r'''"    entries.pac,\n  ],\n) {"'''
source_new = r'''"    ['PAC Profile', entries.pac],"'''
target_old = r'''"    entries.pac,\n    ['Snapshot History', entries.history],\n  ],\n) {"'''
target_new = r'''"    ['PAC Profile', entries.pac],\n    ['Snapshot History', entries.history],"'''
for label, old, new in [
    ('source', source_old, source_new),
    ('target', target_old, target_new),
]:
    if text.count(old) != 1:
        raise SystemExit(f'expected one typed History localization-loop {label}, found {text.count(old)}')
    text = text.replace(old, new, 1)
path.write_text(text)
