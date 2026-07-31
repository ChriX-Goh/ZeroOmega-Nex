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
    """  if (toolbarOnly) {
    console.log(`Firefox toolbar Action E2E passed for ${installedId}.`);
    throw toolbarOnlyComplete;
  }

  await driver.get(authProxy.targetUrl);""",
    """  await driver.get(authProxy.targetUrl);""",
    "remove late toolbar-only exit",
)
text = replace_once(
    text,
    """  await waitForFirefoxActionState(
    toolbarBypassTabId,
    directAction,
    'Firefox Direct bypass-tab Action state failed',
  );

  const fixedTable = await driver.wait(""",
    """  await waitForFirefoxActionState(
    toolbarBypassTabId,
    directAction,
    'Firefox Direct bypass-tab Action state failed',
  );

  if (toolbarOnly) {
    const current = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get',
    });
    assert.equal(current?.ok, true, `Firefox workflow refresh failed: ${JSON.stringify(current)}`);
    const draft = structuredClone(current.state.draft);
    const profile = draft.profiles.find(
      (candidate) => candidate.id === 'profile-default-proxy',
    );
    assert.equal(profile?.kind, 'fixed', 'Firefox default Fixed Profile was not found');
    profile.name = 'Toolbar Proxy';
    profile.color = '#64b5f6';
    profile.proxyByScheme = { fallback: 'endpoint-toolbar-e2e' };
    draft.proxyEndpoints = [
      {
        id: 'endpoint-toolbar-e2e',
        name: 'Toolbar E2E endpoint',
        protocol: 'http',
        host: '127.0.0.1',
        port: 7890,
      },
    ];
    draft.settings.interface.showResultProfileOnActionBadgeText = true;

    const replaced = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'replace-draft',
      expectedGeneration: current.state.generation,
      draft,
    });
    assert.equal(
      replaced?.ok,
      true,
      `Firefox draft replacement failed: ${JSON.stringify(replaced)}`,
    );
    const applied = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'apply',
      expectedGeneration: replaced.state.generation,
    });
    assert.equal(applied?.ok, true, `Firefox Fixed Apply failed: ${JSON.stringify(applied)}`);
    const activated = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: applied.state.applied.revision.id,
      route: { kind: 'profile', profileId: 'profile-default-proxy' },
    });
    assert.equal(
      activated?.ok,
      true,
      `Firefox Fixed activation failed: ${JSON.stringify(activated)}`,
    );

    const fixedProxyAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Proxy',
        'Toolbar Proxy',
        'PROXY 127.0.0.1:7890\\n',
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    const localizedDirectResult = await driver.executeScript(
      "return browser.i18n.getMessage('browserAction_directResult');",
    );
    const fixedBypassAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Proxy',
        'Toolbar Proxy',
        `localhost => ${localizedDirectResult}\\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      fixedProxyAction,
      'Firefox focused Fixed proxy Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarBypassTabId,
      fixedBypassAction,
      'Firefox focused Fixed bypass Action state failed',
    );

    console.log(`Firefox toolbar Action E2E passed for ${installedId}.`);
    throw toolbarOnlyComplete;
  }

  const fixedTable = await driver.wait(""",
    "early command-driven Firefox toolbar-only branch",
)
path.write_text(text, encoding="utf-8")
