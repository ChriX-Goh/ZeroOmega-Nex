import {
  BrowserStorageProxyAuthenticationRepository,
  listPacSnapshotHistory,
  parseExternalProfileCandidate,
  type BrowserStorageArea,
} from '@zeroomega-nex/browser-adapters';
import {
  BrowserStorageProfileWorkflowRepository,
  createDefaultProfileSpec,
  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  listProfileWorkflowRevisionHistory,
  type ProfileWorkflowActivationDriver,
  type ProfileWorkflowApplyService,
  type ProfileWorkflowCommand,
  type ProfileWorkflowCommandResponse,
  type ProfileWorkflowExternalProfileService,
  type ProfileWorkflowHistoryService,
  type ProfileWorkflowImportService,
  type ProfileWorkflowInitializer,
  type ProfileWorkflowPacSourceUpdateService,
  type ProfileWorkflowRepository,
  type ProfileWorkflowRevisionRepository,
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
  FirefoxM1FailurePlanController,
  type ProfileWorkflowAuthenticationCoordinator,
} from './profile-workflow-activation';
import { BrowserSnapshotRollbackService } from './snapshot-rollback-runtime';

interface ProfileWorkflowMessageEvent {
  addListener(
    listener: (
      message: unknown,
    ) => ProfileWorkflowCommandResponse | Promise<ProfileWorkflowCommandResponse> | undefined,
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

export type ProfileWorkflowActivationResponse = Extract<
  ProfileWorkflowCommandResponse,
  { readonly ok: true }
> & {
  readonly appliedSnapshotId: string;
};

export interface ProfileWorkflowActivationEvent {
  readonly command: ProfileWorkflowCommand;
  readonly response: ProfileWorkflowActivationResponse;
}

export interface ProfileWorkflowRuntimeOptions {
  readonly activationDriver?: ProfileWorkflowActivationDriver;
  readonly authentication?: ProfileWorkflowAuthenticationCoordinator;
  readonly failurePlan?: FirefoxM1FailurePlanController;
  readonly ruleSourceDownloader?: ProfileWorkflowRuleSourceDownloader;
  readonly onActivationSucceeded?: (event: ProfileWorkflowActivationEvent) => Promise<void> | void;
  readonly completeInitialization?: (
    response: ProfileWorkflowCommandResponse,
  ) => Promise<void> | void;
}

function createFailurePlanRepository(
  repository: BrowserStorageProfileWorkflowRepository,
  controller: FirefoxM1FailurePlanController,
): ProfileWorkflowRepository & ProfileWorkflowRevisionRepository {
  return {
    read: () => repository.read(),
    async compareAndSwap(expectedGeneration, next) {
      const lastApply = next.lastApply;
      const stage =
        lastApply?.status === 'succeeded' && next.pendingApply === undefined
          ? 'commit'
          : lastApply?.status === 'failed' && lastApply.stage === 'commit'
            ? 'rollback-persistence'
            : lastApply?.status === 'failed' && lastApply.stage === 'recovery'
              ? 'recovery'
              : undefined;
      if (
        stage !== undefined &&
        controller.consume(stage, {
          generation: next.generation,
          ...(lastApply === undefined
            ? {}
            : { applyStage: lastApply.status === 'failed' ? lastApply.stage : lastApply.status }),
        })
      ) {
        return false;
      }
      return repository.compareAndSwap(expectedGeneration, next);
    },
    getRevision: (revisionId) => repository.getRevision(revisionId),
    listRevisions: () => repository.listRevisions(),
  };
}

export interface RegisteredProfileWorkflowRuntime {
  initialize(): Promise<ProfileWorkflowCommandResponse>;
  dispose(): void;
}

export async function notifyProfileWorkflowActivation(
  command: ProfileWorkflowCommand,
  response: ProfileWorkflowCommandResponse,
  listener: ProfileWorkflowRuntimeOptions['onActivationSucceeded'],
): Promise<void> {
  if (!response.ok || response.appliedSnapshotId === undefined || listener === undefined) return;
  await listener({
    command,
    response: {
      ...response,
      appliedSnapshotId: response.appliedSnapshotId,
    },
  });
}

class BrowserExternalProfileService implements ProfileWorkflowExternalProfileService {
  readonly createId = (
    kind: Parameters<ProfileWorkflowExternalProfileService['createId']>[0],
  ): string => `external-${kind}-${crypto.randomUUID()}`;

  async readCandidate() {
    const runtime = currentBrowserProxyRuntime();
    try {
      return parseExternalProfileCandidate(await runtime.driver.readState());
    } finally {
      runtime.dispose();
    }
  }
}

export function createInitialBrowserProfileSpec(deviceId: string) {
  const now = new Date().toISOString();
  const initial = createDefaultProfileSpec({
    documentId: `document-${crypto.randomUUID()}`,
    revisionId: `revision-${crypto.randomUUID()}`,
    createdAt: now,
    deviceId,
  });
  initial.settings.startup.route = { kind: 'system' };
  const initialProfile = initial.profiles[0];
  if (initialProfile?.kind === 'fixed') initialProfile.proxyByScheme = {};
  initial.proxyEndpoints = [];
  return initial;
}

class RuntimeInitializer implements ProfileWorkflowInitializer {
  readonly #deviceId: string;

  constructor(deviceId: string) {
    this.#deviceId = deviceId;
  }

  createInitialProfileSpec() {
    return createInitialBrowserProfileSpec(this.#deviceId);
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
): ProfileWorkflowRuleSourceUpdateService & ProfileWorkflowPacSourceUpdateService {
  return {
    downloader,
    secretStore: importService.secretStore,
  };
}

function createHistoryService(
  repository: ProfileWorkflowRevisionRepository,
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
  const baseRepository = new BrowserStorageProfileWorkflowRepository(api.storage.local);
  const repository = options.failurePlan
    ? createFailurePlanRepository(baseRepository, options.failurePlan)
    : baseRepository;
  const deviceId = normalizeExtensionDeviceId(api.runtime.id);
  const initializer = new RuntimeInitializer(deviceId);
  const applyService = createApplyService(
    deviceId,
    options.activationDriver ??
      new BrowserProfileWorkflowActivationDriver(
        options.failurePlan === undefined ? {} : { failurePlan: options.failurePlan },
      ),
  );
  const importService = createImportService(api);
  const historyService = createHistoryService(repository);
  const externalProfileService = new BrowserExternalProfileService();
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
  let disposed = false;
  let initialization: Promise<ProfileWorkflowCommandResponse> | undefined;
  let commandTail: Promise<void> = Promise.resolve();
  const performCommand = async (
    command: ProfileWorkflowCommand,
  ): Promise<ProfileWorkflowCommandResponse> => {
    const response = await executeProfileWorkflowCommand(
      repository,
      initializer,
      command,
      applyService,
      importService,
      historyService,
      rollbackService,
      ruleSourceUpdateService,
      externalProfileService,
      ruleSourceUpdateService,
    );
    await notifyProfileWorkflowActivation(command, response, options.onActivationSucceeded);
    return response;
  };
  const enqueue = <T>(operation: () => Promise<T>): Promise<T> => {
    const run = commandTail.then(operation, operation);
    commandTail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
  const executeCommand = (
    command: ProfileWorkflowCommand,
  ): Promise<ProfileWorkflowCommandResponse> => enqueue(() => performCommand(command));
  const listener = (message: unknown): Promise<ProfileWorkflowCommandResponse> | undefined => {
    if (!isProfileWorkflowCommand(message)) return undefined;
    return executeCommand(message);
  };
  api.runtime.onMessage.addListener(listener);
  return {
    initialize() {
      if (disposed) {
        return Promise.reject(new Error('profile workflow runtime is disposed'));
      }
      initialization ??= enqueue(async () => {
        const response = await performCommand({
          channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
          action: 'get',
        });
        await options.completeInitialization?.(response);
        return response;
      }).catch((error: unknown) => {
        initialization = undefined;
        throw error;
      });
      return initialization;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ruleSourceScheduler?.dispose();
      api.runtime.onMessage.removeListener(listener);
    },
  };
}

export function currentProfileWorkflowRuntimeApi(): ProfileWorkflowRuntimeApi {
  return browser as unknown as ProfileWorkflowRuntimeApi;
}
