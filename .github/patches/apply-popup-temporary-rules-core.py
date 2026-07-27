from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    target.write_text(text.replace(old, new))


Path('packages/profile-workflow/src/popup-temporary-rules.ts').write_text(r'''import {
  cloneProfileSpec,
  validateProfileSpec,
  type Condition,
  type ProfileRouteTarget,
  type ProfileSpec,
  type UserProfile,
} from '@zeroomega-nex/profile-spec';

export const POPUP_TEMPORARY_RULE_SCHEMA_VERSION = 1 as const;
export const POPUP_TEMPORARY_PROFILE_ID_PREFIX = '__zeroomega_nex_popup_temporary__/';
export const POPUP_TEMPORARY_SNAPSHOT_ID_PREFIX = 'popup-temporary-v1/';

export interface PopupTemporaryRule {
  readonly domain: string;
  readonly route: ProfileRouteTarget;
}

export interface PopupTemporaryRuleState {
  readonly schemaVersion: typeof POPUP_TEMPORARY_RULE_SCHEMA_VERSION;
  readonly generation: number;
  readonly rules: readonly PopupTemporaryRule[];
  readonly baseRoute?: ProfileRouteTarget;
}

export interface PopupTemporaryRuleView {
  readonly generation: number;
  readonly rules: readonly PopupTemporaryRule[];
  readonly baseRoute?: ProfileRouteTarget;
  readonly active: boolean;
}

function sameRoute(left: ProfileRouteTarget, right: ProfileRouteTarget): boolean {
  if (left.kind !== right.kind) return false;
  return left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId);
}

function routeFromUnknown(value: unknown): ProfileRouteTarget | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const route = value as Record<string, unknown>;
  if (route.kind === 'direct' || route.kind === 'system') return { kind: route.kind };
  if (route.kind === 'profile' && typeof route.profileId === 'string' && route.profileId) {
    return { kind: 'profile', profileId: route.profileId };
  }
  return undefined;
}

function normalizeDomain(value: string): string {
  const domain = value.trim().toLowerCase().replace(/^\[|\]$/gu, '').replace(/^\.+|\.+$/gu, '');
  if (!domain || /[\s/@?#]/u.test(domain)) throw new TypeError('temporary rule domain is invalid');
  return domain;
}

function profileRoutes(profile: UserProfile): readonly ProfileRouteTarget[] {
  switch (profile.kind) {
    case 'fixed':
      return [];
    case 'switch':
      return [profile.defaultRoute, ...profile.rules.filter((rule) => rule.enabled !== false).map((rule) => rule.route)];
    case 'rule-list':
      return [profile.matchRoute, profile.defaultRoute];
    case 'virtual':
      return [profile.targetRoute];
    case 'pac':
    case 'auto-detect':
      return [];
  }
}

function attachedProfileIds(spec: ProfileSpec): ReadonlySet<string> {
  return new Set(
    spec.profiles.flatMap((profile) =>
      profile.kind === 'switch' && profile.attachedRuleListProfileId
        ? [profile.attachedRuleListProfileId]
        : [],
    ),
  );
}

function isCompilableProfile(
  spec: ProfileSpec,
  profileId: string,
  visiting: Set<string>,
  memo: Map<string, boolean>,
): boolean {
  const cached = memo.get(profileId);
  if (cached !== undefined) return cached;
  if (visiting.has(profileId)) return false;
  const profile = spec.profiles.find((candidate) => candidate.id === profileId);
  if (!profile || profile.enabled === false || profile.kind === 'pac' || profile.kind === 'auto-detect') {
    memo.set(profileId, false);
    return false;
  }
  visiting.add(profileId);
  const supported = profileRoutes(profile).every((route) => {
    if (route.kind === 'direct') return true;
    if (route.kind === 'system') return false;
    return isCompilableProfile(spec, route.profileId, visiting, memo);
  });
  visiting.delete(profileId);
  memo.set(profileId, supported);
  return supported;
}

export function isPopupTemporaryBaseRouteSupported(
  spec: ProfileSpec,
  route: ProfileRouteTarget,
): boolean {
  if (route.kind === 'direct') return true;
  if (route.kind === 'system') return false;
  return isCompilableProfile(spec, route.profileId, new Set(), new Map());
}

export function listPopupTemporaryRuleResultRoutes(
  spec: ProfileSpec,
  baseRoute: ProfileRouteTarget,
): readonly ProfileRouteTarget[] {
  if (!isPopupTemporaryBaseRouteSupported(spec, baseRoute)) return [];
  const hidden = attachedProfileIds(spec);
  const routes: ProfileRouteTarget[] = [{ kind: 'direct' }];
  for (const profile of spec.profiles) {
    if (
      profile.enabled === false ||
      hidden.has(profile.id) ||
      profile.id.startsWith(POPUP_TEMPORARY_PROFILE_ID_PREFIX) ||
      !isCompilableProfile(spec, profile.id, new Set(), new Map())
    ) {
      continue;
    }
    routes.push({ kind: 'profile', profileId: profile.id });
  }
  return routes;
}

export function createPopupTemporaryRuleState(): PopupTemporaryRuleState {
  return { schemaVersion: POPUP_TEMPORARY_RULE_SCHEMA_VERSION, generation: 0, rules: [] };
}

export function parsePopupTemporaryRuleState(value: unknown): PopupTemporaryRuleState {
  if (value === undefined) return createPopupTemporaryRuleState();
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('temporary rule state must be an object');
  }
  const record = value as Record<string, unknown>;
  if (
    record.schemaVersion !== POPUP_TEMPORARY_RULE_SCHEMA_VERSION ||
    !Number.isInteger(record.generation) ||
    Number(record.generation) < 0 ||
    !Array.isArray(record.rules)
  ) {
    throw new TypeError('temporary rule state metadata is invalid');
  }
  const seen = new Set<string>();
  const rules = record.rules.map((entry) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new TypeError('temporary rule entry must be an object');
    }
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.domain !== 'string') throw new TypeError('temporary rule domain is required');
    const domain = normalizeDomain(candidate.domain);
    if (seen.has(domain)) throw new TypeError(`temporary rule domain ${domain} is duplicated`);
    seen.add(domain);
    const route = routeFromUnknown(candidate.route);
    if (!route) throw new TypeError(`temporary rule route for ${domain} is invalid`);
    return { domain, route };
  });
  const baseRoute = record.baseRoute === undefined ? undefined : routeFromUnknown(record.baseRoute);
  if (record.baseRoute !== undefined && !baseRoute) throw new TypeError('temporary rule base route is invalid');
  return {
    schemaVersion: POPUP_TEMPORARY_RULE_SCHEMA_VERSION,
    generation: Number(record.generation),
    rules,
    ...(baseRoute === undefined ? {} : { baseRoute }),
  };
}

export function sanitizePopupTemporaryRuleState(
  state: PopupTemporaryRuleState,
  spec: ProfileSpec,
  baseRoute: ProfileRouteTarget,
): PopupTemporaryRuleState {
  const validRoutes = listPopupTemporaryRuleResultRoutes(spec, baseRoute);
  const rules = state.rules.filter((rule) =>
    validRoutes.some((route) => sameRoute(route, rule.route)),
  );
  const unchanged =
    rules.length === state.rules.length &&
    state.baseRoute !== undefined &&
    sameRoute(state.baseRoute, baseRoute);
  if (unchanged) return state;
  return {
    schemaVersion: POPUP_TEMPORARY_RULE_SCHEMA_VERSION,
    generation: state.generation + 1,
    rules: rules.map((rule) => structuredClone(rule)),
    baseRoute: structuredClone(baseRoute),
  };
}

export function togglePopupTemporaryRule(
  state: PopupTemporaryRuleState,
  domainValue: string,
  route: ProfileRouteTarget,
  baseRoute: ProfileRouteTarget,
): PopupTemporaryRuleState {
  const domain = normalizeDomain(domainValue);
  const rules = state.rules.map((rule) => structuredClone(rule));
  const index = rules.findIndex((rule) => rule.domain === domain);
  if (index >= 0 && sameRoute(rules[index]!.route, route)) rules.splice(index, 1);
  else if (index >= 0) rules[index] = { domain, route: structuredClone(route) };
  else rules.push({ domain, route: structuredClone(route) });
  return {
    schemaVersion: POPUP_TEMPORARY_RULE_SCHEMA_VERSION,
    generation: state.generation + 1,
    rules,
    baseRoute: structuredClone(baseRoute),
  };
}

export function removePopupTemporaryRule(
  state: PopupTemporaryRuleState,
  domainValue: string,
): PopupTemporaryRuleState {
  const domain = normalizeDomain(domainValue);
  const rules = state.rules.filter((rule) => rule.domain !== domain).map((rule) => structuredClone(rule));
  if (rules.length === state.rules.length) return state;
  return {
    schemaVersion: POPUP_TEMPORARY_RULE_SCHEMA_VERSION,
    generation: state.generation + 1,
    rules,
    ...(state.baseRoute === undefined ? {} : { baseRoute: structuredClone(state.baseRoute) }),
  };
}

export function clearPopupTemporaryRules(state: PopupTemporaryRuleState): PopupTemporaryRuleState {
  if (state.rules.length === 0) return state;
  return {
    schemaVersion: POPUP_TEMPORARY_RULE_SCHEMA_VERSION,
    generation: state.generation + 1,
    rules: [],
    ...(state.baseRoute === undefined ? {} : { baseRoute: structuredClone(state.baseRoute) }),
  };
}

function routeToken(route: ProfileRouteTarget): string {
  if (route.kind === 'direct') return 'direct';
  if (route.kind === 'system') throw new TypeError('System Proxy cannot be wrapped by temporary rules');
  return `profile/${encodeURIComponent(route.profileId)}`;
}

function routeFromToken(token: string): ProfileRouteTarget | undefined {
  if (token === 'direct') return { kind: 'direct' };
  if (!token.startsWith('profile/')) return undefined;
  const encoded = token.slice('profile/'.length);
  if (!encoded) return undefined;
  try {
    const profileId = decodeURIComponent(encoded);
    return profileId ? { kind: 'profile', profileId } : undefined;
  } catch {
    return undefined;
  }
}

export function popupTemporaryProfileIdForBaseRoute(route: ProfileRouteTarget): string {
  return `${POPUP_TEMPORARY_PROFILE_ID_PREFIX}${routeToken(route)}`;
}

export function decodePopupTemporaryProfileId(value: string): ProfileRouteTarget | undefined {
  return value.startsWith(POPUP_TEMPORARY_PROFILE_ID_PREFIX)
    ? routeFromToken(value.slice(POPUP_TEMPORARY_PROFILE_ID_PREFIX.length))
    : undefined;
}

export function popupTemporarySnapshotId(profileId: string, nonce: string): string {
  if (!profileId.startsWith(POPUP_TEMPORARY_PROFILE_ID_PREFIX)) {
    throw new TypeError('temporary snapshot requires a temporary profile ID');
  }
  return `${POPUP_TEMPORARY_SNAPSHOT_ID_PREFIX}${profileId.slice(POPUP_TEMPORARY_PROFILE_ID_PREFIX.length)}/${encodeURIComponent(nonce)}`;
}

export function isPopupTemporarySnapshotId(value: string): boolean {
  return value.startsWith(POPUP_TEMPORARY_SNAPSHOT_ID_PREFIX);
}

export function decodePopupTemporarySnapshotId(value: string): ProfileRouteTarget | undefined {
  if (!isPopupTemporarySnapshotId(value)) return undefined;
  const remainder = value.slice(POPUP_TEMPORARY_SNAPSHOT_ID_PREFIX.length);
  const nonceSeparator = remainder.lastIndexOf('/');
  if (nonceSeparator <= 0) return undefined;
  return routeFromToken(remainder.slice(0, nonceSeparator));
}

function temporaryCondition(domain: string): Condition {
  const isIp = domain.includes(':') || /^\d{1,3}(?:\.\d{1,3}){3}$/u.test(domain);
  return { kind: 'host-wildcard', pattern: isIp ? domain : `*.${domain}` };
}

export interface PopupTemporaryRuleOverlay {
  readonly spec: ProfileSpec;
  readonly startRoute: ProfileRouteTarget;
}

export function buildPopupTemporaryRuleOverlay(
  applied: ProfileSpec,
  state: PopupTemporaryRuleState,
  baseRoute: ProfileRouteTarget,
): PopupTemporaryRuleOverlay {
  if (!isPopupTemporaryBaseRouteSupported(applied, baseRoute)) {
    throw new TypeError('current route cannot be wrapped by temporary rules');
  }
  const validRoutes = listPopupTemporaryRuleResultRoutes(applied, baseRoute);
  for (const rule of state.rules) {
    if (!validRoutes.some((route) => sameRoute(route, rule.route))) {
      throw new TypeError(`temporary rule result for ${rule.domain} is no longer available`);
    }
  }
  const spec = cloneProfileSpec(applied);
  const profileId = popupTemporaryProfileIdForBaseRoute(baseRoute);
  if (spec.profiles.some((profile) => profile.id === profileId || profile.name === profileId)) {
    throw new TypeError('temporary runtime profile ID conflicts with an applied profile');
  }
  spec.profiles.push({
    id: profileId,
    name: profileId,
    kind: 'switch',
    rules: state.rules.map((rule, index) => ({
      id: `${profileId}/rule/${index}`,
      condition: temporaryCondition(rule.domain),
      route: structuredClone(rule.route),
      note: `Temporary rule for ${rule.domain}`,
    })),
    defaultRoute: structuredClone(baseRoute),
  });
  const validation = validateProfileSpec(spec);
  if (!validation.valid) {
    const first = validation.issues.find((issue) => issue.severity === 'error');
    throw new TypeError(first ? `${first.code}: ${first.message}` : 'temporary rule overlay is invalid');
  }
  return { spec, startRoute: { kind: 'profile', profileId } };
}

export function inspectPopupTemporaryRuleView(
  state: PopupTemporaryRuleState,
  baseRoute: ProfileRouteTarget | undefined,
  active: boolean,
): PopupTemporaryRuleView {
  return {
    generation: state.generation,
    rules: state.rules.map((rule) => structuredClone(rule)),
    ...(baseRoute === undefined ? {} : { baseRoute: structuredClone(baseRoute) }),
    active,
  };
}
''')

Path('packages/profile-workflow/src/popup-temporary-rules.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';

import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

import {
  buildPopupTemporaryRuleOverlay,
  clearPopupTemporaryRules,
  createPopupTemporaryRuleState,
  decodePopupTemporaryProfileId,
  decodePopupTemporarySnapshotId,
  listPopupTemporaryRuleResultRoutes,
  popupTemporaryProfileIdForBaseRoute,
  popupTemporarySnapshotId,
  removePopupTemporaryRule,
  togglePopupTemporaryRule,
} from './popup-temporary-rules.js';
import { workflowFixture } from './test-fixture.js';

function spec(): ProfileSpec {
  const value = workflowFixture();
  value.profiles.push({
    id: 'profile-switch',
    name: 'Switch',
    kind: 'switch',
    rules: [],
    defaultRoute: { kind: 'direct' },
  });
  value.profiles.push({
    id: 'profile-virtual',
    name: 'Virtual',
    kind: 'virtual',
    targetRoute: { kind: 'profile', profileId: 'profile-primary' },
  });
  value.profiles.push({
    id: 'profile-pac',
    name: 'PAC',
    kind: 'pac',
    source: { kind: 'inline', script: 'function FindProxyForURL(){return "DIRECT";}' },
  });
  return value;
}

describe('Popup temporary rule model', () => {
  it('toggles, replaces, removes, and clears one domain rule', () => {
    const base = { kind: 'profile', profileId: 'profile-switch' } as const;
    const first = togglePopupTemporaryRule(
      createPopupTemporaryRuleState(),
      'Example.COM',
      { kind: 'profile', profileId: 'profile-primary' },
      base,
    );
    expect(first.rules).toEqual([
      { domain: 'example.com', route: { kind: 'profile', profileId: 'profile-primary' } },
    ]);
    const replaced = togglePopupTemporaryRule(first, 'example.com', { kind: 'direct' }, base);
    expect(replaced.rules[0]?.route).toEqual({ kind: 'direct' });
    expect(togglePopupTemporaryRule(replaced, 'example.com', { kind: 'direct' }, base).rules).toEqual([]);
    expect(removePopupTemporaryRule(first, 'example.com').rules).toEqual([]);
    expect(clearPopupTemporaryRules(first).rules).toEqual([]);
  });

  it('lists only PAC-compilable, visible result routes', () => {
    const routes = listPopupTemporaryRuleResultRoutes(spec(), {
      kind: 'profile',
      profileId: 'profile-switch',
    });
    expect(routes).toContainEqual({ kind: 'direct' });
    expect(routes).toContainEqual({ kind: 'profile', profileId: 'profile-primary' });
    expect(routes).toContainEqual({ kind: 'profile', profileId: 'profile-virtual' });
    expect(routes).not.toContainEqual({ kind: 'system' });
    expect(routes).not.toContainEqual({ kind: 'profile', profileId: 'profile-pac' });
  });

  it('builds a hidden Switch overlay whose default is the active base route', () => {
    const base = { kind: 'profile', profileId: 'profile-switch' } as const;
    const state = togglePopupTemporaryRule(
      createPopupTemporaryRuleState(),
      'example.com',
      { kind: 'profile', profileId: 'profile-primary' },
      base,
    );
    const overlay = buildPopupTemporaryRuleOverlay(spec(), state, base);
    expect(overlay.startRoute).toEqual({
      kind: 'profile',
      profileId: popupTemporaryProfileIdForBaseRoute(base),
    });
    const temporary = overlay.spec.profiles.at(-1);
    expect(temporary).toMatchObject({
      kind: 'switch',
      defaultRoute: base,
      rules: [
        {
          condition: { kind: 'host-wildcard', pattern: '*.example.com' },
          route: { kind: 'profile', profileId: 'profile-primary' },
        },
      ],
    });
  });

  it('round-trips the base route through temporary profile and snapshot IDs', () => {
    const route = { kind: 'profile', profileId: 'profile:with/slash' } as const;
    const profileId = popupTemporaryProfileIdForBaseRoute(route);
    expect(decodePopupTemporaryProfileId(profileId)).toEqual(route);
    expect(decodePopupTemporarySnapshotId(popupTemporarySnapshotId(profileId, 'nonce'))).toEqual(route);
  });
});
''')

replace_once(
    'packages/profile-workflow/src/index.ts',
    "export { MemoryProfileWorkflowRepository } from './memory-repository.js';\n",
    """export { MemoryProfileWorkflowRepository } from './memory-repository.js';
export {
  POPUP_TEMPORARY_PROFILE_ID_PREFIX,
  POPUP_TEMPORARY_RULE_SCHEMA_VERSION,
  POPUP_TEMPORARY_SNAPSHOT_ID_PREFIX,
  buildPopupTemporaryRuleOverlay,
  clearPopupTemporaryRules,
  createPopupTemporaryRuleState,
  decodePopupTemporaryProfileId,
  decodePopupTemporarySnapshotId,
  inspectPopupTemporaryRuleView,
  isPopupTemporaryBaseRouteSupported,
  isPopupTemporarySnapshotId,
  listPopupTemporaryRuleResultRoutes,
  parsePopupTemporaryRuleState,
  popupTemporaryProfileIdForBaseRoute,
  popupTemporarySnapshotId,
  removePopupTemporaryRule,
  sanitizePopupTemporaryRuleState,
  togglePopupTemporaryRule,
  type PopupTemporaryRule,
  type PopupTemporaryRuleOverlay,
  type PopupTemporaryRuleState,
  type PopupTemporaryRuleView,
} from './popup-temporary-rules.js';
""",
)
