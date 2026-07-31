import type {
  OriginalToolbarActionIconPaths,
  OriginalToolbarActionImageDataSet,
  OriginalToolbarActionPresentation,
} from './original-toolbar-action-adapter';
import {
  localizeOriginalToolbarDefaultTitle,
  localizeOriginalToolbarResultTitle,
  type OriginalToolbarI18nApi,
} from './original-toolbar-i18n';
import type { OriginalToolbarTabState } from './original-toolbar-tab-state';

export interface OriginalToolbarActionWriter {
  apply(presentation: OriginalToolbarActionPresentation): Promise<void>;
}

export interface OriginalToolbarIconRendererApi {
  render(
    outerCircleColor: string,
    innerCircleColor?: string,
  ): OriginalToolbarActionImageDataSet | undefined;
}

export interface OriginalToolbarActionExecutorOptions {
  readonly action: OriginalToolbarActionWriter;
  readonly renderer: OriginalToolbarIconRendererApi;
  readonly i18n: OriginalToolbarI18nApi;
  readonly badgeBackgroundColor: string;
  readonly popup: string;
  readonly fallbackIconPaths: OriginalToolbarActionIconPaths;
}

/**
 * Compose one already-derived original toolbar state into browser Action writes.
 *
 * This executor deliberately knows nothing about profiles, matching, tabs or
 * browser events. The future coordinator owns those inputs. Keeping this layer
 * narrow prevents target-specific Popup/assets and browser APIs from leaking
 * into the pure original state model.
 */
export class OriginalToolbarActionExecutor {
  readonly #action: OriginalToolbarActionWriter;
  readonly #renderer: OriginalToolbarIconRendererApi;
  readonly #i18n: OriginalToolbarI18nApi;
  readonly #badgeBackgroundColor: string;
  readonly #popup: string;
  readonly #fallbackIconPaths: OriginalToolbarActionIconPaths;

  constructor(options: OriginalToolbarActionExecutorOptions) {
    this.#action = options.action;
    this.#renderer = options.renderer;
    this.#i18n = options.i18n;
    this.#badgeBackgroundColor = options.badgeBackgroundColor;
    this.#popup = options.popup;
    this.#fallbackIconPaths = options.fallbackIconPaths;
  }

  async apply(tabId: number, state: OriginalToolbarTabState): Promise<void> {
    const imageData = this.#renderer.render(
      state.icon.outerCircleColor,
      state.icon.innerCircleColor,
    );
    const presentation = this.presentation({
      tabId,
      title: localizeOriginalToolbarResultTitle(this.#i18n, state.titleArguments),
      badgeText: state.badgeText,
      imageData,
    });
    await this.#action.apply(presentation);
  }

  async applyDefault(tabId: number): Promise<void> {
    await this.#action.apply(
      this.presentation({
        tabId,
        title: localizeOriginalToolbarDefaultTitle(this.#i18n),
      }),
    );
  }

  private presentation(input: {
    readonly tabId: number;
    readonly title: string;
    readonly badgeText?: string;
    readonly imageData?: OriginalToolbarActionImageDataSet;
  }): OriginalToolbarActionPresentation {
    return {
      tabId: input.tabId,
      title: input.title,
      badgeBackgroundColor: this.#badgeBackgroundColor,
      popup: this.#popup,
      fallbackIconPaths: this.#fallbackIconPaths,
      ...(input.badgeText === undefined ? {} : { badgeText: input.badgeText }),
      ...(input.imageData === undefined ? {} : { imageData: input.imageData }),
    };
  }
}
