from pathlib import Path

path = Path('.github/patches/apply-typed-locale-pac-integration.py')
text = path.read_text()
old = '"compilerVersion, \'raw-pac/1\'"'
new = '"\'raw-pac/1\'"'
if text.count(old) != 1:
    raise SystemExit(f'expected one Firefox PAC guard marker, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
