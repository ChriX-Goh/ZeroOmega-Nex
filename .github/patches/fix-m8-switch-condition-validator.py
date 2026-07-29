from pathlib import Path

path = Path('.github/patches/apply-m8-switch-condition-matrix.py')
text = path.read_text()
start = text.find("replace_once(\n    validator,\n    \"\"\"const auditRowLines")
end = text.find("\n\nprint('Applied source-backed Switch condition matrix slice.')", start)
if start == -1 or end == -1:
    raise SystemExit(f'validator patch markers missing: start={start}, end={end}')
replacement = r'''validator_text = validator.read_text()
validator_marker = "const auditRowLines = audit.split('\\n').filter"
validator_index = validator_text.find(validator_marker)
if validator_index == -1:
    raise SystemExit('Switch matrix validator insertion marker missing')
validator_guards = """requireAll('source-backed Switch condition catalog', switchConditionCatalog, [
  'ORIGINAL_SWITCH_BASIC_CONDITION_GROUPS',
  'ORIGINAL_SWITCH_ADVANCED_CONDITION_GROUPS',
  \"['true', 'bypass']\",
  \"value: 'host-levels'\",
  \"value: 'weekday'\",
  \"value: 'time'\",
]);
requireAll('Switch condition field UI', switchConditionEditor, [
  'data-switch-condition-selectable-option',
  'data-switch-source-only-condition-option',
  'data-switch-false-annotation',
  'data-switch-condition-field=\"ipNetwork\"',
  'data-switch-host-wildcard-warning',
  'data-switch-normalize-true-condition',
]);
requireAll('Switch condition matrix document', switchConditionMatrix, [
  'HostWildcardCondition',
  'IpCondition',
  'TrueCondition',
  'BypassCondition',
  'invalid-regex rejection',
  'Chromium',
  'Firefox',
]);
requireAll('Switch condition catalog regression', switchConditionCatalogTest, [
  \"['host-wildcard', 'host-regex', 'host-levels', 'ip']\",
  \"['weekday', 'time', 'false']\",
  'SOURCE_ONLY_SWITCH_CONDITION_KINDS',
]);
requireAll('Switch condition Chromium acceptance', chromiumE2e, [
  'Source-only True/Bypass conditions leaked into the ordinary original selector',
  'Strict Apply did not reject the invalid regular expression while preserving Draft',
  'data-switch-condition-field=\"ipNetwork\"',
  'Switch source round trip did not restore the weekday field state',
]);
requireAll('Switch condition Firefox acceptance', firefoxE2e, [
  'Firefox ordinary Switch selector exposed source-only conditions',
  'data-switch-condition-field=\"ipNetwork\"',
  \"'host-wildcard'\",
  \"'false'\",
]);
for (const rowId of ['D-04', 'D-05']) {
  const row = audit.split('\\n').find((line) => line.startsWith(`| ${rowId} `));
  if (!row || !row.includes('| DONE') || !row.includes('Chromium') || !row.includes('Firefox')) {
    failures.push(`${rowId} must remain DONE with dual-browser Switch condition evidence`);
  }
}

"""
validator.write_text(validator_text[:validator_index] + validator_guards + validator_text[validator_index:])'''
path.write_text(text[:start] + replacement + text[end:])
print('Fixed Switch condition validator generator.')
