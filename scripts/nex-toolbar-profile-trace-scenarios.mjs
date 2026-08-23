export const NEX_TOOLBAR_WORKFLOW_CHANNEL = 'zeroomega-nex/profile-workflow/v1';

export const NESTED_SWITCH_SCENARIO = Object.freeze({
  id: 'nested-switch',
  fixedProfileId: 'profile-default-proxy',
  fixedEndpointId: 'endpoint-nested-switch-e2e',
  innerProfileId: 'profile-nested-inner-e2e',
  outerProfileId: 'profile-nested-outer-e2e',
  hosts: Object.freeze(['nested-fixed.test', 'nested-direct.test']),
});

export const NESTED_VIRTUAL_SCENARIO = Object.freeze({
  id: 'nested-virtual',
  fixedProfileId: 'profile-nested-virtual-fixed-e2e',
  fixedEndpointId: 'endpoint-nested-virtual-e2e',
  innerFixedProfileId: 'profile-nested-virtual-inner-fixed-e2e',
  outerFixedProfileId: 'profile-nested-virtual-outer-fixed-e2e',
  innerDirectProfileId: 'profile-nested-virtual-inner-direct-e2e',
  outerDirectProfileId: 'profile-nested-virtual-outer-direct-e2e',
  hosts: Object.freeze(['nested-virtual-direct.test', 'nested-virtual-fixed.test']),
});

export const VIRTUAL_SWITCH_SCENARIO = Object.freeze({
  id: 'virtual-switch',
  fixedProfileId: 'profile-virtual-switch-fixed-e2e',
  fixedEndpointId: 'endpoint-virtual-switch-e2e',
  innerProfileId: 'profile-virtual-switch-inner-e2e',
  outerProfileId: 'profile-virtual-switch-outer-e2e',
  hosts: Object.freeze([
    'virtual-switch-fixed.test',
    'virtual-switch-direct.test',
    'virtual-switch-default.test',
  ]),
});

export const PAC_SCENARIO = Object.freeze({
  id: 'pac',
  profileId: 'profile-runtime-pac-e2e',
  hosts: Object.freeze(['pac-proxy.test', 'pac-direct.test']),
});

export const TEMPORARY_RULE_SCENARIO = Object.freeze({
  id: 'temporary-rule',
  baseProfileId: 'profile-temporary-base-e2e',
  fixedProfileId: 'profile-temporary-fixed-e2e',
  fixedEndpointId: 'endpoint-temporary-rule-e2e',
  domain: 'temp-rule.test',
  hosts: Object.freeze(['temp-rule.test', 'temp-rule-default.test']),
});

export const POPUP_TEMPORARY_RULE_CHANNEL = 'zeroomega-nex/popup-temporary-rules/v1';

export const RUNTIME_PAC_SCRIPT = `function FindProxyForURL(url, host) {
  if (host === 'pac-proxy.test') return 'PROXY 127.0.0.1:18186';
  return 'DIRECT';
}
`;

export const PROFILE_TRACE_HOSTS = Object.freeze([
  ...NESTED_SWITCH_SCENARIO.hosts,
  ...NESTED_VIRTUAL_SCENARIO.hosts,
  ...VIRTUAL_SWITCH_SCENARIO.hosts,
  ...PAC_SCENARIO.hosts,
  ...TEMPORARY_RULE_SCENARIO.hosts,
]);

export function configureNestedSwitchDraft(draft, proxyPort) {
  const scenario = NESTED_SWITCH_SCENARIO;
  const fixed = draft.profiles.find((candidate) => candidate.id === scenario.fixedProfileId);
  if (!fixed || fixed.kind !== 'fixed') {
    throw new Error('Default Fixed Profile was not found for nested Switch E2E');
  }

  fixed.name = 'Runtime Nested Fixed';
  fixed.color = '#64b5f6';
  fixed.bypass = [];
  fixed.proxyByScheme = { fallback: scenario.fixedEndpointId };
  draft.proxyEndpoints = [
    {
      id: scenario.fixedEndpointId,
      name: 'Nested Switch E2E endpoint',
      protocol: 'http',
      host: '127.0.0.1',
      port: proxyPort,
    },
  ];
  draft.settings.interface.showResultProfileOnActionBadgeText = true;
  draft.profiles.push(
    {
      id: scenario.innerProfileId,
      name: 'Runtime Nested Inner Switch',
      color: '#81c784',
      kind: 'switch',
      rules: [
        {
          id: 'rule-nested-inner-fixed',
          condition: { kind: 'host-wildcard', pattern: 'nested-fixed.test' },
          route: { kind: 'profile', profileId: scenario.fixedProfileId },
        },
      ],
      defaultRoute: { kind: 'direct' },
    },
    {
      id: scenario.outerProfileId,
      name: 'Runtime Nested Outer Switch',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-nested-outer-fixed',
          condition: { kind: 'host-wildcard', pattern: 'nested-fixed.test' },
          route: { kind: 'profile', profileId: scenario.innerProfileId },
        },
        {
          id: 'rule-nested-outer-direct',
          condition: { kind: 'host-wildcard', pattern: 'nested-direct.test' },
          route: { kind: 'profile', profileId: scenario.innerProfileId },
        },
      ],
      defaultRoute: { kind: 'direct' },
    },
  );
  draft.settings.quickSwitch.routes.push({
    kind: 'profile',
    profileId: scenario.outerProfileId,
  });
  return scenario;
}

export function configureNestedVirtualDraft(draft, proxyPort) {
  const scenario = NESTED_VIRTUAL_SCENARIO;
  draft.proxyEndpoints.push({
    id: scenario.fixedEndpointId,
    name: 'Nested Virtual E2E endpoint',
    protocol: 'http',
    host: '127.0.0.1',
    port: proxyPort,
  });
  draft.settings.interface.showResultProfileOnActionBadgeText = true;
  draft.profiles.push(
    {
      id: scenario.fixedProfileId,
      name: 'Runtime Nested Virtual Fixed',
      color: '#64b5f6',
      kind: 'fixed',
      proxyByScheme: { fallback: scenario.fixedEndpointId },
      bypass: [{ id: 'bypass-nested-virtual-localhost-e2e', pattern: 'localhost' }],
    },
    {
      id: scenario.innerFixedProfileId,
      name: 'Runtime Nested Virtual Inner Fixed Alias',
      color: '#81c784',
      kind: 'virtual',
      targetRoute: { kind: 'profile', profileId: scenario.fixedProfileId },
    },
    {
      id: scenario.outerFixedProfileId,
      name: 'Runtime Nested Virtual Outer Fixed Alias',
      color: '#ffb74d',
      kind: 'virtual',
      targetRoute: { kind: 'profile', profileId: scenario.innerFixedProfileId },
    },
    {
      id: scenario.innerDirectProfileId,
      name: 'Runtime Nested Virtual Inner Direct Alias',
      color: '#9575cd',
      kind: 'virtual',
      targetRoute: { kind: 'direct' },
    },
    {
      id: scenario.outerDirectProfileId,
      name: 'Runtime Nested Virtual Outer Direct Alias',
      color: '#ff8a65',
      kind: 'virtual',
      targetRoute: { kind: 'profile', profileId: scenario.innerDirectProfileId },
    },
  );
  draft.settings.quickSwitch.routes.push(
    { kind: 'profile', profileId: scenario.outerDirectProfileId },
    { kind: 'profile', profileId: scenario.outerFixedProfileId },
  );
  return scenario;
}

export function configureVirtualSwitchDraft(draft, proxyPort) {
  const scenario = VIRTUAL_SWITCH_SCENARIO;
  draft.settings.interface.showResultProfileOnActionBadgeText = true;
  draft.proxyEndpoints.push({
    id: scenario.fixedEndpointId,
    name: 'Virtual Switch E2E endpoint',
    protocol: 'http',
    host: '127.0.0.1',
    port: proxyPort,
  });
  draft.profiles.push(
    {
      id: scenario.fixedProfileId,
      name: 'Runtime Virtual Switch Fixed',
      color: '#64b5f6',
      kind: 'fixed',
      proxyByScheme: { fallback: scenario.fixedEndpointId },
      bypass: [],
    },
    {
      id: scenario.innerProfileId,
      name: 'Runtime Virtual Switch Inner',
      color: '#81c784',
      kind: 'switch',
      rules: [
        {
          id: 'rule-virtual-switch-fixed-e2e',
          condition: { kind: 'host-wildcard', pattern: 'virtual-switch-fixed.test' },
          route: { kind: 'profile', profileId: scenario.fixedProfileId },
        },
        {
          id: 'rule-virtual-switch-direct-e2e',
          condition: { kind: 'host-wildcard', pattern: 'virtual-switch-direct.test' },
          route: { kind: 'direct' },
        },
      ],
      defaultRoute: { kind: 'direct' },
    },
    {
      id: scenario.outerProfileId,
      name: 'Runtime Virtual Switch Outer Alias',
      color: '#ff8a65',
      kind: 'virtual',
      targetRoute: { kind: 'profile', profileId: scenario.innerProfileId },
    },
  );
  draft.settings.quickSwitch.routes.push({
    kind: 'profile',
    profileId: scenario.outerProfileId,
  });
  return scenario;
}

export function configurePacDraft(draft, pacUrl) {
  const scenario = PAC_SCENARIO;
  draft.settings.interface.showResultProfileOnActionBadgeText = true;
  draft.profiles.push({
    id: scenario.profileId,
    name: 'Runtime PAC',
    color: '#4db6ac',
    kind: 'pac',
    source: { kind: 'url', url: pacUrl, script: RUNTIME_PAC_SCRIPT },
  });
  draft.settings.quickSwitch.routes.push({ kind: 'profile', profileId: scenario.profileId });
  return scenario;
}

export function configureTemporaryRuleDraft(draft, proxyPort) {
  const scenario = TEMPORARY_RULE_SCENARIO;
  draft.settings.interface.showResultProfileOnActionBadgeText = true;
  draft.proxyEndpoints.push({
    id: scenario.fixedEndpointId,
    name: 'Temporary rule E2E endpoint',
    protocol: 'http',
    host: '127.0.0.1',
    port: proxyPort,
  });
  draft.profiles.push(
    {
      id: scenario.fixedProfileId,
      name: 'Runtime Temporary Fixed',
      color: '#64b5f6',
      kind: 'fixed',
      proxyByScheme: { fallback: scenario.fixedEndpointId },
      bypass: [],
    },
    {
      id: scenario.baseProfileId,
      name: 'Runtime Temporary Base',
      color: '#ffb74d',
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'direct' },
    },
  );
  draft.settings.quickSwitch.routes.push({
    kind: 'profile',
    profileId: scenario.baseProfileId,
  });
  return scenario;
}

export function nestedSwitchCases({ proxyPort, directName, defaultDetail }) {
  return Object.freeze([
    Object.freeze({
      id: 'outer-match-inner-match-fixed',
      host: 'nested-fixed.test',
      path: '/nested-fixed',
      currentProfileName: 'Runtime Nested Outer Switch',
      resultProfileName: 'Runtime Nested Fixed',
      badgeText: 'Runt',
      details:
        'nested-fixed.test => Runtime Nested Inner Switch\n' +
        'nested-fixed.test => Runtime Nested Fixed\n' +
        `PROXY 127.0.0.1:${proxyPort}\n`,
    }),
    Object.freeze({
      id: 'outer-match-inner-default-direct',
      host: 'nested-direct.test',
      path: '/nested-direct',
      currentProfileName: 'Runtime Nested Outer Switch',
      resultProfileName: `[${directName}]`,
      badgeText: 'Dire',
      details:
        'nested-direct.test => Runtime Nested Inner Switch\n' +
        `${defaultDetail} => [${directName}]\n`,
    }),
    Object.freeze({
      id: 'outer-default-direct',
      host: '127.0.0.1',
      path: '/outer-default',
      currentProfileName: 'Runtime Nested Outer Switch',
      resultProfileName: `[${directName}]`,
      badgeText: 'Dire',
      details: `${defaultDetail} => [${directName}]\n`,
    }),
  ]);
}

export function nestedVirtualCases({ proxyPort, directName, defaultDetail }) {
  const scenario = NESTED_VIRTUAL_SCENARIO;
  return Object.freeze([
    Object.freeze({
      id: 'outer-virtual-inner-virtual-direct',
      activationProfileId: scenario.outerDirectProfileId,
      host: 'nested-virtual-direct.test',
      path: '/nested-virtual-direct',
      currentProfileName:
        'Runtime Nested Virtual Outer Direct Alias [Runtime Nested Virtual Inner Direct Alias]',
      resultProfileName: `[${directName}]`,
      badgeText: 'Dire',
      details: `${defaultDetail} => [${directName}]\n`,
    }),
    Object.freeze({
      id: 'outer-virtual-inner-virtual-fixed-proxy',
      activationProfileId: scenario.outerFixedProfileId,
      host: 'nested-virtual-fixed.test',
      path: '/nested-virtual-fixed',
      currentProfileName:
        'Runtime Nested Virtual Outer Fixed Alias [Runtime Nested Virtual Inner Fixed Alias]',
      resultProfileName: 'Runtime Nested Virtual Fixed',
      badgeText: 'Runt',
      details:
        `${defaultDetail} => Runtime Nested Virtual Fixed\n` + `PROXY 127.0.0.1:${proxyPort}\n`,
    }),
    Object.freeze({
      id: 'outer-virtual-inner-virtual-fixed-bypass',
      activationProfileId: scenario.outerFixedProfileId,
      host: 'localhost',
      path: '/nested-virtual-bypass',
      currentProfileName:
        'Runtime Nested Virtual Outer Fixed Alias [Runtime Nested Virtual Inner Fixed Alias]',
      resultProfileName: 'Runtime Nested Virtual Fixed',
      badgeText: 'Runt',
      details: `${defaultDetail} => Runtime Nested Virtual Fixed\nlocalhost => DIRECT\n`,
    }),
  ]);
}

export function virtualSwitchCases({ proxyPort, directName, defaultDetail }) {
  return Object.freeze([
    Object.freeze({
      id: 'virtual-switch-match-fixed',
      host: 'virtual-switch-fixed.test',
      path: '/virtual-switch-fixed',
      currentProfileName: 'Runtime Virtual Switch Outer Alias [Runtime Virtual Switch Inner]',
      resultProfileName: 'Runtime Virtual Switch Fixed',
      badgeText: 'Runt',
      details:
        'virtual-switch-fixed.test => Runtime Virtual Switch Fixed\n' +
        `PROXY 127.0.0.1:${proxyPort}\n`,
    }),
    Object.freeze({
      id: 'virtual-switch-match-direct',
      host: 'virtual-switch-direct.test',
      path: '/virtual-switch-direct',
      currentProfileName: 'Runtime Virtual Switch Outer Alias [Runtime Virtual Switch Inner]',
      resultProfileName: `[${directName}]`,
      badgeText: 'Dire',
      details: `virtual-switch-direct.test => [${directName}]\n`,
    }),
    Object.freeze({
      id: 'virtual-switch-default-direct',
      host: 'virtual-switch-default.test',
      path: '/virtual-switch-default',
      currentProfileName: 'Runtime Virtual Switch Outer Alias [Runtime Virtual Switch Inner]',
      resultProfileName: `[${directName}]`,
      badgeText: 'Dire',
      details: `${defaultDetail} => [${directName}]\n`,
    }),
  ]);
}

export function temporaryRuleCases({ proxyPort, directName, defaultDetail, temporaryPrefix }) {
  const scenario = TEMPORARY_RULE_SCENARIO;
  const defaultResult = Object.freeze({
    currentProfileName: 'Runtime Temporary Base',
    resultProfileName: `[${directName}]`,
    badgeText: 'Dire',
    details:
      `${defaultDetail} => Runtime Temporary Base\n` + `${defaultDetail} => [${directName}]\n`,
  });
  return Object.freeze({
    matched: Object.freeze({
      id: 'temporary-rule-match-fixed',
      host: scenario.domain,
      path: '/temporary-rule-match',
      currentProfileName: 'Runtime Temporary Base',
      resultProfileName: 'Runtime Temporary Fixed',
      badgeText: 'Runt',
      details:
        `${temporaryPrefix}*.${scenario.domain} => Runtime Temporary Fixed\n` +
        `PROXY 127.0.0.1:${proxyPort}\n`,
    }),
    unmatched: Object.freeze({
      id: 'temporary-rule-default-direct',
      host: 'temp-rule-default.test',
      path: '/temporary-rule-default',
      ...defaultResult,
    }),
    removed: Object.freeze({
      id: 'temporary-rule-removed-base-direct',
      host: scenario.domain,
      path: '/temporary-rule-match',
      ...defaultResult,
    }),
  });
}

export function pacCases({ pacUrl }) {
  const scenario = PAC_SCENARIO;
  return Object.freeze([
    Object.freeze({
      id: 'pac-proxy',
      activationProfileId: scenario.profileId,
      host: 'pac-proxy.test',
      path: '/pac-proxy',
      currentProfileName: 'Runtime PAC',
      resultProfileName: 'Runtime PAC',
      badgeText: 'Runt',
      details: pacUrl,
    }),
    Object.freeze({
      id: 'pac-direct',
      activationProfileId: scenario.profileId,
      host: 'pac-direct.test',
      path: '/pac-direct',
      currentProfileName: 'Runtime PAC',
      resultProfileName: 'Runtime PAC',
      badgeText: 'Runt',
      details: pacUrl,
    }),
  ]);
}
