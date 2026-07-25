import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

import type {
  ProfileWorkflowRepository,
  ProfileWorkflowRevisionRepository,
  ProfileWorkflowState,
} from './contracts.js';

function cloneState(state: ProfileWorkflowState): ProfileWorkflowState {
  return structuredClone(state);
}

function cloneSpec(spec: ProfileSpec): ProfileSpec {
  return structuredClone(spec);
}

function sameSpec(left: ProfileSpec, right: ProfileSpec): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class MemoryProfileWorkflowRepository
  implements ProfileWorkflowRepository, ProfileWorkflowRevisionRepository
{
  #state: ProfileWorkflowState | undefined;
  readonly #revisions = new Map<string, ProfileSpec>();
  failNextCompareAndSwap = false;

  constructor(initial?: ProfileWorkflowState) {
    this.#state = initial === undefined ? undefined : cloneState(initial);
    if (initial) this.#archive(initial.applied);
  }

  async read(): Promise<ProfileWorkflowState | undefined> {
    return this.#state === undefined ? undefined : cloneState(this.#state);
  }

  async compareAndSwap(
    expectedGeneration: number | undefined,
    next: ProfileWorkflowState,
  ): Promise<boolean> {
    if (this.failNextCompareAndSwap) {
      this.failNextCompareAndSwap = false;
      return false;
    }
    if (this.#state?.generation !== expectedGeneration) return false;
    if (this.#state) this.#archive(this.#state.applied);
    this.#archive(next.applied);
    this.#state = cloneState(next);
    return true;
  }

  async getRevision(revisionId: string): Promise<ProfileSpec | undefined> {
    const revision = this.#revisions.get(revisionId);
    return revision === undefined ? undefined : cloneSpec(revision);
  }

  async listRevisions(): Promise<readonly ProfileSpec[]> {
    return [...this.#revisions.values()].map(cloneSpec);
  }

  replaceForTest(state: ProfileWorkflowState | undefined): void {
    this.#state = state === undefined ? undefined : cloneState(state);
    this.#revisions.clear();
    if (state) this.#archive(state.applied);
  }

  #archive(spec: ProfileSpec): void {
    const existing = this.#revisions.get(spec.revision.id);
    if (existing && !sameSpec(existing, spec)) {
      throw new TypeError(`immutable revision ${spec.revision.id} differs from its archived value`);
    }
    if (!existing) this.#revisions.set(spec.revision.id, cloneSpec(spec));
  }
}
