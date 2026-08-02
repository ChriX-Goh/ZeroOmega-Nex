import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


path = 'scripts/validate-ui-compatibility.mjs'
replace_once(
    path,
    """      !optionsApp.includes('<span>Zero Omega</span>') &&
      !optionsApp.includes(\"uiText('history.nav'\") &&""",
    """      optionsApp.includes('<span>Zero Omega</span>') &&
      !optionsApp.includes('<span>ZeroOmega</span>') &&
      !optionsApp.includes(\"uiText('history.nav'\") &&""",
)

subprocess.run(['pnpm', 'exec', 'prettier', '--write', path], check=True)
