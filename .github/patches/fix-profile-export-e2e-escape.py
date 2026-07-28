from pathlib import Path

path = Path('.github/patches/apply-profile-exports.py')
text = path.read_text()
marker = '# Chromium real downloads in the imported cross-profile context.'
if text.count(marker) != 1:
    raise SystemExit(f'expected one Chromium export marker, found {text.count(marker)}')
head, tail = text.split(marker, 1)
old = '    "function FindProxyForURL(url, host) { return \'DIRECT\'; }\\n",\n'
new = '    "function FindProxyForURL(url, host) { return \'DIRECT\'; }\\\\n",\n'
if tail.count(old) != 1:
    raise SystemExit(f'expected one E2E raw PAC newline escape after marker, found {tail.count(old)}')
path.write_text(head + marker + tail.replace(old, new, 1))
