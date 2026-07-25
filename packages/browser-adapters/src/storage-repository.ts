import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';

import type {
  ActivationFailureRecord,
  BuiltInProxyMode,
  PendingActivation,
  PlatformProxyState,
  SnapshotActivationRepository,
  SnapshotActivationState,
} from './contracts.js';
import { jsonValue, recordValue, stringProperty } from './platform-utils.js';

export interface BrowserStorageArea {
  get(keys: string | readonly string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | readonly string[]): Promise<void>;
}

export interface BrowserStorageRepositoryOptions {
  readonly namespace?: string;
}

function optionalString(value: Record<string, unknown>, key: string): string | undefined {
  const candidate = value[key];
  if (candidate === undefined) return undefined;
  if (typeof candidate !== 'string') throw new TypeError(`${key} must be a string`);
  return candidate;
}

function optionalBuiltInMode(
  value: Record<string, unknown>,
  key: string,
): BuiltInProxyMode | undefined {
  const candidate = optionalString(value, key);
  if (candidate === undefined) return undefined;
  if (candidate !== 'direct' && candidate !== 'system') {
    throw new TypeError(`${key} must be direct or system`);
  }
  return candidate;
}

function parsePlatformState(value: unknown): PlatformProxyState {
  const record = recordValue(jsonValue(value, 'platformBefore'));
  if (!record) throw new TypeError('platformBefore must be an object');
  const family = stringProperty(record, 'family');
  const controlLevel = stringProperty(record, 'controlLevel');
  if (family !== 'chromium' && family !== 'firefox') {
    throw new TypeError('platformBefore.family is invalid');
  }
  if (
    controlLevel !== 'not-controllable' &&
    controlLevel !== 'controlled-by-other-extension' &&
    controlLevel !== 'controllable-by-this-extension' &&
    controlLevel !== 'controlled-by-this-extension'
  ) {
    throw new TypeError('platformBefore.controlLevel is invalid');
  }
  if (!('value' in record)) throw new TypeError('platformBefore.value is required');
  return { family, controlLevel, value: record.value! };
}

function parsePending(value: unknown): PendingActivation {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('pending must be an object');
  }
  const record = value as Record<string, unknown>;
  const snapshotId = optionalString(record, 'snapshotId');
  const startedAt = optionalString(record, 'startedAt');
  if (!snapshotId || !startedAt) {
    throw new TypeError('pending snapshotId and startedAt are required');
  }
  const previousActiveSnapshotId = optionalString(record, 'previousActiveSnapshotId');
  const previousActiveBuiltInMode = optionalBuiltInMode(record, 'previousActiveBuiltInMode');
  if (previousActiveSnapshotId !== undefined && previousActiveBuiltInMode !== undefined) {
    throw new TypeError('pending previous active PAC and built-in mode are mutually exclusive');
  }
  return {
    snapshotId,
    ...(previousActiveSnapshotId === undefined ? {} : { previousActiveSnapshotId }),
    ...(previousActiveBuiltInMode === undefined ? {} : { previousActiveBuiltInMode }),
    platformBefore: parsePlatformState(record.platformBefore),
    startedAt,
  };
}

function parseFailure(value: unknown): ActivationFailureRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('lastFailure must be an object');
  }
  const record = value as Record<string, unknown>;
  const snapshotId = optionalString(record, 'snapshotId');
  const stage = optionalString(record, 'stage');
  const message = optionalString(record, 'message');
  const occurredAt = optionalString(record, 'occurredAt');
  if (!snapshotId || !message || !occurredAt) {
    throw new TypeError('lastFailure fields are incomplete');
  }
  if (
    stage !== 'preflight' &&
    stage !== 'install' &&
    stage !== 'confirm' &&
    stage !== 'rollback' &&
    stage !== 'recovery'
  ) {
    throw new TypeError('lastFailure.stage is invalid');
  }
  const rollbackSucceeded = record.rollbackSucceeded;
  if (rollbackSucceeded !== undefined && typeof rollbackSucceeded !== 'boolean') {
    throw new TypeError('lastFailure.rollbackSucceeded must be boolean');
  }
  return {
    snapshotId,
    stage,
    message,
    occurredAt,
    ...(rollbackSucceeded === undefined ? {} : { rollbackSucceeded }),
  };
}

function parseState(value: unknown): SnapshotActivationState {
  if (value === undefined) return {};
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('activation state must be an object');
  }
  const record = value as Record<string, unknown>;
  const activeSnapshotId = optionalString(record, 'activeSnapshotId');
  const lastKnownGoodSnapshotId = optionalString(record, 'lastKnownGoodSnapshotId');
  const activeBuiltInMode = optionalBuiltInMode(record, 'activeBuiltInMode');
  const lastKnownGoodBuiltInMode = optionalBuiltInMode(record, 'lastKnownGoodBuiltInMode');
  if (activeSnapshotId !== undefined && activeBuiltInMode !== undefined) {
    throw new TypeError('active PAC snapshot and built-in mode are mutually exclusive');
  }
  if (lastKnownGoodSnapshotId !== undefined && lastKnownGoodBuiltInMode !== undefined) {
    throw new TypeError('last-known-good PAC snapshot and built-in mode are mutually exclusive');
  }
  return {
    ...(activeSnapshotId === undefined ? {} : { activeSnapshotId }),
    ...(lastKnownGoodSnapshotId === undefined ? {} : { lastKnownGoodSnapshotId }),
    ...(activeBuiltInMode === undefined ? {} : { activeBuiltInMode }),
    ...(lastKnownGoodBuiltInMode === undefined ? {} : { lastKnownGoodBuiltInMode }),
    ...(record.pending === undefined ? {} : { pending: parsePending(record.pending) }),
    ...(record.lastFailure === undefined ? {} : { lastFailure: parseFailure(record.lastFailure) }),
  };
}

function parseSnapshot(value: unknown, expectedId: string): PacRuntimeSnapshot | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`snapshot ${expectedId} must be an object`);
  }
  const record = value as Record<string, unknown>;
  if (
    record.snapshotSchemaVersion !== 1 ||
    record.snapshotId !== expectedId ||
    typeof record.createdAt !== 'string' ||
    typeof record.sourceRevisionId !== 'string' ||
    typeof record.script !== 'string' ||
    typeof record.scriptSha256 !== 'string' ||
    typeof record.sourceProfileSpecSha256 !== 'string'
  ) {
    throw new TypeError(`snapshot ${expectedId} is invalid`);
  }
  return value as PacRuntimeSnapshot;
}

function parseSnapshotIndex(value: unknown): readonly string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry)) {
    throw new TypeError('snapshot index must be an array of non-empty strings');
  }
  if (new Set(value).size !== value.length) {
    throw new TypeError('snapshot index contains duplicate IDs');
  }
  return value;
}

export class BrowserStorageSnapshotActivationRepository implements SnapshotActivationRepository {
  readonly #area: BrowserStorageArea;
  readonly #stateKey: string;
  readonly #snapshotPrefix: string;
  readonly #snapshotIndexKey: string;

  constructor(area: BrowserStorageArea, options: BrowserStorageRepositoryOptions = {}) {
    this.#area = area;
    const namespace = options.namespace ?? 'zeroomega-nex/browser-proxy/v1';
    this.#stateKey = `${namespace}/state`;
    this.#snapshotPrefix = `${namespace}/snapshot/`;
    this.#snapshotIndexKey = `${namespace}/snapshot-index`;
  }

  async getState(): Promise<SnapshotActivationState> {
    const values = await this.#area.get(this.#stateKey);
    return parseState(values[this.#stateKey]);
  }

  async setState(state: SnapshotActivationState): Promise<void> {
    const normalized = parseState(state);
    await this.#area.set({ [this.#stateKey]: normalized });
  }

  async putSnapshot(snapshot: PacRuntimeSnapshot): Promise<void> {
    const normalized = parseSnapshot(snapshot, snapshot.snapshotId);
    if (!normalized) throw new TypeError(`snapshot ${snapshot.snapshotId} is required`);
    const values = await this.#area.get(this.#snapshotIndexKey);
    const index = [...parseSnapshotIndex(values[this.#snapshotIndexKey])];
    if (!index.includes(snapshot.snapshotId)) index.push(snapshot.snapshotId);
    await this.#area.set({
      [`${this.#snapshotPrefix}${snapshot.snapshotId}`]: normalized,
      [this.#snapshotIndexKey]: index,
    });
  }

  async getSnapshot(snapshotId: string): Promise<PacRuntimeSnapshot | undefined> {
    const key = `${this.#snapshotPrefix}${snapshotId}`;
    const values = await this.#area.get(key);
    return parseSnapshot(values[key], snapshotId);
  }

  async listSnapshots(): Promise<readonly PacRuntimeSnapshot[]> {
    const metadata = await this.#area.get([this.#stateKey, this.#snapshotIndexKey]);
    const state = parseState(metadata[this.#stateKey]);
    const snapshotIds = new Set(parseSnapshotIndex(metadata[this.#snapshotIndexKey]));
    if (state.activeSnapshotId) snapshotIds.add(state.activeSnapshotId);
    if (state.lastKnownGoodSnapshotId) snapshotIds.add(state.lastKnownGoodSnapshotId);
    if (snapshotIds.size === 0) return [];

    const ids = [...snapshotIds];
    const keys = ids.map((snapshotId) => `${this.#snapshotPrefix}${snapshotId}`);
    const values = await this.#area.get(keys);
    return ids.map((snapshotId, index) => {
      const snapshot = parseSnapshot(values[keys[index]!], snapshotId);
      if (!snapshot) throw new Error(`snapshot ${snapshotId} is indexed but unavailable`);
      return snapshot;
    });
  }

  async removeSnapshot(snapshotId: string): Promise<void> {
    const values = await this.#area.get(this.#snapshotIndexKey);
    const index = parseSnapshotIndex(values[this.#snapshotIndexKey]).filter(
      (candidate) => candidate !== snapshotId,
    );
    await this.#area.set({ [this.#snapshotIndexKey]: index });
    await this.#area.remove(`${this.#snapshotPrefix}${snapshotId}`);
  }
}
