import type { OriginalToolbarTitleArguments } from './original-toolbar-tab-state';

export const ORIGINAL_TOOLBAR_DEFAULT_TITLE_KEY = 'manifest_icon_default_title';
export const ORIGINAL_TOOLBAR_RESULT_TITLE_KEY = 'browserAction_titleWithResult';

export const ORIGINAL_TOOLBAR_DETAIL_KEYS = {
  externalProxy: 'browserAction_titleExternalProxy',
  inspect: 'browserAction_titleInspect',
  defaultRule: 'browserAction_defaultRuleDetails',
  directResult: 'browserAction_directResult',
  attachedPrefix: 'browserAction_attachedPrefix',
  temporaryRulePrefix: 'browserAction_tempRulePrefix',
} as const;

export type OriginalToolbarDetailKey =
  (typeof ORIGINAL_TOOLBAR_DETAIL_KEYS)[keyof typeof ORIGINAL_TOOLBAR_DETAIL_KEYS];

export interface OriginalToolbarI18nApi {
  getMessage(messageName: string, substitutions?: string | readonly string[]): string;
}

function requireOriginalToolbarMessage(
  api: OriginalToolbarI18nApi,
  messageName: string,
  substitutions?: string | readonly string[],
): string {
  const message = api.getMessage(messageName, substitutions);
  if (message.length === 0) {
    throw new Error(`Missing original toolbar locale message: ${messageName}`);
  }
  return message;
}

export function localizeOriginalToolbarDefaultTitle(api: OriginalToolbarI18nApi): string {
  return requireOriginalToolbarMessage(api, ORIGINAL_TOOLBAR_DEFAULT_TITLE_KEY);
}

/**
 * Preserve the exact original placeholder order:
 *
 * 1. selected/current profile name;
 * 2. resolved/result profile name or short title;
 * 3. detailed matching trace.
 *
 * Individual locale templates may omit a placeholder. The adapter still
 * supplies all three arguments because that is the original runtime contract.
 */
export function localizeOriginalToolbarResultTitle(
  api: OriginalToolbarI18nApi,
  arguments_: OriginalToolbarTitleArguments,
): string {
  return requireOriginalToolbarMessage(api, ORIGINAL_TOOLBAR_RESULT_TITLE_KEY, [
    arguments_.currentProfileName,
    arguments_.resultProfileName,
    arguments_.details,
  ]);
}

export function localizeOriginalToolbarDetail(
  api: OriginalToolbarI18nApi,
  key: OriginalToolbarDetailKey,
  substitutions?: string | readonly string[],
): string {
  return requireOriginalToolbarMessage(api, key, substitutions);
}
