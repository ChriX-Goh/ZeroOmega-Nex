import type {
  OriginalToolbarActionImageData,
  OriginalToolbarActionImageDataSet,
} from './original-toolbar-action-adapter';
import {
  drawOriginalToolbarOmega,
  ORIGINAL_TOOLBAR_ICON_SIZES,
  type OriginalOmegaDrawingContext,
  type OriginalToolbarIconSize,
} from './original-toolbar-icon';

export interface OriginalToolbarCanvasContext extends OriginalOmegaDrawingContext {
  scale(x: number, y: number): void;
  clearRect(x: number, y: number, width: number, height: number): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  getImageData(x: number, y: number, width: number, height: number): OriginalToolbarActionImageData;
}

export interface OriginalToolbarCanvas {
  getContext(
    contextId: '2d',
    options: { readonly willReadFrequently: true },
  ): OriginalToolbarCanvasContext | null;
}

export type OriginalToolbarCanvasFactory = (width: number, height: number) => OriginalToolbarCanvas;

export interface OriginalToolbarIconRendererOptions {
  readonly onFirstError?: (error: unknown) => void;
}

/**
 * Reproduce the exact ZeroOmega v3.5.0 dynamic toolbar icon pipeline.
 *
 * The original reuses one 300×300 OffscreenCanvas, scales the normalized Ω
 * drawing for 16/19/24/32/38 output sizes, resets the transform before reading
 * pixels, caches by the two profile colors and permanently falls back for a
 * color pair when privacy anti-fingerprinting replaces the image with opaque
 * white data.
 */
export class OriginalToolbarIconRenderer {
  readonly #cache = new Map<string, OriginalToolbarActionImageDataSet | undefined>();
  readonly #factory: OriginalToolbarCanvasFactory;
  readonly #onFirstError: (error: unknown) => void;
  #context: OriginalToolbarCanvasContext | undefined;
  #reportedError = false;

  constructor(
    factory: OriginalToolbarCanvasFactory,
    options: OriginalToolbarIconRendererOptions = {},
  ) {
    this.#factory = factory;
    this.#onFirstError = options.onFirstError ?? (() => undefined);
  }

  render(
    outerCircleColor: string,
    innerCircleColor?: string,
  ): OriginalToolbarActionImageDataSet | undefined {
    const cacheKey = `omega+${outerCircleColor}+${innerCircleColor ?? ''}`;
    if (this.#cache.has(cacheKey)) return this.#cache.get(cacheKey);

    try {
      const context = this.context();
      const icon: Partial<Record<OriginalToolbarIconSize, OriginalToolbarActionImageData>> = {};

      for (const size of ORIGINAL_TOOLBAR_ICON_SIZES) {
        context.scale(size, size);
        context.clearRect(0, 0, 1, 1);
        drawOriginalToolbarOmega(context, outerCircleColor, innerCircleColor);
        context.setTransform(1, 0, 0, 1, 0, 0);

        const imageData = context.getImageData(0, 0, size, size);
        if (imageData.data[3] === 255) {
          throw new Error('Icon drawing blocked by privacy.resistFingerprinting.');
        }
        icon[size] = imageData;
      }

      this.#cache.set(cacheKey, icon);
      return icon;
    } catch (error) {
      if (!this.#reportedError) {
        this.#reportedError = true;
        this.#onFirstError(error);
      }
      this.#cache.set(cacheKey, undefined);
      return undefined;
    }
  }

  clearCache(): void {
    this.#cache.clear();
  }

  private context(): OriginalToolbarCanvasContext {
    if (this.#context !== undefined) return this.#context;
    const context = this.#factory(300, 300).getContext('2d', { willReadFrequently: true });
    if (context === null) throw new Error('Unable to create the original toolbar 2D context.');
    this.#context = context;
    return context;
  }
}

export function currentOriginalToolbarCanvasFactory(): OriginalToolbarCanvasFactory {
  return (width, height) => new OffscreenCanvas(width, height) as unknown as OriginalToolbarCanvas;
}
