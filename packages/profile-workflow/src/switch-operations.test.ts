import {
  validateProfileSpec,
  validateProfileSpecDraft,
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

  it('uses blank text conditions while keeping every starter structurally valid as a draft', () => {
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
    const textKinds = new Set<Condition['kind']>([
      'url-regex',
      'url-wildcard',
      'host-regex',
      'host-wildcard',
      'bypass',
      'keyword',
    ]);

    for (const kind of kinds) {
      const created = createSwitchProfileDraft(workflowFixture(), deterministicIds());
      const profile = switchProfile(created.draft, created.profileId);
      const condition = createDefaultSwitchCondition(kind);
      profile.rules.push({
        id: `rule-${kind}`,
        condition,
        route: { kind: 'direct' },
      });
      expect(validateProfileSpecDraft(created.draft).valid, kind).toBe(true);
      expect(validateProfileSpec(created.draft).valid, kind).toBe(!textKinds.has(kind));
      if ('pattern' in condition) expect(condition.pattern, kind).toBe('');
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
    expect(validateProfileSpecDraft(duplicated.draft).valid).toBe(true);
  });

  it('appends editor-added rules and copies the previous rule after the first row', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids);
    const profile = switchProfile(created.draft, created.profileId);
    profile.defaultRoute = { kind: 'system' };

    const first = addSwitchRuleDraft(created.draft, created.profileId, ids, 'host-wildcard');
    const firstProfile = switchProfile(first.draft, created.profileId);
    expect(firstProfile.rules[0]?.route).toEqual({ kind: 'system' });
    firstProfile.rules[0]!.route = { kind: 'direct' };
    firstProfile.rules[0]!.note = 'template note';
    const firstCondition = firstProfile.rules[0]!.condition;
    if (firstCondition.kind !== 'host-wildcard') throw new Error('condition fixture mismatch');
    firstCondition.pattern = '*.example.com';

    first.draft.settings.interface.addConditionsToBottom = false;
    const second = addSwitchRuleDraft(first.draft, created.profileId, ids, 'url-wildcard');
    const secondProfile = switchProfile(second.draft, created.profileId);

    expect(secondProfile.rules.map((rule) => rule.id)).toEqual([first.ruleId, second.ruleId]);
    expect(secondProfile.rules[1]).toMatchObject({
      condition: { kind: 'host-wildcard', pattern: '' },
      route: { kind: 'direct' },
      note: 'template note',
    });
    expect(secondProfile.rules[0]?.condition).toEqual({
      kind: 'host-wildcard',
      pattern: '*.example.com',
    });
    expect(secondProfile.rules[1]).not.toBe(secondProfile.rules[0]);
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
    expect(validateProfileSpecDraft(deleted).valid).toBe(true);
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
