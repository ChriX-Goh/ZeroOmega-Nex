from pathlib import Path

path = Path('.github/patches/apply-pac-remote-ui.py')
text = path.read_text()
old = "validator_path = Path('scripts/validate-m8-ui.mjs')"
new = "validator_path = Path('scripts/validate-ui-compatibility.mjs')"
if text.count(old) != 1:
    raise SystemExit(f'expected one legacy validator path, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
