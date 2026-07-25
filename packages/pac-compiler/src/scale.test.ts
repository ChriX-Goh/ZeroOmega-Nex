import { readFile } from 'node:fs/promises';

import { importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { compilePac } from './compiler.js';
import { evaluatePacScript } from './harness.js';

const FIXTURE = new URL(
  '../../../fixtures/zeroomega-v2/large-representative.json',
  import.meta.url,
);

async function largeSpec(): Promise<ProfileSpec> {
  const imported = importZeroOmegaBackup(await readFile(FIXTURE, 'utf8'), {
    createdAt: '2026-07-25T07:30:00.000Z',
    documentId: 'document-pac-scale',
    revisionId: 'revision-pac-scale',
  });
  if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));
  return imported.candidate;
}

describe('large PAC compilation', () => {
  it('compiles the 1,024-rule fixture through reachable graph pruning', async () => {
    const spec = await largeSpec();
    const start = spec.profiles.find((profile) => profile.name === 'switch-00');
    if (!start) throw new Error('missing switch-00');

    const result = compilePac(
      spec,
      { kind: 'profile', profileId: start.id },
      { allowTargetDependent: true },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));

    expect(result.artifact.stats).toMatchObject({
      profileCount: 25,
      endpointCount: 24,
      conditionCount: 200,
      ruleListRuleCount: 0,
    });
    expect(result.artifact.stats.scriptBytes).toBeLessThan(1_000_000);

    expect(
      evaluatePacScript(result.artifact.script, {
        url: 'https://host-00-004.example.invalid/path',
        host: 'host-00-004.example.invalid',
      }),
    ).toBe('PROXY proxy-04.example.invalid:10004');
    expect(
      evaluatePacScript(result.artifact.script, {
        url: 'https://not-in-policy.example.invalid/path',
        host: 'not-in-policy.example.invalid',
      }),
    ).toBe('DIRECT');
  });

  it('rejects the same reachable graph when an intentionally lower rule budget is applied', async () => {
    const spec = await largeSpec();
    const start = spec.profiles.find((profile) => profile.name === 'switch-00');
    if (!start) throw new Error('missing switch-00');
    const result = compilePac(
      spec,
      { kind: 'profile', profileId: start.id },
      {
        allowTargetDependent: true,
        budgets: { maxRules: 199 },
      },
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected rule budget failure');
    expect(result.issues[0]?.code).toBe('budget.rule-count-exceeded');
  });
});
