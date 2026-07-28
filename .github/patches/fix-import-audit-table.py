from pathlib import Path

path = Path('docs/UI_AUDIT_MATRIX.md')
text = path.read_text()
old = '`decodeZeroOmegaBackup(input: string | unknown)`'
new = '`decodeZeroOmegaBackup` accepts either object or string input'
if text.count(old) != 1:
    raise SystemExit(f'expected one import audit union type, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
