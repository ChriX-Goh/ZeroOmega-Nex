import { validateProfileSpec, type SwitchProfile } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  createAttachedRuleListDraft,
  detachAttachedRuleListDraft,
  inspectAttachedRuleList,
  setAttachedRuleListEnabledDraft,
  updateAttachedRuleListMatchRouteDraft,
  updateSwitchDefaultRouteDraft,
} from './attached-rule-list-operations.js';
import type { ProfileWorkflowIdFactory } from './profile-operations.js';
import { createSwitchProfileDraft } from './switch-operations.js';
import { workflowFixture } from './test-fixture.js';

function deterministicIds(): ProfileWorkflowIdFactory {
  const counters = new Map<string, number>();
  return (kind) => {
    const next = (counters.get(kind) ?? 0) + 1;
    counters.set(kind, next);
    return `${kind}-attached-${next}`;
  };
}

function owner(spec: ReturnType<typeof workflowFixture>, profileId: string): SwitchProfile {
  const profile = spec.profiles.find(
    (candidate): candidate is SwitchProfile =>
      candidate.id === profileId && candidate.kind === 'switch',
  );
  if (!profile) throw new Error(`missing Switch profile ${profileId}`);
  return profile;
}

describe('attached Rule List lifecycle', () => {
  it('creates a hidden enabled Rule List and preserves the previous default route', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids, 'Owner');
    const attached = createAttachedRuleListDraft(created.draft, created.profileId, ids);
    const state = inspectAttachedRuleList(attached, created.profileId);

    expect(state).toBeDefined();
    expect(state?.enabled).toBe(true);
    expect(state?.profile).toMatchObject({
      id: 'profile-attached-2',
      name: '__ruleListOf_Owner',
      kind: 'rule-list',
      sourceId: 'source-attached-1',
      matchRoute: { kind: 'direct' },
      defaultRoute: { kind: 'direct' },
    });
    expect(state?.source).toMatchObject({
      format: 'switchy',
      location: { kind: 'inline', content: '' },
    });
    expect(owner(attached, created.profileId).defaultRoute).toEqual({
      kind: 'profile',
      profileId: state?.profile.id,
    });
    expect(attached.settings.quickSwitch.routes).not.toContainEqual({
      kind: 'profile',
      profileId: state?.profile.id,
    });
    expect(validateProfileSpec(attached).valid).toBe(true);
  });

  it('enables, disables, and updates the visible default route without losing attachment state', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids, 'Owner');
    const attached = createAttachedRuleListDraft(created.draft, created.profileId, ids);
    const disabled = setAttachedRuleListEnabledDraft(attached, created.profileId, false);

    expect(inspectAttachedRuleList(disabled, created.profileId)?.enabled).toBe(false);
    expect(owner(disabled, created.profileId).defaultRoute).toEqual({ kind: 'direct' });

    const updated = updateSwitchDefaultRouteDraft(disabled, created.profileId, { kind: 'system' });
    expect(owner(updated, created.profileId).defaultRoute).toEqual({ kind: 'system' });
    expect(inspectAttachedRuleList(updated, created.profileId)?.profile.defaultRoute).toEqual({
      kind: 'system',
    });

    const enabled = setAttachedRuleListEnabledDraft(updated, created.profileId, true);
    const state = inspectAttachedRuleList(enabled, created.profileId);
    expect(state?.enabled).toBe(true);
    expect(state?.defaultRoute).toEqual({ kind: 'system' });
    expect(owner(enabled, created.profileId).defaultRoute).toEqual({
      kind: 'profile',
      profileId: state?.profile.id,
    });
  });

  it('updates the attached match route and detaches transactionally', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids, 'Owner');
    const attached = createAttachedRuleListDraft(created.draft, created.profileId, ids);
    const routed = updateAttachedRuleListMatchRouteDraft(attached, created.profileId, {
      kind: 'system',
    });
    const state = inspectAttachedRuleList(routed, created.profileId);
    expect(state?.profile.matchRoute).toEqual({ kind: 'system' });

    const detached = detachAttachedRuleListDraft(routed, created.profileId);
    expect(inspectAttachedRuleList(detached, created.profileId)).toBeUndefined();
    expect(owner(detached, created.profileId).attachedRuleListProfileId).toBeUndefined();
    expect(owner(detached, created.profileId).defaultRoute).toEqual({ kind: 'direct' });
    expect(detached.profiles.some((profile) => profile.id === state?.profile.id)).toBe(false);
    expect(detached.ruleSources.some((source) => source.id === state?.source.id)).toBe(false);
    expect(validateProfileSpec(detached).valid).toBe(true);
  });
});
