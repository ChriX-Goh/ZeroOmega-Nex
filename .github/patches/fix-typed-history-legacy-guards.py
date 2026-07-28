from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
replacements = [
    (
        "    snapshotHistory.includes('Confirm rollback'),\n    'Snapshot rollback must require an explicit second confirmation action.',",
        "    snapshotHistory.includes(\"uiText('history.confirmRollback', locale)\"),\n    'Snapshot rollback must require an explicit second confirmation action.',",
    ),
    (
        "    snapshotHistory.includes('Extension reference-safety check plus browser install confirmation'),\n    'Snapshot history must disclose browser-safe runtime verification mode.',",
        "    snapshotHistory.includes(\"uiText('history.verificationReferenceSafety', locale)\"),\n    'Snapshot history must disclose browser-safe runtime verification mode.',",
    ),
]
for old, new in replacements:
    if text.count(old) != 1:
        raise SystemExit(f'expected one legacy History guard, found {text.count(old)}: {old[:100]!r}')
    text = text.replace(old, new, 1)
path.write_text(text)
