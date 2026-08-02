import re
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


options = Path('apps/extension/src/entrypoints/options/App.svelte')
source = options.read_text()
source, header_count = re.subn(
    r"\n\s*<p>\{uiText\('options\.builtin\.help', locale\)\}</p>",
    '',
    source,
    count=1,
)
source, direct_count = re.subn(
    r"<span\s*>\{uiText\('options\.builtin\.directHelp', locale\)\}</span\s*>",
    '',
    source,
    count=1,
)
source, system_count = re.subn(
    r"<span\s*>\{uiText\('options\.builtin\.systemHelp', locale\)\}</span\s*>",
    '',
    source,
    count=1,
)
if (header_count, direct_count, system_count) != (1, 1, 1):
    raise RuntimeError(
        f'Options built-in helper removal counts: {(header_count, direct_count, system_count)}'
    )
options.write_text(source)

replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''      !optionsApp.includes("uiText('options.builtin.directHelp', locale)") &&''',
    '''      !optionsApp.includes("uiText('options.builtin.help', locale)") &&
      !optionsApp.includes("uiText('options.builtin.directHelp', locale)") &&
      !optionsApp.includes("uiText('options.builtin.systemHelp', locale)") &&''',
)
