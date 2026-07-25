import { readFile } from 'node:fs/promises';

import { importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  evaluateDifferentialVector,
  serializeDifferentialDecisionRecord,
} from './differential.js';

const ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);
const context = {
  createdAt: '2026-07-25T05:00:00.000Z',
  documentId: 'document-differential-test',
  revisionId: 'revision-differential-test',
} as const;

async function importedFixture(name: string): Promise<ProfileSpec> {
  const source = await readFile(new URL(name, ROOT), 'utf8');
  const result = importZeroOmegaBackup(source, context);
  if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
  return result.candidate;
}

function routeForProfile(spec: ProfileSpec, name: string) {
  const profile = spec.profiles.find((candidate) => candidate.name === name);
  if (!profile) throw new Error(`missing profile ${name}`);
  return { kind: 'profile' as const, profileId: profile.id };
}

describe('backend-neutral differential records', () => {
  it('serializes identical decisions to byte-identical records', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const vector = {
      id: 'deterministic-switch',
      startRoute: routeForProfile(spec, 'switch'),
      request: {
        url: 'https://api.example.invalid/path',
        host: 'api.example.invalid',
        scheme: 'https',
      },
    } as const;

    const first = evaluateDifferentialVector(spec, vector);
    const second = evaluateDifferentialVector(spec, vector);
    expect(serializeDifferentialDecisionRecord(first)).toBe(
      serializeDifferentialDecisionRecord(second),
    );
    expect(first.status).toBe('resolved');
    expect(first.route?.kind).toBe('proxy');
    expect(first.profilePath).toHaveLength(2);
    expect(first.matchedRuleIds).toHaveLength(1);
  });

  it('excludes proxy credential metadata and secret references from differential output', async () => {
    const spec = await importedFixture('credentials-and-headers.redacted.json');
    const record = evaluateDifferentialVector(spec, {
      id: 'credential-redaction',
      startRoute: routeForProfile(spec, 'proxy-auth'),
      request: {
        url: 'http://example.invalid/',
        host: 'example.invalid',
        scheme: 'http',
      },
    });
    const serialized = serializeDifferentialDecisionRecord(record);
    expect(record.status).toBe('resolved');
    expect(record.route?.kind).toBe('proxy');
    expect(serialized).not.toContain('credential');
    expect(serialized).not.toContain('passwordSecretRef');
    expect(serialized).not.toContain('<redacted>');
  });

  it('records invalid profile cycles without emitting a route', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    spec.profiles = [
      {
        id: 'cycle-left',
        name: 'Cycle Left',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'cycle-right' },
      },
      {
        id: 'cycle-right',
        name: 'Cycle Right',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'cycle-left' },
      },
    ];

    const record = evaluateDifferentialVector(spec, {
      id: 'cycle-record',
      startRoute: { kind: 'profile', profileId: 'cycle-left' },
      request: {
        url: 'https://example.invalid/',
        host: 'example.invalid',
        scheme: 'https',
      },
    });
    expect(record.status).toBe('invalid');
    expect(record.route).toBeUndefined();
    expect(record.reason).toContain('cycle-left -> cycle-right -> cycle-left');
    expect(record.profilePath).toEqual(['cycle-left', 'cycle-right']);
  });
});
