import {
  serializeProfileSpec,
  type PacProfile,
  type ProfileRouteTarget,
  type ProfileSpec,
} from '@zeroomega-nex/profile-spec';

import {
  DEFAULT_PAC_COMPILER_BUDGETS,
  type PacCapabilityIssue,
  type PacTarget,
} from './contracts.js';
import { sha256Hex } from './hash.js';
import type { PacRuntimeSnapshot, PacSnapshotContext } from './snapshot.js';

export const RAW_PAC_SNAPSHOT_VERSION = 'raw-pac/1' as const;

export type RawPacSnapshotResult =
  | { readonly ok: true; readonly snapshot: PacRuntimeSnapshot }
  | { readonly ok: false; readonly issues: readonly PacCapabilityIssue[] };

function failure(path: string, code: string, message: string): RawPacSnapshotResult {
  return {
    ok: false,
    issues: [
      {
        code,
        path,
        capability: 'unsupported',
        severity: 'error',
        blocking: true,
        message,
      },
    ],
  };
}

function profileForRoute(spec: ProfileSpec, route: ProfileRouteTarget): PacProfile | undefined {
  if (route.kind !== 'profile') return undefined;
  return spec.profiles.find(
    (profile): profile is PacProfile => profile.id === route.profileId && profile.kind === 'pac',
  );
}

export async function createRawPacSnapshot(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
  scriptInput: string,
  context: PacSnapshotContext,
  target: PacTarget,
): Promise<RawPacSnapshotResult> {
  const profile = profileForRoute(spec, startRoute);
  if (!profile) {
    return failure(
      '/startRoute',
      'raw-pac.not-top-level-pac',
      'Raw PAC snapshots require a top-level PAC Profile route.',
    );
  }

  const profileIndex = spec.profiles.indexOf(profile);
  const scriptPath = `/profiles/${profileIndex}/source/script`;
  const script = scriptInput.replace(/^\uFEFF/u, '');
  if (!script.trim()) {
    return failure(scriptPath, 'raw-pac.empty-script', 'PAC Script must not be empty.');
  }
  if (script.includes('\u0000')) {
    return failure(scriptPath, 'raw-pac.nul-byte', 'PAC Script must not contain NUL bytes.');
  }
  if (!/\bfunction\s+FindProxyForURL\s*\(/u.test(script)) {
    return failure(
      scriptPath,
      'raw-pac.missing-entrypoint',
      'PAC Script must define function FindProxyForURL(url, host).',
    );
  }

  const scriptBytes = new TextEncoder().encode(script).length;
  if (scriptBytes > DEFAULT_PAC_COMPILER_BUDGETS.maxScriptBytes) {
    return failure(
      scriptPath,
      'raw-pac.script-bytes-exceeded',
      `PAC Script size ${scriptBytes} exceeds the ${DEFAULT_PAC_COMPILER_BUDGETS.maxScriptBytes}-byte limit.`,
    );
  }

  const sourceProfileSpecSha256 = await sha256Hex(serializeProfileSpec(spec));
  const scriptSha256 = await sha256Hex(script);
  const snapshotIdentity = [
    sourceProfileSpecSha256,
    scriptSha256,
    profile.id,
    target,
    RAW_PAC_SNAPSHOT_VERSION,
  ].join('\n');
  const snapshotId =
    context.snapshotId ?? `raw-pac-${(await sha256Hex(snapshotIdentity)).slice(0, 32)}`;
  const warnings: readonly PacCapabilityIssue[] = [
    {
      code: 'raw-pac.target-dependent',
      path: scriptPath,
      capability: 'target-dependent',
      severity: 'warning',
      blocking: false,
      message:
        'Arbitrary PAC code is installed only as a top-level browser policy and cannot be differentially verified against the typed profile graph.',
    },
  ];

  return {
    ok: true,
    snapshot: {
      snapshotSchemaVersion: 1,
      snapshotId,
      createdAt: context.createdAt,
      sourceDocumentId: spec.documentId,
      sourceRevisionId: spec.revision.id,
      sourceProfileSpecSha256,
      startRoute,
      target,
      compilerVersion: RAW_PAC_SNAPSHOT_VERSION,
      scriptSha256,
      capability: 'target-dependent',
      script,
      stats: {
        scriptBytes,
        profileCount: 1,
        endpointCount: 0,
        conditionCount: 0,
        ruleListRuleCount: 0,
      },
      warnings,
      verification: {
        passed: true,
        mode: 'structural',
        vectorCount: 1,
        matchedCount: 1,
      },
    },
  };
}
