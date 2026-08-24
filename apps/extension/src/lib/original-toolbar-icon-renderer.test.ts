import { describe, expect, it, vi } from 'vitest';

import type { OriginalToolbarActionImageData } from './original-toolbar-action-adapter';
import {
  OriginalToolbarIconRenderer,
  type OriginalToolbarCanvas,
  type OriginalToolbarCanvasContext,
  type OriginalToolbarCanvasFactory,
} from './original-toolbar-icon-renderer';

class RecordingCanvasContext implements OriginalToolbarCanvasContext {
  globalCompositeOperation = '';
  strokeStyle = '';
  fillStyle = '';
  lineWidth = 0;
  readonly scales: Array<readonly [number, number]> = [];
  readonly clearRects: Array<readonly [number, number, number, number]> = [];
  readonly transforms: Array<readonly [number, number, number, number, number, number]> = [];
  readonly imageReads: Array<readonly [number, number, number, number]> = [];
  opaqueFirstPixel = false;

  beginPath(): void {}

  arc(): void {}

  closePath(): void {}

  stroke(): void {}

  fill(): void {}

  scale(x: number, y: number): void {
    this.scales.push([x, y]);
  }

  clearRect(x: number, y: number, width: number, height: number): void {
    this.clearRects.push([x, y, width, height]);
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.transforms.push([a, b, c, d, e, f]);
  }

  getImageData(
    x: number,
    y: number,
    width: number,
    height: number,
  ): OriginalToolbarActionImageData {
    this.imageReads.push([x, y, width, height]);
    return {
      width,
      height,
      data: new Uint8ClampedArray([0, 0, 0, this.opaqueFirstPixel ? 255 : 0]),
    };
  }
}

class RecordingCanvas implements OriginalToolbarCanvas {
  constructor(readonly context: RecordingCanvasContext) {}

  getContext(
    contextId: '2d',
    options: { readonly willReadFrequently: true },
  ): OriginalToolbarCanvasContext | null {
    expect(contextId).toBe('2d');
    expect(options).toEqual({ willReadFrequently: true });
    return this.context;
  }
}

function recordingFactory(context: RecordingCanvasContext): {
  readonly factory: OriginalToolbarCanvasFactory;
  readonly calls: Array<readonly [number, number]>;
} {
  const calls: Array<readonly [number, number]> = [];
  return {
    calls,
    factory: (width, height) => {
      calls.push([width, height]);
      return new RecordingCanvas(context);
    },
  };
}

describe('original toolbar icon renderer', () => {
  it('reproduces the original single-canvas five-size pipeline', () => {
    const context = new RecordingCanvasContext();
    const { factory, calls } = recordingFactory(context);
    const renderer = new OriginalToolbarIconRenderer(factory);

    const icon = renderer.render('#32a8e6', '#f15b40');

    expect(calls).toEqual([[300, 300]]);
    expect(context.scales).toEqual([
      [16, 16],
      [19, 19],
      [24, 24],
      [32, 32],
      [38, 38],
    ]);
    expect(context.clearRects).toEqual(Array.from({ length: 5 }, () => [0, 0, 1, 1]));
    expect(context.transforms).toEqual(Array.from({ length: 5 }, () => [1, 0, 0, 1, 0, 0]));
    expect(context.imageReads).toEqual([
      [0, 0, 16, 16],
      [0, 0, 19, 19],
      [0, 0, 24, 24],
      [0, 0, 32, 32],
      [0, 0, 38, 38],
    ]);
    expect(Object.keys(icon ?? {})).toEqual(['16', '19', '24', '32', '38']);
    expect(context.strokeStyle).toBe('#32a8e6');
    expect(context.fillStyle).toBe('#f15b40');
    expect(context.globalCompositeOperation).toBe('source-over');
  });

  it('caches each one-color or two-color result and reuses one canvas context', () => {
    const context = new RecordingCanvasContext();
    const { factory, calls } = recordingFactory(context);
    const renderer = new OriginalToolbarIconRenderer(factory);

    const first = renderer.render('#32a8e6');
    const cached = renderer.render('#32a8e6');
    const secondColorPair = renderer.render('#32a8e6', '#f15b40');

    expect(cached).toBe(first);
    expect(secondColorPair).not.toBe(first);
    expect(calls).toEqual([[300, 300]]);
    expect(context.imageReads).toHaveLength(10);
  });

  it('reports the first anti-fingerprinting error once and retries failed colors', () => {
    const context = new RecordingCanvasContext();
    context.opaqueFirstPixel = true;
    const { factory } = recordingFactory(context);
    const onFirstError = vi.fn();
    const renderer = new OriginalToolbarIconRenderer(factory, { onFirstError });

    expect(renderer.render('#32a8e6')).toBeUndefined();
    expect(renderer.render('#32a8e6')).toBeUndefined();
    expect(renderer.render('#f15b40')).toBeUndefined();
    expect(context.imageReads).toHaveLength(3);
    expect(onFirstError).toHaveBeenCalledTimes(1);
    expect(onFirstError.mock.calls[0]?.[0]).toEqual(
      new Error('Icon drawing blocked by privacy.resistFingerprinting.'),
    );

    context.opaqueFirstPixel = false;
    const recovered = renderer.render('#32a8e6');
    const cached = renderer.render('#32a8e6');

    expect(Object.keys(recovered ?? {})).toEqual(['16', '19', '24', '32', '38']);
    expect(cached).toBe(recovered);
    expect(context.imageReads).toHaveLength(8);
    expect(onFirstError).toHaveBeenCalledTimes(1);
  });

  it('clears the color cache without replacing the original shared canvas', () => {
    const context = new RecordingCanvasContext();
    const { factory, calls } = recordingFactory(context);
    const renderer = new OriginalToolbarIconRenderer(factory);

    const first = renderer.render('#32a8e6');
    renderer.clearCache();
    const rerendered = renderer.render('#32a8e6');

    expect(rerendered).not.toBe(first);
    expect(calls).toEqual([[300, 300]]);
    expect(context.imageReads).toHaveLength(10);
  });
});
