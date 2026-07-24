import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureDir = path.join(rootDir, 'fixtures', 'zeroomega-v2');

const knownProfileTypes = new Set([
  'SystemProfile',
  'DirectProfile',
  'FixedProfile',
  'PacProfile',
  'AutoDetectProfile',
  'SwitchProfile',
  'VirtualProfile',
  'RuleListProfile',
  'SwitchyRuleListProfile',
  'AutoProxyRuleListProfile',
]);

const knownConditionTypes = new Set([
  'TrueCondition',
  'FalseCondition',
  'UrlRegexCondition',
  'UrlWildcardCondition',
  'HostRegexCondition',
  'HostWildcardCondition',
  'BypassCondition',
  'KeywordCondition',
  'IpCondition',
  'HostLevelsCondition',
  'WeekdayCondition',
  'TimeCondition',
]);

const authSlots = new Set([
  'proxyForHttp',
  'proxyForHttps',
  'proxyForFtp',
  'fallbackProxy',
  'all',
]);
const sensitiveHeaderName = /(authorization|cookie|token|api[-_]?key|secret)/i;
const ruleProfileTypes = new Set(['SwitchProfile', 'VirtualProfile']);
const ruleListProfileTypes = new Set([
  'RuleListProfile',
  'SwitchyRuleListProfile',
  'AutoProxyRuleListProfile',
]);

function fail(file, message) {
  throw new Error(`${path.basename(file)}: ${message}`);
}

function assertReference(file, names, value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    fail(file, `${field} must be a non-empty string`);
  }
  if (!names.has(value)) {
    fail(file, `${field} references missing profile ${JSON.stringify(value)}`);
  }
}

function validateCondition(file, condition, location) {
  if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
    fail(file, `${location} must be an object`);
  }

  const type = condition.conditionType;
  if (!knownConditionTypes.has(type)) {
    fail(file, `${location} has unknown conditionType ${JSON.stringify(type)}`);
  }

  if (type === 'IpCondition') {
    if (typeof condition.ip !== 'string' || condition.ip.length === 0) {
      fail(file, `${location}.ip must be a non-empty string`);
    }
    if (!Number.isInteger(condition.prefixLength)) {
      fail(file, `${location}.prefixLength must be an integer`);
    }
    return;
  }

  if (type === 'HostLevelsCondition') {
    if (!Number.isInteger(condition.minValue) || !Number.isInteger(condition.maxValue)) {
      fail(file, `${location} requires integer minValue and maxValue`);
    }
    return;
  }

  if (type === 'WeekdayCondition') {
    const hasDays = typeof condition.days === 'string' && condition.days.length === 7;
    const hasRange = Number.isInteger(condition.startDay) && Number.isInteger(condition.endDay);
    if (!hasDays && !hasRange) {
      fail(file, `${location} requires days or startDay/endDay`);
    }
    return;
  }

  if (type === 'TimeCondition') {
    if (!Number.isInteger(condition.startHour) || !Number.isInteger(condition.endHour)) {
      fail(file, `${location} requires integer startHour and endHour`);
    }
    return;
  }

  if (type === 'TrueCondition') {
    return;
  }

  if (typeof condition.pattern !== 'string') {
    fail(file, `${location}.pattern must be a string`);
  }
}

function validateAuth(file, auth, location) {
  if (!auth || typeof auth !== 'object' || Array.isArray(auth)) {
    fail(file, `${location} must be an object`);
  }

  for (const [slot, credentials] of Object.entries(auth)) {
    if (!authSlots.has(slot)) {
      fail(file, `${location} has unknown credential slot ${JSON.stringify(slot)}`);
    }
    if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
      fail(file, `${location}.${slot} must be an object`);
    }
    if (credentials.username !== '<redacted>' || credentials.password !== '<redacted>') {
      fail(file, `${location}.${slot} must use redacted fixture credentials`);
    }
  }
}

function validateHeaders(file, headers, location) {
  if (!Array.isArray(headers)) {
    fail(file, `${location} must be an array`);
  }

  headers.forEach((header, index) => {
    const itemLocation = `${location}[${index}]`;
    if (!header || typeof header !== 'object' || Array.isArray(header)) {
      fail(file, `${itemLocation} must be an object`);
    }
    if (typeof header.name !== 'string' || typeof header.value !== 'string') {
      fail(file, `${itemLocation} requires string name and value`);
    }
    if (sensitiveHeaderName.test(header.name) && header.value !== '<redacted>') {
      fail(file, `${itemLocation} must redact sensitive header values`);
    }
  });
}

function validateProfile(file, key, profile, names) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    fail(file, `${key} must contain a profile object`);
  }

  if (key !== `+${profile.name}`) {
    fail(file, `${key} does not match profile name ${JSON.stringify(profile.name)}`);
  }

  if (!knownProfileTypes.has(profile.profileType)) {
    fail(file, `${key} has unknown profileType ${JSON.stringify(profile.profileType)}`);
  }

  if (profile.auth !== undefined) {
    validateAuth(file, profile.auth, `${key}.auth`);
  }

  if (profile.headers !== undefined) {
    validateHeaders(file, profile.headers, `${key}.headers`);
  }

  if (profile.bypassList !== undefined) {
    if (!Array.isArray(profile.bypassList)) {
      fail(file, `${key}.bypassList must be an array`);
    }
    profile.bypassList.forEach((condition, index) => {
      validateCondition(file, condition, `${key}.bypassList[${index}]`);
    });
  }

  if (ruleProfileTypes.has(profile.profileType)) {
    assertReference(file, names, profile.defaultProfileName, `${key}.defaultProfileName`);
    if (!Array.isArray(profile.rules)) {
      fail(file, `${key}.rules must be an array`);
    }
    profile.rules.forEach((rule, index) => {
      if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
        fail(file, `${key}.rules[${index}] must be an object`);
      }
      validateCondition(file, rule.condition, `${key}.rules[${index}].condition`);
      assertReference(file, names, rule.profileName, `${key}.rules[${index}].profileName`);
    });
  }

  if (ruleListProfileTypes.has(profile.profileType)) {
    assertReference(file, names, profile.matchProfileName, `${key}.matchProfileName`);
    assertReference(file, names, profile.defaultProfileName, `${key}.defaultProfileName`);
    if (profile.format !== undefined && !['Switchy', 'AutoProxy'].includes(profile.format)) {
      fail(file, `${key}.format must be Switchy or AutoProxy`);
    }
    if (typeof profile.ruleList !== 'string') {
      fail(file, `${key}.ruleList must be a string`);
    }
  }
}

async function validateFile(file) {
  const source = await readFile(file, 'utf8');
  const data = JSON.parse(source);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    fail(file, 'root must be an object');
  }
  if (data.schemaVersion !== 2) {
    fail(file, 'schemaVersion must equal 2');
  }

  const profileEntries = Object.entries(data).filter(([key]) => key.startsWith('+'));
  if (profileEntries.length === 0) {
    fail(file, 'must contain at least one profile');
  }

  const names = new Set(['direct', 'system']);
  for (const [key, profile] of profileEntries) {
    if (typeof profile?.name !== 'string' || profile.name.length === 0) {
      fail(file, `${key}.name must be a non-empty string`);
    }
    if (names.has(profile.name)) {
      fail(file, `duplicate or reserved profile name ${JSON.stringify(profile.name)}`);
    }
    names.add(profile.name);
  }

  for (const [key, profile] of profileEntries) {
    validateProfile(file, key, profile, names);
  }

  if (data['-startupProfileName']) {
    assertReference(file, names, data['-startupProfileName'], '-startupProfileName');
  }

  if (data['-quickSwitchProfiles'] !== undefined) {
    if (!Array.isArray(data['-quickSwitchProfiles'])) {
      fail(file, '-quickSwitchProfiles must be an array');
    }
    data['-quickSwitchProfiles'].forEach((name, index) => {
      assertReference(file, names, name, `-quickSwitchProfiles[${index}]`);
    });
  }

  return profileEntries.length;
}

const files = (await readdir(fixtureDir))
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => path.join(fixtureDir, name));

if (files.length === 0) {
  throw new Error('No ZeroOmega schema-v2 JSON fixtures were found');
}

let profileCount = 0;
for (const file of files) {
  profileCount += await validateFile(file);
}

console.log(`Validated ${files.length} legacy fixture files containing ${profileCount} profiles.`);
