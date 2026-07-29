from pathlib import Path

path = Path('apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte')
text = path.read_text()
old = '  const basicConditionKinds = new Set(ORIGINAL_SWITCH_BASIC_CONDITION_KINDS);\n'
new = "  const basicConditionKinds = new Set<Condition['kind']>(\n    ORIGINAL_SWITCH_BASIC_CONDITION_KINDS,\n  );\n"
if text.count(old) != 1:
    raise SystemExit(f'basic condition Set matches: {text.count(old)}')
path.write_text(text.replace(old, new))
print('Widened Switch condition membership Set query type.')
