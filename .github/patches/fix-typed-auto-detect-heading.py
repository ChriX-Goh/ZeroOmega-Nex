from pathlib import Path

path = Path('.github/patches/patch-typed-auto-detect-tests-docs.py')
text = path.read_text()
old = "getByRole('heading', { name: '自动检测', exact: true })"
new = "getByRole('heading', { name: '自动检测情景模式', exact: true })"
count = text.count(old)
if count != 1:
    raise SystemExit(f'{path}: expected one Auto Detect heading assertion, found {count}')
path.write_text(text.replace(old, new, 1))
print('Aligned Chromium Auto Detect heading with the shared profile-kind terminology.')
