import { readFile } from 'node:fs/promises';

import { importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import type { ReferenceRequest } from '@zeroomega-nex/reference-interpreter';
import { describe, expect, it } from 'vitest';

import { compilePac } from './compiler.js';
import { verifyPacArtifact } from './verify.js';

const ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);
const context = {
  createdAt: '2026-07-25T06:30:00.000Z',
  documentId: 'document-pac-differential',
  revisionId: 'revision-pac-differential',
} as const;

interface ConditionVector {
  readonly id: string;
  readonly condition: Readonly<Record<string, unknown>>;
  readonly request: ReferenceRequest;
}

interface ConditionVectorFile {
  readonly vectors: readonly ConditionVector[];
}

interface RuleListVector {
  readonly id: string;
  readonly fixtureProfileName: string;
  readonly request: ReferenceRequest;
}

interface RuleListVectorFile {
  readonly vectors: readonly RuleListVector[];
}

async function json<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(new URL(path, ROOT), 'utf8')) as T;
}

async function importedFixture(path: string): Promise<ProfileSpec> {
  const imported = importZeroOmegaBackup(await readFile(new URL(path, ROOT), 'utf8'), context);
  if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));
  return imported.candidate;
}

function profileRoute(spec: ProfileSpec, name: string): ProfileRouteTarget {
  const profile = spec.profiles.find((candidate) => candidate.name === name);
  if (!profile) throw new Error(`missing profile ${name}`);
  return { kind: 'profile', profileId: profile.id };
}

function conditionSpec(vector: ConditionVector): ProfileSpec {
  const imported = importZeroOmegaBackup(
    JSON.stringify({
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
        rules: [
          {
            condition: vector.condition,
            profileName: 'fixed',
          },
        ],
      },
    }),
    {
      ...context,
      documentId: `document-${vector.id}`,
      revisionId: `revision-${vector.id}`,
    },
  );
  if (!imported.ok) throw new Error(`${vector.id}: ${JSON.stringify(imported.report, null, 2)}`);
  return imported.candidate;
}

describe('PAC differential verifier', () => {
  it('matches all committed condition decision vectors', async () => {
    const oracle = await json<ConditionVectorFile>('vectors/condition-decisions.json');

    for (const vector of oracle.vectors) {
      const spec = conditionSpec(vector);
      const route = profileRoute(spec, 'switch');
      const compiled = compilePac(spec, route, { allowTargetDependent: true });
      expect(compiled.ok, vector.id).toBe(true);
      if (!compiled.ok) throw new Error(`${vector.id}: ${JSON.stringify(compiled.issues)}`);
      const verified = verifyPacArtifact(spec, route, compiled.artifact, [
        { id: vector.id, request: vector.request },
      ]);
      expect(verified.passed, `${vector.id}: ${JSON.stringify(verified.mismatches)}`).toBe(true);
    }
  });

  it('matches all committed Switchy and AutoProxy decision vectors', async () => {
    const spec = await importedFixture('rule-list-formats.json');
    const oracle = await json<RuleListVectorFile>('vectors/rule-list-decisions.json');

    for (const vector of oracle.vectors) {
      const route = profileRoute(spec, vector.fixtureProfileName);
      const compiled = compilePac(spec, route, { allowTargetDependent: true });
      expect(compiled.ok, vector.id).toBe(true);
      if (!compiled.ok) throw new Error(`${vector.id}: ${JSON.stringify(compiled.issues)}`);
      const verified = verifyPacArtifact(spec, route, compiled.artifact, [
        { id: vector.id, request: vector.request },
      ]);
      expect(verified.passed, `${vector.id}: ${JSON.stringify(verified.mismatches)}`).toBe(true);
    }
  });

  it('reports a deterministic mismatch instead of accepting altered PAC output', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const route = profileRoute(spec, 'switch');
    const compiled = compilePac(spec, route);
    if (!compiled.ok) throw new Error(JSON.stringify(compiled.issues, null, 2));
    const corrupted = {
      ...compiled.artifact,
      script: compiled.artifact.script.replace(
        'HTTPS proxy.example.invalid:8443',
        'PROXY wrong.example.invalid:9999',
      ),
    };
    const verified = verifyPacArtifact(spec, route, corrupted, [
      {
        id: 'corrupted-output',
        request: {
          url: 'https://api.example.invalid/path',
          host: 'api.example.invalid',
          scheme: 'https',
        },
      },
    ]);
    expect(verified.passed).toBe(false);
    expect(verified.mismatches).toEqual([
      expect.objectContaining({
        vectorId: 'corrupted-output',
        expected: 'HTTPS proxy.example.invalid:8443',
        actual: 'PROXY wrong.example.invalid:9999',
      }),
    ]);
  });
});
