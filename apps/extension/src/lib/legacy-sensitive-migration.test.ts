import { readFile } from 'node:fs/promises';

import { exportZeroOmegaBackup, importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileSpec, RuleSourceHeader } from '@zeroomega-nex/profile-spec';
import {
  acceptProfileWorkflowImport,
  applyProfileWorkflow,
  createProfileWorkflowState,
  MemoryProfileWorkflowRepository,
  type ProfileWorkflowActivationDriver,
  type ProfileWorkflowSecretStore,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

const SENSITIVE_FIXTURE_URL = new URL(
  '../../../../fixtures/zeroomega-v2/credentials-and-headers.redacted.json',
  import.meta.url,
);

const importContext = {
  createdAt: '2026-08-07T03:20:00.000Z',
  documentId: 'document-mig-01-sensitive',
  revisionId: 'revision-mig-01-sensitive',
  deviceId: 'device-mig-01',
} as const;

class MemorySecretStore implements ProfileWorkflowSecretStore {
  readonly values = new Map<string, string>();

  async getSecret(secretRef: string): Promise<string | undefined> {
    return this.values.get(secretRef);
  }

  async putSecret(secretRef: string, secret: string): Promise<void> {
    this.values.set(secretRef, secret);
  }

  async removeSecret(secretRef: string): Promise<void> {
    this.values.delete(secretRef);
  }
}

function literalHeader(headers: readonly RuleSourceHeader[] | undefined, name: string) {
  return headers?.find((header) => header.name === name && header.value.kind === 'literal');
}

function secretHeader(headers: readonly RuleSourceHeader[] | undefined, name: string) {
  return headers?.find((header) => header.name === name && header.value.kind === 'secret');
}

describe('MIG-01 sensitive migration transaction', () => {
  it('keeps auth and sensitive headers out of ProfileSpec values through accept and Apply', async () => {
    const source = await readFile(SENSITIVE_FIXTURE_URL, 'utf8');
    const imported = importZeroOmegaBackup(source, importContext);
    if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));

    expect(imported.report.items.map((item) => item.code)).toEqual(
      expect.arrayContaining(['header.duplicate-last-wins', 'header.empty-name-ignored']),
    );

    const endpoint = imported.candidate.proxyEndpoints.find(
      (candidate) => candidate.host === 'proxy.example.invalid' && candidate.port === 8080,
    );
    expect(endpoint?.credential?.passwordSecretRef).toBeTruthy();
    const passwordSecretRef = endpoint?.credential?.passwordSecretRef;
    expect(
      imported.secretMaterials.some(
        (material) => material.kind === 'proxy-password' && material.ref === passwordSecretRef,
      ),
    ).toBe(true);

    const ruleSource = imported.candidate.ruleSources.find(
      (candidate) => candidate.name === 'header-rule-list rules',
    );
    expect(literalHeader(ruleSource?.headers, 'Accept')).toMatchObject({
      value: { kind: 'literal', value: 'text/plain' },
    });
    expect(literalHeader(ruleSource?.headers, 'X-Duplicate-Fixture')).toMatchObject({
      value: { kind: 'literal', value: 'last' },
    });
    expect(
      ruleSource?.headers?.filter((header) => header.name === 'X-Duplicate-Fixture'),
    ).toHaveLength(1);
    expect(ruleSource?.headers?.some((header) => header.name.length === 0)).toBe(false);
    const tokenHeader = secretHeader(ruleSource?.headers, 'X-Fixture-Token');
    expect(tokenHeader?.value.kind).toBe('secret');
    if (!tokenHeader || tokenHeader.value.kind !== 'secret') {
      throw new Error('rule-list sensitive header did not map to a secret reference');
    }
    const tokenSecretRef = tokenHeader.value.secretRef;
    expect(
      imported.secretMaterials.some(
        (material) => material.kind === 'request-header' && material.ref === tokenSecretRef,
      ),
    ).toBe(true);

    const pac = imported.candidate.profiles.find((profile) => profile.name === 'header-pac');
    expect(pac?.kind).toBe('pac');
    if (!pac || pac.kind !== 'pac') throw new Error('PAC fixture did not import');
    const authorization = secretHeader(pac.headers, 'Authorization');
    expect(authorization?.value.kind).toBe('secret');

    const initial = structuredClone(imported.candidate);
    initial.settings.interface.confirmDeletion = !initial.settings.interface.confirmDeletion;
    const initialState = createProfileWorkflowState(initial);
    const repository = new MemoryProfileWorkflowRepository(initialState);
    const secretStore = new MemorySecretStore();

    const accepted = await acceptProfileWorkflowImport(
      repository,
      initialState,
      imported.candidate,
      imported.secretMaterials,
      secretStore,
    );
    expect(accepted.status).toBe('accepted');
    if (accepted.status !== 'accepted') throw new Error(accepted.message);
    for (const material of imported.secretMaterials) {
      expect(await secretStore.getSecret(material.ref)).toBe(material.value);
    }

    const acceptedEndpoint = accepted.state.draft.proxyEndpoints.find(
      (candidate) => candidate.id === endpoint?.id,
    );
    expect(acceptedEndpoint?.credential?.passwordSecretRef).toBe(passwordSecretRef);
    expect(acceptedEndpoint).not.toHaveProperty('credential.password');

    const activated: ProfileSpec[] = [];
    const driver: ProfileWorkflowActivationDriver = {
      async activate(candidate) {
        activated.push(structuredClone(candidate));
        return { snapshotId: 'snapshot-mig-01-sensitive' };
      },
      async rollback() {},
    };
    const applied = await applyProfileWorkflow(repository, driver, {
      applyId: 'apply-mig-01-sensitive',
      revisionId: 'revision-mig-01-sensitive-applied',
      startedAt: '2026-08-07T03:21:00.000Z',
      completedAt: '2026-08-07T03:21:01.000Z',
      deviceId: 'device-mig-01',
    });
    expect(applied.status).toBe('applied');
    if (applied.status !== 'applied') throw new Error(applied.message);

    const activatedEndpoint = activated[0]?.proxyEndpoints.find(
      (candidate) => candidate.id === endpoint?.id,
    );
    expect(activatedEndpoint?.credential?.passwordSecretRef).toBe(passwordSecretRef);
    expect(activatedEndpoint).not.toHaveProperty('credential.password');
    expect(applied.state.applied.proxyEndpoints).toEqual(activated[0]?.proxyEndpoints);
    expect((await repository.read())?.applied.proxyEndpoints).toEqual(
      applied.state.applied.proxyEndpoints,
    );
  });

  it('ordinary .bak export strips secrets and reimports the sanitized semantics', async () => {
    const source = await readFile(SENSITIVE_FIXTURE_URL, 'utf8');
    const imported = importZeroOmegaBackup(source, importContext);
    if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));

    const exported = exportZeroOmegaBackup(imported.candidate, {
      createdAt: '2026-08-07T03:22:00.000Z',
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues, null, 2));

    expect(exported.omittedSecretCount).toBeGreaterThan(0);
    expect(exported.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['secret.proxy-credential-omitted', 'secret.request-header-omitted']),
    );
    expect(exported.content).not.toContain('<redacted>');
    expect(exported.content).not.toContain('passwordSecretRef');
    expect(exported.content).not.toContain('secretRef');
    expect(exported.content).not.toContain('Authorization');
    expect(exported.content).not.toContain('X-Fixture-Token');

    const reimported = importZeroOmegaBackup(exported.content, {
      ...importContext,
      createdAt: '2026-08-07T03:23:00.000Z',
      revisionId: 'revision-mig-01-sensitive-sanitized',
    });
    expect(reimported.ok).toBe(true);
    if (!reimported.ok) throw new Error(JSON.stringify(reimported.report, null, 2));
    expect(reimported.secretMaterials).toHaveLength(0);

    const endpoint = reimported.candidate.proxyEndpoints.find(
      (candidate) => candidate.host === 'proxy.example.invalid' && candidate.port === 8080,
    );
    expect(endpoint?.credential).toBeUndefined();

    const ruleSource = reimported.candidate.ruleSources.find(
      (candidate) => candidate.name === 'header-rule-list rules',
    );
    expect(ruleSource?.headers?.map((header) => header.name)).toEqual([
      'Accept',
      'X-Duplicate-Fixture',
    ]);
    expect(literalHeader(ruleSource?.headers, 'X-Duplicate-Fixture')).toMatchObject({
      value: { kind: 'literal', value: 'last' },
    });

    const pac = reimported.candidate.profiles.find((profile) => profile.name === 'header-pac');
    expect(pac?.kind).toBe('pac');
    if (!pac || pac.kind !== 'pac') throw new Error('sanitized PAC fixture did not reimport');
    expect(pac.headers).toBeUndefined();
  });
});
