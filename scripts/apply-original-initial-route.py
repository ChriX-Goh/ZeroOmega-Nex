from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


commands = Path("packages/profile-workflow/src/commands.ts")
replace_once(
    commands,
    """        const activated = await applyService.driver.activate(state.applied, { kind: 'direct' });""",
    """        const startupRoute = state.applied.settings.startup.route ?? { kind: 'system' };
        const activated = await applyService.driver.activate(state.applied, startupRoute);""",
    "fresh workflow startup activation",
)

commands_test = Path("packages/profile-workflow/src/commands.test.ts")
replace_once(
    commands_test,
    """  it('activates Direct when a fresh workflow is first opened', async () => {
    const repository = new MemoryProfileWorkflowRepository();
    const initializer = new Initializer();
    const driver = new ApplyDriver();
    const result = await executeProfileWorkflowCommand(
      repository,
      initializer,
      { channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL, action: 'get' },
      applyService(driver),
    );

    expect(result.ok).toBe(true);
    expect(driver.routes).toEqual([{ kind: 'direct' }]);
    expect(driver.activated).toHaveLength(1);
  });""",
    """  it('activates the Applied startup route when a fresh workflow is first opened', async () => {
    const repository = new MemoryProfileWorkflowRepository();
    const initializer = new Initializer();
    const driver = new ApplyDriver();
    const result = await executeProfileWorkflowCommand(
      repository,
      initializer,
      { channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL, action: 'get' },
      applyService(driver),
    );

    expect(result.ok).toBe(true);
    expect(driver.routes).toEqual([{ kind: 'profile', profileId: 'profile-primary' }]);
    expect(driver.activated).toHaveLength(1);
  });""",
    "startup route command test",
)

runtime = Path("apps/extension/src/lib/profile-workflow-runtime.ts")
replace_once(
    runtime,
    """class RuntimeInitializer implements ProfileWorkflowInitializer {
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
}""",
    """export function createInitialBrowserProfileSpec(deviceId: string) {
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
}""",
    "browser runtime initializer",
)

runtime_test = Path("apps/extension/src/lib/profile-workflow-runtime.test.ts")
replace_once(
    runtime_test,
    """import { notifyProfileWorkflowActivation } from './profile-workflow-runtime';""",
    """import {
  createInitialBrowserProfileSpec,
  notifyProfileWorkflowActivation,
} from './profile-workflow-runtime';""",
    "runtime test import",
)
replace_once(
    runtime_test,
    """describe('profile workflow activation notification', () => {
  it('notifies only after a successful command returns an applied snapshot', () => {""",
    """describe('profile workflow activation notification', () => {
  it('creates a browser-safe original System startup without a placeholder proxy', () => {
    const initial = createInitialBrowserProfileSpec('device-runtime');

    expect(initial.settings.startup.route).toEqual({ kind: 'system' });
    expect(initial.settings.interface.builtInProfiles).toEqual({
      direct: { color: '#aaaaaa' },
      system: { color: '#000000' },
    });
    expect(initial.proxyEndpoints).toEqual([]);
    expect(initial.profiles[0]).toMatchObject({
      kind: 'fixed',
      proxyByScheme: {},
    });
  });

  it('notifies only after a successful command returns an applied snapshot', () => {""",
    "runtime initial state test",
)
