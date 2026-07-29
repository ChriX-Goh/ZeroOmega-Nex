<script lang="ts">
  import {
    cloneProfileSpecDraft,
    type FixedProfile,
    type ProfileSpec,
    type ProxyEndpoint,
  } from '@zeroomega-nex/profile-spec';
  import {
    fixedProxySlotCapability,
    proxyProtocolCapability,
    type PacTarget,
    type ProxyDnsCapability,
    type ProxyProtocolCapability,
  } from '@zeroomega-nex/pac-compiler';
  import type {
    ProfileWorkflowIdFactory,
    ProfileWorkflowSecretMaterial,
  } from '@zeroomega-nex/profile-workflow';
  import { tick } from 'svelte';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiMessage, uiText } from '../../lib/ui-messages';

  type SchemeKey = keyof FixedProfile['proxyByScheme'];
  type ProxyProtocol = ProxyEndpoint['protocol'];

  interface SchemeRow {
    readonly key: SchemeKey;
    readonly label: string;
    readonly advanced: boolean;
  }

  export let spec: ProfileSpec;
  export let profileId: string;
  export let locale: AppLocale = currentAppLocale();
  export let browserTarget: Exclude<PacTarget, 'cross-browser'> = 'chromium';
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
  let authUsernameInput: HTMLInputElement | undefined;

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

  function protocolCapability(protocol: ProxyProtocol): ProxyProtocolCapability {
    return proxyProtocolCapability(protocol, browserTarget);
  }

  function authenticationCapabilityText(
    capability: ProxyProtocolCapability['authentication'],
  ): string {
    return capability === 'web-request-407'
      ? uiText('fixed.capability.authentication407', locale)
      : uiText('fixed.capability.authenticationUnsupported', locale);
  }

  function dnsCapabilityText(capability: ProxyDnsCapability): string {
    switch (capability) {
      case 'proxy-protocol-default':
        return uiText('fixed.capability.dnsProtocolDefault', locale);
      case 'client-ipv4-only':
        return uiText('fixed.capability.dnsClientIpv4', locale);
      case 'proxy-side':
        return uiText('fixed.capability.dnsProxySide', locale);
      case 'browser-target-default':
        return uiText('fixed.capability.dnsBrowserDefault', locale);
      case 'target-dependent':
        return uiText('fixed.capability.dnsTargetDependent', locale);
    }
  }

  function rowDisplayLabel(row: SchemeRow): string {
    return row.key === 'fallback' ? uiText('fixed.default', locale) : row.label;
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
      rowErrors = { ...rowErrors, [scheme]: uiText('fixed.error.serverRequired', locale) };
      return false;
    }
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      rowErrors = { ...rowErrors, [scheme]: uiText('fixed.error.portRange', locale) };
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
    void tick().then(() => authUsernameInput?.focus());
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
      authError = uiMessage(
        'fixed.authUnsupported',
        { protocol: protocolLabel(authProtocol) },
        locale,
      );
      return;
    }
    const draft = cloneProfileSpecDraft(spec);
    const current = draft.profiles.find(
      (candidate): candidate is FixedProfile =>
        candidate.id === profileId && candidate.kind === 'fixed',
    );
    const endpoint = current ? editableEndpoint(draft, current, authScheme) : undefined;
    if (!endpoint) {
      authError = uiText('fixed.error.serverMissing', locale);
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
  <section class="settings-section fixed-proxy-section" data-typed-locale={locale}>
    <h2>{uiText('fixed.proxyServers', locale)}</h2>
    <div class="table-scroller">
      <table class="fixed-proxy-table" data-fixed-proxy-table>
        <thead>
          <tr>
            <th>{uiText('fixed.scheme', locale)}</th>
            <th>{uiText('fixed.protocol', locale)}</th>
            <th>{uiText('fixed.server', locale)}</th>
            <th>{uiText('fixed.port', locale)}</th>
            <th><span class="sr-only">{uiText('fixed.authentication', locale)}</span></th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row (row.key)}
            {#if !row.advanced || showAdvanced}
              <tr data-proxy-scheme={row.key}>
                <td>{rowDisplayLabel(row)}</td>
                <td>
                  <select
                    aria-label={uiMessage(
                      'fixed.fieldAria',
                      { scheme: rowDisplayLabel(row), field: 'protocol' },
                      locale,
                    )}
                    data-proxy-field="protocol"
                    value={protocolDraft[row.key]}
                    {disabled}
                    on:change={(event) =>
                      changeProtocol(row.key, (event.currentTarget as HTMLSelectElement).value)}
                  >
                    <option value=""
                      >{row.advanced
                        ? uiText('fixed.useDefault', locale)
                        : uiText('fixed.direct', locale)}</option
                    >
                    {#each protocols as protocol (protocol)}
                      <option value={protocol}>{protocolLabel(protocol)}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <input
                    aria-label={uiMessage(
                      'fixed.fieldAria',
                      { scheme: rowDisplayLabel(row), field: 'server' },
                      locale,
                    )}
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
                    aria-label={uiMessage(
                      'fixed.fieldAria',
                      { scheme: rowDisplayLabel(row), field: 'port' },
                      locale,
                    )}
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
                    aria-label={uiText('fixed.authentication', locale)}
                    title={uiText('fixed.authentication', locale)}
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
                  <td colspan="5"><span role="alert">{rowErrors[row.key]}</span></td>
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
                  on:click={() => (showAdvanced = true)}
                  >⌄ {uiText('fixed.showAdvanced', locale)}</button
                >
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </section>

  <section
    class="settings-section protocol-capabilities-section"
    data-fixed-protocol-capabilities
    data-browser-target={browserTarget}
  >
    <h2>{uiText('fixed.capability.title', locale)}</h2>
    <p class="section-help">
      {uiText('fixed.capability.help', locale)}
    </p>
    <p class="target-summary" data-fixed-protocol-target>
      {uiText('fixed.capability.target', locale)}:
      <strong
        >{browserTarget === 'firefox'
          ? uiText('fixed.capability.targetFirefox', locale)
          : uiText('fixed.capability.targetChromium', locale)}</strong
      >
    </p>
    <div class="table-scroller">
      <table class="protocol-capabilities-table">
        <thead>
          <tr>
            <th>{uiText('fixed.protocol', locale)}</th>
            <th>{uiText('fixed.capability.pacDirective', locale)}</th>
            <th>{uiText('fixed.capability.transport', locale)}</th>
            <th>{uiText('fixed.authentication', locale)}</th>
            <th>{uiText('fixed.capability.dns', locale)}</th>
          </tr>
        </thead>
        <tbody>
          {#each protocols as protocol (protocol)}
            {@const capability = protocolCapability(protocol)}
            <tr data-proxy-protocol-capability={protocol}>
              <th scope="row">{protocolLabel(protocol)}</th>
              <td><code>{capability.pacDirective}</code></td>
              <td>{uiText('fixed.capability.transportSupported', locale)}</td>
              <td>{authenticationCapabilityText(capability.authentication)}</td>
              <td>{dnsCapabilityText(capability.dns)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="ftp-capability-note" role="note" data-fixed-ftp-capability>
      {fixedProxySlotCapability('ftp', browserTarget).request === 'browser-request-removed'
        ? uiText('fixed.capability.ftpRemoved', locale)
        : ''}
    </p>
  </section>

  <section class="settings-section">
    <h2>{uiText('fixed.bypassList', locale)}</h2>
    <p class="section-help">
      {uiText('fixed.bypassHelp', locale)}
    </p>
    <p class="section-help">
      <a
        href="https://developer.chrome.com/docs/extensions/reference/api/proxy#bypass_list"
        target="_blank"
        rel="noreferrer">{uiText('fixed.bypassMore', locale)}</a
      >
    </p>
    <textarea
      class="monospace"
      aria-label={uiText('fixed.bypassList', locale)}
      rows="10"
      value={bypassText}
      {disabled}
      on:change={(event) => updateBypassList((event.currentTarget as HTMLTextAreaElement).value)}
    ></textarea>
  </section>
{/if}

{#if authEndpointId}
  <div class="modal-backdrop" role="presentation">
    <div
      class="auth-dialog"
      data-fixed-auth-dialog
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <header>
        <h2 id="auth-title">{uiText('fixed.authTitle', locale)}</h2>
        <button
          type="button"
          class="close-button"
          aria-label={uiText('common.close', locale)}
          on:click={closeAuthentication}>×</button
        >
      </header>
      <div class="dialog-body">
        {#if !authSupported(authProtocol)}
          <p class="auth-warning" role="alert">
            {uiMessage('fixed.authUnsupported', { protocol: protocolLabel(authProtocol) }, locale)}
          </p>
        {/if}
        <label>
          <span class="sr-only">{uiText('fixed.username', locale)}</span>
          <input
            bind:this={authUsernameInput}
            aria-label={uiText('fixed.username', locale)}
            placeholder={uiText('fixed.username', locale)}
            value={authUsername}
            disabled={authLoading || authSaving}
            on:input={(event) => (authUsername = (event.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <label>
          <span class="sr-only">{uiText('fixed.password', locale)}</span>
          <span class="password-row">
            <input
              aria-label={uiText('fixed.password', locale)}
              type={showPassword ? 'text' : 'password'}
              placeholder={authUsername
                ? uiText('fixed.password', locale)
                : uiText('fixed.noAuthentication', locale)}
              value={authPassword}
              disabled={!authUsername || authLoading || authSaving}
              on:input={(event) => (authPassword = (event.currentTarget as HTMLInputElement).value)}
            />
            <button
              type="button"
              title={showPassword
                ? uiText('fixed.hidePassword', locale)
                : uiText('fixed.showPassword', locale)}
              aria-label={showPassword
                ? uiText('fixed.hidePassword', locale)
                : uiText('fixed.showPassword', locale)}
              disabled={!authUsername || authLoading || authSaving}
              on:click={() => (showPassword = !showPassword)}>{showPassword ? '◉' : '◎'}</button
            >
          </span>
        </label>
        {#if authLoading}<p>{uiText('common.loading', locale)}</p>{/if}
        {#if authError}<p class="auth-warning" role="alert">{authError}</p>{/if}
      </div>
      <footer>
        <button type="button" disabled={authSaving} on:click={closeAuthentication}
          >{uiText('common.cancel', locale)}</button
        >
        <button
          type="button"
          class="primary"
          data-auth-action="save"
          disabled={authSaving ||
            authLoading ||
            (Boolean(authUsername.trim()) && !authSupported(authProtocol))}
          on:click={saveAuthentication}
          >{authSaving
            ? uiText('common.saving', locale)
            : uiText('common.saveChanges', locale)}</button
        >
      </footer>
    </div>
  </div>
{/if}

<style>
  .protocol-capabilities-section {
    margin-top: 18px;
  }

  .target-summary,
  .ftp-capability-note {
    margin: 8px 0;
  }

  .protocol-capabilities-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .protocol-capabilities-table th,
  .protocol-capabilities-table td {
    padding: 7px 8px;
    border: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
  }

  .ftp-capability-note {
    color: var(--muted);
  }

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
