from pathlib import Path

path = Path('.github/patches/apply-independent-rule-list-editor.py')
text = path.read_text()
old = """  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  const resultPopup = await context.newPage();"""
new = """  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();
  // independent-rule-list-e2e-anchor

  const resultPopup = await context.newPage();"""
if text.count(old) != 1:
    raise SystemExit(f'expected one patch anchor string, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
