import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

import type {
  ProfileWorkflowRevisionHistoryEntry,
  ProfileWorkflowRevisionRepository,
  ProfileWorkflowState,
} from './contracts.js';

function validateRevision(spec: ProfileSpec, documentId: string): void {
  if (spec.documentId !== documentId) {
    throw new TypeError(
      `revision ${spec.revision.id} belongs to document ${spec.documentId}, expected ${documentId}`,
    );
  }
  if (!spec.revision.id) throw new TypeError('revision ID must not be empty');
  if (!Number.isFinite(Date.parse(spec.revision.createdAt))) {
    throw new TypeError(`revision ${spec.revision.id} has an invalid creation time`);
  }
  if (spec.revision.parentId === spec.revision.id) {
    throw new TypeError(`revision ${spec.revision.id} cannot be its own parent`);
  }
}

export async function listProfileWorkflowRevisionHistory(
  repository: ProfileWorkflowRevisionRepository,
  state: ProfileWorkflowState,
): Promise<readonly ProfileWorkflowRevisionHistoryEntry[]> {
  const revisions = await repository.listRevisions();
  const ids = new Set<string>();
  const entries = revisions.map((spec) => {
    validateRevision(spec, state.applied.documentId);
    if (ids.has(spec.revision.id)) {
      throw new TypeError(`revision history contains duplicate ID ${spec.revision.id}`);
    }
    ids.add(spec.revision.id);
    return {
      documentId: spec.documentId,
      revisionId: spec.revision.id,
      ...(spec.revision.parentId === undefined ? {} : { parentRevisionId: spec.revision.parentId }),
      createdAt: spec.revision.createdAt,
      ...(spec.revision.deviceId === undefined ? {} : { deviceId: spec.revision.deviceId }),
      profileCount: spec.profiles.length,
      endpointCount: spec.proxyEndpoints.length,
      ruleSourceCount: spec.ruleSources.length,
      applied: state.applied.revision.id === spec.revision.id,
    } satisfies ProfileWorkflowRevisionHistoryEntry;
  });

  return entries.sort((left, right) => {
    const timeDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt);
    return timeDifference === 0 ? right.revisionId.localeCompare(left.revisionId) : timeDifference;
  });
}
