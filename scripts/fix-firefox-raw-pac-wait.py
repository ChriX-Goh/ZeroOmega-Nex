from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


path = Path("scripts/e2e-firefox.mjs")
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    """  await pacApply.click();
  await driver.wait(
    until.elementLocated(By.xpath(\"//*[contains(normalize-space(.), '目前設定已全部套用。') ]\")),
    20_000,
  );""",
    """  await pacApply.click();
  await driver.wait(
    async () => {
      const response = await sendFirefoxWorkflowCommand({
        channel: 'zeroomega-nex/profile-workflow/v1',
        action: 'get',
      });
      return Boolean(response?.ok && response.view?.dirty === false && response.view?.busy !== true);
    },
    45_000,
    'Firefox PAC Apply did not reach a clean workflow state',
  );
  await driver.wait(
    async () => {
      const statuses = await driver.findElements(By.css('.draft-status'));
      return (
        statuses.length === 1 &&
        (await statuses[0].getText()).trim() === '目前設定已全部套用。'
      );
    },
    20_000,
    'Firefox Options did not render the clean PAC Apply status',
  );""",
    "PAC Apply clean-state wait",
)
text = replace_once(
    text,
    """  const pacRuntime = await driver.executeAsyncScript(`
    const done = arguments[0];
    browser.storage.local.get(null).then((storage) => {
      const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
      const profile = workflow?.applied?.profiles?.find((candidate) => candidate.name === 'Firefox PAC E2E');
      const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
      const snapshot = proxyState?.activeSnapshotId
        ? storage['zeroomega-nex/browser-proxy/v1/snapshot/' + proxyState.activeSnapshotId]
        : undefined;
      done({
        profileId: profile?.id,
        kind: profile?.kind,
        compilerVersion: snapshot?.compilerVersion,
        startRoute: snapshot?.startRoute,
        script: snapshot?.script,
      });
    }, (error) => done({ error: String(error) }));
  `);
  assert.equal(pacRuntime.kind, 'pac', 'Firefox PAC profile was not applied');
  assert.equal(
    pacRuntime.compilerVersion,
    'raw-pac/1',
    'Firefox did not install a raw PAC snapshot',
  );
  assert.equal(pacRuntime.startRoute?.kind, 'profile');
  assert.equal(pacRuntime.startRoute?.profileId, pacRuntime.profileId);
  assert.match(pacRuntime.script ?? '', /FindProxyForURL/u);""",
    """  let pacRuntime;
  try {
    await driver.wait(
      async () => {
        pacRuntime = await driver.executeAsyncScript(`
          const done = arguments[0];
          browser.storage.local.get(null).then((storage) => {
            const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
            const profile = workflow?.applied?.profiles?.find(
              (candidate) => candidate.name === 'Firefox PAC E2E',
            );
            const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
            const snapshot = proxyState?.activeSnapshotId
              ? storage['zeroomega-nex/browser-proxy/v1/snapshot/' + proxyState.activeSnapshotId]
              : undefined;
            done({
              profileId: profile?.id,
              kind: profile?.kind,
              activeSnapshotId: proxyState?.activeSnapshotId,
              compilerVersion: snapshot?.compilerVersion,
              startRoute: snapshot?.startRoute,
              script: snapshot?.script,
            });
          }, (error) => done({ error: String(error) }));
        `);
        return Boolean(
          pacRuntime?.kind === 'pac' &&
            pacRuntime?.activeSnapshotId &&
            pacRuntime?.compilerVersion === 'raw-pac/1' &&
            pacRuntime?.startRoute?.kind === 'profile' &&
            pacRuntime?.startRoute?.profileId === pacRuntime?.profileId &&
            /FindProxyForURL/u.test(pacRuntime?.script ?? ''),
        );
      },
      30_000,
      'Firefox raw PAC runtime did not settle',
    );
  } catch (error) {
    assert.equal(pacRuntime?.kind, 'pac', 'Firefox PAC profile was not applied');
    assert.equal(
      pacRuntime?.compilerVersion,
      'raw-pac/1',
      'Firefox did not install a raw PAC snapshot',
    );
    assert.equal(pacRuntime?.startRoute?.kind, 'profile');
    assert.equal(pacRuntime?.startRoute?.profileId, pacRuntime?.profileId);
    assert.match(pacRuntime?.script ?? '', /FindProxyForURL/u);
    throw error;
  }""",
    "raw PAC runtime convergence wait",
)
path.write_text(text, encoding="utf-8")
