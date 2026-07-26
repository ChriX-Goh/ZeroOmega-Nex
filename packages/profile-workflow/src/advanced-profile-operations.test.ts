import {
  validateProfileSpec,
  type AutoDetectProfile,
  type PacProfile,
  type RuleListProfile,
} from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  createAutoDetectProfileDraft,
  createPacProfileDraft,
  createRuleListProfileDraft,
} from './advanced-profile-operations.js';
import type { ProfileWorkflowIdFactory } from './profile-operations.js';
import { workflowFixture } from './test-fixture.js';

function deterministicIds(): ProfileWorkflowIdFactory {
  const counters = new Map<string, number>();
  return (kind) => {
    const next = (counters.get(kind) ?? 0) + 1;
    counters.set(kind, next);
    return `${kind}-advanced-${next}`;
  };
}

describe('advanced profile creation', () => {
  it('creates a valid Rule List profile with an independent inline source', () => {
    const result = createRuleListProfileDraft(workflowFixture(), deterministicIds());
    const profile = result.draft.profiles.find(
      (candidate): candidate is RuleListProfile =>
        candidate.id === result.profileId && candidate.kind === 'rule-list',
    );

    expect(profile).toMatchObject({
      id: 'profile-advanced-1',
      sourceId: 'source-advanced-1',
      matchRoute: { kind: 'direct' },
      defaultRoute: { kind: 'system' },
    });
    expect(result.draft.ruleSources).toContainEqual(
      expect.objectContaining({
        id: 'source-advanced-1',
        format: 'autoproxy',
        location: { kind: 'inline', content: '' },
      }),
    );
    expect(validateProfileSpec(result.draft).valid).toBe(true);
  });

  it('creates a valid inline PAC profile with an explicit fallback', () => {
    const result = createPacProfileDraft(workflowFixture(), deterministicIds());
    const profile = result.draft.profiles.find(
      (candidate): candidate is PacProfile =>
        candidate.id === result.profileId && candidate.kind === 'pac',
    );

    expect(profile).toMatchObject({
      id: 'profile-advanced-1',
      source: { kind: 'inline' },
      fallbackRoute: { kind: 'direct' },
    });
    expect(profile?.source.kind === 'inline' ? profile.source.script : '').toContain(
      'FindProxyForURL',
    );
    expect(validateProfileSpec(result.draft).valid).toBe(true);
  });

  it('creates a valid auto-detect profile with a Direct fallback', () => {
    const result = createAutoDetectProfileDraft(workflowFixture(), deterministicIds());
    const profile = result.draft.profiles.find(
      (candidate): candidate is AutoDetectProfile =>
        candidate.id === result.profileId && candidate.kind === 'auto-detect',
    );

    expect(profile).toMatchObject({
      id: 'profile-advanced-1',
      fallbackRoute: { kind: 'direct' },
    });
    expect(result.draft.settings.quickSwitch.routes.at(-1)).toEqual({
      kind: 'profile',
      profileId: result.profileId,
    });
    expect(validateProfileSpec(result.draft).valid).toBe(true);
  });
});
