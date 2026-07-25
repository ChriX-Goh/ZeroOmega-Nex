export { evaluateSwitchProfile } from './evaluate.js';
export { evaluateProfileGraph } from './graph.js';
export { ipMatchesPrefix, isIpLiteral, parseIpLiteral } from './ip.js';
export { matchCondition } from './match.js';
export { evaluateRuleListProfile, parseRuleList } from './rule-list.js';
export type {
  ConditionMatchResult,
  GraphDecision,
  GraphEvaluationOptions,
  GraphTraceEntry,
  ParsedRuleListRule,
  ReferenceRequest,
  ReferenceSupport,
  ResolvedReferenceRoute,
  RuleListDecision,
  RuleListParseResult,
  RuleListPriorityGroup,
  RuleListTraceEntry,
  RuleTraceEntry,
  SwitchDecision,
} from './types.js';
export { matchesHostPattern, matchesUrlWildcard, normalizeHost } from './wildcard.js';
