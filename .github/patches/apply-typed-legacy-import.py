from pathlib import Path


def replace_once(pathname: str, old: str, new: str) -> None:
    path = Path(pathname)
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{pathname}: expected one anchor, found {count}: {old[:120]!r}')
    path.write_text(text.replace(old, new, 1))


legacy_panel = r'''<script lang="ts">
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
  let selectedFileName = '';
  let result: LegacyImportResult | undefined;
  let exportResult: LegacyExportResult | undefined;
  let analyzedGeneration: number | undefined;
  let analyzing = false;
  let accepting = false;
  let exporting = false;
  let errorMessage = '';
  let acceptedMessage = '';
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
      <summary>{uiMessage('legacy.compatibilityWarnings', { count: exportResult.issues.length }, locale)}</summary>
      <ol>
        {#each exportResult.issues as item, index (`${item.code}:${item.path}:${index}`)}
          <li>
            <strong><code>{item.code}</code></strong> — {uiText('legacy.exportWarningDetail', locale)}
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
  <label class="file-picker">
    <span>{uiText('legacy.backupFile', locale)}</span>
    <input
      aria-label={uiText('legacy.backupFileAria', locale)}
      type="file"
      accept=".bak,.json,.txt,application/json,text/plain"
      disabled={disabled || analyzing || accepting}
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
      disabled={disabled || analyzing || accepting}
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
      onclick={() => void analyze()}>{uiText(analyzing ? 'legacy.reading' : 'legacy.read', locale)}</button
    >
  </details>
</section>

{#if result}
  <section
    class="settings-section"
    data-legacy-import-review
    data-typed-locale={locale}
  >
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
        <dd>{uiText(result.report.containsSecrets ? 'legacy.credentialsSecure' : 'legacy.credentialsNone', locale)}</dd>
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
          <span>{uiText(entry.labelKey, locale)}</span><strong>{summaryCount(result, entry.status)}</strong>
        </li>
      {/each}
    </ul>
    <details open={!result.ok || result.report.summary.rejected > 0}>
      <summary>{uiMessage('legacy.technicalDetails', { count: result.report.items.length }, locale)}</summary>
      <p class="section-help">{uiText('legacy.technicalHelp', locale)}</p>
      <ol data-legacy-technical-details>
        {#each result.report.items as item, index (`${item.code}:${item.sourcePath}:${index}`)}
          {@const entry = statusEntry(item.status)}
          <li>
            <strong>{uiText(entry.labelKey, locale)}</strong> — <code>{item.code}</code>
            <p>{uiText(entry.detailKey, locale)}</p>
            <div><code>{item.sourcePath}{item.targetPath ? ` → ${item.targetPath}` : ''}</code></div>
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
          onclick={() => void importCandidate(false)}>{uiText('legacy.importInactive', locale)}</button
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
'''
Path('apps/extension/src/entrypoints/options/LegacyImportPanel.svelte').write_text(legacy_panel)

catalog_block = r'''  'legacy.pageTitle': { en: 'Import / Export', 'zh-CN': '导入 / 导出', 'zh-TW': '匯入 / 匯出' },
  'legacy.pageHelp': {
    en: 'Move from original ZeroOmega or SwitchyOmega without rebuilding profiles.',
    'zh-CN': '无需重新创建情景模式，即可从原版 ZeroOmega 或 SwitchyOmega 迁移。',
    'zh-TW': '無需重新建立情境模式，即可從原版 ZeroOmega 或 SwitchyOmega 移轉。',
  },
  'legacy.exportTitle': { en: 'Export options', 'zh-CN': '导出选项', 'zh-TW': '匯出選項' },
  'legacy.exportHelp': {
    en: 'Download an original-compatible schema-v2 .bak file. Current editor changes are applied first, matching the original extension. Passwords and sensitive request headers are never included.',
    'zh-CN': '下载兼容原版的 schema-v2 .bak 文件。与原版扩展一致，当前编辑器更改会先应用；密码和敏感请求头绝不会写入备份。',
    'zh-TW': '下載相容原版的 schema-v2 .bak 檔案。與原版擴充功能一致，目前編輯器變更會先套用；密碼與敏感請求標頭絕不會寫入備份。',
  },
  'legacy.exportAria': { en: 'Export options backup', 'zh-CN': '导出选项备份', 'zh-TW': '匯出選項備份' },
  'legacy.preparing': { en: 'Preparing backup…', 'zh-CN': '正在准备备份…', 'zh-TW': '正在準備備份…' },
  'legacy.exportAction': { en: 'Export options', 'zh-CN': '导出选项', 'zh-TW': '匯出選項' },
  'legacy.exported': { en: 'Backup exported.', 'zh-CN': '备份已导出。', 'zh-TW': '備份已匯出。' },
  'legacy.exportFailed': {
    en: 'The options backup could not be exported.',
    'zh-CN': '无法导出选项备份。',
    'zh-TW': '無法匯出選項備份。',
  },
  'legacy.exportWarningDetail': {
    en: 'This compatibility or secret-safety item was omitted from the backup.',
    'zh-CN': '为确保兼容性或秘密安全，此项目未写入备份。',
    'zh-TW': '為確保相容性或秘密安全，此項目未寫入備份。',
  },
  'legacy.restoreTitle': {
    en: 'Restore original ZeroOmega / SwitchyOmega backup',
    'zh-CN': '恢复原版 ZeroOmega / SwitchyOmega 备份',
    'zh-TW': '還原原版 ZeroOmega / SwitchyOmega 備份',
  },
  'legacy.restoreHelp': {
    en: 'Select the backup file exported by the original extension. JSON, base64 backup text, and common .bak/.txt files are accepted.',
    'zh-CN': '请选择原版扩展导出的备份文件。支持 JSON、Base64 备份文本以及常见的 .bak/.txt 文件。',
    'zh-TW': '請選擇原版擴充功能匯出的備份檔案。支援 JSON、Base64 備份文字及常見的 .bak/.txt 檔案。',
  },
  'legacy.backupFile': { en: 'Backup file', 'zh-CN': '备份文件', 'zh-TW': '備份檔案' },
  'legacy.backupFileAria': { en: 'Legacy backup file', 'zh-CN': '原版备份文件', 'zh-TW': '原版備份檔案' },
  'legacy.pasteInstead': { en: 'Paste backup text instead', 'zh-CN': '改为粘贴备份文本', 'zh-TW': '改為貼上備份文字' },
  'legacy.backupTextAria': { en: 'Legacy backup', 'zh-CN': '原版备份', 'zh-TW': '原版備份' },
  'legacy.backupPlaceholder': {
    en: 'Paste the complete ZeroOmega / SwitchyOmega backup',
    'zh-CN': '粘贴完整的 ZeroOmega / SwitchyOmega 备份',
    'zh-TW': '貼上完整的 ZeroOmega / SwitchyOmega 備份',
  },
  'legacy.reading': { en: 'Reading backup…', 'zh-CN': '正在读取备份…', 'zh-TW': '正在讀取備份…' },
  'legacy.read': { en: 'Read backup', 'zh-CN': '读取备份', 'zh-TW': '讀取備份' },
  'legacy.readFailed': {
    en: 'The selected backup could not be read or decoded.',
    'zh-CN': '无法读取或解析所选备份。',
    'zh-TW': '無法讀取或解析所選備份。',
  },
  'legacy.compatibilityTitle': { en: 'Compatibility check', 'zh-CN': '兼容性检查', 'zh-TW': '相容性檢查' },
  'legacy.encoding': { en: 'Encoding', 'zh-CN': '编码', 'zh-TW': '編碼' },
  'legacy.encoding.json': { en: 'JSON', 'zh-CN': 'JSON', 'zh-TW': 'JSON' },
  'legacy.encoding.base64': { en: 'Base64 JSON', 'zh-CN': 'Base64 JSON', 'zh-TW': 'Base64 JSON' },
  'legacy.encoding.object': { en: 'Object', 'zh-CN': '对象', 'zh-TW': '物件' },
  'legacy.profiles': { en: 'Profiles', 'zh-CN': '情景模式', 'zh-TW': '情境模式' },
  'legacy.endpoints': { en: 'Proxy endpoints', 'zh-CN': '代理服务器', 'zh-TW': '代理伺服器' },
  'legacy.ruleSources': { en: 'Rule sources', 'zh-CN': '规则来源', 'zh-TW': '規則來源' },
  'legacy.credentials': { en: 'Credentials', 'zh-CN': '凭据', 'zh-TW': '憑證' },
  'legacy.credentialsSecure': { en: 'Will be migrated securely', 'zh-CN': '将安全迁移', 'zh-TW': '將安全移轉' },
  'legacy.credentialsNone': { en: 'None', 'zh-CN': '无', 'zh-TW': '無' },
  'legacy.secretNotice': {
    en: 'Passwords, sensitive request headers, and sync credentials are extracted into background-owned secret storage and never enter ProfileSpec, reports, logs, or ordinary exports.',
    'zh-CN': '密码、敏感请求头和同步凭据会被抽离到后台管理的秘密存储中，绝不会进入 ProfileSpec、报告、日志或普通导出文件。',
    'zh-TW': '密碼、敏感請求標頭與同步憑證會被抽離到背景管理的秘密儲存中，絕不會進入 ProfileSpec、報告、記錄或一般匯出檔案。',
  },
  'legacy.statusTotalsAria': { en: 'Import status totals', 'zh-CN': '导入状态统计', 'zh-TW': '匯入狀態統計' },
  'legacy.status.exact': { en: 'Exact', 'zh-CN': '完全兼容', 'zh-TW': '完全相容' },
  'legacy.status.targetDependent': { en: 'Target-dependent', 'zh-CN': '取决于浏览器', 'zh-TW': '視瀏覽器而定' },
  'legacy.status.downgraded': { en: 'Downgraded', 'zh-CN': '降级处理', 'zh-TW': '降級處理' },
  'legacy.status.preserved': { en: 'Preserved', 'zh-CN': '已保留', 'zh-TW': '已保留' },
  'legacy.status.generated': { en: 'Regenerated automatically', 'zh-CN': '将自动重新生成', 'zh-TW': '將自動重新產生' },
  'legacy.status.runtime': { en: 'Runtime state ignored', 'zh-CN': '已忽略运行状态', 'zh-TW': '已忽略執行狀態' },
  'legacy.status.unsupported': { en: 'Unsupported', 'zh-CN': '不支持', 'zh-TW': '不支援' },
  'legacy.detail.exact': {
    en: 'Imported without a semantic change.',
    'zh-CN': '已按原语义导入。',
    'zh-TW': '已依原語意匯入。',
  },
  'legacy.detail.targetDependent': {
    en: 'Behavior depends on browser capability and remains explicitly marked.',
    'zh-CN': '行为取决于浏览器能力，并保留明确标记。',
    'zh-TW': '行為取決於瀏覽器能力，並保留明確標記。',
  },
  'legacy.detail.downgraded': {
    en: 'Imported through a documented compatibility fallback.',
    'zh-CN': '已通过明确记录的兼容后备方式导入。',
    'zh-TW': '已透過明確記錄的相容後備方式匯入。',
  },
  'legacy.detail.preserved': {
    en: 'Preserved as safe legacy metadata.',
    'zh-CN': '已作为安全的原版元数据保留。',
    'zh-TW': '已作為安全的原版中繼資料保留。',
  },
  'legacy.detail.generated': {
    en: 'Generated data is omitted and will be rebuilt.',
    'zh-CN': '生成数据已省略，并会自动重新生成。',
    'zh-TW': '產生的資料已省略，並會自動重新產生。',
  },
  'legacy.detail.runtime': {
    en: 'Device or session runtime state is not part of the imported configuration.',
    'zh-CN': '设备或会话运行状态不属于导入配置。',
    'zh-TW': '裝置或工作階段執行狀態不屬於匯入設定。',
  },
  'legacy.detail.unsupported': {
    en: 'This item cannot be activated safely.',
    'zh-CN': '此项目无法安全启用。',
    'zh-TW': '此項目無法安全啟用。',
  },
  'legacy.technicalHelp': {
    en: 'Stable machine codes and source/target paths are shown instead of backend exception text.',
    'zh-CN': '此处显示稳定机器代码和源/目标路径，不直接呈现后台异常文本。',
    'zh-TW': '此處顯示穩定機器代碼與來源/目標路徑，不直接呈現背景例外文字。',
  },
  'legacy.importing': { en: 'Importing…', 'zh-CN': '正在导入…', 'zh-TW': '正在匯入…' },
  'legacy.importAndUse': { en: 'Import and use now', 'zh-CN': '导入并立即使用', 'zh-TW': '匯入並立即使用' },
  'legacy.importInactive': { en: 'Import without activating', 'zh-CN': '只导入，暂不启用', 'zh-TW': '僅匯入，暫不啟用' },
  'legacy.importActivated': {
    en: 'Import completed. The original configuration is now active.',
    'zh-CN': '导入完成，原版配置现已启用。',
    'zh-TW': '匯入完成，原版設定現已啟用。',
  },
  'legacy.importSaved': {
    en: 'Import completed without changing the active proxy. Use Apply changes when ready.',
    'zh-CN': '导入完成，但未改变当前代理。确认后请点击“应用选项”。',
    'zh-TW': '匯入完成，但未變更目前代理。確認後請按「套用選項」。',
  },
  'legacy.activateFailed': {
    en: 'The imported configuration could not be activated.',
    'zh-CN': '无法启用导入的配置。',
    'zh-TW': '無法啟用匯入的設定。',
  },
  'legacy.saveFailed': {
    en: 'The imported configuration could not be saved.',
    'zh-CN': '无法保存导入的配置。',
    'zh-TW': '無法儲存匯入的設定。',
  },
  'legacy.unsupportedAlert': {
    en: 'This backup contains unsupported or invalid entries. Open the technical details above.',
    'zh-CN': '此备份包含不支持或无效的项目。请展开上方技术迁移详情。',
    'zh-TW': '此備份包含不支援或無效的項目。請展開上方技術移轉詳情。',
  },
'''
replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    "  'fixed.proxyServers':",
    catalog_block + "  'fixed.proxyServers':",
)

replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    "  readonly 'fixed.fieldAria': {",
    "  readonly 'legacy.compatibilityWarnings': { readonly count: number };\n"
    "  readonly 'legacy.exportedWithWarnings': { readonly count: number };\n"
    "  readonly 'legacy.technicalDetails': { readonly count: number };\n"
    "  readonly 'fixed.fieldAria': {",
)

legacy_messages = r'''    case 'legacy.compatibilityWarnings': {
      const { count } = params as UiMessageParameters['legacy.compatibilityWarnings'];
      if (locale === 'zh-CN') return `兼容性警告（${count}）`;
      if (locale === 'zh-TW') return `相容性警告（${count}）`;
      return `Compatibility warnings (${count})`;
    }
    case 'legacy.exportedWithWarnings': {
      const { count } = params as UiMessageParameters['legacy.exportedWithWarnings'];
      if (locale === 'zh-CN') return `备份已导出，包含 ${count} 条兼容性警告。`;
      if (locale === 'zh-TW') return `備份已匯出，包含 ${count} 條相容性警告。`;
      return `Backup exported with ${count} compatibility warning(s).`;
    }
    case 'legacy.technicalDetails': {
      const { count } = params as UiMessageParameters['legacy.technicalDetails'];
      if (locale === 'zh-CN') return `技术迁移详情（${count}）`;
      if (locale === 'zh-TW') return `技術移轉詳情（${count}）`;
      return `Technical migration details (${count})`;
    }
'''
replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    "    case 'fixed.fieldAria': {",
    legacy_messages + "    case 'fixed.fieldAria': {",
)

old_app = r'''    {:else if activeSection === 'import' && state}
      <header class="editor-heading">
        <div>
          <h1>Import / Export</h1>
          <p>Move from original ZeroOmega or SwitchyOmega without rebuilding profiles.</p>
        </div>
      </header>
      <LegacyImportPanel
        disabled={saving || view?.busy === true}
        generation={state.generation}
        deviceId={state.applied.revision.deviceId ?? 'zeroomega-nex-extension'}
        onPrepareExport={prepareLegacyExport}
        onAcceptImport={acceptImportedDraft}
        onImportAndApply={acceptImportedAndApply}
      />
'''
new_app = r'''    {:else if activeSection === 'import' && state}
      <header class="editor-heading">
        <div>
          <h1>{uiText('legacy.pageTitle', locale)}</h1>
          <p>{uiText('legacy.pageHelp', locale)}</p>
        </div>
      </header>
      <LegacyImportPanel
        {locale}
        disabled={saving || view?.busy === true}
        generation={state.generation}
        deviceId={state.applied.revision.deviceId ?? 'zeroomega-nex-extension'}
        onPrepareExport={prepareLegacyExport}
        onAcceptImport={acceptImportedDraft}
        onImportAndApply={acceptImportedAndApply}
      />
'''
replace_once('apps/extension/src/entrypoints/options/App.svelte', old_app, new_app)

component_test_anchor = r'''  it('renders Automatic, Light, and Dark theme choices', () => {
'''
component_test = r'''  it('renders typed Legacy Import entry points in both Chinese locales', () => {
    const common = {
      disabled: false,
      generation: 0,
      deviceId: 'device-component-test',
      onPrepareExport: async () => baseSpec(),
      onAcceptImport: async () => true,
      onImportAndApply: async () => true,
    };
    const simplified = render(LegacyImportPanel, {
      props: { ...common, locale: 'zh-CN' },
    }).body;
    expect(simplified).toContain('data-typed-locale="zh-CN"');
    expect(simplified).toContain('导出选项');
    expect(simplified).toContain('恢复原版 ZeroOmega / SwitchyOmega 备份');
    expect(simplified).toContain('aria-label="原版备份文件"');
    expect(simplified).toContain('改为粘贴备份文本');
    expect(simplified).not.toContain('Export options');
    expect(simplified).not.toContain('Legacy backup file');

    const traditional = render(LegacyImportPanel, {
      props: { ...common, locale: 'zh-TW' },
    }).body;
    expect(traditional).toContain('data-typed-locale="zh-TW"');
    expect(traditional).toContain('匯出選項');
    expect(traditional).toContain('還原原版 ZeroOmega / SwitchyOmega 備份');
    expect(traditional).toContain('aria-label="原版備份檔案"');
    expect(traditional).toContain('改為貼上備份文字');
    expect(traditional).not.toContain('Export options');
    expect(traditional).not.toContain('Legacy backup file');
  });

'''
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    component_test_anchor,
    component_test + component_test_anchor,
)

startup_anchor = r'''  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  const firstExportPromise = options.waitForEvent('download');
'''
startup_assertion = r'''  const importReview = options.locator('[data-legacy-import-review]');
  assert.equal(await importReview.getAttribute('data-typed-locale'), 'zh-CN');
  await importReview.getByRole('heading', { name: '兼容性检查', exact: true }).waitFor();
  await importReview.getByLabel('导入状态统计').waitFor();
  assert.doesNotMatch(
    await importReview.innerText(),
    /Compatibility check|Technical migration details|Import and use now/u,
  );

  const importedStartup = await assertEventuallyValue(async () => {
    return worker.evaluate(async () => {
      const storage = await chrome.storage.local.get(null);
      const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
      const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
      const switchProfile = workflow?.applied?.profiles?.find((profile) => profile.name === 'switch');
      const snapshot = proxyState?.activeSnapshotId
        ? storage[`zeroomega-nex/browser-proxy/v1/snapshot/${proxyState.activeSnapshotId}`]
        : undefined;
      const effective = await chrome.proxy.settings.get({ incognito: false });
      if (
        switchProfile?.kind !== 'switch' ||
        workflow?.applied?.settings?.startup?.route?.kind !== 'profile' ||
        workflow.applied.settings.startup.route.profileId !== switchProfile.id ||
        workflow?.draft?.revision?.id !== workflow?.applied?.revision?.id ||
        snapshot?.startRoute?.kind !== 'profile' ||
        snapshot.startRoute.profileId !== switchProfile.id ||
        effective?.value?.mode !== 'pac_script' ||
        effective?.levelOfControl !== 'controlled_by_this_extension'
      ) {
        return undefined;
      }
      return {
        profileId: switchProfile.id,
        activeSnapshotId: proxyState.activeSnapshotId,
        mode: effective.value.mode,
        levelOfControl: effective.levelOfControl,
      };
    });
  }, 'Imported non-default startup route did not become the browser-confirmed active start route');
  assert.equal(importedStartup.mode, 'pac_script');
  assert.equal(importedStartup.levelOfControl, 'controlled_by_this_extension');

  const firstExportPromise = options.waitForEvent('download');
'''
replace_once('scripts/e2e-chromium.mjs', startup_anchor, startup_assertion)

replace_once(
    'scripts/generate-locale-inventory.mjs',
    "  'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',\n];",
    "  'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',\n"
    "  'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',\n];",
)

replace_once(
    'scripts/validate-localization.mjs',
    "  history: 'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',\n  chromiumE2e:",
    "  history: 'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',\n"
    "  legacyImport: 'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',\n"
    "  chromiumE2e:",
)
replace_once(
    'scripts/validate-localization.mjs',
    "  ['Snapshot History', entries.history],\n]) {",
    "  ['Snapshot History', entries.history],\n  ['Legacy Import', entries.legacyImport],\n]) {",
)
replace_once(
    'scripts/validate-localization.mjs',
    "  [entries.history, '>Rollback to this snapshot</button>', 'History rollback action regressed to literal English.'],\n",
    "  [entries.history, '>Rollback to this snapshot</button>', 'History rollback action regressed to literal English.'],\n"
    "  [entries.legacyImport, '<h2>Export options</h2>', 'Legacy export heading regressed to literal English.'],\n"
    "  [entries.legacyImport, 'aria-label=\"Legacy backup file\"', 'Legacy backup ARIA regressed to literal English.'],\n"
    "  [entries.legacyImport, '>Import and use now</button>', 'Legacy import action regressed to literal English.'],\n"
    "  [entries.legacyImport, 'item.message', 'Legacy Import must not render backend English report messages.'],\n"
    "  [entries.legacyImport, 'error.message', 'Legacy Import must not render backend exception messages.'],\n",
)
replace_once(
    'scripts/validate-localization.mjs',
    "  '<PacProfileEditor\\n          {locale}',\n  'Options must pass locale to PAC Profile.',\n);",
    "  '<PacProfileEditor\\n          {locale}',\n  'Options must pass locale to PAC Profile.',\n);\n"
    "requireText(\n  entries.app,\n  '<LegacyImportPanel\\n        {locale}',\n  'Options must pass locale to Legacy Import.',\n);",
)
replace_once(
    'scripts/validate-localization.mjs',
    "requireText(\n  entries.chromiumE2e,\n  'data-snapshot-rollback-confirm',",
    "requireText(\n  entries.chromiumE2e,\n  'Imported non-default startup route did not become the browser-confirmed active start route',\n  'Chromium imported startup-route coverage is missing.',\n);\n"
    "requireText(\n  entries.chromiumE2e,\n  'data-snapshot-rollback-confirm',",
)

old_import_guard = r'''  [
    legacyImport.includes('aria-label="Legacy backup file"') &&
      legacyImport.includes('Import and use now'),
    'Original ZeroOmega backups must support file-first one-step import and activation.',
  ],
'''
new_import_guard = r'''  [
    legacyImport.includes('data-legacy-import-panel') &&
      legacyImport.includes('data-typed-locale={locale}') &&
      legacyImport.includes("uiText('legacy.backupFileAria', locale)") &&
      legacyImport.includes('data-legacy-import-and-use') &&
      legacyImport.includes('data-legacy-import-inactive') &&
      legacyImport.includes('data-legacy-status-counts') &&
      legacyImport.includes('data-legacy-technical-details') &&
      !legacyImport.includes('item.message') &&
      !legacyImport.includes('error.message') &&
      optionsApp.includes('<LegacyImportPanel\n        {locale}') &&
      chromiumE2e.includes('Imported non-default startup route did not become the browser-confirmed active start route') &&
      chromiumE2e.includes("effective?.value?.mode !== 'pac_script'") &&
      chromiumE2e.includes("effective?.levelOfControl !== 'controlled_by_this_extension'"),
    'Original ZeroOmega backups must retain file-first inactive review, typed three-locale activation controls, safe code/path diagnostics, and a browser-confirmed imported startup route.',
  ],
'''
replace_once('scripts/validate-ui-compatibility.mjs', old_import_guard, new_import_guard)

# Update parity matrix rows without relying on column widths.
audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
rows = {
    'G-01': '| G-01 | 完整 Options 导出 | `io.jade`、`io.coffee` | plain JSON `.bak`，ISO 时间文件名 | MUST_MATCH | DONE | COMPLETE | 原版 schema-v2 反向映射、Apply-before-export、MIME/文件名、敏感凭据省略、typed 三语警告/成功/错误、永久守卫及 Chromium 下载均已验证 | 保持回归 |',
    'G-02': '| G-02 | 本地备份恢复 | 同上 | 文件选择后完整 reset | MUST_MATCH | DONE | COMPLETE | 文件优先、JSON/base64 粘贴、非激活审阅、状态统计、code/path 技术明细、秘密抽离提示、立即启用/仅导入均直接 typed 三语；Chromium 清空 local/session 后恢复并再次导出字节等价；仓库所有者真实复杂备份仍属最终 QC | 真实复杂备份验收 |',
    'G-09': '| G-09 | 恢复后 startup 应用 | `options.coffee#reset` | init 后应用 startupProfile | MUST_MATCH | DONE | N/A | fixture 指定非默认 `switch` startup；Chromium 通过真实“导入并立即使用”要求 Applied startup route、活动快照 startRoute、Draft/Applied 修订、`chrome.proxy.settings` PAC 模式及 `controlled_by_this_extension` 同时收敛 | 保持浏览器回归 |',
    'G-10': '| G-10 | 导入错误分类 | `io.coffee` | 格式错误/下载错误分开 | MUST_MATCH | PARTIAL | PARTIAL | 本地 decoder/importer 使用稳定 code/path；审阅页不再渲染后台英文 message/exception，而以 typed 三语状态、稳定机器代码、源/目标路径和安全通用错误展示。在线 URL 下载错误路径仍未实现 | 决定并实现在线 URL 范围 |',
}
seen = set()
for index, line in enumerate(lines):
    if not line.startswith('| '):
        continue
    parts = line.split('|')
    if len(parts) < 3:
        continue
    row_id = parts[1].strip()
    if row_id in rows:
        lines[index] = rows[row_id]
        seen.add(row_id)
missing = set(rows) - seen
if missing:
    raise SystemExit(f'audit rows not found: {sorted(missing)}')
audit_path.write_text('\n'.join(lines) + '\n')

kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg = kg_path.read_text()
old_kg = '''- Chromium 已执行原版备份上传、显式启用、清空 local/session、恢复导出备份与字节级再次导出。剩余缺口是 typed 三语、稳定用户错误映射、非默认 imported startup route 专项断言和仓库所有者真实复杂备份 QC。
'''
new_kg = '''- `LegacyImportPanel` 的导出、文件/粘贴输入、兼容性统计、技术明细、秘密材料提示、立即启用/仅导入、成功/错误、按钮、placeholder、title 与 ARIA 已直接通过 typed 英文/简体中文/正體中文 catalog 渲染；不再依赖渲染后的全局英文替换。
- 技术明细只呈现 localized status、稳定 machine code 与 source/target path；后台 `item.message` 和异常 `error.message` 不进入页面，从而避免泄漏不稳定英文或秘密相关上下文。
- Chromium 已执行原版备份上传、显式启用、清空 local/session、恢复导出备份与字节级再次导出；并对 fixture 的非默认 `switch` startup 要求 Applied startup route、活动快照 startRoute、Draft/Applied 修订和浏览器 `chrome.proxy.settings` 控制状态同时收敛。剩余本地导入缺口仅为仓库所有者真实复杂备份 QC。
'''
if old_kg not in kg:
    raise SystemExit('knowledge graph import anchor missing')
kg_path.write_text(kg.replace(old_kg, new_kg, 1))

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
old_status = '''- The stale G-04/G-05/G-06 `UNVERIFIED/BROKEN` statuses are corrected. Remaining import-review work is typed three-locale rendering, stable error presentation, a non-default imported startup-route browser assertion, and repository-owner real complex-backup acceptance.
'''
new_status = '''- The stale G-04/G-05/G-06 `UNVERIFIED/BROKEN` statuses are corrected. Legacy Import now renders directly through the typed three-locale catalog, presents stable status/code/path evidence instead of backend English messages, and has a real Chromium assertion for the non-default imported startup route. Repository-owner real complex-backup acceptance remains final QC.
'''
if old_status not in status:
    raise SystemExit('status import reconciliation anchor missing')
status = status.replace(old_status, new_status, 1)
old_next = '''Migrate the existing Legacy Import review panel as the next typed vertical batch. Cover export, file/pasted input, compatibility category counts, technical details, secret-material notices, inactive import, immediate apply, success/error states, buttons, titles, placeholders, and ARIA in all three locales while preserving the verified schema-v2 round trip and secret isolation.
'''
new_next = '''Migrate General and Interface as the next typed vertical batch. Cover startup/quick-switch settings, Apply/Discard status, confirmation/editing controls, menu/status controls, request-diagnostics settings, buttons, titles, select options, dynamic status, and ARIA in all three locales while preserving Draft/Applied separation and the existing browser workflows.
'''
if old_next not in status:
    raise SystemExit('status next-action anchor missing')
status = status.replace(old_next, new_next, 1)
marker = '### Typed Snapshot History and real rollback closure\n'
legacy_section = '''### Typed Legacy Import and imported startup activation

- `LegacyImportPanel` directly renders English, Simplified Chinese, and Traditional Chinese for export, file/pasted input, compatibility counts, technical details, secret-material notices, inactive import, immediate apply, success/error states, buttons, placeholders, titles, and ARIA.
- Report details show localized status plus stable code/source/target paths. Backend `item.message` and exception `error.message` are not rendered; local failures use non-secret typed summaries.
- The original schema-v2 export → clear → import → export byte-equivalence remains intact. Chromium also requires the fixture's non-default `switch` startup route to converge across Applied settings, the active verified snapshot, Draft/Applied revision identity, `chrome.proxy.settings` PAC mode, and extension control ownership.
- This closes local import translation and startup activation. Online URL restore, schema-v1 upgrade, v1 AutoDetect migration, and repository-owner real complex-backup QC remain separate open items.

'''
if legacy_section.strip() not in status:
    if status.count(marker) != 1:
        raise SystemExit('status History section anchor missing')
    status = status.replace(marker, legacy_section + marker, 1)
status_path.write_text(status)
