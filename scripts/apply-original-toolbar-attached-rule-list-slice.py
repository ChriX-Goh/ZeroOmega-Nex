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
    """  Condition,
  FixedProfile,
  SwitchProfile,
  VirtualProfile,""",
    """  Condition,
  FixedProfile,
  RuleListProfile,
  SwitchProfile,
  VirtualProfile,""",
    "resolver RuleListProfile import",
)
resolver = replace_once(
    resolver,
    """import {
  evaluateProfileGraph,
  type GraphDecision,""",
    """import {
  evaluateProfileGraph,
  parseRuleList,
  type GraphDecision,""",
    "resolver parseRuleList import",
)
resolver = replace_once(
    resolver,
    """ * Resolve source- and runtime-proven built-in, static Fixed and exact
 * Switch-to-Direct/Fixed Action states from the applied profile workflow. Fixed
 * details reproduce the original `Profiles.match` arrays consumed by
 * `actionForUrl`: bypass pattern to Direct, scheme to PAC result, or fallback
 * PAC result alone. The Switch slice accepts one exact matched/default rule into
 * built-in Direct or one colored Fixed profile without an attached Rule List.
 * Switch-to-System is explicitly invalid in the original PAC runtime. Nested or
 * attached Rule Lists, Virtual, PAC, temporary-rule and external-control traces
 * remain fail-closed until their complete original display chain is represented.""",
    """ * Resolve source- and runtime-proven built-in, static Fixed, exact
 * Switch-to-Direct/Fixed, immediate Virtual and focused attached Rule List
 * Action states from the applied profile workflow. Fixed details reproduce the
 * original `Profiles.match` arrays consumed by `actionForUrl`: bypass pattern to
 * Direct, scheme to PAC result, or fallback PAC result alone. The attached slice
 * accepts a parent Switch with no ordinary rules, one inline AutoProxy rule and
 * an immediate Direct or no-bypass Fixed proxy result. Switch-to-System is
 * explicitly invalid in the original PAC runtime. Parent-rule fallthrough,
 * other Rule List formats, exclusive rules, nested/inclusive targets, PAC,
 * temporary-rule and external-control traces remain fail-closed.""",
    "resolver contract comment",
)
resolver = replace_once(
    resolver,
    """    if (
      profile.color === undefined ||
      profile.attachedRuleListProfileId !== undefined ||
      decision.status !== 'resolved' ||
      decision.support !== 'exact'
    ) {
      return undefined;
    }

    if (decision.route.kind === 'direct') {""",
    """    if (
      profile.color === undefined ||
      decision.status !== 'resolved' ||
      decision.support !== 'exact'
    ) {
      return undefined;
    }

    if (profile.attachedRuleListProfileId !== undefined) {
      return this.resolveAttachedRuleListResult(state, profile, decision, request, directColor);
    }

    if (decision.route.kind === 'direct') {""",
    "resolver attached dispatch",
)
attached_method = r'''  private resolveAttachedRuleListResult(
    state: ProfileWorkflowState,
    profile: SwitchProfile,
    decision: GraphDecision,
    request: ReferenceRequest,
    directColor: string,
  ) {
    if (
      profile.color === undefined ||
      profile.attachedRuleListProfileId === undefined ||
      profile.rules.length !== 0 ||
      profile.defaultRoute.kind !== 'profile' ||
      profile.defaultRoute.profileId !== profile.attachedRuleListProfileId ||
      decision.status !== 'resolved' ||
      decision.support !== 'exact'
    ) {
      return undefined;
    }

    const attachedProfile = state.applied.profiles.find(
      (candidate): candidate is RuleListProfile =>
        candidate.id === profile.attachedRuleListProfileId && candidate.kind === 'rule-list',
    );
    if (
      attachedProfile === undefined ||
      attachedProfile.name !== `__ruleListOf_${profile.name}` ||
      attachedProfile.color !== profile.color
    ) {
      return undefined;
    }

    const source = state.applied.ruleSources.find(
      (candidate) => candidate.id === attachedProfile.sourceId,
    );
    if (
      source === undefined ||
      source.format !== 'autoproxy' ||
      source.location.kind !== 'inline'
    ) {
      return undefined;
    }
    const parsed = parseRuleList(state.applied, attachedProfile, source);
    if (!parsed.ok || parsed.rules.length !== 1) return undefined;

    const allowedActions = new Set([
      'enter-profile',
      'switch-default',
      'rule-list-rule',
      'rule-list-default',
      'direct',
      'fixed-endpoint',
    ]);
    if (decision.trace.some((entry) => !allowedActions.has(entry.action))) return undefined;

    const enteredProfiles = decision.trace
      .filter((entry) => entry.action === 'enter-profile')
      .map((entry) => entry.profileId);
    if (
      enteredProfiles[0] !== profile.id ||
      enteredProfiles[1] !== attachedProfile.id
    ) {
      return undefined;
    }

    const switchRules = decision.trace.filter((entry) => entry.action === 'switch-rule');
    const switchDefaults = decision.trace.filter((entry) => entry.action === 'switch-default');
    if (
      switchRules.length !== 0 ||
      switchDefaults.length !== 1 ||
      switchDefaults[0]?.profileId !== profile.id
    ) {
      return undefined;
    }

    const ruleEntries = decision.trace.filter((entry) => entry.action === 'rule-list-rule');
    const ruleDefaults = decision.trace.filter((entry) => entry.action === 'rule-list-default');
    if (ruleEntries.length !== 1 || ruleEntries[0]?.profileId !== attachedProfile.id) {
      return undefined;
    }
    const parsedRule = parsed.rules[0];
    const ruleEntry = ruleEntries[0];
    if (
      parsedRule === undefined ||
      ruleEntry === undefined ||
      ruleEntry.ruleId !== parsedRule.id ||
      ruleEntry.sourceLine !== parsedRule.sourceLine
    ) {
      return undefined;
    }

    let resultRoute = attachedProfile.defaultRoute;
    let selectionSource: string;
    if (ruleEntry.matched === true) {
      if (ruleDefaults.length !== 0) return undefined;
      resultRoute = parsedRule.route;
      const attachedPrefix = localizeOriginalToolbarDetail(
        this.#i18n,
        ORIGINAL_TOOLBAR_DETAIL_KEYS.attachedPrefix,
      );
      selectionSource = `${attachedPrefix}${parsedRule.sourceLine}`;
    } else if (
      ruleEntry.matched === false &&
      ruleDefaults.length === 1 &&
      ruleDefaults[0]?.profileId === attachedProfile.id
    ) {
      selectionSource = localizeOriginalToolbarDetail(
        this.#i18n,
        ORIGINAL_TOOLBAR_DETAIL_KEYS.defaultRule,
      );
    } else {
      return undefined;
    }

    if (decision.route.kind === 'direct') {
      if (resultRoute.kind !== 'direct' || enteredProfiles.length !== 2) return undefined;
      const directName = this.requireRouteName('direct');
      const directDisplayName = `[${directName}]`;
      return deriveOriginalToolbarTabState({
        currentProfileName: profile.name,
        resultProfileName: directDisplayName,
        details: `${selectionSource} => ${directDisplayName}\n`,
        icon: {
          currentProfileColor: profile.color,
          matchedProfileColor: profile.color,
          directProfileColor: directColor,
          directResult: true,
          currentProfileStatic: false,
          matchedProfileIsCurrent: false,
        },
        badge: {
          enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
          resultProfileName: directDisplayName,
          resultProfileBuiltin: true,
          builtinBadgeText: directName,
        },
      });
    }

    if (
      decision.route.kind !== 'proxy' ||
      resultRoute.kind !== 'profile' ||
      enteredProfiles.length !== 3
    ) {
      return undefined;
    }
    const resultProfile = state.applied.profiles.find(
      (candidate): candidate is FixedProfile =>
        candidate.id === enteredProfiles[2] &&
        candidate.id === resultRoute.profileId &&
        candidate.kind === 'fixed' &&
        candidate.color !== undefined,
    );
    if (
      resultProfile === undefined ||
      resultProfile.color === undefined ||
      resultProfile.bypass.length !== 0
    ) {
      return undefined;
    }
    const endpointEntry = decision.trace.findLast((entry) => entry.action === 'fixed-endpoint');
    if (
      endpointEntry?.action !== 'fixed-endpoint' ||
      endpointEntry.profileId !== resultProfile.id ||
      endpointEntry.endpointId !== decision.route.endpointId
    ) {
      return undefined;
    }

    const scheme = request.scheme as 'http' | 'https' | 'ftp';
    const hasSpecificEndpoint = resultProfile.proxyByScheme[scheme] !== undefined;
    const pacResult = originalPacResult(decision.route.endpoint);
    const details = `${selectionSource} => ${resultProfile.name}\n${hasSpecificEndpoint ? `${scheme} => ` : ''}${pacResult}\n`;
    return deriveOriginalToolbarTabState({
      currentProfileName: profile.name,
      resultProfileName: resultProfile.name,
      details,
      icon: {
        currentProfileColor: profile.color,
        matchedProfileColor: resultProfile.color,
        directProfileColor: directColor,
        directResult: false,
        currentProfileStatic: false,
        matchedProfileIsCurrent: false,
      },
      badge: {
        enabled: state.applied.settings.interface.showResultProfileOnActionBadgeText,
        resultProfileName: resultProfile.name,
        resultProfileBuiltin: false,
      },
    });
  }

'''
resolver = replace_once(
    resolver,
    "  private resolveVirtualResult(\n",
    attached_method + "  private resolveVirtualResult(\n",
    "resolver attached method",
)
resolver_path.write_text(resolver, encoding="utf-8")


test_path = Path("apps/extension/src/lib/original-toolbar-profile-resolver.test.ts")
test = test_path.read_text(encoding="utf-8")
test = replace_once(
    test,
    """      browserAction_defaultRuleDetails: '(default)',
      browserAction_directResult: '(not using any proxy)',""",
    """      browserAction_defaultRuleDetails: '(default)',
      browserAction_directResult: '(not using any proxy)',
      browserAction_attachedPrefix: '(RL) ',""",
    "test attached locale",
)
attached_tests = r'''  it('reproduces an attached AutoProxy match into a Fixed result', async () => {
    const workflowState = state(true);
    const fixed = workflowState.applied.profiles[0];
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
    fixed.bypass = [];
    workflowState.applied.ruleSources.push({
      id: 'source-attached-fixed',
      name: 'Attached Fixed rules',
      format: 'autoproxy',
      location: { kind: 'inline', content: '[AutoProxy 0.2.9]\n||attached-fixed.test\n' },
    });
    workflowState.applied.profiles.push(
      {
        id: 'profile-attached-fixed-list',
        name: '__ruleListOf_Attached Fixed Switch',
        color: '#5b5',
        kind: 'rule-list',
        sourceId: 'source-attached-fixed',
        matchRoute: { kind: 'profile', profileId: fixed.id },
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'profile-attached-fixed-switch',
        name: 'Attached Fixed Switch',
        color: '#5b5',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'profile-attached-fixed-list' },
        attachedRuleListProfileId: 'profile-attached-fixed-list',
      },
    );

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-attached-fixed-switch' },
    }).resolve({ tabId: 30, url: 'http://sub.attached-fixed.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#5b5',
      },
      titleArguments: {
        currentProfileName: 'Attached Fixed Switch',
        resultProfileName: 'Proxy',
        details: '(RL) ||attached-fixed.test => Proxy\nPROXY 127.0.0.1:7890\n',
      },
      badgeText: 'Prox',
    });
  });

  it('reproduces an attached AutoProxy no-match default into Direct', async () => {
    const workflowState = state(true);
    workflowState.applied.ruleSources.push({
      id: 'source-attached-fixed',
      name: 'Attached Fixed rules',
      format: 'autoproxy',
      location: { kind: 'inline', content: '[AutoProxy 0.2.9]\n||attached-fixed.test\n' },
    });
    workflowState.applied.profiles.push(
      {
        id: 'profile-attached-fixed-list',
        name: '__ruleListOf_Attached Fixed Switch',
        color: '#5b5',
        kind: 'rule-list',
        sourceId: 'source-attached-fixed',
        matchRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'profile-attached-fixed-switch',
        name: 'Attached Fixed Switch',
        color: '#5b5',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'profile-attached-fixed-list' },
        attachedRuleListProfileId: 'profile-attached-fixed-list',
      },
    );

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-attached-fixed-switch' },
    }).resolve({ tabId: 31, url: 'http://unmatched.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#5b5',
      },
      titleArguments: {
        currentProfileName: 'Attached Fixed Switch',
        resultProfileName: '[Direct]',
        details: '(default) => [Direct]\n',
      },
      badgeText: 'Dire',
    });
  });

  it('reproduces an attached AutoProxy match into Direct', async () => {
    const workflowState = state(true);
    workflowState.applied.ruleSources.push({
      id: 'source-attached-direct',
      name: 'Attached Direct rules',
      format: 'autoproxy',
      location: { kind: 'inline', content: '[AutoProxy 0.2.9]\n||attached-direct.test\n' },
    });
    workflowState.applied.profiles.push(
      {
        id: 'profile-attached-direct-list',
        name: '__ruleListOf_Attached Direct Switch',
        color: '#d63',
        kind: 'rule-list',
        sourceId: 'source-attached-direct',
        matchRoute: { kind: 'direct' },
        defaultRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      },
      {
        id: 'profile-attached-direct-switch',
        name: 'Attached Direct Switch',
        color: '#d63',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'profile-attached-direct-list' },
        attachedRuleListProfileId: 'profile-attached-direct-list',
      },
    );

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-attached-direct-switch' },
    }).resolve({ tabId: 32, url: 'http://sub.attached-direct.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#d63',
      },
      titleArguments: {
        currentProfileName: 'Attached Direct Switch',
        resultProfileName: '[Direct]',
        details: '(RL) ||attached-direct.test => [Direct]\n',
      },
      badgeText: 'Dire',
    });
  });

  it('reproduces an attached AutoProxy no-match default into a Fixed result', async () => {
    const workflowState = state(true);
    const fixed = workflowState.applied.profiles[0];
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
    fixed.bypass = [];
    workflowState.applied.ruleSources.push({
      id: 'source-attached-direct',
      name: 'Attached Direct rules',
      format: 'autoproxy',
      location: { kind: 'inline', content: '[AutoProxy 0.2.9]\n||attached-direct.test\n' },
    });
    workflowState.applied.profiles.push(
      {
        id: 'profile-attached-direct-list',
        name: '__ruleListOf_Attached Direct Switch',
        color: '#d63',
        kind: 'rule-list',
        sourceId: 'source-attached-direct',
        matchRoute: { kind: 'direct' },
        defaultRoute: { kind: 'profile', profileId: fixed.id },
      },
      {
        id: 'profile-attached-direct-switch',
        name: 'Attached Direct Switch',
        color: '#d63',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'profile-attached-direct-list' },
        attachedRuleListProfileId: 'profile-attached-direct-list',
      },
    );

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-attached-direct-switch' },
    }).resolve({ tabId: 33, url: 'http://unmatched.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#d63',
      },
      titleArguments: {
        currentProfileName: 'Attached Direct Switch',
        resultProfileName: 'Proxy',
        details: '(default) => Proxy\nPROXY 127.0.0.1:7890\n',
      },
      badgeText: 'Prox',
    });
  });

  it('fails closed when parent Switch rules precede an attached Rule List', async () => {
    const workflowState = state();
    workflowState.applied.ruleSources.push({
      id: 'source-attached',
      name: 'Attached rules',
      format: 'autoproxy',
      location: { kind: 'inline', content: '[AutoProxy 0.2.9]\n||attached.test\n' },
    });
    workflowState.applied.profiles.push(
      {
        id: 'profile-attached-list',
        name: '__ruleListOf_Attached Switch',
        color: '#5b5',
        kind: 'rule-list',
        sourceId: 'source-attached',
        matchRoute: { kind: 'direct' },
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'profile-attached-switch',
        name: 'Attached Switch',
        color: '#5b5',
        kind: 'switch',
        rules: [
          {
            id: 'rule-before-attached',
            condition: { kind: 'host-wildcard', pattern: 'other.test' },
            route: { kind: 'direct' },
          },
        ],
        defaultRoute: { kind: 'profile', profileId: 'profile-attached-list' },
        attachedRuleListProfileId: 'profile-attached-list',
      },
    );

    await expect(
      resolver(workflowState, {
        activeRoute: { kind: 'profile', profileId: 'profile-attached-switch' },
      }).resolve({ tabId: 34, url: 'http://sub.attached.test/' }),
    ).resolves.toBeUndefined();
  });

'''
test = replace_once(
    test,
    "  it('reproduces the exact Virtual-to-Direct display contract', async () => {\n",
    attached_tests + "  it('reproduces the exact Virtual-to-Direct display contract', async () => {\n",
    "attached resolver tests",
)
test_path.write_text(test, encoding="utf-8")


chromium_path = Path("scripts/e2e-chromium-toolbar.mjs")
chromium = chromium_path.read_text(encoding="utf-8")
chromium = replace_once(
    chromium,
    """    const defaultDetail = chrome.i18n.getMessage('browserAction_defaultRuleDetails');
    return {""",
    """    const defaultDetail = chrome.i18n.getMessage('browserAction_defaultRuleDetails');
    const attachedPrefix = chrome.i18n.getMessage('browserAction_attachedPrefix');
    const attachedFixedSource = `|http://toolbar-a.test:${proxyPort}/attached-fixed`;
    const attachedDirectSource = `|http://toolbar-a.test:${proxyPort}/attached-direct`;
    return {""",
    "Chromium attached title helpers",
)
chromium = replace_once(
    chromium,
    """      virtualDirect: resultTitle(
        `Toolbar Virtual Direct [[${directName}]]`,
        `[${directName}]`,
        directDetail,
      ),
      default: chrome.i18n.getMessage('manifest_icon_default_title'),""",
    """      virtualDirect: resultTitle(
        `Toolbar Virtual Direct [[${directName}]]`,
        `[${directName}]`,
        directDetail,
      ),
      attachedFixedMatch: resultTitle(
        'Toolbar Attached Fixed',
        'Toolbar Proxy',
        `${attachedPrefix}${attachedFixedSource} => Toolbar Proxy\nPROXY 127.0.0.1:${proxyPort}\n`,
      ),
      attachedFixedDefault: resultTitle(
        'Toolbar Attached Fixed',
        `[${directName}]`,
        `${defaultDetail} => [${directName}]\n`,
      ),
      attachedDirectMatch: resultTitle(
        'Toolbar Attached Direct',
        `[${directName}]`,
        `${attachedPrefix}${attachedDirectSource} => [${directName}]\n`,
      ),
      attachedDirectDefault: resultTitle(
        'Toolbar Attached Direct',
        'Toolbar Proxy',
        `${defaultDetail} => Toolbar Proxy\nPROXY 127.0.0.1:${proxyPort}\n`,
      ),
      default: chrome.i18n.getMessage('manifest_icon_default_title'),""",
    "Chromium attached expected titles",
)
chromium_attached = r'''
  const attachedCurrent = await sendWorkflowCommand(extensionPage, { channel, action: 'get' });
  assert.equal(
    attachedCurrent?.ok,
    true,
    `Attached Rule List workflow refresh failed: ${JSON.stringify(attachedCurrent)}`,
  );
  const attachedDraft = structuredClone(attachedCurrent.state.draft);
  const attachedFixed = attachedDraft.profiles.find((candidate) => candidate.id === proxyProfileId);
  assert.equal(attachedFixed?.kind, 'fixed', 'Attached target Fixed Profile was not found');
  attachedFixed.bypass = [];
  const attachedFixedSource = `|http://toolbar-a.test:${address.port}/attached-fixed`;
  const attachedDirectSource = `|http://toolbar-a.test:${address.port}/attached-direct`;
  attachedDraft.ruleSources.push(
    {
      id: 'source-toolbar-attached-fixed',
      name: 'Toolbar attached Fixed rules',
      format: 'autoproxy',
      location: {
        kind: 'inline',
        content: `[AutoProxy 0.2.9]\n${attachedFixedSource}\n`,
      },
    },
    {
      id: 'source-toolbar-attached-direct',
      name: 'Toolbar attached Direct rules',
      format: 'autoproxy',
      location: {
        kind: 'inline',
        content: `[AutoProxy 0.2.9]\n${attachedDirectSource}\n`,
      },
    },
  );
  attachedDraft.profiles.push(
    {
      id: 'profile-toolbar-attached-fixed-list',
      name: '__ruleListOf_Toolbar Attached Fixed',
      color: '#5b5',
      kind: 'rule-list',
      sourceId: 'source-toolbar-attached-fixed',
      matchRoute: { kind: 'profile', profileId: proxyProfileId },
      defaultRoute: { kind: 'direct' },
    },
    {
      id: 'profile-toolbar-attached-fixed',
      name: 'Toolbar Attached Fixed',
      color: '#5b5',
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'profile', profileId: 'profile-toolbar-attached-fixed-list' },
      attachedRuleListProfileId: 'profile-toolbar-attached-fixed-list',
    },
    {
      id: 'profile-toolbar-attached-direct-list',
      name: '__ruleListOf_Toolbar Attached Direct',
      color: '#d63',
      kind: 'rule-list',
      sourceId: 'source-toolbar-attached-direct',
      matchRoute: { kind: 'direct' },
      defaultRoute: { kind: 'profile', profileId: proxyProfileId },
    },
    {
      id: 'profile-toolbar-attached-direct',
      name: 'Toolbar Attached Direct',
      color: '#d63',
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'profile', profileId: 'profile-toolbar-attached-direct-list' },
      attachedRuleListProfileId: 'profile-toolbar-attached-direct-list',
    },
  );
  attachedDraft.settings.quickSwitch.routes.push(
    { kind: 'profile', profileId: 'profile-toolbar-attached-fixed' },
    { kind: 'profile', profileId: 'profile-toolbar-attached-direct' },
  );
  const attachedReplaced = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'replace-draft',
    expectedGeneration: attachedCurrent.state.generation,
    draft: attachedDraft,
  });
  assert.equal(
    attachedReplaced?.ok,
    true,
    `Attached Rule List draft replacement failed: ${JSON.stringify(attachedReplaced)}`,
  );
  const attachedApplied = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'apply',
    expectedGeneration: attachedReplaced.state.generation,
  });
  assert.equal(
    attachedApplied?.ok,
    true,
    `Attached Rule List Apply failed: ${JSON.stringify(attachedApplied)}`,
  );
  const attachedFixedActivated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: attachedApplied.state.applied.revision.id,
    route: { kind: 'profile', profileId: 'profile-toolbar-attached-fixed' },
  });
  assert.equal(
    attachedFixedActivated?.ok,
    true,
    `Attached Fixed activation failed: ${JSON.stringify(attachedFixedActivated)}`,
  );

  await proxyPage.goto(`http://toolbar-a.test:${address.port}/attached-fixed`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    { title: expectedTitles.attachedFixedMatch, badgeText: 'Tool', popup },
    'Attached Rule List match-to-Fixed Action state failed',
  );
  await proxyPage.goto(`http://toolbar-a.test:${address.port}/attached-default-direct`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    { title: expectedTitles.attachedFixedDefault, badgeText: 'Dire', popup },
    'Attached Rule List default-to-Direct Action state failed',
  );
  await waitForActionState(
    extensionPage,
    internalTabId,
    { title: expectedTitles.default, badgeText: '', popup },
    'Attached Fixed internal-page fallback failed',
  );

  const attachedDirectActivated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: attachedApplied.state.applied.revision.id,
    route: { kind: 'profile', profileId: 'profile-toolbar-attached-direct' },
  });
  assert.equal(
    attachedDirectActivated?.ok,
    true,
    `Attached Direct activation failed: ${JSON.stringify(attachedDirectActivated)}`,
  );
  await proxyPage.goto(`http://toolbar-a.test:${address.port}/attached-direct`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    { title: expectedTitles.attachedDirectMatch, badgeText: 'Dire', popup },
    'Attached Rule List match-to-Direct Action state failed',
  );
  await proxyPage.goto(`http://toolbar-a.test:${address.port}/attached-default-fixed`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    { title: expectedTitles.attachedDirectDefault, badgeText: 'Tool', popup },
    'Attached Rule List default-to-Fixed Action state failed',
  );
  await waitForActionState(
    extensionPage,
    internalTabId,
    { title: expectedTitles.default, badgeText: '', popup },
    'Attached Direct internal-page fallback failed',
  );
'''
chromium = replace_once(
    chromium,
    "\n  console.log(`Chromium toolbar Action E2E passed for ${extensionId}.`);",
    chromium_attached + "\n  console.log(`Chromium toolbar Action E2E passed for ${extensionId}.`);",
    "Chromium attached acceptance",
)
chromium_path.write_text(chromium, encoding="utf-8")


firefox_path = Path("scripts/e2e-firefox.mjs")
firefox = firefox_path.read_text(encoding="utf-8")
firefox_attached = r'''
    const attachedCurrent = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get',
    });
    assert.equal(
      attachedCurrent?.ok,
      true,
      `Firefox attached Rule List workflow refresh failed: ${JSON.stringify(attachedCurrent)}`,
    );
    const attachedDraft = structuredClone(attachedCurrent.state.draft);
    const attachedFixed = attachedDraft.profiles.find(
      (candidate) => candidate.id === 'profile-default-proxy',
    );
    assert.equal(attachedFixed?.kind, 'fixed', 'Firefox attached target Fixed Profile was not found');
    attachedFixed.bypass = [];
    const attachedFixedSource = `|http://toolbar-a.test:${sourceAddress.port}/attached-fixed`;
    const attachedDirectSource = `|http://toolbar-a.test:${sourceAddress.port}/attached-direct`;
    attachedDraft.ruleSources.push(
      {
        id: 'source-toolbar-attached-fixed',
        name: 'Toolbar attached Fixed rules',
        format: 'autoproxy',
        location: {
          kind: 'inline',
          content: `[AutoProxy 0.2.9]\n${attachedFixedSource}\n`,
        },
      },
      {
        id: 'source-toolbar-attached-direct',
        name: 'Toolbar attached Direct rules',
        format: 'autoproxy',
        location: {
          kind: 'inline',
          content: `[AutoProxy 0.2.9]\n${attachedDirectSource}\n`,
        },
      },
    );
    attachedDraft.profiles.push(
      {
        id: 'profile-toolbar-attached-fixed-list',
        name: '__ruleListOf_Toolbar Attached Fixed',
        color: '#5b5',
        kind: 'rule-list',
        sourceId: 'source-toolbar-attached-fixed',
        matchRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'profile-toolbar-attached-fixed',
        name: 'Toolbar Attached Fixed',
        color: '#5b5',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'profile-toolbar-attached-fixed-list' },
        attachedRuleListProfileId: 'profile-toolbar-attached-fixed-list',
      },
      {
        id: 'profile-toolbar-attached-direct-list',
        name: '__ruleListOf_Toolbar Attached Direct',
        color: '#d63',
        kind: 'rule-list',
        sourceId: 'source-toolbar-attached-direct',
        matchRoute: { kind: 'direct' },
        defaultRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      },
      {
        id: 'profile-toolbar-attached-direct',
        name: 'Toolbar Attached Direct',
        color: '#d63',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'profile-toolbar-attached-direct-list' },
        attachedRuleListProfileId: 'profile-toolbar-attached-direct-list',
      },
    );
    attachedDraft.settings.quickSwitch.routes.push(
      { kind: 'profile', profileId: 'profile-toolbar-attached-fixed' },
      { kind: 'profile', profileId: 'profile-toolbar-attached-direct' },
    );
    const attachedReplaced = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'replace-draft',
      expectedGeneration: attachedCurrent.state.generation,
      draft: attachedDraft,
    });
    assert.equal(
      attachedReplaced?.ok,
      true,
      `Firefox attached Rule List draft replacement failed: ${JSON.stringify(attachedReplaced)}`,
    );
    const attachedApplied = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'apply',
      expectedGeneration: attachedReplaced.state.generation,
    });
    assert.equal(
      attachedApplied?.ok,
      true,
      `Firefox attached Rule List Apply failed: ${JSON.stringify(attachedApplied)}`,
    );
    const attachedPrefix = await driver.executeScript(
      "return browser.i18n.getMessage('browserAction_attachedPrefix');",
    );
    const attachedFixedActivated = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: attachedApplied.state.applied.revision.id,
      route: { kind: 'profile', profileId: 'profile-toolbar-attached-fixed' },
    });
    assert.equal(
      attachedFixedActivated?.ok,
      true,
      `Firefox attached Fixed activation failed: ${JSON.stringify(attachedFixedActivated)}`,
    );
    const attachedFixedMatchAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Attached Fixed',
        'Toolbar Proxy',
        `${attachedPrefix}${attachedFixedSource} => Toolbar Proxy\nPROXY 127.0.0.1:${sourceAddress.port}\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    const attachedFixedDefaultAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Attached Fixed',
        routeDirect,
        `${defaultDetail} => ${routeDirect}\n`,
        toolbarPopup,
      )),
      badgeText: 'Dire',
    };
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(`http://toolbar-a.test:${sourceAddress.port}/attached-fixed`);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      attachedFixedMatchAction,
      'Firefox attached Rule List match-to-Fixed Action state failed',
    );
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(`http://toolbar-a.test:${sourceAddress.port}/attached-default-direct`);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      attachedFixedDefaultAction,
      'Firefox attached Rule List default-to-Direct Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarInternalTabId,
      defaultAction,
      'Firefox attached Fixed internal-page fallback failed',
    );

    const attachedDirectActivated = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: attachedApplied.state.applied.revision.id,
      route: { kind: 'profile', profileId: 'profile-toolbar-attached-direct' },
    });
    assert.equal(
      attachedDirectActivated?.ok,
      true,
      `Firefox attached Direct activation failed: ${JSON.stringify(attachedDirectActivated)}`,
    );
    const attachedDirectMatchAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Attached Direct',
        routeDirect,
        `${attachedPrefix}${attachedDirectSource} => ${routeDirect}\n`,
        toolbarPopup,
      )),
      badgeText: 'Dire',
    };
    const attachedDirectDefaultAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Attached Direct',
        'Toolbar Proxy',
        `${defaultDetail} => Toolbar Proxy\nPROXY 127.0.0.1:${sourceAddress.port}\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(`http://toolbar-a.test:${sourceAddress.port}/attached-direct`);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      attachedDirectMatchAction,
      'Firefox attached Rule List match-to-Direct Action state failed',
    );
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(`http://toolbar-a.test:${sourceAddress.port}/attached-default-fixed`);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      attachedDirectDefaultAction,
      'Firefox attached Rule List default-to-Fixed Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarInternalTabId,
      defaultAction,
      'Firefox attached Direct internal-page fallback failed',
    );
'''
firefox = replace_once(
    firefox,
    """    assert.notEqual(toolbarBypassWindow, toolbarProxyWindow);
    assert.notEqual(toolbarInternalWindow, toolbarProxyWindow);""",
    firefox_attached
    + """
    assert.notEqual(toolbarBypassWindow, toolbarProxyWindow);
    assert.notEqual(toolbarInternalWindow, toolbarProxyWindow);""",
    "Firefox attached acceptance",
)
firefox_path.write_text(firefox, encoding="utf-8")
