from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = """  const independentApply = options.locator('.actions button.apply');
  await assertEventually(
    async () => !(await independentApply.isDisabled()),
    'Independent Rule List changes did not reach the Options Draft',
  );
  await independentApply.click();
  await options
    .getByText('Draft matches the currently applied revision.')
    .waitFor({ state: 'visible', timeout: 20_000 });
"""
new = """  const independentApply = options.locator('.nav-group.actions button.primary');
  await assertEventually(
    async () => !(await independentApply.isDisabled()),
    'Independent Rule List changes did not reach the Options Draft',
  );
  await independentApply.click();
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const state = (await chrome.storage.local.get(key))[key];
        return (
          state !== undefined &&
          state.pendingApply === undefined &&
          JSON.stringify(state.draft) === JSON.stringify(state.applied)
        );
      }),
    'Independent Rule List Apply did not commit the Draft to Applied state',
    20_000,
  );
"""
if text.count(old) != 1:
    raise SystemExit(f'expected one independent Apply block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
