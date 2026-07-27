from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = """  await independentText.fill('[SwitchyOmega Conditions]\\n@with result\\n\\n* +direct\\n');
  await independentText.press('Tab');

  const resultPopup = await context.newPage();"""
new = """  await independentText.fill('[SwitchyOmega Conditions]\\n@with result\\n\\n* +direct\\n');
  await independentText.press('Tab');
  const independentApply = options.getByRole('button', { name: 'Apply changes', exact: true });
  await assertEventually(
    async () => !(await independentApply.isDisabled()),
    'Independent Rule List changes did not reach the Options Draft',
  );
  await independentApply.click();
  await options
    .getByText('Draft matches the currently applied revision.')
    .waitFor({ state: 'visible', timeout: 20_000 });

  const resultPopup = await context.newPage();"""
if text.count(old) != 1:
    raise SystemExit(f'expected one independent Rule List apply insertion point, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
