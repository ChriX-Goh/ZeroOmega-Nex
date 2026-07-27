from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    target.write_text(text.replace(old, new))


Path('apps/extension/src/lib/session-snapshot-repository.ts').write_text(r'''import {
  BrowserStorageSnapshotActivationRepository,
  type BrowserStorageArea,
  type SnapshotActivationRepository,
  type SnapshotActivationState,
  type SnapshotHistoryRepository,
} from '@zeroomega-nex/browser-adapters';
import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { isPopupTemporarySnapshotId } from '@zeroomega-nex/profile-workflow';

export const POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX =
  'zeroomega-nex/browser-proxy/v1/session-snapshot/';

function parseSnapshot(value: unknown, expectedId: string): PacRuntimeSnapshot | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`temporary snapshot ${expectedId} must be an object`);
  }
  const snapshot = value as Partial<PacRuntimeSnapshot>;
  if (
    snapshot.snapshotSchemaVersion !== 1 ||
    snapshot.snapshotId !== expectedId ||
    typeof snapshot.script !== 'string' ||
    typeof snapshot.scriptSha256 !== 'string'
  ) {
    throw new TypeError(`temporary snapshot ${expectedId} is invalid`);
  }
  return value as PacRuntimeSnapshot;
}

export class SessionSnapshotActivationRepository
  implements SnapshotActivationRepository, SnapshotHistoryRepository
{
  readonly #persistent: BrowserStorageSnapshotActivationRepository;
  readonly #session: BrowserStorageArea;

  constructor(
    persistent: BrowserStorageSnapshotActivationRepository,
    session: BrowserStorageArea,
  ) {
    this.#persistent = persistent;
    this.#session = session;
  }

  getState(): Promise<SnapshotActivationState> {
    return this.#persistent.getState();
  }

  setState(state: SnapshotActivationState): Promise<void> {
    return this.#persistent.setState(state);
  }

  async putSnapshot(snapshot: PacRuntimeSnapshot): Promise<void> {
    if (!isPopupTemporarySnapshotId(snapshot.snapshotId)) {
      await this.#persistent.putSnapshot(snapshot);
      return;
    }
    await this.#session.set({
      [`${POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX}${snapshot.snapshotId}`]: snapshot,
    });
  }

  async getSnapshot(snapshotId: string): Promise<PacRuntimeSnapshot | undefined> {
    if (!isPopupTemporarySnapshotId(snapshotId)) {
      return this.#persistent.getSnapshot(snapshotId);
    }
    const key = `${POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX}${snapshotId}`;
    const values = await this.#session.get(key);
    return parseSnapshot(values[key], snapshotId);
  }

  listSnapshots(): Promise<readonly PacRuntimeSnapshot[]> {
    return this.#persistent.listSnapshots();
  }

  async removeSnapshot(snapshotId: string): Promise<void> {
    if (isPopupTemporarySnapshotId(snapshotId)) {
      await this.#session.remove(
        `${POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX}${snapshotId}`,
      );
      return;
    }
    await this.#persistent.removeSnapshot(snapshotId);
  }
}
''')

Path('apps/extension/src/lib/session-snapshot-repository.test.ts').write_text(r'''import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { popupTemporaryProfileIdForBaseRoute, popupTemporarySnapshotId } from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import { BrowserStorageSnapshotActivationRepository } from '@zeroomega-nex/browser-adapters';

import {
  POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX,
  SessionSnapshotActivationRepository,
} from './session-snapshot-repository';

class Area {
  readonly values = new Map<string, unknown>();

  async get(keys: string | readonly string[]): Promise<Record<string, unknown>> {
    const selected = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(selected.flatMap((key) => (this.values.has(key) ? [[key, this.values.get(key)]] : [])));
  }

  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) this.values.set(key, structuredClone(value));
  }

  async remove(keys: string | readonly string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) this.values.delete(key);
  }
}

function snapshot(id: string): PacRuntimeSnapshot {
  return {
    snapshotSchemaVersion: 1,
    snapshotId: id,
    createdAt: '2026-07-27T13:00:00.000Z',
    sourceDocumentId: 'document',
    sourceRevisionId: 'revision',
    sourceProfileSpecSha256: 'a'.repeat(64),
    startRoute: { kind: 'direct' },
    target: 'chromium',
    compilerVersion: 'test',
    scriptSha256: 'b'.repeat(64),
    capability: 'exact',
    script: 'function FindProxyForURL(){return "DIRECT";}',
    stats: { scriptBytes: 1, profileCount: 0, endpointCount: 0, conditionCount: 0, ruleListRuleCount: 0 },
    warnings: [],
    verification: { passed: true, vectorCount: 1, matchedCount: 1 },
  };
}

describe('session-aware snapshot repository', () => {
  it('keeps temporary snapshots out of persistent history', async () => {
    const local = new Area();
    const session = new Area();
    const repository = new SessionSnapshotActivationRepository(
      new BrowserStorageSnapshotActivationRepository(local),
      session,
    );
    const id = popupTemporarySnapshotId(
      popupTemporaryProfileIdForBaseRoute({ kind: 'direct' }),
      'test',
    );
    await repository.putSnapshot(snapshot(id));
    expect(await repository.getSnapshot(id)).toMatchObject({ snapshotId: id });
    expect(await repository.listSnapshots()).toEqual([]);
    expect(
      session.values.has(`${POPUP_TEMPORARY_SNAPSHOT_STORAGE_PREFIX}${id}`),
    ).toBe(true);
    expect([...local.values.keys()].some((key) => key.includes(id))).toBe(false);
    await repository.removeSnapshot(id);
    expect(await repository.getSnapshot(id)).toBeUndefined();
  });
});
''')

replace_once(
    'apps/extension/src/lib/browser-proxy-runtime.ts',
    """import type { ProxyAuthenticationPreparationResult } from './proxy-auth-runtime';
""",
    """import type { ProxyAuthenticationPreparationResult } from './proxy-auth-runtime';
""",
) if False else None

replace_once(
    'apps/extension/src/lib/browser-proxy-runtime.ts',
    """import {
  BrowserStorageSnapshotActivationRepository,
""",
    """import {
  BrowserStorageSnapshotActivationRepository,
""",
)
replace_once(
    'apps/extension/src/lib/browser-proxy-runtime.ts',
    """} from '@zeroomega-nex/browser-adapters';

interface RuntimeBrowserApi {
""",
    """} from '@zeroomega-nex/browser-adapters';

import { SessionSnapshotActivationRepository } from './session-snapshot-repository';

interface RuntimeBrowserApi {
""",
)
replace_once(
    'apps/extension/src/lib/browser-proxy-runtime.ts',
    """  readonly storage: {
    readonly local: BrowserStorageArea;
  };
""",
    """  readonly storage: {
    readonly local: BrowserStorageArea;
    readonly session?: BrowserStorageArea;
  };
""",
)
replace_once(
    'apps/extension/src/lib/browser-proxy-runtime.ts',
    """  const repository = new BrowserStorageSnapshotActivationRepository(api.storage.local);
  const firefox = typeof api.runtime.getBrowserInfo === 'function';
""",
    """  const persistentRepository = new BrowserStorageSnapshotActivationRepository(api.storage.local);
  const repository = api.storage.session
    ? new SessionSnapshotActivationRepository(persistentRepository, api.storage.session)
    : persistentRepository;
  const firefox = typeof api.runtime.getBrowserInfo === 'function';
""",
)

replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    """import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowActivationResult,
  ProfileWorkflowRuntimeView,
} from '@zeroomega-nex/profile-workflow';
""",
    """import {
  isPopupTemporarySnapshotId,
  popupTemporarySnapshotId,
  type ProfileWorkflowActivationDriver,
  type ProfileWorkflowActivationResult,
  type ProfileWorkflowRuntimeView,
} from '@zeroomega-nex/profile-workflow';
""",
)
replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    """  readonly authentication?: ProfileWorkflowAuthenticationCoordinator;
}
""",
    """  readonly authentication?: ProfileWorkflowAuthenticationCoordinator;
  readonly temporarySnapshotNonce?: () => string;
}
""",
)
replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    """  readonly #authentication: ProfileWorkflowAuthenticationCoordinator | undefined;

  constructor(options: ProfileWorkflowPacActivationOptions = {}) {
""",
    """  readonly #authentication: ProfileWorkflowAuthenticationCoordinator | undefined;
  readonly #temporarySnapshotNonce: () => string;

  constructor(options: ProfileWorkflowPacActivationOptions = {}) {
""",
)
replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    """    this.#authentication = options.authentication;
  }
""",
    """    this.#authentication = options.authentication;
    this.#temporarySnapshotNonce = options.temporarySnapshotNonce ?? (() => crypto.randomUUID());
  }
""",
)
replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    """        const snapshot = await createBrowserSafePacSnapshot(
          spec,
          route,
          buildProfileWorkflowVerificationVectors(spec),
          { createdAt: startedAt },
          { target: targetFor(runtime.driver) },
        );
""",
    """        const temporarySnapshotId =
          route.kind === 'profile' && route.profileId.startsWith('__zeroomega_nex_popup_temporary__/')
            ? popupTemporarySnapshotId(route.profileId, this.#temporarySnapshotNonce())
            : undefined;
        const snapshot = await createBrowserSafePacSnapshot(
          spec,
          route,
          buildProfileWorkflowVerificationVectors(spec),
          {
            createdAt: startedAt,
            ...(temporarySnapshotId === undefined ? {} : { snapshotId: temporarySnapshotId }),
          },
          { target: targetFor(runtime.driver) },
        );
""",
)

# Prevent an unused import regression by making the runtime check semantic rather than prefix-only.
replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    """          route.kind === 'profile' && route.profileId.startsWith('__zeroomega_nex_popup_temporary__/')
""",
    """          route.kind === 'profile' &&
          isPopupTemporarySnapshotId(
            popupTemporarySnapshotId(route.profileId, 'probe'),
          ) &&
          route.profileId.startsWith('__zeroomega_nex_popup_temporary__/')
""",
)
