from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = '''    return { response, profileId: pac.id, secretRef: pac.credential?.passwordSecretRef };
  });
  assert.equal(rawPacActivation.response?.ok, true, 'Top-level raw PAC activation was rejected');
'''
new = '''    return {
      response,
      profileId: pac.id,
      secretRef: pac.credential?.passwordSecretRef,
      quickSwitchRoutes: workflow.applied.settings.quickSwitch.routes,
      appliedRevisionId: workflow.applied.revision.id,
      draftRevisionId: workflow.draft.revision.id,
    };
  });
  if (rawPacActivation.response?.ok !== true) {
    console.error(`[Raw PAC activation diagnostics] ${JSON.stringify(rawPacActivation)}`);
  }
  assert.equal(
    rawPacActivation.response?.ok,
    true,
    `Top-level raw PAC activation was rejected: ${JSON.stringify(rawPacActivation.response)}`,
  );
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one raw PAC diagnostics insertion point, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
