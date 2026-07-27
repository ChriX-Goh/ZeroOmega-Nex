from pathlib import Path

path = Path('apps/extension/wxt.config.ts')
text = path.read_text()
old = """const ruleSourceE2eHostPermissions =
  process.env.ZEROOMEGA_RULE_SOURCE_E2E === '1'
    ? ['http://127.0.0.1/*', 'https://*.example.co.uk/*']
    : [];
"""
new = """const diagnosticsE2e = process.env.ZEROOMEGA_RULE_SOURCE_E2E === '1';
const ruleSourceE2eHostPermissions = diagnosticsE2e
  ? ['http://*/*', 'https://*/*']
  : [];
"""
if text.count(old) != 1:
    raise SystemExit('E2E host permission declaration was not found')
text = text.replace(old, new, 1)
old = """    permissions: ['proxy', 'storage', 'alarms', 'activeTab', 'contextMenus'],
    optional_permissions:
      browser === 'firefox'
        ? ['webRequest', 'webRequestBlocking']
        : ['webRequest', 'webRequestAuthProvider'],
"""
new = """    permissions: [
      'proxy',
      'storage',
      'alarms',
      'activeTab',
      'contextMenus',
      ...(diagnosticsE2e ? ['webRequest'] : []),
    ],
    optional_permissions:
      browser === 'firefox'
        ? diagnosticsE2e
          ? ['webRequestBlocking']
          : ['webRequest', 'webRequestBlocking']
        : diagnosticsE2e
          ? ['webRequestAuthProvider']
          : ['webRequest', 'webRequestAuthProvider'],
"""
if text.count(old) != 1:
    raise SystemExit('manifest permission declaration was not found')
path.write_text(text.replace(old, new, 1))

validator = Path('scripts/validate-ui-compatibility.mjs')
text = validator.read_text()
old = """    manifest.includes("permissions: ['proxy', 'storage', 'alarms', 'activeTab', 'contextMenus']") &&
      runtime.includes('registerRuleSourceScheduler') &&"""
new = """    ['proxy', 'storage', 'alarms', 'activeTab', 'contextMenus'].every((permission) =>
      manifest.includes(`'${permission}'`),
    ) &&
      manifest.includes("...(diagnosticsE2e ? ['webRequest'] : [])") &&
      runtime.includes('registerRuleSourceScheduler') &&"""
if text.count(old) != 1:
    raise SystemExit('manifest scheduler permission guard was not found')
validator.write_text(text.replace(old, new, 1))
