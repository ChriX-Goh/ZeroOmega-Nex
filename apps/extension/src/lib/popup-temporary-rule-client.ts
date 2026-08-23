import type { ProfileRouteTarget } from '@zeroomega-nex/profile-spec';
import type { PopupTemporaryRuleView } from '@zeroomega-nex/profile-workflow';
import { browser } from 'wxt/browser';

export const POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL =
  'zeroomega-nex/popup-temporary-rules/v1' as const;

export type PopupTemporaryRuleCommand =
  | {
      readonly channel: typeof POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL;
      readonly action: 'get';
    }
  | {
      readonly channel: typeof POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL;
      readonly action: 'toggle';
      readonly expectedAppliedRevisionId: string;
      readonly domain: string;
      readonly route: ProfileRouteTarget;
    }
  | {
      readonly channel: typeof POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL;
      readonly action: 'remove';
      readonly expectedAppliedRevisionId: string;
      readonly domain: string;
    }
  | {
      readonly channel: typeof POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL;
      readonly action: 'clear';
      readonly expectedAppliedRevisionId: string;
    };

export type PopupTemporaryRuleCommandResponse =
  | { readonly ok: true; readonly view: PopupTemporaryRuleView }
  | {
      readonly ok: false;
      readonly code: 'invalid' | 'conflict' | 'activation-failed' | 'storage-failure';
      readonly message: string;
      readonly view?: PopupTemporaryRuleView;
    };

export function isPopupTemporaryRuleCommand(value: unknown): value is PopupTemporaryRuleCommand {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.channel !== POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL) return false;
  if (record.action === 'get') return true;
  if (
    typeof record.expectedAppliedRevisionId !== 'string' ||
    record.expectedAppliedRevisionId.length === 0
  ) {
    return false;
  }
  if (record.action === 'clear') return true;
  if (typeof record.domain !== 'string' || record.domain.length === 0) return false;
  if (record.action === 'remove') return true;
  if (record.action !== 'toggle') return false;
  if (record.route === null || typeof record.route !== 'object' || Array.isArray(record.route)) {
    return false;
  }
  const route = record.route as Record<string, unknown>;
  return (
    route.kind === 'direct' ||
    route.kind === 'system' ||
    (route.kind === 'profile' && typeof route.profileId === 'string' && route.profileId.length > 0)
  );
}

type PopupTemporaryRuleCommandWithoutChannel<T> = T extends {
  readonly channel: unknown;
}
  ? Omit<T, 'channel'>
  : never;

export type PopupTemporaryRuleCommandInput =
  PopupTemporaryRuleCommandWithoutChannel<PopupTemporaryRuleCommand>;

export async function sendPopupTemporaryRuleCommand(
  command: PopupTemporaryRuleCommandInput,
): Promise<PopupTemporaryRuleCommandResponse> {
  const response = await browser.runtime.sendMessage({
    channel: POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL,
    ...command,
  });
  if (response === undefined) {
    return {
      ok: false,
      code: 'storage-failure',
      message: 'temporary rule runtime did not respond',
    };
  }
  return response as PopupTemporaryRuleCommandResponse;
}
