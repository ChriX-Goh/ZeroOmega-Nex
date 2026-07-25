import {
  BrowserStorageProxyAuthenticationRepository,
  type ProxyAuthenticationBinding,
  type ProxyAuthenticationChallenge,
  type ProxyAuthenticationResponse,
} from '@zeroomega-nex/browser-adapters';
import { describe, expect, it } from 'vitest';

import {
  ProxyAuthenticationRuntimeManager,
  type RuntimeAuthenticationApi,
} from './proxy-auth-runtime';

class MemoryStorageArea {
  readonly values = new Map<string, unknown>();

  async get(keys: string | readonly string[]): Promise<Record<string, unknown>> {
    const selected = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(
      selected
        .filter((key) => this.values.has(key))
        .map((key) => [key, structuredClone(this.values.get(key))]),
    );
  }

  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      this.values.set(key, structuredClone(value));
    }
  }

  async remove(keys: string | readonly string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) this.values.delete(key);
  }
}

class FakeAuthRequiredEvent {
  readonly listeners = new Set<(...arguments_: never[]) => unknown>();

  addListener(
    listener: (
      details: ProxyAuthenticationChallenge,
      callback?: (response: ProxyAuthenticationResponse | Record<string, never>) => void,
    ) => ProxyAuthenticationResponse | Promise<ProxyAuthenticationResponse | undefined> | void,
  ): void {
    this.listeners.add(listener as (...arguments_: never[]) => unknown);
  }

  removeListener(listener: (...arguments_: never[]) => unknown): void {
    this.listeners.delete(listener);
  }
}

function binding(id: string, host = `${id}.example.invalid`): ProxyAuthenticationBinding {
  return {
    endpointId: id,
    protocol: 'http',
    host,
    port: 8080,
    username: `${id}-user`,
    passwordSecretRef: `${id}-secret`,
  };
}

function runtimeApi(options: { granted?: boolean; webRequest?: boolean } = {}) {
  const storage = new MemoryStorageArea();
  const authEvent = new FakeAuthRequiredEvent();
  const api: RuntimeAuthenticationApi = {
    runtime: {},
    permissions: {
      contains: async () => options.granted !== false,
    },
    ...(options.webRequest === false
      ? {}
      : {
          webRequest: {
            onAuthRequired: authEvent,
          },
        }),
    storage: { local: storage },
  };
  return { api, storage, authEvent };
}

async function storedBindings(storage: MemoryStorageArea) {
  const repository = new BrowserStorageProxyAuthenticationRepository(storage);
  return repository.getBindings();
}

describe('proxy authentication runtime manager', () => {
  it('initializes without a listener when no bindings exist', async () => {
    const created = runtimeApi();
    const manager = new ProxyAuthenticationRuntimeManager(created.api);

    await expect(manager.initialize()).resolves.toBe('not-configured');
    expect(manager.status).toBe('not-configured');
    expect(created.authEvent.listeners.size).toBe(0);
  });

  it('prepares and commits a registered listener for authenticated bindings', async () => {
    const created = runtimeApi();
    const manager = new ProxyAuthenticationRuntimeManager(created.api);
    await manager.initialize();

    const result = await manager.prepare([binding('endpoint-primary')]);

    expect(result).toMatchObject({
      ok: true,
      preparation: { status: 'prepared', runtimeStatus: 'registered' },
    });
    if (!result.ok) throw new Error('expected successful preparation');
    expect(created.authEvent.listeners.size).toBe(1);
    await expect(storedBindings(created.storage)).resolves.toEqual([
      binding('endpoint-primary'),
    ]);
    result.preparation.commit();
    expect(manager.status).toBe('registered');
  });

  it('rejects concurrent preparation until the first transaction settles', async () => {
    const created = runtimeApi();
    const manager = new ProxyAuthenticationRuntimeManager(created.api);
    await manager.initialize();

    const first = await manager.prepare([binding('endpoint-primary')]);
    const second = await manager.prepare([binding('endpoint-secondary')]);

    expect(first.ok).toBe(true);
    expect(second).toEqual({
      ok: false,
      status: 'busy',
      message: 'proxy authentication preparation is already in progress',
    });
    if (first.ok) first.preparation.commit();
  });

  it('rolls a prepared binding set back to the previous registered state', async () => {
    const created = runtimeApi();
    const repository = new BrowserStorageProxyAuthenticationRepository(created.storage);
    await repository.putBindings([binding('endpoint-primary')]);
    const manager = new ProxyAuthenticationRuntimeManager(created.api);
    await manager.initialize();

    const result = await manager.prepare([binding('endpoint-secondary')]);
    if (!result.ok) throw new Error('expected successful preparation');
    await expect(storedBindings(created.storage)).resolves.toEqual([
      binding('endpoint-secondary'),
    ]);

    await result.preparation.rollback();

    await expect(storedBindings(created.storage)).resolves.toEqual([
      binding('endpoint-primary'),
    ]);
    expect(created.authEvent.listeners.size).toBe(1);
    expect(manager.status).toBe('registered');
  });

  it('restores empty bindings when optional permissions are missing', async () => {
    const created = runtimeApi({ granted: false });
    const manager = new ProxyAuthenticationRuntimeManager(created.api);
    await manager.initialize();

    const result = await manager.prepare([binding('endpoint-primary')]);

    expect(result).toEqual({
      ok: false,
      status: 'permissions-required',
      message: 'proxy authentication permissions are required before activation',
    });
    await expect(storedBindings(created.storage)).resolves.toEqual([]);
    expect(created.authEvent.listeners.size).toBe(0);
    expect(manager.status).toBe('not-configured');
  });

  it('restores empty bindings when the authentication API is unavailable', async () => {
    const created = runtimeApi({ webRequest: false });
    const manager = new ProxyAuthenticationRuntimeManager(created.api);
    await manager.initialize();

    const result = await manager.prepare([binding('endpoint-primary')]);

    expect(result).toEqual({
      ok: false,
      status: 'api-unavailable',
      message: 'proxy authentication API is unavailable',
    });
    await expect(storedBindings(created.storage)).resolves.toEqual([]);
    expect(manager.status).toBe('not-configured');
  });

  it('removes the listener transactionally when the next route needs no authentication', async () => {
    const created = runtimeApi();
    const repository = new BrowserStorageProxyAuthenticationRepository(created.storage);
    await repository.putBindings([binding('endpoint-primary')]);
    const manager = new ProxyAuthenticationRuntimeManager(created.api);
    await manager.initialize();
    expect(created.authEvent.listeners.size).toBe(1);

    const result = await manager.prepare([]);

    expect(result).toMatchObject({
      ok: true,
      preparation: { runtimeStatus: 'not-configured' },
    });
    if (!result.ok) throw new Error('expected successful preparation');
    expect(created.authEvent.listeners.size).toBe(0);
    await expect(storedBindings(created.storage)).resolves.toEqual([]);
    result.preparation.commit();
  });
});
