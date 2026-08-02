import type { OriginalToolbarIconSize } from './original-toolbar-icon';

export interface OriginalToolbarActionImageData {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

export type OriginalToolbarActionImageDataSet = Readonly<
  Partial<Record<OriginalToolbarIconSize, OriginalToolbarActionImageData>>
>;

export type OriginalToolbarActionIconPaths = Readonly<
  Partial<Record<OriginalToolbarIconSize, string>>
>;

interface OriginalToolbarActionIconDetails {
  readonly tabId?: number;
  readonly imageData?: OriginalToolbarActionImageDataSet;
  readonly path?: OriginalToolbarActionIconPaths;
}

export interface OriginalToolbarActionApi {
  setIcon(details: OriginalToolbarActionIconDetails): Promise<void> | void;
  setTitle(details: { readonly tabId?: number; readonly title: string }): Promise<void> | void;
  setBadgeText(details: { readonly tabId?: number; readonly text: string }): Promise<void> | void;
  setBadgeBackgroundColor(details: {
    readonly tabId?: number;
    readonly color: string;
  }): Promise<void> | void;
  setPopup(details: { readonly tabId?: number; readonly popup: string }): Promise<void> | void;
}

export interface OriginalToolbarActionPresentation {
  readonly tabId?: number;
  readonly title: string;
  readonly badgeText?: string;
  readonly badgeBackgroundColor: string;
  readonly popup: string;
  readonly imageData?: OriginalToolbarActionImageDataSet;
  readonly fallbackIconPaths: OriginalToolbarActionIconPaths;
}

/**
 * Single browser-API boundary for the original-facing toolbar presentation.
 *
 * State derivation, localization and icon rendering remain outside this
 * adapter. The adapter always writes title, Badge and Popup state. Icon writes
 * follow the original boundary: no dynamic image means no setIcon call, while
 * a rejected full image set is retried with the legacy 19/38 subset.
 */
export class OriginalToolbarActionAdapter {
  constructor(private readonly action: OriginalToolbarActionApi) {}

  async apply(presentation: OriginalToolbarActionPresentation): Promise<void> {
    const target = presentation.tabId === undefined ? {} : { tabId: presentation.tabId };
    await this.applyIcon(presentation, target);

    await Promise.all([
      Promise.resolve(this.action.setTitle({ ...target, title: presentation.title })),
      Promise.resolve(
        this.action.setBadgeBackgroundColor({
          ...target,
          color: presentation.badgeBackgroundColor,
        }),
      ),
      Promise.resolve(
        this.action.setBadgeText({
          ...target,
          text: presentation.badgeText ?? '',
        }),
      ),
      Promise.resolve(this.action.setPopup({ ...target, popup: presentation.popup })),
    ]);
  }

  private async applyIcon(
    presentation: OriginalToolbarActionPresentation,
    target: Readonly<{ tabId?: number }>,
  ): Promise<void> {
    if (presentation.imageData === undefined) return;

    try {
      await Promise.resolve(
        this.action.setIcon({
          ...target,
          imageData: presentation.imageData,
        }),
      );
    } catch {
      const legacyImageData: OriginalToolbarActionImageDataSet = {
        ...(presentation.imageData[19] === undefined
          ? {}
          : { 19: presentation.imageData[19] }),
        ...(presentation.imageData[38] === undefined
          ? {}
          : { 38: presentation.imageData[38] }),
      };
      await Promise.resolve(
        this.action.setIcon({
          ...target,
          imageData: legacyImageData,
        }),
      );
    }
  }
}
