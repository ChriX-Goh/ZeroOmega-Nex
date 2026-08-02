import {
  deriveOriginalToolbarBadgeText,
  type OriginalToolbarBadgeInput,
} from './original-toolbar-badge';
import {
  deriveOriginalToolbarIconState,
  type OriginalToolbarIconState,
  type OriginalToolbarIconStateInput,
} from './original-toolbar-icon-state';

export interface OriginalToolbarTitleArguments {
  readonly currentProfileName: string;
  readonly resultProfileName: string;
  readonly details: string;
}

export interface OriginalToolbarTabStateInput {
  readonly currentProfileName: string;
  readonly resultProfileName: string;
  readonly details: string;
  readonly icon: OriginalToolbarIconStateInput;
  readonly badge: OriginalToolbarBadgeInput;
  readonly detailPrefix?: string;
  readonly badgeBackgroundColor?: string;
}

export interface OriginalToolbarTabState {
  readonly icon: OriginalToolbarIconState;
  readonly titleArguments: OriginalToolbarTitleArguments;
  readonly badgeText?: string;
  readonly detailPrefix?: string;
  readonly badgeBackgroundColor?: string;
}

/**
 * Compose the browser-independent, per-tab action state produced by the
 * original ZeroOmega v3.5.0 `actionForUrl` path.
 *
 * Localization remains an adapter responsibility: `titleArguments` map to the
 * original `browserAction_titleWithResult` placeholders. This model exposes no
 * Draft, Applied revision, snapshot, secret, internal profile ID or Nex-only
 * status taxonomy.
 */
export function deriveOriginalToolbarTabState(
  input: OriginalToolbarTabStateInput,
): OriginalToolbarTabState {
  const badgeText = deriveOriginalToolbarBadgeText(input.badge);

  return {
    icon: deriveOriginalToolbarIconState(input.icon),
    titleArguments: {
      currentProfileName: input.currentProfileName,
      resultProfileName: input.resultProfileName,
      details: input.details,
    },
    ...(badgeText === undefined ? {} : { badgeText }),
    ...(input.detailPrefix === undefined ? {} : { detailPrefix: input.detailPrefix }),
    ...(input.badgeBackgroundColor === undefined
      ? {}
      : { badgeBackgroundColor: input.badgeBackgroundColor }),
  };
}
