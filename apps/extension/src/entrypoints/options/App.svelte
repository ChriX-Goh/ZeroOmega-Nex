<script lang="ts">
  import { productIdentity } from '@zeroomega-nex/core-contracts';
  import { cloneProfileSpecDraft } from '@zeroomega-nex/profile-spec';
  import type {
    FixedProfile,
    ProfileRouteTarget,
    ProfileSpec,
    SwitchProfile,
    UserProfile,
    VirtualProfile,
  } from '@zeroomega-nex/profile-spec';
  import {
    createFixedProfileDraft,
    createPacProfileDraft,
    createSwitchProfileDraft,
    createVirtualProfileDraft,
    deleteProfileDraft,
    duplicateProfileDraft,
  } from '@zeroomega-nex/profile-workflow';
  import type {
    ProfileWorkflowCommandResponse,
    ProfileWorkflowIdFactory,
    ProfileWorkflowProfileMutation,
    ProfileWorkflowSecretMaterial,
    ProfileWorkflowState,
    ProfileWorkflowView,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';

  import ProfileIcon from '../../components/ProfileIcon.svelte';
  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
  import {
    applyThemeMode,
    readThemeMode,
    storeThemeMode,
    type ThemeMode,
  } from '../../lib/ui-theme';
  import AdvancedProfileEditor from './AdvancedProfileEditor.svelte';
  import FixedProfileEditor from './FixedProfileEditor.svelte';
  import LegacyImportPanel from './LegacyImportPanel.svelte';
  import NewProfileDialog from './NewProfileDialog.svelte';
  import SnapshotHistoryPanel from './SnapshotHistoryPanel.svelte';
  import SwitchProfileEditor from './SwitchProfileEditor.svelte';
  import ThemePanel from './ThemePanel.svelte';
  import VirtualProfileEditor from './VirtualProfileEditor.svelte';

  type NewProfileKind = 'fixed' | 'switch' | 'pac' | 'virtual';

  type OptionsSection =
    | 'interface'
    | 'general'
    | 'import'
    | 'theme'
    | 'history'
    | 'builtin'
    | 'new-profile'
    | 'profile'
    | 'about';
  type InterfaceFlag =
    | 'confirmDeletion'
    | 'showInspectMenu'
    | 'addConditionsToBottom'
    | 'showResultProfileOnActionBadgeText'
    | 'showExternalProfile'
    | 'showAdvancedConditions'
    | 'exportLegacyRuleList';

  let activeSection: OptionsSection = 'profile';
  let themeMode: ThemeMode = 'auto';
  let state: ProfileWorkflowState | undefined;
  let view: ProfileWorkflowView | undefined;
  let loading = true;
  let saving = false;
  let errorMessage = '';
  let lastAppliedSnapshotId = '';

  let profiles: readonly UserProfile[] = [];
  let selectedProfile: UserProfile | undefined;
  let fixedProfile: FixedProfile | undefined;
  let switchProfile: SwitchProfile | undefined;
  let virtualProfile: VirtualProfile | undefined;

  $: profiles = state?.draft.profiles ?? [];
  $: selectedProfile = profiles.find((profile) => profile.id === state?.selectedProfileId);
  $: fixedProfile = selectedProfile?.kind === 'fixed' ? selectedProfile : undefined;
  $: switchProfile = selectedProfile?.kind === 'switch' ? selectedProfile : undefined;
  $: virtualProfile = selectedProfile?.kind === 'virtual' ? selectedProfile : undefined;

  const createWorkflowId: ProfileWorkflowIdFactory = (kind) => `${kind}-${crypto.randomUUID()}`;

  function profileType(profile: UserProfile): string {
    switch (profile.kind) {
      case 'fixed':
        return 'Fixed Profile';
      case 'switch':
        return 'Switch Profile';
      case 'rule-list':
        return 'Rule List Profile';
      case 'pac':
        return 'PAC Profile';
      case 'auto-detect':
        return 'Auto Detect Profile';
      case 'virtual':
        return 'Virtual Profile';
    }
  }

  function profileDisplayColor(profile: UserProfile): string {
    if (profile.kind !== 'virtual') return profile.color ?? '#90a4ae';
    const route = profile.targetRoute;
    if (route.kind === 'profile') {
      return profiles.find((candidate) => candidate.id === route.profileId)?.color ?? '#90a4ae';
    }
    if (route.kind === 'direct') {
      return state?.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee';
    }
    return state?.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88';
  }

  function routeValue(route: ProfileRouteTarget | undefined): string {
    if (route === undefined) return '';
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  function parseRouteValue(value: string): ProfileRouteTarget | undefined {
    if (value === '') return undefined;
    if (value === 'direct' || value === 'system') return { kind: value };
    return value.startsWith('profile:')
      ? { kind: 'profile', profileId: value.slice('profile:'.length) }
      : undefined;
  }

  function routeLabel(spec: ProfileSpec, route: ProfileRouteTarget): string {
    if (route.kind === 'direct') return 'Direct';
    if (route.kind === 'system') return 'System Proxy';
    return (
      spec.profiles.find((profile) => profile.id === route.profileId)?.name ?? 'Missing profile'
    );
  }

  function checkedFrom(event: Event): boolean {
    return (event.currentTarget as HTMLInputElement).checked;
  }

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
      .value;
  }

  function messageFrom(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  function acceptResponse(response: ProfileWorkflowCommandResponse): boolean {
    if (response.ok) {
      state = response.state;
      view = response.view;
      if (response.appliedSnapshotId !== undefined) {
        lastAppliedSnapshotId = response.appliedSnapshotId;
      }
      errorMessage = '';
      return true;
    }
    errorMessage = response.message;
    if (response.state) state = response.state;
    if (response.view) view = response.view;
    return false;
  }

  async function loadWorkflow(): Promise<void> {
    loading = true;
    try {
      acceptResponse(await sendProfileWorkflowCommand({ action: 'get' }));
    } catch (error) {
      errorMessage = messageFrom(error);
    } finally {
      loading = false;
    }
  }

  async function runCommand(
    command: Parameters<typeof sendProfileWorkflowCommand>[0],
  ): Promise<boolean> {
    if (saving) return false;
    saving = true;
    try {
      return acceptResponse(await sendProfileWorkflowCommand(command));
    } catch (error) {
      errorMessage = messageFrom(error);
      return false;
    } finally {
      saving = false;
    }
  }

  async function selectProfile(profileId: string): Promise<void> {
    navigate('profile', profileId);
    if (!state || state.selectedProfileId === profileId) return;
    await runCommand({
      action: 'select-profile',
      expectedGeneration: state.generation,
      profileId,
    });
  }

  async function replaceDraft(draft: ProfileSpec): Promise<boolean> {
    if (!state) return false;
    return runCommand({
      action: 'replace-draft',
      expectedGeneration: state.generation,
      draft,
    });
  }

  async function acceptImportedDraft(
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    return runCommand({
      action: 'accept-import',
      expectedGeneration,
      candidate,
      secretMaterials,
    });
  }

  async function replaceDraftWithSecrets(
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    if (!state) return false;
    return acceptImportedDraft(state.generation, candidate, secretMaterials);
  }

  async function readSecret(secretRef: string): Promise<string> {
    if (!state || saving) return '';
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'read-secret',
        expectedGeneration: state.generation,
        secretRef,
      });
      if (!acceptResponse(response) || !response.ok) return '';
      return response.secretValue ?? '';
    } catch (error) {
      errorMessage = messageFrom(error);
      return '';
    } finally {
      saving = false;
    }
  }

  async function acceptImportedAndApply(
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    if (!(await acceptImportedDraft(expectedGeneration, candidate, secretMaterials)) || !state) {
      return false;
    }
    return runCommand({
      action: 'apply',
      expectedGeneration: state.generation,
    });
  }

  async function rollbackSnapshot(
    expectedGeneration: number,
    snapshotId: string,
  ): Promise<boolean> {
    return runCommand({
      action: 'rollback-snapshot',
      expectedGeneration,
      snapshotId,
    });
  }

  async function replaceDraftAndSelect(mutation: ProfileWorkflowProfileMutation): Promise<void> {
    if (!(await replaceDraft(mutation.draft))) return;
    if (state?.draft.profiles.some((profile) => profile.id === mutation.profileId)) {
      await selectProfile(mutation.profileId);
    }
  }

  async function mutateDraft(update: (draft: ProfileSpec) => void): Promise<void> {
    if (!state) return;
    const draft = cloneProfileSpecDraft(state.draft);
    update(draft);
    await replaceDraft(draft);
  }

  async function createNamedProfile(kind: NewProfileKind, name: string): Promise<void> {
    if (!state) return;
    try {
      const mutation =
        kind === 'fixed'
          ? createFixedProfileDraft(state.draft, createWorkflowId, name)
          : kind === 'switch'
            ? createSwitchProfileDraft(state.draft, createWorkflowId, name)
            : kind === 'pac'
              ? createPacProfileDraft(state.draft, createWorkflowId, name)
              : createVirtualProfileDraft(state.draft, createWorkflowId, name);
      await replaceDraftAndSelect(mutation);
      navigate('profile', mutation.profileId);
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  function cancelNewProfile(): void {
    if (selectedProfile) navigate('profile', selectedProfile.id);
    else navigate('about');
  }

  async function duplicateSelectedProfile(): Promise<void> {
    if (!state || !selectedProfile) return;
    try {
      await replaceDraftAndSelect(
        duplicateProfileDraft(state.draft, selectedProfile.id, createWorkflowId),
      );
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function deleteSelectedProfile(): Promise<void> {
    if (!state || !selectedProfile) return;
    const shouldConfirm = state.draft.settings.interface.confirmDeletion;
    if (
      shouldConfirm &&
      !globalThis.confirm(`Delete profile “${selectedProfile.name}”? This changes only the Draft.`)
    ) {
      return;
    }
    try {
      await replaceDraft(deleteProfileDraft(state.draft, selectedProfile.id));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function updateProfileName(name: string): Promise<void> {
    if (!selectedProfile) return;
    const profileId = selectedProfile.id;
    await mutateDraft((draft) => {
      const profile = draft.profiles.find((candidate) => candidate.id === profileId);
      if (profile) profile.name = name.trim();
    });
  }

  async function updateProfileColor(color: string): Promise<void> {
    if (!selectedProfile) return;
    const profileId = selectedProfile.id;
    await mutateDraft((draft) => {
      const profile = draft.profiles.find((candidate) => candidate.id === profileId);
      if (profile) profile.color = color;
    });
  }

  async function updateStartupRoute(value: string): Promise<void> {
    const route = parseRouteValue(value);
    await mutateDraft((draft) => {
      if (route === undefined) delete draft.settings.startup.route;
      else draft.settings.startup.route = route;
    });
  }

  async function updateStartupRevert(revertProxyChanges: boolean): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.startup.revertProxyChanges = revertProxyChanges;
    });
  }

  async function updateQuickSwitchFlag(
    field: 'enabled' | 'refreshOnChange',
    value: boolean,
  ): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.quickSwitch[field] = value;
    });
  }

  async function addQuickSwitchRoute(value: string, event: Event): Promise<void> {
    const route = parseRouteValue(value);
    (event.currentTarget as HTMLSelectElement).value = '';
    if (!route) return;
    await mutateDraft((draft) => {
      if (
        !draft.settings.quickSwitch.routes.some(
          (candidate) => routeValue(candidate) === routeValue(route),
        )
      ) {
        draft.settings.quickSwitch.routes.push(route);
      }
    });
  }

  async function removeQuickSwitchRoute(index: number): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.quickSwitch.routes.splice(index, 1);
    });
  }

  async function moveQuickSwitchRoute(index: number, offset: -1 | 1): Promise<void> {
    await mutateDraft((draft) => {
      const routes = draft.settings.quickSwitch.routes;
      const target = index + offset;
      if (target < 0 || target >= routes.length) return;
      const [route] = routes.splice(index, 1);
      if (route) routes.splice(target, 0, route);
    });
  }

  async function updateInterfaceFlag(field: InterfaceFlag, value: boolean): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.interface[field] = value;
    });
  }

  async function updateBuiltInColor(kind: 'direct' | 'system', color: string): Promise<void> {
    await mutateDraft((draft) => {
      const appearance = draft.settings.interface.builtInProfiles ?? {};
      appearance[kind] = { color };
      draft.settings.interface.builtInProfiles = appearance;
    });
  }

  function pageHash(section: OptionsSection, profileId: string | undefined = undefined): string {
    return section === 'profile' && profileId
      ? `#/profile/${encodeURIComponent(profileId)}`
      : `#/${section}`;
  }

  function navigate(section: OptionsSection, profileId: string | undefined = undefined): void {
    activeSection = section;
    if (typeof window === 'undefined') return;
    const hash = pageHash(section, profileId);
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  }

  function syncNavigationFromLocation(): void {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#\//u, '');
    if (!hash) {
      activeSection = 'profile';
      return;
    }
    if (hash.startsWith('profile/')) {
      activeSection = 'profile';
      const profileId = decodeURIComponent(hash.slice('profile/'.length));
      if (state?.draft.profiles.some((profile) => profile.id === profileId)) {
        if (state.selectedProfileId !== profileId && !saving) {
          void runCommand({
            action: 'select-profile',
            expectedGeneration: state.generation,
            profileId,
          });
        }
      }
      return;
    }
    const section = hash as OptionsSection;
    if (
      [
        'interface',
        'general',
        'import',
        'theme',
        'history',
        'builtin',
        'new-profile',
        'about',
      ].includes(section)
    ) {
      activeSection = section;
    }
  }

  function updateThemeMode(mode: ThemeMode): void {
    themeMode = mode;
    storeThemeMode(mode);
  }

  async function revertDraft(): Promise<void> {
    if (!state) return;
    await runCommand({
      action: 'revert',
      expectedGeneration: state.generation,
    });
  }

  async function applyDraft(): Promise<void> {
    if (!state || !view?.dirty) return;
    await runCommand({
      action: 'apply',
      expectedGeneration: state.generation,
    });
  }

  function applyStatus(): string {
    const record = state?.lastApply;
    if (!record) return 'No Apply attempt recorded.';
    if (record.status === 'succeeded') {
      return `Active snapshot ${record.snapshotId} from revision ${record.revisionId}.`;
    }
    return `Failed at ${record.stage}: ${record.message}`;
  }

  onMount(() => {
    themeMode = readThemeMode();
    applyThemeMode(themeMode);
    const handleNavigation = () => syncNavigationFromLocation();
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    void loadWorkflow().then(syncNavigationFromLocation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  });
</script>

<svelte:head>
  <title>ZeroOmega Nex Options</title>
</svelte:head>

<div class="app-shell">
  <aside class="sidebar">
    <header class="side-brand">
      <button type="button" on:click={() => navigate('about')}>
        <span class="brand-mark" aria-hidden="true">Ω</span>
        <span>Zero Omega</span>
      </button>
    </header>

    <nav class="side-navigation" aria-label="ZeroOmega options">
      <section class="nav-group">
        <h2>Settings</h2>
        <button
          class:active={activeSection === 'interface'}
          type="button"
          on:click={() => navigate('interface')}
        >
          <span aria-hidden="true">⌘</span><span>Interface</span>
        </button>
        <button
          class:active={activeSection === 'general'}
          type="button"
          on:click={() => navigate('general')}
        >
          <span aria-hidden="true">⚙</span><span>General</span>
        </button>
        <button
          class:active={activeSection === 'import'}
          type="button"
          disabled={!state || saving || view?.busy}
          on:click={() => navigate('import')}
        >
          <span aria-hidden="true">⇅</span><span>Import / Export</span>
        </button>
        <button
          class:active={activeSection === 'theme'}
          type="button"
          on:click={() => navigate('theme')}
        >
          <span aria-hidden="true">◐</span><span>Theme</span>
        </button>
        <button
          class:active={activeSection === 'history'}
          type="button"
          disabled={!state || saving || view?.busy}
          on:click={() => navigate('history')}
        >
          <span aria-hidden="true">↶</span><span>Snapshot History</span>
        </button>
      </section>

      <section class="nav-group profiles-nav">
        <h2>Profiles</h2>
        <button
          class:active={activeSection === 'builtin'}
          type="button"
          on:click={() => navigate('builtin')}
        >
          <span class="builtin-marker" aria-hidden="true">◎</span><span>Built-in Profiles</span>
        </button>
        {#each profiles as profile (profile.id)}
          <button
            class="nav-profile"
            class:active={activeSection === 'profile' && profile.id === state?.selectedProfileId}
            type="button"
            disabled={saving}
            on:click={() => selectProfile(profile.id)}
          >
            <ProfileIcon kind={profile.kind} color={profile.color ?? '#90a4ae'} size={22} />
            <span>{profile.name}</span>
          </button>
        {/each}
        <button
          class:active={activeSection === 'new-profile'}
          type="button"
          disabled={!state || view?.busy || saving}
          on:click={() => navigate('new-profile')}
        >
          <span aria-hidden="true">＋</span><span>New profile…</span>
        </button>
      </section>

      <section class="nav-group actions">
        <h2>Actions</h2>
        <button
          type="button"
          class="primary"
          disabled={!view?.dirty || view.busy || saving}
          on:click={applyDraft}
        >
          <span aria-hidden="true">✓</span><span>{saving ? 'Working…' : 'Apply changes'}</span>
        </button>
        <button
          type="button"
          class="discard"
          disabled={!view?.dirty || view.busy || saving}
          on:click={revertDraft}
        >
          <span aria-hidden="true">×</span><span>Discard changes</span>
        </button>
        <p class="draft-status" role="status">
          {view?.busy
            ? `Apply is in progress: ${state?.pendingApply?.phase ?? 'preparing'}.`
            : view?.dirty
              ? 'Draft contains unapplied changes.'
              : 'Draft matches the currently applied revision.'}
        </p>
      </section>
    </nav>
  </aside>

  <main class="editor">
    {#if errorMessage}
      <section class="settings-section global-error" aria-live="assertive">
        <h2>Operation failed</h2>
        <p role="alert">{errorMessage}</p>
      </section>
    {/if}

    {#if loading}
      <section class="settings-section shell-status">
        <h1>Loading profiles</h1>
        <p>Reading the saved ZeroOmega configuration.</p>
      </section>
    {:else if activeSection === 'general' && state}
      <header class="editor-heading">
        <div>
          <h1>General</h1>
          <p>Startup and quick-switch behavior.</p>
        </div>
      </header>
      <section class="settings-section">
        <h2>Startup profile</h2>
        <label>
          Profile used when the extension starts
          <select
            aria-label="Startup route"
            value={routeValue(state.draft.settings.startup.route)}
            disabled={saving || view?.busy}
            on:change={(event) => updateStartupRoute(valueFrom(event))}
          >
            <option value="">Keep current browser setting</option>
            <option value="direct">Direct</option>
            <option value="system">System Proxy</option>
            {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}
                >{profile.name}</option
              >{/each}
          </select>
        </label>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.startup.revertProxyChanges}
            disabled={saving || view?.busy}
            on:change={(event) => updateStartupRevert(checkedFrom(event))}
          />
          Revert proxy changes when ZeroOmega releases control
        </label>
      </section>
      <section class="settings-section">
        <h2>Quick Switch</h2>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.enabled}
            disabled={saving || view?.busy}
            on:change={(event) => updateQuickSwitchFlag('enabled', checkedFrom(event))}
          />
          Enable quick switching in the popup
        </label>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.refreshOnChange}
            disabled={saving || view?.busy}
            on:change={(event) => updateQuickSwitchFlag('refreshOnChange', checkedFrom(event))}
          />
          Refresh active tabs after switching
        </label>
        <ol class="route-order" aria-label="Quick-switch route order">
          {#each state.draft.settings.quickSwitch.routes as route, index (`${routeValue(route)}:${index}`)}
            <li>
              <span>{routeLabel(state.draft, route)}</span>
              <span class="row-actions">
                <button
                  type="button"
                  disabled={saving || view?.busy || index === 0}
                  on:click={() => moveQuickSwitchRoute(index, -1)}>Up</button
                >
                <button
                  type="button"
                  disabled={saving ||
                    view?.busy ||
                    index === state.draft.settings.quickSwitch.routes.length - 1}
                  on:click={() => moveQuickSwitchRoute(index, 1)}>Down</button
                >
                <button
                  type="button"
                  disabled={saving ||
                    view?.busy ||
                    route.kind === 'direct' ||
                    route.kind === 'system'}
                  on:click={() => removeQuickSwitchRoute(index)}>Remove</button
                >
              </span>
            </li>
          {/each}
        </ol>
        <select
          aria-label="Add quick-switch route"
          disabled={saving || view?.busy}
          on:change={(event) => addQuickSwitchRoute(valueFrom(event), event)}
        >
          <option value="">Add profile…</option>
          <option value="direct">Direct</option>
          <option value="system">System Proxy</option>
          {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}
              >{profile.name}</option
            >{/each}
        </select>
      </section>
    {:else if activeSection === 'interface' && state}
      <header class="editor-heading">
        <div>
          <h1>Interface</h1>
          <p>Behavior matching the original ZeroOmega options page.</p>
        </div>
      </header>
      <section class="settings-section option-list">
        <h2>Confirmation and editing</h2>
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.confirmDeletion}
            disabled={saving || view?.busy}
            on:change={(event) => updateInterfaceFlag('confirmDeletion', checkedFrom(event))}
          />Confirm before deleting a profile</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.addConditionsToBottom}
            disabled={saving || view?.busy}
            on:change={(event) => updateInterfaceFlag('addConditionsToBottom', checkedFrom(event))}
          />Add new switching conditions to the bottom</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showAdvancedConditions}
            disabled={saving || view?.busy}
            on:change={(event) => updateInterfaceFlag('showAdvancedConditions', checkedFrom(event))}
          />Show advanced condition types</label
        >
      </section>
      <section class="settings-section option-list">
        <h2>Menus and status</h2>
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showInspectMenu}
            disabled={saving || view?.busy}
            on:change={(event) => updateInterfaceFlag('showInspectMenu', checkedFrom(event))}
          />Show inspect menu</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showResultProfileOnActionBadgeText}
            disabled={saving || view?.busy}
            on:change={(event) =>
              updateInterfaceFlag('showResultProfileOnActionBadgeText', checkedFrom(event))}
          />Show result profile on the toolbar badge</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showExternalProfile}
            disabled={saving || view?.busy}
            on:change={(event) => updateInterfaceFlag('showExternalProfile', checkedFrom(event))}
          />Show profiles controlled by other extensions</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.exportLegacyRuleList}
            disabled={saving || view?.busy}
            on:change={(event) => updateInterfaceFlag('exportLegacyRuleList', checkedFrom(event))}
          />Export legacy rule-list format when requested</label
        >
      </section>
    {:else if activeSection === 'theme'}
      <header class="editor-heading">
        <div>
          <h1>Theme</h1>
          <p>Default: follow the operating-system appearance.</p>
        </div>
      </header>
      <ThemePanel mode={themeMode} onChange={updateThemeMode} />
    {:else if activeSection === 'import' && state}
      <header class="editor-heading">
        <div>
          <h1>Import / Export</h1>
          <p>Move from original ZeroOmega or SwitchyOmega without rebuilding profiles.</p>
        </div>
      </header>
      <LegacyImportPanel
        disabled={saving || view?.busy === true}
        generation={state.generation}
        deviceId={state.applied.revision.deviceId ?? 'zeroomega-nex-extension'}
        onAcceptImport={acceptImportedDraft}
        onImportAndApply={acceptImportedAndApply}
      />
    {:else if activeSection === 'history' && state}
      <header class="editor-heading">
        <div>
          <h1>Configuration History</h1>
          <p>Inspect or restore a previously verified configuration.</p>
        </div>
      </header>
      <SnapshotHistoryPanel
        disabled={saving || view?.busy === true}
        dirty={view?.dirty === true}
        generation={state.generation}
        onRollbackSnapshot={rollbackSnapshot}
      />
    {:else if activeSection === 'builtin' && state}
      <header class="editor-heading">
        <div>
          <h1>Built-in Profiles</h1>
          <p>Direct and System Proxy are always available.</p>
        </div>
      </header>
      <section class="settings-section builtin-grid">
        <label class="builtin-card"
          ><ProfileIcon
            kind="direct"
            color={state.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee'}
            size={28}
          /><strong>Direct</strong><span>Connect without a proxy.</span><input
            aria-label="Direct profile color"
            type="color"
            value={state.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee'}
            disabled={saving || view?.busy}
            on:change={(event) => updateBuiltInColor('direct', valueFrom(event))}
          /></label
        >
        <label class="builtin-card"
          ><ProfileIcon
            kind="system"
            color={state.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88'}
            size={28}
          /><strong>System Proxy</strong><span>Use the browser or operating-system proxy.</span
          ><input
            aria-label="System profile color"
            type="color"
            value={state.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88'}
            disabled={saving || view?.busy}
            on:change={(event) => updateBuiltInColor('system', valueFrom(event))}
          /></label
        >
      </section>
    {:else if activeSection === 'new-profile'}
      <section class="settings-section shell-status" aria-hidden="true">
        <h1>Profiles</h1>
        <p>Create a profile using the original ZeroOmega workflow.</p>
      </section>
      {#if state}
        <NewProfileDialog
          existingNames={profiles.map((profile) => profile.name)}
          disabled={saving || view?.busy === true}
          onCancel={cancelNewProfile}
          onCreate={createNamedProfile}
        />
      {/if}
    {:else if activeSection === 'about'}
      <header class="editor-heading">
        <div>
          <h1>ZeroOmega Nex</h1>
          <p>{productIdentity.milestone}</p>
        </div>
      </header>
      <section class="settings-section">
        <h2>Compatibility-first continuation</h2>
        <p>
          This build preserves the original ZeroOmega navigation and migration workflow while
          replacing the proxy control plane with a verified cross-browser implementation.
        </p>
      </section>
    {:else if selectedProfile && state}
      <header class="editor-heading">
        <div class="profile-title">
          <ProfileIcon
            kind={selectedProfile.kind}
            color={profileDisplayColor(selectedProfile)}
            size={30}
          />
          <div>
            <h1>{selectedProfile.name}</h1>
            <p>{profileType(selectedProfile)}</p>
          </div>
        </div>
        <div class="profile-actions">
          <button type="button" disabled={view?.busy || saving} on:click={duplicateSelectedProfile}
            >Duplicate</button
          ><button
            type="button"
            class="danger"
            disabled={view?.busy || saving}
            on:click={deleteSelectedProfile}>Delete</button
          >
        </div>
      </header>
      <section class="settings-section profile-identity-editor">
        <label>
          <span>Profile name</span>
          <input
            aria-label="Profile name"
            value={selectedProfile.name}
            disabled={saving || view?.busy}
            on:change={(event) => updateProfileName(valueFrom(event))}
          />
        </label>
        <label class="profile-color-field">
          <span>Profile color</span>
          <input
            aria-label="Profile color"
            type="color"
            value={profileDisplayColor(selectedProfile)}
            disabled={saving || view?.busy || selectedProfile.kind === 'virtual'}
            on:change={(event) => updateProfileColor(valueFrom(event))}
          />
        </label>
      </section>
      {#if fixedProfile}
        <FixedProfileEditor
          spec={state.draft}
          profileId={fixedProfile.id}
          generation={state.generation}
          disabled={saving || view?.busy === true}
          idFactory={createWorkflowId}
          onReplaceDraft={replaceDraft}
          onReplaceDraftWithSecrets={replaceDraftWithSecrets}
          onReadSecret={readSecret}
        />
      {:else if switchProfile}
        <SwitchProfileEditor
          spec={state.draft}
          profileId={switchProfile.id}
          disabled={saving || view?.busy === true}
          idFactory={createWorkflowId}
          onReplaceDraft={replaceDraft}
        />
      {:else if virtualProfile}
        <VirtualProfileEditor
          spec={state.draft}
          profileId={virtualProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
      {:else if selectedProfile.kind === 'rule-list' || selectedProfile.kind === 'pac' || selectedProfile.kind === 'auto-detect'}
        <AdvancedProfileEditor
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
      {/if}
    {:else}
      <section class="settings-section shell-status">
        <h1>No user profiles</h1>
        <p>
          Create a new profile from the left navigation or restore an original ZeroOmega backup.
        </p>
      </section>
    {/if}
  </main>
</div>
