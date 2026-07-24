export const LARGE_FIXTURE_PATH = 'fixtures/zeroomega-v2/large-representative.json';
export const FIXED_PROFILE_COUNT = 24;
export const SWITCH_PROFILE_COUNT = 8;
export const RULES_PER_SWITCH = 128;
export const RULE_LIST_PROFILE_COUNT = 4;
export const RULE_LIST_LINES = 256;

function pad(value) {
  return String(value).padStart(2, '0');
}

function fixedProfile(index) {
  const schemes = ['http', 'https', 'socks4', 'socks5'];
  return {
    name: `proxy-${pad(index)}`,
    profileType: 'FixedProfile',
    color: `#${((index + 1) * 0x2f4a6d).toString(16).slice(-6).padStart(6, '0')}`,
    fallbackProxy: {
      scheme: schemes[index % schemes.length],
      host: `proxy-${pad(index)}.example.invalid`,
      port: 10000 + index,
    },
    bypassList: [
      { conditionType: 'BypassCondition', pattern: '<local>' },
      {
        conditionType: 'BypassCondition',
        pattern: `.internal-${pad(index)}.example.invalid`,
      },
      {
        conditionType: 'BypassCondition',
        pattern: `192.0.2.${index}`,
      },
    ],
  };
}

function switchCondition(switchIndex, ruleIndex) {
  switch (ruleIndex % 16) {
    case 0:
      return {
        conditionType: 'IpCondition',
        ip: `198.51.100.${ruleIndex}`,
        prefixLength: 32,
      };
    case 1:
      return {
        conditionType: 'IpCondition',
        ip: `2001:db8:${switchIndex.toString(16)}::`,
        prefixLength: 48,
      };
    case 2:
      return {
        conditionType: 'UrlWildcardCondition',
        pattern: `https://service-${pad(switchIndex)}.example.invalid/api/${ruleIndex}/*`,
      };
    case 3:
      return {
        conditionType: 'HostRegexCondition',
        pattern: `^regex-${pad(switchIndex)}-${ruleIndex}\\.example\\.invalid$`,
      };
    default:
      return {
        conditionType: 'HostWildcardCondition',
        pattern: `host-${pad(switchIndex)}-${String(ruleIndex).padStart(3, '0')}.example.invalid`,
      };
  }
}

function switchProfile(index) {
  const rules = [];
  for (let ruleIndex = 0; ruleIndex < RULES_PER_SWITCH; ruleIndex += 1) {
    rules.push({
      condition: switchCondition(index, ruleIndex),
      profileName: `proxy-${pad(ruleIndex % FIXED_PROFILE_COUNT)}`,
      note: `Generated compatibility rule ${index}:${ruleIndex}`,
    });
  }

  return {
    name: `switch-${pad(index)}`,
    profileType: 'SwitchProfile',
    color: `#${((index + 31) * 0x17405b).toString(16).slice(-6).padStart(6, '0')}`,
    rules,
    defaultProfileName: 'direct',
  };
}

function autoProxyRuleList(index) {
  const lines = ['[AutoProxy 0.2.9]', `! deterministic fixture ${index}`];
  for (let lineIndex = 0; lineIndex < RULE_LIST_LINES; lineIndex += 1) {
    const prefix = lineIndex % 19 === 0 ? '@@||' : '||';
    lines.push(`${prefix}list-${pad(index)}-${String(lineIndex).padStart(3, '0')}.example.invalid`);
  }
  return lines.join('\n');
}

function switchyRuleList(index) {
  const lines = ['[SwitchyOmega Conditions]', `; deterministic fixture ${index}`];
  for (let lineIndex = 0; lineIndex < RULE_LIST_LINES; lineIndex += 1) {
    const host = `*.list-${pad(index)}-${String(lineIndex).padStart(3, '0')}.example.invalid`;
    lines.push(`HostWildcardCondition: ${host}`);
  }
  return lines.join('\n');
}

function ruleListProfile(index) {
  const format = index % 2 === 0 ? 'AutoProxy' : 'Switchy';
  return {
    name: `rules-${pad(index)}`,
    profileType: 'RuleListProfile',
    color: `#${((index + 51) * 0x0d3157).toString(16).slice(-6).padStart(6, '0')}`,
    format,
    sourceUrl: `https://rules-${pad(index)}.example.invalid/list.txt`,
    ruleList: format === 'AutoProxy' ? autoProxyRuleList(index) : switchyRuleList(index),
    matchProfileName: `proxy-${pad(index)}`,
    defaultProfileName: 'direct',
    headers: [{ name: 'X-Fixture-Bucket', value: `bucket-${pad(index)}` }],
  };
}

export function buildLargeLegacyFixture() {
  const fixture = { schemaVersion: 2 };

  for (let index = 0; index < FIXED_PROFILE_COUNT; index += 1) {
    const profile = fixedProfile(index);
    fixture[`+${profile.name}`] = profile;
  }
  for (let index = 0; index < SWITCH_PROFILE_COUNT; index += 1) {
    const profile = switchProfile(index);
    fixture[`+${profile.name}`] = profile;
  }
  for (let index = 0; index < RULE_LIST_PROFILE_COUNT; index += 1) {
    const profile = ruleListProfile(index);
    fixture[`+${profile.name}`] = profile;
  }

  fixture['-startupProfileName'] = 'switch-00';
  fixture['-quickSwitchProfiles'] = [
    'switch-00',
    'switch-01',
    'rules-00',
    'rules-01',
    'proxy-00',
    'proxy-01',
    'direct',
  ];
  fixture['-enableQuickSwitch'] = true;
  fixture['-downloadInterval'] = 1440;

  return fixture;
}

export function serializeLargeLegacyFixture() {
  return `${JSON.stringify(buildLargeLegacyFixture(), null, 2)}\n`;
}
