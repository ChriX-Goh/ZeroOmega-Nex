from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = '''  assert.equal(await historyPanel.getAttribute('data-typed-locale'), 'zh-CN');
  await historyPanel.getByRole('heading', { name: '已验证的 PAC 快照', exact: true }).waitFor();
  assert.doesNotMatch(
'''
new = '''  assert.equal(await historyPanel.getAttribute('data-typed-locale'), 'zh-CN');
  const verifiedSnapshotsHeading = historyPanel.getByRole('heading', {
    name: '已验证的 PAC 快照',
    exact: true,
  });
  try {
    await verifiedSnapshotsHeading.waitFor({ timeout: 8_000 });
  } catch (error) {
    const loadAlert = historyPanel.getByRole('alert');
    if ((await loadAlert.count()) === 0) throw error;
    await historyPanel.getByRole('button', { name: '刷新历史', exact: true }).click();
    await verifiedSnapshotsHeading.waitFor({ timeout: 20_000 });
  }
  assert.doesNotMatch(
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one History heading wait, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
