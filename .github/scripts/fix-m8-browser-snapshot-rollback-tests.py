from pathlib import Path

path = Path('apps/extension/src/lib/snapshot-rollback-runtime.test.ts')
text = path.read_text()

replacements = [
    (
        '  installed?: PacRuntimeSnapshot;',
        '  installed: PacRuntimeSnapshot | undefined;',
        'explicit installed union',
    ),
    (
        '    startRoute: structuredClone(spec.settings.startup.route),',
        "    startRoute: structuredClone(spec.settings.startup.route ?? { kind: 'direct' }),",
        'default snapshot start route',
    ),
]

for old, new, label in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    text = text.replace(old, new, 1)

path.write_text(text)
