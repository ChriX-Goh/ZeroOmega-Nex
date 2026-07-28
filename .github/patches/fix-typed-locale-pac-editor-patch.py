from pathlib import Path

path = Path('.github/patches/apply-typed-locale-pac-editor.py')
text = path.read_text()

old_read_patch = '''replace_once(
    path,
    "      authError = error instanceof Error ? error.message : String(error);\\n",
    "      authError = uiText('pac.authReadFailed', locale);\\n",
)
'''
new_read_patch = '''replace_once(
    path,
    "    try {\\n      authPassword = await onReadSecret(authSecretRef);\\n      authOriginalPassword = authPassword;\\n    } catch (error) {\\n      authError = error instanceof Error ? error.message : String(error);\\n    } finally {\\n      authLoading = false;\\n    }\\n",
    "    try {\\n      authPassword = await onReadSecret(authSecretRef);\\n      authOriginalPassword = authPassword;\\n    } catch {\\n      authError = uiText('pac.authReadFailed', locale);\\n    } finally {\\n      authLoading = false;\\n    }\\n",
)
'''
if text.count(old_read_patch) != 1:
    raise SystemExit(f'expected one generic PAC auth read replacement, found {text.count(old_read_patch)}')
text = text.replace(old_read_patch, new_read_patch, 1)

old_missing_patch = '''replace_once(
    path,
    "      authError = 'PAC Profile no longer exists.';\\n",
    "      authError = uiText('pac.missingProfile', locale);\\n",
)
'''
new_missing_patch = '''replace_once(
    path,
    "    if (!target) {\\n      authError = 'PAC Profile no longer exists.';\\n      return;\\n    }\\n",
    "    if (!target) {\\n      authError = uiText('pac.missingProfile', locale);\\n      authSaving = false;\\n      return;\\n    }\\n",
)
'''
if text.count(old_missing_patch) != 1:
    raise SystemExit(f'expected one PAC missing-profile replacement, found {text.count(old_missing_patch)}')
text = text.replace(old_missing_patch, new_missing_patch, 1)

old_style_patch = '''replace_once(
    path,
    "  .header-row {\\n",
    "  .auth-warning {\\n    width: min(100%, 920px);\\n    margin: 0.75rem 0;\\n    padding: 0.7rem 0.85rem;\\n    border: 1px solid var(--danger);\\n    background: color-mix(in srgb, var(--danger) 8%, transparent);\\n  }\\n\\n  .auth-warning p {\\n    margin: 0.25rem 0;\\n  }\\n\\n  .header-row {\\n",
)
'''
new_style_patch = '''replace_once(
    path,
    "  .header-row {\\n    display: grid;\\n",
    "  .auth-warning {\\n    width: min(100%, 920px);\\n    margin: 0.75rem 0;\\n    padding: 0.7rem 0.85rem;\\n    border: 1px solid var(--danger);\\n    background: color-mix(in srgb, var(--danger) 8%, transparent);\\n  }\\n\\n  .auth-warning p {\\n    margin: 0.25rem 0;\\n  }\\n\\n  .header-row {\\n    display: grid;\\n",
)
'''
if text.count(old_style_patch) != 1:
    raise SystemExit(f'expected one generic PAC style replacement, found {text.count(old_style_patch)}')
path.write_text(text.replace(old_style_patch, new_style_patch, 1))

integration_path = Path('.github/patches/apply-typed-locale-pac-integration.py')
integration = integration_path.read_text()
old_guard_marker = '''  entries.firefoxE2e,\n  "compilerVersion, 'raw-pac/1'",\n  'Firefox PAC raw-snapshot interaction coverage is missing.',\n'''
new_guard_marker = '''  entries.firefoxE2e,\n  'Firefox did not install a raw PAC snapshot',\n  'Firefox PAC raw-snapshot interaction coverage is missing.',\n'''
if integration.count(old_guard_marker) != 1:
    raise SystemExit(f'expected one Firefox PAC guard marker, found {integration.count(old_guard_marker)}')
integration_path.write_text(integration.replace(old_guard_marker, new_guard_marker, 1))
