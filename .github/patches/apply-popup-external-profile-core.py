from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


Path('packages/browser-adapters/src/external-profile.ts').write_text(r'''import type { JsonValue } from '@zeroomega-nex/profile-spec';

import type { PlatformProxyState } from './contracts.js';
import { recordValue, stringProperty } from './platform-utils.js';

export type ExternalProxyProtocol = 'http' | 'https' | 'socks4' | 'socks5';
export type ExternalProxyScheme = 'fallback' | 'http' | 'https' | 'ftp';

export interface ExternalProxyServer {
  readonly protocol: ExternalProxyProtocol;
  readonly host: string;
  readonly port: number;
}

export type ExternalProfileCandidate =
  | {
      readonly kind: 'fixed';
      readonly proxyByScheme: Readonly<Partial<Record<ExternalProxyScheme, ExternalProxyServer>>>;
      readonly bypass: readonly string[];
    }
  | {
      readonly kind: 'pac';
      readonly source:
        | { readonly kind: 'url'; readonly url: string }
        | { readonly kind: 'inline'; readonly script: string };
    };

const LOCAL_HOST_EQUIVALENTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function integerProperty(value: Record<string, JsonValue> | undefined, key: string): number | undefined {
  const candidate = value?.[key];
  return typeof candidate === 'number' && Number.isInteger(candidate) ? candidate : undefined;
}

function parseProxyServer(value: JsonValue | undefined): ExternalProxyServer | undefined {
  if (value === undefined) return undefined;
  const server = recordValue(value);
  const host = stringProperty(server, 'host')?.trim();
  const port = integerProperty(server, 'port');
  const scheme = stringProperty(server, 'scheme') ?? 'http';
  if (!host || port === undefined || port < 1 || port > 65_535) return undefined;
  if (scheme !== 'http' && scheme !== 'https' && scheme !== 'socks4' && scheme !== 'socks5') {
    return undefined;
  }
  return { protocol: scheme, host, port };
}

function parseBypassList(rules: Record<string, JsonValue>): readonly string[] {
  const source = rules.bypassList;
  if (!Array.isArray(source)) return [];
  const seen = new Set<string>();
  const values: string[] = [];
  for (const entry of source) {
    if (typeof entry !== 'string') continue;
    const pattern = entry.trim();
    if (!pattern || seen.has(pattern)) continue;
    seen.add(pattern);
    values.push(pattern);
  }
  if (seen.has('<local>')) {
    return values.filter((pattern) => pattern === '<local>' || !LOCAL_HOST_EQUIVALENTS.has(pattern));
  }
  return values;
}

function parseFixed(value: Record<string, JsonValue>): ExternalProfileCandidate | undefined {
  const rules = recordValue(value.rules);
  if (!rules) return undefined;
  const mappings: readonly [ExternalProxyScheme, string][] = [
    ['http', 'proxyForHttp'],
    ['https', 'proxyForHttps'],
    ['ftp', 'proxyForFtp'],
    ['fallback', 'fallbackProxy'],
  ];
  const proxyByScheme: Partial<Record<ExternalProxyScheme, ExternalProxyServer>> = {};
  for (const [scheme, property] of mappings) {
    if (rules[property] === undefined) continue;
    const parsed = parseProxyServer(rules[property]);
    if (!parsed) return undefined;
    proxyByScheme[scheme] = parsed;
  }
  if (rules.singleProxy !== undefined) {
    const parsed = parseProxyServer(rules.singleProxy);
    if (!parsed) return undefined;
    proxyByScheme.fallback = parsed;
  }
  if (Object.keys(proxyByScheme).length === 0) return undefined;
  return { kind: 'fixed', proxyByScheme, bypass: parseBypassList(rules) };
}

function parsePac(value: Record<string, JsonValue>): ExternalProfileCandidate | undefined {
  const pac = recordValue(value.pacScript);
  if (!pac) return undefined;
  const url = stringProperty(pac, 'url')?.trim();
  if (url) return { kind: 'pac', source: { kind: 'url', url } };
  const script = stringProperty(pac, 'data')?.trim();
  return script ? { kind: 'pac', source: { kind: 'inline', script } } : undefined;
}

export function parseExternalProfileCandidate(
  state: PlatformProxyState,
): ExternalProfileCandidate | undefined {
  if (state.family !== 'chromium') return undefined;
  const value = recordValue(state.value);
  const mode = stringProperty(value, 'mode');
  switch (mode) {
    case 'direct':
    case 'system':
      return undefined;
    case 'auto_detect':
      return { kind: 'pac', source: { kind: 'url', url: 'http://wpad/wpad.dat' } };
    case 'pac_script':
      return value ? parsePac(value) : undefined;
    case 'fixed_servers':
      return value ? parseFixed(value) : undefined;
    default:
      return undefined;
  }
}
''')

Path('packages/browser-adapters/src/external-profile.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';

import { parseExternalProfileCandidate } from './external-profile.js';

function chromium(value: unknown) {
  return {
    family: 'chromium' as const,
    controlLevel: 'controlled-by-this-extension' as const,
    value: value as never,
  };
}

describe('external Chromium proxy profile conversion', () => {
  it('maps auto detect and PAC URL/inline configurations', () => {
    expect(parseExternalProfileCandidate(chromium({ mode: 'auto_detect' }))).toEqual({
      kind: 'pac',
      source: { kind: 'url', url: 'http://wpad/wpad.dat' },
    });
    expect(
      parseExternalProfileCandidate(
        chromium({ mode: 'pac_script', pacScript: { url: 'https://pac.example/p.pac' } }),
      ),
    ).toEqual({ kind: 'pac', source: { kind: 'url', url: 'https://pac.example/p.pac' } });
    expect(
      parseExternalProfileCandidate(
        chromium({ mode: 'pac_script', pacScript: { data: '  function FindProxyForURL(){return "DIRECT";}  ' } }),
      ),
    ).toEqual({
      kind: 'pac',
      source: { kind: 'inline', script: 'function FindProxyForURL(){return "DIRECT";}' },
    });
  });

  it('maps single and per-scheme fixed servers with bypass normalization', () => {
    expect(
      parseExternalProfileCandidate(
        chromium({
          mode: 'fixed_servers',
          rules: {
            proxyForHttp: { scheme: 'http', host: 'http.example', port: 8080 },
            proxyForHttps: { scheme: 'https', host: 'secure.example', port: 8443 },
            proxyForFtp: { scheme: 'socks4', host: 'ftp.example', port: 1080 },
            fallbackProxy: { scheme: 'http', host: 'ignored.example', port: 3128 },
            singleProxy: { scheme: 'socks5', host: 'fallback.example', port: 1081 },
            bypassList: ['<local>', 'localhost', '127.0.0.1', '*.internal', '*.internal'],
          },
        }),
      ),
    ).toEqual({
      kind: 'fixed',
      proxyByScheme: {
        http: { protocol: 'http', host: 'http.example', port: 8080 },
        https: { protocol: 'https', host: 'secure.example', port: 8443 },
        ftp: { protocol: 'socks4', host: 'ftp.example', port: 1080 },
        fallback: { protocol: 'socks5', host: 'fallback.example', port: 1081 },
      },
      bypass: ['<local>', '*.internal'],
    });
  });

  it('rejects built-in, Firefox, malformed, and unsupported QUIC configurations', () => {
    expect(parseExternalProfileCandidate(chromium({ mode: 'direct' }))).toBeUndefined();
    expect(parseExternalProfileCandidate(chromium({ mode: 'system' }))).toBeUndefined();
    expect(
      parseExternalProfileCandidate({
        family: 'firefox',
        controlLevel: 'controlled-by-this-extension',
        value: { proxyType: 'manual' },
      }),
    ).toBeUndefined();
    expect(
      parseExternalProfileCandidate(
        chromium({
          mode: 'fixed_servers',
          rules: { singleProxy: { scheme: 'quic', host: 'proxy.example', port: 443 } },
        }),
      ),
    ).toBeUndefined();
  });
});
''')

replace_once(
    'packages/browser-adapters/src/index.ts',
    """export {
  createProxyAuthenticationPlan,
""",
    """export {
  parseExternalProfileCandidate,
  type ExternalProfileCandidate,
  type ExternalProxyProtocol,
  type ExternalProxyScheme,
  type ExternalProxyServer,
} from './external-profile.js';
export {
  createProxyAuthenticationPlan,
""",
)

Path('packages/profile-workflow/src/external-profile.ts').write_text(r'''import {
  cloneProfileSpecDraft,
  validateProfileSpecDraft,
  type FixedProfile,
  type PacProfile,
  type ProfileSpec,
  type ProxyEndpoint,
  type UserProfile,
} from '@zeroomega-nex/profile-spec';

import type {
  ProfileWorkflowIdFactory,
  ProfileWorkflowProfileMutation,
} from './profile-operations.js';

export type ProfileWorkflowExternalProxyProtocol = 'http' | 'https' | 'socks4' | 'socks5';
export type ProfileWorkflowExternalProxyScheme = 'fallback' | 'http' | 'https' | 'ftp';

export interface ProfileWorkflowExternalProxyServer {
  readonly protocol: ProfileWorkflowExternalProxyProtocol;
  readonly host: string;
  readonly port: number;
}

export type ProfileWorkflowExternalProfileCandidate =
  | {
      readonly kind: 'fixed';
      readonly proxyByScheme: Readonly<
        Partial<Record<ProfileWorkflowExternalProxyScheme, ProfileWorkflowExternalProxyServer>>
      >;
      readonly bypass: readonly string[];
    }
  | {
      readonly kind: 'pac';
      readonly source:
        | { readonly kind: 'url'; readonly url: string }
        | { readonly kind: 'inline'; readonly script: string };
    };

export interface ProfileWorkflowExternalProfileMutation extends ProfileWorkflowProfileMutation {
  readonly created: boolean;
}

export interface ProfileWorkflowExternalProfileService {
  readCandidate(applied: ProfileSpec): Promise<ProfileWorkflowExternalProfileCandidate | undefined>;
  createId: ProfileWorkflowIdFactory;
}

function assertValidDraft(draft: ProfileSpec): void {
  const validation = validateProfileSpecDraft(draft);
  if (validation.valid) return;
  const messages = validation.issues
    .filter((entry) => entry.severity === 'error')
    .slice(0, 8)
    .map((entry) => `${entry.code} at ${entry.path}: ${entry.message}`)
    .join('; ');
  throw new TypeError(`external profile import produced an invalid ProfileSpec: ${messages}`);
}

function normalizeName(spec: ProfileSpec, value: string): string {
  const name = value.trim();
  if (!name) throw new TypeError('external profile name cannot be empty');
  if (name.startsWith('_')) throw new TypeError('external profile name cannot start with an underscore');
  if (spec.profiles.some((profile) => profile.name === name)) {
    throw new TypeError(`profile name ${name} already exists`);
  }
  return name;
}

function sameServer(
  endpoint: ProxyEndpoint | undefined,
  server: ProfileWorkflowExternalProxyServer | undefined,
): boolean {
  if (!endpoint || !server) return endpoint === undefined && server === undefined;
  return (
    endpoint.protocol === server.protocol && endpoint.host === server.host && endpoint.port === server.port
  );
}

function sameBypass(profile: FixedProfile, candidate: Extract<ProfileWorkflowExternalProfileCandidate, { kind: 'fixed' }>): boolean {
  const profileSet = new Set(profile.bypass.map((entry) => entry.pattern));
  const candidateSet = new Set(candidate.bypass);
  if (profileSet.size !== candidateSet.size) return false;
  return [...candidateSet].every((pattern) => profileSet.has(pattern));
}

function matchesFixed(
  spec: ProfileSpec,
  profile: FixedProfile,
  candidate: Extract<ProfileWorkflowExternalProfileCandidate, { kind: 'fixed' }>,
): boolean {
  if (!sameBypass(profile, candidate)) return false;
  const schemes: readonly ProfileWorkflowExternalProxyScheme[] = [
    'fallback',
    'http',
    'https',
    'ftp',
  ];
  return schemes.every((scheme) => {
    const endpointId = profile.proxyByScheme[scheme];
    const endpoint = endpointId
      ? spec.proxyEndpoints.find((candidateEndpoint) => candidateEndpoint.id === endpointId)
      : undefined;
    return sameServer(endpoint, candidate.proxyByScheme[scheme]);
  });
}

export function findMatchingExternalProfile(
  spec: ProfileSpec,
  candidate: ProfileWorkflowExternalProfileCandidate,
): UserProfile | undefined {
  if (candidate.kind === 'pac') {
    return spec.profiles.find(
      (profile) =>
        profile.kind === 'pac' &&
        profile.enabled !== false &&
        profile.source.kind === candidate.source.kind &&
        (candidate.source.kind === 'url'
          ? profile.source.kind === 'url' && profile.source.url === candidate.source.url
          : profile.source.kind === 'inline' && profile.source.script === candidate.source.script),
    );
  }
  return spec.profiles.find(
    (profile) =>
      profile.kind === 'fixed' &&
      profile.enabled !== false &&
      matchesFixed(spec, profile, candidate),
  );
}

function appendQuickSwitchRoute(spec: ProfileSpec, profileId: string): void {
  if (
    !spec.settings.quickSwitch.routes.some(
      (route) => route.kind === 'profile' && route.profileId === profileId,
    )
  ) {
    spec.settings.quickSwitch.routes.push({ kind: 'profile', profileId });
  }
}

function endpointKey(server: ProfileWorkflowExternalProxyServer): string {
  return `${server.protocol}\u0000${server.host}\u0000${server.port}`;
}

export function createExternalProfileDraft(
  spec: ProfileSpec,
  candidate: ProfileWorkflowExternalProfileCandidate,
  requestedName: string,
  idFactory: ProfileWorkflowIdFactory,
): ProfileWorkflowExternalProfileMutation {
  const matching = findMatchingExternalProfile(spec, candidate);
  if (matching) {
    return { draft: cloneProfileSpecDraft(spec), profileId: matching.id, created: false };
  }
  const draft = cloneProfileSpecDraft(spec);
  const name = normalizeName(draft, requestedName);
  const profileId = idFactory('profile');
  if (candidate.kind === 'pac') {
    const profile: PacProfile = {
      id: profileId,
      name,
      color: '#ffb74d',
      kind: 'pac',
      source: structuredClone(candidate.source),
      fallbackRoute: { kind: 'direct' },
    };
    draft.profiles.push(profile);
  } else {
    const endpointIds = new Map<string, string>();
    const proxyByScheme: FixedProfile['proxyByScheme'] = {};
    for (const scheme of ['fallback', 'http', 'https', 'ftp'] as const) {
      const server = candidate.proxyByScheme[scheme];
      if (!server) continue;
      const key = endpointKey(server);
      let endpointId = endpointIds.get(key);
      if (!endpointId) {
        endpointId = idFactory('endpoint');
        endpointIds.set(key, endpointId);
        draft.proxyEndpoints.push({
          id: endpointId,
          name: `${name} ${scheme}`,
          protocol: server.protocol,
          host: server.host,
          port: server.port,
        });
      }
      proxyByScheme[scheme] = endpointId;
    }
    const profile: FixedProfile = {
      id: profileId,
      name,
      color: '#64b5f6',
      kind: 'fixed',
      proxyByScheme,
      bypass: candidate.bypass.map((pattern) => ({ id: idFactory('bypass'), pattern })),
    };
    draft.profiles.push(profile);
  }
  appendQuickSwitchRoute(draft, profileId);
  assertValidDraft(draft);
  return { draft, profileId, created: true };
}
''')

Path('packages/profile-workflow/src/external-profile.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';

import {
  createExternalProfileDraft,
  findMatchingExternalProfile,
  type ProfileWorkflowExternalProfileCandidate,
} from './external-profile.js';
import { workflowFixture } from './test-fixture.js';

function ids() {
  let index = 0;
  return (kind: string) => `${kind}-external-${++index}`;
}

const fixedCandidate: ProfileWorkflowExternalProfileCandidate = {
  kind: 'fixed',
  proxyByScheme: {
    fallback: { protocol: 'socks5', host: 'proxy.example', port: 1080 },
    http: { protocol: 'http', host: 'http.example', port: 8080 },
  },
  bypass: ['<local>', '*.internal'],
};

describe('external profile draft import', () => {
  it('creates an exact Fixed profile and quick-switch route', () => {
    const result = createExternalProfileDraft(workflowFixture(), fixedCandidate, 'Imported Proxy', ids());
    expect(result.created).toBe(true);
    const profile = result.draft.profiles.find((candidate) => candidate.id === result.profileId);
    expect(profile).toMatchObject({
      kind: 'fixed',
      name: 'Imported Proxy',
      bypass: [{ pattern: '<local>' }, { pattern: '*.internal' }],
    });
    expect(result.draft.proxyEndpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ protocol: 'socks5', host: 'proxy.example', port: 1080 }),
        expect.objectContaining({ protocol: 'http', host: 'http.example', port: 8080 }),
      ]),
    );
    expect(result.draft.settings.quickSwitch.routes).toContainEqual({
      kind: 'profile',
      profileId: result.profileId,
    });
  });

  it('creates PAC URL and inline profiles', () => {
    const base = workflowFixture();
    const url = createExternalProfileDraft(
      base,
      { kind: 'pac', source: { kind: 'url', url: 'https://pac.example/proxy.pac' } },
      'Imported PAC',
      ids(),
    );
    expect(url.draft.profiles.find((profile) => profile.id === url.profileId)).toMatchObject({
      kind: 'pac',
      source: { kind: 'url', url: 'https://pac.example/proxy.pac' },
    });
    const inline = createExternalProfileDraft(
      base,
      { kind: 'pac', source: { kind: 'inline', script: 'function FindProxyForURL(){return "DIRECT";}' } },
      'Imported Script',
      ids(),
    );
    expect(inline.draft.profiles.find((profile) => profile.id === inline.profileId)).toMatchObject({
      kind: 'pac',
      source: { kind: 'inline' },
    });
  });

  it('finds exact existing profiles and avoids duplicate creation', () => {
    const first = createExternalProfileDraft(workflowFixture(), fixedCandidate, 'Existing', ids());
    const matching = findMatchingExternalProfile(first.draft, fixedCandidate);
    expect(matching?.id).toBe(first.profileId);
    const second = createExternalProfileDraft(first.draft, fixedCandidate, 'Ignored', ids());
    expect(second.created).toBe(false);
    expect(second.profileId).toBe(first.profileId);
    expect(second.draft.profiles).toHaveLength(first.draft.profiles.length);
  });

  it('rejects empty, reserved, and duplicate names', () => {
    const base = workflowFixture();
    expect(() => createExternalProfileDraft(base, fixedCandidate, ' ', ids())).toThrow(/empty/u);
    expect(() => createExternalProfileDraft(base, fixedCandidate, '_External', ids())).toThrow(
      /underscore/u,
    );
    expect(() => createExternalProfileDraft(base, fixedCandidate, base.profiles[0]!.name, ids())).toThrow(
      /already exists/u,
    );
  });
});
''')

replace_once(
    'packages/profile-workflow/src/index.ts',
    """export {
  MemoryProfileWorkflowRepository,
""" if False else "export { MemoryProfileWorkflowRepository } from './memory-repository.js';\n",
    """export { MemoryProfileWorkflowRepository } from './memory-repository.js';
export {
  createExternalProfileDraft,
  findMatchingExternalProfile,
  type ProfileWorkflowExternalProfileCandidate,
  type ProfileWorkflowExternalProfileMutation,
  type ProfileWorkflowExternalProfileService,
  type ProfileWorkflowExternalProxyProtocol,
  type ProfileWorkflowExternalProxyScheme,
  type ProfileWorkflowExternalProxyServer,
} from './external-profile.js';
""",
)
