<script lang="ts">
  import type {
    ProfileWorkflowCommandResponse,
    ProfileWorkflowSnapshotHistoryEntry,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';

  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';

  export let disabled = false;

  let entries: readonly ProfileWorkflowSnapshotHistoryEntry[] = [];
  let loading = true;
  let errorMessage = '';

  function routeLabel(entry: ProfileWorkflowSnapshotHistoryEntry): string {
    const route = entry.startRoute;
    if (route.kind === 'direct') return 'Direct';
    if (route.kind === 'system') return 'System Proxy';
    return `Profile ${route.profileId}`;
  }

  function dateLabel(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  function acceptResponse(response: ProfileWorkflowCommandResponse): void {
    if (!response.ok) {
      errorMessage = response.message;
      return;
    }
    entries = response.snapshotHistory ?? [];
    errorMessage = '';
  }

  async function loadHistory(): Promise<void> {
    if (loading && entries.length > 0) return;
    loading = true;
    errorMessage = '';
    try {
      acceptResponse(await sendProfileWorkflowCommand({ action: 'get-snapshot-history' }));
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadHistory();
  });
</script>

<section class="settings-section">
  <div>
    <h2>Verified snapshots</h2>
    <p class="section-help">
      Read-only compiler and verification metadata. PAC source and secret material are never returned
      to this page.
    </p>
  </div>
  <button type="button" disabled={disabled || loading} on:click={loadHistory}
    >{loading ? 'Refreshing…' : 'Refresh history'}</button
  >
</section>

{#if errorMessage}
  <section class="settings-section">
    <p role="alert">{errorMessage}</p>
  </section>
{:else if loading && entries.length === 0}
  <section class="settings-section">
    <p role="status">Loading verified snapshot history…</p>
  </section>
{:else if entries.length === 0}
  <section class="settings-section">
    <p>No verified PAC snapshots are stored yet. Direct and System activations do not create PAC snapshots.</p>
  </section>
{:else}
  {#each entries as entry (entry.snapshotId)}
    <article class="settings-section">
      <header>
        <div>
          <h2>{dateLabel(entry.createdAt)}</h2>
          <p class="section-help">Snapshot {entry.snapshotId}</p>
        </div>
        <div aria-label="Snapshot status">
          {#if entry.active}<strong>Active</strong>{/if}
          {#if entry.lastKnownGood}<strong>Last known good</strong>{/if}
        </div>
      </header>

      <dl>
        <div><dt>Source revision</dt><dd>{entry.sourceRevisionId}</dd></div>
        <div><dt>Start route</dt><dd>{routeLabel(entry)}</dd></div>
        <div><dt>Browser target</dt><dd>{entry.target}</dd></div>
        <div><dt>Capability</dt><dd>{entry.capability}</dd></div>
        <div><dt>Compiler</dt><dd>{entry.compilerVersion}</dd></div>
        <div><dt>PAC hash</dt><dd>{entry.scriptSha256Prefix}…</dd></div>
        <div>
          <dt>ProfileSpec hash</dt><dd>{entry.sourceProfileSpecSha256Prefix}…</dd>
        </div>
        <div>
          <dt>Verification</dt>
          <dd>{entry.verification.matchedCount}/{entry.verification.vectorCount} vectors matched</dd>
        </div>
        <div><dt>PAC size</dt><dd>{entry.stats.scriptBytes} bytes</dd></div>
        <div><dt>Profiles</dt><dd>{entry.stats.profileCount}</dd></div>
        <div><dt>Endpoints</dt><dd>{entry.stats.endpointCount}</dd></div>
        <div><dt>Conditions</dt><dd>{entry.stats.conditionCount}</dd></div>
      </dl>

      {#if entry.warnings.length > 0}
        <details>
          <summary>Warnings ({entry.warnings.length})</summary>
          <ol>
            {#each entry.warnings as warning, index (`${warning.code}:${warning.path}:${index}`)}
              <li>
                <strong>{warning.code}</strong> — {warning.message}
                <div>{warning.path} · {warning.capability} · {warning.severity}</div>
              </li>
            {/each}
          </ol>
        </details>
      {/if}
    </article>
  {/each}
{/if}
