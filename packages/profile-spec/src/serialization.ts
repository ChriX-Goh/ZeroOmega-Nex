import { InvalidProfileSpecError } from './errors.js';
import { migrateProfileSpec, type ProfileSpecMigration } from './migration.js';
import type { JsonValue, ProfileSpec, RevisionMetadata } from './types.js';
import {
  validateProfileSpec,
  validateProfileSpecDraft,
  type ProfileSpecValidationResult,
  type ValidationIssue,
} from './validation.js';

export interface SerializeProfileSpecOptions {
  readonly space?: number;
  readonly trailingNewline?: boolean;
}

export type ParseProfileSpecResult =
  | {
      readonly valid: true;
      readonly value: ProfileSpec;
      readonly issues: readonly ValidationIssue[];
      readonly appliedMigrations: readonly string[];
    }
  | {
      readonly valid: false;
      readonly issues: readonly ValidationIssue[];
      readonly appliedMigrations: readonly string[];
    };

export interface CreateProfileSpecRevisionOptions {
  readonly id: string;
  readonly createdAt: string;
  readonly deviceId?: string;
  update?(draft: ProfileSpec): void;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const nested = (value as Record<string, unknown>)[key];
      if (nested !== undefined) {
        output[key] = canonicalize(nested);
      }
    }
    return output;
  }
  return value;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type ProfileSpecValidator = (value: unknown) => ProfileSpecValidationResult;

function assertValidProfileSpec(
  value: unknown,
  operation: string,
  validator: ProfileSpecValidator = validateProfileSpec,
  requiredDescription = 'valid ProfileSpec',
): asserts value is ProfileSpec {
  const result = validator(value);
  if (!result.valid || !result.value) {
    throw new InvalidProfileSpecError(
      `${operation} requires a ${requiredDescription}`,
      result.issues,
    );
  }
}

export function cloneProfileSpec(value: ProfileSpec): ProfileSpec {
  assertValidProfileSpec(value, 'cloneProfileSpec');
  return cloneJson(value);
}

export function cloneProfileSpecDraft(value: ProfileSpec): ProfileSpec {
  assertValidProfileSpec(
    value,
    'cloneProfileSpecDraft',
    validateProfileSpecDraft,
    'structurally valid ProfileSpec draft',
  );
  return cloneJson(value);
}

export function canonicalProfileSpecValue(value: ProfileSpec): JsonValue {
  assertValidProfileSpec(value, 'canonicalProfileSpecValue');
  return canonicalize(value) as JsonValue;
}

function serializeValidatedProfileSpec(
  value: ProfileSpec,
  options: SerializeProfileSpecOptions,
  operation: string,
  validator: ProfileSpecValidator,
): string {
  const space = options.space ?? 2;
  if (!Number.isInteger(space) || space < 0 || space > 10) {
    throw new RangeError('ProfileSpec indentation must be an integer between 0 and 10');
  }

  assertValidProfileSpec(value, operation, validator);
  const serialized = JSON.stringify(canonicalize(value), null, space);
  return options.trailingNewline === false ? serialized : `${serialized}\n`;
}

export function serializeProfileSpec(
  value: ProfileSpec,
  options: SerializeProfileSpecOptions = {},
): string {
  return serializeValidatedProfileSpec(value, options, 'serializeProfileSpec', validateProfileSpec);
}

export function serializeProfileSpecDraft(
  value: ProfileSpec,
  options: SerializeProfileSpecOptions = {},
): string {
  return serializeValidatedProfileSpec(
    value,
    options,
    'serializeProfileSpecDraft',
    validateProfileSpecDraft,
  );
}

export function parseProfileSpec(
  text: string,
  migrations?: readonly ProfileSpecMigration[],
): ParseProfileSpecResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      valid: false,
      issues: [
        {
          code: 'parse.invalid-json',
          path: '/',
          message: error instanceof Error ? error.message : 'invalid JSON',
          severity: 'error',
        },
      ],
      appliedMigrations: [],
    };
  }

  const result = migrateProfileSpec(parsed, migrations);
  if (!result.valid || !result.value) {
    return {
      valid: false,
      issues: result.issues,
      appliedMigrations: result.appliedMigrations,
    };
  }

  return {
    valid: true,
    value: result.value,
    issues: result.issues,
    appliedMigrations: result.appliedMigrations,
  };
}

export function createProfileSpecRevision(
  current: ProfileSpec,
  options: CreateProfileSpecRevisionOptions,
): ProfileSpec {
  assertValidProfileSpec(current, 'createProfileSpecRevision');

  const draft = cloneJson(current);
  options.update?.(draft);

  const revision: RevisionMetadata = {
    id: options.id,
    parentId: current.revision.id,
    createdAt: options.createdAt,
    ...(options.deviceId === undefined ? {} : { deviceId: options.deviceId }),
  };
  draft.revision = revision;

  assertValidProfileSpec(draft, 'createProfileSpecRevision');
  return draft;
}
