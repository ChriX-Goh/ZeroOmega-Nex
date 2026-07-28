from pathlib import Path

path = Path('.github/patches/apply-typed-locale-pac-editor.py')
text = path.read_text()
old = '''replace_once(
    path,
    "      authError = error instanceof Error ? error.message : String(error);\\n",
    "      authError = uiText('pac.authReadFailed', locale);\\n",
)
'''
new = '''replace_once(
    path,
    "    try {\\n      authPassword = await onReadSecret(profile.credential.passwordSecretRef);\\n    } catch (error) {\\n      authError = error instanceof Error ? error.message : String(error);\\n    } finally {\\n      authLoading = false;\\n    }\\n",
    "    try {\\n      authPassword = await onReadSecret(profile.credential.passwordSecretRef);\\n    } catch {\\n      authError = uiText('pac.authReadFailed', locale);\\n    } finally {\\n      authLoading = false;\\n    }\\n",
)
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one generic PAC auth read replacement, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
