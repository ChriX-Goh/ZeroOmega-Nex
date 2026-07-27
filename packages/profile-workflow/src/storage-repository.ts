import {
  cloneProfileSpec,
  cloneProfileSpecDraft,
  type ProfileSpec,
} from '@zeroomega-nex/profile-spec';

import {
  PROFILE_WORKFLOW_SCHEMA_VERSION,
  type ProfileWorkflowApplyRecord,
  type ProfileWorkflowPendingApply,
  type ProfileWorkflowRepository,
  type ProfileWorkflowRevisionRepository,
  type ProfileWorkflowRuleSourceUpdateRecord,
  type ProfileWorkflowState,
} from './contracts.js';

export interface ProfileWorkflowStorageArea {
  get(keys: string | readonly string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface ProfileWorkflowStorageOptions {
  readonly namespace?: string;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: Record<string, unknown>, key: string, label: string): string {
  const candidate = value[key];
  if (typeof candidate !== 'string' || !candidate) {
    throw new TypeError(`${label}.${key} must be a non-empty string`);
  }
  return candidate;
}

function parseProfileSpec(value: unknown, label: string): ProfileSpec {
  try {
    return cloneProfileSpec(value as ProfileSpec);
  } catch {
    throw new TypeError(`${label} must be a valid ProfileSpec`);
  }
}

function parseProfileSpecDraft(value: unknown, label: string): ProfileSpec {
  try {
    return cloneProfileSpecDraft(value as ProfileSpec);
  } catch {
    throw new TypeError(`${label} must be a structurally valid ProfileSpec draft`);
  }
}

function parseArchivedRevision(value: unknown, revisionId: string): ProfileSpec | undefined {
  if (value === undefined) return undefined;
  const spec = parseProfileSpec(value, `revision ${revisionId}`);
  if (spec.revision.id !== revisionId) {
    throw new TypeError(`revision ${revisionId} has a mismatched revision ID`);
  }
  return spec;
}

function parseRevisionIndex(value: unknown): readonly string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || !entry)) {
    throw new TypeError('revision index must be an array of non-empty strings');
  }
  if (new Set(value).size !== value.length) {
    throw new TypeError('revision index contains duplicate IDs');
  }
  return value;
}

function sameSpec(left: ProfileSpec, right: ProfileSpec): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parsePending(value: unknown): ProfileWorkflowPendingApply {
  const pending = record(value, 'pendingApply');
  const phase = pending.phase;
  if (phase !== 'activating' && phase !== 'committing' && phase !== 'rollback-required') {
    throw new TypeError('pendingApply.phase is invalid');
  }
  return {
    applyId: requiredString(pending, 'applyId', 'pendingApply'),
    candidate: parseProfileSpec(pending.candidate, 'pendingApply.candidate'),
    previousAppliedRevisionId: requiredString(pending, 'previousAppliedRevisionId', 'pendingApply'),
    startedAt: requiredString(pending, 'startedAt', 'pendingApply'),
    phase,
  };
}

function parseLastApply(value: unknown): ProfileWorkflowApplyRecord {
  const lastApply = record(value, 'lastApply');
  const status = lastApply.status;
  if (status === 'succeeded') {
    return {
      status,
      applyId: requiredString(lastApply, 'applyId', 'lastApply'),
      revisionId: requiredString(lastApply, 'revisionId', 'lastApply'),
      snapshotId: requiredString(lastApply, 'snapshotId', 'lastApply'),
      completedAt: requiredString(lastApply, 'completedAt', 'lastApply'),
    };
  }
  if (status !== 'failed') throw new TypeError('lastApply.status is invalid');
  const stage = lastApply.stage;
  if (stage !== 'prepare' && stage !== 'activate' && stage !== 'commit' && stage !== 'rollback') {
    throw new TypeError('lastApply.stage is invalid');
  }
  const rollbackSucceeded = lastApply.rollbackSucceeded;
  if (rollbackSucceeded !== undefined && typeof rollbackSucceeded !== 'boolean') {
    throw new TypeError('lastApply.rollbackSucceeded must be boolean');
  }
  return {
    status,
    applyId: requiredString(lastApply, 'applyId', 'lastApply'),
    stage,
    message: requiredString(lastApply, 'message', 'lastApply'),
    occurredAt: requiredString(lastApply, 'occurredAt', 'lastApply'),
    ...(rollbackSucceeded === undefined ? {} : { rollbackSucceeded }),
  };
}

function optionalString(
  value: Record<string, unknown>,
  key: string,
  label: string,
): string | undefined {
  const candidate = value[key];
  if (candidate === undefined) return undefined;
  if (typeof candidate !== 'string' || !candidate) {
    throw new TypeError(`${label}.${key} must be a non-empty string`);
  }
  return candidate;
}

function parseRuleSourceUpdates(
  value: unknown,
): Readonly<Record<string, ProfileWorkflowRuleSourceUpdateRecord>> | undefined {
  if (value === undefined) return undefined;
  const updates = record(value, 'ruleSourceUpdates');
  const parsed: Record<string, ProfileWorkflowRuleSourceUpdateRecord> = {};
  for (const [sourceId, raw] of Object.entries(updates)) {
    if (!sourceId) throw new TypeError('ruleSourceUpdates keys must not be empty');
    const entry = record(raw, `ruleSourceUpdates.${sourceId}`);
    const parsedSourceId = requiredString(entry, 'sourceId', `ruleSourceUpdates.${sourceId}`);
    if (parsedSourceId !== sourceId) {
      throw new TypeError(`ruleSourceUpdates.${sourceId}.sourceId must match its key`);
    }
    const lastBytes = entry.lastBytes;
    if (lastBytes !== undefined && (!Number.isInteger(lastBytes) || Number(lastBytes) < 0)) {
      throw new TypeError(`ruleSourceUpdates.${sourceId}.lastBytes must be a non-negative integer`);
    }
    const lastErrorRaw = entry.lastError;
    const lastError =
      lastErrorRaw === undefined
        ? undefined
        : (() => {
            const error = record(lastErrorRaw, `ruleSourceUpdates.${sourceId}.lastError`);
            return {
              occurredAt: requiredString(
                error,
                'occurredAt',
                `ruleSourceUpdates.${sourceId}.lastError`,
              ),
              message: requiredString(error, 'message', `ruleSourceUpdates.${sourceId}.lastError`),
            };
          })();
    parsed[sourceId] = {
      sourceId,
      url: requiredString(entry, 'url', `ruleSourceUpdates.${sourceId}`),
      lastAttemptAt: requiredString(entry, 'lastAttemptAt', `ruleSourceUpdates.${sourceId}`),
      ...(optionalString(entry, 'lastSuccessAt', `ruleSourceUpdates.${sourceId}`) === undefined
        ? {}
        : {
            lastSuccessAt: optionalString(entry, 'lastSuccessAt', `ruleSourceUpdates.${sourceId}`)!,
          }),
      ...(lastBytes === undefined ? {} : { lastBytes: Number(lastBytes) }),
      ...(lastError === undefined ? {} : { lastError }),
    };
  }
  return parsed;
}

export function parseProfileWorkflowState(value: unknown): ProfileWorkflowState {
  const state = record(value, 'profile workflow state');
  if (state.workflowSchemaVersion !== PROFILE_WORKFLOW_SCHEMA_VERSION) {
    throw new TypeError('profile workflow state schema version is unsupported');
  }
  if (!Number.isInteger(state.generation) || Number(state.generation) < 0) {
    throw new TypeError('profile workflow state generation is invalid');
  }
  const applied = parseProfileSpec(state.applied, 'applied');
  const draft = parseProfileSpecDraft(state.draft, 'draft');
  if (applied.documentId !== draft.documentId) {
    throw new TypeError('applied and draft document IDs do not match');
  }
  if (applied.revision.id !== draft.revision.id) {
    throw new TypeError('draft must retain the applied revision until Apply succeeds');
  }
  const selectedProfileId = state.selectedProfileId;
  if (selectedProfileId !== undefined && typeof selectedProfileId !== 'string') {
    throw new TypeError('selectedProfileId must be a string');
  }

  const parsed: ProfileWorkflowState = {
    workflowSchemaVersion: PROFILE_WORKFLOW_SCHEMA_VERSION,
    generation: Number(state.generation),
    applied,
    draft,
    ...(selectedProfileId === undefined ? {} : { selectedProfileId }),
    ...(parseRuleSourceUpdates(state.ruleSourceUpdates) === undefined
      ? {}
      : { ruleSourceUpdates: parseRuleSourceUpdates(state.ruleSourceUpdates)! }),
    ...(state.pendingApply === undefined ? {} : { pendingApply: parsePending(state.pendingApply) }),
    ...(state.lastApply === undefined ? {} : { lastApply: parseLastApply(state.lastApply) }),
  };
  if (
    parsed.pendingApply &&
    parsed.pendingApply.previousAppliedRevisionId !== parsed.applied.revision.id
  ) {
    throw new TypeError('pending Apply does not reference the current applied revision');
  }
  return parsed;
}

export class BrowserStorageProfileWorkflowRepository
  implements ProfileWorkflowRepository, ProfileWorkflowRevisionRepository
{
  readonly #area: ProfileWorkflowStorageArea;
  readonly #stateKey: string;
  readonly #revisionPrefix: string;
  readonly #revisionIndexKey: string;

  constructor(area: ProfileWorkflowStorageArea, options: ProfileWorkflowStorageOptions = {}) {
    this.#area = area;
    const namespace = options.namespace ?? 'zeroomega-nex/profile-workflow/v1';
    this.#stateKey = `${namespace}/state`;
    this.#revisionPrefix = `${namespace}/revision/`;
    this.#revisionIndexKey = `${namespace}/revision-index`;
  }

  async read(): Promise<ProfileWorkflowState | undefined> {
    const values = await this.#area.get(this.#stateKey);
    const value = values[this.#stateKey];
    return value === undefined ? undefined : parseProfileWorkflowState(value);
  }

  async compareAndSwap(
    expectedGeneration: number | undefined,
    next: ProfileWorkflowState,
  ): Promise<boolean> {
    const current = await this.read();
    if (current?.generation !== expectedGeneration) return false;
    const expectedNextGeneration = expectedGeneration === undefined ? 0 : expectedGeneration + 1;
    if (next.generation !== expectedNextGeneration) {
      throw new RangeError(
        `next generation must be ${expectedNextGeneration}, received ${next.generation}`,
      );
    }
    const normalized = parseProfileWorkflowState(next);
    const revisions = new Map<string, ProfileSpec>();
    if (current) revisions.set(current.applied.revision.id, current.applied);
    revisions.set(normalized.applied.revision.id, normalized.applied);

    const revisionKeys = [...revisions].map(
      ([revisionId]) => `${this.#revisionPrefix}${revisionId}`,
    );
    const stored = await this.#area.get([this.#revisionIndexKey, ...revisionKeys]);
    const index = [...parseRevisionIndex(stored[this.#revisionIndexKey])];
    const writes: Record<string, unknown> = { [this.#stateKey]: normalized };

    for (const [revisionId, spec] of revisions) {
      const key = `${this.#revisionPrefix}${revisionId}`;
      const existing = parseArchivedRevision(stored[key], revisionId);
      if (existing && !sameSpec(existing, spec)) {
        throw new TypeError(`immutable revision ${revisionId} differs from its archived value`);
      }
      if (!existing) writes[key] = cloneProfileSpec(spec);
      if (!index.includes(revisionId)) index.push(revisionId);
    }
    writes[this.#revisionIndexKey] = index;
    await this.#area.set(writes);
    return true;
  }

  async getRevision(revisionId: string): Promise<ProfileSpec | undefined> {
    const key = `${this.#revisionPrefix}${revisionId}`;
    const values = await this.#area.get([this.#stateKey, key]);
    const archived = parseArchivedRevision(values[key], revisionId);
    if (archived) return archived;
    const stateValue = values[this.#stateKey];
    if (stateValue === undefined) return undefined;
    const state = parseProfileWorkflowState(stateValue);
    return state.applied.revision.id === revisionId ? cloneProfileSpec(state.applied) : undefined;
  }

  async listRevisions(): Promise<readonly ProfileSpec[]> {
    const metadata = await this.#area.get([this.#stateKey, this.#revisionIndexKey]);
    const state =
      metadata[this.#stateKey] === undefined
        ? undefined
        : parseProfileWorkflowState(metadata[this.#stateKey]);
    const revisionIds = new Set(parseRevisionIndex(metadata[this.#revisionIndexKey]));
    if (state) revisionIds.add(state.applied.revision.id);
    if (revisionIds.size === 0) return [];

    const ids = [...revisionIds];
    const keys = ids.map((revisionId) => `${this.#revisionPrefix}${revisionId}`);
    const values = await this.#area.get(keys);
    return ids.map((revisionId, index) => {
      const archived = parseArchivedRevision(values[keys[index]!], revisionId);
      if (archived) return archived;
      if (state?.applied.revision.id === revisionId) return cloneProfileSpec(state.applied);
      throw new Error(`revision ${revisionId} is indexed but unavailable`);
    });
  }
}
