from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(source.replace(old, new))


# Public suffix parsing is required to match the original base-domain behavior.
replace_once(
    'apps/extension/package.json',
    '''    "@zeroomega-nex/profile-spec": "workspace:*",
    "@zeroomega-nex/profile-workflow": "workspace:*"
''',
    '''    "@zeroomega-nex/profile-spec": "workspace:*",
    "@zeroomega-nex/profile-workflow": "workspace:*",
    "tldts": "7.4.9"
''',
)

Path('packages/profile-workflow/src/popup-condition.ts').write_text('''import {
  cloneProfileSpecDraft,
  validateProfileSpec,
  type HostRegexCondition,
  type HostWildcardCondition,
  type KeywordCondition,
  type ProfileRouteTarget,
  type ProfileSpec,
  type UrlRegexCondition,
  type UrlWildcardCondition,
  type UserProfile,
} from '@zeroomega-nex/profile-spec';

export type PopupSiteCondition =
  | HostWildcardCondition
  | HostRegexCondition
  | UrlWildcardCondition
  | UrlRegexCondition
  | KeywordCondition;

function sameRoute(left: ProfileRouteTarget, right: ProfileRouteTarget): boolean {
  if (left.kind !== right.kind) return false;
  return left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId);
}

function profileReferences(profile: UserProfile): readonly string[] {
  const routes: ProfileRouteTarget[] = [];
  switch (profile.kind) {
    case 'fixed':
      break;
    case 'switch':
      routes.push(profile.defaultRoute, ...profile.rules.map((rule) => rule.route));
      break;
    case 'rule-list':
      routes.push(profile.matchRoute, profile.defaultRoute);
      break;
    case 'pac':
    case 'auto-detect':
      if (profile.fallbackRoute) routes.push(profile.fallbackRoute);
      break;
    case 'virtual':
      routes.push(profile.targetRoute);
      break;
  }
  return routes.flatMap((route) => (route.kind === 'profile' ? [route.profileId] : []));
}

function reachesProfile(spec: ProfileSpec, fromId: string, targetId: string): boolean {
  const profiles = new Map(spec.profiles.map((profile) => [profile.id, profile]));
  const visited = new Set<string>();
  const pending = [fromId];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    if (current === targetId) return true;
    visited.add(current);
    const profile = profiles.get(current);
    if (profile) pending.push(...profileReferences(profile));
  }
  return false;
}

function attachedProfileIds(spec: ProfileSpec): ReadonlySet<string> {
  return new Set(
    spec.profiles.flatMap((profile) =>
      profile.kind === 'switch' && profile.attachedRuleListProfileId
        ? [profile.attachedRuleListProfileId]
        : [],
    ),
  );
}

export function popupConditionTag(condition: PopupSiteCondition): string {
  return `${condition.kind}\u0000${condition.pattern}`;
}

export function listPopupConditionResultRoutes(
  spec: ProfileSpec,
  switchProfileId: string,
): readonly ProfileRouteTarget[] {
  const hidden = attachedProfileIds(spec);
  const routes: ProfileRouteTarget[] = [{ kind: 'direct' }, { kind: 'system' }];
  for (const profile of spec.profiles) {
    if (
      profile.id === switchProfileId ||
      profile.enabled === false ||
      hidden.has(profile.id) ||
      reachesProfile(spec, profile.id, switchProfileId)
    ) {
      continue;
    }
    routes.push({ kind: 'profile', profileId: profile.id });
  }
  return routes;
}

export interface AddPopupConditionInput {
  readonly switchProfileId: string;
  readonly ruleId: string;
  readonly condition: PopupSiteCondition;
  readonly route: ProfileRouteTarget;
}

export function addPopupConditionDraft(
  applied: ProfileSpec,
  input: AddPopupConditionInput,
): ProfileSpec {
  if (!input.ruleId) throw new TypeError('Popup condition rule ID is required');
  if (!input.condition.pattern) throw new TypeError('Popup condition pattern is required');
  const draft = cloneProfileSpecDraft(applied);
  const profile = draft.profiles.find((candidate) => candidate.id === input.switchProfileId);
  if (!profile || profile.kind !== 'switch') {
    throw new TypeError(`active profile ${input.switchProfileId} is not a Switch Profile`);
  }
  if (profile.rules.some((rule) => rule.id === input.ruleId)) {
    throw new TypeError(`Popup condition rule ID ${input.ruleId} already exists`);
  }
  const validRoutes = listPopupConditionResultRoutes(draft, profile.id);
  if (!validRoutes.some((route) => sameRoute(route, input.route))) {
    throw new TypeError('Popup condition result profile is not valid for the active Switch Profile');
  }

  const tag = popupConditionTag(input.condition);
  const duplicate = profile.rules.findIndex((rule) => {
    switch (rule.condition.kind) {
      case 'host-wildcard':
      case 'host-regex':
      case 'url-wildcard':
      case 'url-regex':
      case 'keyword':
        return popupConditionTag(rule.condition) === tag;
      default:
        return false;
    }
  });
  if (duplicate >= 0) profile.rules.splice(duplicate, 1);

  const rule = {
    id: input.ruleId,
    condition: structuredClone(input.condition),
    route: structuredClone(input.route),
  };
  if (draft.settings.interface.addConditionsToBottom) profile.rules.push(rule);
  else profile.rules.unshift(rule);

  const validation = validateProfileSpec(draft);
  if (!validation.valid) {
    const first = validation.issues.find((issue) => issue.severity === 'error');
    throw new TypeError(first ? `${first.code}: ${first.message}` : 'Popup condition is invalid');
  }
  return draft;
}
''')

Path('packages/profile-workflow/src/popup-condition.test.ts').write_text('''import { describe, expect, it } from 'vitest';

import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

import {
  addPopupConditionDraft,
  listPopupConditionResultRoutes,
} from './popup-condition.js';
import { workflowFixture } from './test-fixture.js';

function switchSpec(addToBottom: boolean): ProfileSpec {
  const spec = workflowFixture();
  spec.settings.interface.addConditionsToBottom = addToBottom;
  spec.profiles.push({
    id: 'profile-switch',
    name: 'Auto Switch',
    kind: 'switch',
    defaultRoute: { kind: 'direct' },
    rules: [
      {
        id: 'rule-existing',
        condition: { kind: 'host-wildcard', pattern: '*.existing.example' },
        route: { kind: 'profile', profileId: 'profile-primary' },
      },
    ],
  });
  return spec;
}

describe('Popup current-site condition mutation', () => {
  it('inserts at the top by default and replaces the first identical condition', () => {
    const spec = switchSpec(false);
    const first = addPopupConditionDraft(spec, {
      switchProfileId: 'profile-switch',
      ruleId: 'rule-popup-one',
      condition: { kind: 'host-wildcard', pattern: '*.example.co.uk' },
      route: { kind: 'profile', profileId: 'profile-primary' },
    });
    const replaced = addPopupConditionDraft(first, {
      switchProfileId: 'profile-switch',
      ruleId: 'rule-popup-two',
      condition: { kind: 'host-wildcard', pattern: '*.example.co.uk' },
      route: { kind: 'profile', profileId: 'profile-secondary' },
    });
    const profile = replaced.profiles.find((candidate) => candidate.id === 'profile-switch');
    if (!profile || profile.kind !== 'switch') throw new Error('missing Switch Profile');
    expect(profile.rules.map((rule) => rule.id)).toEqual(['rule-popup-two', 'rule-existing']);
    expect(profile.rules[0]?.route).toEqual({ kind: 'profile', profileId: 'profile-secondary' });
  });

  it('inserts at the bottom only when addConditionsToBottom is enabled', () => {
    const spec = addPopupConditionDraft(switchSpec(true), {
      switchProfileId: 'profile-switch',
      ruleId: 'rule-popup-bottom',
      condition: { kind: 'url-wildcard', pattern: '*://*.example.co.uk/*' },
      route: { kind: 'direct' },
    });
    const profile = spec.profiles.find((candidate) => candidate.id === 'profile-switch');
    if (!profile || profile.kind !== 'switch') throw new Error('missing Switch Profile');
    expect(profile.rules.map((rule) => rule.id)).toEqual(['rule-existing', 'rule-popup-bottom']);
  });

  it('excludes hidden, disabled, self, and cycle-producing result profiles', () => {
    const spec = switchSpec(false);
    spec.profiles.push(
      {
        id: 'profile-hidden-rules',
        name: '__ruleListOf_Auto Switch',
        kind: 'rule-list',
        sourceId: 'source-hidden',
        matchRoute: { kind: 'direct' },
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'profile-disabled',
        name: 'Disabled',
        kind: 'fixed',
        enabled: false,
        proxyByScheme: {},
        bypass: [],
      },
      {
        id: 'profile-cycle-alias',
        name: 'Cycle alias',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-switch' },
      },
    );
    spec.ruleSources.push({
      id: 'source-hidden',
      name: 'Hidden source',
      format: 'autoproxy',
      location: { kind: 'inline', content: '||example.com' },
    });
    const owner = spec.profiles.find((candidate) => candidate.id === 'profile-switch');
    if (!owner || owner.kind !== 'switch') throw new Error('missing Switch Profile');
    owner.attachedRuleListProfileId = 'profile-hidden-rules';
    const keys = listPopupConditionResultRoutes(spec, owner.id).map((route) =>
      route.kind === 'profile' ? route.profileId : route.kind,
    );
    expect(keys).toEqual(['direct', 'system', 'profile-primary', 'profile-secondary']);
  });
});
''')

replace_once(
    'packages/profile-workflow/src/index.ts',
    "export { MemoryProfileWorkflowRepository } from './memory-repository.js';\n",
    "export { MemoryProfileWorkflowRepository } from './memory-repository.js';\nexport {\n  addPopupConditionDraft,\n  listPopupConditionResultRoutes,\n  popupConditionTag,\n  type AddPopupConditionInput,\n  type PopupSiteCondition,\n} from './popup-condition.js';\n",
)

# Preserve the currently active Switch route throughout the verified Apply transaction.
replace_once(
    'packages/profile-workflow/src/contracts.ts',
    '''  rollback(previousApplied: ProfileSpec): Promise<void>;
''',
    '''  rollback(previousApplied: ProfileSpec, startRoute?: ProfileRouteTarget): Promise<void>;
''',
)
replace_once(
    'packages/profile-workflow/src/contracts.ts',
    '''  readonly deviceId?: string;
}
''',
    '''  readonly deviceId?: string;
  readonly startRoute?: ProfileRouteTarget;
}
''',
)
replace_once(
    'packages/profile-workflow/src/apply.ts',
    '''    await driver.rollback(initial.applied);
''',
    '''    await driver.rollback(initial.applied, context.startRoute);
''',
)
replace_once(
    'packages/profile-workflow/src/apply.ts',
    '''    activation = await driver.activate(candidate);
''',
    '''    activation = await driver.activate(candidate, context.startRoute);
''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    '''  async rollback(previousApplied: ProfileSpec): Promise<void> {
    await this.#activateSpec(previousApplied, previousApplied.settings.startup.route);
  }
''',
    '''  async rollback(previousApplied: ProfileSpec, startRoute?: ProfileRouteTarget): Promise<void> {
    await this.#activateSpec(previousApplied, startRoute ?? previousApplied.settings.startup.route);
  }
''',
)

# Typed Popup command: clean Applied state only, active Switch only, normal verified Apply.
replace_once(
    'packages/profile-workflow/src/commands.ts',
    "import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';\n",
    "import type { Condition, ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';\n",
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    "import { applyProfileWorkflow } from './apply.js';\n",
    "import { applyProfileWorkflow } from './apply.js';\nimport { addPopupConditionDraft, type PopupSiteCondition } from './popup-condition.js';\n",
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'activate-route';
      readonly expectedAppliedRevisionId: string;
      readonly route: ProfileRouteTarget;
    };
''',
    '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'activate-route';
      readonly expectedAppliedRevisionId: string;
      readonly route: ProfileRouteTarget;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'add-current-site-condition';
      readonly expectedAppliedRevisionId: string;
      readonly switchProfileId: string;
      readonly ruleId: string;
      readonly condition: PopupSiteCondition;
      readonly route: ProfileRouteTarget;
    };
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''function validSecretMaterials(value: unknown): value is readonly ProfileWorkflowSecretMaterial[] {
''',
    '''function validPopupCondition(value: unknown): value is PopupSiteCondition {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const condition = value as Record<string, unknown>;
  if (typeof condition.pattern !== 'string' || condition.pattern.length === 0) return false;
  switch (condition.kind) {
    case 'host-wildcard':
    case 'host-regex':
    case 'url-wildcard':
    case 'url-regex':
      return true;
    case 'keyword':
      return condition.httpOnly === true;
    default:
      return false;
  }
}

function validSecretMaterials(value: unknown): value is readonly ProfileWorkflowSecretMaterial[] {
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''    case 'activate-route':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        validRoute(record.route)
      );
''',
    '''    case 'activate-route':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        validRoute(record.route)
      );
    case 'add-current-site-condition':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        typeof record.switchProfileId === 'string' &&
        record.switchProfileId.length > 0 &&
        typeof record.ruleId === 'string' &&
        record.ruleId.length > 0 &&
        validPopupCondition(record.condition) &&
        validRoute(record.route)
      );
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''  if (command.action === 'activate-route') {
''',
    '''  if (command.action === 'add-current-site-condition') {
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
        'Apply or discard Options changes before adding a current-site condition from Popup',
        state,
      );
    }
    const runtime = await runtimeView(applyService);
    const activeRoute = runtime?.activeRoute;
    if (
      activeRoute?.kind !== 'profile' ||
      activeRoute.profileId !== command.switchProfileId
    ) {
      return failure(
        'invalid',
        'current-site conditions can only be added to the active Switch Profile',
        state,
      );
    }
    const activeProfile = state.applied.profiles.find(
      (profile) => profile.id === command.switchProfileId,
    );
    if (!activeProfile || activeProfile.kind !== 'switch' || activeProfile.enabled === false) {
      return failure('invalid', 'the active profile is not an enabled Switch Profile', state);
    }

    let edited: ProfileWorkflowState;
    try {
      const draft = addPopupConditionDraft(state.applied, {
        switchProfileId: command.switchProfileId,
        ruleId: command.ruleId,
        condition: command.condition,
        route: command.route,
      });
      edited = replaceProfileWorkflowDraft(state, draft);
    } catch (error) {
      return failure('invalid', errorMessage(error), state);
    }
    try {
      if (!(await repository.compareAndSwap(state.generation, edited))) {
        const current = await repository.read();
        return failure(
          'conflict',
          'profile workflow changed before the Popup condition could be persisted',
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

  if (command.action === 'activate-route') {
''',
)

# Remove an unused type-only import if TypeScript/ESLint sees it after formatting.
replace_once(
    'packages/profile-workflow/src/commands.ts',
    "import type { Condition, ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';\n",
    "import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';\n",
)

Path('packages/profile-workflow/src/popup-condition-command.test.ts').write_text('''import { cloneProfileSpec, type ProfileRouteTarget, type ProfileSpec } from '@zeroomega-nex/profile-spec';
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

function popupSpec(): ProfileSpec {
  const spec = workflowFixture();
  spec.settings.interface.addConditionsToBottom = false;
  spec.profiles.push({
    id: 'profile-switch',
    name: 'Auto Switch',
    kind: 'switch',
    defaultRoute: { kind: 'direct' },
    rules: [
      {
        id: 'rule-existing',
        condition: { kind: 'host-wildcard', pattern: '*.existing.example' },
        route: { kind: 'profile', profileId: 'profile-primary' },
      },
    ],
  });
  spec.settings.startup.route = { kind: 'profile', profileId: 'profile-switch' };
  return spec;
}

class Initializer implements ProfileWorkflowInitializer {
  createInitialProfileSpec(): ProfileSpec {
    return popupSpec();
  }
}

class PopupDriver implements ProfileWorkflowActivationDriver {
  readonly activated: Array<{ spec: ProfileSpec; route?: ProfileRouteTarget }> = [];
  activeRoute: ProfileRouteTarget = { kind: 'profile', profileId: 'profile-switch' };

  async activate(candidate: ProfileSpec, route?: ProfileRouteTarget): Promise<{ snapshotId: string }> {
    this.activated.push({ spec: cloneProfileSpec(candidate), ...(route ? { route: structuredClone(route) } : {}) });
    return { snapshotId: 'snapshot-popup-condition' };
  }

  async rollback(): Promise<void> {}

  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    return { activeRoute: structuredClone(this.activeRoute) };
  }
}

function service(driver: PopupDriver): ProfileWorkflowApplyService {
  return {
    driver,
    createContext: () => ({
      applyId: 'apply-popup-condition',
      revisionId: 'revision-popup-condition',
      startedAt: '2026-07-27T07:00:00.000Z',
      completedAt: '2026-07-27T07:00:01.000Z',
      deviceId: 'device-popup',
    }),
  };
}

const command = {
  channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  action: 'add-current-site-condition',
  expectedAppliedRevisionId: 'revision-applied',
  switchProfileId: 'profile-switch',
  ruleId: 'rule-popup',
  condition: { kind: 'host-wildcard', pattern: '*.example.co.uk' },
  route: { kind: 'profile', profileId: 'profile-secondary' },
} as const;

describe('Popup current-site command', () => {
  it('adds, verifies, applies, and keeps the active Switch route', async () => {
    const repository = new MemoryProfileWorkflowRepository(createProfileWorkflowState(popupSpec()));
    const driver = new PopupDriver();
    const result = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      command,
      service(driver),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.view.dirty).toBe(false);
    expect(result.state.applied.revision.id).toBe('revision-popup-condition');
    const profile = result.state.applied.profiles.find((candidate) => candidate.id === 'profile-switch');
    if (!profile || profile.kind !== 'switch') throw new Error('missing Switch Profile');
    expect(profile.rules[0]).toMatchObject({
      id: 'rule-popup',
      condition: { kind: 'host-wildcard', pattern: '*.example.co.uk' },
      route: { kind: 'profile', profileId: 'profile-secondary' },
    });
    expect(driver.activated[0]?.route).toEqual({ kind: 'profile', profileId: 'profile-switch' });
  });

  it('rejects Popup persistence while Options has unapplied Draft work', async () => {
    const initial = createProfileWorkflowState(popupSpec());
    const draft = cloneProfileSpec(initial.draft);
    draft.profiles[0]!.name = 'Unapplied Options edit';
    const dirty = replaceProfileWorkflowDraft(initial, draft);
    const repository = new MemoryProfileWorkflowRepository(dirty);
    const result = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      command,
      service(new PopupDriver()),
    );
    expect(result).toMatchObject({
      ok: false,
      code: 'invalid',
      message: expect.stringContaining('Apply or discard Options changes'),
      view: { dirty: true },
    });
  });

  it('rejects direct, Virtual, or stale active-profile claims', async () => {
    const repository = new MemoryProfileWorkflowRepository(createProfileWorkflowState(popupSpec()));
    const driver = new PopupDriver();
    driver.activeRoute = { kind: 'direct' };
    await expect(
      executeProfileWorkflowCommand(repository, new Initializer(), command, service(driver)),
    ).resolves.toMatchObject({
      ok: false,
      code: 'invalid',
      message: expect.stringContaining('active Switch Profile'),
    });
  });
});
''')

# Public-suffix aware current-site inspection and original condition suggestions.
Path('apps/extension/src/lib/current-site.ts').write_text('''import { parse } from 'tldts';
import { browser } from 'wxt/browser';

import type { PopupSiteCondition } from '@zeroomega-nex/profile-workflow';

export type PopupConditionKind = PopupSiteCondition['kind'];

export interface CurrentSiteInfo {
  readonly tabId?: number;
  readonly url: string;
  readonly hostname: string;
  readonly domain: string;
  readonly subdomain: string;
  readonly isIp: boolean;
}

interface CurrentSiteTab {
  readonly id?: number;
  readonly url?: string;
}

interface CurrentSiteBrowserApi {
  readonly tabs: {
    query(queryInfo: { readonly active: boolean; readonly currentWindow: boolean }): Promise<readonly CurrentSiteTab[]>;
    get(tabId: number): Promise<CurrentSiteTab>;
  };
}

const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:', 'ftp:']);

function unbracket(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, hostname.length - 1)
    : hostname;
}

export function inspectCurrentSiteUrl(url: string, tabId?: number): CurrentSiteInfo | undefined {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return undefined;
  }
  if (!SUPPORTED_PROTOCOLS.has(parsedUrl.protocol) || !parsedUrl.hostname) return undefined;
  const hostname = unbracket(parsedUrl.hostname.toLowerCase());
  const parsedDomain = parse(hostname, {
    extractHostname: false,
    allowPrivateDomains: true,
  });
  const isIp = parsedDomain.isIp === true;
  const domain = isIp ? hostname : (parsedDomain.domain ?? hostname);
  const subdomain = isIp || domain === hostname ? '' : (parsedDomain.subdomain ?? '');
  return {
    ...(tabId === undefined ? {} : { tabId }),
    url: parsedUrl.href,
    hostname,
    domain,
    subdomain,
    isIp,
  };
}

export async function inspectActiveCurrentSite(
  explicitTabId?: number,
  api: CurrentSiteBrowserApi = browser as unknown as CurrentSiteBrowserApi,
): Promise<CurrentSiteInfo | undefined> {
  const tab =
    explicitTabId === undefined
      ? (await api.tabs.query({ active: true, currentWindow: true }))[0]
      : await api.tabs.get(explicitTabId);
  return tab?.url ? inspectCurrentSiteUrl(tab.url, tab.id) : undefined;
}

export function currentSiteDomainForLevel(site: CurrentSiteInfo, level: number): string {
  if (site.isIp || !site.subdomain) return site.domain;
  const labels = site.subdomain.split('.').filter(Boolean);
  const normalized = ((level % (labels.length + 1)) + labels.length + 1) % (labels.length + 1);
  return normalized === 0 ? site.domain : [...labels.slice(normalized - 1), site.domain].join('.');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export function suggestCurrentSiteCondition(
  site: CurrentSiteInfo,
  kind: PopupConditionKind,
  subdomainLevel = 0,
): PopupSiteCondition {
  const scopedDomain = currentSiteDomainForLevel(site, subdomainLevel);
  const displayHost = site.isIp && scopedDomain.includes(':') ? `[${scopedDomain}]` : scopedDomain;
  const escaped = escapeRegex(displayHost);
  switch (kind) {
    case 'host-wildcard':
      return { kind, pattern: site.isIp ? displayHost : `*.${scopedDomain}` };
    case 'host-regex':
      return { kind, pattern: site.isIp ? `^${escaped}$` : `(^|\\.)${escapeRegex(scopedDomain)}$` };
    case 'url-wildcard':
      return { kind, pattern: site.isIp ? `*://${displayHost}/*` : `*://*.${scopedDomain}/*` };
    case 'url-regex':
      return {
        kind,
        pattern: site.isIp
          ? `://${escaped}(:\\d+)?/`
          : `://([^/.]+\\.)*${escapeRegex(scopedDomain)}(:\\d+)?/`,
      };
    case 'keyword':
      return { kind, pattern: scopedDomain, httpOnly: true };
  }
}
''')

Path('apps/extension/src/lib/current-site.test.ts').write_text('''import { describe, expect, it } from 'vitest';

import {
  currentSiteDomainForLevel,
  inspectActiveCurrentSite,
  inspectCurrentSiteUrl,
  suggestCurrentSiteCondition,
} from './current-site';

describe('Popup current-site inspection', () => {
  it('uses the public suffix list for base domains and cycles subdomain scope', () => {
    const site = inspectCurrentSiteUrl('https://www.dev.example.co.uk/path');
    expect(site).toMatchObject({
      hostname: 'www.dev.example.co.uk',
      domain: 'example.co.uk',
      subdomain: 'www.dev',
      isIp: false,
    });
    if (!site) throw new Error('missing current site');
    expect(currentSiteDomainForLevel(site, 0)).toBe('example.co.uk');
    expect(currentSiteDomainForLevel(site, 1)).toBe('www.dev.example.co.uk');
    expect(currentSiteDomainForLevel(site, 2)).toBe('dev.example.co.uk');
    expect(currentSiteDomainForLevel(site, 3)).toBe('example.co.uk');
    expect(suggestCurrentSiteCondition(site, 'host-wildcard')).toEqual({
      kind: 'host-wildcard',
      pattern: '*.example.co.uk',
    });
    expect(suggestCurrentSiteCondition(site, 'url-regex')).toEqual({
      kind: 'url-regex',
      pattern: '://([^/.]+\\.)*example\\.co\\.uk(:\\d+)?/',
    });
  });

  it('uses exact host suggestions for IPv4 and bracketed IPv6', () => {
    const ipv4 = inspectCurrentSiteUrl('http://127.0.0.1:8080/');
    const ipv6 = inspectCurrentSiteUrl('http://[2001:db8::1]/');
    if (!ipv4 || !ipv6) throw new Error('missing IP site');
    expect(suggestCurrentSiteCondition(ipv4, 'host-wildcard')).toEqual({
      kind: 'host-wildcard',
      pattern: '127.0.0.1',
    });
    expect(suggestCurrentSiteCondition(ipv6, 'url-wildcard')).toEqual({
      kind: 'url-wildcard',
      pattern: '*://[2001:db8::1]/*',
    });
  });

  it('rejects extension/internal URLs and supports an explicit active tab ID', async () => {
    expect(inspectCurrentSiteUrl('chrome://settings/')).toBeUndefined();
    expect(inspectCurrentSiteUrl('about:blank')).toBeUndefined();
    await expect(
      inspectActiveCurrentSite(42, {
        tabs: {
          query: async () => [],
          get: async (tabId) => ({ id: tabId, url: 'https://sub.example.com/' }),
        },
      }),
    ).resolves.toMatchObject({ tabId: 42, domain: 'example.com', subdomain: 'sub' });
  });
});
''')

# Replace Popup with the original-style current-site action and form.
Path('apps/extension/src/entrypoints/popup/App.svelte').write_text('''<script lang="ts">
  import { productIdentity } from '@zeroomega-nex/core-contracts';
  import type { ProfileRouteTarget, ProfileSpec, SwitchProfile, UserProfile } from '@zeroomega-nex/profile-spec';
  import {
    listPopupConditionResultRoutes,
    type PopupSiteCondition,
    type ProfileWorkflowCommandResponse,
    type ProfileWorkflowRuntimeView,
    type ProfileWorkflowState,
  } from '@zeroomega-nex/profile-workflow';
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';

  import ProfileIcon from '../../components/ProfileIcon.svelte';
  import {
    currentSiteDomainForLevel,
    inspectActiveCurrentSite,
    suggestCurrentSiteCondition,
    type CurrentSiteInfo,
    type PopupConditionKind,
  } from '../../lib/current-site';
  import { translate } from '../../lib/i18n';
  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
  import { applyThemeMode, readThemeMode } from '../../lib/ui-theme';

  interface QuickSwitchItem {
    readonly key: string;
    readonly route: ProfileRouteTarget;
    readonly name: string;
    readonly color: string;
    readonly kind: UserProfile['kind'] | 'direct' | 'system' | 'external';
    readonly available: boolean;
    readonly reason?: string;
  }

  interface ResultRouteItem {
    readonly key: string;
    readonly route: ProfileRouteTarget;
    readonly name: string;
  }

  const conditionKinds: readonly { value: PopupConditionKind; label: string }[] = [
    { value: 'host-wildcard', label: 'Host wildcard' },
    { value: 'host-regex', label: 'Host regular expression' },
    { value: 'url-wildcard', label: 'URL wildcard' },
    { value: 'url-regex', label: 'URL regular expression' },
    { value: 'keyword', label: 'URL keyword' },
  ];

  let state: ProfileWorkflowState | undefined;
  let runtime: ProfileWorkflowRuntimeView | undefined;
  let currentSite: CurrentSiteInfo | undefined;
  let loading = true;
  let switching = false;
  let addingCondition = false;
  let openingSettings = false;
  let conditionFormOpen = false;
  let conditionKind: PopupConditionKind = 'host-wildcard';
  let conditionPattern = '';
  let conditionRouteKey = '';
  let subdomainLevel = 0;
  let errorMessage = '';

  let items: readonly QuickSwitchItem[] = [];
  let activeSwitch: SwitchProfile | undefined;
  let resultItems: readonly ResultRouteItem[] = [];
  $: items = state ? quickSwitchItems(state.applied) : [];
  $: activeSwitch = activeSwitchProfile(state?.applied, runtime?.activeRoute);
  $: resultItems = state && activeSwitch ? popupResultItems(state.applied, activeSwitch.id) : [];

  function sameRoute(left: ProfileRouteTarget | undefined, right: ProfileRouteTarget): boolean {
    if (left?.kind !== right.kind) return false;
    return left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId);
  }

  function routeKey(route: ProfileRouteTarget): string {
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  function routeName(spec: ProfileSpec, route: ProfileRouteTarget): string {
    if (route.kind === 'direct') return translate('Direct');
    if (route.kind === 'system') return translate('System Proxy');
    return spec.profiles.find((profile) => profile.id === route.profileId)?.name ?? translate('Missing profile');
  }

  function activeSwitchProfile(
    spec: ProfileSpec | undefined,
    route: ProfileRouteTarget | undefined,
  ): SwitchProfile | undefined {
    if (!spec || route?.kind !== 'profile') return undefined;
    const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
    return profile?.kind === 'switch' && profile.enabled !== false ? profile : undefined;
  }

  function popupResultItems(spec: ProfileSpec, switchProfileId: string): readonly ResultRouteItem[] {
    return listPopupConditionResultRoutes(spec, switchProfileId).map((route) => ({
      key: routeKey(route),
      route,
      name: routeName(spec, route),
    }));
  }

  function normalizedRoutes(spec: ProfileSpec): readonly ProfileRouteTarget[] {
    const routes = spec.settings.quickSwitch.routes.map((route) => structuredClone(route));
    const hasDirect = routes.some((route) => route.kind === 'direct');
    const hasSystem = routes.some((route) => route.kind === 'system');
    if (!hasDirect) routes.unshift({ kind: 'direct' });
    if (!hasSystem) {
      const directIndex = routes.findIndex((route) => route.kind === 'direct');
      routes.splice(directIndex + 1, 0, { kind: 'system' });
    }
    return routes;
  }

  function quickSwitchItems(spec: ProfileSpec): readonly QuickSwitchItem[] {
    return normalizedRoutes(spec).map((route) => {
      if (route.kind === 'direct') {
        return {
          key: routeKey(route),
          route,
          name: translate('Direct'),
          color: spec.settings.interface.builtInProfiles?.direct?.color ?? '#bdbdbd',
          kind: 'direct',
          available: true,
        };
      }
      if (route.kind === 'system') {
        return {
          key: routeKey(route),
          route,
          name: translate('System Proxy'),
          color: spec.settings.interface.builtInProfiles?.system?.color ?? '#616161',
          kind: 'system',
          available: true,
        };
      }
      const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
      if (!profile) {
        return {
          key: routeKey(route),
          route,
          name: translate('Missing profile'),
          color: '#9e9e9e',
          kind: 'external',
          available: false,
          reason: `Profile ${route.profileId} is missing from the applied configuration.`,
        };
      }
      return {
        key: routeKey(route),
        route,
        name: profile.name,
        color: profile.color ?? '#90a4ae',
        kind: profile.kind,
        available: profile.enabled !== false,
        ...(profile.enabled === false ? { reason: `${profile.name} is disabled.` } : {}),
      };
    });
  }

  function acceptResponse(response: ProfileWorkflowCommandResponse): boolean {
    if (response.ok) {
      state = response.state;
      if (response.runtime !== undefined) runtime = response.runtime;
      errorMessage = '';
      return true;
    }
    if (response.state !== undefined) state = response.state;
    errorMessage = response.message;
    return false;
  }

  async function loadWorkflow(): Promise<void> {
    acceptResponse(await sendProfileWorkflowCommand({ action: 'get' }));
  }

  async function loadCurrentSite(): Promise<void> {
    const requested = new URLSearchParams(window.location.search).get('activeTabId');
    const explicitTabId = requested && /^\d+$/u.test(requested) ? Number(requested) : undefined;
    currentSite = await inspectActiveCurrentSite(explicitTabId);
  }

  async function loadPopup(): Promise<void> {
    loading = true;
    try {
      await Promise.all([loadWorkflow(), loadCurrentSite()]);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      loading = false;
    }
  }

  async function activateRoute(item: QuickSwitchItem): Promise<void> {
    if (!state || switching || !item.available || sameRoute(runtime?.activeRoute, item.route)) return;
    switching = true;
    errorMessage = '';
    try {
      acceptResponse(
        await sendProfileWorkflowCommand({
          action: 'activate-route',
          expectedAppliedRevisionId: state.applied.revision.id,
          route: item.route,
        }),
      );
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      switching = false;
    }
  }

  function suggestedCondition(): PopupSiteCondition | undefined {
    return currentSite ? suggestCurrentSiteCondition(currentSite, conditionKind, subdomainLevel) : undefined;
  }

  function refreshConditionPattern(): void {
    conditionPattern = suggestedCondition()?.pattern ?? '';
  }

  function openConditionForm(): void {
    if (!state || !currentSite || !activeSwitch || resultItems.length === 0) return;
    conditionKind = 'host-wildcard';
    subdomainLevel = 0;
    refreshConditionPattern();
    const defaultKey = routeKey(activeSwitch.defaultRoute);
    conditionRouteKey = resultItems.some((item) => item.key === defaultKey)
      ? defaultKey
      : (resultItems[0]?.key ?? '');
    conditionFormOpen = true;
    errorMessage = '';
  }

  function changeConditionKind(event: Event): void {
    conditionKind = (event.currentTarget as HTMLSelectElement).value as PopupConditionKind;
    refreshConditionPattern();
  }

  function cycleSubdomainScope(): void {
    if (!currentSite?.subdomain) return;
    subdomainLevel = (subdomainLevel + 1) % (currentSite.subdomain.split('.').length + 1);
    refreshConditionPattern();
  }

  async function addCurrentSiteCondition(): Promise<void> {
    if (!state || !activeSwitch || !conditionPattern || addingCondition) return;
    const resultItem = resultItems.find((item) => item.key === conditionRouteKey);
    if (!resultItem) return;
    const suggested = suggestedCondition();
    if (!suggested) return;
    const condition = { ...suggested, pattern: conditionPattern } as PopupSiteCondition;
    addingCondition = true;
    errorMessage = '';
    try {
      const accepted = acceptResponse(
        await sendProfileWorkflowCommand({
          action: 'add-current-site-condition',
          expectedAppliedRevisionId: state.applied.revision.id,
          switchProfileId: activeSwitch.id,
          ruleId: `popup-rule-${crypto.randomUUID()}`,
          condition,
          route: resultItem.route,
        }),
      );
      if (accepted) window.close();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      addingCondition = false;
    }
  }

  async function openOptions(): Promise<void> {
    if (openingSettings) return;
    openingSettings = true;
    errorMessage = '';
    try {
      await browser.runtime.openOptionsPage();
      window.close();
    } catch (error) {
      console.error('Unable to open the ZeroOmega Nex options page.', error);
      errorMessage = 'Unable to open Options.';
      openingSettings = false;
    }
  }

  onMount(() => {
    applyThemeMode(readThemeMode());
    void loadPopup();
  });
</script>

<main class="popup-shell" aria-label="ZeroOmega Nex profile switcher" aria-busy={loading || switching || addingCondition}>
  <section aria-label="Profiles" class="profile-list">
    {#if loading}
      <p class="settings-error" role="status">Loading applied profiles…</p>
    {:else if !state?.applied.settings.quickSwitch.enabled}
      <p class="settings-error" role="status">Quick switching is disabled in Options.</p>
    {:else if items.length === 0}
      <p class="settings-error" role="status">No quick-switch routes are configured.</p>
    {:else}
      {#each items as item, index (item.key)}
        {#if index === 2}<div class="profile-divider" role="separator"></div>{/if}
        <button
          class:active={sameRoute(runtime?.activeRoute, item.route)}
          type="button"
          disabled={switching || addingCondition || !item.available || sameRoute(runtime?.activeRoute, item.route)}
          title={item.reason ?? (sameRoute(runtime?.activeRoute, item.route) ? `${item.name} is active` : `Activate ${item.name}`)}
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
    {/if}
  </section>

  {#if !loading && currentSite && activeSwitch && resultItems.length > 0}
    {#if conditionFormOpen}
      <form class="condition-form" data-popup-condition-form onsubmit={(event) => { event.preventDefault(); void addCurrentSiteCondition(); }}>
        <h2>Add condition to {activeSwitch.name}</h2>
        <p class="condition-domain">Current site: {currentSite.hostname}</p>
        {#if currentSite.subdomain}
          <button class="scope-button" type="button" onclick={cycleSubdomainScope}>
            Scope: {currentSiteDomainForLevel(currentSite, subdomainLevel)}
          </button>
        {/if}
        <label>
          Condition type
          <select aria-label="Current site condition type" value={conditionKind} onchange={changeConditionKind}>
            {#each conditionKinds as kind}
              <option value={kind.value}>{kind.label}</option>
            {/each}
          </select>
        </label>
        <label>
          Pattern
          <input aria-label="Current site condition pattern" bind:value={conditionPattern} />
        </label>
        <label>
          Result profile
          <select aria-label="Current site result profile" bind:value={conditionRouteKey}>
            {#each resultItems as item}
              <option value={item.key}>{item.name}</option>
            {/each}
          </select>
        </label>
        <div class="condition-actions">
          <button type="button" onclick={() => (conditionFormOpen = false)} disabled={addingCondition}>Cancel</button>
          <button type="submit" disabled={addingCondition || !conditionPattern || !conditionRouteKey}>
            {addingCondition ? 'Adding…' : 'Add condition'}
          </button>
        </div>
      </form>
    {:else}
      <section class="current-site-action" aria-label="Current site actions">
        <button type="button" data-popup-add-current-site onclick={openConditionForm}>
          Add condition for {currentSite.domain}
        </button>
      </section>
    {/if}
  {/if}

  <footer class="popup-footer">
    <button class="settings-button" type="button" onclick={openOptions} disabled={openingSettings} aria-label="Open ZeroOmega Nex options">
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M8.8 2.2h2.4l.5 1.8c.5.2 1 .5 1.4.8l1.8-.5 1.2 2.1-1.3 1.3c.1.5.1 1.1 0 1.6l1.3 1.3-1.2 2.1-1.8-.5c-.4.4-.9.6-1.4.8l-.5 1.8H8.8L8.3 13a5 5 0 0 1-1.4-.8l-1.8.5-1.2-2.1 1.3-1.3a6 6 0 0 1 0-1.6L3.9 6.4l1.2-2.1 1.8.5c.4-.3.9-.6 1.4-.8l.5-1.8Z" />
        <circle cx="10" cy="8.5" r="2.2" />
      </svg>
      <span>{openingSettings ? 'Opening…' : 'Options'}</span>
    </button>
    <span class="product-name">{switching ? 'Switching…' : productIdentity.name}</span>
  </footer>

  {#if errorMessage}<p class="settings-error" role="alert">{errorMessage}</p>{/if}
</main>
''')

# Popup form styling.
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    '''.popup-footer {
''',
    '''.current-site-action {
  padding: 7px 10px;
  border-top: 1px solid var(--popup-border);
}

.current-site-action button,
.scope-button,
.condition-actions button {
  min-height: 30px;
  border: 1px solid var(--popup-border);
  border-radius: 3px;
  background: var(--popup-footer);
  color: var(--popup-text);
  cursor: pointer;
}

.current-site-action button {
  width: 100%;
}

.condition-form {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid var(--popup-border);
}

.condition-form h2,
.condition-domain {
  margin: 0;
}

.condition-form h2 {
  font-size: 14px;
}

.condition-domain {
  overflow: hidden;
  color: var(--popup-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.condition-form label {
  display: grid;
  gap: 3px;
  color: var(--popup-muted);
  font-size: 11px;
}

.condition-form input,
.condition-form select {
  width: 100%;
  min-height: 30px;
  padding: 4px 6px;
  border: 1px solid var(--popup-border);
  border-radius: 3px;
  background: var(--popup-bg);
  color: var(--popup-text);
  font: inherit;
}

.scope-button {
  padding: 4px 7px;
  text-align: left;
}

.condition-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
}

.condition-actions button {
  padding: 4px 10px;
}

.current-site-action button:hover,
.scope-button:hover,
.condition-actions button:hover:not(:disabled) {
  background: var(--popup-hover);
}

.current-site-action button:focus-visible,
.scope-button:focus-visible,
.condition-form input:focus-visible,
.condition-form select:focus-visible,
.condition-actions button:focus-visible {
  outline: 3px solid var(--popup-focus);
  outline-offset: 1px;
}

.popup-footer {
''',
)

# activeTab is the least-privilege way for an action popup to read the invoking tab URL.
replace_once(
    'apps/extension/wxt.config.ts',
    "    permissions: ['proxy', 'storage', 'alarms'],\n",
    "    permissions: ['proxy', 'storage', 'alarms', 'activeTab'],\n",
)
replace_once(
    'scripts/inspect-manifests.mjs',
    "assertExactSet(permissions, ['proxy', 'storage', 'alarms'], 'required permissions', file);",
    "assertExactSet(permissions, ['proxy', 'storage', 'alarms', 'activeTab'], 'required permissions', file);",
)
replace_once(
    'scripts/inspect-manifests.mjs',
    'proxy/storage/alarms required, auth optional, no global host access.',
    'proxy/storage/alarms/activeTab required, auth optional, no global host access.',
)

# Chromium source-backed interaction: active Switch, public-suffix suggestion, top insertion, Apply.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  await options.getByRole('button', { name: 'switch', exact: true }).click();
''',
    '''  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  const currentSiteUrl = 'https://www.dev.example.co.uk/current-site';
  await context.route(currentSiteUrl, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Current site</title>' }),
  );
  const currentSitePage = await context.newPage();
  await currentSitePage.goto(currentSiteUrl);
  const currentSiteTabId = await worker.evaluate(async (targetUrl) => {
    const tabs = await chrome.tabs.query({});
    return tabs.find((tab) => tab.url === targetUrl)?.id;
  }, currentSiteUrl);
  assert.equal(typeof currentSiteTabId, 'number', 'Current-site tab ID was not resolved');
  const conditionPopup = await context.newPage();
  await conditionPopup.goto(
    `chrome-extension://${extensionId}/popup.html?activeTabId=${currentSiteTabId}`,
  );
  const addCurrentSite = conditionPopup.locator('[data-popup-add-current-site]');
  await addCurrentSite.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await addCurrentSite.innerText(), /example\.co\.uk/u);
  await addCurrentSite.click();
  const conditionForm = conditionPopup.locator('[data-popup-condition-form]');
  await conditionForm.waitFor();
  assert.equal(
    await conditionForm.getByLabel('Current site condition pattern').inputValue(),
    '*.example.co.uk',
  );
  await conditionForm.getByLabel('Current site result profile').selectOption({ label: 'fixed' });
  await conditionForm.getByRole('button', { name: 'Add condition', exact: true }).click();
  await assertEventually(async () => {
    const popupStorage = await worker.evaluate(async () => chrome.storage.local.get(null));
    const workflow = popupStorage['zeroomega-nex/profile-workflow/v1/state'];
    const switchProfile = workflow?.applied?.profiles?.find((profile) => profile.name === 'switch');
    return (
      switchProfile?.rules?.[0]?.condition?.kind === 'host-wildcard' &&
      switchProfile.rules[0].condition.pattern === '*.example.co.uk'
    );
  }, 'Popup current-site condition was not applied at the top of the active Switch Profile');
  const popupRuntime = await worker.evaluate(async () => chrome.storage.local.get(null));
  const popupWorkflow = popupRuntime['zeroomega-nex/profile-workflow/v1/state'];
  assert.equal(popupWorkflow.applied.revision.id, popupWorkflow.draft.revision.id);
  await conditionPopup.close().catch(() => undefined);
  await currentSitePage.close();
  await options.bringToFront();

  await options.getByRole('button', { name: 'switch', exact: true }).click();
''',
)

# Permanent guards for all source-backed Popup boundaries.
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    "const popupStylePath = 'apps/extension/src/entrypoints/popup/style.css';\n",
    "const popupStylePath = 'apps/extension/src/entrypoints/popup/style.css';\nconst currentSitePath = 'apps/extension/src/lib/current-site.ts';\n",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    "const switchOperationsPath = 'packages/profile-workflow/src/switch-operations.ts';\n",
    "const switchOperationsPath = 'packages/profile-workflow/src/switch-operations.ts';\nconst popupConditionPath = 'packages/profile-workflow/src/popup-condition.ts';\n",
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''  popupStyle,
  optionsApp,
''',
    '''  popupStyle,
  currentSite,
  optionsApp,
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''  switchOperations,
  switchSource,
''',
    '''  switchOperations,
  popupCondition,
  switchSource,
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''  readFile(popupStylePath, 'utf8'),
  readFile(optionsAppPath, 'utf8'),
''',
    '''  readFile(popupStylePath, 'utf8'),
  readFile(currentSitePath, 'utf8'),
  readFile(optionsAppPath, 'utf8'),
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''  readFile(switchOperationsPath, 'utf8'),
  readFile(switchSourcePath, 'utf8'),
''',
    '''  readFile(switchOperationsPath, 'utf8'),
  readFile(popupConditionPath, 'utf8'),
  readFile(switchSourcePath, 'utf8'),
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''  [
    popupApp.includes('class="popup-footer"'),
    'Popup must retain the familiar bottom options action area.',
  ],
''',
    '''  [
    popupApp.includes('class="popup-footer"'),
    'Popup must retain the familiar bottom options action area.',
  ],
  [
    popupApp.includes('data-popup-add-current-site') &&
      popupApp.includes('data-popup-condition-form') &&
      popupApp.includes("action: 'add-current-site-condition'") &&
      popupApp.includes('listPopupConditionResultRoutes') &&
      currentSite.includes("from 'tldts'") &&
      currentSite.includes('allowPrivateDomains: true') &&
      currentSite.includes("pattern: `*.${scopedDomain}`") &&
      popupCondition.includes('addConditionsToBottom') &&
      popupCondition.includes('profile.rules.unshift(rule)') &&
      popupCondition.includes('profile.rules.push(rule)') &&
      popupCondition.includes('popupConditionTag') &&
      manifest.includes("'activeTab'") &&
      runtime.includes('BrowserProfileWorkflowActivationDriver'),
    'Popup must derive the current site with the public suffix list, add typed conditions only to the active Switch Profile, deduplicate by condition, honor top/bottom ordering, and use least-privilege activeTab access.',
  ],
''',
)

# Source-backed documents.
knowledge = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
text = knowledge.read_text()
old = '''功能节点：

- 内置与用户情景模式选择。
- Switch/Virtual 的结果情景模式显示/选择。
- 为当前网站添加条件。
- 当前网站临时规则。
'''
new = '''功能节点：

- 内置与用户情景模式选择。
- Switch/Virtual 的结果情景模式显示/选择。
- 为当前网站添加条件：使用 activeTab 读取调用 Popup 的 tab；公共后缀列表计算 base domain/subdomain；默认 Host wildcard，可切 Host/URL wildcard/regex 与 URL keyword；添加前删除首个同 condition tag 规则，再由 `addConditionsToBottom` 决定 unshift/push。仅当前实际生效的 Switch Profile 可写入，Virtual 不可直接写入。
- Nex 的 Popup 永久条件通过后台 typed command 进入正常验证 Apply，并保持当前 Switch 路由；若 Options 存在未应用 Draft，则拒绝写入，避免覆盖独立用户工作。这是新状态模型下的安全边界，不把 Draft 静默并入 Applied。
- 当前网站临时规则是独立内存覆盖，不与永久条件混合，本切片仍未实现。
'''
if text.count(old) != 1:
    raise SystemExit(f'knowledge Popup node match count: {text.count(old)}')
knowledge.write_text(text.replace(old, new))

matrix = Path('docs/UI_AUDIT_MATRIX.md')
lines = matrix.read_text().splitlines()
for index, line in enumerate(lines):
    if line.startswith('| D-10 |'):
        lines[index] = '| D-10 | 添加条件位置     | `switch_profile.coffee`、`options.coffee`      | 编辑器固定追加；Popup 插入位置由设置决定   | MUST_MATCH | DONE     | PARTIAL | Options 仍固定追加；Popup 当前站点规则按 `addConditionsToBottom` 顶部/底部插入并先去重，单测与 Chromium E2E 覆盖 | locale 与视觉巡查      |'
    if line.startswith('| I-05 |'):
        lines[index] = '| I-05 | 当前网站添加条件   | popup              | 对当前 tab 快速加规则        | MUST_MATCH | DONE     | PARTIAL | activeTab + PSL 域名建议、五类条件、合法结果、后台验证 Apply、脏 Draft 保护及 Chromium E2E 已实现 | locale 与多级子域巡查  |'
matrix.write_text('\n'.join(lines) + '\n')

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
text = text.replace(
    '- Popup/current-site condition injection and `addConditionsToBottom` ordering,\n',
    '',
)
text = text.replace(
    'Proceed to the source-backed Popup/current-site condition-injection slice and implement `addConditionsToBottom` ordering, unless a repository audit identifies a stricter dependency.',
    'Proceed to the next Popup parity slice: temporary current-site rules or Switch/Virtual result-profile controls, selected by source dependency audit.',
)
insert_after = '- Chromium E2E covers local HTTP manual download with a custom header, forced alarm refresh to a second payload, state synchronization, continued editing, and successful detach afterward.\n'
addition = insert_after + '- Popup current-site persistence now uses activeTab plus a public-suffix parser, original condition suggestions, valid result-route filtering, duplicate replacement, top/bottom insertion, and a verified Apply that keeps the active Switch route. Dirty Options Draft state blocks the command rather than being overwritten.\n'
if text.count(insert_after) != 1:
    raise SystemExit(f'status Popup insertion point count: {text.count(insert_after)}')
status.write_text(text.replace(insert_after, addition))
