from pathlib import Path

path = Path('.github/patches/apply-profile-exports.py')
text = path.read_text()
old = '    "function FindProxyForURL(url, host) { return \'DIRECT\'; }\\n",\n'
new = '    "function FindProxyForURL(url, host) { return \'DIRECT\'; }\\\\n",\n'
if text.count(old) != 1:
    raise SystemExit(f'expected one raw PAC E2E newline escape, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
