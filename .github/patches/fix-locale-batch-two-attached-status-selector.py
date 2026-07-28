from pathlib import Path

path = Path('.github/patches/fix-locale-batch-two-localization-guard-anchor.py')
text = path.read_text()
old = '''replace_once(
    'scripts/e2e-chromium.mjs',
    "filter({ hasText: 'Last updated' })",
    "filter({ hasText: '规则列表最后更新于' })",
)
'''
new = '''replace_once(
    'scripts/e2e-chromium.mjs',
    "await ruleUpdateStatus.filter({ hasText: 'Last updated' }).waitFor({ timeout: 20_000 });",
    "await ruleUpdateStatus.filter({ hasText: '规则列表最后更新于' }).waitFor({ timeout: 20_000 });",
)
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one generic attached status selector patch, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
