from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:160]!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'scripts/e2e-chromium.mjs',
    "import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';",
    "import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    """  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  const resultPopup = await context.newPage();""",
    """  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  const firstExportPromise = options.waitForEvent('download');
  await options.locator('[data-legacy-export]').click();
  const firstExport = await firstExportPromise;
  assert.match(
    firstExport.suggestedFilename(),
    /^ZeroOmegaOptions-\\d{4}-\\d{2}-\\d{2}T.*\\.bak$/u,
  );
  const firstExportPath = await firstExport.path();
  assert.ok(firstExportPath, 'The first Options export did not produce a local file');
  const firstExportContent = await readFile(firstExportPath, 'utf8');
  const firstExportOptions = JSON.parse(firstExportContent);
  assert.equal(firstExportOptions.schemaVersion, 2);
  assert.equal(firstExportOptions['+switch']?.profileType, 'SwitchProfile');
  assert.equal(firstExportOptions['+fixed']?.profileType, 'FixedProfile');
  assert.doesNotMatch(firstExportContent, /passwordSecretRef|secretRef|not-a-real-secret/u);

  await worker.evaluate(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
  });
  await options.reload();
  await options.waitForLoadState('domcontentloaded');
  await options.getByRole('button', { name: 'Proxy', exact: true }).waitFor({ timeout: 20_000 });
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await options.getByLabel('原版备份文件').setInputFiles(firstExportPath);
  await options.getByRole('heading', { name: '兼容性检查', exact: true }).waitFor();
  await options
    .getByRole('button', { name: '导入并立即使用', exact: true })
    .click();
  await options
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  const secondExportPromise = options.waitForEvent('download');
  await options.locator('[data-legacy-export]').click();
  const secondExport = await secondExportPromise;
  const secondExportPath = await secondExport.path();
  assert.ok(secondExportPath, 'The second Options export did not produce a local file');
  const secondExportContent = await readFile(secondExportPath, 'utf8');
  assert.equal(
    secondExportContent,
    firstExportContent,
    'Export → clear → import → export did not preserve the original-compatible Options semantics',
  );
  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  const resultPopup = await context.newPage();""",
)
