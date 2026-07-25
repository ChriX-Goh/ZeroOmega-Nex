export { evaluateSwitchProfile } from './evaluate.js';
export { ipMatchesPrefix, isIpLiteral, parseIpLiteral } from './ip.js';
export { matchCondition } from './match.js';
export type {
  ConditionMatchResult,
  ReferenceRequest,
  ReferenceSupport,
  RuleTraceEntry,
  SwitchDecision,
} from './types.js';
export { matchesHostPattern, matchesUrlWildcard, normalizeHost } from './wildcard.js';
