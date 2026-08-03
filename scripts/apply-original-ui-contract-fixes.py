from pathlib import Path
import subprocess


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


chromium_path = 'scripts/e2e-chromium.mjs'
evidence_path = 'docs/AUDIT_EVIDENCE_02O_POPUP_RESULT_CONTROL_REMOVAL.md'

replace_once(
    chromium_path,
    """  const switchResult = resultPopup.getByLabel('switch 的结果情景模式');
  await switchResult.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await switchResult.inputValue(), 'direct');
  await switchResult.selectOption({ label: 'fixed' });
  await assertEventually(async () => {""",
    """  const activeImportedSwitch = resultPopup.getByRole('button', {
    name: 'switch',
    exact: true,
  });
  await activeImportedSwitch.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await activeImportedSwitch.isDisabled(), true);
  assert.equal((await activeImportedSwitch.innerText()).trim(), 'switch');
  assert.equal(
    await resultPopup.locator('[data-popup-result-profile]').count(),
    0,
    'Imported active Switch exposed a result selector in the Chromium Popup',
  );
  assert.equal(
    await resultPopup.locator('.profile-result-label').count(),
    0,
    'Imported active Switch exposed a result label in the Chromium Popup',
  );
  const resultCapability = await resultPopup.evaluate(async () => {
    const channel = 'zeroomega-nex/profile-workflow/v1';
    const current = await chrome.runtime.sendMessage({ channel, action: 'get' });
    const switchProfile = current.state.applied.profiles.find(
      (profile) => profile.name === 'switch',
    );
    const fixedProfile = current.state.applied.profiles.find(
      (profile) => profile.name === 'fixed',
    );
    if (!switchProfile || !fixedProfile) {
      return { ok: false, reason: 'imported result profiles missing' };
    }
    return chrome.runtime.sendMessage({
      channel,
      action: 'set-popup-profile-result',
      expectedAppliedRevisionId: current.state.applied.revision.id,
      profileId: switchProfile.id,
      route: { kind: 'profile', profileId: fixedProfile.id },
    });
  });
  assert.equal(
    resultCapability?.ok,
    true,
    `Background result mutation failed: ${JSON.stringify(resultCapability)}`,
  );
  await assertEventually(async () => {""",
)
replace_once(
    chromium_path,
    """  }, 'Popup result profile was not applied while preserving the active Switch route');""",
    """  }, 'Background result profile mutation did not preserve the active Switch route');""",
)

evidence = Path(evidence_path).read_text()
marker = 'Ordinary Head `43060a3b753dad758ae270625e7af46f70059775` exposed one stale Chromium test contract.'
if marker not in evidence:
    evidence += """

## First ordinary-Head result

Ordinary Head `43060a3b753dad758ae270625e7af46f70059775` proved the product correction in schema-3 paired evidence. Artifact `8845318793` (`sha256:2e0801eab0ab1d02244a050f2e660661359b5289637d6213a8fbae5969e6bc15`) shows active Fixed and active Switch text lines exactly match Original, both result-control metric arrays are empty, and the prior 29px height expansion is gone.

Firefox main E2E also passed the new active-Switch absence assertions. Chromium failed later because an older capability test still attempted to operate the removed Popup select. The corrected test now verifies the active imported Switch remains a single line with no result UI, then exercises `set-popup-profile-result` directly through the verified background command and retains the same atomic storage/snapshot assertions.

This is a test-contract correction, not a product rollback. A fresh ordinary Head must pass without rerunning the failed Head.
"""
Path(evidence_path).write_text(evidence)

subprocess.run(
    ['pnpm', 'exec', 'prettier', '--write', chromium_path, evidence_path],
    check=True,
)
