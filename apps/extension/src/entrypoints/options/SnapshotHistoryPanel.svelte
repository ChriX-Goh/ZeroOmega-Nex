<script lang="ts">
  import type {
    ProfileWorkflowCommandResponse,
    ProfileWorkflowRevisionHistoryEntry,
    ProfileWorkflowSnapshotHistoryEntry,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';

  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';

  export let disabled = false;
  export let dirty = false;
  export let generation: number;
  export let onRollbackSnapshot: (
    expectedGeneration: number,
    snapshotId: string,
  ) => Promise<boolean>;

  let snapshots: readonly ProfileWorkflowSnapshotHistoryEntry[] = [];
  let revisions: readonly ProfileWorkflowRevisionHistoryEntry[] = [];
  let loading = true;
  let errorMessage = '';
  let confirmingSnapshotId: string | undefined;
  let rollingBackSnapshotId: string | undefined;

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

  function hasRevision(entry: ProfileWorkflowSnapshotHistoryEntry): boolean {
    return revisions.some((revision) => revision.revisionId === entry.sourceRevisionId);
  }

  function acceptResponse(response: ProfileWorkflowCommandResponse): void {
    if (!response.ok) {
      errorMessage = response.message;
      return;
    }
    snapshots = response.snapshotHistory ?? [];
    revisions = response.revisionHistory ?? [];
    errorMessage = '';
  }

  async function loadHistory(): Promise<void> {
    if (loading && (snapshots.length > 0 || revisions.length > 0)) return;
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

  async function rollbackSnapshot(snapshotId: string): Promise<void> {
    if (rollingBackSnapshotId || dirty || disabled) return;
    rollingBackSnapshotId = snapshotId;
    errorMessage = '';
    try {
      const rolledBack = await onRollbackSnapshot(generation, snapshotId);
      if (!rolledBack) {
        errorMessage = 'Snapshot rollback failed. Review the workflow error and retry.';
        return;
      }
      confirmingSnapshotId = undefined;
      await loadHistory();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      rollingBackSnapshotId = undefined;
    }
  }

  onMount(() => {
    void loadHistory();
  });
</script>

<section class="settings-section">
  <div>
    <h2>Configuration history</h2>
    <p class="section-help">
      Revision, compiler, and verification metadata. Profile contents, PAC source, and secret
      material are never returned to this page.
    </p>
  </div>
  <button type="button" disabled={disabled || loading} on:click={loadHistory}
    >{loading ? 'Refreshing…' : 'Refresh history'}</button
  >
</section>

{#if dirty}
  <section class="settings-section">
    <p role="alert">
      Draft contains unapplied changes. Apply or Revert those changes before rolling back a
      snapshot.
    </p>
  </section>
{/if}

{#if errorMessage}
  <section class="settings-section">
    <p role="alert">{errorMessage}</p>
  </section>
{:else if loading && snapshots.length === 0 && revisions.length === 0}
  <section class="settings-section">
    <p role="status">Loading verified snapshot and revision history…</p>
  </section>
{:else}
  <section class="settings-section">
    <h2>ProfileSpec revisions</h2>
    {#if revisions.length === 0}
      <p>No archived revisions are available.</p>
    {:else}
      <ol aria-label="ProfileSpec revision history">
        {#each revisions as revision (revision.revisionId)}
          <li>
            <header>
              <div>
                <strong>{dateLabel(revision.createdAt)}</strong>
                <div>{revision.revisionId}</div>
              </div>
              {#if revision.applied}<strong>Applied</strong>{/if}
            </header>
            <dl>
              {#if revision.parentRevisionId}
                <div>
                  <dt>Parent</dt>
                  <dd>{revision.parentRevisionId}</dd>
                </div>
              {/if}
              {#if revision.deviceId}<div>
                  <dt>Device</dt>
                  <dd>{revision.deviceId}</dd>
                </div>{/if}
              <div>
                <dt>Profiles</dt>
                <dd>{revision.profileCount}</dd>
              </div>
              <div>
                <dt>Endpoints</dt>
                <dd>{revision.endpointCount}</dd>
              </div>
              <div>
                <dt>Rule sources</dt>
                <dd>{revision.ruleSourceCount}</dd>
              </div>
            </dl>
          </li>
        {/each}
      </ol>
    {/if}
  </section>

  <section class="settings-section">
    <h2>Verified PAC snapshots</h2>
    {#if snapshots.length === 0}
      <p>
        No verified PAC snapshots are stored yet. Direct and System activations do not create PAC
        snapshots.
      </p>
    {/if}
  </section>

  {#each snapshots as entry (entry.snapshotId)}
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
        <div>
          <dt>Source revision</dt>
          <dd>{entry.sourceRevisionId}</dd>
        </div>
        <div>
          <dt>Start route</dt>
          <dd>{routeLabel(entry)}</dd>
        </div>
        <div>
          <dt>Browser target</dt>
          <dd>{entry.target}</dd>
        </div>
        <div>
          <dt>Capability</dt>
          <dd>{entry.capability}</dd>
        </div>
        <div>
          <dt>Compiler</dt>
          <dd>{entry.compilerVersion}</dd>
        </div>
        <div>
          <dt>PAC hash</dt>
          <dd>{entry.scriptSha256Prefix}…</dd>
        </div>
        <div>
          <dt>ProfileSpec hash</dt>
          <dd>{entry.sourceProfileSpecSha256Prefix}…</dd>
        </div>
        <div>
          <dt>Verification</dt>
          <dd>
            {entry.verification.matchedCount}/{entry.verification.vectorCount} vectors matched
          </dd>
        </div>
        <div>
          <dt>PAC size</dt>
          <dd>{entry.stats.scriptBytes} bytes</dd>
        </div>
        <div>
          <dt>Profiles</dt>
          <dd>{entry.stats.profileCount}</dd>
        </div>
        <div>
          <dt>Endpoints</dt>
          <dd>{entry.stats.endpointCount}</dd>
        </div>
        <div>
          <dt>Conditions</dt>
          <dd>{entry.stats.conditionCount}</dd>
        </div>
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

      {#if !hasRevision(entry)}
        <p role="alert">The source ProfileSpec revision is unavailable; rollback is disabled.</p>
      {:else if confirmingSnapshotId === entry.snapshotId}
        <div
          role="alertdialog"
          aria-labelledby={`rollback-title-${entry.snapshotId}`}
          aria-describedby={`rollback-description-${entry.snapshotId}`}
        >
          <strong id={`rollback-title-${entry.snapshotId}`}>Confirm snapshot rollback</strong>
          <p id={`rollback-description-${entry.snapshotId}`}>
            This immediately switches browser traffic and replaces both Applied and Draft with
            revision {entry.sourceRevisionId}. The operation verifies the archived snapshot and
            restores the current browser state if the workflow commit fails.
          </p>
          <button
            type="button"
            class="danger"
            disabled={disabled || dirty || rollingBackSnapshotId !== undefined}
            on:click={() => rollbackSnapshot(entry.snapshotId)}
            >{rollingBackSnapshotId === entry.snapshotId
              ? 'Rolling back…'
              : 'Confirm rollback'}</button
          >
          <button
            type="button"
            disabled={rollingBackSnapshotId !== undefined}
            on:click={() => (confirmingSnapshotId = undefined)}>Cancel</button
          >
        </div>
      {:else}
        <button
          type="button"
          disabled={disabled || dirty || entry.active || rollingBackSnapshotId !== undefined}
          on:click={() => (confirmingSnapshotId = entry.snapshotId)}
          >{entry.active ? 'Currently active' : 'Rollback to this snapshot'}</button
        >
      {/if}
    </article>
  {/each}
{/if}
