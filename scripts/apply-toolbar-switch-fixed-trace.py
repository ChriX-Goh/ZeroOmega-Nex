from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


resolver = Path("apps/extension/src/lib/original-toolbar-profile-resolver.ts")
text = resolver.read_text(encoding="utf-8")
text = replace_once(
    text,
    """import type {
  ProfileWorkflowRuntimeView,
  ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import { evaluateProfileGraph, type ReferenceRequest } from '@zeroomega-nex/reference-interpreter';""",
    """import type { Condition, FixedProfile, SwitchProfile } from '@zeroomega-nex/profile-spec';
import type {
  ProfileWorkflowRuntimeView,
  ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import {
  evaluateProfileGraph,
  type GraphDecision,
  type ReferenceRequest,
} from '@zeroomega-nex/reference-interpreter';""",
    "resolver imports",
)
text = replace_once(
    text,
    """const PAC_PROTOCOLS = {
  http: 'PROXY',
  https: 'HTTPS',
  socks4: 'SOCKS',
  socks5: 'SOCKS5',
} as const;
""",
    """const PAC_PROTOCOLS = {
  http: 'PROXY',
  https: 'HTTPS',
  socks4: 'SOCKS',
  socks5: 'SOCKS5',
} as const;
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const WEEKDAY_MARKERS = 'SMTWtFs';
""",
    "resolver constants",
)
text = replace_once(
    text,
    """function originalPacResult(endpoint: {
  readonly protocol: keyof typeof PAC_PROTOCOLS;
  readonly host: string;
  readonly port: number;
}): string {
  return `${PAC_PROTOCOLS[endpoint.protocol]} ${endpoint.host}:${endpoint.port}`;
}
""",
    """function originalPacResult(endpoint: {
  readonly protocol: keyof typeof PAC_PROTOCOLS;
  readonly host: string;
  readonly port: number;
}): string {
  return `${PAC_PROTOCOLS[endpoint.protocol]} ${endpoint.host}:${endpoint.port}`;
}

function originalSwitchConditionDisplay(condition: Condition): string | undefined {
  const singleLine = (value: string): string | undefined =>
    value.length > 0 && !value.includes('\\n') && !value.includes('\\r') ? value : undefined;

  switch (condition.kind) {
    case 'url-regex':
    case 'host-regex':
      return condition.flags === undefined ? singleLine(condition.pattern) : undefined;
    case 'url-wildcard':
    case 'host-wildcard':
    case 'bypass':
    case 'keyword':
      return singleLine(condition.pattern);
    case 'true':
      return 'True:';
    case 'false':
      return condition.annotation === undefined || condition.annotation.length === 0
        ? 'False:'
        : singleLine(condition.annotation);
    case 'ip':
      return `Ip: ${condition.address}/${condition.prefixLength}`;
    case 'host-levels':
      return `HostLevels: ${condition.min}~${condition.max}`;
    case 'weekday': {
      const selected = new Set(condition.days);
      const value = WEEKDAYS.map((day, index) =>
        selected.has(day) ? WEEKDAY_MARKERS[index] : '-',
      ).join('');
      return `Weekday: ${value}`;
    }
    case 'time':
      return `Time: ${condition.startHour}~${condition.endHour}`;
  }
}
""",
    "resolver condition display",
)
old_main = """    const profile = state.applied.profiles.find((candidate) => candidate.id === route.profileId);
    if (profile?.kind !== 'fixed' || profile.color === undefined) return undefined;

    const request = referenceRequest(input.url);
    if (request === undefined) return undefined;
    const decision = evaluateProfileGraph(state.applied, route, request);
    if (decision.status !== 'resolved') return undefined;

    if (decision.route.kind === 'proxy') {
      const scheme = request.scheme as 'http' | 'https' | 'ftp';
      const hasSpecificEndpoint = profile.proxyByScheme[scheme] !== undefined;
      const pacResult = originalPacResult(decision.route.endpoint);
      return this.resolveFixed(
        state,
        profile.name,
        profile.color,
        directColor,
        `${hasSpecificEndpoint ? `${scheme} => ` : ''}${pacResult}\\n`,
        false,
      );
    }

    if (decision.route.kind !== 'direct') return undefined;
    const directDetail = localizeOriginalToolbarDetail(
      this.#i18n,
      ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult,
    );
    const matchedBypass = decision.trace.find(
      (entry) => entry.action === 'fixed-bypass' && entry.matched === true,
    );
    const bypass =
      matchedBypass?.action === 'fixed-bypass'
        ? profile.bypass.find((candidate) => candidate.id === matchedBypass.bypassId)
        : undefined;
    const hasUnmappedDirect = decision.trace.some(
      (entry) => entry.action === 'fixed-unmapped-direct',
    );
    if (bypass === undefined && !hasUnmappedDirect) return undefined;

    return this.resolveFixed(
      state,
      profile.name,
      profile.color,
      directColor,
      `${bypass === undefined ? '' : `${bypass.pattern} => `}${directDetail}\\n`,
      true,
    );"""
new_main = """    const profile = state.applied.profiles.find((candidate) => candidate.id === route.profileId);
    if (profile === undefined || profile.color === undefined) return undefined;

    const request = referenceRequest(input.url);
    if (request === undefined) return undefined;
    const decision = evaluateProfileGraph(state.applied, route, request);
    if (decision.status !== 'resolved' || decision.support !== 'exact') return undefined;

    if (profile.kind === 'switch') {
      return this.resolveSwitchFixedProxy(state, profile, decision, request, directColor);
    }
    if (profile.kind !== 'fixed') return undefined;

    if (decision.route.kind === 'proxy') {
      const scheme = request.scheme as 'http' | 'https' | 'ftp';
      const hasSpecificEndpoint = profile.proxyByScheme[scheme] !== undefined;
      const pacResult = originalPacResult(decision.route.endpoint);
      return this.resolveFixed(
        state,
        profile.name,
        profile.color,
        directColor,
        `${hasSpecificEndpoint ? `${scheme} => ` : ''}${pacResult}\\n`,
        false,
      );
    }

    if (decision.route.kind !== 'direct') return undefined;
    const directDetail = localizeOriginalToolbarDetail(
      this.#i18n,
      ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult,
    );
    const matchedBypass = decision.trace.find(
      (entry) => entry.action === 'fixed-bypass' && entry.matched === true,
    );
    const bypass =
      matchedBypass?.action === 'fixed-bypass'
        ? profile.bypass.find((candidate) => candidate.id === matchedBypass.bypassId)
        : undefined;
    const hasUnmappedDirect = decision.trace.some(
      (entry) => entry.action === 'fixed-unmapped-direct',
    );
    if (bypass === undefined && !hasUnmappedDirect) return undefined;

    return this.resolveFixed(
      state,
      profile.name,
      profile.color,
      directColor,
      `${bypass === undefined ? '' : `${bypass.pattern} => `}${directDetail}\\n`,
      true,
    );"""
text = replace_once(text, old_main, new_main, "resolver main profile branch")
insert_before = """  private resolveBuiltIn(
"""
switch_method = """  private resolveSwitchFixedProxy(
    state: ProfileWorkflowState,
    profile: SwitchProfile,
    decision: GraphDecision,
    request: ReferenceRequest,
    directColor: string,
  ) {
    if (
      profile.attachedRuleListProfileId !== undefined ||
      decision.status !== 'resolved' ||
      decision.support !== 'exact' ||
      decision.route.kind !== 'proxy'
    ) {
      return undefined;
    }

    const allowedActions = new Set([
      'enter-profile',
      'switch-rule',
      'switch-default',
      'fixed-bypass',
      'fixed-endpoint',
    ]);
    if (decision.trace.some((entry) => !allowedActions.has(entry.action))) return undefined;

    const enteredProfiles = decision.trace
      .filter((entry) => entry.action === 'enter-profile')
      .map((entry) => entry.profileId);
    if (enteredProfiles.length !== 2 || enteredProfiles[0] !== profile.id) return undefined;

    const endpointEntry = decision.trace.findLast((entry) => entry.action === 'fixed-endpoint');
    if (
      endpointEntry?.action !== 'fixed-endpoint' ||
      endpointEntry.profileId !== enteredProfiles[1] ||
      endpointEntry.endpointId !== decision.route.endpointId
    ) {
      return undefined;
    }

    const resultProfile = state.applied.profiles.find(
      (candidate): candidate is FixedProfile =>
        candidate.id === endpointEntry.profileId &&
        candidate.kind === 'fixed' &&
        candidate.color !== undefined,
    );
    if (resultProfile === undefined || resultProfile.color === undefined) return undefined;

    const switchEntries = decision.trace.filter((entry) => entry.action === 'switch-rule');
    if (switchEntries.some((entry) => entry.profileId !== profile.id)) return undefined;
    const matchedEntries = switchEntries.filter((entry) => entry.matched === true);
    const defaultEntries = decision.trace.filter((entry) => entry.action === 'switch-default');

    let selectionDetail: string;
    if (matchedEntries.length === 1 && defaultEntries.length === 0) {
      const matchedEntry = matchedEntries[0];
      const rule = profile.rules.find((candidate) => candidate.id === matchedEntry?.ruleId);
      if (
        rule === undefined ||
        rule.route.kind !== 'profile' ||
        rule.route.profileId !== resultProfile.id
      ) {
        return undefined;
      }
      const condition = originalSwitchConditionDisplay(rule.condition);
      if (condition === undefined) return undefined;
      selectionDetail = `${condition} => ${resultProfile.name}\\n`;
    } else if (matchedEntries.length === 0 && defaultEntries.length === 1) {
      if (
        profile.defaultRoute.kind !== 'profile' ||
        profile.defaultRoute.profileId !== resultProfile.id
      ) {
        return undefined;
      }
      const defaultDetail = localizeOriginalToolbarDetail(
        this.#i18n,
        ORIGINAL_TOOLBAR_DETAIL_KEYS.defaultRule,
      );
      selectionDetail = `${defaultDetail} => ${resultProfile.name}\\n`;
    } else {
      return undefined;
    }

    const scheme = request.scheme as 'http' | 'https' | 'ftp';
    const hasSpecificEndpoint = resultProfile.proxyByScheme[scheme] !== undefined;
    const pacResult = originalPacResult(decision.route.endpoint);
    const details = `${selectionDetail}${hasSpecificEndpoint ? `${scheme} => ` : ''}${pacResult}\\n`;

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

"""
text = replace_once(text, insert_before, switch_method + insert_before, "resolver switch method insertion")
resolver.write_text(text, encoding="utf-8")


test_path = Path("apps/extension/src/lib/original-toolbar-profile-resolver.test.ts")
test = test_path.read_text(encoding="utf-8")
insert_marker = """  it('returns default state for unsupported or missing runtime state', async () => {
"""
new_tests = """  it('reproduces an exact Switch matched-rule trace into a Fixed result', async () => {
    const workflowState = state(true);
    const fixed = workflowState.applied.profiles[0];
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
    fixed.bypass = [];
    workflowState.applied.profiles.push({
      id: 'profile-switch',
      name: 'Automatic',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-toolbar',
          condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
          route: { kind: 'profile', profileId: fixed.id },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: fixed.id },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-switch' },
    }).resolve({ tabId: 19, url: 'http://toolbar-a.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Automatic',
        resultProfileName: 'Proxy',
        details: 'toolbar-a.test => Proxy\\nPROXY 127.0.0.1:7890\\n',
      },
      badgeText: 'Prox',
    });
  });

  it('reproduces an exact Switch default trace into a Fixed result', async () => {
    const workflowState = state();
    const fixed = workflowState.applied.profiles[0];
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
    fixed.bypass = [];
    workflowState.applied.profiles.push({
      id: 'profile-switch',
      name: 'Automatic',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-toolbar',
          condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
          route: { kind: 'profile', profileId: fixed.id },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: fixed.id },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-switch' },
    }).resolve({ tabId: 21, url: 'http://other.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Automatic',
        resultProfileName: 'Proxy',
        details: '(default) => Proxy\\nPROXY 127.0.0.1:7890\\n',
      },
    });
  });

  it('fails closed for Switch trace shapes outside the exact Fixed slice', async () => {
    const workflowState = state();
    const fixed = workflowState.applied.profiles[0];
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
    workflowState.applied.profiles.push({
      id: 'profile-switch',
      name: 'Automatic',
      color: '#ffb74d',
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'direct' },
    });

    await expect(
      resolver(workflowState, {
        activeRoute: { kind: 'profile', profileId: 'profile-switch' },
      }).resolve({ tabId: 23, url: 'http://other.test/' }),
    ).resolves.toBeUndefined();

    const profile = workflowState.applied.profiles.find(
      (candidate) => candidate.id === 'profile-switch',
    );
    if (!profile || profile.kind !== 'switch') throw new Error('missing Switch profile');
    profile.defaultRoute = { kind: 'profile', profileId: fixed.id };
    profile.attachedRuleListProfileId = 'profile-attached-list';
    await expect(
      resolver(workflowState, {
        activeRoute: { kind: 'profile', profileId: profile.id },
      }).resolve({ tabId: 25, url: 'http://other.test/' }),
    ).resolves.toBeUndefined();
  });

"""
test = replace_once(test, insert_marker, new_tests + insert_marker, "resolver tests insertion")
test_path.write_text(test, encoding="utf-8")


chromium = Path("scripts/e2e-chromium-toolbar.mjs")
chrome = chromium.read_text(encoding="utf-8")
chrome = replace_once(
    chrome,
    """    const directDetail = chrome.i18n.getMessage('browserAction_directResult');
    return {
""",
    """    const directDetail = chrome.i18n.getMessage('browserAction_directResult');
    const defaultDetail = chrome.i18n.getMessage('browserAction_defaultRuleDetails');
    return {
""",
    "Chromium default detail",
)
chrome = replace_once(
    chrome,
    """      fixedBypass: resultTitle('Toolbar Proxy', 'Toolbar Proxy', `localhost => ${directDetail}\\n`),
      default: chrome.i18n.getMessage('manifest_icon_default_title'),
""",
    """      fixedBypass: resultTitle('Toolbar Proxy', 'Toolbar Proxy', `localhost => ${directDetail}\\n`),
      switchMatched: resultTitle(
        'Toolbar Switch',
        'Toolbar Proxy',
        `toolbar-a.test => Toolbar Proxy\\nPROXY 127.0.0.1:${proxyPort}\\n`,
      ),
      switchDefault: resultTitle(
        'Toolbar Switch',
        'Toolbar Proxy',
        `${defaultDetail} => Toolbar Proxy\\nPROXY 127.0.0.1:${proxyPort}\\n`,
      ),
      default: chrome.i18n.getMessage('manifest_icon_default_title'),
""",
    "Chromium Switch expected titles",
)
chrome_insert = """  const switchCurrent = await sendWorkflowCommand(extensionPage, { channel, action: 'get' });
  assert.equal(
    switchCurrent?.ok,
    true,
    `Switch workflow refresh failed: ${JSON.stringify(switchCurrent)}`,
  );
  const switchDraft = structuredClone(switchCurrent.state.draft);
  const switchFixed = switchDraft.profiles.find((candidate) => candidate.id === proxyProfileId);
  assert.equal(switchFixed?.kind, 'fixed', 'Switch target Fixed Profile was not found');
  switchFixed.bypass = [];
  switchDraft.profiles.push({
    id: 'profile-toolbar-switch',
    name: 'Toolbar Switch',
    color: '#ffb74d',
    kind: 'switch',
    rules: [
      {
        id: 'rule-toolbar-a',
        condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
        route: { kind: 'profile', profileId: proxyProfileId },
      },
    ],
    defaultRoute: { kind: 'profile', profileId: proxyProfileId },
  });
  const switchReplaced = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'replace-draft',
    expectedGeneration: switchCurrent.state.generation,
    draft: switchDraft,
  });
  assert.equal(
    switchReplaced?.ok,
    true,
    `Switch draft replacement failed: ${JSON.stringify(switchReplaced)}`,
  );
  const switchApplied = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'apply',
    expectedGeneration: switchReplaced.state.generation,
  });
  assert.equal(
    switchApplied?.ok,
    true,
    `Switch Apply failed: ${JSON.stringify(switchApplied)}`,
  );
  const switchActivated = await sendWorkflowCommand(extensionPage, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: switchApplied.state.applied.revision.id,
    route: { kind: 'profile', profileId: 'profile-toolbar-switch' },
  });
  assert.equal(
    switchActivated?.ok,
    true,
    `Switch activation failed: ${JSON.stringify(switchActivated)}`,
  );

  const switchMatchedState = { title: expectedTitles.switchMatched, badgeText: 'Tool', popup };
  const switchDefaultState = { title: expectedTitles.switchDefault, badgeText: 'Tool', popup };
  await waitForActionState(
    extensionPage,
    proxyTabId,
    switchMatchedState,
    'Switch matched-rule Action state failed',
  );
  await waitForActionState(
    extensionPage,
    bypassTabId,
    switchDefaultState,
    'Switch default Action state failed',
  );
  await waitForActionState(
    extensionPage,
    internalTabId,
    { title: expectedTitles.default, badgeText: '', popup },
    'Switch internal-page fallback Action state failed',
  );

  await proxyPage.goto(sameTabBypassUrl, { waitUntil: 'domcontentloaded' });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    switchDefaultState,
    'Switch same-tab matched-to-default transition failed',
  );
  await proxyPage.goto(sameTabProxyUrl, { waitUntil: 'domcontentloaded' });
  await waitForActionState(
    extensionPage,
    proxyTabId,
    switchMatchedState,
    'Switch same-tab default-to-matched transition failed',
  );

"""
chrome = replace_once(
    chrome,
    """  console.log(`Chromium toolbar Action E2E passed for ${extensionId}.`);
""",
    chrome_insert + """  console.log(`Chromium toolbar Action E2E passed for ${extensionId}.`);
""",
    "Chromium Switch E2E insertion",
)
chromium.write_text(chrome, encoding="utf-8")


firefox_path = Path("scripts/e2e-firefox.mjs")
firefox_text = firefox_path.read_text(encoding="utf-8")
firefox_insert = """    const switchCurrent = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get',
    });
    assert.equal(
      switchCurrent?.ok,
      true,
      `Firefox Switch workflow refresh failed: ${JSON.stringify(switchCurrent)}`,
    );
    const switchDraft = structuredClone(switchCurrent.state.draft);
    const switchFixed = switchDraft.profiles.find(
      (candidate) => candidate.id === 'profile-default-proxy',
    );
    assert.equal(switchFixed?.kind, 'fixed', 'Firefox Switch target Fixed Profile was not found');
    switchFixed.bypass = [];
    switchDraft.profiles.push({
      id: 'profile-toolbar-switch',
      name: 'Toolbar Switch',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-toolbar-a',
          condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
          route: { kind: 'profile', profileId: 'profile-default-proxy' },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    });
    const switchReplaced = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'replace-draft',
      expectedGeneration: switchCurrent.state.generation,
      draft: switchDraft,
    });
    assert.equal(
      switchReplaced?.ok,
      true,
      `Firefox Switch draft replacement failed: ${JSON.stringify(switchReplaced)}`,
    );
    const switchApplied = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'apply',
      expectedGeneration: switchReplaced.state.generation,
    });
    assert.equal(
      switchApplied?.ok,
      true,
      `Firefox Switch Apply failed: ${JSON.stringify(switchApplied)}`,
    );
    const switchActivated = await sendFirefoxWorkflowCommand({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: switchApplied.state.applied.revision.id,
      route: { kind: 'profile', profileId: 'profile-toolbar-switch' },
    });
    assert.equal(
      switchActivated?.ok,
      true,
      `Firefox Switch activation failed: ${JSON.stringify(switchActivated)}`,
    );

    const defaultDetail = await driver.executeScript(
      "return browser.i18n.getMessage('browserAction_defaultRuleDetails');",
    );
    const switchMatchedAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Switch',
        'Toolbar Proxy',
        `toolbar-a.test => Toolbar Proxy\\nPROXY 127.0.0.1:${sourceAddress.port}\\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    const switchDefaultAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Switch',
        'Toolbar Proxy',
        `${defaultDetail} => Toolbar Proxy\\nPROXY 127.0.0.1:${sourceAddress.port}\\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      switchMatchedAction,
      'Firefox focused Switch matched-rule Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarBypassTabId,
      switchDefaultAction,
      'Firefox focused Switch default Action state failed',
    );
    await waitForFirefoxActionState(
      toolbarInternalTabId,
      defaultAction,
      'Firefox focused Switch internal-page fallback Action state failed',
    );

    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(sameTabBypassUrl);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      switchDefaultAction,
      'Firefox focused Switch same-tab matched-to-default transition failed',
    );
    await driver.switchTo().window(toolbarProxyWindow);
    await driver.get(sameTabProxyUrl);
    await driver.switchTo().window(optionsWindow);
    await waitForFirefoxActionState(
      toolbarProxyTabId,
      switchMatchedAction,
      'Firefox focused Switch same-tab default-to-matched transition failed',
    );

"""
firefox_text = replace_once(
    firefox_text,
    """    assert.notEqual(toolbarBypassWindow, toolbarProxyWindow);
    assert.notEqual(toolbarInternalWindow, toolbarProxyWindow);
    console.log(`Firefox toolbar Action E2E passed for ${installedId}.`);
""",
    firefox_insert
    + """    assert.notEqual(toolbarBypassWindow, toolbarProxyWindow);
    assert.notEqual(toolbarInternalWindow, toolbarProxyWindow);
    console.log(`Firefox toolbar Action E2E passed for ${installedId}.`);
""",
    "Firefox Switch E2E insertion",
)
firefox_path.write_text(firefox_text, encoding="utf-8")
