import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';

import { evaluateProfileGraph } from './graph.js';
import type {
  GraphDecision,
  GraphTraceEntry,
  ReferenceRequest,
  ReferenceSupport,
  RuleListPriorityGroup,
} from './types.js';

export interface DifferentialDecisionVector {
  readonly id: string;
  readonly startRoute: ProfileRouteTarget;
  readonly request: ReferenceRequest;
}

export type DifferentialResolvedRoute =
  | { readonly kind: 'direct' }
  | { readonly kind: 'system' }
  | {
      readonly kind: 'proxy';
      readonly endpointId: string;
      readonly protocol: 'http' | 'https' | 'socks4' | 'socks5';
      readonly host: string;
      readonly port: number;
    };

export interface DifferentialTraceEntry {
  readonly action: GraphTraceEntry['action'];
  readonly profileId?: string;
  readonly ruleId?: string;
  readonly sourceLine?: string;
  readonly priorityGroup?: RuleListPriorityGroup;
  readonly bypassId?: string;
  readonly endpointId?: string;
  readonly matched?: boolean;
  readonly support?: ReferenceSupport;
  readonly reason?: string;
}

export interface DifferentialDecisionRecord {
  readonly recordSchemaVersion: 1;
  readonly vectorId: string;
  readonly status: GraphDecision['status'];
  readonly support: ReferenceSupport;
  readonly route?: DifferentialResolvedRoute;
  readonly reason?: string;
  readonly profilePath: readonly string[];
  readonly matchedRuleIds: readonly string[];
  readonly trace: readonly DifferentialTraceEntry[];
}

function differentialRoute(decision: GraphDecision): DifferentialResolvedRoute | undefined {
  if (decision.status !== 'resolved') return undefined;
  if (decision.route.kind === 'direct' || decision.route.kind === 'system') {
    return { kind: decision.route.kind };
  }
  return {
    kind: 'proxy',
    endpointId: decision.route.endpointId,
    protocol: decision.route.endpoint.protocol,
    host: decision.route.endpoint.host,
    port: decision.route.endpoint.port,
  };
}

function differentialTrace(entry: GraphTraceEntry): DifferentialTraceEntry {
  return {
    action: entry.action,
    ...(entry.profileId === undefined ? {} : { profileId: entry.profileId }),
    ...(entry.ruleId === undefined ? {} : { ruleId: entry.ruleId }),
    ...(entry.sourceLine === undefined ? {} : { sourceLine: entry.sourceLine }),
    ...(entry.priorityGroup === undefined ? {} : { priorityGroup: entry.priorityGroup }),
    ...(entry.bypassId === undefined ? {} : { bypassId: entry.bypassId }),
    ...(entry.endpointId === undefined ? {} : { endpointId: entry.endpointId }),
    ...(entry.matched === undefined ? {} : { matched: entry.matched }),
    ...(entry.support === undefined ? {} : { support: entry.support }),
    ...(entry.reason === undefined ? {} : { reason: entry.reason }),
  };
}

export function toDifferentialDecisionRecord(
  vectorId: string,
  decision: GraphDecision,
): DifferentialDecisionRecord {
  const route = differentialRoute(decision);
  return {
    recordSchemaVersion: 1,
    vectorId,
    status: decision.status,
    support: decision.support,
    ...(route === undefined ? {} : { route }),
    ...('reason' in decision ? { reason: decision.reason } : {}),
    profilePath: decision.trace
      .filter((entry) => entry.action === 'enter-profile' && entry.profileId !== undefined)
      .map((entry) => entry.profileId!),
    matchedRuleIds: decision.trace
      .filter(
        (entry) =>
          (entry.action === 'switch-rule' || entry.action === 'rule-list-rule') &&
          entry.matched === true &&
          entry.ruleId !== undefined,
      )
      .map((entry) => entry.ruleId!),
    trace: decision.trace.map(differentialTrace),
  };
}

export function evaluateDifferentialVector(
  spec: ProfileSpec,
  vector: DifferentialDecisionVector,
): DifferentialDecisionRecord {
  return toDifferentialDecisionRecord(
    vector.id,
    evaluateProfileGraph(spec, vector.startRoute, vector.request),
  );
}

export function serializeDifferentialDecisionRecord(record: DifferentialDecisionRecord): string {
  return JSON.stringify(record);
}
