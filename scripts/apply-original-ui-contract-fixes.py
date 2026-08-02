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
    'scripts/e2e-chromium.mjs',
    'externalOwnership = await worker.evaluate(async () => {',
    'externalOwnership = await popup.evaluate(async () => {',
)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        'scripts/e2e-firefox-attached-rule-list-toolbar.mjs',
        'scripts/e2e-firefox-profile-traces-toolbar.mjs',
        'scripts/e2e-firefox-toolbar-restart.mjs',
        'scripts/e2e-chromium.mjs',
    ],
    check=True,
)
