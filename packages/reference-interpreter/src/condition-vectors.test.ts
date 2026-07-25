import { readFile } from 'node:fs/promises';

import { importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileRouteTarget, ProfileSpec, SwitchProfile } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { evaluateSwitchProfile } from './evaluate.js';
import type { ReferenceRequest, ReferenceSupport } from './types.js';

interface ConditionVector {
  readonly id: string;
  readonly condition: Readonly<Record<string, unknown>>;
  readonly request: ReferenceRequest;
  readonly expected: {
    readonly matched: boolean;
    readonly selectedProfileName: string;
  };
  readonly support: ReferenceSupport;
}

interface ConditionVectorFile {
  readonly vectorSchemaVersion: number;
  readonly vectors: readonly ConditionVector[];
}

const VECTOR_URL = new URL(
  '../../../fixtures/zeroomega-v2/vectors/condition-decisions.json',
  import.meta.url,
);

const importContext = {
  createdAt: '2026-07-25T04:00:00.000Z',
  documentId: 'document-reference-vector',
  revisionId: 'revision-reference-vector',
  deviceId: 'device-reference-vector',
} as const;

async function loadVectors(): Promise<ConditionVectorFile> {
  return JSON.parse(await readFile(VECTOR_URL, 'utf8')) as ConditionVectorFile;
}

function importVectorProfile(condition: Readonly<Record<string, unknown>>): {
  readonly spec: ProfileSpec;
  readonly profile: SwitchProfile;
} {
  const result = importZeroOmegaBackup(
    {
      schemaVersion: 2,
      '+fixed': {
        name: 'fixed',
        profileType: 'FixedProfile',
        fallbackProxy: {
          scheme: 'http',
          host: 'proxy.example.invalid',
          port: 8080,
        },
        bypassList: [],
      },
      '+switch': {
        name: 'switch',
        profileType: 'SwitchProfile',
        defaultProfileName: 'direct',
        rules: [{ condition, profileName: 'fixed' }],
      },
    },
    importContext,
  );

  if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
  const profile = result.candidate.profiles.find((entry) => entry.name === 'switch');
  if (!profile || profile.kind !== 'switch') throw new Error('switch profile was not imported');
  return { spec: result.candidate, profile };
}

function routeName(spec: ProfileSpec, route: ProfileRouteTarget): string {
  if (route.kind !== 'profile') return route.kind;
  return spec.profiles.find((profile) => profile.id === route.profileId)?.name ?? 'missing-profile';
}

describe('reference condition interpreter', () => {
  it('executes every pinned condition decision vector without changing the oracle', async () => {
    const source = await loadVectors();
    expect(source.vectorSchemaVersion).toBe(1);

    for (const vector of source.vectors) {
      const { spec, profile } = importVectorProfile(vector.condition);
      const decision = evaluateSwitchProfile(profile, vector.request);
      expect(decision.status, vector.id).toBe('selected');
      if (decision.status !== 'selected') continue;

      expect(decision.matchedRuleId !== undefined, vector.id).toBe(vector.expected.matched);
      expect(routeName(spec, decision.route), vector.id).toBe(
        vector.expected.selectedProfileName,
      );
      expect(decision.support, vector.id).toBe(vector.support);
    }
  });

  it('preserves first-match order and records a deterministic trace', () => {
    const profile: SwitchProfile = {
      id: 'profile-switch',
      name: 'switch',
      kind: 'switch',
      rules: [
        {
          id: 'rule-first',
          condition: { kind: 'true' },
          route: { kind: 'direct' },
        },
        {
          id: 'rule-second',
          condition: { kind: 'true' },
          route: { kind: 'system' },
        },
      ],
      defaultRoute: { kind: 'system' },
    };

    const decision = evaluateSwitchProfile(profile, {
      url: 'https://example.invalid/',
      host: 'example.invalid',
      scheme: 'https',
    });
    expect(decision.status).toBe('selected');
    if (decision.status !== 'selected') return;
    expect(decision.route).toEqual({ kind: 'direct' });
    expect(decision.matchedRuleId).toBe('rule-first');
    expect(decision.trace.map((entry) => entry.ruleId)).toEqual(['rule-first']);
  });

  it('does not silently fall through when local clock input is unavailable', () => {
    const profile: SwitchProfile = {
      id: 'profile-clock',
      name: 'clock',
      kind: 'switch',
      rules: [
        {
          id: 'rule-clock',
          condition: {
            kind: 'time',
            startHour: 9,
            endHour: 17,
            timezone: 'local',
          },
          route: { kind: 'direct' },
        },
      ],
      defaultRoute: { kind: 'system' },
    };

    const decision = evaluateSwitchProfile(profile, {
      url: 'https://example.invalid/',
      host: 'example.invalid',
      scheme: 'https',
    });
    expect(decision.status).toBe('indeterminate');
  });
});
