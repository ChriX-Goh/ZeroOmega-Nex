from pathlib import Path

path = Path('.github/patches/fix-options-workflow-storage-sync.py')
source = path.read_text()
old = '    let unsubscribeWorkflowChanges = () => undefined;'
new = '    let unsubscribeWorkflowChanges: () => void = () => undefined;'
if source.count(old) != 1:
    raise SystemExit(f'Options sync disposer type match: {source.count(old)}')
path.write_text(source.replace(old, new))
