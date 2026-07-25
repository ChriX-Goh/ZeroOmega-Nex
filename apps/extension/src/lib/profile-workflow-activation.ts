import {
  activatePacSnapshot,
  type BrowserProxyDriver,
  type SnapshotActivationRepository,
} from '@zeroomega-nex/browser-adapters';
import {
  createVerifiedPacSnapshot,
  type PacTarget,
  type PacVerificationVector,
} from '@zeroomega-nex/pac-compiler';
import type {
  Condition,
  FixedProfile,
  ProfileSpec,
  UserProfile,
  Weekday,
} from '@zeroomega-nex/profile-spec';
import type {
  ProfileWorkflowActivationDriver,
  ProfileWorkflowActivationResult,
} from '@zeroomega-nex/profile-workflow';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';

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

export interface ProfileWorkflowPacActivationOptions {
  readonly createRuntime?: () => ProfileWorkflowProxyRuntime;
  readonly now?: () => Date;
}

function targetFor(driver: BrowserProxyDriver): PacTarget {
  return driver.family === 'firefox' ? 'firefox' : 'chromium';
}

function requestUrl(
  scheme: string,
  host: string,
  port?: number,
  path = '/',
): string {
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
    vectorForCondition(
      { kind: 'bypass', pattern: entry.pattern },
      startIndex + offset,
    ),
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

function snapshotFailureMessage(
  result: Exclude<Awaited<ReturnType<typeof createVerifiedPacSnapshot>>, { ok: true }>,
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

export class BrowserProfileWorkflowActivationDriver
  implements ProfileWorkflowActivationDriver
{
  readonly #createRuntime: () => ProfileWorkflowProxyRuntime;
  readonly #now: () => Date;

  constructor(options: ProfileWorkflowPacActivationOptions = {}) {
    this.#createRuntime = options.createRuntime ?? currentBrowserProxyRuntime;
    this.#now = options.now ?? (() => new Date());
  }

  async activate(candidate: ProfileSpec): Promise<ProfileWorkflowActivationResult> {
    return this.#activateSpec(candidate);
  }

  async rollback(previousApplied: ProfileSpec): Promise<void> {
    await this.#activateSpec(previousApplied);
  }

  async #activateSpec(spec: ProfileSpec): Promise<ProfileWorkflowActivationResult> {
    const runtime = this.#createRuntime();
    try {
      const startedAt = this.#now().toISOString();
      const snapshot = await createVerifiedPacSnapshot(
        spec,
        spec.settings.startup.route,
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
      return { snapshotId: activated.activeSnapshotId };
    } finally {
      runtime.dispose();
    }
  }
}
