import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  evaluateProfileGraph,
  type GraphDecision,
  type ReferenceSupport,
} from '@zeroomega-nex/reference-interpreter';

import { pacDirective } from './escape.js';
import type {
  PacVerificationMismatch,
  PacVerificationResult,
  PacVerificationVector,
} from './verify.js';

function comparableReferenceResult(decision: GraphDecision): { reason?: string } {
  if (decision.status !== 'resolved') {
    return { reason: `reference decision is ${decision.status}: ${decision.reason}` };
  }
  if (decision.route.kind === 'direct') return {};
  if (decision.route.kind === 'system') {
    return { reason: 'reference decision selected System, which PAC cannot represent' };
  }
  try {
    pacDirective(decision.route.endpoint);
    return {};
  } catch (error) {
    return {
      reason: error instanceof Error ? error.message : 'reference endpoint is not PAC-representable',
    };
  }
}

export function verifyPacReferenceSafety(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
  vectors: readonly PacVerificationVector[],
): PacVerificationResult {
  const mismatches: PacVerificationMismatch[] = [];

  for (const vector of vectors) {
    const reference = evaluateProfileGraph(spec, startRoute, vector.request);
    const comparable = comparableReferenceResult(reference);
    if (comparable.reason !== undefined) {
      mismatches.push({
        vectorId: vector.id,
        support: reference.support as ReferenceSupport,
        reason: comparable.reason,
      });
    }
  }

  return {
    passed: mismatches.length === 0,
    vectorCount: vectors.length,
    matchedCount: vectors.length - mismatches.length,
    mismatches,
  };
}
