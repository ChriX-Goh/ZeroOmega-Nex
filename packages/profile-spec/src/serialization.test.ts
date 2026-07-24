import { describe, expect, it } from 'vitest';

import {
  InvalidProfileSpecError,
  PROFILE_SPEC_SCHEMA_VERSION,
  canonicalProfileSpecValue,
  cloneProfileSpec,
  createProfileSpecRevision,
  migrateProfileSpec,
  parseProfileSpec,
  serializeProfileSpec,
  type ProfileSpec,
  type ProfileSpecMigration,
} from './index.js';

function validSpec(): ProfileSpec {
  return {
    schemaVersion: PROFILE_SPEC_SCHEMA_VERSION,
    documentId: 'document-main',
    revision: {
      id: 'revision-1',
      createdAt: '2026-07-25T00:00:00.000Z',
    },
    profiles: [
      {
        id: 'profile-b',
        name: 'Second',
        kind: 'fixed',
        proxyByScheme: { fallback: 'endpoint-main' },
        bypass: [],
      },
      {
        id: 'profile-a',
        name: 'First',
        kind: 'switch',
        rules: [
          {
            id: 'rule-b',
            condition: { kind: 'host-wildcard', pattern: '*.example.com' },
            route: { kind: 'profile', profileId: 'profile-b' },
          },
          {
            id: 'rule-a',
            condition: { kind: 'true' },
            route: { kind: 'direct' },
          },
        ],
        defaultRoute: { kind: 'system' },
      },
    ],
    proxyEndpoints: [
      {
        id: 'endpoint-main',
        name: 'Main',
        protocol: 'http',
        host: '127.0.0.1',
        port: 7890,
      },
    ],
    ruleSources: [],
    settings: {
      startup: {
        route: { kind: 'profile', profileId: 'profile-a' },
        revertProxyChanges: true,
      },
      quickSwitch: {
        enabled: true,
        profileIds: ['profile-a', 'profile-b'],
        refreshOnChange: false,
      },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        addConditionsToBottom: false,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: true,
        showAdvancedConditions: true,
        exportLegacyRuleList: false,
      },
      ruleSourceUpdateIntervalMinutes: 1440,
    },
  };
}

describe('ProfileSpec serialization and lifecycle', () => {
  it('serializes object keys deterministically while preserving array order', () => {
    const original = validSpec();
    const reordered = {
      settings: original.settings,
      ruleSources: original.ruleSources,
      proxyEndpoints: original.proxyEndpoints,
      profiles: original.profiles,
      revision: original.revision,
      documentId: original.documentId,
      schemaVersion: original.schemaVersion,
    } as ProfileSpec;

    expect(serializeProfileSpec(reordered)).toBe(serializeProfileSpec(original));
    const parsed = JSON.parse(serializeProfileSpec(original)) as ProfileSpec;
    expect(parsed.profiles.map((profile) => profile.id)).toEqual(['profile-b', 'profile-a']);
    const switchProfile = parsed.profiles[1]!;
    expect(switchProfile.kind).toBe('switch');
    if (switchProfile.kind !== 'switch') throw new Error('fixture mismatch');
    expect(switchProfile.rules.map((rule) => rule.id)).toEqual(['rule-b', 'rule-a']);
  });

  it('returns a canonical JSON-compatible value', () => {
    const canonical = canonicalProfileSpecValue(validSpec());
    expect(Object.keys(canonical as Record<string, unknown>)).toEqual([
      'documentId',
      'profiles',
      'proxyEndpoints',
      'revision',
      'ruleSources',
      'schemaVersion',
      'settings',
    ]);
  });

  it('round-trips valid documents through strict parsing', () => {
    const original = validSpec();
    const result = parseProfileSpec(serializeProfileSpec(original));
    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error('expected valid parse result');
    expect(result.value).toEqual(original);
    expect(result.appliedMigrations).toEqual([]);
  });

  it('reports malformed JSON without throwing', () => {
    const result = parseProfileSpec('{"schemaVersion":');
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'parse.invalid-json', severity: 'error' }),
    );
  });

  it('rejects unsupported versions precisely', () => {
    const input = { ...validSpec(), schemaVersion: '99.0' };
    const result = migrateProfileSpec(input);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'migration.unsupported-version' }),
    );
  });

  it('applies an explicit migration chain before validation', () => {
    const input = { ...validSpec(), schemaVersion: '0.9' };
    const migration: ProfileSpecMigration = {
      fromVersion: '0.9',
      toVersion: '1.0',
      migrate(value) {
        return { ...value, schemaVersion: '1.0' };
      },
    };

    const result = migrateProfileSpec(input, [migration]);
    expect(result.valid).toBe(true);
    expect(result.appliedMigrations).toEqual(['0.9->1.0']);
  });

  it('detects migration cycles', () => {
    const input = { ...validSpec(), schemaVersion: '0.9' };
    const migration: ProfileSpecMigration = {
      fromVersion: '0.9',
      toVersion: '0.9',
      migrate(value) {
        return { ...value, schemaVersion: '0.9' };
      },
    };

    const result = migrateProfileSpec(input, [migration]);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'migration.cycle' }));
  });

  it('clones without retaining nested references', () => {
    const original = validSpec();
    const cloned = cloneProfileSpec(original);
    const first = cloned.profiles[0]!;
    first.name = 'Changed clone';
    expect(original.profiles[0]!.name).toBe('Second');
  });

  it('creates an immutable child revision and validates the edited result', () => {
    const original = validSpec();
    const next = createProfileSpecRevision(original, {
      id: 'revision-2',
      createdAt: '2026-07-25T01:00:00.000Z',
      deviceId: 'device-a',
      update(draft) {
        draft.profiles[0]!.name = 'Updated';
      },
    });

    expect(next.revision).toEqual({
      id: 'revision-2',
      parentId: 'revision-1',
      createdAt: '2026-07-25T01:00:00.000Z',
      deviceId: 'device-a',
    });
    expect(next.profiles[0]!.name).toBe('Updated');
    expect(original.profiles[0]!.name).toBe('Second');
  });

  it('throws a typed error when serialization or revision output is invalid', () => {
    const invalid = validSpec();
    invalid.proxyEndpoints[0]!.port = 70000;
    expect(() => serializeProfileSpec(invalid)).toThrow(InvalidProfileSpecError);

    expect(() =>
      createProfileSpecRevision(validSpec(), {
        id: 'revision-2',
        createdAt: 'not-a-time',
      }),
    ).toThrow(InvalidProfileSpecError);
  });

  it('supports compact output and validates indentation options', () => {
    const compact = serializeProfileSpec(validSpec(), { space: 0, trailingNewline: false });
    expect(compact.endsWith('\n')).toBe(false);
    expect(compact.includes('\n')).toBe(false);
    expect(() => serializeProfileSpec(validSpec(), { space: 11 })).toThrow(RangeError);
  });
});
