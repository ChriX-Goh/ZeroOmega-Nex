from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
source = path.read_text()
old_permission = "manifest.includes(\"permissions: ['proxy', 'storage', 'alarms']\")"
new_permission = "manifest.includes(\"permissions: ['proxy', 'storage', 'alarms', 'activeTab']\")"
if source.count(old_permission) != 1:
    raise SystemExit(f'scheduler permission guard match: {source.count(old_permission)}')
source = source.replace(old_permission, new_permission)
old_popup = '''    popupApp.includes('data-popup-add-current-site') &&
      popupApp.includes('data-popup-condition-form') &&
      popupApp.includes("action: 'add-current-site-condition'") &&
      popupApp.includes('listPopupConditionResultRoutes') &&
      currentSite.includes("from 'tldts'") &&
      currentSite.includes('allowPrivateDomains: true') &&
      currentSite.includes("pattern: `*.${scopedDomain}`") &&
      popupCondition.includes('addConditionsToBottom') &&
      popupCondition.includes('profile.rules.unshift(rule)') &&
      popupCondition.includes('profile.rules.push(rule)') &&
      popupCondition.includes('popupConditionTag') &&
      manifest.includes("'activeTab'") &&
      runtime.includes('BrowserProfileWorkflowActivationDriver'),
'''
new_popup = '''    popupApp.includes('data-popup-add-current-site') &&
      popupApp.includes('data-popup-condition-form') &&
      popupApp.includes("action: 'add-current-site-condition'") &&
      popupApp.includes('listPopupConditionResultRoutes') &&
      currentSite.includes("import { parse } from 'tldts'") &&
      currentSite.includes('allowPrivateDomains: true') &&
      currentSite.includes('parsedDomain.domain ?? hostname') &&
      currentSite.includes('suggestCurrentSiteCondition') &&
      popupCondition.includes('draft.settings.interface.addConditionsToBottom') &&
      popupCondition.includes('profile.rules.unshift(rule)') &&
      popupCondition.includes('profile.rules.push(rule)') &&
      popupCondition.includes('popupConditionTag(input.condition)') &&
      manifest.includes("'activeTab'"),
'''
if source.count(old_popup) != 1:
    raise SystemExit(f'Popup guard block match: {source.count(old_popup)}')
path.write_text(source.replace(old_popup, new_popup))
