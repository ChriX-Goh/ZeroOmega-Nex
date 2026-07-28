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
    "  '<SwitchProfileEditor\\\\n            {locale}',\\n"
    "  'Options must pass locale to Switch Profile.',\\n"
    ");\\n"
    "requireText(\\n"
    "  entries.app,\\n"
    "  '<RuleListProfileEditor\\\\n          {locale}',\\n"
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
text = text[:start] + replacement + text[end:]
old_guard = '    "      attachedRuleListConfig.includes(\\"uiMessage(\'ruleList.updateFailed\'\\") &&\\n",\n'
new_guard = '''    "      attachedRuleListConfig.includes('uiMessage(') &&\\n"
    "      attachedRuleListConfig.includes(\\"'ruleList.updateFailed'\\") &&\\n",
'''
if text.count(old_guard) != 1:
    raise SystemExit(f'expected one localized Rule Source UI guard, found {text.count(old_guard)}')
path.write_text(text.replace(old_guard, new_guard, 1))

rule_patch = Path('.github/patches/apply-locale-batch-two-rule-lists.py')
rule_text = rule_patch.read_text()
old_bytes = "        bytes: view.lastBytes,\n        stale: view.stale,\n"
new_bytes = "        ...(view.lastBytes === undefined ? {} : { bytes: view.lastBytes }),\n        stale: view.stale,\n"
if rule_text.count(old_bytes) != 2:
    raise SystemExit(f'expected two Rule List optional-byte message payloads, found {rule_text.count(old_bytes)}')
rule_patch.write_text(rule_text.replace(old_bytes, new_bytes))

switch_patch = Path('.github/patches/apply-locale-batch-two-switch.py')
switch_text = switch_patch.read_text()
old_line = "    return uiMessage('switch.sourceError', { code: value.code, line: value.line }, locale);\n"
new_line = "    return uiMessage(\n      'switch.sourceError',\n      { code: value.code, ...(value.line === undefined ? {} : { line: value.line }) },\n      locale,\n    );\n"
if switch_text.count(old_line) != 1:
    raise SystemExit(f'expected one Switch optional-line message payload, found {switch_text.count(old_line)}')
switch_patch.write_text(switch_text.replace(old_line, new_line, 1))
