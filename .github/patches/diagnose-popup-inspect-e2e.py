from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = """  const temporarySelect = temporaryPopup.getByLabel('Temporary profile for example.co.uk');
  await temporarySelect.waitFor({ state: 'visible', timeout: 20_000 });
"""
new = """  const temporarySelect = temporaryPopup.getByLabel('Temporary profile for example.co.uk');
  try {
    await temporarySelect.waitFor({ state: 'visible', timeout: 20_000 });
  } catch (error) {
    const diagnostic = await worker.evaluate(async () => {
      const [local, session, tabs] = await Promise.all([
        chrome.storage.local.get(null),
        chrome.storage.session.get(null),
        chrome.tabs.query({}),
      ]);
      const workflow = local['zeroomega-nex/profile-workflow/v1/state'];
      const proxy = local['zeroomega-nex/browser-proxy/v1/state'];
      return {
        tabs: tabs.map((tab) => ({ id: tab.id, active: tab.active, url: tab.url })),
        workflow: workflow
          ? {
              appliedRevisionId: workflow.applied?.revision?.id,
              draftRevisionId: workflow.draft?.revision?.id,
              profiles: workflow.applied?.profiles?.map((profile) => ({
                id: profile.id,
                name: profile.name,
                kind: profile.kind,
              })),
            }
          : undefined,
        proxy,
        temporary: session['zeroomega-nex/popup-temporary-rules/v1/state'],
        inspect: session['zeroomega-nex/inspect/v1/state'],
      };
    });
    console.error('TEMPORARY_POPUP_BODY\\n' + (await temporaryPopup.locator('body').innerText()));
    console.error('TEMPORARY_POPUP_HTML\\n' + (await temporaryPopup.locator('body').innerHTML()));
    console.error('TEMPORARY_POPUP_DIAGNOSTIC\\n' + JSON.stringify(diagnostic, null, 2));
    throw error;
  }
"""
if text.count(old) != 1:
    raise SystemExit(f'expected one temporary Popup wait block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
