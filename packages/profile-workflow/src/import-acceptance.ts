import { cloneProfileSpec, type ProfileSpec } from '@zeroomega-nex/profile-spec';

import type { ProfileWorkflowRepository, ProfileWorkflowState } from './contracts.js';
import { replaceProfileWorkflowDraft } from './state.js';

export interface ProfileWorkflowSecretMaterial {
  readonly ref: string;
  readonly value: string;
}

export interface ProfileWorkflowSecretStore {
  getSecret(secretRef: string): Promise<string | undefined>;
  putSecret(secretRef: string, secret: string): Promise<void>;
  removeSecret(secretRef: string): Promise<void>;
}

export type ProfileWorkflowImportAcceptanceResult =
  | {
      readonly status: 'accepted';
      readonly state: ProfileWorkflowState;
    }
  | {
      readonly status: 'conflict' | 'invalid' | 'storage-failure' | 'rollback-failed';
      readonly message: string;
      readonly state?: ProfileWorkflowState;
    };

interface SecretSnapshot {
  readonly ref: string;
  readonly previous?: string;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeSecretMaterials(
  materials: readonly ProfileWorkflowSecretMaterial[],
): readonly ProfileWorkflowSecretMaterial[] {
  const byReference = new Map<string, string>();
  for (const material of materials) {
    if (typeof material.ref !== 'string' || material.ref.trim().length === 0) {
      throw new TypeError('imported secret reference must not be empty');
    }
    if (typeof material.value !== 'string') {
      throw new TypeError(`imported secret ${material.ref} must be a string`);
    }
    const ref = material.ref.trim();
    const previous = byReference.get(ref);
    if (previous !== undefined && previous !== material.value) {
      throw new TypeError(`imported secret reference ${ref} has conflicting values`);
    }
    byReference.set(ref, material.value);
  }
  return [...byReference].map(([ref, value]) => ({ ref, value }));
}

export function normalizeImportedProfileWorkflowDraft(
  state: ProfileWorkflowState,
  candidate: ProfileSpec,
): ProfileSpec {
  const draft = cloneProfileSpec(candidate);
  draft.documentId = state.applied.documentId;
  draft.revision = structuredClone(state.applied.revision);
  return draft;
}

async function restoreSecrets(
  store: ProfileWorkflowSecretStore,
  snapshots: readonly SecretSnapshot[],
): Promise<void> {
  const failures: string[] = [];
  for (const snapshot of [...snapshots].reverse()) {
    try {
      if (snapshot.previous === undefined) await store.removeSecret(snapshot.ref);
      else await store.putSecret(snapshot.ref, snapshot.previous);
    } catch (error) {
      failures.push(`${snapshot.ref}: ${messageFrom(error)}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(`secret rollback failed for ${failures.join('; ')}`);
  }
}

export async function acceptProfileWorkflowImport(
  repository: ProfileWorkflowRepository,
  state: ProfileWorkflowState,
  candidate: ProfileSpec,
  materials: readonly ProfileWorkflowSecretMaterial[],
  secretStore?: ProfileWorkflowSecretStore,
): Promise<ProfileWorkflowImportAcceptanceResult> {
  let next: ProfileWorkflowState;
  let normalizedMaterials: readonly ProfileWorkflowSecretMaterial[];
  try {
    next = replaceProfileWorkflowDraft(
      state,
      normalizeImportedProfileWorkflowDraft(state, candidate),
    );
    normalizedMaterials = normalizeSecretMaterials(materials);
    if (normalizedMaterials.length > 0 && !secretStore) {
      throw new Error('profile workflow import secret store is unavailable');
    }
  } catch (error) {
    return { status: 'invalid', message: messageFrom(error), state };
  }

  const snapshots: SecretSnapshot[] = [];
  if (secretStore) {
    try {
      for (const material of normalizedMaterials) {
        const previous = await secretStore.getSecret(material.ref);
        snapshots.push({
          ref: material.ref,
          ...(previous === undefined ? {} : { previous }),
        });
        await secretStore.putSecret(material.ref, material.value);
      }
    } catch (error) {
      try {
        await restoreSecrets(secretStore, snapshots);
      } catch (rollbackError) {
        return {
          status: 'rollback-failed',
          message: `${messageFrom(error)}; ${messageFrom(rollbackError)}`,
          state,
        };
      }
      return { status: 'storage-failure', message: messageFrom(error), state };
    }
  }

  try {
    if (await repository.compareAndSwap(state.generation, next)) {
      return { status: 'accepted', state: next };
    }
    const current = await repository.read();
    if (secretStore) await restoreSecrets(secretStore, snapshots);
    return {
      status: 'conflict',
      message: 'profile workflow changed before the imported Draft could be persisted',
      ...(current === undefined ? {} : { state: current }),
    };
  } catch (error) {
    if (secretStore) {
      try {
        await restoreSecrets(secretStore, snapshots);
      } catch (rollbackError) {
        return {
          status: 'rollback-failed',
          message: `${messageFrom(error)}; ${messageFrom(rollbackError)}`,
          state,
        };
      }
    }
    return { status: 'storage-failure', message: messageFrom(error), state };
  }
}
