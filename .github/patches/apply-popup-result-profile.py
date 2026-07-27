from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(source.replace(old, new))


# Generalize the already-audited valid-result graph and add Switch/Virtual mutation.
path = 'packages/profile-workflow/src/popup-condition.ts'
replace_once(
    path,
    '''export function listPopupConditionResultRoutes(
  spec: ProfileSpec,
  switchProfileId: string,
): readonly ProfileRouteTarget[] {
''',
    '''export function listPopupProfileResultRoutes(
  spec: ProfileSpec,
  profileId: string,
): readonly ProfileRouteTarget[] {
''',
)
replace_once(path, 'profile.id === switchProfileId ||', 'profile.id === profileId ||')
replace_once(path, 'reachesProfile(spec, profile.id, switchProfileId)', 'reachesProfile(spec, profile.id, profileId)')
replace_once(
    path,
    '''  return routes;
}

export interface AddPopupConditionInput {
''',
    '''  return routes;
}

export const listPopupConditionResultRoutes = listPopupProfileResultRoutes;

export function setPopupProfileResultDraft(
  applied: ProfileSpec,
  profileId: string,
  route: ProfileRouteTarget,
): ProfileSpec {
  const draft = cloneProfileSpecDraft(applied);
  const profile = draft.profiles.find((candidate) => candidate.id === profileId);
  if (!profile || (profile.kind !== 'switch' && profile.kind !== 'virtual')) {
    throw new TypeError(`profile ${profileId} does not expose a Popup result route`);
  }
  const validRoutes = listPopupProfileResultRoutes(draft, profile.id);
  if (!validRoutes.some((candidate) => sameRoute(candidate, route))) {
    throw new TypeError('Popup result profile is not valid for the selected profile');
  }
  if (profile.kind === 'switch') profile.defaultRoute = structuredClone(route);
  else profile.targetRoute = structuredClone(route);

  const validation = validateProfileSpec(draft);
  if (!validation.valid) {
    const first = validation.issues.find((issue) => issue.severity === 'error');
    throw new TypeError(first ? `${first.code}: ${first.message}` : 'Popup result profile is invalid');
  }
  return draft;
}

export interface AddPopupConditionInput {
''',
)

# Export the new result-route operation.
replace_once(
    'packages/profile-workflow/src/index.ts',
    '''  listPopupConditionResultRoutes,
  popupConditionTag,
  type AddPopupConditionInput,
''',
    '''  listPopupConditionResultRoutes,
  listPopupProfileResultRoutes,
  popupConditionTag,
  setPopupProfileResultDraft,
  type AddPopupConditionInput,
''',
)

# Operation tests cover both Switch and Virtual and cycle filtering.
test = Path('packages/profile-workflow/src/popup-condition.test.ts')
source = test.read_text()
source = source.replace(
    '''  addPopupConditionDraft,
  listPopupConditionResultRoutes,
''',
    '''  addPopupConditionDraft,
  listPopupConditionResultRoutes,
  setPopupProfileResultDraft,
''',
)
insert = '''
  it('changes Switch and Virtual result routes without mutating the source revision', () => {
    const original = switchSpec(false);
    original.profiles.push({
      id: 'profile-virtual',
      name: 'Virtual route',
      kind: 'virtual',
      targetRoute: { kind: 'direct' },
    });
    const switched = setPopupProfileResultDraft(original, 'profile-switch', {
      kind: 'profile',
      profileId: 'profile-secondary',
    });
    const virtual = setPopupProfileResultDraft(switched, 'profile-virtual', {
      kind: 'profile',
      profileId: 'profile-primary',
    });
    const switchProfile = virtual.profiles.find((profile) => profile.id === 'profile-switch');
    const virtualProfile = virtual.profiles.find((profile) => profile.id === 'profile-virtual');
    if (!switchProfile || switchProfile.kind !== 'switch') throw new Error('missing Switch Profile');
    if (!virtualProfile || virtualProfile.kind !== 'virtual') throw new Error('missing Virtual Profile');
    expect(switchProfile.defaultRoute).toEqual({
      kind: 'profile',
      profileId: 'profile-secondary',
    });
    expect(virtualProfile.targetRoute).toEqual({
      kind: 'profile',
      profileId: 'profile-primary',
    });
    const originalSwitch = original.profiles.find((profile) => profile.id === 'profile-switch');
    if (!originalSwitch || originalSwitch.kind !== 'switch') throw new Error('missing original');
    expect(originalSwitch.defaultRoute).toEqual({ kind: 'direct' });
  });

  it('rejects result routes that would create a Virtual cycle', () => {
    const spec = switchSpec(false);
    spec.profiles.push(
      {
        id: 'profile-virtual-a',
        name: 'Virtual A',
        kind: 'virtual',
        targetRoute: { kind: 'direct' },
      },
      {
        id: 'profile-virtual-b',
        name: 'Virtual B',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-virtual-a' },
      },
    );
    expect(() =>
      setPopupProfileResultDraft(spec, 'profile-virtual-a', {
        kind: 'profile',
        profileId: 'profile-virtual-b',
      }),
    ).toThrow(/not valid/u);
  });
'''
marker = '\n});\n'
if source.count(marker) != 1:
    raise SystemExit(f'popup-condition test end marker: {source.count(marker)}')
test.write_text(source.replace(marker, insert + marker))

# Typed command and normal verified Apply preserving the current route.
path = 'packages/profile-workflow/src/commands.ts'
replace_once(
    path,
    '''import { addPopupConditionDraft, type PopupSiteCondition } from './popup-condition.js';
''',
    '''import {
  addPopupConditionDraft,
  setPopupProfileResultDraft,
  type PopupSiteCondition,
} from './popup-condition.js';
''',
)
replace_once(
    path,
    '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'add-current-site-condition';
''',
    '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'set-popup-profile-result';
      readonly expectedAppliedRevisionId: string;
      readonly profileId: string;
      readonly route: ProfileRouteTarget;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'add-current-site-condition';
''',
)
replace_once(
    path,
    '''    case 'add-current-site-condition':
      return (
''',
    '''    case 'set-popup-profile-result':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        typeof record.profileId === 'string' &&
        record.profileId.length > 0 &&
        validRoute(record.route)
      );
    case 'add-current-site-condition':
      return (
''',
)
replace_once(
    path,
    '''  if (command.action === 'add-current-site-condition') {
''',
    '''  if (command.action === 'set-popup-profile-result') {
    if (state.applied.revision.id !== command.expectedAppliedRevisionId) {
      return failure(
        'conflict',
        `expected applied revision ${command.expectedAppliedRevisionId}, current revision is ${state.applied.revision.id}`,
        state,
      );
    }
    if (state.pendingApply) {
      return failure('busy', 'profile workflow is busy applying another revision', state);
    }
    if (!applyService) {
      return failure('invalid', 'profile workflow Apply service is unavailable', state);
    }
    if (inspectProfileWorkflow(state).dirty) {
      return failure(
        'invalid',
        'Apply or discard Options changes before changing a result profile from Popup',
        state,
      );
    }
    const activeRoute = (await runtimeView(applyService))?.activeRoute;
    if (!activeRoute) {
      return failure('invalid', 'the current browser route is unavailable', state);
    }

    let edited: ProfileWorkflowState;
    try {
      edited = replaceProfileWorkflowDraft(
        state,
        setPopupProfileResultDraft(state.applied, command.profileId, command.route),
      );
    } catch (error) {
      return failure('invalid', errorMessage(error), state);
    }
    try {
      if (!(await repository.compareAndSwap(state.generation, edited))) {
        const current = await repository.read();
        return failure(
          'conflict',
          'profile workflow changed before the Popup result profile could be persisted',
          current,
        );
      }
    } catch (error) {
      return failure('storage-failure', errorMessage(error), state);
    }

    const result = await applyProfileWorkflow(repository, applyService.driver, {
      ...applyService.createContext(edited),
      startRoute: activeRoute,
    });
    if (result.status === 'applied') {
      return response(result.state, result.snapshotId, await runtimeView(applyService));
    }
    return failure(
      result.status === 'busy'
        ? 'busy'
        : result.status === 'conflict'
          ? 'conflict'
          : result.status === 'failed'
            ? 'apply-failed'
            : 'invalid',
      result.message,
      result.state,
    );
  }

  if (command.action === 'add-current-site-condition') {
''',
)

Path('packages/profile-workflow/src/popup-result-command.test.ts').write_text('''import { cloneProfileSpec, type ProfileRouteTarget, type ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  executeProfileWorkflowCommand,
  type ProfileWorkflowApplyService,
  type ProfileWorkflowInitializer,
} from './commands.js';
import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowRuntimeView,
} from './contracts.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { createProfileWorkflowState, replaceProfileWorkflowDraft } from './state.js';
import { workflowFixture } from './test-fixture.js';

function resultSpec(): ProfileSpec {
  const spec = workflowFixture();
  spec.profiles.push(
    {
      id: 'profile-switch',
      name: 'Auto Switch',
      kind: 'switch',
      defaultRoute: { kind: 'direct' },
      rules: [],
    },
    {
      id: 'profile-virtual',
      name: 'Virtual route',
      kind: 'virtual',
      targetRoute: { kind: 'direct' },
    },
  );
  return spec;
}

class Initializer implements ProfileWorkflowInitializer {
  createInitialProfileSpec(): ProfileSpec {
    return resultSpec();
  }
}

class ResultDriver implements ProfileWorkflowActivationDriver {
  readonly activated: Array<{ spec: ProfileSpec; route?: ProfileRouteTarget }> = [];
  activeRoute: ProfileRouteTarget = { kind: 'profile', profileId: 'profile-switch' };

  async activate(candidate: ProfileSpec, route?: ProfileRouteTarget): Promise<{ snapshotId: string }> {
    this.activated.push({
      spec: cloneProfileSpec(candidate),
      ...(route ? { route: structuredClone(route) } : {}),
    });
    return { snapshotId: 'snapshot-popup-result' };
  }

  async rollback(): Promise<void> {}

  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    return { activeRoute: structuredClone(this.activeRoute) };
  }
}

function service(driver: ResultDriver): ProfileWorkflowApplyService {
  return {
    driver,
    createContext: () => ({
      applyId: 'apply-popup-result',
      revisionId: 'revision-popup-result',
      startedAt: '2026-07-27T08:00:00.000Z',
      completedAt: '2026-07-27T08:00:01.000Z',
      deviceId: 'device-popup-result',
    }),
  };
}

const command = {
  channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  action: 'set-popup-profile-result',
  expectedAppliedRevisionId: 'revision-applied',
  profileId: 'profile-switch',
  route: { kind: 'profile', profileId: 'profile-secondary' },
} as const;

describe('Popup result-profile command', () => {
  it('changes a Switch default, applies, and preserves the active route', async () => {
    const repository = new MemoryProfileWorkflowRepository(createProfileWorkflowState(resultSpec()));
    const driver = new ResultDriver();
    const result = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      command,
      service(driver),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    const profile = result.state.applied.profiles.find((candidate) => candidate.id === 'profile-switch');
    if (!profile || profile.kind !== 'switch') throw new Error('missing Switch Profile');
    expect(profile.defaultRoute).toEqual({ kind: 'profile', profileId: 'profile-secondary' });
    expect(result.view.dirty).toBe(false);
    expect(driver.activated[0]?.route).toEqual({ kind: 'profile', profileId: 'profile-switch' });
  });

  it('changes a Virtual target through the same verified transaction', async () => {
    const repository = new MemoryProfileWorkflowRepository(createProfileWorkflowState(resultSpec()));
    const driver = new ResultDriver();
    const result = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        ...command,
        profileId: 'profile-virtual',
        route: { kind: 'profile', profileId: 'profile-primary' },
      },
      service(driver),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    const profile = result.state.applied.profiles.find((candidate) => candidate.id === 'profile-virtual');
    if (!profile || profile.kind !== 'virtual') throw new Error('missing Virtual Profile');
    expect(profile.targetRoute).toEqual({ kind: 'profile', profileId: 'profile-primary' });
  });

  it('does not overwrite unapplied Options work', async () => {
    const initial = createProfileWorkflowState(resultSpec());
    const draft = cloneProfileSpec(initial.draft);
    draft.profiles[0]!.name = 'Unapplied work';
    const repository = new MemoryProfileWorkflowRepository(replaceProfileWorkflowDraft(initial, draft));
    await expect(
      executeProfileWorkflowCommand(repository, new Initializer(), command, service(new ResultDriver())),
    ).resolves.toMatchObject({
      ok: false,
      code: 'invalid',
      message: expect.stringContaining('Apply or discard Options changes'),
      view: { dirty: true },
    });
  });
});
''')

# Popup row model and native result selector.
path = 'apps/extension/src/entrypoints/popup/App.svelte'
replace_once(
    path,
    '''    listPopupConditionResultRoutes,
''',
    '''    listPopupConditionResultRoutes,
    listPopupProfileResultRoutes,
''',
)
replace_once(
    path,
    '''    readonly reason?: string;
  }
''',
    '''    readonly reason?: string;
    readonly profileId?: string;
    readonly resultRoute?: ProfileRouteTarget;
    readonly resultItems?: readonly ResultRouteItem[];
  }
''',
)
replace_once(path, '  let addingCondition = false;\n', '  let addingCondition = false;\n  let settingResult = false;\n')
replace_once(
    path,
    '''  function popupResultItems(
''',
    '''  function configuredResultRoute(profile: UserProfile): ProfileRouteTarget | undefined {
    if (profile.kind === 'switch') return profile.defaultRoute;
    if (profile.kind === 'virtual') return profile.targetRoute;
    return undefined;
  }

  function popupProfileResultItems(
    spec: ProfileSpec,
    profileId: string,
  ): readonly ResultRouteItem[] {
    return listPopupProfileResultRoutes(spec, profileId).map((route) => ({
      key: routeKey(route),
      route,
      name: routeName(spec, route),
    }));
  }

  function popupResultItems(
''',
)
replace_once(
    path,
    '''      return {
        key: routeKey(route),
        route,
        name: profile.name,
        color: profile.color ?? '#90a4ae',
        kind: profile.kind,
        available: profile.enabled !== false,
        ...(profile.enabled === false ? { reason: `${profile.name} is disabled.` } : {}),
      };
''',
    '''      const resultRoute = configuredResultRoute(profile);
      const profileResultItems = resultRoute
        ? popupProfileResultItems(spec, profile.id)
        : undefined;
      return {
        key: routeKey(route),
        route,
        name: profile.name,
        color: profile.color ?? '#90a4ae',
        kind: profile.kind,
        available: profile.enabled !== false,
        profileId: profile.id,
        ...(resultRoute === undefined ? {} : { resultRoute }),
        ...(profileResultItems === undefined ? {} : { resultItems: profileResultItems }),
        ...(profile.enabled === false ? { reason: `${profile.name} is disabled.` } : {}),
      };
''',
)
replace_once(
    path,
    '''  async function activateRoute(item: QuickSwitchItem): Promise<void> {
''',
    '''  async function setProfileResult(item: QuickSwitchItem, event: Event): Promise<void> {
    if (!state || !item.profileId || !item.resultItems || settingResult) return;
    const key = (event.currentTarget as HTMLSelectElement).value;
    const selected = item.resultItems.find((candidate) => candidate.key === key);
    if (!selected || (item.resultRoute && sameRoute(item.resultRoute, selected.route))) return;
    settingResult = true;
    errorMessage = '';
    try {
      const accepted = acceptResponse(
        await sendProfileWorkflowCommand({
          action: 'set-popup-profile-result',
          expectedAppliedRevisionId: state.applied.revision.id,
          profileId: item.profileId,
          route: selected.route,
        }),
      );
      if (accepted) window.close();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      settingResult = false;
    }
  }

  async function activateRoute(item: QuickSwitchItem): Promise<void> {
''',
)
replace_once(
    path,
    '''  aria-busy={loading || switching || addingCondition}
''',
    '''  aria-busy={loading || switching || addingCondition || settingResult}
''',
)
replace_once(
    path,
    '''      {#each items as item, index (item.key)}
        {#if index === 2}<div class="profile-divider" role="separator"></div>{/if}
        <button
          class:active={sameRoute(runtime?.activeRoute, item.route)}
          type="button"
          disabled={switching ||
            addingCondition ||
            !item.available ||
            sameRoute(runtime?.activeRoute, item.route)}
          title={item.reason ??
            (sameRoute(runtime?.activeRoute, item.route)
              ? `${item.name} is active`
              : `Activate ${item.name}`)}
          onclick={() => activateRoute(item)}
        >
          <ProfileIcon kind={item.kind} color={item.color} size={21} />
          <span class="profile-name">{item.name}</span>
          {#if sameRoute(runtime?.activeRoute, item.route)}
            <svg class="current-mark" viewBox="0 0 16 16" aria-label="Current profile">
              <path d="m3.2 8.3 2.8 2.8 6.8-7" />
            </svg>
          {/if}
        </button>
      {/each}
''',
    '''      {#each items as item, index (item.key)}
        {#if index === 2}<div class="profile-divider" role="separator"></div>{/if}
        <div class:has-result={item.resultRoute !== undefined} class="profile-row">
          <button
            class:active={sameRoute(runtime?.activeRoute, item.route)}
            type="button"
            disabled={switching ||
              addingCondition ||
              settingResult ||
              !item.available ||
              sameRoute(runtime?.activeRoute, item.route)}
            title={item.reason ??
              (sameRoute(runtime?.activeRoute, item.route)
                ? `${item.name} is active`
                : `Activate ${item.name}`)}
            onclick={() => activateRoute(item)}
          >
            <ProfileIcon kind={item.kind} color={item.color} size={21} />
            <span class="profile-name">
              {item.name}
              {#if item.resultRoute && state}
                <span class="profile-result-label">[{routeName(state.applied, item.resultRoute)}]</span>
              {/if}
            </span>
            {#if sameRoute(runtime?.activeRoute, item.route)}
              <svg class="current-mark" viewBox="0 0 16 16" aria-label="Current profile">
                <path d="m3.2 8.3 2.8 2.8 6.8-7" />
              </svg>
            {/if}
          </button>
          {#if item.resultRoute && item.resultItems && item.resultItems.length > 0}
            <label class="profile-result-control">
              <span>Result</span>
              <select
                data-popup-result-profile
                aria-label={`Result profile for ${item.name}`}
                value={routeKey(item.resultRoute)}
                disabled={settingResult || switching || addingCondition || !item.available}
                onchange={(event) => void setProfileResult(item, event)}
              >
                {#each item.resultItems as result}
                  <option value={result.key}>{result.name}</option>
                {/each}
              </select>
            </label>
          {/if}
        </div>
      {/each}
''',
)

# Original-like bracket label plus compact selector.
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    '''.profile-list button {
''',
    '''.profile-row {
  border-left: 3px solid transparent;
}

.profile-row:has(> button.active) {
  border-left-color: var(--popup-accent);
  background: var(--popup-active);
}

.profile-list button {
''',
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    '''  border-left: 3px solid transparent;
''',
    '''  border-left: 0;
''',
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    '''.profile-list button.active {
  border-left-color: var(--popup-accent);
  background: var(--popup-active);
}
''',
    '''.profile-list button.active {
  background: transparent;
}
''',
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    '''.current-mark {
''',
    '''.profile-result-label {
  color: var(--popup-muted);
  font-size: 12px;
}

.profile-result-control {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 7px;
  align-items: center;
  margin: -3px 11px 6px 43px;
  color: var(--popup-muted);
  font-size: 11px;
}

.profile-result-control select {
  min-width: 0;
  min-height: 27px;
  padding: 2px 5px;
  border: 1px solid var(--popup-border);
  border-radius: 3px;
  background: var(--popup-bg);
  color: var(--popup-text);
  font: inherit;
}

.profile-result-control select:focus-visible {
  outline: 3px solid var(--popup-focus);
  outline-offset: 1px;
}

.current-mark {
''',
)

# Chromium checks Switch result selection and active-route preservation before current-site rules.
path = 'scripts/e2e-chromium.mjs'
replace_once(
    path,
    '''  const currentSiteUrl = 'https://www.dev.example.co.uk/current-site';
''',
    '''  const resultPopup = await context.newPage();
  await resultPopup.goto(`chrome-extension://${extensionId}/popup.html`);
  const switchResult = resultPopup.getByLabel('Result profile for switch');
  await switchResult.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await switchResult.inputValue(), 'direct');
  await switchResult.selectOption({ label: 'fixed' });
  await assertEventually(async () => {
    const resultStorage = await worker.evaluate(async () => chrome.storage.local.get(null));
    const workflow = resultStorage['zeroomega-nex/profile-workflow/v1/state'];
    const switchProfile = workflow?.applied?.profiles?.find((profile) => profile.name === 'switch');
    const activeRoute = resultStorage['zeroomega-nex/browser-proxy/v1/state']?.activeRoute;
    return (
      switchProfile?.defaultRoute?.kind === 'profile' &&
      workflow?.draft?.revision?.id === workflow?.applied?.revision?.id &&
      activeRoute?.kind === 'profile'
    );
  }, 'Popup result profile was not applied while preserving the active Switch route');
  await resultPopup.close().catch(() => undefined);

  const currentSiteUrl = 'https://www.dev.example.co.uk/current-site';
''',
)

# Permanent guard and parity documents.
path = 'scripts/validate-ui-compatibility.mjs'
replace_once(
    path,
    '''    'Popup must derive the current site with the public suffix list, add typed conditions only to the active Switch Profile, deduplicate by condition, honor top/bottom ordering, and use least-privilege activeTab access.',
  ],
''',
    '''    'Popup must derive the current site with the public suffix list, add typed conditions only to the active Switch Profile, deduplicate by condition, honor top/bottom ordering, and use least-privilege activeTab access.',
  ],
  [
    popupApp.includes('data-popup-result-profile') &&
      popupApp.includes("action: 'set-popup-profile-result'") &&
      popupApp.includes('profile-result-label') &&
      popupCondition.includes('setPopupProfileResultDraft') &&
      popupCondition.includes("profile.kind === 'switch'") &&
      popupCondition.includes("profile.kind === 'virtual'") &&
      popupCondition.includes('listPopupProfileResultRoutes'),
    'Popup must display and change valid Switch/Virtual result routes through the verified background transaction.',
  ],
''',
)

knowledge = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
text = knowledge.read_text()
old = '- 内置与用户情景模式选择。\n- Switch/Virtual 的结果情景模式显示/选择。\n'
new = '- 内置与用户情景模式选择。\n- Switch/Virtual 的结果情景模式显示/选择：原版在 profile 行显示 `[defaultProfileName]` 并提供合法结果下拉。Nex 对 Switch 写 `defaultRoute`、对 Virtual 写 `targetRoute`，排除隐藏、禁用、自身及会形成引用环的结果；通过后台 verified Apply 保存并保持当前活动路由，脏 Options Draft 时拒绝覆盖。\n'
if text.count(old) != 1:
    raise SystemExit(f'knowledge result-profile match: {text.count(old)}')
knowledge.write_text(text.replace(old, new))

matrix = Path('docs/UI_AUDIT_MATRIX.md')
lines = matrix.read_text().splitlines()
for index, line in enumerate(lines):
    if line.startswith('| I-04 |'):
        lines[index] = '| I-04 | 结果情景模式       | popup controller   | Switch/Virtual 结果显示/选择 | MUST_MATCH | DONE     | PARTIAL  | Popup 行显示当前结果；合法结果选择通过后台验证 Apply 写入 Switch defaultRoute/Virtual targetRoute，并保持活动路由；单测与 Chromium E2E 覆盖 | locale 与视觉巡查      |'
    if line.startswith('- **明确 MISSING**：'):
        lines[index] = '- **明确 MISSING**：在线恢复、单 Profile 导出、Popup 临时规则/网络检查；Virtual 已实现但浏览器创建 E2E 仍不完整。'
matrix.write_text('\n'.join(lines) + '\n')

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
old = '- The typed background command accepts only the currently active enabled Switch Profile, rejects unapplied Options Draft work, runs normal verified Apply, and keeps the active Switch route.\n'
new = old + '- Popup rows for Switch and Virtual display their current result route and expose only cycle-safe legal results. Changes use the same dirty-Draft guard and verified Apply transaction while preserving whichever route is currently active.\n'
if text.count(old) != 1:
    raise SystemExit(f'status result-profile insertion: {text.count(old)}')
text = text.replace(old, new)
text = text.replace(
    '- Popup result-profile, temporary-rule, external-ownership, and bounded diagnostic functions,\n',
    '- Popup temporary-rule, external-ownership, and bounded diagnostic functions,\n',
)
text = text.replace(
    'Proceed to the next Popup parity slice: temporary current-site rules or Switch/Virtual result-profile controls, selected by source dependency audit.',
    'Proceed to the Popup temporary current-site rule runtime layer, preserving its non-persistent lifecycle and separation from permanent ProfileSpec conditions.',
)
status.write_text(text)
