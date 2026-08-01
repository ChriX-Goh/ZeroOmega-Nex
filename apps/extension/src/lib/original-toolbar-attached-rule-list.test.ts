import {
  createDefaultProfileSpec,
  createProfileWorkflowState,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import type { ProfileRouteTarget, SwitchProfile } from '@zeroomega-nex/profile-spec';
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
      browserAction_attachedPrefix: '(RL) ',
    };
    return messages[messageName] ?? '';
  }
}

interface AttachedFixtureOptions {
  readonly parentName: string;
  readonly parentColor: string;
  readonly sourceHost: string;
  readonly matchRoute: ProfileRouteTarget;
  readonly defaultRoute: ProfileRouteTarget;
}

function attachedFixture(options: AttachedFixtureOptions): {
  readonly state: ProfileWorkflowState;
  readonly parent: SwitchProfile;
} {
  const spec = createDefaultProfileSpec({
    documentId: 'attached-document',
    revisionId: 'attached-revision',
    createdAt: '2026-08-01T00:00:00.000Z',
  });
  spec.settings.interface.showResultProfileOnActionBadgeText = true;

  const fixed = spec.profiles[0];
  if (!fixed || fixed.kind !== 'fixed') throw new Error('missing default Fixed profile');
  fixed.name = 'Runtime Attached Fixed';
  fixed.color = '#64b5f6';
  fixed.bypass = [];

  const endpointId = fixed.proxyByScheme.fallback;
  if (endpointId === undefined) throw new Error('missing Fixed fallback endpoint');
  const endpoint = spec.proxyEndpoints.find((candidate) => candidate.id === endpointId);
  if (endpoint === undefined) throw new Error('missing Fixed endpoint');
  endpoint.host = '127.0.0.1';
  endpoint.port = 18183;

  const sourceId = `source-${options.parentColor.slice(1)}`;
  const attachedId = `attached-${options.parentColor.slice(1)}`;
  const parentId = `parent-${options.parentColor.slice(1)}`;
  spec.ruleSources.push({
    id: sourceId,
    name: `${options.parentName} Rules`,
    format: 'autoproxy',
    location: { kind: 'inline', content: `||${options.sourceHost}\n` },
  });
  spec.profiles.push({
    id: attachedId,
    name: `__ruleListOf_${options.parentName}`,
    color: options.parentColor,
    kind: 'rule-list',
    sourceId,
    matchRoute: options.matchRoute,
    defaultRoute: options.defaultRoute,
  });
  const parent: SwitchProfile = {
    id: parentId,
    name: options.parentName,
    color: options.parentColor,
    kind: 'switch',
    rules: [],
    defaultRoute: { kind: 'profile', profileId: attachedId },
    attachedRuleListProfileId: attachedId,
  };
  spec.profiles.push(parent);

  return { state: createProfileWorkflowState(spec), parent };
}

function resolve(workflowState: ProfileWorkflowState, parent: SwitchProfile, url: string) {
  return new OriginalToolbarProfileResolver({
    repository: new MemoryRepository(workflowState),
    runtime: new FixedRuntime({
      activeRoute: { kind: 'profile', profileId: parent.id },
    }),
    i18n: new ToolbarI18n(),
  }).resolve({ tabId: 31, url });
}

describe('original attached Rule List toolbar projection', () => {
  it('reproduces attached match into Fixed', async () => {
    const { state, parent } = attachedFixture({
      parentName: 'Runtime Attached Fixed Switch',
      parentColor: '#55bb55',
      sourceHost: 'attached-fixed.test',
      matchRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      defaultRoute: { kind: 'direct' },
    });

    await expect(resolve(state, parent, 'http://attached-fixed.test/')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#55bb55',
      },
      titleArguments: {
        currentProfileName: 'Runtime Attached Fixed Switch',
        resultProfileName: 'Runtime Attached Fixed',
        details: '(RL) ||attached-fixed.test => Runtime Attached Fixed\nPROXY 127.0.0.1:18183\n',
      },
      badgeText: 'Runt',
      detailPrefix: '(RL) ',
    });
  });

  it('reproduces attached no-match default into Direct', async () => {
    const { state, parent } = attachedFixture({
      parentName: 'Runtime Attached Fixed Switch',
      parentColor: '#55bb55',
      sourceHost: 'attached-fixed.test',
      matchRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
      defaultRoute: { kind: 'direct' },
    });

    await expect(resolve(state, parent, 'http://other.test/')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#55bb55',
      },
      titleArguments: {
        currentProfileName: 'Runtime Attached Fixed Switch',
        resultProfileName: '[Direct]',
        details: '(default) => [Direct]\n',
      },
      badgeText: 'Dire',
    });
  });

  it('reproduces attached match into Direct', async () => {
    const { state, parent } = attachedFixture({
      parentName: 'Runtime Attached Direct Switch',
      parentColor: '#dd6633',
      sourceHost: 'attached-direct.test',
      matchRoute: { kind: 'direct' },
      defaultRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    });

    await expect(resolve(state, parent, 'http://attached-direct.test/')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#dd6633',
      },
      titleArguments: {
        currentProfileName: 'Runtime Attached Direct Switch',
        resultProfileName: '[Direct]',
        details: '(RL) ||attached-direct.test => [Direct]\n',
      },
      badgeText: 'Dire',
      detailPrefix: '(RL) ',
    });
  });

  it('reproduces attached no-match default into Fixed', async () => {
    const { state, parent } = attachedFixture({
      parentName: 'Runtime Attached Direct Switch',
      parentColor: '#dd6633',
      sourceHost: 'attached-direct.test',
      matchRoute: { kind: 'direct' },
      defaultRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    });

    await expect(resolve(state, parent, 'http://other.test/')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#dd6633',
      },
      titleArguments: {
        currentProfileName: 'Runtime Attached Direct Switch',
        resultProfileName: 'Runtime Attached Fixed',
        details: '(default) => Runtime Attached Fixed\nPROXY 127.0.0.1:18183\n',
      },
      badgeText: 'Runt',
    });
  });

  it('keeps parent rules and non-AutoProxy attached shapes fail-closed', async () => {
    const { state, parent } = attachedFixture({
      parentName: 'Runtime Attached Direct Switch',
      parentColor: '#dd6633',
      sourceHost: 'attached-direct.test',
      matchRoute: { kind: 'direct' },
      defaultRoute: { kind: 'profile', profileId: 'profile-default-proxy' },
    });
    const appliedParent = state.applied.profiles.find(
      (candidate): candidate is SwitchProfile =>
        candidate.id === parent.id && candidate.kind === 'switch',
    );
    if (appliedParent === undefined) throw new Error('missing applied attached Switch');
    appliedParent.rules.push({
      id: 'unsupported-parent-rule',
      condition: { kind: 'true' },
      route: { kind: 'direct' },
    });

    await expect(resolve(state, parent, 'http://attached-direct.test/')).resolves.toBeUndefined();
  });
});
