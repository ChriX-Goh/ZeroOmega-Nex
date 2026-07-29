from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
replacements = {
    r"  await patternField.fill('(^|\.)matrix\.example\.invalid$');":
        r"  await patternField.fill('(^|\\.)matrix\\.example\\.invalid$');",
    r"  await patternField.fill('^https://secure\.example\.invalid/');":
        r"  await patternField.fill('^https://secure\\.example\\.invalid/');",
}
for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'E2E regex escape matches for {old!r}: {count}')
    text = text.replace(old, new)
path.write_text(text)
print('Fixed Chromium Switch condition regex string escapes.')
