import { describe, expect, it } from 'vitest';

import { createProfileWorkflowState } from './state.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { updateProfileWorkflowPacSource } from './pac-source-update.js';
import { workflowFixture } from './test-fixture.js';

class EmptySecretStore {
  async getSecret(): Promise<string | undefined> {
    return undefined;
  }
  async putSecret(): Promise<void> {}
  async removeSecret(): Promise<void> {}
}

function pacState() {
  const spec = workflowFixture();
  spec.profiles.push({
    id: 'pac-remote',
    name: 'Remote PAC',
    kind: 'pac',
    source: {
      kind: 'url',
      url: 'https://pac.example.invalid/proxy.pac',
      script: "function FindProxyForURL() { return 'DIRECT'; }",
    },
  });
  return createProfileWorkflowState(spec);
}

describe('PAC background update service', () => {
  it('records a stable empty-response code and preserves the existing cached script', async () => {
    const initial = pacState();
    const repository = new MemoryProfileWorkflowRepository(initial);
    const result = await updateProfileWorkflowPacSource(repository, initial, 'pac-remote', {
      secretStore: new EmptySecretStore(),
      now: () => '2026-07-29T04:00:00.000Z',
      downloader: { download: async () => ({ content: '   ', bytes: 3 }) },
    });
    expect(result.status).toBe('failed');
    expect(result.update?.lastError).toMatchObject({
      code: 'response-empty',
      message: 'The PAC response was empty.',
    });
    const profile = result.state?.draft.profiles.find((candidate) => candidate.id === 'pac-remote');
    expect(profile?.kind === 'pac' ? profile.source.script : undefined).toContain('DIRECT');
  });
});
