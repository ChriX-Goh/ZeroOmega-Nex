from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = '''  await pacAuthDialog.locator('[data-pac-auth-action="save"]').click();
  await pacAuthDialog.waitFor({ state: 'detached', timeout: 20_000 });

  await options.getByRole('button', { name: 'rule-switchy', exact: true }).click();
'''
new = '''  await pacAuthDialog.locator('[data-pac-auth-action="save"]').click();
  await pacAuthDialog.waitFor({ state: 'detached', timeout: 20_000 });
  await options.getByRole('button', { name: 'General', exact: true }).click();
  const addPacQuickRoute = options.getByLabel('Add quick-switch route');
  await addPacQuickRoute.selectOption({ label: 'pac' });
  await options
    .locator('ol[aria-label="Quick-switch route order"]')
    .getByText('pac', { exact: true })
    .waitFor({ state: 'visible', timeout: 20_000 });

  await options.getByRole('button', { name: 'rule-switchy', exact: true }).click();
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one PAC quick-switch insertion point, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
