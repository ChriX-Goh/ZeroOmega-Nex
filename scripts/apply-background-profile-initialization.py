from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


runtime = Path("apps/extension/src/lib/profile-workflow-runtime.ts")
replace_once(
    runtime,
    """  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,""",
    """  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,""",
    "runtime command import",
)
replace_once(
    runtime,
    """export interface RegisteredProfileWorkflowRuntime {
  dispose(): void;
}""",
    """export interface RegisteredProfileWorkflowRuntime {
  initialize(): Promise<ProfileWorkflowCommandResponse>;
  dispose(): void;
}""",
    "registered runtime interface",
)
old_listener = """  const listener = (message: unknown): Promise<ProfileWorkflowCommandResponse> | undefined => {
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
      externalProfileService,
      ruleSourceUpdateService,
    ).then((response) => {
      notifyProfileWorkflowActivation(message, response, options.onActivationSucceeded);
      return response;
    });
  };
  api.runtime.onMessage.addListener(listener);
  return {
    dispose() {
      ruleSourceScheduler?.dispose();
      api.runtime.onMessage.removeListener(listener);
    },
  };"""
new_listener = """  let disposed = false;
  let initialization: Promise<ProfileWorkflowCommandResponse> | undefined;
  const executeCommand = (command: ProfileWorkflowCommand) =>
    executeProfileWorkflowCommand(
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
    ).then((response) => {
      notifyProfileWorkflowActivation(command, response, options.onActivationSucceeded);
      return response;
    });
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
      initialization ??= executeCommand({
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'get',
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
  };"""
replace_once(runtime, old_listener, new_listener, "runtime initialization implementation")

background = Path("apps/extension/src/entrypoints/background.ts")
replace_once(
    background,
    """  authenticationManager = new ProxyAuthenticationRuntimeManager(currentProxyAuthenticationApi());
  const baseActivationDriver = new BrowserProfileWorkflowActivationDriver({
    authentication: authenticationManager,
  });""",
    """  const authentication = new ProxyAuthenticationRuntimeManager(currentProxyAuthenticationApi());
  authenticationManager = authentication;
  const baseActivationDriver = new BrowserProfileWorkflowActivationDriver({
    authentication,
  });""",
    "background authentication local",
)
replace_once(
    background,
    """  profileWorkflowRuntime = registerProfileWorkflowRuntime(currentProfileWorkflowRuntimeApi(), {
    activationDriver,
    authentication: authenticationManager,
    onActivationSucceeded: () => refreshToolbar('profile activation'),
  });""",
    """  const workflowRuntime = registerProfileWorkflowRuntime(currentProfileWorkflowRuntimeApi(), {
    activationDriver,
    authentication,
    onActivationSucceeded: () => refreshToolbar('profile activation'),
  });
  profileWorkflowRuntime = workflowRuntime;""",
    "background workflow runtime local",
)
replace_once(
    background,
    """  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator)
    .then(() => refreshToolbar('startup recovery'))
    .catch((error: unknown) => {
      console.error(`[${productIdentity.name}] proxy runtime initialization failed:`, error);
    });""",
    """  void workflowRuntime
    .initialize()
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('profile workflow initialization command failed');
      }
      if (response.appliedSnapshotId === undefined) {
        await restoreProxyRuntime(authentication, temporaryRuleCoordinator);
        refreshToolbar('startup recovery');
        return;
      }
      refreshToolbar('initial startup activation');
    })
    .catch((error: unknown) => {
      console.error(`[${productIdentity.name}] proxy runtime initialization failed:`, error);
    });""",
    "background startup orchestration",
)

test = Path("apps/extension/src/lib/profile-workflow-runtime-initialize.test.ts")
test.write_text(
    """import type { BrowserStorageArea } from '@zeroomega-nex/browser-adapters';
import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowCommandResponse,
  ProfileWorkflowRuntimeView,
  ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it, vi } from 'vitest';

import { registerProfileWorkflowRuntime } from './profile-workflow-runtime';

class MemoryArea implements ProfileWorkflowStorageArea, BrowserStorageArea {
  readonly values = new Map<string, unknown>();

  async get(keys: string | readonly string[]): Promise<Record<string, unknown>> {
    const selected = typeof keys === 'string' ? [keys] : keys;
    return Object.fromEntries(
      selected.flatMap((key) => (this.values.has(key) ? [[key, this.values.get(key)]] : [])),
    );
  }

  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      this.values.set(key, structuredClone(value));
    }
  }

  async remove(keys: string | readonly string[]): Promise<void> {
    for (const key of typeof keys === 'string' ? [keys] : keys) this.values.delete(key);
  }
}

type MessageListener = (
  message: unknown,
) => ProfileWorkflowCommandResponse | Promise<ProfileWorkflowCommandResponse> | undefined;

class MessageEvent {
  readonly listeners = new Set<MessageListener>();

  addListener(listener: MessageListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (message: unknown) => unknown): void {
    this.listeners.delete(listener as MessageListener);
  }
}

class RecordingDriver implements ProfileWorkflowActivationDriver {
  readonly routes: Array<ProfileRouteTarget | undefined> = [];

  async activate(_candidate: ProfileSpec, route?: ProfileRouteTarget) {
    this.routes.push(route);
    return { snapshotId: 'built-in-system' };
  }

  async rollback(): Promise<void> {}

  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    const activeRoute = this.routes.at(-1);
    return activeRoute === undefined ? {} : { activeRoute };
  }
}

function harness() {
  const messages = new MessageEvent();
  const storage = new MemoryArea();
  const driver = new RecordingDriver();
  const activated = vi.fn();
  const runtime = registerProfileWorkflowRuntime(
    {
      runtime: {
        id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        onMessage: messages,
      },
      storage: { local: storage },
    },
    {
      activationDriver: driver,
      onActivationSucceeded: activated,
    },
  );
  return { activated, driver, messages, runtime };
}

describe('profile workflow background initialization', () => {
  it('deduplicates concurrent initialization and activates original System once', async () => {
    const { activated, driver, runtime } = harness();

    const first = runtime.initialize();
    const second = runtime.initialize();
    expect(first).toBe(second);

    const [firstResponse, secondResponse] = await Promise.all([first, second]);
    expect(firstResponse).toBe(secondResponse);
    expect(firstResponse).toMatchObject({
      ok: true,
      appliedSnapshotId: 'built-in-system',
    });
    expect(driver.routes).toEqual([{ kind: 'system' }]);
    expect(activated).toHaveBeenCalledTimes(1);
  });

  it('returns the settled initialization result without reactivating', async () => {
    const { driver, runtime } = harness();

    const first = await runtime.initialize();
    const second = await runtime.initialize();

    expect(second).toBe(first);
    expect(driver.routes).toHaveLength(1);
  });

  it('removes the message listener and rejects initialization after disposal', async () => {
    const { messages, runtime } = harness();
    expect(messages.listeners.size).toBe(1);

    runtime.dispose();

    expect(messages.listeners.size).toBe(0);
    await expect(runtime.initialize()).rejects.toThrow('profile workflow runtime is disposed');
  });
});
""",
    encoding="utf-8",
)
