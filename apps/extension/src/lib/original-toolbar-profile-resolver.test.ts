import {
  createDefaultProfileSpec,
  createProfileWorkflowState,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import {
  OriginalToolbarProfileResolver,
  type OriginalToolbarProfileStateRepository,
  type OriginalToolbarRuntimeInspector,
} from './original-toolbar-profile-resolver';

class MemoryRepository implements OriginalToolbarProfileStateRepository {
  constructor(readonly state: ProfileWorkflowState | undefined) {}
  async read(): Promise<ProfileWorkflowState | undefined> {
    return this.state;
  }
}

class FixedRuntime implements OriginalToolbarRuntimeInspector {
  constructor(readonly view: ProfileWorkflowRuntimeView) {}
  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    return this.view;
  }
}

class ToolbarI18n implements OriginalToolbarI18nApi {
  getMessage(messageName: string): string {
    const messages: Readonly<Record<string, string>> = {
      routeDirect: 'Direct',
      routeSystem: 'System Proxy',
      browserAction_defaultRuleDetails: '(default)',
      browserAction_directResult: '(not using any proxy)',
      browserAction_titleExternalProxy: '(controlled by other extensions or environment)',
    };
    return messages[messageName] ?? '';
  }
}

function state(showBadge = false): ProfileWorkflowState {
  const spec = createDefaultProfileSpec({
    documentId: 'document-1',
    revisionId: 'revision-1',
    createdAt: '2026-07-31T00:00:00.000Z',
  });
  spec.settings.interface.showResultProfileOnActionBadgeText = showBadge;
  return createProfileWorkflowState(spec);
}

function resolver(
  workflowState: ProfileWorkflowState | undefined,
  runtime: ProfileWorkflowRuntimeView,
): OriginalToolbarProfileResolver {
  return new OriginalToolbarProfileResolver({
    repository: new MemoryRepository(workflowState),
    runtime: new FixedRuntime(runtime),
    i18n: new ToolbarI18n(),
  });
}

describe('original toolbar profile resolver', () => {
  it('derives Direct title, badge, and icon state', async () => {
    const result = await resolver(state(true), { activeRoute: { kind: 'direct' } }).resolve({
      tabId: 3,
      url: 'https://example.test/',
    });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#aaaaaa',
      },
      titleArguments: {
        currentProfileName: '[Direct]',
        resultProfileName: '[Direct]',
        details: '(not using any proxy)',
      },
      badgeText: 'Dire',
    });
  });

  it('derives System title and custom icon color', async () => {
    const workflowState = state();
    workflowState.applied.settings.interface.builtInProfiles = {
      ...workflowState.applied.settings.interface.builtInProfiles,
      system: { color: '#123456' },
    };
    const result = await resolver(workflowState, { activeRoute: { kind: 'system' } }).resolve({
      tabId: 5,
      url: 'about:support',
    });

    expect(result).toEqual({
      icon: { mode: 'single-color', outerCircleColor: '#123456' },
      titleArguments: {
        currentProfileName: '[System Proxy]',
        resultProfileName: '[System Proxy]',
        details: '(controlled by other extensions or environment)',
      },
    });
  });

  it('derives a one-color static Fixed proxy result', async () => {
    const result = await resolver(state(true), {
      activeRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    }).resolve({ tabId: 7, url: 'https://example.test/' });

    expect(result).toEqual({
      icon: { mode: 'single-color', outerCircleColor: '#64b5f6' },
      titleArguments: {
        currentProfileName: 'Proxy',
        resultProfileName: 'Proxy',
        details: 'PROXY 127.0.0.1:7890\n',
      },
      badgeText: 'Prox',
    });
  });

  it('reproduces a Fixed bypass condition-to-Direct result', async () => {
    const result = await resolver(state(true), {
      activeRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    }).resolve({ tabId: 9, url: 'http://localhost/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#64b5f6',
      },
      titleArguments: {
        currentProfileName: 'Proxy',
        resultProfileName: 'Proxy',
        details: 'localhost => (not using any proxy)\n',
      },
      badgeText: 'Prox',
    });
  });

  it('reproduces a scheme-specific Fixed PAC result', async () => {
    const workflowState = state();
    const profile = workflowState.applied.profiles[0];
    if (!profile || profile.kind !== 'fixed') throw new Error('missing default Fixed profile');
    const fallback = profile.proxyByScheme.fallback;
    if (fallback === undefined) throw new Error('missing default Fixed fallback');
    profile.proxyByScheme.http = fallback;

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: profile.id },
    }).resolve({ tabId: 10, url: 'http://example.test/' });

    expect(result?.titleArguments.details).toBe('http => PROXY 127.0.0.1:7890\n');
  });

  it('reproduces an exact Switch matched-rule trace into a Fixed result', async () => {
    const workflowState = state(true);
    const fixed = workflowState.applied.profiles[0];
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
    fixed.bypass = [];
    workflowState.applied.profiles.push({
      id: 'profile-switch',
      name: 'Automatic',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-toolbar',
          condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
          route: { kind: 'profile', profileId: fixed.id },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: fixed.id },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-switch' },
    }).resolve({ tabId: 19, url: 'http://toolbar-a.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Automatic',
        resultProfileName: 'Proxy',
        details: 'toolbar-a.test => Proxy\nPROXY 127.0.0.1:7890\n',
      },
      badgeText: 'Prox',
    });
  });

  it('reproduces an exact Switch default trace into a Fixed result', async () => {
    const workflowState = state();
    const fixed = workflowState.applied.profiles[0];
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
    fixed.bypass = [];
    workflowState.applied.profiles.push({
      id: 'profile-switch',
      name: 'Automatic',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-toolbar',
          condition: { kind: 'host-wildcard', pattern: 'toolbar-a.test' },
          route: { kind: 'profile', profileId: fixed.id },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: fixed.id },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-switch' },
    }).resolve({ tabId: 21, url: 'http://other.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Automatic',
        resultProfileName: 'Proxy',
        details: '(default) => Proxy\nPROXY 127.0.0.1:7890\n',
      },
    });
  });

  it('reproduces an exact Switch matched-rule trace into Direct', async () => {
    const workflowState = state(true);
    workflowState.applied.profiles.push({
      id: 'profile-switch-direct',
      name: 'Automatic',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-direct',
          condition: { kind: 'host-wildcard', pattern: 'direct-match.test' },
          route: { kind: 'direct' },
        },
      ],
      defaultRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-switch-direct' },
    }).resolve({ tabId: 22, url: 'http://direct-match.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Automatic',
        resultProfileName: '[Direct]',
        details: 'direct-match.test => [Direct]\n',
      },
      badgeText: 'Dire',
    });
  });

  it('reproduces an exact Switch default trace into Direct', async () => {
    const workflowState = state();
    workflowState.applied.profiles.push({
      id: 'profile-switch-direct',
      name: 'Automatic',
      color: '#ffb74d',
      kind: 'switch',
      rules: [
        {
          id: 'rule-fixed',
          condition: { kind: 'host-wildcard', pattern: 'fixed-match.test' },
          route: { kind: 'profile', profileId: 'profile-default-proxy' },
        },
      ],
      defaultRoute: { kind: 'direct' },
    });

    const result = await resolver(workflowState, {
      activeRoute: { kind: 'profile', profileId: 'profile-switch-direct' },
    }).resolve({ tabId: 24, url: 'http://default-match.test/' });

    expect(result).toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Automatic',
        resultProfileName: '[Direct]',
        details: '(default) => [Direct]\n',
      },
    });
  });

  it('fails closed for invalid System and attached-list Switch trace shapes', async () => {
    const workflowState = state();
    const fixed = workflowState.applied.profiles[0];
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
    workflowState.applied.profiles.push({
      id: 'profile-switch',
      name: 'Automatic',
      color: '#ffb74d',
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'system' },
    });

    await expect(
      resolver(workflowState, {
        activeRoute: { kind: 'profile', profileId: 'profile-switch' },
      }).resolve({ tabId: 23, url: 'http://other.test/' }),
    ).resolves.toBeUndefined();

    const profile = workflowState.applied.profiles.find(
      (candidate) => candidate.id === 'profile-switch',
    );
    if (!profile || profile.kind !== 'switch') throw new Error('missing Switch profile');
    profile.defaultRoute = { kind: 'profile', profileId: fixed.id };
    profile.attachedRuleListProfileId = 'profile-attached-list';
    await expect(
      resolver(workflowState, {
        activeRoute: { kind: 'profile', profileId: profile.id },
      }).resolve({ tabId: 25, url: 'http://other.test/' }),
    ).resolves.toBeUndefined();
  });

  it('returns default state for unsupported or missing runtime state', async () => {
    const uncolored = state();
    const profile = uncolored.applied.profiles[0];
    if (!profile || profile.kind !== 'fixed') throw new Error('missing default Fixed profile');
    delete profile.color;

    await expect(
      resolver(uncolored, {
        activeRoute: { kind: 'profile', profileId: profile.id },
      }).resolve({ tabId: 11, url: 'https://example.test/' }),
    ).resolves.toBeUndefined();
    await expect(
      resolver(state(), {
        activeRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      }).resolve({ tabId: 13, url: 'about:support' }),
    ).resolves.toBeUndefined();
    await expect(
      resolver(undefined, { activeRoute: { kind: 'direct' } }).resolve({
        tabId: 15,
        url: 'https://example.test/',
      }),
    ).resolves.toBeUndefined();
    await expect(
      resolver(state(), {}).resolve({ tabId: 17, url: 'https://example.test/' }),
    ).resolves.toBeUndefined();
  });
});
