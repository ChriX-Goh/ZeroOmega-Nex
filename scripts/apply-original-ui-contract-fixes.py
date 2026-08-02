import re
import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old!r}")
    target.write_text(source.replace(old, new, 1))


options = Path('apps/extension/src/entrypoints/options/App.svelte')
source = options.read_text()
for old in (
    "  import SnapshotHistoryPanel from './SnapshotHistoryPanel.svelte';\n",
    "    | 'history'\n",
    "        'history',\n",
):
    if source.count(old) != 1:
        raise RuntimeError(f'Options removal count for {old!r}: {source.count(old)}')
    source = source.replace(old, '', 1)

source, rollback_count = re.subn(
    r"\n  async function rollbackSnapshot\([\s\S]*?\n  async function replaceDraftAndSelect",
    "\n  async function replaceDraftAndSelect",
    source,
    count=1,
)
if rollback_count != 1:
    raise RuntimeError(f'Options rollback adapter removal count: {rollback_count}')

history_start = "    {:else if activeSection === 'history' && state}"
builtin_start = "    {:else if activeSection === 'builtin' && state}"
if source.count(history_start) != 1 or source.count(builtin_start) != 1:
    raise RuntimeError(
        f'Options History render markers: history={source.count(history_start)}, builtin={source.count(builtin_start)}'
    )
start = source.index(history_start)
end = source.index(builtin_start, start)
source = source[:start] + source[end:]
options.write_text(source)

validator = Path('scripts/validate-ui-compatibility.mjs')
source = validator.read_text()
marker = (
    "'Snapshot History must render through the typed catalog and retain a real Chromium "
    "rollback that converges browser, Applied, Draft, and UI state.'"
)
if source.count(marker) != 1:
    raise RuntimeError(f'Snapshot History validator marker count: {source.count(marker)}')
marker_index = source.index(marker)
start = source.rfind('\n  [', 0, marker_index)
end_marker = '\n  ],'
end = source.index(end_marker, marker_index) + len(end_marker)
if start < 0 or end <= marker_index:
    raise RuntimeError('could not isolate Snapshot History validator requirement')
requirement = '''
  [
    !optionsApp.includes('import SnapshotHistoryPanel') &&
      !optionsApp.includes('<SnapshotHistoryPanel') &&
      !optionsApp.includes("activeSection === 'history'") &&
      !optionsApp.includes("uiText('history.nav'") &&
      chromiumE2e.includes("action: 'rollback-snapshot'") &&
      chromiumE2e.includes('Background snapshot rollback failed') &&
      chromiumE2e.includes(
        'History rollback did not restore browser state and both workflow revisions',
      ),
    'Snapshot rollback must remain background-tested without exposing Snapshot History in ordinary Options.',
  ],'''
validator.write_text(source[:start] + requirement + source[end:])

replace_once(
    'scripts/e2e-firefox.mjs',
    """  await newRuleProfileAction.click();
  const newRuleName = await driver.wait(""",
    """  await driver.wait(until.elementIsEnabled(newRuleProfileAction), 10_000);
  await newRuleProfileAction.click();
  const newRuleName = await driver.wait(""",
)
replace_once(
    'scripts/e2e-firefox.mjs',
    """  await newPacProfileAction.click();
  const newPacName = await driver.wait(""",
    """  await driver.wait(until.elementIsEnabled(newPacProfileAction), 10_000);
  await newPacProfileAction.click();
  const newPacName = await driver.wait(""",
)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        'apps/extension/src/entrypoints/options/App.svelte',
        'scripts/validate-ui-compatibility.mjs',
        'scripts/e2e-firefox.mjs',
    ],
    check=True,
)
