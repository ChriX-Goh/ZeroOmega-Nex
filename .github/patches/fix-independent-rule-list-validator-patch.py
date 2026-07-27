from pathlib import Path

path = Path('.github/patches/apply-independent-rule-list-editor.py')
text = path.read_text()
old = """replace_once(
    str(validator_path),
    \"\"\"  originalBackupProvenance,
] = await Promise.all([\"\"\",
    \"\"\"  originalBackupProvenance,
  independentRuleListEditor,
] = await Promise.all([\"\"\",
)
validator = validator_path.read_text()
replace_once(
    str(validator_path),
    \"\"\"  readFile(originalBackupProvenancePath, 'utf8'),
]);\"\"\",
    \"\"\"  readFile(originalBackupProvenancePath, 'utf8'),
  readFile(independentRuleListEditorPath, 'utf8'),
]);\"\"\",
)
"""
new = """replace_once(
    str(validator_path),
    \"\"\"const [nativeInspectE2e, browserE2eWorkflow, legacyExport, chromiumE2e, originalBackupProvenance] =
  await Promise.all([\"\"\",
    \"\"\"const [
  nativeInspectE2e,
  browserE2eWorkflow,
  legacyExport,
  chromiumE2e,
  originalBackupProvenance,
  independentRuleListEditor,
] = await Promise.all([\"\"\",
)
validator = validator_path.read_text()
replace_once(
    str(validator_path),
    \"\"\"    readFile(originalBackupProvenancePath, 'utf8'),
  ]);\"\"\",
    \"\"\"    readFile(originalBackupProvenancePath, 'utf8'),
    readFile(independentRuleListEditorPath, 'utf8'),
  ]);\"\"\",
)
"""
if text.count(old) != 1:
    raise SystemExit(f'expected one legacy validator patch block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
