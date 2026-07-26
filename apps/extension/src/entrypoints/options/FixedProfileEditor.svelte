<script lang="ts">
  import {
    cloneProfileSpecDraft,
    type FixedProfile,
    type ProfileSpec,
    type ProxyEndpoint,
  } from '@zeroomega-nex/profile-spec';
  import type {
    ProfileWorkflowIdFactory,
    ProfileWorkflowSecretMaterial,
  } from '@zeroomega-nex/profile-workflow';

  type SchemeKey = keyof FixedProfile['proxyByScheme'];
  type ProxyProtocol = ProxyEndpoint['protocol'];

  interface SchemeRow {
    readonly key: SchemeKey;
    readonly label: string;
    readonly advanced: boolean;
  }

  export let spec: ProfileSpec;
  export let profileId: string;
  export let generation: number;
  export let disabled = false;
  export let idFactory: ProfileWorkflowIdFactory;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onReplaceDraftWithSecrets: (
    draft: ProfileSpec,
    materials: readonly ProfileWorkflowSecretMaterial[],
  ) => Promise<boolean>;
  export let onReadSecret: (secretRef: string) => Promise<string>;

  const rows: readonly SchemeRow[] = [
    { key: 'fallback', label: '(default)', advanced: false },
    { key: 'http', label: 'http://', advanced: true },
    { key: 'https', label: 'https://', advanced: true },
    { key: 'ftp', label: 'ftp://', advanced: true },
  ];
  const protocols: readonly ProxyProtocol[] = ['http', 'https', 'socks4', 'socks5'];
  const defaultPorts: Readonly<Record<ProxyProtocol, number>> = {
    http: 80,
    https: 443,
    socks4: 1080,
    socks5: 1080,
  };

  let profile: FixedProfile | undefined;
  let initializedProfileId = '';
  let initializedGeneration = -1;
  let showAdvanced = false;
  let protocolDraft: Record<SchemeKey, ProxyProtocol | ''> = emptyProtocols();
  let hostDraft: Record<SchemeKey, string> = emptyStrings();
  let portDraft: Record<SchemeKey, string> = emptyStrings();
  let rowErrors: Partial<Record<SchemeKey, string>> = {};
  let bypassText = '';

  let authEndpointId = '';
  let authScheme: SchemeKey = 'fallback';
  let authProtocol: ProxyProtocol = 'http';
  let authUsername = '';
  let authPassword = '';
  let authSecretRef = '';
  let authLoading = false;
  let authSaving = false;
  let authError = '';
  let showPassword = false;

  $: profile = spec.profiles.find(
    (candidate): candidate is FixedProfile =>
      candidate.id === profileId && candidate.kind === 'fixed',
  );
  $: if (profile && (profile.id !== initializedProfileId || generation !== initializedGeneration))
    initialize(profile);
  $: if (profile && hasAdvancedProxy(profile)) showAdvanced = true;

  function emptyProtocols(): Record<SchemeKey, ProxyProtocol | ''> {
    return { fallback: '', http: '', https: '', ftp: '' };
  }

  function emptyStrings(): Record<SchemeKey, string> {
    return { fallback: '', http: '', https: '', ftp: '' };
  }

  function initialize(current: FixedProfile): void {
    initializedProfileId = current.id;
    initializedGeneration = generation;
    const nextProtocols = emptyProtocols();
    const nextHosts = emptyStrings();
    const nextPorts = emptyStrings();
    for (const row of rows) {
      const endpoint = endpointFor(current, row.key, spec);
      if (!endpoint) continue;
      nextProtocols[row.key] = endpoint.protocol;
      nextHosts[row.key] = endpoint.host;
      nextPorts[row.key] = String(endpoint.port);
    }
    protocolDraft = nextProtocols;
    hostDraft = nextHosts;
    portDraft = nextPorts;
    bypassText = current.bypass.map((entry) => entry.pattern).join('\n');
    showAdvanced = hasAdvancedProxy(current);
    rowErrors = {};
  }

  function hasAdvancedProxy(current: FixedProfile): boolean {
    return Boolean(
      current.proxyByScheme.http ?? current.proxyByScheme.https ?? current.proxyByScheme.ftp,
    );
  }

  function endpointFor(
    current: FixedProfile,
    scheme: SchemeKey,
    source: ProfileSpec,
  ): ProxyEndpoint | undefined {
    const endpointId = current.proxyByScheme[scheme];
    return endpointId
      ? source.proxyEndpoints.find((candidate) => candidate.id === endpointId)
      : undefined;
  }

  function endpointReferenceCount(source: ProfileSpec, endpointId: string): number {
    let count = 0;
    for (const candidate of source.profiles) {
      if (candidate.kind !== 'fixed') continue;
      for (const reference of Object.values(candidate.proxyByScheme)) {
        if (reference === endpointId) count += 1;
      }
    }
    return count;
  }

  function removeOrphanEndpoint(source: ProfileSpec, endpointId: string): void {
    if (endpointReferenceCount(source, endpointId) !== 0) return;
    source.proxyEndpoints = source.proxyEndpoints.filter(
      (candidate) => candidate.id !== endpointId,
    );
  }

  function editableEndpoint(
    source: ProfileSpec,
    current: FixedProfile,
    scheme: SchemeKey,
  ): ProxyEndpoint | undefined {
    const endpointId = current.proxyByScheme[scheme];
    if (!endpointId) return undefined;
    const endpoint = source.proxyEndpoints.find((candidate) => candidate.id === endpointId);
    if (!endpoint) return undefined;
    if (endpointReferenceCount(source, endpointId) <= 1) return endpoint;

    const cloneId = idFactory('endpoint');
    const clone: ProxyEndpoint = {
      ...structuredClone(endpoint),
      id: cloneId,
      name: `${current.name} ${scheme}`,
    };
    source.proxyEndpoints.push(clone);
    current.proxyByScheme[scheme] = cloneId;
    return clone;
  }

  function fallbackPlaceholder(field: 'host' | 'port'): string {
    return field === 'host' ? hostDraft.fallback : portDraft.fallback;
  }

  function protocolLabel(protocol: ProxyProtocol): string {
    return protocol === 'http'
      ? 'HTTP'
      : protocol === 'https'
        ? 'HTTPS'
        : protocol === 'socks4'
          ? 'SOCKS4'
          : 'SOCKS5';
  }

  function clearRowError(scheme: SchemeKey): void {
    const next = { ...rowErrors };
    delete next[scheme];
    rowErrors = next;
  }

  async function removeScheme(scheme: SchemeKey): Promise<void> {
    if (!profile) return;
    const draft = cloneProfileSpecDraft(spec);
    const current = draft.profiles.find(
      (candidate): candidate is FixedProfile =>
        candidate.id === profileId && candidate.kind === 'fixed',
    );
    if (!current) return;
    const endpointId = current.proxyByScheme[scheme];
    delete current.proxyByScheme[scheme];
    if (endpointId) removeOrphanEndpoint(draft, endpointId);
    clearRowError(scheme);
    await onReplaceDraft(draft);
  }

  async function commitRow(scheme: SchemeKey): Promise<boolean> {
    if (!profile) return false;
    const protocol = protocolDraft[scheme];
    if (!protocol) {
      await removeScheme(scheme);
      return true;
    }
    const host = hostDraft[scheme].trim();
    const port = Number(portDraft[scheme]);
    if (!host) {
      rowErrors = { ...rowErrors, [scheme]: 'Server is required.' };
      return false;
    }
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      rowErrors = { ...rowErrors, [scheme]: 'Port must be an integer from 1 to 65535.' };
      return false;
    }

    const draft = cloneProfileSpecDraft(spec);
    const current = draft.profiles.find(
      (candidate): candidate is FixedProfile =>
        candidate.id === profileId && candidate.kind === 'fixed',
    );
    if (!current) return false;
    let endpoint = editableEndpoint(draft, current, scheme);
    if (!endpoint) {
      const endpointId = idFactory('endpoint');
      endpoint = {
        id: endpointId,
        name: `${current.name} ${scheme}`,
        protocol,
        host,
        port,
      };
      draft.proxyEndpoints.push(endpoint);
      current.proxyByScheme[scheme] = endpointId;
    } else {
      endpoint.protocol = protocol;
      endpoint.host = host;
      endpoint.port = port;
    }
    clearRowError(scheme);
    return onReplaceDraft(draft);
  }

  async function changeProtocol(scheme: SchemeKey, value: string): Promise<void> {
    const protocol = value as ProxyProtocol | '';
    protocolDraft = { ...protocolDraft, [scheme]: protocol };
    clearRowError(scheme);
    if (!protocol) {
      hostDraft = { ...hostDraft, [scheme]: '' };
      portDraft = { ...portDraft, [scheme]: '' };
      await removeScheme(scheme);
      return;
    }
    if (!hostDraft[scheme] && scheme !== 'fallback' && hostDraft.fallback) {
      hostDraft = { ...hostDraft, [scheme]: hostDraft.fallback };
    }
    if (!portDraft[scheme]) {
      const inheritedPort =
        scheme !== 'fallback' && protocolDraft.fallback === protocol ? portDraft.fallback : '';
      portDraft = {
        ...portDraft,
        [scheme]: inheritedPort || String(defaultPorts[protocol]),
      };
    }
    if (profile && endpointFor(profile, scheme, spec)) await commitRow(scheme);
  }

  async function updateBypassList(value: string): Promise<void> {
    if (!profile) return;
    bypassText = value;
    const patterns = value
      .split(/\r?\n/u)
      .map((pattern) => pattern.trim())
      .filter(Boolean);
    const draft = cloneProfileSpecDraft(spec);
    const current = draft.profiles.find(
      (candidate): candidate is FixedProfile =>
        candidate.id === profileId && candidate.kind === 'fixed',
    );
    if (!current) return;
    current.bypass = patterns.map((pattern, index) => ({
      id: current.bypass[index]?.id ?? idFactory('bypass'),
      pattern,
    }));
    await onReplaceDraft(draft);
  }

  function authSupported(protocol: ProxyProtocol): boolean {
    return protocol === 'http' || protocol === 'https';
  }

  async function openAuthentication(scheme: SchemeKey): Promise<void> {
    if (!profile) return;
    const endpoint = endpointFor(profile, scheme, spec);
    if (!endpoint) return;
    authEndpointId = endpoint.id;
    authScheme = scheme;
    authProtocol = endpoint.protocol;
    authUsername = endpoint.credential?.username ?? '';
    authPassword = '';
    authSecretRef = endpoint.credential?.passwordSecretRef ?? '';
    authError = '';
    showPassword = false;
    if (!authSecretRef) return;
    authLoading = true;
    try {
      authPassword = await onReadSecret(authSecretRef);
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
    } finally {
      authLoading = false;
    }
  }

  function closeAuthentication(): void {
    if (authSaving) return;
    authEndpointId = '';
    authError = '';
  }

  async function saveAuthentication(): Promise<void> {
    if (!authEndpointId) return;
    if (authUsername.trim() && !authSupported(authProtocol)) {
      authError = `Your browser does not support ${protocolLabel(authProtocol)} proxy authentication.`;
      return;
    }
    const draft = cloneProfileSpecDraft(spec);
    const current = draft.profiles.find(
      (candidate): candidate is FixedProfile =>
        candidate.id === profileId && candidate.kind === 'fixed',
    );
    const endpoint = current ? editableEndpoint(draft, current, authScheme) : undefined;
    if (!endpoint) {
      authError = 'Proxy server no longer exists.';
      return;
    }

    const previousSecretRef = endpoint.credential?.passwordSecretRef;
    const username = authUsername.trim();
    const materials: ProfileWorkflowSecretMaterial[] = [];
    if (!username) {
      delete endpoint.credential;
    } else {
      const secretRef = previousSecretRef ?? `secret-proxy-${crypto.randomUUID()}`;
      endpoint.credential = { username, passwordSecretRef: secretRef };
      materials.push({ ref: secretRef, value: authPassword });
    }

    authSaving = true;
    authError = '';
    try {
      const accepted = await onReplaceDraftWithSecrets(draft, materials);
      if (!accepted) return;
      authEndpointId = '';
      authError = '';
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
    } finally {
      authSaving = false;
    }
  }
</script>

{#if profile}
  <section class="settings-section fixed-proxy-section">
    <h2>Proxy servers</h2>
    <div class="table-scroller">
      <table class="fixed-proxy-table" data-fixed-proxy-table>
        <thead>
          <tr>
            <th>Scheme</th>
            <th>Protocol</th>
            <th>Server</th>
            <th>Port</th>
            <th><span class="sr-only">Authentication</span></th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row (row.key)}
            {#if !row.advanced || showAdvanced}
              <tr data-proxy-scheme={row.key}>
                <td>{row.label}</td>
                <td>
                  <select
                    aria-label={`${row.label} proxy protocol`}
                    data-proxy-field="protocol"
                    value={protocolDraft[row.key]}
                    {disabled}
                    on:change={(event) =>
                      changeProtocol(row.key, (event.currentTarget as HTMLSelectElement).value)}
                  >
                    <option value="">{row.advanced ? '(use default)' : 'DIRECT'}</option>
                    {#each protocols as protocol (protocol)}
                      <option value={protocol}>{protocolLabel(protocol)}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <input
                    aria-label={`${row.label} proxy server`}
                    data-proxy-field="server"
                    value={hostDraft[row.key]}
                    placeholder={row.advanced && !protocolDraft[row.key]
                      ? fallbackPlaceholder('host')
                      : 'example.com'}
                    disabled={disabled || !protocolDraft[row.key]}
                    on:input={(event) =>
                      (hostDraft = {
                        ...hostDraft,
                        [row.key]: (event.currentTarget as HTMLInputElement).value,
                      })}
                    on:change={() => commitRow(row.key)}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${row.label} proxy port`}
                    data-proxy-field="port"
                    type="number"
                    min="1"
                    max="65535"
                    value={portDraft[row.key]}
                    placeholder={row.advanced && !protocolDraft[row.key]
                      ? fallbackPlaceholder('port')
                      : protocolDraft[row.key]
                        ? String(defaultPorts[protocolDraft[row.key] as ProxyProtocol])
                        : ''}
                    disabled={disabled || !protocolDraft[row.key]}
                    on:input={(event) =>
                      (portDraft = {
                        ...portDraft,
                        [row.key]: (event.currentTarget as HTMLInputElement).value,
                      })}
                    on:change={() => commitRow(row.key)}
                  />
                </td>
                <td class="auth-cell">
                  <button
                    type="button"
                    class:active-auth={Boolean(endpointFor(profile, row.key, spec)?.credential)}
                    data-proxy-action="authentication"
                    aria-label="Authentication"
                    title="Authentication"
                    disabled={disabled || !endpointFor(profile, row.key, spec)}
                    on:click={() => openAuthentication(row.key)}
                  >
                    <svg class="lock-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M7 10V7a5 5 0 0 1 10 0v3h1.25A1.75 1.75 0 0 1 20 11.75v8.5A1.75 1.75 0 0 1 18.25 22H5.75A1.75 1.75 0 0 1 4 20.25v-8.5A1.75 1.75 0 0 1 5.75 10H7Zm2 0h6V7a3 3 0 0 0-6 0v3Zm3 4a1.75 1.75 0 0 0-1 3.19V19h2v-1.81A1.75 1.75 0 0 0 12 14Z"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
              {#if rowErrors[row.key]}
                <tr class="row-error">
                  <td colspan="5" role="alert">{rowErrors[row.key]}</td>
                </tr>
              {/if}
            {/if}
          {/each}
          {#if !showAdvanced}
            <tr class="show-advanced-row">
              <td colspan="5">
                <button
                  type="button"
                  class="link-button"
                  data-proxy-action="show-advanced"
                  on:click={() => (showAdvanced = true)}>⌄ Show Advanced</button
                >
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </section>

  <section class="settings-section">
    <h2>Bypass List</h2>
    <p class="section-help">
      Servers for which you do not want to use any proxy: (One server on each line.)
    </p>
    <p class="section-help">
      <a
        href="https://developer.chrome.com/docs/extensions/reference/api/proxy#bypass_list"
        target="_blank"
        rel="noreferrer">(Wildcards and more available…)</a
      >
    </p>
    <textarea
      class="monospace"
      aria-label="Bypass List"
      rows="10"
      value={bypassText}
      {disabled}
      on:change={(event) => updateBypassList((event.currentTarget as HTMLTextAreaElement).value)}
    ></textarea>
  </section>
{/if}

{#if authEndpointId}
  <div class="modal-backdrop" role="presentation">
    <section
      class="auth-dialog"
      data-fixed-auth-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <header>
        <h2 id="auth-title">Proxy Authentication</h2>
        <button type="button" class="close-button" aria-label="Close" on:click={closeAuthentication}
          >×</button
        >
      </header>
      <div class="dialog-body">
        {#if !authSupported(authProtocol)}
          <p class="auth-warning" role="alert">
            Your browser does not support {protocolLabel(authProtocol)} proxy authentication.
          </p>
        {/if}
        <label>
          <span class="sr-only">Username</span>
          <input
            aria-label="Username"
            placeholder="Username"
            value={authUsername}
            disabled={authLoading || authSaving}
            on:input={(event) => (authUsername = (event.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <label>
          <span class="sr-only">Password</span>
          <span class="password-row">
            <input
              aria-label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder={authUsername ? 'Password' : 'No Authentication'}
              value={authPassword}
              disabled={!authUsername || authLoading || authSaving}
              on:input={(event) => (authPassword = (event.currentTarget as HTMLInputElement).value)}
            />
            <button
              type="button"
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={!authUsername || authLoading || authSaving}
              on:click={() => (showPassword = !showPassword)}>{showPassword ? '◉' : '◎'}</button
            >
          </span>
        </label>
        {#if authLoading}<p>Loading…</p>{/if}
        {#if authError}<p class="auth-warning" role="alert">{authError}</p>{/if}
      </div>
      <footer>
        <button type="button" disabled={authSaving} on:click={closeAuthentication}>Cancel</button>
        <button
          type="button"
          class="primary"
          data-auth-action="save"
          disabled={authSaving ||
            authLoading ||
            (Boolean(authUsername.trim()) && !authSupported(authProtocol))}
          on:click={saveAuthentication}>{authSaving ? 'Saving…' : 'Save changes'}</button
        >
      </footer>
    </section>
  </div>
{/if}

<style>
  .table-scroller {
    overflow-x: auto;
  }

  .fixed-proxy-table {
    width: min(100%, 940px);
    border-collapse: collapse;
  }

  .fixed-proxy-table th,
  .fixed-proxy-table td {
    border: 1px solid var(--border);
    padding: 0.55rem;
    text-align: left;
    vertical-align: middle;
  }

  .fixed-proxy-table th {
    background: var(--hover);
    font-size: 0.84rem;
  }

  .fixed-proxy-table select,
  .fixed-proxy-table input {
    width: 100%;
    min-width: 7rem;
  }

  .fixed-proxy-table td:first-child {
    width: 7rem;
    white-space: nowrap;
  }

  .fixed-proxy-table .auth-cell {
    width: 3.1rem;
    text-align: center;
  }

  .auth-cell button {
    min-width: 2.2rem;
    padding: 0.36rem;
  }

  .lock-icon {
    width: 1.05rem;
    height: 1.05rem;
    fill: currentColor;
  }

  .auth-cell .active-auth {
    border-color: var(--accent);
    color: var(--accent);
  }

  .show-advanced-row td {
    padding: 0.2rem;
    text-align: center;
  }

  .link-button {
    border: 0;
    background: transparent;
    color: var(--accent);
  }

  .row-error td {
    color: var(--danger);
    font-size: 0.85rem;
  }

  .monospace {
    width: min(100%, 760px);
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgb(15 23 42 / 0.56);
  }

  .auth-dialog {
    width: min(28rem, 100%);
    border: 1px solid var(--border);
    border-radius: 0.7rem;
    background: var(--content-bg);
    box-shadow: 0 1.3rem 4rem rgb(0 0 0 / 0.25);
  }

  .auth-dialog header,
  .auth-dialog footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 0.9rem 1rem;
    border-bottom: 1px solid var(--border);
  }

  .auth-dialog footer {
    justify-content: flex-end;
    border-top: 1px solid var(--border);
    border-bottom: 0;
  }

  .auth-dialog h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  .close-button {
    border: 0;
    background: transparent;
    font-size: 1.4rem;
  }

  .dialog-body {
    display: grid;
    gap: 0.8rem;
    padding: 1rem;
  }

  .dialog-body input {
    width: 100%;
  }

  .password-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.45rem;
  }

  .auth-warning {
    margin: 0;
    color: var(--danger);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
