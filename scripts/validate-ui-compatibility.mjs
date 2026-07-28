import { readFile } from 'node:fs/promises';

const popupAppPath = 'apps/extension/src/entrypoints/popup/App.svelte';
const popupStylePath = 'apps/extension/src/entrypoints/popup/style.css';
const currentSitePath = 'apps/extension/src/lib/current-site.ts';
const proxyOwnershipCorePath = 'packages/browser-adapters/src/ownership.ts';
const proxyOwnershipRuntimePath = 'apps/extension/src/lib/proxy-ownership-runtime.ts';
const proxyOwnershipClientPath = 'apps/extension/src/lib/proxy-ownership-client.ts';
const externalProfileAdapterPath = 'packages/browser-adapters/src/external-profile.ts';
const externalProfileWorkflowPath = 'packages/profile-workflow/src/external-profile.ts';
const popupTemporaryRulesPath = 'packages/profile-workflow/src/popup-temporary-rules.ts';
const popupTemporaryRuntimePath = 'apps/extension/src/lib/popup-temporary-rule-runtime.ts';
const sessionSnapshotRepositoryPath = 'apps/extension/src/lib/session-snapshot-repository.ts';
const temporaryRulesManagerPath = 'apps/extension/src/entrypoints/temp-rules/App.svelte';
const optionsAppPath = 'apps/extension/src/entrypoints/options/App.svelte';
const optionsStylePath = 'apps/extension/src/entrypoints/options/style.css';
const snapshotHistoryPath = 'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte';
const legacyImportPath = 'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte';
const themePanelPath = 'apps/extension/src/entrypoints/options/ThemePanel.svelte';
const fixedProfilePath = 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte';
const newProfileDialogPath = 'apps/extension/src/entrypoints/options/NewProfileDialog.svelte';
const extensionPackagePath = 'apps/extension/package.json';
const switchProfilePath = 'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte';
const attachedRuleListConfigPath =
  'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte';
const virtualProfilePath = 'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte';
const profileReplacementDialogPath =
  'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte';
const profileDeletionDialogPath =
  'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte';
const optionsHtmlPath = 'apps/extension/src/entrypoints/options/index.html';
const i18nPath = 'apps/extension/src/lib/i18n.ts';
const profileExportPath = 'apps/extension/src/lib/profile-export.ts';
const profileIconPath = 'apps/extension/src/components/ProfileIcon.svelte';
const manifestPath = 'apps/extension/wxt.config.ts';
const defaultsPath = 'packages/profile-workflow/src/defaults.ts';
const advancedProfileEditorPath =
  'apps/extension/src/entrypoints/options/AdvancedProfileEditor.svelte';
const advancedProfileOperationsPath =
  'packages/profile-workflow/src/advanced-profile-operations.ts';
const profileOperationsPath = 'packages/profile-workflow/src/profile-operations.ts';
const runtimePath = 'apps/extension/src/lib/profile-workflow-runtime.ts';
const workflowClientPath = 'apps/extension/src/lib/profile-workflow-client.ts';
const ruleSourceDownloaderPath = 'apps/extension/src/lib/rule-source-downloader.ts';
const ruleSourceSchedulerPath = 'apps/extension/src/lib/rule-source-scheduler.ts';
const ruleSourceUpdatePath = 'packages/profile-workflow/src/rule-source-update.ts';
const switchOperationsPath = 'packages/profile-workflow/src/switch-operations.ts';
const popupConditionPath = 'packages/profile-workflow/src/popup-condition.ts';
const switchSourcePath = 'packages/profile-workflow/src/switch-source.ts';
const switchEditorStatePath = 'apps/extension/src/entrypoints/options/switch-editor-state.ts';
const attachedRuleListOperationsPath =
  'packages/profile-workflow/src/attached-rule-list-operations.ts';
const profileSpecTypesPath = 'packages/profile-spec/src/types.ts';
const legacyImportImplementationPath = 'packages/legacy-zeroomega/src/import.ts';
const profileSpecValidationPath = 'packages/profile-spec/src/validation.ts';
const profileSpecSerializationPath = 'packages/profile-spec/src/serialization.ts';
const workflowStatePath = 'packages/profile-workflow/src/state.ts';
const storageRepositoryPath = 'packages/profile-workflow/src/storage-repository.ts';
const requestDiagnosticsModelPath = 'apps/extension/src/lib/request-diagnostics-model.ts';
const requestDiagnosticsRuntimePath = 'apps/extension/src/lib/request-diagnostics-runtime.ts';
const requestDiagnosticsPagePath = 'apps/extension/src/entrypoints/network/App.svelte';
const inspectRuntimePath = 'apps/extension/src/lib/inspect-runtime.ts';
const nativeInspectE2ePath = 'scripts/e2e-inspect-native-menu.mjs';
const browserE2eWorkflowPath = '.github/workflows/browser-e2e.yml';
const legacyExportPath = 'packages/legacy-zeroomega/src/export.ts';
const chromiumE2ePath = 'scripts/e2e-chromium.mjs';
const originalBackupProvenancePath =
  'fixtures/zeroomega-v2/original-default-v3.5.0.provenance.json';
const pacProfileEditorPath = 'apps/extension/src/entrypoints/options/PacProfileEditor.svelte';
const pacSourceUpdatePath = 'packages/profile-workflow/src/pac-source-update.ts';
const rawPacSnapshotPath = 'packages/pac-compiler/src/raw-snapshot.ts';
const profileWorkflowActivationPath = 'apps/extension/src/lib/profile-workflow-activation.ts';
const proxyAuthenticationPath = 'packages/browser-adapters/src/authentication.ts';
const proxyAuthenticationPlanPath = 'packages/browser-adapters/src/authentication-plan.ts';
const proxyAuthenticationPermissionClientPath =
  'apps/extension/src/lib/proxy-auth-permission-client.ts';
const independentRuleListEditorPath =
  'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte';

const [
  popupApp,
  popupStyle,
  currentSite,
  proxyOwnershipCore,
  proxyOwnershipRuntime,
  proxyOwnershipClient,
  externalProfileAdapter,
  externalProfileWorkflow,
  popupTemporaryRules,
  popupTemporaryRuntime,
  sessionSnapshotRepository,
  temporaryRulesManager,
  optionsApp,
  optionsStyle,
  snapshotHistory,
  legacyImport,
  themePanel,
  fixedProfile,
  newProfileDialog,
  extensionPackage,
  switchProfile,
  attachedRuleListConfig,
  virtualProfile,
  profileReplacementDialog,
  profileDeletionDialog,
  optionsHtml,
  i18n,
  profileExport,
  profileIcon,
  manifest,
  defaults,
  advancedProfileEditor,
  advancedProfileOperations,
  profileOperations,
  runtime,
  workflowClient,
  ruleSourceDownloader,
  ruleSourceScheduler,
  ruleSourceUpdate,
  switchOperations,
  popupCondition,
  switchSource,
  switchEditorState,
  attachedRuleListOperations,
  profileSpecTypes,
  legacyImportImplementation,
  profileSpecValidation,
  profileSpecSerialization,
  workflowState,
  storageRepository,
  requestDiagnosticsModel,
  requestDiagnosticsRuntime,
  requestDiagnosticsPage,
  inspectRuntime,
] = await Promise.all([
  readFile(popupAppPath, 'utf8'),
  readFile(popupStylePath, 'utf8'),
  readFile(currentSitePath, 'utf8'),
  readFile(proxyOwnershipCorePath, 'utf8'),
  readFile(proxyOwnershipRuntimePath, 'utf8'),
  readFile(proxyOwnershipClientPath, 'utf8'),
  readFile(externalProfileAdapterPath, 'utf8'),
  readFile(externalProfileWorkflowPath, 'utf8'),
  readFile(popupTemporaryRulesPath, 'utf8'),
  readFile(popupTemporaryRuntimePath, 'utf8'),
  readFile(sessionSnapshotRepositoryPath, 'utf8'),
  readFile(temporaryRulesManagerPath, 'utf8'),
  readFile(optionsAppPath, 'utf8'),
  readFile(optionsStylePath, 'utf8'),
  readFile(snapshotHistoryPath, 'utf8'),
  readFile(legacyImportPath, 'utf8'),
  readFile(themePanelPath, 'utf8'),
  readFile(fixedProfilePath, 'utf8'),
  readFile(newProfileDialogPath, 'utf8'),
  readFile(extensionPackagePath, 'utf8'),
  readFile(switchProfilePath, 'utf8'),
  readFile(attachedRuleListConfigPath, 'utf8'),
  readFile(virtualProfilePath, 'utf8'),
  readFile(profileReplacementDialogPath, 'utf8'),
  readFile(profileDeletionDialogPath, 'utf8'),
  readFile(optionsHtmlPath, 'utf8'),
  readFile(i18nPath, 'utf8'),
  readFile(profileExportPath, 'utf8'),
  readFile(profileIconPath, 'utf8'),
  readFile(manifestPath, 'utf8'),
  readFile(defaultsPath, 'utf8'),
  readFile(advancedProfileEditorPath, 'utf8'),
  readFile(advancedProfileOperationsPath, 'utf8'),
  readFile(profileOperationsPath, 'utf8'),
  readFile(runtimePath, 'utf8'),
  readFile(workflowClientPath, 'utf8'),
  readFile(ruleSourceDownloaderPath, 'utf8'),
  readFile(ruleSourceSchedulerPath, 'utf8'),
  readFile(ruleSourceUpdatePath, 'utf8'),
  readFile(switchOperationsPath, 'utf8'),
  readFile(popupConditionPath, 'utf8'),
  readFile(switchSourcePath, 'utf8'),
  readFile(switchEditorStatePath, 'utf8'),
  readFile(attachedRuleListOperationsPath, 'utf8'),
  readFile(profileSpecTypesPath, 'utf8'),
  readFile(legacyImportImplementationPath, 'utf8'),
  readFile(profileSpecValidationPath, 'utf8'),
  readFile(profileSpecSerializationPath, 'utf8'),
  readFile(workflowStatePath, 'utf8'),
  readFile(storageRepositoryPath, 'utf8'),
  readFile(requestDiagnosticsModelPath, 'utf8'),
  readFile(requestDiagnosticsRuntimePath, 'utf8'),
  readFile(requestDiagnosticsPagePath, 'utf8'),
  readFile(inspectRuntimePath, 'utf8'),
]);

const [
  nativeInspectE2e,
  browserE2eWorkflow,
  legacyExport,
  chromiumE2e,
  originalBackupProvenance,
  independentRuleListEditor,
  pacProfileEditor,
  pacSourceUpdate,
  rawPacSnapshot,
  profileWorkflowActivation,
  proxyAuthentication,
  proxyAuthenticationPlan,
  proxyAuthenticationPermissionClient,
] = await Promise.all([
  readFile(nativeInspectE2ePath, 'utf8'),
  readFile(browserE2eWorkflowPath, 'utf8'),
  readFile(legacyExportPath, 'utf8'),
  readFile(chromiumE2ePath, 'utf8'),
  readFile(originalBackupProvenancePath, 'utf8'),
  readFile(independentRuleListEditorPath, 'utf8'),
  readFile(pacProfileEditorPath, 'utf8'),
  readFile(pacSourceUpdatePath, 'utf8'),
  readFile(rawPacSnapshotPath, 'utf8'),
  readFile(profileWorkflowActivationPath, 'utf8'),
  readFile(proxyAuthenticationPath, 'utf8'),
  readFile(proxyAuthenticationPlanPath, 'utf8'),
  readFile(proxyAuthenticationPermissionClientPath, 'utf8'),
]);

const requirements = [
  [
    popupApp.includes("import { browser } from 'wxt/browser'"),
    'Popup must use the WXT browser API wrapper.',
  ],
  [
    popupApp.includes('browser.runtime.openOptionsPage()'),
    'Popup settings must open the declared options page.',
  ],
  [
    popupApp.includes('onclick={openOptions}'),
    'Popup settings button must be wired to its click handler.',
  ],
  [
    !popupApp.includes('⚙'),
    'Popup must use a fixed SVG icon instead of a platform-dependent emoji glyph.',
  ],
  [
    popupApp.includes('class="popup-footer"'),
    'Popup must retain the familiar bottom options action area.',
  ],
  [
    popupApp.includes('data-popup-proxy-not-controllable') &&
      popupApp.includes('data-popup-manage-extensions') &&
      popupApp.includes('loadProxyOwnership()') &&
      popupApp.includes("'chrome://extensions/'") &&
      popupApp.includes("'about:addons'") &&
      proxyOwnershipCore.includes("reason: 'app'") &&
      proxyOwnershipCore.includes("reason: 'policy'") &&
      proxyOwnershipCore.includes("reason: 'disabled'") &&
      proxyOwnershipRuntime.includes('if (!isProxyOwnershipCommand(message)) return undefined;') &&
      !proxyOwnershipRuntime.includes('const listener = async') &&
      proxyOwnershipClient.includes('PROXY_OWNERSHIP_MESSAGE_CHANNEL'),
    'Popup must fail closed when another extension, policy, or missing browser capability prevents proxy control, and every ownership message listener must synchronously reject unrelated channels.',
  ],
  [
    popupApp.includes('data-popup-external-profile') &&
      popupApp.includes('data-popup-external-profile-form') &&
      popupApp.includes("action: 'import-external-profile'") &&
      popupApp.includes("name.startsWith('_')") &&
      proxyOwnershipClient.includes('ExternalProfilePreview') &&
      !proxyOwnershipClient.includes('host:') &&
      !proxyOwnershipClient.includes('script:') &&
      externalProfileAdapter.includes("case 'auto_detect'") &&
      externalProfileAdapter.includes("case 'pac_script'") &&
      externalProfileAdapter.includes("case 'fixed_servers'") &&
      externalProfileAdapter.includes('singleProxy') &&
      externalProfileWorkflow.includes('findMatchingExternalProfile') &&
      externalProfileWorkflow.includes('createExternalProfileDraft'),
    'System-mode external Fixed/PAC import must keep raw effective proxy data in the background, validate original profile-name rules, avoid exact duplicates, and use the normal verified Apply transaction.',
  ],
  [
    popupApp.includes('data-popup-temporary-rule') &&
      popupApp.includes('data-popup-manage-temporary-rules') &&
      popupApp.includes("action: 'toggle'") &&
      popupTemporaryRules.includes('POPUP_TEMPORARY_PROFILE_ID_PREFIX') &&
      popupTemporaryRules.includes('condition: temporaryCondition(rule.domain)') &&
      popupTemporaryRules.includes('listPopupTemporaryRuleResultRoutes') &&
      popupTemporaryRuntime.includes("'zeroomega-nex/popup-temporary-rules/v1/state'") &&
      popupTemporaryRuntime.includes('storage.session') &&
      popupTemporaryRuntime.includes('reconcileStartup') &&
      sessionSnapshotRepository.includes('POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX') &&
      sessionSnapshotRepository.includes(
        'listSnapshots(): Promise<readonly PacRuntimeSnapshot[]>',
      ) &&
      temporaryRulesManager.includes('data-temp-rules-table') &&
      temporaryRulesManager.includes('Delete all temporary rules'),
    'Popup temporary rules must use a separate browser-session state and session-only PAC snapshot, wrap the current route, survive worker restarts, clear on browser restart, and provide a dedicated manager.',
  ],
  [
    runtime.includes('): Promise<ProfileWorkflowCommandResponse> | undefined =>') &&
      runtime.includes('if (!isProfileWorkflowCommand(message)) return undefined;') &&
      !runtime.includes('const listener = async'),
    'Profile Workflow messaging must synchronously reject unrelated channels so parallel extension listeners cannot consume each other’s responses.',
  ],
  [
    popupApp.includes('data-popup-add-current-site') &&
      popupApp.includes('data-popup-condition-form') &&
      popupApp.includes("action: 'add-current-site-condition'") &&
      popupApp.includes('listPopupConditionResultRoutes') &&
      currentSite.includes("import { parse } from 'tldts'") &&
      currentSite.includes('allowPrivateDomains: true') &&
      currentSite.includes('parsedDomain.domain ?? hostname') &&
      currentSite.includes('suggestCurrentSiteCondition') &&
      popupCondition.includes('draft.settings.interface.addConditionsToBottom') &&
      popupCondition.includes('profile.rules.unshift(rule)') &&
      popupCondition.includes('profile.rules.push(rule)') &&
      popupCondition.includes('popupConditionTag(input.condition)') &&
      manifest.includes("'activeTab'"),
    'Popup must derive the current site with the public suffix list, add typed conditions only to the active Switch Profile, deduplicate by condition, honor top/bottom ordering, and use least-privilege activeTab access.',
  ],
  [
    popupApp.includes('data-popup-result-profile') &&
      popupApp.includes("action: 'set-popup-profile-result'") &&
      popupApp.includes('profile-result-label') &&
      popupCondition.includes('setPopupProfileResultDraft') &&
      popupCondition.includes('profile.defaultRoute = structuredClone(route)') &&
      popupCondition.includes('profile.targetRoute = structuredClone(route)') &&
      popupCondition.includes('listPopupProfileResultRoutes'),
    'Popup must display and change valid Switch/Virtual result routes through the verified background transaction.',
  ],
  [
    popupApp.includes('data-popup-request-diagnostics') &&
      popupApp.includes("action: 'summary'") &&
      requestDiagnosticsModel.includes('REQUEST_DIAGNOSTICS_PER_TAB_LIMIT') &&
      requestDiagnosticsModel.includes('REQUEST_DIAGNOSTICS_GLOBAL_LIMIT') &&
      requestDiagnosticsModel.includes("url.search = ''") &&
      requestDiagnosticsModel.includes("url.hash = ''") &&
      requestDiagnosticsRuntime.includes('new RequestDiagnosticsRepository(api.storage.session)') &&
      requestDiagnosticsRuntime.includes("message.action === 'start'") &&
      requestDiagnosticsRuntime.includes("message.action === 'stop'") &&
      requestDiagnosticsPage.includes('data-request-diagnostics-start') &&
      requestDiagnosticsPage.includes('data-request-diagnostics-stop') &&
      requestDiagnosticsPage.includes('<code>{record.url}</code>') &&
      !requestDiagnosticsPage.includes('<a href={record.url}'),
    'Request diagnostics must be explicit browser-session monitoring with bounded session storage, summary-only Popup data, sanitized URLs, and a non-navigating inspection page.',
  ],
  [
    inspectRuntime.includes('evaluateInspectResultPresentation') &&
      inspectRuntime.includes('evaluateProfileGraph') &&
      inspectRuntime.includes('browserActionTitleInspect') &&
      inspectRuntime.includes('presentation?.color') &&
      !inspectRuntime.includes("color: '#607d8b' }"),
    'Inspect must evaluate the active route for the target URL, use the result-profile badge color, and keep the original two-line Inspect title shape.',
  ],
  [
    nativeInspectE2e.includes("click({ button: 'right' })") &&
      nativeInspectE2e.includes("['key', '--clearmodifiers', 'End', 'Up', 'Return']") &&
      nativeInspectE2e.includes('chrome.storage.session.get(key)') &&
      nativeInspectE2e.includes("assert.equal(action.badge, '#')") &&
      nativeInspectE2e.includes('assert.match(action.title') &&
      !nativeInspectE2e.match(/xdotool[^\n]*(?:mousemove|click)\s+\d+/u) &&
      browserE2eWorkflow.includes('chromium-native-inspect:') &&
      browserE2eWorkflow.includes('pnpm test:e2e:inspect-native') &&
      browserE2eWorkflow.includes('xvfb-run') &&
      browserE2eWorkflow.includes('xdotool'),
    'Inspect must retain a real headed Chromium native-menu E2E that right-clicks the page, uses focused keyboard navigation rather than coordinates, and verifies session state plus toolbar presentation.',
  ],
  [
    legacyExport.includes('ZEROOMEGA_BACKUP_SCHEMA_VERSION = 2') &&
      legacyExport.includes('text/plain;charset=utf-8') &&
      legacyExport.includes('ZeroOmegaOptions-${timestamp(value)}.bak') &&
      legacyExport.includes('content: JSON.stringify(options)') &&
      legacyExport.includes('secret.proxy-credential-omitted') &&
      legacyExport.includes('secret.request-header-omitted') &&
      legacyImport.includes('data-legacy-export') &&
      legacyImport.includes('exportZeroOmegaBackup') &&
      optionsApp.includes('prepareLegacyExport') &&
      optionsApp.includes("action: 'apply'") &&
      optionsApp.includes('structuredClone(state.applied)') &&
      chromiumE2e.includes("waitForEvent('download')") &&
      chromiumE2e.includes('chrome.storage.local.clear()') &&
      chromiumE2e.includes('secondExportContent') &&
      chromiumE2e.includes('firstExportContent') &&
      originalBackupProvenance.includes('8625759489') &&
      originalBackupProvenance.includes(
        '8403e963325a5d4fcac10fd2f3c8dac246cb720afb24f322c827d5cf8ebfdd19',
      ),
    'Full Options export must use the original schema-v2 JSON/MIME/filename contract, omit secrets, apply Draft work first, preserve a pinned original-generated fixture, and pass export-clear-import-export Chromium E2E.',
  ],
  [
    optionsApp.includes("import RuleListProfileEditor from './RuleListProfileEditor.svelte'") &&
      optionsApp.includes("selectedProfile.kind === 'rule-list'") &&
      optionsApp.includes('onGetRuleSourceUpdateStatus={getRuleSourceUpdateStatus}') &&
      optionsApp.includes('onUpdateRuleSource={updateRuleSource}') &&
      independentRuleListEditor.includes('data-rule-list-profile-editor') &&
      independentRuleListEditor.includes('data-rule-list-config') &&
      independentRuleListEditor.includes('data-rule-list-url-section') &&
      independentRuleListEditor.includes('data-rule-list-text-section') &&
      independentRuleListEditor.includes('data-independent-rule-source-update-now') &&
      independentRuleListEditor.includes("readonly={source.location.kind === 'url'}") &&
      independentRuleListEditor.includes('target.location = url') &&
      !independentRuleListEditor.includes('Source type') &&
      !independentRuleListEditor.includes('Update interval (minutes)') &&
      chromiumE2e.includes("getByRole('button', { name: 'rule-switchy', exact: true })") &&
      chromiumE2e.includes('data-independent-rule-source-update-now') &&
      chromiumE2e.includes("getByRole('button', { name: '清除规则列表网址' })"),
    'Independent Rule List profiles must use the original Config/URL/Text page, presence-of-URL mode switching, existing bounded downloader/status path, read-only downloaded text, and real Chromium interaction coverage.',
  ],
  [
    optionsApp.includes("import PacProfileEditor from './PacProfileEditor.svelte'") &&
      optionsApp.includes("action: 'get-pac-source-update-status'") &&
      optionsApp.includes("action: 'update-pac-source'") &&
      pacProfileEditor.includes('data-pac-profile-editor') &&
      pacProfileEditor.includes('data-typed-locale={locale}') &&
      pacProfileEditor.includes("uiText('pac.url', locale)") &&
      pacProfileEditor.includes("'pac.lastUpdated'") &&
      pacProfileEditor.includes('data-pac-url-section') &&
      pacProfileEditor.includes('data-pac-request-headers') &&
      pacProfileEditor.includes('data-pac-source-update-now') &&
      pacProfileEditor.includes('data-pac-script-section') &&
      pacProfileEditor.includes("readonly={profile.source.kind === 'url'}") &&
      pacProfileEditor.includes('data-pac-file-warning') &&
      pacSourceUpdate.includes('PAC_UPDATE_KEY_PREFIX') &&
      pacSourceUpdate.includes('target.source.script = downloaded.content') &&
      chromiumE2e.includes('data-pac-source-update-now') &&
      chromiumE2e.includes("name: '清空 PAC 网址'") &&
      legacyImportImplementation.includes('pac.downloaded-cache-preserved') &&
      legacyImportImplementation.includes('secret.unknown-pac-auth-slot') &&
      legacyExport.includes('profile.source.script !== undefined') &&
      legacyExport.includes('secret.pac-credential-omitted') &&
      pacProfileEditor.includes('data-pac-authentication') &&
      pacProfileEditor.includes('data-pac-auth-dialog') &&
      pacProfileEditor.includes('onReplaceDraftWithSecrets') &&
      pacProfileEditor.includes('onRequestAuthenticationPermission') &&
      pacProfileEditor.includes("uiText('pac.authPermissionDenied', locale)") &&
      proxyAuthenticationPermissionClient.includes("'webRequestAuthProvider'") &&
      proxyAuthenticationPermissionClient.includes("'webRequestBlocking'") &&
      proxyAuthenticationPermissionClient.includes("'http://*/*'") &&
      rawPacSnapshot.includes("RAW_PAC_SNAPSHOT_VERSION = 'raw-pac/1'") &&
      rawPacSnapshot.includes("mode: 'structural'") &&
      profileWorkflowActivation.includes('createRawPacSnapshot') &&
      profileWorkflowActivation.includes('const rawScript = rawPacScript(spec, route)') &&
      proxyAuthentication.includes("scope: 'all-proxies'") &&
      proxyAuthenticationPlan.includes("profile?.kind === 'pac'") &&
      chromiumE2e.includes("snapshot?.compilerVersion === 'raw-pac/1'") &&
      chromiumE2e.includes("bindings[0]?.scope === 'all-proxies'"),
    'PAC must preserve remote cache and original editor states, install arbitrary scripts only as structurally verified top-level raw snapshots, keep nested composition unsupported, and isolate one all-proxy authentication credential in background storage with Chromium evidence.',
  ],
  [
    snapshotHistory.includes('data-snapshot-history-panel') &&
      snapshotHistory.includes('data-typed-locale={locale}') &&
      snapshotHistory.includes('data-snapshot-rollback-request') &&
      snapshotHistory.includes('data-snapshot-rollback-confirm') &&
      snapshotHistory.includes("uiText('history.confirmTitle', locale)") &&
      optionsApp.includes('<SnapshotHistoryPanel\n        {locale}') &&
      chromiumE2e.includes('historyRollbackTarget') &&
      chromiumE2e.includes('data-snapshot-rollback-confirm') &&
      chromiumE2e.includes('History rollback did not restore browser state'),
    'Snapshot History must render through the typed catalog and retain a real Chromium rollback that converges browser, Applied, Draft, and UI state.',
  ],
  [
    popupStyle.includes("font-family: 'Segoe UI'"),
    'Popup must use explicit Windows typography for browser parity.',
  ],
  [popupStyle.includes('font-size: 13px'), 'Popup base type size must remain explicitly fixed.'],
  [popupStyle.includes('line-height: 1.35'), 'Popup line height must remain explicitly fixed.'],
  [
    popupStyle.includes('width: 320px'),
    'Popup width must remain deterministic and provide room for larger icons.',
  ],
  [
    popupStyle.includes('.profile-list button:focus-visible'),
    'Popup route controls must expose visible keyboard focus.',
  ],
  [
    ['zh-CN', 'zh-TW', "return 'en'"].every((entry) => i18n.includes(entry)),
    'Options and Popup must auto-select Simplified Chinese, Traditional Chinese, or English fallback.',
  ],
  [
    manifest.includes("default_locale: 'en'") &&
      manifest.includes('default_icon: icons') &&
      ['16.png', '32.png', '48.png', '128.png'].every((entry) => manifest.includes(entry)),
    'The browser manifest must expose localized metadata and toolbar icons at all standard sizes.',
  ],
  [
    popupApp.includes('import ProfileIcon') &&
      popupApp.includes('normalizedRoutes') &&
      popupApp.includes('applyThemeMode(readThemeMode())'),
    'Popup must show type icons, retain built-in ordering, and share the selected theme.',
  ],
  [
    profileIcon.includes("kind === 'fixed'") && profileIcon.includes("kind === 'switch'"),
    'Profile rows must use distinct type icons instead of plain color blocks.',
  ],
  [
    defaults.indexOf("{ kind: 'direct' }") < defaults.indexOf("{ kind: 'system' }"),
    'Default Popup order must list Direct before System Proxy.',
  ],
  [optionsApp.includes('class="sidebar"'), 'Options must retain familiar left profile navigation.'],
  [
    profileOperations.includes('export function listProfileReferenceBlockers') &&
      profileOperations.includes('profileReferencesTarget') &&
      profileOperations.includes('viaAttachedRuleListProfileId') &&
      profileOperations.includes('is referenced by') &&
      !profileOperations.includes('rewriteProfileRoutes(profile, deletedId)') &&
      optionsApp.includes('listProfileReferenceBlockers') &&
      optionsApp.includes('data-profile-delete-action') &&
      optionsApp.includes('<ProfileDeletionDialog') &&
      profileDeletionDialog.includes('role="alertdialog"') &&
      profileDeletionDialog.includes('data-profile-deletion-mode="blocked"') &&
      profileDeletionDialog.includes('data-profile-deletion-mode="confirm"') &&
      chromiumE2e.includes('Existing Alias') &&
      chromiumE2e.includes('Confirmed profile deletion did not commit through normal Apply'),
    'Profile deletion must block typed references with an explicit referrer dialog, collapse hidden attached Rule Lists to their owner, and only delete unreferenced profiles through Draft plus normal Apply.',
  ],
  [
    virtualProfile.includes('onRequestReplacement') &&
      !virtualProfile.includes('globalThis.confirm') &&
      optionsApp.includes('requestProfileReplacement') &&
      optionsApp.includes('Apply current changes before replacing profile references?') &&
      optionsApp.includes('replaceProfileReferencesDraft') &&
      optionsApp.includes('<ProfileReplacementDialog') &&
      profileReplacementDialog.includes('data-profile-replacement-from') &&
      profileReplacementDialog.includes('data-profile-replacement-to') &&
      profileReplacementDialog.includes('data-profile-replacement-preview') &&
      profileReplacementDialog.includes("uiText('profile.replace.help', locale)") &&
      chromiumE2e.includes(
        'Profile replacement dialog opened before the dirty Draft was applied',
      ) &&
      chromiumE2e.includes("replacementFrom.selectOption({ label: 'Unrelated Proxy' })") &&
      chromiumE2e.includes("replacementTo.selectOption({ label: 'Existing Alias' })"),
    'Virtual replacement must open the original general two-selector dialog after the dirty-Draft Apply boundary, preview both endpoints, and produce one typed replacement Draft without changing either profile.',
  ],
  [
    profileExport.includes("PROFILE_TEXT_EXPORT_MIME = 'text/plain;charset=utf-8'") &&
      profileExport.includes('sanitizeProfileExportName') &&
      profileExport.includes('/\\W+/g') &&
      profileExport.includes('OmegaProfile_') &&
      profileExport.includes('OmegaRules_') &&
      profileExport.includes('SwitchyRules_') &&
      profileExport.includes('; Require: ZeroOmega >= 2.3.2') &&
      profileExport.includes('; Summary: Proxy Switchy! Exported Rule List') &&
      profileExport.includes('createRawPacSnapshot') &&
      profileExport.includes('compilePac') &&
      profileExport.includes('advanced conditions require the SwitchyOmega .sorl format') &&
      optionsApp.includes('data-profile-export-rule-list') &&
      optionsApp.includes('data-profile-export-pac') &&
      optionsApp.includes('commitActiveProfileEditor') &&
      optionsApp.includes('downloadProfileText') &&
      chromiumE2e.includes('OmegaRules_Route_Matrix.sorl') &&
      chromiumE2e.includes('SwitchyRules_Route_Matrix.ssrl') &&
      chromiumE2e.includes('OmegaProfile_Target_Proxy.pac') &&
      chromiumE2e.includes('OmegaProfile_PAC_Matrix.pac'),
    'Profile headers must export current-Draft PAC and Switch rule-list files with original filenames, UTF-8 MIME, legacy fallback warning, raw PAC validation, and real Chromium downloads.',
  ],
  [
    !newProfileDialog.includes('<section') &&
      newProfileDialog.includes('class="new-profile-dialog"') &&
      newProfileDialog.includes('role="dialog"') &&
      newProfileDialog.includes('data-new-profile-name-input') &&
      newProfileDialog.includes('nameInput?.focus()') &&
      !newProfileDialog.includes('autofocus') &&
      !fixedProfile.includes(
        ['<section', '      class="auth-dialog"', '      data-fixed-auth-dialog'].join('\n'),
      ) &&
      fixedProfile.includes('authUsernameInput?.focus()') &&
      fixedProfile.includes('<span role="alert">{rowErrors[row.key]}</span>') &&
      !pacProfileEditor.includes(
        ['<section', '      class="auth-dialog"', '      data-pac-auth-dialog'].join('\n'),
      ) &&
      pacProfileEditor.includes('authUsernameInput?.focus()') &&
      !profileDeletionDialog.includes('<section') &&
      profileDeletionDialog.includes('initialButton?.focus()') &&
      extensionPackage.includes('--fail-on-warnings') &&
      chromiumE2e.includes('Fixed authentication dialog did not focus the username field') &&
      chromiumE2e.includes('PAC authentication dialog did not focus the username field') &&
      chromiumE2e.includes('New Profile dialog did not focus the profile-name field') &&
      chromiumE2e.includes('Blocked deletion dialog did not focus its Close action'),
    'All Options dialogs must use neutral role containers, deterministic initial focus, valid alert placement, and a permanent fail-on-warnings Svelte check.',
  ],
  [
    optionsApp.includes('class="nav-group actions"'),
    'Options must retain original sidebar Apply/Discard actions.',
  ],
  [
    optionsHtml.includes('name="manifest.open_in_tab" content="true"'),
    'Options must open as a complete browser tab instead of an embedded extension dialog.',
  ],
  [
    ['Settings', 'Profiles', 'Actions', 'Built-in Profiles', 'New profile…'].every((label) =>
      optionsApp.includes(label),
    ),
    'Options must preserve the original ZeroOmega navigation groups and profile workflow.',
  ],
  [
    optionsApp.includes("activeSection === 'general'") &&
      optionsApp.includes("activeSection === 'profile'"),
    'General settings and profile details must be independent routed pages.',
  ],
  [
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
      chromiumE2e.includes(
        'Imported non-default startup route did not become the browser-confirmed active start route',
      ) &&
      chromiumE2e.includes("effective?.value?.mode !== 'pac_script'") &&
      chromiumE2e.includes("effective?.levelOfControl !== 'controlled_by_this_extension'"),
    'Original ZeroOmega backups must retain file-first inactive review, typed three-locale activation controls, safe code/path diagnostics, and a browser-confirmed imported startup route.',
  ],
  [
    ['Automatic', 'Light', 'Dark'].every((label) => themePanel.includes(label)),
    'Options must provide Automatic, Light, and Dark appearance modes.',
  ],
  [
    ['fallback', 'http', 'https', 'ftp'].every((scheme) =>
      fixedProfile.includes(`key: '${scheme}'`),
    ) &&
      fixedProfile.includes("uiText('fixed.showAdvanced', locale)") &&
      fixedProfile.includes("uiText('fixed.authTitle', locale)") &&
      fixedProfile.includes('fallbackPlaceholder'),
    'Fixed Profile must preserve the original default/HTTP/HTTPS/FTP table, advanced rows, inherited placeholders, and per-row authentication.',
  ],

  [
    switchProfile.includes('data-switch-rules-table') &&
      switchProfile.includes('data-switch-rule-row') &&
      switchProfile.includes('data-switch-drag-handle') &&
      switchProfile.includes("uiText('switch.conditionHelp', locale)") &&
      switchProfile.includes('<optgroup label={uiText(group.labelKey, locale)}>') &&
      switchProfile.includes("uiText('switch.defaultProfile', locale)") &&
      !switchProfile.includes('Ordered Switch Profile rules'),
    'Switch Profile must use the original compact rule table, grouped condition help, drag handle, and table-bottom default row.',
  ],
  [
    switchProfile.includes('data-switch-source-toggle') &&
      switchProfile.includes('data-switch-source-editor') &&
      switchProfile.includes('data-switch-source-error') &&
      switchProfile.includes('onRegisterBeforeAction') &&
      switchProfile.includes('onSourceDirtyChange') &&
      optionsApp.includes('commitActiveProfileEditor') &&
      optionsApp.includes('profileEditorDirty') &&
      optionsApp.includes('onRegisterBeforeAction={registerBeforeProfileEditorAction}') &&
      optionsApp.includes('data-new-profile-action') &&
      virtualProfile.includes('data-virtual-profile-editor') &&
      virtualProfile.includes('data-virtual-target') &&
      virtualProfile.includes('data-virtual-replace') &&
      profileOperations.includes('replaceProfileReferencesDraft') &&
      legacyImportImplementation.includes('auto-detect.fallback-nex-extension') &&
      legacyExport.includes('auto-detect.fallback-nex-extension') &&
      chromiumE2e.includes('virtual-reference-migration.json') &&
      chromiumE2e.includes(
        'Virtual reference migration did not rewrite every typed route surface',
      ) &&
      chromiumE2e.includes('Virtual reference migration did not commit through normal Apply') &&
      switchSource.includes('export function composeSwitchProfileSource') &&
      switchSource.includes('export function parseSwitchProfileSourceDraft') &&
      switchSource.includes("const HEADER = '[SwitchyOmega Conditions]'") &&
      switchSource.includes("const WITH_RESULT = '@with result'") &&
      switchSource.includes("lines.push('', `* +${defaultName}`, '')") &&
      switchEditorState.includes('SWITCH_SOURCE_EDITOR_STATE_PREFIX') &&
      switchEditorState.includes('switchSourceEditorStateKey(profileId)') &&
      switchProfile.includes('readSwitchSourceEditorMode(profileId)') &&
      switchProfile.includes('storeSwitchSourceEditorMode(profileId, true)') &&
      switchProfile.includes('data-switch-source-mode') &&
      chromiumE2e.includes('localStorage.getItem(key), switchEditorStateKey') &&
      chromiumE2e.includes("locator('[data-switch-drag-handle]').dragTo") &&
      chromiumE2e.includes('Switch drag order was not persisted in the Draft') &&
      !switchProfile.includes('Rule enabled') &&
      !switchProfile.includes('regular-expression flags'),
    'Switch Profile must provide the original result-enabled source editor, block invalid source on Apply/navigation, and avoid Nex-only enable/regex-flags controls.',
  ],
  [
    profileSpecTypes.includes('attachedRuleListProfileId?: Identifier') &&
      profileSpecTypes.includes("{ kind: 'url'; url: string; content?: string }") &&
      attachedRuleListOperations.includes('export function createAttachedRuleListDraft') &&
      attachedRuleListOperations.includes('export function setAttachedRuleListEnabledDraft') &&
      attachedRuleListOperations.includes('export function detachAttachedRuleListDraft') &&
      attachedRuleListOperations.includes('`__ruleListOf_${owner.name}`') &&
      switchProfile.includes('data-attached-rule-list-row') &&
      switchProfile.includes('data-attach-rule-list-section') &&
      attachedRuleListConfig.includes('data-attached-rule-list-config') &&
      attachedRuleListConfig.includes('data-attached-rule-list-headers') &&
      attachedRuleListConfig.includes('$: headerItems = state?.source.headers ?? []') &&
      attachedRuleListConfig.includes('{#each headerItems as header') &&
      !attachedRuleListConfig.includes('function headers()') &&
      optionsApp.includes('attachedRuleListProfileIds') &&
      virtualProfile.includes('attachedRuleListProfileIds') &&
      legacyImportImplementation.includes('profile.attached-rule-list-linked') &&
      legacyImportImplementation.includes('rule-source.downloaded-cache-preserved') &&
      profileSpecValidation.includes('profile.external-attached-rule-list-reference') &&
      profileOperations.includes('duplicateSwitchProfileResources') &&
      profileOperations.includes('deleted.attachedRuleListProfileId'),
    'Switch attached Rule Lists must be hidden owned profiles with source-backed lifecycle, import reconstruction, cached URL content, duplication, and cascading deletion.',
  ],
  [
    attachedRuleListConfig.includes('data-rule-source-update-now') &&
      attachedRuleListConfig.includes('data-rule-source-update-status') &&
      attachedRuleListConfig.includes('uiMessage(') &&
      attachedRuleListConfig.includes("'ruleList.updateFailed'") &&
      optionsApp.includes("action: 'update-rule-source'") &&
      optionsApp.includes('requestRuleSourceOriginPermission') &&
      runtime.includes('BrowserRuleSourceDownloader') &&
      ruleSourceDownloader.includes("credentials: 'omit'") &&
      ruleSourceDownloader.includes("cache: 'no-store'") &&
      ruleSourceDownloader.includes("referrerPolicy: 'no-referrer'") &&
      ruleSourceUpdate.includes('RULE_SOURCE_UPDATE_TIMEOUT_MS = 10_000') &&
      ruleSourceUpdate.includes('RULE_SOURCE_UPDATE_MAX_BYTES = 4 * 1024 * 1024') &&
      ruleSourceUpdate.includes('repository.compareAndSwap(current.generation, next)') &&
      ruleSourceUpdate.includes('Rule Source request header') &&
      ruleSourceUpdate.includes('old cached content') === false,
    'Remote Rule Sources must use background-only bounded downloads, user-granted host permission, safe secret headers, atomic CAS replacement, and preserved old cache on failure.',
  ],
  [
    ['proxy', 'storage', 'alarms', 'activeTab', 'contextMenus'].every((permission) =>
      manifest.includes(`'${permission}'`),
    ) &&
      manifest.includes("...(diagnosticsE2e ? ['webRequest'] : [])") &&
      runtime.includes('registerRuleSourceScheduler') &&
      ruleSourceScheduler.includes(
        "RULE_SOURCE_UPDATE_ALARM_NAME = 'zeroomega-nex/rule-source-update-scan'",
      ) &&
      ruleSourceScheduler.includes('RULE_SOURCE_UPDATE_SCAN_PERIOD_MINUTES = 1') &&
      ruleSourceScheduler.includes('listDueProfileWorkflowRuleSourceUpdates') &&
      ruleSourceScheduler.includes('api.permissions.contains') &&
      ruleSourceScheduler.includes('if (running) return running') &&
      ruleSourceUpdate.includes('export function listDueProfileWorkflowRuleSourceUpdates'),
    'Remote Rule Sources must use one coalesced alarm scheduler, scan on startup, refresh only due sources with existing host permission, and wait each interval after success or failure.',
  ],
  [
    workflowClient.includes('PROFILE_WORKFLOW_STATE_STORAGE_KEY') &&
      workflowClient.includes('subscribeProfileWorkflowStateChanges') &&
      workflowClient.includes("areaName === 'local'") &&
      workflowClient.includes('changes[PROFILE_WORKFLOW_STATE_STORAGE_KEY]?.newValue') &&
      optionsApp.includes('parseProfileWorkflowState(value)') &&
      optionsApp.includes('inspectProfileWorkflow(nextState)') &&
      optionsApp.includes('subscribeProfileWorkflowStateChanges') &&
      !optionsApp.includes('workflowRefreshPending'),
    'Options must synchronously consume validated background workflow-state changes without interrupting chained commands or rebuilding the persistent Switch source editor instance.',
  ],
  [
    !switchOperations.includes('`${source.note} copy`') &&
      switchOperations.includes('...structuredClone(source)'),
    'Cloning a Switch rule must preserve the original note exactly instead of adding a Nex-only suffix.',
  ],
  [
    switchOperations.includes('const template = profile.rules.at(-1);') &&
      switchOperations.includes('...structuredClone(template)') &&
      switchOperations.includes('profile.rules.push(rule);') &&
      !switchOperations
        .slice(
          switchOperations.indexOf('export function addSwitchRuleDraft'),
          switchOperations.indexOf('export function duplicateSwitchRuleDraft'),
        )
        .includes('addConditionsToBottom'),
    'Options-added Switch rules must append and copy the previous rule; the Popup insertion preference must not control the editor button.',
  ],
  [
    profileSpecValidation.includes("options.mode === 'draft' ? 'warning' : 'error'") &&
      profileSpecValidation.includes('export function validateProfileSpecDraft') &&
      profileSpecSerialization.includes('export function cloneProfileSpecDraft') &&
      profileSpecSerialization.includes('export function serializeProfileSpecDraft') &&
      workflowState.includes('cloneProfileSpecDraft(state.draft)') &&
      workflowState.includes('createProfileSpecRevision(state.applied') &&
      storageRepository.includes("parseProfileSpecDraft(state.draft, 'draft')") &&
      [fixedProfile, switchProfile, virtualProfile, advancedProfileEditor, optionsApp].every(
        (source) => source.includes('cloneProfileSpecDraft'),
      ),
    'Draft editing must allow temporary Switch condition warnings while strict Applied, storage revision, import, and Apply boundaries remain separate.',
  ],
  [
    switchOperations.includes("return { kind: 'host-wildcard', pattern: '' };") &&
      switchOperations.includes("if ('pattern' in rule.condition) rule.condition.pattern = '';") &&
      !switchOperations.includes("pattern: '*.example.com'"),
    'Options-added Switch text conditions must start blank and copied text rules must clear their pattern like the original editor.',
  ],
  [
    profileOperations.includes('proxyByScheme: {}') &&
      profileOperations.includes("pattern: '[::1]'") &&
      !profileOperations
        .slice(
          profileOperations.indexOf('export function createFixedProfileDraft'),
          profileOperations.indexOf('export function duplicateProfileDraft'),
        )
        .includes("host: '127.0.0.1'"),
    'New Fixed Profiles must begin without an example proxy endpoint and retain the original local bypass defaults.',
  ],
  [
    runtime.includes('initialProfile.proxyByScheme = {}') &&
      runtime.includes('initial.proxyEndpoints = []'),
    'Fresh browser installation must not turn an example proxy server into user configuration.',
  ],
  [
    optionsApp.includes('class="settings-section"'),
    'Options profile pages must use familiar flat settings sections.',
  ],
  [
    optionsStyle.includes("font-family: 'Segoe UI'"),
    'Options must use explicit Windows typography for browser parity.',
  ],
  [
    optionsStyle.includes('font-size: 14px'),
    'Options base type size must remain explicitly fixed.',
  ],
  [
    optionsStyle.includes('button:focus-visible'),
    'Options interactive controls must expose visible keyboard focus.',
  ],
  [
    optionsStyle.includes('@media (max-width: 760px)') &&
      optionsStyle.includes('@media (prefers-color-scheme: dark)'),
    'Options must provide a narrow-screen single-column layout.',
  ],
  [
    !optionsStyle.includes('min-width: 860px'),
    'Options must not force a desktop-only minimum viewport width.',
  ],
  [
    snapshotHistory.includes('role="alertdialog"'),
    'Snapshot rollback must use an explicit confirmation dialog semantic.',
  ],
  [
    snapshotHistory.includes("uiText('history.confirmRollback', locale)"),
    'Snapshot rollback must require an explicit second confirmation action.',
  ],
  [
    optionsApp.includes('class="settings-section global-error"'),
    'Options must surface background errors independently of the selected section.',
  ],
  [
    snapshotHistory.includes("uiText('history.verificationReferenceSafety', locale)"),
    'Snapshot history must disclose browser-safe runtime verification mode.',
  ],
  [
    !advancedProfileEditor.includes('https://example.invalid/') &&
      !advancedProfileEditor.includes('! Add rules here.') &&
      !advancedProfileEditor.includes("value: 'ZeroOmega Nex'"),
    'Profile source controls must create blank URL, rule text, and request-header values.',
  ],
  [
    !advancedProfileOperations.includes('! Add AutoProxy rules here.'),
    'New Rule List profiles must not persist instructional text as rule data.',
  ],
];

const failures = requirements.filter(([passed]) => !passed).map(([, message]) => message);

if (failures.length > 0) {
  console.error('UI compatibility validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  'UI compatibility guard passed: original navigation, full-tab pages, direct legacy import, automatic theme, keyboard focus, responsive layout, and rollback confirmation are present.',
);
