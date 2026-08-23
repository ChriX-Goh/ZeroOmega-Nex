export type ProxyAuthenticationBinding =
  | {
      readonly scope?: 'endpoint';
      readonly endpointId: string;
      readonly protocol: 'http' | 'https';
      readonly host: string;
      readonly port: number;
      readonly username: string;
      readonly passwordSecretRef: string;
    }
  | {
      readonly scope: 'all-proxies';
      readonly profileId: string;
      readonly username: string;
      readonly passwordSecretRef: string;
    };

type EndpointProxyAuthenticationBinding = Extract<
  ProxyAuthenticationBinding,
  { readonly endpointId: string }
>;
type AllProxyAuthenticationBinding = Extract<
  ProxyAuthenticationBinding,
  { readonly scope: 'all-proxies' }
>;

export interface ProxyAuthenticationBindingProvider {
  getBindings(): Promise<readonly ProxyAuthenticationBinding[]>;
}

export interface ProxyAuthenticationSecretProvider {
  getSecret(secretRef: string): Promise<string | undefined>;
}

export interface ProxyAuthenticationChallenger {
  readonly host: string;
  readonly port: number;
}

export interface ProxyAuthenticationProxyInfo {
  readonly host: string;
  readonly port: number;
  readonly type?: string;
}

export interface ProxyAuthenticationChallenge {
  readonly isProxy: boolean;
  readonly requestId: string;
  readonly scheme: string;
  readonly challenger: ProxyAuthenticationChallenger;
  readonly proxyInfo?: ProxyAuthenticationProxyInfo;
}

export interface ProxyAuthenticationCredentials {
  readonly username: string;
  readonly password: string;
}

export interface ProxyAuthenticationResponse {
  readonly authCredentials: ProxyAuthenticationCredentials;
}

export interface ProxyAuthenticationHandlerOptions {
  readonly maxTrackedRequests?: number;
  readonly maxAttemptsPerRequest?: number;
}

function normalizeProxyHost(host: string): string {
  const trimmed = host.trim().toLowerCase();
  return trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed.slice(1, -1) : trimmed;
}

function protocolMatches(
  binding: EndpointProxyAuthenticationBinding,
  proxyInfo: ProxyAuthenticationProxyInfo | undefined,
): boolean {
  if (proxyInfo?.type === undefined || proxyInfo.type === 'unknown') return true;
  return binding.protocol === proxyInfo.type;
}

function challengeEndpoint(challenge: ProxyAuthenticationChallenge): ProxyAuthenticationChallenger {
  return challenge.proxyInfo ?? challenge.challenger;
}

export class ProxyAuthenticationHandler {
  readonly #bindings: ProxyAuthenticationBindingProvider;
  readonly #secrets: ProxyAuthenticationSecretProvider;
  readonly #maxTrackedRequests: number;
  readonly #maxAttemptsPerRequest: number;
  readonly #attempts = new Map<string, number>();

  constructor(
    bindings: ProxyAuthenticationBindingProvider,
    secrets: ProxyAuthenticationSecretProvider,
    options: ProxyAuthenticationHandlerOptions = {},
  ) {
    this.#bindings = bindings;
    this.#secrets = secrets;
    this.#maxTrackedRequests = options.maxTrackedRequests ?? 256;
    this.#maxAttemptsPerRequest = options.maxAttemptsPerRequest ?? 1;
    if (!Number.isInteger(this.#maxTrackedRequests) || this.#maxTrackedRequests < 1) {
      throw new RangeError('maxTrackedRequests must be a positive integer');
    }
    if (!Number.isInteger(this.#maxAttemptsPerRequest) || this.#maxAttemptsPerRequest < 1) {
      throw new RangeError('maxAttemptsPerRequest must be a positive integer');
    }
  }

  async handle(
    challenge: ProxyAuthenticationChallenge,
  ): Promise<ProxyAuthenticationResponse | undefined> {
    if (!challenge.isProxy) return undefined;
    if (challenge.scheme.toLowerCase() !== 'basic' && challenge.scheme.toLowerCase() !== 'digest') {
      return undefined;
    }
    if ((this.#attempts.get(challenge.requestId) ?? 0) >= this.#maxAttemptsPerRequest) {
      return undefined;
    }

    const endpoint = challengeEndpoint(challenge);
    const host = normalizeProxyHost(endpoint.host);
    const available = await this.#bindings.getBindings();
    const exact = available.filter(
      (binding): binding is EndpointProxyAuthenticationBinding =>
        binding.scope !== 'all-proxies' &&
        normalizeProxyHost(binding.host) === host &&
        binding.port === endpoint.port &&
        protocolMatches(binding, challenge.proxyInfo),
    );
    const bindings: readonly ProxyAuthenticationBinding[] =
      exact.length > 0
        ? exact
        : available.filter(
            (binding): binding is AllProxyAuthenticationBinding => binding.scope === 'all-proxies',
          );
    if (bindings.length !== 1) return undefined;

    const binding = bindings[0]!;
    const password = await this.#secrets.getSecret(binding.passwordSecretRef);
    if (password === undefined) return undefined;

    this.#rememberAttempt(challenge.requestId);
    return {
      authCredentials: {
        username: binding.username,
        password,
      },
    };
  }

  forgetRequest(requestId: string): void {
    this.#attempts.delete(requestId);
  }

  clear(): void {
    this.#attempts.clear();
  }

  #rememberAttempt(requestId: string): void {
    const current = this.#attempts.get(requestId) ?? 0;
    this.#attempts.delete(requestId);
    this.#attempts.set(requestId, current + 1);
    while (this.#attempts.size > this.#maxTrackedRequests) {
      const oldest = this.#attempts.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.#attempts.delete(oldest);
    }
  }
}
