from pathlib import Path

core = Path('.github/patches/apply-rule-source-core.py')
source = core.read_text()
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
core.write_text(source.replace(old, new))

ui = Path('.github/patches/apply-rule-source-ui.py')
source = ui.read_text()
old = '''style_marker = ''' + "'''" + '''  .header-row {
''' + "'''" + '''
'''
new = '''style_marker = ''' + "'''" + '''<style>
  fieldset {
''' + "'''" + '''
'''
if source.count(old) != 1:
    raise SystemExit(f'UI style-marker declaration mismatch: {source.count(old)}')
source = source.replace(old, new)
old = "source = source.replace(style_marker, style + style_marker)"
new = "source = source.replace(style_marker, '<style>\\n' + style + '  fieldset {\\n')"
if source.count(old) != 1:
    raise SystemExit(f'UI style replacement mismatch: {source.count(old)}')
ui.write_text(source.replace(old, new))
