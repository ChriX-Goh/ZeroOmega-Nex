import {
  BrowserStorageProxyAuthenticationRepository,
  listPacSnapshotHistory,
  type BrowserStorageArea,
} from '@zeroomega-nex/browser-adapters';
import {
  BrowserStorageProfileWorkflowRepository,
  createDefaultProfileSpec,
  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  listProfileWorkflowRevisionHistory,
  type ProfileWorkflowActivationDriver,
  type ProfileWorkflowApplyService,
  type ProfileWorkflowCommandResponse,
  type ProfileWorkflowHistoryService,
  type ProfileWorkflowImportService,
  type ProfileWorkflowInitializer,
  type ProfileWorkflowRuleSourceDownloader,
  type ProfileWorkflowRuleSourceUpdateService,
  type ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';
import { BrowserRuleSourceDownloader } from './rule-source-downloader';
import { registerRuleSourceScheduler, type RuleSourceSchedulerApi } from './rule-source-scheduler';
import { normalizeExtensionDeviceId } from './extension-device-id';
import {
  BrowserProfileWorkflowActivationDriver,
  type ProfileWorkflowAuthenticationCoordinator,
} from './profile-workflow-activation';
import { BrowserSnapshotRollbackService } from './snapshot-rollback-runtime';

interface ProfileWorkflowMessageEvent {
  addListener(
    listener: (message: unknown) => Promise<ProfileWorkflowCommandResponse | undefined>,
  ): void;
  removeListener(listener: (message: unknown) => unknown): void;
}

interface ProfileWorkflowRuntimeApi {
  readonly runtime: {
    readonly id: string;
    readonly onMessage: ProfileWorkflowMessageEvent;
  };
  readonly storage: {
    readonly local: ProfileWorkflowStorageArea & BrowserStorageArea;
  };
  readonly alarms?: RuleSourceSchedulerApi['alarms'];
  readonly permissions?: RuleSourceSchedulerApi['permissions'];
}

export interface ProfileWorkflowRuntimeOptions {
  readonly activationDriver?: ProfileWorkflowActivationDriver;
  readonly authentication?: ProfileWorkflowAuthenticationCoordinator;
  readonly ruleSourceDownloader?: ProfileWorkflowRuleSourceDownloader;
}

export interface RegisteredProfileWorkflowRuntime {
  dispose(): void;
}

class RuntimeInitializer implements ProfileWorkflowInitializer {
  readonly #deviceId: string;

  constructor(deviceId: string) {
    this.#deviceId = deviceId;
  }

  createInitialProfileSpec() {
    const now = new Date().toISOString();
    const initial = createDefaultProfileSpec({
      documentId: `document-${crypto.randomUUID()}`,
      revisionId: `revision-${crypto.randomUUID()}`,
      createdAt: now,
      deviceId: this.#deviceId,
    });
    initial.settings.startup.route = { kind: 'direct' };
    const initialProfile = initial.profiles[0];
    if (initialProfile?.kind === 'fixed') initialProfile.proxyByScheme = {};
    initial.proxyEndpoints = [];
    return initial;
  }
}

function createApplyService(
  deviceId: string,
  driver: ProfileWorkflowActivationDriver,
): ProfileWorkflowApplyService {
  return {
    driver,
    createContext() {
      const now = new Date().toISOString();
      return {
        applyId: `apply-${crypto.randomUUID()}`,
        revisionId: `revision-${crypto.randomUUID()}`,
        startedAt: now,
        completedAt: now,
        deviceId,
      };
    },
  };
}

function createImportService(api: ProfileWorkflowRuntimeApi): ProfileWorkflowImportService {
  return {
    secretStore: new BrowserStorageProxyAuthenticationRepository(api.storage.local),
  };
}

function createRuleSourceUpdateService(
  importService: ProfileWorkflowImportService,
  downloader: ProfileWorkflowRuleSourceDownloader,
): ProfileWorkflowRuleSourceUpdateService {
  return {
    downloader,
    secretStore: importService.secretStore,
  };
}

function createHistoryService(
  repository: BrowserStorageProfileWorkflowRepository,
): ProfileWorkflowHistoryService {
  return {
    async listSnapshots() {
      const runtime = currentBrowserProxyRuntime();
      try {
        return await listPacSnapshotHistory(runtime.repository);
      } finally {
        runtime.dispose();
      }
    },
    listRevisions: (state) => listProfileWorkflowRevisionHistory(repository, state),
  };
}

export function registerProfileWorkflowRuntime(
  api: ProfileWorkflowRuntimeApi,
  options: ProfileWorkflowRuntimeOptions = {},
): RegisteredProfileWorkflowRuntime {
  const repository = new BrowserStorageProfileWorkflowRepository(api.storage.local);
  const deviceId = normalizeExtensionDeviceId(api.runtime.id);
  const initializer = new RuntimeInitializer(deviceId);
  const applyService = createApplyService(
    deviceId,
    options.activationDriver ?? new BrowserProfileWorkflowActivationDriver(),
  );
  const importService = createImportService(api);
  const historyService = createHistoryService(repository);
  const ruleSourceUpdateService = createRuleSourceUpdateService(
    importService,
    options.ruleSourceDownloader ?? new BrowserRuleSourceDownloader(),
  );
  const ruleSourceScheduler =
    api.alarms === undefined || api.permissions === undefined
      ? undefined
      : registerRuleSourceScheduler(
          { alarms: api.alarms, permissions: api.permissions },
          {
            repository,
            updateService: ruleSourceUpdateService,
            onError: (error) =>
              console.error('[ZeroOmega Nex] scheduled Rule Source update failed:', error),
          },
        );
  const rollbackService =
    options.authentication === undefined
      ? undefined
      : new BrowserSnapshotRollbackService({
          revisions: repository,
          authentication: options.authentication,
        });
  const listener = async (
    message: unknown,
  ): Promise<ProfileWorkflowCommandResponse | undefined> => {
    if (!isProfileWorkflowCommand(message)) return undefined;
    return executeProfileWorkflowCommand(
      repository,
      initializer,
      message,
      applyService,
      importService,
      historyService,
      rollbackService,
      ruleSourceUpdateService,
    );
  };
  api.runtime.onMessage.addListener(listener);
  return {
    dispose() {
      ruleSourceScheduler?.dispose();
      api.runtime.onMessage.removeListener(listener);
    },
  };
}

export function currentProfileWorkflowRuntimeApi(): ProfileWorkflowRuntimeApi {
  return browser as unknown as ProfileWorkflowRuntimeApi;
}
