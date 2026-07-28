<script lang="ts">
  import {
    cloneProfileSpecDraft,
    type PacProfile,
    type ProfileRouteTarget,
    type ProfileSpec,
    type RuleSourceHeader,
    type UserProfile,
  } from '@zeroomega-nex/profile-spec';
  import {
    attachedRuleListProfileIds,
    type ProfileWorkflowPacSourceUpdateView,
    type ProfileWorkflowSecretMaterial,
  } from '@zeroomega-nex/profile-workflow';

  export let spec: ProfileSpec;
  export let profileId: string;
  export let disabled = false;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onReplaceDraftWithSecrets: (
    draft: ProfileSpec,
    materials: readonly ProfileWorkflowSecretMaterial[],
  ) => Promise<boolean> = async (draft) => onReplaceDraft(draft);
  export let onReadSecret: (secretRef: string) => Promise<string> = async () => '';
  export let onRequestAuthenticationPermission: () => Promise<boolean> = async () => false;
  export let onGetPacSourceUpdateStatus: (
    profileId: string,
  ) => Promise<ProfileWorkflowPacSourceUpdateView | undefined> = async () => undefined;
  export let onUpdatePacSource: (
    profileId: string,
    url: string,
  ) => Promise<ProfileWorkflowPacSourceUpdateView | undefined> = async () => undefined;

  let profile: PacProfile | undefined;
  let routeProfiles: readonly UserProfile[] = [];
  let referenced = false;
  let updateView: ProfileWorkflowPacSourceUpdateView | undefined;
  let updateLoading = false;
  let loadedUpdateKey = '';
  let authOpen = false;
  let authUsername = '';
  let authPassword = '';
  let authOriginalPassword = '';
  let authSecretRef = '';
  let authLoading = false;
  let authSaving = false;
  let authError = '';
  let showAuthPassword = false;

  $: profile = spec.profiles.find(
    (candidate): candidate is PacProfile => candidate.id === profileId && candidate.kind === 'pac',
  );
  $: {
    const hidden = attachedRuleListProfileIds(spec);
    routeProfiles = spec.profiles.filter(
      (candidate) => candidate.id !== profileId && !hidden.has(candidate.id),
    );
    referenced = spec.profiles.some(
      (candidate) => candidate.id !== profileId && profileReferences(candidate, profileId),
    );
  }
  $: {
    const key = profile?.source.kind === 'url' ? `${profile.id}:${profile.source.url}` : '';
    if (key !== loadedUpdateKey) {
      loadedUpdateKey = key;
      updateView = undefined;
      if (profile?.source.kind === 'url' && isRemoteUrl(profile.source.url)) {
        void loadUpdateStatus(profile.id);
      }
    }
  }

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
      .value;
  }

  function profileReferences(candidate: UserProfile, targetId: string): boolean {
    const references: ProfileRouteTarget[] =
      candidate.kind === 'switch'
        ? [candidate.defaultRoute, ...candidate.rules.map((rule) => rule.route)]
        : candidate.kind === 'rule-list'
          ? [candidate.matchRoute, candidate.defaultRoute]
          : candidate.kind === 'virtual'
            ? [candidate.targetRoute]
            : candidate.kind === 'pac' || candidate.kind === 'auto-detect'
              ? candidate.fallbackRoute
                ? [candidate.fallbackRoute]
                : []
              : [];
    return references.some((route) => route.kind === 'profile' && route.profileId === targetId);
  }

  function isFileUrl(url: string): boolean {
    return url.trim().toLowerCase().startsWith('file:');
  }

  function isRemoteUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async function mutateProfile(update: (target: PacProfile) => void): Promise<void> {
    const draft = cloneProfileSpecDraft(spec);
    const target = draft.profiles.find(
      (candidate): candidate is PacProfile =>
        candidate.id === profileId && candidate.kind === 'pac',
    );
    if (!target) return;
    update(target);
    await onReplaceDraft(draft);
  }

  async function updateUrl(value: string): Promise<void> {
    const url = value.trim();
    await mutateProfile((target) => {
      const script = target.source.script ?? '';
      target.source = url
        ? { kind: 'url', url, ...(script ? { script } : {}) }
        : { kind: 'inline', script };
    });
  }

  async function clearUrl(): Promise<void> {
    await updateUrl('');
  }

  async function updateScript(script: string): Promise<void> {
    await mutateProfile((target) => {
      if (target.source.kind !== 'inline') return;
      target.source.script = script;
    });
  }

  async function updateFallback(value: string): Promise<void> {
    const route: ProfileRouteTarget | undefined =
      value === ''
        ? undefined
        : value === 'direct' || value === 'system'
          ? { kind: value }
          : value.startsWith('profile:')
            ? { kind: 'profile' as const, profileId: value.slice('profile:'.length) }
            : undefined;
    await mutateProfile((target) => {
      if (route === undefined) delete target.fallbackRoute;
      else target.fallbackRoute = route;
    });
  }

  function routeValue(route: ProfileRouteTarget | undefined): string {
    if (!route) return '';
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  async function mutateHeaders(update: (headers: RuleSourceHeader[]) => void): Promise<void> {
    await mutateProfile((target) => {
      const headers = structuredClone(target.headers ?? []);
      update(headers);
      if (headers.length === 0) delete target.headers;
      else target.headers = headers;
    });
  }

  async function addHeader(): Promise<void> {
    await mutateHeaders((headers) => {
      headers.push({ name: '', value: { kind: 'literal', value: '' } });
    });
  }

  async function updateHeaderName(index: number, name: string): Promise<void> {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (header) header.name = name.trim();
    });
  }

  async function updateHeaderKind(index: number, kind: 'literal' | 'secret'): Promise<void> {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (!header) return;
      header.value =
        kind === 'literal'
          ? { kind: 'literal', value: '' }
          : { kind: 'secret', secretRef: `secret-header-${crypto.randomUUID()}` };
    });
  }

  async function updateHeaderValue(index: number, value: string): Promise<void> {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (!header) return;
      header.value =
        header.value.kind === 'literal'
          ? { kind: 'literal', value }
          : { kind: 'secret', secretRef: value.trim() };
    });
  }

  async function removeHeader(index: number): Promise<void> {
    await mutateHeaders((headers) => headers.splice(index, 1));
  }

  async function loadUpdateStatus(id: string): Promise<void> {
    updateView = await onGetPacSourceUpdateStatus(id);
  }

  async function downloadNow(): Promise<void> {
    if (
      !profile ||
      profile.source.kind !== 'url' ||
      !isRemoteUrl(profile.source.url) ||
      updateLoading
    )
      return;
    updateLoading = true;
    try {
      const updated = await onUpdatePacSource(profile.id, profile.source.url);
      if (updated) updateView = updated;
    } finally {
      updateLoading = false;
    }
  }

  async function openAuthentication(): Promise<void> {
    if (!profile || authSaving) return;
    authOpen = true;
    authUsername = profile.credential?.username ?? '';
    authPassword = '';
    authOriginalPassword = '';
    authSecretRef = profile.credential?.passwordSecretRef ?? '';
    authError = '';
    showAuthPassword = false;
    if (!authSecretRef) return;
    authLoading = true;
    try {
      authPassword = await onReadSecret(authSecretRef);
      authOriginalPassword = authPassword;
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
    } finally {
      authLoading = false;
    }
  }

  function closeAuthentication(): void {
    if (authSaving) return;
    authOpen = false;
    authPassword = '';
    authOriginalPassword = '';
    authError = '';
  }

  async function saveAuthentication(): Promise<void> {
    if (!profile || authSaving) return;
    authSaving = true;
    authError = '';
    let granted = false;
    try {
      granted = await onRequestAuthenticationPermission();
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
      authSaving = false;
      return;
    }
    if (!granted) {
      authError = 'Proxy authentication permission was not granted.';
      authSaving = false;
      return;
    }
    const draft = cloneProfileSpecDraft(spec);
    const target = draft.profiles.find(
      (candidate): candidate is PacProfile =>
        candidate.id === profileId && candidate.kind === 'pac',
    );
    if (!target) {
      authError = 'PAC Profile no longer exists.';
      return;
    }
    const previousRef = target.credential?.passwordSecretRef;
    const secretRef = previousRef ?? `secret-pac-${crypto.randomUUID()}`;
    const username = authUsername.trim();
    target.credential = {
      ...(username ? { username } : {}),
      passwordSecretRef: secretRef,
    };
    const materials: ProfileWorkflowSecretMaterial[] =
      previousRef === undefined || authPassword !== authOriginalPassword
        ? [{ ref: secretRef, value: authPassword }]
        : [];
    try {
      if (!(await onReplaceDraftWithSecrets(draft, materials))) return;
      authOpen = false;
      authPassword = '';
      authOriginalPassword = '';
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
    } finally {
      authSaving = false;
    }
  }

  async function removeAuthentication(): Promise<void> {
    if (!profile || authSaving) return;
    const draft = cloneProfileSpecDraft(spec);
    const target = draft.profiles.find(
      (candidate): candidate is PacProfile =>
        candidate.id === profileId && candidate.kind === 'pac',
    );
    if (!target) return;
    delete target.credential;
    authSaving = true;
    authError = '';
    try {
      if (!(await onReplaceDraft(draft))) return;
      authOpen = false;
      authPassword = '';
      authOriginalPassword = '';
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
    } finally {
      authSaving = false;
    }
  }

  function formatTimestamp(value: string | undefined): string {
    if (!value) return 'never';
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString();
  }

  function updateSummary(view: ProfileWorkflowPacSourceUpdateView | undefined): string {
    if (!view?.lastAttemptAt) return 'PAC script is obsolete until downloaded.';
    if (view.lastError) {
      return `Last update failed ${formatTimestamp(view.lastError.occurredAt)}. Existing cached script was preserved.`;
    }
    const stale = view.stale ? ' Cached script is stale.' : '';
    const bytes = view.lastBytes === undefined ? '' : ` ${view.lastBytes} bytes.`;
    return `Last updated ${formatTimestamp(view.lastSuccessAt)}.${bytes}${stale}`;
  }
</script>

{#if profile}
  <div data-pac-profile-editor>
    <section class="settings-section" data-pac-url-section>
      <h2>PAC URL</h2>
      <div class="url-row">
        <input
          aria-label="PAC URL"
          value={profile.source.kind === 'url' ? profile.source.url : ''}
          placeholder="https://example.com/proxy.pac"
          {disabled}
          onchange={(event) => updateUrl(valueFrom(event))}
        />
        <button
          type="button"
          aria-label="Clear PAC URL"
          disabled={disabled || profile.source.kind !== 'url'}
          onclick={clearUrl}>Clear</button
        >
      </div>
      <p class="section-help">Leave the URL empty to edit PAC Script directly.</p>
      {#if profile.source.kind === 'url' && isFileUrl(profile.source.url)}
        <p class="file-warning" role="alert" data-pac-file-warning>
          Local file PAC URLs depend on browser file-access capability.
        </p>
        {#if referenced}
          <p class="source-update-error" role="alert">
            A file PAC cannot be referenced by another profile. Use it only as a top-level route.
          </p>
        {/if}
      {/if}
      {#if profile.source.kind === 'url' && !isFileUrl(profile.source.url)}
        <details open={(profile.headers?.length ?? 0) > 0} data-pac-request-headers>
          <summary>Request headers</summary>
          <p class="section-help">Sensitive values use background-owned secret references.</p>
          {#each profile.headers ?? [] as header, index (`${header.name}:${index}`)}
            <div class="header-row">
              <input
                aria-label={`PAC header ${index + 1} name`}
                value={header.name}
                {disabled}
                onchange={(event) => updateHeaderName(index, valueFrom(event))}
              />
              <select
                aria-label={`PAC header ${index + 1} value type`}
                value={header.value.kind}
                {disabled}
                onchange={(event) =>
                  updateHeaderKind(index, valueFrom(event) as 'literal' | 'secret')}
              >
                <option value="literal">Literal</option>
                <option value="secret">Secret reference</option>
              </select>
              <input
                aria-label={`PAC header ${index + 1} value`}
                value={header.value.kind === 'literal'
                  ? header.value.value
                  : header.value.secretRef}
                {disabled}
                onchange={(event) => updateHeaderValue(index, valueFrom(event))}
              />
              <button type="button" {disabled} onclick={() => removeHeader(index)}>Remove</button>
            </div>
          {/each}
          <button type="button" {disabled} onclick={addHeader}>Add header</button>
        </details>
        <div class="download-row">
          <button
            type="button"
            data-pac-source-update-now
            disabled={disabled || updateLoading || !isRemoteUrl(profile.source.url)}
            onclick={downloadNow}
          >
            {updateLoading ? 'Downloading…' : 'Download now'}
          </button>
          <p class:stale={updateView?.stale} role="status" data-pac-source-update-status>
            {updateSummary(updateView)}
          </p>
        </div>
        {#if updateView?.lastError}
          <p class="source-update-error" role="alert">{updateView.lastError.message}</p>
        {/if}
      {/if}
    </section>

    <section class="settings-section" data-pac-script-section>
      <h2>PAC Script</h2>
      {#if profile.source.kind === 'url' && isFileUrl(profile.source.url)}
        <p class="section-help">
          The browser reads this local file directly; cached script text is hidden.
        </p>
      {:else}
        <textarea
          class="monospace"
          aria-label="PAC Script"
          rows="20"
          readonly={profile.source.kind === 'url'}
          value={profile.source.script ?? ''}
          {disabled}
          onchange={(event) => updateScript(valueFrom(event))}></textarea>
      {/if}
    </section>

    <section class="settings-section" data-pac-authentication>
      <h2>Proxy Authentication</h2>
      <p class="section-help">
        These credentials answer Basic or Digest authentication challenges from any proxy returned
        by this top-level PAC Script. Ordinary website authentication is never answered.
      </p>
      <div class="authentication-row">
        <button
          type="button"
          data-pac-auth-action="edit"
          disabled={disabled || authLoading || authSaving}
          onclick={() => void openAuthentication()}
        >
          {profile.credential ? 'Edit all-proxy authentication' : 'Set all-proxy authentication'}
        </button>
        <span role="status">
          {profile.credential
            ? `Configured${profile.credential.username ? ` for ${profile.credential.username}` : ''}.`
            : 'Not configured.'}
        </span>
      </div>
    </section>

    <section class="settings-section" data-pac-fallback-section>
      <h2>Target capability fallback</h2>
      <p class="section-help">
        Used only when the selected browser cannot activate this PAC source. It does not compose the
        arbitrary PAC script into another profile.
      </p>
      <select
        aria-label="PAC fallback profile"
        value={routeValue(profile.fallbackRoute)}
        {disabled}
        onchange={(event) => updateFallback(valueFrom(event))}
      >
        <option value="">No fallback</option>
        <option value="direct">Direct</option>
        <option value="system">System Proxy</option>
        {#each routeProfiles as target (target.id)}
          <option value={`profile:${target.id}`}>{target.name}</option>
        {/each}
      </select>
    </section>
  </div>
{/if}

{#if authOpen && profile}
  <div class="modal-backdrop" role="presentation">
    <section
      class="auth-dialog"
      data-pac-auth-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="pac-auth-title"
    >
      <header>
        <h2 id="pac-auth-title">PAC Proxy Authentication</h2>
        <button
          type="button"
          class="close-button"
          aria-label="Close PAC authentication"
          onclick={closeAuthentication}>×</button
        >
      </header>
      <div class="dialog-body">
        <p>
          One credential is used only for proxy authentication challenges while this PAC Profile is
          the active top-level route.
        </p>
        <label>
          Username
          <input
            aria-label="PAC authentication username"
            autocomplete="username"
            value={authUsername}
            disabled={authLoading || authSaving}
            oninput={(event) => (authUsername = (event.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <label>
          Password
          <input
            aria-label="PAC authentication password"
            type={showAuthPassword ? 'text' : 'password'}
            autocomplete="current-password"
            value={authPassword}
            disabled={authLoading || authSaving}
            oninput={(event) => (authPassword = (event.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <label class="show-password-row">
          <input
            type="checkbox"
            checked={showAuthPassword}
            disabled={authLoading || authSaving}
            onchange={(event) =>
              (showAuthPassword = (event.currentTarget as HTMLInputElement).checked)}
          />
          Show password
        </label>
        {#if authError}<p class="source-update-error" role="alert">{authError}</p>{/if}
      </div>
      <footer>
        {#if profile.credential}
          <button
            type="button"
            class="danger"
            data-pac-auth-action="remove"
            disabled={authLoading || authSaving}
            onclick={() => void removeAuthentication()}>Remove authentication</button
          >
        {/if}
        <span class="dialog-spacer"></span>
        <button type="button" disabled={authSaving} onclick={closeAuthentication}>Cancel</button>
        <button
          type="button"
          class="primary"
          data-pac-auth-action="save"
          disabled={authLoading || authSaving}
          onclick={() => void saveAuthentication()}
        >
          {authSaving ? 'Saving…' : 'Save authentication'}
        </button>
      </footer>
    </section>
  </div>
{/if}

<style>
  .url-row,
  .download-row,
  .authentication-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: min(100%, 920px);
  }

  .url-row input {
    flex: 1;
  }

  .download-row {
    margin-top: 0.75rem;
  }

  .authentication-row {
    justify-content: flex-start;
  }

  .download-row p {
    margin: 0;
  }

  .stale,
  .source-update-error,
  .file-warning {
    color: var(--danger-text, #b3261e);
  }

  .header-row {
    display: grid;
    grid-template-columns: minmax(10rem, 0.8fr) minmax(9rem, 0.45fr) minmax(13rem, 1fr) auto;
    gap: 0.45rem;
    width: min(100%, 980px);
    margin: 0.55rem 0;
  }

  .monospace {
    width: min(100%, 980px);
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  select {
    width: min(100%, 34rem);
  }

  .modal-backdrop {
    position: fixed;
    z-index: 50;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgb(0 0 0 / 42%);
    padding: 1rem;
  }

  .auth-dialog {
    width: min(100%, 34rem);
    border: 1px solid var(--border-strong);
    border-radius: 4px;
    background: var(--panel-bg);
    box-shadow: 0 14px 40px rgb(0 0 0 / 28%);
  }

  .auth-dialog header,
  .auth-dialog footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border);
    padding: 0.75rem 0.9rem;
  }

  .auth-dialog footer {
    border-top: 1px solid var(--border);
    border-bottom: 0;
  }

  .auth-dialog header h2 {
    flex: 1;
    margin: 0;
  }

  .dialog-body {
    padding: 0.9rem;
  }

  .dialog-body label:not(.show-password-row) {
    display: grid;
    gap: 0.3rem;
    margin-top: 0.65rem;
  }

  .show-password-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-top: 0.65rem;
  }

  .dialog-spacer {
    flex: 1;
  }

  @media (max-width: 760px) {
    .url-row,
    .download-row {
      align-items: stretch;
      flex-direction: column;
    }

    .header-row {
      grid-template-columns: 1fr;
    }
  }
</style>
