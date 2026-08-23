import { describe, expect, it } from 'vitest';

import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

import {
  addPopupConditionDraft,
  listPopupConditionResultRoutes,
  setPopupProfileResultDraft,
} from './popup-condition.js';
import { workflowFixture } from './test-fixture.js';

function switchSpec(addToBottom: boolean): ProfileSpec {
  const spec = workflowFixture();
  spec.settings.interface.addConditionsToBottom = addToBottom;
  spec.profiles.push({
    id: 'profile-switch',
    name: 'Auto Switch',
    kind: 'switch',
    defaultRoute: { kind: 'direct' },
    rules: [
      {
        id: 'rule-existing',
        condition: { kind: 'host-wildcard', pattern: '*.existing.example' },
        route: { kind: 'profile', profileId: 'profile-primary' },
      },
    ],
  });
  return spec;
}

describe('Popup current-site condition mutation', () => {
  it('inserts at the top by default and replaces the first identical condition', () => {
    const spec = switchSpec(false);
    const first = addPopupConditionDraft(spec, {
      switchProfileId: 'profile-switch',
      ruleId: 'rule-popup-one',
      condition: { kind: 'host-wildcard', pattern: '*.example.co.uk' },
      route: { kind: 'profile', profileId: 'profile-primary' },
    });
    const replaced = addPopupConditionDraft(first, {
      switchProfileId: 'profile-switch',
      ruleId: 'rule-popup-two',
      condition: { kind: 'host-wildcard', pattern: '*.example.co.uk' },
      route: { kind: 'profile', profileId: 'profile-secondary' },
    });
    const profile = replaced.profiles.find((candidate) => candidate.id === 'profile-switch');
    if (!profile || profile.kind !== 'switch') throw new Error('missing Switch Profile');
    expect(profile.rules.map((rule) => rule.id)).toEqual(['rule-popup-two', 'rule-existing']);
    expect(profile.rules[0]?.route).toEqual({ kind: 'profile', profileId: 'profile-secondary' });
  });

  it('inserts at the bottom only when addConditionsToBottom is enabled', () => {
    const spec = addPopupConditionDraft(switchSpec(true), {
      switchProfileId: 'profile-switch',
      ruleId: 'rule-popup-bottom',
      condition: { kind: 'url-wildcard', pattern: '*://*.example.co.uk/*' },
      route: { kind: 'direct' },
    });
    const profile = spec.profiles.find((candidate) => candidate.id === 'profile-switch');
    if (!profile || profile.kind !== 'switch') throw new Error('missing Switch Profile');
    expect(profile.rules.map((rule) => rule.id)).toEqual(['rule-existing', 'rule-popup-bottom']);
  });

  it('excludes hidden, disabled, self, and cycle-producing result profiles', () => {
    const spec = switchSpec(false);
    spec.profiles.push(
      {
        id: 'profile-hidden-rules',
        name: '__ruleListOf_Auto Switch',
        kind: 'rule-list',
        sourceId: 'source-hidden',
        matchRoute: { kind: 'direct' },
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'profile-disabled',
        name: 'Disabled',
        kind: 'fixed',
        enabled: false,
        proxyByScheme: {},
        bypass: [],
      },
      {
        id: 'profile-cycle-alias',
        name: 'Cycle alias',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-switch' },
      },
    );
    spec.ruleSources.push({
      id: 'source-hidden',
      name: 'Hidden source',
      format: 'autoproxy',
      location: { kind: 'inline', content: '||example.com' },
    });
    const owner = spec.profiles.find((candidate) => candidate.id === 'profile-switch');
    if (!owner || owner.kind !== 'switch') throw new Error('missing Switch Profile');
    owner.attachedRuleListProfileId = 'profile-hidden-rules';
    const keys = listPopupConditionResultRoutes(spec, owner.id).map((route) =>
      route.kind === 'profile' ? route.profileId : route.kind,
    );
    expect(keys).toEqual(['direct', 'system', 'profile-primary', 'profile-secondary']);
  });
  it('changes Switch and Virtual result routes without mutating the source revision', () => {
    const original = switchSpec(false);
    original.profiles.push({
      id: 'profile-virtual',
      name: 'Virtual route',
      kind: 'virtual',
      targetRoute: { kind: 'direct' },
    });
    const switched = setPopupProfileResultDraft(original, 'profile-switch', {
      kind: 'profile',
      profileId: 'profile-secondary',
    });
    const virtual = setPopupProfileResultDraft(switched, 'profile-virtual', {
      kind: 'profile',
      profileId: 'profile-primary',
    });
    const switchProfile = virtual.profiles.find((profile) => profile.id === 'profile-switch');
    const virtualProfile = virtual.profiles.find((profile) => profile.id === 'profile-virtual');
    if (!switchProfile || switchProfile.kind !== 'switch')
      throw new Error('missing Switch Profile');
    if (!virtualProfile || virtualProfile.kind !== 'virtual')
      throw new Error('missing Virtual Profile');
    expect(switchProfile.defaultRoute).toEqual({
      kind: 'profile',
      profileId: 'profile-secondary',
    });
    expect(virtualProfile.targetRoute).toEqual({
      kind: 'profile',
      profileId: 'profile-primary',
    });
    const originalSwitch = original.profiles.find((profile) => profile.id === 'profile-switch');
    if (!originalSwitch || originalSwitch.kind !== 'switch') throw new Error('missing original');
    expect(originalSwitch.defaultRoute).toEqual({ kind: 'direct' });
  });

  it('rejects result routes that would create a Virtual cycle', () => {
    const spec = switchSpec(false);
    spec.profiles.push(
      {
        id: 'profile-virtual-a',
        name: 'Virtual A',
        kind: 'virtual',
        targetRoute: { kind: 'direct' },
      },
      {
        id: 'profile-virtual-b',
        name: 'Virtual B',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-virtual-a' },
      },
    );
    expect(() =>
      setPopupProfileResultDraft(spec, 'profile-virtual-a', {
        kind: 'profile',
        profileId: 'profile-virtual-b',
      }),
    ).toThrow(/not valid/u);
  });
});
