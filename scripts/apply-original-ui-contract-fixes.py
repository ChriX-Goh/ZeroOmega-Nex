from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old!r}")
    target.write_text(source.replace(old, new, 1))


replace_once(
    'scripts/validate-localization.mjs',
    """requireText(
  entries.chromiumE2e,
  'data-snapshot-rollback-confirm',
  'Chromium real snapshot rollback interaction coverage is missing.',
);""",
    """requireText(
  entries.chromiumE2e,
  "action: 'rollback-snapshot'",
  'Chromium background snapshot rollback command coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  'Background snapshot rollback failed',
  'Chromium background snapshot rollback failure coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  'History rollback did not restore browser state and both workflow revisions',
  'Chromium background snapshot rollback convergence coverage is missing.',
);""",
)

replace_once(
    'scripts/e2e-firefox.mjs',
    """  await navigateExtensionPage('options.html#/history');
  await driver.wait(until.elementLocated(By.xpath("//h1[normalize-space(.)='設定歷史']")), 15_000);
  await driver.wait(until.elementLocated(By.css('article.settings-section')), 20_000);

""",
    '',
)

replace_once(
    'scripts/e2e-chromium.mjs',
    """  const externalPopup = await context.newPage();
  await externalPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  const externalRow = externalPopup.locator('[data-popup-external-profile]');""",
    """  let externalOwnership;
  await assertEventually(
    async () => {
      externalOwnership = await worker.evaluate(async () => {
        const response = await chrome.runtime.sendMessage({
          channel: 'zeroomega-nex/proxy-ownership/v1',
          action: 'get',
        });
        const setting = await chrome.proxy.settings.get({ incognito: false });
        return { response, setting };
      });
      return (
        externalOwnership?.response?.ok === true &&
        externalOwnership.response.view?.externalProfile?.kind === 'fixed'
      );
    },
    'External proxy state did not converge to an importable Fixed candidate',
    20_000,
  );
  const externalPopup = await context.newPage();
  await externalPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  const externalRow = externalPopup.locator('[data-popup-external-profile]');""",
)
