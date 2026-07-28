from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = '''  await virtualOptions.getByRole('button', { name: 'Auto Matrix', exact: true }).click();
  assert.equal(await virtualOptions.locator('[data-profile-export-pac]').count(), 0);
'''
new = '''  await virtualOptions.getByRole('button', { name: 'Auto Matrix', exact: true }).click();
  await virtualOptions.getByRole('heading', { name: 'Auto Matrix', exact: true }).waitFor();
  assert.equal(await virtualOptions.locator('[data-profile-export-pac]').count(), 0);
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one Auto Detect export assertion, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
