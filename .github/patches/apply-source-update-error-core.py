from pathlib import Path

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:180]!r}')
    path.write_text(text.replace(old, new, 1))


error_path = ROOT / 'packages/profile-workflow/src/source-update-error.ts'
error_path.write_text("""export const PROFILE_WORKFLOW_SOURCE_UPDATE_ERROR_CODES = [
  'url-invalid',
  'url-scheme-unsupported',
  'url-credentials-forbidden',
  'header-name-required',
  'header-name-invalid',
  'header-browser-controlled',
  'header-duplicate',
  'header-secret-unavailable',
  'request-timeout',
  'request-network-failed',
  'response-http-error',
  'response-too-large',
  'response-empty',
  'response-byte-count-invalid',
  'unknown-failure',
] as const;

export type ProfileWorkflowSourceUpdateErrorCode =
  (typeof PROFILE_WORKFLOW_SOURCE_UPDATE_ERROR_CODES)[number];

export interface ProfileWorkflowSourceUpdateFailure {
  readonly code: ProfileWorkflowSourceUpdateErrorCode;
  readonly message: string;
  readonly httpStatus?: number;
  readonly limitBytes?: number;
}

export interface ProfileWorkflowSourceUpdateErrorOptions {
  readonly cause?: unknown;
  readonly httpStatus?: number;
  readonly limitBytes?: number;
}

export class ProfileWorkflowSourceUpdateError extends Error {
  readonly code: ProfileWorkflowSourceUpdateErrorCode;
  readonly httpStatus?: number;
  readonly limitBytes?: number;

  constructor(
    code: ProfileWorkflowSourceUpdateErrorCode,
    message: string,
    options: ProfileWorkflowSourceUpdateErrorOptions = {},
  ) {
    super(message);
    this.name = 'ProfileWorkflowSourceUpdateError';
    this.code = code;
    if (options.httpStatus !== undefined) this.httpStatus = options.httpStatus;
    if (options.limitBytes !== undefined) this.limitBytes = options.limitBytes;
    if (options.cause !== undefined) (this as Error & { cause?: unknown }).cause = options.cause;
  }
}

export function isProfileWorkflowSourceUpdateErrorCode(
  value: unknown,
): value is ProfileWorkflowSourceUpdateErrorCode {
  return (
    typeof value === 'string' &&
    (PROFILE_WORKFLOW_SOURCE_UPDATE_ERROR_CODES as readonly string[]).includes(value)
  );
}

export function normalizeProfileWorkflowSourceUpdateFailure(
  error: unknown,
  fallbackMessage: string,
): ProfileWorkflowSourceUpdateFailure {
  if (error instanceof ProfileWorkflowSourceUpdateError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.httpStatus === undefined ? {} : { httpStatus: error.httpStatus }),
      ...(error.limitBytes === undefined ? {} : { limitBytes: error.limitBytes }),
    };
  }
  return { code: 'unknown-failure', message: fallbackMessage };
}
""")

contracts = ROOT / 'packages/profile-workflow/src/contracts.ts'
replace_once(
    contracts,
    "import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';",
    "import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';\n\n"
    "import type { ProfileWorkflowSourceUpdateErrorCode } from './source-update-error.js';",
)
replace_once(
    contracts,
    """export interface ProfileWorkflowRuleSourceUpdateError {
  readonly occurredAt: string;
  readonly message: string;
}
""",
    """export interface ProfileWorkflowRuleSourceUpdateError {
  readonly occurredAt: string;
  readonly code: ProfileWorkflowSourceUpdateErrorCode;
  readonly message: string;
  readonly httpStatus?: number;
  readonly limitBytes?: number;
}
""",
)

index = ROOT / 'packages/profile-workflow/src/index.ts'
insert = """export {
  PROFILE_WORKFLOW_SOURCE_UPDATE_ERROR_CODES,
  ProfileWorkflowSourceUpdateError,
  isProfileWorkflowSourceUpdateErrorCode,
  normalizeProfileWorkflowSourceUpdateFailure,
  type ProfileWorkflowSourceUpdateErrorCode,
  type ProfileWorkflowSourceUpdateErrorOptions,
  type ProfileWorkflowSourceUpdateFailure,
} from './source-update-error.js';
"""
replace_once(index, "export { listProfileWorkflowRevisionHistory } from './revision-history.js';", insert + "export { listProfileWorkflowRevisionHistory } from './revision-history.js';")

storage = ROOT / 'packages/profile-workflow/src/storage-repository.ts'
replace_once(
    storage,
    "import { replaceProfileWorkflowDraft } from './state.js';" if False else "} from './contracts.js';",
    "} from './contracts.js';\nimport { isProfileWorkflowSourceUpdateErrorCode } from './source-update-error.js';",
)
old_error = """            return {
              occurredAt: requiredString(
                error,
                'occurredAt',
                `ruleSourceUpdates.${sourceId}.lastError`,
              ),
              message: requiredString(error, 'message', `ruleSourceUpdates.${sourceId}.lastError`),
            };
"""
new_error = """            const label = `ruleSourceUpdates.${sourceId}.lastError`;
            const code = error.code ?? 'unknown-failure';
            if (!isProfileWorkflowSourceUpdateErrorCode(code)) {
              throw new TypeError(`${label}.code is invalid`);
            }
            const httpStatus = error.httpStatus;
            if (
              httpStatus !== undefined &&
              (!Number.isInteger(httpStatus) || Number(httpStatus) < 100 || Number(httpStatus) > 599)
            ) {
              throw new TypeError(`${label}.httpStatus must be an HTTP status integer`);
            }
            const limitBytes = error.limitBytes;
            if (limitBytes !== undefined && (!Number.isInteger(limitBytes) || Number(limitBytes) < 0)) {
              throw new TypeError(`${label}.limitBytes must be a non-negative integer`);
            }
            return {
              occurredAt: requiredString(error, 'occurredAt', label),
              code,
              message: requiredString(error, 'message', label),
              ...(httpStatus === undefined ? {} : { httpStatus: Number(httpStatus) }),
              ...(limitBytes === undefined ? {} : { limitBytes: Number(limitBytes) }),
            };
"""
replace_once(storage, old_error, new_error)

print('Created stable source-update error contract, exports, and backward-compatible storage parser.')
