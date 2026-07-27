from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


# Binding contract becomes endpoint-specific or PAC all-proxy.
replace_once(
    'packages/browser-adapters/src/authentication.ts',
    '''export interface ProxyAuthenticationBinding {
  readonly endpointId: string;
  readonly protocol: 'http' | 'https';
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly passwordSecretRef: string;
}
''',
    '''export type ProxyAuthenticationBinding =
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
''',
)
replace_once(
    'packages/browser-adapters/src/authentication.ts',
    '''function protocolMatches(
  binding: ProxyAuthenticationBinding,
  proxyInfo: ProxyAuthenticationProxyInfo | undefined,
): boolean {
''',
    '''function protocolMatches(
  binding: Extract<ProxyAuthenticationBinding, { readonly endpointId: string }>,
  proxyInfo: ProxyAuthenticationProxyInfo | undefined,
): boolean {
''',
)
replace_once(
    'packages/browser-adapters/src/authentication.ts',
    '''    const endpoint = challengeEndpoint(challenge);
    const host = normalizeProxyHost(endpoint.host);
    const bindings = (await this.#bindings.getBindings()).filter(
      (binding) =>
        normalizeProxyHost(binding.host) === host &&
        binding.port === endpoint.port &&
        protocolMatches(binding, challenge.proxyInfo),
    );
    if (bindings.length !== 1) return undefined;

    const binding = bindings[0]!;
''',
    '''    const endpoint = challengeEndpoint(challenge);
    const host = normalizeProxyHost(endpoint.host);
    const available = await this.#bindings.getBindings();
    const exact = available.filter(
      (binding): binding is Extract<ProxyAuthenticationBinding, { readonly endpointId: string }> =>
        binding.scope !== 'all-proxies' &&
        normalizeProxyHost(binding.host) === host &&
        binding.port === endpoint.port &&
        protocolMatches(binding, challenge.proxyInfo),
    );
    const bindings =
      exact.length > 0
        ? exact
        : available.filter(
            (binding): binding is Extract<
              ProxyAuthenticationBinding,
              { readonly scope: 'all-proxies' }
            > => binding.scope === 'all-proxies',
          );
    if (bindings.length !== 1) return undefined;

    const binding = bindings[0]!;
''',
)

# Storage parser supports both shapes and rejects duplicate scope identities.
storage = Path('packages/browser-adapters/src/authentication-storage.ts')
text = storage.read_text()
start = text.index('function normalizeBinding(')
end = text.index('\n}\n\nexport class BrowserStorageProxyAuthenticationRepository', start) + 2
replacement = r'''function normalizeBinding(value: unknown, index: number): ProxyAuthenticationBinding {
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
}'''
storage.write_text(text[:start] + replacement + text[end:])
replace_once(
    'packages/browser-adapters/src/authentication-storage.ts',
    '''    const endpointIds = new Set<string>();
    for (const binding of bindings) {
      if (endpointIds.has(binding.endpointId)) {
        throw new TypeError(`duplicate proxy authentication endpoint ${binding.endpointId}`);
      }
      endpointIds.add(binding.endpointId);
    }
''',
    '''    const identities = new Set<string>();
    for (const binding of bindings) {
      const identity =
        binding.scope === 'all-proxies'
          ? `all-proxies:${binding.profileId}`
          : `endpoint:${binding.endpointId}`;
      if (identities.has(identity)) {
        throw new TypeError(`duplicate proxy authentication binding ${identity}`);
      }
      identities.add(identity);
    }
''',
)

# Plan: a directly selected PAC uses only its auth.all binding; fallback routes are not active.
replace_once(
    'packages/browser-adapters/src/authentication-plan.ts',
    '''export function createProxyAuthenticationPlan(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
): ProxyAuthenticationPlan {
  const reachable = reachableEndpointIds(spec, startRoute);
''',
    '''export function createProxyAuthenticationPlan(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
): ProxyAuthenticationPlan {
  if (startRoute.kind === 'profile') {
    const profile = spec.profiles.find((candidate) => candidate.id === startRoute.profileId);
    if (profile?.kind === 'pac') {
      return {
        bindings:
          profile.credential === undefined
            ? []
            : [
                {
                  scope: 'all-proxies',
                  profileId: profile.id,
                  username: profile.credential.username ?? '',
                  passwordSecretRef: profile.credential.passwordSecretRef,
                },
              ],
        unsupported: [],
      };
    }
  }
  const reachable = reachableEndpointIds(spec, startRoute);
''',
)

# Tests for wildcard precedence and persistence.
auth_test = Path('packages/browser-adapters/src/authentication.test.ts')
text = auth_test.read_text()
anchor = "  it('ignores origin authentication challenges', async () => {"
coverage = r'''  it('uses one PAC all-proxy credential only when no exact endpoint binding matches', async () => {
    const handler = new ProxyAuthenticationHandler(
      {
        getBindings: async () => [
          {
            scope: 'all-proxies',
            profileId: 'pac-all',
            username: 'pac-user',
            passwordSecretRef: 'secret-pac-all',
          },
          {
            endpointId: 'exact-proxy',
            protocol: 'http',
            host: 'exact.example.invalid',
            port: 8080,
            username: 'exact-user',
            passwordSecretRef: 'secret-exact',
          },
        ],
      },
      {
        getSecret: async (ref) =>
          ref === 'secret-pac-all' ? 'pac-password' : ref === 'secret-exact' ? 'exact-password' : undefined,
      },
    );

    await expect(
      handler.handle({
        isProxy: true,
        requestId: 'pac-wildcard',
        scheme: 'basic',
        challenger: { host: 'other.example.invalid', port: 3128 },
        proxyInfo: { host: 'other.example.invalid', port: 3128, type: 'http' },
      }),
    ).resolves.toEqual({ authCredentials: { username: 'pac-user', password: 'pac-password' } });

    await expect(
      handler.handle({
        isProxy: true,
        requestId: 'pac-exact',
        scheme: 'basic',
        challenger: { host: 'exact.example.invalid', port: 8080 },
        proxyInfo: { host: 'exact.example.invalid', port: 8080, type: 'http' },
      }),
    ).resolves.toEqual({ authCredentials: { username: 'exact-user', password: 'exact-password' } });
  });

  it('does not answer ambiguous PAC all-proxy credentials', async () => {
    const handler = new ProxyAuthenticationHandler(
      {
        getBindings: async () => [
          {
            scope: 'all-proxies',
            profileId: 'pac-one',
            username: 'one',
            passwordSecretRef: 'secret-one',
          },
          {
            scope: 'all-proxies',
            profileId: 'pac-two',
            username: 'two',
            passwordSecretRef: 'secret-two',
          },
        ],
      },
      { getSecret: async () => 'password' },
    );
    await expect(
      handler.handle({
        isProxy: true,
        requestId: 'pac-ambiguous',
        scheme: 'basic',
        challenger: { host: 'proxy.example.invalid', port: 8080 },
      }),
    ).resolves.toBeUndefined();
  });

'''
if text.count(anchor) != 1:
    raise SystemExit('PAC auth handler test insertion anchor missing')
auth_test.write_text(text.replace(anchor, coverage + anchor, 1))

plan_test = Path('packages/browser-adapters/src/authentication-plan.test.ts')
text = plan_test.read_text()
anchor = "  it('returns an empty plan for Direct',"
if anchor not in text:
    # use the end of describe instead; different wording is acceptable.
    anchor = '\n});\n'
    coverage = r'''
  it('creates one all-proxy binding for a directly selected PAC and ignores fallback endpoints', () => {
    const spec = authenticatedSpec();
    spec.profiles.push({
      id: 'pac-auth-all',
      name: 'PAC auth all',
      kind: 'pac',
      source: { kind: 'inline', script: "function FindProxyForURL() { return 'DIRECT'; }" },
      fallbackRoute: { kind: 'profile', profileId: spec.profiles[0]!.id },
      credential: {
        username: 'pac-user',
        passwordSecretRef: 'secret-pac-all',
      },
    });
    expect(
      createProxyAuthenticationPlan(spec, { kind: 'profile', profileId: 'pac-auth-all' }),
    ).toEqual({
      bindings: [
        {
          scope: 'all-proxies',
          profileId: 'pac-auth-all',
          username: 'pac-user',
          passwordSecretRef: 'secret-pac-all',
        },
      ],
      unsupported: [],
    });
  });
'''
    if text.count(anchor) != 1:
        raise SystemExit('PAC auth plan test closing anchor missing')
    plan_test.write_text(text.replace(anchor, coverage + anchor, 1))
else:
    raise SystemExit('unexpected authentication-plan test anchor path')
