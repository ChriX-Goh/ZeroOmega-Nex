import type {
  Condition,
  ProfileRouteTarget,
  ProfileSpec,
  ProxyEndpoint,
  UserProfile,
} from '@zeroomega-nex/profile-spec';
import { parseRuleList } from '@zeroomega-nex/reference-interpreter';

import {
  PAC_COMPILER_VERSION,
  type PacCapability,
  type PacCapabilityAnalysis,
  type PacCapabilityIssue,
  type PacTarget,
} from './contracts.js';

function containsNonAscii(value: string): boolean {
  for (const character of value) {
    if (character.codePointAt(0)! > 0x7f) return true;
  }
  return false;
}

function issueKey(issue: PacCapabilityIssue): string {
  return `${issue.code}\u0000${issue.path}\u0000${issue.message}`;
}

function conditionPathCapability(
  condition: Condition,
  path: string,
  addIssue: (issue: PacCapabilityIssue) => void,
): void {
  const pattern =
    condition.kind === 'url-regex' ||
    condition.kind === 'url-wildcard' ||
    condition.kind === 'host-regex' ||
    condition.kind === 'host-wildcard' ||
    condition.kind === 'bypass' ||
    condition.kind === 'keyword'
      ? condition.pattern
      : undefined;

  if (pattern !== undefined && containsNonAscii(pattern)) {
    addIssue({
      code: 'condition.idn-target-dependent',
      path,
      capability: 'target-dependent',
      severity: 'warning',
      blocking: true,
      message:
        'Unicode host representation can differ between PAC engines and requires target verification.',
    });
  }

  if (condition.kind === 'url-regex') {
    addIssue({
      code: 'condition.url-regex-target-dependent',
      path,
      capability: 'target-dependent',
      severity: 'warning',
      blocking: true,
      message:
        'HTTPS PAC inputs normally omit path and query components, so full URL regex semantics are target-dependent.',
    });
    return;
  }

  if (condition.kind === 'url-wildcard') {
    const alternatives = condition.pattern
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean);
    const httpOnly =
      alternatives.length > 0 &&
      alternatives.every((entry) => entry.toLowerCase().startsWith('http://'));
    if (!httpOnly) {
      addIssue({
        code: 'condition.url-wildcard-target-dependent',
        path,
        capability: 'target-dependent',
        severity: 'warning',
        blocking: true,
        message:
          'URL wildcard semantics can depend on HTTPS path stripping in the target PAC engine.',
      });
    }
  }
}

function endpointCapability(
  endpoint: ProxyEndpoint,
  path: string,
  addIssue: (issue: PacCapabilityIssue) => void,
): void {
  if (containsNonAscii(endpoint.host)) {
    addIssue({
      code: 'endpoint.host-needs-ascii',
      path: `${path}/host`,
      capability: 'target-dependent',
      severity: 'warning',
      blocking: true,
      message:
        'PAC proxy endpoints require an ASCII hostname; IDN conversion must be verified before compilation.',
    });
  }

  if (endpoint.credential !== undefined) {
    addIssue({
      code: 'endpoint.authentication-external',
      path: `${path}/credential`,
      capability: 'exact',
      severity: 'info',
      blocking: false,
      message:
        'PAC selects this endpoint, while proxy authentication is handled by the browser adapter.',
    });
  }
}

function strongestCapability(issues: readonly PacCapabilityIssue[]): PacCapability {
  if (issues.some((issue) => issue.blocking && issue.capability === 'unsupported')) {
    return 'unsupported';
  }
  if (issues.some((issue) => issue.blocking && issue.capability === 'target-dependent')) {
    return 'target-dependent';
  }
  return 'exact';
}

export function analyzePacCompatibility(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
  target: PacTarget = 'cross-browser',
): PacCapabilityAnalysis {
  const profileById = new Map(spec.profiles.map((profile) => [profile.id, profile]));
  const endpointById = new Map(spec.proxyEndpoints.map((endpoint) => [endpoint.id, endpoint]));
  const sourceById = new Map(spec.ruleSources.map((source) => [source.id, source]));
  const reachableProfileIds: string[] = [];
  const reachableEndpointIds: string[] = [];
  const visitedProfiles = new Set<string>();
  const visitingProfiles = new Set<string>();
  const visitedEndpoints = new Set<string>();
  const issues: PacCapabilityIssue[] = [];
  const issueKeys = new Set<string>();

  const addIssue = (issue: PacCapabilityIssue): void => {
    const key = issueKey(issue);
    if (issueKeys.has(key)) return;
    issueKeys.add(key);
    issues.push(issue);
  };

  const visitRoute = (route: ProfileRouteTarget, path: string): void => {
    if (route.kind === 'direct') return;
    if (route.kind === 'system') {
      addIssue({
        code: 'route.system-unsupported',
        path,
        capability: 'unsupported',
        severity: 'error',
        blocking: true,
        message:
          'PAC return values cannot delegate a single request to the operating-system proxy configuration.',
      });
      return;
    }
    visitProfile(route.profileId, path);
  };

  const visitEndpoint = (endpointId: string, path: string): void => {
    if (visitedEndpoints.has(endpointId)) return;
    visitedEndpoints.add(endpointId);
    const endpoint = endpointById.get(endpointId);
    if (!endpoint) {
      addIssue({
        code: 'endpoint.missing',
        path,
        capability: 'unsupported',
        severity: 'error',
        blocking: true,
        message: `Referenced proxy endpoint ${endpointId} does not exist.`,
      });
      return;
    }
    reachableEndpointIds.push(endpointId);
    endpointCapability(
      endpoint,
      `/proxyEndpoints/${spec.proxyEndpoints.indexOf(endpoint)}`,
      addIssue,
    );
  };

  const visitProfile = (profileId: string, referencePath: string): void => {
    if (visitedProfiles.has(profileId)) return;
    if (visitingProfiles.has(profileId)) {
      addIssue({
        code: 'profile.reference-cycle',
        path: referencePath,
        capability: 'unsupported',
        severity: 'error',
        blocking: true,
        message: `Profile reference cycle reaches ${profileId}.`,
      });
      return;
    }

    const profile = profileById.get(profileId);
    if (!profile) {
      addIssue({
        code: 'profile.missing',
        path: referencePath,
        capability: 'unsupported',
        severity: 'error',
        blocking: true,
        message: `Referenced profile ${profileId} does not exist.`,
      });
      return;
    }

    visitingProfiles.add(profileId);
    reachableProfileIds.push(profileId);
    const profileIndex = spec.profiles.indexOf(profile);
    const profilePath = `/profiles/${profileIndex}`;

    if (profile.enabled === false) {
      addIssue({
        code: 'profile.disabled',
        path: profilePath,
        capability: 'unsupported',
        severity: 'error',
        blocking: true,
        message: `Selected profile ${profile.name} is disabled.`,
      });
    }

    visitProfileBody(profile, profilePath);
    visitingProfiles.delete(profileId);
    visitedProfiles.add(profileId);
  };

  const visitProfileBody = (profile: UserProfile, profilePath: string): void => {
    switch (profile.kind) {
      case 'fixed':
        for (const [slot, endpointId] of Object.entries(profile.proxyByScheme)) {
          if (endpointId !== undefined)
            visitEndpoint(endpointId, `${profilePath}/proxyByScheme/${slot}`);
        }
        for (const [index, bypass] of profile.bypass.entries()) {
          conditionPathCapability(
            { kind: 'bypass', pattern: bypass.pattern },
            `${profilePath}/bypass/${index}`,
            addIssue,
          );
        }
        return;

      case 'switch':
        for (const [index, rule] of profile.rules.entries()) {
          conditionPathCapability(
            rule.condition,
            `${profilePath}/rules/${index}/condition`,
            addIssue,
          );
          visitRoute(rule.route, `${profilePath}/rules/${index}/route`);
        }
        visitRoute(profile.defaultRoute, `${profilePath}/defaultRoute`);
        return;

      case 'rule-list': {
        const source = sourceById.get(profile.sourceId);
        if (!source) {
          addIssue({
            code: 'rule-source.missing',
            path: `${profilePath}/sourceId`,
            capability: 'unsupported',
            severity: 'error',
            blocking: true,
            message: `Rule source ${profile.sourceId} does not exist.`,
          });
        } else if (source.location.kind !== 'inline') {
          addIssue({
            code: 'rule-source.content-unavailable',
            path: `/ruleSources/${spec.ruleSources.indexOf(source)}/location`,
            capability: 'unsupported',
            severity: 'error',
            blocking: true,
            message: 'Rule-source content must be fetched and verified before PAC compilation.',
          });
        } else {
          const parsed = parseRuleList(spec, profile, source);
          if (!parsed.ok) {
            addIssue({
              code: 'rule-source.parse-failed',
              path: `/ruleSources/${spec.ruleSources.indexOf(source)}/location`,
              capability: 'unsupported',
              severity: 'error',
              blocking: true,
              message: parsed.issues.join('; '),
            });
          } else {
            for (const [index, rule] of parsed.rules.entries()) {
              conditionPathCapability(
                rule.condition,
                `/ruleSources/${spec.ruleSources.indexOf(source)}/rules/${index}/condition`,
                addIssue,
              );
              visitRoute(
                rule.route,
                `/ruleSources/${spec.ruleSources.indexOf(source)}/rules/${index}/route`,
              );
            }
          }
        }
        visitRoute(profile.defaultRoute, `${profilePath}/defaultRoute`);
        visitRoute(profile.matchRoute, `${profilePath}/matchRoute`);
        return;
      }

      case 'pac':
        addIssue({
          code: 'profile.pac-nesting-unsupported',
          path: profilePath,
          capability: 'unsupported',
          severity: 'error',
          blocking: true,
          message:
            'An arbitrary PAC profile cannot be safely composed into the generated PAC policy.',
        });
        return;

      case 'auto-detect':
        addIssue({
          code: 'profile.auto-detect-unsupported',
          path: profilePath,
          capability: 'unsupported',
          severity: 'error',
          blocking: true,
          message:
            'Browser auto-detection cannot be represented as a per-request PAC return value.',
        });
        return;
    }
  };

  visitRoute(startRoute, '/startRoute');

  const capability = strongestCapability(issues);
  const summary = {
    exact: issues.filter((issue) => issue.capability === 'exact').length,
    targetDependent: issues.filter((issue) => issue.capability === 'target-dependent').length,
    unsupported: issues.filter((issue) => issue.capability === 'unsupported').length,
    blocking: issues.filter((issue) => issue.blocking).length,
  };

  return {
    compilerVersion: PAC_COMPILER_VERSION,
    target,
    startRoute,
    capability,
    canCompileExact: !issues.some((issue) => issue.blocking && issue.capability !== 'exact'),
    canCompileWithTargetDependentSemantics: !issues.some(
      (issue) => issue.blocking && issue.capability === 'unsupported',
    ),
    reachableProfileIds,
    reachableEndpointIds,
    issues,
    summary,
  };
}
