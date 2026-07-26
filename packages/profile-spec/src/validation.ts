import type { ErrorObject } from 'ajv';

import generatedValidateStructure from './profile-spec-validator.generated.js';

import type {
  Condition,
  JsonValue,
  ProfileRouteTarget,
  ProfileSpec,
  RuleSourceHeader,
  UserProfile,
} from './types.js';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
  severity: ValidationSeverity;
}

export interface ProfileSpecValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  value?: ProfileSpec;
}

type ProfileSpecStructureValidator = ((input: unknown) => input is ProfileSpec) & {
  errors?: readonly ErrorObject[] | null;
};

const validateStructure = generatedValidateStructure as unknown as ProfileSpecStructureValidator;

const SENSITIVE_HEADER_NAME =
  /^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|x-auth-token)$/i;
const SENSITIVE_FIELD_NAME =
  /(^|[-_.])(password|passwd|secret|token|authorization|cookie|api[-_]?key)($|[-_.])/i;
const GENERATED_FIELD_NAME =
  /^(pacScript|ruleList|lastUpdate|sha256|monitorWebRequests|currentProfile|syncStatus)$/i;
const EXTENSION_KEY = /^[a-z0-9][a-z0-9.-]*\/[A-Za-z0-9_.-]+$/;

function issue(
  code: string,
  path: string,
  message: string,
  severity: ValidationSeverity = 'error',
): ValidationIssue {
  return { code, path, message, severity };
}

function structuralIssue(error: ErrorObject): ValidationIssue {
  const suffix =
    error.keyword === 'required' && typeof error.params.missingProperty === 'string'
      ? `/${error.params.missingProperty}`
      : '';
  return issue(
    `schema.${error.keyword}`,
    `${error.instancePath || ''}${suffix}` || '/',
    error.message ?? 'does not satisfy ProfileSpec schema',
  );
}

function addUniqueIssues(
  values: readonly { id: string }[],
  path: string,
  code: string,
  issues: ValidationIssue[],
): void {
  const firstIndex = new Map<string, number>();
  values.forEach((value, index) => {
    const previous = firstIndex.get(value.id);
    if (previous === undefined) {
      firstIndex.set(value.id, index);
      return;
    }
    issues.push(
      issue(code, `${path}/${index}/id`, `ID "${value.id}" duplicates ${path}/${previous}/id`),
    );
  });
}

function validateIsoTimestamp(value: string, path: string, issues: ValidationIssue[]): void {
  if (!Number.isFinite(Date.parse(value)) || !/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    issues.push(issue('revision.invalid-timestamp', path, 'must be an ISO-8601 timestamp'));
  }
}

function validateHost(value: string, path: string, issues: ValidationIssue[]): void {
  if (value !== value.trim() || /[\s/@?#]/.test(value)) {
    issues.push(issue('endpoint.invalid-host', path, 'must be a bare hostname or IP address'));
    return;
  }

  const unwrapped =
    value.startsWith('[') && value.endsWith(']') ? value.slice(1, value.length - 1) : value;
  const candidate = unwrapped.includes(':') ? `http://[${unwrapped}]/` : `http://${unwrapped}/`;

  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname) {
      throw new Error('empty hostname');
    }
  } catch {
    issues.push(issue('endpoint.invalid-host', path, 'must be a valid hostname, IPv4, or IPv6'));
  }
}

function ipv4(value: string): boolean {
  const parts = value.split('.');
  return (
    parts.length === 4 &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
  );
}

function ipv6(value: string): boolean {
  if (!value.includes(':') || value.startsWith('[') || value.endsWith(']')) {
    return false;
  }
  try {
    const parsed = new URL(`http://[${value}]/`);
    return parsed.hostname.length > 2;
  } catch {
    return false;
  }
}

function validateUrl(
  value: string,
  path: string,
  allowedProtocols: readonly string[],
  issues: ValidationIssue[],
): void {
  try {
    const parsed = new URL(value);
    if (!allowedProtocols.includes(parsed.protocol)) {
      issues.push(
        issue(
          'source.unsupported-protocol',
          path,
          `protocol ${parsed.protocol} is not allowed; expected ${allowedProtocols.join(', ')}`,
        ),
      );
    }
  } catch {
    issues.push(issue('source.invalid-url', path, 'must be an absolute URL'));
  }
}

function validateCondition(condition: Condition, path: string, issues: ValidationIssue[]): void {
  switch (condition.kind) {
    case 'true':
    case 'false':
      return;
    case 'url-regex':
    case 'host-regex':
      if (!condition.pattern) {
        issues.push(issue('condition.empty-pattern', `${path}/pattern`, 'must not be empty'));
        return;
      }
      try {
        new RegExp(condition.pattern, condition.flags);
      } catch (error) {
        issues.push(
          issue(
            'condition.invalid-regex',
            `${path}/pattern`,
            error instanceof Error ? error.message : 'invalid regular expression',
          ),
        );
      }
      return;
    case 'url-wildcard':
    case 'host-wildcard':
    case 'bypass':
    case 'keyword':
      if (!condition.pattern) {
        issues.push(issue('condition.empty-pattern', `${path}/pattern`, 'must not be empty'));
      }
      return;
    case 'ip': {
      const version = ipv4(condition.address) ? 4 : ipv6(condition.address) ? 6 : 0;
      if (version === 0) {
        issues.push(
          issue('condition.invalid-ip', `${path}/address`, 'must be an unbracketed IPv4 or IPv6'),
        );
        return;
      }
      const maxPrefix = version === 4 ? 32 : 128;
      if (condition.prefixLength > maxPrefix) {
        issues.push(
          issue(
            'condition.invalid-prefix',
            `${path}/prefixLength`,
            `must be between 0 and ${maxPrefix} for IPv${version}`,
          ),
        );
      }
      return;
    }
    case 'host-levels':
      if (condition.min > condition.max) {
        issues.push(
          issue('condition.invalid-range', path, 'host-level minimum must not exceed maximum'),
        );
      }
      return;
    case 'weekday':
      if (new Set(condition.days).size !== condition.days.length) {
        issues.push(issue('condition.duplicate-weekday', `${path}/days`, 'days must be unique'));
      }
      return;
    case 'time':
      return;
  }
}

function routeProfileId(route: ProfileRouteTarget | undefined): string | undefined {
  return route?.kind === 'profile' ? route.profileId : undefined;
}

function profileRoutes(profile: UserProfile): ProfileRouteTarget[] {
  switch (profile.kind) {
    case 'fixed':
      return [];
    case 'switch':
      return [profile.defaultRoute, ...profile.rules.map((rule) => rule.route)];
    case 'rule-list':
      return [profile.matchRoute, profile.defaultRoute];
    case 'pac':
    case 'auto-detect':
      return profile.fallbackRoute ? [profile.fallbackRoute] : [];
    case 'virtual':
      return [profile.targetRoute];
  }
}

function validateExtensions(
  extensions: Record<string, JsonValue> | undefined,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!extensions) {
    return;
  }

  for (const [key, value] of Object.entries(extensions)) {
    if (!EXTENSION_KEY.test(key)) {
      issues.push(
        issue(
          'extensions.not-namespaced',
          `${path}/${key}`,
          'extension keys must use the namespace/name form',
        ),
      );
    }
    inspectOpaqueValue(value, `${path}/${key}`, issues);
  }
}

function inspectOpaqueValue(value: JsonValue, path: string, issues: ValidationIssue[]): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspectOpaqueValue(entry, `${path}/${index}`, issues));
    return;
  }
  if (value === null || typeof value !== 'object') {
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_FIELD_NAME.test(key)) {
      issues.push(
        issue(
          'extensions.secret-field',
          `${path}/${key}`,
          'secret-like fields are forbidden in ProfileSpec extension metadata',
        ),
      );
    }
    if (GENERATED_FIELD_NAME.test(key)) {
      issues.push(
        issue(
          'extensions.generated-field',
          `${path}/${key}`,
          'generated or runtime fields are forbidden in ProfileSpec extension metadata',
        ),
      );
    }
    inspectOpaqueValue(nested, `${path}/${key}`, issues);
  }
}

function validateHeaders(
  headers: readonly RuleSourceHeader[] | undefined,
  path: string,
  issues: ValidationIssue[],
): void {
  const headerNames = new Set<string>();
  headers?.forEach((header, headerIndex) => {
    const normalizedName = header.name.trim().toLowerCase();
    if (headerNames.has(normalizedName)) {
      issues.push(
        issue(
          'source.duplicate-header',
          `${path}/${headerIndex}/name`,
          `header "${header.name}" is duplicated`,
        ),
      );
    }
    headerNames.add(normalizedName);
    if (header.value.kind === 'literal' && SENSITIVE_HEADER_NAME.test(normalizedName)) {
      issues.push(
        issue(
          'source.sensitive-literal-header',
          `${path}/${headerIndex}/value`,
          `header "${header.name}" must use a secret reference`,
        ),
      );
    }
  });
}

function validateSync(spec: ProfileSpec, issues: ValidationIssue[]): void {
  const sync = spec.settings.sync;
  if (!sync) {
    return;
  }

  if (sync.backend === 'none' || sync.backend === 'browser') {
    if (
      sync.remoteUri !== undefined ||
      sync.username !== undefined ||
      sync.secretRef !== undefined
    ) {
      issues.push(
        issue(
          'sync.unexpected-remote-fields',
          '/settings/sync',
          `${sync.backend} sync must not contain remote credentials`,
        ),
      );
    }
    return;
  }

  if (!sync.remoteUri) {
    issues.push(issue('sync.missing-uri', '/settings/sync/remoteUri', 'remote URI is required'));
  } else {
    validateUrl(sync.remoteUri, '/settings/sync/remoteUri', ['https:'], issues);
  }

  if (!sync.secretRef) {
    issues.push(
      issue('sync.missing-secret-ref', '/settings/sync/secretRef', 'secret reference is required'),
    );
  }
}

function validateCycles(spec: ProfileSpec, issues: ValidationIssue[]): void {
  const graph = new Map<string, string[]>();
  for (const profile of spec.profiles) {
    graph.set(
      profile.id,
      profileRoutes(profile)
        .map(routeProfileId)
        .filter((id): id is string => id !== undefined),
    );
  }

  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];
  const reported = new Set<string>();

  const visit = (id: string): void => {
    const current = state.get(id);
    if (current === 'visited') {
      return;
    }
    if (current === 'visiting') {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      const signature = cycle.join('>');
      if (!reported.has(signature)) {
        reported.add(signature);
        issues.push(
          issue(
            'profile.reference-cycle',
            '/profiles',
            `profile reference cycle detected: ${cycle.join(' -> ')}`,
          ),
        );
      }
      return;
    }

    state.set(id, 'visiting');
    stack.push(id);
    for (const target of graph.get(id) ?? []) {
      if (graph.has(target)) {
        visit(target);
      }
    }
    stack.pop();
    state.set(id, 'visited');
  };

  for (const profile of spec.profiles) {
    visit(profile.id);
  }
}

export function validateProfileSpec(input: unknown): ProfileSpecValidationResult {
  if (!validateStructure(input)) {
    return {
      valid: false,
      issues: (validateStructure.errors ?? []).map(structuralIssue),
    };
  }

  const spec = input;
  const issues: ValidationIssue[] = [];
  const profileIds = new Set(spec.profiles.map((profile) => profile.id));
  const endpointIds = new Set(spec.proxyEndpoints.map((endpoint) => endpoint.id));
  const sourceIds = new Set(spec.ruleSources.map((source) => source.id));

  validateIsoTimestamp(spec.revision.createdAt, '/revision/createdAt', issues);
  addUniqueIssues(spec.profiles, '/profiles', 'profile.duplicate-id', issues);
  addUniqueIssues(spec.proxyEndpoints, '/proxyEndpoints', 'endpoint.duplicate-id', issues);
  addUniqueIssues(spec.ruleSources, '/ruleSources', 'source.duplicate-id', issues);

  const profileNames = new Map<string, number>();
  spec.profiles.forEach((profile, profileIndex) => {
    const previous = profileNames.get(profile.name);
    if (previous !== undefined) {
      issues.push(
        issue(
          'profile.duplicate-name',
          `/profiles/${profileIndex}/name`,
          `name "${profile.name}" duplicates /profiles/${previous}/name`,
        ),
      );
    } else {
      profileNames.set(profile.name, profileIndex);
    }

    validateExtensions(profile.extensions, `/profiles/${profileIndex}/extensions`, issues);
    if (profile.legacy?.fields) {
      inspectOpaqueValue(profile.legacy.fields, `/profiles/${profileIndex}/legacy/fields`, issues);
    }

    if (profile.kind === 'fixed') {
      const references = Object.entries(profile.proxyByScheme);
      for (const [scheme, endpointId] of references) {
        if (!endpointIds.has(endpointId)) {
          issues.push(
            issue(
              'endpoint.missing-reference',
              `/profiles/${profileIndex}/proxyByScheme/${scheme}`,
              `proxy endpoint "${endpointId}" does not exist`,
            ),
          );
        }
      }
      addUniqueIssues(
        profile.bypass,
        `/profiles/${profileIndex}/bypass`,
        'bypass.duplicate-id',
        issues,
      );
      profile.bypass.forEach((entry, bypassIndex) => {
        if (!entry.pattern) {
          issues.push(
            issue(
              'bypass.empty-pattern',
              `/profiles/${profileIndex}/bypass/${bypassIndex}/pattern`,
              'must not be empty',
            ),
          );
        }
      });
    }

    if (profile.kind === 'switch') {
      addUniqueIssues(
        profile.rules,
        `/profiles/${profileIndex}/rules`,
        'rule.duplicate-id',
        issues,
      );
      profile.rules.forEach((rule, ruleIndex) => {
        validateCondition(
          rule.condition,
          `/profiles/${profileIndex}/rules/${ruleIndex}/condition`,
          issues,
        );
      });
    }

    if (profile.kind === 'rule-list' && !sourceIds.has(profile.sourceId)) {
      issues.push(
        issue(
          'source.missing-reference',
          `/profiles/${profileIndex}/sourceId`,
          `rule source "${profile.sourceId}" does not exist`,
        ),
      );
    }

    for (const route of profileRoutes(profile)) {
      const targetId = routeProfileId(route);
      if (targetId && !profileIds.has(targetId)) {
        issues.push(
          issue(
            'profile.missing-reference',
            `/profiles/${profileIndex}`,
            `referenced profile "${targetId}" does not exist`,
          ),
        );
      }
    }

    if (profile.kind === 'pac') {
      validateHeaders(profile.headers, `/profiles/${profileIndex}/headers`, issues);
      if (profile.source.kind === 'url') {
        validateUrl(
          profile.source.url,
          `/profiles/${profileIndex}/source/url`,
          ['http:', 'https:', 'file:'],
          issues,
        );
        if (profile.source.url.startsWith('file:')) {
          issues.push(
            issue(
              'profile.target-dependent-file-pac',
              `/profiles/${profileIndex}/source/url`,
              'file PAC support depends on browser permissions and target capabilities',
              'warning',
            ),
          );
        }
      }
    }
  });

  spec.proxyEndpoints.forEach((endpoint, endpointIndex) => {
    validateHost(endpoint.host, `/proxyEndpoints/${endpointIndex}/host`, issues);
    validateExtensions(endpoint.extensions, `/proxyEndpoints/${endpointIndex}/extensions`, issues);
  });

  spec.ruleSources.forEach((source, sourceIndex) => {
    validateExtensions(source.extensions, `/ruleSources/${sourceIndex}/extensions`, issues);
    if (source.location.kind === 'url') {
      validateUrl(
        source.location.url,
        `/ruleSources/${sourceIndex}/location/url`,
        ['http:', 'https:', 'file:'],
        issues,
      );
    }

    validateHeaders(source.headers, `/ruleSources/${sourceIndex}/headers`, issues);
  });

  spec.settings.quickSwitch.routes.forEach((route, routeIndex) => {
    const profileId = routeProfileId(route);
    if (profileId && !profileIds.has(profileId)) {
      issues.push(
        issue(
          'profile.missing-quick-switch-reference',
          `/settings/quickSwitch/routes/${routeIndex}`,
          `quick-switch profile "${profileId}" does not exist`,
        ),
      );
    }
  });

  const startupProfileId = routeProfileId(spec.settings.startup.route);
  if (startupProfileId && !profileIds.has(startupProfileId)) {
    issues.push(
      issue(
        'profile.missing-startup-reference',
        '/settings/startup/route',
        `startup profile "${startupProfileId}" does not exist`,
      ),
    );
  }

  validateSync(spec, issues);
  validateExtensions(spec.extensions, '/extensions', issues);
  validateCycles(spec, issues);

  const valid = issues.every((entry) => entry.severity !== 'error');
  return valid ? { valid, issues, value: spec } : { valid, issues };
}
