import type { ProfileRouteTarget } from '@zeroomega-nex/profile-spec';

export type ReferenceSupport = 'exact' | 'target-dependent';

export interface ReferenceRequest {
  readonly url: string;
  readonly host: string;
  readonly scheme: string;
  readonly port?: number;
  readonly localWeekday?: number;
  readonly localHour?: number;
}

export interface ConditionMatchResult {
  readonly matched: boolean;
  readonly determinate: boolean;
  readonly support: ReferenceSupport;
  readonly reason?: string;
}

export interface RuleTraceEntry {
  readonly ruleId: string;
  readonly status: 'skipped-disabled' | 'matched' | 'not-matched' | 'indeterminate';
  readonly support: ReferenceSupport;
  readonly reason?: string;
}

export type SwitchDecision =
  | {
      readonly status: 'selected';
      readonly route: ProfileRouteTarget;
      readonly matchedRuleId?: string;
      readonly support: ReferenceSupport;
      readonly trace: readonly RuleTraceEntry[];
    }
  | {
      readonly status: 'indeterminate';
      readonly support: ReferenceSupport;
      readonly trace: readonly RuleTraceEntry[];
      readonly reason: string;
    };
