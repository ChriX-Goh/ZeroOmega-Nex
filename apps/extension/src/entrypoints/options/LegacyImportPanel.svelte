<script lang="ts">
  import {
    exportZeroOmegaBackup,
    importZeroOmegaBackup,
    type LegacyExportResult,
    type LegacyImportResult,
    type LegacyImportStatus,
  } from '@zeroomega-nex/legacy-zeroomega';
  import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
  import type { ProfileWorkflowSecretMaterial } from '@zeroomega-nex/profile-workflow';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import {
    downloadOnlineBackup,
    OnlineBackupDownloadError,
    type OnlineBackupDownloadErrorCode,
  } from '../../lib/online-backup-downloader';
  import { uiMessage, uiText, type UiTextKey } from '../../lib/ui-messages';

  export let locale: AppLocale = currentAppLocale();
  export let disabled = false;
  export let generation: number;
  export let deviceId: string;
  export let onPrepareExport: () => Promise<ProfileSpec | undefined>;
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
  let onlineUrl = '';
  let selectedFileName = '';
  let result: LegacyImportResult | undefined;
  let exportResult: LegacyExportResult | undefined;
  let analyzedGeneration: number | undefined;
  let analyzing = false;
  let downloadingOnline = false;
  let accepting = false;
  let exporting = false;
  let errorMessage = '';
  let acceptedMessage = '';
  let onlineMessage = '';
  let exportedMessage = '';

  const statuses: readonly {
    status: LegacyImportStatus;
    labelKey: UiTextKey;
    detailKey: UiTextKey;
  }[] = [
    {
      status: 'exact',
      labelKey: 'legacy.status.exact',
      detailKey: 'legacy.detail.exact',
    },
    {
      status: 'target-dependent',
      labelKey: 'legacy.status.targetDependent',
      detailKey: 'legacy.detail.targetDependent',
    },
    {
      status: 'downgraded',
      labelKey: 'legacy.status.downgraded',
      detailKey: 'legacy.detail.downgraded',
    },
    {
      status: 'preserved',
      labelKey: 'legacy.status.preserved',
      detailKey: 'legacy.detail.preserved',
    },
    {
      status: 'ignored-generated',
      labelKey: 'legacy.status.generated',
      detailKey: 'legacy.detail.generated',
    },
    {
      status: 'ignored-runtime',
      labelKey: 'legacy.status.runtime',
      detailKey: 'legacy.detail.runtime',
    },
    {
      status: 'rejected',
      labelKey: 'legacy.status.unsupported',
      detailKey: 'legacy.detail.unsupported',
    },
  ];

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
  }

  function onlineErrorText(error: unknown): string {
    if (!(error instanceof OnlineBackupDownloadError)) {
      return uiText('legacy.onlineError.network', locale);
    }
    if (error.code === 'response-http-error') {
      return uiMessage('legacy.onlineHttpError', { status: error.httpStatus ?? 0 }, locale);
    }
    if (error.code === 'response-too-large') {
      return uiMessage('legacy.onlineTooLarge', { limitBytes: error.limitBytes ?? 0 }, locale);
    }
    const keys: Record<
      Exclude<OnlineBackupDownloadErrorCode, 'response-http-error' | 'response-too-large'>,
      UiTextKey
    > = {
      'invalid-url': 'legacy.onlineError.invalidUrl',
      'unsupported-protocol': 'legacy.onlineError.unsupportedProtocol',
      'embedded-credentials': 'legacy.onlineError.embeddedCredentials',
      'permission-denied': 'legacy.onlineError.permissionDenied',
      'request-timeout': 'legacy.onlineError.timeout',
      'network-failure': 'legacy.onlineError.network',
      'response-empty': 'legacy.onlineError.empty',
    };
    return uiText(keys[error.code], locale);
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

  function statusEntry(status: LegacyImportStatus) {
    return statuses.find((entry) => entry.status === status) ?? statuses[6]!;
  }

  function encodingText(encoding: LegacyImportResult['report']['encoding']): string {
    if (encoding === 'base64-json') return uiText('legacy.encoding.base64', locale);
    if (encoding === 'object') return uiText('legacy.encoding.object', locale);
    return uiText('legacy.encoding.json', locale);
  }

  function downloadExport(exported: Extract<LegacyExportResult, { readonly ok: true }>): void {
    const blob = new Blob([exported.content], { type: exported.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exported.filename;
    anchor.style.display = 'none';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function exportBackup(): Promise<void> {
    if (exporting || disabled) return;
    exporting = true;
    exportResult = undefined;
    exportedMessage = '';
    errorMessage = '';
    try {
      const spec = await onPrepareExport();
      if (!spec) return;
      const exported = exportZeroOmegaBackup(spec, { createdAt: new Date() });
      exportResult = exported;
      if (!exported.ok) {
        errorMessage = uiText('legacy.exportFailed', locale);
        return;
      }
      downloadExport(exported);
      exportedMessage =
        exported.issues.length === 0
          ? uiText('legacy.exported', locale)
          : uiMessage('legacy.exportedWithWarnings', { count: exported.issues.length }, locale);
    } catch {
      errorMessage = uiText('legacy.exportFailed', locale);
    } finally {
      exporting = false;
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
    } catch {
      result = undefined;
      analyzedGeneration = undefined;
      errorMessage = uiText('legacy.readFailed', locale);
    } finally {
      analyzing = false;
    }
  }

  async function restoreOnline(): Promise<void> {
    if (downloadingOnline || disabled || !onlineUrl.trim()) return;
    downloadingOnline = true;
    onlineMessage = '';
    acceptedMessage = '';
    errorMessage = '';
    try {
      const downloaded = await downloadOnlineBackup(onlineUrl);
      backupText = downloaded.content;
      selectedFileName = '';
      result = undefined;
      analyzedGeneration = undefined;
      await analyze();
      if (result !== undefined) onlineMessage = uiText('legacy.onlineDownloaded', locale);
    } catch (error) {
      errorMessage = onlineErrorText(error);
    } finally {
      downloadingOnline = false;
    }
  }

  async function chooseFile(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    errorMessage = '';
    try {
      selectedFileName = file.name;
      backupText = await file.text();
      result = undefined;
      analyzedGeneration = undefined;
      await analyze();
    } catch {
      selectedFileName = '';
      backupText = '';
      result = undefined;
      analyzedGeneration = undefined;
      errorMessage = uiText('legacy.readFailed', locale);
    }
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
      if (!accepted) {
        errorMessage = uiText(activate ? 'legacy.activateFailed' : 'legacy.saveFailed', locale);
        return;
      }
      acceptedMessage = uiText(activate ? 'legacy.importActivated' : 'legacy.importSaved', locale);
    } catch {
      errorMessage = uiText(activate ? 'legacy.activateFailed' : 'legacy.saveFailed', locale);
    } finally {
      accepting = false;
    }
  }
</script>

<section
  class="settings-section"
  data-legacy-import-panel
  data-legacy-export-section
  data-typed-locale={locale}
>
  <h2>{uiText('legacy.exportTitle', locale)}</h2>
  <p class="section-help">{uiText('legacy.exportHelp', locale)}</p>
  <button
    type="button"
    class="primary"
    data-legacy-export
    aria-label={uiText('legacy.exportAria', locale)}
    disabled={disabled || exporting}
    onclick={() => void exportBackup()}
  >
    {uiText(exporting ? 'legacy.preparing' : 'legacy.exportAction', locale)}
  </button>
  {#if exportResult?.ok && exportResult.issues.length > 0}
    <details data-legacy-export-warnings>
      <summary
        >{uiMessage(
          'legacy.compatibilityWarnings',
          { count: exportResult.issues.length },
          locale,
        )}</summary
      >
      <ol>
        {#each exportResult.issues as item, index (`${item.code}:${item.path}:${index}`)}
          <li>
            <strong><code>{item.code}</code></strong> — {uiText(
              'legacy.exportWarningDetail',
              locale,
            )}
            <div><code>{item.path}</code></div>
          </li>
        {/each}
      </ol>
    </details>
  {/if}
  {#if exportedMessage}<p role="status">{exportedMessage}</p>{/if}
</section>

<section
  class="settings-section import-source"
  data-legacy-import-source
  data-typed-locale={locale}
>
  <h2>{uiText('legacy.restoreTitle', locale)}</h2>
  <p class="section-help">{uiText('legacy.restoreHelp', locale)}</p>
  <div class="online-restore" data-legacy-online-restore>
    <h3>{uiText('legacy.onlineTitle', locale)}</h3>
    <div class="inline-fields">
      <label>
        {uiText('legacy.onlineUrl', locale)}
        <input
          type="url"
          data-legacy-online-url
          aria-label={uiText('legacy.onlineUrl', locale)}
          placeholder="https://example.com/options.bak"
          value={onlineUrl}
          disabled={disabled || downloadingOnline || analyzing || accepting}
          oninput={(event) => {
            onlineUrl = valueFrom(event);
            onlineMessage = '';
            errorMessage = '';
          }}
        />
      </label>
      <button
        type="button"
        data-legacy-online-download
        disabled={disabled || downloadingOnline || analyzing || accepting || !onlineUrl.trim()}
        onclick={() => void restoreOnline()}
        >{uiText(
          downloadingOnline ? 'legacy.onlineDownloading' : 'legacy.onlineRestore',
          locale,
        )}</button
      >
    </div>
    <p class="section-help">{uiText('legacy.onlineHelp', locale)}</p>
    {#if onlineMessage}<p role="status" data-legacy-online-status>{onlineMessage}</p>{/if}
  </div>
  <label class="file-picker">
    <span>{uiText('legacy.backupFile', locale)}</span>
    <input
      aria-label={uiText('legacy.backupFileAria', locale)}
      type="file"
      accept=".bak,.json,.txt,application/json,text/plain"
      disabled={disabled || downloadingOnline || analyzing || accepting}
      onchange={chooseFile}
    />
    {#if selectedFileName}<strong>{selectedFileName}</strong>{/if}
  </label>
  <details>
    <summary>{uiText('legacy.pasteInstead', locale)}</summary>
    <textarea
      aria-label={uiText('legacy.backupTextAria', locale)}
      rows="12"
      placeholder={uiText('legacy.backupPlaceholder', locale)}
      value={backupText}
      disabled={disabled || downloadingOnline || analyzing || accepting}
      oninput={(event) => {
        backupText = valueFrom(event);
        selectedFileName = '';
        result = undefined;
        analyzedGeneration = undefined;
        acceptedMessage = '';
        errorMessage = '';
      }}></textarea>
    <button
      type="button"
      disabled={disabled || analyzing || accepting || backupText.trim().length === 0}
      onclick={() => void analyze()}
      >{uiText(analyzing ? 'legacy.reading' : 'legacy.read', locale)}</button
    >
  </details>
</section>

{#if result}
  <section class="settings-section" data-legacy-import-review data-typed-locale={locale}>
    <h2>{uiText('legacy.compatibilityTitle', locale)}</h2>
    <dl class="compatibility-summary">
      <div>
        <dt>{uiText('legacy.encoding', locale)}</dt>
        <dd>{encodingText(result.report.encoding)}</dd>
      </div>
      <div>
        <dt>{uiText('legacy.profiles', locale)}</dt>
        <dd>{result.report.profileCount}</dd>
      </div>
      <div>
        <dt>{uiText('legacy.endpoints', locale)}</dt>
        <dd>{result.report.endpointCount}</dd>
      </div>
      <div>
        <dt>{uiText('legacy.ruleSources', locale)}</dt>
        <dd>{result.report.ruleSourceCount}</dd>
      </div>
      <div>
        <dt>{uiText('legacy.credentials', locale)}</dt>
        <dd>
          {uiText(
            result.report.containsSecrets ? 'legacy.credentialsSecure' : 'legacy.credentialsNone',
            locale,
          )}
        </dd>
      </div>
    </dl>
    {#if result.report.containsSecrets}
      <p class="section-help" data-legacy-secret-notice>{uiText('legacy.secretNotice', locale)}</p>
    {/if}
    <ul
      class="compatibility-counts"
      aria-label={uiText('legacy.statusTotalsAria', locale)}
      data-legacy-status-counts
    >
      {#each statuses as entry (entry.status)}
        <li data-legacy-status={entry.status}>
          <span>{uiText(entry.labelKey, locale)}</span><strong
            >{summaryCount(result, entry.status)}</strong
          >
        </li>
      {/each}
    </ul>
    <details open={!result.ok || result.report.summary.rejected > 0}>
      <summary
        >{uiMessage(
          'legacy.technicalDetails',
          { count: result.report.items.length },
          locale,
        )}</summary
      >
      <p class="section-help">{uiText('legacy.technicalHelp', locale)}</p>
      <ol data-legacy-technical-details>
        {#each result.report.items as item, index (`${item.code}:${item.sourcePath}:${index}`)}
          {@const entry = statusEntry(item.status)}
          <li>
            <strong>{uiText(entry.labelKey, locale)}</strong> — <code>{item.code}</code>
            <p>{uiText(entry.detailKey, locale)}</p>
            <div>
              <code>{item.sourcePath}{item.targetPath ? ` → ${item.targetPath}` : ''}</code>
            </div>
          </li>
        {/each}
      </ol>
    </details>
    {#if result.ok}
      <div class="import-actions">
        <button
          type="button"
          class="primary"
          data-legacy-import-and-use
          disabled={disabled || accepting}
          onclick={() => void importCandidate(true)}
          >{uiText(accepting ? 'legacy.importing' : 'legacy.importAndUse', locale)}</button
        >
        <button
          type="button"
          data-legacy-import-inactive
          disabled={disabled || accepting}
          onclick={() => void importCandidate(false)}
          >{uiText('legacy.importInactive', locale)}</button
        >
      </div>
    {:else}
      <p role="alert">{uiText('legacy.unsupportedAlert', locale)}</p>
    {/if}
  </section>
{/if}

{#if acceptedMessage}<section class="settings-section" data-typed-locale={locale}>
    <p role="status">{acceptedMessage}</p>
  </section>{/if}
{#if errorMessage}<section class="settings-section" data-typed-locale={locale}>
    <p role="alert">{errorMessage}</p>
  </section>{/if}
