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
text = text.replace(old_import_patch, new_import_patch)

old_e2e = """    const switchProfile = workflow?.applied?.profiles?.find((profile) => profile.name === 'switch');
    const activeRoute = resultStorage['zeroomega-nex/browser-proxy/v1/state']?.activeRoute;
    return (
      switchProfile?.defaultRoute?.kind === 'profile' &&
      workflow?.draft?.revision?.id === workflow?.applied?.revision?.id &&
      activeRoute?.kind === 'profile'
    );
"""
new_e2e = """    const switchProfile = workflow?.applied?.profiles?.find((profile) => profile.name === 'switch');
    const proxyState = resultStorage['zeroomega-nex/browser-proxy/v1/state'];
    const activeSnapshot = proxyState?.activeSnapshotId
      ? resultStorage[`zeroomega-nex/browser-proxy/v1/snapshot/${proxyState.activeSnapshotId}`]
      : undefined;
    return (
      switchProfile?.defaultRoute?.kind === 'profile' &&
      workflow?.draft?.revision?.id === workflow?.applied?.revision?.id &&
      activeSnapshot?.startRoute?.kind === 'profile' &&
      activeSnapshot.startRoute.profileId === switchProfile.id
    );
"""
if text.count(old_e2e) != 1:
    raise SystemExit(f'Popup result E2E state patch match count: {text.count(old_e2e)}')
path.write_text(text.replace(old_e2e, new_e2e))
