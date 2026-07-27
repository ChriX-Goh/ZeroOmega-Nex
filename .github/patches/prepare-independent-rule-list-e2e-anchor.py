from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
anchor = """  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  const resultPopup = await context.newPage();"""
if text.count(anchor) != 1:
    raise SystemExit(f'expected one post-round-trip Popup anchor, found {text.count(anchor)}')
path.write_text(text.replace(anchor, anchor.replace('\n\n  const resultPopup', '\n  // independent-rule-list-e2e-anchor\n\n  const resultPopup'), 1))
