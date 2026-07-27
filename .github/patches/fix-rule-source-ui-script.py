from pathlib import Path

path = Path('.github/patches/apply-rule-source-ui.py')
source = path.read_text()
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
path.write_text(source.replace(old, new))
