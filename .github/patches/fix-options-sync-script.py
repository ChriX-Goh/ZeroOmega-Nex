from pathlib import Path

path = Path('.github/patches/fix-options-workflow-storage-sync.py')
source = path.read_text()
old = "if count != 5:\n    raise SystemExit(f'{app}: expected five saving-finally blocks, found {count}')"
new = "if count != 4:\n    raise SystemExit(f'{app}: expected four saving-finally blocks, found {count}')"
if source.count(old) != 1:
    raise SystemExit(f'Options sync script count match: {source.count(old)}')
path.write_text(source.replace(old, new))
