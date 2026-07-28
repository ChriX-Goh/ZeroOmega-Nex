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

  constructor(options: ProfileWorkflowPacActivationOptions = {}) {
    this.#createRuntime = options.createRuntime ?? currentBrowserProxyRuntime;
    this.#now = options.now ?? (() => new Date());
    this.#authentication = options.authentication;
    this.#temporarySnapshotNonce = options.temporarySnapshotNonce ?? (() => crypto.randomUUID());
  }

  async activate(
    candidate: ProfileSpec,
    startRoute?: ProfileRouteTarget,
  ): Promise<ProfileWorkflowActivationResult> {
    return this.#activateSpec(candidate, startRoute);
  }

  async rollback(previousApplied: ProfileSpec, startRoute?: ProfileRouteTarget): Promise<void> {
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

        const activated = await activatePacSnapshot(runtime.repository, runtime.driver, snapshot, {
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
