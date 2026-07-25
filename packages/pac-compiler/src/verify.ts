import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  evaluateProfileGraph,
  type GraphDecision,
  type ReferenceRequest,
  type ReferenceSupport,
} from '@zeroomega-nex/reference-interpreter';

import type { CompiledPacArtifact } from './contracts.js';
import { pacDirective } from './escape.js';
import { createPacEvaluator } from './harness.js';

export interface PacVerificationVector {
  readonly id: string;
  readonly request: ReferenceRequest;
}

export interface PacVerificationMismatch {
  readonly vectorId: string;
  readonly support: ReferenceSupport;
  readonly expected?: string;
  readonly actual?: string;
  readonly reason: string;
}

export interface PacVerificationResult {
  readonly passed: boolean;
  readonly vectorCount: number;
  readonly matchedCount: number;
  readonly mismatches: readonly PacVerificationMismatch[];
}

function referencePacResult(decision: GraphDecision): { value?: string; reason?: string } {
  if (decision.status !== 'resolved') {
    return { reason: `reference decision is ${decision.status}: ${decision.reason}` };
  }
  if (decision.route.kind === 'direct') return { value: 'DIRECT' };
  if (decision.route.kind === 'system') {
    return { reason: 'reference decision selected System, which PAC cannot represent' };
  }
  return { value: pacDirective(decision.route.endpoint) };
}

export function verifyPacArtifact(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
  artifact: CompiledPacArtifact,
  vectors: readonly PacVerificationVector[],
): PacVerificationResult {
  const mismatches: PacVerificationMismatch[] = [];

  for (const vector of vectors) {
    const reference = evaluateProfileGraph(spec, startRoute, vector.request);
    const expected = referencePacResult(reference);
    if (expected.value === undefined) {
      mismatches.push({
        vectorId: vector.id,
        support: reference.support,
        reason: expected.reason ?? 'reference route is not PAC-comparable',
      });
      continue;
    }

    let actual: string;
    try {
      const evaluator = createPacEvaluator(artifact.script, vector.request);
      actual = evaluator(vector.request.url, vector.request.host);
    } catch (error) {
      mismatches.push({
        vectorId: vector.id,
        support: reference.support,
        expected: expected.value,
        reason: error instanceof Error ? error.message : 'PAC execution failed',
      });
      continue;
    }

    if (actual !== expected.value) {
      mismatches.push({
        vectorId: vector.id,
        support: reference.support,
        expected: expected.value,
        actual,
        reason: 'generated PAC result differs from the reference interpreter',
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
