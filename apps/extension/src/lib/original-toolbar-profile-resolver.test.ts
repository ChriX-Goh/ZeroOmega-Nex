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
        outerCircleColor: '#bdbdbd',
        innerCircleColor: '#bdbdbd',
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

  it('returns default state for unsupported or missing runtime state', async () => {
    await expect(
      resolver(state(), {
        activeRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      }).resolve({ tabId: 7, url: 'https://example.test/' }),
    ).resolves.toBeUndefined();
    await expect(
      resolver(undefined, { activeRoute: { kind: 'direct' } }).resolve({
        tabId: 11,
        url: 'https://example.test/',
      }),
    ).resolves.toBeUndefined();
    await expect(
      resolver(state(), {}).resolve({ tabId: 13, url: 'https://example.test/' }),
    ).resolves.toBeUndefined();
  });
});
