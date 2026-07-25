import type {
  ProfileWorkflowRepository,
  ProfileWorkflowState,
} from './contracts.js';

function cloneState(state: ProfileWorkflowState): ProfileWorkflowState {
  return structuredClone(state);
}

export class MemoryProfileWorkflowRepository implements ProfileWorkflowRepository {
  #state: ProfileWorkflowState | undefined;
  failNextCompareAndSwap = false;

  constructor(initial?: ProfileWorkflowState) {
    this.#state = initial === undefined ? undefined : cloneState(initial);
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
    this.#state = cloneState(next);
    return true;
  }

  replaceForTest(state: ProfileWorkflowState | undefined): void {
    this.#state = state === undefined ? undefined : cloneState(state);
  }
}
