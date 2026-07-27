from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = '  const rawPacActivation = await worker.evaluate(async () => {'
new = '  const rawPacActivation = await options.evaluate(async () => {'
if text.count(old) != 1:
    raise SystemExit(f'expected one raw PAC activation sender, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
