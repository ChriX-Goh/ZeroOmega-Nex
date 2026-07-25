export { evaluateSwitchProfile } from './evaluate.js';
export { evaluateProfileGraph } from './graph.js';
export { ipMatchesPrefix, isIpLiteral, parseIpLiteral } from './ip.js';
export { matchCondition } from './match.js';
export type {
  ConditionMatchResult,
  GraphDecision,
  GraphEvaluationOptions,
  GraphTraceEntry,
  ReferenceRequest,
  ReferenceSupport,
  ResolvedReferenceRoute,
  RuleTraceEntry,
  SwitchDecision,
} from './types.js';
export { matchesHostPattern, matchesUrlWildcard, normalizeHost } from './wildcard.js';
