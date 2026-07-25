import {
  BrowserStorageProfileWorkflowRepository,
  createDefaultProfileSpec,
  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  type ProfileWorkflowCommandResponse,
  type ProfileWorkflowInitializer,
  type ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';

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

export function registerProfileWorkflowRuntime(
  api: ProfileWorkflowRuntimeApi,
): RegisteredProfileWorkflowRuntime {
  const repository = new BrowserStorageProfileWorkflowRepository(api.storage.local);
  const initializer = new RuntimeInitializer(api.runtime.id);
  const listener = async (
    message: unknown,
  ): Promise<ProfileWorkflowCommandResponse | undefined> => {
    if (!isProfileWorkflowCommand(message)) return undefined;
    return executeProfileWorkflowCommand(repository, initializer, message);
  };
  api.runtime.onMessage.addListener(listener);
  return {
    dispose: () => api.runtime.onMessage.removeListener(listener),
  };
}

export function currentProfileWorkflowRuntimeApi(): ProfileWorkflowRuntimeApi {
  return browser as unknown as ProfileWorkflowRuntimeApi;
}
