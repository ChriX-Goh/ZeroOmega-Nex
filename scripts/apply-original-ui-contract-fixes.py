import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


path = 'scripts/generate-locale-inventory.mjs'
replace_once(
    path,
    "const originalProductNames = new Set(['ZeroOmega']);",
    "const originalProductNames = new Set(['Zero Omega', 'ZeroOmega']);",
)
subprocess.run(['pnpm', 'exec', 'prettier', '--write', path], check=True)
subprocess.run(['pnpm', 'locale:inventory'], check=True)
