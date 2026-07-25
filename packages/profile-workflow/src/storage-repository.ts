import { cloneProfileSpec, type ProfileSpec } from '@zeroomega-nex/profile-spec';

import {
  PROFILE_WORKFLOW_SCHEMA_VERSION,
  type ProfileWorkflowApplyRecord,
  type ProfileWorkflowPendingApply,
  type ProfileWorkflowRepository,
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

export function parseProfileWorkflowState(value: unknown): ProfileWorkflowState {
  const state = record(value, 'profile workflow state');
  if (state.workflowSchemaVersion !== PROFILE_WORKFLOW_SCHEMA_VERSION) {
    throw new TypeError('profile workflow state schema version is unsupported');
  }
  if (!Number.isInteger(state.generation) || Number(state.generation) < 0) {
    throw new TypeError('profile workflow state generation is invalid');
  }
  const applied = parseProfileSpec(state.applied, 'applied');
  const draft = parseProfileSpec(state.draft, 'draft');
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

export class BrowserStorageProfileWorkflowRepository implements ProfileWorkflowRepository {
  readonly #area: ProfileWorkflowStorageArea;
  readonly #stateKey: string;

  constructor(area: ProfileWorkflowStorageArea, options: ProfileWorkflowStorageOptions = {}) {
    this.#area = area;
    this.#stateKey = `${options.namespace ?? 'zeroomega-nex/profile-workflow/v1'}/state`;
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
    await this.#area.set({ [this.#stateKey]: normalized });
    return true;
  }
}
