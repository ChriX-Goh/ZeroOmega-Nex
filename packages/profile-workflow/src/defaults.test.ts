import { validateProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_FIXED_PROFILE_ID,
  DEFAULT_PROXY_ENDPOINT_ID,
  DEFAULT_SWITCH_PROFILE_ID,
  createDefaultProfileSpec,
} from './defaults.js';

describe('initial editable ProfileSpec', () => {
  it('creates the official v3.5.0 proxy and auto switch defaults in original order', () => {
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
        name: 'proxy',
        color: '#99ccee',
        kind: 'fixed',
        proxyByScheme: { fallback: DEFAULT_PROXY_ENDPOINT_ID },
      }),
      expect.objectContaining({
        id: DEFAULT_SWITCH_PROFILE_ID,
        name: 'auto switch',
        color: '#99dd99',
        kind: 'switch',
        defaultRoute: { kind: 'direct' },
      }),
    ]);
    expect(spec.proxyEndpoints).toEqual([
      expect.objectContaining({
        id: DEFAULT_PROXY_ENDPOINT_ID,
        protocol: 'http',
        host: 'proxy.example.com',
        port: 8080,
      }),
    ]);
    expect(spec.settings.startup.route).toBeUndefined();
    expect(spec.settings.quickSwitch.enabled).toBe(false);
    expect(spec.settings.quickSwitch.routes).toEqual([
      { kind: 'direct' },
      { kind: 'system' },
      { kind: 'profile', profileId: DEFAULT_FIXED_PROFILE_ID },
      { kind: 'profile', profileId: DEFAULT_SWITCH_PROFILE_ID },
    ]);
    expect(spec.settings.interface.builtInProfiles).toEqual({
      direct: { color: '#aaaaaa' },
      system: { color: '#000000' },
    });
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
