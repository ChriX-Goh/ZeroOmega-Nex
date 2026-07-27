from pathlib import Path

ui = Path('.github/patches/apply-pac-remote-ui.py')
text = ui.read_text()
old = '''    const route =
      value === ''
        ? undefined
        : value === 'direct' || value === 'system'
          ? { kind: value }
'''
new = '''    const route: ProfileRouteTarget | undefined =
      value === ''
        ? undefined
        : value === 'direct' || value === 'system'
          ? { kind: value }
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one PAC fallback route declaration, found {text.count(old)}')
text = text.replace(old, new, 1)
old = '''  createFixedProfileDraft,
  createRuleListProfileDraft,
'''
new = '''  createFixedProfileDraft,
  createPacProfileDraft,
  createRuleListProfileDraft,
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one component operation import anchor, found {text.count(old)}')
ui.write_text(text.replace(old, new, 1))
