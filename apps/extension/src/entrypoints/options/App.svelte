<script lang="ts">
  import { productIdentity } from '@zeroomega-nex/core-contracts';
  import { cloneProfileSpecDraft } from '@zeroomega-nex/profile-spec';
  import type {
    FixedProfile,
    ProfileRouteTarget,
    ProfileSpec,
    SwitchProfile,
    UserProfile,
    VirtualProfile,
  } from '@zeroomega-nex/profile-spec';
  import {
    attachedRuleListProfileIds,
    createFixedProfileDraft,
    createPacProfileDraft,
    createSwitchProfileDraft,
    createVirtualProfileDraft,
    deleteProfileDraft,
    duplicateProfileDraft,
    inspectProfileWorkflow,
    listProfileReferenceBlockers,
    parseProfileWorkflowState,
    renameProfileDraft,
    replaceProfileReferencesDraft,
  } from '@zeroomega-nex/profile-workflow';
  import type {
    ProfileWorkflowCommandResponse,
    ProfileWorkflowIdFactory,
    ProfileReferenceBlocker,
    ProfileWorkflowPacSourceUpdateView,
    ProfileWorkflowProfileMutation,
    ProfileWorkflowRuleSourceUpdateView,
    ProfileWorkflowSecretMaterial,
    ProfileWorkflowState,
    ProfileWorkflowView,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';

  import ProfileIcon from '../../components/ProfileIcon.svelte';
  import { currentBrowserTargetCapabilities } from '../../lib/browser-target-capabilities';
  import { currentAppLocale } from '../../lib/i18n';
  import { profileKindText, uiMessage, uiText } from '../../lib/ui-messages';
  import {
    createProfilePacExport,
    createSwitchRuleListExport,
    inspectSwitchRuleListExport,
    type ProfileTextExport,
  } from '../../lib/profile-export';
  import {
    runWithRuleSourceOriginPermission,
    sendProfileWorkflowCommand,
    subscribeProfileWorkflowStateChanges,
  } from '../../lib/profile-workflow-client';
  import {
    requestProxyAuthenticationPermission,
    runWithProxyAuthenticationPermission,
  } from '../../lib/proxy-auth-permission-client';
  import {
    hasRequestDiagnosticsPermission,
    requestRequestDiagnosticsPermission,
  } from '../../lib/request-diagnostics-client';
  import {
    applyThemeMode,
    readThemeMode,
    storeThemeMode,
    type ThemeMode,
  } from '../../lib/ui-theme';
  import AdvancedProfileEditor from './AdvancedProfileEditor.svelte';
  import FixedProfileEditor from './FixedProfileEditor.svelte';
  import LegacyImportPanel from './LegacyImportPanel.svelte';
  import NewProfileDialog from './NewProfileDialog.svelte';
  import PacProfileEditor from './PacProfileEditor.svelte';
  import ProfileDeletionDialog from './ProfileDeletionDialog.svelte';
  import ProfileRenameDialog from './ProfileRenameDialog.svelte';
  import ProfileReplacementDialog from './ProfileReplacementDialog.svelte';
  import RuleListProfileEditor from './RuleListProfileEditor.svelte';
  import SnapshotHistoryPanel from './SnapshotHistoryPanel.svelte';
  import SwitchProfileEditor from './SwitchProfileEditor.svelte';
  import ThemePanel from './ThemePanel.svelte';
  import VirtualProfileEditor from './VirtualProfileEditor.svelte';

  type NewProfileKind = 'fixed' | 'switch' | 'pac' | 'virtual';

  type OptionsSection =
    | 'interface'
    | 'general'
    | 'import'
    | 'theme'
    | 'history'
    | 'builtin'
    | 'new-profile'
    | 'profile'
    | 'about';
  interface PendingProfileDeletion {
    readonly profileId: string;
    readonly profileName: string;
    readonly blockers: readonly ProfileReferenceBlocker[];
  }

  interface PendingProfileRename {
    readonly profileId: string;
    readonly profileName: string;
  }

  interface PendingProfileReplacement {
    readonly fromProfileId: string;
    readonly toProfileId: string;
  }

  type InterfaceFlag =
    | 'confirmDeletion'
    | 'showInspectMenu'
    | 'monitorWebRequests'
    | 'addConditionsToBottom'
    | 'showResultProfileOnActionBadgeText'
    | 'showExternalProfile'
    | 'showAdvancedConditions'
    | 'exportLegacyRuleList';

  let activeSection: OptionsSection = 'profile';
  let themeMode: ThemeMode = 'auto';
  let state: ProfileWorkflowState | undefined;
  let view: ProfileWorkflowView | undefined;
  let loading = true;
  let saving = false;
  let errorMessage = '';
  let lastAppliedSnapshotId = '';
  let beforeProfileEditorAction: (() => Promise<boolean>) | undefined;
  let profileEditorDirty = false;
  let profileEditorEpoch = 0;
  let hasUnappliedChanges = false;
  let diagnosticsPermissionGranted = false;
  let requestingDiagnosticsPermission = false;
  let pendingProfileDeletion: PendingProfileDeletion | undefined;
  let pendingProfileRename: PendingProfileRename | undefined;
  let pendingProfileReplacement: PendingProfileReplacement | undefined;
  let profileExporting = false;
  let profileExportMessage = '';
  let ruleListExportWarning = '';
  const locale = currentAppLocale();
  const browserTargetCapabilities = currentBrowserTargetCapabilities();

  let allProfiles: readonly UserProfile[] = [];
  let hiddenProfileIds: ReadonlySet<string> = new Set();
  let profiles: readonly UserProfile[] = [];
  let selectedProfile: UserProfile | undefined;
  let fixedProfile: FixedProfile | undefined;
  let switchProfile: SwitchProfile | undefined;
  let virtualProfile: VirtualProfile | undefined;

  $: allProfiles = state?.draft.profiles ?? [];
  $: hiddenProfileIds = state ? attachedRuleListProfileIds(state.draft) : new Set();
  $: profiles = allProfiles.filter((profile) => !hiddenProfileIds.has(profile.id));
  $: selectedProfile = profiles.find((profile) => profile.id === state?.selectedProfileId);
  $: fixedProfile = selectedProfile?.kind === 'fixed' ? selectedProfile : undefined;
  $: switchProfile = selectedProfile?.kind === 'switch' ? selectedProfile : undefined;
  $: virtualProfile = selectedProfile?.kind === 'virtual' ? selectedProfile : undefined;
  $: hasUnappliedChanges = Boolean(view?.dirty || profileEditorDirty);
  $: ruleListExportWarning =
    state && switchProfile
      ? (inspectSwitchRuleListExport(state.draft, switchProfile.id).warning ?? '')
      : '';

  const createWorkflowId: ProfileWorkflowIdFactory = (kind) => `${kind}-${crypto.randomUUID()}`;

  function profileType(profile: UserProfile): string {
    return profileKindText(profile.kind, locale);
  }

  function profileDisplayColor(profile: UserProfile): string {
    if (profile.kind !== 'virtual') return profile.color ?? '#90a4ae';
    const route = profile.targetRoute;
    if (route.kind === 'profile') {
      return profiles.find((candidate) => candidate.id === route.profileId)?.color ?? '#90a4ae';
    }
    if (route.kind === 'direct') {
      return state?.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee';
    }
    return state?.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88';
  }

  function routeValue(route: ProfileRouteTarget | undefined): string {
    if (route === undefined) return '';
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  function parseRouteValue(value: string): ProfileRouteTarget | undefined {
    if (value === '') return undefined;
    if (value === 'direct' || value === 'system') return { kind: value };
    return value.startsWith('profile:')
      ? { kind: 'profile', profileId: value.slice('profile:'.length) }
      : undefined;
  }

  function routeLabel(spec: ProfileSpec, route: ProfileRouteTarget): string {
    if (route.kind === 'direct') return uiText('route.direct', locale);
    if (route.kind === 'system') return uiText('route.system', locale);
    return (
      spec.profiles.find((profile) => profile.id === route.profileId)?.name ??
      uiText('route.missing', locale)
    );
  }

  function checkedFrom(event: Event): boolean {
    return (event.currentTarget as HTMLInputElement).checked;
  }

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
      .value;
  }

  function acceptResponse(response: ProfileWorkflowCommandResponse): boolean {
    if (response.ok) {
      state = response.state;
      view = response.view;
      if (response.appliedSnapshotId !== undefined) {
        lastAppliedSnapshotId = response.appliedSnapshotId;
      }
      errorMessage = '';
      return true;
    }
    errorMessage = uiText('options.error.safeMessage', locale);
    if (response.state) state = response.state;
    if (response.view) view = response.view;
    return false;
  }

  async function loadWorkflow(): Promise<void> {
    loading = true;
    try {
      acceptResponse(await sendProfileWorkflowCommand({ action: 'get' }));
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    } finally {
      loading = false;
    }
  }

  async function runCommand(
    command: Parameters<typeof sendProfileWorkflowCommand>[0],
  ): Promise<boolean> {
    if (saving) return false;
    saving = true;
    try {
      return acceptResponse(await sendProfileWorkflowCommand(command));
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
      return false;
    } finally {
      saving = false;
    }
  }

  function registerBeforeProfileEditorAction(guard: (() => Promise<boolean>) | undefined): void {
    beforeProfileEditorAction = guard;
  }

  function updateProfileEditorDirty(dirty: boolean): void {
    profileEditorDirty = dirty;
  }

  async function commitActiveProfileEditor(): Promise<boolean> {
    return beforeProfileEditorAction ? beforeProfileEditorAction() : true;
  }

  async function selectProfile(profileId: string): Promise<void> {
    if (!(await navigate('profile', profileId))) return;
    if (!state || state.selectedProfileId === profileId) return;
    await runCommand({
      action: 'select-profile',
      expectedGeneration: state.generation,
      profileId,
    });
  }

  async function replaceDraft(draft: ProfileSpec): Promise<boolean> {
    if (!state) return false;
    return runCommand({
      action: 'replace-draft',
      expectedGeneration: state.generation,
      draft,
    });
  }

  async function acceptImportedDraft(
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    return runCommand({
      action: 'accept-import',
      expectedGeneration,
      candidate,
      secretMaterials,
    });
  }

  async function replaceDraftWithSecrets(
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    if (!state) return false;
    return acceptImportedDraft(state.generation, candidate, secretMaterials);
  }

  async function readSecret(secretRef: string): Promise<string> {
    if (!state || saving) return '';
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'read-secret',
        expectedGeneration: state.generation,
        secretRef,
      });
      if (!acceptResponse(response) || !response.ok) return '';
      return response.secretValue ?? '';
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
      return '';
    } finally {
      saving = false;
    }
  }

  async function getRuleSourceUpdateStatus(
    sourceId: string,
  ): Promise<ProfileWorkflowRuleSourceUpdateView | undefined> {
    if (!state) return undefined;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'get-rule-source-update-status',
        sourceId,
      });
      if (!response.ok) {
        errorMessage = uiText('options.error.safeMessage', locale);
        return undefined;
      }
      return response.ruleSourceUpdate;
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
      return undefined;
    }
  }

  async function updateRuleSource(
    sourceId: string,
    url: string,
  ): Promise<ProfileWorkflowRuleSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    try {
      const permission = await runWithRuleSourceOriginPermission(url, async () => {
        if (!state) return undefined;
        saving = true;
        try {
          const response = await sendProfileWorkflowCommand({
            action: 'update-rule-source',
            expectedGeneration: state.generation,
            sourceId,
          });
          acceptResponse(response);
          return response.ruleSourceUpdate;
        } finally {
          saving = false;
        }
      });
      if (!permission.granted) {
        errorMessage = uiText('options.error.ruleListPermission', locale);
        return undefined;
      }
      return permission.value;
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
      return undefined;
    }
  }

  async function getPacSourceUpdateStatus(
    profileId: string,
  ): Promise<ProfileWorkflowPacSourceUpdateView | undefined> {
    if (!state) return undefined;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'get-pac-source-update-status',
        profileId,
      });
      if (!response.ok) {
        errorMessage = uiText('options.error.safeMessage', locale);
        return undefined;
      }
      return response.pacSourceUpdate;
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
      return undefined;
    }
  }

  async function updatePacSource(
    profileId: string,
    url: string,
  ): Promise<ProfileWorkflowPacSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    try {
      const permission = await runWithRuleSourceOriginPermission(url, async () => {
        if (!state) return undefined;
        saving = true;
        try {
          const response = await sendProfileWorkflowCommand({
            action: 'update-pac-source',
            expectedGeneration: state.generation,
            profileId,
          });
          acceptResponse(response);
          return response.pacSourceUpdate;
        } finally {
          saving = false;
        }
      });
      if (!permission.granted) {
        errorMessage = uiText('options.error.pacPermission', locale);
        return undefined;
      }
      return permission.value;
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
      return undefined;
    }
  }

  async function acceptImportedAndApply(
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    const permission = await runWithProxyAuthenticationPermission(candidate, async () => {
      if (!(await acceptImportedDraft(expectedGeneration, candidate, secretMaterials)) || !state) {
        return false;
      }
      return runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      });
    });
    if (!permission.granted) {
      errorMessage = uiText('options.error.proxyAuthPermission', locale);
      return false;
    }
    return permission.value;
  }

  async function rollbackSnapshot(
    expectedGeneration: number,
    snapshotId: string,
  ): Promise<boolean> {
    return runCommand({
      action: 'rollback-snapshot',
      expectedGeneration,
      snapshotId,
    });
  }

  async function replaceDraftAndSelect(mutation: ProfileWorkflowProfileMutation): Promise<void> {
    if (!(await replaceDraft(mutation.draft))) return;
    if (state?.draft.profiles.some((profile) => profile.id === mutation.profileId)) {
      await selectProfile(mutation.profileId);
    }
  }

  async function mutateDraft(update: (draft: ProfileSpec) => void): Promise<void> {
    if (!state) return;
    const draft = cloneProfileSpecDraft(state.draft);
    update(draft);
    await replaceDraft(draft);
  }

  async function createNamedProfile(kind: NewProfileKind, name: string): Promise<void> {
    if (!state) return;
    try {
      const mutation =
        kind === 'fixed'
          ? createFixedProfileDraft(state.draft, createWorkflowId, name)
          : kind === 'switch'
            ? createSwitchProfileDraft(state.draft, createWorkflowId, name)
            : kind === 'pac'
              ? createPacProfileDraft(state.draft, createWorkflowId, name)
              : createVirtualProfileDraft(state.draft, createWorkflowId, name);
      await replaceDraftAndSelect(mutation);
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    }
  }

  function cancelNewProfile(): void {
    if (selectedProfile) void navigate('profile', selectedProfile.id);
    else void navigate('about');
  }

  async function duplicateSelectedProfile(): Promise<void> {
    if (!state || !selectedProfile || !(await commitActiveProfileEditor())) return;
    try {
      await replaceDraftAndSelect(
        duplicateProfileDraft(state.draft, selectedProfile.id, createWorkflowId),
      );
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    }
  }

  async function performProfileDeletion(profileId: string): Promise<void> {
    if (!state) return;
    try {
      if (await replaceDraft(deleteProfileDraft(state.draft, profileId))) {
        pendingProfileDeletion = undefined;
      }
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    }
  }

  function downloadProfileText(exported: ProfileTextExport): void {
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

  async function prepareSelectedProfileExport(): Promise<
    { readonly spec: ProfileSpec; readonly profileId: string } | undefined
  > {
    if (!state || !selectedProfile || saving || profileExporting || view?.busy) return undefined;
    const profileId = selectedProfile.id;
    if (!(await commitActiveProfileEditor()) || !state) return undefined;
    if (!state.draft.profiles.some((profile) => profile.id === profileId)) return undefined;
    return { spec: structuredClone(state.draft), profileId };
  }

  async function exportSelectedPac(): Promise<void> {
    const prepared = await prepareSelectedProfileExport();
    if (!prepared) return;
    profileExporting = true;
    profileExportMessage = '';
    try {
      const result = await createProfilePacExport(prepared.spec, prepared.profileId, {
        createdAt: new Date(),
      });
      if (!result.ok) throw new Error(result.issues.join(' '));
      downloadProfileText(result.exported);
      profileExportMessage = uiMessage(
        'options.exported',
        { filename: result.exported.filename, warnings: result.exported.warnings.length },
        locale,
      );
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    } finally {
      profileExporting = false;
    }
  }

  async function exportSelectedRuleList(): Promise<void> {
    const prepared = await prepareSelectedProfileExport();
    if (!prepared) return;
    profileExporting = true;
    profileExportMessage = '';
    try {
      const result = createSwitchRuleListExport(prepared.spec, prepared.profileId, {
        createdAt: new Date(),
      });
      if (!result.ok) throw new Error(result.issues.join(' '));
      downloadProfileText(result.exported);
      profileExportMessage = uiMessage(
        'options.exported',
        { filename: result.exported.filename, warnings: result.exported.warnings.length },
        locale,
      );
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    } finally {
      profileExporting = false;
    }
  }

  async function deleteSelectedProfile(): Promise<void> {
    if (!state || !selectedProfile || !(await commitActiveProfileEditor())) return;
    try {
      const blockers = listProfileReferenceBlockers(state.draft, selectedProfile.id);
      const request: PendingProfileDeletion = {
        profileId: selectedProfile.id,
        profileName: selectedProfile.name,
        blockers,
      };
      if (blockers.length > 0 || state.draft.settings.interface.confirmDeletion) {
        pendingProfileDeletion = request;
        return;
      }
      await performProfileDeletion(request.profileId);
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    }
  }

  async function confirmProfileDeletion(): Promise<void> {
    const request = pendingProfileDeletion;
    if (!request || request.blockers.length > 0) return;
    await performProfileDeletion(request.profileId);
  }

  async function requestSelectedProfileRename(): Promise<void> {
    if (
      !state ||
      !selectedProfile ||
      saving ||
      view?.busy ||
      !(await commitActiveProfileEditor())
    ) {
      return;
    }
    const profileId = selectedProfile.id;
    if (view?.dirty) {
      const confirmed = globalThis.confirm(uiText('options.confirm.rename', locale));
      if (!confirmed) return;
      const permission = await runWithProxyAuthenticationPermission(state.draft, () =>
        runCommand({
          action: 'apply',
          expectedGeneration: state!.generation,
        }),
      );
      if (!permission.granted) {
        errorMessage = uiText('options.error.proxyAuthPermission', locale);
        return;
      }
      if (!permission.value) return;
    }
    const current = state?.draft.profiles.find((profile) => profile.id === profileId);
    if (!current) {
      errorMessage = uiText('options.error.safeMessage', locale);
      return;
    }
    pendingProfileRename = { profileId, profileName: current.name };
  }

  async function confirmProfileRename(name: string): Promise<void> {
    const request = pendingProfileRename;
    if (!state || !request) return;
    try {
      if (await replaceDraft(renameProfileDraft(state.draft, request.profileId, name))) {
        pendingProfileRename = undefined;
      }
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    }
  }

  async function requestProfileReplacement(
    fromProfileId: string,
    toProfileId: string,
  ): Promise<void> {
    if (!state || saving || view?.busy || !(await commitActiveProfileEditor())) return;
    if (view?.dirty) {
      const confirmed = globalThis.confirm(uiText('options.confirm.replace', locale));
      if (!confirmed) return;
      const permission = await runWithProxyAuthenticationPermission(state.draft, () =>
        runCommand({
          action: 'apply',
          expectedGeneration: state!.generation,
        }),
      );
      if (!permission.granted) {
        errorMessage = uiText('options.error.proxyAuthPermission', locale);
        return;
      }
      if (!permission.value) return;
    }
    if (
      !state.draft.profiles.some((profile) => profile.id === fromProfileId) ||
      !state.draft.profiles.some((profile) => profile.id === toProfileId)
    ) {
      errorMessage = uiText('options.error.replacementMissing', locale);
      return;
    }
    pendingProfileReplacement = { fromProfileId, toProfileId };
  }

  async function confirmProfileReplacement(
    fromProfileId: string,
    toProfileId: string,
  ): Promise<void> {
    if (!state) return;
    try {
      if (
        await replaceDraft(replaceProfileReferencesDraft(state.draft, fromProfileId, toProfileId))
      ) {
        pendingProfileReplacement = undefined;
      }
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    }
  }

  async function updateProfileColor(color: string): Promise<void> {
    if (!selectedProfile) return;
    const profileId = selectedProfile.id;
    await mutateDraft((draft) => {
      const profile = draft.profiles.find((candidate) => candidate.id === profileId);
      if (!profile) return;
      profile.color = color;
      if (profile.kind !== 'switch' || profile.attachedRuleListProfileId === undefined) return;
      const attached = draft.profiles.find(
        (candidate) =>
          candidate.id === profile.attachedRuleListProfileId && candidate.kind === 'rule-list',
      );
      if (attached) attached.color = color;
    });
  }

  async function updateStartupRoute(value: string): Promise<void> {
    const route = parseRouteValue(value);
    await mutateDraft((draft) => {
      if (route === undefined) delete draft.settings.startup.route;
      else draft.settings.startup.route = route;
    });
  }

  async function updateStartupRevert(revertProxyChanges: boolean): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.startup.revertProxyChanges = revertProxyChanges;
    });
  }

  async function updateQuickSwitchFlag(
    field: 'enabled' | 'refreshOnChange',
    value: boolean,
  ): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.quickSwitch[field] = value;
    });
  }

  async function addQuickSwitchRoute(value: string, event: Event): Promise<void> {
    const route = parseRouteValue(value);
    (event.currentTarget as HTMLSelectElement).value = '';
    if (!route) return;
    await mutateDraft((draft) => {
      if (
        !draft.settings.quickSwitch.routes.some(
          (candidate) => routeValue(candidate) === routeValue(route),
        )
      ) {
        draft.settings.quickSwitch.routes.push(route);
      }
    });
  }

  async function removeQuickSwitchRoute(index: number): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.quickSwitch.routes.splice(index, 1);
    });
  }

  async function moveQuickSwitchRoute(index: number, offset: -1 | 1): Promise<void> {
    await mutateDraft((draft) => {
      const routes = draft.settings.quickSwitch.routes;
      const target = index + offset;
      if (target < 0 || target >= routes.length) return;
      const [route] = routes.splice(index, 1);
      if (route) routes.splice(target, 0, route);
    });
  }

  async function refreshDiagnosticsPermission(): Promise<void> {
    diagnosticsPermissionGranted = await hasRequestDiagnosticsPermission().catch(() => false);
  }

  async function grantDiagnosticsPermission(): Promise<void> {
    if (requestingDiagnosticsPermission) return;
    requestingDiagnosticsPermission = true;
    errorMessage = '';
    try {
      diagnosticsPermissionGranted = await requestRequestDiagnosticsPermission();
      if (!diagnosticsPermissionGranted) {
        errorMessage = uiText('general.diagnostics.permissionDenied', locale);
      }
    } catch {
      errorMessage = uiText('general.diagnostics.permissionFailed', locale);
    } finally {
      requestingDiagnosticsPermission = false;
    }
  }

  function openRequestDiagnostics(): void {
    window.open('/network.html', '_blank', 'noopener,noreferrer');
  }

  async function updateInterfaceFlag(field: InterfaceFlag, value: boolean): Promise<void> {
    await mutateDraft((draft) => {
      draft.settings.interface[field] = value;
    });
  }

  async function updateBuiltInColor(kind: 'direct' | 'system', color: string): Promise<void> {
    await mutateDraft((draft) => {
      const appearance = draft.settings.interface.builtInProfiles ?? {};
      appearance[kind] = { color };
      draft.settings.interface.builtInProfiles = appearance;
    });
  }

  function pageHash(section: OptionsSection, profileId: string | undefined = undefined): string {
    return section === 'profile' && profileId
      ? `#/profile/${encodeURIComponent(profileId)}`
      : `#/${section}`;
  }

  function currentPageHash(): string {
    return pageHash(
      activeSection,
      activeSection === 'profile' ? state?.selectedProfileId : undefined,
    );
  }

  async function navigate(
    section: OptionsSection,
    profileId: string | undefined = undefined,
    updateLocation = true,
  ): Promise<boolean> {
    const leavingCurrentProfile =
      activeSection === 'profile' &&
      (section !== 'profile' || profileId !== state?.selectedProfileId);
    if (leavingCurrentProfile && !(await commitActiveProfileEditor())) return false;

    activeSection = section;
    if (typeof window === 'undefined' || !updateLocation) return true;
    const hash = pageHash(section, profileId);
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    return true;
  }

  async function syncNavigationFromLocation(): Promise<void> {
    if (typeof window === 'undefined') return;
    const previousHash = currentPageHash();
    const hash = window.location.hash.replace(/^#\//u, '');
    if (!hash) {
      if (!(await navigate('profile', state?.selectedProfileId, false))) {
        window.history.replaceState(null, '', previousHash);
      }
      return;
    }
    if (hash.startsWith('profile/')) {
      const profileId = decodeURIComponent(hash.slice('profile/'.length));
      if (!profiles.some((profile) => profile.id === profileId)) {
        window.history.replaceState(null, '', previousHash);
        return;
      }
      if (!(await navigate('profile', profileId, false))) {
        window.history.replaceState(null, '', previousHash);
        return;
      }
      const currentState = state;
      if (!currentState) return;
      if (currentState.selectedProfileId !== profileId && !saving) {
        await runCommand({
          action: 'select-profile',
          expectedGeneration: currentState.generation,
          profileId,
        });
      }
      return;
    }
    const section = hash as OptionsSection;
    if (
      [
        'interface',
        'general',
        'import',
        'theme',
        'history',
        'builtin',
        'new-profile',
        'about',
      ].includes(section)
    ) {
      if (!(await navigate(section, undefined, false))) {
        window.history.replaceState(null, '', previousHash);
      }
    }
  }

  function updateThemeMode(mode: ThemeMode): void {
    themeMode = mode;
    storeThemeMode(mode);
  }

  async function revertDraft(): Promise<void> {
    if (!state || !hasUnappliedChanges) return;
    let reverted = true;
    if (view?.dirty) {
      reverted = await runCommand({
        action: 'revert',
        expectedGeneration: state.generation,
      });
    }
    if (!reverted) return;
    beforeProfileEditorAction = undefined;
    profileEditorDirty = false;
    profileEditorEpoch += 1;
  }

  async function applyDraft(): Promise<void> {
    if (!state || !hasUnappliedChanges) return;
    const permission = await runWithProxyAuthenticationPermission(state.draft, async () => {
      if (!state || !(await commitActiveProfileEditor()) || !view?.dirty) return false;
      return runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      });
    });
    if (!permission.granted) {
      errorMessage = uiText('options.error.proxyAuthPermission', locale);
    }
  }

  async function prepareLegacyExport(): Promise<ProfileSpec | undefined> {
    if (!state || saving || view?.busy || !(await commitActiveProfileEditor())) return undefined;
    if (view?.dirty) {
      const confirmed = globalThis.confirm(uiText('options.confirm.export', locale));
      if (!confirmed) return undefined;
      const permission = await runWithProxyAuthenticationPermission(state.draft, () =>
        runCommand({
          action: 'apply',
          expectedGeneration: state!.generation,
        }),
      );
      if (!permission.granted) {
        errorMessage = uiText('options.error.proxyAuthPermission', locale);
        return undefined;
      }
      if (!permission.value) return undefined;
    }
    return state ? structuredClone(state.applied) : undefined;
  }

  function applyStatus(): string {
    const record = state?.lastApply;
    if (!record) return uiText('options.apply.noAttempt', locale);
    return uiText(
      record.status === 'succeeded' ? 'options.apply.succeeded' : 'options.apply.failed',
      locale,
    );
  }

  onMount(() => {
    themeMode = readThemeMode();
    applyThemeMode(themeMode);
    let disposed = false;
    let unsubscribeWorkflowChanges: () => void = () => undefined;
    const handleNavigation = () => void syncNavigationFromLocation();
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    unsubscribeWorkflowChanges = subscribeProfileWorkflowStateChanges((value) => {
      if (value === undefined) {
        void loadWorkflow();
        return;
      }
      try {
        const nextState = parseProfileWorkflowState(value);
        state = nextState;
        view = inspectProfileWorkflow(nextState);
        errorMessage = '';
      } catch {
        errorMessage = uiText('options.error.safeMessage', locale);
      }
    });
    void Promise.all([loadWorkflow(), refreshDiagnosticsPermission()]).then(() => {
      if (!disposed) void syncNavigationFromLocation();
    });
    return () => {
      disposed = true;
      unsubscribeWorkflowChanges();
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  });
</script>

<svelte:head>
  <title>{uiText('options.documentTitle', locale)}</title>
</svelte:head>

<div class="app-shell" data-options-shell-locale={locale}>
  <aside class="sidebar">
    <header class="side-brand">
      <button type="button" onclick={() => void navigate('about')}>
        <span class="brand-mark" aria-hidden="true">Ω</span>
        <span>{productIdentity.name}</span>
      </button>
    </header>

    <nav class="side-navigation" aria-label={uiText('options.navAria', locale)}>
      <section class="nav-group">
        <h2>{uiText('options.nav.settings', locale)}</h2>
        <button
          class:active={activeSection === 'interface'}
          data-interface-action
          type="button"
          onclick={() => void navigate('interface')}
        >
          <span aria-hidden="true">⌘</span><span>{uiText('options.nav.interface', locale)}</span>
        </button>
        <button
          class:active={activeSection === 'general'}
          type="button"
          onclick={() => void navigate('general')}
        >
          <span aria-hidden="true">⚙</span><span>{uiText('options.nav.general', locale)}</span>
        </button>
        <button
          class:active={activeSection === 'import'}
          type="button"
          disabled={!state || saving || view?.busy}
          onclick={() => void navigate('import')}
        >
          <span aria-hidden="true">⇅</span><span>{uiText('legacy.pageTitle', locale)}</span>
        </button>
        <button
          class:active={activeSection === 'theme'}
          type="button"
          onclick={() => void navigate('theme')}
        >
          <span aria-hidden="true">◐</span><span>{uiText('options.nav.theme', locale)}</span>
        </button>
        <button
          class:active={activeSection === 'history'}
          type="button"
          disabled={!state || saving || view?.busy}
          onclick={() => void navigate('history')}
        >
          <span aria-hidden="true">↶</span><span>{uiText('history.nav', locale)}</span>
        </button>
      </section>

      <section class="nav-group profiles-nav">
        <h2>{uiText('options.nav.profiles', locale)}</h2>
        <button
          class:active={activeSection === 'builtin'}
          type="button"
          onclick={() => void navigate('builtin')}
        >
          <span class="builtin-marker" aria-hidden="true">◎</span><span
            >{uiText('options.nav.builtIn', locale)}</span
          >
        </button>
        {#each profiles as profile (profile.id)}
          <button
            class="nav-profile"
            class:active={activeSection === 'profile' && profile.id === state?.selectedProfileId}
            type="button"
            disabled={saving}
            onclick={() => selectProfile(profile.id)}
          >
            <ProfileIcon kind={profile.kind} color={profile.color ?? '#90a4ae'} size={22} />
            <span>{profile.name}</span>
          </button>
        {/each}
        <button
          class:active={activeSection === 'new-profile'}
          data-new-profile-action
          type="button"
          disabled={!state || view?.busy || saving}
          onclick={() => void navigate('new-profile')}
        >
          <span aria-hidden="true">＋</span><span>{uiText('options.nav.newProfile', locale)}</span>
        </button>
      </section>

      <section class="nav-group actions" data-options-actions data-typed-locale={locale}>
        <h2>{uiText('options.nav.actions', locale)}</h2>
        <button
          type="button"
          class="primary"
          disabled={!hasUnappliedChanges || view?.busy || saving}
          onclick={applyDraft}
        >
          <span aria-hidden="true">✓</span><span
            >{uiText(saving ? 'options.actions.working' : 'options.actions.apply', locale)}</span
          >
        </button>
        <button
          type="button"
          class="discard"
          disabled={!hasUnappliedChanges || view?.busy || saving}
          onclick={revertDraft}
        >
          <span aria-hidden="true">×</span><span>{uiText('options.actions.discard', locale)}</span>
        </button>
        <p class="draft-status" role="status">
          {uiText(
            view?.busy
              ? 'options.draft.applying'
              : profileEditorDirty
                ? 'options.draft.sourceDirty'
                : view?.dirty
                  ? 'options.draft.dirty'
                  : 'options.draft.clean',
            locale,
          )}
        </p>
      </section>
    </nav>
  </aside>

  <main class="editor">
    {#if errorMessage}
      <section class="settings-section global-error" aria-live="assertive">
        <h2>{uiText('options.error.title', locale)}</h2>
        <p role="alert">{errorMessage}</p>
      </section>
    {/if}

    {#if loading}
      <section class="settings-section shell-status">
        <h1>{uiText('options.loading.title', locale)}</h1>
        <p>{uiText('options.loading.help', locale)}</p>
      </section>
    {:else if activeSection === 'general' && state}
      <header class="editor-heading" data-general-settings data-typed-locale={locale}>
        <div>
          <h1>{uiText('general.title', locale)}</h1>
          <p>{uiText('general.help', locale)}</p>
        </div>
      </header>
      <section class="settings-section">
        <h2>{uiText('general.startup.title', locale)}</h2>
        <label>
          {uiText('general.startup.label', locale)}
          <select
            aria-label={uiText('general.startup.aria', locale)}
            value={routeValue(state.draft.settings.startup.route)}
            disabled={saving || view?.busy}
            onchange={(event) => updateStartupRoute(valueFrom(event))}
          >
            <option value="">{uiText('general.startup.keepCurrent', locale)}</option>
            <option value="direct">{uiText('route.direct', locale)}</option>
            <option value="system">{uiText('route.system', locale)}</option>
            {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}
                >{profile.name}</option
              >{/each}
          </select>
        </label>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.startup.revertProxyChanges}
            disabled={saving || view?.busy}
            onchange={(event) => updateStartupRevert(checkedFrom(event))}
          />
          {uiText('general.startup.revert', locale)}
        </label>
      </section>
      <section class="settings-section">
        <h2>{uiText('general.quickSwitch.title', locale)}</h2>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.enabled}
            disabled={saving || view?.busy}
            onchange={(event) => updateQuickSwitchFlag('enabled', checkedFrom(event))}
          />
          {uiText('general.quickSwitch.enable', locale)}
        </label>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.refreshOnChange}
            disabled={saving || view?.busy}
            onchange={(event) => updateQuickSwitchFlag('refreshOnChange', checkedFrom(event))}
          />
          {uiText('general.quickSwitch.refreshTabs', locale)}
        </label>
        <ol class="route-order" aria-label={uiText('general.quickSwitch.orderAria', locale)}>
          {#each state.draft.settings.quickSwitch.routes as route, index (`${routeValue(route)}:${index}`)}
            <li>
              <span>{routeLabel(state.draft, route)}</span>
              <span class="row-actions">
                <button
                  type="button"
                  disabled={saving || view?.busy || index === 0}
                  onclick={() => moveQuickSwitchRoute(index, -1)}
                  >{uiText('general.quickSwitch.up', locale)}</button
                >
                <button
                  type="button"
                  disabled={saving ||
                    view?.busy ||
                    index === state.draft.settings.quickSwitch.routes.length - 1}
                  onclick={() => moveQuickSwitchRoute(index, 1)}
                  >{uiText('general.quickSwitch.down', locale)}</button
                >
                <button
                  type="button"
                  disabled={saving ||
                    view?.busy ||
                    route.kind === 'direct' ||
                    route.kind === 'system'}
                  onclick={() => removeQuickSwitchRoute(index)}
                  >{uiText('general.quickSwitch.remove', locale)}</button
                >
              </span>
            </li>
          {/each}
        </ol>
        <select
          aria-label={uiText('general.quickSwitch.addAria', locale)}
          disabled={saving || view?.busy}
          onchange={(event) => addQuickSwitchRoute(valueFrom(event), event)}
        >
          <option value="">{uiText('general.quickSwitch.addProfile', locale)}</option>
          <option value="direct">{uiText('route.direct', locale)}</option>
          <option value="system">{uiText('route.system', locale)}</option>
          {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}
              >{profile.name}</option
            >{/each}
        </select>
      </section>
      <section class="settings-section option-list" data-request-diagnostics-settings>
        <h2>{uiText('general.diagnostics.title', locale)}</h2>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.interface.monitorWebRequests ?? true}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('monitorWebRequests', checkedFrom(event))}
          />
          {uiText('general.diagnostics.allow', locale)}
        </label>
        <p>{uiText('general.diagnostics.help', locale)}</p>
        <div class="settings-actions">
          {#if diagnosticsPermissionGranted}
            <span role="status">{uiText('general.diagnostics.permissionGranted', locale)}</span>
          {:else}
            <button
              type="button"
              data-request-diagnostics-permission
              disabled={requestingDiagnosticsPermission}
              onclick={() => void grantDiagnosticsPermission()}
            >
              {uiText(
                requestingDiagnosticsPermission
                  ? 'general.diagnostics.requesting'
                  : 'general.diagnostics.grant',
                locale,
              )}
            </button>
          {/if}
          <button type="button" onclick={openRequestDiagnostics}>
            {uiText('general.diagnostics.open', locale)}
          </button>
        </div>
      </section>
    {:else if activeSection === 'interface' && state}
      <header class="editor-heading" data-interface-settings data-typed-locale={locale}>
        <div>
          <h1>{uiText('interface.title', locale)}</h1>
          <p>{uiText('interface.help', locale)}</p>
        </div>
      </header>
      <section class="settings-section option-list">
        <h2>{uiText('interface.confirmation.title', locale)}</h2>
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.confirmDeletion}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('confirmDeletion', checkedFrom(event))}
          />{uiText('interface.confirmDeletion', locale)}</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.addConditionsToBottom}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('addConditionsToBottom', checkedFrom(event))}
          />{uiText('interface.addConditionsBottom', locale)}</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            data-show-advanced-conditions-setting
            checked={state.draft.settings.interface.showAdvancedConditions}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showAdvancedConditions', checkedFrom(event))}
          />{uiText('interface.showAdvanced', locale)}</label
        >
      </section>
      <section class="settings-section option-list">
        <h2>{uiText('interface.menus.title', locale)}</h2>
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showInspectMenu}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showInspectMenu', checkedFrom(event))}
          />{uiText('interface.showInspect', locale)}</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showResultProfileOnActionBadgeText}
            disabled={saving || view?.busy}
            onchange={(event) =>
              updateInterfaceFlag('showResultProfileOnActionBadgeText', checkedFrom(event))}
          />{uiText('interface.showResultBadge', locale)}</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showExternalProfile}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showExternalProfile', checkedFrom(event))}
          />{uiText('interface.showExternal', locale)}</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            data-export-legacy-rule-list-setting
            checked={state.draft.settings.interface.exportLegacyRuleList}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('exportLegacyRuleList', checkedFrom(event))}
          />{uiText('interface.exportLegacyRuleList', locale)}</label
        >
      </section>
    {:else if activeSection === 'theme'}
      <header class="editor-heading" data-theme-settings data-typed-locale={locale}>
        <div>
          <h1>{uiText('theme.pageTitle', locale)}</h1>
          <p>{uiText('theme.pageHelp', locale)}</p>
        </div>
      </header>
      <ThemePanel {locale} mode={themeMode} onChange={updateThemeMode} />
    {:else if activeSection === 'import' && state}
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
    {:else if activeSection === 'history' && state}
      <header class="editor-heading">
        <div>
          <h1>{uiText('history.pageTitle', locale)}</h1>
          <p>{uiText('history.pageHelp', locale)}</p>
        </div>
      </header>
      <SnapshotHistoryPanel
        {locale}
        disabled={saving || view?.busy === true}
        dirty={view?.dirty === true}
        generation={state.generation}
        onRollbackSnapshot={rollbackSnapshot}
      />
    {:else if activeSection === 'builtin' && state}
      <header class="editor-heading" data-builtin-settings data-typed-locale={locale}>
        <div>
          <h1>{uiText('options.nav.builtIn', locale)}</h1>
          <p>{uiText('options.builtin.help', locale)}</p>
        </div>
      </header>
      <section class="settings-section builtin-grid">
        <label class="builtin-card"
          ><ProfileIcon
            kind="direct"
            color={state.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee'}
            size={28}
          /><strong>{uiText('route.direct', locale)}</strong><span
            >{uiText('options.builtin.directHelp', locale)}</span
          ><input
            aria-label={uiText('options.builtin.directColorAria', locale)}
            type="color"
            value={state.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee'}
            disabled={saving || view?.busy}
            onchange={(event) => updateBuiltInColor('direct', valueFrom(event))}
          /></label
        >
        <label class="builtin-card"
          ><ProfileIcon
            kind="system"
            color={state.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88'}
            size={28}
          /><strong>{uiText('route.system', locale)}</strong><span
            >{uiText('options.builtin.systemHelp', locale)}</span
          ><input
            aria-label={uiText('options.builtin.systemColorAria', locale)}
            type="color"
            value={state.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88'}
            disabled={saving || view?.busy}
            onchange={(event) => updateBuiltInColor('system', valueFrom(event))}
          /></label
        >
      </section>
    {:else if activeSection === 'new-profile'}
      <section
        class="settings-section shell-status"
        data-new-profile-shell
        data-typed-locale={locale}
        aria-hidden="true"
      >
        <h1>{uiText('options.nav.profiles', locale)}</h1>
        <p>{uiText('options.newProfileShell.help', locale)}</p>
      </section>
      {#if state}
        <NewProfileDialog
          {locale}
          existingNames={profiles.map((profile) => profile.name)}
          disabled={saving || view?.busy === true}
          pacCapability={browserTargetCapabilities.pacProfiles}
          onCancel={cancelNewProfile}
          onCreate={createNamedProfile}
        />
      {/if}
    {:else if activeSection === 'about'}
      <div data-about-settings data-typed-locale={locale}>
        <header class="editor-heading">
          <div>
            <h1>{productIdentity.name}</h1>
            <p>{productIdentity.milestone}</p>
          </div>
        </header>
        <section class="settings-section">
          <h2>{uiText('options.about.compatibilityTitle', locale)}</h2>
          <p>{uiText('options.about.compatibilityHelp', locale)}</p>
        </section>
      </div>
    {:else if selectedProfile && state}
      <header class="editor-heading">
        <div class="profile-title">
          <ProfileIcon
            kind={selectedProfile.kind}
            color={profileDisplayColor(selectedProfile)}
            size={30}
          />
          <div>
            <h1>{selectedProfile.name}</h1>
            <p>{profileType(selectedProfile)}</p>
          </div>
        </div>
        <div class="profile-actions">
          {#if switchProfile}
            <button
              type="button"
              class:warning={ruleListExportWarning.length > 0}
              data-profile-export-rule-list
              data-profile-export-rule-list-warning={ruleListExportWarning.length > 0}
              title={ruleListExportWarning || uiText('options.export.ruleListTitle', locale)}
              disabled={view?.busy || saving || profileExporting}
              onclick={() => void exportSelectedRuleList()}
            >
              {uiText('options.export.ruleList', locale)}
            </button>
          {/if}
          {#if selectedProfile.kind !== 'auto-detect'}
            <button
              type="button"
              data-profile-export-pac
              title={uiText('options.export.pacTitle', locale)}
              disabled={view?.busy || saving || profileExporting}
              onclick={() => void exportSelectedPac()}
            >
              {uiText('options.export.pac', locale)}
            </button>
          {/if}
          <button
            type="button"
            data-profile-rename-action
            disabled={view?.busy || saving || profileExporting}
            onclick={() => void requestSelectedProfileRename()}
            >{uiText('profile.rename.action', locale)}</button
          >
          <button
            type="button"
            disabled={view?.busy || saving || profileExporting}
            onclick={duplicateSelectedProfile}>{uiText('common.duplicate', locale)}</button
          ><button
            type="button"
            class="danger"
            data-profile-delete-action
            disabled={view?.busy || saving}
            onclick={deleteSelectedProfile}>{uiText('common.delete', locale)}</button
          >
        </div>
      </header>
      {#if profileExportMessage}
        <p class="profile-export-status" role="status" data-profile-export-status>
          {profileExportMessage}
        </p>
      {/if}
      <section class="settings-section profile-identity-editor">
        <label class="profile-color-field">
          <span>{uiText('profile.color', locale)}</span>
          <input
            aria-label={uiText('profile.color', locale)}
            type="color"
            value={profileDisplayColor(selectedProfile)}
            disabled={saving || view?.busy || selectedProfile.kind === 'virtual'}
            onchange={(event) => updateProfileColor(valueFrom(event))}
          />
        </label>
      </section>
      {#if fixedProfile}
        <FixedProfileEditor
          {locale}
          spec={state.draft}
          profileId={fixedProfile.id}
          generation={state.generation}
          disabled={saving || view?.busy === true}
          idFactory={createWorkflowId}
          onReplaceDraft={replaceDraft}
          onReplaceDraftWithSecrets={replaceDraftWithSecrets}
          onReadSecret={readSecret}
        />
      {:else if switchProfile}
        {#key `${switchProfile.id}:${profileEditorEpoch}`}
          <SwitchProfileEditor
            {locale}
            spec={state.draft}
            profileId={switchProfile.id}
            disabled={saving || view?.busy === true}
            idFactory={createWorkflowId}
            onReplaceDraft={replaceDraft}
            onGetRuleSourceUpdateStatus={getRuleSourceUpdateStatus}
            onUpdateRuleSource={updateRuleSource}
            onRegisterBeforeAction={registerBeforeProfileEditorAction}
            onSourceDirtyChange={updateProfileEditorDirty}
          />
        {/key}
      {:else if virtualProfile}
        <VirtualProfileEditor
          {locale}
          spec={state.draft}
          profileId={virtualProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onRequestReplacement={requestProfileReplacement}
        />
      {:else if selectedProfile.kind === 'rule-list'}
        <RuleListProfileEditor
          {locale}
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onGetRuleSourceUpdateStatus={getRuleSourceUpdateStatus}
          onUpdateRuleSource={updateRuleSource}
        />
      {:else if selectedProfile.kind === 'pac'}
        <PacProfileEditor
          {locale}
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onReplaceDraftWithSecrets={replaceDraftWithSecrets}
          onReadSecret={readSecret}
          onRequestAuthenticationPermission={requestProxyAuthenticationPermission}
          onGetPacSourceUpdateStatus={getPacSourceUpdateStatus}
          onUpdatePacSource={updatePacSource}
        />
      {:else if selectedProfile.kind === 'auto-detect'}
        <AdvancedProfileEditor
          {locale}
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
      {/if}
    {:else}
      <section class="settings-section shell-status" data-empty-profiles data-typed-locale={locale}>
        <h1>{uiText('options.empty.title', locale)}</h1>
        <p>{uiText('options.empty.help', locale)}</p>
      </section>
    {/if}
  </main>
</div>

{#if pendingProfileRename}
  <ProfileRenameDialog
    {locale}
    profileName={pendingProfileRename.profileName}
    existingNames={allProfiles
      .filter((profile) => profile.id !== pendingProfileRename?.profileId)
      .map((profile) => profile.name)}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileRename = undefined)}
    onConfirm={confirmProfileRename}
  />
{/if}

{#if pendingProfileDeletion}
  <ProfileDeletionDialog
    {locale}
    profileName={pendingProfileDeletion.profileName}
    blockers={pendingProfileDeletion.blockers}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileDeletion = undefined)}
    onConfirm={confirmProfileDeletion}
  />
{/if}

{#if pendingProfileReplacement && state}
  <ProfileReplacementDialog
    {locale}
    spec={state.draft}
    initialFromProfileId={pendingProfileReplacement.fromProfileId}
    initialToProfileId={pendingProfileReplacement.toProfileId}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileReplacement = undefined)}
    onConfirm={confirmProfileReplacement}
  />
{/if}
