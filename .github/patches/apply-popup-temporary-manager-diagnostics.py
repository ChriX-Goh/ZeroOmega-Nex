from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = """  const temporaryManager = await context.newPage();
  await temporaryManager.goto(`chrome-extension://${extensionId}/temp-rules.html`);
  const temporaryRow = temporaryManager.locator('[data-temp-rule-domain="example.co.uk"]');
  await temporaryRow.waitFor({ state: 'visible', timeout: 20_000 });
"""
new = """  const temporaryManager = await context.newPage();
  temporaryManager.on('console', (message) =>
    console.log(`[Chromium Temporary Rules console:${message.type()}] ${message.text()}`),
  );
  temporaryManager.on('pageerror', (error) =>
    console.error(`[Chromium Temporary Rules pageerror] ${error.stack ?? error.message}`),
  );
  await temporaryManager.goto(`chrome-extension://${extensionId}/temp-rules.html`);
  const temporaryRow = temporaryManager.locator('[data-temp-rule-domain="example.co.uk"]');
  try {
    await temporaryRow.waitFor({ state: 'visible', timeout: 20_000 });
  } catch (error) {
    const diagnostics = await temporaryManager.evaluate(async () => {
      const [local, session] = await Promise.all([
        chrome.storage.local.get(null),
        chrome.storage.session.get(null),
      ]);
      const profileResponse = await chrome.runtime
        .sendMessage({ channel: 'zeroomega-nex/profile-workflow/v1', action: 'get' })
        .catch((messageError) => ({ error: String(messageError) }));
      const temporaryResponse = await chrome.runtime
        .sendMessage({ channel: 'zeroomega-nex/popup-temporary-rules/v1', action: 'get' })
        .catch((messageError) => ({ error: String(messageError) }));
      return {
        href: location.href,
        title: document.title,
        body: document.body.innerText,
        local,
        session,
        profileResponse,
        temporaryResponse,
      };
    });
    console.error('Temporary rule manager diagnostics:', JSON.stringify(diagnostics));
    throw error;
  }
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary manager diagnostic match count: {text.count(old)}')
path.write_text(text.replace(old, new))
