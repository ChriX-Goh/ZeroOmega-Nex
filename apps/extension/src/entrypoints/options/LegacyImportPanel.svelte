<script lang="ts">
  import {
    importZeroOmegaBackup,
    type LegacyImportResult,
    type LegacyImportStatus,
  } from '@zeroomega-nex/legacy-zeroomega';
  import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
  import type { ProfileWorkflowSecretMaterial } from '@zeroomega-nex/profile-workflow';

  export let disabled = false;
  export let generation: number;
  export let deviceId: string;
  export let onAcceptImport: (
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ) => Promise<boolean>;

  let backupText = '';
  let result: LegacyImportResult | undefined;
  let analyzedGeneration: number | undefined;
  let analyzing = false;
  let accepting = false;
  let errorMessage = '';
  let accepted = false;

  const statuses: readonly { status: LegacyImportStatus; label: string }[] = [
    { status: 'exact', label: 'Exact' },
    { status: 'target-dependent', label: 'Target-dependent' },
    { status: 'downgraded', label: 'Downgraded' },
    { status: 'preserved', label: 'Preserved' },
    { status: 'ignored-generated', label: 'Ignored generated data' },
    { status: 'ignored-runtime', label: 'Ignored runtime state' },
    { status: 'rejected', label: 'Rejected' },
  ];

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLTextAreaElement).value;
  }

  function summaryCount(importResult: LegacyImportResult, status: LegacyImportStatus): number {
    const summary = importResult.report.summary;
    switch (status) {
      case 'exact':
        return summary.exact;
      case 'target-dependent':
        return summary.targetDependent;
      case 'downgraded':
        return summary.downgraded;
      case 'preserved':
        return summary.preserved;
      case 'ignored-generated':
        return summary.ignoredGenerated;
      case 'ignored-runtime':
        return summary.ignoredRuntime;
      case 'rejected':
        return summary.rejected;
    }
  }

  async function analyze(): Promise<void> {
    if (analyzing || disabled) return;
    analyzing = true;
    accepted = false;
    errorMessage = '';
    try {
      const createdAt = new Date().toISOString();
      result = importZeroOmegaBackup(backupText, {
        createdAt,
        documentId: `document-${crypto.randomUUID()}`,
        revisionId: `revision-${crypto.randomUUID()}`,
        deviceId,
      });
      analyzedGeneration = generation;
    } catch (error) {
      result = undefined;
      analyzedGeneration = undefined;
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      analyzing = false;
    }
  }

  async function acceptCandidate(): Promise<void> {
    if (!result?.ok || analyzedGeneration === undefined || accepting || disabled) return;
    accepting = true;
    accepted = false;
    errorMessage = '';
    try {
      const acceptedImport = await onAcceptImport(
        analyzedGeneration,
        result.candidate,
        result.secretMaterials.map((secret) => ({ ref: secret.ref, value: secret.value })),
      );
      if (!acceptedImport) {
        throw new Error('The imported candidate could not replace the current Draft.');
      }
      accepted = true;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      accepting = false;
    }
  }
</script>

<section class="settings-section">
  <h2>Import ZeroOmega / SwitchyOmega backup</h2>
  <p class="section-help">
    Paste schema-version-2 JSON or base64 JSON. Analysis never changes the active browser proxy
    state. Accepting imports an inactive Draft candidate; Apply remains a separate verified action.
  </p>
  <textarea
    aria-label="Legacy backup"
    rows="14"
    placeholder="Paste schema-version-2 JSON or base64 JSON"
    value={backupText}
    disabled={disabled || analyzing || accepting}
    on:input={(event) => {
      backupText = valueFrom(event);
      result = undefined;
      analyzedGeneration = undefined;
      accepted = false;
    }}></textarea>
  <button
    type="button"
    disabled={disabled || analyzing || accepting || backupText.trim().length === 0}
    on:click={analyze}>{analyzing ? 'Analyzing…' : 'Analyze backup'}</button
  >
</section>

{#if result}
  <section class="settings-section">
    <h2>Compatibility report</h2>
    <dl>
      <div>
        <dt>Encoding</dt>
        <dd>{result.report.encoding}</dd>
      </div>
      <div>
        <dt>Profiles</dt>
        <dd>{result.report.profileCount}</dd>
      </div>
      <div>
        <dt>Proxy endpoints</dt>
        <dd>{result.report.endpointCount}</dd>
      </div>
      <div>
        <dt>Rule sources</dt>
        <dd>{result.report.ruleSourceCount}</dd>
      </div>
      <div>
        <dt>Contains secrets</dt>
        <dd>{result.report.containsSecrets ? 'Yes' : 'No'}</dd>
      </div>
    </dl>

    <ul aria-label="Import status totals">
      {#each statuses as entry (entry.status)}
        <li>{entry.label}: {summaryCount(result, entry.status)}</li>
      {/each}
    </ul>

    <details open={!result.ok || result.report.summary.rejected > 0}>
      <summary>Migration details ({result.report.items.length})</summary>
      <ol>
        {#each result.report.items as item, index (`${item.code}:${item.sourcePath}:${index}`)}
          <li>
            <strong>{item.status}</strong> — {item.message}
            <div>{item.sourcePath}{item.targetPath ? ` → ${item.targetPath}` : ''}</div>
          </li>
        {/each}
      </ol>
    </details>

    {#if result.ok && result.secretMaterials.length > 0}
      <details>
        <summary>Extracted secret destinations ({result.secretMaterials.length})</summary>
        <ul>
          {#each result.secretMaterials as secret (secret.ref)}
            <li>
              <strong>{secret.kind}</strong> — {secret.sourcePath}
              {#if secret.username}<span> · username: {secret.username}</span>{/if}
              {#if secret.headerName}<span> · header: {secret.headerName}</span>{/if}
              <div>Secret reference: {secret.ref}</div>
            </li>
          {/each}
        </ul>
        <p>Secret values are stored separately and are never rendered here.</p>
      </details>
    {/if}

    {#if result.ok}
      <button type="button" disabled={disabled || accepting} on:click={acceptCandidate}
        >{accepting ? 'Importing…' : 'Accept as Draft candidate'}</button
      >
      {#if accepted}
        <p role="status">
          Imported into Draft. Review profiles, then use Apply changes separately.
        </p>
      {/if}
    {:else}
      <p role="alert">The backup cannot produce an activatable candidate.</p>
    {/if}
  </section>
{/if}

{#if errorMessage}
  <section class="settings-section">
    <p role="alert">{errorMessage}</p>
  </section>
{/if}
