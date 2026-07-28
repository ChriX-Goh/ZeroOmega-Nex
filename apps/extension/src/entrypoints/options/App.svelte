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
  import { translate } from '../../lib/i18n';
  import {
    requestRuleSourceOriginPermission,
    sendProfileWorkflowCommand,
    subscribeProfileWorkflowStateChanges,
  } from '../../lib/profile-workflow-client';
  import { requestProxyAuthenticationPermission } from '../../lib/proxy-auth-permission-client';
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
  let pendingProfileReplacement: PendingProfileReplacement | undefined;

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

  const createWorkflowId: ProfileWorkflowIdFactory = (kind) => `${kind}-${crypto.randomUUID()}`;

  function profileType(profile: UserProfile): string {
    switch (profile.kind) {
      case 'fixed':
        return 'Fixed Profile';
      case 'switch':
        return 'Switch Profile';
      case 'rule-list':
        return 'Rule List Profile';
      case 'pac':
        return 'PAC Profile';
      case 'auto-detect':
        return 'Auto Detect Profile';
      case 'virtual':
        return 'Virtual Profile';
    }
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
    if (route.kind === 'direct') return 'Direct';
    if (route.kind === 'system') return 'System Proxy';
    return (
      spec.profiles.find((profile) => profile.id === route.profileId)?.name ?? 'Missing profile'
    );
  }

  function checkedFrom(event: Event): boolean {
    return (event.currentTarget as HTMLInputElement).checked;
  }

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
      .value;
  }

  function messageFrom(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
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
    errorMessage = response.message;
    if (response.state) state = response.state;
    if (response.view) view = response.view;
    return false;
  }

  async function loadWorkflow(): Promise<void> {
    loading = true;
    try {
      acceptResponse(await sendProfileWorkflowCommand({ action: 'get' }));
    } catch (error) {
      errorMessage = messageFrom(error);
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
    } catch (error) {
      errorMessage = messageFrom(error);
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
    } catch (error) {
      errorMessage = messageFrom(error);
      return '';
    } finally {
      saving = false;
    }
  }

  async function getRuleSourceUpdateStatus(
    sourceId: string,
  ): Promise<ProfileWorkflowRuleSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'get-rule-source-update-status',
        sourceId,
      });
      acceptResponse(response);
      return response.ruleSourceUpdate;
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    } finally {
      saving = false;
    }
  }

  async function updateRuleSource(
    sourceId: string,
    url: string,
  ): Promise<ProfileWorkflowRuleSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    let granted = false;
    try {
      granted = await requestRuleSourceOriginPermission(url);
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    }
    if (!granted) {
      errorMessage = 'Host permission is required before downloading this Rule List URL.';
      return undefined;
    }
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'update-rule-source',
        expectedGeneration: state.generation,
        sourceId,
      });
      acceptResponse(response);
      return response.ruleSourceUpdate;
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    } finally {
      saving = false;
    }
  }

  async function getPacSourceUpdateStatus(
    profileId: string,
  ): Promise<ProfileWorkflowPacSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'get-pac-source-update-status',
        profileId,
      });
      acceptResponse(response);
      return response.pacSourceUpdate;
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    } finally {
      saving = false;
    }
  }

  async function updatePacSource(
    profileId: string,
    url: string,
  ): Promise<ProfileWorkflowPacSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    let granted = false;
    try {
      granted = await requestRuleSourceOriginPermission(url);
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    }
    if (!granted) {
      errorMessage = 'Host permission is required before downloading this PAC URL.';
      return undefined;
    }
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'update-pac-source',
        expectedGeneration: state.generation,
        profileId,
      });
      acceptResponse(response);
      return response.pacSourceUpdate;
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    } finally {
      saving = false;
    }
  }

  async function acceptImportedAndApply(
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    if (!(await acceptImportedDraft(expectedGeneration, candidate, secretMaterials)) || !state) {
      return false;
    }
    return runCommand({
      action: 'apply',
      expectedGeneration: state.generation,
    });
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
    } catch (error) {
      errorMessage = messageFrom(error);
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
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function performProfileDeletion(profileId: string): Promise<void> {
    if (!state) return;
    try {
      if (await replaceDraft(deleteProfileDraft(state.draft, profileId))) {
        pendingProfileDeletion = undefined;
      }
    } catch (error) {
      errorMessage = messageFrom(error);
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
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function confirmProfileDeletion(): Promise<void> {
    const request = pendingProfileDeletion;
    if (!request || request.blockers.length > 0) return;
    await performProfileDeletion(request.profileId);
  }

  async function requestProfileReplacement(
    fromProfileId: string,
    toProfileId: string,
  ): Promise<void> {
    if (!state || saving || view?.busy || !(await commitActiveProfileEditor())) return;
    if (view?.dirty) {
      const confirmed = globalThis.confirm(
        'Apply current changes before replacing profile references?',
      );
      if (!confirmed) return;
      const applied = await runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      });
      if (!applied) return;
    }
    if (
      !state.draft.profiles.some((profile) => profile.id === fromProfileId) ||
      !state.draft.profiles.some((profile) => profile.id === toProfileId)
    ) {
      errorMessage = 'A replacement endpoint no longer exists.';
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
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function updateProfileName(name: string): Promise<void> {
    if (!selectedProfile) return;
    const profileId = selectedProfile.id;
    await mutateDraft((draft) => {
      const profile = draft.profiles.find((candidate) => candidate.id === profileId);
      if (!profile) return;
      profile.name = name.trim();
      if (profile.kind !== 'switch' || profile.attachedRuleListProfileId === undefined) return;
      const attached = draft.profiles.find(
        (candidate) =>
          candidate.id === profile.attachedRuleListProfileId && candidate.kind === 'rule-list',
      );
      if (!attached || attached.kind !== 'rule-list') return;
      attached.name = `__ruleListOf_${profile.name}`;
      const source = draft.ruleSources.find((candidate) => candidate.id === attached.sourceId);
      if (source) source.name = `${profile.name} attached rules`;
    });
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
        errorMessage = 'Request monitoring permission was not granted.';
      }
    } catch (error) {
      errorMessage = messageFrom(error);
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
    if (!state || !hasUnappliedChanges || !(await commitActiveProfileEditor())) return;
    if (!view?.dirty) return;
    await runCommand({
      action: 'apply',
      expectedGeneration: state.generation,
    });
  }

  async function prepareLegacyExport(): Promise<ProfileSpec | undefined> {
    if (!state || saving || view?.busy || !(await commitActiveProfileEditor())) return undefined;
    if (view?.dirty) {
      const confirmed = globalThis.confirm(
        'Apply current changes before exporting the Options backup?',
      );
      if (!confirmed) return undefined;
      const applied = await runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      });
      if (!applied) return undefined;
    }
    return state ? structuredClone(state.applied) : undefined;
  }

  function applyStatus(): string {
    const record = state?.lastApply;
    if (!record) return 'No Apply attempt recorded.';
    if (record.status === 'succeeded') {
      return `Active snapshot ${record.snapshotId} from revision ${record.revisionId}.`;
    }
    return `Failed at ${record.stage}: ${record.message}`;
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
      } catch (error) {
        errorMessage = messageFrom(error);
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
  <title>ZeroOmega Nex Options</title>
</svelte:head>

<div class="app-shell">
  <aside class="sidebar">
    <header class="side-brand">
      <button type="button" onclick={() => void navigate('about')}>
        <span class="brand-mark" aria-hidden="true">Ω</span>
        <span>Zero Omega</span>
      </button>
    </header>

    <nav class="side-navigation" aria-label="ZeroOmega options">
      <section class="nav-group">
        <h2>Settings</h2>
        <button
          class:active={activeSection === 'interface'}
          type="button"
          onclick={() => void navigate('interface')}
        >
          <span aria-hidden="true">⌘</span><span>Interface</span>
        </button>
        <button
          class:active={activeSection === 'general'}
          type="button"
          onclick={() => void navigate('general')}
        >
          <span aria-hidden="true">⚙</span><span>General</span>
        </button>
        <button
          class:active={activeSection === 'import'}
          type="button"
          disabled={!state || saving || view?.busy}
          onclick={() => void navigate('import')}
        >
          <span aria-hidden="true">⇅</span><span>Import / Export</span>
        </button>
        <button
          class:active={activeSection === 'theme'}
          type="button"
          onclick={() => void navigate('theme')}
        >
          <span aria-hidden="true">◐</span><span>Theme</span>
        </button>
        <button
          class:active={activeSection === 'history'}
          type="button"
          disabled={!state || saving || view?.busy}
          onclick={() => void navigate('history')}
        >
          <span aria-hidden="true">↶</span><span>Snapshot History</span>
        </button>
      </section>

      <section class="nav-group profiles-nav">
        <h2>Profiles</h2>
        <button
          class:active={activeSection === 'builtin'}
          type="button"
          onclick={() => void navigate('builtin')}
        >
          <span class="builtin-marker" aria-hidden="true">◎</span><span>Built-in Profiles</span>
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
          <span aria-hidden="true">＋</span><span>New profile…</span>
        </button>
      </section>

      <section class="nav-group actions">
        <h2>Actions</h2>
        <button
          type="button"
          class="primary"
          disabled={!hasUnappliedChanges || view?.busy || saving}
          onclick={applyDraft}
        >
          <span aria-hidden="true">✓</span><span>{saving ? 'Working…' : 'Apply changes'}</span>
        </button>
        <button
          type="button"
          class="discard"
          disabled={!hasUnappliedChanges || view?.busy || saving}
          onclick={revertDraft}
        >
          <span aria-hidden="true">×</span><span>Discard changes</span>
        </button>
        <p class="draft-status" role="status">
          {view?.busy
            ? `Apply is in progress: ${state?.pendingApply?.phase ?? 'preparing'}.`
            : profileEditorDirty
              ? 'Switch source contains unapplied changes.'
              : view?.dirty
                ? 'Draft contains unapplied changes.'
                : 'Draft matches the currently applied revision.'}
        </p>
      </section>
    </nav>
  </aside>

  <main class="editor">
    {#if errorMessage}
      <section class="settings-section global-error" aria-live="assertive">
        <h2>Operation failed</h2>
        <p role="alert">{errorMessage}</p>
      </section>
    {/if}

    {#if loading}
      <section class="settings-section shell-status">
        <h1>Loading profiles</h1>
        <p>Reading the saved ZeroOmega configuration.</p>
      </section>
    {:else if activeSection === 'general' && state}
      <header class="editor-heading">
        <div>
          <h1>General</h1>
          <p>Startup and quick-switch behavior.</p>
        </div>
      </header>
      <section class="settings-section">
        <h2>Startup profile</h2>
        <label>
          Profile used when the extension starts
          <select
            aria-label="Startup route"
            value={routeValue(state.draft.settings.startup.route)}
            disabled={saving || view?.busy}
            onchange={(event) => updateStartupRoute(valueFrom(event))}
          >
            <option value="">Keep current browser setting</option>
            <option value="direct">Direct</option>
            <option value="system">System Proxy</option>
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
          Revert proxy changes when ZeroOmega releases control
        </label>
      </section>
      <section class="settings-section">
        <h2>Quick Switch</h2>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.enabled}
            disabled={saving || view?.busy}
            onchange={(event) => updateQuickSwitchFlag('enabled', checkedFrom(event))}
          />
          Enable quick switching in the popup
        </label>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.refreshOnChange}
            disabled={saving || view?.busy}
            onchange={(event) => updateQuickSwitchFlag('refreshOnChange', checkedFrom(event))}
          />
          Refresh active tabs after switching
        </label>
        <ol class="route-order" aria-label="Quick-switch route order">
          {#each state.draft.settings.quickSwitch.routes as route, index (`${routeValue(route)}:${index}`)}
            <li>
              <span>{routeLabel(state.draft, route)}</span>
              <span class="row-actions">
                <button
                  type="button"
                  disabled={saving || view?.busy || index === 0}
                  onclick={() => moveQuickSwitchRoute(index, -1)}>Up</button
                >
                <button
                  type="button"
                  disabled={saving ||
                    view?.busy ||
                    index === state.draft.settings.quickSwitch.routes.length - 1}
                  onclick={() => moveQuickSwitchRoute(index, 1)}>Down</button
                >
                <button
                  type="button"
                  disabled={saving ||
                    view?.busy ||
                    route.kind === 'direct' ||
                    route.kind === 'system'}
                  onclick={() => removeQuickSwitchRoute(index)}>Remove</button
                >
              </span>
            </li>
          {/each}
        </ol>
        <select
          aria-label="Add quick-switch route"
          disabled={saving || view?.busy}
          onchange={(event) => addQuickSwitchRoute(valueFrom(event), event)}
        >
          <option value="">Add profile…</option>
          <option value="direct">Direct</option>
          <option value="system">System Proxy</option>
          {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}
              >{profile.name}</option
            >{/each}
        </select>
      </section>
      <section class="settings-section option-list" data-request-diagnostics-settings>
        <h2>{translate('Request diagnostics')}</h2>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.interface.monitorWebRequests ?? true}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('monitorWebRequests', checkedFrom(event))}
          />
          {translate('Allow bounded request diagnostics')}
        </label>
        <p>
          {translate(
            'Monitoring starts only from the diagnostics page for this browser session. Headers, bodies, cookies, credentials, query strings, and response content are never collected.',
          )}
        </p>
        <div class="settings-actions">
          {#if diagnosticsPermissionGranted}
            <span role="status">{translate('Browser permission granted.')}</span>
          {:else}
            <button
              type="button"
              data-request-diagnostics-permission
              disabled={requestingDiagnosticsPermission}
              onclick={() => void grantDiagnosticsPermission()}
            >
              {requestingDiagnosticsPermission
                ? translate('Requesting…')
                : translate('Grant monitoring permission')}
            </button>
          {/if}
          <button type="button" onclick={openRequestDiagnostics}>
            {translate('Open request diagnostics')}
          </button>
        </div>
      </section>
    {:else if activeSection === 'interface' && state}
      <header class="editor-heading">
        <div>
          <h1>Interface</h1>
          <p>Behavior matching the original ZeroOmega options page.</p>
        </div>
      </header>
      <section class="settings-section option-list">
        <h2>Confirmation and editing</h2>
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.confirmDeletion}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('confirmDeletion', checkedFrom(event))}
          />Confirm before deleting a profile</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.addConditionsToBottom}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('addConditionsToBottom', checkedFrom(event))}
          />Add new switching conditions to the bottom</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showAdvancedConditions}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showAdvancedConditions', checkedFrom(event))}
          />Show advanced condition types</label
        >
      </section>
      <section class="settings-section option-list">
        <h2>Menus and status</h2>
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showInspectMenu}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showInspectMenu', checkedFrom(event))}
          />Show inspect menu</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showResultProfileOnActionBadgeText}
            disabled={saving || view?.busy}
            onchange={(event) =>
              updateInterfaceFlag('showResultProfileOnActionBadgeText', checkedFrom(event))}
          />Show result profile on the toolbar badge</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showExternalProfile}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showExternalProfile', checkedFrom(event))}
          />Show profiles controlled by other extensions</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.exportLegacyRuleList}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('exportLegacyRuleList', checkedFrom(event))}
          />Export legacy rule-list format when requested</label
        >
      </section>
    {:else if activeSection === 'theme'}
      <header class="editor-heading">
        <div>
          <h1>Theme</h1>
          <p>Default: follow the operating-system appearance.</p>
        </div>
      </header>
      <ThemePanel mode={themeMode} onChange={updateThemeMode} />
    {:else if activeSection === 'import' && state}
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
    {:else if activeSection === 'history' && state}
      <header class="editor-heading">
        <div>
          <h1>Configuration History</h1>
          <p>Inspect or restore a previously verified configuration.</p>
        </div>
      </header>
      <SnapshotHistoryPanel
        disabled={saving || view?.busy === true}
        dirty={view?.dirty === true}
        generation={state.generation}
        onRollbackSnapshot={rollbackSnapshot}
      />
    {:else if activeSection === 'builtin' && state}
      <header class="editor-heading">
        <div>
          <h1>Built-in Profiles</h1>
          <p>Direct and System Proxy are always available.</p>
        </div>
      </header>
      <section class="settings-section builtin-grid">
        <label class="builtin-card"
          ><ProfileIcon
            kind="direct"
            color={state.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee'}
            size={28}
          /><strong>Direct</strong><span>Connect without a proxy.</span><input
            aria-label="Direct profile color"
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
          /><strong>System Proxy</strong><span>Use the browser or operating-system proxy.</span
          ><input
            aria-label="System profile color"
            type="color"
            value={state.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88'}
            disabled={saving || view?.busy}
            onchange={(event) => updateBuiltInColor('system', valueFrom(event))}
          /></label
        >
      </section>
    {:else if activeSection === 'new-profile'}
      <section class="settings-section shell-status" aria-hidden="true">
        <h1>Profiles</h1>
        <p>Create a profile using the original ZeroOmega workflow.</p>
      </section>
      {#if state}
        <NewProfileDialog
          existingNames={profiles.map((profile) => profile.name)}
          disabled={saving || view?.busy === true}
          onCancel={cancelNewProfile}
          onCreate={createNamedProfile}
        />
      {/if}
    {:else if activeSection === 'about'}
      <header class="editor-heading">
        <div>
          <h1>ZeroOmega Nex</h1>
          <p>{productIdentity.milestone}</p>
        </div>
      </header>
      <section class="settings-section">
        <h2>Compatibility-first continuation</h2>
        <p>
          This build preserves the original ZeroOmega navigation and migration workflow while
          replacing the proxy control plane with a verified cross-browser implementation.
        </p>
      </section>
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
          <button type="button" disabled={view?.busy || saving} onclick={duplicateSelectedProfile}
            >Duplicate</button
          ><button
            type="button"
            class="danger"
            data-profile-delete-action
            disabled={view?.busy || saving}
            onclick={deleteSelectedProfile}>Delete</button
          >
        </div>
      </header>
      <section class="settings-section profile-identity-editor">
        <label>
          <span>Profile name</span>
          <input
            aria-label="Profile name"
            value={selectedProfile.name}
            disabled={saving || view?.busy}
            onchange={(event) => updateProfileName(valueFrom(event))}
          />
        </label>
        <label class="profile-color-field">
          <span>Profile color</span>
          <input
            aria-label="Profile color"
            type="color"
            value={profileDisplayColor(selectedProfile)}
            disabled={saving || view?.busy || selectedProfile.kind === 'virtual'}
            onchange={(event) => updateProfileColor(valueFrom(event))}
          />
        </label>
      </section>
      {#if fixedProfile}
        <FixedProfileEditor
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
          spec={state.draft}
          profileId={virtualProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onRequestReplacement={requestProfileReplacement}
        />
      {:else if selectedProfile.kind === 'rule-list'}
        <RuleListProfileEditor
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onGetRuleSourceUpdateStatus={getRuleSourceUpdateStatus}
          onUpdateRuleSource={updateRuleSource}
        />
      {:else if selectedProfile.kind === 'pac'}
        <PacProfileEditor
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
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
      {/if}
    {:else}
      <section class="settings-section shell-status">
        <h1>No user profiles</h1>
        <p>
          Create a new profile from the left navigation or restore an original ZeroOmega backup.
        </p>
      </section>
    {/if}
  </main>
</div>

{#if pendingProfileDeletion}
  <ProfileDeletionDialog
    profileName={pendingProfileDeletion.profileName}
    blockers={pendingProfileDeletion.blockers}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileDeletion = undefined)}
    onConfirm={confirmProfileDeletion}
  />
{/if}

{#if pendingProfileReplacement && state}
  <ProfileReplacementDialog
    spec={state.draft}
    initialFromProfileId={pendingProfileReplacement.fromProfileId}
    initialToProfileId={pendingProfileReplacement.toProfileId}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileReplacement = undefined)}
    onConfirm={confirmProfileReplacement}
  />
{/if}
