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
