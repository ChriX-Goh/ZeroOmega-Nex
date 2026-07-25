import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';

import type {
  SnapshotActivationRepository,
  SnapshotActivationState,
} from './contracts.js';

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemorySnapshotActivationRepository implements SnapshotActivationRepository {
  #state: SnapshotActivationState;
  readonly #snapshots = new Map<string, PacRuntimeSnapshot>();

  constructor(initialState: SnapshotActivationState = {}) {
    this.#state = clone(initialState);
  }

  async getState(): Promise<SnapshotActivationState> {
    return clone(this.#state);
  }

  async setState(state: SnapshotActivationState): Promise<void> {
    this.#state = clone(state);
  }

  async putSnapshot(snapshot: PacRuntimeSnapshot): Promise<void> {
    this.#snapshots.set(snapshot.snapshotId, clone(snapshot));
  }

  async getSnapshot(snapshotId: string): Promise<PacRuntimeSnapshot | undefined> {
    const snapshot = this.#snapshots.get(snapshotId);
    return snapshot === undefined ? undefined : clone(snapshot);
  }
}
