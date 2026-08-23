import { readFile } from 'node:fs/promises';

import { exportZeroOmegaBackup, importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import { compilePac } from '@zeroomega-nex/pac-compiler';
import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
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
const PASSWORD_SENTINEL = 'mig017-password-sentinel-6d381f59';
const RULE_HEADER_SENTINEL = 'mig017-rule-header-sentinel-83c294f1';
const PAC_HEADER_SENTINEL = 'mig017-pac-header-sentinel-fd276b45';
const RAW_SECRETS = [PASSWORD_SENTINEL, RULE_HEADER_SENTINEL, PAC_HEADER_SENTINEL] as const;

type LegacyHeader = {
  name: string;
  value: string;
};

type SensitiveFixture = {
  '+authenticated-proxy': {
    auth: Record<string, { username: string; password: string }>;
  };
  '+header-rule-list': {
    headers: LegacyHeader[];
  };
  '+header-pac': {
    headers: LegacyHeader[];
  };
};

const importContext = {
  createdAt: '2026-08-07T10:20:00.000Z',
  documentId: 'document-mig-01-7-sensitive-surfaces',
  revisionId: 'revision-mig-01-7-sensitive-surfaces',
  deviceId: 'device-mig-01-7',
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

function withDistinctSensitiveSentinels(source: string): string {
  const fixture = JSON.parse(source) as SensitiveFixture;
  for (const auth of Object.values(fixture['+authenticated-proxy'].auth)) {
    auth.password = PASSWORD_SENTINEL;
  }
  const ruleHeader = fixture['+header-rule-list'].headers.find(
    (header) => header.name === 'X-Fixture-Token',
  );
  if (!ruleHeader) throw new Error('X-Fixture-Token fixture header is missing');
  ruleHeader.value = RULE_HEADER_SENTINEL;

  const pacHeader = fixture['+header-pac'].headers.find(
    (header) => header.name === 'Authorization',
  );
  if (!pacHeader) throw new Error('Authorization fixture header is missing');
  pacHeader.value = PAC_HEADER_SENTINEL;
  return JSON.stringify(fixture);
}

function expectNoRawSecrets(label: string, value: unknown): void {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error(`${label} was not serializable`);
  for (const secret of RAW_SECRETS) {
    expect(serialized, `${label} leaked raw secret material`).not.toContain(secret);
  }
}

describe('MIG-01.7 sensitive public-surface leak gate', () => {
  it('confines raw auth/header values to SecretStore across report, workflow, PAC, and export surfaces', async () => {
    const source = withDistinctSensitiveSentinels(await readFile(SENSITIVE_FIXTURE_URL, 'utf8'));
    const imported = importZeroOmegaBackup(source, importContext);
    if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));

    expect(imported.secretMaterials.length).toBeGreaterThanOrEqual(RAW_SECRETS.length);
    for (const secret of RAW_SECRETS) {
      expect(imported.secretMaterials.some((material) => material.value === secret)).toBe(true);
    }
    expectNoRawSecrets('migration report', imported.report);
    expectNoRawSecrets('inactive candidate', imported.candidate);

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
    expectNoRawSecrets('accept-import command result', accepted);
    for (const material of imported.secretMaterials) {
      expect(await secretStore.getSecret(material.ref)).toBe(material.value);
    }

    const activated: ProfileSpec[] = [];
    const driver: ProfileWorkflowActivationDriver = {
      async activate(candidate) {
        activated.push(structuredClone(candidate));
        return { snapshotId: 'snapshot-mig-01-7-sensitive-surfaces' };
      },
      async rollback() {},
    };
    const applied = await applyProfileWorkflow(repository, driver, {
      applyId: 'apply-mig-01-7-sensitive-surfaces',
      revisionId: 'revision-mig-01-7-sensitive-surfaces-applied',
      startedAt: '2026-08-07T10:21:00.000Z',
      completedAt: '2026-08-07T10:21:01.000Z',
      deviceId: 'device-mig-01-7',
    });
    expect(applied.status).toBe('applied');
    if (applied.status !== 'applied') throw new Error(applied.message);

    expectNoRawSecrets('Apply command result', applied);
    expectNoRawSecrets('activation candidate', activated[0]);
    expectNoRawSecrets('workflow repository artifact', await repository.read());

    const authenticated = imported.candidate.profiles.find(
      (profile) => profile.name === 'authenticated-proxy',
    );
    if (!authenticated) throw new Error('authenticated-proxy fixture profile is missing');
    const compiled = compilePac(imported.candidate, {
      kind: 'profile',
      profileId: authenticated.id,
    });
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) throw new Error(JSON.stringify(compiled.issues, null, 2));
    expectNoRawSecrets('compiled PAC artifact', compiled.artifact);
    expect(compiled.artifact.script).not.toMatch(/passwordSecretRef|secretRef|Authorization/u);

    const exported = exportZeroOmegaBackup(applied.state.applied, {
      createdAt: '2026-08-07T10:22:00.000Z',
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues, null, 2));
    expect(exported.omittedSecretCount).toBeGreaterThan(0);
    expectNoRawSecrets('ordinary .bak export result', exported);
    expect(exported.content).not.toMatch(
      /passwordSecretRef|secretRef|Authorization|X-Fixture-Token/u,
    );

    const reimported = importZeroOmegaBackup(exported.content, {
      ...importContext,
      createdAt: '2026-08-07T10:23:00.000Z',
      revisionId: 'revision-mig-01-7-sensitive-reimport',
    });
    expect(reimported.ok).toBe(true);
    if (!reimported.ok) throw new Error(JSON.stringify(reimported.report, null, 2));
    expect(reimported.secretMaterials).toHaveLength(0);
    expectNoRawSecrets('sanitized re-import report', reimported.report);
    expectNoRawSecrets('sanitized re-import candidate', reimported.candidate);

    const reexported = exportZeroOmegaBackup(reimported.candidate, {
      createdAt: '2026-08-07T10:24:00.000Z',
    });
    expect(reexported.ok).toBe(true);
    if (!reexported.ok) throw new Error(JSON.stringify(reexported.issues, null, 2));
    expect(reexported.content).toBe(exported.content);
  });
});
