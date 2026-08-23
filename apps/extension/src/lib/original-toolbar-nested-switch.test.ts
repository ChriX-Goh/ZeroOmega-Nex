import {
  createDefaultProfileSpec,
  createProfileWorkflowState,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import type { SwitchProfile } from '@zeroomega-nex/profile-spec';
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

function nestedFixture(): {
  readonly state: ProfileWorkflowState;
  readonly outer: SwitchProfile;
  readonly inner: SwitchProfile;
} {
  const spec = createDefaultProfileSpec({
    documentId: 'nested-switch-document',
    revisionId: 'nested-switch-revision',
    createdAt: '2026-08-01T18:30:00.000Z',
  });
  spec.settings.interface.showResultProfileOnActionBadgeText = true;

  const fixed = spec.profiles[0];
  if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
  fixed.name = 'Runtime Nested Fixed';
  fixed.color = '#64b5f6';
  fixed.bypass = [];

  const endpointId = fixed.proxyByScheme.fallback;
  if (endpointId === undefined) throw new Error('missing Fixed fallback endpoint');
  const endpoint = spec.proxyEndpoints.find((candidate) => candidate.id === endpointId);
  if (endpoint === undefined) throw new Error('missing Fixed endpoint');
  endpoint.host = '127.0.0.1';
  endpoint.port = 18184;

  const inner: SwitchProfile = {
    id: 'profile-nested-inner',
    name: 'Runtime Nested Inner Switch',
    color: '#81c784',
    kind: 'switch',
    rules: [
      {
        id: 'rule-inner-fixed',
        condition: { kind: 'host-wildcard', pattern: 'nested-fixed.test' },
        route: { kind: 'profile', profileId: fixed.id },
      },
    ],
    defaultRoute: { kind: 'direct' },
  };
  const outer: SwitchProfile = {
    id: 'profile-nested-outer',
    name: 'Runtime Nested Outer Switch',
    color: '#ffb74d',
    kind: 'switch',
    rules: [
      {
        id: 'rule-outer-fixed',
        condition: { kind: 'host-wildcard', pattern: 'nested-fixed.test' },
        route: { kind: 'profile', profileId: inner.id },
      },
      {
        id: 'rule-outer-direct',
        condition: { kind: 'host-wildcard', pattern: 'nested-direct.test' },
        route: { kind: 'profile', profileId: inner.id },
      },
    ],
    defaultRoute: { kind: 'direct' },
  };
  spec.profiles.push(inner, outer);
  return { state: createProfileWorkflowState(spec), outer, inner };
}

function resolve(state: ProfileWorkflowState, outer: SwitchProfile, url: string) {
  return new OriginalToolbarProfileResolver({
    repository: new MemoryRepository(state),
    runtime: new FixedRuntime({ activeRoute: { kind: 'profile', profileId: outer.id } }),
    i18n: new ToolbarI18n(),
  }).resolve({ tabId: 41, url });
}

describe('original nested Switch toolbar projection', () => {
  it('reproduces outer match through inner match into Fixed', async () => {
    const { state, outer } = nestedFixture();

    await expect(resolve(state, outer, 'http://nested-fixed.test/path')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Runtime Nested Outer Switch',
        resultProfileName: 'Runtime Nested Fixed',
        details:
          'nested-fixed.test => Runtime Nested Inner Switch\n' +
          'nested-fixed.test => Runtime Nested Fixed\n' +
          'PROXY 127.0.0.1:18184\n',
      },
      badgeText: 'Runt',
    });
  });

  it('reproduces outer match through inner default into Direct', async () => {
    const { state, outer } = nestedFixture();

    await expect(resolve(state, outer, 'http://nested-direct.test/path')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Runtime Nested Outer Switch',
        resultProfileName: '[Direct]',
        details: 'nested-direct.test => Runtime Nested Inner Switch\n' + '(default) => [Direct]\n',
      },
      badgeText: 'Dire',
    });
  });

  it('keeps the outer default Direct path on the existing one-level contract', async () => {
    const { state, outer } = nestedFixture();

    await expect(resolve(state, outer, 'http://outer-default.test/path')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Runtime Nested Outer Switch',
        resultProfileName: '[Direct]',
        details: '(default) => [Direct]\n',
      },
      badgeText: 'Dire',
    });
  });

  it('keeps a third Switch level fail-closed', async () => {
    const { state, outer, inner } = nestedFixture();
    const appliedInner = state.applied.profiles.find((profile) => profile.id === inner.id);
    if (!appliedInner || appliedInner.kind !== 'switch') throw new Error('missing applied inner');
    state.applied.profiles.push({
      id: 'profile-nested-third',
      name: 'Runtime Nested Third Switch',
      color: '#9575cd',
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'direct' },
    });
    appliedInner.defaultRoute = { kind: 'profile', profileId: 'profile-nested-third' };

    await expect(resolve(state, outer, 'http://nested-direct.test/path')).resolves.toBeUndefined();
  });
});
