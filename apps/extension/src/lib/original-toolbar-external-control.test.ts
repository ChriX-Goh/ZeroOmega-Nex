import {
  createDefaultProfileSpec,
  createProfileWorkflowState,
  type ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import {
  ORIGINAL_TOOLBAR_EXTERNAL_CONTROL_BADGE_BACKGROUND_COLOR,
  OriginalToolbarProfileResolver,
  type OriginalToolbarProfileStateRepository,
  type OriginalToolbarRuntimeInspector,
  type OriginalToolbarRuntimeView,
} from './original-toolbar-profile-resolver';

class MemoryRepository implements OriginalToolbarProfileStateRepository {
  constructor(readonly state: ProfileWorkflowState) {}

  async read(): Promise<ProfileWorkflowState> {
    return this.state;
  }
}

class MutableRuntime implements OriginalToolbarRuntimeInspector {
  constructor(public view: OriginalToolbarRuntimeView) {}

  async inspectRuntime(): Promise<OriginalToolbarRuntimeView> {
    return this.view;
  }
}

class ToolbarI18n implements OriginalToolbarI18nApi {
  getMessage(messageName: string): string {
    const messages: Readonly<Record<string, string>> = {
      routeDirect: 'Direct',
      routeSystem: 'System Proxy',
      browserAction_directResult: '(not using any proxy)',
      browserAction_titleExternalProxy: '(controlled by other extensions or environment)',
    };
    return messages[messageName] ?? '';
  }
}

function workflowState(): ProfileWorkflowState {
  const spec = createDefaultProfileSpec({
    documentId: 'document-external-control',
    revisionId: 'revision-external-control',
    createdAt: '2026-08-02T00:00:00.000Z',
  });
  spec.settings.interface.showResultProfileOnActionBadgeText = true;
  const fixed = spec.profiles.find((profile) => profile.id === 'profile-default-proxy');
  if (!fixed || fixed.kind !== 'fixed') throw new Error('default Fixed profile is unavailable');
  fixed.name = 'Runtime External Control Fixed';
  fixed.color = '#4fc3f7';
  fixed.bypass = [];
  const endpointId = fixed.proxyByScheme.fallback;
  const endpoint = spec.proxyEndpoints.find((candidate) => candidate.id === endpointId);
  if (!endpoint) throw new Error('default Fixed endpoint is unavailable');
  endpoint.host = '127.0.0.1';
  endpoint.port = 18188;
  return createProfileWorkflowState(spec);
}

describe('original external-control Toolbar projection', () => {
  it('switches to Direct while blocked and restores Fixed content with the red warning latched', async () => {
    const state = workflowState();
    const runtime = new MutableRuntime({
      activeRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      proxyControlLevel: 'controlled-by-this-extension',
    });
    const resolver = new OriginalToolbarProfileResolver({
      repository: new MemoryRepository(state),
      runtime,
      i18n: new ToolbarI18n(),
    });
    const input = { tabId: 17, url: 'http://external-control.test/path' };

    const baseline = await resolver.resolve(input);
    expect(baseline).toMatchObject({
      icon: { mode: 'single-color', outerCircleColor: '#4fc3f7' },
      titleArguments: {
        currentProfileName: 'Runtime External Control Fixed',
        resultProfileName: 'Runtime External Control Fixed',
        details: 'PROXY 127.0.0.1:18188\n',
      },
      badgeText: 'Runt',
    });
    expect(baseline).not.toHaveProperty('badgeBackgroundColor');

    runtime.view = {
      activeRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      proxyControlLevel: 'controlled-by-other-extension',
    };
    const blocked = await resolver.resolve(input);
    expect(blocked).toEqual({
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
      badgeBackgroundColor: ORIGINAL_TOOLBAR_EXTERNAL_CONTROL_BADGE_BACKGROUND_COLOR,
    });

    runtime.view = {
      activeRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      proxyControlLevel: 'controlled-by-this-extension',
    };
    const released = await resolver.resolve(input);
    expect(released).toMatchObject({
      icon: { mode: 'single-color', outerCircleColor: '#4fc3f7' },
      titleArguments: {
        currentProfileName: 'Runtime External Control Fixed',
        resultProfileName: 'Runtime External Control Fixed',
        details: 'PROXY 127.0.0.1:18188\n',
      },
      badgeText: 'Runt',
      badgeBackgroundColor: ORIGINAL_TOOLBAR_EXTERNAL_CONTROL_BADGE_BACKGROUND_COLOR,
    });

    expect(await resolver.resolve(input)).toEqual(released);
  });
});
