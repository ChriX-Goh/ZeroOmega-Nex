from pathlib import Path

path = Path('scripts/e2e-firefox.mjs')
text = path.read_text()
old_rule = "  assert.equal(ruleRuntime.lastError, undefined);"
new_rule = "  assert.equal(ruleRuntime.lastError == null, true, 'Firefox Rule Source update recorded an unexpected error');"
old_pac = "  assert.equal(pacDraftRuntime.lastError, undefined);"
new_pac = "  assert.equal(pacDraftRuntime.lastError == null, true, 'Firefox PAC update recorded an unexpected error');"
for old, new, label in ((old_rule, new_rule, 'Rule Source'), (old_pac, new_pac, 'PAC')):
    if text.count(old) != 1:
        raise SystemExit(f'expected one {label} null assertion, found {text.count(old)}')
    text = text.replace(old, new)
path.write_text(text)
