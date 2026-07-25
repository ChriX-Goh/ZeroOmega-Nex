import { validateProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_FIXED_PROFILE_ID,
  DEFAULT_PROXY_ENDPOINT_ID,
  createDefaultProfileSpec,
} from './defaults.js';

describe('initial editable ProfileSpec', () => {
  it('creates a valid familiar fixed proxy profile while starting in Direct mode', () => {
    const spec = createDefaultProfileSpec({
      documentId: 'document-default',
      revisionId: 'revision-default',
      createdAt: '2026-07-25T08:30:00.000Z',
      deviceId: 'device-default',
    });
    expect(validateProfileSpec(spec).valid).toBe(true);
    expect(spec.profiles).toEqual([
      expect.objectContaining({
        id: DEFAULT_FIXED_PROFILE_ID,
        name: 'Proxy',
        kind: 'fixed',
        proxyByScheme: { fallback: DEFAULT_PROXY_ENDPOINT_ID },
      }),
    ]);
    expect(spec.proxyEndpoints).toEqual([
      expect.objectContaining({
        id: DEFAULT_PROXY_ENDPOINT_ID,
        protocol: 'http',
        host: '127.0.0.1',
        port: 7890,
      }),
    ]);
    expect(spec.settings.startup.route).toEqual({ kind: 'direct' });
    expect(spec.settings.quickSwitch.routes).toEqual([
      { kind: 'direct' },
      { kind: 'system' },
      { kind: 'profile', profileId: DEFAULT_FIXED_PROFILE_ID },
    ]);
  });

  it('does not add an undefined device ID', () => {
    const spec = createDefaultProfileSpec({
      documentId: 'document-default',
      revisionId: 'revision-default',
      createdAt: '2026-07-25T08:30:00.000Z',
    });
    expect(spec.revision).not.toHaveProperty('deviceId');
  });
});
