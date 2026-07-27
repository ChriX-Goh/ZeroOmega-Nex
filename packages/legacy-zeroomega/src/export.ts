import {
  validateProfileSpec,
  type BypassEntry,
  type Condition,
  type FixedProfile,
  type JsonValue,
  type PacProfile,
  type ProfileRouteTarget,
  type ProfileSpec,
  type ProxyEndpoint,
  type RuleListProfile,
  type RuleSource,
  type RuleSourceHeader,
  type SwitchProfile,
  type SwitchRule,
  type UserProfile,
  type VirtualProfile,
  type Weekday,
} from '@zeroomega-nex/profile-spec';

export const ZEROOMEGA_BACKUP_MIME_TYPE = 'text/plain;charset=utf-8' as const;
export const ZEROOMEGA_BACKUP_SCHEMA_VERSION = 2 as const;

export interface LegacyExportIssue {
  readonly severity: 'warning' | 'error';
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface LegacyExportContext {
  readonly createdAt?: string | Date;
}

export type LegacyExportResult =
  | {
      readonly ok: true;
      readonly options: Readonly<Record<string, JsonValue>>;
      readonly content: string;
      readonly filename: string;
      readonly mimeType: typeof ZEROOMEGA_BACKUP_MIME_TYPE;
      readonly issues: readonly LegacyExportIssue[];
      readonly omittedSecretCount: number;
    }
  | {
      readonly ok: false;
      readonly issues: readonly LegacyExportIssue[];
    };

const SENSITIVE_HEADER_NAME =
  /(authorization|cookie|token|secret|api[-_]?key|proxy-auth|credential)/i;
const RISK_FIELD_NAME =
  /(^|[-_.])(password|passwd|secret|token|authorization|cookie|auth)($|[-_.])/i;
const RULE_LIST_PROFILE_TYPES = new Set([
  'RuleListProfile',
  'SwitchyRuleListProfile',
  'AutoProxyRuleListProfile',
]);
const WEEKDAYS: readonly Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEKDAY_MASK = 'SMTWtFs';

type MutableJsonObject = Record<string, JsonValue>;

interface ExportState {
  readonly spec: ProfileSpec;
  readonly profileById: Map<string, UserProfile>;
  readonly endpointById: Map<string, ProxyEndpoint>;
  readonly sourceById: Map<string, RuleSource>;
  readonly issues: LegacyExportIssue[];
  omittedSecretCount: number;
}

function issue(
  state: ExportState,
  severity: LegacyExportIssue['severity'],
  code: string,
  path: string,
  message: string,
): void {
  state.issues.push({ severity, code, path, message });
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function containsRisk(value: JsonValue): boolean {
  if (Array.isArray(value)) return value.some(containsRisk);
  if (value === null || typeof value !== 'object') return false;
  return Object.entries(value).some(
    ([key, nested]) => RISK_FIELD_NAME.test(key) || containsRisk(nested),
  );
}

function mergeSafeMetadata(
  state: ExportState,
  target: MutableJsonObject,
  fields: Record<string, JsonValue> | undefined,
  path: string,
): void {
  if (!fields) return;
  for (const [key, value] of Object.entries(fields)) {
    if (key in target) continue;
    if (RISK_FIELD_NAME.test(key) || containsRisk(value)) {
      issue(
        state,
        'warning',
        'metadata.secret-like-omitted',
        `${path}/${key}`,
        'Secret-like legacy metadata was omitted from the ordinary backup.',
      );
      state.omittedSecretCount += 1;
      continue;
    }
    target[key] = structuredClone(value);
  }
}

function routeName(state: ExportState, route: ProfileRouteTarget, path: string): string {
  if (route.kind === 'direct' || route.kind === 'system') return route.kind;
  const profile = state.profileById.get(route.profileId);
  if (profile) return profile.name;
  issue(
    state,
    'error',
    'route.missing-profile',
    path,
    `Referenced profile ${route.profileId} does not exist.`,
  );
  return 'direct';
}

function profileType(profile: UserProfile): string {
  const legacy = profile.legacy?.profileType;
  switch (profile.kind) {
    case 'fixed':
      return 'FixedProfile';
    case 'switch':
      return 'SwitchProfile';
    case 'rule-list':
      return legacy && RULE_LIST_PROFILE_TYPES.has(legacy) ? legacy : 'RuleListProfile';
    case 'pac':
      return 'PacProfile';
    case 'auto-detect':
      return 'AutoDetectProfile';
    case 'virtual':
      return 'VirtualProfile';
  }
}

function profileBase(state: ExportState, profile: UserProfile, path: string): MutableJsonObject {
  const result: MutableJsonObject = {
    name: profile.name,
    profileType: profileType(profile),
    revision: profile.legacy?.revision ?? state.spec.revision.id,
  };
  if (profile.color !== undefined) result.color = profile.color;
  if (profile.enabled === false) {
    result.enabled = false;
    issue(
      state,
      'warning',
      'profile.disabled-nex-extension',
      `${path}/enabled`,
      'Disabled state is stored as a Nex extension field; original v3.5.0 ignores it.',
    );
  }
  mergeSafeMetadata(state, result, profile.legacy?.fields, path);
  if (profile.extensions && Object.keys(profile.extensions).length > 0) {
    issue(
      state,
      'warning',
      'profile.extensions-omitted',
      `${path}/extensions`,
      'Nex-only profile extensions are not part of the original Options schema.',
    );
  }
  return result;
}

function legacyEndpoint(state: ExportState, endpointId: string, path: string): MutableJsonObject {
  const endpoint = state.endpointById.get(endpointId);
  if (!endpoint) {
    issue(
      state,
      'error',
      'endpoint.missing',
      path,
      `Referenced proxy endpoint ${endpointId} does not exist.`,
    );
    return { scheme: 'http', host: '', port: 80 };
  }
  if (endpoint.credential) {
    issue(
      state,
      'warning',
      'secret.proxy-credential-omitted',
      `${path}/auth`,
      `Credentials for ${endpoint.name} were omitted from the ordinary backup.`,
    );
    state.omittedSecretCount += 1;
  }
  if (endpoint.extensions && Object.keys(endpoint.extensions).length > 0) {
    issue(
      state,
      'warning',
      'endpoint.extensions-omitted',
      `${path}/extensions`,
      'Nex-only endpoint extensions are not part of the original Options schema.',
    );
  }
  return { scheme: endpoint.protocol, host: endpoint.host, port: endpoint.port };
}

function legacyBypass(state: ExportState, entry: BypassEntry, path: string): MutableJsonObject {
  const result: MutableJsonObject = {
    conditionType: 'BypassCondition',
    pattern: entry.pattern,
  };
  if (entry.enabled === false) {
    result.enabled = false;
    issue(
      state,
      'warning',
      'bypass.disabled-nex-extension',
      `${path}/enabled`,
      'Disabled bypass state is stored as a Nex extension field; original v3.5.0 ignores it.',
    );
  }
  if (entry.note !== undefined) result.note = entry.note;
  return result;
}

function legacyCondition(
  state: ExportState,
  condition: Condition,
  path: string,
): MutableJsonObject {
  switch (condition.kind) {
    case 'true':
      return { conditionType: 'TrueCondition' };
    case 'false':
      return {
        conditionType: 'FalseCondition',
        ...(condition.annotation === undefined ? {} : { pattern: condition.annotation }),
      };
    case 'url-regex':
    case 'host-regex': {
      const result: MutableJsonObject = {
        conditionType:
          condition.kind === 'url-regex' ? 'UrlRegexCondition' : 'HostRegexCondition',
        pattern: condition.pattern,
      };
      if (condition.flags) {
        result.flags = condition.flags;
        issue(
          state,
          'warning',
          'condition.regex-flags-nex-extension',
          `${path}/flags`,
          'Regular-expression flags are stored as a Nex extension field; original v3.5.0 ignores them.',
        );
      }
      return result;
    }
    case 'url-wildcard':
      return { conditionType: 'UrlWildcardCondition', pattern: condition.pattern };
    case 'host-wildcard':
      return { conditionType: 'HostWildcardCondition', pattern: condition.pattern };
    case 'bypass':
      return { conditionType: 'BypassCondition', pattern: condition.pattern };
    case 'keyword':
      return { conditionType: 'KeywordCondition', pattern: condition.pattern };
    case 'ip':
      return {
        conditionType: 'IpCondition',
        ip: condition.address,
        prefixLength: condition.prefixLength,
      };
    case 'host-levels':
      return {
        conditionType: 'HostLevelsCondition',
        minValue: condition.min,
        maxValue: condition.max,
      };
    case 'weekday':
      return {
        conditionType: 'WeekdayCondition',
        days: WEEKDAYS.map((day, index) =>
          condition.days.includes(day) ? WEEKDAY_MASK[index] : '-',
        ).join(''),
      };
    case 'time':
      return {
        conditionType: 'TimeCondition',
        startHour: condition.startHour,
        endHour: condition.endHour,
      };
  }
}

function legacyRule(state: ExportState, rule: SwitchRule, path: string): MutableJsonObject {
  const result: MutableJsonObject = {
    condition: legacyCondition(state, rule.condition, `${path}/condition`),
    profileName: routeName(state, rule.route, `${path}/profileName`),
  };
  if (rule.note !== undefined) result.note = rule.note;
  if (rule.enabled === false) {
    result.enabled = false;
    issue(
      state,
      'warning',
      'switch-rule.disabled-nex-extension',
      `${path}/enabled`,
      'Disabled rule state is stored as a Nex extension field; original v3.5.0 ignores it.',
    );
  }
  mergeSafeMetadata(state, result, rule.legacy?.fields, path);
  return result;
}

function legacyHeaders(
  state: ExportState,
  headers: readonly RuleSourceHeader[] | undefined,
  path: string,
): JsonValue[] | undefined {
  if (!headers || headers.length === 0) return undefined;
  const result: JsonValue[] = [];
  headers.forEach((header, index) => {
    const headerPath = `${path}/${index}`;
    if (header.value.kind === 'secret' || SENSITIVE_HEADER_NAME.test(header.name)) {
      issue(
        state,
        'warning',
        'secret.request-header-omitted',
        headerPath,
        `Sensitive header ${header.name} was omitted from the ordinary backup.`,
      );
      state.omittedSecretCount += 1;
      return;
    }
    result.push({ name: header.name, value: header.value.value });
  });
  return result.length === 0 ? undefined : result;
}

function exportFixed(
  state: ExportState,
  profile: FixedProfile,
  path: string,
): MutableJsonObject {
  const result = profileBase(state, profile, path);
  const slots = [
    ['fallback', 'fallbackProxy'],
    ['http', 'proxyForHttp'],
    ['https', 'proxyForHttps'],
    ['ftp', 'proxyForFtp'],
  ] as const;
  for (const [slot, legacyName] of slots) {
    const endpointId = profile.proxyByScheme[slot];
    if (endpointId) result[legacyName] = legacyEndpoint(state, endpointId, `${path}/${legacyName}`);
  }
  result.bypassList = profile.bypass.map((entry, index) =>
    legacyBypass(state, entry, `${path}/bypassList/${index}`),
  );
  return result;
}

function exportSwitch(
  state: ExportState,
  profile: SwitchProfile,
  path: string,
): MutableJsonObject {
  const result = profileBase(state, profile, path);
  result.rules = profile.rules.map((rule, index) =>
    legacyRule(state, rule, `${path}/rules/${index}`),
  );
  result.defaultProfileName = routeName(
    state,
    profile.defaultRoute,
    `${path}/defaultProfileName`,
  );
  return result;
}

function exportRuleList(
  state: ExportState,
  profile: RuleListProfile,
  path: string,
): MutableJsonObject {
  const result = profileBase(state, profile, path);
  const source = state.sourceById.get(profile.sourceId);
  if (!source) {
    issue(
      state,
      'error',
      'rule-source.missing',
      `${path}/sourceId`,
      `Referenced Rule Source ${profile.sourceId} does not exist.`,
    );
    result.format = 'AutoProxy';
    result.ruleList = '';
  } else {
    result.format = source.format === 'switchy' ? 'Switchy' : 'AutoProxy';
    if (source.location.kind === 'url') {
      result.sourceUrl = source.location.url;
      if (source.location.content !== undefined) result.ruleList = source.location.content;
    } else {
      result.ruleList = source.location.content;
    }
    const headers = legacyHeaders(state, source.headers, `${path}/headers`);
    if (headers) result.headers = headers;
    if (
      source.updateIntervalMinutes !== undefined &&
      source.updateIntervalMinutes !== state.spec.settings.ruleSourceUpdateIntervalMinutes
    ) {
      result.updateIntervalMinutes = source.updateIntervalMinutes;
      issue(
        state,
        'warning',
        'rule-source.interval-nex-extension',
        `${path}/updateIntervalMinutes`,
        'Per-source update interval is stored as a Nex extension field; original v3.5.0 uses the global interval.',
      );
    }
  }
  result.matchProfileName = routeName(state, profile.matchRoute, `${path}/matchProfileName`);
  result.defaultProfileName = routeName(
    state,
    profile.defaultRoute,
    `${path}/defaultProfileName`,
  );
  return result;
}

function exportPac(state: ExportState, profile: PacProfile, path: string): MutableJsonObject {
  const result = profileBase(state, profile, path);
  if (profile.source.kind === 'url') result.pacUrl = profile.source.url;
  else result.pacScript = profile.source.script;
  const headers = legacyHeaders(state, profile.headers, `${path}/headers`);
  if (headers) result.headers = headers;
  if (profile.fallbackRoute) {
    result.fallbackProfileName = routeName(
      state,
      profile.fallbackRoute,
      `${path}/fallbackProfileName`,
    );
    issue(
      state,
      'warning',
      'pac.fallback-nex-extension',
      `${path}/fallbackProfileName`,
      'PAC fallback route is stored as a Nex extension field; original v3.5.0 ignores it.',
    );
  }
  return result;
}

function exportVirtual(
  state: ExportState,
  profile: VirtualProfile,
  path: string,
): MutableJsonObject {
  const result = profileBase(state, profile, path);
  result.defaultProfileName = routeName(
    state,
    profile.targetRoute,
    `${path}/defaultProfileName`,
  );
  const legacyRules = profile.legacy?.fields?.rules;
  if (Array.isArray(legacyRules)) result.rules = structuredClone(legacyRules);
  return result;
}

function exportProfile(state: ExportState, profile: UserProfile, path: string): MutableJsonObject {
  switch (profile.kind) {
    case 'fixed':
      return exportFixed(state, profile, path);
    case 'switch':
      return exportSwitch(state, profile, path);
    case 'rule-list':
      return exportRuleList(state, profile, path);
    case 'pac':
      return exportPac(state, profile, path);
    case 'auto-detect':
      return profileBase(state, profile, path);
    case 'virtual':
      return exportVirtual(state, profile, path);
  }
}

function timestamp(value: string | Date | undefined): string {
  const date = value === undefined ? new Date() : value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError('Backup timestamp is invalid.');
  return date.toISOString();
}

export function zeroOmegaBackupFilename(value?: string | Date): string {
  return `ZeroOmegaOptions-${timestamp(value)}.bak`;
}

export function exportZeroOmegaBackup(
  spec: ProfileSpec,
  context: LegacyExportContext = {},
): LegacyExportResult {
  const validation = validateProfileSpec(spec);
  const issues: LegacyExportIssue[] = validation.issues
    .filter((entry) => entry.severity === 'error')
    .map((entry) => ({
      severity: 'error',
      code: `profile-spec.${entry.code}`,
      path: entry.path,
      message: entry.message,
    }));
  if (issues.length > 0) return { ok: false, issues };

  const state: ExportState = {
    spec,
    profileById: new Map(spec.profiles.map((profile) => [profile.id, profile])),
    endpointById: new Map(spec.proxyEndpoints.map((endpoint) => [endpoint.id, endpoint])),
    sourceById: new Map(spec.ruleSources.map((source) => [source.id, source])),
    issues,
    omittedSecretCount: 0,
  };
  const options: MutableJsonObject = {
    schemaVersion: ZEROOMEGA_BACKUP_SCHEMA_VERSION,
    '-enableQuickSwitch': spec.settings.quickSwitch.enabled,
    '-refreshOnProfileChange': spec.settings.quickSwitch.refreshOnChange,
    '-startupProfileName': spec.settings.startup.route
      ? routeName(state, spec.settings.startup.route, '/-startupProfileName')
      : '',
    '-quickSwitchProfiles': spec.settings.quickSwitch.routes.map((route, index) =>
      routeName(state, route, `/-quickSwitchProfiles/${index}`),
    ),
    '-revertProxyChanges': spec.settings.startup.revertProxyChanges,
    '-confirmDeletion': spec.settings.interface.confirmDeletion,
    '-showInspectMenu': spec.settings.interface.showInspectMenu,
    '-monitorWebRequests': spec.settings.interface.monitorWebRequests ?? true,
    '-addConditionsToBottom': spec.settings.interface.addConditionsToBottom,
    '-showResultProfileOnActionBadgeText':
      spec.settings.interface.showResultProfileOnActionBadgeText,
    '-showExternalProfile': spec.settings.interface.showExternalProfile,
    '-showConditionTypes': spec.settings.interface.showAdvancedConditions,
    '-exportLegacyRuleList': spec.settings.interface.exportLegacyRuleList,
    '-downloadInterval': spec.settings.ruleSourceUpdateIntervalMinutes,
  };

  const builtIn = spec.settings.interface.builtInProfiles;
  if (builtIn?.direct?.color || builtIn?.system?.color) {
    options['-builtinProfiles'] = {
      '+direct': {
        name: 'direct',
        profileType: 'DirectProfile',
        ...(builtIn.direct?.color ? { color: builtIn.direct.color } : {}),
      },
      '+system': {
        name: 'system',
        profileType: 'SystemProfile',
        ...(builtIn.system?.color ? { color: builtIn.system.color } : {}),
      },
    };
  }

  const customCss = spec.extensions?.['zeroomega/custom-css'];
  if (typeof customCss === 'string') options['-customCss'] = customCss;
  const legacyRoot = spec.extensions?.['zeroomega/legacy-root'];
  if (isRecord(legacyRoot)) mergeSafeMetadata(state, options, legacyRoot, '');
  if (spec.settings.sync && spec.settings.sync.backend !== 'none') {
    issue(
      state,
      'warning',
      'sync.settings-omitted',
      '/settings/sync',
      'Nex sync credentials and backend state are not included in ordinary backups.',
    );
  }

  for (const profile of spec.profiles) {
    const key = `+${profile.name}`;
    options[key] = exportProfile(state, profile, `/${key}`);
  }

  if (state.issues.some((entry) => entry.severity === 'error')) {
    return { ok: false, issues: [...state.issues] };
  }
  const createdAt = timestamp(context.createdAt);
  return {
    ok: true,
    options,
    content: JSON.stringify(options),
    filename: zeroOmegaBackupFilename(createdAt),
    mimeType: ZEROOMEGA_BACKUP_MIME_TYPE,
    issues: [...state.issues],
    omittedSecretCount: state.omittedSecretCount,
  };
}
