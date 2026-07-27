from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
source = path.read_text()
old = '''  await options.getByRole('button', { name: 'switch', exact: true }).click();
  const attachRuleList = options.getByRole('button', { name: /Attach Rule List/u });
  await attachRuleList.click();
'''
new = '''  await options.getByRole('button', { name: 'switch', exact: true }).click();
  const attachRuleList = options.getByRole('button', { name: /Attach Rule List/u });
  try {
    await attachRuleList.waitFor({ state: 'visible', timeout: 15_000 });
  } catch (error) {
    console.error(`[Scheduler Switch body] ${await options.locator('body').innerText()}`);
    console.error(
      `[Scheduler Switch alerts] ${JSON.stringify(await options.getByRole('alert').allInnerTexts())}`,
    );
    console.error(
      `[Scheduler Switch storage] ${JSON.stringify(await worker.evaluate(async () => chrome.storage.local.get(null)))}`,
    );
    throw error;
  }
  await attachRuleList.click();
'''
if source.count(old) != 1:
    raise SystemExit(f'scheduler E2E diagnostics match count: {source.count(old)}')
path.write_text(source.replace(old, new))
