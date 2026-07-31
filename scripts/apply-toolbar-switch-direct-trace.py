from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


resolver_path = Path('apps/extension/src/lib/original-toolbar-profile-resolver.ts')
resolver = resolver_path.read_text(encoding='utf-8')
resolver = replace_once(
    resolver,
    """ * Resolve source- and runtime-proven built-in, static Fixed and exact
 * Switch-to-Fixed proxy Action states from the applied profile workflow. Fixed
 * details reproduce the original `Profiles.match` arrays consumed by
 * `actionForUrl`: bypass pattern to Direct, scheme to PAC result, or fallback
 * PAC result alone. The Switch slice accepts only a direct matched/default rule
 * into one colored Fixed profile without an attached Rule List. Switch results
 * into Direct/System, nested or attached Rule Lists, Virtual, PAC,
 * temporary-rule and external-control traces remain fail-closed until their
 * complete original `matchProfile.results` display chain is represented.
""",
    """ * Resolve source- and runtime-proven built-in, static Fixed and exact
 * Switch-to-Direct/Fixed Action states from the applied profile workflow. Fixed
 * details reproduce the original `Profiles.match` arrays consumed by
 * `actionForUrl`: bypass pattern to Direct, scheme to PAC result, or fallback
 * PAC result alone. The Switch slice accepts one exact matched/default rule into
 * built-in Direct or one colored Fixed profile without an attached Rule List.
 * Switch-to-System is explicitly invalid in the original PAC runtime. Nested or
 * attached Rule Lists, Virtual, PAC, temporary-rule and external-control traces
 * remain fail-closed until their complete original display chain is represented.
""",
    'resolver authority comment',
)
resolver = replace_once(
    resolver,
    """    if (profile.kind === 'switch') {
      return this.resolveSwitchFixedProxy(state, profile, decision, request, directColor);
    }
""",
    """    if (profile.kind === 'switch') {
      return this.resolveSwitchResult(state, profile, decision, request, directColor);
    }
""",
    'resolver Switch dispatcher',
)
insert_marker = """  private resolveSwitchFixedProxy(
"""
new_methods = """  private resolveSwitchResult(
    state: ProfileWorkflowState,
    profile: SwitchProfile,
    decision: GraphDecision,
    request: ReferenceRequest,
    directColor: string,
  ) {
    if (
      profile.color === undefined ||
      profile.attachedRuleListProfileId !== undefined ||
      decision.status !== 'resolved' ||
      decision.support !== 'exact'
    ) {
      return undefined;
    }

    if (decision.route.kind === 'direct') {
      return this.resolveSwitchDirect(state, profile, decision, directColor);
    }
    if (decision.route.kind === 'proxy') {
      return this.resolveSwitchFixedProxy(state, profile, decision, request, directColor);
    }
    return undefined;
  }

  private resolveSwitchDirect(
    state: ProfileWorkflowState,
    profile: SwitchProfile,
    decision: GraphDecision,
    directColor: string,
  ) {
    if (
      profile.color === undefined ||
      decision.status !== 'resolved' ||
      decision.support !== 'exact' ||
      decision.route.kind !== 'direct'
    ) {
      return undefined;
    }

    const allowedActions = new Set(['enter-profile', 'switch-rule', 'switch-default']);
    if (decision.trace.some((entry) => !allowedActions.has(entry.action))) return undefined;

    const enteredProfiles = decision.trace
      .filter((entry) => entry.action === 'enter-profile')
      .map((entry) => entry.profileId);
    if (enteredProfiles.length !== 1 || enteredProfiles[0] !== profile.id) return undefined;

    const switchEntries = decision.trace.filter((entry) => entry.action === 'switch-rule');
    if (switchEntries.some((entry) => entry.profileId !== profile.id)) return undefined;
    const matchedEntries = switchEntries.filter((entry) => entry.matched === true);
    const defaultEntries = decision.trace.filter((entry) => entry.action === 'switch-default');
    const directName = this.requireRouteName('direct');
    const directDisplayName = `[${directName}]`;

    let details: string;
    if (matchedEntries.length === 1 && defaultEntries.length === 0) {
      const matchedEntry = matchedEntries[0];
      const rule = profile.rules.find((candidate) => candidate.id === matchedEntry?.ruleId);
      if (rule === undefined || rule.route.kind !== 'direct') return undefined;
      const condition = originalSwitchConditionDisplay(rule.condition);
      if (condition === undefined) return undefined;
      details = `${condition} => ${directDisplayName}\\n`;
    } else if (matchedEntries.length === 0 && defaultEntries.length === 1) {
      if (profile.defaultRoute.kind !== 'direct') return undefined;
      const defaultDetail = localizeOriginalToolbarDetail(
        this.#i18n,
        ORIGINAL_TOOLBAR_DETAIL_KEYS.defaultRule,
      );
      details = `${defaultDetail} => ${directDisplayName}\\n`;
    } else {
      return undefined;
    }

    return deriveOriginalToolbarTabState({
      currentProfileName: profile.name,
      resultProfileName: directDisplayName,
      details,
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

"""
resolver = replace_once(resolver, insert_marker, new_methods + insert_marker, 'resolver direct methods')
resolver_path.write_text(resolver, encoding='utf-8')


test_path = Path('apps/extension/src/lib/original-toolbar-profile-resolver.test.ts')
test = test_path.read_text(encoding='utf-8')
test_marker = """  it('fails closed for Switch trace shapes outside the exact Fixed slice', async () => {
"""
direct_tests = """  it('reproduces an exact Switch matched-rule trace into Direct', async () => {
    const workflowState = state(true);
    workflowState.applied.profiles.push({
      id: 'profile-switch-direct',
      name: 'Automatic',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-direct',
          condition: { kind: 'host-wildcard', pattern: 'direct-match.test' },
          route: { kind: 'direct' },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-switch-direct' },
    }).resolve({ tabId: 22, url: 'http://direct-match.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Automatic',
        resultProfileName: '[Direct]',
        details: 'direct-match.test => [Direct]\\n',
      },
      badgeText: 'Dire',
    });
  });

  it('reproduces an exact Switch default trace into Direct', async () => {
    const workflowState = state();
    workflowState.applied.profiles.push({
      id: 'profile-switch-direct',
      name: 'Automatic',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-fixed',
          condition: { kind: 'host-wildcard', pattern: 'fixed-match.test' },
          route: { kind: 'profile', profileId: 'profile-default-proxy' },
        },
      ],
      defaultRoute: { kind: 'direct' },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-switch-direct' },
    }).resolve({ tabId: 24, url: 'http://default-match.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Automatic',
        resultProfileName: '[Direct]',
        details: '(default) => [Direct]\\n',
      },
    });
  });

"""
test = replace_once(test, test_marker, direct_tests + test_marker, 'resolver Direct tests')
test = replace_once(
    test,
    """      rules: [],
      defaultRoute: { kind: 'direct' },
    });
""",
    """      rules: [],
      defaultRoute: { kind: 'system' },
    });
""",
    'resolver fail-closed System route',
)
test = test.replace(
    "fails closed for Switch trace shapes outside the exact Fixed slice",
    "fails closed for invalid System and attached-list Switch trace shapes",
    1,
)
test_path.write_text(test, encoding='utf-8')


chromium_path = Path('scripts/e2e-chromium-toolbar.mjs')
chrome = chromium_path.read_text(encoding='utf-8')
chrome = replace_once(
    chrome,
    """      switchDefault: resultTitle(
        'Toolbar Switch',
        'Toolbar Proxy',
        `${defaultDetail} => Toolbar Proxy\\nPROXY 127.0.0.1:${proxyPort}\\n`,
      ),
""",
    """      switchDefault: resultTitle(
        'Toolbar Switch',
        'Toolbar Proxy',
        `${defaultDetail} => Toolbar Proxy\\nPROXY 127.0.0.1:${proxyPort}\\n`,
      ),
      switchDirectMatched: resultTitle(
        'Toolbar Switch',
        `[${directName}]`,
        `localhost => [${directName}]\\n`,
      ),
      switchDirectDefault: resultTitle(
        'Toolbar Switch',
        `[${directName}]`,
        `${defaultDetail} => [${directName}]\\n`,
      ),
""",
    'Chromium Direct expected titles',
)
chrome = replace_once(
    chrome,
    """      {
        id: 'rule-toolbar-a',
        condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
        route: { kind: 'profile', profileId: proxyProfileId },
      },
    ],
    defaultRoute: { kind: 'profile', profileId: proxyProfileId },
""",
    """      {
        id: 'rule-toolbar-a',
        condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
        route: { kind: 'profile', profileId: proxyProfileId },
      },
      {
        id: 'rule-toolbar-direct',
        condition: { kind: 'host-wildcard', pattern: 'localhost' },
        route: { kind: 'direct' },
      },
    ],
    defaultRoute: { kind: 'direct' },
""",
    'Chromium Switch Direct profile',
)
chrome = replace_once(
    chrome,
    """  const switchMatchedState = { title: expectedTitles.switchMatched, badgeText: 'Tool', popup };
  const switchDefaultState = { title: expectedTitles.switchDefault, badgeText: 'Tool', popup };
""",
    """  const switchMatchedState = { title: expectedTitles.switchMatched, badgeText: 'Tool', popup };
  const switchDirectMatchedState = {
    title: expectedTitles.switchDirectMatched,
    badgeText: 'Dire',
    popup,
  };
  const switchDirectDefaultState = {
    title: expectedTitles.switchDirectDefault,
    badgeText: 'Dire',
    popup,
  };
""",
    'Chromium Switch Direct states',
)
chrome = replace_once(
    chrome,
    """  await waitForActionState(
    extensionPage,
    bypassTabId,
    switchDefaultState,
    'Switch default Action state failed',
  );
""",
    """  await waitForActionState(
    extensionPage,
    bypassTabId,
    switchDirectMatchedState,
    'Switch matched-Direct Action state failed',
  );
""",
    'Chromium matched Direct assertion',
)
chrome = replace_once(
    chrome,
    """  await proxyPage.goto(sameTabBypassUrl, { waitUntil: 'domcontentloaded' });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    switchDefaultState,
    'Switch same-tab matched-to-default transition failed',
  );
  await proxyPage.goto(sameTabProxyUrl, { waitUntil: 'domcontentloaded' });
""",
    """  const switchDefaultDirectUrl = `http://127.0.0.1:${address.port}/switch-default-direct`;
  await proxyPage.goto(switchDefaultDirectUrl, { waitUntil: 'domcontentloaded' });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    switchDirectDefaultState,
    'Switch same-tab Fixed-to-default-Direct transition failed',
  );
  await proxyPage.goto(sameTabProxyUrl, { waitUntil: 'domcontentloaded' });
""",
    'Chromium default Direct transition',
)
chrome = chrome.replace(
    "'Switch same-tab default-to-matched transition failed'",
    "'Switch same-tab default-Direct-to-Fixed transition failed'",
    1,
)
chromium_path.write_text(chrome, encoding='utf-8')


firefox_path = Path('scripts/e2e-firefox.mjs')
firefox = firefox_path.read_text(encoding='utf-8')
firefox = replace_once(
    firefox,
    """        {
          id: 'rule-toolbar-a',
          condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
          route: { kind: 'profile', profileId: 'profile-default-proxy' },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
""",
    """        {
          id: 'rule-toolbar-a',
          condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
          route: { kind: 'profile', profileId: 'profile-default-proxy' },
        },
        {
          id: 'rule-toolbar-direct',
          condition: { kind: 'host-wildcard', pattern: 'localhost' },
          route: { kind: 'direct' },
        },
      ],
      defaultRoute: { kind: 'direct' },
""",
    'Firefox Switch Direct profile',
)
firefox = replace_once(
    firefox,
    """    const switchDefaultAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Switch',
        'Toolbar Proxy',
        `${defaultDetail} => Toolbar Proxy\\nPROXY 127.0.0.1:${sourceAddress.port}\\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
""",
    """    const switchDefaultAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Switch',
        'Toolbar Proxy',
        `${defaultDetail} => Toolbar Proxy\\nPROXY 127.0.0.1:${sourceAddress.port}\\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    const switchDirectMatchedAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Switch',
        routeDirect,
        `localhost => ${routeDirect}\\n`,
        toolbarPopup,
      )),
      badgeText: 'Dire',
    };
    const switchDirectDefaultAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Switch',
        routeDirect,
        `${defaultDetail} => ${routeDirect}\\n`,
        toolbarPopup,
      )),
      badgeText: 'Dire',
    };
""",
    'Firefox Direct expected states',
)
firefox = replace_once(
    firefox,
    """    await waitForFirefoxActionState(
      toolbarBypassTabId,
      switchDefaultAction,
      'Firefox focused Switch default Action state failed',
    );
""",
    """    await waitForFirefoxActionState(
      toolbarBypassTabId,
      switchDirectMatchedAction,
      'Firefox focused Switch matched-Direct Action state failed',
    );
""",
    'Firefox matched Direct assertion',
)
firefox = replace_once(
    firefox,
    """    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(sameTabBypassUrl);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      switchDefaultAction,
      'Firefox focused Switch same-tab matched-to-default transition failed',
    );
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(sameTabProxyUrl);
""",
    """    const switchDefaultDirectUrl = `http://127.0.0.1:${sourceAddress.port}/toolbar-switch-default-direct`;
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(switchDefaultDirectUrl);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      switchDirectDefaultAction,
      'Firefox focused Switch same-tab Fixed-to-default-Direct transition failed',
    );
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(sameTabProxyUrl);
""",
    'Firefox default Direct transition',
)
firefox = firefox.replace(
    "'Firefox focused Switch same-tab default-to-matched transition failed'",
    "'Firefox focused Switch same-tab default-Direct-to-Fixed transition failed'",
    1,
)
firefox_path.write_text(firefox, encoding='utf-8')
