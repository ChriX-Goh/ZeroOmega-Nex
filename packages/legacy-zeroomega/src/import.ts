import {
  PROFILE_SPEC_SCHEMA_VERSION,
  validateProfileSpec,
  type AutoDetectProfile,
  type BuiltInProfileAppearance,
  type Condition,
  type FixedProfile,
  type JsonValue,
  type LegacyMetadata,
  type PacProfile,
  type ProfileRouteTarget,
  type ProfileSpec,
  type ProxyEndpoint,
  type RuleListFormat,
  type RuleListProfile,
  type RuleSource,
  type RuleSourceHeader,
  type SwitchProfile,
  type SwitchRule,
  type UserProfile,
  type VirtualProfile,
  type Weekday,
} from '@zeroomega-nex/profile-spec';

import {
  DEFAULT_LEGACY_DECODE_LIMITS,
  decodeZeroOmegaBackup,
  type LegacyDecodeLimits,
} from './decode.js';
import { legacySecretRef, legacyStableId } from './ids.js';
import { LegacyImportReportBuilder } from './report.js';
import type {
  LegacyImportContext,
  LegacyImportResult,
  LegacyInputEncoding,
  LegacySecretMaterial,
} from './contracts.js';

const PROFILE_TYPES = new Set([
  'DirectProfile',
  'SystemProfile',
  'FixedProfile',
  'PacProfile',
  'AutoDetectProfile',
  'SwitchProfile',
  'VirtualProfile',
  'RuleListProfile',
  'SwitchyRuleListProfile',
  'AutoProxyRuleListProfile',
]);

const COMMON_PROFILE_FIELDS = new Set([
  'name',
  'profileType',
  'color',
  'revision',
  'builtin',
  'syncOptions',
  'syncError',
  'enabled',
]);

const GENERATED_FIELDS = new Set(['ruleList', 'pacScript', 'lastUpdate', 'sha256']);
const RUNTIME_FIELDS = new Set([
  'syncOptions',
  'syncError',
  'currentProfile',
  'monitorWebRequests',
  'syncStatus',
]);
const RISK_FIELD_NAME =
  /(^|[-_.])(password|passwd|secret|token|authorization|cookie|auth|script|code|permission|network|proxy|condition|rule|header|host|port|url)($|[-_.])/i;
const SENSITIVE_HEADER_NAME =
  /(authorization|cookie|token|secret|api[-_]?key|proxy-auth|credential)/i;
const FORBIDDEN_HEADER_NAME =
  /^(host|content-length|connection|proxy-connection|transfer-encoding|upgrade)$/i;
const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const WEEKDAYS: readonly Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

interface ProfileDescriptor {
  readonly key: string;
  readonly path: string;
  readonly name: string;
  readonly profileType: string;
  readonly id?: string;
  readonly raw: Record<string, unknown>;
}

interface ImportState {
  readonly report: LegacyImportReportBuilder;
  readonly routes: Map<string, ProfileRouteTarget>;
  readonly secretMaterials: LegacySecretMaterial[];
  readonly endpoints: ProxyEndpoint[];
  readonly ruleSources: RuleSource[];
  readonly downloadInterval: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

function cloneRoute(route: ProfileRouteTarget): ProfileRouteTarget {
  return route.kind === 'profile'
    ? { kind: 'profile', profileId: route.profileId }
    : { kind: route.kind };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function containsNonAscii(value: string): boolean {
  return [...value].some((character) => character.codePointAt(0)! > 0x7f);
}

function finiteInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
}

function legacyBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 0) return false;
  if (value === 1) return true;
  return fallback;
}

function containsRisk(value: JsonValue): boolean {
  if (Array.isArray(value)) return value.some(containsRisk);
  if (value === null || typeof value !== 'object') return false;
  return Object.entries(value).some(
    ([key, nested]) => RISK_FIELD_NAME.test(key) || containsRisk(nested),
  );
}

function safeUnknownFields(
  raw: Record<string, unknown>,
  known: ReadonlySet<string>,
  path: string,
  report: LegacyImportReportBuilder,
): Record<string, JsonValue> | undefined {
  const fields: Record<string, JsonValue> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (known.has(key)) continue;
    const sourcePath = `${path}/${key}`;
    if (GENERATED_FIELDS.has(key)) {
      report.add(
        'ignored-generated',
        'field.generated-omitted',
        sourcePath,
        'Generated legacy data is omitted and will be rebuilt.',
      );
      continue;
    }
    if (RUNTIME_FIELDS.has(key)) {
      report.add(
        'ignored-runtime',
        'field.runtime-omitted',
        sourcePath,
        'Device or session state is not part of the imported configuration.',
      );
      continue;
    }
    if (!isJsonValue(value)) {
      report.add(
        'rejected',
        'field.non-json-value',
        sourcePath,
        'Unknown field is not JSON-compatible.',
      );
      continue;
    }
    if (RISK_FIELD_NAME.test(key) || containsRisk(value)) {
      report.add(
        'rejected',
        'field.unknown-behavior',
        sourcePath,
        'Unknown behavior-changing or secret-like field cannot be activated safely.',
      );
      continue;
    }
    fields[key] = value;
    report.add(
      'preserved',
      'field.safe-metadata-preserved',
      sourcePath,
      'Unknown safe metadata is preserved under the legacy namespace.',
    );
  }

  return Object.keys(fields).length === 0 ? undefined : fields;
}

function legacyMetadata(
  raw: Record<string, unknown>,
  profileType: string,
  fields: Record<string, JsonValue> | undefined,
): LegacyMetadata {
  const revision = raw.revision;
  return {
    source: 'zeroomega-v3.5.0',
    profileType,
    ...(typeof revision === 'string' || typeof revision === 'number' ? { revision } : {}),
    ...(fields === undefined ? {} : { fields }),
  };
}

function routeForName(name: unknown, sourcePath: string, state: ImportState): ProfileRouteTarget {
  if (typeof name !== 'string' || name.length === 0) {
    state.report.add(
      'rejected',
      'profile.invalid-reference',
      sourcePath,
      'Profile reference must be a non-empty name.',
    );
    return { kind: 'direct' };
  }
  const route = state.routes.get(name);
  if (!route) {
    state.report.add(
      'rejected',
      'profile.missing-reference',
      sourcePath,
      `Referenced profile "${name}" does not exist.`,
    );
    return { kind: 'direct' };
  }
  return cloneRoute(route);
}

function profileColor(raw: Record<string, unknown>): { color?: string } {
  return typeof raw.color === 'string' ? { color: raw.color } : {};
}

function profileBase(
  descriptor: ProfileDescriptor,
  fields: Record<string, JsonValue> | undefined,
): Pick<UserProfile, 'id' | 'name' | 'color' | 'legacy'> {
  if (!descriptor.id) throw new Error('User profile descriptor is missing an ID.');
  return {
    id: descriptor.id,
    name: descriptor.name,
    ...profileColor(descriptor.raw),
    ...(typeof descriptor.raw.enabled === 'boolean' ? { enabled: descriptor.raw.enabled } : {}),
    legacy: legacyMetadata(descriptor.raw, descriptor.profileType, fields),
  };
}

function mapProxyProtocol(
  value: unknown,
  sourcePath: string,
  report: LegacyImportReportBuilder,
): ProxyEndpoint['protocol'] | undefined {
  if (typeof value !== 'string') {
    report.add('rejected', 'endpoint.missing-protocol', sourcePath, 'Proxy protocol is required.');
    return undefined;
  }
  const protocol = value.toLowerCase();
  if (
    protocol === 'http' ||
    protocol === 'https' ||
    protocol === 'socks4' ||
    protocol === 'socks5'
  ) {
    return protocol;
  }
  report.add(
    'rejected',
    'endpoint.unsupported-protocol',
    sourcePath,
    `Unsupported legacy proxy protocol "${value}".`,
  );
  return undefined;
}

function authRecordForSlot(
  auth: Record<string, unknown> | undefined,
  slot: string,
): Record<string, unknown> | undefined {
  const exact = auth?.[slot];
  if (isRecord(exact)) return exact;
  const all = auth?.all;
  return isRecord(all) ? all : undefined;
}

function extractProxyCredential(
  auth: Record<string, unknown> | undefined,
  slot: string,
  protocol: ProxyEndpoint['protocol'],
  sourcePath: string,
  state: ImportState,
): ProxyEndpoint['credential'] | undefined {
  const credential = authRecordForSlot(auth, slot);
  if (!credential) return undefined;
  const username = stringValue(credential.username);
  const password = stringValue(credential.password);
  if (username === undefined && password === undefined) return undefined;

  const secretPath = `${sourcePath}/auth/${slot}`;
  const ref = legacySecretRef('proxy-password', secretPath);
  state.secretMaterials.push({
    ref,
    kind: 'proxy-password',
    sourcePath: secretPath,
    value: password ?? '',
    ...(username === undefined ? {} : { username }),
  });
  state.report.add(
    protocol === 'socks4' || protocol === 'socks5' ? 'target-dependent' : 'exact',
    'secret.proxy-credential-extracted',
    secretPath,
    protocol === 'socks4' || protocol === 'socks5'
      ? 'SOCKS credential was isolated but requires a future verified backend.'
      : 'Proxy credential was moved to separate secret material.',
  );
  return {
    ...(username === undefined ? {} : { username }),
    passwordSecretRef: ref,
  };
}

function validateAuthSlots(
  auth: Record<string, unknown> | undefined,
  path: string,
  state: ImportState,
): void {
  if (!auth) return;
  const allowed = new Set(['all', 'fallbackProxy', 'proxyForHttp', 'proxyForHttps', 'proxyForFtp']);
  for (const slot of Object.keys(auth)) {
    if (!allowed.has(slot)) {
      state.report.add(
        'rejected',
        'secret.unknown-auth-slot',
        `${path}/auth/${slot}`,
        'Credential slot has no defined endpoint association.',
      );
    }
  }
}

function bypassNeedsCapabilityReview(pattern: string): boolean {
  return (
    containsNonAscii(pattern) ||
    /\/[^0-9]+$/.test(pattern) ||
    /:[^0-9\]]+$/.test(pattern) ||
    (/^[0-9a-f:]+:\d+$/i.test(pattern) && !pattern.startsWith('['))
  );
}

function mapFixedProfile(descriptor: ProfileDescriptor, state: ImportState): FixedProfile {
  const raw = descriptor.raw;
  const auth = isRecord(raw.auth) ? raw.auth : undefined;
  validateAuthSlots(auth, descriptor.path, state);

  const proxyByScheme: FixedProfile['proxyByScheme'] = {};
  const slotDefinitions = [
    ['fallbackProxy', 'fallback'],
    ['proxyForHttp', 'http'],
    ['proxyForHttps', 'https'],
    ['proxyForFtp', 'ftp'],
  ] as const;

  for (const [legacySlot, targetSlot] of slotDefinitions) {
    const source = raw[legacySlot];
    if (source === undefined || source === null) continue;
    const sourcePath = `${descriptor.path}/${legacySlot}`;
    if (!isRecord(source)) {
      state.report.add(
        'rejected',
        'endpoint.invalid-record',
        sourcePath,
        'Proxy endpoint must be an object.',
      );
      continue;
    }
    const protocol = mapProxyProtocol(source.scheme, `${sourcePath}/scheme`, state.report);
    const host = stringValue(source.host);
    const port = finiteInteger(source.port);
    if (!host) {
      state.report.add(
        'rejected',
        'endpoint.invalid-host',
        `${sourcePath}/host`,
        'Proxy host is required.',
      );
    }
    if (port === undefined || port < 1 || port > 65535) {
      state.report.add(
        'rejected',
        'endpoint.invalid-port',
        `${sourcePath}/port`,
        'Proxy port must be an integer from 1 to 65535.',
      );
    }
    if (!protocol || !host || port === undefined || port < 1 || port > 65535) continue;

    const id = legacyStableId(
      'endpoint',
      descriptor.name,
      legacySlot,
      protocol,
      host,
      String(port),
    );
    const credential = extractProxyCredential(auth, legacySlot, protocol, descriptor.path, state);
    state.endpoints.push({
      id,
      name: `${descriptor.name} — ${legacySlot}`,
      protocol,
      host,
      port,
      ...(credential === undefined ? {} : { credential }),
    });
    proxyByScheme[targetSlot] = id;
    state.report.add(
      targetSlot === 'ftp' ? 'target-dependent' : 'exact',
      'endpoint.mapped',
      sourcePath,
      targetSlot === 'ftp'
        ? 'FTP-specific proxy intent was preserved and requires browser capability review.'
        : 'Proxy endpoint was mapped exactly.',
      `/proxyEndpoints/${state.endpoints.length - 1}`,
    );
  }

  const bypass: FixedProfile['bypass'] = [];
  if (raw.bypassList !== undefined && !Array.isArray(raw.bypassList)) {
    state.report.add(
      'rejected',
      'bypass.invalid-list',
      `${descriptor.path}/bypassList`,
      'Bypass list must be an array.',
    );
  }
  if (Array.isArray(raw.bypassList)) {
    raw.bypassList.forEach((entry, index) => {
      const pattern =
        typeof entry === 'string'
          ? entry
          : isRecord(entry)
            ? stringValue(entry.pattern)
            : undefined;
      const sourcePath = `${descriptor.path}/bypassList/${index}`;
      if (pattern === undefined || pattern.length === 0) {
        state.report.add(
          'rejected',
          'bypass.invalid-pattern',
          sourcePath,
          'Bypass pattern is required.',
        );
        return;
      }
      bypass.push({
        id: legacyStableId('bypass', descriptor.name, String(index), pattern),
        pattern,
        ...(isRecord(entry) && typeof entry.note === 'string' ? { note: entry.note } : {}),
        ...(isRecord(entry) && typeof entry.enabled === 'boolean'
          ? { enabled: entry.enabled }
          : {}),
      });
      state.report.add(
        bypassNeedsCapabilityReview(pattern) ? 'target-dependent' : 'exact',
        'bypass.mapped',
        sourcePath,
        bypassNeedsCapabilityReview(pattern)
          ? 'Bypass source text was preserved for target-specific compatibility verification.'
          : 'Bypass pattern was mapped in source order.',
        `/profiles/${descriptor.id}/bypass/${index}`,
      );
    });
  }

  const known = new Set([
    ...COMMON_PROFILE_FIELDS,
    'fallbackProxy',
    'proxyForHttp',
    'proxyForHttps',
    'proxyForFtp',
    'bypassList',
    'auth',
  ]);
  const fields = safeUnknownFields(raw, known, descriptor.path, state.report);
  return {
    ...profileBase(descriptor, fields),
    kind: 'fixed',
    proxyByScheme,
    bypass,
  };
}

interface ConditionMapping {
  readonly condition: Condition;
  readonly enabled?: boolean;
  readonly status: 'exact' | 'target-dependent' | 'downgraded';
  readonly code: string;
  readonly message: string;
}

function invalidCondition(
  path: string,
  code: string,
  message: string,
  report: LegacyImportReportBuilder,
): ConditionMapping {
  report.add('rejected', code, path, message);
  return {
    condition: { kind: 'false', annotation: 'Rejected legacy condition' },
    enabled: false,
    status: 'downgraded',
    code: 'condition.disabled-after-rejection',
    message: 'Rejected condition was disabled in the inactive candidate.',
  };
}

function validRegex(pattern: string, flags = ''): boolean {
  try {
    new RegExp(pattern, flags);
    return true;
  } catch {
    return false;
  }
}

function weekdayRange(start: number, end: number): Weekday[] {
  const days: Weekday[] = [];
  let value = start;
  for (let count = 0; count < 7; count += 1) {
    days.push(WEEKDAYS[value]!);
    if (value === end) break;
    value = (value + 1) % 7;
  }
  return days;
}

function mapCondition(
  raw: unknown,
  path: string,
  report: LegacyImportReportBuilder,
): ConditionMapping {
  if (!isRecord(raw) || typeof raw.conditionType !== 'string') {
    return invalidCondition(
      path,
      'condition.invalid-record',
      'Condition object and type are required.',
      report,
    );
  }
  const pattern = stringValue(raw.pattern) ?? '';
  switch (raw.conditionType) {
    case 'TrueCondition':
      return {
        condition: { kind: 'true' },
        status: 'exact',
        code: 'condition.true',
        message: 'Catch-all condition mapped exactly.',
      };
    case 'FalseCondition':
      return {
        condition: { kind: 'false', ...(pattern ? { annotation: pattern } : {}) },
        status: 'exact',
        code: 'condition.false',
        message: 'Never-match condition mapped exactly.',
      };
    case 'UrlRegexCondition':
    case 'HostRegexCondition': {
      const flags = stringValue(raw.flags) ?? '';
      if (!validRegex(pattern, flags)) {
        return {
          condition: { kind: 'false', annotation: `Invalid legacy regex: ${pattern}` },
          enabled: false,
          status: 'downgraded',
          code: 'condition.invalid-regex-disabled',
          message:
            'Invalid legacy regular expression was disabled rather than silently reinterpreted.',
        };
      }
      const url = raw.conditionType === 'UrlRegexCondition';
      return {
        condition: {
          kind: url ? 'url-regex' : 'host-regex',
          pattern,
          ...(flags ? { flags } : {}),
        },
        status: url || containsNonAscii(pattern) ? 'target-dependent' : 'exact',
        code: url ? 'condition.url-regex' : 'condition.host-regex',
        message: url
          ? 'Full-URL regular expression requires target capability verification.'
          : 'Host regular expression was mapped.',
      };
    }
    case 'UrlWildcardCondition':
      return {
        condition: { kind: 'url-wildcard', pattern },
        status: 'target-dependent',
        code: 'condition.url-wildcard',
        message: 'Full-URL wildcard requires target capability verification.',
      };
    case 'HostWildcardCondition':
      return {
        condition: { kind: 'host-wildcard', pattern },
        status: containsNonAscii(pattern) ? 'target-dependent' : 'exact',
        code: 'condition.host-wildcard',
        message: containsNonAscii(pattern)
          ? 'Unicode host source text was preserved for IDN differential verification.'
          : 'Host wildcard was mapped exactly.',
      };
    case 'BypassCondition':
      return {
        condition: { kind: 'bypass', pattern },
        status: bypassNeedsCapabilityReview(pattern) ? 'target-dependent' : 'exact',
        code: 'condition.bypass',
        message: 'Bypass condition source text was preserved.',
      };
    case 'KeywordCondition':
      return {
        condition: { kind: 'keyword', pattern, httpOnly: true },
        status: 'target-dependent',
        code: 'condition.keyword',
        message: 'Legacy HTTP-only keyword semantics require target verification.',
      };
    case 'IpCondition': {
      const address = stringValue(raw.ip);
      const prefixLength = finiteInteger(raw.prefixLength);
      if (!address || prefixLength === undefined) {
        return invalidCondition(
          path,
          'condition.invalid-ip',
          'IP address and prefix length are required.',
          report,
        );
      }
      return {
        condition: { kind: 'ip', address, prefixLength },
        status: 'exact',
        code: 'condition.ip',
        message: 'IP literal condition was mapped without DNS resolution.',
      };
    }
    case 'HostLevelsCondition': {
      const min = finiteInteger(raw.minValue);
      const max = finiteInteger(raw.maxValue);
      if (min === undefined || max === undefined) {
        return invalidCondition(
          path,
          'condition.invalid-host-levels',
          'Host-level range is required.',
          report,
        );
      }
      return {
        condition: { kind: 'host-levels', min, max },
        status: 'exact',
        code: 'condition.host-levels',
        message: 'Host-level range was mapped exactly.',
      };
    }
    case 'WeekdayCondition': {
      let days: Weekday[] | undefined;
      if (typeof raw.days === 'string' && raw.days.length === 7) {
        const dayMask = raw.days as string;
        days = WEEKDAYS.filter((_, index) => !['-', '_', '0'].includes(dayMask[index]!));
      } else {
        const start = finiteInteger(raw.startDay);
        const end = finiteInteger(raw.endDay);
        if (
          start !== undefined &&
          end !== undefined &&
          start >= 0 &&
          start <= 6 &&
          end >= 0 &&
          end <= 6
        ) {
          days = weekdayRange(start, end);
        }
      }
      if (!days || days.length === 0) {
        return invalidCondition(
          path,
          'condition.invalid-weekdays',
          'Weekday selection is invalid or empty.',
          report,
        );
      }
      return {
        condition: { kind: 'weekday', days, timezone: 'local' },
        status: 'exact',
        code: 'condition.weekday',
        message: 'Local weekday selection was mapped exactly.',
      };
    }
    case 'TimeCondition': {
      const startHour = finiteInteger(raw.startHour);
      const endHour = finiteInteger(raw.endHour);
      if (
        startHour === undefined ||
        endHour === undefined ||
        startHour < 0 ||
        startHour > 23 ||
        endHour < 0 ||
        endHour > 23
      ) {
        return invalidCondition(
          path,
          'condition.invalid-time',
          'Local hour range must use values from 0 to 23.',
          report,
        );
      }
      return {
        condition: { kind: 'time', startHour, endHour, timezone: 'local' },
        status: 'exact',
        code: 'condition.time',
        message: 'Local-hour condition was mapped exactly.',
      };
    }
    default:
      return invalidCondition(
        path,
        'condition.unknown-type',
        `Unknown condition type "${raw.conditionType}" cannot be activated.`,
        report,
      );
  }
}

function mapSwitchProfile(descriptor: ProfileDescriptor, state: ImportState): SwitchProfile {
  const raw = descriptor.raw;
  const rules: SwitchRule[] = [];
  if (!Array.isArray(raw.rules)) {
    state.report.add(
      'rejected',
      'switch.invalid-rules',
      `${descriptor.path}/rules`,
      'Switch rules must be an array.',
    );
  } else {
    raw.rules.forEach((entry, index) => {
      const sourcePath = `${descriptor.path}/rules/${index}`;
      if (!isRecord(entry)) {
        state.report.add(
          'rejected',
          'switch.invalid-rule',
          sourcePath,
          'Switch rule must be an object.',
        );
        return;
      }
      const mapping = mapCondition(entry.condition, `${sourcePath}/condition`, state.report);
      state.report.add(mapping.status, mapping.code, `${sourcePath}/condition`, mapping.message);
      const route = routeForName(entry.profileName, `${sourcePath}/profileName`, state);
      const known = new Set(['condition', 'profileName', 'note', 'enabled']);
      const fields = safeUnknownFields(entry, known, sourcePath, state.report);
      const enabled = typeof entry.enabled === 'boolean' ? entry.enabled : mapping.enabled;
      rules.push({
        id: legacyStableId('rule', descriptor.name, String(index)),
        condition: mapping.condition,
        route,
        ...(typeof entry.note === 'string' ? { note: entry.note } : {}),
        ...(enabled === undefined ? {} : { enabled }),
        ...(fields === undefined ? {} : { legacy: { source: 'zeroomega-v3.5.0', fields } }),
      });
    });
  }

  const known = new Set([...COMMON_PROFILE_FIELDS, 'rules', 'defaultProfileName']);
  const fields = safeUnknownFields(raw, known, descriptor.path, state.report);
  return {
    ...profileBase(descriptor, fields),
    kind: 'switch',
    rules,
    defaultRoute: routeForName(
      raw.defaultProfileName,
      `${descriptor.path}/defaultProfileName`,
      state,
    ),
  };
}

function normalizeRuleListFormat(
  descriptor: ProfileDescriptor,
  state: ImportState,
): RuleListFormat | undefined {
  if (descriptor.profileType === 'SwitchyRuleListProfile') return 'switchy';
  if (descriptor.profileType === 'AutoProxyRuleListProfile') return 'autoproxy';
  const format = stringValue(descriptor.raw.format)?.toLowerCase();
  if (format === 'switchy') return 'switchy';
  if (format === 'autoproxy') return 'autoproxy';
  state.report.add(
    'rejected',
    'rule-source.unknown-format',
    `${descriptor.path}/format`,
    'Rule-list format must be Switchy or AutoProxy.',
  );
  return undefined;
}

function decodeMaybeBase64RuleList(content: string, format: RuleListFormat): string {
  if (format !== 'autoproxy' || content.includes('\n') || content.length % 4 !== 0) return content;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(content)) return content;
  try {
    const binary = atob(content);
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
    return decoded.includes('\n') || decoded.startsWith('[AutoProxy') ? decoded : content;
  } catch {
    return content;
  }
}

interface HeaderMapping {
  readonly headers?: RuleSourceHeader[];
}

function mapHeaders(raw: unknown, path: string, state: ImportState): HeaderMapping {
  if (raw === undefined) return {};
  if (!Array.isArray(raw)) {
    state.report.add('rejected', 'header.invalid-list', path, 'Download headers must be an array.');
    return {};
  }

  const finalHeaders = new Map<string, { name: string; value: string; path: string }>();
  raw.forEach((entry, index) => {
    const sourcePath = `${path}/${index}`;
    if (!isRecord(entry)) {
      state.report.add(
        'rejected',
        'header.invalid-record',
        sourcePath,
        'Header must be an object.',
      );
      return;
    }
    const name = stringValue(entry.name)?.trim() ?? '';
    const value = stringValue(entry.value);
    if (!name) {
      state.report.add(
        'downgraded',
        'header.empty-name-ignored',
        `${sourcePath}/name`,
        'Empty header name was ignored, matching legacy request behavior.',
      );
      return;
    }
    if (!HEADER_NAME.test(name) || FORBIDDEN_HEADER_NAME.test(name)) {
      state.report.add(
        'rejected',
        'header.forbidden-name',
        `${sourcePath}/name`,
        `Header "${name}" is not safe for extension-managed downloads.`,
      );
      return;
    }
    if (value === undefined || /[\r\n]/.test(value)) {
      state.report.add(
        'rejected',
        'header.invalid-value',
        `${sourcePath}/value`,
        'Header value must be a single-line string.',
      );
      return;
    }
    const key = name.toLowerCase();
    if (finalHeaders.has(key)) {
      state.report.add(
        'exact',
        'header.duplicate-last-wins',
        sourcePath,
        `Duplicate header "${name}" retained its final legacy value.`,
      );
      finalHeaders.delete(key);
    }
    finalHeaders.set(key, { name, value, path: sourcePath });
  });

  const headers: RuleSourceHeader[] = [];
  for (const { name, value, path: sourcePath } of finalHeaders.values()) {
    if (SENSITIVE_HEADER_NAME.test(name)) {
      const ref = legacySecretRef('request-header', `${sourcePath}/value`);
      state.secretMaterials.push({
        ref,
        kind: 'request-header',
        sourcePath: `${sourcePath}/value`,
        value,
        headerName: name,
      });
      headers.push({ name, value: { kind: 'secret', secretRef: ref } });
      state.report.add(
        'exact',
        'secret.header-extracted',
        `${sourcePath}/value`,
        `Sensitive header "${name}" was moved to separate secret material.`,
      );
    } else {
      headers.push({ name, value: { kind: 'literal', value } });
      state.report.add('exact', 'header.mapped', sourcePath, `Header "${name}" was mapped.`);
    }
  }
  return headers.length === 0 ? {} : { headers };
}

function mapRuleListProfile(descriptor: ProfileDescriptor, state: ImportState): RuleListProfile {
  const raw = descriptor.raw;
  const format = normalizeRuleListFormat(descriptor, state) ?? 'autoproxy';
  const sourceUrl = stringValue(raw.sourceUrl);
  const cachedContent = stringValue(raw.ruleList) ?? '';
  let location: RuleSource['location'];
  if (sourceUrl) {
    const content = decodeMaybeBase64RuleList(cachedContent, format);
    location = {
      kind: 'url',
      url: sourceUrl,
      ...(raw.ruleList === undefined ? {} : { content }),
    };
    state.report.add(
      'exact',
      'rule-source.url-mapped',
      `${descriptor.path}/sourceUrl`,
      'Rule source URL was mapped.',
    );
    if (raw.ruleList !== undefined) {
      state.report.add(
        'exact',
        content === cachedContent
          ? 'rule-source.downloaded-cache-preserved'
          : 'rule-source.downloaded-cache-base64-decoded',
        `${descriptor.path}/ruleList`,
        content === cachedContent
          ? 'Downloaded rule-list content was preserved for offline use.'
          : 'Downloaded base64 AutoProxy content was decoded and preserved for offline use.',
      );
    }
  } else {
    const content = decodeMaybeBase64RuleList(cachedContent, format);
    location = { kind: 'inline', content };
    state.report.add(
      'exact',
      content === cachedContent ? 'rule-source.inline-mapped' : 'rule-source.base64-decoded',
      `${descriptor.path}/ruleList`,
      content === cachedContent
        ? 'Inline rule-list content was preserved.'
        : 'Legacy base64 AutoProxy content was decoded into inline text.',
    );
  }

  const sourceId = legacyStableId('source', descriptor.name);
  const headerMapping = mapHeaders(raw.headers, `${descriptor.path}/headers`, state);
  const sourceInterval = finiteInteger(raw.updateIntervalMinutes);
  state.ruleSources.push({
    id: sourceId,
    name: `${descriptor.name} rules`,
    format,
    location,
    ...headerMapping,
    updateIntervalMinutes:
      sourceInterval !== undefined && sourceInterval >= 1 ? sourceInterval : state.downloadInterval,
  });

  const known = new Set([
    ...COMMON_PROFILE_FIELDS,
    'format',
    'sourceUrl',
    'ruleList',
    'matchProfileName',
    'defaultProfileName',
    'headers',
    'updateIntervalMinutes',
    'lastUpdate',
    'sha256',
    'pacScript',
  ]);
  if (raw.lastUpdate !== undefined) {
    state.report.add(
      'ignored-generated',
      'rule-source.last-update-omitted',
      `${descriptor.path}/lastUpdate`,
      'Update timestamp will be recomputed.',
    );
  }
  if (raw.sha256 !== undefined) {
    state.report.add(
      'ignored-generated',
      'rule-source.hash-omitted',
      `${descriptor.path}/sha256`,
      'Rule-source hash will be recomputed.',
    );
  }
  if (raw.pacScript !== undefined) {
    state.report.add(
      'ignored-generated',
      'rule-source.pac-omitted',
      `${descriptor.path}/pacScript`,
      'Compiled PAC cache was omitted.',
    );
  }
  const fields = safeUnknownFields(raw, known, descriptor.path, state.report);
  return {
    ...profileBase(descriptor, fields),
    kind: 'rule-list',
    sourceId,
    matchRoute: routeForName(raw.matchProfileName, `${descriptor.path}/matchProfileName`, state),
    defaultRoute: routeForName(
      raw.defaultProfileName,
      `${descriptor.path}/defaultProfileName`,
      state,
    ),
  };
}

function mapPacProfile(descriptor: ProfileDescriptor, state: ImportState): PacProfile {
  const raw = descriptor.raw;
  const pacUrl = stringValue(raw.pacUrl);
  const pacScript = stringValue(raw.pacScript);
  let source: PacProfile['source'];
  if (pacUrl) {
    source = {
      kind: 'url',
      url: pacUrl,
      ...(pacScript === undefined ? {} : { script: pacScript }),
    };
    state.report.add(
      'exact',
      'pac.url-mapped',
      `${descriptor.path}/pacUrl`,
      'PAC source URL was mapped.',
    );
    if (pacScript !== undefined) {
      state.report.add(
        'exact',
        'pac.downloaded-cache-preserved',
        `${descriptor.path}/pacScript`,
        'Downloaded PAC script was preserved for offline use and review.',
      );
    }
  } else if (pacScript) {
    source = { kind: 'inline', script: pacScript };
    state.report.add(
      'preserved',
      'pac.inline-preserved',
      `${descriptor.path}/pacScript`,
      'Inline PAC script was preserved but remains inactive until review.',
    );
  } else {
    state.report.add(
      'rejected',
      'pac.missing-source',
      descriptor.path,
      'PAC profile requires a URL or inline script.',
    );
    source = { kind: 'inline', script: 'function FindProxyForURL() { return "DIRECT"; }' };
  }
  const headerMapping = mapHeaders(raw.headers, `${descriptor.path}/headers`, state);
  if (raw.lastUpdate !== undefined) {
    state.report.add(
      'ignored-generated',
      'pac.last-update-omitted',
      `${descriptor.path}/lastUpdate`,
      'PAC update timestamp will be recomputed.',
    );
  }
  if (raw.sha256 !== undefined) {
    state.report.add(
      'ignored-generated',
      'pac.hash-omitted',
      `${descriptor.path}/sha256`,
      'PAC hash will be recomputed.',
    );
  }
  const known = new Set([
    ...COMMON_PROFILE_FIELDS,
    'pacUrl',
    'pacScript',
    'headers',
    'fallbackProfileName',
    'lastUpdate',
    'sha256',
  ]);
  const fields = safeUnknownFields(raw, known, descriptor.path, state.report);
  return {
    ...profileBase(descriptor, fields),
    kind: 'pac',
    source,
    ...headerMapping,
    ...(typeof raw.fallbackProfileName === 'string'
      ? {
          fallbackRoute: routeForName(
            raw.fallbackProfileName,
            `${descriptor.path}/fallbackProfileName`,
            state,
          ),
        }
      : {}),
  };
}

function mapAutoDetectProfile(
  descriptor: ProfileDescriptor,
  state: ImportState,
): AutoDetectProfile {
  const raw = descriptor.raw;
  state.report.add(
    'target-dependent',
    'profile.auto-detect-mapped',
    descriptor.path,
    'Auto-detect behavior was preserved and requires browser capability verification.',
  );
  for (const field of ['pacUrl', 'pacScript', 'lastUpdate', 'sha256']) {
    if (raw[field] !== undefined) {
      state.report.add(
        'ignored-generated',
        'auto-detect.cache-omitted',
        `${descriptor.path}/${field}`,
        'Auto-detect generated state was omitted.',
      );
    }
  }
  const known = new Set([...COMMON_PROFILE_FIELDS, 'pacUrl', 'pacScript', 'lastUpdate', 'sha256']);
  const fields = safeUnknownFields(raw, known, descriptor.path, state.report);
  return { ...profileBase(descriptor, fields), kind: 'auto-detect' };
}

function mapVirtualProfile(descriptor: ProfileDescriptor, state: ImportState): VirtualProfile {
  const raw = descriptor.raw;
  const rules = Array.isArray(raw.rules) ? raw.rules : [];
  if (rules.length > 0) {
    state.report.add(
      'downgraded',
      'profile.virtual-rules-preserved',
      `${descriptor.path}/rules`,
      'VirtualProfile rules are non-canonical and were preserved as legacy metadata.',
    );
  } else {
    state.report.add(
      'exact',
      'profile.virtual-mapped',
      descriptor.path,
      'VirtualProfile target was mapped as a stable alias.',
    );
  }
  const known = new Set([...COMMON_PROFILE_FIELDS, 'defaultProfileName', 'rules']);
  const fields = safeUnknownFields(raw, known, descriptor.path, state.report) ?? {};
  if (rules.length > 0 && isJsonValue(rules)) fields.rules = rules;
  return {
    ...profileBase(descriptor, Object.keys(fields).length === 0 ? undefined : fields),
    kind: 'virtual',
    targetRoute: routeForName(
      raw.defaultProfileName,
      `${descriptor.path}/defaultProfileName`,
      state,
    ),
  };
}

function mapProfile(descriptor: ProfileDescriptor, state: ImportState): UserProfile | undefined {
  switch (descriptor.profileType) {
    case 'FixedProfile':
      return mapFixedProfile(descriptor, state);
    case 'SwitchProfile':
      return mapSwitchProfile(descriptor, state);
    case 'VirtualProfile':
      return mapVirtualProfile(descriptor, state);
    case 'RuleListProfile':
    case 'SwitchyRuleListProfile':
    case 'AutoProxyRuleListProfile':
      if (descriptor.profileType !== 'RuleListProfile') {
        state.report.add(
          'preserved',
          'profile.rule-list-alias',
          descriptor.path,
          `${descriptor.profileType} origin was preserved.`,
        );
      }
      return mapRuleListProfile(descriptor, state);
    case 'PacProfile':
      return mapPacProfile(descriptor, state);
    case 'AutoDetectProfile':
      return mapAutoDetectProfile(descriptor, state);
    default:
      return undefined;
  }
}

function mapBuiltInAppearance(
  options: Readonly<Record<string, unknown>>,
  report: LegacyImportReportBuilder,
): BuiltInProfileAppearance | undefined {
  const raw = options['-builtinProfiles'];
  if (raw === undefined) return undefined;
  if (!isRecord(raw)) {
    report.add(
      'rejected',
      'builtin.invalid-container',
      '/-builtinProfiles',
      'Built-in appearance must be an object.',
    );
    return undefined;
  }
  const appearance: BuiltInProfileAppearance = {};
  for (const [key, value] of Object.entries(raw)) {
    const path = `/-builtinProfiles/${key}`;
    if (key !== '+direct' && key !== '+system') {
      report.add(
        'preserved',
        'builtin.unknown-key',
        path,
        'Unknown built-in appearance entry was not made authoritative.',
      );
      continue;
    }
    if (!isRecord(value) || typeof value.color !== 'string') {
      report.add(
        'rejected',
        'builtin.invalid-color',
        path,
        'Built-in appearance requires a color string.',
      );
      continue;
    }
    if (key === '+direct') appearance.direct = { color: value.color };
    else appearance.system = { color: value.color };
    report.add(
      'exact',
      'builtin.color-mapped',
      `${path}/color`,
      'Built-in profile color was mapped.',
    );
  }
  return Object.keys(appearance).length === 0 ? undefined : appearance;
}

function mapSettings(
  options: Readonly<Record<string, unknown>>,
  state: ImportState,
): { settings: ProfileSpec['settings']; extensions?: Record<string, JsonValue> } {
  const quickRoutes: ProfileRouteTarget[] = [];
  const rawQuick = options['-quickSwitchProfiles'];
  if (rawQuick !== undefined && !Array.isArray(rawQuick)) {
    state.report.add(
      'rejected',
      'settings.invalid-quick-switch',
      '/-quickSwitchProfiles',
      'Quick Switch list must be an array.',
    );
  }
  if (Array.isArray(rawQuick)) {
    rawQuick.forEach((name, index) => {
      quickRoutes.push(routeForName(name, `/-quickSwitchProfiles/${index}`, state));
    });
  }

  const startupName = options['-startupProfileName'];
  const startupRoute =
    startupName === undefined || startupName === ''
      ? undefined
      : routeForName(startupName, '/-startupProfileName', state);
  if (startupName === '') {
    state.report.add(
      'exact',
      'settings.startup-empty',
      '/-startupProfileName',
      'Empty original startup profile means no automatic startup switch.',
    );
  }
  const builtInProfiles = mapBuiltInAppearance(options, state.report);
  const extensions: Record<string, JsonValue> = {};
  if (typeof options['-customCss'] === 'string') {
    extensions['zeroomega/custom-css'] = options['-customCss'];
    state.report.add(
      'preserved',
      'settings.custom-css-preserved',
      '/-customCss',
      'Custom CSS was preserved as inactive metadata and will not execute automatically.',
    );
  }
  if (options['-monitorWebRequests'] !== undefined) {
    state.report.add(
      'exact',
      'settings.monitor-web-requests-mapped',
      '/-monitorWebRequests',
      'The request-monitoring preference was mapped; browser permission remains an explicit user grant.',
    );
  }

  const known = new Set([
    'schemaVersion',
    '-enableQuickSwitch',
    '-refreshOnProfileChange',
    '-startupProfileName',
    '-quickSwitchProfiles',
    '-revertProxyChanges',
    '-confirmDeletion',
    '-showInspectMenu',
    '-addConditionsToBottom',
    '-showResultProfileOnActionBadgeText',
    '-showExternalProfile',
    '-downloadInterval',
    '-monitorWebRequests',
    '-customCss',
    '-exportLegacyRuleList',
    '-showConditionTypes',
    '-builtinProfiles',
  ]);
  const rootUnknown: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (!key.startsWith('+') && !known.has(key)) rootUnknown[key] = value;
  }
  const preservedRoot = safeUnknownFields(rootUnknown, new Set(), '/', state.report);
  if (preservedRoot) extensions['zeroomega/legacy-root'] = preservedRoot;

  const interval = finiteInteger(options['-downloadInterval']);
  return {
    settings: {
      startup: {
        ...(startupRoute === undefined ? {} : { route: startupRoute }),
        revertProxyChanges: legacyBoolean(options['-revertProxyChanges'], true),
      },
      quickSwitch: {
        enabled: legacyBoolean(options['-enableQuickSwitch'], false),
        routes: quickRoutes,
        refreshOnChange: legacyBoolean(options['-refreshOnProfileChange'], false),
      },
      interface: {
        confirmDeletion: legacyBoolean(options['-confirmDeletion'], true),
        showInspectMenu: legacyBoolean(options['-showInspectMenu'], true),
        monitorWebRequests: legacyBoolean(options['-monitorWebRequests'], true),
        addConditionsToBottom: legacyBoolean(options['-addConditionsToBottom'], false),
        showResultProfileOnActionBadgeText: legacyBoolean(
          options['-showResultProfileOnActionBadgeText'],
          false,
        ),
        showExternalProfile: legacyBoolean(options['-showExternalProfile'], true),
        showAdvancedConditions: legacyBoolean(options['-showConditionTypes'], false),
        exportLegacyRuleList: legacyBoolean(options['-exportLegacyRuleList'], false),
        ...(builtInProfiles === undefined ? {} : { builtInProfiles }),
      },
      ruleSourceUpdateIntervalMinutes: interval !== undefined && interval >= 1 ? interval : 1440,
      sync: { backend: 'none' },
    },
    ...(Object.keys(extensions).length === 0 ? {} : { extensions }),
  };
}

function inventoryProfiles(
  options: Readonly<Record<string, unknown>>,
  report: LegacyImportReportBuilder,
): { descriptors: ProfileDescriptor[]; routes: Map<string, ProfileRouteTarget> } {
  const descriptors: ProfileDescriptor[] = [];
  const routes = new Map<string, ProfileRouteTarget>([
    ['direct', { kind: 'direct' }],
    ['system', { kind: 'system' }],
  ]);
  const seen = new Set<string>();

  for (const [key, value] of Object.entries(options)) {
    if (!key.startsWith('+')) continue;
    const path = `/${key}`;
    if (!isRecord(value)) {
      report.add('rejected', 'profile.invalid-record', path, 'Profile entry must be an object.');
      continue;
    }
    const name = stringValue(value.name);
    const profileType = stringValue(value.profileType);
    if (!name || !profileType) {
      report.add(
        'rejected',
        'profile.missing-identity',
        path,
        'Profile name and type are required.',
      );
      continue;
    }
    if (key.slice(1) !== name) {
      report.add(
        'rejected',
        'profile.key-name-mismatch',
        path,
        'Profile key must match the profile name exactly.',
      );
    }
    if (seen.has(name)) {
      report.add(
        'rejected',
        'profile.duplicate-name',
        path,
        `Profile name "${name}" is duplicated.`,
      );
      continue;
    }
    seen.add(name);
    if (!PROFILE_TYPES.has(profileType)) {
      report.add(
        'rejected',
        'profile.unknown-type',
        `${path}/profileType`,
        `Unknown profile type "${profileType}" cannot be activated.`,
      );
      continue;
    }

    if (profileType === 'DirectProfile' || profileType === 'SystemProfile') {
      const route: ProfileRouteTarget =
        profileType === 'DirectProfile' ? { kind: 'direct' } : { kind: 'system' };
      if ((name === 'direct' || name === 'system') && routes.has(name)) {
        routes.set(name, route);
      } else {
        routes.set(name, route);
      }
      report.add(
        'downgraded',
        'profile.builtin-alias',
        path,
        `${profileType} was mapped to the corresponding built-in route; per-alias color cannot remain distinct.`,
      );
      descriptors.push({ key, path, name, profileType, raw: value });
      continue;
    }

    if (name === 'direct' || name === 'system') {
      report.add(
        'rejected',
        'profile.reserved-name',
        path,
        `User profile name "${name}" conflicts with a built-in route.`,
      );
      continue;
    }
    const id = legacyStableId('profile', name);
    routes.set(name, { kind: 'profile', profileId: id });
    descriptors.push({ key, path, name, profileType, id, raw: value });
  }

  return { descriptors, routes };
}

function failureEncoding(input: string | unknown): LegacyInputEncoding {
  if (typeof input !== 'string') return 'object';
  return input.trim().startsWith('{') ? 'json' : 'base64-json';
}

export function importZeroOmegaBackup(
  input: string | unknown,
  context: LegacyImportContext,
  limits: LegacyDecodeLimits = DEFAULT_LEGACY_DECODE_LIMITS,
): LegacyImportResult {
  const decoded = decodeZeroOmegaBackup(input, limits);
  if (!decoded.ok) {
    const report = new LegacyImportReportBuilder(failureEncoding(input));
    decoded.issues.forEach((entry) => {
      report.add('rejected', entry.code, entry.path, entry.message);
    });
    return { ok: false, report: report.build(false, 0, 0, 0) };
  }

  const report = new LegacyImportReportBuilder(decoded.value.encoding);
  if (decoded.value.stats.profileCount === 0) {
    report.add(
      'rejected',
      'profile.none',
      '/',
      'ZeroOmega backup must contain at least one profile.',
    );
  }
  const inventory = inventoryProfiles(decoded.value.options, report);
  const downloadInterval = finiteInteger(decoded.value.options['-downloadInterval']);
  const state: ImportState = {
    report,
    routes: inventory.routes,
    secretMaterials: [],
    endpoints: [],
    ruleSources: [],
    downloadInterval:
      downloadInterval !== undefined && downloadInterval >= 1 ? downloadInterval : 1440,
  };

  const profiles: UserProfile[] = [];
  for (const descriptor of inventory.descriptors) {
    if (descriptor.profileType === 'DirectProfile' || descriptor.profileType === 'SystemProfile')
      continue;
    const profile = mapProfile(descriptor, state);
    if (profile) profiles.push(profile);
  }

  const profileByName = new Map(profiles.map((profile) => [profile.name, profile]));
  for (const profile of profiles) {
    if (profile.kind !== 'switch') continue;
    const attachedName = `__ruleListOf_${profile.name}`;
    const attached = profileByName.get(attachedName);
    if (!attached || attached.kind !== 'rule-list') continue;
    profile.attachedRuleListProfileId = attached.id;
    state.report.add(
      'exact',
      'profile.attached-rule-list-linked',
      `/+${profile.name}/defaultProfileName`,
      `Hidden Rule List "${attachedName}" was linked to its parent Switch profile.`,
    );
  }

  const settingsResult = mapSettings(decoded.value.options, state);
  const documentId =
    context.documentId ??
    legacyStableId('document', ...inventory.descriptors.map((descriptor) => descriptor.name));
  const revisionId =
    context.revisionId ?? legacyStableId('revision', documentId, context.createdAt);
  const candidate: ProfileSpec = {
    schemaVersion: PROFILE_SPEC_SCHEMA_VERSION,
    documentId,
    revision: {
      id: revisionId,
      createdAt: context.createdAt,
      ...(context.deviceId === undefined ? {} : { deviceId: context.deviceId }),
    },
    profiles,
    proxyEndpoints: state.endpoints,
    ruleSources: state.ruleSources,
    settings: settingsResult.settings,
    ...(settingsResult.extensions === undefined ? {} : { extensions: settingsResult.extensions }),
  };

  const validation = validateProfileSpec(candidate);
  for (const item of validation.issues) {
    report.add(
      item.severity === 'warning' ? 'target-dependent' : 'rejected',
      `candidate.${item.code}`,
      `/candidate${item.path === '/' ? '' : item.path}`,
      item.message,
    );
  }

  const finalReport = report.build(
    state.secretMaterials.length > 0,
    profiles.length,
    state.endpoints.length,
    state.ruleSources.length,
  );
  if (report.hasRejections() || !validation.valid) {
    return { ok: false, report: finalReport };
  }
  return {
    ok: true,
    activation: 'inactive-candidate',
    candidate,
    secretMaterials: [...state.secretMaterials],
    report: finalReport,
  };
}
