import {
  importZeroOmegaBackup,
  type LegacyImportItem,
  type LegacyImportResult,
} from '../packages/legacy-zeroomega/src/index.js';

const IMPORT_CONTEXT = {
  createdAt: '2000-01-01T00:00:00.000Z',
  documentId: 'owner-corpus-b-preflight',
  revisionId: 'owner-corpus-b-preflight-revision',
  deviceId: 'owner-corpus-b-preflight-device',
} as const;

type Counter = Map<string, number>;
type IntakeMetrics = Readonly<Record<string, unknown>>;

function increment(counter: Counter, key: string): void {
  counter.set(key, (counter.get(key) ?? 0) + 1);
}

function sortedCounts(counter: Counter, label: string): Record<string, string | number>[] {
  return [...counter.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, count]) => ({ [label]: value, count }));
}

function issueScope(sourcePath: string): 'profile' | 'settings' | 'root' {
  if (sourcePath.startsWith('/+')) return 'profile';
  if (sourcePath.startsWith('/-')) return 'settings';
  return 'root';
}

function profileOrdinals(source: string): Map<string, number> {
  const parsed = JSON.parse(source) as Record<string, unknown>;
  const result = new Map<string, number>();
  Object.keys(parsed)
    .filter((key) => key.startsWith('+'))
    .forEach((key, ordinal) => result.set(key.slice(1), ordinal));
  return result;
}

function profileOrdinalForPath(
  sourcePath: string,
  ordinals: ReadonlyMap<string, number>,
): number | undefined {
  for (const [name, ordinal] of ordinals) {
    const prefix = `/+${name}`;
    if (sourcePath === prefix || sourcePath.startsWith(`${prefix}/`)) return ordinal;
  }
  return undefined;
}

function issueSummary(items: readonly LegacyImportItem[], ordinals: ReadonlyMap<string, number>) {
  const groups = new Map<
    string,
    {
      status: LegacyImportItem['status'];
      code: string;
      scope: ReturnType<typeof issueScope>;
      profileOrdinal?: number;
      count: number;
    }
  >();

  for (const item of items) {
    const scope = issueScope(item.sourcePath);
    const profileOrdinal =
      scope === 'profile' ? profileOrdinalForPath(item.sourcePath, ordinals) : undefined;
    const key = `${item.status}\u0000${item.code}\u0000${scope}\u0000${profileOrdinal ?? ''}`;
    const current = groups.get(key);
    if (current) {
      current.count += 1;
      continue;
    }
    groups.set(key, {
      status: item.status,
      code: item.code,
      scope,
      ...(profileOrdinal === undefined ? {} : { profileOrdinal }),
      count: 1,
    });
  }

  return [...groups.values()].sort(
    (left, right) =>
      left.status.localeCompare(right.status) ||
      left.code.localeCompare(right.code) ||
      left.scope.localeCompare(right.scope),
  );
}

function candidateSummary(result: Extract<LegacyImportResult, { ok: true }>) {
  const profileKinds: Counter = new Map();
  const endpointProtocols: Counter = new Map();
  const ruleSourceFormats: Counter = new Map();
  const ruleSourceLocations: Counter = new Map();

  for (const profile of result.candidate.profiles) increment(profileKinds, profile.kind);
  for (const endpoint of result.candidate.proxyEndpoints) {
    increment(endpointProtocols, endpoint.protocol);
  }
  for (const source of result.candidate.ruleSources) {
    increment(ruleSourceFormats, source.format);
    increment(ruleSourceLocations, source.location.kind);
  }

  return {
    profileCount: result.candidate.profiles.length,
    profileKinds: sortedCounts(profileKinds, 'kind'),
    endpointCount: result.candidate.proxyEndpoints.length,
    endpointProtocols: sortedCounts(endpointProtocols, 'protocol'),
    ruleSourceCount: result.candidate.ruleSources.length,
    ruleSourceFormats: sortedCounts(ruleSourceFormats, 'format'),
    ruleSourceLocations: sortedCounts(ruleSourceLocations, 'kind'),
    startupRouteKind: result.candidate.settings.startup.route?.kind ?? 'none',
    quickSwitchEnabled: result.candidate.settings.quickSwitch.enabled,
    quickSwitchRouteCount: result.candidate.settings.quickSwitch.routes.length,
  };
}

function secretSummary(result: Extract<LegacyImportResult, { ok: true }>) {
  const kinds: Counter = new Map();
  for (const material of result.secretMaterials) increment(kinds, material.kind);
  return {
    count: result.secretMaterials.length,
    kinds: sortedCounts(kinds, 'kind'),
  };
}

function decisionFor(result: LegacyImportResult) {
  if (!result.ok) {
    return {
      status: 'blocked',
      readyForBrowserChain: false,
      reason: 'import-rejected',
    } as const;
  }
  if (result.report.summary.rejected > 0) {
    return {
      status: 'blocked',
      readyForBrowserChain: false,
      reason: 'rejected-item-present',
    } as const;
  }
  if (result.report.summary.downgraded > 0) {
    return {
      status: 'blocked',
      readyForBrowserChain: false,
      reason: 'downgrade-present',
    } as const;
  }
  if (result.report.summary.targetDependent > 0) {
    return {
      status: 'review-required',
      readyForBrowserChain: false,
      reason: 'target-dependent-items-present',
    } as const;
  }
  return {
    status: 'ready-for-browser-chain',
    readyForBrowserChain: true,
    reason: 'repository-preflight-clean',
  } as const;
}

export function buildSafeCorpusBPreflightReport(source: string, intakeMetrics: IntakeMetrics) {
  const result = importZeroOmegaBackup(source, IMPORT_CONTEXT);

  return {
    reportVersion: 1,
    role: 'owner-representative-import-preflight',
    containsRawValues: false,
    intake: {
      verified: true,
      metrics: intakeMetrics,
    },
    importer: {
      ok: result.ok,
      source: result.report.source,
      encoding: result.report.encoding,
      containsSecrets: result.report.containsSecrets,
      summary: result.report.summary,
      profileCount: result.report.profileCount,
      endpointCount: result.report.endpointCount,
      ruleSourceCount: result.report.ruleSourceCount,
      issues: issueSummary(result.report.items, profileOrdinals(source)),
      ...(result.ok
        ? {
            activation: result.activation,
            candidate: candidateSummary(result),
            secretMaterials: secretSummary(result),
          }
        : {}),
    },
    decision: decisionFor(result),
  };
}
