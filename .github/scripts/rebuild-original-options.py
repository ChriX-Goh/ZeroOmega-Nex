from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    return text.replace(old, new, 1)


app_path = Path('apps/extension/src/entrypoints/options/App.svelte')
app = app_path.read_text()
app = replace_once(
    app,
    "  import SwitchProfileEditor from './SwitchProfileEditor.svelte';\n\n  type OptionsSection = 'profiles' | 'import' | 'history';\n\n  let activeSection: OptionsSection = 'profiles';",
    "  import SwitchProfileEditor from './SwitchProfileEditor.svelte';\n  import ThemePanel from './ThemePanel.svelte';\n\n  type OptionsSection =\n    | 'interface'\n    | 'general'\n    | 'import'\n    | 'theme'\n    | 'history'\n    | 'builtin'\n    | 'new-profile'\n    | 'profile'\n    | 'about';\n  type ThemeMode = 'auto' | 'light' | 'dark';\n  type InterfaceFlag =\n    | 'confirmDeletion'\n    | 'showInspectMenu'\n    | 'addConditionsToBottom'\n    | 'showResultProfileOnActionBadgeText'\n    | 'showExternalProfile'\n    | 'showAdvancedConditions'\n    | 'exportLegacyRuleList';\n\n  const THEME_STORAGE_KEY = 'zeroomega-nex/theme-mode';\n  let activeSection: OptionsSection = 'profile';\n  let themeMode: ThemeMode = 'auto';",
    'App imports and route types',
)
app = replace_once(
    app,
    "  async function selectProfile(profileId: string): Promise<void> {\n    activeSection = 'profiles';\n    if (!state || state.selectedProfileId === profileId) return;",
    "  async function selectProfile(profileId: string): Promise<void> {\n    navigate('profile', profileId);\n    if (!state || state.selectedProfileId === profileId) return;",
    'profile navigation',
)
app = replace_once(
    app,
    "  async function acceptImportedDraft(\n    expectedGeneration: number,\n    candidate: ProfileSpec,\n    secretMaterials: readonly ProfileWorkflowSecretMaterial[],\n  ): Promise<boolean> {\n    return runCommand({\n      action: 'accept-import',\n      expectedGeneration,\n      candidate,\n      secretMaterials,\n    });\n  }",
    "  async function acceptImportedDraft(\n    expectedGeneration: number,\n    candidate: ProfileSpec,\n    secretMaterials: readonly ProfileWorkflowSecretMaterial[],\n  ): Promise<boolean> {\n    return runCommand({\n      action: 'accept-import',\n      expectedGeneration,\n      candidate,\n      secretMaterials,\n    });\n  }\n\n  async function acceptImportedAndApply(\n    expectedGeneration: number,\n    candidate: ProfileSpec,\n    secretMaterials: readonly ProfileWorkflowSecretMaterial[],\n  ): Promise<boolean> {\n    if (!(await acceptImportedDraft(expectedGeneration, candidate, secretMaterials)) || !state) {\n      return false;\n    }\n    return runCommand({\n      action: 'apply',\n      expectedGeneration: state.generation,\n    });\n  }",
    'direct legacy import activation',
)
app = replace_once(
    app,
    "  async function revertDraft(): Promise<void> {",
    "  async function updateInterfaceFlag(field: InterfaceFlag, value: boolean): Promise<void> {\n    await mutateDraft((draft) => {\n      draft.settings.interface[field] = value;\n    });\n  }\n\n  async function updateBuiltInColor(kind: 'direct' | 'system', color: string): Promise<void> {\n    await mutateDraft((draft) => {\n      const appearance = draft.settings.interface.builtInProfiles ?? {};\n      appearance[kind] = { color };\n      draft.settings.interface.builtInProfiles = appearance;\n    });\n  }\n\n  function pageHash(section: OptionsSection, profileId?: string): string {\n    return section === 'profile' && profileId\n      ? `#/profile/${encodeURIComponent(profileId)}`\n      : `#/${section}`;\n  }\n\n  function navigate(section: OptionsSection, profileId?: string): void {\n    activeSection = section;\n    if (typeof window === 'undefined') return;\n    const hash = pageHash(section, profileId);\n    if (window.location.hash !== hash) window.history.pushState(null, '', hash);\n  }\n\n  function syncNavigationFromLocation(): void {\n    if (typeof window === 'undefined') return;\n    const hash = window.location.hash.replace(/^#\\//u, '');\n    if (!hash) {\n      activeSection = 'profile';\n      return;\n    }\n    if (hash.startsWith('profile/')) {\n      activeSection = 'profile';\n      const profileId = decodeURIComponent(hash.slice('profile/'.length));\n      if (state?.draft.profiles.some((profile) => profile.id === profileId)) {\n        if (state.selectedProfileId !== profileId && !saving) {\n          void runCommand({\n            action: 'select-profile',\n            expectedGeneration: state.generation,\n            profileId,\n          });\n        }\n      }\n      return;\n    }\n    const section = hash as OptionsSection;\n    if (\n      [\n        'interface',\n        'general',\n        'import',\n        'theme',\n        'history',\n        'builtin',\n        'new-profile',\n        'about',\n      ].includes(section)\n    ) {\n      activeSection = section;\n    }\n  }\n\n  function readThemeMode(): ThemeMode {\n    if (typeof window === 'undefined') return 'auto';\n    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);\n    return stored === 'light' || stored === 'dark' ? stored : 'auto';\n  }\n\n  function applyThemeMode(mode: ThemeMode): void {\n    if (typeof document === 'undefined') return;\n    document.documentElement.dataset.themeMode = mode;\n    if (mode === 'auto') delete document.documentElement.dataset.theme;\n    else document.documentElement.dataset.theme = mode;\n  }\n\n  function updateThemeMode(mode: ThemeMode): void {\n    themeMode = mode;\n    if (typeof window !== 'undefined') window.localStorage.setItem(THEME_STORAGE_KEY, mode);\n    applyThemeMode(mode);\n  }\n\n  async function revertDraft(): Promise<void> {",
    'independent options pages and theme helpers',
)
app = replace_once(
    app,
    "  onMount(() => {\n    void loadWorkflow();\n  });",
    "  onMount(() => {\n    themeMode = readThemeMode();\n    applyThemeMode(themeMode);\n    const handleNavigation = () => syncNavigationFromLocation();\n    window.addEventListener('popstate', handleNavigation);\n    window.addEventListener('hashchange', handleNavigation);\n    void loadWorkflow().then(syncNavigationFromLocation);\n    return () => {\n      window.removeEventListener('popstate', handleNavigation);\n      window.removeEventListener('hashchange', handleNavigation);\n    };\n  });",
    'Options mount routing',
)
script = app.split('</script>', 1)[0] + '</script>\n\n'
markup = r'''<svelte:head>
  <title>ZeroOmega Nex Options</title>
</svelte:head>

<div class="app-shell">
  <aside class="sidebar">
    <header class="side-brand">
      <button type="button" on:click={() => navigate('about')}>
        <span class="brand-mark" aria-hidden="true">Ω</span>
        <span>Zero Omega</span>
      </button>
    </header>

    <nav class="side-navigation" aria-label="ZeroOmega options">
      <section class="nav-group">
        <h2>Settings</h2>
        <button class:active={activeSection === 'interface'} type="button" on:click={() => navigate('interface')}>
          <span aria-hidden="true">⌘</span><span>Interface</span>
        </button>
        <button class:active={activeSection === 'general'} type="button" on:click={() => navigate('general')}>
          <span aria-hidden="true">⚙</span><span>General</span>
        </button>
        <button class:active={activeSection === 'import'} type="button" disabled={!state || saving || view?.busy} on:click={() => navigate('import')}>
          <span aria-hidden="true">⇅</span><span>Import / Export</span>
        </button>
        <button class:active={activeSection === 'theme'} type="button" on:click={() => navigate('theme')}>
          <span aria-hidden="true">◐</span><span>Theme</span>
        </button>
        <button class:active={activeSection === 'history'} type="button" disabled={!state || saving || view?.busy} on:click={() => navigate('history')}>
          <span aria-hidden="true">↶</span><span>Snapshot History</span>
        </button>
      </section>

      <section class="nav-group profiles-nav">
        <h2>Profiles</h2>
        <button class:active={activeSection === 'builtin'} type="button" on:click={() => navigate('builtin')}>
          <span class="builtin-marker" aria-hidden="true">◎</span><span>Built-in Profiles</span>
        </button>
        {#each profiles as profile (profile.id)}
          <button
            class="nav-profile"
            class:active={activeSection === 'profile' && profile.id === state?.selectedProfileId}
            type="button"
            disabled={saving}
            on:click={() => selectProfile(profile.id)}
          >
            <span class="profile-marker" style={`--profile-color: ${profile.color ?? '#90a4ae'}`}></span>
            <span>{profile.name}</span>
          </button>
        {/each}
        <button class:active={activeSection === 'new-profile'} type="button" disabled={!state || view?.busy || saving} on:click={() => navigate('new-profile')}>
          <span aria-hidden="true">＋</span><span>New profile…</span>
        </button>
      </section>

      <section class="nav-group actions">
        <h2>Actions</h2>
        <button type="button" class="primary" disabled={!view?.dirty || view.busy || saving} on:click={applyDraft}>
          <span aria-hidden="true">✓</span><span>{saving ? 'Working…' : 'Apply changes'}</span>
        </button>
        <button type="button" class="discard" disabled={!view?.dirty || view.busy || saving} on:click={revertDraft}>
          <span aria-hidden="true">×</span><span>Discard changes</span>
        </button>
        <p class="draft-status" role="status">
          {view?.busy
            ? `Apply is in progress: ${state?.pendingApply?.phase ?? 'preparing'}.`
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
        <div><h1>General</h1><p>Startup and quick-switch behavior.</p></div>
      </header>
      <section class="settings-section">
        <h2>Startup profile</h2>
        <label>
          Profile used when the extension starts
          <select aria-label="Startup route" value={routeValue(state.draft.settings.startup.route)} disabled={saving || view?.busy} on:change={(event) => updateStartupRoute(valueFrom(event))}>
            <option value="">Keep current browser setting</option>
            <option value="direct">Direct</option>
            <option value="system">System Proxy</option>
            {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}>{profile.name}</option>{/each}
          </select>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" checked={state.draft.settings.startup.revertProxyChanges} disabled={saving || view?.busy} on:change={(event) => updateStartupRevert(checkedFrom(event))} />
          Revert proxy changes when ZeroOmega releases control
        </label>
      </section>
      <section class="settings-section">
        <h2>Quick Switch</h2>
        <label class="checkbox-row">
          <input type="checkbox" checked={state.draft.settings.quickSwitch.enabled} disabled={saving || view?.busy} on:change={(event) => updateQuickSwitchFlag('enabled', checkedFrom(event))} />
          Enable quick switching in the popup
        </label>
        <label class="checkbox-row">
          <input type="checkbox" checked={state.draft.settings.quickSwitch.refreshOnChange} disabled={saving || view?.busy} on:change={(event) => updateQuickSwitchFlag('refreshOnChange', checkedFrom(event))} />
          Refresh active tabs after switching
        </label>
        <ol class="route-order" aria-label="Quick-switch route order">
          {#each state.draft.settings.quickSwitch.routes as route, index (`${routeValue(route)}:${index}`)}
            <li>
              <span>{routeLabel(state.draft, route)}</span>
              <span class="row-actions">
                <button type="button" disabled={saving || view?.busy || index === 0} on:click={() => moveQuickSwitchRoute(index, -1)}>Up</button>
                <button type="button" disabled={saving || view?.busy || index === state.draft.settings.quickSwitch.routes.length - 1} on:click={() => moveQuickSwitchRoute(index, 1)}>Down</button>
                <button type="button" disabled={saving || view?.busy} on:click={() => removeQuickSwitchRoute(index)}>Remove</button>
              </span>
            </li>
          {/each}
        </ol>
        <select aria-label="Add quick-switch route" disabled={saving || view?.busy} on:change={(event) => addQuickSwitchRoute(valueFrom(event), event)}>
          <option value="">Add profile…</option>
          <option value="direct">Direct</option>
          <option value="system">System Proxy</option>
          {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}>{profile.name}</option>{/each}
        </select>
      </section>
    {:else if activeSection === 'interface' && state}
      <header class="editor-heading"><div><h1>Interface</h1><p>Behavior matching the original ZeroOmega options page.</p></div></header>
      <section class="settings-section option-list">
        <h2>Confirmation and editing</h2>
        <label class="checkbox-row"><input type="checkbox" checked={state.draft.settings.interface.confirmDeletion} disabled={saving || view?.busy} on:change={(event) => updateInterfaceFlag('confirmDeletion', checkedFrom(event))} />Confirm before deleting a profile</label>
        <label class="checkbox-row"><input type="checkbox" checked={state.draft.settings.interface.addConditionsToBottom} disabled={saving || view?.busy} on:change={(event) => updateInterfaceFlag('addConditionsToBottom', checkedFrom(event))} />Add new switching conditions to the bottom</label>
        <label class="checkbox-row"><input type="checkbox" checked={state.draft.settings.interface.showAdvancedConditions} disabled={saving || view?.busy} on:change={(event) => updateInterfaceFlag('showAdvancedConditions', checkedFrom(event))} />Show advanced condition types</label>
      </section>
      <section class="settings-section option-list">
        <h2>Menus and status</h2>
        <label class="checkbox-row"><input type="checkbox" checked={state.draft.settings.interface.showInspectMenu} disabled={saving || view?.busy} on:change={(event) => updateInterfaceFlag('showInspectMenu', checkedFrom(event))} />Show inspect menu</label>
        <label class="checkbox-row"><input type="checkbox" checked={state.draft.settings.interface.showResultProfileOnActionBadgeText} disabled={saving || view?.busy} on:change={(event) => updateInterfaceFlag('showResultProfileOnActionBadgeText', checkedFrom(event))} />Show result profile on the toolbar badge</label>
        <label class="checkbox-row"><input type="checkbox" checked={state.draft.settings.interface.showExternalProfile} disabled={saving || view?.busy} on:change={(event) => updateInterfaceFlag('showExternalProfile', checkedFrom(event))} />Show profiles controlled by other extensions</label>
        <label class="checkbox-row"><input type="checkbox" checked={state.draft.settings.interface.exportLegacyRuleList} disabled={saving || view?.busy} on:change={(event) => updateInterfaceFlag('exportLegacyRuleList', checkedFrom(event))} />Export legacy rule-list format when requested</label>
      </section>
    {:else if activeSection === 'theme'}
      <header class="editor-heading"><div><h1>Theme</h1><p>Default: follow the operating-system appearance.</p></div></header>
      <ThemePanel mode={themeMode} onChange={updateThemeMode} />
    {:else if activeSection === 'import' && state}
      <header class="editor-heading"><div><h1>Import / Export</h1><p>Move from original ZeroOmega or SwitchyOmega without rebuilding profiles.</p></div></header>
      <LegacyImportPanel
        disabled={saving || view?.busy === true}
        generation={state.generation}
        deviceId={state.applied.revision.deviceId ?? 'zeroomega-nex-extension'}
        onAcceptImport={acceptImportedDraft}
        onImportAndApply={acceptImportedAndApply}
      />
    {:else if activeSection === 'history' && state}
      <header class="editor-heading"><div><h1>Configuration History</h1><p>Inspect or restore a previously verified configuration.</p></div></header>
      <SnapshotHistoryPanel disabled={saving || view?.busy === true} dirty={view?.dirty === true} generation={state.generation} onRollbackSnapshot={rollbackSnapshot} />
    {:else if activeSection === 'builtin' && state}
      <header class="editor-heading"><div><h1>Built-in Profiles</h1><p>Direct and System Proxy are always available.</p></div></header>
      <section class="settings-section builtin-grid">
        <label class="builtin-card"><strong>Direct</strong><span>Connect without a proxy.</span><input aria-label="Direct profile color" type="color" value={state.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee'} disabled={saving || view?.busy} on:change={(event) => updateBuiltInColor('direct', valueFrom(event))} /></label>
        <label class="builtin-card"><strong>System Proxy</strong><span>Use the browser or operating-system proxy.</span><input aria-label="System profile color" type="color" value={state.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88'} disabled={saving || view?.busy} on:change={(event) => updateBuiltInColor('system', valueFrom(event))} /></label>
      </section>
    {:else if activeSection === 'new-profile'}
      <header class="editor-heading"><div><h1>New Profile</h1><p>Choose the same profile type you used in original ZeroOmega.</p></div></header>
      <section class="settings-section new-profile-grid">
        <button type="button" disabled={!state || view?.busy || saving} on:click={createFixedProfile}><strong>Proxy Profile</strong><span>Fixed HTTP, HTTPS, SOCKS4, or SOCKS5 server settings.</span></button>
        <button type="button" disabled={!state || view?.busy || saving} on:click={createSwitchProfile}><strong>Switch Profile</strong><span>Choose routes by URL, host, IP, weekday, or time rules.</span></button>
        <button type="button" disabled={!state || view?.busy || saving} on:click={createRuleListProfile}><strong>Rule List Profile</strong><span>Use an AutoProxy or Switchy rule list.</span></button>
        <button type="button" disabled={!state || view?.busy || saving} on:click={createPacProfile}><strong>PAC Profile</strong><span>Use a PAC URL or inline PAC script.</span></button>
        <button type="button" disabled={!state || view?.busy || saving} on:click={createAutoDetectProfile}><strong>Auto Detect Profile</strong><span>Use browser proxy auto-detection when supported.</span></button>
      </section>
    {:else if activeSection === 'about'}
      <header class="editor-heading"><div><h1>ZeroOmega Nex</h1><p>{productIdentity.milestone}</p></div></header>
      <section class="settings-section"><h2>Compatibility-first continuation</h2><p>This build preserves the original ZeroOmega navigation and migration workflow while replacing the proxy control plane with a verified cross-browser implementation.</p></section>
    {:else if selectedProfile && state}
      <header class="editor-heading">
        <div class="profile-title"><span class="large-profile-marker" style={`background: ${selectedProfile.color ?? '#90a4ae'}`}></span><div><h1>{selectedProfile.name}</h1><p>{profileType(selectedProfile)}</p></div></div>
        <div class="profile-actions"><button type="button" disabled={view?.busy || saving} on:click={duplicateSelectedProfile}>Duplicate</button><button type="button" class="danger" disabled={view?.busy || saving} on:click={deleteSelectedProfile}>Delete</button></div>
      </header>
      <section class="settings-section">
        <h2>Profile name</h2>
        <input aria-label="Profile name" value={selectedProfile.name} disabled={saving || view?.busy} on:change={(event) => updateProfileName(valueFrom(event))} />
      </section>
      {#if fixedProfile && endpoint}
        <section class="settings-section">
          <h2>Proxy servers</h2>
          <div class="proxy-table" role="group" aria-label="Proxy server editor">
            <div class="proxy-row proxy-headings" aria-hidden="true"><span>Protocol</span><span>Server</span><span>Port</span></div>
            <div class="proxy-row">
              <select aria-label="Protocol" value={endpoint.protocol} disabled={saving || view?.busy} on:change={(event) => updateEndpoint('protocol', valueFrom(event))}><option value="http">HTTP</option><option value="https">HTTPS</option><option value="socks4">SOCKS4</option><option value="socks5">SOCKS5</option></select>
              <input aria-label="Server" value={endpoint.host} disabled={saving || view?.busy} on:change={(event) => updateEndpoint('host', valueFrom(event))} />
              <input aria-label="Port" inputmode="numeric" value={endpoint.port} disabled={saving || view?.busy} on:change={(event) => updateEndpoint('port', valueFrom(event))} />
            </div>
          </div>
        </section>
        <section class="settings-section"><h2>Bypass list</h2><p class="section-help">One pattern per line.</p><textarea aria-label="Bypass list" rows="9" value={bypassText} disabled={saving || view?.busy} on:change={(event) => updateBypassList(valueFrom(event))}></textarea></section>
      {:else if switchProfile}
        <SwitchProfileEditor spec={state.draft} profileId={switchProfile.id} disabled={saving || view?.busy === true} idFactory={createWorkflowId} onReplaceDraft={replaceDraft} />
      {:else if selectedProfile.kind === 'rule-list' || selectedProfile.kind === 'pac' || selectedProfile.kind === 'auto-detect'}
        <AdvancedProfileEditor spec={state.draft} profileId={selectedProfile.id} disabled={saving || view?.busy === true} onReplaceDraft={replaceDraft} />
      {/if}
    {:else}
      <section class="settings-section shell-status"><h1>No user profiles</h1><p>Create a new profile from the left navigation or restore an original ZeroOmega backup.</p></section>
    {/if}
  </main>
</div>
'''
app_path.write_text(script + markup)

Path('apps/extension/src/entrypoints/options/ThemePanel.svelte').write_text(r'''<script lang="ts">
  export type ThemeMode = 'auto' | 'light' | 'dark';
  export let mode: ThemeMode;
  export let onChange: (mode: ThemeMode) => void;

  const choices: readonly { mode: ThemeMode; title: string; description: string }[] = [
    { mode: 'auto', title: 'Automatic', description: 'Follow the operating-system light or dark appearance.' },
    { mode: 'light', title: 'Light', description: 'Always use the original light options appearance.' },
    { mode: 'dark', title: 'Dark', description: 'Always use the dark options appearance.' },
  ];
</script>

<section class="settings-section theme-options">
  <h2>Appearance</h2>
  <div class="theme-grid" role="radiogroup" aria-label="Options theme">
    {#each choices as choice (choice.mode)}
      <button
        type="button"
        role="radio"
        aria-checked={mode === choice.mode}
        class:active={mode === choice.mode}
        on:click={() => onChange(choice.mode)}
      >
        <span class={`theme-preview theme-preview-${choice.mode}`} aria-hidden="true"><i></i><b></b></span>
        <strong>{choice.title}</strong>
        <span>{choice.description}</span>
      </button>
    {/each}
  </div>
  <p class="section-help">Automatic is the default and changes immediately when the system appearance changes.</p>
</section>
''')

Path('apps/extension/src/entrypoints/options/LegacyImportPanel.svelte').write_text(r'''<script lang="ts">
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
      case 'exact': return summary.exact;
      case 'target-dependent': return summary.targetDependent;
      case 'downgraded': return summary.downgraded;
      case 'preserved': return summary.preserved;
      case 'ignored-generated': return summary.ignoredGenerated;
      case 'ignored-runtime': return summary.ignoredRuntime;
      case 'rejected': return summary.rejected;
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
      const secretMaterials = result.secretMaterials.map((secret) => ({ ref: secret.ref, value: secret.value }));
      const accepted = activate
        ? await onImportAndApply(analyzedGeneration, result.candidate, secretMaterials)
        : await onAcceptImport(analyzedGeneration, result.candidate, secretMaterials);
      if (!accepted) throw new Error(activate ? 'The imported configuration could not be activated.' : 'The imported configuration could not be saved.');
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
  <p class="section-help">Select the backup file exported by the original extension. JSON, base64 backup text, and common .bak/.txt files are accepted.</p>
  <label class="file-picker">
    <span>Backup file</span>
    <input aria-label="Legacy backup file" type="file" accept=".bak,.json,.txt,application/json,text/plain" disabled={disabled || analyzing || accepting} on:change={chooseFile} />
    {#if selectedFileName}<strong>{selectedFileName}</strong>{/if}
  </label>
  <details>
    <summary>Paste backup text instead</summary>
    <textarea aria-label="Legacy backup" rows="12" placeholder="Paste the complete ZeroOmega / SwitchyOmega backup" value={backupText} disabled={disabled || analyzing || accepting} on:input={(event) => { backupText = valueFrom(event); selectedFileName = ''; result = undefined; analyzedGeneration = undefined; acceptedMessage = ''; }}></textarea>
    <button type="button" disabled={disabled || analyzing || accepting || backupText.trim().length === 0} on:click={analyze}>{analyzing ? 'Reading backup…' : 'Read backup'}</button>
  </details>
</section>

{#if result}
  <section class="settings-section">
    <h2>Compatibility check</h2>
    <dl class="compatibility-summary">
      <div><dt>Encoding</dt><dd>{result.report.encoding}</dd></div>
      <div><dt>Profiles</dt><dd>{result.report.profileCount}</dd></div>
      <div><dt>Proxy endpoints</dt><dd>{result.report.endpointCount}</dd></div>
      <div><dt>Rule sources</dt><dd>{result.report.ruleSourceCount}</dd></div>
      <div><dt>Credentials</dt><dd>{result.report.containsSecrets ? 'Will be migrated securely' : 'None'}</dd></div>
    </dl>
    <ul class="compatibility-counts" aria-label="Import status totals">
      {#each statuses as entry (entry.status)}<li><span>{entry.label}</span><strong>{summaryCount(result, entry.status)}</strong></li>{/each}
    </ul>
    <details open={!result.ok || result.report.summary.rejected > 0}>
      <summary>Technical migration details ({result.report.items.length})</summary>
      <ol>{#each result.report.items as item, index (`${item.code}:${item.sourcePath}:${index}`)}<li><strong>{item.status}</strong> — {item.message}<div>{item.sourcePath}{item.targetPath ? ` → ${item.targetPath}` : ''}</div></li>{/each}</ol>
    </details>
    {#if result.ok}
      <div class="import-actions">
        <button type="button" class="primary" disabled={disabled || accepting} on:click={() => importCandidate(true)}>{accepting ? 'Importing…' : 'Import and use now'}</button>
        <button type="button" disabled={disabled || accepting} on:click={() => importCandidate(false)}>Import without activating</button>
      </div>
    {:else}
      <p role="alert">This backup contains unsupported or invalid entries. Open the technical details above.</p>
    {/if}
  </section>
{/if}

{#if acceptedMessage}<section class="settings-section"><p role="status">{acceptedMessage}</p></section>{/if}
{#if errorMessage}<section class="settings-section"><p role="alert">{errorMessage}</p></section>{/if}
''')

Path('apps/extension/src/entrypoints/options/style.css').write_text(r''':root {
  font-family: 'Segoe UI', 'Microsoft YaHei UI', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  font-synthesis: none;
  color-scheme: light dark;
  --page-bg: #f4f5f6;
  --sidebar-bg: #f5f5f5;
  --content-bg: #ffffff;
  --text: #303942;
  --muted: #71808b;
  --border: #d7dde1;
  --border-strong: #aeb9c0;
  --hover: #e9edf0;
  --active: #d9ead2;
  --accent: #6f9f3d;
  --accent-strong: #56852b;
  --button-bg: #ffffff;
  --input-bg: #ffffff;
  --danger: #c43b3b;
  --shadow: rgb(0 0 0 / 14%);
  color: var(--text);
  background: var(--page-bg);
  text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
}

:root[data-theme='dark'] {
  --page-bg: #171a1d;
  --sidebar-bg: #202428;
  --content-bg: #262b30;
  --text: #e5e9ec;
  --muted: #a8b2b9;
  --border: #3c444a;
  --border-strong: #59636a;
  --hover: #30363b;
  --active: #35482d;
  --accent: #8fbd5c;
  --accent-strong: #a5d36f;
  --button-bg: #2d3338;
  --input-bg: #1d2125;
  --danger: #ff7777;
  --shadow: rgb(0 0 0 / 35%);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --page-bg: #171a1d;
    --sidebar-bg: #202428;
    --content-bg: #262b30;
    --text: #e5e9ec;
    --muted: #a8b2b9;
    --border: #3c444a;
    --border-strong: #59636a;
    --hover: #30363b;
    --active: #35482d;
    --accent: #8fbd5c;
    --accent-strong: #a5d36f;
    --button-bg: #2d3338;
    --input-bg: #1d2125;
    --danger: #ff7777;
    --shadow: rgb(0 0 0 / 35%);
  }
}

* { box-sizing: border-box; }
html, body, #app { margin: 0; min-width: 320px; min-height: 100vh; background: var(--page-bg); }
body { color: var(--text); }
button, input, select, textarea { font: inherit; line-height: inherit; color: inherit; }
button:not(:disabled) { cursor: pointer; }
button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, summary:focus-visible { outline: 3px solid #2f7fc4; outline-offset: 2px; }
button:disabled, input:disabled, select:disabled, textarea:disabled { opacity: .58; }

.app-shell { display: grid; grid-template-columns: 250px minmax(0, 1fr); min-height: 100vh; }
.sidebar { position: sticky; top: 0; display: flex; flex-direction: column; height: 100vh; overflow-y: auto; border-right: 1px solid var(--border); background: var(--sidebar-bg); box-shadow: 1px 0 3px var(--shadow); }
.side-brand { padding: 18px 17px 12px; }
.side-brand button { display: flex; gap: 10px; align-items: center; width: 100%; padding: 0; border: 0; background: transparent; color: var(--text); font-size: 20px; font-weight: 400; text-align: left; }
.brand-mark { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 20px; }
.side-navigation { display: flex; flex: 1; flex-direction: column; padding-bottom: 16px; }
.nav-group { padding: 7px 0; border-top: 1px solid var(--border); }
.nav-group:first-child { border-top: 0; }
.nav-group h2 { margin: 0; padding: 7px 18px 5px; color: var(--muted); font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.nav-group > button { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 8px; align-items: center; width: 100%; min-height: 35px; padding: 6px 17px; border: 0; border-left: 3px solid transparent; background: transparent; text-align: left; }
.nav-group > button:hover:not(:disabled) { background: var(--hover); }
.nav-group > button.active { border-left-color: var(--accent); background: var(--active); color: var(--accent-strong); }
.profiles-nav { flex: 1; }
.profile-marker { width: 14px; height: 14px; border: 1px solid rgb(0 0 0 / 18%); border-radius: 2px; background: var(--profile-color); }
.builtin-marker { color: var(--accent); font-size: 18px; }
.actions { margin-top: auto; }
.actions > button.primary { color: var(--accent-strong); font-weight: 600; }
.actions > button.discard { color: var(--danger); }
.draft-status { margin: 7px 17px 0; color: var(--muted); font-size: 11px; }

.editor { min-width: 0; padding: 28px 42px 64px; background: var(--content-bg); }
.editor-heading { display: flex; align-items: center; justify-content: space-between; width: 100%; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.editor-heading h1, .settings-section h1, .settings-section h2, p { margin-top: 0; }
.editor-heading h1, .settings-section h1 { margin-bottom: 2px; font-size: 24px; font-weight: 400; }
.editor-heading p { margin: 0; color: var(--muted); font-size: 12px; }
.profile-title { display: flex; gap: 11px; align-items: center; }
.large-profile-marker { width: 21px; height: 21px; border: 1px solid rgb(0 0 0 / 18%); border-radius: 3px; }
.profile-actions, .row-actions, .import-actions { display: flex; flex-wrap: wrap; gap: 7px; }
.profile-actions button, .row-actions button, .import-actions button, .settings-section > button { min-height: 32px; padding: 5px 12px; border: 1px solid var(--border-strong); border-radius: 3px; background: var(--button-bg); }
.profile-actions .danger { border-color: var(--danger); color: var(--danger); }
.import-actions .primary { border-color: var(--accent); background: var(--accent); color: #fff; }
.settings-section { width: 100%; padding: 23px 0 25px; border-bottom: 1px solid var(--border); }
.settings-section h2 { margin-bottom: 6px; font-size: 17px; font-weight: 500; }
.section-help { max-width: 920px; margin-bottom: 15px; color: var(--muted); font-size: 12px; }
.global-error { margin-bottom: 10px; padding: 13px 15px; border: 1px solid var(--danger); background: color-mix(in srgb, var(--danger) 10%, transparent); }
.global-error h2 { color: var(--danger); }

label { display: grid; gap: 5px; max-width: 900px; margin: 0 0 14px; }
.checkbox-row { display: flex; gap: 8px; align-items: center; max-width: 980px; }
.checkbox-row input { width: auto; }
input, select, textarea { width: 100%; max-width: 900px; border: 1px solid var(--border-strong); border-radius: 3px; background: var(--input-bg); }
input, select { min-height: 33px; padding: 5px 8px; }
input[type='color'] { width: 52px; padding: 2px; }
textarea { padding: 9px; resize: vertical; font-family: Consolas, 'Courier New', monospace; font-size: 12px; }
summary { padding: 6px 0; color: var(--accent-strong); cursor: pointer; }

.proxy-table { max-width: 980px; }
.proxy-row { display: grid; grid-template-columns: 150px minmax(260px, 1fr) 120px; gap: 10px; align-items: center; }
.proxy-headings { margin-bottom: 5px; color: var(--muted); font-size: 11px; font-weight: 600; }
.route-order { max-width: 900px; padding-left: 24px; }
.route-order li { display: flex; gap: 16px; align-items: center; justify-content: space-between; min-height: 42px; border-bottom: 1px solid var(--border); }
.option-list { display: grid; gap: 3px; }

.builtin-grid, .new-profile-grid, .theme-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; max-width: 1080px; }
.builtin-card { min-height: 135px; padding: 18px; border: 1px solid var(--border); border-radius: 4px; background: var(--button-bg); }
.builtin-card strong { font-size: 17px; }
.builtin-card span { color: var(--muted); }
.new-profile-grid > button, .theme-grid > button { display: grid; gap: 6px; align-content: start; min-height: 140px; padding: 17px; border: 1px solid var(--border); border-radius: 4px; background: var(--button-bg); color: var(--text); text-align: left; }
.new-profile-grid > button:hover:not(:disabled), .theme-grid > button:hover { border-color: var(--accent); }
.new-profile-grid strong, .theme-grid strong { font-size: 16px; }
.new-profile-grid span, .theme-grid > button > span:last-child { color: var(--muted); font-size: 12px; }
.theme-grid > button.active { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.theme-preview { position: relative; display: grid; grid-template-columns: 35% 65%; width: 100%; height: 68px; overflow: hidden; border: 1px solid var(--border-strong); border-radius: 3px; background: #fff; }
.theme-preview i { background: #eceff1; }
.theme-preview b { margin: 12px; border-top: 8px solid #78909c; border-bottom: 24px solid #e0e0e0; }
.theme-preview-dark { background: #24292e; }
.theme-preview-dark i { background: #191d21; }
.theme-preview-dark b { border-top-color: #aab4bb; border-bottom-color: #394147; }
.theme-preview-auto { background: linear-gradient(90deg, #fff 0 50%, #24292e 50%); }
.theme-preview-auto i { background: linear-gradient(90deg, #eceff1 0 50%, #191d21 50%); }

.file-picker { display: grid; grid-template-columns: auto minmax(260px, 650px); gap: 8px 14px; align-items: center; padding: 15px; border: 1px dashed var(--border-strong); border-radius: 4px; }
.file-picker input { max-width: none; border: 0; padding: 0; background: transparent; }
.file-picker strong { grid-column: 2; color: var(--accent-strong); }
.compatibility-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1px; max-width: 1080px; background: var(--border); border: 1px solid var(--border); }
.compatibility-summary div { padding: 10px; background: var(--button-bg); }
.compatibility-summary dt { color: var(--muted); font-size: 11px; }
.compatibility-summary dd { margin: 2px 0 0; font-weight: 600; }
.compatibility-counts { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 8px; max-width: 1080px; padding: 0; list-style: none; }
.compatibility-counts li { display: flex; justify-content: space-between; padding: 8px 10px; border: 1px solid var(--border); background: var(--button-bg); }

.settings-section dl { max-width: 1080px; }
.settings-section dl > div { display: flex; justify-content: space-between; gap: 16px; padding: 7px 0; border-bottom: 1px solid var(--border); }
.settings-section dd { margin: 0; overflow-wrap: anywhere; text-align: right; }
.settings-section article, article.settings-section { background: transparent; }
.shell-status p { max-width: 820px; color: var(--muted); }

@media (max-width: 760px) {
  .app-shell { grid-template-columns: minmax(0, 1fr); }
  .sidebar { position: static; height: auto; max-height: 46vh; border-right: 0; border-bottom: 1px solid var(--border); }
  .side-navigation { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .nav-group, .actions { margin-top: 0; }
  .profiles-nav { max-height: 260px; overflow-y: auto; }
  .editor { padding: 20px 16px 46px; }
  .editor-heading { align-items: flex-start; flex-direction: column; gap: 12px; }
  .proxy-row { grid-template-columns: minmax(0, 1fr); }
  .proxy-headings { display: none; }
  .route-order li { align-items: flex-start; flex-direction: column; padding: 8px 0; }
}

@media (max-width: 480px) {
  .side-navigation { grid-template-columns: minmax(0, 1fr); }
  .profile-actions, .row-actions, .import-actions { width: 100%; }
  .profile-actions button, .row-actions button, .import-actions button { flex: 1 1 auto; }
  .file-picker { grid-template-columns: minmax(0, 1fr); }
  .file-picker strong { grid-column: 1; }
}
''')

index_path = Path('apps/extension/src/entrypoints/options/index.html')
index = index_path.read_text()
index = replace_once(
    index,
    '    <meta name="color-scheme" content="light dark" />',
    '    <meta name="color-scheme" content="light dark" />\n    <meta name="manifest.open_in_tab" content="true" />',
    'full-tab Options manifest flag',
)
index_path.write_text(index)

component_path = Path('apps/extension/src/component-rendering.component.spec.ts')
component = component_path.read_text()
component = replace_once(
    component,
    "import SwitchProfileEditor from './entrypoints/options/SwitchProfileEditor.svelte';",
    "import SwitchProfileEditor from './entrypoints/options/SwitchProfileEditor.svelte';\nimport ThemePanel from './entrypoints/options/ThemePanel.svelte';",
    'Theme component test import',
)
component = replace_once(
    component,
    "        onAcceptImport: async () => true,\n      },",
    "        onAcceptImport: async () => true,\n        onImportAndApply: async () => true,\n      },",
    'legacy import direct callback test prop',
)
component = replace_once(
    component,
    "    expect(body).toContain('aria-label=\"Legacy backup\"');\n    expect(body).toContain('Analyze backup');",
    "    expect(body).toContain('aria-label=\"Legacy backup file\"');\n    expect(body).toContain('Import and use now');",
    'legacy import file-first contract',
)
component = replace_once(
    component,
    "  it('renders history loading and dirty-Draft rollback protection', () => {",
    "  it('renders Automatic, Light, and Dark theme choices', () => {\n    const { body } = render(ThemePanel, {\n      props: { mode: 'auto', onChange: () => undefined },\n    });\n\n    expect(body).toContain('Automatic');\n    expect(body).toContain('Light');\n    expect(body).toContain('Dark');\n    expect(body).toContain('aria-checked=\"true\"');\n  });\n\n  it('renders history loading and dirty-Draft rollback protection', () => {",
    'theme component contract',
)
component_path.write_text(component)

validator_path = Path('scripts/validate-ui-compatibility.mjs')
validator = validator_path.read_text()
validator = replace_once(
    validator,
    "const snapshotHistoryPath = 'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte';",
    "const snapshotHistoryPath = 'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte';\nconst legacyImportPath = 'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte';\nconst themePanelPath = 'apps/extension/src/entrypoints/options/ThemePanel.svelte';\nconst optionsHtmlPath = 'apps/extension/src/entrypoints/options/index.html';",
    'UI guard input paths',
)
validator = replace_once(
    validator,
    "const [popupApp, popupStyle, optionsApp, optionsStyle, snapshotHistory] = await Promise.all([\n  readFile(popupAppPath, 'utf8'),\n  readFile(popupStylePath, 'utf8'),\n  readFile(optionsAppPath, 'utf8'),\n  readFile(optionsStylePath, 'utf8'),\n  readFile(snapshotHistoryPath, 'utf8'),\n]);",
    "const [\n  popupApp,\n  popupStyle,\n  optionsApp,\n  optionsStyle,\n  snapshotHistory,\n  legacyImport,\n  themePanel,\n  optionsHtml,\n] = await Promise.all([\n  readFile(popupAppPath, 'utf8'),\n  readFile(popupStylePath, 'utf8'),\n  readFile(optionsAppPath, 'utf8'),\n  readFile(optionsStylePath, 'utf8'),\n  readFile(snapshotHistoryPath, 'utf8'),\n  readFile(legacyImportPath, 'utf8'),\n  readFile(themePanelPath, 'utf8'),\n  readFile(optionsHtmlPath, 'utf8'),\n]);",
    'UI guard source loading',
)
validator = replace_once(
    validator,
    "  [optionsApp.includes('class=\"actions\"'), 'Options must retain top Apply/Revert actions.'],",
    "  [optionsApp.includes('class=\"actions\"'), 'Options must retain original sidebar Apply/Discard actions.'],\n  [\n    optionsHtml.includes('name=\"manifest.open_in_tab\" content=\"true\"'),\n    'Options must open as a complete browser tab instead of an embedded extension dialog.',\n  ],\n  [\n    ['Settings', 'Profiles', 'Actions', 'Built-in Profiles', 'New profile…'].every((label) =>\n      optionsApp.includes(label),\n    ),\n    'Options must preserve the original ZeroOmega navigation groups and profile workflow.',\n  ],\n  [\n    optionsApp.includes("activeSection === 'general'") &&\n      optionsApp.includes("activeSection === 'profile'"),\n    'General settings and profile details must be independent routed pages.',\n  ],\n  [\n    legacyImport.includes('aria-label=\"Legacy backup file\"') &&\n      legacyImport.includes('Import and use now'),\n    'Original ZeroOmega backups must support file-first one-step import and activation.',\n  ],\n  [\n    ['Automatic', 'Light', 'Dark'].every((label) => themePanel.includes(label)),\n    'Options must provide Automatic, Light, and Dark appearance modes.',\n  ],",
    'original workflow compatibility guards',
)
validator = replace_once(
    validator,
    "    optionsStyle.includes('@media (max-width: 760px)'),",
    "    optionsStyle.includes('@media (max-width: 760px)') &&\n      optionsStyle.includes('@media (prefers-color-scheme: dark)'),",
    'responsive and system-theme guard',
)
validator = replace_once(
    validator,
    "  'UI compatibility guard passed: classic workflow, fixed typography, keyboard focus, responsive layout, and rollback confirmation are present.',",
    "  'UI compatibility guard passed: original navigation, full-tab pages, direct legacy import, automatic theme, keyboard focus, responsive layout, and rollback confirmation are present.',",
    'UI guard success summary',
)
validator_path.write_text(validator)
