import { describe, expect, it } from 'vitest';

import { BrowserStorageProxyAuthenticationRepository } from './authentication-storage.js';
import type { BrowserStorageArea } from './storage-repository.js';

class MemoryArea implements BrowserStorageArea {
  readonly values = new Map<string, unknown>();

  async get(keys: string | readonly string[]): Promise<Record<string, unknown>> {
    const selected = typeof keys === 'string' ? [keys] : keys;
    return Object.fromEntries(
      selected.flatMap((key) => (this.values.has(key) ? [[key, this.values.get(key)]] : [])),
    );
  }

  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) this.values.set(key, structuredClone(value));
  }

  async remove(keys: string | readonly string[]): Promise<void> {
    for (const key of typeof keys === 'string' ? [keys] : keys) this.values.delete(key);
  }
}

const binding = {
  endpointId: 'endpoint-http',
  protocol: 'http' as const,
  host: 'proxy.example.invalid',
  port: 8080,
  username: 'alice',
  passwordSecretRef: 'secret/password',
};

describe('proxy authentication storage repository', () => {
  it('keeps endpoint bindings and secret values in separate records', async () => {
    const area = new MemoryArea();
    const repository = new BrowserStorageProxyAuthenticationRepository(area);
    await repository.putBindings([binding]);
    await repository.putSecret(binding.passwordSecretRef, 'password');
    await expect(repository.getBindings()).resolves.toEqual([binding]);
    await expect(repository.getSecret(binding.passwordSecretRef)).resolves.toBe('password');
    const serializedBindings = JSON.stringify(
      area.values.get('zeroomega-nex/proxy-auth/v1/bindings'),
    );
    expect(serializedBindings).not.toContain('password"');
  });

  it('rejects duplicate endpoints and invalid records', async () => {
    const area = new MemoryArea();
    const repository = new BrowserStorageProxyAuthenticationRepository(area);
    await repository.putBindings([binding, { ...binding }]);
    await expect(repository.getBindings()).rejects.toThrow(
      'duplicate proxy authentication endpoint',
    );

    area.values.set('zeroomega-nex/proxy-auth/v1/bindings', [{ ...binding, port: 70_000 }]);
    await expect(repository.getBindings()).rejects.toThrow('is invalid');
  });

  it('removes secret values without modifying bindings', async () => {
    const area = new MemoryArea();
    const repository = new BrowserStorageProxyAuthenticationRepository(area);
    await repository.putBindings([binding]);
    await repository.putSecret(binding.passwordSecretRef, 'password');
    await repository.removeSecret(binding.passwordSecretRef);
    await expect(repository.getSecret(binding.passwordSecretRef)).resolves.toBeUndefined();
    await expect(repository.getBindings()).resolves.toEqual([binding]);
  });
});
