from pathlib import Path

path = Path('.github/patches/apply-popup-result-profile.py')
text = path.read_text()
old = """replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    '''  border-left: 3px solid transparent;
''',
    '''  border-left: 0;
''',
)
"""
new = """replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    '''  border: 0;
  border-left: 3px solid transparent;
  background: transparent;
''',
    '''  border: 0;
  border-left: 0;
  background: transparent;
''',
)
"""
if text.count(old) != 1:
    raise SystemExit(f'Popup result CSS patch match count: {text.count(old)}')
path.write_text(text.replace(old, new))
