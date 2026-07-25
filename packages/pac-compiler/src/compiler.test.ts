import { readFile } from 'node:fs/promises';

import { importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { compilePac } from './compiler.js';
import { evaluatePacScript } from './harness.js';

const ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);
const context = {
  createdAt: '2026-07-25T06:00:00.000Z',
  documentId: 'document-pac-test',
  revisionId: 'revision-pac-test',
} as const;

async function importedFixture(name: string): Promise<ProfileSpec> {
  const source = await readFile(new URL(name, ROOT), 'utf8');
  const imported = importZeroOmegaBackup(source, context);
  if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));
  return imported.candidate;
}

function profileRoute(spec: ProfileSpec, name: string): ProfileRouteTarget {
  const profile = spec.profiles.find((candidate) => candidate.name === name);
  if (!profile) throw new Error(`missing profile ${name}`);
  return { kind: 'profile', profileId: profile.id };
}

describe('deterministic PAC compiler', () => {
  it('compiles an imported switch graph and executes scheme-specific proxy routes', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const result = compilePac(spec, profileRoute(spec, 'switch'));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));

    expect(
      evaluatePacScript(result.artifact.script, {
        url: 'https://api.example.invalid/path',
        host: 'api.example.invalid',
      }),
    ).toBe('HTTPS proxy.example.invalid:8443');
    expect(
      evaluatePacScript(result.artifact.script, {
        url: 'https://public.unrelated.invalid/path',
        host: 'public.unrelated.invalid',
      }),
    ).toBe('DIRECT');
    expect(result.artifact.stats.profileCount).toBe(2);
    expect(result.artifact.stats.endpointCount).toBe(4);
  });

  it('compiles imported inline AutoProxy rules with exclusive priority', async () => {
    const spec = await importedFixture('rule-list-formats.json');
    const result = compilePac(spec, profileRoute(spec, 'autoproxy-base64'));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));

    expect(
      evaluatePacScript(result.artifact.script, {
        url: 'https://direct.example.invalid/',
        host: 'direct.example.invalid',
      }),
    ).toBe('DIRECT');
    expect(
      evaluatePacScript(result.artifact.script, {
        url: 'https://api.base64.example.invalid/',
        host: 'api.base64.example.invalid',
      }),
    ).toBe('PROXY proxy.example.invalid:8080');
    expect(result.artifact.stats.ruleListRuleCount).toBe(2);
  });

  it('produces byte-identical output for identical input and options', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const route = profileRoute(spec, 'switch');
    const first = compilePac(spec, route);
    const second = compilePac(spec, route);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error('expected successful compilation');
    expect(first.artifact.script).toBe(second.artifact.script);
    expect(first.artifact.stats).toEqual(second.artifact.stats);
  });

  it('blocks target-dependent URL rules by default and allows explicit target compilation', async () => {
    const spec = await importedFixture('minimal-condition-types.json');
    const route = profileRoute(spec, 'condition-matrix');
    const blocked = compilePac(spec, route);
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error('expected target-dependent block');
    expect(blocked.issues.map((issue) => issue.code)).toContain(
      'condition.url-regex-target-dependent',
    );

    const allowed = compilePac(spec, route, { allowTargetDependent: true });
    expect(allowed.ok).toBe(true);
    if (!allowed.ok) throw new Error(JSON.stringify(allowed.issues, null, 2));
    expect(allowed.artifact.capability).toBe('target-dependent');
  });

  it('never serializes proxy credentials or secret references into PAC output', async () => {
    const spec = await importedFixture('credentials-and-headers.redacted.json');
    const result = compilePac(spec, profileRoute(spec, 'authenticated-proxy'));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));
    expect(result.artifact.script).not.toContain('passwordSecretRef');
    expect(result.artifact.script).not.toContain('<redacted>');
    expect(result.artifact.script).not.toContain('Authorization');
    expect(
      evaluatePacScript(result.artifact.script, {
        url: 'http://example.invalid/',
        host: 'example.invalid',
      }),
    ).toBe('PROXY proxy.example.invalid:8080');
  });

  it('rejects unsupported System, remote rule content, and nested PAC routes', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const system = compilePac(spec, { kind: 'system' });
    expect(system.ok).toBe(false);
    if (system.ok) throw new Error('expected unsupported system route');
    expect(system.issues[0]?.code).toBe('route.system-unsupported');

    const pac = compilePac(spec, profileRoute(spec, 'pac'));
    expect(pac.ok).toBe(false);
    if (pac.ok) throw new Error('expected unsupported PAC nesting');
    expect(pac.issues.map((issue) => issue.code)).toContain('profile.pac-nesting-unsupported');

    const remote = compilePac(spec, profileRoute(spec, 'rule-autoproxy'));
    expect(remote.ok).toBe(false);
    if (remote.ok) throw new Error('expected unavailable rule-source block');
    expect(remote.issues.map((issue) => issue.code)).toContain('rule-source.content-unavailable');
  });

  it('enforces script, profile, and rule budgets without emitting partial artifacts', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const route = profileRoute(spec, 'switch');

    const profiles = compilePac(spec, route, { budgets: { maxProfiles: 1 } });
    expect(profiles.ok).toBe(false);
    if (profiles.ok) throw new Error('expected profile budget failure');
    expect(profiles.issues[0]?.code).toBe('budget.profile-count-exceeded');

    const rules = compilePac(spec, route, { budgets: { maxRules: 0 } });
    expect(rules.ok).toBe(false);
    if (rules.ok) throw new Error('expected rule budget failure');
    expect(rules.issues[0]?.code).toBe('budget.rule-count-exceeded');

    const bytes = compilePac(spec, route, { budgets: { maxScriptBytes: 100 } });
    expect(bytes.ok).toBe(false);
    if (bytes.ok) throw new Error('expected byte budget failure');
    expect(bytes.issues[0]?.code).toBe('budget.script-bytes-exceeded');
  });
});
