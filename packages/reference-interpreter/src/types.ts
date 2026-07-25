import type {
  PacSource,
  ProfileRouteTarget,
  ProxyEndpoint,
  UserProfile,
} from '@zeroomega-nex/profile-spec';

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

export type ResolvedReferenceRoute =
  | { readonly kind: 'direct' }
  | { readonly kind: 'system' }
  | {
      readonly kind: 'proxy';
      readonly endpointId: string;
      readonly endpoint: ProxyEndpoint;
    };

export interface GraphTraceEntry {
  readonly action:
    | 'direct'
    | 'system'
    | 'enter-profile'
    | 'switch-rule'
    | 'switch-default'
    | 'fixed-bypass'
    | 'fixed-endpoint'
    | 'fixed-unmapped-direct'
    | 'rule-list'
    | 'pac'
    | 'auto-detect'
    | 'invalid';
  readonly profileId?: string;
  readonly profileName?: string;
  readonly profileKind?: UserProfile['kind'];
  readonly ruleId?: string;
  readonly bypassId?: string;
  readonly endpointId?: string;
  readonly matched?: boolean;
  readonly support?: ReferenceSupport;
  readonly reason?: string;
  readonly pacSource?: PacSource;
}

export type GraphDecision =
  | {
      readonly status: 'resolved';
      readonly route: ResolvedReferenceRoute;
      readonly support: ReferenceSupport;
      readonly trace: readonly GraphTraceEntry[];
    }
  | {
      readonly status: 'indeterminate';
      readonly support: ReferenceSupport;
      readonly trace: readonly GraphTraceEntry[];
      readonly reason: string;
    }
  | {
      readonly status: 'invalid';
      readonly support: ReferenceSupport;
      readonly trace: readonly GraphTraceEntry[];
      readonly reason: string;
    };

export interface GraphEvaluationOptions {
  readonly maxProfileDepth?: number;
}
