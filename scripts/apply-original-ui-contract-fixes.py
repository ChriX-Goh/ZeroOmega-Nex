import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """html,
body {
  width: 320px;
  min-width: 320px;""",
    """html,
body {
  width: 440px;
  min-width: 440px;""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.popup-shell {
  width: 320px;""",
    """.popup-shell {
  width: 440px;""",
)

replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    'class:has-result={item.resultRoute !== undefined} class="profile-row"',
    'class:has-result={item.resultRoute !== undefined &&\n            sameRoute(runtime?.activeRoute, item.route)}\n          class="profile-row"',
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    '{#if item.resultRoute && state}',
    '{#if item.resultRoute && state && sameRoute(runtime?.activeRoute, item.route)}',
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    '{#if item.resultRoute && item.resultItems && item.resultItems.length > 0}',
    """{#if item.resultRoute &&
            item.resultItems &&
            item.resultItems.length > 0 &&
            sameRoute(runtime?.activeRoute, item.route)}""",
)

replace_once(
    'scripts/e2e-chromium.mjs',
    """  await initialPopup.getByRole('button', { name: '直接连接', exact: true }).waitFor();
  const initialButtons = initialPopup.locator('.profile-list button');""",
    """  await initialPopup.getByRole('button', { name: '直接连接', exact: true }).waitFor();
  assert.equal(
    await initialPopup.locator('[data-popup-result-profile]').count(),
    0,
    'Inactive default Switch exposed a result selector in the System Popup state',
  );
  assert.equal(
    await initialPopup.locator('.profile-result-label').count(),
    0,
    'Inactive default Switch exposed a result label in the System Popup state',
  );
  const initialButtons = initialPopup.locator('.profile-list button');""",
)

replace_once(
    'scripts/e2e-firefox.mjs',
    """  await direct.click();
  await driver.wait(until.elementIsDisabled(direct), 15_000);""",
    """  await direct.click();
  await driver.wait(until.elementIsDisabled(direct), 15_000);
  assert.equal(
    (await driver.findElements(By.css('[data-popup-result-profile]'))).length,
    0,
    'Inactive default Switch exposed a result selector in the Direct Popup state',
  );
  assert.equal(
    (await driver.findElements(By.css('.profile-result-label'))).length,
    0,
    'Inactive default Switch exposed a result label in the Direct Popup state',
  );""",
)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        'apps/extension/src/entrypoints/popup/App.svelte',
        'apps/extension/src/entrypoints/popup/style.css',
        'scripts/e2e-chromium.mjs',
        'scripts/e2e-firefox.mjs',
    ],
    check=True,
)
