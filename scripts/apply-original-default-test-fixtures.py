from pathlib import Path

path = Path('apps/extension/src/entrypoints/popup/OriginalPopupIcon.svelte')
source = path.read_text()
old = '  export type OriginalPopupIconKind ='
if source.count(old) != 1:
    raise RuntimeError(f'{path}: expected one exported icon type')
path.write_text(source.replace(old, '  type OriginalPopupIconKind =', 1))
