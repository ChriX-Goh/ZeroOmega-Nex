import { describe, expect, it } from 'vitest';

import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

import {
  buildPopupTemporaryRuleOverlay,
  clearPopupTemporaryRules,
  createPopupTemporaryRuleState,
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
    expect(first.overlayActive).toBe(true);
    expect(first.rules).toEqual([
      { domain: 'example.com', route: { kind: 'profile', profileId: 'profile-primary' } },
    ]);
    const replaced = togglePopupTemporaryRule(first, 'example.com', { kind: 'direct' }, base);
    expect(replaced.rules[0]?.route).toEqual({ kind: 'direct' });
    expect(
      togglePopupTemporaryRule(replaced, 'example.com', { kind: 'direct' }, base).rules,
    ).toEqual([]);
    const removed = removePopupTemporaryRule(first, 'example.com');
    expect(removed.rules).toEqual([]);
    expect(removed.overlayActive).toBe(true);
    const cleared = clearPopupTemporaryRules(first);
    expect(cleared.rules).toEqual([]);
    expect(cleared.overlayActive).toBe(true);
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

  it('builds an empty hidden overlay after the last temporary rule is removed', () => {
    const base = { kind: 'profile', profileId: 'profile-switch' } as const;
    const active = togglePopupTemporaryRule(
      createPopupTemporaryRuleState(),
      'example.com',
      { kind: 'profile', profileId: 'profile-primary' },
      base,
    );
    const removed = removePopupTemporaryRule(active, 'example.com');
    const overlay = buildPopupTemporaryRuleOverlay(spec(), removed, base);
    expect(overlay.spec.profiles.at(-1)).toMatchObject({
      id: popupTemporaryProfileIdForBaseRoute(base),
      kind: 'switch',
      rules: [],
      defaultRoute: base,
    });
  });

  it('uses a valid fixed profile ID and round-trips the base route through snapshot IDs', () => {
    const route = { kind: 'profile', profileId: 'profile:with:colon' } as const;
    const profileId = popupTemporaryProfileIdForBaseRoute(route);
    expect(profileId).toMatch(/^[A-Za-z0-9][A-Za-z0-9._:-]+$/u);
    expect(decodePopupTemporarySnapshotId(popupTemporarySnapshotId(route, 'nonce'))).toEqual(route);
  });
});
