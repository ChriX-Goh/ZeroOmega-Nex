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
  export let onImportAndApply: (
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ) => Promise<boolean>;

  let backupText = '';
  let selectedFileName = '';
  let result: LegacyImportResult | undefined;
  let analyzedGeneration: number | undefined;
  let analyzing = false;
  let accepting = false;
  let errorMessage = '';
  let acceptedMessage = '';

  const statuses: readonly { status: LegacyImportStatus; label: string }[] = [
    { status: 'exact', label: 'Exact' },
    { status: 'target-dependent', label: 'Target-dependent' },
    { status: 'downgraded', label: 'Downgraded' },
    { status: 'preserved', label: 'Preserved' },
    { status: 'ignored-generated', label: 'Regenerated automatically' },
    { status: 'ignored-runtime', label: 'Runtime state ignored' },
    { status: 'rejected', label: 'Unsupported' },
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
    acceptedMessage = '';
    errorMessage = '';
    try {
      result = importZeroOmegaBackup(backupText, {
        createdAt: new Date().toISOString(),
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

  async function chooseFile(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    selectedFileName = file.name;
    backupText = await file.text();
    result = undefined;
    analyzedGeneration = undefined;
    await analyze();
  }

  async function importCandidate(activate: boolean): Promise<void> {
    if (!result?.ok || analyzedGeneration === undefined || accepting || disabled) return;
    accepting = true;
    acceptedMessage = '';
    errorMessage = '';
    try {
      const secretMaterials = result.secretMaterials.map((secret) => ({
        ref: secret.ref,
        value: secret.value,
      }));
      const accepted = activate
        ? await onImportAndApply(analyzedGeneration, result.candidate, secretMaterials)
        : await onAcceptImport(analyzedGeneration, result.candidate, secretMaterials);
      if (!accepted)
        throw new Error(
          activate
            ? 'The imported configuration could not be activated.'
            : 'The imported configuration could not be saved.',
        );
      acceptedMessage = activate
        ? 'Import completed. The original configuration is now active.'
        : 'Import completed without changing the active proxy. Use Apply changes when ready.';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      accepting = false;
    }
  }
</script>

<section class="settings-section import-source">
  <h2>Restore original ZeroOmega / SwitchyOmega backup</h2>
  <p class="section-help">
    Select the backup file exported by the original extension. JSON, base64 backup text, and common
    .bak/.txt files are accepted.
  </p>
  <label class="file-picker">
    <span>Backup file</span>
    <input
      aria-label="Legacy backup file"
      type="file"
      accept=".bak,.json,.txt,application/json,text/plain"
      disabled={disabled || analyzing || accepting}
      on:change={chooseFile}
    />
    {#if selectedFileName}<strong>{selectedFileName}</strong>{/if}
  </label>
  <details>
    <summary>Paste backup text instead</summary>
    <textarea
      aria-label="Legacy backup"
      rows="12"
      placeholder="Paste the complete ZeroOmega / SwitchyOmega backup"
      value={backupText}
      disabled={disabled || analyzing || accepting}
      on:input={(event) => {
        backupText = valueFrom(event);
        selectedFileName = '';
        result = undefined;
        analyzedGeneration = undefined;
        acceptedMessage = '';
      }}></textarea>
    <button
      type="button"
      disabled={disabled || analyzing || accepting || backupText.trim().length === 0}
      on:click={analyze}>{analyzing ? 'Reading backup…' : 'Read backup'}</button
    >
  </details>
</section>

{#if result}
  <section class="settings-section">
    <h2>Compatibility check</h2>
    <dl class="compatibility-summary">
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
        <dt>Credentials</dt>
        <dd>{result.report.containsSecrets ? 'Will be migrated securely' : 'None'}</dd>
      </div>
    </dl>
    <ul class="compatibility-counts" aria-label="Import status totals">
      {#each statuses as entry (entry.status)}<li>
          <span>{entry.label}</span><strong>{summaryCount(result, entry.status)}</strong>
        </li>{/each}
    </ul>
    <details open={!result.ok || result.report.summary.rejected > 0}>
      <summary>Technical migration details ({result.report.items.length})</summary>
      <ol>
        {#each result.report.items as item, index (`${item.code}:${item.sourcePath}:${index}`)}<li>
            <strong>{item.status}</strong> — {item.message}
            <div>{item.sourcePath}{item.targetPath ? ` → ${item.targetPath}` : ''}</div>
          </li>{/each}
      </ol>
    </details>
    {#if result.ok}
      <div class="import-actions">
        <button
          type="button"
          class="primary"
          disabled={disabled || accepting}
          on:click={() => importCandidate(true)}
          >{accepting ? 'Importing…' : 'Import and use now'}</button
        >
        <button
          type="button"
          disabled={disabled || accepting}
          on:click={() => importCandidate(false)}>Import without activating</button
        >
      </div>
    {:else}
      <p role="alert">
        This backup contains unsupported or invalid entries. Open the technical details above.
      </p>
    {/if}
  </section>
{/if}

{#if acceptedMessage}<section class="settings-section">
    <p role="status">{acceptedMessage}</p>
  </section>{/if}
{#if errorMessage}<section class="settings-section">
    <p role="alert">{errorMessage}</p>
  </section>{/if}
