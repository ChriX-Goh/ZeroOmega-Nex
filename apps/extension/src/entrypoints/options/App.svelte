<script lang="ts">
  import { productIdentity } from '@zeroomega-nex/core-contracts';
  import { cloneProfileSpec } from '@zeroomega-nex/profile-spec';
  import type {
    FixedProfile,
    ProfileSpec,
    ProxyEndpoint,
    UserProfile,
  } from '@zeroomega-nex/profile-spec';
  import {
    createFixedProfileDraft,
    deleteProfileDraft,
    duplicateProfileDraft,
  } from '@zeroomega-nex/profile-workflow';
  import type {
    ProfileWorkflowCommandResponse,
    ProfileWorkflowIdFactory,
    ProfileWorkflowProfileMutation,
    ProfileWorkflowState,
    ProfileWorkflowView,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';

  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';

  let state: ProfileWorkflowState | undefined;
  let view: ProfileWorkflowView | undefined;
  let loading = true;
  let saving = false;
  let errorMessage = '';
  let lastAppliedSnapshotId = '';

  let profiles: readonly UserProfile[] = [];
  let selectedProfile: UserProfile | undefined;
  let fixedProfile: FixedProfile | undefined;
  let endpoint: ProxyEndpoint | undefined;
  let bypassText = '';

  $: profiles = state?.draft.profiles ?? [];
  $: selectedProfile = profiles.find((profile) => profile.id === state?.selectedProfileId);
  $: fixedProfile = selectedProfile?.kind === 'fixed' ? selectedProfile : undefined;
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

  async function createProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createFixedProfileDraft(state.draft, createWorkflowId));
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
      on:click={createProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New profile</span>
    </button>

    <div class="settings-links" aria-label="Settings sections">
      <button type="button" disabled>General</button>
      <button type="button" disabled>Import / Export</button>
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
    {:else if selectedProfile}
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
      {:else}
        <section class="settings-section">
          <h2>{profileType(selectedProfile)} editor</h2>
          <p class="section-help">
            This ProfileSpec is real and selectable. Its specialized editor follows after the Fixed
            Profile workflow is verified.
          </p>
        </section>
      {/if}

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
