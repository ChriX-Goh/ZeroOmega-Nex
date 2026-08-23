<script lang="ts">
  import type {
    ProfileWorkflowCommandResponse,
    ProfileWorkflowRevisionHistoryEntry,
    ProfileWorkflowSnapshotHistoryEntry,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiMessage, uiText } from '../../lib/ui-messages';
  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';

  export let locale: AppLocale = currentAppLocale();
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
    if (route.kind === 'direct') return uiText('route.direct', locale);
    if (route.kind === 'system') return uiText('route.system', locale);
    return uiMessage('history.profileRoute', { profileId: route.profileId }, locale);
  }

  function dateLabel(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const languageTag = locale === 'zh-CN' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : 'en-US';
    return date.toLocaleString(languageTag);
  }

  function hasRevision(entry: ProfileWorkflowSnapshotHistoryEntry): boolean {
    return revisions.some((revision) => revision.revisionId === entry.sourceRevisionId);
  }

  function verificationModeLabel(entry: ProfileWorkflowSnapshotHistoryEntry): string {
    if (entry.verification.mode === 'differential') {
      return uiText('history.verificationDifferential', locale);
    }
    if (entry.verification.mode === 'reference-safety') {
      return uiText('history.verificationReferenceSafety', locale);
    }
    return uiText('history.verificationLegacy', locale);
  }

  function acceptResponse(response: ProfileWorkflowCommandResponse): void {
    if (!response.ok) {
      errorMessage = uiText('history.loadFailed', locale);
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
    } catch {
      errorMessage = uiText('history.loadFailed', locale);
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
        errorMessage = uiText('history.rollbackFailed', locale);
        return;
      }
      confirmingSnapshotId = undefined;
      await loadHistory();
    } catch {
      errorMessage = uiText('history.rollbackFailed', locale);
    } finally {
      rollingBackSnapshotId = undefined;
    }
  }

  onMount(() => {
    void loadHistory();
  });
</script>

<div data-snapshot-history-panel data-typed-locale={locale}>
  <section class="settings-section">
    <div>
      <h2>{uiText('history.configurationHistory', locale)}</h2>
      <p class="section-help">{uiText('history.configurationHelp', locale)}</p>
    </div>
    <button type="button" disabled={disabled || loading} onclick={() => void loadHistory()}>
      {loading ? uiText('history.refreshing', locale) : uiText('history.refresh', locale)}
    </button>
  </section>

  {#if dirty}
    <section class="settings-section">
      <p role="alert">{uiText('history.dirtyDraft', locale)}</p>
    </section>
  {/if}

  {#if errorMessage}
    <section class="settings-section">
      <p role="alert">{errorMessage}</p>
    </section>
  {:else if loading && snapshots.length === 0 && revisions.length === 0}
    <section class="settings-section">
      <p role="status">{uiText('history.loading', locale)}</p>
    </section>
  {:else}
    <section class="settings-section">
      <h2>{uiText('history.revisions', locale)}</h2>
      {#if revisions.length === 0}
        <p>{uiText('history.noRevisions', locale)}</p>
      {:else}
        <ol aria-label={uiText('history.revisionHistoryAria', locale)}>
          {#each revisions as revision (revision.revisionId)}
            <li>
              <header>
                <div>
                  <strong>{dateLabel(revision.createdAt)}</strong>
                  <div>{revision.revisionId}</div>
                </div>
                {#if revision.applied}<strong>{uiText('history.applied', locale)}</strong>{/if}
              </header>
              <dl>
                {#if revision.parentRevisionId}
                  <div>
                    <dt>{uiText('history.parent', locale)}</dt>
                    <dd>{revision.parentRevisionId}</dd>
                  </div>
                {/if}
                {#if revision.deviceId}
                  <div>
                    <dt>{uiText('history.device', locale)}</dt>
                    <dd>{revision.deviceId}</dd>
                  </div>
                {/if}
                <div>
                  <dt>{uiText('history.profiles', locale)}</dt>
                  <dd>{revision.profileCount}</dd>
                </div>
                <div>
                  <dt>{uiText('history.endpoints', locale)}</dt>
                  <dd>{revision.endpointCount}</dd>
                </div>
                <div>
                  <dt>{uiText('history.ruleSources', locale)}</dt>
                  <dd>{revision.ruleSourceCount}</dd>
                </div>
              </dl>
            </li>
          {/each}
        </ol>
      {/if}
    </section>

    <section class="settings-section">
      <h2>{uiText('history.snapshots', locale)}</h2>
      {#if snapshots.length === 0}
        <p>{uiText('history.noSnapshots', locale)}</p>
      {/if}
    </section>

    {#each snapshots as entry (entry.snapshotId)}
      <article
        class="settings-section"
        data-snapshot-history-entry={entry.snapshotId}
        data-snapshot-active={entry.active}
      >
        <header>
          <div>
            <h2>{dateLabel(entry.createdAt)}</h2>
            <p class="section-help">
              {uiMessage('history.snapshotLabel', { snapshotId: entry.snapshotId }, locale)}
            </p>
          </div>
          <div aria-label={uiText('history.snapshotStatusAria', locale)}>
            {#if entry.active}<strong>{uiText('history.active', locale)}</strong>{/if}
            {#if entry.lastKnownGood}<strong>{uiText('history.lastKnownGood', locale)}</strong>{/if}
          </div>
        </header>

        <dl>
          <div>
            <dt>{uiText('history.sourceRevision', locale)}</dt>
            <dd>{entry.sourceRevisionId}</dd>
          </div>
          <div>
            <dt>{uiText('history.startRoute', locale)}</dt>
            <dd>{routeLabel(entry)}</dd>
          </div>
          <div>
            <dt>{uiText('history.browserTarget', locale)}</dt>
            <dd>{entry.target}</dd>
          </div>
          <div>
            <dt>{uiText('history.capability', locale)}</dt>
            <dd>{entry.capability}</dd>
          </div>
          <div>
            <dt>{uiText('history.compiler', locale)}</dt>
            <dd>{entry.compilerVersion}</dd>
          </div>
          <div>
            <dt>{uiText('history.pacHash', locale)}</dt>
            <dd>{entry.scriptSha256Prefix}…</dd>
          </div>
          <div>
            <dt>{uiText('history.profileSpecHash', locale)}</dt>
            <dd>{entry.sourceProfileSpecSha256Prefix}…</dd>
          </div>
          <div>
            <dt>{uiText('history.verificationMode', locale)}</dt>
            <dd>{verificationModeLabel(entry)}</dd>
          </div>
          <div>
            <dt>{uiText('history.verificationVectors', locale)}</dt>
            <dd>
              {uiMessage(
                'history.vectorMatch',
                {
                  matchedCount: entry.verification.matchedCount,
                  vectorCount: entry.verification.vectorCount,
                },
                locale,
              )}
            </dd>
          </div>
          <div>
            <dt>{uiText('history.pacSize', locale)}</dt>
            <dd>{entry.stats.scriptBytes} {uiText('history.bytes', locale)}</dd>
          </div>
          <div>
            <dt>{uiText('history.profiles', locale)}</dt>
            <dd>{entry.stats.profileCount}</dd>
          </div>
          <div>
            <dt>{uiText('history.endpoints', locale)}</dt>
            <dd>{entry.stats.endpointCount}</dd>
          </div>
          <div>
            <dt>{uiText('history.conditions', locale)}</dt>
            <dd>{entry.stats.conditionCount}</dd>
          </div>
        </dl>

        {#if entry.warnings.length > 0}
          <details>
            <summary>
              {uiMessage('history.warningCount', { count: entry.warnings.length }, locale)}
            </summary>
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
          <p role="alert">{uiText('history.sourceUnavailable', locale)}</p>
        {:else if confirmingSnapshotId === entry.snapshotId}
          <div
            role="alertdialog"
            data-snapshot-rollback-dialog={entry.snapshotId}
            aria-labelledby={`rollback-title-${entry.snapshotId}`}
            aria-describedby={`rollback-description-${entry.snapshotId}`}
          >
            <strong id={`rollback-title-${entry.snapshotId}`}>
              {uiText('history.confirmTitle', locale)}
            </strong>
            <p id={`rollback-description-${entry.snapshotId}`}>
              {uiMessage(
                'history.rollbackDescription',
                { revisionId: entry.sourceRevisionId },
                locale,
              )}
            </p>
            <button
              type="button"
              class="danger"
              data-snapshot-rollback-confirm={entry.snapshotId}
              disabled={disabled || dirty || rollingBackSnapshotId !== undefined}
              onclick={() => void rollbackSnapshot(entry.snapshotId)}
            >
              {rollingBackSnapshotId === entry.snapshotId
                ? uiText('history.rollingBack', locale)
                : uiText('history.confirmRollback', locale)}
            </button>
            <button
              type="button"
              disabled={rollingBackSnapshotId !== undefined}
              onclick={() => (confirmingSnapshotId = undefined)}
            >
              {uiText('common.cancel', locale)}
            </button>
          </div>
        {:else}
          <button
            type="button"
            data-snapshot-rollback-request={entry.snapshotId}
            disabled={disabled || dirty || entry.active || rollingBackSnapshotId !== undefined}
            onclick={() => (confirmingSnapshotId = entry.snapshotId)}
          >
            {entry.active
              ? uiText('history.currentlyActive', locale)
              : uiText('history.rollbackToSnapshot', locale)}
          </button>
        {/if}
      </article>
    {/each}
  {/if}
</div>
