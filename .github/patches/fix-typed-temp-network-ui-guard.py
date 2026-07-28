from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
replacements = [
    (
        "const chromiumE2ePath = 'scripts/e2e-chromium.mjs';",
        "const chromiumE2ePath = 'scripts/e2e-chromium.mjs';\nconst firefoxE2ePath = 'scripts/e2e-firefox.mjs';",
    ),
    (
        "  chromiumE2e,\n  originalBackupProvenance,",
        "  chromiumE2e,\n  firefoxE2e,\n  originalBackupProvenance,",
    ),
    (
        "  readFile(chromiumE2ePath, 'utf8'),\n  readFile(originalBackupProvenancePath, 'utf8'),",
        "  readFile(chromiumE2ePath, 'utf8'),\n  readFile(firefoxE2ePath, 'utf8'),\n  readFile(originalBackupProvenancePath, 'utf8'),",
    ),
]
for old, new in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one UI guard anchor, found {count}: {old!r}')
    text = text.replace(old, new, 1)
path.write_text(text)
print('Connected Firefox E2E source to the UI compatibility guard.')
