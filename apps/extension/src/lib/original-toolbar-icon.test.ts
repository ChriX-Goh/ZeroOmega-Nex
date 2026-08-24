import { describe, expect, it } from 'vitest';

import {
  drawOriginalToolbarOmega,
  ORIGINAL_TOOLBAR_ICON_SIZES,
  type OriginalOmegaDrawingContext,
} from './original-toolbar-icon';

interface ArcCall {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly startAngle: number;
  readonly endAngle: number;
  readonly counterclockwise?: boolean;
}

class RecordingContext implements OriginalOmegaDrawingContext {
  globalCompositeOperation = '';
  strokeStyle = '';
  fillStyle = '';
  lineWidth = 0;
  readonly arcs: ArcCall[] = [];
  beginPathCalls = 0;
  closePathCalls = 0;
  strokeCalls = 0;
  fillCalls = 0;

  beginPath(): void {
    this.beginPathCalls += 1;
  }

  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean,
  ): void {
    this.arcs.push({
      x,
      y,
      radius,
      startAngle,
      endAngle,
      ...(counterclockwise === undefined ? {} : { counterclockwise }),
    });
  }

  closePath(): void {
    this.closePathCalls += 1;
  }

  stroke(): void {
    this.strokeCalls += 1;
  }

  fill(): void {
    this.fillCalls += 1;
  }
}

describe('original ZeroOmega toolbar icon geometry', () => {
  it('preserves the exact dynamic icon size set from v3.5.0', () => {
    expect(ORIGINAL_TOOLBAR_ICON_SIZES).toEqual([16, 19, 24, 32, 38]);
  });

  it('draws the exact outer and inner normalized circles', () => {
    const context = new RecordingContext();

    drawOriginalToolbarOmega(context, '#32a8e6', '#f15b40');

    expect(context.strokeStyle).toBe('#32a8e6');
    expect(context.fillStyle).toBe('#f15b40');
    expect(context.lineWidth).toBe(0.25);
    expect(context.arcs).toEqual([
      {
        x: 0.5,
        y: 0.5,
        radius: 0.375,
        startAngle: 0,
        endAngle: Math.PI * 2,
        counterclockwise: true,
      },
      {
        x: 0.5,
        y: 0.5,
        radius: 0.25,
        startAngle: 0,
        endAngle: Math.PI * 2,
        counterclockwise: true,
      },
    ]);
    expect(context.beginPathCalls).toBe(2);
    expect(context.closePathCalls).toBe(2);
    expect(context.strokeCalls).toBe(1);
    expect(context.fillCalls).toBe(1);
    expect(context.globalCompositeOperation).toBe('source-over');
  });

  it('cuts the inner circle to transparency for the original one-color state', () => {
    const context = new RecordingContext();

    drawOriginalToolbarOmega(context, '#32a8e6');

    expect(context.strokeStyle).toBe('#32a8e6');
    expect(context.fillStyle).toBe('');
    expect(context.globalCompositeOperation).toBe('destination-out');
    expect(context.fillCalls).toBe(1);
  });
});
