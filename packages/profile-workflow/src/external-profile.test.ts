import { describe, expect, it } from 'vitest';

import {
  createExternalProfileDraft,
  findMatchingExternalProfile,
  type ProfileWorkflowExternalProfileCandidate,
} from './external-profile.js';
import { workflowFixture } from './test-fixture.js';

function ids() {
  let index = 0;
  return (kind: string) => `${kind}-external-${++index}`;
}

const fixedCandidate: ProfileWorkflowExternalProfileCandidate = {
  kind: 'fixed',
  proxyByScheme: {
    fallback: { protocol: 'socks5', host: 'proxy.example', port: 1080 },
    http: { protocol: 'http', host: 'http.example', port: 8080 },
  },
  bypass: ['<local>', '*.internal'],
};

describe('external profile draft import', () => {
  it('creates an exact Fixed profile and quick-switch route', () => {
    const result = createExternalProfileDraft(
      workflowFixture(),
      fixedCandidate,
      'Imported Proxy',
      ids(),
    );
    expect(result.created).toBe(true);
    const profile = result.draft.profiles.find((candidate) => candidate.id === result.profileId);
    expect(profile).toMatchObject({
      kind: 'fixed',
      name: 'Imported Proxy',
      bypass: [{ pattern: '<local>' }, { pattern: '*.internal' }],
    });
    expect(result.draft.proxyEndpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ protocol: 'socks5', host: 'proxy.example', port: 1080 }),
        expect.objectContaining({ protocol: 'http', host: 'http.example', port: 8080 }),
      ]),
    );
    expect(result.draft.settings.quickSwitch.routes).toContainEqual({
      kind: 'profile',
      profileId: result.profileId,
    });
  });

  it('creates PAC URL and inline profiles', () => {
    const base = workflowFixture();
    const url = createExternalProfileDraft(
      base,
      { kind: 'pac', source: { kind: 'url', url: 'https://pac.example/proxy.pac' } },
      'Imported PAC',
      ids(),
    );
    expect(url.draft.profiles.find((profile) => profile.id === url.profileId)).toMatchObject({
      kind: 'pac',
      source: { kind: 'url', url: 'https://pac.example/proxy.pac' },
    });
    const inline = createExternalProfileDraft(
      base,
      {
        kind: 'pac',
        source: { kind: 'inline', script: 'function FindProxyForURL(){return "DIRECT";}' },
      },
      'Imported Script',
      ids(),
    );
    expect(inline.draft.profiles.find((profile) => profile.id === inline.profileId)).toMatchObject({
      kind: 'pac',
      source: { kind: 'inline' },
    });
  });

  it('finds exact existing profiles and avoids duplicate creation', () => {
    const first = createExternalProfileDraft(workflowFixture(), fixedCandidate, 'Existing', ids());
    const matching = findMatchingExternalProfile(first.draft, fixedCandidate);
    expect(matching?.id).toBe(first.profileId);
    const second = createExternalProfileDraft(first.draft, fixedCandidate, 'Ignored', ids());
    expect(second.created).toBe(false);
    expect(second.profileId).toBe(first.profileId);
    expect(second.draft.profiles).toHaveLength(first.draft.profiles.length);
  });

  it('rejects empty, reserved, and duplicate names', () => {
    const base = workflowFixture();
    expect(() => createExternalProfileDraft(base, fixedCandidate, ' ', ids())).toThrow(/empty/u);
    expect(() => createExternalProfileDraft(base, fixedCandidate, '_External', ids())).toThrow(
      /underscore/u,
    );
    expect(() =>
      createExternalProfileDraft(base, fixedCandidate, base.profiles[0]!.name, ids()),
    ).toThrow(/already exists/u);
  });
});
