import {
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  type ProfileWorkflowCommand,
  type ProfileWorkflowCommandResponse,
} from '@zeroomega-nex/profile-workflow';

export type ProfileWorkflowCommandInput = ProfileWorkflowCommand extends infer Command
  ? Command extends { readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL }
    ? Omit<Command, 'channel'>
    : never
  : never;

export const PROFILE_WORKFLOW_STATE_STORAGE_KEY = 'zeroomega-nex/profile-workflow/v1/state';

export interface ProfileWorkflowStorageChange {
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
}

export type ProfileWorkflowStorageChangeListener = (
  changes: Readonly<Record<string, ProfileWorkflowStorageChange>>,
  areaName: string,
) => void;

interface ProfileWorkflowClientApi {
  readonly runtime: {
    sendMessage(message: ProfileWorkflowCommand): Promise<unknown>;
  };
  readonly permissions?: {
    request(permissions: { origins: string[] }): Promise<boolean>;
  };
  readonly storage?: {
    readonly onChanged: {
      addListener(listener: ProfileWorkflowStorageChangeListener): void;
      removeListener(listener: ProfileWorkflowStorageChangeListener): void;
    };
  };
}

function isResponse(value: unknown): value is ProfileWorkflowCommandResponse {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.ok === true) return record.state !== undefined && record.view !== undefined;
  return (
    record.ok === false && typeof record.code === 'string' && typeof record.message === 'string'
  );
}

function permissionOrigin(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return `${parsed.protocol}//${parsed.hostname}/*`;
  } catch {
    return undefined;
  }
}

export function subscribeProfileWorkflowStateChanges(
  listener: (value: unknown | undefined) => void,
  api: ProfileWorkflowClientApi = browser as unknown as ProfileWorkflowClientApi,
): () => void {
  if (!api.storage) return () => undefined;
  const storageListener: ProfileWorkflowStorageChangeListener = (changes, areaName) => {
    if (
      areaName === 'local' &&
      Object.prototype.hasOwnProperty.call(changes, PROFILE_WORKFLOW_STATE_STORAGE_KEY)
    ) {
      listener(changes[PROFILE_WORKFLOW_STATE_STORAGE_KEY]?.newValue);
    }
  };
  api.storage.onChanged.addListener(storageListener);
  return () => api.storage?.onChanged.removeListener(storageListener);
}

export async function requestRuleSourceOriginPermission(
  url: string,
  api: ProfileWorkflowClientApi = browser as unknown as ProfileWorkflowClientApi,
): Promise<boolean> {
  const origin = permissionOrigin(url);
  if (!origin || !api.permissions) return false;
  return api.permissions.request({ origins: [origin] });
}

export type RuleSourceOriginPermissionRunResult<T> =
  | { readonly granted: false }
  | { readonly granted: true; readonly value: T };

export async function runWithRuleSourceOriginPermission<T>(
  url: string,
  operation: () => Promise<T>,
  api: ProfileWorkflowClientApi = browser as unknown as ProfileWorkflowClientApi,
): Promise<RuleSourceOriginPermissionRunResult<T>> {
  const granted = await requestRuleSourceOriginPermission(url, api);
  if (!granted) return { granted: false };
  return { granted: true, value: await operation() };
}

export async function sendProfileWorkflowCommand(
  command: ProfileWorkflowCommandInput,
  api: ProfileWorkflowClientApi = browser as unknown as ProfileWorkflowClientApi,
): Promise<ProfileWorkflowCommandResponse> {
  const response = await api.runtime.sendMessage({
    channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
    ...command,
  } as ProfileWorkflowCommand);
  if (!isResponse(response)) {
    throw new Error('profile workflow background returned an invalid response');
  }
  return response;
}
