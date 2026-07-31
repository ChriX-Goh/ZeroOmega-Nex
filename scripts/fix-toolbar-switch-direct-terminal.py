from pathlib import Path

path = Path('apps/extension/src/lib/original-toolbar-profile-resolver.ts')
text = path.read_text(encoding='utf-8')
old = "const allowedActions = new Set(['enter-profile', 'switch-rule', 'switch-default']);"
new = "const allowedActions = new Set(['enter-profile', 'switch-rule', 'switch-default', 'direct']);"
count = text.count(old)
if count != 1:
    raise SystemExit(f'Switch Direct terminal trace: expected one match, found {count}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
