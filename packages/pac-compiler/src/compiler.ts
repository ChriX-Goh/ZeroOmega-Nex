import type {
  Condition,
  FixedProfile,
  ProfileRouteTarget,
  ProfileSpec,
  ProxyEndpoint,
  RuleListProfile,
  UserProfile,
  Weekday,
} from '@zeroomega-nex/profile-spec';
import { parseRuleList } from '@zeroomega-nex/reference-interpreter';

import { analyzePacCompatibility } from './capabilities.js';
import {
  DEFAULT_PAC_COMPILER_BUDGETS,
  PAC_COMPILER_VERSION,
  type PacCapabilityIssue,
  type PacCompilationResult,
  type PacCompileOptions,
  type PacCompilerBudgets,
} from './contracts.js';
import { pacDirective, pacStringLiteral } from './escape.js';
import { PAC_RUNTIME_SOURCE } from './runtime.js';

const WEEKDAY_INDEX: Readonly<Record<Weekday, number>> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function budgets(options: PacCompileOptions): PacCompilerBudgets {
  return { ...DEFAULT_PAC_COMPILER_BUDGETS, ...options.budgets };
}

function failureIssue(code: string, path: string, message: string): PacCapabilityIssue {
  return {
    code,
    path,
    capability: 'unsupported',
    severity: 'error',
    blocking: true,
    message,
  };
}

function budgetWarning(code: string, message: string): PacCapabilityIssue {
  return {
    code,
    path: '/artifact/stats',
    capability: 'exact',
    severity: 'warning',
    blocking: false,
    message,
  };
}

function compileCondition(condition: Condition, count: () => void): string {
  count();
  switch (condition.kind) {
    case 'true':
      return 'true';
    case 'false':
      return 'false';
    case 'url-regex':
      return `zoRe(${pacStringLiteral(condition.pattern)},${pacStringLiteral(condition.flags ?? '')},url)`;
    case 'url-wildcard':
      return `zoWild(${pacStringLiteral(condition.pattern)},url)`;
    case 'host-regex':
      return `zoRe(${pacStringLiteral(condition.pattern)},${pacStringLiteral(condition.flags ?? '')},host)`;
    case 'host-wildcard':
      return `zoHost(${pacStringLiteral(condition.pattern)},host)`;
    case 'bypass':
      return `zoBypass(${pacStringLiteral(condition.pattern)},url,host,scheme,port)`;
    case 'keyword':
      return `${condition.httpOnly ? 'scheme==="http"&&' : ''}url.indexOf(${pacStringLiteral(condition.pattern)})!==-1`;
    case 'ip':
      return `zoIp(host,${pacStringLiteral(condition.address)},${condition.prefixLength})`;
    case 'host-levels':
      return `zoLevels(host)>=${condition.min}&&zoLevels(host)<=${condition.max}`;
    case 'weekday':
      return `zoWeekday([${condition.days.map((day) => WEEKDAY_INDEX[day]).join(',')}])`;
    case 'time':
      return `zoHour(${condition.startHour},${condition.endHour})`;
  }
}

function endpointExpression(endpoint: ProxyEndpoint | undefined): string {
  return endpoint === undefined
    ? pacStringLiteral('DIRECT')
    : pacStringLiteral(pacDirective(endpoint));
}

export function compilePac(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
  options: PacCompileOptions = {},
): PacCompilationResult {
  const target = options.target ?? 'cross-browser';
  const analysis = analyzePacCompatibility(spec, startRoute, target);
  const allowTargetDependent = options.allowTargetDependent ?? false;
  const limits = budgets(options);

  if (!analysis.canCompileWithTargetDependentSemantics) {
    return { ok: false, analysis, issues: analysis.issues.filter((issue) => issue.blocking) };
  }
  if (!allowTargetDependent && !analysis.canCompileExact) {
    return {
      ok: false,
      analysis,
      issues: analysis.issues.filter(
        (issue) => issue.blocking && issue.capability === 'target-dependent',
      ),
    };
  }
  if (analysis.reachableProfileIds.length > limits.maxProfiles) {
    const issue = failureIssue(
      'budget.profile-count-exceeded',
      '/profiles',
      `Reachable profile count ${analysis.reachableProfileIds.length} exceeds budget ${limits.maxProfiles}.`,
    );
    return { ok: false, analysis, issues: [issue] };
  }

  const profileById = new Map(spec.profiles.map((profile) => [profile.id, profile]));
  const endpointById = new Map(spec.proxyEndpoints.map((endpoint) => [endpoint.id, endpoint]));
  const sourceById = new Map(spec.ruleSources.map((source) => [source.id, source]));
  const functionByProfileId = new Map(
    analysis.reachableProfileIds.map((profileId, index) => [profileId, `zoProfile${index}`]),
  );

  let conditionCount = 0;
  let ruleListRuleCount = 0;
  const countCondition = (): void => {
    conditionCount += 1;
  };

  const compileRoute = (route: ProfileRouteTarget): string => {
    if (route.kind === 'direct') return pacStringLiteral('DIRECT');
    if (route.kind === 'system') throw new Error('System route passed PAC capability analysis');
    const functionName = functionByProfileId.get(route.profileId);
    if (!functionName) throw new Error(`Profile ${route.profileId} is not reachable in PAC graph`);
    return `${functionName}(url,host,scheme,port)`;
  };

  const compileFixed = (profile: FixedProfile, functionName: string): string => {
    const lines = [`function ${functionName}(url,host,scheme,port){`];
    for (const bypass of profile.bypass) {
      if (bypass.enabled === false) continue;
      lines.push(
        `if(${compileCondition({ kind: 'bypass', pattern: bypass.pattern }, countCondition)})return ${pacStringLiteral('DIRECT')};`,
      );
    }

    const fallback = endpointById.get(profile.proxyByScheme.fallback ?? '');
    const http = endpointById.get(profile.proxyByScheme.http ?? '') ?? fallback;
    const https = endpointById.get(profile.proxyByScheme.https ?? '') ?? fallback;
    const ftp = endpointById.get(profile.proxyByScheme.ftp ?? '') ?? fallback;
    lines.push(`if(scheme==="http"||scheme==="ws")return ${endpointExpression(http)};`);
    lines.push(`if(scheme==="https"||scheme==="wss")return ${endpointExpression(https)};`);
    lines.push(`if(scheme==="ftp")return ${endpointExpression(ftp)};`);
    lines.push(`return ${endpointExpression(fallback)};`);
    lines.push('}');
    return lines.join('\n');
  };

  const compileSwitch = (
    profile: Extract<UserProfile, { kind: 'switch' }>,
    functionName: string,
  ): string => {
    const lines = [`function ${functionName}(url,host,scheme,port){`];
    for (const rule of profile.rules) {
      if (rule.enabled === false) continue;
      lines.push(
        `if(${compileCondition(rule.condition, countCondition)})return ${compileRoute(rule.route)};`,
      );
    }
    lines.push(`return ${compileRoute(profile.defaultRoute)};`);
    lines.push('}');
    return lines.join('\n');
  };

  const compileRuleList = (profile: RuleListProfile, functionName: string): string => {
    const source = sourceById.get(profile.sourceId);
    if (!source) throw new Error(`Rule source ${profile.sourceId} passed capability analysis`);
    const parsed = parseRuleList(spec, profile, source);
    if (!parsed.ok) throw new Error(parsed.issues.join('; '));
    ruleListRuleCount += parsed.rules.length;
    const lines = [`function ${functionName}(url,host,scheme,port){`];
    for (const rule of parsed.rules) {
      lines.push(
        `if(${compileCondition(rule.condition, countCondition)})return ${compileRoute(rule.route)};`,
      );
    }
    lines.push(`return ${compileRoute(profile.defaultRoute)};`);
    lines.push('}');
    return lines.join('\n');
  };

  const compileVirtual = (
    profile: Extract<UserProfile, { kind: 'virtual' }>,
    functionName: string,
  ): string =>
    `function ${functionName}(url,host,scheme,port){return ${compileRoute(profile.targetRoute)};}`;

  const compileProfile = (profile: UserProfile): string => {
    const functionName = functionByProfileId.get(profile.id);
    if (!functionName) throw new Error(`Profile ${profile.id} has no PAC function name`);
    switch (profile.kind) {
      case 'fixed':
        return compileFixed(profile, functionName);
      case 'switch':
        return compileSwitch(profile, functionName);
      case 'rule-list':
        return compileRuleList(profile, functionName);
      case 'virtual':
        return compileVirtual(profile, functionName);
      case 'pac':
      case 'auto-detect':
        throw new Error(`Unsupported profile ${profile.id} passed PAC capability analysis`);
    }
  };

  let profileFunctions: string[];
  try {
    profileFunctions = analysis.reachableProfileIds.map((profileId) => {
      const profile = profileById.get(profileId);
      if (!profile)
        throw new Error(`Profile ${profileId} passed capability analysis but is missing`);
      return compileProfile(profile);
    });
  } catch (error) {
    const issue = failureIssue(
      'compiler.internal-invariant',
      '/compiler',
      error instanceof Error ? error.message : 'PAC compiler invariant failed.',
    );
    return { ok: false, analysis, issues: [issue] };
  }

  const ruleCount = conditionCount;
  if (ruleCount > limits.maxRules) {
    const issue = failureIssue(
      'budget.rule-count-exceeded',
      '/artifact/stats/conditionCount',
      `Compiled condition count ${ruleCount} exceeds budget ${limits.maxRules}.`,
    );
    return { ok: false, analysis, issues: [issue] };
  }

  const startExpression = compileRoute(startRoute);
  const script = [
    `/* ZeroOmega Nex PAC ${PAC_COMPILER_VERSION}; target=${target} */`,
    PAC_RUNTIME_SOURCE,
    ...profileFunctions,
    'function FindProxyForURL(url,host){',
    'var scheme=zoScheme(url);',
    'var port=zoPort(url,scheme);',
    `return ${startExpression};`,
    '}',
    '',
  ].join('\n');
  const scriptBytes = new TextEncoder().encode(script).length;
  if (scriptBytes > limits.maxScriptBytes) {
    const issue = failureIssue(
      'budget.script-bytes-exceeded',
      '/artifact/stats/scriptBytes',
      `Generated PAC size ${scriptBytes} bytes exceeds budget ${limits.maxScriptBytes}.`,
    );
    return { ok: false, analysis, issues: [issue] };
  }

  const warnings = analysis.issues.filter((issue) => !issue.blocking);
  if (scriptBytes >= Math.floor(limits.maxScriptBytes * 0.8)) {
    warnings.push(
      budgetWarning(
        'budget.script-bytes-near-limit',
        `Generated PAC size ${scriptBytes} bytes is at least 80% of budget ${limits.maxScriptBytes}.`,
      ),
    );
  }
  if (ruleCount >= Math.floor(limits.maxRules * 0.8)) {
    warnings.push(
      budgetWarning(
        'budget.rule-count-near-limit',
        `Compiled condition count ${ruleCount} is at least 80% of budget ${limits.maxRules}.`,
      ),
    );
  }

  return {
    ok: true,
    analysis,
    artifact: {
      artifactSchemaVersion: 1,
      compilerVersion: PAC_COMPILER_VERSION,
      target,
      capability: analysis.capability === 'exact' ? 'exact' : 'target-dependent',
      functionName: 'FindProxyForURL',
      script,
      stats: {
        scriptBytes,
        profileCount: analysis.reachableProfileIds.length,
        endpointCount: analysis.reachableEndpointIds.length,
        conditionCount,
        ruleListRuleCount,
      },
      warnings,
    },
  };
}
