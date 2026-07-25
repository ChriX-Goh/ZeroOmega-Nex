import { readFile } from 'node:fs/promises';

import { importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import { serializeProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { evaluateDifferentialVector } from './differential.js';
import { ipMatchesPrefix } from './ip.js';
import { parseRuleList } from './rule-list.js';
import { matchesHostPattern } from './wildcard.js';

const ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);
const context = {
  createdAt: '2026-07-25T05:15:00.000Z',
  documentId: 'document-property-test',
  revisionId: 'revision-property-test',
} as const;

async function importFixture(name: string) {
  const result = importZeroOmegaBackup(await readFile(new URL(name, ROOT), 'utf8'), context);
  if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
  return result.candidate;
}

describe('reference interpreter semantic properties', () => {
  it('host suffix wildcards match roots and descendants but not attacker suffixes', () => {
    for (let index = 0; index < 128; index += 1) {
      const root = `zone-${index}.example.invalid`;
      expect(matchesHostPattern(`*.${root}`, root)).toBe(true);
      expect(matchesHostPattern(`*.${root}`, `api.${root}`)).toBe(true);
      expect(matchesHostPattern(`.${root}`, `deep.api.${root}`)).toBe(true);
      expect(matchesHostPattern(`*.${root}`, `${root}.attacker.invalid`)).toBe(false);
    }
  });

  it('IPv4 /24 matching contains every address in the subnet and excludes neighbors', () => {
    for (let host = 0; host <= 255; host += 1) {
      expect(ipMatchesPrefix(`192.0.2.${host}`, '192.0.2.0', 24)).toBe(true);
    }
    expect(ipMatchesPrefix('192.0.1.255', '192.0.2.0', 24)).toBe(false);
    expect(ipMatchesPrefix('192.0.3.0', '192.0.2.0', 24)).toBe(false);
  });

  it('repeated graph evaluation does not mutate ProfileSpec bytes', async () => {
    const spec = await importFixture('minimal-profile-types.json');
    const switchProfile = spec.profiles.find((profile) => profile.name === 'switch');
    if (!switchProfile) throw new Error('missing switch profile');
    const before = serializeProfileSpec(spec);

    for (let index = 0; index < 200; index += 1) {
      const matching = index % 2 === 0;
      evaluateDifferentialVector(spec, {
        id: `immutability-${index}`,
        startRoute: { kind: 'profile', profileId: switchProfile.id },
        request: {
          url: matching
            ? `https://node-${index}.example.invalid/path`
            : `https://node-${index}.unrelated.invalid/path`,
          host: matching
            ? `node-${index}.example.invalid`
            : `node-${index}.unrelated.invalid`,
          scheme: 'https',
        },
      });
    }

    expect(serializeProfileSpec(spec)).toBe(before);
  });

  it('rule-list parsing is deterministic and leaves source content unchanged', async () => {
    const spec = await importFixture('rule-list-formats.json');
    for (const profile of spec.profiles) {
      if (profile.kind !== 'rule-list') continue;
      const source = spec.ruleSources.find((candidate) => candidate.id === profile.sourceId);
      if (!source) throw new Error(`missing source ${profile.sourceId}`);
      const sourceBefore = JSON.stringify(source);
      const first = parseRuleList(spec, profile, source);
      const second = parseRuleList(spec, profile, source);
      expect(first).toEqual(second);
      expect(JSON.stringify(source)).toBe(sourceBefore);
    }
  });
});
