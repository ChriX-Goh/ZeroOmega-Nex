from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match for {old!r}, found {count}')
    file.write_text(source.replace(old, new))


replace_once(
    'apps/extension/src/lib/current-site.ts',
    r'`(^|\.)${escapeRegex(scopedDomain)}$`',
    r'`(^|\\.)${escapeRegex(scopedDomain)}$`',
)
replace_once(
    'apps/extension/src/lib/current-site.ts',
    r'`://${escaped}(:\d+)?/`',
    r'`://${escaped}(:\\d+)?/`',
)
replace_once(
    'apps/extension/src/lib/current-site.ts',
    r'`://([^/.]+\.)*${escapeRegex(scopedDomain)}(:\d+)?/`',
    r'`://([^/.]+\\.)*${escapeRegex(scopedDomain)}(:\\d+)?/`',
)
replace_once(
    'apps/extension/src/lib/current-site.test.ts',
    r"pattern: '://([^/.]+\.)*example\.co\.uk(:\d+)?/',",
    r"pattern: '://([^/.]+\\.)*example\\.co\\.uk(:\\d+)?/',",
)
