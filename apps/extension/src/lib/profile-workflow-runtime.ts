import { BrowserStorageProxyAuthenticationRepository } from '@zeroomega-nex/browser-adapters';
import {
  BrowserStorageProfileWorkflowRepository,
  createDefaultProfileSpec,
  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  type ProfileWorkflowApplyService,
  type ProfileWorkflowCommandResponse,
  type ProfileWorkflowImportService,
  type ProfileWorkflowInitializer,
  type ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';

import { BrowserProfileWorkflowActivationDriver } from './profile-workflow-activation';

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
    readonly local: ProfileWorkflowStorageArea;
  };
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
    return createDefaultProfileSpec({
      documentId: `document-${crypto.randomUUID()}`,
      revisionId: `revision-${crypto.randomUUID()}`,
      createdAt: now,
      deviceId: this.#deviceId,
    });
  }
}

function createApplyService(deviceId: string): ProfileWorkflowApplyService {
  return {
    driver: new BrowserProfileWorkflowActivationDriver(),
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

export function registerProfileWorkflowRuntime(
  api: ProfileWorkflowRuntimeApi,
): RegisteredProfileWorkflowRuntime {
  const repository = new BrowserStorageProfileWorkflowRepository(api.storage.local);
  const initializer = new RuntimeInitializer(api.runtime.id);
  const applyService = createApplyService(api.runtime.id);
  const importService = createImportService(api);
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
    );
  };
  api.runtime.onMessage.addListener(listener);
  return {
    dispose: () => api.runtime.onMessage.removeListener(listener),
  };
}

export function currentProfileWorkflowRuntimeApi(): ProfileWorkflowRuntimeApi {
  return browser as unknown as ProfileWorkflowRuntimeApi;
}
