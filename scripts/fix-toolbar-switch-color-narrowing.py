from pathlib import Path

path = Path('apps/extension/src/lib/original-toolbar-profile-resolver.ts')
text = path.read_text(encoding='utf-8')
old = """    if (
      profile.attachedRuleListProfileId !== undefined ||
      decision.status !== 'resolved' ||
"""
new = """    if (
      profile.color === undefined ||
      profile.attachedRuleListProfileId !== undefined ||
      decision.status !== 'resolved' ||
"""
count = text.count(old)
if count != 1:
    raise SystemExit(f'Switch color narrowing: expected one match, found {count}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
