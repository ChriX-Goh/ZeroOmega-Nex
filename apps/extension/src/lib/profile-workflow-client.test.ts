import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_STATE_STORAGE_KEY,
  subscribeProfileWorkflowStateChanges,
  type ProfileWorkflowStorageChangeListener,
} from './profile-workflow-client';

class FakeStorageChanges {
  readonly listeners = new Set<ProfileWorkflowStorageChangeListener>();

  addListener(listener: ProfileWorkflowStorageChangeListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: ProfileWorkflowStorageChangeListener): void {
    this.listeners.delete(listener);
  }

  fire(changes: Readonly<Record<string, { readonly newValue?: unknown }>>, areaName: string): void {
    for (const listener of this.listeners) listener(changes, areaName);
  }
}

describe('profile workflow storage synchronization', () => {
  it('subscribes only to local workflow-state changes and disposes cleanly', () => {
    const onChanged = new FakeStorageChanges();
    const values: unknown[] = [];
    const dispose = subscribeProfileWorkflowStateChanges(
      (value) => {
        values.push(value);
      },
      {
        runtime: { sendMessage: async () => undefined },
        storage: { onChanged },
      },
    );

    onChanged.fire({ other: { newValue: 1 } }, 'local');
    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 2 } }, 'sync');
    expect(values).toEqual([]);

    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 3 } }, 'local');
    expect(values).toEqual([3]);

    dispose();
    expect(onChanged.listeners.size).toBe(0);
    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 4 } }, 'local');
    expect(values).toEqual([3]);
  });
});
