from pathlib import Path

path = Path('.github/patches/apply-popup-external-profile-evidence.py')
text = path.read_text()
old = """  const systemActivation = await worker.evaluate(async () => {
    const storage = await chrome.storage.local.get(null);
    const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
    return chrome.runtime.sendMessage({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: workflow.applied.revision.id,
      route: { kind: 'system' },
    });
  });
  assert.equal(systemActivation?.ok, true, 'System route could not be activated for external import');
"""
new = """  const system = popup.getByRole('button', { name: /系统代理/u });
  await system.click();
  await assertEventually(async () => system.isDisabled(), 'System route did not become active');
"""
if text.count(old) != 1:
    raise SystemExit(f'external profile System E2E block count: {text.count(old)}')
text = text.replace(old, new)
old = """          singleProxy: { scheme: 'socks5', host: 'external.e2e.invalid', port: 1080 },
"""
new = """          fallbackProxy: { scheme: 'socks5', host: 'external.e2e.invalid', port: 1080 },
"""
if text.count(old) != 1:
    raise SystemExit(f'external profile fallback E2E rule count: {text.count(old)}')
path.write_text(text.replace(old, new))
