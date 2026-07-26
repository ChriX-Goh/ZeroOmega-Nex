import {
  addSwitchRuleDraft,
  createDefaultProfileSpec,
  createFixedProfileDraft,
  createRuleListProfileDraft,
  createSwitchProfileDraft,
  createVirtualProfileDraft,
  type ProfileWorkflowIdFactory,
} from '@zeroomega-nex/profile-workflow';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import FixedProfileEditor from './entrypoints/options/FixedProfileEditor.svelte';
import NewProfileDialog from './entrypoints/options/NewProfileDialog.svelte';
import VirtualProfileEditor from './entrypoints/options/VirtualProfileEditor.svelte';
import AdvancedProfileEditor from './entrypoints/options/AdvancedProfileEditor.svelte';
import LegacyImportPanel from './entrypoints/options/LegacyImportPanel.svelte';
import SnapshotHistoryPanel from './entrypoints/options/SnapshotHistoryPanel.svelte';
import SwitchProfileEditor from './entrypoints/options/SwitchProfileEditor.svelte';
import ThemePanel from './entrypoints/options/ThemePanel.svelte';
import ProfileIcon from './components/ProfileIcon.svelte';
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
  it('renders distinct colored profile type icons', () => {
    for (const kind of [
      'direct',
      'system',
      'fixed',
      'switch',
      'rule-list',
      'pac',
      'virtual',
      'auto-detect',
    ] as const) {
      const { body } = render(ProfileIcon, { props: { kind, color: '#123456', size: 24 } });
      expect(body).toContain(`data-profile-kind="${kind}"`);
      expect(body).toContain('--profile-icon-color: #123456');
    }
  });

  it('renders the Popup loading state and familiar settings footer', () => {
    const { body } = render(PopupApp);

    expect(body).toContain('aria-label="ZeroOmega Nex profile switcher"');
    expect(body).toContain('Loading applied profiles');
    expect(body).toContain('popup-footer');
    expect(body).toContain('aria-label="Open ZeroOmega Nex options"');
    expect(body).toContain('<span>Options</span>');
  });

  it('renders the original Fixed Profile proxy table and collapsed advanced rows', () => {
    const mutation = createFixedProfileDraft(baseSpec(), idFactory(), 'Blank proxy');
    const { body } = render(FixedProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        generation: 0,
        disabled: false,
        idFactory: idFactory(),
        onReplaceDraft: replaceDraft,
        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
      },
    });

    expect(body).toContain('Proxy servers');
    expect(body).toContain('Scheme');
    expect(body).toContain('(default)');
    expect(body).toContain('DIRECT');
    expect(body).toContain('Show Advanced');
    expect(body).toContain('Bypass List');
    expect(body).toContain('127.0.0.1');
    expect(body).toContain('[::1]');
    expect(body).not.toContain('value="127.0.0.1"');
    expect(body).not.toContain('value="7890"');
  });

  it('renders the original compact Switch Profile rule table and grouped conditions', () => {
    const ids = idFactory();
    const created = createSwitchProfileDraft(baseSpec(), ids);
    const mutation = addSwitchRuleDraft(created.draft, created.profileId, ids, 'host-wildcard');
    const { body } = render(SwitchProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: created.profileId,
        disabled: true,
        idFactory: ids,
        onReplaceDraft: replaceDraft,
        onRegisterBeforeAction: () => undefined,
        onSourceDirtyChange: () => undefined,
      },
    });

    expect(body).toContain('data-switch-rules-table');
    expect(body).toContain('data-switch-rule-row');
    expect(body).toContain('data-switch-drag-handle');
    expect(body).toContain('Condition type');
    expect(body).toContain('Condition details');
    expect(body).toContain('Result profile');
    expect(body).toContain('Add condition');
    expect(body).toContain('Default profile');
    expect(body).toContain('data-switch-source-toggle');
    expect(body).toContain('Edit Source');
    expect(body).toContain('<optgroup label="Basic conditions">');
    expect(body).not.toContain('Ordered Switch Profile rules');
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
        onImportAndApply: async () => true,
      },
    });

    expect(body).toContain('Restore original ZeroOmega / SwitchyOmega backup');
    expect(body).toContain('aria-label="Legacy backup file"');
    expect(body).toContain('Paste backup text instead');
    expect(body).not.toContain('passwordSecretRef');
    expect(body).not.toContain('secretMaterials');
  });

  it('renders Automatic, Light, and Dark theme choices', () => {
    const { body } = render(ThemePanel, {
      props: { mode: 'auto', onChange: () => undefined },
    });

    expect(body).toContain('Automatic');
    expect(body).toContain('Light');
    expect(body).toContain('Dark');
    expect(body).toContain('aria-checked="true"');
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
  it('renders the original four new-profile choices and name validation shell', () => {
    const { body } = render(NewProfileDialog, {
      props: {
        existingNames: ['Existing'],
        disabled: false,
        pacSupported: true,
        onCancel: () => undefined,
        onCreate: async () => undefined,
      },
    });

    expect(body).toContain('role="dialog"');
    expect(body).toContain('Profile name');
    expect(body).toContain('Proxy Profile');
    expect(body).toContain('Switch Profile');
    expect(body).toContain('PAC Profile');
    expect(body).toContain('Virtual Profile');
    expect(body).not.toContain('Rule List Profile');
    expect(body).not.toContain('Auto Detect Profile');
  });

  it('renders a Virtual Profile target and migration workflow', () => {
    const mutation = createVirtualProfileDraft(baseSpec(), idFactory(), 'Virtual');
    const { body } = render(VirtualProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    });

    expect(body).toContain('Target profile');
    expect(body).toContain('Migrate to Virtual Profile');
    expect(body).toContain('Replace target profile');
  });
});
