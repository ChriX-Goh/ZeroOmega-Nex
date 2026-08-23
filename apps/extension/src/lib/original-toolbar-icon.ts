export const ORIGINAL_TOOLBAR_ICON_SIZES = [16, 19, 24, 32, 38] as const;

export type OriginalToolbarIconSize = (typeof ORIGINAL_TOOLBAR_ICON_SIZES)[number];

/**
 * Minimal drawing surface required by the exact ZeroOmega v3.5.0 Ω renderer.
 *
 * Keeping this contract independent from CanvasRenderingContext2D allows the
 * original geometry to be tested without a browser canvas implementation.
 */
export interface OriginalOmegaDrawingContext {
  globalCompositeOperation: string;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  beginPath(): void;
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean,
  ): void;
  closePath(): void;
  stroke(): void;
  fill(): void;
}

/**
 * Draw the exact normalized toolbar Ω used by ZeroOmega v3.5.0.
 *
 * Source authority:
 * zero-peak/ZeroOmega@v3.5.0
 * omega-web/img/icons/draw_omega.js
 * blob aa5ef9cfac1ef7b46dbe0df03b1adc3d5a2faf43
 *
 * With one color, the inner circle is removed to transparency. With two
 * colors, the inner circle is filled with the second color. Do not replace
 * this geometry with a redesigned logo.
 */
export function drawOriginalToolbarOmega(
  context: OriginalOmegaDrawingContext,
  outerCircleColor: string,
  innerCircleColor?: string,
): void {
  context.globalCompositeOperation = 'source-over';
  context.strokeStyle = outerCircleColor;

  context.beginPath();
  context.lineWidth = 0.25;
  context.arc(0.5, 0.5, 0.375, 0, Math.PI * 2, true);
  context.closePath();
  context.stroke();

  if (innerCircleColor !== undefined) {
    context.fillStyle = innerCircleColor;
  } else {
    context.globalCompositeOperation = 'destination-out';
  }

  context.beginPath();
  context.arc(0.5, 0.5, 0.25, 0, Math.PI * 2, true);
  context.closePath();
  context.fill();
}
