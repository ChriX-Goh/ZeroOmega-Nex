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

const virtualSwitchFixed = {
  name: 'Runtime Virtual Switch Fixed',
  profileType: 'FixedProfile',
  color: '#64b5f6',
  bypassList: [],
  fallbackProxy: {
    scheme: 'http',
    host: '127.0.0.1',
    port: 18190,
  },
};

const virtualSwitchInner = {
  name: 'Runtime Virtual Switch Inner',
  profileType: 'SwitchProfile',
  color: '#81c784',
  rules: [
    {
      condition: {
        conditionType: 'HostWildcardCondition',
        pattern: 'virtual-switch-fixed.test',
      },
      profileName: virtualSwitchFixed.name,
    },
    {
      condition: {
        conditionType: 'HostWildcardCondition',
        pattern: 'virtual-switch-direct.test',
      },
      profileName: 'direct',
    },
  ],
  defaultProfileName: 'direct',
};

const virtualSwitchOuter = {
  name: 'Runtime Virtual Switch Outer Alias',
  profileType: 'VirtualProfile',
  defaultProfileName: virtualSwitchInner.name,
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

const externalControlFixed = {
  name: 'Runtime External Control Fixed',
  profileType: 'FixedProfile',
  color: '#4fc3f7',
  bypassList: [],
  fallbackProxy: {
    scheme: 'http',
    host: '127.0.0.1',
    port: 18188,
  },
};

const rendererFallbackFixed = {
  name: 'Runtime Renderer Fallback Fixed',
  profileType: 'FixedProfile',
  color: '#ab47bc',
  bypassList: [],
  fallbackProxy: {
    scheme: 'http',
    host: '127.0.0.1',
    port: 18189,
  },
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
  'virtual-switch': Object.freeze({
    id: 'virtual-switch',
    description:
      'An applied Virtual profile targets one Switch whose matched rules resolve to Fixed or Direct and whose default resolves to Direct.',
    profiles: Object.freeze([virtualSwitchFixed, virtualSwitchInner, virtualSwitchOuter]),
    captures: Object.freeze([
      Object.freeze({
        label: 'virtual-switch-match-fixed',
        profileName: virtualSwitchOuter.name,
        url: 'http://virtual-switch-fixed.test/path',
      }),
      Object.freeze({
        label: 'virtual-switch-match-direct',
        profileName: virtualSwitchOuter.name,
        url: 'http://virtual-switch-direct.test/path',
      }),
      Object.freeze({
        label: 'virtual-switch-default-direct',
        profileName: virtualSwitchOuter.name,
        url: 'http://virtual-switch-default.test/path',
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
  'external-control': Object.freeze({
    id: 'external-control',
    description:
      'A second extension takes proxy ownership from an applied Fixed profile, releases it, and the original profile is explicitly re-applied.',
    externalControl: true,
    profiles: Object.freeze([externalControlFixed]),
    captures: Object.freeze([
      Object.freeze({
        label: 'external-control-baseline-fixed',
        profileName: externalControlFixed.name,
        url: 'http://external-control.test/path',
        expectedOriginalControlLevel: 'controlled_by_this_extension',
      }),
      Object.freeze({
        label: 'external-control-taken-over',
        profileName: externalControlFixed.name,
        url: 'http://external-control.test/path',
        applyProfile: false,
        waitForCurrentProfile: false,
        externalCommand: 'claim',
        expectedOriginalControlLevel: 'controlled_by_other_extensions',
      }),
      Object.freeze({
        label: 'external-control-released',
        profileName: externalControlFixed.name,
        url: 'http://external-control.test/path',
        applyProfile: false,
        waitForCurrentProfile: false,
        externalCommand: 'release',
        expectedOriginalControlLevel: 'controlled_by_this_extension',
      }),
      Object.freeze({
        label: 'external-control-explicit-reapply',
        profileName: externalControlFixed.name,
        url: 'http://external-control.test/path',
        expectedOriginalControlLevel: 'controlled_by_this_extension',
      }),
    ]),
  }),
  'renderer-fallback': Object.freeze({
    id: 'renderer-fallback',
    description:
      'The original dynamic icon renderer is forced to return privacy-blocked pixels twice and then restored for the same Fixed profile color.',
    rendererFallback: true,
    profiles: Object.freeze([rendererFallbackFixed]),
    captures: Object.freeze([
      Object.freeze({
        label: 'renderer-fallback-first-failure',
        profileName: rendererFallbackFixed.name,
        url: 'http://renderer-fallback.test/path',
        rendererCommand: 'force-opaque',
        includeIcon: true,
      }),
      Object.freeze({
        label: 'renderer-fallback-second-failure',
        profileName: rendererFallbackFixed.name,
        url: 'http://renderer-fallback.test/path',
        applyProfile: false,
        waitForCurrentProfile: false,
        rendererCommand: 'keep-opaque',
        includeIcon: true,
      }),
      Object.freeze({
        label: 'renderer-fallback-restored-success',
        profileName: rendererFallbackFixed.name,
        url: 'http://renderer-fallback.test/path',
        applyProfile: false,
        waitForCurrentProfile: false,
        rendererCommand: 'restore',
        includeIcon: true,
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
