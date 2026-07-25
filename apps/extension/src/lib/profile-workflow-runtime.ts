import {
  BrowserStorageProfileWorkflowRepository,
  createDefaultProfileSpec,
  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  type ProfileWorkflowApplyService,
  type ProfileWorkflowCommandResponse,
  type ProfileWorkflowInitializer,
  type ProfileWorkflowState,
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
    createContext(_state: ProfileWorkflowState) {
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

export function registerProfileWorkflowRuntime(
  api: ProfileWorkflowRuntimeApi,
): RegisteredProfileWorkflowRuntime {
  const repository = new BrowserStorageProfileWorkflowRepository(api.storage.local);
  const initializer = new RuntimeInitializer(api.runtime.id);
  const applyService = createApplyService(api.runtime.id);
  const listener = async (
    message: unknown,
  ): Promise<ProfileWorkflowCommandResponse | undefined> => {
    if (!isProfileWorkflowCommand(message)) return undefined;
    return executeProfileWorkflowCommand(repository, initializer, message, applyService);
  };
  api.runtime.onMessage.addListener(listener);
  return {
    dispose: () => api.runtime.onMessage.removeListener(listener),
  };
}

export function currentProfileWorkflowRuntimeApi(): ProfileWorkflowRuntimeApi {
  return browser as unknown as ProfileWorkflowRuntimeApi;
}
