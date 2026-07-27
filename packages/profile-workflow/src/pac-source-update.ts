import {
  cloneProfileSpecDraft,
  type PacProfile,
  type RuleSourceHeader,
} from '@zeroomega-nex/profile-spec';

import type {
  ProfileWorkflowPacSourceUpdateView,
  ProfileWorkflowRepository,
  ProfileWorkflowRuleSourceUpdateRecord,
  ProfileWorkflowState,
} from './contracts.js';
import type { ProfileWorkflowSecretStore } from './import-acceptance.js';
import {
  RULE_SOURCE_UPDATE_MAX_BYTES,
  RULE_SOURCE_UPDATE_TIMEOUT_MS,
  type ProfileWorkflowRuleSourceDownloader,
  type ProfileWorkflowRuleSourceDownloadResult,
} from './rule-source-update.js';
import { replaceProfileWorkflowDraft } from './state.js';

const PAC_UPDATE_KEY_PREFIX = 'pac:';
const HEADER_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/u;
const FORBIDDEN_HEADERS = new Set([
  'accept-encoding',
  'connection',
  'content-length',
  'cookie',
  'host',
  'origin',
  'proxy-authorization',
  'proxy-connection',
  'referer',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export interface ProfileWorkflowPacSourceUpdateService {
  readonly downloader: ProfileWorkflowRuleSourceDownloader;
  readonly secretStore: ProfileWorkflowSecretStore;
  readonly timeoutMs?: number;
  readonly maxBytes?: number;
  now?(): string;
}

export type ProfileWorkflowPacSourceUpdateResult =
  | {
      readonly status: 'updated';
      readonly state: ProfileWorkflowState;
      readonly update: ProfileWorkflowPacSourceUpdateView;
    }
  | {
      readonly status: 'failed' | 'invalid' | 'conflict' | 'storage-failure';
      readonly message: string;
      readonly state?: ProfileWorkflowState;
      readonly update?: ProfileWorkflowPacSourceUpdateView;
    };

function updateKey(profileId: string): string {
  return `${PAC_UPDATE_KEY_PREFIX}${profileId}`;
}

function timestamp(value: string): number | undefined {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pacProfile(state: ProfileWorkflowState, profileId: string): PacProfile | undefined {
  return state.draft.profiles.find(
    (candidate): candidate is PacProfile => candidate.id === profileId && candidate.kind === 'pac',
  );
}

export function inspectProfileWorkflowPacSourceUpdate(
  state: ProfileWorkflowState,
  profileId: string,
  now = new Date().toISOString(),
): ProfileWorkflowPacSourceUpdateView | undefined {
  const profile = pacProfile(state, profileId);
  if (!profile || profile.source.kind !== 'url') return undefined;
  const interval = state.draft.settings.ruleSourceUpdateIntervalMinutes;
  const record = state.ruleSourceUpdates?.[updateKey(profileId)];
  const matching = record?.url === profile.source.url ? record : undefined;
  const lastSuccess =
    matching?.lastSuccessAt === undefined ? undefined : timestamp(matching.lastSuccessAt);
  const current = timestamp(now);
  const stale =
    lastSuccess === undefined ||
    current === undefined ||
    current - lastSuccess >= interval * 60_000;
  return {
    profileId,
    url: profile.source.url,
    updateIntervalMinutes: interval,
    stale,
    ...(matching === undefined
      ? {}
      : {
          lastAttemptAt: matching.lastAttemptAt,
          ...(matching.lastSuccessAt === undefined
            ? {}
            : { lastSuccessAt: matching.lastSuccessAt }),
          ...(matching.lastBytes === undefined ? {} : { lastBytes: matching.lastBytes }),
          ...(matching.lastError === undefined
            ? {}
            : { lastError: structuredClone(matching.lastError) }),
        }),
  };
}

export function listDueProfileWorkflowPacSourceUpdates(
  state: ProfileWorkflowState,
  now = new Date().toISOString(),
): readonly ProfileWorkflowPacSourceUpdateView[] {
  const current = timestamp(now);
  return state.draft.profiles.flatMap((profile) => {
    if (profile.kind !== 'pac' || profile.source.kind !== 'url') return [];
    let parsed: URL;
    try {
      parsed = new URL(profile.source.url);
    } catch {
      return [];
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return [];
    const view = inspectProfileWorkflowPacSourceUpdate(state, profile.id, now);
    if (!view?.stale) return [];
    const lastAttempt =
      view.lastAttemptAt === undefined ? undefined : timestamp(view.lastAttemptAt);
    const due =
      lastAttempt === undefined ||
      current === undefined ||
      current - lastAttempt >= view.updateIntervalMinutes * 60_000;
    return due ? [view] : [];
  });
}

function normalizedMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/gu, ' ').trim().slice(0, 500) || 'PAC update failed';
}

function validateUrl(profile: PacProfile): string {
  if (profile.source.kind !== 'url')
    throw new TypeError('PAC source is inline and cannot be downloaded');
  let parsed: URL;
  try {
    parsed = new URL(profile.source.url);
  } catch {
    throw new TypeError('PAC URL must be an absolute URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TypeError('PAC download supports only HTTP and HTTPS URLs');
  }
  if (parsed.username || parsed.password) {
    throw new TypeError('PAC URL must not contain embedded credentials');
  }
  return parsed.href;
}

async function resolveHeaderValue(
  header: RuleSourceHeader,
  secretStore: ProfileWorkflowSecretStore,
): Promise<string> {
  if (header.value.kind === 'literal') return header.value.value;
  const secret = await secretStore.getSecret(header.value.secretRef);
  if (secret === undefined)
    throw new Error(`PAC header secret ${header.value.secretRef} is unavailable`);
  return secret;
}

async function resolveHeaders(
  profile: PacProfile,
  secretStore: ProfileWorkflowSecretStore,
): Promise<Readonly<Record<string, string>>> {
  const headers: Record<string, string> = {};
  const names = new Set<string>();
  for (const header of profile.headers ?? []) {
    const name = header.name.trim();
    const normalized = name.toLowerCase();
    if (!name) throw new TypeError('PAC request header name is required');
    if (!HEADER_NAME.test(name)) throw new TypeError(`PAC request header "${name}" is invalid`);
    if (normalized.startsWith('sec-') || FORBIDDEN_HEADERS.has(normalized)) {
      throw new TypeError(`PAC request header "${name}" is controlled by the browser`);
    }
    if (names.has(normalized)) throw new TypeError(`PAC request header "${name}" is duplicated`);
    names.add(normalized);
    headers[name] = await resolveHeaderValue(header, secretStore);
  }
  return headers;
}

function recordForFailure(
  state: ProfileWorkflowState,
  profileId: string,
  url: string,
  attemptedAt: string,
  message: string,
): ProfileWorkflowRuleSourceUpdateRecord {
  const key = updateKey(profileId);
  const previous = state.ruleSourceUpdates?.[key];
  const matching = previous?.url === url ? previous : undefined;
  return {
    sourceId: key,
    url,
    lastAttemptAt: attemptedAt,
    ...(matching?.lastSuccessAt === undefined ? {} : { lastSuccessAt: matching.lastSuccessAt }),
    ...(matching?.lastBytes === undefined ? {} : { lastBytes: matching.lastBytes }),
    lastError: { occurredAt: attemptedAt, message },
  };
}

function withUpdateRecord(
  state: ProfileWorkflowState,
  record: ProfileWorkflowRuleSourceUpdateRecord,
  generation = state.generation + 1,
): ProfileWorkflowState {
  return {
    ...state,
    generation,
    ruleSourceUpdates: {
      ...(state.ruleSourceUpdates ?? {}),
      [record.sourceId]: record,
    },
  };
}

async function persistFailure(
  repository: ProfileWorkflowRepository,
  initial: ProfileWorkflowState,
  profileId: string,
  url: string,
  attemptedAt: string,
  message: string,
  status: 'failed' | 'invalid',
): Promise<ProfileWorkflowPacSourceUpdateResult> {
  let current: ProfileWorkflowState | undefined;
  try {
    current = await repository.read();
  } catch (error) {
    return { status: 'storage-failure', message: normalizedMessage(error), state: initial };
  }
  if (!current || current.generation !== initial.generation) {
    return {
      status: 'conflict',
      message: 'profile workflow changed while the PAC update was running',
      ...(current === undefined ? {} : { state: current }),
    };
  }
  const profile = pacProfile(current, profileId);
  if (!profile || profile.source.kind !== 'url' || profile.source.url !== url) {
    return {
      status: 'conflict',
      message: 'PAC source changed while its update was running',
      state: current,
    };
  }
  const next = withUpdateRecord(
    current,
    recordForFailure(current, profileId, url, attemptedAt, message),
  );
  try {
    if (!(await repository.compareAndSwap(current.generation, next))) {
      const raced = await repository.read();
      return {
        status: 'conflict',
        message: 'profile workflow changed before the PAC failure could be recorded',
        ...(raced === undefined ? {} : { state: raced }),
      };
    }
  } catch (error) {
    return { status: 'storage-failure', message: normalizedMessage(error), state: current };
  }
  const update = inspectProfileWorkflowPacSourceUpdate(next, profileId, attemptedAt);
  return { status, message, state: next, ...(update === undefined ? {} : { update }) };
}

export async function updateProfileWorkflowPacSource(
  repository: ProfileWorkflowRepository,
  initial: ProfileWorkflowState,
  profileId: string,
  service: ProfileWorkflowPacSourceUpdateService,
): Promise<ProfileWorkflowPacSourceUpdateResult> {
  const profile = pacProfile(initial, profileId);
  if (!profile) return { status: 'invalid', message: `PAC profile ${profileId} does not exist` };
  if (profile.source.kind !== 'url') {
    return {
      status: 'invalid',
      message: 'PAC source is inline and cannot be downloaded',
      state: initial,
    };
  }
  const configuredUrl = profile.source.url;
  const attemptedAt = service.now?.() ?? new Date().toISOString();
  let url: string;
  let headers: Readonly<Record<string, string>>;
  try {
    url = validateUrl(profile);
    headers = await resolveHeaders(profile, service.secretStore);
  } catch (error) {
    return persistFailure(
      repository,
      initial,
      profileId,
      configuredUrl,
      attemptedAt,
      normalizedMessage(error),
      'invalid',
    );
  }

  let downloaded: ProfileWorkflowRuleSourceDownloadResult;
  try {
    downloaded = await service.downloader.download({
      url,
      headers,
      timeoutMs: service.timeoutMs ?? RULE_SOURCE_UPDATE_TIMEOUT_MS,
      maxBytes: service.maxBytes ?? RULE_SOURCE_UPDATE_MAX_BYTES,
    });
    if (!downloaded.content.trim()) throw new Error('PAC download returned empty content');
    if (!Number.isInteger(downloaded.bytes) || downloaded.bytes < 0) {
      throw new Error('PAC downloader returned an invalid byte count');
    }
    if (downloaded.bytes > (service.maxBytes ?? RULE_SOURCE_UPDATE_MAX_BYTES)) {
      throw new Error('PAC download exceeded the configured size limit');
    }
  } catch (error) {
    return persistFailure(
      repository,
      initial,
      profileId,
      configuredUrl,
      attemptedAt,
      normalizedMessage(error),
      'failed',
    );
  }

  let current: ProfileWorkflowState | undefined;
  try {
    current = await repository.read();
  } catch (error) {
    return { status: 'storage-failure', message: normalizedMessage(error), state: initial };
  }
  if (!current || current.generation !== initial.generation) {
    return {
      status: 'conflict',
      message: 'profile workflow changed while the PAC download was running',
      ...(current === undefined ? {} : { state: current }),
    };
  }
  const currentProfile = pacProfile(current, profileId);
  if (
    !currentProfile ||
    currentProfile.source.kind !== 'url' ||
    currentProfile.source.url !== configuredUrl
  ) {
    return {
      status: 'conflict',
      message: 'PAC URL changed while the download was running',
      state: current,
    };
  }

  const draft = cloneProfileSpecDraft(current.draft);
  const target = draft.profiles.find(
    (candidate): candidate is PacProfile => candidate.id === profileId && candidate.kind === 'pac',
  );
  if (!target || target.source.kind !== 'url') {
    return {
      status: 'conflict',
      message: 'PAC profile disappeared before update commit',
      state: current,
    };
  }
  target.source.script = downloaded.content;

  let next: ProfileWorkflowState;
  try {
    const replaced = replaceProfileWorkflowDraft(current, draft);
    const key = updateKey(profileId);
    const record: ProfileWorkflowRuleSourceUpdateRecord = {
      sourceId: key,
      url: target.source.url,
      lastAttemptAt: attemptedAt,
      lastSuccessAt: attemptedAt,
      lastBytes: downloaded.bytes,
    };
    next = withUpdateRecord(replaced, record, replaced.generation);
  } catch (error) {
    return { status: 'invalid', message: normalizedMessage(error), state: current };
  }

  try {
    if (!(await repository.compareAndSwap(current.generation, next))) {
      const raced = await repository.read();
      return {
        status: 'conflict',
        message: 'profile workflow changed before downloaded PAC content could be committed',
        ...(raced === undefined ? {} : { state: raced }),
      };
    }
  } catch (error) {
    return { status: 'storage-failure', message: normalizedMessage(error), state: current };
  }
  const update = inspectProfileWorkflowPacSourceUpdate(next, profileId, attemptedAt);
  if (!update)
    return {
      status: 'storage-failure',
      message: 'PAC update status was not available',
      state: next,
    };
  return { status: 'updated', state: next, update };
}
