from pathlib import Path

path = Path("scripts/e2e-chromium.mjs")
text = path.read_text(encoding="utf-8")
old = """  await options.getByRole('button', { name: '配置历史' }).click();
  await options.getByRole('heading', { name: '配置历史', exact: true, level: 1 }).waitFor();
  await options.getByRole('heading', { name: '已验证的 PAC 快照', exact: true }).waitFor();"""
new = """  const historyResponse = await worker.evaluate(async () =>
    chrome.runtime.sendMessage({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get-snapshot-history',
    }),
  );
  assert.equal(
    historyResponse?.ok,
    true,
    `Chromium snapshot history command failed: ${JSON.stringify(historyResponse)}`,
  );

  await options.getByRole('button', { name: '配置历史' }).click();
  await options.getByRole('heading', { name: '配置历史', exact: true, level: 1 }).waitFor();
  try {
    await options.getByRole('heading', { name: '已验证的 PAC 快照', exact: true }).waitFor();
  } catch (error) {
    const historyDiagnostics = await options
      .locator('[data-snapshot-history-panel]')
      .evaluate((panel) => ({
        text: panel.textContent,
        alerts: [...panel.querySelectorAll('[role="alert"]')].map((entry) => entry.textContent),
        statuses: [...panel.querySelectorAll('[role="status"]')].map((entry) => entry.textContent),
      }))
      .catch(() => ({ text: '', alerts: ['history panel missing'], statuses: [] }));
    throw new Error(
      `Chromium snapshot history UI failed: ${JSON.stringify(historyDiagnostics)}; ${String(error)}`,
    );
  }"""
count = text.count(old)
if count != 1:
    raise SystemExit(f"Chromium history diagnostics: expected one match, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
