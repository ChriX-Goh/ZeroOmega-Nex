from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label} marker mismatch: {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


chromium = Path("scripts/e2e-chromium-popup-external-profile.mjs")
replace_once(
    chromium,
    """  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.waitForLoadState('domcontentloaded');
  await options.evaluate(async () => {
    await chrome.proxy.settings.set({""",
    """  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.waitForLoadState('domcontentloaded');
  await waitForValue(
    async () =>
      options.evaluate(async () => {
        const response = await chrome.runtime.sendMessage({
          channel: 'zeroomega-nex/profile-workflow/v1',
          action: 'get',
        });
        return {
          ok: response?.ok === true,
          busy: response?.view?.busy === true,
          revisionId: response?.state?.applied?.revision?.id,
        };
      }),
    (value) => value?.ok === true && value.busy === false && typeof value.revisionId === 'string',
    'profile workflow did not initialize before external proxy setup',
    30_000,
  );
  await options.evaluate(async () => {
    await chrome.proxy.settings.set({""",
    "Chromium workflow readiness",
)
replace_once(
    chromium,
    """  });

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);""",
    """  });
  await waitForValue(
    async () =>
      options.evaluate(async () => {
        const [settings, ownership] = await Promise.all([
          chrome.proxy.settings.get({ incognito: false }),
          chrome.runtime.sendMessage({
            channel: 'zeroomega-nex/proxy-ownership/v1',
            action: 'get',
          }),
        ]);
        const singleProxy = settings?.value?.rules?.singleProxy;
        return {
          controlLevel: settings?.levelOfControl,
          mode: settings?.value?.mode,
          host: singleProxy?.host,
          port: singleProxy?.port,
          ownership,
        };
      }),
    (value) =>
      value?.controlLevel === 'controlled_by_this_extension' &&
      value.mode === 'fixed_servers' &&
      value.host === '127.0.0.1' &&
      value.port === 18188 &&
      value.ownership?.ok === true &&
      value.ownership.view?.blocked === false &&
      value.ownership.view?.externalProfile?.kind === 'fixed',
    'browser proxy and ownership state did not converge on the external fixed profile',
    30_000,
  );

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);""",
    "Chromium ownership convergence",
)

firefox = Path("scripts/e2e-firefox.mjs")
replace_once(
    firefox,
    ".setPreference('network.dns.localDomains', 'toolbar-a.test')",
    ".setPreference('network.dns.localDomains', 'toolbar-a.test,www.dev.example.co.uk')",
    "Firefox deterministic local domains",
)
replace_once(
    firefox,
    """  const firefoxCurrentSiteTabId = await driver.executeAsyncScript(`
    const done = arguments[0];
    browser.tabs.create({
      url: 'https://www.dev.example.co.uk/current-site',
      active: false,
    }).then((tab) => done(tab.id), (error) => done({ error: String(error) }));
  `);
  assert.equal(
    typeof firefoxCurrentSiteTabId,
    'number',
    `Firefox current-site tab was not created: ${JSON.stringify(firefoxCurrentSiteTabId)}`,
  );
  await navigateExtensionPage(`popup.html?activeTabId=${firefoxCurrentSiteTabId}`);""",
    """  const firefoxCurrentSiteUrl = `http://www.dev.example.co.uk:${sourceAddress.port}/current-site`;
  const firefoxCurrentSiteTabId = await driver.executeAsyncScript(
    `
      const targetUrl = arguments[0];
      const done = arguments[1];
      browser.tabs.create({
        url: targetUrl,
        active: false,
      }).then((tab) => done(tab.id), (error) => done({ error: String(error) }));
    `,
    firefoxCurrentSiteUrl,
  );
  assert.equal(
    typeof firefoxCurrentSiteTabId,
    'number',
    `Firefox current-site tab was not created: ${JSON.stringify(firefoxCurrentSiteTabId)}`,
  );
  await driver.wait(
    async () =>
      driver.executeAsyncScript(
        `
          const tabId = arguments[0];
          const targetUrl = arguments[1];
          const done = arguments[2];
          browser.tabs.get(tabId).then(
            (tab) => done(tab.url === targetUrl && tab.status === 'complete'),
            (error) => done({ error: String(error) }),
          );
        `,
        firefoxCurrentSiteTabId,
        firefoxCurrentSiteUrl,
      ),
    20_000,
    'Firefox current-site tab did not reach the requested complete URL',
  );
  await navigateExtensionPage(`popup.html?activeTabId=${firefoxCurrentSiteTabId}`);""",
    "Firefox current-site tab readiness",
)

session = Path("docs/SESSION_13_KNOWLEDGE_GRAPH.md")
text = session.read_text(encoding="utf-8")
text = text.replace("- Current state: `02R_VERIFIED`.", "- Current state: `02R_E2E_STABILITY_REVERIFICATION`.")
section = """

## 02R E2E readiness hardening

- Documentation-only Head `eb6fe48` exposed nondeterministic readiness in two browser gates despite identical product code passing on `dfdd10d`.
- Chromium now waits for the profile workflow to become idle, then waits for browser proxy settings and the ownership runtime to converge on the external fixed profile before opening Popup.
- Firefox now resolves `www.dev.example.co.uk` to the local fixture server, waits for the exact tab URL and `status=complete`, then opens Popup with that explicit `activeTabId`.
- This is test-fixture hardening, not a product-scope expansion. Historical product evidence at `dfdd10d` remains relevant, but the current acceptance state stays pending until one new exact Head passes all six permanent workflows.
"""
if "## 02R E2E readiness hardening" not in text:
    text = text.rstrip() + section + "\n"
session.write_text(text, encoding="utf-8")

evidence = Path("docs/AUDIT_EVIDENCE_02R_POPUP_OWNERSHIP_EXTERNAL.md")
text = evidence.read_text(encoding="utf-8")
text = text.replace(
    "- Verified exact Head: `dfdd10d499e8f9b6bc9652867266469214ccdc85`.\n- All six permanent workflows passed on that Head.",
    "- Historical verified product Head: `dfdd10d499e8f9b6bc9652867266469214ccdc85`; all six permanent workflows passed on that Head.\n- Current stability acceptance: PENDING a new exact Head after readiness hardening.",
)
section = """

## Browser-gate readiness hardening

A later documentation-only Head exposed two latent test races: the Chromium fixture could write proxy settings before background workflow initialization settled, and the Firefox fixture could open Popup before its synthetic current-site tab reached the requested URL. The permanent gates now wait on runtime state rather than elapsed time. No product behavior or parity claim changes; the new exact Head must still pass all six workflows before stability acceptance is restored.
"""
if "## Browser-gate readiness hardening" not in text:
    text = text.rstrip() + section + "\n"
evidence.write_text(text, encoding="utf-8")
