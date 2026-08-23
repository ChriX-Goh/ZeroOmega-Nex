import {
  activateBuiltInMode,
  activatePacSnapshot,
  createProxyAuthenticationPlan,
  type BrowserProxyDriver,
  type ProxyAuthenticationBinding,
  type SnapshotActivationRepository,
} from '@zeroomega-nex/browser-adapters';
import {
  createBrowserSafePacSnapshot,
  createRawPacSnapshot,
  type PacRuntimeSnapshot,
  type PacTarget,
  type PacVerificationVector,
} from '@zeroomega-nex/pac-compiler';
import type {
  Condition,
  FixedProfile,
  ProfileRouteTarget,
  ProfileSpec,
  UserProfile,
  Weekday,
} from '@zeroomega-nex/profile-spec';
import {
  POPUP_TEMPORARY_PROFILE_ID_PREFIX,
  popupTemporarySnapshotId,
  type ProfileWorkflowActivationDriver,
  type ProfileWorkflowActivationResult,
  type ProfileWorkflowRuntimeView,
} from '@zeroomega-nex/profile-workflow';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';
import type { ProxyAuthenticationPreparationResult } from './proxy-auth-runtime';

const WEEKDAY_INDEX: Readonly<Record<Weekday, number>> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export interface ProfileWorkflowProxyRuntime {
  readonly driver: BrowserProxyDriver;
  readonly repository: SnapshotActivationRepository;
  dispose(): void;
}

export interface ProfileWorkflowAuthenticationCoordinator {
  prepare(
    bindings: readonly ProxyAuthenticationBinding[],
  ): Promise<ProxyAuthenticationPreparationResult>;
}

export interface ProfileWorkflowPacActivationOptions {
  readonly createRuntime?: () => ProfileWorkflowProxyRuntime;
  readonly now?: () => Date;
  readonly authentication?: ProfileWorkflowAuthenticationCoordinator;
  readonly temporarySnapshotNonce?: () => string;
  readonly failurePlan?: FirefoxM1FailurePlanController;
}

export const FIREFOX_M1_FAILURE_PLAN_CHANNEL = 'zeroomega-nex/firefox-m1-failure-plan/v1' as const;
export const FIREFOX_M1_FAILURE_PLAN_SCHEMA_VERSION = 1 as const;

export type FirefoxM1FailureScenarioId =
  | 'post-activation-rollback'
  | 'rollback-persistence-failure'
  | 'rollback-required'
  | 'install-failure-rollback'
  | 'confirm-failure-rollback'
  | 'activation-failure';

export type FirefoxM1FailureStage =
  | 'activation'
  | 'install'
  | 'confirm'
  | 'commit'
  | 'rollback-persistence'
  | 'rollback'
  | 'recovery';

export interface FirefoxM1FailurePlanScenario {
  readonly id: FirefoxM1FailureScenarioId;
  readonly operation: 'apply' | 'restart-recovery';
  readonly faultStages: readonly FirefoxM1FailureStage[];
  readonly failureReason: string;
}

export interface FirefoxM1FailurePlanDocument {
  readonly schemaVersion: typeof FIREFOX_M1_FAILURE_PLAN_SCHEMA_VERSION;
  readonly exactHead: string;
  readonly context: {
    readonly browser: 'firefox';
    readonly harness: 'large-migration';
    readonly mode: 'test-only';
  };
  readonly scenarios: readonly FirefoxM1FailurePlanScenario[];
}

export interface FirefoxM1FailurePlanEvidence {
  readonly scenario: FirefoxM1FailureScenarioId;
  readonly stage: FirefoxM1FailureStage;
  readonly reason: string;
  readonly occurredAt: string;
  readonly detail?: Readonly<Record<string, unknown>>;
}

export interface FirefoxM1FailurePlanControllerOptions {
  readonly enabled: boolean;
  readonly expectedHead?: string;
}

function isFailureStage(value: unknown): value is FirefoxM1FailureStage {
  return (
    value === 'activation' ||
    value === 'install' ||
    value === 'confirm' ||
    value === 'commit' ||
    value === 'rollback-persistence' ||
    value === 'rollback' ||
    value === 'recovery'
  );
}

function isFailureScenarioId(value: unknown): value is FirefoxM1FailureScenarioId {
  return (
    value === 'post-activation-rollback' ||
    value === 'rollback-persistence-failure' ||
    value === 'rollback-required' ||
    value === 'install-failure-rollback' ||
    value === 'confirm-failure-rollback' ||
    value === 'activation-failure'
  );
}

function recordValue(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

export class FirefoxM1FailurePlanController {
  readonly #enabled: boolean;
  readonly #expectedHead: string | undefined;
  #scenario: FirefoxM1FailurePlanScenario | undefined;
  #usedStages = new Set<FirefoxM1FailureStage>();
  #evidence: FirefoxM1FailurePlanEvidence[] = [];

  constructor(options: FirefoxM1FailurePlanControllerOptions) {
    this.#enabled = options.enabled;
    this.#expectedHead = options.expectedHead;
  }

  configure(
    value: unknown,
    scenarioId: unknown,
    context: unknown,
    requestExactHead?: unknown,
  ): { readonly ok: true; readonly scenario: FirefoxM1FailureScenarioId } {
    if (!this.#enabled) throw new Error('Firefox M1 failure plan is disabled');
    if (typeof this.#expectedHead !== 'string' || requestExactHead !== this.#expectedHead) {
      throw new Error('Firefox M1 failure plan request exact Head is missing or mismatched');
    }
    const document = recordValue(value, 'failure plan');
    if (document.schemaVersion !== FIREFOX_M1_FAILURE_PLAN_SCHEMA_VERSION) {
      throw new Error('Firefox M1 failure plan schema version is unsupported');
    }
    if (
      typeof document.exactHead !== 'string' ||
      (document.exactHead !== '$ZEROOMEGA_EXACT_HEAD' && document.exactHead !== this.#expectedHead)
    ) {
      throw new Error('Firefox M1 failure plan exact Head does not match the test context');
    }
    const planContext = recordValue(document.context, 'failure plan context');
    if (
      planContext.browser !== 'firefox' ||
      planContext.harness !== 'large-migration' ||
      planContext.mode !== 'test-only'
    ) {
      throw new Error(
        'Firefox M1 failure plan context is not the explicit test-only Firefox context',
      );
    }
    const requestedContext = recordValue(context, 'failure plan request context');
    if (
      requestedContext.browser !== planContext.browser ||
      requestedContext.harness !== planContext.harness ||
      requestedContext.mode !== planContext.mode
    ) {
      throw new Error('Firefox M1 failure plan request context does not match the plan');
    }
    if (!isFailureScenarioId(scenarioId)) {
      throw new Error(`unknown Firefox M1 failure scenario: ${String(scenarioId)}`);
    }
    if (!Array.isArray(document.scenarios)) {
      throw new Error('Firefox M1 failure plan scenarios must be an array');
    }
    const scenario = document.scenarios.find((candidate) => {
      if (candidate === null || typeof candidate !== 'object') return false;
      return (candidate as { id?: unknown }).id === scenarioId;
    }) as FirefoxM1FailurePlanScenario | undefined;
    if (!scenario || !isFailureScenarioId(scenario.id)) {
      throw new Error(`Firefox M1 failure scenario is missing: ${scenarioId}`);
    }
    if (scenario.operation !== 'apply' && scenario.operation !== 'restart-recovery') {
      throw new Error(`Firefox M1 failure scenario operation is invalid: ${scenario.id}`);
    }
    if (
      scenario.faultStages.length === 0 ||
      scenario.faultStages.some((stage) => !isFailureStage(stage))
    ) {
      throw new Error(`Firefox M1 failure scenario has invalid fault stages: ${scenario.id}`);
    }
    if (typeof scenario.failureReason !== 'string' || scenario.failureReason.length === 0) {
      throw new Error(`Firefox M1 failure scenario has no failure reason: ${scenario.id}`);
    }
    this.#scenario = scenario;
    this.#usedStages = new Set();
    this.#evidence = [];
    return { ok: true, scenario: scenario.id };
  }

  consume(stage: FirefoxM1FailureStage, detail?: Readonly<Record<string, unknown>>): boolean {
    if (!this.#scenario || !this.#scenario.faultStages.includes(stage)) return false;
    if (this.#usedStages.has(stage)) return false;
    this.#usedStages.add(stage);
    this.#evidence.push({
      scenario: this.#scenario.id,
      stage,
      reason: this.#scenario.failureReason,
      occurredAt: new Date().toISOString(),
      ...(detail === undefined ? {} : { detail }),
    });
    return true;
  }

  report(): {
    readonly scenario?: FirefoxM1FailureScenarioId;
    readonly evidence: readonly FirefoxM1FailurePlanEvidence[];
  } {
    return {
      ...(this.#scenario === undefined ? {} : { scenario: this.#scenario.id }),
      evidence: this.#evidence.map((entry) => structuredClone(entry)),
    };
  }
}

function createFirefoxM1FailurePlanDriver(
  driver: BrowserProxyDriver,
  controller: FirefoxM1FailurePlanController,
): BrowserProxyDriver {
  return {
    family: driver.family,
    getCapabilities: () => driver.getCapabilities(),
    readState: () => driver.readState(),
    async installPac(snapshot) {
      if (controller.consume('install', { snapshotId: snapshot.snapshotId })) {
        throw new Error('Firefox M1 injected PAC install failure');
      }
      await driver.installPac(snapshot);
    },
    async confirmPac(snapshot) {
      if (controller.consume('confirm', { snapshotId: snapshot.snapshotId })) {
        const capabilities = await driver.getCapabilities();
        return {
          confirmed: false,
          controlLevel: capabilities.controlLevel,
          reason: 'Firefox M1 injected PAC confirmation failure',
        };
      }
      return driver.confirmPac(snapshot);
    },
    setDirect: () => driver.setDirect(),
    setSystem: () => driver.setSystem(),
    restoreState: (state) => driver.restoreState(state),
    clearControl: () => driver.clearControl(),
  };
}

function targetFor(driver: BrowserProxyDriver): PacTarget {
  return driver.family === 'firefox' ? 'firefox' : 'chromium';
}

function requestUrl(scheme: string, host: string, port?: number, path = '/'): string {
  const urlHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
  return `${scheme}://${urlHost}${port === undefined ? '' : `:${port}`}${path}`;
}

function wildcardHost(pattern: string): string {
  const alternative = pattern.split('|')[0]?.trim() || 'probe.example.invalid';
  if (alternative === '<local>') return 'intranet';
  const withoutScheme = alternative.replace(/^[a-z][a-z0-9+.-]*:\/\//iu, '');
  const withoutPort = withoutScheme.replace(/:\d+$/u, '');
  const normalized = withoutPort
    .replace(/^\*\*\./u, 'probe.')
    .replace(/^\*\./u, 'probe.')
    .replace(/^\./u, '')
    .replace(/\*/gu, 'probe')
    .replace(/\?/gu, 'x')
    .replace(/^\[|\]$/gu, '');
  return normalized || 'probe.example.invalid';
}

function wildcardUrl(pattern: string): string {
  const alternative = pattern.split('|')[0]?.trim() || 'http://probe.example.invalid/';
  const expanded = alternative.replace(/\*/gu, 'probe').replace(/\?/gu, 'x');
  if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(expanded)) return expanded;
  return `http://${expanded.replace(/^\/+|\/+$/gu, '')}/`;
}

function vectorForCondition(condition: Condition, index: number): PacVerificationVector {
  const id = `condition-${index}-${condition.kind}`;
  switch (condition.kind) {
    case 'true':
    case 'false':
      return {
        id,
        request: {
          url: 'http://condition.example.invalid/',
          host: 'condition.example.invalid',
          scheme: 'http',
        },
      };
    case 'host-wildcard':
    case 'bypass': {
      const host = wildcardHost(condition.pattern);
      return { id, request: { url: requestUrl('http', host), host, scheme: 'http' } };
    }
    case 'host-regex': {
      const host = 'regex-probe.example.invalid';
      return { id, request: { url: requestUrl('http', host), host, scheme: 'http' } };
    }
    case 'url-wildcard': {
      const url = wildcardUrl(condition.pattern);
      const parsed = new URL(url);
      return {
        id,
        request: {
          url,
          host: parsed.hostname.replace(/^\[|\]$/gu, ''),
          scheme: parsed.protocol.slice(0, -1),
          ...(parsed.port ? { port: Number(parsed.port) } : {}),
        },
      };
    }
    case 'url-regex': {
      const host = 'regex-probe.example.invalid';
      return {
        id,
        request: {
          url: requestUrl('http', host, undefined, '/regex-probe'),
          host,
          scheme: 'http',
        },
      };
    }
    case 'keyword': {
      const host = 'keyword.example.invalid';
      return {
        id,
        request: {
          url: requestUrl('http', host, undefined, `/${encodeURI(condition.pattern)}`),
          host,
          scheme: 'http',
        },
      };
    }
    case 'ip': {
      const host = condition.address;
      return { id, request: { url: requestUrl('http', host), host, scheme: 'http' } };
    }
    case 'host-levels': {
      const levels = Math.max(condition.min, 0);
      const host =
        levels === 0
          ? 'localhost'
          : Array.from({ length: levels + 1 }, (_, label) => `level${label}`).join('.');
      return { id, request: { url: requestUrl('http', host), host, scheme: 'http' } };
    }
    case 'weekday': {
      const host = 'weekday.example.invalid';
      return {
        id,
        request: {
          url: requestUrl('http', host),
          host,
          scheme: 'http',
          localWeekday: WEEKDAY_INDEX[condition.days[0] ?? 'sun'],
          localHour: 12,
        },
      };
    }
    case 'time': {
      const host = 'time.example.invalid';
      return {
        id,
        request: {
          url: requestUrl('http', host),
          host,
          scheme: 'http',
          localWeekday: 1,
          localHour: condition.startHour,
        },
      };
    }
  }
}

function profileConditions(profile: UserProfile): readonly Condition[] {
  if (profile.kind === 'switch') return profile.rules.map((rule) => rule.condition);
  if (profile.kind === 'fixed') {
    return profile.bypass.map((entry) => ({ kind: 'bypass', pattern: entry.pattern }));
  }
  return [];
}

function fixedProfileVectors(
  profile: FixedProfile,
  startIndex: number,
): readonly PacVerificationVector[] {
  return profile.bypass.map((entry, offset) =>
    vectorForCondition({ kind: 'bypass', pattern: entry.pattern }, startIndex + offset),
  );
}

export function buildProfileWorkflowVerificationVectors(
  spec: ProfileSpec,
): readonly PacVerificationVector[] {
  const vectors: PacVerificationVector[] = [
    {
      id: 'baseline-http',
      request: {
        url: 'http://example.invalid/',
        host: 'example.invalid',
        scheme: 'http',
      },
    },
    {
      id: 'baseline-https',
      request: {
        url: 'https://secure.example.invalid/',
        host: 'secure.example.invalid',
        scheme: 'https',
      },
    },
    {
      id: 'baseline-localhost',
      request: { url: 'http://localhost/', host: 'localhost', scheme: 'http' },
    },
    {
      id: 'baseline-ipv4',
      request: { url: 'http://127.0.0.1/', host: '127.0.0.1', scheme: 'http' },
    },
    {
      id: 'baseline-ipv6',
      request: {
        url: 'http://[2001:db8::1]/',
        host: '2001:db8::1',
        scheme: 'http',
      },
    },
    {
      id: 'baseline-clock',
      request: {
        url: 'http://clock.example.invalid/',
        host: 'clock.example.invalid',
        scheme: 'http',
        localWeekday: 1,
        localHour: 9,
      },
    },
  ];

  let conditionIndex = 0;
  for (const profile of spec.profiles) {
    if (profile.kind === 'fixed') {
      vectors.push(...fixedProfileVectors(profile, conditionIndex));
      conditionIndex += profile.bypass.length;
      continue;
    }
    for (const condition of profileConditions(profile)) {
      vectors.push(vectorForCondition(condition, conditionIndex));
      conditionIndex += 1;
    }
  }

  const unique = new Map<string, PacVerificationVector>();
  for (const vector of vectors) {
    const key = JSON.stringify(vector.request);
    if (!unique.has(key)) unique.set(key, vector);
    if (unique.size >= 512) break;
  }
  return [...unique.values()].map((vector, index) => ({
    ...vector,
    id: `workflow-${index}-${vector.id}`,
  }));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function rawPacScript(spec: ProfileSpec, route: ProfileRouteTarget): string | undefined {
  if (route.kind !== 'profile') return undefined;
  const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
  if (!profile || profile.kind !== 'pac') return undefined;
  if (profile.source.kind === 'inline') return profile.source.script;
  let protocol: string;
  try {
    protocol = new URL(profile.source.url).protocol;
  } catch {
    throw new Error(`PAC profile ${profile.name} has an invalid source URL`);
  }
  if (protocol === 'file:') {
    throw new Error(
      `PAC profile ${profile.name} uses a local file URL, which is not supported by the inline browser adapter`,
    );
  }
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`PAC profile ${profile.name} uses unsupported URL protocol ${protocol}`);
  }
  if (profile.source.script === undefined) {
    throw new Error(`PAC profile ${profile.name} has no downloaded script cache`);
  }
  return profile.source.script;
}

function rawSnapshotFailureMessage(
  result: Exclude<Awaited<ReturnType<typeof createRawPacSnapshot>>, { ok: true }>,
): string {
  return result.issues
    .slice(0, 8)
    .map((issue) => `${issue.code}: ${issue.message}`)
    .join('; ');
}

function snapshotFailureMessage(
  result: Exclude<Awaited<ReturnType<typeof createBrowserSafePacSnapshot>>, { ok: true }>,
): string {
  if (result.stage === 'compile') {
    return result.issues
      .slice(0, 8)
      .map((issue) => `${issue.code}: ${issue.message}`)
      .join('; ');
  }
  return result.mismatches
    .slice(0, 8)
    .map((mismatch) => `${mismatch.vectorId}: ${mismatch.reason}`)
    .join('; ');
}

export class BrowserProfileWorkflowActivationDriver implements ProfileWorkflowActivationDriver {
  readonly #createRuntime: () => ProfileWorkflowProxyRuntime;
  readonly #now: () => Date;
  readonly #authentication: ProfileWorkflowAuthenticationCoordinator | undefined;
  readonly #temporarySnapshotNonce: () => string;
  readonly #failurePlan: FirefoxM1FailurePlanController | undefined;

  constructor(options: ProfileWorkflowPacActivationOptions = {}) {
    this.#createRuntime = options.createRuntime ?? currentBrowserProxyRuntime;
    this.#now = options.now ?? (() => new Date());
    this.#authentication = options.authentication;
    this.#temporarySnapshotNonce = options.temporarySnapshotNonce ?? (() => crypto.randomUUID());
    this.#failurePlan = options.failurePlan;
  }

  async activate(
    candidate: ProfileSpec,
    startRoute?: ProfileRouteTarget,
  ): Promise<ProfileWorkflowActivationResult> {
    return this.#activateSpec(candidate, startRoute);
  }

  async rollback(previousApplied: ProfileSpec, startRoute?: ProfileRouteTarget): Promise<void> {
    if (this.#failurePlan?.consume('rollback', { revisionId: previousApplied.revision.id })) {
      throw new Error('Firefox M1 injected rollback failure');
    }
    await this.#activateSpec(previousApplied, startRoute ?? previousApplied.settings.startup.route);
  }

  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    const runtime = this.#createRuntime();
    try {
      const state = await runtime.repository.getState();
      const activeSnapshot =
        state.activeSnapshotId === undefined
          ? undefined
          : await runtime.repository.getSnapshot(state.activeSnapshotId);
      const activeRoute: ProfileRouteTarget | undefined =
        state.activeBuiltInMode === undefined
          ? activeSnapshot?.startRoute
          : { kind: state.activeBuiltInMode };
      return {
        ...(state.activeSnapshotId === undefined
          ? {}
          : { activeSnapshotId: state.activeSnapshotId }),
        ...(state.lastKnownGoodSnapshotId === undefined
          ? {}
          : { lastKnownGoodSnapshotId: state.lastKnownGoodSnapshotId }),
        ...(activeRoute === undefined ? {} : { activeRoute }),
        ...(state.lastFailure === undefined
          ? {}
          : {
              lastFailure: {
                stage: state.lastFailure.stage,
                message: state.lastFailure.message,
                occurredAt: state.lastFailure.occurredAt,
                ...(state.lastFailure.rollbackSucceeded === undefined
                  ? {}
                  : { rollbackSucceeded: state.lastFailure.rollbackSucceeded }),
              },
            }),
      };
    } finally {
      runtime.dispose();
    }
  }

  async #activateSpec(
    spec: ProfileSpec,
    startRoute?: ProfileRouteTarget,
  ): Promise<ProfileWorkflowActivationResult> {
    if (this.#failurePlan?.consume('activation', { revisionId: spec.revision.id })) {
      throw new Error('Firefox M1 injected activation failure');
    }
    const route: ProfileRouteTarget = startRoute ??
      spec.settings.startup.route ?? { kind: 'direct' };
    const rawScript = rawPacScript(spec, route);
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
      const driver = this.#failurePlan
        ? createFirefoxM1FailurePlanDriver(runtime.driver, this.#failurePlan)
        : runtime.driver;
      const startedAt = this.#now().toISOString();
      let result: ProfileWorkflowActivationResult;
      if (route.kind === 'direct' || route.kind === 'system') {
        const activated = await activateBuiltInMode(runtime.repository, driver, route.kind, {
          startedAt,
          failedAt: this.#now().toISOString(),
        });
        if (!activated.ok) {
          throw new Error(
            `browser proxy activation failed at ${activated.stage}: ${activated.message}`,
          );
        }
        result = { snapshotId: `built-in-${activated.activeBuiltInMode}` };
      } else {
        const temporaryProfile =
          route.kind === 'profile' && route.profileId === POPUP_TEMPORARY_PROFILE_ID_PREFIX
            ? spec.profiles.find((profile) => profile.id === route.profileId)
            : undefined;
        const temporarySnapshotId =
          temporaryProfile?.kind === 'switch'
            ? popupTemporarySnapshotId(
                temporaryProfile.defaultRoute,
                this.#temporarySnapshotNonce(),
              )
            : undefined;
        let snapshot: PacRuntimeSnapshot;
        if (rawScript === undefined) {
          const generated = await createBrowserSafePacSnapshot(
            spec,
            route,
            buildProfileWorkflowVerificationVectors(spec),
            {
              createdAt: startedAt,
              ...(temporarySnapshotId === undefined ? {} : { snapshotId: temporarySnapshotId }),
            },
            { target: targetFor(runtime.driver) },
          );
          if (!generated.ok) {
            throw new Error(
              `${generated.stage === 'compile' ? 'PAC compilation' : 'PAC verification'} failed: ${snapshotFailureMessage(generated)}`,
            );
          }
          snapshot = generated.snapshot;
        } else {
          const raw = await createRawPacSnapshot(
            spec,
            route,
            rawScript,
            { createdAt: startedAt },
            targetFor(runtime.driver),
          );
          if (!raw.ok) {
            throw new Error(`Raw PAC validation failed: ${rawSnapshotFailureMessage(raw)}`);
          }
          snapshot = raw.snapshot;
        }

        const activated = await activatePacSnapshot(runtime.repository, driver, snapshot, {
          startedAt,
          failedAt: this.#now().toISOString(),
        });
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
            { cause: rollbackError },
          );
        }
      }
      throw error;
    } finally {
      runtime?.dispose();
    }
  }
}
