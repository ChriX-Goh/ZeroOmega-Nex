import {
  validateProfileSpec,
  type FixedProfile,
  type SwitchProfile,
} from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  createAttachedRuleListDraft,
  inspectAttachedRuleList,
} from './attached-rule-list-operations.js';
import {
  createFixedProfileDraft,
  createVirtualProfileDraft,
  deleteProfileDraft,
  duplicateProfileDraft,
  replaceProfileReferencesDraft,
  type ProfileWorkflowIdFactory,
} from './profile-operations.js';
import { createSwitchProfileDraft } from './switch-operations.js';
import { workflowFixture } from './test-fixture.js';

function deterministicIds(): ProfileWorkflowIdFactory {
  const counters = new Map<string, number>();
  return (kind) => {
    const next = (counters.get(kind) ?? 0) + 1;
    counters.set(kind, next);
    return `${kind}-generated-${next}`;
  };
}

describe('profile draft operations', () => {
  it('creates a valid independent fixed profile and quick-switch route', () => {
    const result = createFixedProfileDraft(workflowFixture(), deterministicIds());
    const profile = result.draft.profiles.find((candidate) => candidate.id === result.profileId);

    expect(result.profileId).toBe('profile-generated-1');
    expect(profile).toMatchObject({
      name: 'New profile',
      kind: 'fixed',
      proxyByScheme: {},
    });
    expect(result.draft.proxyEndpoints).toEqual(workflowFixture().proxyEndpoints);
    expect(result.draft.settings.quickSwitch.routes.at(-1)).toEqual({
      kind: 'profile',
      profileId: result.profileId,
    });
    expect(profile).toMatchObject({
      bypass: [
        expect.objectContaining({ pattern: '127.0.0.1' }),
        expect.objectContaining({ pattern: '[::1]' }),
        expect.objectContaining({ pattern: 'localhost' }),
      ],
    });
    expect(validateProfileSpec(result.draft).valid).toBe(true);
  });

  it('duplicates a fixed profile with independent endpoint and bypass IDs', () => {
    const result = duplicateProfileDraft(workflowFixture(), 'profile-primary', deterministicIds());
    const duplicate = result.draft.profiles.find(
      (candidate): candidate is FixedProfile =>
        candidate.id === result.profileId && candidate.kind === 'fixed',
    );

    expect(duplicate).toMatchObject({
      name: 'Proxy copy',
      kind: 'fixed',
      proxyByScheme: { fallback: 'endpoint-generated-1' },
    });
    expect(duplicate?.bypass[0]?.id).toBe('bypass-generated-1');
    expect(result.draft.proxyEndpoints).toContainEqual(
      expect.objectContaining({
        id: 'endpoint-generated-1',
        host: 'proxy.example.invalid',
      }),
    );
    expect(duplicate?.proxyByScheme.fallback).not.toBe('endpoint-primary');
    expect(result.draft.profiles.at(-1)?.id).toBe(result.profileId);
    expect(result.draft.settings.quickSwitch.routes.at(-1)).toEqual({
      kind: 'profile',
      profileId: result.profileId,
    });
    expect(validateProfileSpec(result.draft).valid).toBe(true);
  });

  it('duplicates a Switch profile with an independent hidden attached Rule List', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids, 'Owner');
    const attached = createAttachedRuleListDraft(created.draft, created.profileId, ids);
    const result = duplicateProfileDraft(attached, created.profileId, ids);
    const originalState = inspectAttachedRuleList(result.draft, created.profileId);
    const duplicateState = inspectAttachedRuleList(result.draft, result.profileId);

    expect(originalState).toBeDefined();
    expect(duplicateState).toBeDefined();
    expect(duplicateState?.profile.id).not.toBe(originalState?.profile.id);
    expect(duplicateState?.source.id).not.toBe(originalState?.source.id);
    expect(duplicateState?.enabled).toBe(true);
    expect(duplicateState?.profile.name).toBe(
      `__ruleListOf_${result.draft.profiles.find((profile) => profile.id === result.profileId)?.name}`,
    );
    expect(duplicateState?.source.name).toBe('Owner copy attached rules');
    expect(result.draft.settings.quickSwitch.routes).toContainEqual({
      kind: 'profile',
      profileId: result.profileId,
    });
    expect(result.draft.settings.quickSwitch.routes).not.toContainEqual({
      kind: 'profile',
      profileId: duplicateState?.profile.id,
    });
    expect(validateProfileSpec(result.draft).valid).toBe(true);
  });

  it('deletes a Switch profile together with its hidden attached Rule List and source', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids, 'Owner');
    const attached = createAttachedRuleListDraft(created.draft, created.profileId, ids);
    const state = inspectAttachedRuleList(attached, created.profileId);
    const deleted = deleteProfileDraft(attached, created.profileId);

    expect(deleted.profiles.some((profile) => profile.id === created.profileId)).toBe(false);
    expect(deleted.profiles.some((profile) => profile.id === state?.profile.id)).toBe(false);
    expect(deleted.ruleSources.some((source) => source.id === state?.source.id)).toBe(false);
    expect(validateProfileSpec(deleted).valid).toBe(true);
  });

  it('deletes a profile and removes resources that became orphaned', () => {
    const draft = deleteProfileDraft(workflowFixture(), 'profile-secondary');

    expect(draft.profiles.map((profile) => profile.id)).toEqual(['profile-primary']);
    expect(draft.proxyEndpoints.map((endpoint) => endpoint.id)).toEqual(['endpoint-primary']);
    expect(draft.settings.quickSwitch.routes).not.toContainEqual({
      kind: 'profile',
      profileId: 'profile-secondary',
    });
    expect(validateProfileSpec(draft).valid).toBe(true);
  });

  it('rewrites surviving references to a deleted profile as Direct', () => {
    const spec = workflowFixture();
    spec.profiles.push({
      id: 'profile-switch',
      name: 'Auto Switch',
      kind: 'switch',
      rules: [
        {
          id: 'rule-primary',
          condition: { kind: 'host-wildcard', pattern: '*.example.invalid' },
          route: { kind: 'profile', profileId: 'profile-primary' },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: 'profile-primary' },
    });

    const draft = deleteProfileDraft(spec, 'profile-primary');
    const switchProfile = draft.profiles.find(
      (profile): profile is SwitchProfile =>
        profile.id === 'profile-switch' && profile.kind === 'switch',
    );

    expect(draft.settings.startup.route).toEqual({ kind: 'direct' });
    expect(switchProfile?.defaultRoute).toEqual({ kind: 'direct' });
    expect(switchProfile?.rules[0]?.route).toEqual({ kind: 'direct' });
    expect(draft.proxyEndpoints.map((endpoint) => endpoint.id)).not.toContain('endpoint-primary');
    expect(validateProfileSpec(draft).valid).toBe(true);
  });

  it('keeps Direct and System available after deleting the final quick-switch profile', () => {
    const withoutSecondary = deleteProfileDraft(workflowFixture(), 'profile-secondary');
    withoutSecondary.settings.quickSwitch.routes = [
      { kind: 'profile', profileId: 'profile-primary' },
    ];

    const draft = deleteProfileDraft(withoutSecondary, 'profile-primary');

    expect(draft.profiles).toEqual([]);
    expect(draft.proxyEndpoints).toEqual([]);
    expect(draft.settings.startup.route).toEqual({ kind: 'direct' });
    expect(draft.settings.quickSwitch.routes).toEqual([{ kind: 'direct' }, { kind: 'system' }]);
    expect(validateProfileSpec(draft).valid).toBe(true);
  });

  it('rejects operations for a missing profile', () => {
    expect(() =>
      duplicateProfileDraft(workflowFixture(), 'missing-profile', deterministicIds()),
    ).toThrow('does not exist');
    expect(() => deleteProfileDraft(workflowFixture(), 'missing-profile')).toThrow(
      'does not exist',
    );
  });
});

describe('virtual profile draft operations', () => {
  it('creates a named Virtual profile at the bottom', () => {
    const result = createVirtualProfileDraft(workflowFixture(), deterministicIds(), 'Alias');
    expect(result.draft.profiles.at(-1)).toMatchObject({
      id: result.profileId,
      name: 'Alias',
      kind: 'virtual',
      targetRoute: { kind: 'direct' },
    });
    expect(validateProfileSpec(result.draft).valid).toBe(true);
  });

  it('replaces references to a target with the Virtual profile without rewriting either endpoint', () => {
    const source = workflowFixture();
    const created = createVirtualProfileDraft(source, deterministicIds(), 'Alias');
    const virtual = created.draft.profiles.find((profile) => profile.id === created.profileId);
    if (!virtual || virtual.kind !== 'virtual') throw new Error('virtual profile missing');
    virtual.targetRoute = { kind: 'profile', profileId: 'profile-primary' };
    created.draft.settings.startup.route = { kind: 'profile', profileId: 'profile-primary' };
    const replaced = replaceProfileReferencesDraft(
      created.draft,
      'profile-primary',
      created.profileId,
    );
    expect(replaced.settings.startup.route).toEqual({
      kind: 'profile',
      profileId: created.profileId,
    });
    const retainedVirtual = replaced.profiles.find((profile) => profile.id === created.profileId);
    expect(retainedVirtual).toMatchObject({
      kind: 'virtual',
      targetRoute: { kind: 'profile', profileId: 'profile-primary' },
    });
    expect(validateProfileSpec(replaced).valid).toBe(true);
  });
});
