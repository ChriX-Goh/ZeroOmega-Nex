export const ORIGINAL_TOOLBAR_EVIDENCE_SCHEMA_VERSION = 1;

const nestedFixed = {
  name: 'Runtime Nested Fixed',
  profileType: 'FixedProfile',
  color: '#64b5f6',
  bypassList: [],
  fallbackProxy: {
    scheme: 'http',
    host: '127.0.0.1',
    port: 18184,
  },
};

const nestedInner = {
  name: 'Runtime Nested Inner Switch',
  profileType: 'SwitchProfile',
  color: '#81c784',
  rules: [
    {
      condition: {
        conditionType: 'HostWildcardCondition',
        pattern: 'nested-fixed.test',
      },
      profileName: nestedFixed.name,
    },
  ],
  defaultProfileName: 'direct',
};

const nestedOuter = {
  name: 'Runtime Nested Outer Switch',
  profileType: 'SwitchProfile',
  color: '#ffb74d',
  rules: [
    {
      condition: {
        conditionType: 'HostWildcardCondition',
        pattern: 'nested-fixed.test',
      },
      profileName: nestedInner.name,
    },
    {
      condition: {
        conditionType: 'HostWildcardCondition',
        pattern: 'nested-direct.test',
      },
      profileName: nestedInner.name,
    },
  ],
  defaultProfileName: 'direct',
};

const nestedVirtualFixed = {
  name: 'Runtime Nested Virtual Fixed',
  profileType: 'FixedProfile',
  color: '#64b5f6',
  bypassList: [
    {
      conditionType: 'BypassCondition',
      pattern: 'localhost',
    },
  ],
  fallbackProxy: {
    scheme: 'http',
    host: '127.0.0.1',
    port: 18185,
  },
};

const nestedVirtualInnerFixed = {
  name: 'Runtime Nested Virtual Inner Fixed Alias',
  profileType: 'VirtualProfile',
  defaultProfileName: nestedVirtualFixed.name,
  rules: [],
  color: '#81c784',
};

const nestedVirtualOuterFixed = {
  name: 'Runtime Nested Virtual Outer Fixed Alias',
  profileType: 'VirtualProfile',
  defaultProfileName: nestedVirtualInnerFixed.name,
  rules: [],
  color: '#ffb74d',
};

const nestedVirtualInnerDirect = {
  name: 'Runtime Nested Virtual Inner Direct Alias',
  profileType: 'VirtualProfile',
  defaultProfileName: 'direct',
  rules: [],
  color: '#9575cd',
};

const nestedVirtualOuterDirect = {
  name: 'Runtime Nested Virtual Outer Direct Alias',
  profileType: 'VirtualProfile',
  defaultProfileName: nestedVirtualInnerDirect.name,
  rules: [],
  color: '#ff8a65',
};

const runtimePacScript = `function FindProxyForURL(url, host) {
  if (host === 'pac-proxy.test') return 'PROXY 127.0.0.1:18186';
  return 'DIRECT';
}
`;

const runtimePac = {
  name: 'Runtime PAC',
  profileType: 'PacProfile',
  color: '#4db6ac',
  pacUrl: `data:application/x-ns-proxy-autoconfig;charset=utf-8,${encodeURIComponent(runtimePacScript)}`,
  pacScript: runtimePacScript,
};

const temporaryRuleFixed = {
  name: 'Runtime Temporary Fixed',
  profileType: 'FixedProfile',
  color: '#64b5f6',
  bypassList: [],
  fallbackProxy: {
    scheme: 'http',
    host: '127.0.0.1',
    port: 18187,
  },
};

const temporaryRuleBase = {
  name: 'Runtime Temporary Base',
  profileType: 'SwitchProfile',
  color: '#ffb74d',
  rules: [],
  defaultProfileName: 'direct',
};

export const ORIGINAL_TOOLBAR_EVIDENCE_SCENARIOS = Object.freeze({
  'nested-switch': Object.freeze({
    id: 'nested-switch',
    description:
      'Outer Switch resolves through an inner Switch into Fixed or Direct, plus an outer default Direct case.',
    profiles: Object.freeze([nestedFixed, nestedInner, nestedOuter]),
    captures: Object.freeze([
      Object.freeze({
        label: 'outer-match-inner-match-fixed',
        profileName: nestedOuter.name,
        url: 'http://nested-fixed.test/path',
      }),
      Object.freeze({
        label: 'outer-match-inner-default-direct',
        profileName: nestedOuter.name,
        url: 'http://nested-direct.test/path',
      }),
      Object.freeze({
        label: 'outer-default-direct',
        profileName: nestedOuter.name,
        url: 'http://outer-default.test/path',
      }),
    ]),
  }),
  'nested-virtual': Object.freeze({
    id: 'nested-virtual',
    description:
      'Outer Virtual resolves through an inner Virtual into Direct or Fixed, including a Fixed bypass case.',
    profiles: Object.freeze([
      nestedVirtualFixed,
      nestedVirtualInnerFixed,
      nestedVirtualOuterFixed,
      nestedVirtualInnerDirect,
      nestedVirtualOuterDirect,
    ]),
    captures: Object.freeze([
      Object.freeze({
        label: 'outer-virtual-inner-virtual-direct',
        profileName: nestedVirtualOuterDirect.name,
        url: 'http://nested-virtual-direct.test/path',
      }),
      Object.freeze({
        label: 'outer-virtual-inner-virtual-fixed-proxy',
        profileName: nestedVirtualOuterFixed.name,
        url: 'http://nested-virtual-fixed.test/path',
      }),
      Object.freeze({
        label: 'outer-virtual-inner-virtual-fixed-bypass',
        profileName: nestedVirtualOuterFixed.name,
        url: 'http://localhost/path',
      }),
    ]),
  }),
  'temporary-rule': Object.freeze({
    id: 'temporary-rule',
    description:
      'A temporary host rule overrides a base Switch profile, leaves unmatched hosts on the base default, and restores the base behavior after removal.',
    profiles: Object.freeze([temporaryRuleFixed, temporaryRuleBase]),
    captures: Object.freeze([
      Object.freeze({
        label: 'temporary-rule-match-fixed',
        profileName: temporaryRuleBase.name,
        url: 'http://temp-rule.test/path',
        commands: Object.freeze([
          Object.freeze({
            method: 'addTempRule',
            args: Object.freeze(['temp-rule.test', temporaryRuleFixed.name, 1]),
          }),
        ]),
      }),
      Object.freeze({
        label: 'temporary-rule-default-direct',
        profileName: temporaryRuleBase.name,
        url: 'http://temp-rule-default.test/path',
      }),
      Object.freeze({
        label: 'temporary-rule-removed-base-direct',
        profileName: temporaryRuleBase.name,
        url: 'http://temp-rule.test/path',
        commands: Object.freeze([
          Object.freeze({
            method: 'addTempRule',
            args: Object.freeze(['temp-rule.test', temporaryRuleFixed.name, -1]),
          }),
        ]),
      }),
    ]),
  }),
  pac: Object.freeze({
    id: 'pac',
    description:
      'Applied PAC profile returns an explicit HTTP proxy for one host and DIRECT for another host.',
    profiles: Object.freeze([runtimePac]),
    captures: Object.freeze([
      Object.freeze({
        label: 'pac-proxy',
        profileName: runtimePac.name,
        url: 'http://pac-proxy.test/path',
      }),
      Object.freeze({
        label: 'pac-direct',
        profileName: runtimePac.name,
        url: 'http://pac-direct.test/path',
      }),
    ]),
  }),
});

export function selectOriginalToolbarEvidenceScenarios(selection) {
  const requested = selection
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const ids = requested.includes('all')
    ? Object.keys(ORIGINAL_TOOLBAR_EVIDENCE_SCENARIOS)
    : requested;

  if (ids.length === 0) {
    throw new Error('At least one original Toolbar evidence scenario must be selected.');
  }

  const uniqueIds = [...new Set(ids)];
  return uniqueIds.map((id) => {
    const scenario = ORIGINAL_TOOLBAR_EVIDENCE_SCENARIOS[id];
    if (!scenario) {
      throw new Error(
        `Unknown original Toolbar evidence scenario "${id}". Available: ${Object.keys(
          ORIGINAL_TOOLBAR_EVIDENCE_SCENARIOS,
        ).join(', ')}`,
      );
    }
    return scenario;
  });
}
