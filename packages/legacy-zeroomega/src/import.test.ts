import { readFile } from 'node:fs/promises';

import { serializeProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { importZeroOmegaBackup } from './index.js';

const FIXTURE_ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);

async function fixture(name: string): Promise<string> {
  return readFile(new URL(name, FIXTURE_ROOT), 'utf8');
}

const context = {
  createdAt: '2026-07-25T02:00:00.000Z',
  documentId: 'document-import-test',
  revisionId: 'revision-import-test',
  deviceId: 'device-import-test',
} as const;

function codes(result: ReturnType<typeof importZeroOmegaBackup>): string[] {
  return result.report.items.map((item) => item.code);
}

describe('ZeroOmega schema-v2 importer', () => {
  it('imports all pinned profile types into an inactive candidate', async () => {
    const result = importZeroOmegaBackup(await fixture('minimal-profile-types.json'), context);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));

    expect(result.activation).toBe('inactive-candidate');
    expect(result.candidate.profiles).toHaveLength(9);
    expect(result.candidate.proxyEndpoints).toHaveLength(4);
    expect(result.candidate.ruleSources).toHaveLength(4);
    expect(result.candidate.profiles.map((profile) => profile.kind)).toEqual([
      'fixed',
      'pac',
      'auto-detect',
      'switch',
      'switch',
      'rule-list',
      'rule-list',
      'rule-list',
      'rule-list',
    ]);
    expect(result.candidate.settings.quickSwitch.routes).toContainEqual({ kind: 'direct' });
    expect(result.report.profileCount).toBe(9);
    expect(result.report.summary.rejected).toBe(0);
  });

  it('imports a base64-encoded backup through the full migration pipeline', async () => {
    const source = await fixture('minimal-profile-types.json');
    const result = importZeroOmegaBackup(btoa(source), context);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
    expect(result.report.encoding).toBe('base64-json');
    expect(result.candidate.profiles).toHaveLength(9);
  });

  it('maps all twelve condition families and preserves switch-rule order', async () => {
    const result = importZeroOmegaBackup(await fixture('minimal-condition-types.json'), context);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));

    const profile = result.candidate.profiles.find((candidate) => candidate.kind === 'switch');
    expect(profile?.kind).toBe('switch');
    if (!profile || profile.kind !== 'switch') throw new Error('switch profile not imported');
    expect(profile.rules.map((rule) => rule.condition.kind)).toEqual([
      'false',
      'url-regex',
      'url-wildcard',
      'host-regex',
      'host-wildcard',
      'bypass',
      'keyword',
      'ip',
      'ip',
      'host-levels',
      'weekday',
      'weekday',
      'time',
      'true',
    ]);
    expect(result.report.summary.targetDependent).toBeGreaterThan(0);
  });

  it('isolates proxy passwords and sensitive rule/PAC headers from ProfileSpec and reports', async () => {
    const source = await fixture('credentials-and-headers.redacted.json');
    const result = importZeroOmegaBackup(source, context);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));

    expect(result.secretMaterials.length).toBeGreaterThan(0);
    expect(result.report.containsSecrets).toBe(true);
    const candidateText = serializeProfileSpec(result.candidate);
    const reportText = JSON.stringify(result.report);
    expect(candidateText).not.toContain('"password"');
    expect(reportText).not.toContain('<redacted>');
    expect(result.secretMaterials.some((item) => item.kind === 'proxy-password')).toBe(true);
    expect(result.secretMaterials.some((item) => item.kind === 'request-header')).toBe(true);
    expect(
      result.candidate.proxyEndpoints.some(
        (endpoint) => endpoint.credential?.username === '<redacted>',
      ),
    ).toBe(true);

    const pac = result.candidate.profiles.find((profile) => profile.kind === 'pac');
    if (pac?.kind === 'pac') {
      expect(pac.headers?.some((header) => header.value.kind === 'secret')).toBe(true);
    }
  });

  it('maps built-in Direct/System colors without creating user profiles', async () => {
    const result = importZeroOmegaBackup(await fixture('builtin-profile-colors.json'), context);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
    expect(result.candidate.settings.interface.builtInProfiles).toEqual({
      direct: { color: '#aabbcc' },
      system: { color: '#102030' },
    });
    expect(result.candidate.profiles.every((profile) => profile.name !== 'direct')).toBe(true);
  });

  it('preserves IDN, IPv4/IPv6, port, and malformed bypass source evidence', async () => {
    const result = importZeroOmegaBackup(await fixture('network-edge-conditions.json'), context);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
    expect(result.report.summary.targetDependent).toBeGreaterThan(0);

    const fixed = result.candidate.profiles.find((profile) => profile.kind === 'fixed');
    if (!fixed || fixed.kind !== 'fixed') throw new Error('fixed profile not imported');
    expect(fixed.bypass.some((entry) => entry.pattern.includes('not-a-prefix'))).toBe(true);
  });

  it('imports Switchy and AutoProxy aliases and decodes embedded base64 lists', async () => {
    const result = importZeroOmegaBackup(await fixture('rule-list-formats.json'), context);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
    expect(new Set(result.candidate.ruleSources.map((source) => source.format))).toEqual(
      new Set(['switchy', 'autoproxy']),
    );
    expect(codes(result)).toContain('rule-source.base64-decoded');
  });

  it('imports the deterministic 36-profile and 1,024-rule scale fixture', async () => {
    const result = importZeroOmegaBackup(await fixture('large-representative.json'), context);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
    expect(result.candidate.profiles).toHaveLength(36);
    const switchRuleCount = result.candidate.profiles.reduce(
      (total, profile) => total + (profile.kind === 'switch' ? profile.rules.length : 0),
      0,
    );
    expect(switchRuleCount).toBe(1024);
  });

  it.each([
    'invalid/missing-reference.json',
    'invalid/cyclic-reference.json',
    'invalid/key-name-mismatch.json',
    'invalid/duplicate-name.json',
    'invalid/reserved-name.json',
    'invalid/unknown-profile.json',
    'invalid/unknown-condition.json',
    'invalid/wrong-schema.json',
    'invalid/no-profiles.json',
    'invalid/corrupt-json.txt',
  ])('rejects unsafe fixture %s without returning a candidate', async (name) => {
    const result = importZeroOmegaBackup(await fixture(name), context);
    expect(result.ok).toBe(false);
    expect(result.report.summary.rejected).toBeGreaterThan(0);
    expect('candidate' in result).toBe(false);
  });

  it.each(['invalid/unredacted-secret.json', 'invalid/unredacted-header.json'])(
    'accepts real user secrets from %s but extracts them from the candidate',
    async (name) => {
      const source = await fixture(name);
      const result = importZeroOmegaBackup(source, context);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
      expect(result.secretMaterials.length).toBeGreaterThan(0);
      const candidateText = serializeProfileSpec(result.candidate);
      const reportText = JSON.stringify(result.report);
      for (const material of result.secretMaterials) {
        expect(candidateText).not.toContain(material.value);
        expect(reportText).not.toContain(material.value);
      }
    },
  );

  it('returns deterministic IDs and candidate bytes for identical context', async () => {
    const source = await fixture('minimal-profile-types.json');
    const first = importZeroOmegaBackup(source, context);
    const second = importZeroOmegaBackup(source, context);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error('expected successful import');
    expect(serializeProfileSpec(first.candidate)).toBe(serializeProfileSpec(second.candidate));
    expect(first.secretMaterials.map((item) => item.ref)).toEqual(
      second.secretMaterials.map((item) => item.ref),
    );
  });
});
