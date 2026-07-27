from pathlib import Path

path = Path('.github/patches/apply-popup-result-profile.py')
text = path.read_text()

old_css = """replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    '''  border-left: 3px solid transparent;
''',
    '''  border-left: 0;
''',
)
"""
new_css = """replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    '''  border: 0;
  border-left: 3px solid transparent;
  background: transparent;
''',
    '''  border: 0;
  border-left: 0;
  background: transparent;
''',
)
"""
if text.count(old_css) != 1:
    raise SystemExit(f'Popup result CSS patch match count: {text.count(old_css)}')
text = text.replace(old_css, new_css)

old_guard = """      popupCondition.includes('setPopupProfileResultDraft') &&
      popupCondition.includes("profile.kind === 'switch'") &&
      popupCondition.includes("profile.kind === 'virtual'") &&
      popupCondition.includes('listPopupProfileResultRoutes'),
"""
new_guard = """      popupCondition.includes('setPopupProfileResultDraft') &&
      popupCondition.includes('profile.defaultRoute = structuredClone(route)') &&
      popupCondition.includes('profile.targetRoute = structuredClone(route)') &&
      popupCondition.includes('listPopupProfileResultRoutes'),
"""
if text.count(old_guard) != 1:
    raise SystemExit(f'Popup result guard patch match count: {text.count(old_guard)}')
text = text.replace(old_guard, new_guard)

old_import_patch = """source = source.replace(
    '''  addPopupConditionDraft,
  listPopupConditionResultRoutes,
''',
    '''  addPopupConditionDraft,
  listPopupConditionResultRoutes,
  setPopupProfileResultDraft,
''',
)
"""
new_import_patch = """source = source.replace(
    \"import { addPopupConditionDraft, listPopupConditionResultRoutes } from './popup-condition.js';\",
    \"import { addPopupConditionDraft, listPopupConditionResultRoutes, setPopupProfileResultDraft } from './popup-condition.js';\",
)
"""
if text.count(old_import_patch) != 1:
    raise SystemExit(f'Popup result test import patch match count: {text.count(old_import_patch)}')
path.write_text(text.replace(old_import_patch, new_import_patch))
