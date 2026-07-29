from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = """  await conditionApply.click();
  await assertEventually(
    async () =>
      creationWorker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow?.lastApply?.status === 'failed' &&
          workflow?.draft?.profiles?.some((profile) => profile.name === 'Created Switch') &&
          !workflow?.applied?.profiles?.some((profile) => profile.name === 'Created Switch')
        );
      }),
    'Strict Apply did not reject the invalid regular expression while preserving Draft',
    20_000,
  );
"""
new = """  await conditionApply.click();
  await creationOptions.locator('.global-error [role="alert"]').waitFor({
    state: 'visible',
    timeout: 20_000,
  });
  await assertEventually(
    async () =>
      creationWorker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        const draftProfile = workflow?.draft?.profiles?.find(
          (profile) => profile.name === 'Created Switch',
        );
        return (
          workflow !== undefined &&
          workflow.pendingApply === undefined &&
          draftProfile?.kind === 'switch' &&
          draftProfile.rules?.[0]?.condition?.kind === 'host-regex' &&
          draftProfile.rules[0].condition.pattern === '[' &&
          !workflow.applied.profiles.some((profile) => profile.name === 'Created Switch')
        );
      }),
    'Strict Apply did not reject the invalid regular expression while preserving Draft',
    20_000,
  );
"""
if text.count(old) != 1:
    raise SystemExit(f'invalid Apply assertion matches: {text.count(old)}')
path.write_text(text.replace(old, new))
print('Corrected Chromium invalid Apply assertion to the pre-activation contract.')
