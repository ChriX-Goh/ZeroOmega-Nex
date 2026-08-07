import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REDACTED = '<redacted>';
const SENSITIVE_HEADER = /(authorization|cookie|token|api[-_]?key|secret)/iu;
const SECRET_KEY = /(password|passwd|token|secret|api[-_]?key|authorization|cookie)/iu;
const NETWORK_KEY = /(host|hostname|url|uri|endpoint|server)/iu;
const REFERENCE_KEYS = new Set(['defaultProfileName', 'matchProfileName', 'profileName']);
const EXACT_STRING_KEYS = new Set(['profileType', 'conditionType', 'scheme', 'format', 'color']);

function fail(message) {
  throw new Error(message);
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseBackup(source, label = 'backup') {
  let data;
  try {
    data = JSON.parse(source);
  } catch {
    fail(`${label}: invalid JSON`);
  }
  if (!object(data)) fail(`${label}: root must be an object`);
  if (data.schemaVersion !== 2) fail(`${label}: schemaVersion must equal 2`);
  if (!Object.keys(data).some((key) => key.startsWith('+'))) {
    fail(`${label}: at least one profile is required`);
  }
  return data;
}

function profiles(data) {
  return Object.entries(data).filter(([key]) => key.startsWith('+'));
}

function profileIndex(data) {
  const index = new Map([
    ['direct', 'builtin:direct'],
    ['system', 'builtin:system'],
  ]);
  profiles(data).forEach(([key, profile], ordinal) => {
    if (!object(profile) || typeof profile.name !== 'string' || !profile.name) {
      fail(`profile ${ordinal + 1}: missing name`);
    }
    if (key !== `+${profile.name}`) fail(`profile ${ordinal + 1}: key/name mismatch`);
    if (index.has(profile.name)) fail(`profile ${ordinal + 1}: duplicate or reserved name`);
    index.set(profile.name, `profile:${ordinal}`);
  });
  return index;
}

function ref(value, index) {
  return typeof value === 'string'
    ? (index.get(value) ?? '<missing-reference>')
    : '<invalid-reference>';
}

function patternShape(value) {
  if (typeof value !== 'string') return '<non-string>';
  return value
    .replace(/[A-Za-z0-9\u0080-\uFFFF]+/gu, 'x')
    .replace(/x+/gu, 'x')
    .slice(0, 512);
}

function ruleListShape(value) {
  if (typeof value !== 'string') return '<non-string>';
  return value.split(/\r?\n/u).map((line) => {
    const item = line.trim();
    let kind = 'rule';
    if (!item) kind = 'blank';
    else if (item.startsWith('!')) kind = 'comment';
    else if (item.startsWith('[')) kind = 'header';
    else if (item.startsWith('@@')) kind = 'exception';
    else if (item.startsWith('/') && item.endsWith('/')) kind = 'regex';
    return { kind, syntax: patternShape(item) };
  });
}

function pacShape(value) {
  if (typeof value !== 'string') return '<non-string>';
  const lines = value.split(/\r?\n/u);
  return {
    lines: lines.map((line) => patternShape(line)),
    findProxyForUrl: /\bFindProxyForURL\b/u.test(value),
    direct: (value.match(/\bDIRECT\b/gu) ?? []).length,
    proxy: (value.match(/\b(?:PROXY|HTTPS|SOCKS5?|SOCKS)\b/gu) ?? []).length,
  };
}

function shapeValue(value, key, index, parent) {
  if (Array.isArray(value)) return value.map((item) => shapeValue(item, key, index, parent));
  if (object(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((child) => [child, shapeValue(value[child], child, index, value)]),
    );
  }
  if (typeof value !== 'string') return value;
  if (key === 'name' && typeof parent?.profileType === 'string') return ref(value, index);
  if (REFERENCE_KEYS.has(key)) return ref(value, index);
  if (key === 'name' && typeof parent?.value === 'string') return value;
  if (EXACT_STRING_KEYS.has(key)) return value;
  if (key === 'pattern') return { pattern: patternShape(value) };
  if (key === 'ruleList') return { ruleList: ruleListShape(value) };
  if (key === 'pacScript') return { pac: pacShape(value) };
  if (NETWORK_KEY.test(key)) return '<network-value>';
  if (SECRET_KEY.test(key)) return '<secret-value>';
  return { string: true, empty: value.length === 0, lines: value.split(/\r?\n/u).length };
}

export function buildStructuralShape(data) {
  const index = profileIndex(data);
  const topLevel = {};
  for (const key of Object.keys(data)
    .filter((item) => !item.startsWith('+'))
    .sort()) {
    if (key === '-startupProfileName') topLevel[key] = ref(data[key], index);
    else if (key === '-quickSwitchProfiles') {
      topLevel[key] = Array.isArray(data[key])
        ? data[key].map((item) => ref(item, index))
        : '<invalid-quick-switch>';
    } else topLevel[key] = shapeValue(data[key], key, index, data);
  }
  return {
    topLevel,
    profiles: profiles(data).map(([key, profile], ordinal) => ({
      ordinal,
      keyMatchesName: object(profile) && key === `+${profile.name}`,
      value: shapeValue(profile, '<profile>', index, profile),
    })),
  };
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function metricsFor(data) {
  const metrics = {
    profileCount: 0,
    profileTypes: {},
    conditionTypes: {},
    coloredProfiles: 0,
    switchRuleCount: 0,
    ruleListProfiles: 0,
    ruleListLines: 0,
    pacProfiles: 0,
    pacScriptLines: 0,
    credentialSlots: 0,
    headerCount: 0,
    sensitiveHeaderCount: 0,
    startupPresent: typeof data['-startupProfileName'] === 'string',
    quickSwitchEnabled: data['-enableQuickSwitch'] === true,
    quickSwitchRoutes: Array.isArray(data['-quickSwitchProfiles'])
      ? data['-quickSwitchProfiles'].length
      : 0,
  };
  const walk = (value, key = '') => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item, key);
      return;
    }
    if (!object(value)) return;
    if (typeof value.profileType === 'string') {
      metrics.profileCount += 1;
      metrics.profileTypes[value.profileType] = (metrics.profileTypes[value.profileType] ?? 0) + 1;
      if (typeof value.color === 'string') metrics.coloredProfiles += 1;
      if (/RuleListProfile$/u.test(value.profileType)) {
        metrics.ruleListProfiles += 1;
        if (typeof value.ruleList === 'string')
          metrics.ruleListLines += value.ruleList.split(/\r?\n/u).length;
      }
      if (value.profileType === 'PacProfile') {
        metrics.pacProfiles += 1;
        if (typeof value.pacScript === 'string')
          metrics.pacScriptLines += value.pacScript.split(/\r?\n/u).length;
      }
      if (
        /^(SwitchProfile|VirtualProfile)$/u.test(value.profileType) &&
        Array.isArray(value.rules)
      ) {
        metrics.switchRuleCount += value.rules.length;
      }
    }
    if (typeof value.conditionType === 'string') {
      metrics.conditionTypes[value.conditionType] =
        (metrics.conditionTypes[value.conditionType] ?? 0) + 1;
    }
    if (key === 'auth') metrics.credentialSlots += Object.keys(value).length;
    for (const [child, item] of Object.entries(value)) {
      if (child === 'headers' && Array.isArray(item)) {
        metrics.headerCount += item.length;
        metrics.sensitiveHeaderCount += item.filter(
          (header) =>
            object(header) && typeof header.name === 'string' && SENSITIVE_HEADER.test(header.name),
        ).length;
      }
      walk(item, child);
    }
  };
  walk(data);
  return metrics;
}

export function isInsideRepository(file) {
  const rel = relative(rootDir, resolve(file));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function safeIpv4(host) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(host);
  if (!match) return false;
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => part > 255)) return false;
  return (
    parts[0] === 127 ||
    (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) ||
    (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) ||
    (parts[0] === 203 && parts[1] === 0 && parts[2] === 113)
  );
}

function safeHost(host) {
  const value = host.toLowerCase().replace(/^\[|\]$/gu, '');
  if (
    value === 'localhost' ||
    value === '::1' ||
    value === '2001:db8::' ||
    value.startsWith('2001:db8:')
  )
    return true;
  if (safeIpv4(value)) return true;
  return (
    ['example.com', 'example.net', 'example.org'].includes(value) ||
    /\.(?:example\.com|example\.net|example\.org|invalid|test|localhost)$/u.test(value)
  );
}

function networkTokens(source) {
  const value = source.replace(/\\\./gu, '.');
  const tokens = new Set();
  for (const match of value.matchAll(/\bhttps?:\/\/([^/\s"'<>]+)/giu)) {
    const authority = match[1].replace(/^.*@/u, '');
    const host = authority.startsWith('[')
      ? authority.slice(1, authority.indexOf(']'))
      : authority.split(':')[0];
    if (host) tokens.add(host);
  }
  for (const match of value.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/gu)) tokens.add(match[0]);
  for (const match of value.matchAll(
    /(?:^|[^A-Fa-f0-9:])((?:[A-Fa-f0-9]{0,4}:){2,}[A-Fa-f0-9]{0,4})(?=$|[^A-Fa-f0-9:])/gu,
  )) {
    if (match[1]) tokens.add(match[1]);
  }
  for (const match of value.matchAll(
    /(?:\*\.)?(?:[A-Za-z0-9-]+\.)+(?:[A-Za-z]{2,63}|invalid|test|localhost)\b/gu,
  )) {
    tokens.add(match[0].replace(/^\*\./u, ''));
  }
  for (const match of value.matchAll(/\b(?:PROXY|HTTPS|SOCKS5?|SOCKS)\s+([^\s;:'"]+)/giu))
    tokens.add(match[1]);
  for (const match of value.matchAll(/\|\|([A-Za-z0-9.-]+)/gu)) tokens.add(match[1]);
  for (const match of value.matchAll(/\bdnsDomainIs\([^,]+,\s*["']([^"']+)["']/giu))
    tokens.add(match[1].replace(/^\./u, ''));
  return [...tokens];
}

export function assertSanitizedSafety(data) {
  const problems = new Set();
  const walk = (value, key = '', parent = undefined) => {
    if (Array.isArray(value)) {
      if (key === 'headers') {
        for (const header of value) {
          if (
            !object(header) ||
            typeof header.name !== 'string' ||
            typeof header.value !== 'string'
          )
            problems.add('invalid header shape');
          else if (SENSITIVE_HEADER.test(header.name) && header.value !== REDACTED)
            problems.add('unredacted sensitive header');
        }
      }
      for (const item of value) walk(item, key, parent);
      return;
    }
    if (object(value)) {
      if (key === 'auth') {
        for (const credentials of Object.values(value)) {
          if (!object(credentials)) problems.add('invalid auth shape');
          else
            for (const field of ['username', 'password']) {
              if (field in credentials && credentials[field] !== REDACTED)
                problems.add('unredacted proxy credential');
            }
        }
      }
      for (const [child, item] of Object.entries(value)) walk(item, child, value);
      return;
    }
    if (typeof value !== 'string') return;
    if (SECRET_KEY.test(key) && value !== '' && value !== REDACTED)
      problems.add('unredacted secret-like field');
    if (key === 'pattern' || key === 'ruleList' || key === 'pacScript' || NETWORK_KEY.test(key)) {
      for (const token of networkTokens(value))
        if (!safeHost(token)) problems.add('non-reserved network identifier');
    }
    if (
      key === 'pattern' &&
      /^(HostWildcardCondition|BypassCondition)$/u.test(parent?.conditionType ?? '') &&
      /^(?:\*\.)?[A-Za-z0-9-]+$/u.test(value) &&
      !safeHost(value.replace(/^\*\./u, ''))
    )
      problems.add('non-reserved network identifier');
    if (NETWORK_KEY.test(key)) {
      let host = value;
      try {
        if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(value)) {
          const parsed = new URL(value);
          host = parsed.hostname;
          if (parsed.username || parsed.password) problems.add('unredacted URL credentials');
          if (parsed.search || parsed.hash) problems.add('unredacted URL query or fragment');
          if (
            parsed.pathname !== '/' &&
            !/^\/(?:redacted)(?:\/redacted)*\/?$/u.test(parsed.pathname)
          ) {
            problems.add('unredacted URL path');
          }
        }
      } catch {
        problems.add('invalid network URL');
        return;
      }
      if (host && !safeHost(host)) problems.add('usable network endpoint');
    }
  };
  walk(data);
  if (problems.size) fail(`sanitized candidate rejected: ${[...problems].join(', ')}`);
}

export function buildManifest(data, sourceBytes) {
  return {
    manifestVersion: 1,
    role: 'owner-representative-structure-only',
    containsRawValues: false,
    schemaVersion: data.schemaVersion,
    sourceBytes,
    structureSha256: hash(JSON.stringify(buildStructuralShape(data))),
    metrics: metricsFor(data),
    policy: {
      rawBackupMustStayOutsideRepository: true,
      credentialsMustUseRedactedPlaceholder: true,
      sensitiveHeadersMustUseRedactedPlaceholder: true,
      networkIdentifiersMustUseReservedOrDocumentationTargets: true,
      structureMustMatchRawManifest: true,
    },
  };
}

export function verifyAgainstManifest(data, manifest) {
  if (!object(manifest) || manifest.manifestVersion !== 1 || manifest.containsRawValues !== false) {
    fail('manifest: invalid or unsafe manifest');
  }
  const current = buildManifest(data, manifest.sourceBytes);
  if (current.structureSha256 !== manifest.structureSha256)
    fail('sanitized candidate rejected: structural fingerprint changed');
  assert.deepEqual(current.metrics, manifest.metrics, 'sanitized candidate metrics changed');
  assertSanitizedSafety(data);
  return current.metrics;
}

export async function inspectCommand(rawPath, manifestPath) {
  if (!rawPath || !manifestPath) fail('usage: inspect <raw-owner.bak> <structure-manifest.json>');
  if (isInsideRepository(rawPath)) fail('raw owner backup must stay outside the repository');
  const source = await readFile(resolve(rawPath), 'utf8');
  const manifest = buildManifest(
    parseBackup(source, 'raw owner backup'),
    Buffer.byteLength(source),
  );
  await writeFile(resolve(manifestPath), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(
    `Corpus B raw structure captured without raw values: ${manifest.metrics.profileCount} profiles.`,
  );
}

export async function verifyCommand(sanitizedPath, manifestPath) {
  if (!sanitizedPath || !manifestPath)
    fail('usage: verify <sanitized-owner.bak> <structure-manifest.json>');
  const [source, manifestSource] = await Promise.all([
    readFile(resolve(sanitizedPath), 'utf8'),
    readFile(resolve(manifestPath), 'utf8'),
  ]);
  let manifest;
  try {
    manifest = JSON.parse(manifestSource);
  } catch {
    fail('manifest: invalid JSON');
  }
  const metrics = verifyAgainstManifest(parseBackup(source, 'sanitized owner backup'), manifest);
  console.log(
    `Corpus B sanitized candidate passed structure and safety intake: ${metrics.profileCount} profiles.`,
  );
}

const isMain =
  typeof process.argv[1] === 'string' &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [command, first, second] = process.argv.slice(2);
  try {
    if (command === 'inspect') await inspectCommand(first, second);
    else if (command === 'verify') await verifyCommand(first, second);
    else
      fail(
        'usage: owner-corpus-b-intake.mjs <inspect raw.bak manifest.json | verify sanitized.bak manifest.json>',
      );
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Corpus B intake failed');
    process.exitCode = 1;
  }
}
