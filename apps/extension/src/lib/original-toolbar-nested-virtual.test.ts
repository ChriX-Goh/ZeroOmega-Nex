import {
  createDefaultProfileSpec,
  createProfileWorkflowState,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import type { VirtualProfile } from '@zeroomega-nex/profile-spec';
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
  readonly outerDirect: VirtualProfile;
  readonly outerFixed: VirtualProfile;
  readonly innerDirect: VirtualProfile;
} {
  const spec = createDefaultProfileSpec({
    documentId: 'nested-virtual-document',
    revisionId: 'nested-virtual-revision',
    createdAt: '2026-08-01T19:50:00.000Z',
  });
  spec.settings.interface.showResultProfileOnActionBadgeText = true;

  const fixed = spec.profiles[0];
  if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
  fixed.name = 'Runtime Nested Virtual Fixed';
  fixed.color = '#64b5f6';
  fixed.bypass = [{ id: 'bypass-nested-virtual-localhost', pattern: 'localhost' }];

  const endpointId = fixed.proxyByScheme.fallback;
  if (endpointId === undefined) throw new Error('missing Fixed fallback endpoint');
  const endpoint = spec.proxyEndpoints.find((candidate) => candidate.id === endpointId);
  if (endpoint === undefined) throw new Error('missing Fixed endpoint');
  endpoint.host = '127.0.0.1';
  endpoint.port = 18185;

  const innerFixed: VirtualProfile = {
    id: 'profile-nested-virtual-inner-fixed',
    name: 'Runtime Nested Virtual Inner Fixed Alias',
    color: '#81c784',
    kind: 'virtual',
    targetRoute: { kind: 'profile', profileId: fixed.id },
  };
  const outerFixed: VirtualProfile = {
    id: 'profile-nested-virtual-outer-fixed',
    name: 'Runtime Nested Virtual Outer Fixed Alias',
    color: '#ffb74d',
    kind: 'virtual',
    targetRoute: { kind: 'profile', profileId: innerFixed.id },
  };
  const innerDirect: VirtualProfile = {
    id: 'profile-nested-virtual-inner-direct',
    name: 'Runtime Nested Virtual Inner Direct Alias',
    color: '#9575cd',
    kind: 'virtual',
    targetRoute: { kind: 'direct' },
  };
  const outerDirect: VirtualProfile = {
    id: 'profile-nested-virtual-outer-direct',
    name: 'Runtime Nested Virtual Outer Direct Alias',
    color: '#ff8a65',
    kind: 'virtual',
    targetRoute: { kind: 'profile', profileId: innerDirect.id },
  };
  spec.profiles.push(innerFixed, outerFixed, innerDirect, outerDirect);
  return {
    state: createProfileWorkflowState(spec),
    outerDirect,
    outerFixed,
    innerDirect,
  };
}

function resolve(state: ProfileWorkflowState, profile: VirtualProfile, url: string) {
  return new OriginalToolbarProfileResolver({
    repository: new MemoryRepository(state),
    runtime: new FixedRuntime({ activeRoute: { kind: 'profile', profileId: profile.id } }),
    i18n: new ToolbarI18n(),
  }).resolve({ tabId: 51, url });
}

describe('original nested Virtual toolbar projection', () => {
  it('reproduces outer Virtual through inner Virtual into Direct', async () => {
    const { state, outerDirect } = nestedFixture();

    await expect(
      resolve(state, outerDirect, 'http://nested-virtual-direct.test/path'),
    ).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#9575cd',
      },
      titleArguments: {
        currentProfileName:
          'Runtime Nested Virtual Outer Direct Alias [Runtime Nested Virtual Inner Direct Alias]',
        resultProfileName: '[Direct]',
        details: '(default) => [Direct]\n',
      },
      badgeText: 'Dire',
    });
  });

  it('reproduces outer Virtual through inner Virtual into Fixed proxy', async () => {
    const { state, outerFixed } = nestedFixture();

    await expect(
      resolve(state, outerFixed, 'http://nested-virtual-fixed.test/path'),
    ).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#81c784',
      },
      titleArguments: {
        currentProfileName:
          'Runtime Nested Virtual Outer Fixed Alias [Runtime Nested Virtual Inner Fixed Alias]',
        resultProfileName: 'Runtime Nested Virtual Fixed',
        details: '(default) => Runtime Nested Virtual Fixed\n' + 'PROXY 127.0.0.1:18185\n',
      },
      badgeText: 'Runt',
    });
  });

  it('reproduces outer Virtual through inner Virtual into Fixed bypass', async () => {
    const { state, outerFixed } = nestedFixture();

    await expect(resolve(state, outerFixed, 'http://localhost/path')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#64b5f6',
      },
      titleArguments: {
        currentProfileName:
          'Runtime Nested Virtual Outer Fixed Alias [Runtime Nested Virtual Inner Fixed Alias]',
        resultProfileName: 'Runtime Nested Virtual Fixed',
        details: '(default) => Runtime Nested Virtual Fixed\n' + 'localhost => DIRECT\n',
      },
      badgeText: 'Runt',
    });
  });

  it('keeps a third Virtual level fail-closed', async () => {
    const { state, outerDirect, innerDirect } = nestedFixture();
    state.applied.profiles.push({
      id: 'profile-nested-virtual-third',
      name: 'Runtime Nested Virtual Third Alias',
      color: '#4db6ac',
      kind: 'virtual',
      targetRoute: { kind: 'direct' },
    });
    const appliedInner = state.applied.profiles.find((profile) => profile.id === innerDirect.id);
    if (!appliedInner || appliedInner.kind !== 'virtual') throw new Error('missing applied inner');
    appliedInner.targetRoute = {
      kind: 'profile',
      profileId: 'profile-nested-virtual-third',
    };

    await expect(
      resolve(state, outerDirect, 'http://nested-virtual-direct.test/path'),
    ).resolves.toBeUndefined();
  });
});
