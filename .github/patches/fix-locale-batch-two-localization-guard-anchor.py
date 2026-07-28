from pathlib import Path

path = Path('.github/patches/apply-locale-batch-two-integration.py')
text = path.read_text()
start_marker = "replace_once(\n    'scripts/validate-localization.mjs',\n    '''requireText(\n  entries.app,\n  '<ProfileDeletionDialog"
start = text.find(start_marker)
if start < 0:
    raise SystemExit('typed locale integration localization-guard block start was not found')
end_marker = "\n\n# Source-parity guards must recognize typed keys rather than literal English source."
end = text.find(end_marker, start)
if end < 0:
    raise SystemExit('typed locale integration localization-guard block end was not found')
replacement = '''replace_once(
    'scripts/validate-localization.mjs',
    "  'Options must pass locale to deletion dialog.',\\n);\\n",
    "  'Options must pass locale to deletion dialog.',\\n);\\n"
    "requireText(\\n"
    "  entries.app,\\n"
    "  '<SwitchProfileEditor\\n            {locale}',\\n"
    "  'Options must pass locale to Switch Profile.',\\n"
    ");\\n"
    "requireText(\\n"
    "  entries.app,\\n"
    "  '<RuleListProfileEditor\\n          {locale}',\\n"
    "  'Options must pass locale to independent Rule List.',\\n"
    ");\\n"
    "requireText(\\n"
    "  entries.catalog,\\n"
    "  \\\"readonly 'switch.sourceError'\\\",\\n"
    "  'Typed Switch source error messages are missing.',\\n"
    ");\\n"
    "requireText(\\n"
    "  entries.catalog,\\n"
    "  \\\"readonly 'ruleList.lastUpdated'\\\",\\n"
    "  'Typed Rule List update status messages are missing.',\\n"
    ");\\n",
)
'''
path.write_text(text[:start] + replacement + text[end:])
