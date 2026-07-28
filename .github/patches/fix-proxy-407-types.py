from pathlib import Path

app = Path('apps/extension/src/entrypoints/options/App.svelte')
text = app.read_text()
old = """  import { runWithProxyAuthenticationPermission } from '../../lib/proxy-auth-permission-client';
"""
new = """  import {
    requestProxyAuthenticationPermission,
    runWithProxyAuthenticationPermission,
  } from '../../lib/proxy-auth-permission-client';
"""
if text.count(old) != 1:
    raise SystemExit(f'App proxy permission import mismatch: {text.count(old)}')
app.write_text(text.replace(old, new))

test = Path('apps/extension/src/lib/proxy-auth-permission-client.test.ts')
text = test.read_text()
text = text.replace(
    "import { createDefaultProfileSpec } from '@zeroomega-nex/profile-spec';",
    "import { PROFILE_SPEC_SCHEMA_VERSION, type ProfileSpec } from '@zeroomega-nex/profile-spec';",
)
old_function = """function credentialedSpec() {
  const spec = createDefaultProfileSpec();
  const fixed = spec.profiles.find((profile) => profile.kind === 'fixed');
  if (!fixed || fixed.kind !== 'fixed') throw new Error('default Fixed profile is missing');
"""
new_function = """function plainSpec(): ProfileSpec {
  return {
    schemaVersion: PROFILE_SPEC_SCHEMA_VERSION,
    documentId: 'document-permission-test',
    revision: { id: 'revision-permission-test', createdAt: '2026-07-29T00:00:00.000Z' },
    profiles: [
      {
        id: 'profile-fixed-permission-test',
        name: 'Proxy',
        kind: 'fixed',
        proxyByScheme: {},
        bypass: [],
      },
    ],
    proxyEndpoints: [],
    ruleSources: [],
    settings: {
      startup: { revertProxyChanges: false },
      quickSwitch: { enabled: false, routes: [], refreshOnChange: false },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        addConditionsToBottom: false,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: true,
        showAdvancedConditions: false,
        exportLegacyRuleList: false,
      },
      ruleSourceUpdateIntervalMinutes: 0,
    },
  };
}

function credentialedSpec(): ProfileSpec {
  const spec = plainSpec();
  const fixed = spec.profiles[0];
  if (!fixed || fixed.kind !== 'fixed') throw new Error('test Fixed profile is missing');
"""
if text.count(old_function) != 1:
    raise SystemExit(f'credentialedSpec anchor mismatch: {text.count(old_function)}')
text = text.replace(old_function, new_function)
text = text.replace('const plain = createDefaultProfileSpec();', 'const plain = plainSpec();')
text = text.replace('const pac = createDefaultProfileSpec();', 'const pac = plainSpec();')
text = text.replace(
    'runWithProxyAuthenticationPermission(createDefaultProfileSpec(), action, client.value)',
    'runWithProxyAuthenticationPermission(plainSpec(), action, client.value)',
)
test.write_text(text)
