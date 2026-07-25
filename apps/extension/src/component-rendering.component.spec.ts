import {
  createDefaultProfileSpec,
  createRuleListProfileDraft,
  createSwitchProfileDraft,
  type ProfileWorkflowIdFactory,
} from '@zeroomega-nex/profile-workflow';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import AdvancedProfileEditor from './entrypoints/options/AdvancedProfileEditor.svelte';
import LegacyImportPanel from './entrypoints/options/LegacyImportPanel.svelte';
import SnapshotHistoryPanel from './entrypoints/options/SnapshotHistoryPanel.svelte';
import SwitchProfileEditor from './entrypoints/options/SwitchProfileEditor.svelte';
import PopupApp from './entrypoints/popup/App.svelte';

function baseSpec() {
  return createDefaultProfileSpec({
    documentId: 'document-component-test',
    revisionId: 'revision-component-test',
    createdAt: '2026-07-25T17:15:00.000Z',
    deviceId: 'device-component-test',
  });
}

function idFactory(): ProfileWorkflowIdFactory {
  const counts = new Map<string, number>();
  return (kind) => {
    const next = (counts.get(kind) ?? 0) + 1;
    counts.set(kind, next);
    return `${kind}-component-${next}`;
  };
}

const replaceDraft = async () => true;

describe('Milestone 8 Svelte component rendering contracts', () => {
  it('renders the Popup loading state and familiar settings footer', () => {
    const { body } = render(PopupApp);

    expect(body).toContain('aria-label="ZeroOmega Nex profile switcher"');
    expect(body).toContain('Loading applied profiles');
    expect(body).toContain('popup-footer');
    expect(body).toContain('Open Options');
  });

  it('renders an empty ordered Switch Profile editor with disabled controls', () => {
    const mutation = createSwitchProfileDraft(baseSpec(), idFactory());
    const { body } = render(SwitchProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: true,
        idFactory: idFactory(),
        onReplaceDraft: replaceDraft,
      },
    });

    expect(body).toContain('Default route');
    expect(body).toContain('Rules are evaluated from top to bottom');
    expect(body).toContain('No rules. This profile always uses its default route.');
    expect(body).toContain('aria-label="Add Switch Profile rule"');
    expect(body).toContain('disabled');
  });

  it('renders the Rule List source and routing editors', () => {
    const mutation = createRuleListProfileDraft(baseSpec(), idFactory());
    const { body } = render(AdvancedProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    });

    expect(body).toContain('Rule source');
    expect(body).toContain('Update interval (minutes)');
    expect(body).toContain('aria-label="Inline rule source"');
    expect(body).toContain('Matching rules use');
    expect(body).toContain('Default route');
  });

  it('renders the inactive legacy import review entry point without secret values', () => {
    const { body } = render(LegacyImportPanel, {
      props: {
        disabled: false,
        generation: 0,
        deviceId: 'device-component-test',
        onAcceptImport: async () => true,
      },
    });

    expect(body).toContain('Import ZeroOmega / SwitchyOmega backup');
    expect(body).toContain('aria-label="Legacy backup"');
    expect(body).toContain('Analyze backup');
    expect(body).not.toContain('passwordSecretRef');
    expect(body).not.toContain('secretMaterials');
  });

  it('renders history loading and dirty-Draft rollback protection', () => {
    const { body } = render(SnapshotHistoryPanel, {
      props: {
        disabled: false,
        dirty: true,
        generation: 4,
        onRollbackSnapshot: async () => true,
      },
    });

    expect(body).toContain('Configuration history');
    expect(body).toContain('Draft contains unapplied changes');
    expect(body).toContain('Loading verified snapshot and revision history');
    expect(body).not.toContain('Confirm rollback');
  });
});
