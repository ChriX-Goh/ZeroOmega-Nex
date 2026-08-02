import type { BrowserStorageArea } from '@zeroomega-nex/browser-adapters';
import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowCommandResponse,
  ProfileWorkflowRuntimeView,
  ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it, vi } from 'vitest';

import { registerProfileWorkflowRuntime } from './profile-workflow-runtime';

class MemoryArea implements ProfileWorkflowStorageArea, BrowserStorageArea {
  readonly values = new Map<string, unknown>();

  async get(keys: string | readonly string[]): Promise<Record<string, unknown>> {
    const selected = typeof keys === 'string' ? [keys] : keys;
    return Object.fromEntries(
      selected.flatMap((key) => (this.values.has(key) ? [[key, this.values.get(key)]] : [])),
    );
  }

  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      this.values.set(key, structuredClone(value));
    }
  }

  async remove(keys: string | readonly string[]): Promise<void> {
    for (const key of typeof keys === 'string' ? [keys] : keys) this.values.delete(key);
  }
}

type MessageListener = (
  message: unknown,
) => ProfileWorkflowCommandResponse | Promise<ProfileWorkflowCommandResponse> | undefined;

class MessageEvent {
  readonly listeners = new Set<MessageListener>();

  addListener(listener: MessageListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (message: unknown) => unknown): void {
    this.listeners.delete(listener as MessageListener);
  }
}

class RecordingDriver implements ProfileWorkflowActivationDriver {
  readonly routes: Array<ProfileRouteTarget | undefined> = [];

  async activate(_candidate: ProfileSpec, route?: ProfileRouteTarget) {
    this.routes.push(route);
    return { snapshotId: 'built-in-system' };
  }

  async rollback(): Promise<void> {}

  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    const activeRoute = this.routes.at(-1);
    return activeRoute === undefined ? {} : { activeRoute };
  }
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

class BlockingDriver extends RecordingDriver {
  readonly started = deferred();
  readonly release = deferred();

  override async activate(candidate: ProfileSpec, route?: ProfileRouteTarget) {
    this.routes.push(route);
    this.started.resolve();
    await this.release.promise;
    return { snapshotId: 'built-in-system' };
  }
}

function harness(
  driver = new RecordingDriver(),
  completeInitialization?: (response: ProfileWorkflowCommandResponse) => Promise<void> | void,
) {
  const messages = new MessageEvent();
  const storage = new MemoryArea();
  const activated = vi.fn();
  const runtime = registerProfileWorkflowRuntime(
    {
      runtime: {
        id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        onMessage: messages,
      },
      storage: { local: storage },
    },
    {
      activationDriver: driver,
      onActivationSucceeded: activated,
      ...(completeInitialization === undefined ? {} : { completeInitialization }),
    },
  );
  return { activated, driver, messages, runtime };
}

describe('profile workflow background initialization', () => {
  it('deduplicates concurrent initialization and activates original System once', async () => {
    const { activated, driver, runtime } = harness();

    const first = runtime.initialize();
    const second = runtime.initialize();
    expect(first).toBe(second);

    const [firstResponse, secondResponse] = await Promise.all([first, second]);
    expect(firstResponse).toBe(secondResponse);
    expect(firstResponse).toMatchObject({
      ok: true,
      appliedSnapshotId: 'built-in-system',
    });
    expect(driver.routes).toEqual([{ kind: 'system' }]);
    expect(activated).toHaveBeenCalledTimes(1);
  });

  it('queues concurrent runtime messages behind the complete initial activation', async () => {
    const driver = new BlockingDriver();
    const { messages, runtime } = harness(driver);
    const listener = [...messages.listeners][0];
    if (!listener) throw new Error('profile workflow message listener is unavailable');

    const initialization = runtime.initialize();
    await driver.started.promise;
    const concurrent = listener({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get',
    });
    if (!concurrent) throw new Error('concurrent profile workflow command was ignored');
    let concurrentSettled = false;
    void Promise.resolve(concurrent).then(() => {
      concurrentSettled = true;
    });
    await Promise.resolve();
    expect(concurrentSettled).toBe(false);

    driver.release.resolve();
    const [initialResponse, concurrentResponse] = await Promise.all([initialization, concurrent]);

    expect(initialResponse).toMatchObject({
      ok: true,
      appliedSnapshotId: 'built-in-system',
    });
    expect(concurrentResponse).toMatchObject({
      ok: true,
      runtime: { activeRoute: { kind: 'system' } },
    });
    expect(driver.routes).toEqual([{ kind: 'system' }]);
  });

  it('queues runtime messages behind the complete startup recovery hook', async () => {
    const started = deferred();
    const release = deferred();
    const { messages, runtime } = harness(new RecordingDriver(), async () => {
      started.resolve();
      await release.promise;
    });
    const listener = [...messages.listeners][0];
    if (!listener) throw new Error('profile workflow message listener is unavailable');

    const initialization = runtime.initialize();
    await started.promise;
    const concurrent = listener({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get',
    });
    if (!concurrent) throw new Error('concurrent profile workflow command was ignored');
    let concurrentSettled = false;
    void Promise.resolve(concurrent).then(() => {
      concurrentSettled = true;
    });
    await Promise.resolve();
    expect(concurrentSettled).toBe(false);

    release.resolve();
    await Promise.all([initialization, concurrent]);
    expect(concurrentSettled).toBe(true);
  });

  it('returns the settled initialization result without reactivating', async () => {
    const { driver, runtime } = harness();

    const first = await runtime.initialize();
    const second = await runtime.initialize();

    expect(second).toBe(first);
    expect(driver.routes).toHaveLength(1);
  });

  it('removes the message listener and rejects initialization after disposal', async () => {
    const { messages, runtime } = harness();
    expect(messages.listeners.size).toBe(1);

    runtime.dispose();

    expect(messages.listeners.size).toBe(0);
    await expect(runtime.initialize()).rejects.toThrow('profile workflow runtime is disposed');
  });
});
