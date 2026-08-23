import {
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
  if (name.startsWith('_'))
    throw new TypeError('external profile name cannot start with an underscore');
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
    endpoint.protocol === server.protocol &&
    endpoint.host === server.host &&
    endpoint.port === server.port
  );
}

function sameBypass(
  profile: FixedProfile,
  candidate: Extract<ProfileWorkflowExternalProfileCandidate, { kind: 'fixed' }>,
): boolean {
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
