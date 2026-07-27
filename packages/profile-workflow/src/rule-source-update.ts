import {
  cloneProfileSpecDraft,
  type RuleSource,
  type RuleSourceHeader,
} from '@zeroomega-nex/profile-spec';

import type {
  ProfileWorkflowRepository,
  ProfileWorkflowRuleSourceUpdateRecord,
  ProfileWorkflowRuleSourceUpdateView,
  ProfileWorkflowState,
} from './contracts.js';
import type { ProfileWorkflowSecretStore } from './import-acceptance.js';
import { replaceProfileWorkflowDraft } from './state.js';

export const RULE_SOURCE_UPDATE_TIMEOUT_MS = 10_000;
export const RULE_SOURCE_UPDATE_MAX_BYTES = 4 * 1024 * 1024;

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

export interface ProfileWorkflowRuleSourceDownloadRequest {
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly timeoutMs: number;
  readonly maxBytes: number;
}

export interface ProfileWorkflowRuleSourceDownloadResult {
  readonly content: string;
  readonly bytes: number;
}

export interface ProfileWorkflowRuleSourceDownloader {
  download(
    request: ProfileWorkflowRuleSourceDownloadRequest,
  ): Promise<ProfileWorkflowRuleSourceDownloadResult>;
}

export interface ProfileWorkflowRuleSourceUpdateService {
  readonly downloader: ProfileWorkflowRuleSourceDownloader;
  readonly secretStore: ProfileWorkflowSecretStore;
  readonly timeoutMs?: number;
  readonly maxBytes?: number;
  now?(): string;
}

export type ProfileWorkflowRuleSourceUpdateResult =
  | {
      readonly status: 'updated';
      readonly state: ProfileWorkflowState;
      readonly update: ProfileWorkflowRuleSourceUpdateView;
    }
  | {
      readonly status: 'failed' | 'invalid' | 'conflict' | 'storage-failure';
      readonly message: string;
      readonly state?: ProfileWorkflowState;
      readonly update?: ProfileWorkflowRuleSourceUpdateView;
    };

function timestamp(value: string): number | undefined {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sourceById(state: ProfileWorkflowState, sourceId: string): RuleSource | undefined {
  return state.draft.ruleSources.find((candidate) => candidate.id === sourceId);
}

function updateIntervalMinutes(state: ProfileWorkflowState, source: RuleSource): number {
  return source.updateIntervalMinutes ?? state.draft.settings.ruleSourceUpdateIntervalMinutes;
}

export function inspectProfileWorkflowRuleSourceUpdate(
  state: ProfileWorkflowState,
  sourceId: string,
  now = new Date().toISOString(),
): ProfileWorkflowRuleSourceUpdateView | undefined {
  const source = sourceById(state, sourceId);
  if (!source || source.location.kind !== 'url') return undefined;
  const interval = updateIntervalMinutes(state, source);
  const record = state.ruleSourceUpdates?.[sourceId];
  const matching = record?.url === source.location.url ? record : undefined;
  const lastSuccess =
    matching?.lastSuccessAt === undefined ? undefined : timestamp(matching.lastSuccessAt);
  const current = timestamp(now);
  const stale =
    lastSuccess === undefined ||
    current === undefined ||
    current - lastSuccess >= interval * 60_000;
  return {
    sourceId,
    url: source.location.url,
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

function normalizedMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/gu, ' ').trim().slice(0, 500) || 'Rule List update failed';
}

function validateUrl(source: RuleSource): string {
  if (source.location.kind !== 'url') {
    throw new TypeError('Rule Source is inline and cannot be downloaded');
  }
  let parsed: URL;
  try {
    parsed = new URL(source.location.url);
  } catch {
    throw new TypeError('Rule Source URL must be an absolute URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TypeError('Rule Source download supports only HTTP and HTTPS URLs');
  }
  if (parsed.username || parsed.password) {
    throw new TypeError('Rule Source URL must not contain embedded credentials');
  }
  return parsed.href;
}

async function resolveHeaderValue(
  header: RuleSourceHeader,
  secretStore: ProfileWorkflowSecretStore,
): Promise<string> {
  if (header.value.kind === 'literal') return header.value.value;
  const secret = await secretStore.getSecret(header.value.secretRef);
  if (secret === undefined) {
    throw new Error(`Rule Source header secret ${header.value.secretRef} is unavailable`);
  }
  return secret;
}

async function resolveHeaders(
  source: RuleSource,
  secretStore: ProfileWorkflowSecretStore,
): Promise<Readonly<Record<string, string>>> {
  const headers: Record<string, string> = {};
  const names = new Set<string>();
  for (const header of source.headers ?? []) {
    const name = header.name.trim();
    const normalized = name.toLowerCase();
    if (!name) throw new TypeError('Rule Source request header name is required');
    if (!HEADER_NAME.test(name)) {
      throw new TypeError(`Rule Source request header "${name}" is invalid`);
    }
    if (normalized.startsWith('sec-') || FORBIDDEN_HEADERS.has(normalized)) {
      throw new TypeError(`Rule Source request header "${name}" is controlled by the browser`);
    }
    if (names.has(normalized)) {
      throw new TypeError(`Rule Source request header "${name}" is duplicated`);
    }
    names.add(normalized);
    headers[name] = await resolveHeaderValue(header, secretStore);
  }
  return headers;
}

function recordForFailure(
  state: ProfileWorkflowState,
  sourceId: string,
  url: string,
  attemptedAt: string,
  message: string,
): ProfileWorkflowRuleSourceUpdateRecord {
  const previous = state.ruleSourceUpdates?.[sourceId];
  const matching = previous?.url === url ? previous : undefined;
  return {
    sourceId,
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
  sourceId: string,
  url: string,
  attemptedAt: string,
  message: string,
  status: 'failed' | 'invalid',
): Promise<ProfileWorkflowRuleSourceUpdateResult> {
  let current: ProfileWorkflowState | undefined;
  try {
    current = await repository.read();
  } catch (error) {
    return { status: 'storage-failure', message: normalizedMessage(error), state: initial };
  }
  if (!current || current.generation !== initial.generation) {
    return {
      status: 'conflict',
      message: 'profile workflow changed while the Rule Source update was running',
      ...(current === undefined ? {} : { state: current }),
    };
  }
  const source = sourceById(current, sourceId);
  if (!source || source.location.kind !== 'url' || source.location.url !== url) {
    return {
      status: 'conflict',
      message: 'Rule Source changed while its update was running',
      state: current,
    };
  }
  const next = withUpdateRecord(
    current,
    recordForFailure(current, sourceId, url, attemptedAt, message),
  );
  try {
    if (!(await repository.compareAndSwap(current.generation, next))) {
      const raced = await repository.read();
      return {
        status: 'conflict',
        message: 'profile workflow changed before the Rule Source failure could be recorded',
        ...(raced === undefined ? {} : { state: raced }),
      };
    }
  } catch (error) {
    return { status: 'storage-failure', message: normalizedMessage(error), state: current };
  }
  const update = inspectProfileWorkflowRuleSourceUpdate(next, sourceId, attemptedAt);
  return {
    status,
    message,
    state: next,
    ...(update === undefined ? {} : { update }),
  };
}

export async function updateProfileWorkflowRuleSource(
  repository: ProfileWorkflowRepository,
  initial: ProfileWorkflowState,
  sourceId: string,
  service: ProfileWorkflowRuleSourceUpdateService,
): Promise<ProfileWorkflowRuleSourceUpdateResult> {
  const source = sourceById(initial, sourceId);
  if (!source) return { status: 'invalid', message: `Rule Source ${sourceId} does not exist` };
  if (source.location.kind !== 'url') {
    return {
      status: 'invalid',
      message: 'Rule Source is inline and cannot be downloaded',
      state: initial,
    };
  }
  const configuredUrl = source.location.url;
  const attemptedAt = service.now?.() ?? new Date().toISOString();
  let url: string;
  let headers: Readonly<Record<string, string>>;
  try {
    url = validateUrl(source);
    headers = await resolveHeaders(source, service.secretStore);
  } catch (error) {
    const message = normalizedMessage(error);
    return persistFailure(
      repository,
      initial,
      sourceId,
      configuredUrl,
      attemptedAt,
      message,
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
    if (!downloaded.content.trim()) {
      throw new Error('Rule Source download returned empty content');
    }
    if (!Number.isInteger(downloaded.bytes) || downloaded.bytes < 0) {
      throw new Error('Rule Source downloader returned an invalid byte count');
    }
    if (downloaded.bytes > (service.maxBytes ?? RULE_SOURCE_UPDATE_MAX_BYTES)) {
      throw new Error('Rule Source download exceeded the configured size limit');
    }
  } catch (error) {
    return persistFailure(
      repository,
      initial,
      sourceId,
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
      message: 'profile workflow changed while the Rule Source download was running',
      ...(current === undefined ? {} : { state: current }),
    };
  }
  const currentSource = sourceById(current, sourceId);
  if (
    !currentSource ||
    currentSource.location.kind !== 'url' ||
    currentSource.location.url !== configuredUrl
  ) {
    return {
      status: 'conflict',
      message: 'Rule Source URL changed while the download was running',
      state: current,
    };
  }

  const draft = cloneProfileSpecDraft(current.draft);
  const target = draft.ruleSources.find((candidate) => candidate.id === sourceId);
  if (!target || target.location.kind !== 'url') {
    return {
      status: 'conflict',
      message: 'Rule Source disappeared before update commit',
      state: current,
    };
  }
  target.location.content = downloaded.content;

  let next: ProfileWorkflowState;
  try {
    const replaced = replaceProfileWorkflowDraft(current, draft);
    const record: ProfileWorkflowRuleSourceUpdateRecord = {
      sourceId,
      url: target.location.url,
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
        message:
          'profile workflow changed before downloaded Rule Source content could be committed',
        ...(raced === undefined ? {} : { state: raced }),
      };
    }
  } catch (error) {
    return { status: 'storage-failure', message: normalizedMessage(error), state: current };
  }
  const update = inspectProfileWorkflowRuleSourceUpdate(next, sourceId, attemptedAt);
  if (!update) {
    return {
      status: 'storage-failure',
      message: 'Rule Source update status was not available',
      state: next,
    };
  }
  return { status: 'updated', state: next, update };
}
