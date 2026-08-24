import { cloneProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  createProfileWorkflowCandidate,
  createProfileWorkflowState,
  inspectProfileWorkflow,
  replaceProfileWorkflowDraft,
  revertProfileWorkflowDraft,
  selectProfileWorkflowProfile,
  updateProfileWorkflowDraft,
} from './state.js';
import { workflowFixture } from './test-fixture.js';

describe('profile workflow draft state', () => {
  it('starts clean and selects the first available profile', () => {
    const state = createProfileWorkflowState(workflowFixture());
    expect(inspectProfileWorkflow(state)).toEqual({
      dirty: false,
      busy: false,
      appliedRevisionId: 'revision-applied',
      draftRevisionId: 'revision-applied',
      selectedProfileId: 'profile-primary',
      selectedProfileExists: true,
    });
  });

  it('tracks edits without minting a fake revision', () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const edited = updateProfileWorkflowDraft(initial, (draft) => {
      draft.profiles[0]!.name = 'Edited Proxy';
    });
    expect(edited.draft.revision).toEqual(initial.applied.revision);
    expect(edited.applied.profiles[0]!.name).toBe('Proxy');
    expect(edited.draft.profiles[0]!.name).toBe('Edited Proxy');
    expect(inspectProfileWorkflow(edited).dirty).toBe(true);
  });

  it('reverts all draft changes while preserving a valid selection', () => {
    const initial = createProfileWorkflowState(workflowFixture(), 'profile-secondary');
    const edited = updateProfileWorkflowDraft(initial, (draft) => {
      draft.profiles[1]!.name = 'Edited Backup';
    });
    const reverted = revertProfileWorkflowDraft(edited);
    expect(reverted.draft).toEqual(reverted.applied);
    expect(reverted.selectedProfileId).toBe('profile-secondary');
    expect(inspectProfileWorkflow(reverted).dirty).toBe(false);
  });

  it('falls back deterministically when the selected profile is deleted', () => {
    const initial = createProfileWorkflowState(workflowFixture(), 'profile-secondary');
    const edited = updateProfileWorkflowDraft(initial, (draft) => {
      draft.profiles = draft.profiles.filter((profile) => profile.id !== 'profile-secondary');
      draft.proxyEndpoints = draft.proxyEndpoints.filter(
        (endpoint) => endpoint.id !== 'endpoint-secondary',
      );
      draft.settings.quickSwitch.routes = draft.settings.quickSwitch.routes.filter(
        (route) => route.kind !== 'profile' || route.profileId !== 'profile-secondary',
      );
    });
    expect(edited.selectedProfileId).toBe('profile-primary');
    expect(inspectProfileWorkflow(edited).selectedProfileExists).toBe(true);
  });

  it('removes selection when no user profile remains', () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const edited = updateProfileWorkflowDraft(initial, (draft) => {
      draft.profiles = [];
      draft.proxyEndpoints = [];
      draft.settings.startup.route = { kind: 'direct' };
      draft.settings.quickSwitch.routes = [{ kind: 'direct' }, { kind: 'system' }];
    });
    expect(edited.selectedProfileId).toBeUndefined();
    expect(inspectProfileWorkflow(edited).selectedProfileExists).toBe(false);
  });

  it('rejects selecting a profile outside the draft', () => {
    const state = createProfileWorkflowState(workflowFixture());
    expect(() => selectProfileWorkflowProfile(state, 'missing-profile')).toThrow(
      'does not exist in the draft',
    );
  });

  it('normalizes replacement drafts to the applied revision', () => {
    const state = createProfileWorkflowState(workflowFixture());
    const replacement = cloneProfileSpec(state.draft);
    replacement.revision = {
      id: 'untrusted-draft-revision',
      createdAt: '2026-07-25T08:01:00.000Z',
    };
    replacement.profiles[0]!.name = 'Replacement';
    const next = replaceProfileWorkflowDraft(state, replacement);
    expect(next.draft.revision).toEqual(state.applied.revision);
    expect(next.draft.profiles[0]!.name).toBe('Replacement');
  });

  it('rejects a draft from a different document', () => {
    const state = createProfileWorkflowState(workflowFixture());
    const replacement = cloneProfileSpec(state.draft);
    replacement.documentId = 'different-document';
    expect(() => replaceProfileWorkflowDraft(state, replacement)).toThrow('same documentId');
  });

  it('retains incomplete Switch conditions in Draft but refuses a strict Apply candidate', () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const edited = updateProfileWorkflowDraft(initial, (draft) => {
      draft.profiles.push({
        id: 'profile-switch-draft',
        name: 'Incomplete Switch',
        kind: 'switch',
        rules: [
          {
            id: 'rule-incomplete',
            condition: { kind: 'host-wildcard', pattern: '' },
            route: { kind: 'direct' },
          },
        ],
        defaultRoute: { kind: 'direct' },
      });
    });

    expect(inspectProfileWorkflow(edited).dirty).toBe(true);
    const profile = edited.draft.profiles.find(
      (candidate) => candidate.id === 'profile-switch-draft',
    );
    expect(profile?.kind).toBe('switch');
    if (profile?.kind !== 'switch') throw new Error('fixture mismatch');
    expect(profile.rules[0]?.condition).toEqual({ kind: 'host-wildcard', pattern: '' });
    expect(() =>
      createProfileWorkflowCandidate(edited, {
        revisionId: 'revision-incomplete',
        startedAt: '2026-07-25T08:02:00.000Z',
        deviceId: 'device-test',
      }),
    ).toThrow('requires a valid ProfileSpec');
  });

  it('still rejects structurally invalid Draft values', () => {
    const initial = createProfileWorkflowState(workflowFixture());
    expect(() =>
      updateProfileWorkflowDraft(initial, (draft) => {
        draft.profiles.push({
          id: 'profile-switch-broken',
          name: 'Broken Switch',
          kind: 'switch',
          rules: [
            {
              id: 'rule-broken',
              condition: { kind: 'ip', address: '', prefixLength: 0 },
              route: { kind: 'direct' },
            },
          ],
          defaultRoute: { kind: 'direct' },
        });
      }),
    ).toThrow('structurally valid ProfileSpec draft');
  });

  it('creates a child revision only when Apply prepares a candidate', () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const edited = updateProfileWorkflowDraft(initial, (draft) => {
      draft.profiles[0]!.name = 'Applied Name';
    });
    const candidate = createProfileWorkflowCandidate(edited, {
      revisionId: 'revision-candidate',
      startedAt: '2026-07-25T08:02:00.000Z',
      deviceId: 'device-test',
    });
    expect(candidate.revision).toEqual({
      id: 'revision-candidate',
      parentId: 'revision-applied',
      createdAt: '2026-07-25T08:02:00.000Z',
      deviceId: 'device-test',
    });
    expect(candidate.profiles[0]!.name).toBe('Applied Name');
    expect(edited.draft.revision.id).toBe('revision-applied');
  });
});
