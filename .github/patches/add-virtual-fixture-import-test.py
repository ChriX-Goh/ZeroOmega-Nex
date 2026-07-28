from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'packages/legacy-zeroomega/src/import.test.ts',
    '''    expect(result.report.summary.rejected).toBe(0);
  });

  it('imports a base64-encoded backup through the full migration pipeline', async () => {
''',
    '''    expect(result.report.summary.rejected).toBe(0);
  });

  it('imports the Virtual cross-reference browser fixture without rejected entries', async () => {
    const result = importZeroOmegaBackup(
      await fixture('virtual-reference-migration.json'),
      context,
    );
    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
    expect(result.ok).toBe(true);
    expect(result.report.summary.rejected).toBe(0);
    expect(result.candidate.profiles.map((profile) => profile.name)).toEqual([
      'Target Proxy',
      'Unrelated Proxy',
      'Route Matrix',
      'Rule Matrix',
      'PAC Matrix',
      'Auto Matrix',
      'Existing Alias',
    ]);
  });

  it('imports a base64-encoded backup through the full migration pipeline', async () => {
''',
)

replace_once(
    'scripts/e2e-chromium.mjs',
    "  await virtualOptions.getByRole('button', { name: '导入并立即使用', exact: true }).click();\n",
    "  await virtualOptions.locator('.import-actions button.primary').click();\n",
)
