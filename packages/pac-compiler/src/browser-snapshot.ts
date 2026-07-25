import {
  serializeProfileSpec,
  type ProfileRouteTarget,
  type ProfileSpec,
} from '@zeroomega-nex/profile-spec';

import { compilePac } from './compiler.js';
import type {
  PacCapabilityAnalysis,
  PacCapabilityIssue,
  PacCompileOptions,
} from './contracts.js';
import { sha256Hex } from './hash.js';
import { verifyPacReferenceSafety } from './reference-safety.js';
import type {
  PacRuntimeSnapshot,
  PacSnapshotContext,
} from './snapshot.js';
import type {
  PacVerificationMismatch,
  PacVerificationVector,
} from './verify.js';

export type BrowserSafePacSnapshotResult =
  | {
      readonly ok: true;
      readonly snapshot: PacRuntimeSnapshot;
      readonly analysis: PacCapabilityAnalysis;
    }
  | {
      readonly ok: false;
      readonly stage: 'compile';
      readonly analysis: PacCapabilityAnalysis;
      readonly issues: readonly PacCapabilityIssue[];
    }
  | {
      readonly ok: false;
      readonly stage: 'verify';
      readonly analysis: PacCapabilityAnalysis;
      readonly mismatches: readonly PacVerificationMismatch[];
    };

function stableRouteValue(route: ProfileRouteTarget): string {
  if (route.kind === 'direct' || route.kind === 'system') return `{"kind":"${route.kind}"}`;
  return `{"kind":"profile","profileId":${JSON.stringify(route.profileId)}}`;
}

export async function createBrowserSafePacSnapshot(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
  vectors: readonly PacVerificationVector[],
  context: PacSnapshotContext,
  options: PacCompileOptions = {},
): Promise<BrowserSafePacSnapshotResult> {
  const compiled = compilePac(spec, startRoute, options);
  if (!compiled.ok) {
    return {
      ok: false,
      stage: 'compile',
      analysis: compiled.analysis,
      issues: compiled.issues,
    };
  }

  const verification = verifyPacReferenceSafety(spec, startRoute, vectors);
  if (!verification.passed) {
    return {
      ok: false,
      stage: 'verify',
      analysis: compiled.analysis,
      mismatches: verification.mismatches,
    };
  }

  const sourceProfileSpecSha256 = await sha256Hex(serializeProfileSpec(spec));
  const scriptSha256 = await sha256Hex(compiled.artifact.script);
  const snapshotIdentity = [
    sourceProfileSpecSha256,
    scriptSha256,
    stableRouteValue(startRoute),
    compiled.artifact.target,
    compiled.artifact.compilerVersion,
  ].join('\n');
  const snapshotId =
    context.snapshotId ?? `pac-${(await sha256Hex(snapshotIdentity)).slice(0, 32)}`;

  return {
    ok: true,
    analysis: compiled.analysis,
    snapshot: {
      snapshotSchemaVersion: 1,
      snapshotId,
      createdAt: context.createdAt,
      sourceDocumentId: spec.documentId,
      sourceRevisionId: spec.revision.id,
      sourceProfileSpecSha256,
      startRoute,
      target: compiled.artifact.target,
      compilerVersion: compiled.artifact.compilerVersion,
      scriptSha256,
      capability: compiled.artifact.capability,
      script: compiled.artifact.script,
      stats: compiled.artifact.stats,
      warnings: compiled.artifact.warnings,
      verification: {
        passed: true,
        mode: 'reference-safety',
        vectorCount: verification.vectorCount,
        matchedCount: verification.matchedCount,
      },
    },
  };
}
