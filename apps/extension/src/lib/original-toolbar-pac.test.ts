import {
  createDefaultProfileSpec,
  createProfileWorkflowState,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import type { PacProfile } from '@zeroomega-nex/profile-spec';
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

class EmptyI18n implements OriginalToolbarI18nApi {
  getMessage(): string {
    return '';
  }
}

function fixture(source: PacProfile['source']): {
  readonly state: ProfileWorkflowState;
  readonly profile: PacProfile;
} {
  const spec = createDefaultProfileSpec({
    documentId: 'pac-toolbar-document',
    revisionId: 'pac-toolbar-revision',
    createdAt: '2026-08-02T04:20:00.000Z',
  });
  spec.settings.interface.showResultProfileOnActionBadgeText = true;
  const profile: PacProfile = {
    id: 'profile-runtime-pac',
    name: 'Runtime PAC',
    color: '#4db6ac',
    kind: 'pac',
    source,
  };
  spec.profiles.push(profile);
  return { state: createProfileWorkflowState(spec), profile };
}

function resolve(state: ProfileWorkflowState, profile: PacProfile, url: string) {
  return new OriginalToolbarProfileResolver({
    repository: new MemoryRepository(state),
    runtime: new FixedRuntime({
      activeRoute: { kind: 'profile', profileId: profile.id },
    }),
    i18n: new EmptyI18n(),
  }).resolve({ tabId: 61, url });
}

describe('original URL-backed PAC toolbar projection', () => {
  it('shows the PAC profile and source URL without inventing a per-URL PAC result', async () => {
    const pacUrl = 'https://pac.example.test/runtime.pac';
    const { state, profile } = fixture({
      kind: 'url',
      url: pacUrl,
      script:
        "function FindProxyForURL(url, host) { return host === 'proxy.test' ? 'PROXY 127.0.0.1:18186' : 'DIRECT'; }",
    });

    const expected = {
      icon: { mode: 'single-color', outerCircleColor: '#4db6ac' },
      titleArguments: {
        currentProfileName: 'Runtime PAC',
        resultProfileName: 'Runtime PAC',
        details: pacUrl,
      },
      badgeText: 'Runt',
    };

    await expect(resolve(state, profile, 'http://proxy.test/path')).resolves.toEqual(expected);
    await expect(resolve(state, profile, 'http://direct.test/path')).resolves.toEqual(expected);
  });

  it('keeps inline PAC and uncached URL PAC shapes fail-closed', async () => {
    const inline = fixture({
      kind: 'inline',
      script: "function FindProxyForURL() { return 'DIRECT'; }",
    });
    await expect(
      resolve(inline.state, inline.profile, 'http://direct.test/'),
    ).resolves.toBeUndefined();

    const uncached = fixture({
      kind: 'url',
      url: 'https://pac.example.test/uncached.pac',
    });
    await expect(
      resolve(uncached.state, uncached.profile, 'http://direct.test/'),
    ).resolves.toBeUndefined();
  });
});
