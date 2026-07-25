from pathlib import Path

path = Path('apps/extension/src/lib/profile-workflow-activation.test.ts')
text = path.read_text()
old = '  installed?: PacRuntimeSnapshot;'
new = '  installed: PacRuntimeSnapshot | undefined;'
count = text.count(old)
if count != 1:
    raise SystemExit(f'FakeProxyDriver installed field: expected one anchor, found {count}')
path.write_text(text.replace(old, new, 1))
