import {
  validateProfileSpec,
  type Condition,
  type SwitchProfile,
} from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import type { ProfileWorkflowIdFactory } from './profile-operations.js';
import {
  addSwitchRuleDraft,
  createDefaultSwitchCondition,
  createSwitchProfileDraft,
  deleteSwitchRuleDraft,
  duplicateSwitchRuleDraft,
  moveSwitchRuleDraft,
} from './switch-operations.js';
import { workflowFixture } from './test-fixture.js';

function deterministicIds(): ProfileWorkflowIdFactory {
  const counters = new Map<string, number>();
  return (kind) => {
    const next = (counters.get(kind) ?? 0) + 1;
    counters.set(kind, next);
    return `${kind}-switch-${next}`;
  };
}

function switchProfile(spec: ReturnType<typeof workflowFixture>, profileId: string): SwitchProfile {
  const profile = spec.profiles.find(
    (candidate): candidate is SwitchProfile =>
      candidate.id === profileId && candidate.kind === 'switch',
  );
  if (!profile) throw new Error(`missing switch profile ${profileId}`);
  return profile;
}

describe('Switch Profile draft operations', () => {
  it('creates a valid switch profile and appends it to quick switching', () => {
    const result = createSwitchProfileDraft(workflowFixture(), deterministicIds());
    const profile = switchProfile(result.draft, result.profileId);

    expect(profile).toMatchObject({
      id: 'profile-switch-1',
      name: 'New switch profile',
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'direct' },
    });
    expect(result.draft.settings.quickSwitch.routes.at(-1)).toEqual({
      kind: 'profile',
      profileId: result.profileId,
    });
    expect(validateProfileSpec(result.draft).valid).toBe(true);
  });

  it('provides a valid starter condition for every supported condition kind', () => {
    const kinds: readonly Condition['kind'][] = [
      'true',
      'false',
      'url-regex',
      'url-wildcard',
      'host-regex',
      'host-wildcard',
      'bypass',
      'keyword',
      'ip',
      'host-levels',
      'weekday',
      'time',
    ];

    for (const kind of kinds) {
      const created = createSwitchProfileDraft(workflowFixture(), deterministicIds());
      const profile = switchProfile(created.draft, created.profileId);
      profile.rules.push({
        id: `rule-${kind}`,
        condition: createDefaultSwitchCondition(kind),
        route: { kind: 'direct' },
      });
      expect(validateProfileSpec(created.draft).valid, kind).toBe(true);
    }
  });

  it('adds and duplicates rules with independent identities', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids);
    const added = addSwitchRuleDraft(created.draft, created.profileId, ids, 'host-wildcard');
    const duplicated = duplicateSwitchRuleDraft(added.draft, created.profileId, added.ruleId, ids);
    const profile = switchProfile(duplicated.draft, created.profileId);

    expect(profile.rules.map((rule) => rule.id)).toEqual(['rule-switch-1', 'rule-switch-2']);
    expect(profile.rules[1]?.condition).toEqual(profile.rules[0]?.condition);
    expect(profile.rules[1]).not.toBe(profile.rules[0]);
    expect(validateProfileSpec(duplicated.draft).valid).toBe(true);
  });

  it('uses the default result profile and respects top-or-bottom insertion settings', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids);
    const profile = switchProfile(created.draft, created.profileId);
    profile.defaultRoute = { kind: 'system' };

    const first = addSwitchRuleDraft(created.draft, created.profileId, ids, 'host-wildcard');
    expect(switchProfile(first.draft, created.profileId).rules[0]?.route).toEqual({
      kind: 'system',
    });

    first.draft.settings.interface.addConditionsToBottom = false;
    const second = addSwitchRuleDraft(first.draft, created.profileId, ids, 'url-wildcard');
    expect(switchProfile(second.draft, created.profileId).rules.map((rule) => rule.id)).toEqual([
      second.ruleId,
      first.ruleId,
    ]);
  });

  it('moves and deletes rules while preserving first-match order', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids);
    const first = addSwitchRuleDraft(created.draft, created.profileId, ids, 'host-wildcard');
    const second = addSwitchRuleDraft(first.draft, created.profileId, ids, 'url-wildcard');
    const third = addSwitchRuleDraft(second.draft, created.profileId, ids, 'keyword');

    const moved = moveSwitchRuleDraft(third.draft, created.profileId, third.ruleId, -1);
    expect(switchProfile(moved, created.profileId).rules.map((rule) => rule.id)).toEqual([
      first.ruleId,
      third.ruleId,
      second.ruleId,
    ]);

    const deleted = deleteSwitchRuleDraft(moved, created.profileId, third.ruleId);
    expect(switchProfile(deleted, created.profileId).rules.map((rule) => rule.id)).toEqual([
      first.ruleId,
      second.ruleId,
    ]);
    expect(validateProfileSpec(deleted).valid).toBe(true);
  });

  it('rejects operations for missing switch profiles and rules', () => {
    const ids = deterministicIds();
    expect(() => addSwitchRuleDraft(workflowFixture(), 'missing', ids)).toThrow('does not exist');

    const created = createSwitchProfileDraft(workflowFixture(), ids);
    expect(() =>
      duplicateSwitchRuleDraft(created.draft, created.profileId, 'missing-rule', ids),
    ).toThrow('does not exist');
    expect(() => deleteSwitchRuleDraft(created.draft, created.profileId, 'missing-rule')).toThrow(
      'does not exist',
    );
  });
});
