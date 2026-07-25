import type {
  FixedProfile,
  ProfileRouteTarget,
  ProfileSpec,
  UserProfile,
} from '@zeroomega-nex/profile-spec';

import { evaluateSwitchProfile } from './evaluate.js';
import { matchCondition } from './match.js';
import type {
  GraphDecision,
  GraphEvaluationOptions,
  GraphTraceEntry,
  ReferenceRequest,
  ReferenceSupport,
} from './types.js';

const DEFAULT_MAX_PROFILE_DEPTH = 128;

function combineSupport(current: ReferenceSupport, next: ReferenceSupport): ReferenceSupport {
  return current === 'target-dependent' || next === 'target-dependent'
    ? 'target-dependent'
    : 'exact';
}

function endpointSlot(scheme: string): keyof FixedProfile['proxyByScheme'] | undefined {
  switch (scheme.toLowerCase()) {
    case 'http':
    case 'ws':
      return 'http';
    case 'https':
    case 'wss':
      return 'https';
    case 'ftp':
      return 'ftp';
    default:
      return undefined;
  }
}

function invalid(
  support: ReferenceSupport,
  trace: readonly GraphTraceEntry[],
  reason: string,
  profile?: UserProfile,
): GraphDecision {
  return {
    status: 'invalid',
    support,
    trace: [
      ...trace,
      {
        action: 'invalid',
        ...(profile === undefined
          ? {}
          : {
              profileId: profile.id,
              profileName: profile.name,
              profileKind: profile.kind,
            }),
        reason,
      },
    ],
    reason,
  };
}

function indeterminate(
  support: ReferenceSupport,
  trace: readonly GraphTraceEntry[],
  reason: string,
  entry: GraphTraceEntry,
): GraphDecision {
  return {
    status: 'indeterminate',
    support,
    trace: [...trace, entry],
    reason,
  };
}

export function evaluateProfileGraph(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
  request: ReferenceRequest,
  options: GraphEvaluationOptions = {},
): GraphDecision {
  const profileById = new Map(spec.profiles.map((profile) => [profile.id, profile]));
  const endpointById = new Map(spec.proxyEndpoints.map((endpoint) => [endpoint.id, endpoint]));
  const maxProfileDepth = options.maxProfileDepth ?? DEFAULT_MAX_PROFILE_DEPTH;

  const resolve = (
    route: ProfileRouteTarget,
    support: ReferenceSupport,
    trace: readonly GraphTraceEntry[],
    stack: readonly string[],
  ): GraphDecision => {
    if (route.kind === 'direct') {
      return {
        status: 'resolved',
        route: { kind: 'direct' },
        support,
        trace: [...trace, { action: 'direct', support }],
      };
    }

    if (route.kind === 'system') {
      return {
        status: 'resolved',
        route: { kind: 'system' },
        support,
        trace: [...trace, { action: 'system', support }],
      };
    }

    const profile = profileById.get(route.profileId);
    if (!profile) {
      return invalid(support, trace, `profile ${route.profileId} does not exist`);
    }
    if (profile.enabled === false) {
      return invalid(support, trace, `profile ${profile.id} is disabled`, profile);
    }
    if (stack.includes(profile.id)) {
      return invalid(
        support,
        trace,
        `profile reference cycle: ${[...stack, profile.id].join(' -> ')}`,
        profile,
      );
    }
    if (stack.length >= maxProfileDepth) {
      return invalid(
        support,
        trace,
        `profile resolution exceeded maximum depth ${maxProfileDepth}`,
        profile,
      );
    }

    const enteredTrace: GraphTraceEntry[] = [
      ...trace,
      {
        action: 'enter-profile',
        profileId: profile.id,
        profileName: profile.name,
        profileKind: profile.kind,
        support,
      },
    ];
    const nextStack = [...stack, profile.id];

    switch (profile.kind) {
      case 'switch': {
        const decision = evaluateSwitchProfile(profile, request);
        const nextSupport = combineSupport(support, decision.support);
        const switchTrace: GraphTraceEntry[] = decision.trace.map((entry) => ({
          action: 'switch-rule',
          profileId: profile.id,
          profileName: profile.name,
          profileKind: profile.kind,
          ruleId: entry.ruleId,
          matched: entry.status === 'matched',
          support: entry.support,
          ...(entry.reason === undefined ? {} : { reason: entry.reason }),
        }));

        if (decision.status === 'indeterminate') {
          return {
            status: 'indeterminate',
            support: nextSupport,
            trace: [...enteredTrace, ...switchTrace],
            reason: decision.reason,
          };
        }

        const selectedTrace: GraphTraceEntry[] = [
          ...enteredTrace,
          ...switchTrace,
          ...(decision.matchedRuleId === undefined
            ? [
                {
                  action: 'switch-default' as const,
                  profileId: profile.id,
                  profileName: profile.name,
                  profileKind: profile.kind,
                  support: nextSupport,
                },
              ]
            : []),
        ];
        return resolve(decision.route, nextSupport, selectedTrace, nextStack);
      }

      case 'fixed': {
        let nextSupport = support;
        const fixedTrace: GraphTraceEntry[] = [...enteredTrace];

        for (const bypass of profile.bypass) {
          if (bypass.enabled === false) continue;
          const matched = matchCondition({ kind: 'bypass', pattern: bypass.pattern }, request);
          nextSupport = combineSupport(nextSupport, matched.support);
          fixedTrace.push({
            action: 'fixed-bypass',
            profileId: profile.id,
            profileName: profile.name,
            profileKind: profile.kind,
            bypassId: bypass.id,
            matched: matched.matched,
            support: matched.support,
            ...(matched.reason === undefined ? {} : { reason: matched.reason }),
          });
          if (!matched.determinate) {
            return {
              status: 'indeterminate',
              support: nextSupport,
              trace: fixedTrace,
              reason: matched.reason ?? `bypass ${bypass.id} could not be evaluated`,
            };
          }
          if (matched.matched) {
            return resolve({ kind: 'direct' }, nextSupport, fixedTrace, nextStack);
          }
        }

        const slot = endpointSlot(request.scheme);
        const endpointId =
          (slot === undefined ? undefined : profile.proxyByScheme[slot]) ??
          profile.proxyByScheme.fallback;
        if (endpointId === undefined) {
          return {
            status: 'resolved',
            route: { kind: 'direct' },
            support: nextSupport,
            trace: [
              ...fixedTrace,
              {
                action: 'fixed-unmapped-direct',
                profileId: profile.id,
                profileName: profile.name,
                profileKind: profile.kind,
                support: nextSupport,
                reason: `no proxy endpoint is mapped for scheme ${request.scheme}`,
              },
              { action: 'direct', support: nextSupport },
            ],
          };
        }

        const endpoint = endpointById.get(endpointId);
        if (!endpoint) {
          return invalid(
            nextSupport,
            fixedTrace,
            `proxy endpoint ${endpointId} does not exist`,
            profile,
          );
        }
        return {
          status: 'resolved',
          route: { kind: 'proxy', endpointId, endpoint },
          support: nextSupport,
          trace: [
            ...fixedTrace,
            {
              action: 'fixed-endpoint',
              profileId: profile.id,
              profileName: profile.name,
              profileKind: profile.kind,
              endpointId,
              support: nextSupport,
            },
          ],
        };
      }

      case 'rule-list':
        return indeterminate(
          support,
          enteredTrace,
          `rule-list profile ${profile.id} requires the rule-list interpreter`,
          {
            action: 'rule-list',
            profileId: profile.id,
            profileName: profile.name,
            profileKind: profile.kind,
            support,
            reason: 'rule-list evaluation is not implemented in this slice',
          },
        );

      case 'pac':
        return indeterminate(
          'target-dependent',
          enteredTrace,
          `PAC profile ${profile.id} requires a PAC runtime`,
          {
            action: 'pac',
            profileId: profile.id,
            profileName: profile.name,
            profileKind: profile.kind,
            support: 'target-dependent',
            pacSource: profile.source,
            reason: 'arbitrary PAC execution is delegated to a PAC runtime',
          },
        );

      case 'auto-detect':
        return indeterminate(
          'target-dependent',
          enteredTrace,
          `auto-detect profile ${profile.id} requires browser capability`,
          {
            action: 'auto-detect',
            profileId: profile.id,
            profileName: profile.name,
            profileKind: profile.kind,
            support: 'target-dependent',
            reason: 'auto-detect behavior is platform-dependent',
          },
        );
    }
  };

  return resolve(startRoute, 'exact', [], []);
}
