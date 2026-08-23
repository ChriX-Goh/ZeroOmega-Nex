import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import type { ProfileRouteTarget } from '@zeroomega-nex/profile-spec';

import type { SnapshotActivationState } from './contracts.js';

export interface SnapshotHistoryRepository {
  getState(): Promise<SnapshotActivationState>;
  listSnapshots(): Promise<readonly PacRuntimeSnapshot[]>;
}

export interface PacSnapshotHistoryEntry {
  readonly snapshotId: string;
  readonly createdAt: string;
  readonly sourceDocumentId: string;
  readonly sourceRevisionId: string;
  readonly startRoute: ProfileRouteTarget;
  readonly target: PacRuntimeSnapshot['target'];
  readonly compilerVersion: string;
  readonly capability: PacRuntimeSnapshot['capability'];
  readonly scriptSha256Prefix: string;
  readonly sourceProfileSpecSha256Prefix: string;
  readonly verification: PacRuntimeSnapshot['verification'];
  readonly stats: PacRuntimeSnapshot['stats'];
  readonly warnings: PacRuntimeSnapshot['warnings'];
  readonly active: boolean;
  readonly lastKnownGood: boolean;
}

function assertHistorySnapshot(snapshot: PacRuntimeSnapshot): void {
  if (!snapshot.snapshotId) throw new TypeError('snapshot history ID must not be empty');
  if (!Number.isFinite(Date.parse(snapshot.createdAt))) {
    throw new TypeError(`snapshot ${snapshot.snapshotId} has an invalid creation time`);
  }
  if (!snapshot.sourceDocumentId || !snapshot.sourceRevisionId) {
    throw new TypeError(`snapshot ${snapshot.snapshotId} has incomplete source identity`);
  }
  if (!snapshot.compilerVersion || !snapshot.scriptSha256 || !snapshot.sourceProfileSpecSha256) {
    throw new TypeError(`snapshot ${snapshot.snapshotId} has incomplete compiler identity`);
  }
  if (!snapshot.verification.passed) {
    throw new TypeError(`snapshot ${snapshot.snapshotId} is not verified`);
  }
}

export async function listPacSnapshotHistory(
  repository: SnapshotHistoryRepository,
): Promise<readonly PacSnapshotHistoryEntry[]> {
  const [state, snapshots] = await Promise.all([repository.getState(), repository.listSnapshots()]);
  const ids = new Set<string>();
  const entries = snapshots.map((snapshot) => {
    assertHistorySnapshot(snapshot);
    if (ids.has(snapshot.snapshotId)) {
      throw new TypeError(`snapshot history contains duplicate ID ${snapshot.snapshotId}`);
    }
    ids.add(snapshot.snapshotId);
    return {
      snapshotId: snapshot.snapshotId,
      createdAt: snapshot.createdAt,
      sourceDocumentId: snapshot.sourceDocumentId,
      sourceRevisionId: snapshot.sourceRevisionId,
      startRoute: structuredClone(snapshot.startRoute),
      target: snapshot.target,
      compilerVersion: snapshot.compilerVersion,
      capability: snapshot.capability,
      scriptSha256Prefix: snapshot.scriptSha256.slice(0, 12),
      sourceProfileSpecSha256Prefix: snapshot.sourceProfileSpecSha256.slice(0, 12),
      verification: structuredClone(snapshot.verification),
      stats: structuredClone(snapshot.stats),
      warnings: structuredClone(snapshot.warnings),
      active: state.activeSnapshotId === snapshot.snapshotId,
      lastKnownGood: state.lastKnownGoodSnapshotId === snapshot.snapshotId,
    } satisfies PacSnapshotHistoryEntry;
  });

  return entries.sort((left, right) => {
    const timeDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt);
    return timeDifference === 0 ? right.snapshotId.localeCompare(left.snapshotId) : timeDifference;
  });
}
