from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = """  await authDialog.locator('[data-auth-action="save"]').click();
  await authDialog.waitFor({ state: 'detached' });
"""
new = """  await authDialog.locator('[data-auth-action="save"]').click();
  try {
    await authDialog.waitFor({ state: 'detached', timeout: 15_000 });
  } catch (error) {
    const diagnostics = {
      dialogAlerts: await authDialog.getByRole('alert').allTextContents().catch(() => []),
      optionsAlerts: await options.getByRole('alert').allTextContents().catch(() => []),
      storage: await worker.evaluate(async () => {
        const local = await chrome.storage.local.get('zeroomega-nex/profile-workflow/v1/state');
        const session = await chrome.storage.session.get(
          'zeroomega-nex/popup-temporary-rules/v1/state',
        );
        const workflow = local['zeroomega-nex/profile-workflow/v1/state'];
        return {
          workflow: workflow
            ? {
                generation: workflow.generation,
                appliedRevisionId: workflow.applied?.revision?.id,
                draftRevisionId: workflow.draft?.revision?.id,
                selectedProfileId: workflow.selectedProfileId,
                pendingApply: workflow.pendingApply?.phase,
              }
            : undefined,
          temporaryRuleCount:
            session['zeroomega-nex/popup-temporary-rules/v1/state']?.rules?.length ?? 0,
        };
      }),
    };
    console.error('Fixed authentication save diagnostics:', JSON.stringify(diagnostics));
    throw error;
  }
"""
if text.count(old) != 1:
    raise SystemExit(f'Fixed auth diagnostic patch match count: {text.count(old)}')
path.write_text(text.replace(old, new))
