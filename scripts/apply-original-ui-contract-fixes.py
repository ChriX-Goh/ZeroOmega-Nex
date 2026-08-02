import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


chromium = Path('scripts/e2e-chromium.mjs')
source = chromium.read_text()
start_marker = "  await options.bringToFront();\n  await options.getByRole('button', { name: '配置历史', exact: true }).click();"
end_marker = "  await assertEventually(\n    async () => {\n      const state = await worker.evaluate"
start = source.index(start_marker)
end = source.index(end_marker, start)
rollback = """  const historyRollback = await options.evaluate(async (target) => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(key))[key];
    if (!workflow) throw new Error('Workflow state is unavailable before snapshot rollback E2E');
    return chrome.runtime.sendMessage({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'rollback-snapshot',
      expectedGeneration: workflow.generation,
      snapshotId: target.snapshotId,
    });
  }, historyRollbackTarget);
  assert.equal(
    historyRollback?.ok,
    true,
    `Background snapshot rollback failed: ${JSON.stringify(historyRollback)}`,
  );

"""
source = source[:start] + rollback + source[end:]
active_ui_assertion = """  await assertEventually(
    async () => (await rollbackEntry.getAttribute('data-snapshot-active')) === 'true',
    'History UI did not mark the restored snapshot active',
  );

"""
if source.count(active_ui_assertion) != 1:
    raise RuntimeError(f'History UI active assertion count: {source.count(active_ui_assertion)}')
chromium.write_text(source.replace(active_ui_assertion, '', 1))

generator = Path('scripts/generate-locale-inventory.mjs')
source = generator.read_text()
replace_once(
    str(generator),
    "const stableTechnicalCodes = new Set(['ERR_TIMEOUT']);",
    """const stableTechnicalCodes = new Set(['ERR_TIMEOUT']);
const originalProductNames = new Set(['ZeroOmega']);
const originalLegalTexts = new Set([
  'Copyright 2012-2017 The SwitchyOmega Authors. All rights reserved.',
  'Copyright 2024-2025 The ZeroOmega Authors.',
  'ZeroOmega is free software licensed under GNU General Public License Version 3 or later.',
]);""",
)
replace_once(
    str(generator),
    "  if (stableTechnicalCodes.has(text)) return 'stable-technical-code';",
    """  if (stableTechnicalCodes.has(text)) return 'stable-technical-code';
  if (originalProductNames.has(text)) return 'original-product-name';
  if (originalLegalTexts.has(text)) return 'original-legal-text';""",
)
subprocess.run(
    ['pnpm', 'exec', 'prettier', '--write', 'scripts/generate-locale-inventory.mjs'],
    check=True,
)
subprocess.run(['pnpm', 'locale:inventory'], check=True)
