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

interface ProfileWorkflowClientApi {
  readonly runtime: {
    sendMessage(message: ProfileWorkflowCommand): Promise<unknown>;
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
