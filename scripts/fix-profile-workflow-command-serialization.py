from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


runtime_path = Path("apps/extension/src/lib/profile-workflow-runtime.ts")
runtime = runtime_path.read_text(encoding="utf-8")
runtime = replace_once(
    runtime,
    """  let disposed = false;
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
    ).then(async (response) => {
      await notifyProfileWorkflowActivation(command, response, options.onActivationSucceeded);
      return response;
    });""",
    """  let disposed = false;
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
  const executeCommand = (command: ProfileWorkflowCommand): Promise<ProfileWorkflowCommandResponse> => {
    const run = commandTail.then(
      () => performCommand(command),
      () => performCommand(command),
    );
    commandTail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };""",
    "serialized profile workflow command queue",
)
runtime_path.write_text(runtime, encoding="utf-8")


test_path = Path("apps/extension/src/lib/profile-workflow-runtime-initialize.test.ts")
test = test_path.read_text(encoding="utf-8")
test = replace_once(
    test,
    """class RecordingDriver implements ProfileWorkflowActivationDriver {
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
  const driver = new RecordingDriver();""",
    """class RecordingDriver implements ProfileWorkflowActivationDriver {
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

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

class BlockingDriver extends RecordingDriver {
  readonly started = deferred();
  readonly release = deferred();

  override async activate(candidate: ProfileSpec, route?: ProfileRouteTarget) {
    this.routes.push(route);
    this.started.resolve();
    await this.release.promise;
    return { snapshotId: 'built-in-system' };
  }
}

function harness(driver = new RecordingDriver()) {
  const messages = new MessageEvent();
  const storage = new MemoryArea();""",
    "blocking initialization test driver",
)
test = replace_once(
    test,
    """  it('returns the settled initialization result without reactivating', async () => {""",
    """  it('queues concurrent runtime messages behind the complete initial activation', async () => {
    const driver = new BlockingDriver();
    const { messages, runtime } = harness(driver);
    const listener = [...messages.listeners][0];
    if (!listener) throw new Error('profile workflow message listener is unavailable');

    const initialization = runtime.initialize();
    await driver.started.promise;
    const concurrent = listener({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'get',
    });
    if (!concurrent) throw new Error('concurrent profile workflow command was ignored');
    let concurrentSettled = false;
    void Promise.resolve(concurrent).then(() => {
      concurrentSettled = true;
    });
    await Promise.resolve();
    expect(concurrentSettled).toBe(false);

    driver.release.resolve();
    const [initialResponse, concurrentResponse] = await Promise.all([
      initialization,
      concurrent,
    ]);

    expect(initialResponse).toMatchObject({
      ok: true,
      appliedSnapshotId: 'built-in-system',
    });
    expect(concurrentResponse).toMatchObject({
      ok: true,
      runtime: { activeRoute: { kind: 'system' } },
    });
    expect(driver.routes).toEqual([{ kind: 'system' }]);
  });

  it('returns the settled initialization result without reactivating', async () => {""",
    "concurrent initialization message test",
)
test_path.write_text(test, encoding="utf-8")


background_path = Path("apps/extension/src/entrypoints/background.ts")
background = background_path.read_text(encoding="utf-8")
background = replace_once(
    background,
    """    } catch (error) {
      console.error(`[${productIdentity.name}] toolbar refresh failed after ${reason}:`, error);
      throw error;
    }""",
    """    } catch (error) {
      console.error(`[${productIdentity.name}] toolbar refresh failed after ${reason}:`, error);
    }""",
    "toolbar refresh error isolation",
)
background = replace_once(
    background,
    """      if (response.appliedSnapshotId === undefined) {
        await restoreProxyRuntime(authentication, temporaryRuleCoordinator);
        await refreshToolbar('startup recovery');
      }""",
    """      if (response.appliedSnapshotId === undefined) {
        await restoreProxyRuntime(authentication, temporaryRuleCoordinator);
        const restoredRuntime = (await activationDriver.inspectRuntime?.()) ?? {};
        if (restoredRuntime.activeRoute === undefined) {
          const startupRoute = response.state.applied.settings.startup.route ?? { kind: 'system' };
          await activationDriver.activate(response.state.applied, startupRoute);
        }
        await refreshToolbar('startup recovery');
      }""",
    "missing startup proxy state recovery",
)
background_path.write_text(background, encoding="utf-8")
