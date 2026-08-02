import json
from pathlib import Path

options_app = Path('apps/extension/src/entrypoints/options/App.svelte').read_text()
fixed_profile = Path('apps/extension/src/entrypoints/options/FixedProfileEditor.svelte').read_text()
chromium_e2e = Path('scripts/e2e-chromium.mjs').read_text()

checks = {
    'builtin-marker': 'data-builtin-settings data-typed-locale={locale}' in options_app,
    'builtin-direct-help-absent': "uiText('options.builtin.directHelp', locale)" not in options_app,
    'about-marker': 'data-about-settings data-typed-locale={locale}' in options_app,
    'original-copy': 'const originalCopy =' in options_app,
    'about-brand': '<h2>ZeroOmega</h2>' in options_app,
    'new-profile-marker': 'data-new-profile-shell' in options_app,
    'empty-profile-marker': 'data-empty-profiles' in options_app,
    'nex-brand-absent': 'ZeroOmega Nex' not in options_app,
    'split-brand-absent': '<span>Zero Omega</span>' not in options_app,
    'history-nav-absent': "uiText('history.nav'" not in options_app,
    'draft-status-absent': 'class="draft-status"' not in options_app,
    'capability-table-absent': 'data-fixed-protocol-capabilities' not in fixed_profile,
    'chromium-about-leak-guard': 'Engineering concepts leaked into the normal About page' in chromium_e2e,
}
print(json.dumps(checks, indent=2, sort_keys=True))
failed = [name for name, passed in checks.items() if not passed]
if failed:
    raise RuntimeError(f'original-facing UI validator false conditions: {failed}')
raise RuntimeError('all diagnostic conditions are true; inspect validator source/runtime mapping')
