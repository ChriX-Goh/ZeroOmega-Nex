from pathlib import Path

path = Path('.github/patches/apply-typed-locale-pac-integration.py')
text = path.read_text()
old = '''requireText(\n  entries.firefoxE2e,\n  \"compilerVersion, 'raw-pac/1'\",\n  'Firefox PAC raw-snapshot interaction coverage is missing.',\n);\n'''
new = '''requireText(\n  entries.firefoxE2e,\n  \"'raw-pac/1'\",\n  'Firefox PAC raw-snapshot interaction coverage is missing.',\n);\nrequireText(\n  entries.firefoxE2e,\n  'Firefox PAC E2E',\n  'Firefox PAC profile creation interaction coverage is missing.',\n);\n'''
if text.count(old) != 1:
    raise SystemExit(f'expected one Firefox PAC locale guard, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
