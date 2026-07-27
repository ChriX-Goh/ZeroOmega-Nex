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

docs = Path('.github/patches/apply-rule-source-e2e-docs.py')
source = docs.read_text()
old = '| D-19 | 附属立即下载     | 同上                                           | 下载状态/更新时间/错误                     | MUST_MATCH | MISSING  | MISSING | 本切片只保留 URL 缓存和只读语义，尚无后台安全下载、时间戳与错误状态                              | 下一切片实现           |'
new = '| D-19 | 附属立即下载     | 同上                                           | 下载状态/更新时间/错误                     | MUST_MATCH | MISSING  | MISSING | 本切片只保留 URL 缓存和只读语义，尚无后台安全下载、时间戳与错误状态                                                                | 下一切片实现           |'
if source.count(old) != 1:
    raise SystemExit(f'D-19 generator text mismatch: {source.count(old)}')
docs.write_text(source.replace(old, new))
