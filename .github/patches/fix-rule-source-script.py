from pathlib import Path

path = Path('.github/patches/apply-rule-source-core.py')
source = path.read_text()
old = '''replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    ''' + "'''" + '''  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowStorageArea,
''' + "'''" + ''',
    ''' + "'''" + '''  type ProfileWorkflowRuleSourceDownloader,
  type ProfileWorkflowRuleSourceUpdateService,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowStorageArea,
''' + "'''" + ''',
)
'''
new = '''replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    ''' + "'''" + '''  type ProfileWorkflowStorageArea,
''' + "'''" + ''',
    ''' + "'''" + '''  type ProfileWorkflowRuleSourceDownloader,
  type ProfileWorkflowRuleSourceUpdateService,
  type ProfileWorkflowStorageArea,
''' + "'''" + ''',
)
'''
if source.count(old) != 1:
    raise SystemExit(f'core runtime import patch mismatch: {source.count(old)}')
path.write_text(source.replace(old, new))
