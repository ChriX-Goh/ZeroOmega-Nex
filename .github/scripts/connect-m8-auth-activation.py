from pathlib import Path

path = Path('apps/extension/src/lib/profile-workflow-activation.ts')
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    text = text.replace(old, new, 1)


replace_once(
    '''  activateBuiltInMode,
  activatePacSnapshot,
  type BrowserProxyDriver,
  type SnapshotActivationRepository,''',
    '''  activateBuiltInMode,
  activatePacSnapshot,
  createProxyAuthenticationPlan,
  type BrowserProxyDriver,
  type ProxyAuthenticationBinding,
  type SnapshotActivationRepository,''',
    'authentication plan imports',
)

replace_once(
    "import { currentBrowserProxyRuntime } from './browser-proxy-runtime';",
    "import { currentBrowserProxyRuntime } from './browser-proxy-runtime';\nimport type { ProxyAuthenticationPreparationResult } from './proxy-auth-runtime';",
    'authentication preparation import',
)

replace_once(
    '''export interface ProfileWorkflowPacActivationOptions {
  readonly createRuntime?: () => ProfileWorkflowProxyRuntime;
  readonly now?: () => Date;
}''',
    '''export interface ProfileWorkflowAuthenticationCoordinator {
  prepare(
    bindings: readonly ProxyAuthenticationBinding[],
  ): Promise<ProxyAuthenticationPreparationResult>;
}

export interface ProfileWorkflowPacActivationOptions {
  readonly createRuntime?: () => ProfileWorkflowProxyRuntime;
  readonly now?: () => Date;
  readonly authentication?: ProfileWorkflowAuthenticationCoordinator;
}''',
    'authentication coordinator option',
)

replace_once(
    '''function snapshotFailureMessage(
  result: Exclude<Awaited<ReturnType<typeof createVerifiedPacSnapshot>>, { ok: true }>,
): string {''',
    '''function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function snapshotFailureMessage(
  result: Exclude<Awaited<ReturnType<typeof createVerifiedPacSnapshot>>, { ok: true }>,
): string {''',
    'activation error helper',
)

replace_once(
    '''export class BrowserProfileWorkflowActivationDriver implements ProfileWorkflowActivationDriver {
  readonly #createRuntime: () => ProfileWorkflowProxyRuntime;
  readonly #now: () => Date;

  constructor(options: ProfileWorkflowPacActivationOptions = {}) {
    this.#createRuntime = options.createRuntime ?? currentBrowserProxyRuntime;
    this.#now = options.now ?? (() => new Date());
  }''',
    '''export class BrowserProfileWorkflowActivationDriver implements ProfileWorkflowActivationDriver {
  readonly #createRuntime: () => ProfileWorkflowProxyRuntime;
  readonly #now: () => Date;
  readonly #authentication: ProfileWorkflowAuthenticationCoordinator | undefined;

  constructor(options: ProfileWorkflowPacActivationOptions = {}) {
    this.#createRuntime = options.createRuntime ?? currentBrowserProxyRuntime;
    this.#now = options.now ?? (() => new Date());
    this.#authentication = options.authentication;
  }''',
    'activation driver authentication field',
)

start = text.index('  async #activateSpec(')
end = text.rindex('\n}')
replacement = '''  async #activateSpec(
    spec: ProfileSpec,
    startRoute?: ProfileRouteTarget,
  ): Promise<ProfileWorkflowActivationResult> {
    const route: ProfileRouteTarget =
      startRoute ?? spec.settings.startup.route ?? { kind: 'direct' };
    const authenticationPlan = createProxyAuthenticationPlan(spec, route);
    if (authenticationPlan.unsupported.length > 0) {
      const endpoints = authenticationPlan.unsupported
        .map((endpoint) => `${endpoint.endpointId} (${endpoint.protocol})`)
        .join(', ');
      throw new Error(
        `browser-only proxy authentication does not support SOCKS credentials: ${endpoints}`,
      );
    }

    let authenticationPreparation:
      | Extract<ProxyAuthenticationPreparationResult, { ok: true }>['preparation']
      | undefined;
    if (this.#authentication) {
      const prepared = await this.#authentication.prepare(authenticationPlan.bindings);
      if (!prepared.ok) {
        throw new Error(`proxy authentication preparation failed: ${prepared.message}`);
      }
      authenticationPreparation = prepared.preparation;
    } else if (authenticationPlan.bindings.length > 0) {
      throw new Error('proxy authentication runtime is unavailable');
    }

    let runtime: ProfileWorkflowProxyRuntime | undefined;
    try {
      runtime = this.#createRuntime();
      const startedAt = this.#now().toISOString();
      let result: ProfileWorkflowActivationResult;
      if (route.kind === 'direct' || route.kind === 'system') {
        const activated = await activateBuiltInMode(
          runtime.repository,
          runtime.driver,
          route.kind,
          {
            startedAt,
            failedAt: this.#now().toISOString(),
          },
        );
        if (!activated.ok) {
          throw new Error(
            `browser proxy activation failed at ${activated.stage}: ${activated.message}`,
          );
        }
        result = { snapshotId: `built-in-${activated.activeBuiltInMode}` };
      } else {
        const snapshot = await createVerifiedPacSnapshot(
          spec,
          route,
          buildProfileWorkflowVerificationVectors(spec),
          { createdAt: startedAt },
          { target: targetFor(runtime.driver) },
        );
        if (!snapshot.ok) {
          throw new Error(
            `${snapshot.stage === 'compile' ? 'PAC compilation' : 'PAC verification'} failed: ${snapshotFailureMessage(snapshot)}`,
          );
        }

        const activated = await activatePacSnapshot(
          runtime.repository,
          runtime.driver,
          snapshot.snapshot,
          { startedAt, failedAt: this.#now().toISOString() },
        );
        if (!activated.ok) {
          throw new Error(
            `browser proxy activation failed at ${activated.stage}: ${activated.message}`,
          );
        }
        result = { snapshotId: activated.activeSnapshotId };
      }
      authenticationPreparation?.commit();
      return result;
    } catch (error) {
      if (authenticationPreparation) {
        try {
          await authenticationPreparation.rollback();
        } catch (rollbackError) {
          throw new Error(
            `${errorMessage(error)}; proxy authentication rollback failed: ${errorMessage(rollbackError)}`,
          );
        }
      }
      throw error;
    } finally {
      runtime?.dispose();
    }
  }
'''
text = text[:start] + replacement + text[end:]
path.write_text(text)
