import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LEGACY_DECODE_LIMITS,
  decodeZeroOmegaBackup,
  legacySecretRef,
  legacyStableId,
} from './index.js';

function minimalBackup(): Record<string, unknown> {
  return {
    schemaVersion: 2,
    '+proxy': {
      name: 'proxy',
      profileType: 'FixedProfile',
      fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 7890 },
      rules: [{ condition: { conditionType: 'TrueCondition' }, profileName: 'direct' }],
    },
  };
}

describe('ZeroOmega backup decoder', () => {
  it('decodes plain JSON and records bounded resource statistics', () => {
    const result = decodeZeroOmegaBackup(JSON.stringify(minimalBackup()));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected successful decode');
    expect(result.value.encoding).toBe('json');
    expect(result.value.stats.profileCount).toBe(1);
    expect(result.value.stats.ruleCount).toBe(1);
    expect(result.value.stats.nodeCount).toBeGreaterThan(1);
  });

  it('decodes base64 JSON accepted by the legacy reset path', () => {
    const encoded = btoa(JSON.stringify(minimalBackup()));
    const result = decodeZeroOmegaBackup(encoded);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected successful decode');
    expect(result.value.encoding).toBe('base64-json');
  });

  it('accepts an already parsed object without serializing it', () => {
    const result = decodeZeroOmegaBackup(minimalBackup());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected successful decode');
    expect(result.value.encoding).toBe('object');
  });

  it('rejects malformed and unsupported inputs precisely', () => {
    expect(decodeZeroOmegaBackup('{').ok).toBe(false);
    expect(decodeZeroOmegaBackup('not base64').ok).toBe(false);
    const wrong = decodeZeroOmegaBackup({ schemaVersion: 3 });
    expect(wrong.ok).toBe(false);
    if (wrong.ok) throw new Error('expected failure');
    expect(wrong.issues[0]!.code).toBe('decode.unsupported-schema');
  });

  it('upgrades schema 1 exactly without mutating object input', () => {
    const input = {
      schemaVersion: 1,
      '+switch': {
        name: 'switch',
        profileType: 'SwitchProfile',
        defaultProfileName: 'direct',
        rules: [
          {
            condition: { conditionType: 'TrueCondition' },
            profileName: 'auto_detect',
          },
        ],
        syncOptions: 'disabled',
        syncError: 'legacy runtime state',
      },
    };
    const original = structuredClone(input);
    const result = decodeZeroOmegaBackup(input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected schema-v1 decode');
    expect(input).toEqual(original);
    expect(result.value.sourceSchemaVersion).toBe(1);
    expect(result.value.options.schemaVersion).toBe(2);
    expect(result.value.options['+auto_detect']).toEqual({
      name: 'auto_detect',
      profileType: 'PacProfile',
      pacUrl: 'http://wpad/wpad.dat',
      color: '#00cccc',
    });
    expect(result.value.options['+switch']).not.toHaveProperty('syncOptions');
    expect(result.value.options['+switch']).not.toHaveProperty('syncError');
    expect(result.value.upgrades.map((notice) => notice.code)).toEqual([
      'schema.v1-auto-detect-wpad-created',
      'schema.v1-upgraded',
      'profile.disabled-sync-state-removed',
    ]);
  });

  it('detects schema-v1 auto_detect references in modern Switchy Rule Lists only when referenced', () => {
    const referenced = decodeZeroOmegaBackup({
      schemaVersion: 1,
      '+rules': {
        name: 'rules',
        profileType: 'RuleListProfile',
        format: 'Switchy',
        matchProfileName: 'direct',
        defaultProfileName: 'direct',
        ruleList:
          '[SwitchyOmega Conditions]\n@with result\n\n*.wpad.example +auto_detect\n* +direct\n',
      },
    });
    expect(referenced.ok).toBe(true);
    if (!referenced.ok) throw new Error('expected referenced schema-v1 decode');
    expect(referenced.value.options['+auto_detect']).toBeDefined();

    const unused = decodeZeroOmegaBackup({
      schemaVersion: 1,
      '+proxy': {
        name: 'proxy',
        profileType: 'FixedProfile',
        fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 7890 },
      },
    });
    expect(unused.ok).toBe(true);
    if (!unused.ok) throw new Error('expected unused schema-v1 decode');
    expect(unused.value.options['+auto_detect']).toBeUndefined();
    expect(unused.value.upgrades.map((notice) => notice.code)).toEqual(['schema.v1-upgraded']);
  });

  it('enforces byte, depth, profile, and rule limits', () => {
    expect(
      decodeZeroOmegaBackup(JSON.stringify(minimalBackup()), {
        ...DEFAULT_LEGACY_DECODE_LIMITS,
        maxInputBytes: 10,
      }).ok,
    ).toBe(false);

    expect(
      decodeZeroOmegaBackup(
        { schemaVersion: 2, nested: { deeper: { value: true } } },
        { ...DEFAULT_LEGACY_DECODE_LIMITS, maxDepth: 2 },
      ).ok,
    ).toBe(false);

    expect(
      decodeZeroOmegaBackup(minimalBackup(), {
        ...DEFAULT_LEGACY_DECODE_LIMITS,
        maxProfiles: 0,
      }).ok,
    ).toBe(false);

    expect(
      decodeZeroOmegaBackup(minimalBackup(), {
        ...DEFAULT_LEGACY_DECODE_LIMITS,
        maxRules: 0,
      }).ok,
    ).toBe(false);
  });

  it('rejects cyclic object inputs', () => {
    const cyclic: Record<string, unknown> = { schemaVersion: 2 };
    cyclic.self = cyclic;
    const result = decodeZeroOmegaBackup(cyclic);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected failure');
    expect(result.issues[0]!.code).toBe('decode.cyclic-object');
  });

  it('generates deterministic public and secret references without source values', () => {
    expect(legacyStableId('profile', '香港 Proxy')).toBe(legacyStableId('profile', '香港 Proxy'));
    expect(legacyStableId('profile', 'a')).not.toBe(legacyStableId('profile', 'b'));
    const ref = legacySecretRef('proxy-password', '/+proxy/auth/fallbackProxy/password');
    expect(ref).toMatch(/^secret-proxy-password-[0-9a-f]{8}$/);
    expect(ref).not.toContain('/+proxy');
  });
});
