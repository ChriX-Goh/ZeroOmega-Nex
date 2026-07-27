import {
  BrowserStorageSnapshotActivationRepository,
  type BrowserStorageArea,
  type SnapshotActivationRepository,
  type SnapshotActivationState,
  type SnapshotHistoryRepository,
} from '@zeroomega-nex/browser-adapters';
import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { isPopupTemporarySnapshotId } from '@zeroomega-nex/profile-workflow';

export const POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX =
  'zeroomega-nex/browser-proxy/v1/session-snapshot/';

function parseSnapshot(value: unknown, expectedId: string): PacRuntimeSnapshot | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`temporary snapshot ${expectedId} must be an object`);
  }
  const snapshot = value as Partial<PacRuntimeSnapshot>;
  if (
    snapshot.snapshotSchemaVersion !== 1 ||
    snapshot.snapshotId !== expectedId ||
    typeof snapshot.script !== 'string' ||
    typeof snapshot.scriptSha256 !== 'string'
  ) {
    throw new TypeError(`temporary snapshot ${expectedId} is invalid`);
  }
  return value as PacRuntimeSnapshot;
}

export class SessionSnapshotActivationRepository
  implements SnapshotActivationRepository, SnapshotHistoryRepository
{
  readonly #persistent: BrowserStorageSnapshotActivationRepository;
  readonly #session: BrowserStorageArea;

  constructor(persistent: BrowserStorageSnapshotActivationRepository, session: BrowserStorageArea) {
    this.#persistent = persistent;
    this.#session = session;
  }

  getState(): Promise<SnapshotActivationState> {
    return this.#persistent.getState();
  }

  setState(state: SnapshotActivationState): Promise<void> {
    return this.#persistent.setState(state);
  }

  async putSnapshot(snapshot: PacRuntimeSnapshot): Promise<void> {
    if (!isPopupTemporarySnapshotId(snapshot.snapshotId)) {
      await this.#persistent.putSnapshot(snapshot);
      return;
    }
    await this.#session.set({
      [`${POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX}${snapshot.snapshotId}`]: snapshot,
    });
  }

  async getSnapshot(snapshotId: string): Promise<PacRuntimeSnapshot | undefined> {
    if (!isPopupTemporarySnapshotId(snapshotId)) {
      return this.#persistent.getSnapshot(snapshotId);
    }
    const key = `${POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX}${snapshotId}`;
    const values = await this.#session.get(key);
    return parseSnapshot(values[key], snapshotId);
  }

  listSnapshots(): Promise<readonly PacRuntimeSnapshot[]> {
    return this.#persistent.listSnapshots();
  }

  async removeSnapshot(snapshotId: string): Promise<void> {
    if (isPopupTemporarySnapshotId(snapshotId)) {
      await this.#session.remove(`${POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX}${snapshotId}`);
      return;
    }
    await this.#persistent.removeSnapshot(snapshotId);
  }
}
