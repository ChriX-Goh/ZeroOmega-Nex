<script lang="ts">
  import { productIdentity } from '@zeroomega-nex/core-contracts';
  import { cloneProfileSpec } from '@zeroomega-nex/profile-spec';
  import type {
    FixedProfile,
    ProfileRouteTarget,
    ProfileSpec,
    ProxyEndpoint,
    SwitchProfile,
    UserProfile,
  } from '@zeroomega-nex/profile-spec';
  import {
    createAutoDetectProfileDraft,
    createFixedProfileDraft,
    createPacProfileDraft,
    createRuleListProfileDraft,
    createSwitchProfileDraft,
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

  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
  import AdvancedProfileEditor from './AdvancedProfileEditor.svelte';
  import LegacyImportPanel from './LegacyImportPanel.svelte';
  import SnapshotHistoryPanel from './SnapshotHistoryPanel.svelte';
  import SwitchProfileEditor from './SwitchProfileEditor.svelte';

  type OptionsSection = 'profiles' | 'import' | 'history';

  let activeSection: OptionsSection = 'profiles';
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
  let endpoint: ProxyEndpoint | undefined;
  let bypassText = '';

  $: profiles = state?.draft.profiles ?? [];
  $: selectedProfile = profiles.find((profile) => profile.id === state?.selectedProfileId);
  $: fixedProfile = selectedProfile?.kind === 'fixed' ? selectedProfile : undefined;
  $: switchProfile = selectedProfile?.kind === 'switch' ? selectedProfile : undefined;
  $: endpoint = fixedProfile && state ? findEndpoint(state.draft, fixedProfile) : undefined;
  $: bypassText = fixedProfile?.bypass.map((entry) => entry.pattern).join('\n') ?? '';

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
    }
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

  function endpointId(profile: FixedProfile): string | undefined {
    return (
      profile.proxyByScheme.fallback ??
      profile.proxyByScheme.http ??
      profile.proxyByScheme.https ??
      profile.proxyByScheme.ftp
    );
  }

  function findEndpoint(spec: ProfileSpec, profile: FixedProfile): ProxyEndpoint | undefined {
    const id = endpointId(profile);
    return id === undefined
      ? undefined
      : spec.proxyEndpoints.find((candidate) => candidate.id === id);
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
    activeSection = 'profiles';
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
    const draft = cloneProfileSpec(state.draft);
    update(draft);
    await replaceDraft(draft);
  }

  async function createFixedProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createFixedProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function createSwitchProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createSwitchProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function createRuleListProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createRuleListProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function createPacProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createPacProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function createAutoDetectProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createAutoDetectProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
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

  async function updateEndpoint(
    field: 'protocol' | 'host' | 'port',
    rawValue: string,
  ): Promise<void> {
    if (!fixedProfile || !endpoint) return;
    const endpointReference = endpoint.id;
    if (field === 'port') {
      const port = Number(rawValue);
      if (!Number.isInteger(port) || port < 1 || port > 65_535) {
        errorMessage = 'Port must be an integer from 1 to 65535.';
        return;
      }
      await mutateDraft((draft) => {
        const target = draft.proxyEndpoints.find((candidate) => candidate.id === endpointReference);
        if (target) target.port = port;
      });
      return;
    }
    if (field === 'protocol') {
      if (!['http', 'https', 'socks4', 'socks5'].includes(rawValue)) return;
      await mutateDraft((draft) => {
        const target = draft.proxyEndpoints.find((candidate) => candidate.id === endpointReference);
        if (target) target.protocol = rawValue as ProxyEndpoint['protocol'];
      });
      return;
    }
    await mutateDraft((draft) => {
      const target = draft.proxyEndpoints.find((candidate) => candidate.id === endpointReference);
      if (target) target.host = rawValue.trim();
    });
  }

  async function updateBypassList(value: string): Promise<void> {
    if (!fixedProfile) return;
    const profileId = fixedProfile.id;
    const patterns = value
      .split(/\r?\n/u)
      .map((pattern) => pattern.trim())
      .filter(Boolean);
    await mutateDraft((draft) => {
      const profile = draft.profiles.find(
        (candidate): candidate is FixedProfile =>
          candidate.id === profileId && candidate.kind === 'fixed',
      );
      if (!profile) return;
      profile.bypass = patterns.map((pattern, index) => ({
        id: profile.bypass[index]?.id ?? `bypass-${crypto.randomUUID()}`,
        pattern,
      }));
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
    void loadWorkflow();
  });
</script>

<div class="app-shell">
  <header class="topbar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">Ω</span>
      <div>
        <strong>{productIdentity.name}</strong>
        <span>{productIdentity.milestone}</span>
      </div>
    </div>
    <div class="actions">
      <button type="button" disabled={!view?.dirty || view.busy || saving} on:click={revertDraft}
        >Revert</button
      >
      <button
        type="button"
        class="primary"
        disabled={!view?.dirty || view.busy || saving}
        on:click={applyDraft}>{saving ? 'Working…' : 'Apply changes'}</button
      >
    </div>
  </header>

  <aside class="sidebar">
    <div class="sidebar-title">Profiles</div>
    <nav aria-label="Profiles">
      {#each profiles as profile (profile.id)}
        <button
          class:active={profile.id === state?.selectedProfileId}
          type="button"
          disabled={saving}
          on:click={() => selectProfile(profile.id)}
        >
          <span class="profile-marker" style={`--profile-color: ${profile.color ?? '#90a4ae'}`}
          ></span>
          <span class="profile-copy">
            <strong>{profile.name}</strong>
            <small>{profileType(profile)}</small>
          </span>
        </button>
      {/each}
    </nav>

    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createFixedProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New fixed profile</span>
    </button>
    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createSwitchProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New switch profile</span>
    </button>
    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createRuleListProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New rule list</span>
    </button>
    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createPacProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New PAC profile</span>
    </button>
    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createAutoDetectProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New auto-detect profile</span>
    </button>

    <div class="settings-links" aria-label="Settings sections">
      <button type="button" disabled>General</button>
      <button
        type="button"
        class:active={activeSection === 'import'}
        disabled={!state || saving || view?.busy}
        on:click={() => (activeSection = 'import')}>Import / Export</button
      >
      <button
        type="button"
        class:active={activeSection === 'history'}
        disabled={!state || saving || view?.busy}
        on:click={() => (activeSection = 'history')}>Snapshot History</button
      >
      <button type="button" disabled>Interface</button>
      <button type="button" disabled>About</button>
    </div>
  </aside>

  <main class="editor">
    {#if loading}
      <section class="settings-section shell-status">
        <h2>Loading profiles</h2>
        <p>Reading the persisted ProfileSpec working copy from the extension background.</p>
      </section>
    {:else if activeSection === 'history' && state}
      <header class="editor-heading">
        <div class="profile-title">
          <div>
            <h1>Configuration History</h1>
            <p>
              Inspect revisions and verified PAC snapshots, or restore a previous verified state.
            </p>
          </div>
        </div>
      </header>
      <SnapshotHistoryPanel
        disabled={saving || view?.busy === true}
        dirty={view?.dirty === true}
        generation={state.generation}
        onRollbackSnapshot={rollbackSnapshot}
      />
    {:else if activeSection === 'import' && state}
      <header class="editor-heading">
        <div class="profile-title">
          <div>
            <h1>Import / Export</h1>
            <p>Review legacy backups before they enter the Draft working copy.</p>
          </div>
        </div>
      </header>
      <LegacyImportPanel
        disabled={saving || view?.busy === true}
        generation={state.generation}
        deviceId={state.applied.revision.deviceId ?? 'zeroomega-nex-extension'}
        onAcceptImport={acceptImportedDraft}
      />
    {:else if selectedProfile && state}
      <header class="editor-heading">
        <div class="profile-title">
          <span
            class="large-profile-marker"
            style={`background: ${selectedProfile.color ?? '#90a4ae'}`}
          ></span>
          <div>
            <h1>{selectedProfile.name}</h1>
            <p>{profileType(selectedProfile)}</p>
          </div>
        </div>
        <div class="profile-actions">
          <button type="button" disabled={view?.busy || saving} on:click={duplicateSelectedProfile}
            >Duplicate</button
          >
          <button
            type="button"
            class="danger"
            disabled={view?.busy || saving}
            on:click={deleteSelectedProfile}>Delete</button
          >
        </div>
      </header>

      <section class="settings-section">
        <h2>Profile</h2>
        <p class="section-help">
          Changes are saved to the Draft working copy, not applied immediately.
        </p>
        <input
          aria-label="Profile name"
          value={selectedProfile.name}
          disabled={saving || view?.busy}
          on:change={(event) => updateProfileName(valueFrom(event))}
        />
      </section>

      {#if fixedProfile && endpoint}
        <section class="settings-section">
          <h2>Proxy servers</h2>
          <p class="section-help">
            This editor currently exposes the fallback endpoint used by the Fixed Profile.
          </p>
          <div class="proxy-table" role="group" aria-label="Proxy server editor">
            <div class="proxy-row proxy-headings" aria-hidden="true">
              <span>Protocol</span>
              <span>Server</span>
              <span>Port</span>
            </div>
            <div class="proxy-row">
              <select
                aria-label="Protocol"
                value={endpoint.protocol}
                disabled={saving || view?.busy}
                on:change={(event) => updateEndpoint('protocol', valueFrom(event))}
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5">SOCKS5</option>
              </select>
              <input
                aria-label="Server"
                value={endpoint.host}
                disabled={saving || view?.busy}
                on:change={(event) => updateEndpoint('host', valueFrom(event))}
              />
              <input
                aria-label="Port"
                inputmode="numeric"
                value={endpoint.port}
                disabled={saving || view?.busy}
                on:change={(event) => updateEndpoint('port', valueFrom(event))}
              />
            </div>
          </div>
        </section>

        <section class="settings-section">
          <h2>Bypass list</h2>
          <p class="section-help">
            Hosts listed here connect directly instead of using this profile. One pattern per line.
          </p>
          <textarea
            aria-label="Bypass list"
            rows="7"
            value={bypassText}
            disabled={saving || view?.busy}
            on:change={(event) => updateBypassList(valueFrom(event))}></textarea>
        </section>
      {:else if switchProfile}
        <SwitchProfileEditor
          spec={state.draft}
          profileId={switchProfile.id}
          disabled={saving || view?.busy === true}
          idFactory={createWorkflowId}
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

      <section class="settings-section">
        <h2>Startup</h2>
        <p class="section-help">
          Choose the route restored when the extension starts. This changes only after Apply.
        </p>
        <label>
          Startup route
          <select
            aria-label="Startup route"
            value={routeValue(state.draft.settings.startup.route)}
            disabled={saving || view?.busy}
            on:change={(event) => updateStartupRoute(valueFrom(event))}
          >
            <option value="">Keep the current browser setting</option>
            <option value="direct">Direct</option>
            <option value="system">System Proxy</option>
            {#each profiles as profile (profile.id)}
              <option value={`profile:${profile.id}`}>{profile.name}</option>
            {/each}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.draft.settings.startup.revertProxyChanges}
            disabled={saving || view?.busy}
            on:change={(event) => updateStartupRevert(checkedFrom(event))}
          />
          Restore the previous browser proxy state when the extension releases control
        </label>
      </section>

      <section class="settings-section">
        <h2>Quick switch</h2>
        <p class="section-help">
          The popup uses this ordered list from the Applied revision, never unsaved Draft data.
        </p>
        <label>
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.enabled}
            disabled={saving || view?.busy}
            on:change={(event) => updateQuickSwitchFlag('enabled', checkedFrom(event))}
          />
          Enable popup quick switching
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.refreshOnChange}
            disabled={saving || view?.busy}
            on:change={(event) => updateQuickSwitchFlag('refreshOnChange', checkedFrom(event))}
          />
          Refresh active tabs after a route change
        </label>
        <ol aria-label="Quick-switch route order">
          {#each state.draft.settings.quickSwitch.routes as route, index (`${routeValue(route)}:${index}`)}
            <li>
              <span>{routeLabel(state.draft, route)}</span>
              <button
                type="button"
                disabled={saving || view?.busy || index === 0}
                aria-label={`Move ${routeLabel(state.draft, route)} up`}
                on:click={() => moveQuickSwitchRoute(index, -1)}>Up</button
              >
              <button
                type="button"
                disabled={saving ||
                  view?.busy ||
                  index === state.draft.settings.quickSwitch.routes.length - 1}
                aria-label={`Move ${routeLabel(state.draft, route)} down`}
                on:click={() => moveQuickSwitchRoute(index, 1)}>Down</button
              >
              <button
                type="button"
                disabled={saving || view?.busy}
                aria-label={`Remove ${routeLabel(state.draft, route)}`}
                on:click={() => removeQuickSwitchRoute(index)}>Remove</button
              >
            </li>
          {/each}
        </ol>
        <select
          aria-label="Add quick-switch route"
          disabled={saving || view?.busy}
          on:change={(event) => addQuickSwitchRoute(valueFrom(event), event)}
        >
          <option value="">Add route…</option>
          <option value="direct">Direct</option>
          <option value="system">System Proxy</option>
          {#each profiles as profile (profile.id)}
            <option value={`profile:${profile.id}`}>{profile.name}</option>
          {/each}
        </select>
      </section>

      <section class="settings-section shell-status">
        <h2>Working copy</h2>
        {#if errorMessage}
          <p role="alert">{errorMessage}</p>
        {:else if view?.busy}
          <p>Apply is in progress: {state?.pendingApply?.phase ?? 'preparing'}.</p>
        {:else}
          <p>
            {view?.dirty
              ? 'Draft contains unapplied changes.'
              : 'Draft matches the currently applied revision.'}
          </p>
        {/if}
        <dl>
          <div>
            <dt>Applied revision</dt>
            <dd>{view?.appliedRevisionId ?? 'Unavailable'}</dd>
          </div>
          <div>
            <dt>Draft generation</dt>
            <dd>{state?.generation ?? 0}</dd>
          </div>
          <div>
            <dt>Last Apply</dt>
            <dd>{applyStatus()}</dd>
          </div>
          <div>
            <dt>Latest snapshot</dt>
            <dd>{lastAppliedSnapshotId || 'Unavailable'}</dd>
          </div>
          <div>
            <dt>Global request listener</dt>
            <dd>Absent</dd>
          </div>
        </dl>
      </section>
    {:else}
      <section class="settings-section shell-status">
        <h2>No user profiles</h2>
        <p>
          The Draft contains no editable user profile. Create a new Fixed Profile from the sidebar.
        </p>
      </section>
    {/if}
  </main>
</div>
