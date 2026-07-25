import type {
  Condition,
  ProfileRouteTarget,
  ProfileSpec,
  RuleListProfile,
  RuleSource,
} from '@zeroomega-nex/profile-spec';

import { matchCondition } from './match.js';
import type {
  ParsedRuleListRule,
  ReferenceRequest,
  ReferenceSupport,
  RuleListDecision,
  RuleListParseResult,
  RuleListPriorityGroup,
  RuleListTraceEntry,
} from './types.js';

function combineSupport(current: ReferenceSupport, next: ReferenceSupport): ReferenceSupport {
  return current === 'target-dependent' || next === 'target-dependent'
    ? 'target-dependent'
    : 'exact';
}

function routeForName(spec: ProfileSpec, name: string): ProfileRouteTarget | undefined {
  if (name === 'direct') return { kind: 'direct' };
  if (name === 'system') return { kind: 'system' };
  const profile = spec.profiles.find((candidate) => candidate.name === name);
  return profile ? { kind: 'profile', profileId: profile.id } : undefined;
}

function parsedRule(
  source: RuleSource,
  index: number,
  sourceLine: string,
  condition: Condition,
  route: ProfileRouteTarget,
  priorityGroup: RuleListPriorityGroup,
  note?: string,
): ParsedRuleListRule {
  return {
    id: `${source.id}:rule:${index}`,
    sourceLine,
    condition,
    route,
    priorityGroup,
    ...(note === undefined ? {} : { note }),
  };
}

function parseAutoProxy(
  source: RuleSource,
  profile: RuleListProfile,
  content: string,
): RuleListParseResult {
  const exclusive: ParsedRuleListRule[] = [];
  const normal: ParsedRuleListRule[] = [];
  const issues: string[] = [];
  let parsedIndex = 0;

  for (const rawLine of content.split(/\r?\n/)) {
    const sourceLine = rawLine.trim();
    if (!sourceLine || sourceLine.startsWith('!') || /^\[AutoProxy\b/i.test(sourceLine)) {
      continue;
    }

    const isExclusive = sourceLine.startsWith('@@');
    const body = isExclusive ? sourceLine.slice(2) : sourceLine;
    let condition: Condition;

    if (body.startsWith('||')) {
      const host = body.slice(2).replace(/\^.*$/, '');
      if (!host) {
        issues.push(`empty AutoProxy host rule: ${sourceLine}`);
        continue;
      }
      condition = { kind: 'host-wildcard', pattern: `*.${host}` };
    } else if (body.startsWith('|')) {
      condition = { kind: 'url-wildcard', pattern: `${body.slice(1)}*` };
    } else if (body.length >= 2 && body.startsWith('/') && body.endsWith('/')) {
      condition = { kind: 'url-regex', pattern: body.slice(1, -1) };
    } else if (body.includes('*')) {
      condition = { kind: 'url-wildcard', pattern: `http://*${body}*` };
    } else {
      condition = { kind: 'keyword', pattern: body, httpOnly: true };
    }

    const rule = parsedRule(
      source,
      parsedIndex,
      sourceLine,
      condition,
      isExclusive ? profile.defaultRoute : profile.matchRoute,
      isExclusive ? 'exclusive' : 'normal',
    );
    parsedIndex += 1;
    (isExclusive ? exclusive : normal).push(rule);
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, rules: [...exclusive, ...normal] };
}

function parseSwitchyModern(
  spec: ProfileSpec,
  source: RuleSource,
  profile: RuleListProfile,
  content: string,
): RuleListParseResult {
  const rules: ParsedRuleListRule[] = [];
  const issues: string[] = [];
  let withResult = false;
  let note: string | undefined;
  let parsedIndex = 0;

  for (const rawLine of content.split(/\r?\n/)) {
    const sourceLine = rawLine.trim();
    if (!sourceLine || sourceLine === '[SwitchyOmega Conditions]') continue;
    if (sourceLine === '@with result') {
      withResult = true;
      continue;
    }
    if (sourceLine.startsWith('@note ')) {
      note = sourceLine.slice('@note '.length);
      continue;
    }
    if (sourceLine.startsWith('@')) continue;

    const leadingBang = sourceLine.startsWith('!');
    let conditionText = leadingBang ? sourceLine.slice(1) : sourceLine;
    let route = leadingBang ? profile.defaultRoute : profile.matchRoute;

    if (withResult && !leadingBang) {
      const resultMatch = /^(.*)\s+\+([^\s]+)$/.exec(conditionText);
      if (resultMatch) {
        conditionText = resultMatch[1]!.trimEnd();
        const explicitRoute = routeForName(spec, resultMatch[2]!);
        if (!explicitRoute) {
          issues.push(`unknown Switchy result profile ${resultMatch[2]} in: ${sourceLine}`);
          note = undefined;
          continue;
        }
        route = explicitRoute;
      }
    }

    const condition: Condition =
      conditionText.length >= 2 && conditionText.startsWith('/') && conditionText.endsWith('/')
        ? { kind: 'url-regex', pattern: conditionText.slice(1, -1) }
        : { kind: 'host-wildcard', pattern: conditionText };

    rules.push(parsedRule(source, parsedIndex, sourceLine, condition, route, 'ordered', note));
    parsedIndex += 1;
    note = undefined;
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, rules };
}

function parseSwitchyLegacy(
  source: RuleSource,
  profile: RuleListProfile,
  content: string,
): RuleListParseResult {
  const exclusive: ParsedRuleListRule[] = [];
  const normal: ParsedRuleListRule[] = [];
  const issues: string[] = [];
  let section: 'wildcard' | 'regexp' | undefined;
  let parsedIndex = 0;

  for (const rawLine of content.split(/\r?\n/)) {
    const sourceLine = rawLine.trim();
    if (!sourceLine || sourceLine === '#BEGIN' || sourceLine === '#END') continue;
    if (sourceLine === '[WILDCARD]') {
      section = 'wildcard';
      continue;
    }
    if (sourceLine === '[REGEXP]') {
      section = 'regexp';
      continue;
    }
    if (sourceLine.startsWith('#')) continue;
    if (!section) {
      issues.push(`Switchy legacy rule appears before a section: ${sourceLine}`);
      continue;
    }

    const isExclusive = sourceLine.startsWith('!');
    const body = isExclusive ? sourceLine.slice(1) : sourceLine;
    const condition: Condition =
      section === 'regexp'
        ? { kind: 'url-regex', pattern: body }
        : { kind: 'url-wildcard', pattern: `${body}*` };
    const rule = parsedRule(
      source,
      parsedIndex,
      sourceLine,
      condition,
      isExclusive ? profile.defaultRoute : profile.matchRoute,
      isExclusive ? 'exclusive' : 'normal',
    );
    parsedIndex += 1;
    (isExclusive ? exclusive : normal).push(rule);
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, rules: [...exclusive, ...normal] };
}

export function parseRuleList(
  spec: ProfileSpec,
  profile: RuleListProfile,
  source: RuleSource,
): RuleListParseResult {
  if (source.location.kind !== 'inline') {
    return { ok: false, issues: [`rule source ${source.id} has no inline content`] };
  }

  if (source.format === 'autoproxy') {
    return parseAutoProxy(source, profile, source.location.content);
  }

  return source.location.content.includes('[SwitchyOmega Conditions]')
    ? parseSwitchyModern(spec, source, profile, source.location.content)
    : parseSwitchyLegacy(source, profile, source.location.content);
}

export function evaluateRuleListProfile(
  spec: ProfileSpec,
  profile: RuleListProfile,
  source: RuleSource,
  request: ReferenceRequest,
): RuleListDecision {
  const parsed = parseRuleList(spec, profile, source);
  if (!parsed.ok) {
    return {
      status: 'invalid',
      support: 'exact',
      trace: [],
      reason: parsed.issues.join('; '),
    };
  }

  const trace: RuleListTraceEntry[] = [];
  let support: ReferenceSupport = 'exact';

  for (const rule of parsed.rules) {
    const match = matchCondition(rule.condition, request);
    support = combineSupport(support, match.support);
    trace.push({
      ruleId: rule.id,
      sourceLine: rule.sourceLine,
      priorityGroup: rule.priorityGroup,
      status: match.determinate ? (match.matched ? 'matched' : 'not-matched') : 'indeterminate',
      support: match.support,
      ...(match.reason === undefined ? {} : { reason: match.reason }),
    });

    if (!match.determinate) {
      return {
        status: 'indeterminate',
        support,
        trace,
        reason: match.reason ?? `rule-list rule ${rule.id} could not be evaluated`,
      };
    }
    if (match.matched) {
      return {
        status: 'selected',
        route: rule.route,
        matchedRuleId: rule.id,
        support,
        trace,
      };
    }
  }

  return {
    status: 'selected',
    route: profile.defaultRoute,
    support,
    trace,
  };
}
