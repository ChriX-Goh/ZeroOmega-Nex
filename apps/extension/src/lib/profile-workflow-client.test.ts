import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_STATE_STORAGE_KEY,
  requestRuleSourceOriginPermission,
  runWithRuleSourceOriginPermission,
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

describe('profile workflow origin permission boundary', () => {
  it('requests only the normalized host origin', async () => {
    const requested: unknown[] = [];
    const granted = await requestRuleSourceOriginPermission(
      'https://rules.example.test:8443/path/list',
      {
        runtime: { sendMessage: async () => undefined },
        permissions: {
          request: async (permissions) => {
            requested.push(permissions);
            return true;
          },
        },
      },
    );
    expect(granted).toBe(true);
    expect(requested).toEqual([{ origins: ['https://rules.example.test/*'] }]);
  });

  it('does not run the update operation after permission denial', async () => {
    let operationCalls = 0;
    const result = await runWithRuleSourceOriginPermission(
      'http://127.0.0.1:8123/rules.txt',
      async () => {
        operationCalls += 1;
        return 'updated';
      },
      {
        runtime: { sendMessage: async () => undefined },
        permissions: { request: async () => false },
      },
    );
    expect(result).toEqual({ granted: false });
    expect(operationCalls).toBe(0);
  });

  it('rejects unsupported origins before opening a permission request', async () => {
    let requestCalls = 0;
    const granted = await requestRuleSourceOriginPermission('file:///tmp/proxy.pac', {
      runtime: { sendMessage: async () => undefined },
      permissions: {
        request: async () => {
          requestCalls += 1;
          return true;
        },
      },
    });
    expect(granted).toBe(false);
    expect(requestCalls).toBe(0);
  });
});

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
