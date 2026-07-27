from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'packages/pac-compiler/src/snapshot.ts',
    "  readonly mode?: 'differential' | 'reference-safety';",
    "  readonly mode?: 'differential' | 'reference-safety' | 'structural';",
)

Path('packages/pac-compiler/src/raw-snapshot.ts').write_text(r'''import {
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
    startRoute.profileId,
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
''')

index_path = Path('packages/pac-compiler/src/index.ts')
index = index_path.read_text()
anchor = "export { createVerifiedPacSnapshot } from './snapshot.js';\n"
addition = r'''export {
  createRawPacSnapshot,
  RAW_PAC_SNAPSHOT_VERSION,
  type RawPacSnapshotResult,
} from './raw-snapshot.js';
''' + anchor
if index.count(anchor) != 1:
    raise SystemExit('raw PAC index export anchor missing')
index_path.write_text(index.replace(anchor, addition, 1))

replace_once(
    'packages/profile-workflow/src/contracts.ts',
    "    readonly mode?: 'differential' | 'reference-safety';",
    "    readonly mode?: 'differential' | 'reference-safety' | 'structural';",
)

Path('packages/pac-compiler/src/raw-snapshot.test.ts').write_text(r'''import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { createRawPacSnapshot, RAW_PAC_SNAPSHOT_VERSION } from './raw-snapshot.js';

function fixture(): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: 'raw-pac-document',
    revision: {
      id: 'raw-pac-revision',
      createdAt: '2026-07-28T00:00:00.000Z',
    },
    profiles: [
      {
        id: 'pac-raw',
        name: 'Raw PAC',
        kind: 'pac',
        source: {
          kind: 'inline',
          script: "function FindProxyForURL(url, host) { return 'DIRECT'; }",
        },
      },
    ],
    proxyEndpoints: [],
    ruleSources: [],
    settings: {
      startup: { revertProxyChanges: true },
      quickSwitch: { enabled: false, refreshOnChange: false, routes: [] },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        addConditionsToBottom: false,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: true,
        showAdvancedConditions: false,
        exportLegacyRuleList: true,
      },
      ruleSourceUpdateIntervalMinutes: 1440,
    },
  };
}

describe('raw PAC snapshots', () => {
  it('creates a deterministic top-level target-dependent snapshot', async () => {
    const spec = fixture();
    const result = await createRawPacSnapshot(
      spec,
      { kind: 'profile', profileId: 'pac-raw' },
      "function FindProxyForURL(url, host) { return 'DIRECT'; }",
      { createdAt: '2026-07-28T00:01:00.000Z' },
      'chromium',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.compilerVersion).toBe(RAW_PAC_SNAPSHOT_VERSION);
    expect(result.snapshot.capability).toBe('target-dependent');
    expect(result.snapshot.verification.mode).toBe('structural');
    expect(result.snapshot.script).toContain('FindProxyForURL');
    expect(result.snapshot.snapshotId).toMatch(/^raw-pac-/u);
  });

  it('rejects missing entrypoints and non-PAC routes', async () => {
    const spec = fixture();
    const missing = await createRawPacSnapshot(
      spec,
      { kind: 'profile', profileId: 'pac-raw' },
      "const result = 'DIRECT';",
      { createdAt: '2026-07-28T00:01:00.000Z' },
      'firefox',
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.issues[0]?.code).toBe('raw-pac.missing-entrypoint');

    const wrongRoute = await createRawPacSnapshot(
      spec,
      { kind: 'direct' },
      "function FindProxyForURL() { return 'DIRECT'; }",
      { createdAt: '2026-07-28T00:01:00.000Z' },
      'chromium',
    );
    expect(wrongRoute.ok).toBe(false);
  });
});
''')
