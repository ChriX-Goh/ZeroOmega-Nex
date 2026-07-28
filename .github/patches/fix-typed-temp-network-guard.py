from pathlib import Path

path = Path('scripts/validate-localization.mjs')
text = path.read_text()
old = "  \"uiMessage(\n        'network.bounds'\"," 
new = "  `uiMessage(\n        'network.bounds'`,"
count = text.count(old)
if count != 1:
    raise SystemExit(f'{path}: expected one broken multiline marker, found {count}')
path.write_text(text.replace(old, new, 1))
print('Fixed Network bounds localization guard marker.')
