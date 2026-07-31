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
  readonly tabId: number;
  readonly imageData?: OriginalToolbarActionImageDataSet;
  readonly path?: OriginalToolbarActionIconPaths;
}

export interface OriginalToolbarActionApi {
  setIcon(details: OriginalToolbarActionIconDetails): Promise<void> | void;
  setTitle(details: { readonly tabId: number; readonly title: string }): Promise<void> | void;
  setBadgeText(details: { readonly tabId: number; readonly text: string }): Promise<void> | void;
  setBadgeBackgroundColor(details: {
    readonly tabId: number;
    readonly color: string;
  }): Promise<void> | void;
  setPopup(details: { readonly tabId: number; readonly popup: string }): Promise<void> | void;
}

export interface OriginalToolbarActionPresentation {
  readonly tabId: number;
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
 * adapter. The adapter always writes every tab-visible field so stale title,
 * Badge or Popup state cannot leak from a previous result or Inspect state.
 */
export class OriginalToolbarActionAdapter {
  constructor(private readonly action: OriginalToolbarActionApi) {}

  async apply(presentation: OriginalToolbarActionPresentation): Promise<void> {
    await this.applyIcon(presentation);

    await Promise.all([
      Promise.resolve(
        this.action.setTitle({ tabId: presentation.tabId, title: presentation.title }),
      ),
      Promise.resolve(
        this.action.setBadgeBackgroundColor({
          tabId: presentation.tabId,
          color: presentation.badgeBackgroundColor,
        }),
      ),
      Promise.resolve(
        this.action.setBadgeText({
          tabId: presentation.tabId,
          text: presentation.badgeText ?? '',
        }),
      ),
      Promise.resolve(
        this.action.setPopup({ tabId: presentation.tabId, popup: presentation.popup }),
      ),
    ]);
  }

  private async applyIcon(presentation: OriginalToolbarActionPresentation): Promise<void> {
    if (presentation.imageData === undefined) {
      await Promise.resolve(
        this.action.setIcon({
          tabId: presentation.tabId,
          path: presentation.fallbackIconPaths,
        }),
      );
      return;
    }

    try {
      await Promise.resolve(
        this.action.setIcon({
          tabId: presentation.tabId,
          imageData: presentation.imageData,
        }),
      );
    } catch {
      await Promise.resolve(
        this.action.setIcon({
          tabId: presentation.tabId,
          path: presentation.fallbackIconPaths,
        }),
      );
    }
  }
}
