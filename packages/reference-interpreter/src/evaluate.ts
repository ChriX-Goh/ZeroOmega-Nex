import type { SwitchProfile } from '@zeroomega-nex/profile-spec';

import { matchCondition } from './match.js';
import type {
  ReferenceRequest,
  ReferenceSupport,
  RuleTraceEntry,
  SwitchDecision,
} from './types.js';

function combineSupport(
  current: ReferenceSupport,
  next: ReferenceSupport,
): ReferenceSupport {
  return current === 'target-dependent' || next === 'target-dependent'
    ? 'target-dependent'
    : 'exact';
}

export function evaluateSwitchProfile(
  profile: SwitchProfile,
  request: ReferenceRequest,
): SwitchDecision {
  const trace: RuleTraceEntry[] = [];
  let support: ReferenceSupport = 'exact';

  for (const rule of profile.rules) {
    if (rule.enabled === false) {
      trace.push({
        ruleId: rule.id,
        status: 'skipped-disabled',
        support: 'exact',
      });
      continue;
    }

    const match = matchCondition(rule.condition, request);
    support = combineSupport(support, match.support);

    if (!match.determinate) {
      trace.push({
        ruleId: rule.id,
        status: 'indeterminate',
        support: match.support,
        ...(match.reason === undefined ? {} : { reason: match.reason }),
      });
      return {
        status: 'indeterminate',
        support,
        trace,
        reason: match.reason ?? `rule ${rule.id} could not be evaluated`,
      };
    }

    trace.push({
      ruleId: rule.id,
      status: match.matched ? 'matched' : 'not-matched',
      support: match.support,
      ...(match.reason === undefined ? {} : { reason: match.reason }),
    });

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
