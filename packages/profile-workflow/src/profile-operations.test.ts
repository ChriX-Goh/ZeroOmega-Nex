import {
  validateProfileSpec,
  type FixedProfile,
  type SwitchProfile,
} from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  createFixedProfileDraft,
  deleteProfileDraft,
  duplicateProfileDraft,
  type ProfileWorkflowIdFactory,
} from './profile-operations.js';
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
      proxyByScheme: { fallback: 'endpoint-generated-1' },
    });
    expect(result.draft.proxyEndpoints).toContainEqual(
      expect.objectContaining({
        id: 'endpoint-generated-1',
        host: '127.0.0.1',
        port: 7890,
      }),
    );
    expect(result.draft.settings.quickSwitch.routes.at(-1)).toEqual({
      kind: 'profile',
      profileId: result.profileId,
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
