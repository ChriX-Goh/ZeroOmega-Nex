import type {
  ProxyAuthenticationBinding,
  ProxyAuthenticationBindingProvider,
  ProxyAuthenticationSecretProvider,
} from './authentication.js';
import type { BrowserStorageArea } from './storage-repository.js';

export interface ProxyAuthenticationStorageOptions {
  readonly namespace?: string;
}

function normalizeBinding(value: unknown, index: number): ProxyAuthenticationBinding {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`proxy authentication binding ${index} must be an object`);
  }
  const record = value as Record<string, unknown>;
  const { scope, username, passwordSecretRef } = record;
  if (typeof username !== 'string' || typeof passwordSecretRef !== 'string') {
    throw new TypeError(`proxy authentication binding ${index} is invalid`);
  }
  if (scope === 'all-proxies') {
    if (typeof record.profileId !== 'string' || record.profileId.length === 0) {
      throw new TypeError(`proxy authentication binding ${index} is invalid`);
    }
    return {
      scope: 'all-proxies',
      profileId: record.profileId,
      username,
      passwordSecretRef,
    };
  }
  const { endpointId, protocol, host, port } = record;
  if (
    (scope !== undefined && scope !== 'endpoint') ||
    typeof endpointId !== 'string' ||
    (protocol !== 'http' && protocol !== 'https') ||
    typeof host !== 'string' ||
    typeof port !== 'number' ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65_535
  ) {
    throw new TypeError(`proxy authentication binding ${index} is invalid`);
  }
  return {
    ...(scope === undefined ? {} : { scope: 'endpoint' as const }),
    endpointId,
    protocol,
    host,
    port,
    username,
    passwordSecretRef,
  };
}

export class BrowserStorageProxyAuthenticationRepository
  implements ProxyAuthenticationBindingProvider, ProxyAuthenticationSecretProvider
{
  readonly #area: BrowserStorageArea;
  readonly #bindingsKey: string;
  readonly #secretPrefix: string;

  constructor(area: BrowserStorageArea, options: ProxyAuthenticationStorageOptions = {}) {
    this.#area = area;
    const namespace = options.namespace ?? 'zeroomega-nex/proxy-auth/v1';
    this.#bindingsKey = `${namespace}/bindings`;
    this.#secretPrefix = `${namespace}/secret/`;
  }

  async getBindings(): Promise<readonly ProxyAuthenticationBinding[]> {
    const values = await this.#area.get(this.#bindingsKey);
    const raw = values[this.#bindingsKey];
    if (raw === undefined) return [];
    if (!Array.isArray(raw)) throw new TypeError('proxy authentication bindings must be an array');
    const bindings = raw.map(normalizeBinding);
    const endpointIds = new Set<string>();
    const allProxyProfileIds = new Set<string>();
    for (const binding of bindings) {
      if (binding.scope === 'all-proxies') {
        if (allProxyProfileIds.has(binding.profileId)) {
          throw new TypeError(`duplicate all-proxy authentication profile ${binding.profileId}`);
        }
        allProxyProfileIds.add(binding.profileId);
        continue;
      }
      if (endpointIds.has(binding.endpointId)) {
        throw new TypeError(`duplicate proxy authentication endpoint ${binding.endpointId}`);
      }
      endpointIds.add(binding.endpointId);
    }
    return bindings;
  }

  async putBindings(bindings: readonly ProxyAuthenticationBinding[]): Promise<void> {
    const normalized = bindings.map((binding, index) => normalizeBinding(binding, index));
    await this.#area.set({ [this.#bindingsKey]: normalized });
  }

  async getSecret(secretRef: string): Promise<string | undefined> {
    const key = `${this.#secretPrefix}${secretRef}`;
    const values = await this.#area.get(key);
    const secret = values[key];
    if (secret === undefined) return undefined;
    if (typeof secret !== 'string')
      throw new TypeError(`proxy secret ${secretRef} must be a string`);
    return secret;
  }

  async putSecret(secretRef: string, secret: string): Promise<void> {
    if (!secretRef) throw new TypeError('proxy secret reference must not be empty');
    await this.#area.set({ [`${this.#secretPrefix}${secretRef}`]: secret });
  }

  async removeSecret(secretRef: string): Promise<void> {
    await this.#area.remove(`${this.#secretPrefix}${secretRef}`);
  }
}
