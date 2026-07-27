from pathlib import Path

editor = Path('apps/extension/src/entrypoints/options/PacProfileEditor.svelte')
text = editor.read_text()
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
editor.write_text(text.replace(old, new, 1))

component = Path('apps/extension/src/component-rendering.component.spec.ts')
text = component.read_text()
old = '''  createFixedProfileDraft,
  createRuleListProfileDraft,
'''
new = '''  createFixedProfileDraft,
  createPacProfileDraft,
  createRuleListProfileDraft,
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one component operation import anchor, found {text.count(old)}')
component.write_text(text.replace(old, new, 1))
