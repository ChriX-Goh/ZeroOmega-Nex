import {
  serializeProfileSpec,
  type ProfileRouteTarget,
  type ProfileSpec,
} from '@zeroomega-nex/profile-spec';

import { compilePac } from './compiler.js';
import {
  type CompiledPacArtifact,
  type PacCapabilityAnalysis,
  type PacCapabilityIssue,
  type PacCompileOptions,
  type PacTarget,
} from './contracts.js';
import { sha256Hex } from './hash.js';
import {
  verifyPacArtifact,
  type PacVerificationMismatch,
  type PacVerificationVector,
} from './verify.js';

export interface PacSnapshotContext {
  readonly snapshotId?: string;
  readonly createdAt: string;
}

export interface PacSnapshotVerification {
  readonly passed: true;
  readonly mode?: 'differential' | 'reference-safety';
  readonly vectorCount: number;
  readonly matchedCount: number;
}

export interface PacRuntimeSnapshot {
  readonly snapshotSchemaVersion: 1;
  readonly snapshotId: string;
  readonly createdAt: string;
  readonly sourceDocumentId: string;
  readonly sourceRevisionId: string;
  readonly sourceProfileSpecSha256: string;
  readonly startRoute: ProfileRouteTarget;
  readonly target: PacTarget;
  readonly compilerVersion: string;
  readonly scriptSha256: string;
  readonly capability: CompiledPacArtifact['capability'];
  readonly script: string;
  readonly stats: CompiledPacArtifact['stats'];
  readonly warnings: readonly PacCapabilityIssue[];
  readonly verification: PacSnapshotVerification;
}

export type PacSnapshotResult =
  | {
      readonly ok: true;
      readonly snapshot: PacRuntimeSnapshot;
      readonly artifact: CompiledPacArtifact;
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
      readonly artifact: CompiledPacArtifact;
      readonly analysis: PacCapabilityAnalysis;
      readonly mismatches: readonly PacVerificationMismatch[];
    };

function stableRouteValue(route: ProfileRouteTarget): string {
  if (route.kind === 'direct' || route.kind === 'system') return `{"kind":"${route.kind}"}`;
  return `{"kind":"profile","profileId":${JSON.stringify(route.profileId)}}`;
}

export async function createVerifiedPacSnapshot(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
  vectors: readonly PacVerificationVector[],
  context: PacSnapshotContext,
  options: PacCompileOptions = {},
): Promise<PacSnapshotResult> {
  const compiled = compilePac(spec, startRoute, options);
  if (!compiled.ok) {
    return {
      ok: false,
      stage: 'compile',
      analysis: compiled.analysis,
      issues: compiled.issues,
    };
  }

  const verification = verifyPacArtifact(spec, startRoute, compiled.artifact, vectors);
  if (!verification.passed) {
    return {
      ok: false,
      stage: 'verify',
      artifact: compiled.artifact,
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
    artifact: compiled.artifact,
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
        mode: 'differential',
        vectorCount: verification.vectorCount,
        matchedCount: verification.matchedCount,
      },
    },
  };
}
