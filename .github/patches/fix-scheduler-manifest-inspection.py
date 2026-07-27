from pathlib import Path

path = Path('scripts/inspect-manifests.mjs')
source = path.read_text()
replacements = {
    "assertExactSet(permissions, ['proxy', 'storage'], 'required permissions', file);": "assertExactSet(permissions, ['proxy', 'storage', 'alarms'], 'required permissions', file);",
    "passed: MV${manifest.manifest_version}, proxy/storage required, auth optional, no global host access.": "passed: MV${manifest.manifest_version}, proxy/storage/alarms required, auth optional, no global host access.",
}
for old, new in replacements.items():
    if source.count(old) != 1:
        raise SystemExit(f'manifest inspection match count for {old!r}: {source.count(old)}')
    source = source.replace(old, new)
path.write_text(source)
