import {
  createDefaultProfileSpec,
  createProfileWorkflowState,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import type { SwitchProfile, VirtualProfile } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import {
  OriginalToolbarProfileResolver,
  type OriginalToolbarProfileStateRepository,
  type OriginalToolbarRuntimeInspector,
} from './original-toolbar-profile-resolver';

class MemoryRepository implements OriginalToolbarProfileStateRepository {
  constructor(readonly state: ProfileWorkflowState) {}

  async read(): Promise<ProfileWorkflowState> {
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
      browserAction_defaultRuleDetails: '(default)',
    };
    return messages[messageName] ?? '';
  }
}

function fixture(): {
  readonly state: ProfileWorkflowState;
  readonly outer: VirtualProfile;
  readonly inner: SwitchProfile;
} {
  const spec = createDefaultProfileSpec({
    documentId: 'virtual-switch-document',
    revisionId: 'virtual-switch-revision',
    createdAt: '2026-08-02T05:55:00.000Z',
  });
  spec.settings.interface.showResultProfileOnActionBadgeText = true;

  const fixed = spec.profiles[0];
  if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
  fixed.name = 'Runtime Virtual Switch Fixed';
  fixed.color = '#64b5f6';
  fixed.bypass = [];

  const endpointId = fixed.proxyByScheme.fallback;
  if (endpointId === undefined) throw new Error('missing Fixed fallback endpoint');
  const endpoint = spec.proxyEndpoints.find((candidate) => candidate.id === endpointId);
  if (endpoint === undefined) throw new Error('missing Fixed endpoint');
  endpoint.host = '127.0.0.1';
  endpoint.port = 18190;

  const inner: SwitchProfile = {
    id: 'profile-virtual-switch-inner',
    name: 'Runtime Virtual Switch Inner',
    color: '#81c784',
    kind: 'switch',
    rules: [
      {
        id: 'rule-virtual-switch-fixed',
        enabled: true,
        condition: { kind: 'host-wildcard', pattern: 'virtual-switch-fixed.test' },
        route: { kind: 'profile', profileId: fixed.id },
      },
      {
        id: 'rule-virtual-switch-direct',
        enabled: true,
        condition: { kind: 'host-wildcard', pattern: 'virtual-switch-direct.test' },
        route: { kind: 'direct' },
      },
    ],
    defaultRoute: { kind: 'direct' },
  };
  const outer: VirtualProfile = {
    id: 'profile-virtual-switch-outer',
    name: 'Runtime Virtual Switch Outer Alias',
    color: '#ff8a65',
    kind: 'virtual',
    targetRoute: { kind: 'profile', profileId: inner.id },
  };
  spec.profiles.push(inner, outer);
  return { state: createProfileWorkflowState(spec), outer, inner };
}

function resolve(state: ProfileWorkflowState, outer: VirtualProfile, url: string) {
  return new OriginalToolbarProfileResolver({
    repository: new MemoryRepository(state),
    runtime: new FixedRuntime({ activeRoute: { kind: 'profile', profileId: outer.id } }),
    i18n: new ToolbarI18n(),
  }).resolve({ tabId: 61, url });
}

describe('original Virtual to Switch toolbar projection', () => {
  it('reproduces a matched inner Switch rule into Fixed', async () => {
    const { state, outer } = fixture();

    await expect(resolve(state, outer, 'http://virtual-switch-fixed.test/path')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#81c784',
      },
      titleArguments: {
        currentProfileName: 'Runtime Virtual Switch Outer Alias [Runtime Virtual Switch Inner]',
        resultProfileName: 'Runtime Virtual Switch Fixed',
        details:
          'virtual-switch-fixed.test => Runtime Virtual Switch Fixed\n' +
          'PROXY 127.0.0.1:18190\n',
      },
      badgeText: 'Runt',
    });
  });

  it('reproduces a matched inner Switch rule into Direct', async () => {
    const { state, outer } = fixture();

    await expect(resolve(state, outer, 'http://virtual-switch-direct.test/path')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#81c784',
      },
      titleArguments: {
        currentProfileName: 'Runtime Virtual Switch Outer Alias [Runtime Virtual Switch Inner]',
        resultProfileName: '[Direct]',
        details: 'virtual-switch-direct.test => [Direct]\n',
      },
      badgeText: 'Dire',
    });
  });

  it('reproduces the inner Switch default into Direct', async () => {
    const { state, outer } = fixture();

    await expect(resolve(state, outer, 'http://virtual-switch-default.test/path')).resolves.toEqual(
      {
        icon: {
          mode: 'two-color',
          outerCircleColor: '#aaaaaa',
          innerCircleColor: '#81c784',
        },
        titleArguments: {
          currentProfileName: 'Runtime Virtual Switch Outer Alias [Runtime Virtual Switch Inner]',
          resultProfileName: '[Direct]',
          details: '(default) => [Direct]\n',
        },
        badgeText: 'Dire',
      },
    );
  });

  it('keeps an inner Switch target to another Switch fail-closed', async () => {
    const { state, outer, inner } = fixture();
    const nested: SwitchProfile = {
      id: 'profile-virtual-switch-third',
      name: 'Runtime Virtual Switch Third',
      color: '#4db6ac',
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'direct' },
    };
    state.applied.profiles.push(nested);
    const appliedInner = state.applied.profiles.find((profile) => profile.id === inner.id);
    if (!appliedInner || appliedInner.kind !== 'switch') throw new Error('missing applied inner');
    appliedInner.rules[0] = {
      ...appliedInner.rules[0],
      route: { kind: 'profile', profileId: nested.id },
    };

    await expect(
      resolve(state, outer, 'http://virtual-switch-fixed.test/path'),
    ).resolves.toBeUndefined();
  });
});
