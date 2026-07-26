import type {
  ProfileRouteTarget,
  ProfileSpec,
  ProxyEndpoint,
  UserProfile,
} from '@zeroomega-nex/profile-spec';

import type { ProxyAuthenticationBinding } from './authentication.js';

export interface UnsupportedProxyAuthenticationEndpoint {
  readonly endpointId: string;
  readonly protocol: 'socks4' | 'socks5';
}

export interface ProxyAuthenticationPlan {
  readonly bindings: readonly ProxyAuthenticationBinding[];
  readonly unsupported: readonly UnsupportedProxyAuthenticationEndpoint[];
}

function routeKey(route: ProfileRouteTarget): string {
  return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
}

function profileRoutes(profile: UserProfile): readonly ProfileRouteTarget[] {
  switch (profile.kind) {
    case 'fixed':
      return [];
    case 'switch':
      return [
        profile.defaultRoute,
        ...profile.rules.filter((rule) => rule.enabled !== false).map((rule) => rule.route),
      ];
    case 'rule-list':
      return [profile.matchRoute, profile.defaultRoute];
    case 'pac':
    case 'auto-detect':
      return profile.fallbackRoute === undefined ? [] : [profile.fallbackRoute];
    case 'virtual':
      return [profile.targetRoute];
  }
}

function fixedEndpointIds(profile: UserProfile): readonly string[] {
  if (profile.kind !== 'fixed') return [];
  return Object.values(profile.proxyByScheme).filter(
    (endpointId): endpointId is string => endpointId !== undefined,
  );
}

function reachableEndpointIds(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
): ReadonlySet<string> {
  const endpointIds = new Set<string>();
  const visitedRoutes = new Set<string>();
  const routes: ProfileRouteTarget[] = [startRoute];

  while (routes.length > 0) {
    const route = routes.pop();
    if (!route) continue;
    const key = routeKey(route);
    if (visitedRoutes.has(key)) continue;
    visitedRoutes.add(key);
    if (route.kind !== 'profile') continue;

    const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
    if (!profile) continue;
    for (const endpointId of fixedEndpointIds(profile)) endpointIds.add(endpointId);
    routes.push(...profileRoutes(profile));
  }

  return endpointIds;
}

function bindingFor(endpoint: ProxyEndpoint): ProxyAuthenticationBinding | undefined {
  if (!endpoint.credential) return undefined;
  if (endpoint.protocol !== 'http' && endpoint.protocol !== 'https') return undefined;
  return {
    endpointId: endpoint.id,
    protocol: endpoint.protocol,
    host: endpoint.host,
    port: endpoint.port,
    username: endpoint.credential.username ?? '',
    passwordSecretRef: endpoint.credential.passwordSecretRef,
  };
}

export function createProxyAuthenticationPlan(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
): ProxyAuthenticationPlan {
  const reachable = reachableEndpointIds(spec, startRoute);
  const bindings: ProxyAuthenticationBinding[] = [];
  const unsupported: UnsupportedProxyAuthenticationEndpoint[] = [];

  for (const endpoint of spec.proxyEndpoints) {
    if (!reachable.has(endpoint.id) || !endpoint.credential) continue;
    const binding = bindingFor(endpoint);
    if (binding) bindings.push(binding);
    else {
      unsupported.push({
        endpointId: endpoint.id,
        protocol: endpoint.protocol as 'socks4' | 'socks5',
      });
    }
  }

  return { bindings, unsupported };
}
