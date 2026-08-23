export const PROFILE_WORKFLOW_SOURCE_UPDATE_ERROR_CODES = [
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
