from pathlib import Path
import json
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


# Typed deletion blockers: profile references block deletion; Startup/Quick Switch do not.
replace_once(
    'packages/profile-workflow/src/profile-operations.ts',
    '''function directRoute(): ProfileRouteTarget {
  return { kind: 'direct' };
}

function replaceDeletedRoute(
  route: ProfileRouteTarget | undefined,
  profileId: string,
): ProfileRouteTarget | undefined {
  return routeTargetsProfile(route, profileId) ? directRoute() : route;
}

''',
    '',
)

replace_once(
    'packages/profile-workflow/src/profile-operations.ts',
    '''function rewriteProfileRoutes(profile: UserProfile, deletedProfileId: string): void {
  switch (profile.kind) {
    case 'fixed':
      return;
    case 'switch':
      profile.defaultRoute = replaceDeletedRoute(profile.defaultRoute, deletedProfileId)!;
      profile.rules = profile.rules.map((rule) => ({
        ...rule,
        route: replaceDeletedRoute(rule.route, deletedProfileId)!,
      }));
      return;
    case 'rule-list':
      profile.matchRoute = replaceDeletedRoute(profile.matchRoute, deletedProfileId)!;
      profile.defaultRoute = replaceDeletedRoute(profile.defaultRoute, deletedProfileId)!;
      return;
    case 'virtual':
      profile.targetRoute = replaceDeletedRoute(profile.targetRoute, deletedProfileId)!;
      return;
    case 'pac':
    case 'auto-detect': {
      const fallbackRoute = replaceDeletedRoute(profile.fallbackRoute, deletedProfileId);
      if (fallbackRoute === undefined) delete profile.fallbackRoute;
      else profile.fallbackRoute = fallbackRoute;
    }
  }
}

''',
    '''export interface ProfileReferenceBlocker {
  readonly profileId: string;
  readonly profileName: string;
  readonly profileKind: UserProfile['kind'];
  readonly viaAttachedRuleListProfileId?: string;
}

function profileReferencesTarget(profile: UserProfile, targetProfileId: string): boolean {
  switch (profile.kind) {
    case 'fixed':
      return false;
    case 'switch':
      return (
        routeTargetsProfile(profile.defaultRoute, targetProfileId) ||
        profile.rules.some((rule) => routeTargetsProfile(rule.route, targetProfileId))
      );
    case 'rule-list':
      return (
        routeTargetsProfile(profile.matchRoute, targetProfileId) ||
        routeTargetsProfile(profile.defaultRoute, targetProfileId)
      );
    case 'pac':
    case 'auto-detect':
      return routeTargetsProfile(profile.fallbackRoute, targetProfileId);
    case 'virtual':
      return routeTargetsProfile(profile.targetRoute, targetProfileId);
  }
}

function deletionProfileIds(profile: UserProfile): ReadonlySet<string> {
  return new Set([
    profile.id,
    ...(profile.kind === 'switch' && profile.attachedRuleListProfileId !== undefined
      ? [profile.attachedRuleListProfileId]
      : []),
  ]);
}

function attachedRuleListOwnerById(spec: ProfileSpec): ReadonlyMap<string, SwitchProfile> {
  return new Map(
    spec.profiles.flatMap((profile) =>
      profile.kind === 'switch' && profile.attachedRuleListProfileId !== undefined
        ? [[profile.attachedRuleListProfileId, profile] as const]
        : [],
    ),
  );
}

export function listProfileReferenceBlockers(
  spec: ProfileSpec,
  profileId: string,
): readonly ProfileReferenceBlocker[] {
  const deleted = spec.profiles.find((profile) => profile.id === profileId);
  if (!deleted) throw new RangeError(`profile ${profileId} does not exist`);
  const deletedIds = deletionProfileIds(deleted);
  const attachedOwners = attachedRuleListOwnerById(spec);
  const blockers = new Map<string, ProfileReferenceBlocker>();

  for (const profile of spec.profiles) {
    if (deletedIds.has(profile.id)) continue;
    if (![...deletedIds].some((deletedId) => profileReferencesTarget(profile, deletedId))) continue;

    const owner = attachedOwners.get(profile.id);
    const visibleProfile = owner && !deletedIds.has(owner.id) ? owner : profile;
    if (deletedIds.has(visibleProfile.id) || blockers.has(visibleProfile.id)) continue;
    blockers.set(visibleProfile.id, {
      profileId: visibleProfile.id,
      profileName: visibleProfile.name,
      profileKind: visibleProfile.kind,
      ...(owner === undefined ? {} : { viaAttachedRuleListProfileId: profile.id }),
    });
  }

  return [...blockers.values()];
}

''',
)

replace_once(
    'packages/profile-workflow/src/profile-operations.ts',
    '''export function deleteProfileDraft(spec: ProfileSpec, profileId: string): ProfileSpec {
  const draft = cloneProfileSpecDraft(spec);
  const deleted = draft.profiles.find((profile) => profile.id === profileId);
  if (!deleted) throw new RangeError(`profile ${profileId} does not exist`);

  const deletedProfileIds = new Set<string>([profileId]);
''',
    '''export function deleteProfileDraft(spec: ProfileSpec, profileId: string): ProfileSpec {
  const deletedSource = spec.profiles.find((profile) => profile.id === profileId);
  if (!deletedSource) throw new RangeError(`profile ${profileId} does not exist`);
  const blockers = listProfileReferenceBlockers(spec, profileId);
  if (blockers.length > 0) {
    throw new RangeError(
      `profile ${deletedSource.name} is referenced by ${blockers
        .map((blocker) => blocker.profileName)
        .join(', ')}`,
    );
  }

  const draft = cloneProfileSpecDraft(spec);
  const deleted = draft.profiles.find((profile) => profile.id === profileId)!;
  const deletedProfileIds = new Set<string>(deletionProfileIds(deleted));
''',
)

replace_once(
    'packages/profile-workflow/src/profile-operations.ts',
    '''  draft.profiles = draft.profiles.filter((profile) => !deletedProfileIds.has(profile.id));
  for (const deletedId of deletedProfileIds) {
    for (const profile of draft.profiles) rewriteProfileRoutes(profile, deletedId);
  }

  if (
    draft.settings.startup.route?.kind === 'profile' &&
    deletedProfileIds.has(draft.settings.startup.route.profileId)
  ) {
    draft.settings.startup.route = directRoute();
  }
  draft.settings.quickSwitch.routes = draft.settings.quickSwitch.routes.filter(
    (route) => route.kind !== 'profile' || !deletedProfileIds.has(route.profileId),
  );
  if (draft.settings.quickSwitch.routes.length === 0) {
    draft.settings.quickSwitch.routes = [{ kind: 'direct' }, { kind: 'system' }];
  }
''',
    '''  draft.profiles = draft.profiles.filter((profile) => !deletedProfileIds.has(profile.id));

  if (
    draft.settings.startup.route?.kind === 'profile' &&
    deletedProfileIds.has(draft.settings.startup.route.profileId)
  ) {
    delete draft.settings.startup.route;
  }
  draft.settings.quickSwitch.routes = draft.settings.quickSwitch.routes.filter(
    (route) => route.kind !== 'profile' || !deletedProfileIds.has(route.profileId),
  );
''',
)

replace_once(
    'packages/profile-workflow/src/index.ts',
    '''  deleteProfileDraft,
  duplicateProfileDraft,
  replaceProfileReferencesDraft,
  type ProfileWorkflowIdFactory,
''',
    '''  deleteProfileDraft,
  duplicateProfileDraft,
  listProfileReferenceBlockers,
  replaceProfileReferencesDraft,
  type ProfileReferenceBlocker,
  type ProfileWorkflowIdFactory,
''',
)

# Unit tests replace automatic reference rewriting with original-compatible blocking.
replace_once(
    'packages/profile-workflow/src/profile-operations.test.ts',
    '''  deleteProfileDraft,
  duplicateProfileDraft,
  replaceProfileReferencesDraft,
''',
    '''  deleteProfileDraft,
  duplicateProfileDraft,
  listProfileReferenceBlockers,
  replaceProfileReferencesDraft,
''',
)

old_rewrite_test = '''  it('rewrites surviving references to a deleted profile as Direct', () => {
    const spec = workflowFixture();
    spec.profiles.push({
      id: 'profile-switch',
      name: 'Auto Switch',
      kind: 'switch',
      rules: [
        {
          id: 'rule-primary',
          condition: { kind: 'host-wildcard', pattern: '*.example.invalid' },
          route: { kind: 'profile', profileId: 'profile-primary' },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: 'profile-primary' },
    });

    const draft = deleteProfileDraft(spec, 'profile-primary');
    const switchProfile = draft.profiles.find(
      (profile): profile is SwitchProfile =>
        profile.id === 'profile-switch' && profile.kind === 'switch',
    );

    expect(draft.settings.startup.route).toEqual({ kind: 'direct' });
    expect(switchProfile?.defaultRoute).toEqual({ kind: 'direct' });
    expect(switchProfile?.rules[0]?.route).toEqual({ kind: 'direct' });
    expect(draft.proxyEndpoints.map((endpoint) => endpoint.id)).not.toContain('endpoint-primary');
    expect(validateProfileSpec(draft).valid).toBe(true);
  });
'''
new_rewrite_test = '''  it('blocks deletion and reports every profile reference surface', () => {
    const spec = workflowFixture();
    spec.profiles.push(
      {
        id: 'profile-switch',
        name: 'Switch Referrer',
        kind: 'switch',
        rules: [
          {
            id: 'rule-primary',
            condition: { kind: 'host-wildcard', pattern: '*.example.invalid' },
            route: { kind: 'profile', profileId: 'profile-primary' },
          },
        ],
        defaultRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
      {
        id: 'profile-rule-list',
        name: 'Rule List Referrer',
        kind: 'rule-list',
        sourceId: 'source-referrer',
        matchRoute: { kind: 'profile', profileId: 'profile-primary' },
        defaultRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
      {
        id: 'profile-pac',
        name: 'PAC Referrer',
        kind: 'pac',
        source: { kind: 'inline', script: "function FindProxyForURL() { return 'DIRECT'; }" },
        fallbackRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
      {
        id: 'profile-auto',
        name: 'Auto Referrer',
        kind: 'auto-detect',
        fallbackRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
      {
        id: 'profile-virtual',
        name: 'Virtual Referrer',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
    );
    spec.ruleSources.push({
      id: 'source-referrer',
      name: 'Referrer source',
      format: 'switchy',
      location: { kind: 'inline', content: '[SwitchyOmega Conditions]\\n@with result\\n' },
    });

    expect(listProfileReferenceBlockers(spec, 'profile-primary').map((entry) => entry.profileName)).toEqual([
      'Switch Referrer',
      'Rule List Referrer',
      'PAC Referrer',
      'Auto Referrer',
      'Virtual Referrer',
    ]);
    expect(() => deleteProfileDraft(spec, 'profile-primary')).toThrow(
      'profile Proxy is referenced by Switch Referrer, Rule List Referrer, PAC Referrer, Auto Referrer, Virtual Referrer',
    );
  });

  it('collapses hidden attached Rule List references to their visible owner Switch', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids, 'Visible Owner');
    const attached = createAttachedRuleListDraft(created.draft, created.profileId, ids);
    const state = inspectAttachedRuleList(attached, created.profileId);
    if (!state) throw new Error('attached Rule List missing');
    state.profile.matchRoute = { kind: 'profile', profileId: 'profile-primary' };
    state.profile.defaultRoute = { kind: 'profile', profileId: 'profile-primary' };

    expect(listProfileReferenceBlockers(attached, 'profile-primary')).toEqual([
      {
        profileId: created.profileId,
        profileName: 'Visible Owner',
        profileKind: 'switch',
        viaAttachedRuleListProfileId: state.profile.id,
      },
    ]);
    expect(() => deleteProfileDraft(attached, 'profile-primary')).toThrow(
      'profile Proxy is referenced by Visible Owner',
    );
  });
'''
replace_once('packages/profile-workflow/src/profile-operations.test.ts', old_rewrite_test, new_rewrite_test)

replace_once(
    'packages/profile-workflow/src/profile-operations.test.ts',
    '''  it('keeps Direct and System available after deleting the final quick-switch profile', () => {
    const withoutSecondary = deleteProfileDraft(workflowFixture(), 'profile-secondary');
    withoutSecondary.settings.quickSwitch.routes = [
      { kind: 'profile', profileId: 'profile-primary' },
    ];

    const draft = deleteProfileDraft(withoutSecondary, 'profile-primary');

    expect(draft.profiles).toEqual([]);
    expect(draft.proxyEndpoints).toEqual([]);
    expect(draft.settings.startup.route).toEqual({ kind: 'direct' });
    expect(draft.settings.quickSwitch.routes).toEqual([{ kind: 'direct' }, { kind: 'system' }]);
    expect(validateProfileSpec(draft).valid).toBe(true);
  });
''',
    '''  it('clears Startup and removes Quick Switch references without injecting built-ins', () => {
    const spec = workflowFixture();
    spec.settings.startup.route = { kind: 'profile', profileId: 'profile-secondary' };
    spec.settings.quickSwitch.routes = [{ kind: 'profile', profileId: 'profile-secondary' }];

    const draft = deleteProfileDraft(spec, 'profile-secondary');

    expect(draft.settings.startup.route).toBeUndefined();
    expect(draft.settings.quickSwitch.routes).toEqual([]);
    expect(validateProfileSpec(draft).valid).toBe(true);
  });
''',
)

# Explicit accessible deletion dialog.
Path('apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte').write_text(r'''<script lang="ts">
  import type { ProfileReferenceBlocker } from '@zeroomega-nex/profile-workflow';

  export let profileName: string;
  export let blockers: readonly ProfileReferenceBlocker[] = [];
  export let disabled = false;
  export let onCancel: () => void;
  export let onConfirm: () => Promise<void>;
</script>

<div class="deletion-backdrop" data-profile-deletion-backdrop>
  {#if blockers.length > 0}
    <section
      class="deletion-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="profile-deletion-blocked-title"
      aria-describedby="profile-deletion-blocked-description"
      data-profile-deletion-dialog
      data-profile-deletion-mode="blocked"
    >
      <h2 id="profile-deletion-blocked-title">Cannot delete profile</h2>
      <p id="profile-deletion-blocked-description">
        “{profileName}” is still referenced by the following profiles. Modify those profiles before
        deleting it.
      </p>
      <ul class="reference-list" data-profile-deletion-blockers>
        {#each blockers as blocker (blocker.profileId)}
          <li data-profile-deletion-blocker={blocker.profileId}>
            <strong>{blocker.profileName}</strong>
            <span>{blocker.profileKind}</span>
          </li>
        {/each}
      </ul>
      <div class="dialog-actions">
        <button type="button" data-profile-deletion-close onclick={onCancel}>Close</button>
      </div>
    </section>
  {:else}
    <section
      class="deletion-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-deletion-confirm-title"
      aria-describedby="profile-deletion-confirm-description"
      data-profile-deletion-dialog
      data-profile-deletion-mode="confirm"
    >
      <h2 id="profile-deletion-confirm-title">Delete profile</h2>
      <p id="profile-deletion-confirm-description">
        Delete “{profileName}”? This changes only the Draft until Apply.
      </p>
      <div class="dialog-actions">
        <button type="button" data-profile-deletion-cancel disabled={disabled} onclick={onCancel}
          >Cancel</button
        >
        <button
          type="button"
          class="danger"
          data-profile-deletion-confirm
          disabled={disabled}
          onclick={() => void onConfirm()}>Delete</button
        >
      </div>
    </section>
  {/if}
</div>

<style>
  .deletion-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(0 0 0 / 42%);
  }

  .deletion-dialog {
    width: min(520px, 100%);
    padding: 22px;
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    background: var(--content-bg);
    box-shadow: 0 10px 34px var(--shadow);
  }

  h2 {
    margin: 0 0 9px;
    font-size: 20px;
    font-weight: 500;
  }

  p {
    margin: 0 0 16px;
    color: var(--muted);
  }

  .reference-list {
    max-height: 260px;
    margin: 0 0 18px;
    padding: 0;
    overflow-y: auto;
    border-top: 1px solid var(--border);
    list-style: none;
  }

  .reference-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 9px 2px;
    border-bottom: 1px solid var(--border);
  }

  .reference-list span {
    color: var(--muted);
    font-size: 12px;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  button {
    min-height: 32px;
    padding: 5px 13px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--button-bg);
    color: var(--text);
  }

  button.danger {
    border-color: var(--danger);
    background: var(--danger);
    color: #fff;
  }
</style>
''')

# Options wiring.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''    inspectProfileWorkflow,
    parseProfileWorkflowState,
''',
    '''    inspectProfileWorkflow,
    listProfileReferenceBlockers,
    parseProfileWorkflowState,
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''    ProfileWorkflowPacSourceUpdateView,
    ProfileWorkflowProfileMutation,
''',
    '''    ProfileReferenceBlocker,
    ProfileWorkflowPacSourceUpdateView,
    ProfileWorkflowProfileMutation,
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    "  import PacProfileEditor from './PacProfileEditor.svelte';\n",
    "  import PacProfileEditor from './PacProfileEditor.svelte';\n  import ProfileDeletionDialog from './ProfileDeletionDialog.svelte';\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  type InterfaceFlag =
''',
    '''  interface PendingProfileDeletion {
    readonly profileId: string;
    readonly profileName: string;
    readonly blockers: readonly ProfileReferenceBlocker[];
  }

  type InterfaceFlag =
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  let requestingDiagnosticsPermission = false;

  let allProfiles: readonly UserProfile[] = [];
''',
    '''  let requestingDiagnosticsPermission = false;
  let pendingProfileDeletion: PendingProfileDeletion | undefined;

  let allProfiles: readonly UserProfile[] = [];
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  async function deleteSelectedProfile(): Promise<void> {
    if (!state || !selectedProfile || !(await commitActiveProfileEditor())) return;
    const shouldConfirm = state.draft.settings.interface.confirmDeletion;
    if (
      shouldConfirm &&
      !globalThis.confirm(`Delete profile “${selectedProfile.name}”? This changes only the Draft.`)
    ) {
      return;
    }
    try {
      await replaceDraft(deleteProfileDraft(state.draft, selectedProfile.id));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }
''',
    '''  async function performProfileDeletion(profileId: string): Promise<void> {
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
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''            type="button"
            class="danger"
            disabled={view?.busy || saving}
            onclick={deleteSelectedProfile}>Delete</button
''',
    '''            type="button"
            class="danger"
            data-profile-delete-action
            disabled={view?.busy || saving}
            onclick={deleteSelectedProfile}>Delete</button
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''</div>
''',
    '''</div>

{#if pendingProfileDeletion}
  <ProfileDeletionDialog
    profileName={pendingProfileDeletion.profileName}
    blockers={pendingProfileDeletion.blockers}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileDeletion = undefined)}
    onConfirm={confirmProfileDeletion}
  />
{/if}
''',
)

# Component rendering contract.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    "import PacProfileEditor from './entrypoints/options/PacProfileEditor.svelte';\n",
    "import PacProfileEditor from './entrypoints/options/PacProfileEditor.svelte';\nimport ProfileDeletionDialog from './entrypoints/options/ProfileDeletionDialog.svelte';\n",
)
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''  it('renders distinct colored profile type icons', () => {
''',
    '''  it('renders blocked and confirm profile-deletion dialogs without a destructive blocked action', () => {
    const blocked = render(ProfileDeletionDialog, {
      props: {
        profileName: 'Target',
        blockers: [
          {
            profileId: 'profile-referrer',
            profileName: 'Referrer',
            profileKind: 'switch',
          },
        ],
        onCancel: () => undefined,
        onConfirm: async () => undefined,
      },
    }).body;
    expect(blocked).toContain('role="alertdialog"');
    expect(blocked).toContain('data-profile-deletion-mode="blocked"');
    expect(blocked).toContain('Referrer');
    expect(blocked).not.toContain('data-profile-deletion-confirm');

    const confirm = render(ProfileDeletionDialog, {
      props: {
        profileName: 'Disposable',
        blockers: [],
        onCancel: () => undefined,
        onConfirm: async () => undefined,
      },
    }).body;
    expect(confirm).toContain('role="dialog"');
    expect(confirm).toContain('data-profile-deletion-mode="confirm"');
    expect(confirm).toContain('data-profile-deletion-confirm');
  });

  it('renders distinct colored profile type icons', () => {
''',
)

# Include Unrelated Proxy in Quick Switch so the browser delete path proves cleanup.
fixture_path = Path('fixtures/zeroomega-v2/virtual-reference-migration.json')
fixture = json.loads(fixture_path.read_text())
quick = fixture['-quickSwitchProfiles']
if 'Unrelated Proxy' not in quick:
    quick.insert(1, 'Unrelated Proxy')
fixture_path.write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')

# Chromium: referenced target is blocked before migration; unreferenced profile deletes normally after migration.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await virtualOptions
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  await virtualOptions.locator('[data-new-profile-action]').click();
''',
    '''  await virtualOptions
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  await virtualOptions.getByRole('button', { name: 'Target Proxy', exact: true }).click();
  await virtualOptions.locator('[data-profile-delete-action]').click();
  const blockedDeletion = virtualOptions.locator(
    '[data-profile-deletion-dialog][data-profile-deletion-mode="blocked"]',
  );
  await blockedDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  const blockerNames = await blockedDeletion
    .locator('[data-profile-deletion-blocker] strong')
    .allTextContents();
  assert.deepEqual(blockerNames.sort(), [
    'Auto Matrix',
    'Existing Alias',
    'PAC Matrix',
    'Route Matrix',
    'Rule Matrix',
  ]);
  assert.equal(await blockedDeletion.locator('[data-profile-deletion-confirm]').count(), 0);
  await blockedDeletion.locator('[data-profile-deletion-close]').click();
  assert.equal(
    await virtualOptions.getByRole('button', { name: 'Target Proxy', exact: true }).count(),
    1,
  );

  await virtualOptions.locator('[data-new-profile-action]').click();
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  assert.equal(
    await virtualOptions.getByRole('button', { name: 'Stable Alias', exact: true }).count(),
    1,
  );
  await virtualContext.close();
''',
    '''  assert.equal(
    await virtualOptions.getByRole('button', { name: 'Stable Alias', exact: true }).count(),
    1,
  );

  const unrelatedProfileId = await virtualWorker.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(key))[key];
    const profile = workflow?.applied?.profiles?.find((candidate) => candidate.name === 'Unrelated Proxy');
    if (!profile) throw new Error('Unrelated Proxy is missing');
    return profile.id;
  });
  await virtualOptions.getByRole('button', { name: 'Unrelated Proxy', exact: true }).click();
  await virtualOptions.locator('[data-profile-delete-action]').click();
  const confirmDeletion = virtualOptions.locator(
    '[data-profile-deletion-dialog][data-profile-deletion-mode="confirm"]',
  );
  await confirmDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  await confirmDeletion.locator('[data-profile-deletion-confirm]').click();
  await assertEventually(
    async () =>
      (await virtualOptions.getByRole('button', { name: 'Unrelated Proxy', exact: true }).count()) === 0,
    'Unreferenced profile remained in navigation after confirmed deletion',
  );
  await assertEventually(
    async () =>
      virtualWorker.evaluate(async (deletedId) => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow?.draft?.profiles?.every((profile) => profile.id !== deletedId) &&
          workflow.draft.settings.quickSwitch.routes.every(
            (route) => route.kind !== 'profile' || route.profileId !== deletedId,
          )
        );
      }, unrelatedProfileId),
    'Confirmed deletion did not remove the profile and its Quick Switch route from Draft',
  );
  await assertEventually(
    async () => !(await virtualApply.isDisabled()),
    'Confirmed profile deletion did not leave an applicable Draft',
  );
  await virtualApply.click();
  await assertEventually(
    async () =>
      virtualWorker.evaluate(async (deletedId) => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow !== undefined &&
          workflow.pendingApply === undefined &&
          workflow.applied.profiles.every((profile) => profile.id !== deletedId) &&
          JSON.stringify(workflow.draft) === JSON.stringify(workflow.applied)
        );
      }, unrelatedProfileId),
    'Confirmed profile deletion did not commit through normal Apply',
    20_000,
  );
  await virtualContext.close();
''',
)

# Permanent guard loads the dialog and proves the typed/UI/browser boundaries.
validator_path = Path('scripts/validate-ui-compatibility.mjs')
lines = validator_path.read_text().splitlines()
for index, line in enumerate(lines):
    if line.strip() == "const virtualProfilePath = 'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte';":
        lines[index + 1:index + 1] = [
            'const profileDeletionDialogPath =',
            "  'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte';",
        ]
        break
else:
    raise SystemExit('profile deletion dialog path anchor missing')
for index, line in enumerate(lines):
    if line.strip() == 'virtualProfile,':
        lines.insert(index + 1, '  profileDeletionDialog,')
        break
else:
    raise SystemExit('profile deletion dialog destructuring anchor missing')
for index, line in enumerate(lines):
    if line.strip() == "readFile(virtualProfilePath, 'utf8'),":
        lines.insert(index + 1, "  readFile(profileDeletionDialogPath, 'utf8'),")
        break
else:
    raise SystemExit('profile deletion dialog read anchor missing')
validator_path.write_text('\n'.join(lines) + '\n')

replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''    'Options must retain familiar left profile navigation.',
  ],
''',
    '''    'Options must retain familiar left profile navigation.',
  ],
  [
    profileOperations.includes('export function listProfileReferenceBlockers') &&
      profileOperations.includes('profileReferencesTarget') &&
      profileOperations.includes('viaAttachedRuleListProfileId') &&
      profileOperations.includes('profile is referenced by') &&
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
''',
)

# Durable source-backed documentation.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg_path.write_text(
    kg_path.read_text()
    + '''
- 原版 `ProfileCtrl.deleteProfile` 先调用 `OmegaPac.Profiles.referencedBySet`；若存在 Profile 引用，`cannot_delete_profile.jade` 列出引用者并只允许关闭，附属 `__ruleListOf_*` 通过 `getParentName` 折叠成父 Profile。Startup 与 Quick Switch 不属于阻断引用：确认删除后 Startup 清空、Quick Switch 移除该项；不会把剩余 Profile 引用静默改成 Direct。
- Nex 删除采用同样双层边界：`listProfileReferenceBlockers` 覆盖 Switch rules/default、Rule List match/default、PAC/Auto Detect fallback、Virtual target，并对隐藏附属 Rule List 去重映射父 Switch；Options 显式 `alertdialog` 列引用者，typed `deleteProfileDraft` 再次拒绝绕过 UI 的删除。未被引用时按 `confirmDeletion` 显示确认对话框或直接生成 Draft，随后仍需正常 Apply。
- ProfileSpec 允许 Startup route 缺省且 Quick Switch routes 为空，因此删除目标后对齐原版为删除 Startup 字段、过滤 Quick Switch 项，不注入 Nex-only Direct/System 默认。
'''
)

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
audit = audit_path.read_text()
audit = audit.replace(
    '| B-04 | 删除按钮/确认     | `profile.jade`、`delete_profile.jade` | 页头删除，按设置确认             | MUST_MATCH | PARTIAL  | PARTIAL | 有删除和 confirm，但文案/引用处理不全                     | 补引用保护                    |',
    '| B-04 | 删除按钮/确认     | `profile.jade`、`delete_profile.jade` | 页头删除，按设置确认             | MUST_MATCH | DONE     | PARTIAL | 页头删除按 `confirmDeletion` 使用显式可访问对话框；未确认只改 Draft，Chromium 验证确认→Apply 全链 | 补完整 locale                 |',
)
audit = audit.replace(
    '| B-05 | 被引用时禁止删除  | `cannot_delete_profile.jade`          | 列出引用者，不允许损坏引用       | MUST_MATCH | MISSING  | MISSING | 当前 delete mutation 需核验引用完整性                     | 增加引用图和 UI               |',
    '| B-05 | 被引用时禁止删除  | `cannot_delete_profile.jade`、`profile.coffee` | 列出引用者，不允许损坏引用 | MUST_MATCH | DONE     | PARTIAL | typed blocker 覆盖所有 Profile route 面；隐藏附属 Rule List 折叠为父 Switch；UI `alertdialog` 与 Chromium 原版备份回归验证 | 补 locale                     |',
)
audit = audit.replace(
    '| B-06 | 替换情景模式引用  | `replace_profile.jade`                | 批量把 from 引用替换为 to        | MUST_MATCH | MISSING  | MISSING | 未实现                                                    | typed replace-ref transaction |',
    '| B-06 | 替换情景模式引用  | `replace_profile.jade`、`options.coffee` | 批量把 from 引用替换为 to      | MUST_MATCH | PARTIAL  | PARTIAL | Virtual shortcut 已有完整 typed replace-ref transaction 与 Chromium 全链；通用页头 Replace 入口仍缺 | 增加通用 Replace 对话框       |',
)
audit_path.write_text(audit)

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
run_id = os.environ.get('PROFILE_DELETION_RUN_ID', 'PENDING')
insert_before = '### Attached Rule List lifecycle and background updates\n'
section = f'''### Profile deletion and reference protection\n\n- Original deletion refuses any profile that is referenced by another Profile, lists visible referrers, and collapses attached Rule List references to the parent profile. Startup and Quick Switch references are cleaned after deletion but do not block it.\n- Nex now exposes a typed blocker list across Switch, Rule List, PAC, Auto Detect, and Virtual routes; `deleteProfileDraft` rejects referenced deletion even when called outside Options.\n- Options uses explicit accessible blocked/confirmation dialogs instead of a generic browser confirm. Unreferenced deletion changes Draft only and commits through normal Apply; Startup becomes unset and Quick Switch only removes deleted routes.\n- Chromium restores the cross-reference fixture, verifies that `Target Proxy` cannot be deleted and lists all five referrers, then confirms deletion of `Unrelated Proxy`, verifies Draft/resource cleanup, and applies it normally.\n- Integration run `{run_id}`; product commit containing this document.\n\n'''
if insert_before not in status:
    raise SystemExit('Milestone status deletion insertion anchor missing')
status = status.replace(insert_before, section + insert_before, 1)
status = status.replace(
    'Continue typed locale coverage, profile deletion/reference protection, and profile-level export actions; keep file PAC activation under an explicit target capability decision.',
    'Continue the general Replace Profile dialog, profile-level export actions, and typed locale coverage; keep file PAC activation under an explicit target capability decision.',
)
status_path.write_text(status)
