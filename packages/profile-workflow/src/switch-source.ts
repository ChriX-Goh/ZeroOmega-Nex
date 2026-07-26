import {
  cloneProfileSpecDraft,
  validateProfileSpecDraft,
  type Condition,
  type ProfileRouteTarget,
  type ProfileSpec,
  type RuleListProfile,
  type SwitchProfile,
  type SwitchRule,
  type Weekday,
} from '@zeroomega-nex/profile-spec';

import type { ProfileWorkflowIdFactory } from './profile-operations.js';

const HEADER = '[SwitchyOmega Conditions]';
const WITH_RESULT = '@with result';
const SPECIAL_HOST_PREFIXES = new Set(['[', ';', '#', '@', '!', '+']);
const WEEKDAY_MARKERS = 'SMTWtFs';
const WEEKDAYS: readonly Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const CONDITION_TYPES: Readonly<Record<string, Condition['kind']>> = Object.freeze({
  '': 'host-wildcard',
  H: 'host-wildcard',
  W: 'host-wildcard',
  HW: 'host-wildcard',
  WILD: 'host-wildcard',
  WILDCARD: 'host-wildcard',
  HOST: 'host-wildcard',
  HOSTW: 'host-wildcard',
  HWILD: 'host-wildcard',
  HWILDCARD: 'host-wildcard',
  HOSTWILD: 'host-wildcard',
  HOSTWILDCARD: 'host-wildcard',
  R: 'host-regex',
  HR: 'host-regex',
  REGEX: 'host-regex',
  HOSTR: 'host-regex',
  HREGEX: 'host-regex',
  HOSTREGEX: 'host-regex',
  U: 'url-wildcard',
  UW: 'url-wildcard',
  URL: 'url-wildcard',
  URLW: 'url-wildcard',
  UWILD: 'url-wildcard',
  UWILDCARD: 'url-wildcard',
  URLWILD: 'url-wildcard',
  URLWILDCARD: 'url-wildcard',
  UR: 'url-regex',
  UREGEX: 'url-regex',
  URLR: 'url-regex',
  URLREGEX: 'url-regex',
  B: 'bypass',
  BYPASS: 'bypass',
  K: 'keyword',
  KW: 'keyword',
  KEYWORD: 'keyword',
  IP: 'ip',
  LV: 'host-levels',
  LEVEL: 'host-levels',
  LEVELS: 'host-levels',
  HL: 'host-levels',
  HLV: 'host-levels',
  HLEVEL: 'host-levels',
  HLEVELS: 'host-levels',
  HOSTL: 'host-levels',
  HOSTLV: 'host-levels',
  HOSTLEVEL: 'host-levels',
  HOSTLEVELS: 'host-levels',
  WD: 'weekday',
  WEEK: 'weekday',
  DAY: 'weekday',
  WEEKDAY: 'weekday',
  T: 'time',
  TIME: 'time',
  HOUR: 'time',
  TRUE: 'true',
  FALSE: 'false',
  DISABLED: 'false',
});

export interface SwitchSourceError {
  readonly code: string;
  readonly message: string;
  readonly line?: number;
  readonly source?: string;
}

export type SwitchSourceComposeResult =
  | { readonly ok: true; readonly source: string }
  | { readonly ok: false; readonly error: SwitchSourceError };

export type SwitchSourceParseResult =
  | { readonly ok: true; readonly draft: ProfileSpec }
  | { readonly ok: false; readonly error: SwitchSourceError };

interface ParsedSourceLine {
  readonly line: number;
  readonly source: string;
  readonly conditionSource: string;
  readonly routeName?: string;
  readonly usesDefaultRoute: boolean;
  readonly note?: string;
}

function error(
  code: string,
  message: string,
  details: { readonly line?: number; readonly source?: string } = {},
): SwitchSourceError {
  return { code, message, ...details };
}

function findSwitchProfile(spec: ProfileSpec, profileId: string): SwitchProfile | undefined {
  return spec.profiles.find(
    (candidate): candidate is SwitchProfile =>
      candidate.id === profileId && candidate.kind === 'switch',
  );
}

function attachedRuleListProfile(
  spec: ProfileSpec,
  profile: SwitchProfile,
): RuleListProfile | undefined {
  if (profile.attachedRuleListProfileId === undefined) return undefined;
  return spec.profiles.find(
    (candidate): candidate is RuleListProfile =>
      candidate.id === profile.attachedRuleListProfileId && candidate.kind === 'rule-list',
  );
}

function routeTargetsProfile(route: ProfileRouteTarget, profileId: string): boolean {
  return route.kind === 'profile' && route.profileId === profileId;
}

function sourceDefaultRoute(spec: ProfileSpec, profile: SwitchProfile): ProfileRouteTarget {
  const attached = attachedRuleListProfile(spec, profile);
  return attached && routeTargetsProfile(profile.defaultRoute, attached.id)
    ? attached.defaultRoute
    : profile.defaultRoute;
}

function applySourceDefaultRoute(
  spec: ProfileSpec,
  profile: SwitchProfile,
  route: ProfileRouteTarget,
): void {
  const attached = attachedRuleListProfile(spec, profile);
  if (!attached) {
    profile.defaultRoute = structuredClone(route);
    return;
  }
  const enabled = routeTargetsProfile(profile.defaultRoute, attached.id);
  attached.defaultRoute = structuredClone(route);
  if (!enabled) profile.defaultRoute = structuredClone(route);
}

function attachedProfileIds(spec: ProfileSpec): ReadonlySet<string> {
  return new Set(
    spec.profiles.flatMap((profile) =>
      profile.kind === 'switch' && profile.attachedRuleListProfileId !== undefined
        ? [profile.attachedRuleListProfileId]
        : [],
    ),
  );
}

function routeName(spec: ProfileSpec, route: ProfileRouteTarget): string | undefined {
  if (route.kind === 'direct' || route.kind === 'system') return route.kind;
  return spec.profiles.find((profile) => profile.id === route.profileId)?.name;
}

function routeFromName(spec: ProfileSpec, name: string): ProfileRouteTarget | undefined {
  if (name === 'direct' || name === 'system') return { kind: name };
  const hidden = attachedProfileIds(spec);
  const profile = spec.profiles.find(
    (candidate) => candidate.name === name && !hidden.has(candidate.id),
  );
  return profile ? { kind: 'profile', profileId: profile.id } : undefined;
}

function sourceSafeValue(value: string, label: string): SwitchSourceError | undefined {
  if (value.includes('\n') || value.includes('\r')) {
    return error('switch-source.multiline-value', `${label} cannot contain a line break.`);
  }
  if (value !== value.trim()) {
    return error(
      'switch-source.edge-whitespace',
      `${label} cannot start or end with whitespace in the original source format.`,
    );
  }
  return undefined;
}

function sourceSafeRouteName(name: string): SwitchSourceError | undefined {
  const unsafe = sourceSafeValue(name, 'Result profile name');
  if (unsafe) return unsafe;
  if (name.includes(' +')) {
    return error(
      'switch-source.ambiguous-profile-name',
      `Result profile “${name}” contains the reserved “ +” sequence.`,
    );
  }
  return undefined;
}

function conditionToSource(condition: Condition): SwitchSourceComposeResult {
  switch (condition.kind) {
    case 'true':
      return { ok: true, source: 'True:' };
    case 'false': {
      const annotation = condition.annotation ?? '';
      const unsafe = sourceSafeValue(annotation, 'Never-condition annotation');
      return unsafe
        ? { ok: false, error: unsafe }
        : { ok: true, source: annotation ? `False: ${annotation}` : 'False:' };
    }
    case 'host-wildcard': {
      const unsafe = sourceSafeValue(condition.pattern, 'Host-wildcard pattern');
      if (unsafe) return { ok: false, error: unsafe };
      if (
        condition.pattern.length > 0 &&
        !condition.pattern.includes(' ') &&
        !condition.pattern.endsWith(':')
      ) {
        return {
          ok: true,
          source: SPECIAL_HOST_PREFIXES.has(condition.pattern[0] ?? '')
            ? `: ${condition.pattern}`
            : condition.pattern,
        };
      }
      return { ok: true, source: `HostWildcard: ${condition.pattern}`.trimEnd() };
    }
    case 'host-regex':
    case 'url-regex': {
      if (condition.flags) {
        return {
          ok: false,
          error: error(
            'switch-source.unsupported-regex-flags',
            'Regular-expression flags are not representable in the original SwitchyOmega source format.',
          ),
        };
      }
      const label = condition.kind === 'host-regex' ? 'HostRegex' : 'UrlRegex';
      const unsafe = sourceSafeValue(condition.pattern, `${label} pattern`);
      return unsafe
        ? { ok: false, error: unsafe }
        : { ok: true, source: `${label}: ${condition.pattern}`.trimEnd() };
    }
    case 'url-wildcard':
    case 'bypass':
    case 'keyword': {
      const label =
        condition.kind === 'url-wildcard'
          ? 'UrlWildcard'
          : condition.kind === 'bypass'
            ? 'Bypass'
            : 'Keyword';
      const unsafe = sourceSafeValue(condition.pattern, `${label} pattern`);
      return unsafe
        ? { ok: false, error: unsafe }
        : { ok: true, source: `${label}: ${condition.pattern}`.trimEnd() };
    }
    case 'ip':
      return { ok: true, source: `Ip: ${condition.address}/${condition.prefixLength}` };
    case 'host-levels':
      return { ok: true, source: `HostLevels: ${condition.min}~${condition.max}` };
    case 'weekday': {
      const selected = new Set(condition.days);
      const value = WEEKDAYS.map((day, index) =>
        selected.has(day) ? WEEKDAY_MARKERS[index] : '-',
      ).join('');
      return { ok: true, source: `Weekday: ${value}` };
    }
    case 'time':
      return { ok: true, source: `Time: ${condition.startHour}~${condition.endHour}` };
  }
}

export function composeSwitchProfileSource(
  spec: ProfileSpec,
  profileId: string,
): SwitchSourceComposeResult {
  const profile = findSwitchProfile(spec, profileId);
  if (!profile) {
    return {
      ok: false,
      error: error('switch-source.missing-profile', `Switch profile ${profileId} does not exist.`),
    };
  }

  const lines = [HEADER, WITH_RESULT, ''];
  for (const [index, rule] of profile.rules.entries()) {
    if (rule.enabled === false) {
      return {
        ok: false,
        error: error(
          'switch-source.unsupported-disabled-rule',
          `Rule ${index + 1} contains a legacy Nex-only disabled flag. Normalize the rule before editing source.`,
        ),
      };
    }
    const resultName = routeName(spec, rule.route);
    if (!resultName) {
      return {
        ok: false,
        error: error(
          'switch-source.missing-result-profile',
          `Rule ${index + 1} references a missing result profile.`,
        ),
      };
    }
    const unsafeRoute = sourceSafeRouteName(resultName);
    if (unsafeRoute) return { ok: false, error: unsafeRoute };
    if (rule.note !== undefined) {
      const unsafeNote = sourceSafeValue(rule.note, `Rule ${index + 1} note`);
      if (unsafeNote) return { ok: false, error: unsafeNote };
      lines.push(`@note ${rule.note}`.trimEnd());
    }
    const condition = conditionToSource(rule.condition);
    if (!condition.ok) return condition;
    lines.push(`${condition.source} +${resultName}`);
  }

  const defaultName = routeName(spec, sourceDefaultRoute(spec, profile));
  if (!defaultName) {
    return {
      ok: false,
      error: error(
        'switch-source.missing-default-profile',
        'The Switch profile references a missing default profile.',
      ),
    };
  }
  const unsafeDefault = sourceSafeRouteName(defaultName);
  if (unsafeDefault) return { ok: false, error: unsafeDefault };
  lines.push('', `* +${defaultName}`, '');
  return { ok: true, source: lines.join('\r\n') };
}

function splitConditionType(source: string): {
  readonly kind?: Condition['kind'];
  readonly body: string;
} {
  const firstSpace = source.indexOf(' ');
  const boundary = firstSpace < 0 ? source.length : firstSpace;
  if (boundary > 0 && source[boundary - 1] === ':') {
    const abbreviation = source.slice(0, boundary - 1).toUpperCase();
    const kind = CONDITION_TYPES[abbreviation];
    return {
      ...(kind === undefined ? {} : { kind }),
      body: source.slice(boundary + 1).trim(),
    };
  }
  return { kind: 'host-wildcard', body: source };
}

function integerPair(source: string): readonly [number, number] | undefined {
  const parts = source.split('~');
  if (parts.length !== 2) return undefined;
  const first = Number.parseInt(parts[0] ?? '', 10);
  const second = Number.parseInt(parts[1] ?? '', 10);
  return Number.isInteger(first) && Number.isInteger(second) ? [first, second] : undefined;
}

function parseWeekdays(source: string): Weekday[] | undefined {
  if (!source.includes('~') && source.length === 7) {
    return WEEKDAYS.filter((_, index) => (source[index] ?? '-').charCodeAt(0) > 64);
  }
  const range = integerPair(source);
  if (!range || range[0] < 0 || range[1] > 6 || range[0] > range[1]) return undefined;
  return WEEKDAYS.slice(range[0], range[1] + 1);
}

function parseCondition(source: string): Condition | undefined {
  const { kind, body } = splitConditionType(source.trim());
  if (!kind) return undefined;
  switch (kind) {
    case 'true':
      return { kind: 'true' };
    case 'false':
      return body ? { kind: 'false', annotation: body } : { kind: 'false' };
    case 'url-regex':
    case 'url-wildcard':
    case 'host-regex':
    case 'host-wildcard':
    case 'bypass':
      return { kind, pattern: body };
    case 'keyword':
      return { kind, pattern: body, httpOnly: true };
    case 'ip': {
      const separator = body.lastIndexOf('/');
      if (separator < 0) return { kind: 'ip', address: body, prefixLength: 0 };
      const prefixLength = Number.parseInt(body.slice(separator + 1), 10);
      if (!Number.isInteger(prefixLength)) return undefined;
      return { kind: 'ip', address: body.slice(0, separator), prefixLength };
    }
    case 'host-levels': {
      const range = integerPair(body);
      return range ? { kind: 'host-levels', min: range[0], max: range[1] } : undefined;
    }
    case 'weekday': {
      const days = parseWeekdays(body);
      return days ? { kind: 'weekday', days, timezone: 'local' } : undefined;
    }
    case 'time': {
      const range = integerPair(body);
      return range
        ? { kind: 'time', startHour: range[0], endHour: range[1], timezone: 'local' }
        : undefined;
    }
  }
}

function parsedLines(
  source: string,
):
  | { readonly ok: true; readonly lines: readonly ParsedSourceLine[] }
  | { readonly ok: false; readonly error: SwitchSourceError } {
  const lines: ParsedSourceLine[] = [];
  let withResult = false;
  let noteForNextRule: string | undefined;
  for (const [index, rawLine] of source.split(/\r?\n|\r/u).entries()) {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith('[') || line.startsWith(';')) continue;
    if (line.startsWith('@')) {
      const firstSpace = line.indexOf(' ');
      const directive = (firstSpace < 0 ? line.slice(1) : line.slice(1, firstSpace)).toUpperCase();
      const value = firstSpace < 0 ? '' : line.slice(firstSpace + 1).trim();
      if (directive === 'WITH' && /^RESULTS?$/iu.test(value)) withResult = true;
      if (directive === 'NOTE') noteForNextRule = value;
      continue;
    }

    const usesDefaultRoute = line.startsWith('!');
    const ruleLine = usesDefaultRoute ? line.slice(1).trim() : line;
    let conditionSource = ruleLine;
    let resultName: string | undefined;
    if (!usesDefaultRoute) {
      const resultSeparator = ruleLine.lastIndexOf(' +');
      if (resultSeparator < 0) {
        return {
          ok: false,
          error: error(
            'switch-source.missing-result-profile',
            'Missing result profile name after “ +”.',
            { line: lineNumber, source: rawLine },
          ),
        };
      }
      conditionSource = ruleLine.slice(0, resultSeparator).trim();
      resultName = ruleLine.slice(resultSeparator + 2).trim();
      if (!resultName) {
        return {
          ok: false,
          error: error('switch-source.empty-result-profile', 'Result profile name is empty.', {
            line: lineNumber,
            source: rawLine,
          }),
        };
      }
    }
    lines.push({
      line: lineNumber,
      source: rawLine,
      conditionSource,
      usesDefaultRoute,
      ...(resultName === undefined ? {} : { routeName: resultName }),
      ...(noteForNextRule === undefined ? {} : { note: noteForNextRule }),
    });
    noteForNextRule = undefined;
  }

  if (!withResult) {
    return {
      ok: false,
      error: error(
        'switch-source.results-required',
        'Source editing requires an “@with result” directive.',
      ),
    };
  }
  if (noteForNextRule !== undefined) {
    return {
      ok: false,
      error: error('switch-source.orphan-note', 'The final @note directive has no following rule.'),
    };
  }
  return { ok: true, lines };
}

function ruleSignature(rule: Pick<SwitchRule, 'condition' | 'route' | 'note'>): string {
  return JSON.stringify({
    condition: rule.condition,
    route: rule.route,
    ...(rule.note === undefined ? {} : { note: rule.note }),
  });
}

function mergeRuleIds(
  existing: readonly SwitchRule[],
  parsed: readonly Omit<SwitchRule, 'id'>[],
  idFactory: ProfileWorkflowIdFactory,
): SwitchRule[] {
  const unused = new Set(existing.map((_, index) => index));
  return parsed.map((rule, index) => {
    const signature = ruleSignature(rule);
    let match = existing.findIndex(
      (candidate, candidateIndex) =>
        unused.has(candidateIndex) && ruleSignature(candidate) === signature,
    );
    if (match < 0 && unused.has(index)) match = index;
    const previous = match < 0 ? undefined : existing[match];
    if (match >= 0) unused.delete(match);
    return {
      ...rule,
      id: previous?.id ?? idFactory('rule'),
      ...(previous?.legacy === undefined ? {} : { legacy: structuredClone(previous.legacy) }),
    };
  });
}

export function parseSwitchProfileSourceDraft(
  spec: ProfileSpec,
  profileId: string,
  source: string,
  idFactory: ProfileWorkflowIdFactory,
): SwitchSourceParseResult {
  const originalProfile = findSwitchProfile(spec, profileId);
  if (!originalProfile) {
    return {
      ok: false,
      error: error('switch-source.missing-profile', `Switch profile ${profileId} does not exist.`),
    };
  }
  const scanned = parsedLines(source.trim());
  if (!scanned.ok) return scanned;
  if (scanned.lines.length === 0) {
    return {
      ok: false,
      error: error(
        'switch-source.no-default-rule',
        'A final “* +profile” default rule is required.',
      ),
    };
  }

  const defaultLine = scanned.lines.at(-1);
  if (!defaultLine || defaultLine.usesDefaultRoute || defaultLine.conditionSource !== '*') {
    return {
      ok: false,
      error: error('switch-source.no-default-rule', 'The final rule must be “* +profile”.', {
        ...(defaultLine === undefined
          ? {}
          : { line: defaultLine.line, source: defaultLine.source }),
      }),
    };
  }
  if (defaultLine.note !== undefined) {
    return {
      ok: false,
      error: error('switch-source.default-note', 'The final default rule cannot have a note.', {
        line: defaultLine.line,
        source: defaultLine.source,
      }),
    };
  }
  const defaultRoute = routeFromName(spec, defaultLine.routeName ?? '');
  if (!defaultRoute) {
    return {
      ok: false,
      error: error(
        'switch-source.unknown-profile',
        `Unknown result profile “${defaultLine.routeName ?? ''}”.`,
        { line: defaultLine.line, source: defaultLine.source },
      ),
    };
  }

  const parsedRules: Omit<SwitchRule, 'id'>[] = [];
  for (const entry of scanned.lines.slice(0, -1)) {
    const condition = parseCondition(entry.conditionSource);
    if (!condition) {
      return {
        ok: false,
        error: error('switch-source.invalid-rule', 'Invalid SwitchyOmega condition.', {
          line: entry.line,
          source: entry.source,
        }),
      };
    }
    const route = entry.usesDefaultRoute
      ? defaultRoute
      : routeFromName(spec, entry.routeName ?? '');
    if (!route) {
      return {
        ok: false,
        error: error(
          'switch-source.unknown-profile',
          `Unknown result profile “${entry.routeName ?? ''}”.`,
          { line: entry.line, source: entry.source },
        ),
      };
    }
    parsedRules.push({
      condition,
      route: structuredClone(route),
      ...(entry.note === undefined ? {} : { note: entry.note }),
    });
  }

  const draft = cloneProfileSpecDraft(spec);
  const profile = findSwitchProfile(draft, profileId);
  if (!profile) {
    return {
      ok: false,
      error: error('switch-source.missing-profile', `Switch profile ${profileId} does not exist.`),
    };
  }
  profile.rules = mergeRuleIds(profile.rules, parsedRules, idFactory);
  applySourceDefaultRoute(draft, profile, defaultRoute);

  const validation = validateProfileSpecDraft(draft);
  const blockingIssue = validation.issues.find((issue) => issue.severity === 'error');
  if (!validation.valid || blockingIssue) {
    return {
      ok: false,
      error: error(
        'switch-source.invalid-draft',
        blockingIssue
          ? `${blockingIssue.code} at ${blockingIssue.path}: ${blockingIssue.message}`
          : 'Parsed source produced an invalid Draft.',
      ),
    };
  }
  return { ok: true, draft };
}
