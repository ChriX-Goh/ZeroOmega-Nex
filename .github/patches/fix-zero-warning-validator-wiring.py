from pathlib import Path

path = Path('.github/patches/apply-zero-svelte-warnings.py')
text = path.read_text()
old = '''text = text.replace(
    "const fixedProfilePath = 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte';\\n",
    "const fixedProfilePath = 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte';\\nconst newProfileDialogPath = 'apps/extension/src/entrypoints/options/NewProfileDialog.svelte';\\nconst profileDeletionDialogPathForWarnings =\\n  'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte';\\nconst extensionPackagePath = 'apps/extension/package.json';\\n",
    1,
)
text = text.replace(
    '  fixedProfile,\\n  switchProfile,\\n',
    '  fixedProfile,\\n  newProfileDialog,\\n  profileDeletionDialog,\\n  extensionPackage,\\n  switchProfile,\\n',
    1,
)
text = text.replace(
    "  readFile(fixedProfilePath, 'utf8'),\\n  readFile(switchProfilePath, 'utf8'),\\n",
    "  readFile(fixedProfilePath, 'utf8'),\\n  readFile(newProfileDialogPath, 'utf8'),\\n  readFile(profileDeletionDialogPathForWarnings, 'utf8'),\\n  readFile(extensionPackagePath, 'utf8'),\\n  readFile(switchProfilePath, 'utf8'),\\n",
    1,
)
'''
new = '''text = text.replace(
    "const fixedProfilePath = 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte';\\n",
    "const fixedProfilePath = 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte';\\nconst newProfileDialogPath = 'apps/extension/src/entrypoints/options/NewProfileDialog.svelte';\\nconst extensionPackagePath = 'apps/extension/package.json';\\n",
    1,
)
text = text.replace(
    '  fixedProfile,\\n  switchProfile,\\n',
    '  fixedProfile,\\n  newProfileDialog,\\n  extensionPackage,\\n  switchProfile,\\n',
    1,
)
text = text.replace(
    "  readFile(fixedProfilePath, 'utf8'),\\n  readFile(switchProfilePath, 'utf8'),\\n",
    "  readFile(fixedProfilePath, 'utf8'),\\n  readFile(newProfileDialogPath, 'utf8'),\\n  readFile(extensionPackagePath, 'utf8'),\\n  readFile(switchProfilePath, 'utf8'),\\n",
    1,
)
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one zero-warning validator wiring block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
