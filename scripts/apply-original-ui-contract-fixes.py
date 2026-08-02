import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


path = 'scripts/e2e-chromium.mjs'
replace_once(
    path,
    """  let externalOwnership;
  await assertEventually(
    async () => {
      externalOwnership = await popup.evaluate(async () => {
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
  );""",
    """  const externalPreconditions = await popup.evaluate(async () => {
    const proxyStateKey = 'zeroomega-nex/browser-proxy/v1/state';
    const workflowStateKey = 'zeroomega-nex/profile-workflow/v1/state';
    const [setting, storage] = await Promise.all([
      chrome.proxy.settings.get({ incognito: false }),
      chrome.storage.local.get([proxyStateKey, workflowStateKey]),
    ]);
    const workflow = storage[workflowStateKey];
    return {
      levelOfControl: setting.levelOfControl,
      activeBuiltInMode: storage[proxyStateKey]?.activeBuiltInMode,
      showExternalProfile: workflow?.applied?.settings?.interface?.showExternalProfile,
      profiles: workflow?.applied?.profiles?.map((profile) => ({
        id: profile.id,
        name: profile.name,
        kind: profile.kind,
        proxyByScheme: profile.proxyByScheme,
        source: profile.source,
        targetRoute: profile.targetRoute,
      })),
      proxyEndpoints: workflow?.applied?.proxyEndpoints,
    };
  });
  assert.equal(
    externalPreconditions.levelOfControl,
    'controlled_by_this_extension',
    `Chromium external proxy control precondition failed: ${JSON.stringify(externalPreconditions)}`,
  );
  assert.equal(
    externalPreconditions.activeBuiltInMode,
    'system',
    `System activation state was not preserved for external ownership inspection: ${JSON.stringify(externalPreconditions)}`,
  );
  assert.equal(
    externalPreconditions.showExternalProfile,
    true,
    `External-profile visibility was disabled before ownership inspection: ${JSON.stringify(externalPreconditions)}`,
  );
  let externalOwnership;
  try {
    await assertEventually(
      async () => {
        externalOwnership = await popup.evaluate(async () => {
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
  } catch (error) {
    throw new Error(
      `External ownership diagnostics: ${JSON.stringify({ externalPreconditions, externalOwnership })}`,
      { cause: error },
    );
  }""",
)

subprocess.run(['pnpm', 'exec', 'prettier', '--write', path], check=True)
