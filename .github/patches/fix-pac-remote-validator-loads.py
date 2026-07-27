from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
old = '''  originalBackupProvenance,
  independentRuleListEditor,
] = await Promise.all(['''
new = '''  originalBackupProvenance,
  independentRuleListEditor,
  pacProfileEditor,
  pacSourceUpdate,
] = await Promise.all(['''
if text.count(old) != 1:
    raise SystemExit(f'expected one PAC validator destructuring anchor, found {text.count(old)}')
text = text.replace(old, new, 1)
old = '''  readFile(originalBackupProvenancePath, 'utf8'),
  readFile(independentRuleListEditorPath, 'utf8'),
]);'''
new = '''  readFile(originalBackupProvenancePath, 'utf8'),
  readFile(independentRuleListEditorPath, 'utf8'),
  readFile(pacProfileEditorPath, 'utf8'),
  readFile(pacSourceUpdatePath, 'utf8'),
]);'''
if text.count(old) != 1:
    raise SystemExit(f'expected one PAC validator Promise anchor, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
