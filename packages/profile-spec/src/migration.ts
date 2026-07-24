import { PROFILE_SPEC_SCHEMA_VERSION, type ProfileSpec } from './types.js';
import {
  validateProfileSpec,
  type ProfileSpecValidationResult,
  type ValidationIssue,
} from './validation.js';

export interface ProfileSpecMigration {
  readonly fromVersion: string;
  readonly toVersion: string;
  migrate(input: Readonly<Record<string, unknown>>): unknown;
}

export interface ProfileSpecMigrationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly value?: ProfileSpec;
  readonly appliedMigrations: readonly string[];
}

export const PROFILE_SPEC_MIGRATIONS: readonly ProfileSpecMigration[] = Object.freeze([]);

function migrationIssue(code: string, message: string): ValidationIssue {
  return {
    code,
    path: '/schemaVersion',
    message,
    severity: 'error',
  };
}

function objectVersion(input: unknown): string | undefined {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return undefined;
  }
  const version = (input as Record<string, unknown>).schemaVersion;
  return typeof version === 'string' ? version : undefined;
}

function validationResult(
  result: ProfileSpecValidationResult,
  appliedMigrations: readonly string[],
): ProfileSpecMigrationResult {
  if (!result.valid || !result.value) {
    return {
      valid: false,
      issues: result.issues,
      appliedMigrations,
    };
  }

  return {
    valid: true,
    issues: result.issues,
    value: result.value,
    appliedMigrations,
  };
}

export function migrateProfileSpec(
  input: unknown,
  migrations: readonly ProfileSpecMigration[] = PROFILE_SPEC_MIGRATIONS,
): ProfileSpecMigrationResult {
  const initialVersion = objectVersion(input);
  if (initialVersion === undefined) {
    return validationResult(validateProfileSpec(input), []);
  }

  let current: unknown = input;
  let currentVersion = initialVersion;
  const appliedMigrations: string[] = [];
  const visitedVersions = new Set<string>();

  while (currentVersion !== PROFILE_SPEC_SCHEMA_VERSION) {
    if (visitedVersions.has(currentVersion)) {
      return {
        valid: false,
        issues: [
          migrationIssue(
            'migration.cycle',
            `migration chain returned to schema version "${currentVersion}"`,
          ),
        ],
        appliedMigrations,
      };
    }
    visitedVersions.add(currentVersion);

    const step = migrations.find((candidate) => candidate.fromVersion === currentVersion);
    if (!step) {
      return {
        valid: false,
        issues: [
          migrationIssue(
            'migration.unsupported-version',
            `schema version "${currentVersion}" cannot be migrated to ${PROFILE_SPEC_SCHEMA_VERSION}`,
          ),
        ],
        appliedMigrations,
      };
    }

    if (current === null || typeof current !== 'object' || Array.isArray(current)) {
      return {
        valid: false,
        issues: [
          migrationIssue(
            'migration.invalid-intermediate',
            `migration ${step.fromVersion} -> ${step.toVersion} did not receive an object`,
          ),
        ],
        appliedMigrations,
      };
    }

    try {
      current = step.migrate(current as Readonly<Record<string, unknown>>);
    } catch (error) {
      return {
        valid: false,
        issues: [
          migrationIssue(
            'migration.step-failed',
            error instanceof Error ? error.message : `migration from ${currentVersion} failed`,
          ),
        ],
        appliedMigrations,
      };
    }

    appliedMigrations.push(`${step.fromVersion}->${step.toVersion}`);
    currentVersion = objectVersion(current) ?? step.toVersion;
  }

  return validationResult(validateProfileSpec(current), appliedMigrations);
}
