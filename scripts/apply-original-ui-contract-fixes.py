import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    'item.resultItems.length > 0 &&',
    'item.resultItems.length !== 0 &&',
)
subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        'apps/extension/src/entrypoints/popup/App.svelte',
    ],
    check=True,
)
subprocess.run(['pnpm', 'locale:inventory'], check=True)
