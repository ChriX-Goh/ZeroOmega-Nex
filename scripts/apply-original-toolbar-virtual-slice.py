from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


resolver_path = Path("apps/extension/src/lib/original-toolbar-profile-resolver.ts")
resolver = resolver_path.read_text(encoding="utf-8")
resolver = replace_once(
    resolver,
    "import type { Condition, FixedProfile, SwitchProfile } from '@zeroomega-nex/profile-spec';",
    "import type {\n  Condition,\n  FixedProfile,\n  SwitchProfile,\n  VirtualProfile,\n} from '@zeroomega-nex/profile-spec';",
    "resolver profile imports",
)
resolver = replace_once(
    resolver,
    """    const profile = state.applied.profiles.find((candidate) => candidate.id === route.profileId);
    if (profile === undefined || profile.color === undefined) return undefined;

    const request = referenceRequest(input.url);""",
    """    const profile = state.applied.profiles.find((candidate) => candidate.id === route.profileId);
    if (profile === undefined) return undefined;

    const request = referenceRequest(input.url);""",
    "resolver top-profile guard",
)
resolver = replace_once(
    resolver,
    """    if (profile.kind === 'switch') {
      return this.resolveSwitchResult(state, profile, decision, request, directColor);
    }
    if (profile.kind !== 'fixed') return undefined;
""",
    """    if (profile.kind === 'switch') {
      return this.resolveSwitchResult(state, profile, decision, request, directColor);
    }
    if (profile.kind === 'virtual') {
      return this.resolveVirtualResult(state, profile, decision, request, directColor);
    }
    if (profile.kind !== 'fixed' || profile.color === undefined) return undefined;
""",
    "resolver Virtual dispatch",
)
virtual_methods = r'''  private resolveVirtualResult(
    state: ProfileWorkflowState,
    profile: VirtualProfile,
    decision: GraphDecision,
    request: ReferenceRequest,
    directColor: string,
  ) {
    if (decision.status !== 'resolved' || decision.support !== 'exact') return undefined;

    const virtualEntries = decision.trace.filter((entry) => entry.action === 'virtual');
    if (virtualEntries.length !== 1 || virtualEntries[0]?.profileId !== profile.id) {
      return undefined;
    }
    const enteredProfiles = decision.trace
      .filter((entry) => entry.action === 'enter-profile')
      .map((entry) => entry.profileId);
    if (enteredProfiles[0] !== profile.id) return undefined;

    if (profile.targetRoute.kind === 'direct') {
      const allowedActions = new Set(['enter-profile', 'virtual', 'direct']);
      if (
        decision.route.kind !== 'direct' ||
        enteredProfiles.length !== 1 ||
        decision.trace.some((entry) => !allowedActions.has(entry.action))
      ) {
        return undefined;
      }
      const directName = this.requireRouteName('direct');
      const directDisplayName = `[${directName}]`;
      const details = localizeOriginalToolbarDetail(
        this.#i18n,
        ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult,
      );
      return deriveOriginalToolbarTabState({
        currentProfileName: `${profile.name} [${directDisplayName}]`,
        resultProfileName: directDisplayName,
        details,
        icon: {
          currentProfileColor: directColor,
          matchedProfileColor: directColor,
          directProfileColor: directColor,
          directResult: true,
          currentProfileStatic: true,
          matchedProfileIsCurrent: true,
        },
        badge: {
          enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
          resultProfileName: directDisplayName,
          resultProfileBuiltin: true,
          builtinBadgeText: directName,
        },
      });
    }

    const targetProfile = state.applied.profiles.find(
      (candidate): candidate is FixedProfile =>
        profile.targetRoute.kind === 'profile' &&
        candidate.id === profile.targetRoute.profileId &&
        candidate.kind === 'fixed' &&
        candidate.color !== undefined,
    );
    if (
      targetProfile === undefined ||
      targetProfile.color === undefined ||
      enteredProfiles.length !== 2 ||
      enteredProfiles[1] !== targetProfile.id
    ) {
      return undefined;
    }

    const currentProfileName = `${profile.name} [${targetProfile.name}]`;
    if (decision.route.kind === 'proxy') {
      const allowedActions = new Set([
        'enter-profile',
        'virtual',
        'fixed-bypass',
        'fixed-endpoint',
      ]);
      if (decision.trace.some((entry) => !allowedActions.has(entry.action))) return undefined;
      const endpointEntry = decision.trace.findLast((entry) => entry.action === 'fixed-endpoint');
      if (
        endpointEntry?.action !== 'fixed-endpoint' ||
        endpointEntry.profileId !== targetProfile.id ||
        endpointEntry.endpointId !== decision.route.endpointId
      ) {
        return undefined;
      }
      const scheme = request.scheme as 'http' | 'https' | 'ftp';
      const hasSpecificEndpoint = targetProfile.proxyByScheme[scheme] !== undefined;
      const pacResult = originalPacResult(decision.route.endpoint);
      const details = `${hasSpecificEndpoint ? `${scheme} => ` : ''}${pacResult}\n`;
      return deriveOriginalToolbarTabState({
        currentProfileName,
        resultProfileName: targetProfile.name,
        details,
        icon: {
          currentProfileColor: targetProfile.color,
          matchedProfileColor: targetProfile.color,
          directProfileColor: directColor,
          directResult: false,
          currentProfileStatic: true,
          matchedProfileIsCurrent: true,
        },
        badge: {
          enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
          resultProfileName: targetProfile.name,
          resultProfileBuiltin: false,
        },
      });
    }

    if (decision.route.kind !== 'direct') return undefined;
    const allowedActions = new Set(['enter-profile', 'virtual', 'fixed-bypass', 'direct']);
    if (decision.trace.some((entry) => !allowedActions.has(entry.action))) return undefined;
    const matchedBypassEntries = decision.trace.filter(
      (entry) =>
        entry.action === 'fixed-bypass' &&
        entry.profileId === targetProfile.id &&
        entry.matched === true,
    );
    if (matchedBypassEntries.length !== 1) return undefined;
    const matchedBypass = matchedBypassEntries[0];
    const bypass =
      matchedBypass?.action === 'fixed-bypass'
        ? targetProfile.bypass.find((candidate) => candidate.id === matchedBypass.bypassId)
        : undefined;
    if (bypass === undefined) return undefined;
    const directDetail = localizeOriginalToolbarDetail(
      this.#i18n,
      ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult,
    );
    return deriveOriginalToolbarTabState({
      currentProfileName,
      resultProfileName: targetProfile.name,
      details: `${bypass.pattern} => ${directDetail}\n`,
      icon: {
        currentProfileColor: targetProfile.color,
        matchedProfileColor: targetProfile.color,
        directProfileColor: directColor,
        directResult: true,
        currentProfileStatic: true,
        matchedProfileIsCurrent: false,
      },
      badge: {
        enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
        resultProfileName: targetProfile.name,
        resultProfileBuiltin: false,
      },
    });
  }

'''
resolver = replace_once(
    resolver,
    "  private resolveBuiltIn(\n",
    virtual_methods + "  private resolveBuiltIn(\n",
    "resolver Virtual methods",
)
resolver_path.write_text(resolver, encoding="utf-8")


test_path = Path("apps/extension/src/lib/original-toolbar-profile-resolver.test.ts")
test = test_path.read_text(encoding="utf-8")
virtual_tests = r'''  it('reproduces the exact Virtual-to-Direct display contract', async () => {
    const workflowState = state(true);
    workflowState.applied.profiles.push({
      id: 'profile-virtual-direct',
      name: 'Virtual Direct Alias',
      kind: 'virtual',
      targetRoute: { kind: 'direct' },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-virtual-direct' },
    }).resolve({ tabId: 26, url: 'http://virtual-direct.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#aaaaaa',
      },
      titleArguments: {
        currentProfileName: 'Virtual Direct Alias [[Direct]]',
        resultProfileName: '[Direct]',
        details: '(not using any proxy)',
      },
      badgeText: 'Dire',
    });
  });

  it('reproduces the exact Virtual-to-Fixed proxy display contract', async () => {
    const workflowState = state(true);
    workflowState.applied.profiles.push({
      id: 'profile-virtual-fixed',
      name: 'Virtual Fixed Alias',
      kind: 'virtual',
      targetRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-virtual-fixed' },
    }).resolve({ tabId: 27, url: 'http://virtual-fixed.test/' });

    expect(result).toEqual({
      icon: { mode: 'single-color', outerCircleColor: '#64b5f6' },
      titleArguments: {
        currentProfileName: 'Virtual Fixed Alias [Proxy]',
        resultProfileName: 'Proxy',
        details: 'PROXY 127.0.0.1:7890\n',
      },
      badgeText: 'Prox',
    });
  });

  it('reproduces the exact Virtual-to-Fixed bypass display contract', async () => {
    const workflowState = state(true);
    workflowState.applied.profiles.push({
      id: 'profile-virtual-fixed',
      name: 'Virtual Fixed Alias',
      kind: 'virtual',
      targetRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-virtual-fixed' },
    }).resolve({ tabId: 28, url: 'http://localhost/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#64b5f6',
      },
      titleArguments: {
        currentProfileName: 'Virtual Fixed Alias [Proxy]',
        resultProfileName: 'Proxy',
        details: 'localhost => (not using any proxy)\n',
      },
      badgeText: 'Prox',
    });
  });

  it('fails closed for nested Virtual targets outside the captured contract', async () => {
    const workflowState = state();
    workflowState.applied.profiles.push(
      {
        id: 'profile-virtual-inner',
        name: 'Inner Virtual',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      },
      {
        id: 'profile-virtual-outer',
        name: 'Outer Virtual',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-virtual-inner' },
      },
    );

    await expect(
      resolver(workflowState, {
        activeRoute: { kind: 'profile', profileId: 'profile-virtual-outer' },
      }).resolve({ tabId: 29, url: 'http://nested-virtual.test/' }),
    ).resolves.toBeUndefined();
  });

'''
test = replace_once(
    test,
    "  it('fails closed for invalid System and attached-list Switch trace shapes', async () => {\n",
    virtual_tests
    + "  it('fails closed for invalid System and attached-list Switch trace shapes', async () => {\n",
    "resolver Virtual tests",
)
test_path.write_text(test, encoding="utf-8")


chromium_path = Path("scripts/e2e-chromium-toolbar.mjs")
chromium = chromium_path.read_text(encoding="utf-8")
chromium = replace_once(
    chromium,
    """      switchDirectDefault: resultTitle(
        'Toolbar Switch',
        `[${directName}]`,
        `${defaultDetail} => [${directName}]\\n`,
      ),
      default: chrome.i18n.getMessage('manifest_icon_default_title'),""",
    """      switchDirectDefault: resultTitle(
        'Toolbar Switch',
        `[${directName}]`,
        `${defaultDetail} => [${directName}]\\n`,
      ),
      virtualFixedProxy: resultTitle(
        'Toolbar Virtual [Toolbar Proxy]',
        'Toolbar Proxy',
        `PROXY 127.0.0.1:${proxyPort}\\n`,
      ),
      virtualFixedBypass: resultTitle(
        'Toolbar Virtual [Toolbar Proxy]',
        'Toolbar Proxy',
        `localhost => ${directDetail}\\n`,
      ),
      virtualDirect: resultTitle(
        `Toolbar Virtual Direct [[${directName}]]`,
        `[${directName}]`,
        directDetail,
      ),
      default: chrome.i18n.getMessage('manifest_icon_default_title'),""",
    "Chromium Virtual expected titles",
)
chromium_virtual = r'''
  const virtualCurrent = await sendWorkflowCommand(extensionPage, { channel, action: 'get' });
  assert.equal(
    virtualCurrent?.ok,
    true,
    `Virtual workflow refresh failed: ${JSON.stringify(virtualCurrent)}`,
  );
  const virtualDraft = structuredClone(virtualCurrent.state.draft);
  const virtualFixed = virtualDraft.profiles.find((candidate) => candidate.id === proxyProfileId);
  assert.equal(virtualFixed?.kind, 'fixed', 'Virtual target Fixed Profile was not found');
  virtualFixed.bypass = [{ id: 'bypass-toolbar-localhost', pattern: 'localhost' }];
  virtualDraft.profiles.push(
    {
      id: 'profile-toolbar-virtual-fixed',
      name: 'Toolbar Virtual',
      kind: 'virtual',
      targetRoute: { kind: 'profile', profileId: proxyProfileId },
    },
    {
      id: 'profile-toolbar-virtual-direct',
      name: 'Toolbar Virtual Direct',
      kind: 'virtual',
      targetRoute: { kind: 'direct' },
    },
  );
  const virtualReplaced = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'replace-draft',
    expectedGeneration: virtualCurrent.state.generation,
    draft: virtualDraft,
  });
  assert.equal(
    virtualReplaced?.ok,
    true,
    `Virtual draft replacement failed: ${JSON.stringify(virtualReplaced)}`,
  );
  const virtualApplied = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'apply',
    expectedGeneration: virtualReplaced.state.generation,
  });
  assert.equal(virtualApplied?.ok, true, `Virtual Apply failed: ${JSON.stringify(virtualApplied)}`);
  const virtualFixedActivated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: virtualApplied.state.applied.revision.id,
    route: { kind: 'profile', profileId: 'profile-toolbar-virtual-fixed' },
  });
  assert.equal(
    virtualFixedActivated?.ok,
    true,
    `Virtual Fixed activation failed: ${JSON.stringify(virtualFixedActivated)}`,
  );

  await waitForActionState(
    extensionPage,
    proxyTabId,
    { title: expectedTitles.virtualFixedProxy, badgeText: 'Tool', popup },
    'Virtual-to-Fixed proxy Action state failed',
  );
  await waitForActionState(
    extensionPage,
    bypassTabId,
    { title: expectedTitles.virtualFixedBypass, badgeText: 'Tool', popup },
    'Virtual-to-Fixed bypass Action state failed',
  );
  await waitForActionState(
    extensionPage,
    internalTabId,
    { title: expectedTitles.default, badgeText: '', popup },
    'Virtual-to-Fixed internal-page fallback Action state failed',
  );

  const virtualDirectActivated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: virtualApplied.state.applied.revision.id,
    route: { kind: 'profile', profileId: 'profile-toolbar-virtual-direct' },
  });
  assert.equal(
    virtualDirectActivated?.ok,
    true,
    `Virtual Direct activation failed: ${JSON.stringify(virtualDirectActivated)}`,
  );
  const virtualDirectState = {
    title: expectedTitles.virtualDirect,
    badgeText: 'Dire',
    popup,
  };
  await waitForActionState(
    extensionPage,
    proxyTabId,
    virtualDirectState,
    'Virtual-to-Direct proxy-tab Action state failed',
  );
  await waitForActionState(
    extensionPage,
    bypassTabId,
    virtualDirectState,
    'Virtual-to-Direct bypass-tab Action state failed',
  );
  await waitForActionState(
    extensionPage,
    internalTabId,
    { title: expectedTitles.default, badgeText: '', popup },
    'Virtual-to-Direct internal-page fallback Action state failed',
  );
'''
chromium = replace_once(
    chromium,
    "\n  console.log(`Chromium toolbar Action E2E passed for ${extensionId}.`);",
    chromium_virtual + "\n  console.log(`Chromium toolbar Action E2E passed for ${extensionId}.`);",
    "Chromium Virtual acceptance",
)
chromium_path.write_text(chromium, encoding="utf-8")


firefox_path = Path("scripts/e2e-firefox.mjs")
firefox = firefox_path.read_text(encoding="utf-8")
firefox_virtual = r'''
    const virtualCurrent = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get',
    });
    assert.equal(
      virtualCurrent?.ok,
      true,
      `Firefox Virtual workflow refresh failed: ${JSON.stringify(virtualCurrent)}`,
    );
    const virtualDraft = structuredClone(virtualCurrent.state.draft);
    const virtualFixed = virtualDraft.profiles.find(
      (candidate) => candidate.id === 'profile-default-proxy',
    );
    assert.equal(virtualFixed?.kind, 'fixed', 'Firefox Virtual target Fixed Profile was not found');
    virtualFixed.bypass = [{ id: 'bypass-toolbar-localhost', pattern: 'localhost' }];
    virtualDraft.profiles.push(
      {
        id: 'profile-toolbar-virtual-fixed',
        name: 'Toolbar Virtual',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      },
      {
        id: 'profile-toolbar-virtual-direct',
        name: 'Toolbar Virtual Direct',
        kind: 'virtual',
        targetRoute: { kind: 'direct' },
      },
    );
    const virtualReplaced = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'replace-draft',
      expectedGeneration: virtualCurrent.state.generation,
      draft: virtualDraft,
    });
    assert.equal(
      virtualReplaced?.ok,
      true,
      `Firefox Virtual draft replacement failed: ${JSON.stringify(virtualReplaced)}`,
    );
    const virtualApplied = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'apply',
      expectedGeneration: virtualReplaced.state.generation,
    });
    assert.equal(
      virtualApplied?.ok,
      true,
      `Firefox Virtual Apply failed: ${JSON.stringify(virtualApplied)}`,
    );
    const virtualFixedActivated = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: virtualApplied.state.applied.revision.id,
      route: { kind: 'profile', profileId: 'profile-toolbar-virtual-fixed' },
    });
    assert.equal(
      virtualFixedActivated?.ok,
      true,
      `Firefox Virtual Fixed activation failed: ${JSON.stringify(virtualFixedActivated)}`,
    );

    const virtualFixedProxyAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Virtual [Toolbar Proxy]',
        'Toolbar Proxy',
        `PROXY 127.0.0.1:${sourceAddress.port}\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    const virtualFixedBypassAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Virtual [Toolbar Proxy]',
        'Toolbar Proxy',
        `localhost => ${localizedDirectResult}\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      virtualFixedProxyAction,
      'Firefox focused Virtual-to-Fixed proxy Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarBypassTabId,
      virtualFixedBypassAction,
      'Firefox focused Virtual-to-Fixed bypass Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarInternalTabId,
      defaultAction,
      'Firefox focused Virtual-to-Fixed internal-page fallback failed',
    );

    const virtualDirectActivated = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: virtualApplied.state.applied.revision.id,
      route: { kind: 'profile', profileId: 'profile-toolbar-virtual-direct' },
    });
    assert.equal(
      virtualDirectActivated?.ok,
      true,
      `Firefox Virtual Direct activation failed: ${JSON.stringify(virtualDirectActivated)}`,
    );
    const virtualDirectAction = {
      ...(await literalFirefoxActionState(
        `Toolbar Virtual Direct [${routeDirect}]`,
        routeDirect,
        localizedDirectResult,
        toolbarPopup,
      )),
      badgeText: 'Dire',
    };
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      virtualDirectAction,
      'Firefox focused Virtual-to-Direct proxy-tab Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarBypassTabId,
      virtualDirectAction,
      'Firefox focused Virtual-to-Direct bypass-tab Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarInternalTabId,
      defaultAction,
      'Firefox focused Virtual-to-Direct internal-page fallback failed',
    );
'''
firefox = replace_once(
    firefox,
    """    assert.notEqual(toolbarBypassWindow, toolbarProxyWindow);
    assert.notEqual(toolbarInternalWindow, toolbarProxyWindow);""",
    firefox_virtual
    + """
    assert.notEqual(toolbarBypassWindow, toolbarProxyWindow);
    assert.notEqual(toolbarInternalWindow, toolbarProxyWindow);""",
    "Firefox Virtual acceptance",
)
firefox_path.write_text(firefox, encoding="utf-8")
