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

export const PAC_SCENARIO = Object.freeze({
  id: 'pac',
  profileId: 'profile-runtime-pac-e2e',
  hosts: Object.freeze(['pac-proxy.test', 'pac-direct.test']),
});

export const RUNTIME_PAC_SCRIPT = `function FindProxyForURL(url, host) {
  if (host === 'pac-proxy.test') return 'PROXY 127.0.0.1:18186';
  return 'DIRECT';
}
`;

export const PROFILE_TRACE_HOSTS = Object.freeze([
  ...NESTED_SWITCH_SCENARIO.hosts,
  ...NESTED_VIRTUAL_SCENARIO.hosts,
  ...PAC_SCENARIO.hosts,
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
